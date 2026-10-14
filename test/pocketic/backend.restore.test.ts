import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend coverage for the accepted restore path (validateRestoreFile +
 * restoreSection).
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose restore methods are unimplemented stubs that trap. This lane installs
 * the app's own compiled wasm into the platform's PocketIC replica and calls
 * the real public API, so it proves the methods are implemented and that the
 * accepted rules hold:
 *
 * - `validateRestoreFile(token, json)` returns the preview (generatedAt,
 *   formatVersion, sections with their counts, totalSections) without failing,
 *   even for a large backup file that previously overflowed the canister stack
 *   (IC0502);
 * - `restoreSection(token, json, index)` applies one selected section without
 *   failing, even for a large file, and the restored records are readable
 *   afterwards;
 * - the public signatures are unchanged: the session token is the first
 *   argument and the file text follows;
 * - restoration stays admin-gated, and a file whose `formatVersion` exceeds
 *   `RESTORE_FORMAT_VERSION` (1) is rejected with `#incompatibleVersion`.
 *
 * The large file is the point of this lane: the previous implementation parsed
 * the whole file with the recursive `serde-core` parser, whose recursion depth
 * grew with the array length. A few thousand records is enough to overflow the
 * canister stack there while staying well under the ingress message size limit,
 * so this test fails on the old implementation and passes on the iterative
 * scanner.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

// Identities come from `@dfinity/pic` itself: `createIdentity(seed)` is
// deterministic, and a `Principal` is never constructed by hand because the
// package that exports that class is not importable from the lane directory.
const OWNER = createIdentity("restore-owner");
const MECHANIC = createIdentity("restore-mechanic");

/** The version this backend understands; a file above it is incompatible. */
const RESTORE_FORMAT_VERSION = 1n;

/**
 * Enough records that the old recursive parser overflowed the canister stack.
 * Each serialized customer is ~140 bytes, so this stays around 700 KB — large
 * enough to be the regression, small enough to fit one ingress message.
 */
const LARGE_CUSTOMER_COUNT = 5000;

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
  // it passes the admin gate the restore endpoints require.
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

/** One customer record in the shape `readCustomer` expects. */
function customerRecord(id: number) {
  return {
    id,
    name: `Cliente Restauración ${id}`,
    phone: `+57 300 ${String(id).padStart(7, "0")}`,
    email: null,
    document: null,
    address: null,
    createdAt: 1_700_000_000_000_000_000,
  };
}

/**
 * A backup file with a large `customers` section plus the two single-record
 * sections, in the shape the local backup produces: a root object with
 * `generatedAt`, `formatVersion` and one key per section.
 */
function largeBackupJson(customerCount = LARGE_CUSTOMER_COUNT): string {
  const customers = Array.from({ length: customerCount }, (_, index) =>
    customerRecord(index + 1),
  );
  return JSON.stringify({
    generatedAt: 1_700_000_000_000_000_000,
    formatVersion: Number(RESTORE_FORMAT_VERSION),
    customers,
    businessSettings: {
      name: "Taller Restauración",
      taxId: "900123456",
      address: "Calle 45 #12-30",
      phone: "+57 300 000 0000",
      taxRate: 16,
    },
    company: {
      legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
      documentType: "nit",
      taxId: "900123456",
      fiscalRegime: "responsableIva",
      taxResponsibility: "noAplica",
      address: "Calle 45 #12-30",
      city: "Bogotá D.C.",
      phone: "+57 300 000 0000",
      taxRate: 16,
      updatedAt: 1_700_000_000_000_000_000,
    },
  });
}

/** The index of a section key within the manifest's ordered plan. */
async function sectionIndex(key: string): Promise<bigint> {
  // The session token is the first argument; the admin caller is identified by
  // principal here, so the token is the empty option `[]`.
  const manifest = await actor.getLocalBackupManifest([]);
  const index = manifest.sections.indexOf(key);
  expect(index).toBeGreaterThanOrEqual(0);
  return BigInt(index);
}

