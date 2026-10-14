import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend characterization for the POS counter-sale contract and the
 * Caja/Bancos shift-resolution seam, ahead of the accepted "a POS sale must
 * land in the Caja/Bancos shift" change.
 *
 * The accepted change makes `createPosSale` record a cash movement whose
 * account is derived from the sale's payment method (efectivo -> Caja,
 * transferencia -> Bancos). These tests deliberately do NOT assert that a POS
 * sale currently creates a movement — that is exactly the behavior the change
 * adds. They protect the surrounding contract that must keep working once the
 * movement is recorded:
 *
 * - a cash and a transfer POS sale still record the sale, decrement stock and
 *   create the direct `#pos` invoice with the method, condition and paid
 *   status the sale carried;
 * - the shift-resolution seam the new movement will use resolves the open
 *   shift by account: a `#cash` account resolves to the open caja shift and a
 *   `#bank` account to the open banco shift, and `resolveOrOpenShiftForAccount`
 *   auto-opens a zero-balance shift on the first active register of the type
 *   when none is open.
 *
 * The caller is the first registered principal, which the platform's access
 * control mixin promotes to admin, so the POS and cash module gates are
 * satisfied.
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
const OWNER = createIdentity("pos-sale-movement-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let partId: bigint;
let cajaId: bigint;
let bancoId: bigint;

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

  // A zero-rate, non-responsable company so the sale total is the plain
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
    sku: "REP-POS-MOV-1",
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
    name: "Proveedor POS movimiento",
    phone: "+57 300 777 7777",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase([], {
    supplierId: supplier.id,
    items: [
      { partId, lotNumber: "POS-MOV-L1", quantity: 20n, unitCost: 30000n },
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
});

afterAll(async () => {
  await pic?.tearDown();
});

it("records a cash POS sale with its direct paid invoice and stock decrement", async () => {
  const before = await actor.getPart([], partId);
  const stockBefore = before[0].totalStock;

  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 2n, discount: 0n }],
    paymentMethod: "cash",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 100000n,
  });

  // 2 × 50000 = 100000, no tax under the zero-rate profile.
  expect(sale.subtotal).toBe(100000n);
  expect(sale.total).toBe(100000n);
  expect(sale.paymentMethod).toBe("cash");
  expect(sale.paymentCondition).toEqual({ cash: null });

  // The direct invoice is created, paid, and points back at the sale.
  const invoice = await actor.getInvoice([], sale.invoiceId);
  expect(invoice).toHaveLength(1);
  expect(invoice[0]).toMatchObject({
    origin: { pos: null },
    posSaleId: [sale.id],
    paymentMethod: { cash: null },
    paymentStatus: { paid: null },
    total: 100000n,
  });

  // Stock was decremented by the sold quantity.
  const after = await actor.getPart([], partId);
  expect(after[0].totalStock).toBe(stockBefore - 2n);
});

it("records a transfer POS sale with its direct paid invoice", async () => {
  const sale = await actor.createPosSale([], {
    customerId: [],
    lines: [{ partId, quantity: 1n, discount: 0n }],
    paymentMethod: "transfer",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 50000n,
  });

  expect(sale.paymentMethod).toBe("transfer");
  expect(sale.total).toBe(50000n);

  const invoice = await actor.getInvoice([], sale.invoiceId);
  expect(invoice).toHaveLength(1);
  expect(invoice[0]).toMatchObject({
    origin: { pos: null },
    posSaleId: [sale.id],
    paymentMethod: { transfer: null },
    paymentStatus: { paid: null },
  });
});

it("resolves an open shift per account after the sales auto-opened them", async () => {
  // The accepted change makes each counter sale record a movement in the shift
  // of its payment method's account, auto-opening one when none exists. The two
  // sales above therefore already opened a caja shift (cash sale) and a banco
  // shift (transfer sale), so this test asserts the shift-resolution seam the
  // movement uses: each account resolves to its own open shift, and the two
  // coexist.
  //
  // The auto-open picks the lowest-id active register of the account's kind, so
  // the cash shift may live on the migration-created "Caja principal" (id 0)
  // rather than the register this file created. The assertions therefore key off
  // the account's kind, not a specific register id.
  const open = await actor.listOpenShifts([]);
  expect(open).toHaveLength(2);

  const kinds = await Promise.all(
    open.map(async (shift) => {
      const register = await actor.getCashRegister([], shift.registerId);
      expect(register).toHaveLength(1);
      expect(register[0].active).toBe(true);
      return register[0].kind;
    }),
  );
  const cashShifts = open.filter((_, index) => kinds[index].cash !== undefined);
  const bankShifts = open.filter((_, index) => kinds[index].bank !== undefined);
  expect(cashShifts).toHaveLength(1);
  expect(bankShifts).toHaveLength(1);
  expect(cashShifts[0]).toMatchObject({ status: { open: null } });
  expect(bankShifts[0]).toMatchObject({ status: { open: null } });

  // Each account's open shift is the one the movement binds to: the caja
  // register resolves to the cash shift and the banco register to the bank
  // shift.
  const cajaOpen = await actor.getOpenShift([], cashShifts[0].registerId);
  expect(cajaOpen).toHaveLength(1);
  expect(cajaOpen[0].id).toBe(cashShifts[0].id);

  const bancoOpen = await actor.getOpenShift([], bankShifts[0].registerId);
  expect(bancoOpen).toHaveLength(1);
  expect(bancoOpen[0].id).toBe(bankShifts[0].id);
});
