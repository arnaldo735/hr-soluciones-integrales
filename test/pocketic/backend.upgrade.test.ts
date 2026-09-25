import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory as previousIdlFactory } from "../../.old/src/frontend/src/declarations/backend.did.js";
import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Migration coverage for the unified IVA rate.
 *
 * The accepted change makes `CompanyProfile.taxRate` the single stored rate and
 * the fiscal regime the only source of truth for whether IVA applies. This test
 * installs the previous revision, writes a company profile and a workshop order
 * through the OLD public API, upgrades to the wasm this build produces, and
 * reads both back through the NEW API. It proves the migration carries the
 * profile and its stored rate across the upgrade, and that the upgraded canister
 * applies the regime rule to the order it inherited.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
const PREVIOUS_WASM = process.env.BACKEND_WASM_PREVIOUS ?? "";

const OWNER = Principal.fromText("aaaaa-aa");

let pic: PocketIc | undefined;

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("carries the company profile and its stored IVA rate through the upgrade", async () => {
  // 1. Install the version the user is actually running.
  const previous = await pic!.setupCanister({
    idlFactory: previousIdlFactory,
    wasm: PREVIOUS_WASM,
  });

  // 2. Write data through the OLD public API, as the deployed app did. The
  //    first registered caller is promoted to admin by the platform mixin.
  previous.actor.setPrincipal(OWNER);
  await previous.actor._initialize_access_control();
  await previous.actor.saveCallerUserProfile("Dueño");

  // The previous revision's order totals read the rate from the business
  // settings, so both stores carry 16 here. The migration must carry the
  // profile's stored rate into the current `CompanyProfile.taxRate`.
  await previous.actor.updateBusinessSettings({
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
  });
  await previous.actor.updateCompanyProfile({
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

  const customer = await previous.actor.createCustomer({
    name: "Cliente Migración",
    phone: "+57 300 123 4567",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await previous.actor.createMotorcycle({
    customerId: customer.id,
    plate: "MIG-001",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 15000n,
  });
  const part = await previous.actor.createPart({
    sku: "REP-MIG-1",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 1n,
  });
  const supplier = await previous.actor.createSupplier({
    name: "Proveedor Migración",
    phone: "+57 300 765 4321",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  await previous.actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "MIG-L1", quantity: 10n, unitCost: 12000n },
    ],
  });

  const order = await previous.actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 15000n,
    problem: "Frenos ruidosos",
    technicianIds: [],
  });
  // 2 × 25000 = 50000 parts, plus 30000 labor = 80000 subtotal.
  await previous.actor.addOrderPart(order.order.id, {
    partId: part.id,
    lotId: [],
    quantity: 2n,
  });
  const before = await previous.actor.addLabor(order.order.id, {
    description: "Ajuste de frenos",
    price: 30000n,
    technicianId: [],
    serviceId: [],
  });
  // The old revision applied the configured 16% rate.
  expect(before.totals.subtotal).toBe(80000n);
  expect(before.totals.taxRate).toBe(16n);
  expect(before.totals.tax).toBe(12800n);

  // 3. Upgrade to the version this build produces. The migration runs here.
  //    `wasm_memory_persistence: keep` is REQUIRED: these canisters are built
  //    with enhanced orthogonal persistence, and an upgrade without it is
  //    rejected with "Missing upgrade option".
  await pic!.upgradeCanister({
    canisterId: previous.canisterId,
    wasm: BACKEND_WASM,
    upgradeModeOptions: {
      skip_pre_upgrade: [],
      wasm_memory_persistence: [{ keep: null }],
    },
  });

  // 4. Read through the NEW API and assert both survival and the new shape.
  const upgraded = pic!.createActor<_SERVICE>(idlFactory, previous.canisterId);
  upgraded.setPrincipal(OWNER);

  const profile = await upgraded.getCompanyProfile();
  expect(profile.legalName).toBe("HR SOLUCIONES INTEGRALES S.A.S.");
  expect(profile.taxId).toBe("900123456");
  // The stored rate survives the upgrade, so switching back to responsable
  // reuses it instead of falling back to the default.
  expect(profile.taxRate).toBe(16n);
  // The migration supplies the fiscal regime the IVA decision reads.
  expect(profile.fiscalRegime).toEqual({ responsableIva: null });

  // The order written by the previous version survives, and the upgraded
  // canister applies the regime rule to it: a responsable company with a
  // configured 16% rate still charges 16%.
  const view = await upgraded.getOrder(order.order.id);
  expect(view).toHaveLength(1);
  expect(view[0].order.orderNumber).toBe(order.order.orderNumber);
  expect(view[0].totals.subtotal).toBe(80000n);
  expect(view[0].totals.taxRate).toBe(16n);
  expect(view[0].totals.tax).toBe(12800n);
  expect(view[0].totals.total).toBe(92800n);
});

