import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend coverage for the accepted admin-editable "Términos y Condiciones de
 * Garantía" setting.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose warranty-terms methods are unimplemented stubs that trap. This lane
 * installs the app's own compiled wasm into the platform's PocketIC replica and
 * calls the real public API, so it proves the methods are implemented and that
 * the accepted rules hold:
 *
 * - `getWarrantyTermsSettings` answers with the seeded default text (the eight
 *   clauses plus the IMPORTANTE notice) rather than trapping;
 * - `updateWarrantyTermsSettings` round-trips the admin text and trims it;
 * - saving an empty or whitespace-only text falls back to the default text, so
 *   the warranty document is never blank;
 * - a non-admin caller cannot read or edit the setting.
 *
 * The default text is asserted only for being non-empty and containing the
 * IMPORTANTE notice, not frozen word for word: the exact copy is what the
 * administrator may replace.
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
  // it passes the `company` module check the warranty-terms endpoints require.
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

it("answers the warranty terms with the seeded default text instead of trapping", async () => {
  actor.setPrincipal(OWNER);

  const settings = await actor.getWarrantyTermsSettings([]);

  // The migration seeds the default text, so the read answers with a real
  // block rather than trapping or returning an empty string.
  expect(settings.text.trim().length).toBeGreaterThan(0);
  expect(settings.text).toContain("IMPORTANTE");
  expect(settings.text).toContain("ALCANCE DE LA GARANTÍA");
});

it("round-trips the admin warranty text and trims it", async () => {
  actor.setPrincipal(OWNER);

  const updated = await actor.updateWarrantyTermsSettings([], {
    text: "  Términos de garantía configurados por el administrador.  ",
  });
  expect(updated.text).toBe(
    "Términos de garantía configurados por el administrador.",
  );

  // The stored text survives the read, so the settings card and the warranty
  // document can render it after a reload.
  const read = await actor.getWarrantyTermsSettings([]);
  expect(read.text).toBe(
    "Términos de garantía configurados por el administrador.",
  );
});

it("falls back to the default text when an empty text is saved", async () => {
  actor.setPrincipal(OWNER);

  const updated = await actor.updateWarrantyTermsSettings([], {
    text: "   ",
  });
  expect(updated.text.trim().length).toBeGreaterThan(0);
  expect(updated.text).toContain("IMPORTANTE");

  // The read agrees with the write, so the document is never left blank.
  const read = await actor.getWarrantyTermsSettings([]);
  expect(read.text).toBe(updated.text);
});

it("blocks a non-admin from reading or editing the warranty terms", async () => {
  actor.setPrincipal(MECHANIC);
  await actor.saveCallerUserProfile("Mecánico");

  await expect(actor.getWarrantyTermsSettings([])).rejects.toBeDefined();
  await expect(
    actor.updateWarrantyTermsSettings([], { text: "Intruso" }),
  ).rejects.toBeDefined();
});
