import type {
  BulkResult,
  Customer,
  CustomerExportRow,
  CustomerListItem,
  CustomerPage,
  Motorcycle,
} from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { readXlsxBlob, renderWithProviders, xlsxFile } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted Excel import/export of the customer directory.
 *
 * The accepted change replaces the CSV-only transfer with a real `.xlsx`
 * workbook: "Exportar" downloads the complete directory (not just the rows
 * matching the current search) with the shared headers and a motorcycle
 * summary, and "Importar" reads a workbook into a per-row preview that flags
 * creations, updates and invalid rows before the backend call, then shows the
 * creados/actualizados/con error summary. These tests pin that observable
 * behavior; they never assert the exact workbook styling.
 *
 * The listing itself is paginated (`listCustomersPageDir`), the export reads the
 * whole directory in one aggregated call (`exportCustomersAggregated`), and the
 * import still matches rows against the full directory (`listCustomers`).
 */

const listCustomersPageDirMock = vi.fn();
const listCustomersMock = vi.fn();
const exportCustomersAggregatedMock = vi.fn();
const bulkCreateCustomersMock = vi.fn();
const bulkUpdateCustomersMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomersPageDir: listCustomersPageDirMock,
      listCustomers: listCustomersMock,
      exportCustomersAggregated: exportCustomersAggregatedMock,
      bulkCreateCustomers: bulkCreateCustomersMock,
      bulkUpdateCustomers: bulkUpdateCustomersMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

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

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+52 555 0100",
    email: "ada@example.com",
    document: "LOAA1815",
    address: "Calle 1 #2-3",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function listItem(overrides: Partial<CustomerListItem> = {}): CustomerListItem {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+52 555 0100",
    email: "ada@example.com",
    document: "LOAA1815",
    motorcycleCount: 0n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function page(items: CustomerListItem[], total = items.length): CustomerPage {
  return { items, total: BigInt(total), offset: 0n, limit: 50n };
}

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 7n,
    customerId: 1n,
    brand: "Yamaha",
    model: "FZ 2.0",
    plate: "ABC12D",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function exportRow(
  customerRecord: Customer,
  motorcycles: Motorcycle[],
): CustomerExportRow {
  return { customer: customerRecord, motorcycles };
}

function bulkResult(overrides: Partial<BulkResult> = {}): BulkResult {
  return {
    created: 0n,
    updated: 0n,
    failed: 0n,
    skipped: 0n,
    rows: [],
    ...overrides,
  };
}

/** Captures the blob handed to `URL.createObjectURL` and the anchor download. */
function captureDownload() {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:xlsx");
  const revokeObjectURL = vi.fn();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  let downloadName: string | undefined;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });
  return {
    createObjectURL,
    revokeObjectURL,
    clickSpy,
    getDownloadName: () => downloadName,
    restore: () => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    },
  };
}

/** Uploads a workbook through the hidden file input the page wires up. */
async function uploadWorkbook(file: File) {
  const input = screen.getByTestId(
    "customers.import_file_input",
  ) as HTMLInputElement;
  await userEvent.upload(input, file);
}

describe("CustomersPage Excel export", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    listCustomersMock.mockReset();
    exportCustomersAggregatedMock.mockReset();
    bulkCreateCustomersMock.mockReset();
    bulkUpdateCustomersMock.mockReset();
    listCustomersPageDirMock.mockResolvedValue(page([listItem()]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads the complete directory as an .xlsx with the shared headers", async () => {
    // The visible list is filtered, but the export must fetch the full
    // directory so the workbook never silently omits clients.
    exportCustomersAggregatedMock.mockResolvedValue([
      exportRow(customer(), [motorcycle()]),
      exportRow(
        customer({ id: 2n, name: "Grace Hopper", phone: "+52 555 0200" }),
        [],
      ),
    ]);

    const capture = captureDownload();
    try {
      renderWithProviders(<CustomersPage />);
      await screen.findByText("Ada Lovelace");

      await userEvent.click(screen.getByTestId("customers.export_button"));

      await waitFor(() => expect(capture.clickSpy).toHaveBeenCalledTimes(1));
      expect(capture.getDownloadName()).toBe("clientes.xlsx");

      const blob = capture.createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toEqual([
        "nombre",
        "telefono",
        "documento",
        "direccion",
        "correo",
        "motos",
      ]);
      // Both customers are exported, and the motorcycle summary is joined.
      expect(sheet.rows).toHaveLength(2);
      expect(sheet.rows[0]).toEqual([
        "Ada Lovelace",
        "+52 555 0100",
        "LOAA1815",
        "Calle 1 #2-3",
        "ada@example.com",
        "Yamaha FZ 2.0 (ABC12D)",
      ]);
      expect(sheet.rows[1][0]).toBe("Grace Hopper");
    } finally {
      capture.restore();
    }
  });
});