/**
 * Characterization: every kind of saved record survives the upgrade.
 *
 * The accepted request is that records already saved by the deployed app stay
 * visible after a deploy. The migration test above proves the company profile
 * and one workshop order survive; this test widens the net to one record of
 * every list the app shows — clientes, servicios, inventario, órdenes,
 * cotizaciones, facturas, gastos, cuentas por cobrar, cuentas por pagar and
 * comisiones. It writes each through the OLD public API, upgrades to the wasm
 * this build produces, and reads each back through the NEW API.
 *
 * It deliberately asserts only that the record is present and identifiable, not
 * how many rows a page returns: the accepted change may raise the frontend page
 * limits, and freezing a page size here would fight that change.
 */
it("carries one record of every list through the upgrade", async () => {
  // Its own canister, so it cannot disturb the state the test above asserts on.
  const previous = await pic!.setupCanister({
    idlFactory: previousIdlFactory,
    wasm: PREVIOUS_WASM,
  });
  previous.actor.setPrincipal(OWNER);
  await previous.actor._initialize_access_control();
  await previous.actor.saveCallerUserProfile("Dueño");

  // --- Clientes, servicios, inventario, proveedores ------------------------
  const customer = await previous.actor.createCustomer({
    name: "Cliente Supervivencia",
    phone: "+57 300 111 2233",
    email: ["supervivencia@example.com"],
    document: ["900111222"],
    address: ["Calle 1 #2-3"],
  });
  const motorcycle = await previous.actor.createMotorcycle({
    customerId: customer.id,
    plate: "SUR-001",
    brand: "Honda",
    model: "CB190R",
    year: 2022n,
    mileage: 12000n,
  });
  const service = await previous.actor.createService({
    code: "SRV-SUR-1",
    name: "Cambio de aceite",
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
  });
  const part = await previous.actor.createPart({
    sku: "REP-SUR-1",
    name: "Filtro de aceite",
    category: "Motor",
    brand: "Mann",
    unit: "pza",
    salePrice: 20000n,
    costPrice: 9000n,
    lowStockThreshold: 1n,
  });
  const supplier = await previous.actor.createSupplier({
    name: "Proveedor Supervivencia",
    phone: "+57 300 444 5566",
    email: ["proveedor@example.com"],
    address: ["Carrera 9 #8-7"],
    taxId: ["900333444"],
    contactName: ["Contacto"],
  });
  // A purchase creates the payable and the lot the inventory read values.
  await previous.actor.createPurchase({
    supplierId: supplier.id,
    items: [
      { partId: part.id, lotNumber: "SUR-L1", quantity: 10n, unitCost: 9000n },
    ],
  });

  // --- Órdenes, comisiones, cotizaciones, facturas, gastos -----------------
  const technician = await previous.actor.createTechnician({
    code: "TEC-SUR-1",
    name: "Técnico Supervivencia",
    specialty: "Mecánica general",
    hourlyRate: 30000n,
    commissionRate: 10n,
    phone: "+57 300 777 8899",
    email: ["tecnico@example.com"],
    active: true,
  });

  const order = await previous.actor.createOrder({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    intakeMileage: 12000n,
    problem: "Mantenimiento general",
    technicianIds: [technician.id],
  });
  await previous.actor.addOrderPart(order.order.id, {
    partId: part.id,
    lotId: [],
    quantity: 2n,
  });
  await previous.actor.addLabor(order.order.id, {
    description: "Mano de obra",
    price: 45000n,
    technicianId: [technician.id],
    serviceId: [service.id],
  });
  // Only a delivered order is billable and only delivered orders pay commission.
  await previous.actor.updateOrderStatus(order.order.id, { inRepair: null });
  await previous.actor.updateOrderStatus(order.order.id, { ready: null });
  await previous.actor.updateOrderStatus(order.order.id, { delivered: null });

  const quote = await previous.actor.createQuote({
    customerId: customer.id,
    motorcycleId: motorcycle.id,
    notes: ["Cotización de muestra"],
    discount: 0n,
    serviceLines: [
      {
        description: "Cambio de aceite",
        quantity: 1n,
        unitPrice: 45000n,
        serviceId: [service.id],
      },
    ],
    partLines: [
      { quantity: 1n, unitPrice: 20000n, partId: part.id },
    ],
  });

  // A credit invoice produces the receivable the accounts view lists.
  const invoice = await previous.actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate: 1_800_000_000_000_000_000n, installmentCount: 2n }],
  );

  const expenseCategory = await previous.actor.createExpenseCategory({
    name: "Arriendo Supervivencia",
    description: "Categoría de muestra",
  });
  const expense = await previous.actor.createExpense({
    tax: 0n,
    concept: "Arriendo del taller",
    paymentMethod: "cash",
    receiptUrl: [],
    date: 1_700_000_000_000_000_000n,
    categoryId: expenseCategory.id,
    amount: 200000n,
    supplierId: [],
  });

  // --- Upgrade to the version this build produces --------------------------
  await pic!.upgradeCanister({
    canisterId: previous.canisterId,
    wasm: BACKEND_WASM,
    upgradeModeOptions: {
      skip_pre_upgrade: [],
      wasm_memory_persistence: [{ keep: null }],
    },
  });

  const upgraded = pic!.createActor<_SERVICE>(idlFactory, previous.canisterId);
  upgraded.setPrincipal(OWNER);

  // --- Every list still shows the record written before the upgrade --------
  const customers = await upgraded.listCustomers([]);
  expect(customers.some((row) => row.id === customer.id)).toBe(true);

  const services = await upgraded.listServices(
    { search: [], category: [], activeOnly: [] },
    { code: null },
    0n,
    100n,
  );
  expect(services.items.some((row) => row.id === service.id)).toBe(true);

  const parts = await upgraded.listParts(
    { search: [], category: [], brand: [], lowStockOnly: [] },
    { sku: null },
    0n,
    100n,
  );
  const partRow = parts.items.find((row) => row.id === part.id);
  expect(partRow).toBeDefined();
  // The lot written before the upgrade is still counted as stock.
  expect(partRow?.totalStock).toBe(10n);

  const orders = await upgraded.listOrders({ status: [], search: [] }, 0n, 100n);
  expect(orders.items.some((row) => row.order.id === order.order.id)).toBe(true);

  const quotes = await upgraded.listQuotes(
    { status: [], search: [] },
    { createdAt: null },
    0n,
    100n,
  );
  expect(quotes.items.some((row) => row.quote.id === quote.quote.id)).toBe(true);

  const invoices = await upgraded.listInvoices(
    { to: [], from: [], search: [] },
    0n,
    100n,
  );
  expect(invoices.items.some((row) => row.id === invoice.id)).toBe(true);

  const expenses = await upgraded.listExpenses(
    { to: [], from: [], search: [], categoryId: [], paymentMethod: [] },
    0n,
    100n,
  );
  expect(expenses.items.some((row) => row.id === expense.id)).toBe(true);

  // The credit invoice is still an outstanding receivable.
  const receivables = await upgraded.listReceivables({
    status: [],
    search: [],
  });
  expect(receivables.some((row) => row.invoiceId === invoice.id)).toBe(true);

  // The purchase is still an outstanding payable to the supplier.
  const payables = await upgraded.listPayables();
  expect(payables.some((row) => row.supplierId === supplier.id)).toBe(true);

  // The delivered order's labor still produces a commission line.
  const commissionLines = await upgraded.listCommissionLines([], {
    from: [],
    to: [],
  });
  expect(
    commissionLines.some(
      (line) => line.orderId === order.order.id && line.technicianId === technician.id,
    ),
  ).toBe(true);
});

