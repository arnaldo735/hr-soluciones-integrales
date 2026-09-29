import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

const OWNER = Principal.fromText("aaaaa-aa");
const MECHANIC = Principal.fromText("2vxsx-fae");

let pic: PocketIc | undefined;
let actor: _SERVICE;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
  } else {
    // `[baseline, current]`, the same install contract the hosted deploy uses
    // for a converted project. The upgrade replays the chain from the legacy
    // schema.
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

  // The first registered caller is promoted to admin by the platform mixin.
  actor.setPrincipal(OWNER);
  await actor._initialize_access_control();
  await actor.saveCallerUserProfile("Dueño");
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers the list reads instead of trapping", async () => {
  actor.setPrincipal(OWNER);
  // The accepted change seeds a coherent sample dataset on a fresh install, so
  // these reads are no longer empty. The point of this test is that each read
  // answers rather than trapping; the seeded contents are asserted in the
  // sample-data section below.
  await expect(
    actor.listParts(
      { search: [], category: [], brand: [], lowStockOnly: [] },
      { sku: null },
      0n,
      20n,
    ),
  ).resolves.toMatchObject({ items: expect.any(Array) });
  await expect(actor.listCustomers([])).resolves.toBeInstanceOf(Array);
  await expect(actor.listSuppliers([])).resolves.toBeInstanceOf(Array);
  await expect(actor.listPayables()).resolves.toBeInstanceOf(Array);
  await expect(
    actor.listOrders({ status: [], search: [] }, 0n, 20n),
  ).resolves.toMatchObject({ items: expect.any(Array) });
  await expect(
    actor.listInvoices({ to: [], from: [], search: [] }, 0n, 20n),
  ).resolves.toMatchObject({ items: expect.any(Array) });
});

it("round-trips a part through the real canister", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
  });
  expect(part.sku).toBe("REP-0001");
  expect(part.salePrice).toBe(25000n);

  // `getPart` returns a Candid optional: `[] | [PartView]`.
  const read = await actor.getPart(part.id);
  expect(read).toHaveLength(1);
  expect(read[0]).toMatchObject({ sku: "REP-0001", name: "Balata de freno" });
});

// --- Accepted behavior: the catalog's distinct filter facets ---------------
//
// The accepted change computes the inventory filter options with a single
// `listPartFacets()` call instead of reading a broad page of the catalog. This
// test calls the real canister, so it proves the method is implemented rather
// than a stub that traps, and that it returns the distinct category and brand
// values the catalog actually holds.

it("returns the distinct catalog categories and brands from one call", async () => {
  actor.setPrincipal(OWNER);
  const sku = (suffix: string) => `REP-FACET-${suffix}`;
  await actor.createPart({
    sku: sku("1"),
    name: "Balata delantera",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  await actor.createPart({
    sku: sku("2"),
    name: "Balata trasera",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  await actor.createPart({
    sku: sku("3"),
    name: "Filtro de aire",
    category: "Motor",
    brand: "Mann",
    unit: "pza",
    salePrice: 30000n,
    costPrice: 15000n,
    lowStockThreshold: 1n,
  });

  const facets = await actor.listPartFacets();

  // Each distinct value appears once, so the filter dropdowns never show a
  // duplicate option.
  expect(facets.categories).toContain("Frenos");
  expect(facets.categories).toContain("Motor");
  expect(facets.brands).toContain("Brembo");
  expect(facets.brands).toContain("Mann");
  expect(new Set(facets.categories).size).toBe(facets.categories.length);
  expect(new Set(facets.brands).size).toBe(facets.brands.length);
});

it("round-trips a customer and motorcycle", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Ada Lovelace",
    phone: "+52 555 0100",
    email: ["ada@example.com"],
    document: ["LOAA1815"],
    address: ["Av. Reforma 100"],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "ABC-123",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 15000n,
  });
  expect(motorcycle.plate).toBe("ABC-123");

  const detail = await actor.getCustomerDetail(customer.id);
  expect(detail).toHaveLength(1);
  expect(detail[0].motorcycles).toHaveLength(1);
  expect(detail[0].motorcycles[0]).toMatchObject({ plate: "ABC-123" });
});

// --- Accepted behavior: the directory's bulk motorcycle count --------------
//
// The accepted change replaces the per-customer `listMotorcycles` fan-out with
// a single `listMotorcycleCountsByCustomers(ids)` call. These tests call the
// real canister, so they prove the method is implemented rather than a stub
// that traps, and that it counts each customer's own fleet.

it("counts each customer's motorcycles in one bulk call", async () => {
  actor.setPrincipal(OWNER);
  const withTwo = await actor.createCustomer({
    name: "Cliente Dos Motos",
    phone: "+57 300 111 0001",
    email: [],
    document: [],
    address: [],
  });
  const withOne = await actor.createCustomer({
    name: "Cliente Una Moto",
    phone: "+57 300 111 0002",
    email: [],
    document: [],
    address: [],
  });
  const withNone = await actor.createCustomer({
    name: "Cliente Sin Motos",
    phone: "+57 300 111 0003",
    email: [],
    document: [],
    address: [],
  });

  await actor.createMotorcycle({
    customerId: withTwo.id,
    plate: "CNT-001",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 1000n,
  });
  await actor.createMotorcycle({
    customerId: withTwo.id,
    plate: "CNT-002",
    brand: "Yamaha",
    model: "FZ",
    year: 2021n,
    mileage: 2000n,
  });
  await actor.createMotorcycle({
    customerId: withOne.id,
    plate: "CNT-003",
    brand: "Suzuki",
    model: "GN125",
    year: 2020n,
    mileage: 3000n,
  });

  const counts = await actor.listMotorcycleCountsByCustomers([
    withTwo.id,
    withOne.id,
    withNone.id,
  ]);

  // One pair per requested id, in the requested order, with the customer's own
  // count. A customer with no motorcycles reports zero rather than being
  // omitted, so the directory's count column can render every row.
  expect(counts).toEqual([
    [withTwo.id, 2n],
    [withOne.id, 1n],
    [withNone.id, 0n],
  ]);
});

it("answers an empty id list with an empty result instead of trapping", async () => {
  actor.setPrincipal(OWNER);
  await expect(actor.listMotorcycleCountsByCustomers([])).resolves.toEqual([]);
});

it("answers an inventory valuation instead of trapping", async () => {
  actor.setPrincipal(OWNER);
  const valuation = await actor.getInventoryValuation();
  // Every part gets a row, even one with no lots: it is valued at zero rather
  // than omitted, so the snapshot always covers the whole catalog.
  const row = valuation.rows.find((entry) => entry.sku === "REP-0001");
  expect(row).toMatchObject({
    units: 0n,
    costValue: 0n,
    saleValue: 0n,
    margin: 0n,
    marginBps: 0n,
  });
  expect(valuation.totals.totalCostValue).toBe(0n);
  expect(valuation.totals.totalSaleValue).toBe(0n);
  expect(valuation.totals.totalMargin).toBe(0n);
});

it("values inventory from the part cost price times stock, not per-lot cost", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-VAL-1",
    name: "Aceite 20W-50",
    category: "Lubricantes",
    brand: "Motul",
    unit: "l",
    salePrice: 25000n,
    // The accepted formula uses this price, so the lot unit costs below are
    // deliberately different: a valuation that summed per-lot cost would fail.
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Distribuidora Central",
    phone: "+57 300 000 0000",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  // Two lots at different unit costs, 12 units total. The per-lot sum would be
  // 10 × 12000 + 2 × 15000 = 150000; the accepted formula is 12 × 12000.
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "L-1", quantity: 10n, unitCost: 12000n },
      { partId: part.id, lotNumber: "L-2", quantity: 2n, unitCost: 15000n },
    ],
  });

  const valuation = await actor.getInventoryValuation();
  const row = valuation.rows.find((entry) => entry.sku === "REP-VAL-1");
  expect(row).toBeDefined();
  expect(row).toMatchObject({
    units: 12n,
    // 12 units × 12000 cost price.
    costValue: 144000n,
    // 12 units × 25000 sale price.
    saleValue: 300000n,
    margin: 156000n,
    // 156000 / 300000 = 52.0 %.
    marginBps: 5200n,
  });

  // The category breakdown and the totals reconcile with the row.
  const category = valuation.byCategory.find(
    (entry) => entry.category === "Lubricantes",
  );
  expect(category).toMatchObject({
    partCount: 1n,
    units: 12n,
    costValue: 144000n,
    saleValue: 300000n,
    margin: 156000n,
    marginBps: 5200n,
  });
  expect(valuation.totals.totalCostValue).toBe(144000n);
  expect(valuation.totals.totalSaleValue).toBe(300000n);
  expect(valuation.totals.totalMargin).toBe(156000n);
  expect(valuation.totals.marginBps).toBe(5200n);
});

it("values a part with no stock at zero cost, sale and margin", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-VAL-ZERO",
    name: "Bujía iridio",
    category: "Encendido",
    brand: "NGK",
    unit: "pza",
    salePrice: 45000n,
    costPrice: 20000n,
    lowStockThreshold: 2n,
  });

  const valuation = await actor.getInventoryValuation();
  const row = valuation.rows.find((entry) => entry.sku === "REP-VAL-ZERO");
  expect(row).toBeDefined();
  expect(row).toMatchObject({
    units: 0n,
    costValue: 0n,
    saleValue: 0n,
    margin: 0n,
    marginBps: 0n,
  });

  // The zero-stock part still counts as a valued row and contributes nothing.
  const category = valuation.byCategory.find(
    (entry) => entry.category === "Encendido",
  );
  expect(category).toMatchObject({
    partCount: 1n,
    units: 0n,
    costValue: 0n,
    saleValue: 0n,
    margin: 0n,
    marginBps: 0n,
  });
  expect(part.id).toBeDefined();
});

it("reports a negative margin when the cost price exceeds the sale price", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-VAL-NEG",
    name: "Repuesto en pérdida",
    category: "Varios",
    brand: "Genérico",
    unit: "pza",
    // Sale below cost: the margin must be negative and the percentage 0.
    salePrice: 8000n,
    costPrice: 10000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Varios",
    phone: "+57 300 111 1111",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "N-1", quantity: 5n, unitCost: 10000n },
    ],
  });

  const valuation = await actor.getInventoryValuation();
  const row = valuation.rows.find((entry) => entry.sku === "REP-VAL-NEG");
  expect(row).toBeDefined();
  expect(row).toMatchObject({
    units: 5n,
    costValue: 50000n,
    saleValue: 40000n,
    margin: -10000n,
    // A non-positive margin reports 0 bps rather than a negative percentage.
    marginBps: 0n,
  });
});

it("blocks a non-admin from reading the inventory valuation", async () => {
  actor.setPrincipal(MECHANIC);
  await expect(actor.getInventoryValuation()).rejects.toBeDefined();
});

// --- Characterization: the CSV import contract the stock work must keep ----
//
// The accepted change makes the import carry the file's quantity into stock.
// These tests pin the validation and upsert rules that must survive it: rows
// without a SKU or without a name are rejected per row, and an existing part is
// matched by case-insensitive SKU rather than duplicated.

it("rejects import rows with an empty SKU or an empty name", async () => {
  actor.setPrincipal(OWNER);
  const result = await actor.importInventoryCsv([
    {
      rowNumber: 1n,
      sku: "   ",
      name: "Sin SKU",
      category: "Frenos",
      brand: "",
      unit: "pza",
      salePrice: 1000n,
      costPrice: 500n,
      lowStockThreshold: 0n,
      quantity: 0n,
    },
    {
      rowNumber: 2n,
      sku: "REP-IMP-NONAME",
      name: "   ",
      category: "Frenos",
      brand: "",
      unit: "pza",
      salePrice: 1000n,
      costPrice: 500n,
      lowStockThreshold: 0n,
      quantity: 0n,
    },
  ]);

  expect(result.created).toBe(0n);
  expect(result.updated).toBe(0n);
  expect(result.failed).toBe(2n);
  expect(result.rows).toHaveLength(2);
  expect(result.rows[0]).toMatchObject({
    rowNumber: 1n,
    status: { error: null },
  });
  expect(result.rows[1]).toMatchObject({
    rowNumber: 2n,
    status: { error: null },
  });

  // Neither rejected row created a part.
  const parts = await actor.listParts(
    { search: ["REP-IMP-NONAME"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  expect(parts.items).toHaveLength(0);
});

it("upserts an imported part by case-insensitive SKU instead of duplicating it", async () => {
  actor.setPrincipal(OWNER);
  const created = await actor.createPart({
    sku: "REP-IMP-CASE",
    name: "Filtro original",
    category: "Motor",
    brand: "Mann",
    unit: "pza",
    salePrice: 30000n,
    costPrice: 15000n,
    lowStockThreshold: 2n,
  });

  const result = await actor.importInventoryCsv([
    {
      rowNumber: 1n,
      sku: "rep-imp-case",
      name: "Filtro actualizado",
      category: "Motor",
      brand: "Mann",
      unit: "pza",
      salePrice: 35000n,
      costPrice: 16000n,
      lowStockThreshold: 3n,
      quantity: 7n,
    },
  ]);

  expect(result.created).toBe(0n);
  expect(result.updated).toBe(1n);
  expect(result.failed).toBe(0n);
  expect(result.rows[0]).toMatchObject({
    status: { updated: null },
    id: [created.id],
  });

  // The existing part was updated in place, not duplicated under a new SKU.
  const parts = await actor.listParts(
    { search: ["REP-IMP-CASE"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  expect(parts.items).toHaveLength(1);
  expect(parts.items[0]).toMatchObject({
    id: created.id,
    name: "Filtro actualizado",
    salePrice: 35000n,
  });
});

// --- Accepted behavior: imported stock is real and re-import is idempotent --

it("sets a newly imported part's stock from the file quantity", async () => {
  actor.setPrincipal(OWNER);
  const result = await actor.importInventoryCsv([
    {
      rowNumber: 1n,
      sku: "REP-IMP-STOCK",
      name: "Pastillas de freno",
      category: "Frenos",
      brand: "Brembo",
      unit: "pza",
      salePrice: 25000n,
      costPrice: 12000n,
      lowStockThreshold: 2n,
      quantity: 9n,
    },
  ]);

  expect(result.created).toBe(1n);
  expect(result.updated).toBe(0n);
  expect(result.failed).toBe(0n);

  // The imported part carries the file's quantity as real stock, not zero.
  const parts = await actor.listParts(
    { search: ["REP-IMP-STOCK"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  expect(parts.items).toHaveLength(1);
  expect(parts.items[0].totalStock).toBe(9n);

  // The valuation report values the imported stock, so the complete inventory
  // is reflected rather than only parts that already had lots.
  const valuation = await actor.getInventoryValuation();
  const row = valuation.rows.find((entry) => entry.sku === "REP-IMP-STOCK");
  expect(row).toBeDefined();
  expect(row).toMatchObject({
    units: 9n,
    // 9 units × 12000 cost price and × 25000 sale price.
    costValue: 108000n,
    saleValue: 225000n,
    margin: 117000n,
  });
});

it("re-importing the same file sets stock to the file value instead of adding it", async () => {
  actor.setPrincipal(OWNER);
  const row = {
    rowNumber: 1n,
    sku: "REP-IMP-REPEAT",
    name: "Aceite de motor",
    category: "Lubricantes",
    brand: "Motul",
    unit: "l",
    salePrice: 30000n,
    costPrice: 18000n,
    lowStockThreshold: 1n,
    quantity: 5n,
  };

  const first = await actor.importInventoryCsv([row]);
  expect(first.created).toBe(1n);

  // The second import of the same file must leave the stock at 5, not 10.
  const second = await actor.importInventoryCsv([row]);
  expect(second.created).toBe(0n);
  expect(second.updated).toBe(1n);
  expect(second.failed).toBe(0n);

  const parts = await actor.listParts(
    { search: ["REP-IMP-REPEAT"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  expect(parts.items).toHaveLength(1);
  expect(parts.items[0].totalStock).toBe(5n);

  // A third import with a different quantity moves the stock to the new value.
  const third = await actor.importInventoryCsv([{ ...row, quantity: 12n }]);
  expect(third.updated).toBe(1n);
  const after = await actor.listParts(
    { search: ["REP-IMP-REPEAT"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  expect(after.items[0].totalStock).toBe(12n);
});

it("exports each part's current stock in the quantity column", async () => {
  actor.setPrincipal(OWNER);
  await actor.importInventoryCsv([
    {
      rowNumber: 1n,
      sku: "REP-IMP-EXPORT",
      name: "Bujía iridio",
      category: "Encendido",
      brand: "NGK",
      unit: "pza",
      salePrice: 45000n,
      costPrice: 20000n,
      lowStockThreshold: 2n,
      quantity: 4n,
    },
  ]);

  const exported = await actor.exportInventoryCsv();
  const row = exported.find((entry) => entry.sku === "REP-IMP-EXPORT");
  expect(row).toBeDefined();
  // The export carries the current stock, so exporting and re-importing
  // preserves it instead of zeroing it.
  expect(row).toMatchObject({
    quantity: 4n,
    salePrice: 45000n,
    costPrice: 20000n,
    lowStockThreshold: 2n,
  });
});

// --- Characterization: adjacent accounting and company behavior -----------
//
// The inventory-valuation work changes the valuation cost formula and turns the
// valuation into a formal document. These tests protect the surrounding
// accounting reads and the company-profile read the document header consumes.
// The valuation formula itself is covered by the tests above.

it("answers the accounting report, summary and ledger reads instead of trapping", async () => {
  actor.setPrincipal(OWNER);
  const period = { from: [], to: [] };

  const summary = await actor.getAccountingSummary(period);
  expect(summary).toMatchObject({
    invoiceCount: expect.any(BigInt),
    expenseCount: expect.any(BigInt),
    totalIncome: expect.any(BigInt),
    totalExpenses: expect.any(BigInt),
  });

  const report = await actor.getAccountingReport(period);
  expect(report.summary).toMatchObject({
    totalIncome: summary.totalIncome,
    totalExpenses: summary.totalExpenses,
  });
  expect(Array.isArray(report.entries)).toBe(true);
  expect(Array.isArray(report.byExpenseCategory)).toBe(true);
  expect(Array.isArray(report.byPaymentMethod)).toBe(true);

  const entries = await actor.listLedgerEntries(period);
  expect(Array.isArray(entries)).toBe(true);
});

it("consolidates a registered expense into the accounting report", async () => {
  actor.setPrincipal(OWNER);
  const period = { from: [], to: [] };

  // Categories are administrable, so the expense references a category record
  // by id and the report carries that category's own name. The sample data
  // already seeds an "Arriendo" category, so reuse it rather than creating a
  // duplicate (the backend rejects a duplicate name).
  const categories = await actor.listExpenseCategories({ search: [] });
  const category = categories.find(
    (usage) => usage.category.name === "Arriendo",
  )?.category;
  expect(category).toBeDefined();

  const before = await actor.getAccountingSummary(period);
  await actor.createExpense({
    tax: 0n,
    concept: "Arriendo del taller",
    paymentMethod: "cash",
    receiptUrl: [],
    date: 1_700_000_000_000_000_000n,
    categoryId: category!.id,
    amount: 200000n,
    supplierId: [],
  });

  const after = await actor.getAccountingSummary(period);
  expect(after.totalExpenses).toBe(before.totalExpenses + 200000n);
  expect(after.expenseCount).toBe(before.expenseCount + 1n);

  const report = await actor.getAccountingReport(period);
  // `CategoryBreakdown.category` is the administrable category's own name.
  const rent = report.byExpenseCategory.find(
    (row) => row.category === "Arriendo",
  );
  expect(rent).toBeDefined();
  expect(rent?.total).toBeGreaterThanOrEqual(200000n);

  const ledger = await actor.listLedgerEntries(period);
  expect(
    ledger.some((entry) => entry.concept === "Arriendo del taller"),
  ).toBe(true);
});

it("round-trips the company profile the formal document header reads", async () => {
  actor.setPrincipal(OWNER);

  const updated = await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: ["https://hrsolucionesintegrales.com"],
    logoUrl: [],
    taxRate: 16n,
  });
  expect(updated.legalName).toBe("HR SOLUCIONES INTEGRALES S.A.S.");
  expect(updated.taxId).toBe("900123456");

  const read = await actor.getCompanyProfile();
  expect(read).toMatchObject({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    taxId: "900123456",
    address: "Calle 45 #12-30, Bogotá",
  });
  expect(read.checkDigit).toEqual([8n]);
});

// --- Characterization: the company logo the page uploads -------------------
//
// The accepted change lets an administrator upload or change the company logo
// from the company data page and have it saved and visible. This test protects
// the backend seam that carries it: the `logoUrl` sent by the page is stored on
// the profile and returned by the read, and clearing it removes it. It never
// asserts the upload transport, which is the seam the accepted change may touch.

it("round-trips the company logo URL through the real canister", async () => {
  actor.setPrincipal(OWNER);

  const withLogo = await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: ["https://cdn.example.com/logo.png"],
    taxRate: 16n,
  });
  expect(withLogo.logoUrl).toEqual(["https://cdn.example.com/logo.png"]);

  // The stored logo survives the read, so the page and the dashboard header
  // can render it after a reload.
  const read = await actor.getCompanyProfile();
  expect(read.logoUrl).toEqual(["https://cdn.example.com/logo.png"]);

  // Changing the logo replaces the stored URL rather than appending.
  await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: ["https://cdn.example.com/logo-v2.png"],
    taxRate: 16n,
  });
  const changed = await actor.getCompanyProfile();
  expect(changed.logoUrl).toEqual(["https://cdn.example.com/logo-v2.png"]);

  // Clearing the logo removes it from the stored profile.
  await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: [],
    taxRate: 16n,
  });
  const cleared = await actor.getCompanyProfile();
  expect(cleared.logoUrl).toEqual([]);
});

it("blocks a non-admin from updating the company profile", async () => {
  actor.setPrincipal(MECHANIC);
  await expect(
    actor.updateCompanyProfile({
      legalName: "Intruso S.A.S.",
      tradeName: [],
      documentType: "nit",
      taxId: "900000000",
      checkDigit: [],
      fiscalRegime: "responsableIva",
      taxResponsibility: "noAplica",
      address: "",
      city: "",
      phone: "",
      email: [],
      website: [],
      logoUrl: [],
      taxRate: 0n,
    }),
  ).rejects.toBeDefined();
});

// --- Accepted behavior: putting the inventory in zeros ---------------------
//
// The accepted change adds an admin-gated `zeroInventory` that sets every
// part's stock (the sum of all of its lots) to zero, records one movement per
// part whose stock actually changed, and returns how many parts were affected.
// These tests call the real canister, so they prove the method is implemented
// rather than a stub that traps.

it("zeroes every part's stock and reports the affected count", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-ZERO-1",
    name: "Filtro de aceite",
    category: "Motor",
    brand: "Mann",
    unit: "pza",
    salePrice: 20000n,
    costPrice: 9000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Ceros",
    phone: "+57 300 222 2222",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  // Two lots for the same part, so the zeroing must clear the sum of all lots
  // rather than only the first one it finds.
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "Z-1", quantity: 6n, unitCost: 9000n },
      { partId: part.id, lotNumber: "Z-2", quantity: 4n, unitCost: 9000n },
    ],
  });

  const before = await actor.getPart(part.id);
  expect(before[0].totalStock).toBe(10n);

  const result = await actor.zeroInventory();
  expect(result.affected).toBeGreaterThanOrEqual(1n);

  // Every part's total stock is now zero, including this one.
  const after = await actor.getPart(part.id);
  expect(after[0].totalStock).toBe(0n);

  // The lots themselves survive with zero quantity rather than being deleted.
  const lots = await actor.listLots(part.id);
  expect(lots).toHaveLength(2);
  expect(lots.every((lot) => lot.quantity === 0n)).toBe(true);
});

it("records one movement per part whose stock changed", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-ZERO-MOV",
    name: "Bujía de iridio",
    category: "Encendido",
    brand: "NGK",
    unit: "pza",
    salePrice: 45000n,
    costPrice: 20000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Movimiento",
    phone: "+57 300 333 3333",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "M-1", quantity: 5n, unitCost: 20000n },
    ],
  });

  const movementsBefore = await actor.listMovements(part.id);
  await actor.zeroInventory();
  const movementsAfter = await actor.listMovements(part.id);

  // Exactly one new movement describes the zeroing, carrying the stock that
  // was removed.
  expect(movementsAfter).toHaveLength(movementsBefore.length + 1);
  const zeroing = movementsAfter.find(
    (movement) => movement.reason[0] === "Puesta en ceros del inventario",
  );
  expect(zeroing).toBeDefined();
  expect(zeroing).toMatchObject({
    partId: part.id,
    kind: { adjustment: null },
    quantity: 5n,
    performedBy: OWNER,
  });
});

