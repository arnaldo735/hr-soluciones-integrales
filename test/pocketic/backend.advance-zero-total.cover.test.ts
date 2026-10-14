import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend cover for the accepted change that lets a positive advance be
 * registered on a workshop order whose total is 0 (no parts and no labor).
 *
 * Before the change, `buildAdvance` rejected any advance above the order total,
 * so a zero-total order could not carry a positive advance. The accepted
 * behavior is that `setOrderAdvance` accepts a positive amount when the total is
 * 0, persists it, and reports it back through `getOrder`; the upper bound is
 * still enforced when the total is greater than 0, and the removal invariant
 * (`ensureAdvanceWithinTotal`) still rejects a removal that would drop a
 * positive total below the stored advance.
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
const OWNER = createIdentity("advance-zero-total-owner");

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
    sku: "REP-ANTICIPO-CERO-1",
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

  // An active cash register so the advance movement has a shift to bind to.
  await actor.createCashRegister([], {
    name: "Caja mostrador",
    kind: { cash: null },
    openingBalance: 0n,
  });
});

afterAll(async () => {
  await pic?.tearDown();
});

it("accepts a positive advance on a zero-total order and persists it", async () => {
  const { orderId } = await seedZeroTotalOrder("Anticipo total cero");

  const view = await actor.setOrderAdvance([], orderId, {
    amount: [50000n],
    method: [{ cash: null }],
  });
  expect(view.totals.total).toBe(0n);
  expect(view.order.advance).toHaveLength(1);
  expect(view.order.advance[0]).toMatchObject({
    amount: 50000n,
    method: { cash: null },
  });

  // The advance survives a fresh read of the order.
  const reread = await actor.getOrder([], orderId);
  expect(reread).toHaveLength(1);
  expect(reread[0].order.advance).toHaveLength(1);
  expect(reread[0].order.advance[0]).toMatchObject({ amount: 50000n });
  expect(reread[0].totals.total).toBe(0n);
});

it("recalculates the pending balance after a zero-total advance", async () => {
  const { orderId } = await seedZeroTotalOrder("Anticipo saldo cero");

  const view = await actor.setOrderAdvance([], orderId, {
    amount: [50000n],
    method: [{ cash: null }],
  });
  // total 0, advance 50000: the charged amount covers the total, so the pending
  // balance is clamped to 0 rather than going negative.
  expect(view.totals.paidAmount).toBe(0n);
  expect(view.totals.balance).toBe(0n);
});

it("still rejects an advance above a positive order total", async () => {
  const { orderId, total } = await seedPositiveTotalOrder("Anticipo excede");
  expect(total).toBe(80000n);

  await expect(
    actor.setOrderAdvance([], orderId, {
      amount: [90000n],
      method: [{ cash: null }],
    }),
  ).rejects.toThrow("El anticipo no puede superar el total de la orden");
});

it("still rejects a removal that drops a positive total below the advance", async () => {
  const { orderId, orderPartId } = await seedPositiveTotalOrder(
    "Anticipo remocion",
  );

  // An advance of 70000 leaves only 10000 of headroom; removing the 50000 part
  // line would drop the total to 30000, below the advance.
  await actor.setOrderAdvance([], orderId, {
    amount: [70000n],
    method: [{ cash: null }],
  });

  await expect(
    actor.removeOrderPart([], orderId, orderPartId),
  ).rejects.toThrow(
    "El anticipo y los abonos no pueden superar el total de la orden",
  );
});
