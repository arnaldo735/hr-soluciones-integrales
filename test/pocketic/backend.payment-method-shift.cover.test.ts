import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend cover for the accepted change that routes every collection to the
 * Caja/Bancos shift of its payment method's account:
 *
 * - a counter (POS) cash sale records an income movement with `source = #pos`
 *   in the caja shift; a transfer or card sale records it in the banco shift;
 * - collecting a credit invoice records an income movement with
 *   `source = #invoice` in the account of the method used to collect;
 * - paying an installment records an income movement with `source = #invoice`
 *   using the invoice's own payment method;
 * - a receivable (cartera) payment records an income movement with
 *   `source = #receivable` in the account of the method received;
 * - when no shift is open for the account, one is auto-opened on the first
 *   active register of that kind, so the movement is always attributed to a
 *   real, open shift.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose cash methods are unimplemented stubs. This lane installs the app's own
 * compiled wasm into the platform's PocketIC replica and calls the real public
 * API, so it proves the accepted behavior is implemented.
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
const OWNER = createIdentity("payment-method-shift-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;
let customerId: bigint;

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
  expect(shift[0]).toMatchObject({ id: movement?.shiftId, status: { open: null } });
  const register = await actor.getCashRegister([], shift[0].registerId);
  expect(register).toHaveLength(1);
  expect(register[0].active).toBe(true);
  expect(register[0].kind).toEqual({ [expectedKind]: null });
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

  // A zero-rate, non-responsable company so the totals are the plain subtotal.
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
    sku: "REP-METODO-TURNO-1",
    barcode: "7501234567892",
    name: "Aceite sintético",
    category: "Lubricantes",
    brand: "Motul",
    unit: "l",
    salePrice: 50000n,
    costPrice: 30000n,
    lowStockThreshold: 1n,
  });
  partId = part.id;

  const supplier = await actor.createSupplier([], {
    name: "Proveedor método turno",
    phone: "+57 300 777 7777",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase([], {
    supplierId: supplier.id,
    items: [
      { partId, lotNumber: "METODO-TURNO-L1", quantity: 50n, unitCost: 30000n },
    ],
  });

  const customer = await actor.createCustomer([], {
    name: "Cliente Método Turno",
    phone: "+57 300 111 1111",
    email: [],
    document: ["LOAA1815"],
    address: [],
  });
  customerId = customer.id;

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

it("records a cash POS sale as a #pos movement in the caja shift", async () => {
  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 1n, discount: 0n }],
    paymentMethod: "cash",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 50000n,
  });

  const movement = await movementByReference(sale.saleNumber);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { pos: null },
    paymentMethod: { cash: null },
    account: { cash: null },
    amount: 50000n,
  });
  await expectBoundToOpenShift(movement, "cash");
});

it("records a transfer POS sale as a #pos movement in the banco shift", async () => {
  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 1n, discount: 0n }],
    paymentMethod: "transfer",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 50000n,
  });

  const movement = await movementByReference(sale.saleNumber);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { pos: null },
    paymentMethod: { transfer: null },
    account: { bank: null },
    amount: 50000n,
  });
  await expectBoundToOpenShift(movement, "bank");
});

it("records a card POS sale as a #pos movement in the banco shift", async () => {
  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 1n, discount: 0n }],
    paymentMethod: "card",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 50000n,
  });

  const movement = await movementByReference(sale.saleNumber);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { pos: null },
    paymentMethod: { card: null },
    account: { bank: null },
    amount: 50000n,
  });
  await expectBoundToOpenShift(movement, "bank");
});

it("records collecting a credit invoice as a #invoice movement in the method's account", async () => {
  const invoice = await actor.createInvoiceFromQuote(
    [],
    0n,
    customerId,
    [
      {
        description: "Servicio de afinación",
        quantity: 1n,
        unitPrice: 120000n,
        amount: 120000n,
        kind: { service: null },
        unitCost: 0n,
      },
    ],
    0n,
    { transfer: null },
    { credit: null },
    [{ firstDueDate: 0n, installmentCount: 1n }],
  );
  expect(invoice.paymentStatus).toEqual({ pending: null });

  const paid = await actor.markInvoicePaid([], invoice.id, { transfer: null });
  expect(paid.paymentStatus).toEqual({ paid: null });

  const movement = await movementByReference(invoice.number);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { invoice: null },
    paymentMethod: { transfer: null },
    account: { bank: null },
    amount: 120000n,
  });
  await expectBoundToOpenShift(movement, "bank");
});

it("records an installment payment as a #invoice movement using the invoice's method", async () => {
  const invoice = await actor.createInvoiceFromQuote(
    [],
    0n,
    customerId,
    [
      {
        description: "Repuesto a crédito",
        quantity: 1n,
        unitPrice: 90000n,
        amount: 90000n,
        kind: { part: null },
        unitCost: 0n,
      },
    ],
    0n,
    { cash: null },
    { credit: null },
    [{ firstDueDate: 0n, installmentCount: 2n }],
  );

  const afterFirst = await actor.registerInstallmentPayment([], invoice.id, 1n);
  expect(afterFirst.paymentStatus).toEqual({ pending: null });

  // The invoice's method is cash, so the installment lands in the caja shift.
  const movements = await allMovements();
  const installmentMovements = movements.filter(
    (entry) =>
      entry.source.invoice !== undefined &&
      entry.reference[0] === invoice.number,
  );
  expect(installmentMovements).toHaveLength(1);
  expect(installmentMovements[0]).toMatchObject({
    kind: { income: null },
    source: { invoice: null },
    paymentMethod: { cash: null },
    account: { cash: null },
    amount: 45000n,
  });
  await expectBoundToOpenShift(installmentMovements[0], "cash");
});

it("records a receivable payment as a #receivable movement in the method's account", async () => {
  const invoice = await actor.createInvoiceFromQuote(
    [],
    0n,
    customerId,
    [
      {
        description: "Servicio a crédito",
        quantity: 1n,
        unitPrice: 80000n,
        amount: 80000n,
        kind: { service: null },
        unitCost: 0n,
      },
    ],
    0n,
    { cash: null },
    { credit: null },
    [{ firstDueDate: 0n, installmentCount: 1n }],
  );

  const payment = await actor.registerReceivablePayment([], {
    invoiceId: invoice.id,
    amount: 30000n,
    method: "transfer",
    note: ["Abono parcial"],
  });
  expect(payment).toMatchObject({ amount: 30000n, method: "transfer" });

  const movement = await movementByReference(invoice.number);
  expect(movement).toMatchObject({
    kind: { income: null },
    source: { receivable: null },
    paymentMethod: { transfer: null },
    account: { bank: null },
    amount: 30000n,
  });
  await expectBoundToOpenShift(movement, "bank");
});

it("reuses the auto-opened shift for later movements instead of opening a second one", async () => {
  // A second cash POS sale must land on the same already-open caja shift.
  const before = await actor.listOpenShifts([]);

  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 1n, discount: 0n }],
    paymentMethod: "cash",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 50000n,
  });
  const movement = await movementByReference(sale.saleNumber);
  expect(movement).toBeDefined();

  // The movement's shift is one of the shifts that was already open, and no new
  // shift was opened for the cash account.
  const after = await actor.listOpenShifts([]);
  expect(after).toHaveLength(before.length);
  expect(after.map((shift) => shift.id)).toContain(movement?.shiftId);

  const shift = await actor.getShift([], movement?.shiftId as bigint);
  expect(shift).toHaveLength(1);
  const sameRegisterShifts = after.filter(
    (entry) => entry.registerId === shift[0].registerId,
  );
  expect(sameRegisterShifts).toHaveLength(1);
});