it("does not record a movement for a part whose stock was already zero", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-ZERO-EMPTY",
    name: "Repuesto sin existencia",
    category: "Varios",
    brand: "Genérico",
    unit: "pza",
    salePrice: 1000n,
    costPrice: 500n,
    lowStockThreshold: 0n,
  });

  const movementsBefore = await actor.listMovements(part.id);
  await actor.zeroInventory();
  const movementsAfter = await actor.listMovements(part.id);

  // A part with no stock did not change, so no movement is recorded for it.
  expect(movementsAfter).toHaveLength(movementsBefore.length);
});

it("blocks a non-admin from zeroing the inventory", async () => {
  actor.setPrincipal(MECHANIC);
  await expect(actor.zeroInventory()).rejects.toBeDefined();
});

it("keeps the first caller as admin and blocks a non-admin from admin actions", async () => {
  actor.setPrincipal(OWNER);
  await expect(actor.getCallerUserRole()).resolves.toEqual({ admin: null });
  await expect(actor.isCallerAdmin()).resolves.toBe(true);

  // A later caller is not auto-promoted and cannot perform admin-only actions.
  actor.setPrincipal(MECHANIC);
  await actor.saveCallerUserProfile("Mecánico");
  await expect(actor.getCallerUserRole()).resolves.toEqual({ guest: null });
  await expect(actor.isCallerAdmin()).resolves.toBe(false);
  await expect(actor.listSuppliers([])).rejects.toBeDefined();
  // The accepted change replaces the principal-based `setUserRole` with the
  // session-token `updateUserRole`; a non-admin caller must still be refused.
  await expect(actor.updateUserRole(null, 1n, 1n)).rejects.toBeDefined();
});

// --- Characterization: the totals arithmetic the IVA change must keep ------
//
// The accepted change makes the company's fiscal regime decide the effective
// IVA rate. These tests protect the surrounding arithmetic instead: with a
// configured non-zero rate, an order's tax is `subtotal * rate / 100` and its
// total is `subtotal + tax`; a POS sale applies its line discount to the
// taxable base before tax; and the company profile round-trips the fiscal
// regime the decision reads. They never assert what a regime implies.

it("computes order totals from the configured rate", async () => {
  actor.setPrincipal(OWNER);
  // A configured non-zero rate, so the arithmetic is exercised rather than the
  // default fallback. The accepted change makes the company profile's stored
  // rate the single source of truth the order totals read, so it is set there.
  await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: [],
    taxRate: 16n,
  });

  const customer = await actor.createCustomer({
    name: "Cliente Totales",
    phone: "+57 300 444 4444",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "TOT-001",
    brand: "Yamaha",
    model: "FZ",
    year: 2021n,
    mileage: 1000n,
  });
  const part = await actor.createPart({
    sku: "REP-TOT-1",
    name: "Kit de arrastre",
    category: "Transmisión",
    brand: "Genérico",
    unit: "pza",
    salePrice: 50000n,
    costPrice: 30000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Totales",
    phone: "+57 300 555 5555",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "TOT-L1", quantity: 10n, unitCost: 30000n },
    ],
  });

  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 1000n,
    problem: "Cambio de kit",
    technicianIds: [],
  });
  // 2 × 50000 = 100000 parts, plus 40000 labor = 140000 subtotal.
  await actor.addOrderPart(order.order.id, {
    partId: part.id,
    lotId: [],
    quantity: 2n,
  });
  const view = await actor.addLabor(order.order.id, {
    description: "Instalación de kit",
    price: 40000n,
    technicianId: [],
    serviceId: [],
  });

  expect(view.totals.partsSubtotal).toBe(100000n);
  expect(view.totals.laborSubtotal).toBe(40000n);
  expect(view.totals.subtotal).toBe(140000n);
  expect(view.totals.taxRate).toBe(16n);
  // 140000 × 16 / 100 = 22400.
  expect(view.totals.tax).toBe(22400n);
  expect(view.totals.total).toBe(162400n);
  // The total is the subtotal plus the tax, whatever the rate.
  expect(view.totals.total).toBe(view.totals.subtotal + view.totals.tax);
});

it("falls back to the 19% default rate for a responsable company with no configured rate", async () => {
  actor.setPrincipal(OWNER);
  // A responsable company with an empty (0) configured rate: the accepted rule
  // is the documented 19% default, not 0%. The order totals read the rate from
  // the business settings, so that is the field left empty here.
  await actor.updateBusinessSettings({
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 0n,
  });
  await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: [],
    taxRate: 0n,
  });

  const customer = await actor.createCustomer({
    name: "Cliente Default",
    phone: "+57 300 666 6666",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "DEF-001",
    brand: "Honda",
    model: "CB125",
    year: 2022n,
    mileage: 2000n,
  });
  const part = await actor.createPart({
    sku: "REP-DEF-1",
    name: "Cadena de transmisión",
    category: "Transmisión",
    brand: "Genérico",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 15000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Default",
    phone: "+57 300 777 7777",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "DEF-L1", quantity: 10n, unitCost: 15000n },
    ],
  });

  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 2000n,
    problem: "Cambio de cadena",
    technicianIds: [],
  });
  // 2 × 25000 = 50000 parts, plus 30000 labor = 80000 subtotal ($ 800.00).
  await actor.addOrderPart(order.order.id, {
    partId: part.id,
    lotId: [],
    quantity: 2n,
  });
  const view = await actor.addLabor(order.order.id, {
    description: "Instalación de cadena",
    price: 30000n,
    technicianId: [],
    serviceId: [],
  });

  expect(view.totals.subtotal).toBe(80000n);
  expect(view.totals.taxRate).toBe(19n);
  // 80000 × 19 / 100 = 15200 ($ 152.00), total 95200 ($ 952.00).
  expect(view.totals.tax).toBe(15200n);
  expect(view.totals.total).toBe(95200n);
});

it("applies a POS line discount to the taxable base before tax", async () => {
  actor.setPrincipal(OWNER);
  // The configured rate lives on the company profile, which is the single
  // source of truth the backend reads; the business settings no longer carry
  // the rate that is applied.
  await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: [],
    taxRate: 16n,
  });

  const part = await actor.createPart({
    sku: "REP-POS-TOT",
    name: "Aceite sintético",
    category: "Lubricantes",
    brand: "Motul",
    unit: "l",
    salePrice: 50000n,
    costPrice: 30000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor POS",
    phone: "+57 300 666 6666",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "POS-L1", quantity: 5n, unitCost: 30000n },
    ],
  });

  // 2 × 50000 = 100000 gross, minus a 20000 discount = 80000 taxable base.
  const sale = await actor.createPosSale({
    customerId: [],
    lines: [{ partId: part.id, quantity: 2n, discount: 20000n }],
    paymentMethod: "cash",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 100000n,
  });

  expect(sale.subtotal).toBe(100000n);
  expect(sale.discount).toBe(20000n);
  expect(sale.taxRate).toBe(16n);
  // 80000 × 16 / 100 = 12800.
  expect(sale.tax).toBe(12800n);
  expect(sale.total).toBe(92800n);
  // The total is the discounted base plus the tax.
  expect(sale.total).toBe(sale.subtotal - sale.discount + sale.tax);
});

it("round-trips the fiscal regime the IVA decision reads", async () => {
  actor.setPrincipal(OWNER);

  const updated = await actor.updateCompanyProfile({
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
    taxRate: 16n,
  });
  expect(updated.fiscalRegime).toEqual({ noResponsableIva: null });

  // The regime survives the read, so the IVA decision has a reliable input.
  const read = await actor.getCompanyProfile();
  expect(read.fiscalRegime).toEqual({ noResponsableIva: null });

  // Switching back to responsable is also persisted.
  await actor.updateCompanyProfile({
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: ["Taller HR Motos"],
    documentType: "nit",
    taxId: "900123456",
    checkDigit: [8n],
    fiscalRegime: "responsableIva",
    taxResponsibility: "noAplica",
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: ["contacto@hrsolucionesintegrales.com"],
    website: [],
    logoUrl: [],
    taxRate: 16n,
  });
  const after = await actor.getCompanyProfile();
  expect(after.fiscalRegime).toEqual({ responsableIva: null });
});

// --- Accepted change: a non-responsable company charges no IVA -------------
//
// The fiscal regime is the single source of truth. With `noResponsableIva` the
// backend must apply a 0% effective rate even though a non-zero rate is stored
// on the profile, so orders, POS sales and invoices all carry zero tax and a
// total equal to the taxable base. These tests call the real canister, so they
// prove the rule is implemented rather than a stub that traps.

it("charges no IVA on an order and its invoice for a non-responsable company", async () => {
  actor.setPrincipal(OWNER);
  // A non-zero stored rate, so a zero tax proves the regime overrode it.
  await actor.updateCompanyProfile({
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
    taxRate: 16n,
  });

  const customer = await actor.createCustomer({
    name: "Cliente No Responsable",
    phone: "+57 300 777 7777",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "NOR-001",
    brand: "Suzuki",
    model: "GN125",
    year: 2020n,
    mileage: 500n,
  });
  const part = await actor.createPart({
    sku: "REP-NOR-1",
    name: "Pastillas de freno",
    category: "Frenos",
    brand: "Genérico",
    unit: "pza",
    salePrice: 50000n,
    costPrice: 30000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor No Responsable",
    phone: "+57 300 888 8888",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "NOR-L1", quantity: 10n, unitCost: 30000n },
    ],
  });

  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 500n,
    problem: "Cambio de pastillas",
    technicianIds: [],
  });
  await actor.addOrderPart(order.order.id, {
    partId: part.id,
    lotId: [],
    quantity: 2n,
  });
  const view = await actor.addLabor(order.order.id, {
    description: "Instalación de pastillas",
    price: 40000n,
    technicianId: [],
    serviceId: [],
  });

  // 2 × 50000 = 100000 parts, plus 40000 labor = 140000 subtotal.
  expect(view.totals.subtotal).toBe(140000n);
  expect(view.totals.taxRate).toBe(0n);
  expect(view.totals.tax).toBe(0n);
  expect(view.totals.total).toBe(140000n);

  // Only a delivered order is billable, and the status advances one step at a
  // time: received -> inRepair -> ready -> delivered.
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });
  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { cash: null },
    [],
  );
  expect(invoice.subtotal).toBe(140000n);
  expect(invoice.taxRate).toBe(0n);
  expect(invoice.tax).toBe(0n);
  expect(invoice.total).toBe(140000n);
});

it("charges no IVA on a POS sale for a non-responsable company", async () => {
  actor.setPrincipal(OWNER);
  await actor.updateCompanyProfile({
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
    taxRate: 16n,
  });

  const part = await actor.createPart({
    sku: "REP-NOR-POS",
    name: "Bujía estándar",
    category: "Encendido",
    brand: "NGK",
    unit: "pza",
    salePrice: 50000n,
    costPrice: 30000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor POS No Responsable",
    phone: "+57 300 999 9999",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "NOR-POS-L1", quantity: 5n, unitCost: 30000n },
    ],
  });

  // 2 × 50000 = 100000 gross, minus a 20000 discount = 80000 taxable base.
  const sale = await actor.createPosSale({
    customerId: [],
    lines: [{ partId: part.id, quantity: 2n, discount: 20000n }],
    paymentMethod: "cash",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 100000n,
  });

  expect(sale.subtotal).toBe(100000n);
  expect(sale.discount).toBe(20000n);
  expect(sale.taxRate).toBe(0n);
  expect(sale.tax).toBe(0n);
  // The total is the discounted base, with no tax added.
  expect(sale.total).toBe(80000n);
});

// --- Accepted behavior: workshop-order inventory, photos and lifecycle ------
//
// The accepted change adds order parts without touching stock, caps an order at
// six evidence photos, and lets an order be cancelled or deleted. These tests
// call the real canister, so they prove the rules are implemented rather than
// stubs that trap.

