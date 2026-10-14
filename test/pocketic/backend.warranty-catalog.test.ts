import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend coverage for the catalog services that activate the automatic
 * "Términos y Condiciones de Garantía" document.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose catalog is empty or whose migration never ran. This lane installs the
 * app's own compiled wasm into the platform's PocketIC replica and reads the
 * real catalog, so it proves the accepted requirement that the two warranty
 * services are actually selectable in the work order:
 *
 * - the seeded catalog contains "Reparación de motor" and "Reparación de cabeza
 *   de fuerza", active, so the labor picker can offer them;
 * - the migration is idempotent: re-reading the catalog does not duplicate them;
 * - the pre-existing seeded services (SRV-001..SRV-005) are still present, so
 *   the migration added to the catalog instead of replacing it.
 *
 * The exact labor rate and estimated minutes are not frozen: they are catalog
 * data the administrator may edit, and only the identity of the two services
 * decides whether the warranty document applies.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-em revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

const OWNER = Principal.fromText("aaaaa-aa");

/** The two catalog services the accepted requirement adds. */
const WARRANTY_SERVICE_NAMES = [
  "Reparación de motor",
  "Reparación de cabeza de fuerza",
];

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
    // schema, which is what runs the seeding migration.
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
  // it passes the module check the catalog read requires.
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

/** Reads the whole active catalog through the real public API. */
async function listActiveServices() {
  actor.setPrincipal(OWNER);
  const page = await actor.listServices(
    [],
    { search: [], category: [], activeOnly: [true] },
    { name: null },
    0n,
    200n,
  );
  return page.items;
}

it("seeds the two warranty services as active catalog entries", async () => {
  const services = await listActiveServices();

  for (const name of WARRANTY_SERVICE_NAMES) {
    const match = services.find((service) => service.name === name);
    expect(match, `catalog is missing "${name}"`).toBeDefined();
    expect(match?.active).toBe(true);
    // The picker shows the code and the name, so both must be non-empty.
    expect(match?.code.trim().length).toBeGreaterThan(0);
  }
});

it("keeps the pre-existing seeded services alongside the new ones", async () => {
  const services = await listActiveServices();

  const seededCodes = services
    .map((service) => service.code)
    .filter((code) => /^SRV-00[1-5]$/u.test(code));
  // The migration adds to the catalog; it must not replace what was there.
  expect(new Set(seededCodes).size).toBeGreaterThanOrEqual(5);
});

it("does not duplicate the warranty services on a repeated read", async () => {
  const first = await listActiveServices();
  const second = await listActiveServices();

  for (const name of WARRANTY_SERVICE_NAMES) {
    const firstCount = first.filter((service) => service.name === name).length;
    const secondCount = second.filter((service) => service.name === name).length;
    expect(firstCount).toBe(1);
    expect(secondCount).toBe(1);
  }
});
