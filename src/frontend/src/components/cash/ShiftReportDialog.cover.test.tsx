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
 * Regression coverage for the daily shift report's sale-line amounts.
 *
 * The backend stores every movement amount in whole cents. The report's
 * printable lines are built from those cents and `DocumentPreview` rescales
 * each line back to cents before formatting, so the line must carry the real
 * peso value. The fixed bug inflated each line by 100 (a $32.000 sale rendered
 * as $3.200.000). These tests pin the corrected behavior:
 *
 *   - a movement of 3.200.000 cents ($32.000) renders as `$ 32.000`;
 *   - a movement of 750.000 cents ($7.500) renders as `$ 7.500`;
 *   - the report's final totals still match the real amounts.
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

/** The A4 preview's line-item table, scoped so the 80 mm copy is excluded. */
function a4LinesTable(): HTMLElement {
  const preview = screen.getByTestId("caja.report.a4");
  const table = preview.querySelector("table");
  if (!(table instanceof HTMLElement)) {
    throw new Error("A4 line table not found");
  }
  return table;
}

/**
 * The line row whose description contains `description`. The description cell
 * renders as `Ingreso · <description>`, so an exact-text query would miss it.
 */
function lineRow(table: HTMLElement, description: string): HTMLElement {
  const cell = within(table).getByText((content) =>
    content.includes(description),
  );
  const row = cell.closest("tr");
  if (!(row instanceof HTMLElement)) {
    throw new Error(`sale line row not found for ${description}`);
  }
  return row;
}

describe("ShiftReportDialog (cover: real peso amounts on report lines)", () => {
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

  it("renders a $32.000 sale as $ 32.000, not the inflated $ 3.200.000", () => {
    renderDialog();

    const table = a4LinesTable();
    const row = lineRow(table, "Venta POS #1");

    // Unit price and amount columns both carry the real peso value.
    expect(within(row).getAllByText("$ 32.000")).toHaveLength(2);
    expect(within(row).queryByText("$ 3.200.000")).not.toBeInTheDocument();
  });

  it("renders a $7.500 sale as $ 7.500, not the inflated $ 7.500.000", () => {
    useDailyShiftReportMock.mockReturnValue({
      data: dailyReport({
        movements: [
          movement({
            id: 2n,
            amount: 750000n,
            paymentMethod: PaymentMethod.transfer,
            account: CashAccount.bank,
            description: "Venta POS #2",
          }),
        ],
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderDialog();

    const table = a4LinesTable();
    const row = lineRow(table, "Venta POS #2");

    expect(within(row).getAllByText("$ 7.500")).toHaveLength(2);
    expect(within(row).queryByText("$ 7.500.000")).not.toBeInTheDocument();
  });

  it("keeps the final totals matching the real amounts", () => {
    renderDialog();

    const dialog = screen.getByTestId("caja.report.dialog");
    // 3.200.000 + 750.000 cents = 3.950.000 cents -> $ 39.500.
    expect(dialog).toHaveTextContent("Total ingresos");
    expect(dialog).toHaveTextContent("$ 39.500");
    // The inflated per-line values must not leak into the totals block.
    expect(dialog).not.toHaveTextContent("$ 3.200.000");
    expect(dialog).not.toHaveTextContent("$ 7.500.000");
  });

  it("renders both sale lines with their real amounts in one report", () => {
    useDailyShiftReportMock.mockReturnValue({
      data: dailyReport({
        movements: [
          movement({ id: 1n, amount: 3200000n, description: "Venta POS #1" }),
          movement({
            id: 2n,
            amount: 750000n,
            paymentMethod: PaymentMethod.transfer,
            account: CashAccount.bank,
            description: "Venta POS #2",
          }),
        ],
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderDialog();

    const table = a4LinesTable();
    const first = lineRow(table, "Venta POS #1");
    const second = lineRow(table, "Venta POS #2");

    expect(within(first).getAllByText("$ 32.000")).toHaveLength(2);
    expect(within(second).getAllByText("$ 7.500")).toHaveLength(2);
  });
});
