import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend lane coverage for the accepted "abonos + recibo de anticipo" change on
 * a workshop order.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose payment methods are unimplemented stubs that trap. This lane installs
 * the app's own compiled wasm into the platform's PocketIC replica and calls the
 * real public API, so it proves the accepted rules are implemented:
 *
 * - `addOrderPayment` records an abono and recalculates the pending balance as
 *   `total − anticipo − abonos`;
 * - `listOrderPayments` returns the registered abonos ordered by id;
 * - each abono creates an income movement in Caja/Bancos tied to the order,
 *   identified by `source = #advance` and reference `<OT>-ABONO-<id>`;
 * - an abono of zero or one above the pending balance is rejected;
 * - an order that is cancelled, delivered or already invoiced rejects abonos;
 * - `getOrderAdvanceReceipt` returns the customer/motorcycle identification, the
 *   advance, the order total, the total paid and the updated pending balance.
 *
 * The company profile is set to `noResponsableIva` with a zero rate so the order
 * totals are the plain subtotal and the arithmetic is exact.
 *
 * The lane speaks the declarations' Candid shapes, not the app wrapper's: the
 * session token is `[] | [string]` (so `[]`, never `null`), `?T` is `[] | [T]`,
 * and a variant is `{ variantName: null }`.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

// Identities come from `@dfinity/pic` itself: `createIdentity(seed)` is
// deterministic, and a `Principal` is never constructed by hand because the
// package that exports that class is not importable from the lane directory.
const OWNER = createIdentity("order-payments-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;

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
    partId: partId,
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

let partId: bigint;

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
  // subtotal and the balance arithmetic is exact.
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
    sku: "REP-ABONO-1",
    barcode: "7501234567890",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  partId = part.id;

  // An open shift is required for the abono's Caja/Bancos movement: cash abonos
  // land in Caja and transfer/card abonos land in Bancos, so both are opened.
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

it("registers an abono and recalculates the pending balance", async () => {
  const { orderId, total } = await seedOrder("Abono válido");
  expect(total).toBe(80000n);

  // An advance of 30000 leaves a pending balance of 50000.
  await actor.setOrderAdvance([], orderId, {
    amount: [30000n],
    method: [{ cash: null }],
  });

  const view = await actor.addOrderPayment([], orderId, {
    amount: 20000n,
    method: { transfer: null },
    note: ["Abono parcial"],
  });

  // total 80000 − anticipo 30000 − abono 20000 = 30000.
  expect(view.totals.paidAmount).toBe(20000n);
  expect(view.totals.balance).toBe(30000n);
  expect(view.order.payments).toHaveLength(1);
  expect(view.order.payments[0]).toMatchObject({
    amount: 20000n,
    method: { transfer: null },
    note: ["Abono parcial"],
  });
});

it("lists the registered abonos ordered by id", async () => {
  const { orderId } = await seedOrder("Lista de abonos");

  await actor.addOrderPayment([], orderId, {
    amount: 10000n,
    method: { cash: null },
    note: [],
  });
  await actor.addOrderPayment([], orderId, {
    amount: 5000n,
    method: { card: null },
    note: ["Segundo abono"],
  });

  const payments = await actor.listOrderPayments([], orderId);
  expect(payments).toHaveLength(2);
  expect(payments[0]).toMatchObject({ amount: 10000n, method: { cash: null } });
  expect(payments[1]).toMatchObject({
    amount: 5000n,
    method: { card: null },
    note: ["Segundo abono"],
  });
  // Ordered ascending by id.
  expect(payments[0].id < payments[1].id).toBe(true);
});

it("records each abono as an income movement in Caja/Bancos tied to the order", async () => {
  const { orderId, orderNumber } = await seedOrder("Movimiento de abono");

  const view = await actor.addOrderPayment([], orderId, {
    amount: 15000n,
    method: { cash: null },
    note: [],
  });
  const paymentId = view.order.payments[0].id;

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
    100n,
  );
  const movement = movements.items.find(
    (entry) => entry.reference[0] === `${orderNumber}-ABONO-${paymentId}`,
  );
  expect(movement).toBeDefined();
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { advance: null },
    amount: 15000n,
    account: { cash: null },
    paymentMethod: { cash: null },
  });
});

it("rejects a zero abono", async () => {
  const { orderId } = await seedOrder("Abono cero");

  await expect(
    actor.addOrderPayment([], orderId, {
      amount: 0n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/mayor que cero/);
});

it("rejects an abono above the pending balance", async () => {
  const { orderId, total } = await seedOrder("Abono excedido");

  // No advance: the pending balance is the full total (80000).
  await expect(
    actor.addOrderPayment([], orderId, {
      amount: total + 1n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/supera el saldo pendiente/);
});

it("rejects an abono on a cancelled order", async () => {
  const { orderId } = await seedOrder("Abono cancelada");
  await actor.cancelOrder([], orderId, "Cliente desistió");

  await expect(
    actor.addOrderPayment([], orderId, {
      amount: 1000n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/no admite abonos/);
});

it("rejects an abono on a delivered order", async () => {
  const { orderId } = await seedOrder("Abono entregada");
  await actor.updateOrderStatus([], orderId, { inRepair: null });
  await actor.updateOrderStatus([], orderId, { ready: null });
  await actor.updateOrderStatus([], orderId, { delivered: null });

  await expect(
    actor.addOrderPayment([], orderId, {
      amount: 1000n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/no admite abonos/);
});

it("rejects an abono once the order has an invoice", async () => {
  const { orderId } = await seedOrder("Abono facturada");
  await actor.updateOrderStatus([], orderId, { inRepair: null });
  await actor.updateOrderStatus([], orderId, { ready: null });
  await actor.updateOrderStatus([], orderId, { delivered: null });
  await actor.createInvoiceFromOrder(
    [],
    orderId,
    { cash: null },
    { cash: null },
    [],
  );

  await expect(
    actor.addOrderPayment([], orderId, {
      amount: 1000n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/no admite abonos/);
});

it("builds the advance receipt with the identification, totals and abonos", async () => {
  const { orderId, orderNumber, total } = await seedOrder("Recibo de anticipo");

  await actor.setOrderAdvance([], orderId, {
    amount: [30000n],
    method: [{ cash: null }],
  });
  await actor.addOrderPayment([], orderId, {
    amount: 20000n,
    method: { transfer: null },
    note: ["Abono parcial"],
  });

  const receipt = await actor.getOrderAdvanceReceipt([], orderId);

  expect(receipt.orderId).toBe(orderId);
  expect(receipt.orderNumber).toBe(orderNumber);
  expect(receipt.customerName).toBe("Cliente Recibo de anticipo");
  expect(receipt.customerDocument).toEqual(["LOAA1815"]);
  expect(receipt.motorcycleBrand).toBe("Honda");
  expect(receipt.motorcycleModel).toBe("CB190R");
  expect(receipt.motorcyclePlate).toBe("ABC-123");
  expect(receipt.advance).toHaveLength(1);
  expect(receipt.advance[0]).toMatchObject({
    amount: 30000n,
    method: { cash: null },
  });
  expect(receipt.total).toBe(total);
  // total 80000 − anticipo 30000 − abono 20000 = 30000.
  expect(receipt.paidAmount).toBe(20000n);
  expect(receipt.balance).toBe(30000n);
  expect(receipt.payments).toHaveLength(1);
  expect(receipt.payments[0]).toMatchObject({
    amount: 20000n,
    method: { transfer: null },
    note: ["Abono parcial"],
  });
});