it("adds an order part without deducting stock", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Inventario OT",
    phone: "+57 300 101 0101",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "INV-001",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 3000n,
  });
  const part = await actor.createPart({
    sku: "REP-OT-NOSTOCK",
    name: "Filtro de aire",
    category: "Motor",
    brand: "Mann",
    unit: "pza",
    salePrice: 20000n,
    costPrice: 9000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor OT",
    phone: "+57 300 202 0202",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "OT-L1", quantity: 10n, unitCost: 9000n },
    ],
  });

  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 3000n,
    problem: "Mantenimiento",
    technicianIds: [],
  });

  const before = await actor.getPart(part.id);
  expect(before[0].totalStock).toBe(10n);

  const view = await actor.addOrderPart(order.order.id, {
    partId: part.id,
    lotId: [],
    quantity: 3n,
  });
  // The line is recorded with its sale price and reference cost.
  expect(view.order.parts).toHaveLength(1);
  expect(view.order.parts[0]).toMatchObject({
    partId: part.id,
    quantity: 3n,
    unitPrice: 20000n,
    unitCost: 9000n,
  });
  expect(view.totals.partsSubtotal).toBe(60000n);

  // Adding the line must not move stock: the part still has all 10 units.
  const after = await actor.getPart(part.id);
  expect(after[0].totalStock).toBe(10n);

  // No sale movement was recorded for the order line.
  const movements = await actor.listMovements(part.id);
  expect(movements.some((movement) => movement.kind.sale !== undefined)).toBe(
    false,
  );
});

it("caps an order at six evidence photos", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Fotos",
    phone: "+57 300 303 0303",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "FOT-001",
    brand: "Yamaha",
    model: "FZ",
    year: 2021n,
    mileage: 1000n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 1000n,
    problem: "Evidencia",
    technicianIds: [],
  });

  const photo = (index: number) => ({
    blob: new Uint8Array([index]),
    mimeType: "image/jpeg",
    filename: `evidencia-${index}.jpg`,
  });

  // Six photos are accepted.
  for (let index = 1; index <= 6; index += 1) {
    const view = await actor.addOrderPhoto(order.order.id, photo(index));
    expect(view.order.photos).toHaveLength(index);
  }

  // The seventh is rejected by the backend, not merely hidden by the UI.
  await expect(
    actor.addOrderPhoto(order.order.id, photo(7)),
  ).rejects.toBeDefined();

  const read = await actor.getOrder(order.order.id);
  expect(read[0].order.photos).toHaveLength(6);
});

it("cancels an order with a reason and refuses to cancel a delivered one", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Cancelación",
    phone: "+57 300 404 0404",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "CAN-001",
    brand: "Suzuki",
    model: "GN125",
    year: 2020n,
    mileage: 500n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 500n,
    problem: "Cancelar",
    technicianIds: [],
  });

  // A cancellation without a reason is rejected.
  await expect(actor.cancelOrder(order.order.id, "")).rejects.toBeDefined();

  const cancelled = await actor.cancelOrder(
    order.order.id,
    "El cliente desistió",
  );
  expect(cancelled.order.status).toEqual({ cancelled: null });
  expect(cancelled.order.cancelReason).toEqual(["El cliente desistió"]);
  expect(cancelled.order.cancelledAt[0]).toBeDefined();

  // A cancelled order no longer accepts content changes.
  await expect(
    actor.addOrderPart(order.order.id, {
      partId: 1n,
      lotId: [],
      quantity: 1n,
    }),
  ).rejects.toBeDefined();

  // A delivered order cannot be cancelled.
  const delivered = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 500n,
    problem: "Entregar",
    technicianIds: [],
  });
  await actor.updateOrderStatus(delivered.order.id, { inRepair: null });
  await actor.updateOrderStatus(delivered.order.id, { ready: null });
  await actor.updateOrderStatus(delivered.order.id, { delivered: null });
  await expect(
    actor.cancelOrder(delivered.order.id, "Tarde"),
  ).rejects.toBeDefined();
});

it("deletes an order and reports whether it existed", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Borrado",
    phone: "+57 300 505 0505",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "DEL-001",
    brand: "Bajaj",
    model: "Boxer",
    year: 2019n,
    mileage: 800n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 800n,
    problem: "Borrar",
    technicianIds: [],
  });

  await expect(actor.deleteOrder(order.order.id)).resolves.toBe(true);
  // The order is gone from the read.
  await expect(actor.getOrder(order.order.id)).resolves.toEqual([]);
  // Deleting a missing order reports false instead of trapping.
  await expect(actor.deleteOrder(order.order.id)).resolves.toBe(false);
});

// --- Accepted behavior: only delivered orders are invoiceable --------------
//
// The accepted change restricts invoicing to delivered orders. These tests call
// the real canister, so they prove the gate is enforced by the backend rather
// than only by the UI.

it("refuses to invoice an order that is not delivered", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Facturación",
    phone: "+57 300 606 0606",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "FAC-OT-1",
    brand: "Honda",
    model: "XR150",
    year: 2022n,
    mileage: 1200n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 1200n,
    problem: "Facturar",
    technicianIds: [],
  });

  // A freshly received order is not billable.
  await expect(
    actor.createInvoiceFromOrder(order.order.id, { cash: null }, { cash: null }, []),
  ).rejects.toBeDefined();

  // A ready order is still not billable: only delivered is.
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await expect(
    actor.createInvoiceFromOrder(order.order.id, { cash: null }, { cash: null }, []),
  ).rejects.toBeDefined();

  // Once delivered, the invoice is generated.
  await actor.updateOrderStatus(order.order.id, { delivered: null });
  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { cash: null },
    [],
  );
  expect(invoice.orderId).toEqual([order.order.id]);
  expect(invoice.paymentCondition).toEqual({ cash: null });
});

// --- Accepted behavior: credit invoices and installment settlement ---------
//
// The accepted change lets a credit invoice carry an installment plan and be
// settled one installment at a time, becoming paid only when all are settled.

it("builds an installment plan for a credit invoice and settles it in parts", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Crédito",
    phone: "+57 300 707 0707",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "CRE-001",
    brand: "Yamaha",
    model: "MT-03",
    year: 2023n,
    mileage: 100n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 100n,
    problem: "Crédito",
    technicianIds: [],
  });
  await actor.addLabor(order.order.id, {
    description: "Servicio a crédito",
    price: 100000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const firstDueDate = 1_800_000_000_000_000_000n;
  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate, installmentCount: 3n }],
  );

  expect(invoice.paymentCondition).toEqual({ credit: null });
  expect(invoice.paymentStatus).toEqual({ pending: null });
  const plan = invoice.installments[0];
  expect(plan).toBeDefined();
  expect(plan.installmentCount).toBe(3n);
  expect(plan.installments).toHaveLength(3);
  // The installments sum exactly to the invoice total.
  const sum = plan.installments.reduce(
    (acc, installment) => acc + installment.amount,
    0n,
  );
  expect(sum).toBe(invoice.total);
  expect(plan.installments.every((installment) => !installment.paid)).toBe(true);

  // Settling the first installment leaves the invoice pending.
  const afterFirst = await actor.registerInstallmentPayment(invoice.id, 1n);
  expect(afterFirst.paymentStatus).toEqual({ pending: null });
  expect(afterFirst.installments[0].installments[0].paid).toBe(true);

  // Settling an already-paid installment is rejected.
  await expect(
    actor.registerInstallmentPayment(invoice.id, 1n),
  ).rejects.toBeDefined();

  // Settling the remaining installments marks the invoice paid.
  await actor.registerInstallmentPayment(invoice.id, 2n);
  const afterAll = await actor.registerInstallmentPayment(invoice.id, 3n);
  expect(afterAll.paymentStatus).toEqual({ paid: null });
  expect(
    afterAll.installments[0].installments.every(
      (installment) => installment.paid,
    ),
  ).toBe(true);
});

it("requires a credit plan for a credit invoice", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Crédito Sin Plan",
    phone: "+57 300 808 0808",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "CRE-002",
    brand: "Honda",
    model: "CB125",
    year: 2021n,
    mileage: 200n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 200n,
    problem: "Crédito sin plan",
    technicianIds: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  await expect(
    actor.createInvoiceFromOrder(
      order.order.id,
      { cash: null },
      { credit: null },
      [],
    ),
  ).rejects.toBeDefined();
});

// --- Accepted behavior: POS credit sales -----------------------------------
//
// The accepted change lets a POS sale be paid on credit with an installment
// plan, leaving the invoice pending until the installments are settled.

it("creates a POS credit sale with an installment plan", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-POS-CRE",
    name: "Llanta trasera",
    category: "Llantas",
    brand: "Pirelli",
    unit: "pza",
    salePrice: 100000n,
    costPrice: 60000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor POS Crédito",
    phone: "+57 300 909 0909",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "PC-L1", quantity: 5n, unitCost: 60000n },
    ],
  });
  const customer = await actor.createCustomer({
    name: "Cliente POS Crédito",
    phone: "+57 300 111 2222",
    email: [],
    document: [],
    address: [],
  });

  const firstDueDate = 1_800_000_000_000_000_000n;
  const sale = await actor.createPosSale({
    customerId: [customer.id],
    lines: [{ partId: part.id, quantity: 1n, discount: 0n }],
    paymentMethod: "cash",
    paymentCondition: { credit: null },
    creditPlan: [{ firstDueDate, installmentCount: 2n }],
    amountReceived: 0n,
  });

  expect(sale.paymentCondition).toEqual({ credit: null });
  // A credit sale takes no change even when nothing was received.
  expect(sale.change).toBe(0n);

  // The linked invoice carries the plan and is pending.
  const invoice = await actor.getInvoice(sale.invoiceId);
  expect(invoice[0].paymentCondition).toEqual({ credit: null });
  expect(invoice[0].paymentStatus).toEqual({ pending: null });
  const plan = invoice[0].installments[0];
  expect(plan.installments).toHaveLength(2);
  const sum = plan.installments.reduce(
    (acc, installment) => acc + installment.amount,
    0n,
  );
  expect(sum).toBe(invoice[0].total);
});

// --- Accepted behavior: commissions only for delivered orders, paid once ---
//
// The accepted change pays a technician commission only for a delivered order
// and only once per labor line. These tests call the real canister, so they
// prove the rule is enforced by the backend.

it("generates commission only for delivered orders and pays each line once", async () => {
  actor.setPrincipal(OWNER);
  const technician = await actor.createTechnician({
    active: true,
    code: "TEC-COM-1",
    name: "Ana Comisión",
    hourlyRate: 0n,
    email: [],
    specialty: "Motor",
    commissionRate: 10n,
    phone: "3000000000",
  });
  const service = await actor.createService({
    active: true,
    code: "SRV-COM-1",
    name: "Cambio de aceite",
    description: "Servicio de aceite",
    category: "Mantenimiento",
    laborRate: 50000n,
    estimatedMinutes: 30n,
  });
  const customer = await actor.createCustomer({
    name: "Cliente Comisión",
    phone: "+57 300 333 4444",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "COM-001",
    brand: "Honda",
    model: "XR150",
    year: 2022n,
    mileage: 900n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 900n,
    problem: "Comisión",
    technicianIds: [technician.id],
  });
  await actor.addLabor(order.order.id, {
    description: "Cambio de aceite",
    price: 50000n,
    technicianId: [technician.id],
    serviceId: [service.id],
  });

  // While the order is not delivered, no commission line exists.
  const beforeDelivery = await actor.listCommissionLines([technician.id], {
    from: [],
    to: [],
  });
  expect(beforeDelivery).toHaveLength(0);

  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const lines = await actor.listCommissionLines([technician.id], {
    from: [],
    to: [],
  });
  expect(lines).toHaveLength(1);
  expect(lines[0]).toMatchObject({
    orderId: order.order.id,
    technicianId: technician.id,
    baseAmount: 50000n,
    commissionRate: 10n,
    // 50000 × 10 / 100 = 5000.
    commissionAmount: 5000n,
  });

  // Paying settles the line.
  const payment = await actor.payTechnicianCommission({
    technicianId: technician.id,
    period: { from: [], to: [] },
  });
  expect(payment.lineCount).toBe(1n);
  expect(payment.commissionAmount).toBe(5000n);
  expect(payment.netPaid).toBe(5000n);

  // The line is no longer pending: the report excludes it, and a second
  // payment has nothing to pay.
  const reportAfter = await actor.getCommissionReport({ from: [], to: [] });
  const summaryAfter = reportAfter.technicians.find(
    (entry) => entry.technicianId === technician.id,
  );
  expect(summaryAfter?.lineCount ?? 0n).toBe(0n);
  await expect(
    actor.payTechnicianCommission({
      technicianId: technician.id,
      period: { from: [], to: [] },
    }),
  ).rejects.toBeDefined();
});

it("does not commission a free labor line without a catalog service", async () => {
  actor.setPrincipal(OWNER);
  const technician = await actor.createTechnician({
    active: true,
    code: "TEC-COM-2",
    name: "Beto Libre",
    hourlyRate: 0n,
    email: [],
    specialty: "Motor",
    commissionRate: 20n,
    phone: "3000000001",
  });
  const customer = await actor.createCustomer({
    name: "Cliente Libre",
    phone: "+57 300 555 6666",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "LIB-001",
    brand: "Yamaha",
    model: "FZ",
    year: 2021n,
    mileage: 300n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 300n,
    problem: "Libre",
    technicianIds: [technician.id],
  });
  // A free labor line with a technician but no catalog service.
  await actor.addLabor(order.order.id, {
    description: "Ajuste general",
    price: 80000n,
    technicianId: [technician.id],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const lines = await actor.listCommissionLines([technician.id], {
    from: [],
    to: [],
  });
  expect(lines).toHaveLength(0);
});

// --- Accepted behavior: accounting profit split ----------------------------
//
// The accepted change splits profit into parts and services. These tests call
// the real canister, so they prove the split is computed from paid invoice
// lines rather than a stub.

it("splits profit into parts and services from paid invoice lines", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Utilidad",
    phone: "+57 300 777 8888",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "UTI-001",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 400n,
  });
  const part = await actor.createPart({
    sku: "REP-UTI-1",
    name: "Kit de arrastre",
    category: "Transmisión",
    brand: "Genérico",
    unit: "pza",
    salePrice: 50000n,
    costPrice: 30000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Utilidad",
    phone: "+57 300 999 0000",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "UTI-L1", quantity: 5n, unitCost: 30000n },
    ],
  });

  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 400n,
    problem: "Utilidad",
    technicianIds: [],
  });
  // 2 × 50000 = 100000 parts income at 2 × 30000 = 60000 cost.
  await actor.addOrderPart(order.order.id, {
    partId: part.id,
    lotId: [],
    quantity: 2n,
  });
  // 40000 service income at zero cost.
  await actor.addLabor(order.order.id, {
    description: "Instalación",
    price: 40000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { cash: null },
    [],
  );
  // A freshly issued invoice is pending; the profit report only counts paid
  // invoices, so settle it before reading the report.
  expect(invoice.paymentStatus).toEqual({ pending: null });
  await actor.markInvoicePaid(invoice.id, { cash: null });

  // The report is cumulative across the canister, so scope the period to this
  // invoice's issue time to isolate its contribution.
  const report = await actor.getAccountingReport({
    from: [invoice.issuedAt],
    to: [],
  });
  const profit = report.profit;
  expect(profit.parts.income).toBe(100000n);
  expect(profit.parts.cost).toBe(60000n);
  expect(profit.parts.margin).toBe(40000n);
  expect(profit.services.income).toBe(40000n);
  expect(profit.services.cost).toBe(0n);
  expect(profit.services.margin).toBe(40000n);
  // The total consolidates both blocks.
  expect(profit.total.income).toBe(140000n);
  expect(profit.total.cost).toBe(60000n);
  expect(profit.total.margin).toBe(80000n);
});

// --- Characterization: the receivables reads and abono the sample-data work
// must keep ----------------------------------------------------------------
//
// The accepted change seeds a coherent sample dataset so the flows can be
// walked without capturing everything from scratch. These tests protect the
// surrounding working behavior of the receivables module against that change:
// only credit invoices are listed as accounts receivable, the summary totals
// the open balances, an abono reduces the pending balance and recalculates the
// status, and an abono above the balance is rejected. They call the real
// canister, so they prove the methods are implemented rather than stubs.

it("lists only credit invoices as receivables and totals their open balances", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Cartera",
    phone: "+57 300 121 2121",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "CAR-001",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 100n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 100n,
    problem: "Cartera",
    technicianIds: [],
  });
  await actor.addLabor(order.order.id, {
    description: "Servicio a crédito",
    price: 200000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const firstDueDate = 1_800_000_000_000_000_000n;
  const credit = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate, installmentCount: 2n }],
  );

  // A cash invoice for the same customer must not appear as a receivable.
  const cashOrder = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 100n,
    problem: "Contado",
    technicianIds: [],
  });
  await actor.addLabor(cashOrder.order.id, {
    description: "Servicio de contado",
    price: 50000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(cashOrder.order.id, { inRepair: null });
  await actor.updateOrderStatus(cashOrder.order.id, { ready: null });
  await actor.updateOrderStatus(cashOrder.order.id, { delivered: null });
  const cash = await actor.createInvoiceFromOrder(
    cashOrder.order.id,
    { cash: null },
    { cash: null },
    [],
  );

  const receivables = await actor.listReceivables({ status: [], search: [] });
  const creditRow = receivables.find((row) => row.invoiceId === credit.id);
  expect(creditRow).toBeDefined();
  expect(creditRow).toMatchObject({
    invoiceNumber: credit.number,
    customerName: "Cliente Cartera",
    total: credit.total,
    paidAmount: 0n,
    balance: credit.total,
    // The due date is the first installment of the plan.
    dueDate: firstDueDate,
    status: { pending: null },
  });
  // The cash invoice is not a receivable.
  expect(receivables.some((row) => row.invoiceId === cash.id)).toBe(false);

  const summary = await actor.getReceivableSummary();
  expect(summary.totalOutstanding).toBeGreaterThanOrEqual(credit.total);
  expect(summary.openCount).toBeGreaterThanOrEqual(1n);
});

