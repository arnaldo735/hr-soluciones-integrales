import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend lane coverage for the accepted create-user flow.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose `createUser`/`login` are unimplemented stubs. These tests install the
 * app's own compiled wasm into the platform's PocketIC replica and call the real
 * public API, so they prove the accepted behavior is implemented:
 *
 * - `createUser` stores exactly the role id the administrator chose, rather than
 *   forcing Administrador;
 * - a freshly created user can log in with the temporary password and receives a
 *   session whose role matches the chosen role;
 * - a duplicate username is rejected with a clear Spanish error and creates
 *   nothing;
 * - a role id that does not exist falls back to Mecánico (id 1) rather than
 *   silently promoting the user to Administrador.
 *
 * The caller is the first registered principal, which the platform's access
 * control mixin promotes to admin, so `createUser` is authorized.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

const OWNER = Principal.fromText("aaaaa-aa");

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
  // this actor may call the admin-gated user endpoints.
  actor.setPrincipal(OWNER);
  await actor._initialize_access_control();
  await actor.saveCallerUserProfile("Dueño");
});

afterAll(async () => {
  await pic?.tearDown();
});

it("stores the explicitly chosen role instead of forcing Administrador", async () => {
  // A custom role with a non-zero, non-default id, so a backend that forced
  // Administrador (id 0) or the Mecánico fallback (id 1) would fail here.
  const role = await actor.createRole([], {
    name: "Jefe de Taller",
    modules: ["inventory"],
  });
  expect(role.id).not.toBe(0n);
  expect(role.id).not.toBe(1n);

  const created = await actor.createUser(
    [],
    "jefe.taller",
    "Jefe de Taller",
    role.id,
    "temporal-123",
  );

  // The created user carries exactly the chosen role, not Administrador.
  expect(created.roleId).toBe(role.id);
  expect(created.roleName).toBe("Jefe de Taller");
  expect(created.active).toBe(true);

  // The read agrees with the create reply, so the role is really stored.
  const page = await actor.listUsersPage([], ["jefe.taller"], 0n, 20n);
  const row = page.items.find((entry) => entry.username === "jefe.taller");
  expect(row).toBeDefined();
  expect(row).toMatchObject({ roleId: role.id, roleName: "Jefe de Taller" });
});

it("lets a freshly created user log in with the temporary password", async () => {
  const role = await actor.createRole([], {
    name: "Mecánico de Prueba",
    modules: ["inventory"],
  });
  await actor.createUser(
    [],
    "mecanico.login",
    "Mecánico Login",
    role.id,
    "clave-temporal-1",
  );

  const result = await actor.login("mecanico.login", "clave-temporal-1");

  // The login issues a session whose user matches the created account and role.
  expect(result.token.length).toBeGreaterThan(0);
  expect(result.user.username).toBe("mecanico.login");
  expect(result.user.name).toBe("Mecánico Login");
  expect(result.user.roleId).toBe(role.id);
  expect(result.user.roleName).toBe("Mecánico de Prueba");

  // The issued token resolves to the same session.
  const session = await actor.getSession(result.token);
  expect(session).toBeDefined();
  expect(session?.[0]).toMatchObject({
    username: "mecanico.login",
    roleId: role.id,
  });
});

it("rejects a duplicate username with a clear error and creates nothing", async () => {
  const role = await actor.createRole([], {
    name: "Rol Duplicado",
    modules: [],
  });
  await actor.createUser([], "repetido", "Primero", role.id, "temporal-123");

  await expect(
    actor.createUser([], "repetido", "Segundo", role.id, "temporal-456"),
  ).rejects.toThrow(/Ya existe un usuario con ese nombre de acceso/);

  // Only the first account exists; the rejected create added nothing.
  const page = await actor.listUsersPage([], ["repetido"], 0n, 20n);
  expect(page.items).toHaveLength(1);
  expect(page.items[0].name).toBe("Primero");
});

it("falls back to Mecánico for an unknown role instead of promoting to admin", async () => {
  const created = await actor.createUser(
    [],
    "rol.inexistente",
    "Rol Inexistente",
    999_999n,
    "temporal-123",
  );

  // The unknown role id is not stored; the user falls back to Mecánico (id 1),
  // never to Administrador (id 0).
  expect(created.roleId).toBe(1n);
  expect(created.roleName).toBe("Mecánico");
});
