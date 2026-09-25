import { CommissionDocument } from "@/components/CommissionDocument";
import type {
  CommissionLine,
  CommissionPayment,
  CommissionReport,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the commission document.
 *
 * The accepted change adds a per-line breakdown (service, motorcycle and
 * service date) to the commission receipt and excludes "Servicio de terceros"
 * lines from the report. These tests protect the surrounding working behavior
 * that must survive it: the receipt renders one row per labor line with its
 * service, motorcycle brand/model/plate and service date, and the report body
 * renders the per-technician totals. They never assert the third-party
 * exclusion.
 */

const TS = 1_700_000_000_000_000_000n;

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

function payment(
  overrides: Partial<CommissionPayment> = {},
): CommissionPayment {
  return {
    id: 99n,
    technicianId: 1n,
    technicianCode: "TEC-001",
    technicianName: "Ana Gómez",
    period: {},
    lineCount: 1n,
    baseAmount: 5000000n,
    commissionAmount: 500000n,
    loansDeducted: 0n,
    loans: [],
    netPaid: 500000n,
    lines: [line()],
    paidAt: TS,
    paidBy: undefined as never,
    ...overrides,
  };
}

function report(overrides: Partial<CommissionReport> = {}): CommissionReport {
  return {
    period: {},
    technicians: [
      {
        technicianId: 1n,
        technicianCode: "TEC-001",
        technicianName: "Ana Gómez",
        commissionRate: 10n,
        lineCount: 1n,
        baseAmount: 5000000n,
        commissionAmount: 500000n,
        pendingLoanCount: 0n,
        pendingLoansAmount: 0n,
        netPayable: 500000n,
      },
    ],
    totalBase: 5000000n,
    totalCommission: 500000n,
    totalPendingLoans: 0n,
    totalNetPayable: 500000n,
    ...overrides,
  };
}

const company = { name: "Taller HR Motos" };

describe("CommissionDocument", () => {
  it("renders the service, motorcycle and service date for each receipt line", () => {
    renderWithProviders(
      <CommissionDocument
        kind="receipt"
        payment={payment()}
        lines={[line()]}
        company={company}
        onDownload={vi.fn()}
      />,
    );

    const document = screen.getByTestId("commissions.document");
    expect(
      within(document).getByText("Desglose por servicio y moto"),
    ).toBeInTheDocument();
    // The service name, the motorcycle brand/model with its plate, and the
    // order number are all present for the line.
    expect(within(document).getByText("Cambio de aceite")).toBeInTheDocument();
    expect(
      within(document).getByText("Honda XR 150L · ABC12D"),
    ).toBeInTheDocument();
    expect(within(document).getByText("OT-0005")).toBeInTheDocument();
    // The service date is rendered in the line's first column.
    const row = within(document).getByText("OT-0005").closest("tr");
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByText(/2023|2024/),
    ).toBeInTheDocument();
  });

  it("renders one row per labor line in the receipt breakdown", () => {
    renderWithProviders(
      <CommissionDocument
        kind="receipt"
        payment={payment({ lineCount: 2n })}
        lines={[
          line({ laborId: 11n, serviceName: "Cambio de aceite" }),
          line({
            laborId: 12n,
            serviceName: "Alineación",
            motorcycleBrand: "Yamaha",
            motorcycleModel: "FZ 2.0",
            motorcyclePlate: "XYZ99",
          }),
        ]}
        company={company}
        onDownload={vi.fn()}
      />,
    );

    const document = screen.getByTestId("commissions.document");
    expect(within(document).getByText("Cambio de aceite")).toBeInTheDocument();
    expect(within(document).getByText("Alineación")).toBeInTheDocument();
    expect(
      within(document).getByText("Yamaha FZ 2.0 · XYZ99"),
    ).toBeInTheDocument();
  });

  it("renders the receipt totals including the net paid", () => {
    renderWithProviders(
      <CommissionDocument
        kind="receipt"
        payment={payment()}
        lines={[line()]}
        company={company}
        onDownload={vi.fn()}
      />,
    );

    const document = screen.getByTestId("commissions.document");
    expect(
      within(document).getByText("Base de mano de obra"),
    ).toBeInTheDocument();
    expect(within(document).getByText("Comisión generada")).toBeInTheDocument();
    expect(within(document).getByText("Neto pagado")).toBeInTheDocument();
  });

  it("renders the per-technician totals in the general report", () => {
    renderWithProviders(
      <CommissionDocument
        kind="report"
        report={report()}
        company={company}
        onDownload={vi.fn()}
      />,
    );

    const document = screen.getByTestId("commissions.document");
    expect(within(document).getByText("TEC-001")).toBeInTheDocument();
    expect(within(document).getByText("Ana Gómez")).toBeInTheDocument();
    expect(
      within(document).getByText("Total neto a pagar"),
    ).toBeInTheDocument();
  });
});
