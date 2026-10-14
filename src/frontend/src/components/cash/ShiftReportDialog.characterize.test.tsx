import { ShiftReportDialog } from "@/components/cash/ShiftReportDialog";
import type { CashMovement, DailyShiftReport, Shift } from "@/lib/types";
import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  PaymentMethod,
  ShiftStatus,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the daily shift report dialog, protecting the
 * behavior around the accepted change.
 *
 * The accepted change fixes the amount shown on the report's sale lines: the
 * movement amount is stored in integer cents and the printable line must show
 * the real peso value, not a value inflated by 100. These tests deliberately do
 * NOT assert the line amount — that is the behavior the change intentionally
 * replaces. They protect the surrounding report contract instead:
 *
 *   - the report is scoped to the requested shift and shows its register and
 *     responsible;
 *   - the header metadata (opening balances, movement count) renders from the
 *     shift's cents;
 *   - the totals block (income, expense and final balances) renders the real
 *     peso value from the report's cents;
 *   - the per-payment-method breakdown renders each method's income and expense;
 *   - the movement description still appears on the printable line.
 *
 * The dialog is exercised against typed local hook mocks; the real backend is
 * not exercised here.
 */

const useDailyShiftReportMock = vi.fn();
const useCompanyProfileMock = vi.fn();
const useDailyHopeMessageMock = vi.fn();

vi.mock("@/hooks/use-cash", () => ({
  useDailyShiftReport: (shiftId: bigint | null) =>
    useDailyShiftReportMock(shiftId),
}));

vi.mock("@/hooks/use-company", () => ({
  useCompanyProfile: () => useCompanyProfileMock(),
}));

vi.mock("@/hooks/use-hope", () => ({
  useDailyHopeMessage: () => useDailyHopeMessageMock(),
}));

const TS = 1_700_000_000_000_000_000n;
const PRINCIPAL = Principal.fromText("aaaaa-aa");

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 8n,
    registerId: 2n,
    responsibleName: "Carlos Pérez",
    responsibleUserId: undefined,
    status: ShiftStatus.open,
    openingCash: 100000n,
    openingBank: 500000n,
    declaredClosingCash: undefined,
    declaredClosingBank: undefined,
    computedClosingCash: 132000n,
    computedClosingBank: 507500n,
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
    shiftId: 8n,
    timestamp: TS,
    kind: CashMovementKind.income,
    paymentMethod: PaymentMethod.cash,
    account: CashAccount.cash,
    amount: 3200000n,
    description: "Venta POS #1",
    reference: undefined,
    source: CashMovementSource.pos,
    ...overrides,
  };
}

function dailyReport(
  overrides: Partial<DailyShiftReport> = {},
): DailyShiftReport {
  return {
    shift: shift(),
    registerName: "Banco Bogotá",
    responsibleName: "Carlos Pérez",
    movements: [movement()],
    byPaymentMethod: [
      { method: PaymentMethod.cash, income: 3200000n, expense: 0n },
      { method: PaymentMethod.transfer, income: 750000n, expense: 0n },
    ],
    cashIncome: 3200000n,
    cashExpense: 0n,
    bankIncome: 750000n,
    bankExpense: 0n,
    totalIncome: 3950000n,
    totalExpense: 0n,
    ...overrides,
  };
}

function renderDialog(shiftId: bigint | null = 8n) {
  return renderWithProviders(
    <ShiftReportDialog shiftId={shiftId} onClose={() => {}} />,
  );
}

describe("ShiftReportDialog (characterization)", () => {
  beforeEach(() => {
    useDailyShiftReportMock.mockReset();
    useCompanyProfileMock.mockReset();
    useDailyHopeMessageMock.mockReset();

    useDailyShiftReportMock.mockReturnValue({
      data: dailyReport(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useCompanyProfileMock.mockReturnValue({ data: undefined });
    useDailyHopeMessageMock.mockReturnValue({ data: null });
  });

  it("scopes the report to the requested shift and shows its register and responsible", () => {
    renderDialog(8n);

    expect(useDailyShiftReportMock).toHaveBeenCalledWith(8n);
    const dialog = screen.getByTestId("caja.report.dialog");
    expect(dialog).toHaveTextContent("Banco Bogotá");
    expect(dialog).toHaveTextContent("Carlos Pérez");
  });

  it("renders the header metadata from the shift's cents", () => {
    renderDialog();

    const dialog = screen.getByTestId("caja.report.dialog");
    // Opening balances are cents: 100000 -> $ 1.000 and 500000 -> $ 5.000.
    expect(dialog).toHaveTextContent("Saldo inicial caja");
    expect(dialog).toHaveTextContent("$ 1.000");
    expect(dialog).toHaveTextContent("Saldo inicial bancos");
    expect(dialog).toHaveTextContent("$ 5.000");
    // One movement in the report.
    expect(dialog).toHaveTextContent("Movimientos");
    expect(dialog).toHaveTextContent("1");
  });

  it("renders the totals block with the real peso value from the report's cents", () => {
    renderDialog();

    const dialog = screen.getByTestId("caja.report.dialog");
    // 3200000 cents -> $ 32.000; 750000 cents -> $ 7.500.
    expect(dialog).toHaveTextContent("Ingresos en efectivo");
    expect(dialog).toHaveTextContent("$ 32.000");
    expect(dialog).toHaveTextContent("Ingresos por bancos");
    expect(dialog).toHaveTextContent("$ 7.500");
    expect(dialog).toHaveTextContent("Total ingresos");
    expect(dialog).toHaveTextContent("$ 39.500");
    // Final balances: 132000 -> $ 1.320 and 507500 -> $ 5.075.
    expect(dialog).toHaveTextContent("Saldo final caja");
    expect(dialog).toHaveTextContent("$ 1.320");
    expect(dialog).toHaveTextContent("Saldo final bancos");
    expect(dialog).toHaveTextContent("$ 5.075");
    // Total disponible is Caja + Bancos: 132000 + 507500 = 639500 -> $ 6.395.
    expect(dialog).toHaveTextContent("Total disponible");
    expect(dialog).toHaveTextContent("$ 6.395");
  });

  it("renders the per-payment-method breakdown", () => {
    renderDialog();

    const breakdown = screen.getByTestId("caja.report.payment_methods");
    const cash = within(breakdown).getByTestId("caja.report.method.cash");
    expect(cash).toHaveTextContent("Efectivo");
    expect(cash).toHaveTextContent("+$ 32.000");
    const transfer = within(breakdown).getByTestId(
      "caja.report.method.transfer",
    );
    expect(transfer).toHaveTextContent("Transferencia");
    expect(transfer).toHaveTextContent("+$ 7.500");
  });

  it("still shows the movement description on the printable line", () => {
    renderDialog();

    const dialog = screen.getByTestId("caja.report.dialog");
    expect(dialog).toHaveTextContent("Venta POS #1");
  });

  it("shows the empty-state note when the shift has no movements", () => {
    useDailyShiftReportMock.mockReturnValue({
      data: dailyReport({
        movements: [],
        byPaymentMethod: [],
        cashIncome: 0n,
        bankIncome: 0n,
        totalIncome: 0n,
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderDialog();

    expect(screen.getByTestId("caja.report.payment_methods")).toHaveTextContent(
      "Sin movimientos registrados en este turno.",
    );
  });

  it("shows the error state when the report cannot be loaded", () => {
    useDailyShiftReportMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    renderDialog();

    expect(screen.getByTestId("caja.report.error_state")).toHaveTextContent(
      "No se pudo cargar el informe del turno.",
    );
  });
});
