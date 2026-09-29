import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend coverage for the accepted reminders summary (`getRemindersSummary`).
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose reminders method is an unimplemented stub that traps. This lane installs
 * the app's own compiled wasm into the platform's PocketIC replica and calls the
 * real public query, so it proves the aggregation is implemented and that the
 * accepted rules hold:
 *
 * - an administrator receives every section (present) and a `generatedAt`;
 * - a workshop order in `#received` shows up under `unapprovedOrders` with its
 *   number, customer name and plate;
 * - a quote in `#draft` shows up under `pendingQuotes`;
 * - an appointment in `#scheduled` shows up under `appointments`;
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

  // The first registered caller is promoted to admin by the platform mixin, so
  // it passes every module check the reminders sections are gated on.
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

it("answers an administrator with every section and a generation timestamp", async () => {
  actor.setPrincipal(OWNER);

  const summary = await actor.getRemindersSummary([]);

  // Every section is present for an admin; none is withheld.
  expect(summary.appointments).toHaveLength(1);
  expect(summary.receivables).toHaveLength(1);
  expect(summary.payables).toHaveLength(1);
  expect(summary.unapprovedOrders).toHaveLength(1);
  expect(summary.pendingQuotes).toHaveLength(1);
  expect(summary.finishedOrders).toHaveLength(1);
  // The timestamp is a real nanosecond value, not a zero placeholder.
  expect(summary.generatedAt).toBeGreaterThan(0n);
});

it("lists a received workshop order under unapprovedOrders", async () => {
  actor.setPrincipal(OWNER);

  const customer = await actor.createCustomer([], {
    name: "Cliente Recordatorio OT",
    phone: "300 111 0001",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle([], {
    model: "CB 190",
    mileage: 1200n,
    year: 2022n,
    customerId: customer.id,
    brand: "Honda",
    plate: "REC-001",
  });
  const order = await actor.createOrder([], {
    motorcycleId: motorcycle.id,
    customerId: customer.id,
    intakeMileage: 1200n,
    technicianIds: [],
    problem: "Revisión de recordatorios",
  });

  // `createOrder` seeds the order in `#received`, which is the state the
  // reminders section reports as pending approval.
  expect(order.order.status).toEqual({ received: null });

  const summary = await actor.getRemindersSummary([]);
  const section = summary.unapprovedOrders[0];
  expect(section).toBeDefined();
  if (section === undefined) return;

  expect(section.count).toBeGreaterThanOrEqual(1n);
  const item = section.items.find((entry) => entry.id === order.order.id);
  expect(item).toBeDefined();
  expect(item?.orderNumber).toBe(order.order.orderNumber);
  expect(item?.customerName).toBe("Cliente Recordatorio OT");
  expect(item?.plate).toBe("REC-001");
});

it("lists a draft quote under pendingQuotes", async () => {
  actor.setPrincipal(OWNER);

  const customer = await actor.createCustomer([], {
    name: "Cliente Recordatorio Cotización",
    phone: "300 111 0002",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle([], {
    model: "NKD 125",
    mileage: 800n,
    year: 2023n,
    customerId: customer.id,
    brand: "AKT",
    plate: "REC-002",
  });
  const quote = await actor.createQuote([], {
    serviceLines: [],
    notes: [],
    discount: 0n,
    motorcycleId: motorcycle.id,
    customerId: customer.id,
    partLines: [],
  });

  // `createQuote` seeds the quote in `#draft`, which the reminders section
  // reports as pending approval.
  expect(quote.quote.status).toEqual({ draft: null });

  const summary = await actor.getRemindersSummary([]);
  const section = summary.pendingQuotes[0];
  expect(section).toBeDefined();
  if (section === undefined) return;

  expect(section.count).toBeGreaterThanOrEqual(1n);
  const item = section.items.find((entry) => entry.id === quote.quote.id);
  expect(item).toBeDefined();
  expect(item?.quoteNumber).toBe(quote.quote.quoteNumber);
  expect(item?.customerName).toBe("Cliente Recordatorio Cotización");
  expect(item?.status).toBe("draft");
});

it("lists a scheduled appointment under appointments", async () => {
  actor.setPrincipal(OWNER);

  const customer = await actor.createCustomer([], {
    name: "Cliente Recordatorio Cita",
    phone: "300 111 0003",
    email: [],
    document: [],
    address: [],
  });
  const motorcycle = await actor.createMotorcycle([], {
    model: "XTZ 150",
    mileage: 500n,
    year: 2021n,
    customerId: customer.id,
    brand: "Yamaha",
    plate: "REC-003",
  });
  const appointment = await actor.createAppointment([], {
    durationMinutes: 60n,
    technicianId: [],
    motorcycleId: motorcycle.id,
    customerId: customer.id,
    scheduledAt: 1_800_000_000_000_000_000n,
    reason: "Cita de recordatorios",
  });

  // `createAppointment` seeds the appointment in `#scheduled`, which the
  // reminders section reports as pending.
  expect(appointment.status).toEqual({ scheduled: null });

  const summary = await actor.getRemindersSummary([]);
  const section = summary.appointments[0];
  expect(section).toBeDefined();
  if (section === undefined) return;

  expect(section.count).toBeGreaterThanOrEqual(1n);
  const item = section.items.find((entry) => entry.id === appointment.id);
  expect(item).toBeDefined();
  expect(item?.customerName).toBe("Cliente Recordatorio Cita");
  expect(item?.status).toBe("scheduled");
});

it("withholds every section from a caller without module access", async () => {
  actor.setPrincipal(MECHANIC);
  await actor.saveCallerUserProfile("Mecánico");

  const summary = await actor.getRemindersSummary([]);

  // No admin role and no session token: every module check fails, so every
  // section is withheld rather than leaking another user's pending work.
  expect(summary.appointments).toHaveLength(0);
  expect(summary.receivables).toHaveLength(0);
  expect(summary.payables).toHaveLength(0);
  expect(summary.unapprovedOrders).toHaveLength(0);
  expect(summary.pendingQuotes).toHaveLength(0);
  expect(summary.finishedOrders).toHaveLength(0);
});
