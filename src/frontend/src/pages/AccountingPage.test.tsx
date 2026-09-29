import type {
  AccountingReport,
  AccountingSummary,
  CategoryBreakdown,
  CompanyProfile,
  InventoryValuation,
  InventoryValuationCategory,
  InventoryValuationRow,
  InventoryValuationTotals,
  LedgerEntry,
  PaymentMethodBreakdown,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  LedgerEntryKind,
  TaxResponsibility,
} from "@/lib/types";
import { AccountingPage } from "@/pages/AccountingPage";
import { readXlsxBlob, renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the `/contabilidad` page.
 *
 * The first block pins the behavior that must survive the inventory-valuation
 * work: the period presets and date range, the four KPI cards, the
 * expense-category and payment-method breakdowns, the consolidated ledger table
 * and the CSV summary export.
 *
 * The second block covers the accepted inventory-valuation section: the summary
 * cards, the per-part table with search/filter/sort, the category breakdown, the
 * empty and error states and the CSV export.
 *
 * The third block covers the formal-document presentation: the company header
 * with NIT and cutoff date, the signature block and the print action.
 */

const getAccountingReportMock = vi.fn();
const getInventoryValuationMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const navigateMock = vi.fn();
let searchParams: Record<string, unknown> = {};

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getAccountingReport: getAccountingReportMock,
      getInventoryValuation: getInventoryValuationMock,
      getCompanyProfile: getCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

// The valuation filters are URL-driven, so the page needs the router hooks.
// `useSearch` reads a mutable object the tests set per case, and `useNavigate`
// records the search patch the page applies.
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useSearch: () => searchParams,
}));

const TS = 1_700_000_000_000_000_000n;

function summary(
  overrides: Partial<AccountingSummary> = {},
): AccountingSummary {
  return {
    expenseCount: 2n,
    invoiceCount: 3n,
    totalIncome: 500000n,
    totalExpenses: 200000n,
    profit: 300000n,
    totalCommissions: 0n,
    netProfit: 0n,
    ...overrides,
  };
}

function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    id: 1n,
    concept: "Factura F-001",
    date: TS,
    kind: LedgerEntryKind.income,
    category: "income",
    amount: 500000n,
    ...overrides,
  };
}

function categoryRow(
  overrides: Partial<CategoryBreakdown> = {},
): CategoryBreakdown {
  return { category: "parts", total: 200000n, ...overrides };
}

function methodRow(
  overrides: Partial<PaymentMethodBreakdown> = {},
): PaymentMethodBreakdown {
  return { method: "cash", total: 500000n, ...overrides };
}

function report(overrides: Partial<AccountingReport> = {}): AccountingReport {
  return {
    summary: summary(),
    entries: [entry()],
    byExpenseCategory: [categoryRow()],
    byPaymentMethod: [methodRow()],
    profit: {
      parts: {
        cost: 120000n,
        income: 200000n,
        commission: 0n,
        margin: 80000n,
        marginBps: 4000n,
      },
      services: {
        cost: 80000n,
        income: 300000n,
        commission: 80000n,
        margin: 220000n,
        marginBps: 7333n,
      },
      total: {
        cost: 200000n,
        income: 500000n,
        commission: 80000n,
        margin: 300000n,
        marginBps: 6000n,
      },
      totalCommission: 0n,
      netProfit: 0n,
      serviceLines: [
        {
          invoiceId: 1n,
          invoiceNumber: "FV-000001",
          orderId: 1n,
          description: "Cambio de aceite",
          serviceId: 1n,
          technicianId: 1n,
          technicianName: "Ana Pérez",
          charged: 300000n,
          commission: 80000n,
          profit: 220000n,
        },
      ],
    },
    ...overrides,
  };
}

function valuationRow(
  overrides: Partial<InventoryValuationRow> = {},
): InventoryValuationRow {
  return {
    partId: 1n,
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    units: 12n,
    costValue: 144000n,
    saleValue: 300000n,
    margin: 156000n,
    marginBps: 5200n,
    ...overrides,
  };
}

function valuationCategory(
  overrides: Partial<InventoryValuationCategory> = {},
): InventoryValuationCategory {
  return {
    category: "Frenos",
    partCount: 1n,
    units: 12n,
    costValue: 144000n,
    saleValue: 300000n,
    margin: 156000n,
    marginBps: 5200n,
    ...overrides,
  };
}

function valuationTotals(
  overrides: Partial<InventoryValuationTotals> = {},
): InventoryValuationTotals {
  return {
    totalCostValue: 144000n,
    totalSaleValue: 300000n,
    totalMargin: 156000n,
    marginBps: 5200n,
    partCount: 1n,
    totalUnits: 12n,
    ...overrides,
  };
}