/**
 * Accepted behavior: the Google Drive backup state survives the upgrade.
 *
 * The accepted change adds a `driveCredentials` field to the stable state,
 * initialized to `null` by the migration. This test installs the previous
 * revision, upgrades to the wasm this build produces, and reads the backup
 * endpoints through the NEW API. It proves the migration supplies the new field
 * (the status read answers instead of trapping) and that the upgraded canister
 * reports a disconnected Drive with the controlled `#notConnected` error, so an
 * administrator who had not connected Drive before the deploy is not left with
 * a broken backup card.
 */
it("supplies the new Drive backup state through the upgrade", async () => {
  const previous = await pic!.setupCanister({
    idlFactory: previousIdlFactory,
    wasm: PREVIOUS_WASM,
  });
  previous.actor.setPrincipal(OWNER);
  await previous.actor._initialize_access_control();
  await previous.actor.saveCallerUserProfile("Dueño");

  await pic!.upgradeCanister({
    canisterId: previous.canisterId,
    wasm: BACKEND_WASM,
    upgradeModeOptions: {
      skip_pre_upgrade: [],
      wasm_memory_persistence: [{ keep: null }],
    },
  });

  const upgraded = pic!.createActor<_SERVICE>(idlFactory, previous.canisterId);
  upgraded.setPrincipal(OWNER);

  // The migration initialized the new field, so the status read answers.
  await expect(upgraded.getDriveConnectionStatus()).resolves.toMatchObject({
    connected: false,
  });
  // With no stored credentials, the backup and history reads report the
  // controlled `#notConnected` error rather than trapping.
  await expect(upgraded.createBackup()).resolves.toEqual({
    err: { notConnected: null },
  });
  await expect(upgraded.listBackups()).resolves.toEqual({
    err: { notConnected: null },
  });
});
