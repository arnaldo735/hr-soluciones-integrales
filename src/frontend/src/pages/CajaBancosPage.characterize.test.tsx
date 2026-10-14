import type { UserListItem, UserPage } from "@/backend";
import type {
  CashMovement,
  CashMovementPage,
  CashRegister,
  CashRegisterPage,
  CompanyProfile,
  Shift,
  ShiftPage,
} from "@/lib/types";
import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  CashRegisterKind,
  DocumentType,
  FiscalRegime,
  PaymentMethod,
  ShiftStatus,
  TaxResponsibility,
} from "@/lib/types";
import { CajaBancosPage } from "@/pages/CajaBancosPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the Caja y Bancos behavior that must survive
 * the multi-register rework.
 *
 * The accepted change turns the single global shift into several registers
 * (cajas y bancos), each with at most one open shift, and adds an assignable
 * responsible. These tests deliberately do NOT assert the single-register rule
 * or the absence of a responsible field — those are the behaviors the change
 * intentionally replaces. They protect the surrounding contract instead:
 *
 *   - an egreso is classified by payment method, with efectivo hitting Caja;
 *   - the movement form rejects a zero amount and a missing description before
 *     it ever reaches the backend;
 *   - the history filters (status and date range) reach `listShifts` as the
 *     typed filter the backend consumes.
 *
 * They exercise the real page against a typed local actor mock, so they pin the
 * observable wiring rather than the page's internal state.
 */

const listOpenShiftsMock = vi.fn();
const listCashRegistersMock = vi.fn();
const openShiftMock = vi.fn();
const closeShiftMock = vi.fn();
const listShiftsMock = vi.fn();
const listCashMovementsMock = vi.fn();
const registerCashMovementMock = vi.fn();
const getDailyShiftReportMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const listUsersPageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listOpenShifts: listOpenShiftsMock,
      listCashRegisters: listCashRegistersMock,
      openShift: openShiftMock,
      closeShift: closeShiftMock,
      listShifts: listShiftsMock,
      listCashMovements: listCashMovementsMock,
      registerCashMovement: registerCashMovementMock,
      getDailyShiftReport: getDailyShiftReportMock,
      getCompanyProfile: getCompanyProfileMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
      listUsersPage: listUsersPageMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;
const PRINCIPAL = Principal.fromText("aaaaa-aa");

function register(overrides: Partial<CashRegister> = {}): CashRegister {
  return {
    id: 1n,
    name: "Caja principal",
    kind: CashRegisterKind.cash,
    openingBalance: 0n,
    active: true,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

function registerPage(items: CashRegister[]): CashRegisterPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 100n };
}

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 7n,
    registerId: 1n,
    responsibleName: "Ana Torres",
    responsibleUserId: undefined,
    status: ShiftStatus.open,
    openingCash: 100000n,
    openingBank: 500000n,
    declaredClosingCash: undefined,
    declaredClosingBank: undefined,
    computedClosingCash: 100000n,
    computedClosingBank: 500000n,
    differenceCash: 0n,
    differenceBank: 0n,
    openedAt: TS,
    closedAt: undefined,
    openedBy: PRINCIPAL,
    closedBy: undefined,
    notes: undefined,
    ...overrides,
  };
}

function movement(overrides: Partial<CashMovement> = {}): CashMovement {
  return {
    id: 1n,
    shiftId: 7n,
    timestamp: TS,
    kind: CashMovementKind.expense,
    paymentMethod: PaymentMethod.cash,
    account: CashAccount.cash,
    amount: 30000n,
    description: "Pago de domicilio",
    reference: undefined,
    source: CashMovementSource.manual,
    ...overrides,
  };
}

function movementPage(items: CashMovement[]): CashMovementPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 20n };
}

function shiftPage(items: Shift[]): ShiftPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 15n };
}

function userPage(items: UserListItem[]): UserPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 100n };
}

function companyProfile(): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.responsableIva,
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: TS,
  };
}

