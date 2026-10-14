import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend cover for the accepted change that makes an order advance and a POS
 * sale raise the balance of the corresponding caja/banco **without closing the
 * shift**.
 *
 * The accepted behavior is that the open-shift reads (`listOpenShifts`,
 * `getOpenShift`, `getShift`, `getDailyShiftReport`) derive the computed
 * balances live from the ledger, so a movement registered by an advance or a
 * POS sale is reflected immediately. Before the change the stored
 * `computedClosingCash`/`computedClosingBank` were only recomputed at close, so
 * the panel kept showing the opening balance until the shift was closed.
 *
 * The sibling lane files prove the movement is *written* and attributed to a
 * real open shift (`backend.advance-shift.cover.test.ts`,
 * `backend.payment-method-shift.cover.test.ts`). This file proves the balance
 * the panel reads actually *increases* while the shift stays open, and that
 * closing still computes the expected closing from the same ledger.
 *
 * The canister starts with both a caja and a banco shift already open with
 * known opening balances, so the delta is exact and no auto-open branch is
 * involved. The company profile is `noResponsableIva` with a zero rate so the
 * order and sale totals are the plain subtotal.
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
const OWNER = createIdentity("live-balances-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;
let cajaId: bigint;
let bancoId: bigint;
let cajaShiftId: bigint;
let bancoShiftId: bigint;

const CAJA_OPENING = 100000n;
const BANCO_OPENING = 500000n;

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
  // 2 × 50000 parts + 30000 labor = 130000 subtotal; the zero-rate profile
  // makes the total exactly 130000.
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

/** The open shift for a register, or undefined when none is open. */
async function openShiftFor(registerId: bigint) {
  const open = await actor.listOpenShifts([]);
  return open.find((shift) => shift.registerId === registerId);
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
    sku: "REP-SALDO-VIVO-1",
    barcode: "7501234567894",
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
    name: "Proveedor saldo vivo",
    phone: "+57 300 777 7777",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase([], {
    supplierId: supplier.id,
    items: [
      { partId, lotNumber: "SALDO-VIVO-L1", quantity: 50n, unitCost: 30000n },
    ],
  });

  const caja = await actor.createCashRegister([], {
    name: "Caja mostrador",
    kind: { cash: null },
    openingBalance: 0n,
  });
  cajaId = caja.id;
  const banco = await actor.createCashRegister([], {
    name: "Banco Bogotá",
    kind: { bank: null },
    openingBalance: 0n,
  });
  bancoId = banco.id;

  // Both shifts are opened up front with known opening balances, so the balance
  // delta after each movement is exact and no auto-open branch is involved.
  const cajaShift = await actor.openShift([], {
    registerId: cajaId,
    responsibleName: "Ana Torres",
    responsibleUserId: [],
    openingCash: CAJA_OPENING,
    openingBank: 0n,
    notes: [],
  });
  cajaShiftId = cajaShift.id;

  const bancoShift = await actor.openShift([], {
    registerId: bancoId,
    responsibleName: "Carlos Pérez",
    responsibleUserId: [],
    openingCash: 0n,
    openingBank: BANCO_OPENING,
    notes: [],
  });
  bancoShiftId = bancoShift.id;
});

afterAll(async () => {
  await pic?.tearDown();
});

it("starts with both shifts open at their opening balances", async () => {
  // Guards the premise of every delta below: the shifts are open and the
  // computed balances equal the opening balances before any movement.
  const caja = await openShiftFor(cajaId);
  expect(caja).toBeDefined();
  expect(caja).toMatchObject({
    id: cajaShiftId,
    status: { open: null },
    computedClosingCash: CAJA_OPENING,
    computedClosingBank: 0n,
  });

  const banco = await openShiftFor(bancoId);
  expect(banco).toBeDefined();
  expect(banco).toMatchObject({
    id: bancoShiftId,
    status: { open: null },
    computedClosingCash: 0n,
    computedClosingBank: BANCO_OPENING,
  });
});

it("raises the caja balance after a cash advance without closing the shift", async () => {
  const { orderId, orderNumber, total } = await seedOrder("Anticipo saldo vivo");
  expect(total).toBe(130000n);

  const before = await openShiftFor(cajaId);
  expect(before?.computedClosingCash).toBe(CAJA_OPENING);

  await actor.setOrderAdvance([], orderId, {
    amount: [30000n],
    method: [{ cash: null }],
  });

  // The shift is still open and its live balance already includes the advance.
  const after = await openShiftFor(cajaId);
  expect(after).toMatchObject({
    id: cajaShiftId,
    status: { open: null },
    computedClosingCash: CAJA_OPENING + 30000n,
    computedClosingBank: 0n,
  });

  // The same live balance is what the single-shift reads and the daily report
  // return, so the panel and the report agree with the list.
  const byRegister = await actor.getOpenShift([], cajaId);
  expect(byRegister).toHaveLength(1);
  expect(byRegister[0].computedClosingCash).toBe(CAJA_OPENING + 30000n);

  const byId = await actor.getShift([], cajaShiftId);
  expect(byId).toHaveLength(1);
  expect(byId[0].computedClosingCash).toBe(CAJA_OPENING + 30000n);

  const report = await actor.getDailyShiftReport([], cajaShiftId);
  expect(report.shift.computedClosingCash).toBe(CAJA_OPENING + 30000n);
  expect(report.cashIncome).toBe(30000n);
  // The advance movement is the one the report lists.
  expect(
    report.movements.some(
      (movement) =>
        movement.source.advance !== undefined &&
        movement.reference[0] === orderNumber,
    ),
  ).toBe(true);
});

