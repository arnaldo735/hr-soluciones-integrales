import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend cover for the accepted change that records the collection of an OT
 * invoice in Caja y Bancos:
 *
 * - generating a cash invoice from a delivered OT with an advance records an
 *   income movement with `source = #invoice`, `reference = <invoice number>`,
 *   amount = `total − anticipo aplicado`, in the account derived from the
 *   payment method (efectivo -> Caja, transferencia -> Bancos);
 * - the advance already recorded on the OT is not duplicated: the invoice
 *   movement carries only the saldo a cobrar, and the OT's own `#advance`
 *   movement is a separate, single movement;
 * - when no shift is open for the account, one is auto-opened on the first
 *   active register of that kind, exactly like advances and abonos;
 * - converting an accepted quote into an invoice records its collection the
 *   same way, without duplicating movements;
 * - a paid invoice rejects a second collection, so no second movement is
 *   written.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose billing methods are unimplemented stubs. This lane installs the app's
 * own compiled wasm into the platform's PocketIC replica and calls the real
 * public API, so it proves the accepted behavior is implemented.
 *
 * The canister starts with NO open shift: that is the exact state the auto-open
 * branch handles. The company profile is `noResponsableIva` with a zero rate so
 * the totals are the plain subtotal and the arithmetic is exact.
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
const OWNER = createIdentity("invoice-collection-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;

/** Lists every cash movement in the canister. */
async function allMovements() {
  const page = await actor.listCashMovements(
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
  return page.items;
}

/** Finds the single movement whose reference matches. */
async function movementByReference(reference: string) {
  const movements = await allMovements();
  return movements.find((entry) => entry.reference[0] === reference);
}

/** Asserts a movement is bound to a real, open shift on an active register. */
async function expectBoundToOpenShift(
  movement: { shiftId: bigint } | undefined,
  expectedKind: "cash" | "bank",
) {
  expect(movement).toBeDefined();
  const shift = await actor.getShift([], movement?.shiftId as bigint);
  expect(shift).toHaveLength(1);
  expect(shift[0]).toMatchObject({
    id: movement?.shiftId,
    status: { open: null },
  });
  const register = await actor.getCashRegister([], shift[0].registerId);
  expect(register).toHaveLength(1);
  expect(register[0].active).toBe(true);
  expect(register[0].kind).toEqual({ [expectedKind]: null });
}

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
    sku: "REP-FACT-COBRO-1",
    barcode: "7501234567894",
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
  // auto-open branch handles.
  await actor.createCashRegister([], {
    name: "Caja mostrador",
    kind: { cash: null },
    openingBalance: 0n,
  });
  await actor.createCashRegister([], {
    name: "Banco Bogotá",
    kind: { bank: null },
    openingBalance: 0n,
  });
});

afterAll(async () => {
  await pic?.tearDown();
});

it("starts with no open shift in Caja or Bancos", async () => {
  // Guards the premise of the auto-open tests below.
  await expect(actor.listOpenShifts([])).resolves.toHaveLength(0);
});

it("records a cash OT invoice's saldo a cobrar as a #invoice movement in Caja", async () => {
  const { orderId, total } = await seedDeliveredOrder(
    "Factura contado efectivo",
    { amount: 30000n, method: { cash: null } },
  );
  expect(total).toBe(80000n);

  const invoice = await actor.createInvoiceFromOrder(
    [],
    orderId,
    { cash: null },
    { cash: null },
    [],
  );

  // The invoice keeps the gross total and records the advance applied; the
  // saldo a cobrar is total − anticipo = 50000.
  expect(invoice.advanceApplied).toEqual([30000n]);
  expect(invoice.total).toBe(80000n);
  expect(invoice.paymentStatus).toEqual({ paid: null });

  const movement = await movementByReference(invoice.number);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { invoice: null },
    paymentMethod: { cash: null },
    account: { cash: null },
    amount: 50000n,
  });
  expect(movement?.reference).toEqual([invoice.number]);
  await expectBoundToOpenShift(movement, "cash");
});