function valuation(
  overrides: Partial<InventoryValuation> = {},
): InventoryValuation {
  return {
    rows: [valuationRow()],
    totals: valuationTotals(),
    byCategory: [valuationCategory()],
    ...overrides,
  };
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
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

describe("AccountingPage", () => {
  beforeEach(() => {
    getAccountingReportMock.mockReset();
    getInventoryValuationMock.mockReset();
    getCompanyProfileMock.mockReset();
    navigateMock.mockReset();
    searchParams = {};
    getInventoryValuationMock.mockResolvedValue(valuation());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("renders the four KPI cards from the report summary", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    // The KPI cards render as skeletons first; the ledger row only appears once
    // the report has loaded, so it is the reliable "loaded" signal.
    await screen.findByTestId("accounting.ledger.row.1");

    const income = screen.getByTestId("accounting.kpi.income");
    expect(within(income).getByText("Ingresos")).toBeInTheDocument();
    expect(within(income).getByText("$ 5.000")).toBeInTheDocument();

    const expenses = screen.getByTestId("accounting.kpi.expenses");
    expect(within(expenses).getByText("Gastos")).toBeInTheDocument();
    expect(within(expenses).getByText("$ 2.000")).toBeInTheDocument();

    const profit = screen.getByTestId("accounting.kpi.profit");
    expect(within(profit).getByText("Utilidad")).toBeInTheDocument();
    expect(within(profit).getByText("$ 3.000")).toBeInTheDocument();

    const counts = screen.getByTestId("accounting.kpi.counts");
    expect(within(counts).getByText("Movimientos")).toBeInTheDocument();
    // 3 invoices + 2 expenses.
    expect(within(counts).getByText("5")).toBeInTheDocument();
  });

  it("renders the expense-category and payment-method breakdowns", async () => {
    getAccountingReportMock.mockResolvedValue(
      report({
        byExpenseCategory: [
          categoryRow({ category: "Repuestos", total: 200000n }),
          categoryRow({ category: "Renta", total: 100000n }),
        ],
        byPaymentMethod: [
          methodRow({ method: "cash", total: 500000n }),
          methodRow({ method: "card", total: 250000n }),
        ],
      }),
    );
    renderWithProviders(<AccountingPage />);

    const categories = await screen.findByTestId(
      "accounting.category_breakdown",
    );
    // Categories are administrable, so the backend reports the category's own
    // name and the breakdown renders it verbatim.
    await within(categories).findByText("Repuestos");
    expect(within(categories).getByText("Repuestos")).toBeInTheDocument();
    expect(within(categories).getByText("Renta")).toBeInTheDocument();
    expect(
      within(categories).getByTestId("accounting.category_breakdown.item.1"),
    ).toHaveTextContent("Repuestos");

    const methods = screen.getByTestId("accounting.method_breakdown");
    expect(within(methods).getByText("Efectivo")).toBeInTheDocument();
    expect(within(methods).getByText("Tarjeta")).toBeInTheDocument();
  });

  it("shows an empty breakdown message when the period has no rows", async () => {
    getAccountingReportMock.mockResolvedValue(
      report({ byExpenseCategory: [], byPaymentMethod: [] }),
    );
    renderWithProviders(<AccountingPage />);

    expect(
      await screen.findByTestId("accounting.category_breakdown.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("accounting.method_breakdown.empty_state"),
    ).toBeInTheDocument();
  });

  it("lists ledger entries newest first with a signed amount and kind badge", async () => {
    getAccountingReportMock.mockResolvedValue(
      report({
        entries: [
          entry({
            id: 1n,
            concept: "Factura F-001",
            date: 1_700_000_000_000_000_000n,
            kind: LedgerEntryKind.income,
            amount: 500000n,
          }),
          entry({
            id: 2n,
            concept: "Compra de repuestos",
            date: 1_800_000_000_000_000_000n,
            kind: LedgerEntryKind.expense,
            category: "parts",
            amount: 200000n,
          }),
        ],
      }),
    );
    renderWithProviders(<AccountingPage />);

    const ledger = await screen.findByTestId("accounting.ledger");
    const firstRow = await within(ledger).findByTestId(
      "accounting.ledger.row.1",
    );
    const secondRow = within(ledger).getByTestId("accounting.ledger.row.2");

    // The newer expense entry is sorted above the older income entry.
    expect(firstRow).toHaveTextContent("Compra de repuestos");
    expect(firstRow).toHaveTextContent("−$ 2.000");
    expect(firstRow).toHaveTextContent("Egreso");

    expect(secondRow).toHaveTextContent("Factura F-001");
    expect(secondRow).toHaveTextContent("+$ 5.000");
    expect(secondRow).toHaveTextContent("Ingreso");
  });

  it("renders an empty ledger state when the period has no movements", async () => {
    getAccountingReportMock.mockResolvedValue(report({ entries: [] }));
    renderWithProviders(<AccountingPage />);

    expect(
      await screen.findByTestId("accounting.ledger.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sin movimientos en el periodo"),
    ).toBeInTheDocument();
  });

  it("renders an error state with a retry when the report fails to load", async () => {
    getAccountingReportMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<AccountingPage />);

    expect(
      await screen.findByTestId("accounting.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar el reporte contable."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("accounting.retry_button")).toBeInTheDocument();
  });

  it("queries the backend with no period bounds on first load", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    await waitFor(() => expect(getAccountingReportMock).toHaveBeenCalled());
    expect(getAccountingReportMock.mock.calls[0][1]).toEqual({
      from: undefined,
      to: undefined,
    });
  });

  it("applies a period preset and sends the resolved range to the backend", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);
    await screen.findByTestId("accounting.kpi.income");

    await userEvent.click(screen.getByTestId("accounting.period.month"));

    // "Este mes" fills the `from` date input with the first day of the current
    // Colombia month, so the value is a `YYYY-MM-DD` date.
    const fromInput = screen.getByTestId(
      "accounting.date_from_input",
    ) as HTMLInputElement;
    expect(fromInput.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await waitFor(() => {
      const lastCall = getAccountingReportMock.mock.calls.at(-1)?.[1] as {
        from?: bigint;
        to?: bigint;
      };
      expect(lastCall.from).toBeTypeOf("bigint");
      expect(lastCall.to).toBeUndefined();
    });
  });

  it("clears the active period filters", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);
    await screen.findByTestId("accounting.kpi.income");

    await userEvent.click(screen.getByTestId("accounting.period.year"));
    const fromInput = screen.getByTestId(
      "accounting.date_from_input",
    ) as HTMLInputElement;
    expect(fromInput.value).toMatch(/^\d{4}-01-01$/);

    await userEvent.click(
      screen.getByTestId("accounting.clear_filters_button"),
    );

    expect(fromInput.value).toBe("");
    expect(
      screen.queryByTestId("accounting.clear_filters_button"),
    ).not.toBeInTheDocument();
  });

  it("exports the summary as an Excel download", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    // jsdom does not implement the object-URL API the download path uses.
    const createObjectURL = vi.fn((_blob: Blob) => "blob:contabilidad");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    // Capture the anchor's `download` attribute at click time: the accepted
    // change is that the export is a real `.xlsx` file, not a `.csv`.
    let downloadName: string | undefined;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });

    try {
      renderWithProviders(<AccountingPage />);
      await screen.findByTestId("accounting.kpi.income");

      await userEvent.click(screen.getByTestId("accounting.export_button"));

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:contabilidad");
      expect(downloadName).toMatch(/\.xlsx$/);
      expect(createObjectURL.mock.calls[0][0].type).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  // --- Characterization: the summary export contract the format work must keep
  //
  // The accepted change turns the export into a real Excel workbook. These tests
  // pin the parts that must not change with it: the Concepto/Monto columns and
  // the row content of the period summary.

  it("exports the summary with Concepto and Monto rows for the period", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    const createObjectURL = vi.fn((_blob: Blob) => "blob:contabilidad");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<AccountingPage />);
      await screen.findByTestId("accounting.kpi.income");

      await userEvent.click(screen.getByTestId("accounting.export_button"));

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      const blob = createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toEqual(["Concepto", "Monto"]);
      // Money is exported as a decimal amount, not raw cents.
      expect(sheet.rows[0]).toEqual(["Ingresos", 5000]);
      expect(sheet.rows[1]).toEqual(["Gastos", 2000]);
      expect(sheet.rows[2]).toEqual(["Utilidad", 3000]);
      expect(sheet.rows[3]).toEqual(["Facturas pagadas", 3]);
      expect(sheet.rows[4]).toEqual(["Gastos registrados", 2]);
      // With no period selected the bounds fall back to their open labels.
      expect(sheet.rows[5]).toEqual(["Periodo desde", "inicio"]);
      expect(sheet.rows[6]).toEqual(["Periodo hasta", "hoy"]);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("exports the selected period bounds in the summary rows", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    const createObjectURL = vi.fn((_blob: Blob) => "blob:contabilidad");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<AccountingPage />);
      await screen.findByTestId("accounting.kpi.income");

      await userEvent.type(
        screen.getByTestId("accounting.date_from_input"),
        "2026-01-01",
      );
      await userEvent.type(
        screen.getByTestId("accounting.date_to_input"),
        "2026-01-31",
      );
      await userEvent.click(screen.getByTestId("accounting.export_button"));

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      const blob = createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.rows[5]).toEqual(["Periodo desde", "2026-01-01"]);
      expect(sheet.rows[6]).toEqual(["Periodo hasta", "2026-01-31"]);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  // --- Valoración de inventario -------------------------------------------

  it("renders the valuation section below the period report", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const section = await screen.findByTestId("accounting.valuation.section");
    expect(
      within(section).getByText("Valoración de inventario"),
    ).toBeInTheDocument();

    // The period report is still present above it.
    expect(screen.getByTestId("accounting.ledger")).toBeInTheDocument();
  });

  it("shows cost, sale and margin summary cards from the valuation totals", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const cost = await screen.findByTestId(
      "accounting.valuation.kpi.cost_value",
    );
    expect(within(cost).getByText("Valor de costo")).toBeInTheDocument();
    expect(within(cost).getByText("$ 1.440")).toBeInTheDocument();

    const sale = screen.getByTestId("accounting.valuation.kpi.sale_value");
    expect(within(sale).getByText("Valor de venta")).toBeInTheDocument();
    expect(within(sale).getByText("$ 3.000")).toBeInTheDocument();

    const margin = screen.getByTestId("accounting.valuation.kpi.margin");
    expect(within(margin).getByText("Margen de utilidad")).toBeInTheDocument();
    expect(within(margin).getByText("$ 1.560")).toBeInTheDocument();
    // 156000 / 300000 = 52.0 %.
    expect(
      within(margin).getByText("52,0 % sobre el valor de venta"),
    ).toBeInTheDocument();
  });

  it("renders a per-part row with cost, sale and margin values", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const row = await screen.findByTestId("accounting.valuation.row.1");
    expect(row).toHaveTextContent("REP-0001");
    expect(row).toHaveTextContent("Balata de freno");
    expect(row).toHaveTextContent("Frenos");
    expect(row).toHaveTextContent("12");
    // 144000 / 12 = 12000 average unit cost.
    expect(row).toHaveTextContent("$ 120");
    expect(row).toHaveTextContent("$ 1.440");
    expect(row).toHaveTextContent("$ 3.000");
    expect(row).toHaveTextContent("$ 1.560");
    expect(row).toHaveTextContent("52,0 %");
  });

  it("renders the category breakdown with the same totals as the summary", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const breakdown = await screen.findByTestId(
      "accounting.valuation.category_breakdown",
    );
    const item = within(breakdown).getByTestId(
      "accounting.valuation.category_breakdown.item.1",
    );
    expect(item).toHaveTextContent("Frenos");
    expect(item).toHaveTextContent("$ 3.000");
    expect(item).toHaveTextContent("$ 1.440");
    expect(item).toHaveTextContent("$ 1.560");
  });

  it("filters the table by SKU and reflects the term in the URL", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
          }),
          valuationRow({
            partId: 2n,
            sku: "REP-0002",
            name: "Filtro de aceite",
            units: 4n,
            costValue: 40000n,
            saleValue: 100000n,
            margin: 60000n,
            marginBps: 6000n,
          }),
        ],
      }),
    );
    renderWithProviders(<AccountingPage />);

    await screen.findByTestId("accounting.valuation.row.1");
    expect(
      screen.getByTestId("accounting.valuation.row.2"),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByTestId("accounting.valuation.search_input"),
      "REP-0001",
    );

    // The debounced term is written to the URL search params.
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled();
      const lastCall = navigateMock.mock.calls.at(-1)?.[0] as {
        search: (prev: Record<string, unknown>) => Record<string, unknown>;
      };
      expect(lastCall.search({})).toMatchObject({ q: "REP-0001" });
    });
  });

  it("filters the table rows by the search term from the URL", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    searchParams = { q: "REP-0001" };
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
          }),
          valuationRow({
            partId: 2n,
            sku: "REP-0002",
            name: "Filtro de aceite",
            units: 4n,
            costValue: 40000n,
            saleValue: 100000n,
            margin: 60000n,
            marginBps: 6000n,
          }),
        ],
      }),
    );
    renderWithProviders(<AccountingPage />);

    const row = await screen.findByTestId("accounting.valuation.row.1");
    expect(row).toHaveTextContent("REP-0001");
    expect(
      screen.queryByTestId("accounting.valuation.row.2"),
    ).not.toBeInTheDocument();
  });

  it("sorts the table when a sortable header is clicked", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
            saleValue: 300000n,
          }),
          valuationRow({
            partId: 2n,
            sku: "REP-0002",
            name: "Filtro de aceite",
            saleValue: 100000n,
          }),
        ],
      }),
    );
    renderWithProviders(<AccountingPage />);

    await screen.findByTestId("accounting.valuation.row.1");
    // Default sort is sale value descending: REP-0001 first.
    expect(screen.getByTestId("accounting.valuation.row.1")).toHaveTextContent(
      "REP-0001",
    );

    await userEvent.click(screen.getByTestId("accounting.valuation.sort.sku"));

    // Sorting by SKU ascending keeps REP-0001 first, so click again for desc.
    await userEvent.click(screen.getByTestId("accounting.valuation.sort.sku"));
    await waitFor(() => {
      expect(
        screen.getByTestId("accounting.valuation.row.1"),
      ).toHaveTextContent("REP-0002");
    });
  });

  it("shows the empty state when the inventory has no valued parts", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [],
        byCategory: [],
        totals: valuationTotals({
          totalCostValue: 0n,
          totalSaleValue: 0n,
          totalMargin: 0n,
          marginBps: 0n,
          partCount: 0n,
          totalUnits: 0n,
        }),
      }),
    );
    renderWithProviders(<AccountingPage />);

    expect(
      await screen.findByTestId("accounting.valuation.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin inventario valorado")).toBeInTheDocument();
  });

  it("renders an error state with a retry when the valuation fails to load", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<AccountingPage />);

    expect(
      await screen.findByTestId("accounting.valuation.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar la valoración del inventario."),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("accounting.valuation.retry_button"),
    ).toBeInTheDocument();
  });

  it("exports the valuation as an Excel workbook with one row per part plus totals", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
          }),
          valuationRow({
            partId: 2n,
            sku: "REP-0002",
            name: "Filtro de aceite",
            units: 4n,
            costValue: 40000n,
            saleValue: 100000n,
            margin: 60000n,
            marginBps: 6000n,
          }),
        ],
        totals: valuationTotals({
          totalCostValue: 184000n,
          totalSaleValue: 400000n,
          totalMargin: 216000n,
          marginBps: 5400n,
          partCount: 2n,
          totalUnits: 16n,
        }),
      }),
    );

    const createObjectURL = vi.fn((_blob: Blob) => "blob:valoracion");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    // Capture the anchor's `download` attribute at click time: the accepted
    // change is that the export is a real `.xlsx` file, not a `.csv`.
    let downloadName: string | undefined;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });

    try {
      renderWithProviders(<AccountingPage />);
      await screen.findByTestId("accounting.valuation.row.1");

      await userEvent.click(
        screen.getByTestId("accounting.valuation.export_button"),
      );

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:valoracion");
      expect(downloadName).toMatch(/\.xlsx$/);

      // The workbook carries one row per part plus a final totals row.
      const blob = createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toContain("SKU");
      expect(sheet.headers).toContain("Margen %");
      expect(sheet.rows).toHaveLength(3); // 2 parts + totals
      expect(sheet.rows[0][0]).toBe("REP-0001");
      expect(sheet.rows[1][0]).toBe("REP-0002");
      expect(sheet.rows[2][0]).toBe("TOTAL");
      const saleIndex = sheet.headers.indexOf("Valor de venta");
      expect(sheet.rows[2][saleIndex]).toBe("$ 4.000");
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("keeps the valuation table horizontally scrollable on small screens", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const row = await screen.findByTestId("accounting.valuation.row.1");
    const table = row.closest("table");
    expect(table).not.toBeNull();
    // The table sits inside an overflow-x container so narrow viewports can
    // scroll it instead of clipping columns.
    expect(table?.parentElement?.className).toContain("overflow-x-auto");
  });

  // --- Characterization: adjacent behavior the valuation work must keep ----

  it("keeps the period report usable when the valuation query fails", async () => {
    // The two sections load independently: a valuation failure must not blank
    // out the period report above it.
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<AccountingPage />);

    expect(
      await screen.findByTestId("accounting.valuation.error_state"),
    ).toBeInTheDocument();
    // The period KPIs, breakdowns and ledger are still rendered.
    expect(screen.getByTestId("accounting.kpi.income")).toBeInTheDocument();
    expect(
      screen.getByTestId("accounting.category_breakdown"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("accounting.ledger")).toBeInTheDocument();
    expect(screen.getByTestId("accounting.ledger.row.1")).toBeInTheDocument();
  });

  it("keeps the valuation section usable when the period report fails", async () => {
    // The inverse independence: a report failure must not hide the valuation.
    getAccountingReportMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<AccountingPage />);

    expect(
      await screen.findByTestId("accounting.error_state"),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("accounting.valuation.section"),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("accounting.valuation.row.1"),
    ).toBeInTheDocument();
  });

  it("requests the valuation snapshot with no period arguments", async () => {
    // The valuation is a snapshot of stock on hand, never period-scoped, so the
    // hook must call the backend method with no arguments.
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    await screen.findByTestId("accounting.valuation.row.1");
    expect(getInventoryValuationMock).toHaveBeenCalledTimes(1);
    // The session token is the only argument; the snapshot is never period-scoped.
    expect(getInventoryValuationMock.mock.calls[0]).toEqual([null]);
  });

  it("renders the valuation money values in COP format from the backend payload", async () => {
    // The page must render whatever cost/sale/margin the backend returns, in
    // the shared COP format, without recomputing the cost formula itself.
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 7n,
            sku: "REP-0007",
            name: "Kit de arrastre",
            units: 3n,
            costValue: 90000n,
            saleValue: 150000n,
            margin: 60000n,
            marginBps: 4000n,
          }),
        ],
        byCategory: [
          valuationCategory({
            category: "Transmisión",
            partCount: 1n,
            units: 3n,
            costValue: 90000n,
            saleValue: 150000n,
            margin: 60000n,
            marginBps: 4000n,
          }),
        ],
        totals: valuationTotals({
          totalCostValue: 90000n,
          totalSaleValue: 150000n,
          totalMargin: 60000n,
          marginBps: 4000n,
          partCount: 1n,
          totalUnits: 3n,
        }),
      }),
    );
    renderWithProviders(<AccountingPage />);

    const row = await screen.findByTestId("accounting.valuation.row.1");
    expect(row).toHaveTextContent("REP-0007");
    expect(row).toHaveTextContent("$ 900");
    expect(row).toHaveTextContent("$ 1.500");
    expect(row).toHaveTextContent("$ 600");
    expect(row).toHaveTextContent("40,0 %");

    const cost = screen.getByTestId("accounting.valuation.kpi.cost_value");
    expect(within(cost).getByText("$ 900")).toBeInTheDocument();
    const sale = screen.getByTestId("accounting.valuation.kpi.sale_value");
    expect(within(sale).getByText("$ 1.500")).toBeInTheDocument();
    const margin = screen.getByTestId("accounting.valuation.kpi.margin");
    expect(within(margin).getByText("$ 600")).toBeInTheDocument();
  });

  it("filters the valuation rows by the category from the URL", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    searchParams = { categoria: "Frenos" };
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
            category: "Frenos",
          }),
          valuationRow({
            partId: 2n,
            sku: "REP-0002",
            name: "Filtro de aceite",
            category: "Lubricantes",
          }),
        ],
        byCategory: [
          valuationCategory({ category: "Frenos" }),
          valuationCategory({ category: "Lubricantes" }),
        ],
      }),
    );
    renderWithProviders(<AccountingPage />);

    const row = await screen.findByTestId("accounting.valuation.row.1");
    expect(row).toHaveTextContent("REP-0001");
    expect(
      screen.queryByTestId("accounting.valuation.row.2"),
    ).not.toBeInTheDocument();
  });

  it("clears the valuation filters and removes them from the URL", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    searchParams = { q: "REP-0001", categoria: "Frenos" };
    renderWithProviders(<AccountingPage />);

    await screen.findByTestId("accounting.valuation.row.1");
    await userEvent.click(
      screen.getByTestId("accounting.valuation.clear_filters_button"),
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled();
      const lastCall = navigateMock.mock.calls.at(-1)?.[0] as {
        search: (prev: Record<string, unknown>) => Record<string, unknown>;
      };
      // Empty keys are deleted from the search patch rather than written as "".
      expect(lastCall.search({ q: "REP-0001", categoria: "Frenos" })).toEqual(
        {},
      );
    });
  });

  // --- Documento formal del informe ---------------------------------------

  it("renders the formal document with the company header and cutoff date", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const document = await screen.findByTestId("accounting.valuation.document");
    // The company identity comes from the profile configured in /empresa.
    expect(
      within(document).getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
    // The NIT renders with its check digit.
    expect(within(document).getByText("NIT 900.123.456-8")).toBeInTheDocument();
    // The report title and the cutoff label are part of the document.
    expect(
      within(document).getByText("Informe de valoración de inventario"),
    ).toBeInTheDocument();
    expect(within(document).getByText("Fecha de corte")).toBeInTheDocument();
    // The fiscal block carries the regime and tax responsibility labels.
    expect(
      within(document).getByText("Responsable de IVA"),
    ).toBeInTheDocument();
    expect(within(document).getByText("No aplica")).toBeInTheDocument();
  });

  it("renders the company logo in the valuation document header when configured", async () => {
    // The accepted change propagates the company logo to every document header,
    // including the inventory valuation report. The logo comes from the company
    // profile configured in /empresa, so a page that only read the business
    // settings would render no logo here.
    getAccountingReportMock.mockResolvedValue(report());
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ logoUrl: "https://cdn.example.com/logo.png" }),
    );
    renderWithProviders(<AccountingPage />);

    const document = await screen.findByTestId("accounting.valuation.document");
    const logo = within(document).getByTestId(
      "accounting.valuation.document.company.logo",
    );
    expect(logo).toHaveAttribute("src", "https://cdn.example.com/logo.png");
  });

  it("omits the logo from the valuation document header when none is configured", async () => {
    // With no logo the header renders without an image, so the company name and
    // fiscal block still lay out correctly.
    getAccountingReportMock.mockResolvedValue(report());
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ logoUrl: undefined }),
    );
    renderWithProviders(<AccountingPage />);

    const document = await screen.findByTestId("accounting.valuation.document");
    expect(
      within(document).queryByTestId(
        "accounting.valuation.document.company.logo",
      ),
    ).not.toBeInTheDocument();
    // The rest of the header is still present.
    expect(
      within(document).getByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
  });

  it("renders the signature block with elaboró, revisó and aprobó lines", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const signature = await screen.findByTestId(
      "accounting.valuation.document.signature",
    );
    expect(within(signature).getByText("Elaboró")).toBeInTheDocument();
    expect(within(signature).getByText("Revisó")).toBeInTheDocument();
    expect(within(signature).getByText("Aprobó")).toBeInTheDocument();
    // Each role has room for a name and an id document.
    expect(within(signature).getAllByText("Nombre:")).toHaveLength(3);
    expect(within(signature).getAllByText("Cédula:")).toHaveLength(3);
  });

  it("opens the print dialog from the print/PDF action", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    try {
      renderWithProviders(<AccountingPage />);
      await screen.findByTestId("accounting.valuation.row.1");

      await userEvent.click(
        screen.getByTestId("accounting.valuation.print_button"),
      );

      expect(printSpy).toHaveBeenCalledTimes(1);
    } finally {
      printSpy.mockRestore();
    }
  });

  it("shows a zero-stock part with zero cost, sale and margin", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 9n,
            sku: "REP-0009",
            name: "Bujía iridio",
            units: 0n,
            costValue: 0n,
            saleValue: 0n,
            margin: 0n,
            marginBps: 0n,
          }),
        ],
        byCategory: [
          valuationCategory({
            category: "Encendido",
            partCount: 1n,
            units: 0n,
            costValue: 0n,
            saleValue: 0n,
            margin: 0n,
            marginBps: 0n,
          }),
        ],
        totals: valuationTotals({
          totalCostValue: 0n,
          totalSaleValue: 0n,
          totalMargin: 0n,
          marginBps: 0n,
          partCount: 1n,
          totalUnits: 0n,
        }),
      }),
    );
    renderWithProviders(<AccountingPage />);

    const row = await screen.findByTestId("accounting.valuation.row.1");
    expect(row).toHaveTextContent("REP-0009");
    expect(row).toHaveTextContent("0");
    // Cost, sale and margin all render as $ 0 and the percentage as 0,0 %.
    expect(within(row).getAllByText("$ 0").length).toBeGreaterThanOrEqual(3);
    expect(row).toHaveTextContent("0,0 %");
  });

  it("renders a negative margin with its sign and a zero percentage", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 5n,
            sku: "REP-0005",
            name: "Repuesto en pérdida",
            units: 5n,
            costValue: 50000n,
            saleValue: 40000n,
            margin: -10000n,
            marginBps: 0n,
          }),
        ],
        byCategory: [
          valuationCategory({
            category: "Varios",
            partCount: 1n,
            units: 5n,
            costValue: 50000n,
            saleValue: 40000n,
            margin: -10000n,
            marginBps: 0n,
          }),
        ],
        totals: valuationTotals({
          totalCostValue: 50000n,
          totalSaleValue: 40000n,
          totalMargin: -10000n,
          marginBps: 0n,
          partCount: 1n,
          totalUnits: 5n,
        }),
      }),
    );
    renderWithProviders(<AccountingPage />);

    const row = await screen.findByTestId("accounting.valuation.row.1");
    // A negative margin keeps its sign and reports 0,0 % rather than a negative.
    expect(row).toHaveTextContent("-$ 100");
    expect(row).toHaveTextContent("0,0 %");

    const margin = screen.getByTestId("accounting.valuation.kpi.margin");
    expect(within(margin).getByText("-$ 100")).toBeInTheDocument();
  });

  it("renders the accepted COP totals and a margin equal to sale minus cost", async () => {
    // The accepted figures for the real inventory: cost 15.455.897, sale
    // 32.087.608 and margin 16.631.711, which is exactly sale − cost. The
    // backend sends integer cents, so the page must group them as COP.
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
            units: 12n,
            costValue: 1545589700n,
            saleValue: 3208760800n,
            margin: 1663171100n,
            marginBps: 5183n,
          }),
        ],
        byCategory: [
          valuationCategory({
            category: "Frenos",
            partCount: 1n,
            units: 12n,
            costValue: 1545589700n,
            saleValue: 3208760800n,
            margin: 1663171100n,
            marginBps: 5183n,
          }),
        ],
        totals: valuationTotals({
          totalCostValue: 1545589700n,
          totalSaleValue: 3208760800n,
          totalMargin: 1663171100n,
          marginBps: 5183n,
          partCount: 1n,
          totalUnits: 12n,
        }),
      }),
    );
    renderWithProviders(<AccountingPage />);

    const cost = await screen.findByTestId(
      "accounting.valuation.kpi.cost_value",
    );
    expect(within(cost).getByText("$ 15.455.897")).toBeInTheDocument();

    const sale = screen.getByTestId("accounting.valuation.kpi.sale_value");
    expect(within(sale).getByText("$ 32.087.608")).toBeInTheDocument();

    const margin = screen.getByTestId("accounting.valuation.kpi.margin");
    expect(within(margin).getByText("$ 16.631.711")).toBeInTheDocument();
    // 1663171100 / 3208760800 = 51.83 % → one decimal with a comma.
    expect(
      within(margin).getByText("51,8 % sobre el valor de venta"),
    ).toBeInTheDocument();

    // The margin is exactly the sale value minus the cost value.
    expect(3208760800n - 1545589700n).toBe(1663171100n);
  });

  it("repeats the three accepted totals in the formal document and the Excel TOTAL row", async () => {
    // The formal document (print/PDF surface) and the CSV export must carry the
    // same three totals as the KPI tiles, so a printed or exported report never
    // disagrees with the screen.
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
            units: 12n,
            costValue: 1545589700n,
            saleValue: 3208760800n,
            margin: 1663171100n,
            marginBps: 5183n,
          }),
        ],
        byCategory: [
          valuationCategory({
            category: "Frenos",
            partCount: 1n,
            units: 12n,
            costValue: 1545589700n,
            saleValue: 3208760800n,
            margin: 1663171100n,
            marginBps: 5183n,
          }),
        ],
        totals: valuationTotals({
          totalCostValue: 1545589700n,
          totalSaleValue: 3208760800n,
          totalMargin: 1663171100n,
          marginBps: 5183n,
          partCount: 1n,
          totalUnits: 12n,
        }),
      }),
    );

    const createObjectURL = vi.fn((_blob: Blob) => "blob:valoracion");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<AccountingPage />);
      await screen.findByTestId("accounting.valuation.row.1");

      // The formal document (the print/PDF surface) carries the three totals in
      // its KPI tiles and repeats them in the table footer.
      const document = screen.getByTestId("accounting.valuation.document");
      const cost = within(document).getByTestId(
        "accounting.valuation.kpi.cost_value",
      );
      expect(within(cost).getByText("$ 15.455.897")).toBeInTheDocument();
      const sale = within(document).getByTestId(
        "accounting.valuation.kpi.sale_value",
      );
      expect(within(sale).getByText("$ 32.087.608")).toBeInTheDocument();
      const margin = within(document).getByTestId(
        "accounting.valuation.kpi.margin",
      );
      expect(within(margin).getByText("$ 16.631.711")).toBeInTheDocument();

      const footer = within(document).getByTestId(
        "accounting.valuation.table_panel",
      );
      // The footer is the panel's last child; the row cells above repeat the
      // same figures, so assert on the footer's own text content.
      const footerText = footer.lastElementChild?.textContent ?? "";
      expect(footerText).toContain("$ 15.455.897");
      expect(footerText).toContain("$ 32.087.608");
      expect(footerText).toContain("$ 16.631.711 · 51,8 %");

      await userEvent.click(
        screen.getByTestId("accounting.valuation.export_button"),
      );

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      const blob = createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      const totalRow = sheet.rows[sheet.rows.length - 1];
      expect(totalRow[0]).toBe("TOTAL");
      expect(totalRow).toContain("$ 15.455.897");
      expect(totalRow).toContain("$ 32.087.608");
      expect(totalRow).toContain("$ 16.631.711");
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("reconciles the totals footer with the rows and the category breakdown", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    getInventoryValuationMock.mockResolvedValue(
      valuation({
        rows: [
          valuationRow({
            partId: 1n,
            sku: "REP-0001",
            name: "Balata de freno",
            units: 12n,
            costValue: 144000n,
            saleValue: 300000n,
            margin: 156000n,
            marginBps: 5200n,
          }),
          valuationRow({
            partId: 2n,
            sku: "REP-0002",
            name: "Filtro de aceite",
            category: "Lubricantes",
            units: 4n,
            costValue: 40000n,
            saleValue: 100000n,
            margin: 60000n,
            marginBps: 6000n,
          }),
        ],
        byCategory: [
          valuationCategory({
            category: "Frenos",
            partCount: 1n,
            units: 12n,
            costValue: 144000n,
            saleValue: 300000n,
            margin: 156000n,
            marginBps: 5200n,
          }),
          valuationCategory({
            category: "Lubricantes",
            partCount: 1n,
            units: 4n,
            costValue: 40000n,
            saleValue: 100000n,
            margin: 60000n,
            marginBps: 6000n,
          }),
        ],
        totals: valuationTotals({
          totalCostValue: 184000n,
          totalSaleValue: 400000n,
          totalMargin: 216000n,
          marginBps: 5400n,
          partCount: 2n,
          totalUnits: 16n,
        }),
      }),
    );
    renderWithProviders(<AccountingPage />);

    await screen.findByTestId("accounting.valuation.row.1");
    const tablePanel = screen.getByTestId("accounting.valuation.table_panel");
    // The footer totals equal the sum of the two rows.
    expect(within(tablePanel).getByText("$ 1.840")).toBeInTheDocument();
    expect(within(tablePanel).getByText("$ 4.000")).toBeInTheDocument();
    expect(
      within(tablePanel).getByText("$ 2.160 · 54,0 %"),
    ).toBeInTheDocument();

    // The category breakdown header carries the aggregate sale value, and each
    // category item carries its own cost and margin.
    const breakdown = screen.getByTestId(
      "accounting.valuation.category_breakdown",
    );
    expect(within(breakdown).getByText("$ 4.000")).toBeInTheDocument();
    const frenos = within(breakdown).getByTestId(
      "accounting.valuation.category_breakdown.item.1",
    );
    expect(frenos).toHaveTextContent("Frenos");
    expect(frenos).toHaveTextContent("$ 1.440");
    expect(frenos).toHaveTextContent("$ 1.560");
    const lubricantes = within(breakdown).getByTestId(
      "accounting.valuation.category_breakdown.item.2",
    );
    expect(lubricantes).toHaveTextContent("Lubricantes");
    expect(lubricantes).toHaveTextContent("$ 400");
    expect(lubricantes).toHaveTextContent("$ 600");
  });

  // --- Characterization: the profit split the report must keep --------------
  //
  // The accepted change adds a profit breakdown that separates the margin
  // generated by repuestos from the margin generated by servicios, scoped to
  // the selected date range. These tests protect the surrounding working
  // behavior: the panel renders one block per side plus the consolidated total,
  // each block shows its income, cost and margin, and the total block reconciles
  // with the two sides. They never assert the exact panel copy.

  it("renders the parts, services and consolidated profit blocks", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const panel = await screen.findByTestId("accounting.profit");
    expect(
      within(panel).getByText("Utilidad por repuestos y servicios"),
    ).toBeInTheDocument();

    const parts = within(panel).getByTestId("accounting.profit.parts");
    expect(parts).toHaveTextContent("Repuestos");
    // parts: income 200000, cost 120000, margin 80000.
    expect(parts).toHaveTextContent("$ 2.000");
    expect(parts).toHaveTextContent("$ 1.200");
    expect(parts).toHaveTextContent("$ 800");

    const services = within(panel).getByTestId("accounting.profit.services");
    expect(services).toHaveTextContent("Servicios");
    // services: income 300000, cost 80000, margin 220000.
    expect(services).toHaveTextContent("$ 3.000");
    expect(services).toHaveTextContent("$ 800");
    expect(services).toHaveTextContent("$ 2.200");

    const total = within(panel).getByTestId("accounting.profit.total");
    expect(total).toHaveTextContent("$ 5.000");
    expect(total).toHaveTextContent("$ 2.000");
    expect(total).toHaveTextContent("$ 3.000");
  });

  it("shows each service line's profit as charged minus the technician commission", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    const panel = await screen.findByTestId("accounting.profit");
    const lines = within(panel).getByTestId("accounting.profit.service_lines");
    const row = within(lines).getByTestId(
      "accounting.profit.service_lines.row.1",
    );

    // The fixture line charges 300000 and pays an 80000 commission, so the
    // utilidad por servicio is 220000 — the accepted rule.
    expect(row).toHaveTextContent("FV-000001");
    expect(row).toHaveTextContent("Cambio de aceite");
    expect(row).toHaveTextContent("Ana Pérez");
    expect(row).toHaveTextContent("$ 3.000");
    expect(row).toHaveTextContent("$ 800");
    expect(row).toHaveTextContent("$ 2.200");

    const view = report();
    const line = view.profit.serviceLines[0];
    expect(line.profit).toBe(line.charged - line.commission);
  });

  it("reconciles the consolidated profit block with the two sides", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);

    await screen.findByTestId("accounting.profit.total");

    // The fixture's consolidated block is the sum of the parts and services
    // blocks, so a change to how either side is computed cannot desynchronize
    // the total.
    const view = report();
    expect(view.profit.total.income).toBe(
      view.profit.parts.income + view.profit.services.income,
    );
    expect(view.profit.total.cost).toBe(
      view.profit.parts.cost + view.profit.services.cost,
    );
    expect(view.profit.total.margin).toBe(
      view.profit.parts.margin + view.profit.services.margin,
    );
  });

  it("discounts the period's technician commissions from the consolidated profit", async () => {
    // The accepted rule: netProfit = margin − totalCommission. The fixture's
    // consolidated margin is 300000 and the period pays 80000 in commissions,
    // so the net utility is 220000.
    const base = report();
    const profit = {
      ...base.profit,
      totalCommission: 80000n,
      netProfit: 220000n,
    };
    getAccountingReportMock.mockResolvedValue(report({ profit }));
    renderWithProviders(<AccountingPage />);

    const panel = await screen.findByTestId("accounting.profit");
    const netSummary = within(panel).getByTestId(
      "accounting.profit.net_summary",
    );
    expect(netSummary).toHaveTextContent("Comisiones de técnicos del periodo");
    expect(netSummary).toHaveTextContent("−$ 800");
    expect(netSummary).toHaveTextContent("Utilidad neta después de comisiones");
    expect(netSummary).toHaveTextContent("$ 2.200");
    // The net utility is the consolidated margin minus the commissions.
    expect(profit.total.margin - profit.totalCommission).toBe(220000n);
  });

  it("scopes the profit breakdown to the selected date range", async () => {
    getAccountingReportMock.mockResolvedValue(report());
    renderWithProviders(<AccountingPage />);
    await screen.findByTestId("accounting.profit.total");

    await userEvent.type(
      screen.getByTestId("accounting.date_from_input"),
      "2026-01-01",
    );
    await userEvent.type(
      screen.getByTestId("accounting.date_to_input"),
      "2026-01-31",
    );

    await waitFor(() => {
      const lastCall = getAccountingReportMock.mock.calls.at(-1)?.[1] as {
        from?: bigint;
        to?: bigint;
      };
      expect(lastCall.from).toBeTypeOf("bigint");
      expect(lastCall.to).toBeTypeOf("bigint");
    });
  });
});
