import type {
  CashMovement,
  CashMovementPage,
  CompanyProfile,
  DailyShiftReport,
  Shift,
  ShiftPage,
} from "@/lib/types";
import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  DocumentType,
  FiscalRegime,
  PaymentMethod,
  ShiftStatus,
  TaxResponsibility,
} from "@/lib/types";
import { CajaBancosPage } from "@/pages/CajaBancosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Caja y Bancos coverage.
 *
 * The accepted change adds the cash-register module: opening and closing a
 * shift with declared opening/closing balances, registering income and expense
 * movements classified by payment method (cash hits Caja, transfer/card hit
 * Bancos), and a printable daily shift report in A4 and 80 mm. These tests
 * exercise the real page against a typed local actor mock, so they pin the
 * observable wiring: the payloads the page sends, the balances it renders from
 * the backend's computed closing amounts, and the report it shows.
 */

const getOpenShiftMock = vi.fn();
const openShiftMock = vi.fn();
const closeShiftMock = vi.fn();
const listShiftsMock = vi.fn();
const listCashMovementsMock = vi.fn();
const registerCashMovementMock = vi.fn();
const getDailyShiftReportMock = vi.fn();
const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getOpenShift: getOpenShiftMock,
      openShift: openShiftMock,
      closeShift: closeShiftMock,
      listShifts: listShiftsMock,
      listCashMovements: listCashMovementsMock,
      registerCashMovement: registerCashMovementMock,
      getDailyShiftReport: getDailyShiftReportMock,
      getCompanyProfile: getCompanyProfileMock,
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

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 7n,
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
    openedBy: undefined as never,
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
    paymentMethod: PaymentMethod.transfer,
    account: CashAccount.bank,
    amount: 250000n,
    description: "Consignación cliente",
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

function companyProfile(
  overrides: Partial<CompanyProfile> = {},
): CompanyProfile {
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
    ...overrides,
  };
}

function dailyReport(
  overrides: Partial<DailyShiftReport> = {},
): DailyShiftReport {
  return {
    shift: shift(),
    movements: [movement()],
    byPaymentMethod: [
      { method: PaymentMethod.transfer, income: 250000n, expense: 0n },
    ],
    cashIncome: 0n,
    cashExpense: 0n,
    bankIncome: 250000n,
    bankExpense: 0n,
    totalIncome: 250000n,
    totalExpense: 0n,
    ...overrides,
  };
}