describe("CustomersPage Excel import", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    listCustomersMock.mockReset();
    exportCustomersAggregatedMock.mockReset();
    bulkCreateCustomersMock.mockReset();
    bulkUpdateCustomersMock.mockReset();
    listCustomersPageDirMock.mockResolvedValue(page([listItem()]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("previews each row as create, update or invalid before confirming", async () => {
    // Ada already exists (matched by phone+name), so her row is an update;
    // Grace is new; the third row is missing its phone and is rejected.
    listCustomersMock.mockResolvedValue([customer()]);
    const file = await xlsxFile(
      ["nombre", "telefono", "documento", "direccion", "correo", "motos"],
      [
        ["Ada Lovelace", "+52 555 0100", "LOAA1815", "", "", ""],
        ["Grace Hopper", "+52 555 0200", "GRHP1906", "", "", ""],
        ["Sin Telefono", "", "", "", "", ""],
      ],
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await uploadWorkbook(file);

    const dialog = await screen.findByTestId("contacts.import_dialog.customer");
    // The preview lists every parsed row with its action.
    expect(
      within(dialog).getByTestId("contacts.import_row.customer.1"),
    ).toHaveTextContent("Actualizar");
    expect(
      within(dialog).getByTestId("contacts.import_row.customer.2"),
    ).toHaveTextContent("Crear");
    const invalid = within(dialog).getByTestId(
      "contacts.import_row.customer.3",
    );
    expect(invalid).toHaveTextContent("Con error");
    expect(invalid).toHaveTextContent("Falta el teléfono");
    // Only the two valid rows are importable.
    expect(
      within(dialog).getByTestId("contacts.import_confirm_button.customer"),
    ).toHaveTextContent("Importar 2 filas");
  });

  it("sends creations and updates separately and shows the result summary", async () => {
    listCustomersMock.mockResolvedValue([customer()]);
    bulkCreateCustomersMock.mockResolvedValue(
      bulkResult({
        created: 1n,
        rows: [{ index: 0n, ok: true }],
      }),
    );
    bulkUpdateCustomersMock.mockResolvedValue(
      bulkResult({
        updated: 1n,
        rows: [{ index: 0n, ok: true }],
      }),
    );
    const file = await xlsxFile(
      ["nombre", "telefono", "documento", "direccion", "correo", "motos"],
      [
        ["Ada Lovelace", "+52 555 0100", "LOAA1815", "", "", ""],
        ["Grace Hopper", "+52 555 0200", "GRHP1906", "", "", ""],
      ],
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");
    await uploadWorkbook(file);

    const dialog = await screen.findByTestId("contacts.import_dialog.customer");
    await userEvent.click(
      within(dialog).getByTestId("contacts.import_confirm_button.customer"),
    );

    await waitFor(() =>
      expect(bulkCreateCustomersMock).toHaveBeenCalledTimes(1),
    );
    expect(bulkUpdateCustomersMock).toHaveBeenCalledTimes(1);
    // The new customer is created; the matched one is updated by id.
    expect(bulkCreateCustomersMock.mock.calls[0][0]).toEqual([
      expect.objectContaining({ name: "Grace Hopper" }),
    ]);
    expect(bulkUpdateCustomersMock.mock.calls[0][0]).toEqual([
      [1n, expect.objectContaining({ name: "Ada Lovelace" })],
    ]);

    const summary = await screen.findByTestId(
      "contacts.import_summary.customer",
    );
    expect(summary).toHaveTextContent("1 creados");
    expect(summary).toHaveTextContent("1 actualizados");
    expect(summary).toHaveTextContent("0 con error");
  });

  it("reports a failed row in the summary when the backend rejects it", async () => {
    listCustomersMock.mockResolvedValue([]);
    listCustomersPageDirMock.mockResolvedValue(page([]));
    bulkCreateCustomersMock.mockResolvedValue(
      bulkResult({
        created: 1n,
        failed: 1n,
        rows: [
          { index: 0n, ok: true },
          { index: 1n, ok: false, error: "Documento duplicado" },
        ],
      }),
    );
    const file = await xlsxFile(
      ["nombre", "telefono", "documento", "direccion", "correo", "motos"],
      [
        ["Grace Hopper", "+52 555 0200", "GRHP1906", "", "", ""],
        ["Ada Lovelace", "+52 555 0100", "LOAA1815", "", "", ""],
      ],
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByTestId("customers.empty_state");
    await uploadWorkbook(file);

    const dialog = await screen.findByTestId("contacts.import_dialog.customer");
    await userEvent.click(
      within(dialog).getByTestId("contacts.import_confirm_button.customer"),
    );

    const summary = await screen.findByTestId(
      "contacts.import_summary.customer",
    );
    expect(summary).toHaveTextContent("1 creados");
    expect(summary).toHaveTextContent("1 con error");
    // The backend reason is surfaced on the failing row.
    expect(
      within(dialog).getByTestId("contacts.import_row.customer.2"),
    ).toHaveTextContent("Documento duplicado");
  });
});
