import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend lane coverage for the Caja y Bancos multi-register rework.
 *
 * The frontend suite mocks the actor, so it passes unchanged against a canister
 * whose cash methods are unimplemented stubs. These tests install the app's own
 * compiled wasm into the platform's PocketIC replica and call the real public
 * API, so they prove the accepted behavior is implemented:
 *
 * - a caja and a banco can each hold an open shift at the same time, and a
 *   second shift on the same register is rejected;
 * - a movement is bound to the chosen open shift and stays isolated per
 *   register;
 * - the responsible can be assigned and changed while the shift is open;
 * - closing one shift leaves the other open;
 * - a register with an open shift cannot be deleted, and can be once closed;
 * - the daily report and the history filters are scoped per register and
 *   responsible.
 *
 * The caller is the first registered principal, which the platform's access
 * control mixin promotes to admin, so the cash module gate is satisfied.
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
const OWNER = createIdentity("cash-owner");

let pic: PocketIc | undefined;
let actor: _SERVICE;
let cajaId: bigint;
let bancoId: bigint;
let cajaShiftId: bigint;
let bancoShiftId: bigint;

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

  const cajaShift = await actor.openShift([], {
    registerId: cajaId,
    responsibleName: "Ana Torres",
    responsibleUserId: [],
    openingCash: 100000n,
    openingBank: 0n,
    notes: [],
  });
  cajaShiftId = cajaShift.id;

  const bancoShift = await actor.openShift([], {
    registerId: bancoId,
    responsibleName: "Carlos Pérez",
    responsibleUserId: [],
    openingCash: 0n,
    openingBank: 500000n,
    notes: [],
  });
  bancoShiftId = bancoShift.id;
});

afterAll(async () => {
  await pic?.tearDown();
});

it("lists both open shifts and resolves each register's open shift", async () => {
  const open = await actor.listOpenShifts([]);
  expect(open.map((shift) => shift.id).sort()).toEqual(
    [cajaShiftId, bancoShiftId].sort(),
  );

  const cajaOpen = await actor.getOpenShift([], cajaId);
  expect(cajaOpen).toHaveLength(1);
  expect(cajaOpen[0]).toMatchObject({
    id: cajaShiftId,
    registerId: cajaId,
    responsibleName: "Ana Torres",
    status: { open: null },
  });

  const bancoOpen = await actor.getOpenShift([], bancoId);
  expect(bancoOpen).toHaveLength(1);
  expect(bancoOpen[0]).toMatchObject({
    id: bancoShiftId,
    registerId: bancoId,
    responsibleName: "Carlos Pérez",
    status: { open: null },
  });

  const registers = await actor.listCashRegisters(
    [],
    { kind: [], active: [], search: [] },
    0n,
    100n,
  );
  expect(registers.items.some((entry) => entry.id === cajaId)).toBe(true);
  expect(registers.items.some((entry) => entry.id === bancoId)).toBe(true);
  // The migration creates the "Caja principal" register that groups the
  // pre-existing shifts and movements.
  const principal = registers.items.find((entry) => entry.id === 0n);
  expect(principal).toMatchObject({ name: "Caja principal", kind: { cash: null } });
});

it("rejects a second open shift on the same register", async () => {
  await expect(
    actor.openShift([], {
      registerId: cajaId,
      responsibleName: "Otra persona",
      responsibleUserId: [],
      openingCash: 0n,
      openingBank: 0n,
      notes: [],
    }),
  ).rejects.toThrow(/Ya hay un turno abierto para esta caja o banco/);
});

it("derives the movement account from the payment method", async () => {
  const cashIncome = await actor.registerCashMovement([], {
    kind: { income: null },
    paymentMethod: { cash: null },
    account: { bank: null },
    amount: 50000n,
    description: "Venta en efectivo",
    reference: [],
    source: { manual: null },
    shiftId: [cajaShiftId],
  });
  // Efectivo always lands in Caja, even when the caller asked for Bancos.
  expect(cashIncome.account).toEqual({ cash: null });

  const transferIncome = await actor.registerCashMovement([], {
    kind: { income: null },
    paymentMethod: { transfer: null },
    account: { cash: null },
    amount: 200000n,
    description: "Consignación cliente",
    reference: [],
    source: { manual: null },
    shiftId: [bancoShiftId],
  });
  // Transferencia always lands in Bancos.
  expect(transferIncome.account).toEqual({ bank: null });

  const cardExpense = await actor.registerCashMovement([], {
    kind: { expense: null },
    paymentMethod: { card: null },
    account: { cash: null },
    amount: 30000n,
    description: "Pago con tarjeta",
    reference: [],
    source: { manual: null },
    shiftId: [bancoShiftId],
  });
  // Tarjeta also lands in Bancos.
  expect(cardExpense.account).toEqual({ bank: null });
});

