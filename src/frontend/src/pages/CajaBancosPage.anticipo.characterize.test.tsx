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
 * Characterization coverage for the Caja y Bancos account derivation that the
 * "anticipo" change relies on.
 *
 * The accepted change records an advance payment (anticipo) as an income
 * movement: efectivo must land in Caja and transferencia in Bancos. These tests
 * protect the existing derivation the change builds on — an ingreso in efectivo
 * is classified against Caja and an ingreso by transferencia against Bancos —
 * without asserting anything about the anticipo feature itself.
 *
 * The page is exercised against a typed local actor mock; the real canister is
 * not exercised here.
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
    kind: CashMovementKind.income,
    paymentMethod: PaymentMethod.cash,
    account: CashAccount.cash,
    amount: 50000n,
    description: "Anticipo en efectivo",
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

describe("CajaBancosPage income account derivation (characterization)", () => {
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
    listUsersPageMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 100n,
    });
    listShiftsMock.mockResolvedValue(shiftPage([]));
    listCashMovementsMock.mockResolvedValue(movementPage([]));
  });

  it("classifies an ingreso en efectivo against Caja", async () => {
    listOpenShiftsMock.mockResolvedValue([shift()]);
    registerCashMovementMock.mockResolvedValue(movement());
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(
      await screen.findByTestId("caja.register_movement_button"),
    );
    const dialog = await screen.findByTestId("caja.movement.dialog");

    // The dialog defaults to an ingreso in efectivo, so the account is Caja.
    expect(
      within(dialog).getByTestId("caja.movement.account_hint"),
    ).toHaveTextContent("Caja");

    await userEvent.type(
      within(dialog).getByTestId("caja.movement.amount_input"),
      "500",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.movement.description_input"),
      "Anticipo en efectivo",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.movement.submit_button"),
    );

    await waitFor(() =>
      expect(registerCashMovementMock).toHaveBeenCalledTimes(1),
    );
    expect(registerCashMovementMock).toHaveBeenCalledWith(null, {
      kind: CashMovementKind.income,
      paymentMethod: PaymentMethod.cash,
      account: CashAccount.cash,
      amount: 50000n,
      description: "Anticipo en efectivo",
      reference: undefined,
      source: CashMovementSource.manual,
      shiftId: 7n,
    });
  });

  it("classifies an ingreso por transferencia against Bancos", async () => {
    listOpenShiftsMock.mockResolvedValue([shift()]);
    registerCashMovementMock.mockResolvedValue(
      movement({
        paymentMethod: PaymentMethod.transfer,
        account: CashAccount.bank,
        description: "Anticipo por transferencia",
      }),
    );
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(
      await screen.findByTestId("caja.register_movement_button"),
    );
    const dialog = await screen.findByTestId("caja.movement.dialog");

    // Switching the payment method to transferencia derives Bancos.
    await userEvent.click(
      within(dialog).getByTestId("caja.movement.method_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Transferencia" }),
    );
    expect(
      within(dialog).getByTestId("caja.movement.account_hint"),
    ).toHaveTextContent("Bancos");

    await userEvent.type(
      within(dialog).getByTestId("caja.movement.amount_input"),
      "500",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.movement.description_input"),
      "Anticipo por transferencia",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.movement.submit_button"),
    );

    await waitFor(() =>
      expect(registerCashMovementMock).toHaveBeenCalledTimes(1),
    );
    expect(registerCashMovementMock).toHaveBeenCalledWith(null, {
      kind: CashMovementKind.income,
      paymentMethod: PaymentMethod.transfer,
      account: CashAccount.bank,
      amount: 50000n,
      description: "Anticipo por transferencia",
      reference: undefined,
      source: CashMovementSource.manual,
      shiftId: 7n,
    });
  });
});