it("raises the banco balance after a transfer POS sale without closing the shift", async () => {
  const before = await openShiftFor(bancoId);
  expect(before?.computedClosingBank).toBe(BANCO_OPENING);

  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 1n, discount: 0n }],
    paymentMethod: "transfer",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 50000n,
  });
  expect(sale.total).toBe(50000n);

  // The banco shift is still open and its live balance already includes the
  // sale; the caja shift is untouched by a transfer sale.
  const after = await openShiftFor(bancoId);
  expect(after).toMatchObject({
    id: bancoShiftId,
    status: { open: null },
    computedClosingCash: 0n,
    computedClosingBank: BANCO_OPENING + 50000n,
  });

  const caja = await openShiftFor(cajaId);
  expect(caja?.computedClosingCash).toBe(CAJA_OPENING + 30000n);

  const report = await actor.getDailyShiftReport([], bancoShiftId);
  expect(report.shift.computedClosingBank).toBe(BANCO_OPENING + 50000n);
  expect(report.bankIncome).toBe(50000n);
  expect(
    report.movements.some(
      (movement) =>
        movement.source.pos !== undefined &&
        movement.reference[0] === sale.saleNumber,
    ),
  ).toBe(true);
});

it("raises the caja balance after a cash POS sale without closing the shift", async () => {
  const before = await openShiftFor(cajaId);
  expect(before?.computedClosingCash).toBe(CAJA_OPENING + 30000n);

  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 1n, discount: 0n }],
    paymentMethod: "cash",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 50000n,
  });
  expect(sale.total).toBe(50000n);

  // The caja shift is still open and its live balance already includes the
  // cash sale; the banco shift is untouched by a cash sale.
  const after = await openShiftFor(cajaId);
  expect(after).toMatchObject({
    id: cajaShiftId,
    status: { open: null },
    computedClosingCash: CAJA_OPENING + 30000n + 50000n,
    computedClosingBank: 0n,
  });

  const banco = await openShiftFor(bancoId);
  expect(banco?.computedClosingBank).toBe(BANCO_OPENING + 50000n);

  const report = await actor.getDailyShiftReport([], cajaShiftId);
  expect(report.shift.computedClosingCash).toBe(
    CAJA_OPENING + 30000n + 50000n,
  );
  expect(report.cashIncome).toBe(30000n + 50000n);
  expect(
    report.movements.some(
      (movement) =>
        movement.source.pos !== undefined &&
        movement.reference[0] === sale.saleNumber,
    ),
  ).toBe(true);
});

it("still computes the expected closing from the same ledger at close", async () => {
  // The caja shift has the 30000 cash advance plus the 50000 cash POS sale;
  // declare exactly the live balance so the difference is zero. The banco shift
  // has the 50000 transfer sale.
  const cajaLive = await openShiftFor(cajaId);
  const bancoLive = await openShiftFor(bancoId);
  expect(cajaLive?.computedClosingCash).toBe(CAJA_OPENING + 30000n + 50000n);
  expect(bancoLive?.computedClosingBank).toBe(BANCO_OPENING + 50000n);

  const closedCaja = await actor.closeShift([], cajaShiftId, {
    declaredClosingCash: CAJA_OPENING + 30000n + 50000n,
    declaredClosingBank: 0n,
    notes: [],
  });
  expect(closedCaja.status).toEqual({ closed: null });
  expect(closedCaja.computedClosingCash).toBe(CAJA_OPENING + 30000n + 50000n);
  expect(closedCaja.differenceCash).toBe(0n);

  const closedBanco = await actor.closeShift([], bancoShiftId, {
    declaredClosingCash: 0n,
    declaredClosingBank: BANCO_OPENING + 50000n,
    notes: [],
  });
  expect(closedBanco.status).toEqual({ closed: null });
  expect(closedBanco.computedClosingBank).toBe(BANCO_OPENING + 50000n);
  expect(closedBanco.differenceBank).toBe(0n);

  // A closed shift keeps its stored balances and is no longer open.
  const closedRead = await actor.getShift([], cajaShiftId);
  expect(closedRead).toHaveLength(1);
  expect(closedRead[0]).toMatchObject({
    status: { closed: null },
    computedClosingCash: CAJA_OPENING + 30000n + 50000n,
  });
  await expect(actor.listOpenShifts([])).resolves.toHaveLength(0);
});