it("validates a large backup file and returns its preview without failing", async () => {
  actor.setIdentity(OWNER);
  const json = largeBackupJson();

  // The accepted signature is `validateRestoreFile(token, json)`: the session
  // token is the first argument and the file text follows. The admin caller is
  // identified by principal here, so the token is the empty option `[]`.
  const outcome = await actor.validateRestoreFile([], json);

  // The call answers with a preview rather than trapping (the old recursive
  // parser overflowed the stack on a file this size).
  expect(outcome).toHaveProperty("ok");
  if (!("ok" in outcome)) {
    throw new Error(`validateRestoreFile returned an error: ${JSON.stringify(outcome)}`);
  }
  const preview = outcome.ok;

  // The generation date and format version come from the file.
  expect(preview.generatedAt).toBe(1_700_000_000_000_000_000n);
  expect(preview.formatVersion).toBe(RESTORE_FORMAT_VERSION);

  // The sections present in the file are reported with their record counts, in
  // the manifest's order.
  const byKey = new Map(preview.sections.map((section) => [section.key, section]));
  expect(byKey.get("customers")?.count).toBe(BigInt(LARGE_CUSTOMER_COUNT));
  expect(byKey.get("businessSettings")?.count).toBe(1n);
  expect(byKey.get("company")?.count).toBe(1n);
  expect(preview.totalSections).toBe(BigInt(preview.sections.length));
  expect(preview.totalSections).toBe(3n);

  // The reported index matches the manifest's plan, so the frontend can pass it
  // straight to `restoreSection`.
  expect(byKey.get("customers")?.index).toBe(await sectionIndex("customers"));
});

it("restores a large section and the records are readable afterwards", async () => {
  actor.setIdentity(OWNER);
  const json = largeBackupJson();
  const index = await sectionIndex("customers");

  // The accepted signature is `restoreSection(token, json, index)`.
  const outcome = await actor.restoreSection([], json, index);

  expect(outcome).toHaveProperty("ok");
  if (!("ok" in outcome)) {
    throw new Error(`restoreSection returned an error: ${JSON.stringify(outcome)}`);
  }
  expect(outcome.ok.key).toBe("customers");
  expect(outcome.ok.index).toBe(index);
  expect(outcome.ok.status).toEqual({ restored: null });
  expect(outcome.ok.restored).toBe(BigInt(LARGE_CUSTOMER_COUNT));

  // The section was actually applied: the large collection is readable through
  // the normal list endpoint.
  const customers = await actor.listCustomers([], []);
  expect(customers).toHaveLength(LARGE_CUSTOMER_COUNT);
  expect(customers.some((customer) => customer.name === "Cliente Restauración 1")).toBe(
    true,
  );
});

it("restores a single-record section from the same file", async () => {
  actor.setIdentity(OWNER);
  const json = largeBackupJson(10);
  const index = await sectionIndex("businessSettings");

  const outcome = await actor.restoreSection([], json, index);

  expect(outcome).toHaveProperty("ok");
  if (!("ok" in outcome)) {
    throw new Error(`restoreSection returned an error: ${JSON.stringify(outcome)}`);
  }
  expect(outcome.ok.key).toBe("businessSettings");
  expect(outcome.ok.status).toEqual({ restored: null });

  const settings = await actor.getBusinessSettings([]);
  expect(settings.name).toBe("Taller Restauración");
  expect(settings.taxRate).toBe(16n);
});

it("rejects a file whose format version is newer than this backend", async () => {
  actor.setIdentity(OWNER);
  const json = JSON.stringify({
    generatedAt: 1_700_000_000_000_000_000,
    formatVersion: Number(RESTORE_FORMAT_VERSION) + 1,
    customers: [customerRecord(1)],
  });

  const outcome = await actor.validateRestoreFile([], json);
  expect(outcome).toEqual({
    err: { incompatibleVersion: RESTORE_FORMAT_VERSION + 1n },
  });
});

it("rejects a file that is not a JSON object with a typed error", async () => {
  actor.setIdentity(OWNER);

  const outcome = await actor.validateRestoreFile([], "esto no es json");
  expect(outcome).toHaveProperty("err");
  if (!("err" in outcome)) {
    throw new Error("expected an error outcome");
  }
  expect(outcome.err).toHaveProperty("invalidFormat");
});

it("blocks a non-admin from validating and restoring", async () => {
  actor.setIdentity(MECHANIC);
  const json = largeBackupJson(1);

  await expect(actor.validateRestoreFile([], json)).rejects.toBeDefined();
  await expect(actor.restoreSection([], json, 0n)).rejects.toBeDefined();
});