describe("CajaBancosPage (characterization)", () => {
  beforeEach(() => {
    listOpenShiftsMock.mockReset();
    listCashRegistersMock.mockReset();
    openShiftMock.mockReset();
    closeShiftMock.mockReset();
    listShiftsMock.mockReset();
    listCashMovementsMock.mockReset();
    registerCashMovementMock.mockReset();
    getDailyShiftReportMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    listUsersPageMock.mockReset();

    listCashRegistersMock.mockResolvedValue(registerPage([register()]));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDailyHopeMessageMock.mockResolvedValue(null);
    listUsersPageMock.mockResolvedValue(userPage([]));
    listShiftsMock.mockResolvedValue(shiftPage([]));
    listCashMovementsMock.mockResolvedValue(movementPage([]));
  });

  it("registers an expense in efectivo against Caja", async () => {
    listOpenShiftsMock.mockResolvedValue([shift()]);
    registerCashMovementMock.mockResolvedValue(movement());
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(
      await screen.findByTestId("caja.register_movement_button"),
    );
    const dialog = await screen.findByTestId("caja.movement.dialog");

    // Switch the movement to an egreso; the default method is efectivo, so the
    // account stays Caja.
    await userEvent.click(
      within(dialog).getByTestId("caja.movement.kind_expense"),
    );
    expect(
      within(dialog).getByTestId("caja.movement.account_hint"),
    ).toHaveTextContent("Caja");

    await userEvent.type(
      within(dialog).getByTestId("caja.movement.amount_input"),
      "300",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.movement.description_input"),
      "Pago de domicilio",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.movement.submit_button"),
    );

    await waitFor(() =>
      expect(registerCashMovementMock).toHaveBeenCalledTimes(1),
    );
    expect(registerCashMovementMock).toHaveBeenCalledWith(null, {
      kind: CashMovementKind.expense,
      paymentMethod: PaymentMethod.cash,
      account: CashAccount.cash,
      amount: 30000n,
      description: "Pago de domicilio",
      reference: undefined,
      source: CashMovementSource.manual,
      shiftId: 7n,
    });
  });

  it("rejects a zero amount before calling the backend", async () => {
    listOpenShiftsMock.mockResolvedValue([shift()]);
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(
      await screen.findByTestId("caja.register_movement_button"),
    );
    const dialog = await screen.findByTestId("caja.movement.dialog");

    await userEvent.type(
      within(dialog).getByTestId("caja.movement.amount_input"),
      "0",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.movement.description_input"),
      "Movimiento inválido",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.movement.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("caja.movement.error_state"),
    ).toHaveTextContent("Captura un monto válido mayor a cero.");
    expect(registerCashMovementMock).not.toHaveBeenCalled();
  });

  it("sends the status and date-range filters to listShifts", async () => {
    listOpenShiftsMock.mockResolvedValue([]);
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.tab.history"));
    // The history defaults to closed shifts.
    await waitFor(() =>
      expect(listShiftsMock).toHaveBeenCalledWith(
        null,
        {
          registerId: undefined,
          responsible: undefined,
          status: ShiftStatus.closed,
          from: undefined,
          to: undefined,
        },
        0n,
        15n,
      ),
    );

    // Switching the status filter to "Todos" clears the status constraint.
    await userEvent.click(
      await screen.findByTestId("caja.history.status_filter"),
    );
    await userEvent.click(await screen.findByRole("option", { name: "Todos" }));
    await waitFor(() =>
      expect(listShiftsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ status: undefined }),
        0n,
        15n,
      ),
    );

    // A date range is converted to inclusive Colombia-local nanosecond bounds.
    await userEvent.type(
      screen.getByTestId("caja.history.date_from_input"),
      "2026-01-01",
    );
    await waitFor(() =>
      expect(listShiftsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ from: expect.any(BigInt) }),
        0n,
        15n,
      ),
    );
    const lastCall = listShiftsMock.mock.calls.at(-1);
    expect(lastCall?.[1].from).toBe(1767243600000000000n);
  });
});
