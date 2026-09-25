import type {
  InvoiceApplyResult,
  PurchaseInvoice,
  PurchaseInvoiceLine,
  Supplier,
} from "@/lib/types";
import {
  ExtractionStatus,
  InvoiceFileKind,
  LineApplyStatus,
  LineMatchStatus,
  PurchaseInvoiceStatus,
} from "@/lib/types";
import { PurchaseInvoicesPage } from "@/pages/PurchaseInvoicesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: the "Facturas de compra" intake flow.
 *
 * The page uploads a PDF or photo, runs the extraction, lets the user correct
 * the extracted header and lines, and confirms the invoice to update inventory.
 * These tests exercise the real page with a typed local actor mock, so they
 * cover the observable flow: upload-zone validation, the review table's
 * edit/add/delete, the new-vs-existing match badges, supplier selection and
 * creation, the confirm result summary, and the idempotent re-confirm notice.
 *
 * The upload itself goes through the platform object storage, which is mocked
 * here; the backend is a typed local mock, so this suite proves the frontend
 * contract, not the deployed canister.
 */

const listSuppliersMock = vi.fn();
const createSupplierMock = vi.fn();
const createDraftMock = vi.fn();
const runExtractionMock = vi.fn();
const updateReviewMock = vi.fn();
const confirmMock = vi.fn();
const getPurchaseInvoiceMock = vi.fn();
const listPurchaseInvoicesMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listSuppliers: listSuppliersMock,
      createSupplier: createSupplierMock,
      createPurchaseInvoiceDraft: createDraftMock,
      runPurchaseInvoiceExtraction: runExtractionMock,
      updatePurchaseInvoiceReview: updateReviewMock,
      confirmPurchaseInvoice: confirmMock,
      getPurchaseInvoice: getPurchaseInvoiceMock,
      listPurchaseInvoices: listPurchaseInvoicesMock,
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
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

// The upload path builds a platform storage client from `env.json` and talks to
// the storage gateway. Mocking it keeps the test local and deterministic while
// still exercising the page's upload → draft → extraction sequence.
const uploadInvoiceFileMock = vi.fn();
vi.mock("@/components/purchase-invoices/upload-invoice-file", () => ({
  uploadInvoiceFile: (...args: unknown[]) => uploadInvoiceFileMock(...args),
}));

function supplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 1n,
    name: "Repuestos El Motor",
    contactName: "Laura Medina",
    phone: "+57 300 111 2233",
    email: "ventas@elmotor.co",
    taxId: "900123456",
    address: "Calle 45 #12-30",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function line(
  overrides: Partial<PurchaseInvoiceLine> = {},
): PurchaseInvoiceLine {
  return {
    id: 1n,
    lineNumber: 1n,
    code: "REP-0001",
    description: "Balata de freno",
    quantity: 2n,
    unitCost: 12500n,
    taxRate: 0n,
    discountRate: 0n,
    total: 25_000n,
    matchStatus: LineMatchStatus.new,
    matchedPartId: undefined,
    applyStatus: LineApplyStatus.pending,
    applyError: undefined,
    lotId: undefined,
    movementId: undefined,
    ...overrides,
  };
}

function invoice(overrides: Partial<PurchaseInvoice> = {}): PurchaseInvoice {
  return {
    id: 10n,
    status: PurchaseInvoiceStatus.pending,
    extractionStatus: ExtractionStatus.extracted,
    extractionError: undefined,
    supplierId: undefined,
    supplierName: "Repuestos El Motor",
    supplierTaxId: "900123456-7",
    invoiceNumber: "FE-10245",
    invoiceDate: 1_700_000_000_000_000_000n,
    paymentMethod: "Contado",
    paymentMeans: "Efectivo",
    file: {
      objectId: "!caf!sha256:abc",
      fileName: "factura.pdf",
      mimeType: "application/pdf",
      sizeBytes: 12345n,
      kind: InvoiceFileKind.pdf,
      uploadedAt: 1_700_000_000_000_000_000n,
    },
    lines: [line()],
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    confirmedAt: undefined,
    confirmedBy: undefined,
    ...overrides,
  };
}

