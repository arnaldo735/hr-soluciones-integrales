import { INVENTORY_CSV_HEADERS } from "@/components/InventoryImportDialog";
import type {
  AccountingReport,
  CompanyProfile,
  InventoryCsvRow,
  InventoryImportResult,
  InventoryValuation,
  InventoryValuationRow,
  InventoryValuationTotals,
  PartPage,
  PartView,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  ImportRowStatus,
  PartSort,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { AccountingPage } from "@/pages/AccountingPage";
import { InventoryPage } from "@/pages/InventoryPage";
import {
  corruptXlsxFile,
  readXlsxBlob,
  renderWithProviders,
  xlsxFile,
} from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useRoleMock = vi.fn();
const listPartsDirMock = vi.fn();
const listPartFacetsMock = vi.fn();
const exportInventoryCsvMock = vi.fn();
const importInventoryCsvMock = vi.fn();
const zeroInventoryMock = vi.fn();
const getInventoryValuationMock = vi.fn();
const getAccountingReportMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listPartsDir: listPartsDirMock,
      listPartFacets: listPartFacetsMock,
      exportInventoryCsv: exportInventoryCsvMock,
      importInventoryCsv: importInventoryCsvMock,
      zeroInventory: zeroInventoryMock,
      getInventoryValuation: getInventoryValuationMock,
      getAccountingReport: getAccountingReportMock,
      getCompanyProfile: getCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => (
    <a href={to} data-params={JSON.stringify(params)} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 1n,
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
    totalStock: 12n,
    barcode: "",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function page(items: PartView[], total = items.length): PartPage {
  return { items, total: BigInt(total), offset: 0n, limit: 20n };
}

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function csvRow(overrides: Partial<InventoryCsvRow> = {}): InventoryCsvRow {
  return {
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
    barcode: "",
    quantity: 12n,
    ...overrides,
  };
}

function importResult(
  overrides: Partial<InventoryImportResult> = {},
): InventoryImportResult {
  return {
    created: 1n,
    updated: 1n,
    failed: 1n,
    rows: [
      {
        id: 1n,
        sku: "REP-0001",
        status: ImportRowStatus.created,
        rowNumber: 1n,
      },
      {
        id: 2n,
        sku: "REP-0002",
        status: ImportRowStatus.updated,
        rowNumber: 2n,
      },
      {
        sku: "REP-0003",
        status: ImportRowStatus.error,
        error: "SKU duplicado",
        rowNumber: 3n,
      },
    ],
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
    units: 9n,
    costValue: 108000n,
    saleValue: 225000n,
    margin: 117000n,
    marginBps: 5200n,
    ...overrides,
  };
}

function valuationTotals(
  overrides: Partial<InventoryValuationTotals> = {},
): InventoryValuationTotals {
  return {
    totalCostValue: 108000n,
    totalSaleValue: 225000n,
    totalMargin: 117000n,
    marginBps: 5200n,
    partCount: 1n,
    totalUnits: 9n,
    ...overrides,
  };
}

function valuation(
  overrides: Partial<InventoryValuation> = {},
): InventoryValuation {
  return {
    rows: [valuationRow()],
    totals: valuationTotals(),
    byCategory: [
      {
        category: "Frenos",
        partCount: 1n,
        units: 9n,
        costValue: 108000n,
        saleValue: 225000n,
        margin: 117000n,
        marginBps: 5200n,
      },
    ],
    ...overrides,
  };
}

function accountingReport(): AccountingReport {
  return {
    summary: {
      expenseCount: 0n,
      invoiceCount: 0n,
      totalIncome: 0n,
      totalExpenses: 0n,
      profit: 0n,
      totalCommissions: 0n,
      netProfit: 0n,
    },
    entries: [],
    byExpenseCategory: [],
    byPaymentMethod: [],
    profit: {
      parts: {
        cost: 0n,
        income: 0n,
        commission: 0n,
        margin: 0n,
        marginBps: 0n,
      },
      services: {
        cost: 0n,
        income: 0n,
        commission: 0n,
        margin: 0n,
        marginBps: 0n,
      },
      total: {
        cost: 0n,
        income: 0n,
        commission: 0n,
        margin: 0n,
        marginBps: 0n,
      },
      totalCommission: 0n,
      netProfit: 0n,
      serviceLines: [],
    },
  };
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
    updatedAt: 1_700_000_000_000_000_000n,
  };
}

/**
 * jsdom's `File` does not implement `Blob.text()`, which `CsvTransfer` awaits.
 * Attach the reader so the component's own parse path runs unchanged.
 */
function csvFile(contents: string, name = "inventario.csv"): File {
  const file = new File([contents], name, { type: "text/csv" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(contents),
  });
  return file;
}

describe("InventoryPage", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    listPartsDirMock.mockReset();
    listPartFacetsMock.mockReset();
    exportInventoryCsvMock.mockReset();
    importInventoryCsvMock.mockReset();
    zeroInventoryMock.mockReset();
    getInventoryValuationMock.mockReset();
    getAccountingReportMock.mockReset();
    getCompanyProfileMock.mockReset();
    navigateMock.mockReset();
    useRoleMock.mockReturnValue(roleState(true));
    getInventoryValuationMock.mockResolvedValue(valuation());
    getAccountingReportMock.mockResolvedValue(accountingReport());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    listPartFacetsMock.mockResolvedValue({
      categories: ["Frenos"],
      brands: ["Brembo"],
    });
  });

  it("lists parts with sale price and stock", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);

    expect(await screen.findByText("REP-0001")).toBeInTheDocument();
    expect(screen.getByText("Balata de freno")).toBeInTheDocument();
    expect(screen.getByText("$ 250")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("flags a part below its low-stock threshold", async () => {
    listPartsDirMock.mockResolvedValue(
      page([part({ totalStock: 2n, lowStock: true })]),
    );
    renderWithProviders(<InventoryPage />);

    expect(
      await screen.findByTestId("inventory.low_stock_badge"),
    ).toBeInTheDocument();
  });

  it("shows the cost price column to an administrator", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);

    await screen.findByText("REP-0001");
    expect(screen.getByText("P. costo")).toBeInTheDocument();
    expect(screen.getByText("$ 120")).toBeInTheDocument();
  });

  it("hides the cost price column from a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);

    await screen.findByText("REP-0001");
    expect(screen.queryByText("P. costo")).not.toBeInTheDocument();
    expect(screen.queryByText("$ 120")).not.toBeInTheDocument();
    // The sale price remains visible to a mechanic.
    expect(screen.getByText("$ 250")).toBeInTheDocument();
  });

  it("renders an empty state when no parts exist", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);

    expect(
      await screen.findByTestId("inventory.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay repuestos registrados"),
    ).toBeInTheDocument();
  });

  it("passes the low-stock filter through to the backend", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);

    await waitFor(() => expect(listPartsDirMock).toHaveBeenCalled());
    // The page forwards the resolved filter, sort, direction and page window to
    // the backend, which owns the filtering and ordering.
    expect(listPartsDirMock).toHaveBeenCalledWith(
      {},
      PartSort.sku,
      false,
      0n,
      50n,
    );
  });

  it("renders an error state when the inventory fails to load", async () => {
    listPartsDirMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InventoryPage />);

    expect(
      await screen.findByTestId("inventory.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar el inventario."),
    ).toBeInTheDocument();
  });

  it("requests the next page when the pagination control is used", async () => {
    listPartsDirMock.mockResolvedValue(page([part()], 120));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("inventory.pagination_next"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    const call = navigateMock.mock.calls.at(-1)?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(call.search({})).toMatchObject({ pagina: 2 });
  });

  it("sorts by name through the backend when the header is clicked", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.sort.name"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    const call = navigateMock.mock.calls.at(-1)?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(call.search({})).toMatchObject({
      orden: PartSort.name,
      dir: "asc",
      pagina: 1,
    });
  });

  it("exports the full inventory from the backend as an Excel download", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    exportInventoryCsvMock.mockResolvedValue([csvRow()]);
    // jsdom does not implement the object-URL API the download path uses.
    const createObjectURL = vi.fn(() => "blob:inventario");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<InventoryPage />);
      await screen.findByText("REP-0001");

      await userEvent.click(screen.getByTestId("inventory.csv.export_button"));

      await waitFor(() =>
        expect(exportInventoryCsvMock).toHaveBeenCalledTimes(1),
      );
      // The export fetches the complete inventory, not just the loaded page.
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:inventario");
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("writes each part's current stock into the exported existencia column", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    // The backend export row carries the part's current stock in `quantity`.
    exportInventoryCsvMock.mockResolvedValue([
      csvRow({ sku: "REP-0001", quantity: 12n }),
      csvRow({ sku: "REP-0002", quantity: 0n }),
    ]);
    const createObjectURL = vi.fn((_blob: Blob) => "blob:inventario");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<InventoryPage />);
      await screen.findByText("REP-0001");

      await userEvent.click(screen.getByTestId("inventory.csv.export_button"));
      await waitFor(() =>
        expect(exportInventoryCsvMock).toHaveBeenCalledTimes(1),
      );
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

      const blob = createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toContain("existencia");
      // The exported `existencia` cell is the backend row's quantity, so an
      // export/re-import round-trip preserves stock instead of zeroing it.
      const existencia = sheet.headers.indexOf("existencia");
      expect(sheet.rows[0][0]).toBe("REP-0001");
      expect(sheet.rows[0][existencia]).toBe(12);
      expect(sheet.rows[1][existencia]).toBe(0);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("refreshes the inventory valuation after a successful import", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    const { queryClient } = renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    // Seed the valuation cache so the invalidation is observable.
    queryClient.setQueryData(["inventory-valuation"], { rows: [] });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0100,Filtro de aire,Motor,Mann,pza,30000,15000,4,2",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    // Imported stock changes the on-hand snapshot, so the valuation report must
    // refetch instead of serving its cached totals.
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["inventory-valuation"],
      }),
    );
  });

  it("reloads the valuation report with the new totals after an import", async () => {
    // The accepted journey: importing stock changes the on-hand snapshot, so the
    // valuation report must refetch and show the new totals rather than the
    // cached ones. Both pages share one QueryClient, exactly as they do in the
    // running app, so the invalidation the import triggers is observable as a
    // real refetch on the accounting page.
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    // The first read is the stale snapshot; the refetch after the import returns
    // the totals that reflect the imported stock.
    getInventoryValuationMock
      .mockResolvedValueOnce(
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
      )
      .mockResolvedValue(valuation());

    const { queryClient } = renderWithProviders(
      <>
        <InventoryPage />
        <AccountingPage />
      </>,
    );

    // The stale valuation renders first: no valued parts.
    await screen.findByTestId("accounting.valuation.empty_state");
    expect(getInventoryValuationMock).toHaveBeenCalledTimes(1);

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0001,Balata de freno,Frenos,Brembo,pza,25000,12000,9,5",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );

    // The valuation refetches and the report now shows the imported stock.
    await waitFor(() =>
      expect(getInventoryValuationMock).toHaveBeenCalledTimes(2),
    );
    const row = await screen.findByTestId("accounting.valuation.row.1");
    expect(row).toHaveTextContent("REP-0001");
    expect(row).toHaveTextContent("9");
    // 9 units × 12000 cost price and × 25000 sale price.
    expect(row).toHaveTextContent("$ 1.080");
    expect(row).toHaveTextContent("$ 2.250");

    const cost = screen.getByTestId("accounting.valuation.kpi.cost_value");
    expect(within(cost).getByText("$ 1.080")).toBeInTheDocument();
    const sale = screen.getByTestId("accounting.valuation.kpi.sale_value");
    expect(within(sale).getByText("$ 2.250")).toBeInTheDocument();

    // The refetched data is what the shared cache now holds.
    expect(
      queryClient.getQueryData<InventoryValuation>(["inventory-valuation"])
        ?.totals.totalCostValue,
    ).toBe(108000n);
  });

  it("shows the file's existencia quantity in the import preview", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0100,Filtro de aire,Motor,Mann,pza,30000,15000,7,2",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("inventory.import_dialog");
    // The preview shows the quantity that will be imported, before confirming.
    const row = within(dialog).getByTestId("inventory.import_row.1");
    expect(row).toHaveTextContent("REP-0100");
    expect(row).toHaveTextContent("7");
    expect(row).toHaveTextContent("2");
  });

  it("previews parsed import rows and flags those without a SKU", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0100,Filtro de aire,Motor,Mann,pza,30000,15000,4,2",
      ",Sin SKU,Frenos,,pza,1000,500,1,0",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("inventory.import_dialog");
    expect(within(dialog).getByText("1 listas")).toBeInTheDocument();
    expect(within(dialog).getByText("1 sin SKU")).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("inventory.import_row.1"),
    ).toHaveTextContent("REP-0100");
    expect(
      within(dialog).getByTestId("inventory.import_row.2"),
    ).toHaveTextContent("Falta SKU");
  });

  it("imports only rows with a SKU and shows the per-row result", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0100,Filtro de aire,Motor,Mann,pza,30000,15000,4,2",
      ",Sin SKU,Frenos,,pza,1000,500,1,0",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      sku: string;
      salePrice: bigint;
      lowStockThreshold: bigint;
      quantity: bigint;
    }>;
    // The row without a SKU is dropped before the backend call.
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      sku: "REP-0100",
      salePrice: 3000000n,
      lowStockThreshold: 2n,
      // The `existencia` cell becomes the row's stock quantity.
      quantity: 4n,
    });

    const summary = await screen.findByTestId("inventory.import_summary");
    expect(summary).toHaveTextContent("1 creados");
    expect(summary).toHaveTextContent("1 actualizados");
    expect(summary).toHaveTextContent("1 con error");
    expect(screen.getByTestId("inventory.import_row.3")).toHaveTextContent(
      "SKU duplicado",
    );
  });

  it("reports a failed import without closing the dialog", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0100,Filtro de aire,Motor,Mann,pza,30000,15000,4,2",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    expect(
      await screen.findByTestId("inventory.import_error"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("inventory.import_dialog")).toBeInTheDocument();
  });

  // --- Characterization: the CSV import mapping the stock work must keep ----
  //
  // The accepted change makes the import carry the file's quantity into stock.
  // These tests pin the rest of the parsed-row mapping that the same function
  // produces, so adding a quantity field cannot silently drop or corrupt the
  // catalog fields the backend already consumes.

  it("maps every catalog column of an imported row onto the backend payload", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0200,Filtro de aire,Motor,Mann,pza,30000,15000,4,2",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      rowNumber: bigint;
      sku: string;
      name: string;
      category: string;
      brand: string;
      unit: string;
      salePrice: bigint;
      costPrice: bigint;
      lowStockThreshold: bigint;
    }>;
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      rowNumber: 1n,
      sku: "REP-0200",
      name: "Filtro de aire",
      category: "Motor",
      brand: "Mann",
      unit: "pza",
      salePrice: 3000000n,
      costPrice: 1500000n,
      lowStockThreshold: 2n,
    });
  });

  it("parses locale-formatted amounts and coerces invalid ones to zero", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    // `"1.234,56"` is the Colombian decimal form, quoted so the comma stays in
    // one cell; a negative cost is invalid and must not become a negative money
    // value.
    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      'REP-0300,Kit de arrastre,Transmisión,,pza,"1.234,56",-5,0',
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      salePrice: bigint;
      costPrice: bigint;
    }>;
    expect(payload[0].salePrice).toBe(123456n);
    expect(payload[0].costPrice).toBe(0n);
  });

  it("forwards a row with a SKU but no name so the backend can reject it", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    // The frontend drops only rows without a SKU. A row with a SKU but an empty
    // name must still reach the backend, which owns the "name is required"
    // rejection and reports it per row.
    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0400,,Frenos,,pza,1000,500,1,0",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      sku: string;
      name: string;
    }>;
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ sku: "REP-0400", name: "" });
  });

  // --- Characterization: the export/import round-trip the stock work must keep
  //
  // The accepted change makes the import carry the file's `existencia` into
  // stock and the export write the current stock back out. These tests pin the
  // shared header contract and the rest of the exported row, so the round-trip
  // stays lossless for every catalog column the backend already consumes.

  // --- Characterization: the shared inventory header contract --------------
  //
  // The accepted change turns the export into a real Excel workbook and adds
  // .xlsx to the import. The nine Spanish column names and their order are the
  // contract both sides share, so they must survive the format change.

  it("keeps the shared inventory headers in the documented order", () => {
    expect(INVENTORY_CSV_HEADERS).toEqual([
      "sku",
      "nombre",
      "categoria",
      "marca",
      "unidad",
      "precio_venta",
      "precio_costo",
      "existencia",
      "umbral",
    ]);
  });

  it("exports the shared inventory headers in the documented column order", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    exportInventoryCsvMock.mockResolvedValue([csvRow()]);
    const createObjectURL = vi.fn((_blob: Blob) => "blob:inventario");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<InventoryPage />);
      await screen.findByText("REP-0001");

      await userEvent.click(screen.getByTestId("inventory.csv.export_button"));
      await waitFor(() =>
        expect(exportInventoryCsvMock).toHaveBeenCalledTimes(1),
      );
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

      const blob = createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      // The export header is the same contract the import parser reads, so a
      // re-import maps every column back to the field it came from.
      expect(sheet.headers).toEqual([
        "sku",
        "nombre",
        "categoria",
        "marca",
        "unidad",
        "precio_venta",
        "precio_costo",
        "existencia",
        "umbral",
      ]);
      const cells = sheet.rows[0];
      expect(cells[0]).toBe("REP-0001");
      expect(cells[1]).toBe("Balata de freno");
      expect(cells[2]).toBe("Frenos");
      expect(cells[3]).toBe("Brembo");
      expect(cells[4]).toBe("pza");
      // Money is exported as decimal amounts, not raw cents.
      expect(cells[5]).toBe(250);
      expect(cells[6]).toBe(120);
      expect(cells[8]).toBe(5);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("downloads the inventory workbook as inventario.xlsx with the Excel MIME type", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    exportInventoryCsvMock.mockResolvedValue([csvRow()]);
    const createObjectURL = vi.fn((_blob: Blob) => "blob:inventario");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    // Capture the anchor's `download` attribute at click time: the accepted
    // change is that the export is a real `.xlsx` file, not a `.csv`.
    let downloadName: string | undefined;
    let blobType: string | undefined;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });

    try {
      renderWithProviders(<InventoryPage />);
      await screen.findByText("REP-0001");

      await userEvent.click(screen.getByTestId("inventory.csv.export_button"));
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

      blobType = createObjectURL.mock.calls[0][0].type;
      expect(downloadName).toBe("inventario.xlsx");
      expect(blobType).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("accepts both .xlsx and .csv files in the import control", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    // The accepted change adds `.xlsx` to the import while keeping `.csv` for
    // compatibility, so both extensions must remain selectable.
    const input = screen.getByTestId("inventory.csv.file_input");
    const accept = input.getAttribute("accept") ?? "";
    expect(accept).toContain(".xlsx");
    expect(accept).toContain(".csv");
  });

  it("round-trips an exported row back through the import parser unchanged", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    // The exact line the export produces for a part with stock 9, fed straight
    // back into the import path.
    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0500,Kit de arrastre,Transmisión,DID,pza,1234.56,500.00,9,3",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      sku: string;
      name: string;
      category: string;
      brand: string;
      unit: string;
      salePrice: bigint;
      costPrice: bigint;
      quantity: bigint;
      lowStockThreshold: bigint;
    }>;
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      sku: "REP-0500",
      name: "Kit de arrastre",
      category: "Transmisión",
      brand: "DID",
      unit: "pza",
      salePrice: 123456n,
      costPrice: 50000n,
      quantity: 9n,
      lowStockThreshold: 3n,
    });
  });

  it("defaults a blank or invalid existencia cell to zero stock", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0600,Sin existencia,Frenos,,pza,1000,500,,0",
      "REP-0601,Existencia inválida,Frenos,,pza,1000,500,-3,0",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      sku: string;
      quantity: bigint;
    }>;
    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({ sku: "REP-0600", quantity: 0n });
    expect(payload[1]).toMatchObject({ sku: "REP-0601", quantity: 0n });
  });

  it("keeps the import dialog open with the preview when the import fails", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const csv = [
      "sku,nombre,categoria,marca,unidad,precio_venta,precio_costo,existencia,umbral",
      "REP-0700,Filtro de aire,Motor,Mann,pza,30000,15000,4,2",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    expect(
      await screen.findByTestId("inventory.import_error"),
    ).toBeInTheDocument();
    // The parsed preview survives the failure so the user can retry without
    // re-selecting the file.
    const dialog = screen.getByTestId("inventory.import_dialog");
    expect(
      within(dialog).getByTestId("inventory.import_row.1"),
    ).toHaveTextContent("REP-0700");
    expect(
      screen.getByTestId("inventory.import_confirm_button"),
    ).toBeInTheDocument();
  });

  // --- Accepted behavior: importing a real Excel workbook ------------------
  //
  // The accepted change adds `.xlsx` to the import alongside `.csv`. These
  // tests pin the observable contract: the first sheet's first row is the
  // header, the preview and per-row result behave as with CSV, and a corrupt
  // or empty workbook shows a Spanish error without opening the dialog.

  it("previews rows read from the first sheet of an .xlsx file", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const file = await xlsxFile(
      [
        "sku",
        "nombre",
        "categoria",
        "marca",
        "unidad",
        "precio_venta",
        "precio_costo",
        "existencia",
        "umbral",
      ],
      [
        [
          "REP-0100",
          "Filtro de aire",
          "Motor",
          "Mann",
          "pza",
          30000,
          15000,
          4,
          2,
        ],
      ],
    );
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      file,
    );

    const dialog = await screen.findByTestId("inventory.import_dialog");
    const row = within(dialog).getByTestId("inventory.import_row.1");
    expect(row).toHaveTextContent("REP-0100");
    expect(row).toHaveTextContent("Filtro de aire");
    expect(row).toHaveTextContent("4");
    expect(row).toHaveTextContent("2");
  });

  it("imports an .xlsx row with its typed numeric cells", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const file = await xlsxFile(
      [
        "sku",
        "nombre",
        "categoria",
        "marca",
        "unidad",
        "precio_venta",
        "precio_costo",
        "existencia",
        "umbral",
      ],
      [
        [
          "REP-0100",
          "Filtro de aire",
          "Motor",
          "Mann",
          "pza",
          30000,
          15000,
          4,
          2,
        ],
      ],
    );
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      file,
    );

    await screen.findByTestId("inventory.import_dialog");
    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );

    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      sku: string;
      salePrice: bigint;
      costPrice: bigint;
      quantity: bigint;
      lowStockThreshold: bigint;
    }>;
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      sku: "REP-0100",
      salePrice: 3000000n,
      costPrice: 1500000n,
      quantity: 4n,
      lowStockThreshold: 2n,
    });
  });

  it("flags an .xlsx row without a SKU and does not send it to the backend", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    importInventoryCsvMock.mockResolvedValue(importResult());
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    const file = await xlsxFile(
      [
        "sku",
        "nombre",
        "categoria",
        "marca",
        "unidad",
        "precio_venta",
        "precio_costo",
        "existencia",
        "umbral",
      ],
      [
        [
          "REP-0100",
          "Filtro de aire",
          "Motor",
          "Mann",
          "pza",
          30000,
          15000,
          4,
          2,
        ],
        ["", "Sin SKU", "Frenos", "", "pza", 1000, 500, 1, 0],
      ],
    );
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      file,
    );

    const dialog = await screen.findByTestId("inventory.import_dialog");
    expect(within(dialog).getByText("1 listas")).toBeInTheDocument();
    expect(within(dialog).getByText("1 sin SKU")).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("inventory.import_row.2"),
    ).toHaveTextContent("Falta SKU");

    await userEvent.click(
      screen.getByTestId("inventory.import_confirm_button"),
    );
    await waitFor(() =>
      expect(importInventoryCsvMock).toHaveBeenCalledTimes(1),
    );
    const payload = importInventoryCsvMock.mock.calls[0][0] as Array<{
      sku: string;
    }>;
    expect(payload).toHaveLength(1);
    expect(payload[0].sku).toBe("REP-0100");
  });

  it("shows a Spanish error and does not open the dialog for a corrupt .xlsx", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      corruptXlsxFile(),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido.",
      ),
    );
    expect(
      screen.queryByTestId("inventory.import_dialog"),
    ).not.toBeInTheDocument();
  });

  it("shows a Spanish error and does not open the dialog for an empty .xlsx", async () => {
    listPartsDirMock.mockResolvedValue(page([]));
    renderWithProviders(<InventoryPage />);
    await screen.findByTestId("inventory.empty_state");

    // A valid workbook with only a header row has no importable data.
    const file = await xlsxFile(["sku", "nombre"], []);
    await userEvent.upload(
      screen.getByTestId("inventory.csv.file_input"),
      file,
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "El archivo no contiene filas con encabezados reconocibles.",
      ),
    );
    expect(
      screen.queryByTestId("inventory.import_dialog"),
    ).not.toBeInTheDocument();
  });

  // --- Accepted behavior: putting the inventory in zeros -------------------
  //
  // The accepted change adds an admin-only header button that zeroes every
  // part's stock behind a confirmation dialog. These tests pin the observable
  // contract: who sees the button, what the dialog warns, that confirming calls
  // the backend and reports the affected count, that cancelling does not call
  // it, and that a failure keeps the dialog open with an error.

  it("shows the zero-inventory button to an administrator", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    expect(screen.getByTestId("inventory.zero_button")).toBeInTheDocument();
  });

  it("hides the zero-inventory button from a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    expect(
      screen.queryByTestId("inventory.zero_button"),
    ).not.toBeInTheDocument();
  });

  it("warns that the action is irreversible before confirming", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));

    const dialog = await screen.findByTestId("inventory.zero_dialog");
    expect(dialog).toHaveTextContent("Poner inventario en ceros");
    expect(dialog).toHaveTextContent("No se puede deshacer");
    // Opening the dialog must not call the backend on its own.
    expect(zeroInventoryMock).not.toHaveBeenCalled();
  });

  it("calls the backend and reports the affected count on confirm", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    zeroInventoryMock.mockResolvedValue({ affected: 3n });
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_confirm_button"));

    await waitFor(() => expect(zeroInventoryMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Se pusieron en ceros 3 repuestos.",
      ),
    );
    // A successful run closes the dialog.
    await waitFor(() =>
      expect(
        screen.queryByTestId("inventory.zero_dialog"),
      ).not.toBeInTheDocument(),
    );
  });

  it("uses the singular message when exactly one part was affected", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    zeroInventoryMock.mockResolvedValue({ affected: 1n });
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_confirm_button"));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Se puso en ceros 1 repuesto.",
      ),
    );
  });

  it("refreshes the inventory, low-stock and valuation views after zeroing", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    zeroInventoryMock.mockResolvedValue({ affected: 1n });
    const { queryClient } = renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    // Seed the caches the zeroing must invalidate so the refetch is observable.
    queryClient.setQueryData(["parts"], { pages: [], pageParams: [] });
    queryClient.setQueryData(["part"], {});
    queryClient.setQueryData(["low-stock"], []);
    queryClient.setQueryData(["dashboard-summary"], {});
    queryClient.setQueryData(["inventory-valuation"], { rows: [] });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_confirm_button"));

    await waitFor(() => expect(zeroInventoryMock).toHaveBeenCalledTimes(1));
    for (const queryKey of [
      ["parts"],
      ["part"],
      ["low-stock"],
      ["dashboard-summary"],
      ["inventory-valuation"],
    ]) {
      await waitFor(() =>
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey }),
      );
    }
  });

  it("closes the dialog without calling the backend when cancelled", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_cancel_button"));

    await waitFor(() =>
      expect(
        screen.queryByTestId("inventory.zero_dialog"),
      ).not.toBeInTheDocument(),
    );
    expect(zeroInventoryMock).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows an error when the call fails", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    zeroInventoryMock.mockRejectedValue(new Error("notAuthorized"));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_confirm_button"));

    expect(
      await screen.findByTestId("inventory.zero_error"),
    ).toBeInTheDocument();
    // The dialog stays open so the user can retry or cancel.
    expect(screen.getByTestId("inventory.zero_dialog")).toBeInTheDocument();
    expect(
      screen.getByTestId("inventory.zero_confirm_button"),
    ).toBeInTheDocument();
  });

  it("leaves a persistent, dismissible report of the affected count on the page", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    zeroInventoryMock.mockResolvedValue({ affected: 4n });
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_confirm_button"));

    // The report outlives the toast: it stays on the page after the dialog
    // closes, so the user can still read how many parts were affected.
    const banner = await screen.findByTestId("inventory.zero_success");
    expect(banner).toHaveTextContent("Se pusieron en ceros 4 repuestos.");
    expect(banner).toHaveAttribute("aria-live", "polite");

    await userEvent.click(
      screen.getByTestId("inventory.zero_success_close_button"),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("inventory.zero_success"),
      ).not.toBeInTheDocument(),
    );
  });

  it("uses the singular report when exactly one part was affected", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    zeroInventoryMock.mockResolvedValue({ affected: 1n });
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_confirm_button"));

    const banner = await screen.findByTestId("inventory.zero_success");
    expect(banner).toHaveTextContent("Se puso en ceros 1 repuesto.");
  });

  it("does not report a zeroing when the call fails", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    zeroInventoryMock.mockRejectedValue(new Error("notAuthorized"));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.zero_button"));
    await screen.findByTestId("inventory.zero_dialog");
    await userEvent.click(screen.getByTestId("inventory.zero_confirm_button"));

    await screen.findByTestId("inventory.zero_error");
    // A failed call must not claim any part was zeroed.
    expect(
      screen.queryByTestId("inventory.zero_success"),
    ).not.toBeInTheDocument();
  });

  // --- Characterization: the full inventory list ----------------------------
  //
  // The accepted change shows the whole inventory instead of truncating it to
  // one page. This test protects the adjacent behavior: every part the backend
  // returns is rendered, so the list is not silently dropping rows.

  it("renders every part the backend returns in the list", async () => {
    listPartsDirMock.mockResolvedValue(
      page([
        part({ id: 1n, sku: "REP-0001", name: "Balata de freno" }),
        part({ id: 2n, sku: "REP-0002", name: "Filtro de aceite" }),
        part({ id: 3n, sku: "REP-0003", name: "Bujía" }),
      ]),
    );
    renderWithProviders(<InventoryPage />);

    expect(await screen.findByText("REP-0001")).toBeInTheDocument();
    expect(screen.getByText("REP-0002")).toBeInTheDocument();
    expect(screen.getByText("REP-0003")).toBeInTheDocument();
  });
});