it("keeps movements isolated per register", async () => {
  const cajaMovements = await actor.listCashMovements(
    [],
    {
      shiftId: [],
      registerId: [cajaId],
      kind: [],
      account: [],
      paymentMethod: [],
      from: [],
      to: [],
    },
    0n,
    50n,
  );
  expect(cajaMovements.items.length).toBeGreaterThan(0);
  expect(cajaMovements.items.every((entry) => entry.shiftId === cajaShiftId)).toBe(
    true,
  );

  const bancoMovements = await actor.listCashMovements(
    [],
    {
      shiftId: [],
      registerId: [bancoId],
      kind: [],
      account: [],
      paymentMethod: [],
      from: [],
      to: [],
    },
    0n,
    50n,
  );
  expect(bancoMovements.items.length).toBeGreaterThan(0);
  expect(
    bancoMovements.items.every((entry) => entry.shiftId === bancoShiftId),
  ).toBe(true);

  // The caja movement never appears under the banco shift.
  const bancoShiftMovements = await actor.listCashMovements(
    [],
    {
      shiftId: [bancoShiftId],
      registerId: [],
      kind: [],
      account: [],
      paymentMethod: [],
      from: [],
      to: [],
    },
    0n,
    50n,
  );
  expect(
    bancoShiftMovements.items.some((entry) => entry.shiftId === cajaShiftId),
  ).toBe(false);
});

it("aggregates each shift's daily report independently", async () => {
  const cajaReport = await actor.getDailyShiftReport([], cajaShiftId);
  expect(cajaReport.registerName).toBe("Caja mostrador");
  expect(cajaReport.responsibleName).toBe("Ana Torres");
  expect(cajaReport.cashIncome).toBe(50000n);
  expect(cajaReport.cashExpense).toBe(0n);
  expect(cajaReport.bankIncome).toBe(0n);
  expect(cajaReport.totalIncome).toBe(50000n);

  const bancoReport = await actor.getDailyShiftReport([], bancoShiftId);
  expect(bancoReport.registerName).toBe("Banco Bogotá");
  expect(bancoReport.responsibleName).toBe("Carlos Pérez");
  expect(bancoReport.bankIncome).toBe(200000n);
  expect(bancoReport.bankExpense).toBe(30000n);
  expect(bancoReport.cashIncome).toBe(0n);
  expect(bancoReport.totalIncome).toBe(200000n);
  expect(bancoReport.totalExpense).toBe(30000n);
});

it("changes the responsible of an open shift", async () => {
  const updated = await actor.setShiftResponsible(
    [],
    cajaShiftId,
    "Luis Gómez",
    [],
  );
  expect(updated.responsibleName).toBe("Luis Gómez");

  const report = await actor.getDailyShiftReport([], cajaShiftId);
  expect(report.responsibleName).toBe("Luis Gómez");
});

it("closes only the chosen shift", async () => {
  // Computed caja: 100000 + 50000 = 150000. Declare 140000 (a -10000 diff).
  const closedCaja = await actor.closeShift([], cajaShiftId, {
    declaredClosingCash: 140000n,
    declaredClosingBank: 0n,
    notes: [],
  });
  expect(closedCaja.status).toEqual({ closed: null });
  expect(closedCaja.computedClosingCash).toBe(150000n);
  expect(closedCaja.differenceCash).toBe(-10000n);

  // The banco shift is untouched.
  const bancoOpen = await actor.getOpenShift([], bancoId);
  expect(bancoOpen).toHaveLength(1);
  expect(bancoOpen[0].id).toBe(bancoShiftId);
  expect(bancoOpen[0].status).toEqual({ open: null });
});

it("blocks deleting a register with an open shift and allows it once closed", async () => {
  await expect(actor.deleteCashRegister([], bancoId)).rejects.toThrow(
    /No se puede eliminar una caja o banco con un turno abierto/,
  );

  // Computed banco: 500000 + 200000 - 30000 = 670000, declared exactly.
  const closedBanco = await actor.closeShift([], bancoShiftId, {
    declaredClosingCash: 0n,
    declaredClosingBank: 670000n,
    notes: [],
  });
  expect(closedBanco.computedClosingBank).toBe(670000n);
  expect(closedBanco.differenceBank).toBe(0n);

  await actor.deleteCashRegister([], bancoId);
  const registers = await actor.listCashRegisters(
    [],
    { kind: [], active: [], search: [] },
    0n,
    100n,
  );
  expect(registers.items.some((entry) => entry.id === bancoId)).toBe(false);
});

it("filters the shift history by register and responsible", async () => {
  const byRegister = await actor.listShifts(
    [],
    { registerId: [cajaId], status: [], from: [], to: [], responsible: [] },
    0n,
    50n,
  );
  expect(byRegister.items.some((entry) => entry.id === cajaShiftId)).toBe(true);
  expect(byRegister.items.every((entry) => entry.registerId === cajaId)).toBe(
    true,
  );

  const byResponsible = await actor.listShifts(
    [],
    {
      registerId: [],
      status: [],
      from: [],
      to: [],
      responsible: ["Luis Gómez"],
    },
    0n,
    50n,
  );
  expect(byResponsible.items.some((entry) => entry.id === cajaShiftId)).toBe(
    true,
  );
  expect(
    byResponsible.items.every((entry) => entry.responsibleName === "Luis Gómez"),
  ).toBe(true);
});