describe("CajaBancosPage", () => {
  beforeEach(() => {
    getOpenShiftMock.mockReset();
    openShiftMock.mockReset();
    closeShiftMock.mockReset();
    listShiftsMock.mockReset();
    listCashMovementsMock.mockReset();
    registerCashMovementMock.mockReset();
    getDailyShiftReportMock.mockReset();
    getCompanyProfileMock.mockReset();

    getCompanyProfileMock.mockResolvedValue(companyProfile());
    listShiftsMock.mockResolvedValue(shiftPage([]));
    listCashMovementsMock.mockResolvedValue(movementPage([]));
  });

  it("shows the closed state and opens a shift with the declared balances", async () => {
    getOpenShiftMock.mockResolvedValue(null);
    openShiftMock.mockResolvedValue(shift());
    renderWithProviders(<CajaBancosPage />);

    expect(
      await screen.findByTestId("caja.balances.closed_state"),
    ).toHaveTextContent("La caja está cerrada");

    await userEvent.click(screen.getByTestId("caja.open_shift_button"));
    const dialog = await screen.findByTestId("caja.open_shift.dialog");
    await userEvent.type(
      within(dialog).getByTestId("caja.open_shift.cash_input"),
      "1000",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.open_shift.bank_input"),
      "5000",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.submit_button"),
    );

    await waitFor(() => expect(openShiftMock).toHaveBeenCalledTimes(1));
    // The token is null in a test session, and the amounts are integer cents.
    expect(openShiftMock).toHaveBeenCalledWith(null, {
      openingCash: 100000n,
      openingBank: 500000n,
      notes: undefined,
    });
  });

  it("renders the open shift balances from the backend's computed closing amounts", async () => {
    getOpenShiftMock.mockResolvedValue(
      shift({
        openingCash: 100000n,
        openingBank: 500000n,
        computedClosingCash: 150000n,
        computedClosingBank: 650000n,
      }),
    );
    renderWithProviders(<CajaBancosPage />);

    const panel = await screen.findByTestId("caja.balances.section");
    expect(within(panel).getByTestId("caja.balances.cash")).toHaveTextContent(
      "$ 1.500",
    );
    expect(within(panel).getByTestId("caja.balances.bank")).toHaveTextContent(
      "$ 6.500",
    );
    expect(within(panel).getByTestId("caja.balances.total")).toHaveTextContent(
      "$ 8.000",
    );
    expect(panel).toHaveTextContent("Turno abierto");
    // The open shift exposes the movement, report and close actions.
    expect(
      screen.getByTestId("caja.register_movement_button"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("caja.view_report_button")).toBeInTheDocument();
    expect(screen.getByTestId("caja.close_shift_button")).toBeInTheDocument();
  });

  it("registers a transfer income against Bancos", async () => {
    getOpenShiftMock.mockResolvedValue(shift());
    registerCashMovementMock.mockResolvedValue(movement());
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(
      await screen.findByTestId("caja.register_movement_button"),
    );
    const dialog = await screen.findByTestId("caja.movement.dialog");

    // Pick Transferencia; the account is derived to Bancos.
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
      "2500",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.movement.description_input"),
      "Consignación cliente",
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
      amount: 250000n,
      description: "Consignación cliente",
      reference: undefined,
      source: CashMovementSource.manual,
    });
  });

  it("closes the shift with the declared closing balances and shows the difference", async () => {
    getOpenShiftMock.mockResolvedValue(
      shift({ computedClosingCash: 100000n, computedClosingBank: 500000n }),
    );
    closeShiftMock.mockResolvedValue(
      shift({ status: ShiftStatus.closed, closedAt: TS }),
    );
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.close_shift_button"));
    const dialog = await screen.findByTestId("caja.close_shift.dialog");

    // The declared fields are prefilled with the computed balances, so the
    // difference starts at zero.
    expect(
      within(dialog).getByTestId("caja.close_shift.cash_input"),
    ).toHaveValue("1000.00");
    expect(
      within(dialog).getByTestId("caja.close_shift.difference_cash"),
    ).toHaveTextContent("$ 0");

    // Declaring 900.00 against a computed 1000.00 shows a −$ 100 difference.
    const cashInput = within(dialog).getByTestId("caja.close_shift.cash_input");
    await userEvent.clear(cashInput);
    await userEvent.type(cashInput, "900");
    expect(
      within(dialog).getByTestId("caja.close_shift.difference_cash"),
    ).toHaveTextContent("-$ 100");

    await userEvent.click(
      within(dialog).getByTestId("caja.close_shift.submit_button"),
    );

    await waitFor(() => expect(closeShiftMock).toHaveBeenCalledTimes(1));
    expect(closeShiftMock).toHaveBeenCalledWith(null, 7n, {
      declaredClosingCash: 90000n,
      declaredClosingBank: 500000n,
      notes: undefined,
    });
  });

  it("shows the daily report with movements, payment-method totals and both print formats", async () => {
    getOpenShiftMock.mockResolvedValue(shift());
    getDailyShiftReportMock.mockResolvedValue(dailyReport());
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.view_report_button"));
    const dialog = await screen.findByTestId("caja.report.dialog");

    await waitFor(() =>
      expect(getDailyShiftReportMock).toHaveBeenCalledWith(null, 7n),
    );
    // The movement and its payment-method total are listed.
    expect(dialog).toHaveTextContent("Consignación cliente");
    expect(
      within(dialog).getByTestId("caja.report.method.transfer"),
    ).toHaveTextContent("Transferencia");
    expect(
      within(dialog).getByTestId("caja.report.method.transfer"),
    ).toHaveTextContent("+$ 2.500");
    // Both printable formats are offered.
    expect(within(dialog).getByTestId("caja.report.a4")).toBeInTheDocument();
    expect(within(dialog).getByTestId("caja.report.80mm")).toBeInTheDocument();
  });

  it("lists closed shifts in the history and opens a shift's report", async () => {
    getOpenShiftMock.mockResolvedValue(null);
    listShiftsMock.mockResolvedValue(
      shiftPage([
        shift({
          id: 3n,
          status: ShiftStatus.closed,
          closedAt: TS,
          computedClosingCash: 200000n,
          computedClosingBank: 300000n,
        }),
      ]),
    );
    getDailyShiftReportMock.mockResolvedValue(
      dailyReport({ shift: shift({ id: 3n, status: ShiftStatus.closed }) }),
    );
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.tab.history"));
    expect(await screen.findByText("#3")).toBeInTheDocument();
    expect(screen.getByText("Cerrado")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Ver informe del turno" }),
    );
    await waitFor(() =>
      expect(getDailyShiftReportMock).toHaveBeenCalledWith(null, 3n),
    );
    expect(await screen.findByTestId("caja.report.dialog")).toBeInTheDocument();
  });
});
