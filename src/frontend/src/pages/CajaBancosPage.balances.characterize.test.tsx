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
 * Characterization coverage for the Caja y Bancos balance panel that the
 * accepted "an anticipo or a POS sale must be reflected in the caja/banco
 * balance without closing the shift" change relies on.
 *
 * The accepted change makes an advance or a POS sale write a movement into the
 * open shift's ledger, so the panel must show the balance the backend derives
 * from that ledger (`computedClosingCash` / `computedClosingBank`) and must
 * refresh it once the movement is registered — without waiting for the shift to
 * close. These tests deliberately do NOT assert that the backend writes the
 * movement — that is the behavior the change adds. They protect the display
 * seam the new balance flows through:
 *
 *   - the panel renders one card per open shift with its Caja, Bancos and total
 *     balances taken from the shift's computed closing fields;
 *   - after a movement is registered, the panel refetches the open shifts and
 *     shows the updated balance while the shift stays open.
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
    source: CashMovementSource.advance,
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

describe("CajaBancosPage balance panel (characterization)", () => {
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

  it("shows each open shift's Caja, Bancos and total from its computed balances", async () => {
    // The shift already carries a movement: opening 1000/5000 plus a 500 cash
    // income and a 2000 bank income, as the backend would compute them.
    listOpenShiftsMock.mockResolvedValue([
      shift({
        computedClosingCash: 150000n,
        computedClosingBank: 700000n,
      }),
    ]);
    renderWithProviders(<CajaBancosPage />);

    const panel = await screen.findByTestId("caja.balances.section");
    const card = within(panel).getByTestId("caja.balances.register.1");
    expect(
      within(card).getByTestId("caja.balances.register.1.cash"),
    ).toHaveTextContent("$ 1.500");
    expect(
      within(card).getByTestId("caja.balances.register.1.bank"),
    ).toHaveTextContent("$ 7.000");
    // Total disponible is Caja + Bancos.
    expect(
      within(card).getByTestId("caja.balances.register.1.total"),
    ).toHaveTextContent("$ 8.500");
  });

  it("updates the displayed balance after a movement without closing the shift", async () => {
    listOpenShiftsMock.mockResolvedValue([
      shift({ computedClosingCash: 100000n, computedClosingBank: 500000n }),
    ]);
    registerCashMovementMock.mockResolvedValue(movement());
    renderWithProviders(<CajaBancosPage />);

    const panel = await screen.findByTestId("caja.balances.section");
    expect(
      within(panel).getByTestId("caja.balances.register.1.cash"),
    ).toHaveTextContent("$ 1.000");

    // The backend now reports the shift with the movement applied; the shift is
    // still open, so the panel must show the new balance without a close.
    listOpenShiftsMock.mockResolvedValue([
      shift({ computedClosingCash: 150000n, computedClosingBank: 500000n }),
    ]);

    await userEvent.click(
      await screen.findByTestId("caja.register_movement_button"),
    );
    const dialog = await screen.findByTestId("caja.movement.dialog");
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
    // The panel refetched the open shifts and shows the updated Caja balance,
    // while the shift is still open.
    await waitFor(() =>
      expect(
        screen.getByTestId("caja.balances.register.1.cash"),
      ).toHaveTextContent("$ 1.500"),
    );
    expect(screen.getByTestId("caja.balances.register.1")).toHaveTextContent(
      "Turno abierto",
    );
  });
});