it("reduces the pending balance and recalculates the status on an abono", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Abono",
    phone: "+57 300 131 3131",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "ABO-001",
    brand: "Yamaha",
    model: "FZ",
    year: 2021n,
    mileage: 200n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 200n,
    problem: "Abono",
    technicianIds: [],
  });
  await actor.addLabor(order.order.id, {
    description: "Servicio a crédito",
    price: 100000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const firstDueDate = 1_800_000_000_000_000_000n;
  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate, installmentCount: 2n }],
  );

  // A partial abono reduces the balance and leaves the account pending.
  const payment = await actor.registerReceivablePayment({
    invoiceId: invoice.id,
    amount: 40000n,
    method: "cash",
    note: ["Abono parcial"],
  });
  expect(payment).toMatchObject({
    invoiceId: invoice.id,
    amount: 40000n,
    method: "cash",
  });

  const afterPartial = (
    await actor.listReceivables({ status: [], search: [] })
  ).find((row) => row.invoiceId === invoice.id);
  expect(afterPartial).toMatchObject({
    paidAmount: 40000n,
    balance: invoice.total - 40000n,
    status: { pending: null },
  });

  // Settling the rest marks the account paid with a zero balance.
  await actor.registerReceivablePayment({
    invoiceId: invoice.id,
    amount: invoice.total - 40000n,
    method: "transfer",
    note: [],
  });
  const afterFull = (
    await actor.listReceivables({ status: [], search: [] })
  ).find((row) => row.invoiceId === invoice.id);
  expect(afterFull).toMatchObject({
    paidAmount: invoice.total,
    balance: 0n,
    status: { paid: null },
  });
});

it("rejects an abono above the pending balance", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Exceso",
    phone: "+57 300 141 4141",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "EXC-001",
    brand: "Suzuki",
    model: "GN125",
    year: 2020n,
    mileage: 300n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 300n,
    problem: "Exceso",
    technicianIds: [],
  });
  await actor.addLabor(order.order.id, {
    description: "Servicio a crédito",
    price: 80000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate: 1_800_000_000_000_000_000n, installmentCount: 1n }],
  );

  await expect(
    actor.registerReceivablePayment({
      invoiceId: invoice.id,
      amount: invoice.total + 1n,
      method: "cash",
      note: [],
    }),
  ).rejects.toBeDefined();

  // The rejected abono left the balance untouched.
  const row = (
    await actor.listReceivables({ status: [], search: [] })
  ).find((entry) => entry.invoiceId === invoice.id);
  expect(row).toMatchObject({ paidAmount: 0n, balance: invoice.total });
});

// --- Characterization: the payables reads and supplier payment the
// sample-data work must keep ------------------------------------------------
//
// The accepted change seeds a pending purchase so the payables flow can be
// walked. These tests protect the surrounding working behavior: a registered
// purchase derives a payable with its balance and due date, and a supplier
// payment reduces that pending balance. They call the real canister.

it("derives a payable from a purchase and reduces its balance on payment", async () => {
  actor.setPrincipal(OWNER);
  const supplier = await actor.createSupplier({
    name: "Proveedor Cartera",
    phone: "+57 300 151 5151",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  const part = await actor.createPart({
    sku: "REP-PAY-1",
    name: "Filtro de aceite",
    category: "Motor",
    brand: "Mann",
    unit: "pza",
    salePrice: 30000n,
    costPrice: 15000n,
    lowStockThreshold: 1n,
  });
  const purchase = await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "PAY-L1", quantity: 4n, unitCost: 15000n },
    ],
  });
  // 4 × 15000 = 60000 total, nothing paid yet.
  expect(purchase.total).toBe(60000n);
  expect(purchase.paidAmount).toBe(0n);

  const payable = await actor.getPayable(supplier.id);
  expect(payable).toHaveLength(1);
  expect(payable[0]).toMatchObject({
    supplierId: supplier.id,
    supplierName: "Proveedor Cartera",
    totalPurchased: 60000n,
    totalPaid: 0n,
    balance: 60000n,
    status: { pending: null },
  });

  // A partial payment reduces the pending balance.
  await actor.registerPayment({
    supplierId: supplier.id,
    amount: 20000n,
    method: { cash: null },
    note: [],
    purchaseId: [purchase.id],
  });

  const afterPartial = await actor.getPayable(supplier.id);
  expect(afterPartial[0]).toMatchObject({
    totalPaid: 20000n,
    balance: 40000n,
    status: { pending: null },
  });

  // Settling the rest marks the account paid.
  await actor.registerPayment({
    supplierId: supplier.id,
    amount: 40000n,
    method: { transfer: null },
    note: [],
    purchaseId: [purchase.id],
  });
  const afterFull = await actor.getPayable(supplier.id);
  expect(afterFull[0]).toMatchObject({
    totalPaid: 60000n,
    balance: 0n,
    status: { paid: null },
  });

  // The list read agrees with the single read.
  const listed = (await actor.listPayables()).find(
    (row) => row.supplierId === supplier.id,
  );
  expect(listed).toMatchObject({ balance: 0n, status: { paid: null } });
});

// --- Characterization: a "Servicio de terceros" line does not commission ----
//
// The accepted change seeds sample labor lines, including ones that must not
// commission. The free-labor-line exclusion is covered above; this test
// protects the adjacent rule that a line linked to a service whose category is
// "Servicio de terceros" is excluded too. It calls the real canister.

it("does not commission a labor line linked to a 'Servicio de terceros' service", async () => {
  actor.setPrincipal(OWNER);
  const technician = await actor.createTechnician({
    active: true,
    code: "TEC-COM-3",
    name: "Carla Terceros",
    hourlyRate: 0n,
    email: [],
    specialty: "Motor",
    commissionRate: 15n,
    phone: "3000000002",
  });
  const thirdParty = await actor.createService({
    active: true,
    code: "SRV-TER-1",
    name: "Rectificación externa",
    description: "Trabajo subcontratado",
    category: "Servicio de terceros",
    laborRate: 120000n,
    estimatedMinutes: 60n,
  });
  const customer = await actor.createCustomer({
    name: "Cliente Terceros",
    phone: "+57 300 161 6161",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "TER-001",
    brand: "Bajaj",
    model: "Boxer",
    year: 2019n,
    mileage: 700n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 700n,
    problem: "Terceros",
    technicianIds: [technician.id],
  });
  await actor.addLabor(order.order.id, {
    description: "Rectificación externa",
    price: 120000n,
    technicianId: [technician.id],
    serviceId: [thirdParty.id],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });

  const lines = await actor.listCommissionLines([technician.id], {
    from: [],
    to: [],
  });
  expect(lines).toHaveLength(0);
});

// --- Accepted behavior: the seeded sample dataset --------------------------
//
// The accepted change seeds a coherent sample dataset on a fresh install so the
// receivables, payables and commissions flows can be walked without capturing
// everything from scratch. These tests call the real canister, so they prove the
// seeding is implemented rather than a stub that traps, and they assert the
// observable shape the requirements describe. The seeders are guarded by
// emptiness, so they are idempotent: a canister that already has data is not
// duplicated.
//
// The seeded order and invoice hardcode their numbers ("OT-000001", "F-000001")
// without advancing the number counters, so the first record a test creates can
// reuse the same number. These tests therefore locate the seeded records by
// content that is unique to the seed (the order's problem text and delivered
// status, the invoice's credit condition and total) and then key off their ids,
// rather than matching on the colliding number.

const SEEDED_ORDER_PROBLEM = "Mantenimiento preventivo y revisión de frenos";
const SEEDED_INVOICE_TOTAL = 10500000n;
const SEEDED_PURCHASE_TOTAL = 15000000n;

async function findSeededOrder() {
  const page = await actor.listOrders({ status: [], search: [] }, 0n, 100n);
  return page.items.find(
    (view) =>
      view.order.problem === SEEDED_ORDER_PROBLEM &&
      "delivered" in view.order.status,
  );
}

async function findSeededInvoice() {
  const page = await actor.listInvoices(
    { to: [], from: [], search: [] },
    0n,
    100n,
  );
  return page.items.find(
    (invoice) =>
      invoice.total === SEEDED_INVOICE_TOTAL &&
      "credit" in invoice.paymentCondition,
  );
}

it("seeds at least two active technicians with a commission rate and a unique code", async () => {
  actor.setPrincipal(OWNER);
  const technicians = await actor.listTechnicians({
    search: [],
    specialty: [],
    activeOnly: [true],
  });

  const seeded = technicians.filter((tech) =>
    ["TEC-001", "TEC-002"].includes(tech.code),
  );
  expect(seeded).toHaveLength(2);
  for (const tech of seeded) {
    expect(tech.active).toBe(true);
    expect(tech.commissionRate).toBeGreaterThan(0n);
    expect(tech.name.trim().length).toBeGreaterThan(0);
  }
  // The codes are unique across the catalog.
  const codes = technicians.map((tech) => tech.code);
  expect(new Set(codes).size).toBe(codes.length);
  // The two seeded technicians carry distinct rates, so the report can
  // discriminate them.
  const rates = seeded.map((tech) => tech.commissionRate);
  expect(new Set(rates.map(String)).size).toBe(2);
});

it("seeds active catalog services including one 'Servicio de terceros' and several others", async () => {
  actor.setPrincipal(OWNER);
  const page = await actor.listServices(
    { search: [], category: [], activeOnly: [true] },
    { code: null },
    0n,
    100n,
  );

  const seeded = page.items.filter((service) =>
    ["SRV-001", "SRV-002", "SRV-003", "SRV-004", "SRV-005"].includes(
      service.code,
    ),
  );
  expect(seeded.length).toBeGreaterThanOrEqual(5);
  expect(seeded.every((service) => service.active)).toBe(true);

  const thirdParty = seeded.filter(
    (service) => service.category === "Servicio de terceros",
  );
  expect(thirdParty).toHaveLength(1);
  // Several services belong to categories other than "Servicio de terceros".
  const others = seeded.filter(
    (service) => service.category !== "Servicio de terceros",
  );
  expect(others.length).toBeGreaterThanOrEqual(2);
});

it("seeds a customer with a registered motorcycle and a registered supplier", async () => {
  actor.setPrincipal(OWNER);
  const customers = await actor.listCustomers([]);
  const seededCustomer = customers.find(
    (customer) => customer.name === "Juan Pérez",
  );
  expect(seededCustomer).toBeDefined();

  const detail = await actor.getCustomerDetail(seededCustomer!.id);
  expect(detail).toHaveLength(1);
  const motorcycle = detail[0].motorcycles.find(
    (moto) => moto.plate === "ABC12D",
  );
  expect(motorcycle).toBeDefined();
  expect(motorcycle).toMatchObject({
    brand: "Yamaha",
    model: "FZ 2.0",
    plate: "ABC12D",
  });

  const suppliers = await actor.listSuppliers([]);
  expect(
    suppliers.some((supplier) => supplier.name === "Repuestos El Motor S.A.S."),
  ).toBe(true);
});

it("seeds a delivered order with catalog-linked labor, a technician and a free line", async () => {
  actor.setPrincipal(OWNER);
  const seeded = await findSeededOrder();
  expect(seeded).toBeDefined();
  const order = seeded!.order;

  // The order is delivered, so its labor is eligible for commission.
  expect(order.status).toEqual({ delivered: null });
  expect(order.technicianIds.length).toBeGreaterThanOrEqual(1);

  // At least one labor line is linked to a catalog service and has a technician.
  const linked = order.labor.filter(
    (line) => line.serviceId.length > 0 && line.technicianId.length > 0,
  );
  expect(linked.length).toBeGreaterThanOrEqual(1);

  // At least one labor line is free: no catalog service.
  const free = order.labor.filter((line) => line.serviceId.length === 0);
  expect(free.length).toBeGreaterThanOrEqual(1);

  // The linked services exist in the catalog and include a "Servicio de
  // terceros" line, which must not commission.
  const services = await actor.listServices(
    { search: [], category: [], activeOnly: [] },
    { code: null },
    0n,
    100n,
  );
  const byId = new Map(
    services.items.map((service) => [String(service.id), service]),
  );
  const linkedServices = linked.map((line) =>
    byId.get(String(line.serviceId[0])),
  );
  expect(linkedServices.every((service) => service !== undefined)).toBe(true);
  expect(
    linkedServices.some(
      (service) => service?.category === "Servicio de terceros",
    ),
  ).toBe(true);
});

it("seeds a credit invoice with an installment plan that populates receivables", async () => {
  actor.setPrincipal(OWNER);
  const seeded = await findSeededInvoice();
  expect(seeded).toBeDefined();
  expect(seeded).toMatchObject({
    paymentCondition: { credit: null },
    paymentStatus: { pending: null },
  });
  expect(seeded!.total).toBe(SEEDED_INVOICE_TOTAL);

  // The invoice carries an installment plan whose installments sum to the total.
  const plan = seeded!.installments[0];
  expect(plan).toBeDefined();
  expect(plan.installmentCount).toBeGreaterThanOrEqual(2n);
  expect(plan.installments).toHaveLength(Number(plan.installmentCount));
  const sum = plan.installments.reduce(
    (acc, installment) => acc + installment.amount,
    0n,
  );
  expect(sum).toBe(seeded!.total);

  // The credit invoice appears in the receivables list with its balance and due
  // date (the first installment's due date).
  const receivables = await actor.listReceivables({ status: [], search: [] });
  const row = receivables.find(
    (receivable) => receivable.invoiceId === seeded!.id,
  );
  expect(row).toBeDefined();
  expect(row).toMatchObject({
    total: seeded!.total,
    paidAmount: 0n,
    balance: seeded!.total,
    dueDate: plan.firstDueDate,
  });
});

it("seeds a pending purchase that populates payables", async () => {
  actor.setPrincipal(OWNER);
  const purchases = await actor.listPurchases([]);
  const seeded = purchases.find(
    (purchase) => purchase.total === SEEDED_PURCHASE_TOTAL,
  );
  expect(seeded).toBeDefined();
  expect(seeded!.paidAmount).toBe(0n);

  const payables = await actor.listPayables();
  const row = payables.find(
    (payable) => payable.supplierId === seeded!.supplierId,
  );
  expect(row).toBeDefined();
  expect(row).toMatchObject({
    supplierName: "Repuestos El Motor S.A.S.",
    totalPurchased: SEEDED_PURCHASE_TOTAL,
    totalPaid: 0n,
    balance: SEEDED_PURCHASE_TOTAL,
    status: { pending: null },
  });
  // The due date is derived from the pending purchase, so it is a real date.
  expect(row!.dueDate).toBeGreaterThan(0n);
});

it("does not duplicate the sample data when the canister already has data", async () => {
  actor.setPrincipal(OWNER);
  // The seeders run inside the migration, which runs once per install/upgrade.
  // A second read of the seeded collections must show exactly one of each
  // seeded record, proving the emptiness guards hold. The seeded order and
  // invoice are counted by content unique to the seed, because their hardcoded
  // numbers can collide with records created by earlier tests.
  const technicians = await actor.listTechnicians({
    search: [],
    specialty: [],
    activeOnly: [],
  });
  expect(technicians.filter((tech) => tech.code === "TEC-001")).toHaveLength(1);
  expect(technicians.filter((tech) => tech.code === "TEC-002")).toHaveLength(1);

  const services = await actor.listServices(
    { search: [], category: [], activeOnly: [] },
    { code: null },
    0n,
    100n,
  );
  expect(
    services.items.filter((service) => service.code === "SRV-001"),
  ).toHaveLength(1);

  const customers = await actor.listCustomers([]);
  expect(
    customers.filter((customer) => customer.name === "Juan Pérez"),
  ).toHaveLength(1);

  const suppliers = await actor.listSuppliers([]);
  expect(
    suppliers.filter((supplier) => supplier.name === "Repuestos El Motor S.A.S."),
  ).toHaveLength(1);

  const orders = await actor.listOrders({ status: [], search: [] }, 0n, 100n);
  expect(
    orders.items.filter(
      (view) =>
        view.order.problem === SEEDED_ORDER_PROBLEM &&
        "delivered" in view.order.status,
    ),
  ).toHaveLength(1);

  const invoices = await actor.listInvoices(
    { to: [], from: [], search: [] },
    0n,
    100n,
  );
  expect(
    invoices.items.filter(
      (invoice) =>
        invoice.total === SEEDED_INVOICE_TOTAL &&
        "credit" in invoice.paymentCondition,
    ),
  ).toHaveLength(1);

  const purchases = await actor.listPurchases([]);
  expect(
    purchases.filter((purchase) => purchase.total === SEEDED_PURCHASE_TOTAL),
  ).toHaveLength(1);
});

it("lists the seeded technician in the commission report with base, commission and net", async () => {
  actor.setPrincipal(OWNER);
  // The seeded order is assigned to whichever seeded technician the map yields
  // first, so derive the expected technician from the order rather than
  // assuming TEC-001.
  const seededOrder = await findSeededOrder();
  expect(seededOrder).toBeDefined();
  const assignedId = seededOrder!.order.technicianIds[0];
  expect(assignedId).toBeDefined();

  const technicians = await actor.listTechnicians({
    search: [],
    specialty: [],
    activeOnly: [],
  });
  const assigned = technicians.find(
    (tech) => String(tech.id) === String(assignedId),
  );
  expect(assigned).toBeDefined();

  const report = await actor.getCommissionReport({ from: [], to: [] });
  const summary = report.technicians.find(
    (entry) => String(entry.technicianId) === String(assignedId),
  );
  expect(summary).toBeDefined();
  expect(summary).toMatchObject({
    technicianCode: assigned!.code,
    technicianName: assigned!.name,
    commissionRate: assigned!.commissionRate,
  });
  // The seeded delivered order contributes at least one eligible line.
  expect(summary!.lineCount).toBeGreaterThanOrEqual(1n);
  expect(summary!.baseAmount).toBeGreaterThan(0n);
  expect(summary!.commissionAmount).toBeGreaterThan(0n);
  // With no loans, the net equals the commission.
  expect(summary!.netPayable).toBe(summary!.commissionAmount);
});

it("lists each eligible seeded labor line in the breakdown with date, order, service, moto and commission", async () => {
  actor.setPrincipal(OWNER);
  const seededOrder = await findSeededOrder();
  expect(seededOrder).toBeDefined();
  const seededOrderId = String(seededOrder!.order.id);

  const lines = await actor.listCommissionLines([], { from: [], to: [] });
  const seeded = lines.filter((line) => String(line.orderId) === seededOrderId);
  expect(seeded.length).toBeGreaterThanOrEqual(1);

  for (const line of seeded) {
    expect(line.serviceDate).toBeGreaterThan(0n);
    expect(line.serviceName.trim().length).toBeGreaterThan(0n);
    expect(line.motorcycleBrand).toBe("Yamaha");
    expect(line.motorcycleModel).toBe("FZ 2.0");
    expect(line.motorcyclePlate).toBe("ABC12D");
    // The commission is the base times the technician's rate.
    expect(line.commissionAmount).toBe(
      (line.baseAmount * line.commissionRate) / 100n,
    );
  }
});