function applyResult(
  overrides: Partial<InvoiceApplyResult> = {},
): InvoiceApplyResult {
  return {
    invoiceId: 10n,
    status: PurchaseInvoiceStatus.confirmed,
    created: 1n,
    updated: 0n,
    failed: 0n,
    lines: [
      {
        lineId: 1n,
        lineNumber: 1n,
        code: "REP-0001",
        status: LineApplyStatus.created,
        partId: 5n,
        lotId: 6n,
        movementId: 7n,
        error: undefined,
      },
    ],
    ...overrides,
  };
}

/** A `File` with a real `arrayBuffer`, which jsdom's `File` lacks. */
function invoiceFile(
  name: string,
  type: string,
  bytes = new Uint8Array([1, 2, 3, 4]),
): File {
  const file = new File([bytes], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(bytes.buffer),
  });
  return file;
}

/**
 * Drives one file through the upload zone's hidden input.
 *
 * `applyAccept: false` is required because the input carries an `accept`
 * attribute and user-event would otherwise silently drop a file whose MIME
 * type is not listed — which is exactly the rejection path under test.
 */
async function uploadFile(file: File) {
  const input = screen.getByTestId("purchase_invoices.file_input");
  await userEvent.upload(input, file, { applyAccept: false });
}

describe("PurchaseInvoicesPage", () => {
  beforeEach(() => {
    listSuppliersMock.mockReset();
    createSupplierMock.mockReset();
    createDraftMock.mockReset();
    runExtractionMock.mockReset();
    updateReviewMock.mockReset();
    confirmMock.mockReset();
    getPurchaseInvoiceMock.mockReset();
    listPurchaseInvoicesMock.mockReset();
    uploadInvoiceFileMock.mockReset();

    listSuppliersMock.mockResolvedValue([]);
    listPurchaseInvoicesMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 20n,
    });
    // Echo the uploaded file's name and MIME type so the draft carries the
    // real kind (PDF vs image) the page derived from the file. The gateway URL
    // and project id come from `env.json` and must reach the backend so it can
    // download the blob later.
    uploadInvoiceFileMock.mockImplementation((file: File) =>
      Promise.resolve({
        objectId: "!caf!sha256:abc",
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: BigInt(file.size),
        gatewayUrl: "https://gateway.example.test",
        projectId: "project-123",
      }),
    );
    createDraftMock.mockResolvedValue(invoice());
    runExtractionMock.mockResolvedValue(invoice());
    // The extracted supplier has no directory id, so saving or confirming the
    // review creates it first. Default to a resolved supplier so the flow can
    // reach the backend call under test.
    createSupplierMock.mockResolvedValue(supplier({ id: 9n }));
  });

  it("renders the upload zone and the empty state", async () => {
    renderWithProviders(<PurchaseInvoicesPage />);

    expect(
      await screen.findByTestId("purchase_invoices.page"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("purchase_invoices.dropzone"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("purchase_invoices.empty_state"),
    ).toBeInTheDocument();
  });

  it("rejects an unsupported file with a clear Spanish message and uploads nothing", async () => {
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("notas.txt", "text/plain"));

    const error = await screen.findByTestId("purchase_invoices.batch_error");
    expect(error).toHaveTextContent("no es un formato válido");
    expect(error).toHaveTextContent("PDF, JPG, PNG o WEBP");
    expect(uploadInvoiceFileMock).not.toHaveBeenCalled();
    expect(createDraftMock).not.toHaveBeenCalled();
  });

  it("rejects a PDF over the size limit with a clear Spanish message", async () => {
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    const oversized = invoiceFile(
      "factura-grande.pdf",
      "application/pdf",
      new Uint8Array(1_000_001),
    );
    await uploadFile(oversized);

    const error = await screen.findByTestId("purchase_invoices.batch_error");
    expect(error).toHaveTextContent("supera el tamaño máximo de 1 MB");
    expect(uploadInvoiceFileMock).not.toHaveBeenCalled();
  });

  it("uploads a PDF, runs the extraction and opens the review table", async () => {
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));

    // The draft is created with the uploaded file reference and the PDF kind.
    await waitFor(() => expect(createDraftMock).toHaveBeenCalledTimes(1));
    expect(createDraftMock.mock.calls[0][0]).toMatchObject({
      kind: InvoiceFileKind.pdf,
      objectId: "!caf!sha256:abc",
      fileName: "factura.pdf",
      mimeType: "application/pdf",
      // The storage gateway URL and project id from the upload must be
      // forwarded so the backend can download the blob (403 fix).
      gatewayUrl: "https://gateway.example.test",
      projectId: "project-123",
    });
    expect(runExtractionMock).toHaveBeenCalledWith(10n);

    // The review panel opens with the extracted header and line.
    const panel = await screen.findByTestId("purchase_invoices.review_panel");
    expect(
      within(panel).getByTestId("purchase_invoices.line_code_input.1"),
    ).toHaveValue("REP-0001");
    expect(
      within(panel).getByTestId("purchase_invoices.line_quantity_input.1"),
    ).toHaveValue("2");
    expect(
      within(panel).getByTestId("purchase_invoices.line_cost_input.1"),
    ).toHaveValue("125.00");
  });

  it("uploads a photo and runs the extraction with the image kind", async () => {
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("foto.jpg", "image/jpeg"));

    await waitFor(() => expect(createDraftMock).toHaveBeenCalledTimes(1));
    expect(createDraftMock.mock.calls[0][0]).toMatchObject({
      kind: InvoiceFileKind.image,
      fileName: "foto.jpg",
      mimeType: "image/jpeg",
    });
    expect(
      await screen.findByTestId("purchase_invoices.review_panel"),
    ).toBeInTheDocument();
  });

  it("opens the review panel with a clear Spanish notice when the extraction fails", async () => {
    runExtractionMock.mockResolvedValue(
      invoice({
        extractionStatus: ExtractionStatus.failed,
        extractionError: "No se pudieron leer los datos de la factura.",
        lines: [],
      }),
    );
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("ilegible.pdf", "application/pdf"));

    // The failed file stays in the upload queue with its reason and a manual
    // review action, and the review panel opens so the user can continue.
    const uploadList = await screen.findByTestId(
      "purchase_invoices.upload_list",
    );
    const error = await within(uploadList).findByTestId(
      "purchase_invoices.upload_error.1",
    );
    expect(error).toHaveTextContent("No se pudieron leer los datos");
    expect(
      within(uploadList).getByTestId("purchase_invoices.review_button.1"),
    ).toBeInTheDocument();

    // The recovery section explains the failure in Spanish and offers both the
    // retry and the manual-completion actions.
    const recovery = await screen.findByTestId(
      "purchase_invoices.extraction_failed",
    );
    expect(recovery).toHaveTextContent(
      "No se pudieron leer los datos del documento",
    );
    expect(
      within(recovery).getByTestId("purchase_invoices.failed_retry_button"),
    ).toBeInTheDocument();
    expect(
      within(recovery).getByTestId("purchase_invoices.manual_button"),
    ).toBeInTheDocument();

    // The review panel is open with an editable header and an empty line table.
    const panel = await screen.findByTestId("purchase_invoices.review_panel");
    expect(
      within(panel).getByTestId("purchase_invoices.lines_empty_state"),
    ).toHaveTextContent("Añade los ítems manualmente");
    expect(
      within(panel).getByTestId("purchase_invoices.add_line_button"),
    ).toBeInTheDocument();
    expect(
      within(panel).getByTestId("purchase_invoices.extraction_notice"),
    ).toHaveTextContent("No se pudieron leer los datos del documento");
  });

  it("lets the user complete a failed extraction manually and confirm it", async () => {
    runExtractionMock.mockResolvedValue(
      invoice({
        extractionStatus: ExtractionStatus.failed,
        extractionError: "No se pudieron leer los datos de la factura.",
        lines: [],
      }),
    );
    updateReviewMock.mockResolvedValue(invoice());
    confirmMock.mockResolvedValue(applyResult());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("ilegible.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    // The header is editable even though the extraction failed: the supplier
    // name and the invoice number can be typed by hand. The failed extraction
    // still preserves whatever the document did yield, so the number is cleared
    // before the manual value is typed.
    const supplierName = within(panel).getByTestId(
      "purchase_invoices.supplier_name_input",
    );
    await userEvent.clear(supplierName);
    await userEvent.type(supplierName, "Proveedor Manual");
    const number = within(panel).getByTestId(
      "purchase_invoices.invoice_number_input",
    );
    await userEvent.clear(number);
    await userEvent.type(number, "FE-MANUAL");

    // A line is added and filled in by hand.
    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.add_line_button"),
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_code_input.1"),
      "REP-FAIL-MANUAL",
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_description_input.1"),
      "Ítem recuperado a mano",
    );
    await userEvent.clear(
      within(panel).getByTestId("purchase_invoices.line_quantity_input.1"),
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_quantity_input.1"),
      "2",
    );
    await userEvent.clear(
      within(panel).getByTestId("purchase_invoices.line_cost_input.1"),
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_cost_input.1"),
      "7000",
    );

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.confirm_button"),
    );

    // The manually built line and header reach the backend, then the invoice is
    // confirmed and the result summary is shown.
    await waitFor(() => expect(updateReviewMock).toHaveBeenCalledTimes(1));
    expect(updateReviewMock.mock.calls[0][1].header).toMatchObject({
      invoiceNumber: "FE-MANUAL",
    });
    expect(updateReviewMock.mock.calls[0][1].lines[0]).toMatchObject({
      code: "REP-FAIL-MANUAL",
      description: "Ítem recuperado a mano",
      quantity: 2n,
      // 7000 pesos → 700_000 cents.
      unitCost: 700_000n,
    });
    await waitFor(() => expect(confirmMock).toHaveBeenCalledWith(10n));
    expect(
      await screen.findByTestId("purchase_invoices.result_summary"),
    ).toHaveTextContent("Factura confirmada");
  });

  it("keeps the manual-completion button available after a failed retry", async () => {
    runExtractionMock.mockResolvedValue(
      invoice({
        extractionStatus: ExtractionStatus.failed,
        extractionError: "No se pudieron leer los datos de la factura.",
        lines: [],
      }),
    );
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("ilegible.pdf", "application/pdf"));
    const recovery = await screen.findByTestId(
      "purchase_invoices.extraction_failed",
    );

    // Retrying still cannot read the document, so the recovery section and its
    // manual-completion action remain available.
    await userEvent.click(
      within(recovery).getByTestId("purchase_invoices.failed_retry_button"),
    );

    await waitFor(() => expect(runExtractionMock).toHaveBeenCalledTimes(2));
    const afterRetry = await screen.findByTestId(
      "purchase_invoices.extraction_failed",
    );
    expect(
      within(afterRetry).getByTestId("purchase_invoices.manual_button"),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("purchase_invoices.review_panel"),
    ).toBeInTheDocument();
  });

  it("marks each line as new or existing and lets the user edit, add and delete lines", async () => {
    runExtractionMock.mockResolvedValue(
      invoice({
        lines: [
          line({
            id: 1n,
            lineNumber: 1n,
            code: "REP-0001",
            description: "Balata de freno",
            matchStatus: LineMatchStatus.existing,
          }),
          line({
            id: 2n,
            lineNumber: 2n,
            code: "REP-NUEVO",
            description: "Filtro de aire",
            matchStatus: LineMatchStatus.new,
          }),
        ],
      }),
    );
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    // One line updates an existing part, the other creates a new one.
    expect(within(panel).getByText("Actualiza")).toBeInTheDocument();
    expect(within(panel).getByText("Nuevo")).toBeInTheDocument();

    // Editing the quantity is reflected in the input.
    const quantity = within(panel).getByTestId(
      "purchase_invoices.line_quantity_input.1",
    );
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "7");
    expect(quantity).toHaveValue("7");

    // Adding a line appends an empty row.
    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.add_line_button"),
    );
    expect(
      within(panel).getByTestId("purchase_invoices.line_row.3"),
    ).toBeInTheDocument();

    // Deleting the first line removes it and renumbers the rows.
    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.line_delete_button.1"),
    );
    expect(
      within(panel).queryByTestId("purchase_invoices.line_row.3"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByTestId("purchase_invoices.line_code_input.1"),
    ).toHaveValue("REP-NUEVO");
  });

  it("saves the edited review with the corrected quantity and cost", async () => {
    updateReviewMock.mockResolvedValue(invoice());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    const quantity = within(panel).getByTestId(
      "purchase_invoices.line_quantity_input.1",
    );
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "5");
    const cost = within(panel).getByTestId(
      "purchase_invoices.line_cost_input.1",
    );
    await userEvent.clear(cost);
    await userEvent.type(cost, "13000");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.save_review_button"),
    );

    await waitFor(() => expect(updateReviewMock).toHaveBeenCalledTimes(1));
    const [invoiceId, input] = updateReviewMock.mock.calls[0];
    expect(invoiceId).toBe(10n);
    expect(input.lines[0]).toMatchObject({
      code: "REP-0001",
      quantity: 5n,
      // 13000 pesos → 1_300_000 cents.
      unitCost: 1_300_000n,
    });
  });

  it("selects an existing supplier from the directory", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    updateReviewMock.mockResolvedValue(invoice());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.supplier_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Repuestos El Motor" }),
    );

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.save_review_button"),
    );

    await waitFor(() => expect(updateReviewMock).toHaveBeenCalledTimes(1));
    expect(updateReviewMock.mock.calls[0][1].header).toMatchObject({
      supplierId: 1n,
    });
  });

  it("creates a new supplier during the review when the name is typed", async () => {
    createSupplierMock.mockResolvedValue(
      supplier({ id: 9n, name: "Nuevo Proveedor" }),
    );
    updateReviewMock.mockResolvedValue(invoice());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    // The extracted supplier name is not in the directory, so the panel offers
    // the free-text field; typing a new name creates the supplier on save.
    const nameInput = within(panel).getByTestId(
      "purchase_invoices.supplier_name_input",
    );
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Nuevo Proveedor");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.save_review_button"),
    );

    await waitFor(() => expect(createSupplierMock).toHaveBeenCalledTimes(1));
    expect(createSupplierMock.mock.calls[0][0]).toMatchObject({
      name: "Nuevo Proveedor",
    });
    await waitFor(() => expect(updateReviewMock).toHaveBeenCalledTimes(1));
    expect(updateReviewMock.mock.calls[0][1].header).toMatchObject({
      supplierId: 9n,
    });
  });

  it("blocks confirmation with a clear message when a line is incomplete", async () => {
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    const code = within(panel).getByTestId(
      "purchase_invoices.line_code_input.1",
    );
    await userEvent.clear(code);

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.confirm_button"),
    );

    expect(
      await within(panel).findByTestId(
        "purchase_invoices.review_validation_error",
      ),
    ).toHaveTextContent("Revisa la línea 1");
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it("confirms the invoice and shows the per-line result summary", async () => {
    updateReviewMock.mockResolvedValue(invoice());
    confirmMock.mockResolvedValue(applyResult());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.confirm_button"),
    );

    await waitFor(() => expect(confirmMock).toHaveBeenCalledWith(10n));
    const summary = await screen.findByTestId(
      "purchase_invoices.result_summary",
    );
    expect(summary).toHaveTextContent("Factura confirmada");
    expect(summary).toHaveTextContent("1 creado");
    expect(
      within(summary).getByTestId("purchase_invoices.result_row.1"),
    ).toHaveTextContent("Creado");
    // A first confirmation is not the idempotent case.
    expect(
      within(summary).queryByTestId(
        "purchase_invoices.result_idempotent_notice",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows the idempotent notice when the invoice was already confirmed", async () => {
    updateReviewMock.mockResolvedValue(
      invoice({ status: PurchaseInvoiceStatus.confirmed }),
    );
    confirmMock.mockResolvedValue(applyResult());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.confirm_button"),
    );

    const summary = await screen.findByTestId(
      "purchase_invoices.result_summary",
    );
    expect(
      within(summary).getByTestId("purchase_invoices.result_idempotent_notice"),
    ).toHaveTextContent("No se volvió a registrar stock");
  });

  it("reports a line error with its reason in the result summary", async () => {
    updateReviewMock.mockResolvedValue(invoice());
    confirmMock.mockResolvedValue(
      applyResult({
        status: PurchaseInvoiceStatus.withErrors,
        created: 0n,
        failed: 1n,
        lines: [
          {
            lineId: 1n,
            lineNumber: 1n,
            code: "REP-0001",
            status: LineApplyStatus.error,
            partId: undefined,
            lotId: undefined,
            movementId: undefined,
            error: "La cantidad debe ser mayor que cero",
          },
        ],
      }),
    );
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.confirm_button"),
    );

    const summary = await screen.findByTestId(
      "purchase_invoices.result_summary",
    );
    expect(summary).toHaveTextContent("Factura confirmada con errores");
    expect(summary).toHaveTextContent("La cantidad debe ser mayor que cero");
  });

  // --- Characterization: the manual-completion path stays available --------
  //
  // The accepted request lets the user complete an invoice manually when the
  // automatic extraction fails or returns no lines. These tests protect the
  // adjacent behavior that must survive it: a successful extraction with zero
  // lines still opens the review panel with an empty-lines state and an
  // "Añadir línea" action, the header fields are editable and reach the
  // backend on save, and a manually built invoice can be confirmed. They do
  // not assert the failed-extraction recovery UI, which the request changes.

  it("opens the review panel with an empty-lines state when the extraction returns no lines", async () => {
    runExtractionMock.mockResolvedValue(
      invoice({
        extractionStatus: ExtractionStatus.extracted,
        lines: [],
      }),
    );
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));

    // A successful extraction with no lines is not a failure: the review panel
    // opens so the user can add the items by hand.
    const panel = await screen.findByTestId("purchase_invoices.review_panel");
    expect(
      within(panel).getByTestId("purchase_invoices.lines_empty_state"),
    ).toHaveTextContent("Añade los ítems manualmente");
    expect(
      within(panel).getByTestId("purchase_invoices.add_line_button"),
    ).toBeInTheDocument();
    // Zero lines is treated as "nothing could be read", so the clear Spanish
    // notice is shown and the manual-completion action stays available.
    expect(
      within(panel).getByTestId("purchase_invoices.extraction_notice"),
    ).toHaveTextContent("No se pudieron leer los datos del documento");
    const recovery = await screen.findByTestId(
      "purchase_invoices.extraction_failed",
    );
    expect(
      within(recovery).getByTestId("purchase_invoices.manual_button"),
    ).toBeInTheDocument();
  });

  it("saves the edited header fields with the invoice", async () => {
    updateReviewMock.mockResolvedValue(invoice());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    // The extracted header is editable: the number and date are prefilled from
    // the extraction and can be corrected before saving.
    const number = within(panel).getByTestId(
      "purchase_invoices.invoice_number_input",
    );
    expect(number).toHaveValue("FE-10245");
    await userEvent.clear(number);
    await userEvent.type(number, "FE-99999");

    const date = within(panel).getByTestId(
      "purchase_invoices.invoice_date_input",
    );
    expect(date).toHaveValue("2023-11-14");
    await userEvent.clear(date);
    await userEvent.type(date, "2024-01-15");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.save_review_button"),
    );

    await waitFor(() => expect(updateReviewMock).toHaveBeenCalledTimes(1));
    const [invoiceId, input] = updateReviewMock.mock.calls[0];
    expect(invoiceId).toBe(10n);
    expect(input.header).toMatchObject({
      invoiceNumber: "FE-99999",
      // 2024-01-15 at Colombia start of day (UTC-5) in nanoseconds.
      invoiceDate: 1_705_294_800_000_000_000n,
    });
  });

  it("lets the user build an empty invoice manually and confirm it", async () => {
    runExtractionMock.mockResolvedValue(
      invoice({
        extractionStatus: ExtractionStatus.extracted,
        lines: [],
      }),
    );
    updateReviewMock.mockResolvedValue(invoice());
    confirmMock.mockResolvedValue(applyResult());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    // Add a line by hand and fill in the required fields.
    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.add_line_button"),
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_code_input.1"),
      "REP-MANUAL",
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_description_input.1"),
      "Ítem agregado a mano",
    );
    await userEvent.clear(
      within(panel).getByTestId("purchase_invoices.line_quantity_input.1"),
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_quantity_input.1"),
      "3",
    );
    await userEvent.clear(
      within(panel).getByTestId("purchase_invoices.line_cost_input.1"),
    );
    await userEvent.type(
      within(panel).getByTestId("purchase_invoices.line_cost_input.1"),
      "9000",
    );

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.confirm_button"),
    );

    // The manually built line is persisted and then confirmed.
    await waitFor(() => expect(updateReviewMock).toHaveBeenCalledTimes(1));
    expect(updateReviewMock.mock.calls[0][1].lines[0]).toMatchObject({
      code: "REP-MANUAL",
      description: "Ítem agregado a mano",
      quantity: 3n,
      // 9000 pesos → 900_000 cents.
      unitCost: 900_000n,
    });
    await waitFor(() => expect(confirmMock).toHaveBeenCalledWith(10n));
    expect(
      await screen.findByTestId("purchase_invoices.result_summary"),
    ).toHaveTextContent("Factura confirmada");
  });

  it("lists processed invoices with status in the history tab", async () => {
    listPurchaseInvoicesMock.mockResolvedValue({
      items: [
        invoice({
          id: 10n,
          invoiceNumber: "FE-10245",
          supplierName: "Repuestos El Motor",
          status: PurchaseInvoiceStatus.confirmed,
        }),
        invoice({
          id: 11n,
          invoiceNumber: "FE-10246",
          supplierName: "Distribuidora Central",
          status: PurchaseInvoiceStatus.withErrors,
        }),
      ],
      total: 2n,
      offset: 0n,
      limit: 20n,
    });
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await userEvent.click(
      screen.getByTestId("purchase_invoices.tab.historial"),
    );

    expect(await screen.findByText("FE-10245")).toBeInTheDocument();
    expect(screen.getByText("FE-10246")).toBeInTheDocument();
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    expect(screen.getByText("Con errores")).toBeInTheDocument();
    expect(screen.getByText("Repuestos El Motor")).toBeInTheDocument();
  });

  // --- Accepted behavior: a selectable-text PDF preloads the review --------
  //
  // The accepted change makes a selectable-text PDF extract automatically and
  // preload the editable review table with the detected header and lines,
  // without showing the "PDF no legible" notice. These tests exercise the real
  // page with a typed local actor mock: the extraction returns the RALLYE
  // MOTORS invoice, the panel opens preloaded with every detected field, and
  // saving sends the parsed values (including IVA, discount and total) to the
  // backend. The PDF text extraction itself is backend behavior and is not
  // exercised here.

  /** The RALLYE MOTORS invoice the acceptance criteria describe. */
  function rallyeInvoice(): PurchaseInvoice {
    return invoice({
      supplierName: "RALLYE MOTORS SAS",
      supplierTaxId: "901780198-3",
      invoiceNumber: "FMLR20288",
      // 2026-09-21 at Colombia start of day (UTC-5) in nanoseconds.
      invoiceDate: 1_789_966_800_000_000_000n,
      paymentMethod: "Contado Repuestos (POS)",
      paymentMeans: "Efectivo",
      lines: [
        line({
          id: 1n,
          lineNumber: 1n,
          code: "7701023153317/T",
          description: "JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD",
          quantity: 1n,
          unitCost: 8_936_719n,
          taxRate: 19n,
          discountRate: 10n,
          total: 9_571_226n,
        }),
      ],
    });
  }

  it("preloads the extracted header and line without the unreadable-PDF notice", async () => {
    runExtractionMock.mockResolvedValue(rallyeInvoice());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    // The detected header is preloaded into the editable fields.
    expect(
      within(panel).getByTestId("purchase_invoices.supplier_name_input"),
    ).toHaveValue("RALLYE MOTORS SAS");
    expect(
      within(panel).getByTestId("purchase_invoices.supplier_tax_id_input"),
    ).toHaveValue("901780198-3");
    expect(
      within(panel).getByTestId("purchase_invoices.invoice_number_input"),
    ).toHaveValue("FMLR20288");
    expect(
      within(panel).getByTestId("purchase_invoices.invoice_date_input"),
    ).toHaveValue("2026-09-21");
    expect(
      within(panel).getByTestId("purchase_invoices.payment_method_input"),
    ).toHaveValue("Contado Repuestos (POS)");
    expect(
      within(panel).getByTestId("purchase_invoices.payment_means_input"),
    ).toHaveValue("Efectivo");

    // The detected line is preloaded with every field, including IVA,
    // discount and total.
    expect(
      within(panel).getByTestId("purchase_invoices.line_code_input.1"),
    ).toHaveValue("7701023153317/T");
    expect(
      within(panel).getByTestId("purchase_invoices.line_description_input.1"),
    ).toHaveValue("JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD");
    expect(
      within(panel).getByTestId("purchase_invoices.line_quantity_input.1"),
    ).toHaveValue("1");
    expect(
      within(panel).getByTestId("purchase_invoices.line_cost_input.1"),
    ).toHaveValue("89367.19");
    expect(
      within(panel).getByTestId("purchase_invoices.line_tax_rate_input.1"),
    ).toHaveValue("19");
    expect(
      within(panel).getByTestId("purchase_invoices.line_discount_input.1"),
    ).toHaveValue("10");
    expect(
      within(panel).getByTestId("purchase_invoices.line_total_input.1"),
    ).toHaveValue("95712.26");

    // A readable PDF is not the failure path: neither the notice nor the
    // recovery section is shown.
    expect(
      within(panel).queryByTestId("purchase_invoices.extraction_notice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("purchase_invoices.extraction_failed"),
    ).not.toBeInTheDocument();
  });

  it("sends the preloaded IVA, discount and total when saving the review", async () => {
    runExtractionMock.mockResolvedValue(rallyeInvoice());
    updateReviewMock.mockResolvedValue(rallyeInvoice());
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
    const panel = await screen.findByTestId("purchase_invoices.review_panel");

    await userEvent.click(
      within(panel).getByTestId("purchase_invoices.save_review_button"),
    );

    await waitFor(() => expect(updateReviewMock).toHaveBeenCalledTimes(1));
    const [invoiceId, input] = updateReviewMock.mock.calls[0];
    expect(invoiceId).toBe(10n);
    expect(input.header).toMatchObject({
      supplierTaxId: "901780198-3",
      invoiceNumber: "FMLR20288",
      paymentMethod: "Contado Repuestos (POS)",
      paymentMeans: "Efectivo",
    });
    expect(input.lines[0]).toMatchObject({
      code: "7701023153317/T",
      description: "JGO AMORTIGUADOR TRASERO AKT-125/SL/NKD",
      quantity: 1n,
      // 89367.19 pesos → 8_936_719 cents.
      unitCost: 8_936_719n,
      taxRate: 19n,
      discountRate: 10n,
      // 95712.26 pesos → 9_571_226 cents.
      total: 9_571_226n,
    });
  });

  it("opens the manual review with a Spanish notice when the extraction is rejected", async () => {
    // A rejected extraction (canister trap, timeout, network error) must not
    // block the flow: the draft already exists, so the invoice stays reviewable
    // and the user can complete it by hand or upload a photo. The technical
    // message must never reach the user.
    runExtractionMock.mockRejectedValue(
      new Error(
        "IC0503: Canister trapped: CAFFEINE_INFERENCE_API_KEY is not set",
      ),
    );
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("factura.pdf", "application/pdf"));

    // The draft was created before the rejection, so the review panel opens
    // with an editable header and an empty line table.
    const panel = await screen.findByTestId("purchase_invoices.review_panel");
    expect(
      within(panel).getByTestId("purchase_invoices.lines_empty_state"),
    ).toHaveTextContent("Añade los ítems manualmente");
    expect(
      within(panel).getByTestId("purchase_invoices.add_line_button"),
    ).toBeInTheDocument();

    // The notice is a readable Spanish message, never the canister trap or the
    // environment variable name.
    const notice = within(panel).getByTestId(
      "purchase_invoices.extraction_notice",
    );
    expect(notice).toHaveTextContent(
      "No se pudieron leer los datos del documento",
    );
    expect(notice).not.toHaveTextContent("IC0503");
    expect(notice).not.toHaveTextContent("CAFFEINE_INFERENCE_API_KEY");

    // The recovery section keeps the manual-completion action available.
    const recovery = await screen.findByTestId(
      "purchase_invoices.extraction_failed",
    );
    expect(
      within(recovery).getByTestId("purchase_invoices.manual_button"),
    ).toBeInTheDocument();
  });

  it("keeps the unreadable-PDF notice and the manual/photo recovery for a text-less PDF", async () => {
    // A scanned PDF with no text layer: the backend extraction fails with the
    // Spanish "no contiene texto legible" message and no lines.
    runExtractionMock.mockResolvedValue(
      invoice({
        extractionStatus: ExtractionStatus.failed,
        extractionError:
          "El PDF no contiene texto legible, así que no se pudo analizar automáticamente. Completa los datos manualmente o sube una foto de la factura.",
        lines: [],
      }),
    );
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");

    await uploadFile(invoiceFile("escaneo.pdf", "application/pdf"));

    // The notice is shown and the manual-completion action stays available.
    const recovery = await screen.findByTestId(
      "purchase_invoices.extraction_failed",
    );
    expect(recovery).toHaveTextContent("No se pudieron leer los datos");
    expect(
      within(recovery).getByTestId("purchase_invoices.manual_button"),
    ).toBeInTheDocument();

    const panel = await screen.findByTestId("purchase_invoices.review_panel");
    expect(
      within(panel).getByTestId("purchase_invoices.extraction_notice"),
    ).toHaveTextContent("No se pudieron leer los datos del documento");
    // The upload zone still offers the photo path.
    expect(
      screen.getByTestId("purchase_invoices.dropzone"),
    ).toBeInTheDocument();
  });
});
