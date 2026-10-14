import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend characterization for the invoice shape an OT with an advance produces,
 * ahead of the accepted "the OT sale's saldo a cobrar must be recorded in Caja y
 * Bancos" change.
 *
 * The accepted change makes `createInvoiceFromOrder` record the saldo a cobrar
 * (`total − anticipo`) as a Caja/Bancos income movement. These tests
 * deliberately do NOT assert anything about that movement — that is exactly the
 * behavior the change adds. They protect the surrounding invoice contract that
 * must keep working once the movement is recorded:
 *
 * - a cash OT invoice with an advance carries `advanceApplied` equal to the
 *   order's advance and a `total` that is the full order total (the advance is
 *   not subtracted from `total`, only from the saldo a cobrar);
 * - a credit OT invoice's installment plan finances the saldo a cobrar
 *   (`total − advanceApplied`), not the gross total;
 * - a second invoice for the same order is rejected, so the movement the change
 *   adds can never be written twice for one OT.
 *
 * The canister starts with NO open shift, so the auto-open branch the movement
 * uses is exercised by the sibling `backend.payment-method-shift.cover.test.ts`;
 * this file only needs the invoice to be created. The company profile is
 * `noResponsableIva` with a zero rate so the totals are the plain subtotal and
 * the arithmetic is exact.
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
const OWNER = createIdentity("invoice-order-advance-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;

/**
 * Creates a customer + motorcycle + delivered order with a known subtotal and
 * an optional advance, returning the order id, number and total.
 */
async function seedDeliveredOrder(
  problem: string,
  advance: { amount: bigint; method: { cash: null } | { transfer: null } } | null,
): Promise<{ orderId: bigint; orderNumber: string; total: bigint }> {
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
  if (advance !== null) {
    await actor.setOrderAdvance([], order.order.id, {
      amount: [advance.amount],
      method: [advance.method],
    });
  }
  await actor.updateOrderStatus([], order.order.id, { inRepair: null });
  await actor.updateOrderStatus([], order.order.id, { ready: null });
  await actor.updateOrderStatus([], order.order.id, { delivered: null });
  return {
    orderId: order.order.id,
    orderNumber: order.order.orderNumber,
    total: view.totals.total,
  };
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
    sku: "REP-FACT-OT-1",
    barcode: "7501234567893",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  partId = part.id;
});

afterAll(async () => {
  await pic?.tearDown();
});

it("keeps the full total and records the advance on a cash OT invoice", async () => {
  const { orderId, total } = await seedDeliveredOrder("Factura contado con anticipo", {
    amount: 30000n,
    method: { cash: null },
  });
  expect(total).toBe(80000n);

  const invoice = await actor.createInvoiceFromOrder(
    [],
    orderId,
    { cash: null },
    { cash: null },
    [],
  );

  // The advance is recorded on the invoice, but the total stays the gross
  // order total: the saldo a cobrar is derived as total − advanceApplied.
  expect(invoice.advanceApplied).toEqual([30000n]);
  expect(invoice.total).toBe(80000n);
  expect(invoice.paymentCondition).toEqual({ cash: null });
  expect(invoice.orderId).toEqual([orderId]);
});

it("finances the saldo a cobrar, not the total, on a credit OT invoice", async () => {
  const { orderId, total } = await seedDeliveredOrder("Factura crédito con anticipo", {
    amount: 30000n,
    method: { transfer: null },
  });
  expect(total).toBe(80000n);

  const invoice = await actor.createInvoiceFromOrder(
    [],
    orderId,
    { transfer: null },
    { credit: null },
    [{ firstDueDate: 1_800_000_000_000_000_000n, installmentCount: 2n }],
  );

  expect(invoice.advanceApplied).toEqual([30000n]);
  expect(invoice.total).toBe(80000n);
  expect(invoice.paymentStatus).toEqual({ pending: null });

  const plan = invoice.installments[0];
  expect(plan).toBeDefined();
  expect(plan.installmentCount).toBe(2n);
  // The plan finances the saldo a cobrar (80000 − 30000 = 50000), not the
  // gross total.
  const sum = plan.installments.reduce(
    (acc, installment) => acc + installment.amount,
    0n,
  );
  expect(sum).toBe(50000n);
});

it("rejects a second invoice for the same OT", async () => {
  const { orderId } = await seedDeliveredOrder("Factura única", {
    amount: 10000n,
    method: { cash: null },
  });

  await actor.createInvoiceFromOrder(
    [],
    orderId,
    { cash: null },
    { cash: null },
    [],
  );

  // The guard that keeps the change's movement from being written twice.
  await expect(
    actor.createInvoiceFromOrder([], orderId, { cash: null }, { cash: null }, []),
  ).rejects.toThrow(/La orden ya está facturada/);
});