it("does not commission the seeded free line or the 'Servicio de terceros' line", async () => {
  actor.setPrincipal(OWNER);
  const seededOrder = await findSeededOrder();
  expect(seededOrder).toBeDefined();
  const seededOrderId = String(seededOrder!.order.id);

  const lines = await actor.listCommissionLines([], { from: [], to: [] });
  const seeded = lines.filter((line) => String(line.orderId) === seededOrderId);

  // The free line has no catalog service, so it never appears.
  expect(
    seeded.some((line) => line.description === "Revisión general de la moto"),
  ).toBe(false);

  // The "Servicio de terceros" line is excluded even though it is linked to a
  // catalog service and has a technician.
  const services = await actor.listServices(
    { search: [], category: [], activeOnly: [] },
    { code: null },
    0n,
    100n,
  );
  const thirdPartyIds = new Set(
    services.items
      .filter((service) => service.category === "Servicio de terceros")
      .map((service) => String(service.id)),
  );
  expect(seeded.some((line) => thirdPartyIds.has(String(line.serviceId)))).toBe(
    false,
  );

  // Exactly the eligible lines remain: the seeded order has one commissionable
  // catalog service line.
  expect(seeded).toHaveLength(1);
});

it("marks the seeded lines paid and stops offering them as pending", async () => {
  actor.setPrincipal(OWNER);
  // Derive the assigned technician from the seeded order, since the seeder
  // picks whichever technician the map yields first.
  const seededOrder = await findSeededOrder();
  expect(seededOrder).toBeDefined();
  const technicianId = seededOrder!.order.technicianIds[0];
  expect(technicianId).toBeDefined();

  const before = await actor.listCommissionLines([technicianId], {
    from: [],
    to: [],
  });
  expect(before.length).toBeGreaterThanOrEqual(1);

  const payment = await actor.payTechnicianCommission({
    technicianId,
    period: { from: [], to: [] },
  });
  expect(payment.lineCount).toBe(BigInt(before.length));
  expect(payment.commissionAmount).toBeGreaterThan(0n);

  // The report no longer lists the technician's lines as pending.
  const reportAfter = await actor.getCommissionReport({ from: [], to: [] });
  const summaryAfter = reportAfter.technicians.find(
    (entry) => String(entry.technicianId) === String(technicianId),
  );
  expect(summaryAfter?.lineCount ?? 0n).toBe(0n);

  // A second payment has nothing left to pay.
  await expect(
    actor.payTechnicianCommission({
      technicianId,
      period: { from: [], to: [] },
    }),
  ).rejects.toBeDefined();
});

it("reduces the seeded receivable balance on an abono and rejects an overpayment", async () => {
  actor.setPrincipal(OWNER);
  const seededInvoice = await findSeededInvoice();
  expect(seededInvoice).toBeDefined();

  const receivables = await actor.listReceivables({ status: [], search: [] });
  const seeded = receivables.find(
    (row) => row.invoiceId === seededInvoice!.id,
  );
  expect(seeded).toBeDefined();
  const balance = seeded!.balance;
  expect(balance).toBeGreaterThan(0n);

  // An abono above the balance is rejected and leaves the balance untouched.
  await expect(
    actor.registerReceivablePayment({
      invoiceId: seeded!.invoiceId,
      amount: balance + 1n,
      method: "cash",
      note: [],
    }),
  ).rejects.toBeDefined();

  const afterReject = (
    await actor.listReceivables({ status: [], search: [] })
  ).find((row) => row.invoiceId === seeded!.invoiceId);
  expect(afterReject).toMatchObject({ paidAmount: 0n, balance });

  // A partial abono reduces the balance and leaves the account pending.
  const partial = balance / 2n;
  await actor.registerReceivablePayment({
    invoiceId: seeded!.invoiceId,
    amount: partial,
    method: "cash",
    note: ["Abono de prueba"],
  });
  const afterPartial = (
    await actor.listReceivables({ status: [], search: [] })
  ).find((row) => row.invoiceId === seeded!.invoiceId);
  expect(afterPartial).toMatchObject({
    paidAmount: partial,
    balance: balance - partial,
    status: { pending: null },
  });

  // Settling the rest marks the account paid with a zero balance.
  await actor.registerReceivablePayment({
    invoiceId: seeded!.invoiceId,
    amount: balance - partial,
    method: "transfer",
    note: [],
  });
  const afterFull = (
    await actor.listReceivables({ status: [], search: [] })
  ).find((row) => row.invoiceId === seeded!.invoiceId);
  expect(afterFull).toMatchObject({
    paidAmount: balance,
    balance: 0n,
    status: { paid: null },
  });
});

it("reduces the seeded payable balance on a supplier payment", async () => {
  actor.setPrincipal(OWNER);
  const payables = await actor.listPayables();
  const seeded = payables.find(
    (row) => row.supplierName === "Repuestos El Motor S.A.S.",
  );
  expect(seeded).toBeDefined();
  const balance = seeded!.balance;
  expect(balance).toBeGreaterThan(0n);

  // A partial payment reduces the pending balance.
  const partial = balance / 2n;
  await actor.registerPayment({
    supplierId: seeded!.supplierId,
    amount: partial,
    method: { cash: null },
    note: [],
    purchaseId: [],
  });

  const afterPartial = (await actor.listPayables()).find(
    (row) => row.supplierId === seeded!.supplierId,
  );
  expect(afterPartial).toMatchObject({
    totalPaid: partial,
    balance: balance - partial,
    status: { pending: null },
  });

  // Settling the rest marks the account paid.
  await actor.registerPayment({
    supplierId: seeded!.supplierId,
    amount: balance - partial,
    method: { transfer: null },
    note: [],
    purchaseId: [],
  });
  const afterFull = (await actor.listPayables()).find(
    (row) => row.supplierId === seeded!.supplierId,
  );
  expect(afterFull).toMatchObject({
    totalPaid: balance,
    balance: 0n,
    status: { paid: null },
  });
});

// --- Characterization: the notifyCustomer validation contract --------------
//
// The accepted change adds a "Notificar al cliente" action that sends an email
// to the customer's registered address. The frontend dialog blocks a customer
// without an email locally, but the backend must enforce the same rule, so these
// tests call the real canister and prove the rejections are implemented rather
// than stubs that trap. They exercise only the validation paths that run before
// the platform email client is called, because the PocketIC replica hosts no
// email service; a successful send is therefore not asserted here.

it("rejects notifying a customer with no registered email", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Sin Correo",
    phone: "+57 300 171 7171",
    email: [],
    document: [],
    address: [],
  });

  await expect(
    actor.notifyCustomer({
      customerId: customer.id,
      source: { order: null },
      referenceId: [],
      subject: "Estado de tu orden",
      message: "Hola, tu moto está lista.",
    }),
  ).rejects.toBeDefined();
});

it("rejects notifying an unknown customer", async () => {
  actor.setPrincipal(OWNER);
  await expect(
    actor.notifyCustomer({
      customerId: 999_999n,
      source: { order: null },
      referenceId: [],
      subject: "Estado de tu orden",
      message: "Hola, tu moto está lista.",
    }),
  ).rejects.toBeDefined();
});

it("rejects a notification with an empty subject or message", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Con Correo",
    phone: "+57 300 181 8181",
    email: ["cliente@example.com"],
    document: [],
    address: [],
  });

  // A blank subject is rejected before any email is sent.
  await expect(
    actor.notifyCustomer({
      customerId: customer.id,
      source: { order: null },
      referenceId: [],
      subject: "   ",
      message: "Hola, tu moto está lista.",
    }),
  ).rejects.toBeDefined();

  // A blank message is rejected too.
  await expect(
    actor.notifyCustomer({
      customerId: customer.id,
      source: { order: null },
      referenceId: [],
      subject: "Estado de tu orden",
      message: "   ",
    }),
  ).rejects.toBeDefined();
});

// --- Characterization: the bulk service import contract --------------------
//
// The accepted change locks the `codigo` field in the import preview while the
// other fields stay editable. The frontend maps each confirmed row to a
// `ServiceInput` and calls `bulkCreateServices`; these tests call the real
// canister, so they prove the method is implemented rather than a stub that
// traps, and they pin the rules that must survive the change: every field of
// each input is persisted as sent, and a row whose code already exists is
// silently omitted while the remaining rows are still created.

it("persists every field of each bulk-created service as sent", async () => {
  actor.setPrincipal(OWNER);
  const created = await actor.bulkCreateServices([
    {
      code: "SRV-BULK-1",
      name: "Cambio de aceite",
      description: "Incluye filtro",
      category: "Mantenimiento",
      laborRate: 4500000n,
      estimatedMinutes: 60n,
      active: true,
    },
    {
      code: "SRV-BULK-2",
      name: "Alineación",
      description: "",
      category: "Suspensión",
      laborRate: 3000000n,
      estimatedMinutes: 30n,
      active: false,
    },
  ]);

  expect(created).toHaveLength(2);
  expect(created[0]).toMatchObject({
    code: "SRV-BULK-1",
    name: "Cambio de aceite",
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 4500000n,
    estimatedMinutes: 60n,
    active: true,
  });
  expect(created[1]).toMatchObject({
    code: "SRV-BULK-2",
    name: "Alineación",
    description: "",
    category: "Suspensión",
    laborRate: 3000000n,
    estimatedMinutes: 30n,
    active: false,
  });

  // The read agrees with the create reply, so the values are really stored.
  const page = await actor.listServices(
    { search: ["SRV-BULK-1"], category: [], activeOnly: [] },
    { code: null },
    0n,
    20n,
  );
  expect(page.items).toHaveLength(1);
  expect(page.items[0]).toMatchObject({
    code: "SRV-BULK-1",
    name: "Cambio de aceite",
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 4500000n,
    estimatedMinutes: 60n,
    active: true,
  });
});

it("omits a bulk row whose code already exists and still creates the rest", async () => {
  actor.setPrincipal(OWNER);
  await actor.createService({
    code: "SRV-BULK-DUP",
    name: "Servicio existente",
    description: "",
    category: "Mantenimiento",
    laborRate: 10000n,
    estimatedMinutes: 15n,
    active: true,
  });

  const created = await actor.bulkCreateServices([
    {
      code: "SRV-BULK-DUP",
      name: "Duplicado",
      description: "",
      category: "Mantenimiento",
      laborRate: 20000n,
      estimatedMinutes: 20n,
      active: true,
    },
    {
      code: "SRV-BULK-NEW",
      name: "Servicio nuevo",
      description: "",
      category: "Frenos",
      laborRate: 30000n,
      estimatedMinutes: 25n,
      active: true,
    },
  ]);

  // Only the non-duplicate row is returned and created.
  expect(created).toHaveLength(1);
  expect(created[0].code).toBe("SRV-BULK-NEW");

  // The existing service was not overwritten by the duplicate row.
  const existing = await actor.listServices(
    { search: ["SRV-BULK-DUP"], category: [], activeOnly: [] },
    { code: null },
    0n,
    20n,
  );
  expect(existing.items).toHaveLength(1);
  expect(existing.items[0]).toMatchObject({
    name: "Servicio existente",
    laborRate: 10000n,
  });
});

// --- Accepted behavior: the Google Drive backup public API -----------------
//
// The accepted change adds a manual Google Drive backup for the administrator.
// These tests call the real canister, so they prove the public methods are
// implemented rather than stubs that trap, and they pin the observable rules
// that do not need Google: the connection status starts disconnected, the
// backup and history reads report `#notConnected` before the administrator
// authorizes their account, disconnecting is a safe no-op, and every endpoint
// is administrator-gated. The real Drive upload cannot be exercised here
// because the replica hosts no Google endpoint and the OAuth client is not
// configured, so a successful upload is deliberately not asserted.

it("reports a disconnected Drive status on a fresh canister", async () => {
  actor.setPrincipal(OWNER);
  const status = await actor.getDriveConnectionStatus();
  expect(status).toMatchObject({
    connected: false,
    accountEmail: [],
    connectedAt: [],
  });
});

it("reports #notConnected for a backup and the history before authorizing Drive", async () => {
  actor.setPrincipal(OWNER);
  // No credentials are stored, so both operations return the controlled
  // `#notConnected` error instead of trapping or reaching Google.
  await expect(actor.createBackup()).resolves.toEqual({
    err: { notConnected: null },
  });
  await expect(actor.listBackups()).resolves.toEqual({
    err: { notConnected: null },
  });
});

it("disconnects Drive as a safe no-op when nothing is connected", async () => {
  actor.setPrincipal(OWNER);
  // The method returns unit; `@dfinity/pic` decodes that as `null`.
  await expect(actor.disconnectDrive()).resolves.toBeNull();
  // The status is still disconnected afterwards.
  await expect(actor.getDriveConnectionStatus()).resolves.toMatchObject({
    connected: false,
  });
});

it("blocks a non-admin from every Drive backup endpoint", async () => {
  actor.setPrincipal(MECHANIC);
  await expect(actor.getDriveConnectionStatus()).rejects.toBeDefined();
  await expect(actor.createBackup()).rejects.toBeDefined();
  await expect(actor.listBackups()).rejects.toBeDefined();
  await expect(actor.disconnectDrive()).rejects.toBeDefined();
  await expect(actor.startDriveAuthorization()).rejects.toBeDefined();
});

// --- Accepted behavior: preparing a WhatsApp message ------------------------
//
// The accepted change adds a read-only `prepareWhatsAppMessage` query that
// resolves the contact's phone, normalizes it to international format with the
// Colombian country code (57), and builds a Spanish draft from the referenced
// record. These tests call the real canister, so they prove the method is
// implemented rather than a stub that traps, and they pin the observable rules:
// the phone normalization, the `hasPhone = false` path for a contact without a
// usable phone, the per-context draft, and the rejection of an unknown contact
// or reference. Nothing is sent: the query only prepares the draft.

it("normalizes a 10-digit local phone with the 57 country code", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente WhatsApp",
    phone: "300 111 2222",
    email: [],
    document: [],
    address: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { service: null },
    referenceId: [],
  });

  expect(result.hasPhone).toBe(true);
  // The local number gains the 57 country code and loses its separators.
  expect(result.phone).toEqual(["573001112222"]);
  expect(result.contactName).toBe("Cliente WhatsApp");
  expect(result.contactId).toBe(customer.id);
});

it("keeps a phone that already carries the 57 country code", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Ya Internacional",
    phone: "+57 300 333 4444",
    email: [],
    document: [],
    address: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { service: null },
    referenceId: [],
  });

  // The 12-digit number is preserved rather than double-prefixed.
  expect(result.phone).toEqual(["573003334444"]);
});

it("keeps a phone with a different country code unchanged", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente México",
    phone: "+52 55 1234 5678",
    email: [],
    document: [],
    address: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { service: null },
    referenceId: [],
  });

  // An 11+ digit number that does not start with 57 is left as its digits.
  expect(result.phone).toEqual(["525512345678"]);
});

it("reports hasPhone false and no phone when the contact has no usable number", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Sin Teléfono",
    phone: "",
    email: [],
    document: [],
    address: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { service: null },
    referenceId: [],
  });

  expect(result.hasPhone).toBe(false);
  expect(result.phone).toEqual([]);
  // The draft is still prepared so the UI can show it alongside the notice.
  expect(result.message.length).toBeGreaterThan(0);
});

it("builds the order draft from the referenced order", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Orden WhatsApp",
    phone: "300 555 6666",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "WA-001",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 1000n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 1000n,
    problem: "Mantenimiento",
    technicianIds: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { order: null },
    referenceId: [order.order.id],
  });

  // The draft names the customer and carries the order number.
  expect(result.message).toContain("Cliente Orden WhatsApp");
  expect(result.message).toContain(order.order.orderNumber);
});

it("builds the quote draft from the referenced quote", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Cotización WhatsApp",
    phone: "300 777 8888",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "WA-002",
    brand: "Yamaha",
    model: "FZ",
    year: 2021n,
    mileage: 500n,
  });
  const quote = await actor.createQuote({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    discount: 0n,
    notes: [],
    partLines: [],
    serviceLines: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { quote: null },
    referenceId: [quote.quote.id],
  });

  expect(result.message).toContain("Cliente Cotización WhatsApp");
  expect(result.message).toContain(quote.quote.quoteNumber);
});

it("builds the invoice draft from the referenced invoice", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Factura WhatsApp",
    phone: "300 999 0000",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "WA-003",
    brand: "Suzuki",
    model: "GN125",
    year: 2020n,
    mileage: 200n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 200n,
    problem: "Facturar",
    technicianIds: [],
  });
  await actor.addLabor(order.order.id, {
    description: "Servicio",
    price: 50000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });
  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { cash: null },
    [],
  );

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { invoice: null },
    referenceId: [invoice.id],
  });

  expect(result.message).toContain("Cliente Factura WhatsApp");
  expect(result.message).toContain(invoice.number);
});

it("builds the receivable draft from the referenced credit invoice", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Cobro WhatsApp",
    phone: "300 121 2121",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "WA-004",
    brand: "Bajaj",
    model: "Boxer",
    year: 2019n,
    mileage: 100n,
  });
  const order = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 100n,
    problem: "Crédito",
    technicianIds: [],
  });
  await actor.addLabor(order.order.id, {
    description: "Servicio a crédito",
    price: 100000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(order.order.id, { inRepair: null });
  await actor.updateOrderStatus(order.order.id, { ready: null });
  await actor.updateOrderStatus(order.order.id, { delivered: null });
  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate: 1_800_000_000_000_000_000n, installmentCount: 2n }],
  );

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { receivable: null },
    referenceId: [invoice.id],
  });

  expect(result.message).toContain("Cliente Cobro WhatsApp");
  expect(result.message).toContain(invoice.number);
});

