import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend cover for the accepted change that lets a positive abono be
 * registered on a workshop order whose total is 0 (no parts and no labor).
 *
 * Before the change, `addOrderPayment` rejected any abono above the pending
 * balance, and a zero-total order's pending balance is 0, so no positive abono
 * could be registered. The accepted behavior is that a positive abono is
 * accepted when the total is 0, persisted, and reported back through
 * `getOrder`/`listOrderPayments`; the upper bound is still enforced when the
 * total is greater than 0, and the pending balance is still
 * `total − anticipo − abonos`, clamped to 0.
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
const OWNER = createIdentity("abono-zero-total-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;

/** Creates a customer + motorcycle + order with no parts and no labor. */
async function seedZeroTotalOrder(problem: string): Promise<{
  orderId: bigint;
  orderNumber: string;
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
  return { orderId: order.order.id, orderNumber: order.order.orderNumber };
}

/** Creates a customer + motorcycle + order with one part and one labor line. */
async function seedPositiveTotalOrder(problem: string): Promise<{
  orderId: bigint;
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
  return { orderId: order.order.id, total: view.totals.total };
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
    sku: "REP-ABONO-CERO-1",
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

  // An open shift is required for the abono's Caja/Bancos movement.
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
});

afterAll(async () => {
  await pic?.tearDown();
});

it("accepts a positive abono on a zero-total order and persists it", async () => {
  const { orderId } = await seedZeroTotalOrder("Abono total cero");

  const view = await actor.addOrderPayment([], orderId, {
    amount: 50000n,
    method: { cash: null },
    note: ["Abono sin conceptos"],
  });

  expect(view.totals.total).toBe(0n);
  expect(view.order.payments).toHaveLength(1);
  expect(view.order.payments[0]).toMatchObject({
    amount: 50000n,
    method: { cash: null },
    note: ["Abono sin conceptos"],
  });

  // The abono survives a fresh read of the order and is listed back.
  const reread = await actor.getOrder([], orderId);
  expect(reread).toHaveLength(1);
  expect(reread[0].order.payments).toHaveLength(1);
  expect(reread[0].order.payments[0]).toMatchObject({ amount: 50000n });

  const payments = await actor.listOrderPayments([], orderId);
  expect(payments).toHaveLength(1);
  expect(payments[0]).toMatchObject({ amount: 50000n, method: { cash: null } });
});

it("recalculates the pending balance after a zero-total abono", async () => {
  const { orderId } = await seedZeroTotalOrder("Abono saldo cero");

  const view = await actor.addOrderPayment([], orderId, {
    amount: 50000n,
    method: { cash: null },
    note: [],
  });

  // total 0, abono 50000: the charged amount covers the total, so the pending
  // balance is clamped to 0 rather than going negative.
  expect(view.totals.paidAmount).toBe(50000n);
  expect(view.totals.balance).toBe(0n);
});

it("still rejects an abono above a positive order pending balance", async () => {
  const { orderId, total } = await seedPositiveTotalOrder("Abono excede");
  expect(total).toBe(80000n);

  // No advance: the pending balance is the full total (80000).
  await expect(
    actor.addOrderPayment([], orderId, {
      amount: total + 1n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/supera el saldo pendiente/);
});

it("still rejects a zero abono on a zero-total order", async () => {
  const { orderId } = await seedZeroTotalOrder("Abono cero total cero");

  await expect(
    actor.addOrderPayment([], orderId, {
      amount: 0n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/mayor que cero/);
});
