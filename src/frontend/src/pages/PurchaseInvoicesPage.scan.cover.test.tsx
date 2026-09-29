import type {
  PartView,
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
 * Cover for the compras scan-to-assign journey after the accepted change that
 * unified the barcode lookup into `findPartByCode` (barcode or SKU).
 *
 * The scan lives inside the review dialog: a resolved code fills the selected
 * line's code, description and unit cost with the resolved product, and an
 * unknown code shows the shared scanner's Spanish "producto no encontrado"
 * notice without changing the line.
 *
 * The scanner resolves through `useBackend().actor.findPartByCode`, so the actor
 * is mocked with a stable object (a fresh actor per render would restart the
 * camera and is a harness artifact, not product behavior).
 */

const listSuppliersMock = vi.fn();
const createSupplierMock = vi.fn();
const createDraftMock = vi.fn();
const runExtractionMock = vi.fn();
const updateReviewMock = vi.fn();
const confirmMock = vi.fn();
const getPurchaseInvoiceMock = vi.fn();
const listPurchaseInvoicesMock = vi.fn();
const findPartByCodeMock = vi.fn();

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
      findPartByCode: findPartByCodeMock,
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

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 12n,
    sku: "REP-0012",
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

async function uploadFile(file: File) {
  const input = screen.getByTestId("purchase_invoices.file_input");
  await userEvent.upload(input, file, { applyAccept: false });
}

/** Uploads a PDF and waits for the review panel to open. */
async function openReviewPanel() {
  await uploadFile(invoiceFile("factura.pdf", "application/pdf"));
  return screen.findByTestId("purchase_invoices.review_panel");
}

async function openScannerAndSubmit(code: string) {
  await userEvent.click(
    screen.getByTestId("purchase_invoices.line_scan_button.1"),
  );
  await screen.findByTestId("purchase_invoices.scan_dialog");
  await userEvent.type(
    screen.getByTestId("purchase_invoices.scan.input"),
    code,
  );
  await userEvent.click(
    screen.getByTestId("purchase_invoices.scan.submit_button"),
  );
}

describe("PurchaseInvoicesPage scan-to-assign (cover)", () => {
  beforeEach(() => {
    listSuppliersMock.mockReset();
    createSupplierMock.mockReset();
    createDraftMock.mockReset();
    runExtractionMock.mockReset();
    updateReviewMock.mockReset();
    confirmMock.mockReset();
    getPurchaseInvoiceMock.mockReset();
    listPurchaseInvoicesMock.mockReset();
    findPartByCodeMock.mockReset();
    uploadInvoiceFileMock.mockReset();

    listSuppliersMock.mockResolvedValue([]);
    listPurchaseInvoicesMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 20n,
    });
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
    createSupplierMock.mockResolvedValue(supplier({ id: 9n }));
  });

  it("assigns the resolved part to the selected review line", async () => {
    const scanned = part({
      id: 99n,
      sku: "REP-9999",
      name: "Cadena de transmisión",
      costPrice: 80000n,
    });
    findPartByCodeMock.mockResolvedValue({ __kind__: "found", found: scanned });
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");
    const panel = await openReviewPanel();

    await openScannerAndSubmit("REP-9999");

    // The resolved part fills the line's code, description and unit cost.
    await waitFor(() =>
      expect(
        within(panel).getByTestId("purchase_invoices.line_code_input.1"),
      ).toHaveValue("REP-9999"),
    );
    expect(
      within(panel).getByTestId("purchase_invoices.line_description_input.1"),
    ).toHaveValue("Cadena de transmisión");
    expect(
      within(panel).getByTestId("purchase_invoices.line_cost_input.1"),
    ).toHaveValue("800.00");
    // The scan queried the backend with the scanned code. The token is null
    // because the test renders without an auth session.
    expect(findPartByCodeMock).toHaveBeenCalledWith(null, "REP-9999");
  });

  it("shows the Spanish not-found notice and leaves the line unchanged", async () => {
    findPartByCodeMock.mockResolvedValue({ __kind__: "notFound" });
    renderWithProviders(<PurchaseInvoicesPage />);
    await screen.findByTestId("purchase_invoices.page");
    const panel = await openReviewPanel();

    await openScannerAndSubmit("NO-EXISTE");

    const notice = await screen.findByTestId(
      "purchase_invoices.scan.not_found_state",
    );
    expect(notice).toHaveTextContent("Producto no encontrado");
    expect(notice).toHaveTextContent("NO-EXISTE");
    // The line keeps its extracted code and description.
    expect(
      within(panel).getByTestId("purchase_invoices.line_code_input.1"),
    ).toHaveValue("REP-0001");
    expect(
      within(panel).getByTestId("purchase_invoices.line_description_input.1"),
    ).toHaveValue("Balata de freno");
  });
});
