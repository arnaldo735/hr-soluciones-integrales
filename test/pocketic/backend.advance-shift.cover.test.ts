import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend cover for the accepted change that lets an order advance be
 * registered when no shift is open in Caja/Bancos.
 *
 * Before the change, `applyAdvanceMovement` trapped with
 * `No hay un turno abierto para esta caja o banco` whenever the user tried to
 * register an advance without first opening a shift. The accepted behavior is
 * that registering an advance on an editable, non-invoiced order now succeeds
 * and produces a movement attributed to a valid shift: the backend resolves the
 * open shift for the account, or auto-opens one on the first active register of
 * that type.
 *
 * This file deliberately starts from a canister with NO open shift, which is the
 * exact state the previous behavior rejected. The sibling
 * `backend.advance-movement.characterize.test.ts` opens both shifts up front and
 * therefore never exercises this branch.
 *
 * The lane speaks the declarations' Candid shapes: the session token is
 * `[] | [string]` (so `[]`, never `null`), `?T` is `[] | [T]`, and a variant is
 * `{ variantName: null }`.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

// Identities come from `@dfinity/pic` itself: `createIdentity(seed)` is
// deterministic, and a `Principal` is never constructed by hand because the
// package that exports that class is not importable from the lane directory.
const OWNER = createIdentity("advance-shift-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;
let bancoId: bigint;

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
    sku: "REP-ANTICIPO-SHIFT-1",
    barcode: "7501234567892",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  partId = part.id;

  // Active registers exist, but NO shift is opened: this is the state the
  // previous behavior rejected with `No hay un turno abierto...`.
  await actor.createCashRegister([], {
    name: "Caja mostrador",
    kind: { cash: null },
    openingBalance: 0n,
  });
  const banco = await actor.createCashRegister([], {
    name: "Banco Bogotá",
    kind: { bank: null },
    openingBalance: 0n,
  });
  bancoId = banco.id;
});

afterAll(async () => {
  await pic?.tearDown();
});

it("starts with no open shift in Caja or Bancos", async () => {
  // Guards the premise of every test below: if a shift were already open, the
  // auto-open branch would never run and this file would prove nothing.
  await expect(actor.listOpenShifts([])).resolves.toHaveLength(0);
});

it("registers a cash advance with no open shift and attributes it to a valid shift", async () => {
  const { orderId, orderNumber, total } = await seedOrder("Anticipo sin turno");

  // No shift is open; the accepted behavior is that this still succeeds.
  const view = await actor.setOrderAdvance([], orderId, {
    amount: [30000n],
    method: [{ cash: null }],
  });
  expect(view.order.advance).toHaveLength(1);
  expect(view.order.advance[0]).toMatchObject({
    amount: 30000n,
    method: { cash: null },
  });
  expect(total).toBe(80000n);

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

  // The movement is attributed to a real, open shift on an active cash
  // register. The backend auto-opens on the lowest-id active cash register,
  // which is the migration-created "Caja principal" (id 0), not necessarily the
  // register this test created.
  const shift = await actor.getShift([], movement?.shiftId as bigint);
  expect(shift).toHaveLength(1);
  expect(shift[0]).toMatchObject({
    id: movement?.shiftId,
    status: { open: null },
  });
  const register = await actor.getCashRegister([], shift[0].registerId);
  expect(register).toHaveLength(1);
  expect(register[0]).toMatchObject({ kind: { cash: null }, active: true });

  // The auto-opened shift is the one the account resolves to.
  const open = await actor.listOpenShifts([]);
  expect(open.map((entry) => entry.id)).toContain(movement?.shiftId);
});

it("registers a transfer advance with no open shift and attributes it to a bank shift", async () => {
  const { orderId, orderNumber } = await seedOrder("Anticipo transferencia sin turno");

  const view = await actor.setOrderAdvance([], orderId, {
    amount: [25000n],
    method: [{ transfer: null }],
  });
  expect(view.order.advance).toHaveLength(1);

  const movement = await advanceMovement(orderNumber);
  expect(movement).toBeDefined();
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { advance: null },
    paymentMethod: { transfer: null },
    account: { bank: null },
    amount: 25000n,
  });

  const shift = await actor.getShift([], movement?.shiftId as bigint);
  expect(shift).toHaveLength(1);
  expect(shift[0]).toMatchObject({
    id: movement?.shiftId,
    registerId: bancoId,
    status: { open: null },
  });
});

it("reuses the auto-opened shift for a later advance instead of opening a second one", async () => {
  const { orderId, orderNumber } = await seedOrder("Anticipo reutiliza turno");

  await actor.setOrderAdvance([], orderId, {
    amount: [20000n],
    method: [{ cash: null }],
  });
  const first = await advanceMovement(orderNumber);
  expect(first).toBeDefined();

  // A second order's cash advance must land on the same already-open shift.
  const second = await seedOrder("Anticipo reutiliza turno 2");
  await actor.setOrderAdvance([], second.orderId, {
    amount: [15000n],
    method: [{ cash: null }],
  });
  const secondMovement = await advanceMovement(second.orderNumber);
  expect(secondMovement).toBeDefined();
  expect(secondMovement?.shiftId).toBe(first?.shiftId);

  // Only one cash shift was auto-opened, and both advances share it.
  const firstShift = await actor.getShift([], first?.shiftId as bigint);
  expect(firstShift).toHaveLength(1);
  const open = await actor.listOpenShifts([]);
  const cashShifts = open.filter(
    (entry) => entry.registerId === firstShift[0].registerId,
  );
  expect(cashShifts).toHaveLength(1);
});
