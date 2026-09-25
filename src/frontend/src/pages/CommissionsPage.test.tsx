import type {
  CommissionLine,
  CommissionPayment,
  CommissionReport,
  Technician,
  TechnicianCommissionSummary,
  TechnicianLoan,
} from "@/lib/types";
import { CommissionsPage } from "@/pages/CommissionsPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listTechniciansMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getCommissionReportMock = vi.fn();
const getTechnicianCommissionSummaryMock = vi.fn();
const listCommissionLinesMock = vi.fn();
const listCommissionPaymentsMock = vi.fn();
const listTechnicianLoansMock = vi.fn();
const createTechnicianLoanMock = vi.fn();
const deleteTechnicianLoanMock = vi.fn();
const payTechnicianCommissionMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listTechnicians: listTechniciansMock,
      getCompanyProfile: getCompanyProfileMock,
      getCommissionReport: getCommissionReportMock,
      getTechnicianCommissionSummary: getTechnicianCommissionSummaryMock,
      listCommissionLines: listCommissionLinesMock,
      listCommissionPayments: listCommissionPaymentsMock,
      listTechnicianLoans: listTechnicianLoansMock,
      createTechnicianLoan: createTechnicianLoanMock,
      deleteTechnicianLoan: deleteTechnicianLoanMock,
      payTechnicianCommission: payTechnicianCommissionMock,
    },
    isFetching: false,
  }),
}));