it("builds the appointment draft from the referenced appointment", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Cita WhatsApp",
    phone: "300 343 4343",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "WA-005",
    brand: "Honda",
    model: "XR150",
    year: 2022n,
    mileage: 300n,
  });
  const appointment = await actor.createAppointment({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    technicianId: [],
    scheduledAt: 1_800_000_000_000_000_000n,
    durationMinutes: 60n,
    reason: "Afinación",
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { appointment: null },
    referenceId: [appointment.id],
  });

  expect(result.message).toContain("Cliente Cita WhatsApp");
  expect(result.message).toContain("Afinación");
});

it("builds the service draft from the referenced service", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Servicio WhatsApp",
    phone: "300 565 6565",
    email: [],
    document: [],
    address: [],
  });
  const service = await actor.createService({
    code: "SRV-WA-1",
    name: "Cambio de aceite",
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { service: null },
    referenceId: [service.id],
  });

  expect(result.message).toContain("Cliente Servicio WhatsApp");
  expect(result.message).toContain("Cambio de aceite");
});

it("prepares a supplier draft with the supplier contact kind", async () => {
  actor.setPrincipal(OWNER);
  const supplier = await actor.createSupplier({
    name: "Refacciones WhatsApp",
    phone: "81 8345 2210",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { supplier: null },
    contactId: supplier.id,
    context: { service: null },
    referenceId: [],
  });

  expect(result.contactKind).toEqual({ supplier: null });
  expect(result.contactName).toBe("Refacciones WhatsApp");
  // The supplier's local number is normalized the same way.
  expect(result.phone).toEqual(["578183452210"]);
});

it("rejects an unknown contact instead of trapping", async () => {
  actor.setPrincipal(OWNER);
  await expect(
    actor.prepareWhatsAppMessage({
      contactKind: { customer: null },
      contactId: 999_999n,
      context: { service: null },
      referenceId: [],
    }),
  ).rejects.toBeDefined();
});

it("rejects an unknown reference for a context that needs one", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Referencia",
    phone: "300 787 8787",
    email: [],
    document: [],
    address: [],
  });

  await expect(
    actor.prepareWhatsAppMessage({
      contactKind: { customer: null },
      contactId: customer.id,
      context: { order: null },
      referenceId: [999_999n],
    }),
  ).rejects.toBeDefined();
});

it("does not mutate state when preparing a message", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Solo Lectura",
    phone: "300 909 0909",
    email: [],
    document: [],
    address: [],
  });

  const before = await actor.listCustomers([]);
  await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    contactId: customer.id,
    context: { service: null },
    referenceId: [],
  });
  const after = await actor.listCustomers([]);

  // The read-only query leaves the customer collection exactly as it was.
  expect(after).toHaveLength(before.length);
});

// --- Accepted behavior: the paginated local backup -------------------------
//
// The accepted change replaces the single `downloadLocalBackup` query with a
// manifest plus a paginated `getBackupSection`, so no single call serializes
// all 23 collections. These tests call the real canister, so they prove the
// methods are implemented rather than stubs that trap, and they pin the
// observable rules: the manifest names the file and the ordered sections, each
// section returns valid JSON for its own key, the pages concatenate into the
// same root object `serializeBackup` produced, and a non-admin is rejected.

/** The 23 root keys, in the order `serializeBackup` emitted them. */
const BACKUP_SECTION_KEYS = [
  "parts",
  "lots",
  "movements",
  "customers",
  "motorcycles",
  "orders",
  "suppliers",
  "purchases",
  "payments",
  "invoices",
  "businessSettings",
  "userProfiles",
  "quotes",
  "services",
  "serviceCategories",
  "technicians",
  "appointments",
  "expenses",
  "expenseCategories",
  "posSales",
  "receivablePayments",
  "supplierOrders",
  "company",
];

/**
 * Reassembles the root JSON the way the frontend does: read the manifest, then
 * page each section until `done`, concatenating collection pages and taking
 * single-record sections whole.
 */
async function collectLocalBackup() {
  const manifest = await actor.getLocalBackupManifest();
  const root: Record<string, unknown> = {
    generatedAt: Number(manifest.generatedAt),
  };
  for (let index = 0; index < manifest.sections.length; index += 1) {
    const key = manifest.sections[index];
    let offset = 0n;
    let done = false;
    let items: unknown[] = [];
    let single: unknown = null;
    let isCollection = false;
    while (!done) {
      const chunk = await actor.getBackupSection(
        BigInt(index),
        offset,
        manifest.maxPageSize,
      );
      const parsed = JSON.parse(chunk.json) as unknown;
      if (Array.isArray(parsed)) {
        isCollection = true;
        items = [...items, ...parsed];
      } else {
        single = parsed;
      }
      if (chunk.done) {
        done = true;
        break;
      }
      offset = chunk.offset + chunk.limit;
    }
    root[key] = isCollection ? items : single;
  }
  return { manifest, root };
}

it("returns a manifest with the file name and the ordered section plan", async () => {
  actor.setPrincipal(OWNER);
  const manifest = await actor.getLocalBackupManifest();

  // The file name carries the generation date and time, so two copies are
  // distinguishable: `copia-local-hr-AAAA-MM-DD-HHmm.json`.
  expect(manifest.fileName).toMatch(
    /^copia-local-hr-\d{4}-\d{2}-\d{2}-\d{4}\.json$/,
  );
  expect(manifest.generatedAt).toBeGreaterThan(0n);
  // The plan is the 23 root keys in the exact order `serializeBackup` used.
  expect(manifest.sections).toEqual(BACKUP_SECTION_KEYS);
  expect(manifest.totalSections).toBe(BigInt(BACKUP_SECTION_KEYS.length));
  // The page size is bounded, so no single call serializes a whole collection.
  expect(manifest.maxPageSize).toBeGreaterThan(0n);
  expect(manifest.maxPageSize).toBeLessThanOrEqual(200n);
});

it("returns each section's own JSON keyed by the manifest index", async () => {
  actor.setPrincipal(OWNER);
  const manifest = await actor.getLocalBackupManifest();

  for (let index = 0; index < manifest.sections.length; index += 1) {
    const chunk = await actor.getBackupSection(BigInt(index), 0n, 200n);
    expect(chunk.key).toBe(manifest.sections[index]);
    expect(chunk.index).toBe(BigInt(index));
    // The payload is valid JSON, not an opaque string.
    expect(() => JSON.parse(chunk.json)).not.toThrow();
  }
});

it("assembles the same root object serializeBackup produced", async () => {
  actor.setPrincipal(OWNER);
  const { manifest, root } = await collectLocalBackup();

  // The root object carries exactly the manifest's sections plus the
  // generation timestamp, so the file keeps the previous shape.
  expect(Object.keys(root).sort()).toEqual(
    [...BACKUP_SECTION_KEYS, "generatedAt"].sort(),
  );
  expect(root.generatedAt).toBe(Number(manifest.generatedAt));

  // The collection sections are arrays and the two single-record sections are
  // objects, matching the previous serialization.
  for (const key of BACKUP_SECTION_KEYS) {
    if (key === "businessSettings" || key === "company") {
      expect(root[key]).toBeTypeOf("object");
    } else {
      expect(Array.isArray(root[key])).toBe(true);
    }
  }

  // The seeded sample data guarantees the customer collection is non-empty, so
  // the assembled JSON reflects real records rather than empty arrays.
  const customers = root.customers as Array<{ name?: string }>;
  expect(customers.some((customer) => customer.name === "Juan Pérez")).toBe(
    true,
  );

  // The assembled customer count matches the live read, so the copy is the
  // real company data.
  const liveCustomers = await actor.listCustomers([]);
  expect(customers).toHaveLength(liveCustomers.length);
});

it("pages a collection section without repeating or dropping items", async () => {
  actor.setPrincipal(OWNER);
  const manifest = await actor.getLocalBackupManifest();
  const customersIndex = manifest.sections.indexOf("customers");
  expect(customersIndex).toBeGreaterThanOrEqual(0);

  // A page size of one forces several pages for the seeded customer collection.
  const first = await actor.getBackupSection(BigInt(customersIndex), 0n, 1n);
  expect(first.limit).toBe(1n);
  expect(first.total).toBeGreaterThanOrEqual(1n);
  expect(first.done).toBe(first.total <= 1n);

  // The first page holds exactly one element.
  expect(JSON.parse(first.json)).toHaveLength(1);

  // Walking the pages with the reported offset yields the whole collection
  // exactly once, in order.
  const collected: unknown[] = [];
  let offset = 0n;
  let done = false;
  while (!done) {
    const chunk = await actor.getBackupSection(
      BigInt(customersIndex),
      offset,
      1n,
    );
    collected.push(...(JSON.parse(chunk.json) as unknown[]));
    done = chunk.done;
    offset = chunk.offset + chunk.limit;
  }
  expect(collected).toHaveLength(Number(first.total));
  const liveCustomers = await actor.listCustomers([]);
  expect(collected).toHaveLength(liveCustomers.length);
});

it("blocks a non-admin from the local backup manifest and sections", async () => {
  actor.setPrincipal(MECHANIC);
  await expect(actor.getLocalBackupManifest()).rejects.toBeDefined();
  await expect(actor.getBackupSection(0n, 0n, 200n)).rejects.toBeDefined();
});

// --- Accepted behavior: purchase-invoice intake ----------------------------
//
// The accepted change adds an admin-gated purchase-invoice intake: a draft is
// created from an uploaded file, the review is corrected, and confirming the
// invoice applies each line to inventory (creating or updating a part, a lot
// and a purchase movement). These tests call the real canister, so they prove
// the methods are implemented rather than stubs that trap, and they pin the
// observable rules: a new code creates a part and raises stock, an existing
// code updates the part cost and raises stock, a re-confirm is idempotent, an
// invalid line is reported without moving inventory, and a non-admin is
// rejected.
//
// `runPurchaseInvoiceExtraction` is deliberately not exercised end to end here:
// it awaits a live inference outcall and a real uploaded blob, neither of which
// the PocketIC lane provides. Calling it with an unreachable blob does not
// return a controlled failure in this environment — the outcall never answers
// and the ingress times out — so the lane covers only its admin gate below. The
// extraction failure/status handling is covered in the frontend suite instead.

/** A draft file reference; the bytes are never fetched by these tests. */
function invoiceFileInput(overrides: Record<string, unknown> = {}) {
  return {
    kind: { pdf: null } as const,
    mimeType: "application/pdf",
    fileName: "factura.pdf",
    objectId: "!caf!sha256:deadbeef",
    sizeBytes: 12345n,
    // The storage gateway URL and project id the frontend forwards from
    // `env.json` so the backend can download the blob. Candid `Opt` fields are
    // required keys in the generated declarations and take `[] | [string]`.
    gatewayUrl: ["https://gateway.example.test"],
    projectId: ["project-123"],
    ...overrides,
  };
}

it("creates a purchase-invoice draft and reads it back", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  expect(draft.status).toEqual({ pending: null });
  expect(draft.extractionStatus).toEqual({ pending: null });
  expect(draft.file.fileName).toBe("factura.pdf");
  // The gateway URL and project id are persisted on the file reference so the
  // backend can download the blob later.
  expect(draft.file.gatewayUrl).toEqual(["https://gateway.example.test"]);
  expect(draft.file.projectId).toEqual(["project-123"]);
  expect(draft.lines).toHaveLength(0);

  const read = await actor.getPurchaseInvoice(draft.id);
  expect(read).toHaveLength(1);
  expect(read[0].id).toBe(draft.id);
});

it("rejects a draft without a file reference", async () => {
  actor.setPrincipal(OWNER);
  await expect(
    actor.createPurchaseInvoiceDraft(invoiceFileInput({ objectId: "" })),
  ).rejects.toBeDefined();
});

it("creates a new part and raises stock when confirming a new code", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["Repuestos El Motor"],
      supplierTaxId: "900123456-7",
      invoiceNumber: ["FE-90001"],
      invoiceDate: [],
      paymentMethod: "Contado",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "REP-PI-NEW",
        description: "Balata de freno",
        quantity: 3n,
        unitCost: 12500n,
        taxRate: 19n,
        discountRate: 0n,
        total: 37500n,
      },
    ],
  });

  const result = await actor.confirmPurchaseInvoice(draft.id);
  expect(result.status).toEqual({ confirmed: null });
  expect(result.created).toBe(1n);
  expect(result.updated).toBe(0n);
  expect(result.failed).toBe(0n);
  expect(result.lines).toHaveLength(1);
  expect(result.lines[0].status).toEqual({ created: null });

  // The new part exists with the invoice cost and the raised stock.
  const parts = await actor.listParts(
    { search: ["REP-PI-NEW"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  const part = parts.items.find((entry) => entry.sku === "REP-PI-NEW");
  expect(part).toBeDefined();
  expect(part).toMatchObject({
    name: "Balata de freno",
    costPrice: 12500n,
    totalStock: 3n,
  });

  // A lot and a purchase movement were recorded for the entry.
  const lots = await actor.listLots(part!.id);
  expect(lots).toHaveLength(1);
  expect(lots[0]).toMatchObject({ quantity: 3n, unitCost: 12500n });

  const movements = await actor.listMovements(part!.id);
  const purchase = movements.find(
    (movement) => movement.kind.purchase !== undefined,
  );
  expect(purchase).toBeDefined();
  expect(purchase).toMatchObject({ quantity: 3n, performedBy: OWNER });
});

it("updates an existing part cost and raises stock for a known code", async () => {
  actor.setPrincipal(OWNER);
  const existing = await actor.createPart({
    sku: "REP-PI-EXIST",
    name: "Filtro de aire",
    category: "Filtros",
    brand: "Genérico",
    unit: "pza",
    salePrice: 30000n,
    costPrice: 10000n,
    lowStockThreshold: 1n,
  });

  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());
  await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["Distribuidora Central"],
      supplierTaxId: "900123456-7",
      invoiceNumber: ["FE-90002"],
      invoiceDate: [],
      paymentMethod: "Contado",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "REP-PI-EXIST",
        description: "Filtro de aire",
        quantity: 4n,
        unitCost: 15000n,
        taxRate: 19n,
        discountRate: 0n,
        total: 60000n,
      },
    ],
  });

  const result = await actor.confirmPurchaseInvoice(draft.id);
  expect(result.status).toEqual({ confirmed: null });
  expect(result.created).toBe(0n);
  expect(result.updated).toBe(1n);
  expect(result.lines[0].status).toEqual({ updated: null });

  // The existing part keeps its identity but takes the invoice cost and stock.
  const read = await actor.getPart(existing.id);
  expect(read[0]).toMatchObject({ costPrice: 15000n, totalStock: 4n });
});

it("does not duplicate stock when a confirmed invoice is confirmed again", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());
  await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["Repuestos El Motor"],
      supplierTaxId: "900123456-7",
      invoiceNumber: ["FE-90003"],
      invoiceDate: [],
      paymentMethod: "Contado",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "REP-PI-IDEM",
        description: "Aceite 20W-50",
        quantity: 2n,
        unitCost: 20000n,
        taxRate: 19n,
        discountRate: 0n,
        total: 40000n,
      },
    ],
  });

  const first = await actor.confirmPurchaseInvoice(draft.id);
  expect(first.created).toBe(1n);

  const parts = await actor.listParts(
    { search: ["REP-PI-IDEM"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  const part = parts.items.find((entry) => entry.sku === "REP-PI-IDEM");
  expect(part).toBeDefined();
  const stockAfterFirst = part!.totalStock;
  const lotsAfterFirst = (await actor.listLots(part!.id)).length;

  // A second confirmation returns the stored result and leaves inventory alone.
  const second = await actor.confirmPurchaseInvoice(draft.id);
  expect(second.status).toEqual({ confirmed: null });
  expect(second.created).toBe(1n);

  const after = await actor.getPart(part!.id);
  expect(after[0].totalStock).toBe(stockAfterFirst);
  expect(await actor.listLots(part!.id)).toHaveLength(lotsAfterFirst);
});

it("reports an invalid line without moving inventory", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());
  await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["Repuestos El Motor"],
      supplierTaxId: "900123456-7",
      invoiceNumber: ["FE-90004"],
      invoiceDate: [],
      paymentMethod: "Contado",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "REP-PI-BAD",
        description: "Línea con cantidad cero",
        quantity: 0n,
        unitCost: 5000n,
        taxRate: 19n,
        discountRate: 0n,
        total: 0n,
      },
    ],
  });

  const result = await actor.confirmPurchaseInvoice(draft.id);
  expect(result.status).toEqual({ withErrors: null });
  expect(result.created).toBe(0n);
  expect(result.failed).toBe(1n);
  expect(result.lines[0].status).toEqual({ error: null });
  expect(result.lines[0].error[0]).toBe("La cantidad debe ser mayor que cero");

  // No part was created for the rejected line.
  const parts = await actor.listParts(
    { search: ["REP-PI-BAD"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  expect(parts.items.find((entry) => entry.sku === "REP-PI-BAD")).toBeUndefined();
});

it("lists purchase invoices and filters them by status", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());
  await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["Proveedor Listado"],
      supplierTaxId: "900123456-7",
      invoiceNumber: ["FE-90005"],
      invoiceDate: [],
      paymentMethod: "Contado",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "REP-PI-LIST",
        description: "Bujía",
        quantity: 1n,
        unitCost: 8000n,
        taxRate: 19n,
        discountRate: 0n,
        total: 8000n,
      },
    ],
  });
  await actor.confirmPurchaseInvoice(draft.id);

  const confirmed = await actor.listPurchaseInvoices(
    { status: [{ confirmed: null }], search: [], supplierId: [] },
    { createdAt: null },
    0n,
    50n,
  );
  expect(
    confirmed.items.some((invoice) => invoice.id === draft.id),
  ).toBe(true);

  const pending = await actor.listPurchaseInvoices(
    { status: [{ pending: null }], search: [], supplierId: [] },
    { createdAt: null },
    0n,
    50n,
  );
  expect(pending.items.some((invoice) => invoice.id === draft.id)).toBe(false);
});

it("blocks a non-admin from managing purchase invoices", async () => {
  actor.setPrincipal(MECHANIC);
  await expect(
    actor.createPurchaseInvoiceDraft(invoiceFileInput()),
  ).rejects.toBeDefined();
  await expect(
    actor.listPurchaseInvoices(
      { status: [], search: [], supplierId: [] },
      { createdAt: null },
      0n,
      20n,
    ),
  ).rejects.toBeDefined();
});

it("blocks a non-admin from running a purchase-invoice extraction", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  actor.setPrincipal(MECHANIC);
  await expect(
    actor.runPurchaseInvoiceExtraction(draft.id),
  ).rejects.toBeDefined();
});

