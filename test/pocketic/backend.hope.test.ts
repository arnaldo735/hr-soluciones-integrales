import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend coverage for the accepted daily Biblical-hope feature.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose hope methods are unimplemented stubs that trap. This lane installs the
 * app's own compiled wasm into the platform's PocketIC replica and calls the
 * real public API, so it proves the methods are implemented and that the
 * accepted rules hold:
 *
 * - `getDailyHopeMessage` answers with a non-empty promise and a Colombia
 *   `DD/MM/AAAA` reference date, and rotates deterministically by Colombia day;
 * - `getHopeSettings` / `updateHopeSettings` round-trip the admin configuration
 *   (auto/manual, enabled, exact manual text and citation);
 * - manual mode with an empty text is rejected;
 * - `appendHope` (through `prepareWhatsAppMessage`) appends the promise to the
 *   outgoing message while preserving the original status text, and leaves the
 *   message untouched when the feature is disabled;
 * - a non-admin caller cannot read or edit the configuration.
 *
 * The email path (`notifyCustomer`) is not exercised here: it awaits the
 * platform email client, which a local replica cannot deliver. The WhatsApp
 * path shares the same `appendHope` helper, so the append rule is covered.
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
  // it passes the `company` module check the hope endpoints require.
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

it("answers the daily promise with a Colombia reference date instead of trapping", async () => {
  // `getDailyHopeMessage` is a public query: no token and no admin role.
  const message = await actor.getDailyHopeMessage();

  // The migration seeds the feature disabled, so the promise is not shown yet,
  // but the read still answers with a real promise rather than trapping.
  expect(message.enabled).toBe(false);
  expect(message.mode).toEqual({ auto: null });
  expect(message.text.trim().length).toBeGreaterThan(0);
  expect(message.citation.trim().length).toBeGreaterThan(0);
  // The reference date is the Colombia calendar day, `DD/MM/AAAA`.
  expect(message.referenceDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
});

it("round-trips the admin configuration in manual mode", async () => {
  actor.setPrincipal(OWNER);

  const updated = await actor.updateHopeSettings([], {
    enabled: true,
    mode: "manual",
    manualText: "Dios es nuestro amparo y fortaleza.",
    manualCitation: "Salmos 46:1",
  });
  expect(updated.enabled).toBe(true);
  expect(updated.mode).toEqual({ manual: null });
  expect(updated.manualText).toBe("Dios es nuestro amparo y fortaleza.");
  expect(updated.manualCitation).toBe("Salmos 46:1");

  // The stored configuration survives the read, so the settings card can
  // render it after a reload.
  const read = await actor.getHopeSettings([]);
  expect(read).toMatchObject({
    enabled: true,
    mode: { manual: null },
    manualText: "Dios es nuestro amparo y fortaleza.",
    manualCitation: "Salmos 46:1",
  });

  // The effective promise in manual mode is exactly the configured text.
  const message = await actor.getDailyHopeMessage();
  expect(message.enabled).toBe(true);
  expect(message.mode).toEqual({ manual: null });
  expect(message.text).toBe("Dios es nuestro amparo y fortaleza.");
  expect(message.citation).toBe("Salmos 46:1");
});

it("rotates the promise deterministically by Colombia day in auto mode", async () => {
  actor.setPrincipal(OWNER);
  await actor.updateHopeSettings([], {
    enabled: true,
    mode: "auto",
    manualText: "",
    manualCitation: "",
  });

  const first = await actor.getDailyHopeMessage();
  expect(first.mode).toEqual({ auto: null });
  expect(first.text.trim().length).toBeGreaterThan(0);

  // The same Colombia day yields the same promise, so a reload does not change
  // the message within a day.
  const second = await actor.getDailyHopeMessage();
  expect(second.text).toBe(first.text);
  expect(second.citation).toBe(first.citation);
  expect(second.referenceDate).toBe(first.referenceDate);
});

it("rejects manual mode with an empty text", async () => {
  actor.setPrincipal(OWNER);
  await expect(
    actor.updateHopeSettings([], {
      enabled: true,
      mode: "manual",
      manualText: "   ",
      manualCitation: "Salmos 46:1",
    }),
  ).rejects.toBeDefined();
});

it("appends the promise to the WhatsApp message while preserving the status text", async () => {
  actor.setPrincipal(OWNER);
  await actor.updateHopeSettings([], {
    enabled: true,
    mode: "manual",
    manualText: "El Señor es mi pastor; nada me faltará.",
    manualCitation: "Salmos 23:1",
  });

  const customer = await actor.createCustomer([], {
    name: "Ana Pérez",
    phone: "+57 300 111 2222",
    email: ["ana@example.com"],
    document: [],
    address: [],
  });

  // The `#service` context needs no referenced record, so the message is built
  // from the contact name and the business name alone.
  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    context: { service: null },
    referenceId: [],
    contactId: customer.id,
  });

  // The mixin unwraps the Result and returns the bare record, trapping on
  // error, so a resolved value is the prepared message itself.
  expect(result.contactName).toBe("Ana Pérez");
  // The original status text is preserved at the start of the message.
  expect(result.message).toContain("Hola Ana Pérez");
  // The promise and its citation are appended at the end.
  expect(result.message).toContain("El Señor es mi pastor; nada me faltará.");
  expect(result.message).toContain("Salmos 23:1");
  expect(result.message.endsWith("(Salmos 23:1)")).toBe(true);
});

it("leaves the WhatsApp message unchanged when the feature is disabled", async () => {
  actor.setPrincipal(OWNER);
  await actor.updateHopeSettings([], {
    enabled: false,
    mode: "manual",
    manualText: "El Señor es mi pastor; nada me faltará.",
    manualCitation: "Salmos 23:1",
  });

  const customer = await actor.createCustomer([], {
    name: "Beto Sin Mensaje",
    phone: "+57 300 333 4444",
    email: [],
    document: [],
    address: [],
  });

  const result = await actor.prepareWhatsAppMessage({
    contactKind: { customer: null },
    context: { service: null },
    referenceId: [],
    contactId: customer.id,
  });

  // No promise, no citation and no trailing blank line.
  expect(result.message).not.toContain("El Señor es mi pastor");
  expect(result.message).not.toContain("Salmos 23:1");
  expect(result.message.endsWith("\n")).toBe(false);
});

it("blocks a non-admin from reading or editing the hope configuration", async () => {
  actor.setPrincipal(MECHANIC);
  await actor.saveCallerUserProfile("Mecánico");

  await expect(actor.getHopeSettings([])).rejects.toBeDefined();
  await expect(
    actor.updateHopeSettings([], {
      enabled: true,
      mode: "manual",
      manualText: "Intruso",
      manualCitation: "Salmos 1:1",
    }),
  ).rejects.toBeDefined();
});
