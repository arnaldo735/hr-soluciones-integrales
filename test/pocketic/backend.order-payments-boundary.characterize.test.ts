import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Characterization coverage for the abono upper-bound seam on the backend,
 * ahead of the change that lets a positive abono be registered on a workshop
 * order whose total is 0 (no parts and no labor).
 *
 * The accepted change only lifts the `input.amount > totals.balance` rejection
 * when the order total is 0. Everything adjacent to that comparison must stay
 * exactly as it is, and this file pins the parts the existing
 * `backend.order-payments.test.ts` does not:
 *
 * - the comparison is strictly greater-than, so an abono exactly equal to the
 *   pending balance is accepted on a positive-total order (the fix must not
 *   turn `>` into `>=`);
 * - the `ensureAdvanceWithinTotal` invariant still counts the abonos as well as
 *   the advance: removing a line that drops a positive total below
 *   `anticipo + abonos` is rejected, even though the zero-total case is exempt.
 *
 * The zero-total rejection itself is deliberately NOT asserted here: it is the
 * behavior the accepted change intentionally replaces, so freezing it would
 * contradict the request.
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
const OWNER = createIdentity("order-payments-boundary-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;

/** Creates a customer + motorcycle + order with a known subtotal. */
async function seedOrder(problem: string): Promise<{
  orderId: bigint;
  orderNumber: string;
  orderPartId: bigint;
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
  const withPart = await actor.addOrderPart([], order.order.id, {
    partId,
    lotId: [],
    quantity: 2n,
  });
  const orderPartId = withPart.order.parts[0].id;
  const view = await actor.addLabor([], order.order.id, {
    description: "Ajuste de frenos",
    price: 30000n,
    technicianId: [],
    serviceId: [],
  });
  return {
    orderId: order.order.id,
    orderNumber: order.order.orderNumber,
    orderPartId,
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
    sku: "REP-ABONO-BOUND-1",
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

it("accepts an abono exactly equal to the pending balance on a positive-total order", async () => {
  const { orderId, total } = await seedOrder("Abono exacto");
  expect(total).toBe(80000n);

  // No advance: the pending balance is the full total (80000). An abono of
  // exactly 80000 is at the ceiling, not over it, so it must be accepted.
  const view = await actor.addOrderPayment([], orderId, {
    amount: total,
    method: { cash: null },
    note: ["Abono exacto"],
  });

  expect(view.totals.paidAmount).toBe(80000n);
  expect(view.totals.balance).toBe(0n);
  expect(view.order.payments).toHaveLength(1);
  expect(view.order.payments[0]).toMatchObject({ amount: 80000n });
});

it("still rejects an abono one cent above the pending balance on a positive-total order", async () => {
  const { orderId, total } = await seedOrder("Abono un centavo de más");

  await expect(
    actor.addOrderPayment([], orderId, {
      amount: total + 1n,
      method: { cash: null },
      note: [],
    }),
  ).rejects.toThrow(/supera el saldo pendiente/);
});

it("still counts the abonos in the removal invariant, not only the advance", async () => {
  const { orderId, orderPartId } = await seedOrder("Invariante abonos");

  // An abono of 70000 leaves only 10000 of headroom against the 80000 total;
  // removing the 50000 part line would drop the total to 30000, below the
  // 70000 already charged.
  await actor.addOrderPayment([], orderId, {
    amount: 70000n,
    method: { cash: null },
    note: [],
  });

  await expect(
    actor.removeOrderPart([], orderId, orderPartId),
  ).rejects.toThrow(
    "El anticipo y los abonos no pueden superar el total de la orden",
  );
});

it("still allows a removal that keeps the positive total at or above the abonos", async () => {
  const { orderId, orderPartId } = await seedOrder("Invariante abonos límite");

  // An abono of 30000 leaves 50000 of headroom; removing the 50000 part line
  // drops the total to exactly 30000, which the abono still covers, so the
  // removal is allowed.
  await actor.addOrderPayment([], orderId, {
    amount: 30000n,
    method: { cash: null },
    note: [],
  });

  const view = await actor.removeOrderPart([], orderId, orderPartId);
  expect(view.totals.total).toBe(30000n);
  expect(view.totals.balance).toBe(0n);
});