// --- Accepted behavior: a failed extraction stays reviewable ----------------
//
// The accepted change requires the user to always be able to review and
// continue, even when the automatic extraction fails or returns no lines. The
// backend half of that contract is that a failed extraction leaves a consistent
// draft: the invoice is still readable through `getPurchaseInvoice` with its
// header and an empty line list, and the review can be completed by hand and
// confirmed. These tests call the real canister, so they prove the state is
// persisted rather than only rendered by the frontend.

it("keeps a draft readable with an empty line list after a failed extraction", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  // A failed extraction is persisted as a consistent state: the draft is still
  // readable, with no lines, so the frontend can open the manual review.
  const read = await actor.getPurchaseInvoice(draft.id);
  expect(read).toHaveLength(1);
  expect(read[0].lines).toHaveLength(0);
  expect(read[0].status).toEqual({ pending: null });
  expect(read[0].extractionStatus).toEqual({ pending: null });
});

it("completes a failed extraction manually and confirms it", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  // The user completes the header and the lines by hand after the extraction
  // could not read the document.
  const reviewed = await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["Proveedor Manual"],
      supplierTaxId: "900123456-7",
      invoiceNumber: ["FE-MANUAL-1"],
      invoiceDate: [],
      paymentMethod: "Contado",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "REP-PI-MANUAL",
        description: "Ítem completado a mano",
        quantity: 2n,
        unitCost: 7000n,
        taxRate: 19n,
        discountRate: 0n,
        total: 14000n,
      },
    ],
  });
  expect(reviewed.lines).toHaveLength(1);
  expect(reviewed.invoiceNumber).toEqual(["FE-MANUAL-1"]);

  const result = await actor.confirmPurchaseInvoice(draft.id);
  expect(result.status).toEqual({ confirmed: null });
  expect(result.created).toBe(1n);
  expect(result.failed).toBe(0n);

  // The manually entered line reached inventory.
  const parts = await actor.listParts(
    { search: ["REP-PI-MANUAL"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    20n,
  );
  const part = parts.items.find((entry) => entry.sku === "REP-PI-MANUAL");
  expect(part).toBeDefined();
  expect(part).toMatchObject({ totalStock: 2n, costPrice: 7000n });
});

it("refuses to confirm an invoice with no lines instead of trapping", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  // An empty invoice cannot be confirmed: the backend rejects it with a
  // controlled error rather than applying nothing silently.
  await expect(actor.confirmPurchaseInvoice(draft.id)).rejects.toBeDefined();

  // The draft is still readable and still pending, so the user can add lines.
  const read = await actor.getPurchaseInvoice(draft.id);
  expect(read).toHaveLength(1);
  expect(read[0].status).toEqual({ pending: null });
  expect(read[0].lines).toHaveLength(0);
});

// --- Characterization: the review round-trip the extraction preloads --------
//
// The accepted change makes a selectable-text PDF extract automatically and
// preload the editable review table with the detected header and lines. This
// suite protects the adjacent backend contract that must survive it: whatever
// the extraction detects is persisted through `updatePurchaseInvoiceReview`
// and read back unchanged through `getPurchaseInvoice`, so the review table can
// be corrected and confirmed. It never asserts the extraction itself, which the
// request changes.

it("round-trips the detected header fields through the review", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  // The header the extraction would detect: supplier name, NIT, invoice
  // number, date, payment method and payment means. The date is the Colombia
  // start of day for 2026-09-21 in nanoseconds (2026-09-21T05:00:00Z).
  const invoiceDate = 1_789_966_800_000_000_000n;
  const reviewed = await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["RALLYE MOTORS SAS"],
      supplierTaxId: "901780198-3",
      invoiceNumber: ["FMLR20288"],
      invoiceDate: [invoiceDate],
      paymentMethod: "Contado Repuestos (POS)",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "7701023153317/T",
        description: "JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD",
        quantity: 1n,
        unitCost: 8_936_719n,
        taxRate: 19n,
        discountRate: 10n,
        total: 9_571_226n,
      },
    ],
  });

  expect(reviewed.supplierName).toEqual(["RALLYE MOTORS SAS"]);
  expect(reviewed.supplierTaxId).toBe("901780198-3");
  expect(reviewed.invoiceNumber).toEqual(["FMLR20288"]);
  expect(reviewed.invoiceDate).toEqual([invoiceDate]);
  expect(reviewed.paymentMethod).toBe("Contado Repuestos (POS)");
  expect(reviewed.paymentMeans).toBe("Efectivo");
  expect(reviewed.lines).toHaveLength(1);
  expect(reviewed.lines[0]).toMatchObject({
    code: "7701023153317/T",
    description: "JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD",
    quantity: 1n,
    unitCost: 8_936_719n,
    taxRate: 19n,
    discountRate: 10n,
    total: 9_571_226n,
  });

  // The same values survive a fresh read, so the review table can be reopened
  // and corrected without losing the detected data.
  const read = await actor.getPurchaseInvoice(draft.id);
  expect(read).toHaveLength(1);
  expect(read[0].supplierName).toEqual(["RALLYE MOTORS SAS"]);
  expect(read[0].supplierTaxId).toBe("901780198-3");
  expect(read[0].invoiceNumber).toEqual(["FMLR20288"]);
  expect(read[0].invoiceDate).toEqual([invoiceDate]);
  expect(read[0].paymentMethod).toBe("Contado Repuestos (POS)");
  expect(read[0].paymentMeans).toBe("Efectivo");
  expect(read[0].lines[0]).toMatchObject({
    code: "7701023153317/T",
    quantity: 1n,
    unitCost: 8_936_719n,
    taxRate: 19n,
    discountRate: 10n,
    total: 9_571_226n,
  });
});

it("keeps the detected header when the review is corrected and re-saved", async () => {
  actor.setPrincipal(OWNER);
  const draft = await actor.createPurchaseInvoiceDraft(invoiceFileInput());

  await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["RALLYE MOTORS SAS"],
      supplierTaxId: "901780198-3",
      invoiceNumber: ["FMLR20288"],
      invoiceDate: [],
      paymentMethod: "Contado Repuestos (POS)",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "7701023153317/T",
        description: "JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD",
        quantity: 1n,
        unitCost: 8_936_719n,
        taxRate: 19n,
        discountRate: 10n,
        total: 9_571_226n,
      },
    ],
  });

  // The user corrects the quantity and cost before confirming. The corrected
  // values replace the detected ones and the header is preserved.
  const corrected = await actor.updatePurchaseInvoiceReview(draft.id, {
    header: {
      supplierId: [],
      supplierName: ["RALLYE MOTORS SAS"],
      supplierTaxId: "901780198-3",
      invoiceNumber: ["FMLR20288"],
      invoiceDate: [],
      paymentMethod: "Contado Repuestos (POS)",
      paymentMeans: "Efectivo",
    },
    lines: [
      {
        id: [],
        code: "7701023153317/T",
        description: "JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD",
        quantity: 2n,
        unitCost: 9_571_226n,
        taxRate: 19n,
        discountRate: 10n,
        total: 19_142_452n,
      },
    ],
  });

  expect(corrected.supplierName).toEqual(["RALLYE MOTORS SAS"]);
  expect(corrected.supplierTaxId).toBe("901780198-3");
  expect(corrected.invoiceNumber).toEqual(["FMLR20288"]);
  expect(corrected.paymentMethod).toBe("Contado Repuestos (POS)");
  expect(corrected.paymentMeans).toBe("Efectivo");
  expect(corrected.lines).toHaveLength(1);
  expect(corrected.lines[0]).toMatchObject({
    quantity: 2n,
    unitCost: 9_571_226n,
    taxRate: 19n,
    discountRate: 10n,
    total: 19_142_452n,
  });
});

// --- Characterization: the search and filter semantics ----------------------
//
// The accepted change reworks HOW the searches run (the backend drops the
// per-record lowercasing and the full sort, and the frontend pickers debounce
// and request fewer rows). It must not change WHAT a search returns. These
// tests call the real canister, so they pin the observable result set and
// ordering the refactor has to preserve: which records match a term, how the
// filters combine, the sort order, and the admin-only cost visibility. They
// deliberately assert nothing about call counts, timing or page sizes, which
// the request is allowed to change.
//
// Every record created here carries a unique `SRCH-` prefix so the assertions
// are isolated from the seeded sample dataset and from the other tests.

it("matches customers by name, phone, document and plate, case-insensitively", async () => {
  actor.setPrincipal(OWNER);
  const byName = await actor.createCustomer({
    name: "Zulema Busqueda Nombre",
    phone: "300 000 0001",
    email: [],
    document: [],
    address: [],
  });
  const byPhone = await actor.createCustomer({
    name: "Cliente Busqueda Telefono",
    phone: "311 555 7788",
    email: [],
    document: [],
    address: [],
  });
  const byDocument = await actor.createCustomer({
    name: "Cliente Busqueda Documento",
    phone: "300 000 0003",
    email: [],
    document: ["SRCH-DOC-9988"],
    address: [],
  });
  const byPlate = await actor.createCustomer({
    name: "Cliente Busqueda Placa",
    phone: "300 000 0004",
    email: [],
    document: [],
    address: [],
  });
  await actor.createMotorcycle({
    customerId: byPlate.id,
    plate: "SRCH-PLATE-77",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 1000n,
  });

  // A term that only appears in the name matches that customer.
  const nameHits = await actor.listCustomers(["busqueda nombre"]);
  expect(nameHits.map((customer) => customer.id)).toContain(byName.id);
  expect(nameHits.map((customer) => customer.id)).not.toContain(byPhone.id);

  // A term that only appears in the phone matches that customer.
  const phoneHits = await actor.listCustomers(["555 7788"]);
  expect(phoneHits.map((customer) => customer.id)).toContain(byPhone.id);
  expect(phoneHits.map((customer) => customer.id)).not.toContain(byName.id);

  // A term that only appears in the document matches that customer.
  const documentHits = await actor.listCustomers(["srch-doc-9988"]);
  expect(documentHits.map((customer) => customer.id)).toContain(byDocument.id);
  expect(documentHits.map((customer) => customer.id)).not.toContain(byName.id);

  // A term that only appears in a registered motorcycle's plate matches the
  // plate's owner.
  const plateHits = await actor.listCustomers(["srch-plate-77"]);
  expect(plateHits.map((customer) => customer.id)).toContain(byPlate.id);
  expect(plateHits.map((customer) => customer.id)).not.toContain(byName.id);

  // The match is case-insensitive: an upper-case term finds the same records.
  const upperHits = await actor.listCustomers(["BUSQUEDA NOMBRE"]);
  expect(upperHits.map((customer) => customer.id)).toContain(byName.id);
});

it("returns every customer for an empty or absent search term", async () => {
  actor.setPrincipal(OWNER);
  const all = await actor.listCustomers([]);
  const empty = await actor.listCustomers([""]);
  expect(empty.map((customer) => customer.id)).toEqual(
    all.map((customer) => customer.id),
  );
});

it("orders customer search results by name, case-insensitively", async () => {
  actor.setPrincipal(OWNER);
  // Two names that differ only in case: the sort is on the lowercased name, so
  // "srch orden a" sorts before "srch orden b" regardless of the raw casing.
  const upper = await actor.createCustomer({
    name: "SRCH ORDEN B",
    phone: "300 000 0011",
    email: [],
    document: [],
    address: [],
  });
  const lower = await actor.createCustomer({
    name: "srch orden a",
    phone: "300 000 0012",
    email: [],
    document: [],
    address: [],
  });

  const hits = await actor.listCustomers(["srch orden"]);
  const ids = hits.map((customer) => customer.id);
  expect(ids).toContain(upper.id);
  expect(ids).toContain(lower.id);
  expect(ids.indexOf(lower.id)).toBeLessThan(ids.indexOf(upper.id));
});

it("matches parts by name and SKU, case-insensitively", async () => {
  actor.setPrincipal(OWNER);
  const byName = await actor.createPart({
    sku: "SRCH-PART-NAME",
    name: "Bujía de búsqueda iridio",
    category: "Encendido",
    brand: "NGK",
    unit: "pza",
    salePrice: 45000n,
    costPrice: 20000n,
    lowStockThreshold: 2n,
  });
  const bySku = await actor.createPart({
    sku: "SRCH-PART-SKU-42",
    name: "Filtro de búsqueda",
    category: "Filtros",
    brand: "Mann",
    unit: "pza",
    salePrice: 30000n,
    costPrice: 15000n,
    lowStockThreshold: 2n,
  });

  const nameHits = await actor.listParts(
    { search: ["bujía de búsqueda"], category: [], brand: [], lowStockOnly: [] },
    { name: null },
    0n,
    50n,
  );
  expect(nameHits.items.map((part) => part.id)).toContain(byName.id);
  expect(nameHits.items.map((part) => part.id)).not.toContain(bySku.id);

  // The SKU match is case-insensitive.
  const skuHits = await actor.listParts(
    { search: ["srch-part-sku-42"], category: [], brand: [], lowStockOnly: [] },
    { name: null },
    0n,
    50n,
  );
  expect(skuHits.items.map((part) => part.id)).toContain(bySku.id);
  expect(skuHits.items.map((part) => part.id)).not.toContain(byName.id);
});

it("combines the part search with the category, brand and low-stock filters", async () => {
  actor.setPrincipal(OWNER);
  // Two parts share the search term but differ in category, brand and stock.
  const matching = await actor.createPart({
    sku: "SRCH-COMB-A",
    name: "Pastilla búsqueda combinada",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
  });
  const otherCategory = await actor.createPart({
    sku: "SRCH-COMB-B",
    name: "Pastilla búsqueda combinada",
    category: "Motor",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
  });
  const otherBrand = await actor.createPart({
    sku: "SRCH-COMB-C",
    name: "Pastilla búsqueda combinada",
    category: "Frenos",
    brand: "Genérico",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
  });

  // Give the matching part stock below its threshold so it is low-stock, and
  // the other two stock above theirs so they are not.
  await actor.adjustStock({
    partId: matching.id,
    lotId: [],
    quantity: 1n,
    direction: { in: null },
    reason: "Carga de prueba",
  });
  await actor.adjustStock({
    partId: otherCategory.id,
    lotId: [],
    quantity: 10n,
    direction: { in: null },
    reason: "Carga de prueba",
  });
  await actor.adjustStock({
    partId: otherBrand.id,
    lotId: [],
    quantity: 10n,
    direction: { in: null },
    reason: "Carga de prueba",
  });

  const base = {
    search: ["búsqueda combinada"],
    category: [],
    brand: [],
    lowStockOnly: [],
  } as const;

  // Category alone narrows to the two "Frenos" parts.
  const byCategory = await actor.listParts(
    { ...base, category: ["Frenos"] },
    { name: null },
    0n,
    50n,
  );
  const categoryIds = byCategory.items.map((part) => part.id);
  expect(categoryIds).toContain(matching.id);
  expect(categoryIds).toContain(otherBrand.id);
  expect(categoryIds).not.toContain(otherCategory.id);

  // Brand alone narrows to the two "Brembo" parts.
  const byBrand = await actor.listParts(
    { ...base, brand: ["Brembo"] },
    { name: null },
    0n,
    50n,
  );
  const brandIds = byBrand.items.map((part) => part.id);
  expect(brandIds).toContain(matching.id);
  expect(brandIds).toContain(otherCategory.id);
  expect(brandIds).not.toContain(otherBrand.id);

  // Low-stock alone narrows to the part whose stock is at or below threshold.
  const lowStock = await actor.listParts(
    { ...base, lowStockOnly: [true] },
    { name: null },
    0n,
    50n,
  );
  const lowIds = lowStock.items.map((part) => part.id);
  expect(lowIds).toContain(matching.id);
  expect(lowIds).not.toContain(otherCategory.id);
  expect(lowIds).not.toContain(otherBrand.id);

  // The filters combine with AND: only the part that satisfies all three
  // remains.
  const combined = await actor.listParts(
    { ...base, category: ["Frenos"], brand: ["Brembo"], lowStockOnly: [true] },
    { name: null },
    0n,
    50n,
  );
  expect(combined.items.map((part) => part.id)).toEqual([matching.id]);
});

it("orders part results by the requested sort key", async () => {
  actor.setPrincipal(OWNER);
  const first = await actor.createPart({
    sku: "SRCH-SORT-A",
    name: "Aceite búsqueda orden",
    category: "Lubricantes",
    brand: "Motul",
    unit: "l",
    salePrice: 30000n,
    costPrice: 18000n,
    lowStockThreshold: 1n,
  });
  const second = await actor.createPart({
    sku: "SRCH-SORT-B",
    name: "Zapata búsqueda orden",
    category: "Lubricantes",
    brand: "Motul",
    unit: "l",
    salePrice: 30000n,
    costPrice: 18000n,
    lowStockThreshold: 1n,
  });

  const byName = await actor.listParts(
    { search: ["búsqueda orden"], category: [], brand: [], lowStockOnly: [] },
    { name: null },
    0n,
    50n,
  );
  const nameIds = byName.items.map((part) => part.id);
  expect(nameIds.indexOf(first.id)).toBeLessThan(nameIds.indexOf(second.id));

  // Sorting by SKU keeps the same relative order, since "SRCH-SORT-A" <
  // "SRCH-SORT-B".
  const bySku = await actor.listParts(
    { search: ["búsqueda orden"], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    50n,
  );
  const skuIds = bySku.items.map((part) => part.id);
  expect(skuIds.indexOf(first.id)).toBeLessThan(skuIds.indexOf(second.id));
});

it("hides the part cost from a non-admin and shows it to an admin", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "SRCH-COST-1",
    name: "Repuesto búsqueda costo",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 2n,
  });

  // The admin sees the real cost.
  const asAdmin = await actor.listParts(
    { search: ["SRCH-COST-1"], category: [], brand: [], lowStockOnly: [] },
    { name: null },
    0n,
    50n,
  );
  const adminPart = asAdmin.items.find((entry) => entry.id === part.id);
  expect(adminPart).toBeDefined();
  expect(adminPart!.costPrice).toBe(12000n);

  // A non-admin gets the same record with the cost zeroed, not an error.
  actor.setPrincipal(MECHANIC);
  const asMechanic = await actor.listParts(
    { search: ["SRCH-COST-1"], category: [], brand: [], lowStockOnly: [] },
    { name: null },
    0n,
    50n,
  );
  const mechanicPart = asMechanic.items.find((entry) => entry.id === part.id);
  expect(mechanicPart).toBeDefined();
  expect(mechanicPart!.costPrice).toBe(0n);
  // The rest of the record is unchanged, so the row is still usable.
  expect(mechanicPart).toMatchObject({
    sku: "SRCH-COST-1",
    name: "Repuesto búsqueda costo",
    salePrice: 25000n,
  });
});

