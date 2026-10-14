import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend coverage for the accepted operation-panel alert summary
 * (`getDashboardAlerts`).
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose `getDashboardAlerts` is an unimplemented stub that traps. This lane
 * installs the app's own compiled wasm into the platform's PocketIC replica and
 * calls the real public query, so it proves the aggregation is implemented and
 * that the accepted rules hold:
 *
 * - an administrator receives every section (present) and a `generatedAt`;
 * - a part whose total stock is at or below its low-stock threshold shows up
 *   under `lowStockParts`;
 * - a registered supplier order shows up under `supplierOrders`;
 * - an unpaid installment of a credit invoice whose due date is in the past
 *   shows up under `overdueInstallments`;
 * - a caller with no admin role and no session receives every section withheld.
 *
 * The Candid `opt` fields decode to `[]` (absent) or `[value]` (present), which
 * is the shape asserted here.
 *
 * The `finishedOrders` section is NOT exercised here: it only lists orders whose
 * `#ready` transition is more than three days old, and this lane does not
 * advance the replica clock. That threshold is a stated coverage limit.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

// Deterministic callers. A `Principal` is never constructed by hand: the client
// re-exports no `Principal`, and `@icp-sdk/core/principal` is not resolvable
// from the lane directory. An identity is the only supported way to name one.
const OWNER = createIdentity("dashboard-alerts-owner");
const MECHANIC = createIdentity("dashboard-alerts-mechanic");

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;

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

  // The first registered caller is promoted to admin by the platform mixin, so
  // it passes every module check the alert sections are gated on.
  actor.setIdentity(OWNER);
  await actor._initialize_access_control();
  await actor.saveCallerUserProfile("Dueño");
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers an administrator with every section and a generation timestamp", async () => {
  actor.setIdentity(OWNER);

  const summary = await actor.getDashboardAlerts([]);

  // Every section is present for an admin; none is withheld.
  expect(summary.appointments).toHaveLength(1);
  expect(summary.receivables).toHaveLength(1);
  expect(summary.payables).toHaveLength(1);
  expect(summary.unapprovedOrders).toHaveLength(1);
  expect(summary.pendingQuotes).toHaveLength(1);
  expect(summary.finishedOrders).toHaveLength(1);
  expect(summary.lowStockParts).toHaveLength(1);
  expect(summary.supplierOrders).toHaveLength(1);
  expect(summary.overdueInstallments).toHaveLength(1);
  // The timestamp is a real nanosecond value, not a zero placeholder.
  expect(summary.generatedAt).toBeGreaterThan(0n);
});

it("lists a part at or below its low-stock threshold under lowStockParts", async () => {
  actor.setIdentity(OWNER);

  // No purchase is registered, so total stock is 0, which is at or below the
  // threshold of 3.
  const part = await actor.createPart([], {
    sku: "ALERT-LOW-1",
    name: "Pastilla de freno alerta",
    category: "Frenos",
    brand: "Genérica",
    unit: "pza",
    salePrice: 30000n,
    costPrice: 15000n,
    lowStockThreshold: 3n,
  });

  const summary = await actor.getDashboardAlerts([]);
  const section = summary.lowStockParts[0];
  expect(section).toBeDefined();
  if (section === undefined) return;

  expect(section.count).toBeGreaterThanOrEqual(1n);
  const item = section.items.find((entry) => entry.id === part.id);
  expect(item).toBeDefined();
  expect(item?.sku).toBe("ALERT-LOW-1");
  expect(item?.name).toBe("Pastilla de freno alerta");
  expect(item?.totalStock).toBe(0n);
  expect(item?.lowStockThreshold).toBe(3n);
});

it("lists a registered supplier order under supplierOrders", async () => {
  actor.setIdentity(OWNER);

  const supplier = await actor.createSupplier([], {
    name: "Proveedor Alerta",
    phone: "300 555 0001",
    email: [],
    address: [],
    taxId: [],
    contactName: [],
  });
  const order = await actor.createSupplierOrder([], {
    supplierId: supplier.id,
    sku: "ALERT-SUP-1",
    description: "Pedido de alerta",
    quantity: 4n,
  });

  const summary = await actor.getDashboardAlerts([]);
  const section = summary.supplierOrders[0];
  expect(section).toBeDefined();
  if (section === undefined) return;

  expect(section.count).toBeGreaterThanOrEqual(1n);
  const item = section.items.find((entry) => entry.id === order.id);
  expect(item).toBeDefined();
  expect(item?.supplierId).toBe(supplier.id);
  expect(item?.supplierName).toBe("Proveedor Alerta");
  expect(item?.sku).toBe("ALERT-SUP-1");
  expect(item?.quantity).toBe(4n);
});

it("lists an unpaid past-due installment of a credit invoice under overdueInstallments", async () => {
  actor.setIdentity(OWNER);

  const customer = await actor.createCustomer([], {
    name: "Cliente Alerta Crédito",
    phone: "300 555 0002",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle([], {
    model: "CB 190",
    mileage: 1000n,
    year: 2022n,
    customerId: customer.id,
    brand: "Honda",
    plate: "ALR-001",
  });
  const order = await actor.createOrder([], {
    motorcycleId: motorcycle.id,
    customerId: customer.id,
    intakeMileage: 1000n,
    technicianIds: [],
    problem: "Alerta de cuotas",
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

  // A due date in the past (2020) makes the single installment overdue.
  const pastDueDate = 1_600_000_000_000_000_000n;
  const invoice = await actor.createInvoiceFromOrder(
    order.order.id,
    { cash: null },
    { credit: null },
    [{ firstDueDate: pastDueDate, installmentCount: 1n }],
  );

  const summary = await actor.getDashboardAlerts([]);
  const section = summary.overdueInstallments[0];
  expect(section).toBeDefined();
  if (section === undefined) return;

  expect(section.count).toBeGreaterThanOrEqual(1n);
  const item = section.items.find((entry) => entry.invoiceId === invoice.id);
  expect(item).toBeDefined();
  expect(item?.invoiceNumber).toBe(invoice.number);
  expect(item?.customerName).toBe("Cliente Alerta Crédito");
  expect(item?.installmentNumber).toBe(1n);
  expect(item?.dueDate).toBe(pastDueDate);
});

it("withholds every section from a caller without module access", async () => {
  actor.setIdentity(MECHANIC);
  await actor.saveCallerUserProfile("Mecánico");

  const summary = await actor.getDashboardAlerts([]);

  // No admin role and no session token: every module check fails, so every
  // section is withheld rather than leaking another user's pending work.
  expect(summary.appointments).toHaveLength(0);
  expect(summary.receivables).toHaveLength(0);
  expect(summary.payables).toHaveLength(0);
  expect(summary.unapprovedOrders).toHaveLength(0);
  expect(summary.pendingQuotes).toHaveLength(0);
  expect(summary.finishedOrders).toHaveLength(0);
  expect(summary.lowStockParts).toHaveLength(0);
  expect(summary.supplierOrders).toHaveLength(0);
  expect(summary.overdueInstallments).toHaveLength(0);
});