it("records a transfer OT invoice's saldo a cobrar as a #invoice movement in Bancos", async () => {
  const { orderId, total } = await seedDeliveredOrder(
    "Factura contado transferencia",
    { amount: 30000n, method: { transfer: null } },
  );
  expect(total).toBe(80000n);

  const invoice = await actor.createInvoiceFromOrder(
    [],
    orderId,
    { transfer: null },
    { cash: null },
    [],
  );

  const movement = await movementByReference(invoice.number);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { invoice: null },
    paymentMethod: { transfer: null },
    account: { bank: null },
    amount: 50000n,
  });
  await expectBoundToOpenShift(movement, "bank");
});

it("does not duplicate the OT advance: one #advance and one #invoice movement", async () => {
  const { orderId, orderNumber } = await seedDeliveredOrder(
    "Factura sin duplicar anticipo",
    { amount: 30000n, method: { cash: null } },
  );

  const invoice = await actor.createInvoiceFromOrder(
    [],
    orderId,
    { cash: null },
    { cash: null },
    [],
  );

  const movements = await allMovements();
  const advanceMovements = movements.filter(
    (entry) =>
      entry.source.advance !== undefined &&
      entry.reference[0] === orderNumber,
  );
  const invoiceMovements = movements.filter(
    (entry) =>
      entry.source.invoice !== undefined &&
      entry.reference[0] === invoice.number,
  );

  // The advance is recorded once, for its own amount, and the invoice records
  // only the remaining saldo — never the gross total.
  expect(advanceMovements).toHaveLength(1);
  expect(advanceMovements[0].amount).toBe(30000n);
  expect(invoiceMovements).toHaveLength(1);
  expect(invoiceMovements[0].amount).toBe(50000n);
});

it("converts an accepted quote into an invoice and records its collection", async () => {
  const customer = await actor.createCustomer([], {
    name: "Cliente Cotización Cobro",
    phone: "+57 300 222 2222",
    email: [],
    document: ["LOAA1815"],
    address: [],
  });
  const quote = await actor.createQuote([], {
    customerId: customer.id,
    motorcycleId: [],
    notes: [],
    discount: 0n,
    partLines: [],
    serviceLines: [
      {
        description: "Servicio de afinación",
        quantity: 1n,
        unitPrice: 120000n,
        serviceId: [],
      },
    ],
  });
  await actor.updateQuoteStatus([], quote.quote.id, { accepted: null });

  const invoice = await actor.convertQuoteToInvoice(
    [],
    quote.quote.id,
    { transfer: null },
  );

  expect(invoice.paymentStatus).toEqual({ paid: null });
  expect(invoice.total).toBe(120000n);

  const movement = await movementByReference(invoice.number);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { invoice: null },
    paymentMethod: { transfer: null },
    account: { bank: null },
    amount: 120000n,
  });
  await expectBoundToOpenShift(movement, "bank");

  // Exactly one movement for the converted invoice: no duplicate.
  const movements = await allMovements();
  const forInvoice = movements.filter(
    (entry) =>
      entry.source.invoice !== undefined &&
      entry.reference[0] === invoice.number,
  );
  expect(forInvoice).toHaveLength(1);
});

it("rejects a second collection of a paid invoice and writes no second movement", async () => {
  const { orderId } = await seedDeliveredOrder("Factura crédito cobro único", {
    amount: 30000n,
    method: { cash: null },
  });

  const invoice = await actor.createInvoiceFromOrder(
    [],
    orderId,
    { cash: null },
    { credit: null },
    [{ firstDueDate: 1_800_000_000_000_000_000n, installmentCount: 2n }],
  );
  expect(invoice.paymentStatus).toEqual({ pending: null });

  const paid = await actor.markInvoicePaid([], invoice.id, { cash: null });
  expect(paid.paymentStatus).toEqual({ paid: null });

  const movementsAfterFirst = await allMovements();
  const firstCollection = movementsAfterFirst.filter(
    (entry) =>
      entry.source.invoice !== undefined &&
      entry.reference[0] === invoice.number,
  );
  expect(firstCollection).toHaveLength(1);
  expect(firstCollection[0].amount).toBe(50000n);

  // A paid invoice cannot be collected again, so no second movement appears.
  await expect(
    actor.markInvoicePaid([], invoice.id, { cash: null }),
  ).rejects.toThrow(/La factura ya fue cobrada/);

  const movementsAfterSecond = await allMovements();
  const secondCollection = movementsAfterSecond.filter(
    (entry) =>
      entry.source.invoice !== undefined &&
      entry.reference[0] === invoice.number,
  );
  expect(secondCollection).toHaveLength(1);
});