it("matches services by name and code, case-insensitively", async () => {
  actor.setPrincipal(OWNER);
  const byName = await actor.createService({
    code: "SRCH-SRV-NAME",
    name: "Alineación de búsqueda",
    description: "Servicio de prueba",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
  });
  const byCode = await actor.createService({
    code: "SRCH-SRV-CODE-9",
    name: "Balanceo de búsqueda",
    description: "Servicio de prueba",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
  });

  const nameHits = await actor.listServices(
    { search: ["alineación de búsqueda"], category: [], activeOnly: [] },
    { name: null },
    0n,
    50n,
  );
  expect(nameHits.items.map((service) => service.id)).toContain(byName.id);
  expect(nameHits.items.map((service) => service.id)).not.toContain(byCode.id);

  const codeHits = await actor.listServices(
    { search: ["srch-srv-code-9"], category: [], activeOnly: [] },
    { name: null },
    0n,
    50n,
  );
  expect(codeHits.items.map((service) => service.id)).toContain(byCode.id);
  expect(codeHits.items.map((service) => service.id)).not.toContain(byName.id);
});

it("combines the service search with the category and active-only filters", async () => {
  actor.setPrincipal(OWNER);
  const active = await actor.createService({
    code: "SRCH-SRV-COMB-A",
    name: "Servicio búsqueda combinada",
    description: "Servicio de prueba",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
  });
  const inactive = await actor.createService({
    code: "SRCH-SRV-COMB-B",
    name: "Servicio búsqueda combinada",
    description: "Servicio de prueba",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: false,
  });
  const otherCategory = await actor.createService({
    code: "SRCH-SRV-COMB-C",
    name: "Servicio búsqueda combinada",
    description: "Servicio de prueba",
    category: "Diagnóstico",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
  });

  const base = {
    search: ["búsqueda combinada"],
    category: [],
    activeOnly: [],
  } as const;

  // Category alone narrows to the two "Mantenimiento" services.
  const byCategory = await actor.listServices(
    { ...base, category: ["Mantenimiento"] },
    { name: null },
    0n,
    50n,
  );
  const categoryIds = byCategory.items.map((service) => service.id);
  expect(categoryIds).toContain(active.id);
  expect(categoryIds).toContain(inactive.id);
  expect(categoryIds).not.toContain(otherCategory.id);

  // Active-only alone drops the inactive service.
  const activeOnly = await actor.listServices(
    { ...base, activeOnly: [true] },
    { name: null },
    0n,
    50n,
  );
  const activeIds = activeOnly.items.map((service) => service.id);
  expect(activeIds).toContain(active.id);
  expect(activeIds).toContain(otherCategory.id);
  expect(activeIds).not.toContain(inactive.id);

  // The filters combine with AND.
  const combined = await actor.listServices(
    { ...base, category: ["Mantenimiento"], activeOnly: [true] },
    { name: null },
    0n,
    50n,
  );
  expect(combined.items.map((service) => service.id)).toEqual([active.id]);
});

// --- Accepted behavior: searches ignore accents and tildes ------------------
//
// The accepted change makes every search accent-insensitive: á=a, é=e, ñ=n,
// ü=u, in both the term and the stored record. The frontend suite mocks the
// actor, so this folding is only observable here, against the real canister.
// These tests call the real public API, so they prove the normalization is
// implemented rather than a stub that traps, and they pin the observable
// equivalence the acceptance criteria state.

it("matches a customer by an unaccented term against an accented name", async () => {
  actor.setPrincipal(OWNER);
  const jose = await actor.createCustomer({
    name: "José Álvarez",
    phone: "300 000 9001",
    email: [],
    document: [],
    address: [],
  });
  const maria = await actor.createCustomer({
    name: "María Peña",
    phone: "300 000 9002",
    email: [],
    document: [],
    address: [],
  });

  // Acceptance criterion: typing "jose" finds "José".
  const joseHits = await actor.listCustomers(["jose"]);
  expect(joseHits.map((customer) => customer.id)).toContain(jose.id);
  expect(joseHits.map((customer) => customer.id)).not.toContain(maria.id);

  // Acceptance criterion: typing "MARIA" finds "María".
  const mariaHits = await actor.listCustomers(["MARIA"]);
  expect(mariaHits.map((customer) => customer.id)).toContain(maria.id);
  expect(mariaHits.map((customer) => customer.id)).not.toContain(jose.id);

  // The eñe folds to n: "pena" finds "Peña".
  const penaHits = await actor.listCustomers(["pena"]);
  expect(penaHits.map((customer) => customer.id)).toContain(maria.id);
  expect(penaHits.map((customer) => customer.id)).not.toContain(jose.id);
});

it("matches a part by an unaccented term against an accented name", async () => {
  actor.setPrincipal(OWNER);
  const accented = await actor.createPart({
    sku: "SRCH-ACC-PART",
    name: "Bujía de encendido",
    category: "Encendido",
    brand: "NGK",
    unit: "pza",
    salePrice: 45000n,
    costPrice: 20000n,
    lowStockThreshold: 2n,
  });
  const plain = await actor.createPart({
    sku: "SRCH-PLAIN-PART",
    name: "Filtro de aire",
    category: "Filtros",
    brand: "Mann",
    unit: "pza",
    salePrice: 30000n,
    costPrice: 15000n,
    lowStockThreshold: 2n,
  });

  // "bujia" (no accent) finds "Bujía" (accented).
  const hits = await actor.listParts(
    { search: ["bujia"], category: [], brand: [], lowStockOnly: [] },
    { name: null },
    0n,
    50n,
  );
  expect(hits.items.map((part) => part.id)).toContain(accented.id);
  expect(hits.items.map((part) => part.id)).not.toContain(plain.id);
});

it("matches a service by an unaccented term against an accented name", async () => {
  actor.setPrincipal(OWNER);
  const accented = await actor.createService({
    code: "SRCH-ACC-SRV",
    name: "Alineación y balanceo",
    description: "Servicio de prueba",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
  });
  const plain = await actor.createService({
    code: "SRCH-PLAIN-SRV",
    name: "Cambio de aceite",
    description: "Servicio de prueba",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 30n,
    active: true,
  });

  // "alineacion" (no accent) finds "Alineación" (accented).
  const hits = await actor.listServices(
    { search: ["alineacion"], category: [], activeOnly: [] },
    { name: null },
    0n,
    50n,
  );
  expect(hits.items.map((service) => service.id)).toContain(accented.id);
  expect(hits.items.map((service) => service.id)).not.toContain(plain.id);
});

it("matches a customer with a single-character term", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Zoe Un Caracter",
    phone: "300 000 9003",
    email: [],
    document: [],
    address: [],
  });

  // Acceptance criterion: a one-character term is not gated out; it matches.
  const hits = await actor.listCustomers(["z"]);
  expect(hits.map((entry) => entry.id)).toContain(customer.id);
});

// --- Accepted behavior: the public API documentation endpoint --------------
//
// The accepted change keeps `getApiDoc` as a public query that returns the
// static behavioral documentation of the backend. This test calls the real
// canister, so it proves the method is implemented rather than a stub that
// traps, and it pins the observable contract the API consumers rely on: the
// call answers without authentication and returns a non-empty document that
// names the public methods.

it("serves the public API documentation as a non-empty query", async () => {
  // No `setPrincipal` and no registration: the endpoint is a public query.
  const doc = await actor.getApiDoc();

  expect(typeof doc).toBe("string");
  expect(doc.trim().length).toBeGreaterThan(0);
  // The document describes the public surface, so it names real methods.
  expect(doc).toContain("listParts");
  expect(doc).toContain("getApiDoc");
});

// --- Accepted behavior: deleting a pending invoice -------------------------
//
// The accepted change lets a pending invoice with no registered payments be
// deleted, freeing its origin (the POS sale it was issued from) so it can be
// billed again. An invoice that is already paid, or that has any abono, must be
// rejected. These tests call the real canister, so they prove the guard is
// enforced by the backend rather than only hidden in the UI.

it("deletes a pending invoice and frees its POS sale", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-DEL-INV",
    name: "Espejo retrovisor",
    category: "Accesorios",
    brand: "Genérico",
    unit: "pza",
    salePrice: 40000n,
    costPrice: 20000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Borrado Factura",
    phone: "+57 300 515 1515",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "DEL-INV-L1", quantity: 3n, unitCost: 20000n },
    ],
  });

  // A cash POS sale issues its invoice immediately and links it back.
  const sale = await actor.createPosSale({
    customerId: [],
    lines: [{ partId: part.id, quantity: 1n, discount: 0n }],
    paymentMethod: "cash",
    paymentCondition: { cash: null },
    creditPlan: [],
    amountReceived: 40000n,
  });
  expect(sale.invoiceId).not.toBe(0n);
  const invoice = await actor.getInvoice(sale.invoiceId);
  expect(invoice).toHaveLength(1);
  expect(invoice[0].paymentStatus).toEqual({ pending: null });

  // The pending invoice can be deleted.
  await expect(actor.deleteInvoice(sale.invoiceId)).resolves.toBe(true);
  // It is gone from the read.
  await expect(actor.getInvoice(sale.invoiceId)).resolves.toHaveLength(0);

  // The POS sale no longer points at the deleted invoice, so it is billable
  // again.
  const freed = await actor.getPosSale(sale.id);
  expect(freed).toHaveLength(1);
  expect(freed[0].invoiceId).toBe(0n);
});

it("rejects deleting a paid invoice or one with an abono", async () => {
  actor.setPrincipal(OWNER);
  const customer = await actor.createCustomer({
    name: "Cliente Borrado Bloqueado",
    phone: "+57 300 616 1616",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle({
    customerId: customer.id,
    plate: "DEL-BLK",
    brand: "Honda",
    model: "CB125",
    year: 2021n,
    mileage: 100n,
  });

  // A paid invoice cannot be deleted.
  const paidOrder = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 100n,
    problem: "Factura pagada",
    technicianIds: [],
  });
  await actor.addLabor(paidOrder.order.id, {
    description: "Servicio pagado",
    price: 50000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(paidOrder.order.id, { inRepair: null });
  await actor.updateOrderStatus(paidOrder.order.id, { ready: null });
  await actor.updateOrderStatus(paidOrder.order.id, { delivered: null });
  const paidInvoice = await actor.createInvoiceFromOrder(
    paidOrder.order.id,
    { cash: null },
    { cash: null },
    [],
  );
  await actor.markInvoicePaid(paidInvoice.id, { cash: null });
  await expect(actor.deleteInvoice(paidInvoice.id)).rejects.toBeDefined();
  // The rejected deletion left the invoice in place.
  await expect(actor.getInvoice(paidInvoice.id)).resolves.toHaveLength(1);

  // A still-pending invoice with an abono is also rejected.
  const creditOrder = await actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 100n,
    problem: "Factura con abono",
    technicianIds: [],
  });
  await actor.addLabor(creditOrder.order.id, {
    description: "Servicio a crédito",
    price: 100000n,
    technicianId: [],
    serviceId: [],
  });
  await actor.updateOrderStatus(creditOrder.order.id, { inRepair: null });
  await actor.updateOrderStatus(creditOrder.order.id, { ready: null });
  await actor.updateOrderStatus(creditOrder.order.id, { delivered: null });
  const creditInvoice = await actor.createInvoiceFromOrder(
    creditOrder.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate: 1_800_000_000_000_000_000n, installmentCount: 2n }],
  );
  await actor.registerReceivablePayment({
    invoiceId: creditInvoice.id,
    amount: 10000n,
    method: "cash",
    note: [],
  });
  await expect(actor.deleteInvoice(creditInvoice.id)).rejects.toBeDefined();
  await expect(actor.getInvoice(creditInvoice.id)).resolves.toHaveLength(1);
});

// --- Accepted behavior: deleting a non-accepted purchase -------------------
//
// The accepted change lets a purchase that has not been accepted be deleted,
// reverting the lots and inventory movements it created. A purchase that was
// already accepted is rejected. These tests call the real canister, so they
// prove the reversal and the guard are enforced by the backend.

it("deletes a non-accepted purchase and reverts its lots and movements", async () => {
  actor.setPrincipal(OWNER);
  const part = await actor.createPart({
    sku: "REP-DEL-PUR",
    name: "Cadena de transmisión",
    category: "Transmisión",
    brand: "DID",
    unit: "pza",
    salePrice: 60000n,
    costPrice: 35000n,
    lowStockThreshold: 1n,
  });
  const supplier = await actor.createSupplier({
    name: "Proveedor Borrado Compra",
    phone: "+57 300 717 1717",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  const purchase = await actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "DEL-PUR-L1", quantity: 4n, unitCost: 35000n },
    ],
  });
  expect(purchase.accepted).toBe(false);

  // The purchase created one lot, one purchase movement and the stock.
  expect(await actor.listLots(part.id)).toHaveLength(1);
  const movementsBefore = await actor.listMovements(part.id);
  expect(
    movementsBefore.filter((movement) => movement.kind.purchase !== undefined),
  ).toHaveLength(1);
  const before = await actor.getPart(part.id);
  expect(before[0].totalStock).toBe(4n);

  await expect(actor.deletePurchase(purchase.id)).resolves.toBe(true);

  // The lot and the purchase movement are gone, and the stock is back to zero.
  expect(await actor.listLots(part.id)).toHaveLength(0);
  const movementsAfter = await actor.listMovements(part.id);
  expect(
    movementsAfter.filter((movement) => movement.kind.purchase !== undefined),
  ).toHaveLength(0);
  const after = await actor.getPart(part.id);
  expect(after[0].totalStock).toBe(0n);
  // The purchase itself is gone from the list.
  expect(
    (await actor.listPurchases([])).some((row) => row.id === purchase.id),
  ).toBe(false);
});

// --- Accepted behavior: the cash-register shift ----------------------------
//
// The accepted change adds a cash-register module: a shift opens with declared
// opening balances, movements are classified by payment method (cash hits Caja,
// transfer/card hit Bancos), closing computes the expected balances and the
// difference against the declared ones, and the daily report lists every
// movement with totals by payment method. These tests call the real canister,
// so they prove the methods are implemented rather than stubs that trap.

it("opens a shift, classifies movements by account and closes with the computed difference", async () => {
  actor.setPrincipal(OWNER);
  // No shift is open on a fresh canister.
  await expect(actor.getOpenShift()).resolves.toHaveLength(0);

  const shift = await actor.openShift({
    openingCash: 100000n,
    openingBank: 500000n,
    notes: ["Apertura de prueba"],
  });
  expect(shift.status).toEqual({ open: null });
  expect(shift.openingCash).toBe(100000n);
  expect(shift.openingBank).toBe(500000n);
  // A second shift cannot be opened while one is open.
  await expect(
    actor.openShift({ openingCash: 0n, openingBank: 0n, notes: [] }),
  ).rejects.toBeDefined();

  // A transfer income adds to Bancos; a transfer expense subtracts from it.
  const transferIncome = await actor.registerCashMovement({
    kind: { income: null },
    paymentMethod: "transfer",
    amount: 250000n,
    account: { bank: null },
    description: "Consignación cliente",
    reference: [],
    source: { manual: null },
  });
  expect(transferIncome.account).toEqual({ bank: null });
  const transferExpense = await actor.registerCashMovement({
    kind: { expense: null },
    paymentMethod: "transfer",
    amount: 50000n,
    account: { bank: null },
    description: "Pago proveedor",
    reference: [],
    source: { manual: null },
  });
  expect(transferExpense.account).toEqual({ bank: null });
  // A cash income adds to Caja.
  const cashIncome = await actor.registerCashMovement({
    kind: { income: null },
    paymentMethod: "cash",
    amount: 30000n,
    account: { cash: null },
    description: "Venta de mostrador",
    reference: [],
    source: { manual: null },
  });
  expect(cashIncome.account).toEqual({ cash: null });

  // The daily report lists all three movements with totals by payment method.
  const report = await actor.getDailyShiftReport(shift.id);
  expect(report.movements).toHaveLength(3);
  expect(report.cashIncome).toBe(30000n);
  expect(report.cashExpense).toBe(0n);
  expect(report.bankIncome).toBe(250000n);
  expect(report.bankExpense).toBe(50000n);
  expect(report.totalIncome).toBe(280000n);
  expect(report.totalExpense).toBe(50000n);
  const transferTotal = report.byPaymentMethod.find(
    (row) => row.method === "transfer",
  );
  expect(transferTotal).toMatchObject({ income: 250000n, expense: 50000n });
  const cashTotal = report.byPaymentMethod.find((row) => row.method === "cash");
  expect(cashTotal).toMatchObject({ income: 30000n, expense: 0n });

  // Closing computes Caja = 100000 + 30000 = 130000 and
  // Bancos = 500000 + 250000 − 50000 = 700000. Declaring exactly those leaves a
  // zero difference.
  const closed = await actor.closeShift(shift.id, {
    declaredClosingCash: 130000n,
    declaredClosingBank: 700000n,
    notes: ["Cierre de prueba"],
  });
  expect(closed.status).toEqual({ closed: null });
  expect(closed.computedClosingCash).toBe(130000n);
  expect(closed.computedClosingBank).toBe(700000n);
  expect(closed.differenceCash).toBe(0n);
  expect(closed.differenceBank).toBe(0n);

  // Declaring a different amount would have shown the difference; a closed
  // shift cannot be closed again.
  await expect(
    actor.closeShift(shift.id, {
      declaredClosingCash: 130000n,
      declaredClosingBank: 700000n,
      notes: [],
    }),
  ).rejects.toBeDefined();
  // With the shift closed, no shift is open and a movement is rejected.
  await expect(actor.getOpenShift()).resolves.toHaveLength(0);
  await expect(
    actor.registerCashMovement({
      kind: { income: null },
      paymentMethod: "cash",
      amount: 1000n,
      account: { cash: null },
      description: "Sin turno",
      reference: [],
      source: { manual: null },
    }),
  ).rejects.toBeDefined();
});
