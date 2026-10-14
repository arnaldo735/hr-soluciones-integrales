import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend characterization for the Caja/Bancos movement that an order advance
 * produces, ahead of the accepted "register an advance from the order detail"
 * change.
 *
 * The accepted change touches how an advance is registered. These tests
 * deliberately do NOT assert the current open-shift requirement (the
 * `No hay un turno abierto...` trap), because that is exactly the behavior the
 * change may alter. They protect the surrounding movement contract that must
 * keep working once an advance is accepted:
 *
 * - registering an advance creates a single income movement with
 *   `source = #advance`, `reference = <orderNumber>`, description
 *   `Anticipo OT <orderNumber>`, and the account derived from the method
 *   (efectivo -> Caja, transferencia -> Bancos);
 * - updating the advance amount adjusts that same movement in place (same id,
 *   no duplicate);
 * - clearing the advance removes the movement.
 *
 * Every test opens the shift it needs first, so none of them depends on the
 * open-shift trap. The lane speaks the declarations' Candid shapes: the session
 * token is `[] | [string]` (so `[]`, never `null`), `?T` is `[] | [T]`, and a
 * variant is `{ variantName: null }`.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

// Identities come from `@dfinity/pic` itself: `createIdentity(seed)` is
// deterministic, and a `Principal` is never constructed by hand because the
// package that exports that class is not importable from the lane directory.
const OWNER = createIdentity("advance-movement-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;

/** Creates a customer + motorcycle + order with a known subtotal. */
async function seedOrder(problem: string): Promise<{
  orderId: bigint;
  orderNumber: string;
  total: bigint;
}> {
  const customer = await actor.createCustomer([], {
    name: `Cliente ${problem}`,
    phone: "+57 300 000 0000",
    email: [],
    document: ["LOAA1815"],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle([], {
    customerId: customer.id,
    plate: "ABC-123",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 15000n,
  });
  const order = await actor.createOrder([], {
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 15000n,
    previousMileage: [],
    oilChangeInterval: [],
    problem,
    technicianIds: [],
    advance: [],
  });
  // 2 × 25000 parts + 30000 labor = 80000 subtotal; the zero-rate profile makes
  // the total exactly 80000.
  await actor.addOrderPart([], order.order.id, {
    partId,
    lotId: [],
    quantity: 2n,
  });
  const view = await actor.addLabor([], order.order.id, {
    description: "Ajuste de frenos",
    price: 30000n,
    technicianId: [],
    serviceId: [],
  });
  return {
    orderId: order.order.id,
    orderNumber: order.order.orderNumber,
    total: view.totals.total,
  };
}

/** Finds the advance movement for an order by its reference. */
async function advanceMovement(orderNumber: string) {
  const movements = await actor.listCashMovements(
    [],
    {
      shiftId: [],
      registerId: [],
      kind: [],
      account: [],
      paymentMethod: [],
      from: [],
      to: [],
    },
    0n,
    200n,
  );
  return movements.items.find(
    (entry) =>
      entry.source.advance !== undefined &&
      entry.reference[0] === orderNumber,
  );
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
  } else {
    const installed = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BASELINE_WASM,
    });
    await pic.upgradeCanister({
      canisterId: installed.canisterId,
      wasm: BACKEND_WASM,
      arg: new Uint8Array(),
    });
    actor = installed.actor;
  }

  actor.setIdentity(OWNER);
  await actor._initialize_access_control();
  await actor.saveCallerUserProfile("Dueño");

  // A zero-rate, non-responsable company so the order total is the plain
  // subtotal and the arithmetic is exact.
  await actor.updateCompanyProfile([], {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "noResponsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: [],
    taxRate: 0n,
  });

  const part = await actor.createPart([], {
    sku: "REP-ANTICIPO-1",
    barcode: "7501234567891",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  partId = part.id;

  // Both registers are opened so a cash or transfer advance always has a shift
  // to bind to, regardless of the method under test.
  const caja = await actor.createCashRegister([], {
    name: "Caja mostrador",
    kind: { cash: null },
    openingBalance: 0n,
  });
  await actor.openShift([], {
    registerId: caja.id,
    responsibleName: "Ana Torres",
    responsibleUserId: [],
    openingCash: 0n,
    openingBank: 0n,
    notes: [],
  });
  const banco = await actor.createCashRegister([], {
    name: "Banco Bogotá",
    kind: { bank: null },
    openingBalance: 0n,
  });
  await actor.openShift([], {
    registerId: banco.id,
    responsibleName: "Carlos Pérez",
    responsibleUserId: [],
    openingCash: 0n,
    openingBank: 0n,
    notes: [],
  });
});

afterAll(async () => {
  await pic?.tearDown();
});

it("records a cash advance as an income movement in Caja", async () => {
  const { orderId, orderNumber } = await seedOrder("Anticipo efectivo");

  await actor.setOrderAdvance([], orderId, {
    amount: [30000n],
    method: [{ cash: null }],
  });

  const movement = await advanceMovement(orderNumber);
  expect(movement).toBeDefined();
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { advance: null },
    paymentMethod: { cash: null },
    account: { cash: null },
    amount: 30000n,
    description: `Anticipo OT ${orderNumber}`,
  });
  expect(movement?.reference).toEqual([orderNumber]);
});

it("records a transfer advance as an income movement in Bancos", async () => {
  const { orderId, orderNumber } = await seedOrder("Anticipo transferencia");

  await actor.setOrderAdvance([], orderId, {
    amount: [25000n],
    method: [{ transfer: null }],
  });

  const movement = await advanceMovement(orderNumber);
  expect(movement).toBeDefined();
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { advance: null },
    paymentMethod: { transfer: null },
    account: { bank: null },
    amount: 25000n,
  });
});

it("adjusts the same movement in place when the advance amount changes", async () => {
  const { orderId, orderNumber } = await seedOrder("Anticipo ajustado");

  await actor.setOrderAdvance([], orderId, {
    amount: [30000n],
    method: [{ cash: null }],
  });
  const first = await advanceMovement(orderNumber);
  expect(first).toBeDefined();

  await actor.setOrderAdvance([], orderId, {
    amount: [45000n],
    method: [{ cash: null }],
  });
  const second = await advanceMovement(orderNumber);
  expect(second).toBeDefined();

  // Same movement, updated amount — not a duplicate.
  expect(second?.id).toBe(first?.id);
  expect(second?.amount).toBe(45000n);

  const movements = await actor.listCashMovements(
    [],
    {
      shiftId: [],
      registerId: [],
      kind: [],
      account: [],
      paymentMethod: [],
      from: [],
      to: [],
    },
    0n,
    200n,
  );
  const forOrder = movements.items.filter(
    (entry) =>
      entry.source.advance !== undefined &&
      entry.reference[0] === orderNumber,
  );
  expect(forOrder).toHaveLength(1);
});

it("removes the movement when the advance is cleared", async () => {
  const { orderId, orderNumber } = await seedOrder("Anticipo borrado");

  await actor.setOrderAdvance([], orderId, {
    amount: [30000n],
    method: [{ cash: null }],
  });
  expect(await advanceMovement(orderNumber)).toBeDefined();

  await actor.setOrderAdvance([], orderId, {
    amount: [],
    method: [],
  });
  expect(await advanceMovement(orderNumber)).toBeUndefined();
});