// The PDF helpers wrap jsPDF; mock them so the tests assert the download seam
// without generating a real document.
const downloadCommissionPaymentPdfMock = vi.fn();
const downloadCommissionReportPdfMock = vi.fn();
vi.mock("@/lib/pdf", () => ({
  pdfCompanyFromProfile: () => ({ name: "Taller de motos" }),
  downloadCommissionPaymentPdf: (...args: unknown[]) =>
    downloadCommissionPaymentPdfMock(...args),
  downloadCommissionReportPdf: (...args: unknown[]) =>
    downloadCommissionReportPdfMock(...args),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

function technician(overrides: Partial<Technician> = {}): Technician {
  return {
    id: 1n,
    active: true,
    code: "TEC-001",
    name: "Ana Gómez",
    createdAt: TS,
    hourlyRate: 2000000n,
    specialty: "Motor",
    commissionRate: 10n,
    phone: "3000000000",
    ...overrides,
  };
}

function summary(
  overrides: Partial<TechnicianCommissionSummary> = {},
): TechnicianCommissionSummary {
  return {
    technicianId: 1n,
    technicianCode: "TEC-001",
    technicianName: "Ana Gómez",
    commissionRate: 10n,
    lineCount: 2n,
    baseAmount: 10000000n,
    commissionAmount: 1000000n,
    pendingLoanCount: 1n,
    pendingLoansAmount: 300000n,
    netPayable: 700000n,
    ...overrides,
  };
}

function line(overrides: Partial<CommissionLine> = {}): CommissionLine {
  return {
    at: TS,
    serviceDate: TS,
    laborId: 11n,
    serviceId: 7n,
    serviceName: "Cambio de aceite",
    technicianCode: "TEC-001",
    technicianName: "Ana Gómez",
    description: "Cambio de aceite",
    orderId: 5n,
    technicianId: 1n,
    baseAmount: 5000000n,
    commissionAmount: 500000n,
    commissionRate: 10n,
    motorcycleModel: "XR 150L",
    motorcycleBrand: "Honda",
    motorcyclePlate: "ABC12D",
    orderNumber: "OT-0005",
    ...overrides,
  };
}

function loan(overrides: Partial<TechnicianLoan> = {}): TechnicianLoan {
  return {
    id: 21n,
    date: TS,
    createdAt: TS,
    deducted: false,
    technicianId: 1n,
    amount: 300000n,
    ...overrides,
  };
}

function report(overrides: Partial<CommissionReport> = {}): CommissionReport {
  return {
    period: {},
    technicians: [summary()],
    totalBase: 10000000n,
    totalCommission: 1000000n,
    totalPendingLoans: 300000n,
    totalNetPayable: 700000n,
    ...overrides,
  };
}

function payment(
  overrides: Partial<CommissionPayment> = {},
): CommissionPayment {
  return {
    id: 99n,
    technicianId: 1n,
    technicianCode: "TEC-001",
    technicianName: "Ana Gómez",
    period: {},
    lineCount: 2n,
    baseAmount: 10000000n,
    commissionAmount: 1000000n,
    loansDeducted: 300000n,
    loans: [
      {
        loanId: 21n,
        date: TS,
        note: "Anticipo",
        amount: 300000n,
      },
    ],
    netPaid: 700000n,
    lines: [line()],
    paidAt: TS,
    paidBy: Principal.fromText("aaaaa-aa"),
    ...overrides,
  };
}

describe("CommissionsPage", () => {
  beforeEach(() => {
    listTechniciansMock.mockReset();
    getCompanyProfileMock.mockReset();
    getCommissionReportMock.mockReset();
    getTechnicianCommissionSummaryMock.mockReset();
    listCommissionLinesMock.mockReset();
    listCommissionPaymentsMock.mockReset();
    listTechnicianLoansMock.mockReset();
    createTechnicianLoanMock.mockReset();
    deleteTechnicianLoanMock.mockReset();
    payTechnicianCommissionMock.mockReset();
    downloadCommissionPaymentPdfMock.mockReset();
    downloadCommissionReportPdfMock.mockReset();

    listTechniciansMock.mockResolvedValue([technician()]);
    getCompanyProfileMock.mockResolvedValue(null);
    getCommissionReportMock.mockResolvedValue(report());
    getTechnicianCommissionSummaryMock.mockResolvedValue(summary());
    listCommissionLinesMock.mockResolvedValue([line()]);
    listCommissionPaymentsMock.mockResolvedValue([]);
    listTechnicianLoansMock.mockResolvedValue([loan()]);
  });

  it("shows the technician commission KPIs for the selected period", async () => {
    renderWithProviders(<CommissionsPage />);

    // The KPI card renders a skeleton first, so wait for the resolved value.
    await waitFor(() =>
      expect(
        screen.getByTestId("commissions.TEC-001.kpi.base"),
      ).toHaveTextContent("$ 100.000"),
    );
    expect(
      screen.getByTestId("commissions.TEC-001.kpi.commission"),
    ).toHaveTextContent("$ 10.000");
    expect(
      screen.getByTestId("commissions.TEC-001.kpi.loans"),
    ).toHaveTextContent("$ 3.000");
    // Net payable is the commission minus the pending loans.
    expect(screen.getByTestId("commissions.TEC-001.kpi.net")).toHaveTextContent(
      "$ 7.000",
    );
  });

  it("opens with no date restriction so every saved commission is visible", async () => {
    // The accepted change makes the default period unrestricted: the page opens
    // with empty Desde/Hasta inputs and no active preset, so every saved
    // commission record is shown instead of being hidden behind a range that
    // starts in the current or previous month.
    renderWithProviders(<CommissionsPage />);

    // Both date inputs start empty.
    await waitFor(() =>
      expect(screen.getByTestId("commissions.date_from_input")).toHaveValue(""),
    );
    expect(screen.getByTestId("commissions.date_to_input")).toHaveValue("");

    // The backend is queried with no lower or upper bound, so all records are
    // returned.
    await waitFor(() =>
      expect(getCommissionReportMock).toHaveBeenCalledWith({
        from: undefined,
        to: undefined,
      }),
    );
    expect(listCommissionLinesMock).toHaveBeenCalledWith(null, {
      from: undefined,
      to: undefined,
    });

    // No preset is active: the page opens unrestricted, not on "Trimestre".
    expect(
      screen.getByTestId("commissions.period.quarter").className,
    ).not.toContain("bg-primary");
    expect(
      screen.getByTestId("commissions.period.month").className,
    ).not.toContain("bg-primary");
    expect(
      screen.getByTestId("commissions.period.all").className,
    ).not.toContain("bg-primary");

    // The saved commission line is visible without touching the filters.
    const table = await screen.findByTestId("commissions.TEC-001.lines.table");
    await waitFor(() =>
      expect(within(table).getByText("OT-0005")).toBeInTheDocument(),
    );
  });

  it("lists the labor lines attributed to the technician", async () => {
    renderWithProviders(<CommissionsPage />);

    const table = await screen.findByTestId("commissions.TEC-001.lines.table");
    await waitFor(() =>
      expect(within(table).getByText("OT-0005")).toBeInTheDocument(),
    );
    expect(within(table).getByText("Cambio de aceite")).toBeInTheDocument();
    expect(within(table).getByText("10%")).toBeInTheDocument();
  });

  it("marks pending and deducted loans in the loans panel", async () => {
    listTechnicianLoansMock.mockResolvedValue([
      loan({ id: 21n, deducted: false }),
      loan({ id: 22n, deducted: true, amount: 150000n }),
    ]);
    renderWithProviders(<CommissionsPage />);

    const panel = await screen.findByTestId("commissions.loans.TEC-001.table");
    expect(within(panel).getByText("Pendiente")).toBeInTheDocument();
    expect(within(panel).getByText("Deducido")).toBeInTheDocument();
    // Only the pending loan offers a delete action.
    expect(
      within(panel).getByTestId("commissions.loans.TEC-001.delete_button.1"),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByTestId("commissions.loans.TEC-001.delete_button.2"),
    ).not.toBeInTheDocument();
  });

  it("disables the pay button when there are no commission lines", async () => {
    getTechnicianCommissionSummaryMock.mockResolvedValue(
      summary({ lineCount: 0n, commissionAmount: 0n, netPayable: 0n }),
    );
    renderWithProviders(<CommissionsPage />);

    const payButton = await screen.findByTestId(
      "commissions.TEC-001.pay_button",
    );
    expect(payButton).toBeDisabled();
  });

  it("pays the pending commissions and renders the receipt with loan deduction", async () => {
    payTechnicianCommissionMock.mockResolvedValue(payment());
    renderWithProviders(<CommissionsPage />);

    await userEvent.click(
      await screen.findByTestId("commissions.TEC-001.pay_button"),
    );

    const dialog = await screen.findByTestId("commission_payment.dialog");
    // The confirmation shows the net to pay before the backend call.
    expect(within(dialog).getByText("$ 7.000")).toBeInTheDocument();

    await userEvent.click(
      screen.getByTestId("commission_payment.confirm_button"),
    );

    await waitFor(() =>
      expect(payTechnicianCommissionMock).toHaveBeenCalledTimes(1),
    );
    expect(payTechnicianCommissionMock.mock.calls[0][0]).toMatchObject({
      technicianId: 1n,
    });

    const receipt = await screen.findByTestId("commission_payment.receipt");
    // The label appears both as the loan section heading and as a total row.
    expect(
      within(receipt).getAllByText("Préstamos deducidos").length,
    ).toBeGreaterThan(0);
    expect(within(receipt).getByText("Anticipo")).toBeInTheDocument();
    expect(within(receipt).getByText("Neto pagado")).toBeInTheDocument();
    expect(within(receipt).getByText("$ 7.000")).toBeInTheDocument();
  });

  it("downloads the payment receipt as a real PDF", async () => {
    payTechnicianCommissionMock.mockResolvedValue(payment());
    renderWithProviders(<CommissionsPage />);

    await userEvent.click(
      await screen.findByTestId("commissions.TEC-001.pay_button"),
    );
    await userEvent.click(
      screen.getByTestId("commission_payment.confirm_button"),
    );

    await screen.findByTestId("commission_payment.receipt");
    await userEvent.click(
      screen.getByTestId("commission_payment.receipt.download_button"),
    );

    expect(downloadCommissionPaymentPdfMock).toHaveBeenCalledTimes(1);
    expect(downloadCommissionPaymentPdfMock.mock.calls[0][0]).toMatchObject({
      id: 99n,
      netPaid: 700000n,
    });
  });

  it("shows the general report totals and downloads the report PDF", async () => {
    renderWithProviders(<CommissionsPage />);

    const reportTable = await screen.findByTestId("commissions.report.table");
    expect(within(reportTable).getByText("Ana Gómez")).toBeInTheDocument();
    expect(within(reportTable).getByText("TEC-001")).toBeInTheDocument();

    const downloadButton = screen.getByTestId(
      "commissions.report.download_button",
    );
    expect(downloadButton).toBeEnabled();
    await userEvent.click(downloadButton);

    expect(downloadCommissionReportPdfMock).toHaveBeenCalledTimes(1);
    expect(downloadCommissionReportPdfMock.mock.calls[0][0]).toMatchObject({
      totalNetPayable: 700000n,
    });
  });

  it("registers a technician loan in cents", async () => {
    createTechnicianLoanMock.mockResolvedValue(loan());
    renderWithProviders(<CommissionsPage />);

    await userEvent.click(
      await screen.findByTestId("commissions.loans.TEC-001.register_button"),
    );

    const dialog = await screen.findByTestId("commission_loan.dialog");
    await userEvent.type(
      within(dialog).getByTestId("commission_loan.amount_input"),
      "150000",
    );
    await userEvent.click(
      within(dialog).getByTestId("commission_loan.submit_button"),
    );

    await waitFor(() =>
      expect(createTechnicianLoanMock).toHaveBeenCalledTimes(1),
    );
    expect(createTechnicianLoanMock.mock.calls[0][0]).toMatchObject({
      technicianId: 1n,
      amount: 15000000n,
    });
  });

  it("renders an empty state when there are no active technicians", async () => {
    listTechniciansMock.mockResolvedValue([]);
    renderWithProviders(<CommissionsPage />);

    expect(
      await screen.findByTestId("commissions.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin técnicos activos")).toBeInTheDocument();
  });

  // --- Characterization: the per-line report the commission work must keep --
  //
  // The accepted change makes the commission report discriminate, for each
  // payment, the service performed, the motorcycle that caused it and the
  // service date, and guarantees a line is paid only once. These tests protect
  // the surrounding working behavior: the pending-lines table carries the
  // service, the motorcycle brand/model/plate and the service date, and a line
  // already settled in a payment moves out of the pending table into the
  // paid-lines table instead of being offered for payment again.

  it("shows the service, motorcycle and service date on each pending line", async () => {
    renderWithProviders(<CommissionsPage />);

    const table = await screen.findByTestId("commissions.TEC-001.lines.table");
    const row = await within(table).findByTestId(
      "commissions.TEC-001.lines.row.1",
    );
    expect(row).toHaveTextContent("Cambio de aceite");
    // The motorcycle is rendered as brand + model with its plate underneath.
    expect(row).toHaveTextContent("Honda XR 150L");
    expect(row).toHaveTextContent("ABC12D");
    // The service date column is present and formatted.
    expect(row).toHaveTextContent(/2023|2024/);
  });

  it("moves a line already settled in a payment out of the pending table", async () => {
    // The payment references the same order/labor line the backend returns, so
    // the UI must treat it as already paid and never offer it again.
    listCommissionPaymentsMock.mockResolvedValue([payment()]);
    renderWithProviders(<CommissionsPage />);

    const pending = await screen.findByTestId("commissions.TEC-001.pending");
    // The pending table is empty: the only line was already paid.
    expect(
      within(pending).getByTestId("commissions.TEC-001.lines.empty_state"),
    ).toBeInTheDocument();

    // The line appears in the paid section, marked as paid.
    const paid = await screen.findByTestId("commissions.TEC-001.paid");
    const paidRow = within(paid).getByTestId(
      "commissions.TEC-001.paid_lines.row.1",
    );
    expect(paidRow).toHaveTextContent("Cambio de aceite");
    expect(paidRow).toHaveTextContent("Pagada");
  });

  it("keeps an unsettled line payable when a payment covers a different line", async () => {
    // A payment for another labor line must not hide the pending one.
    listCommissionPaymentsMock.mockResolvedValue([
      payment({ lines: [line({ laborId: 99n, orderId: 77n })] }),
    ]);
    renderWithProviders(<CommissionsPage />);

    const table = await screen.findByTestId("commissions.TEC-001.lines.table");
    const row = await within(table).findByTestId(
      "commissions.TEC-001.lines.row.1",
    );
    expect(row).toHaveTextContent("Cambio de aceite");
    expect(
      screen.queryByTestId("commissions.TEC-001.paid"),
    ).not.toBeInTheDocument();
  });

  // --- Characterization: the general report's per-line breakdown ------------
  //
  // The accepted change adds a "Desglose por servicio, moto y fecha" table to
  // the general report. These tests protect the surrounding working behavior:
  // the breakdown lists every eligible labor line the backend returns with its
  // service date, order, service, motorcycle (brand/model/plate) and commission,
  // and shows an empty state when the backend returns no eligible lines (which
  // is how free labor lines and "Servicio de terceros" lines are excluded).

  it("lists each eligible labor line in the report breakdown with date, order, service, moto and commission", async () => {
    listCommissionLinesMock.mockResolvedValue([
      line({
        laborId: 11n,
        orderId: 5n,
        orderNumber: "OT-0005",
        serviceName: "Cambio de aceite",
        motorcycleBrand: "Honda",
        motorcycleModel: "XR 150L",
        motorcyclePlate: "ABC12D",
        baseAmount: 5000000n,
        commissionAmount: 500000n,
      }),
      line({
        laborId: 12n,
        orderId: 6n,
        orderNumber: "OT-0006",
        serviceName: "Alineación",
        motorcycleBrand: "Yamaha",
        motorcycleModel: "FZ",
        motorcyclePlate: "XYZ99A",
        baseAmount: 3000000n,
        commissionAmount: 300000n,
      }),
    ]);
    renderWithProviders(<CommissionsPage />);

    const breakdown = await screen.findByTestId(
      "commissions.report.breakdown.table",
    );
    const first = await within(breakdown).findByTestId(
      "commissions.report.breakdown.row.1",
    );
    expect(first).toHaveTextContent("OT-0005");
    expect(first).toHaveTextContent("Cambio de aceite");
    expect(first).toHaveTextContent("Honda XR 150L");
    expect(first).toHaveTextContent("ABC12D");
    // Base 5000000 cents = $ 50.000; commission 500000 cents = $ 5.000.
    expect(first).toHaveTextContent("$ 50.000");
    expect(first).toHaveTextContent("$ 5.000");
    // The service date column is present and formatted.
    expect(first).toHaveTextContent(/2023|2024/);

    const second = within(breakdown).getByTestId(
      "commissions.report.breakdown.row.2",
    );
    expect(second).toHaveTextContent("OT-0006");
    expect(second).toHaveTextContent("Alineación");
    expect(second).toHaveTextContent("Yamaha FZ");
    expect(second).toHaveTextContent("XYZ99A");
    // Base 3000000 cents = $ 30.000; commission 300000 cents = $ 3.000.
    expect(second).toHaveTextContent("$ 30.000");
    expect(second).toHaveTextContent("$ 3.000");
  });

  it("shows the breakdown empty state when no eligible labor line is returned", async () => {
    // The backend excludes free labor lines and "Servicio de terceros" services
    // from the derived lines, so the breakdown receives none of them.
    listCommissionLinesMock.mockResolvedValue([]);
    renderWithProviders(<CommissionsPage />);

    const breakdown = await screen.findByTestId(
      "commissions.report.breakdown.table",
    );
    expect(
      within(breakdown).getByTestId("commissions.report.breakdown.empty_state"),
    ).toHaveTextContent("Sin líneas de comisión en el periodo seleccionado.");
  });
});
