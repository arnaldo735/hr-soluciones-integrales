import type { PurchaseInvoice, PurchaseInvoiceLine } from "@/lib/types";
import {
  ExtractionStatus,
  InvoiceFileKind,
  LineApplyStatus,
  LineMatchStatus,
  PurchaseInvoiceStatus,
} from "@/lib/types";
import { PurchaseInvoiceDetailPage } from "@/pages/PurchaseInvoiceDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: the processed purchase-invoice detail view.
 *
 * The route `/facturas-compra/$id` shows the extracted header, the lines with
 * the result of applying each one to inventory, and links to the movements
 * generated. These tests exercise the real page with a typed local actor mock,
 * so they cover the observable contract: the header metadata, the per-line
 * apply result and error reason, the movements panel, and the invalid-id and
 * not-found error states.
 *
 * The backend is a typed local mock, so this suite proves the frontend
 * contract, not the deployed canister.
 */

const getPurchaseInvoiceMock = vi.fn();
const useParamsMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { getPurchaseInvoice: getPurchaseInvoiceMock },
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
  useParams: () => useParamsMock(),
}));

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
    status: PurchaseInvoiceStatus.confirmed,
    extractionStatus: ExtractionStatus.extracted,
    extractionError: undefined,
    supplierId: 1n,
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
    confirmedAt: 1_700_000_000_000_000_000n,
    confirmedBy: undefined,
    ...overrides,
  };
}

describe("PurchaseInvoiceDetailPage", () => {
  beforeEach(() => {
    getPurchaseInvoiceMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ id: "10" });
    getPurchaseInvoiceMock.mockResolvedValue(invoice());
  });

  it("renders the extracted header and the invoice total", async () => {
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    expect(
      await screen.findByTestId("purchase_invoice_detail.page"),
    ).toBeInTheDocument();
    // The number and supplier appear both in the header and in the meta grid.
    expect(screen.getAllByText("FE-10245").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Repuestos El Motor").length).toBeGreaterThan(0);
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
    // 2 × 12500 cents = 25000 cents = $ 250, shown as the meta total, the line
    // subtotal and the invoice footer.
    expect(screen.getAllByText("$ 250").length).toBeGreaterThan(0);
    expect(getPurchaseInvoiceMock).toHaveBeenCalledWith(10n);
  });

  it("shows each line with its apply result and match status", async () => {
    getPurchaseInvoiceMock.mockResolvedValue(
      invoice({
        lines: [
          line({
            id: 1n,
            lineNumber: 1n,
            code: "REP-0001",
            description: "Balata de freno",
            applyStatus: LineApplyStatus.created,
            matchStatus: LineMatchStatus.new,
            matchedPartId: 5n,
          }),
          line({
            id: 2n,
            lineNumber: 2n,
            code: "REP-0002",
            description: "Filtro de aire",
            applyStatus: LineApplyStatus.updated,
            matchStatus: LineMatchStatus.existing,
            matchedPartId: 6n,
          }),
        ],
      }),
    );
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    const first = await screen.findByTestId("purchase_invoice_detail.line.1");
    expect(first).toHaveTextContent("Balata de freno");
    expect(first).toHaveTextContent("REP-0001");
    expect(first).toHaveTextContent("Creado");
    expect(first).toHaveTextContent("Repuesto nuevo");

    const second = screen.getByTestId("purchase_invoice_detail.line.2");
    expect(second).toHaveTextContent("Filtro de aire");
    expect(second).toHaveTextContent("Actualizado");
    expect(second).toHaveTextContent("Repuesto existente");
  });

  it("reports a line apply error with its reason", async () => {
    getPurchaseInvoiceMock.mockResolvedValue(
      invoice({
        status: PurchaseInvoiceStatus.withErrors,
        lines: [
          line({
            applyStatus: LineApplyStatus.error,
            applyError: "La cantidad debe ser mayor que cero",
            matchedPartId: undefined,
          }),
        ],
      }),
    );
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    const error = await screen.findByTestId(
      "purchase_invoice_detail.line_error.1",
    );
    expect(error).toHaveTextContent("La cantidad debe ser mayor que cero");
    expect(screen.getByText("Con errores")).toBeInTheDocument();
  });

  it("links each applied line to the inventory movements of its part", async () => {
    getPurchaseInvoiceMock.mockResolvedValue(
      invoice({
        lines: [
          line({
            id: 1n,
            applyStatus: LineApplyStatus.created,
            matchedPartId: 5n,
          }),
        ],
      }),
    );
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    const panel = await screen.findByTestId(
      "purchase_invoice_detail.movements_panel",
    );
    const link = within(panel).getByTestId(
      "purchase_invoice_detail.part_link.1",
    );
    expect(link).toHaveAttribute("href", "/inventario/$id");
    expect(link).toHaveAttribute("data-params", JSON.stringify({ id: "5" }));

    const rowLink = screen.getByTestId(
      "purchase_invoice_detail.movement_link.1",
    );
    expect(rowLink).toHaveAttribute("data-params", JSON.stringify({ id: "5" }));
  });

  it("hides the movements panel when no line was applied", async () => {
    getPurchaseInvoiceMock.mockResolvedValue(
      invoice({
        status: PurchaseInvoiceStatus.pending,
        lines: [
          line({
            applyStatus: LineApplyStatus.pending,
            matchedPartId: undefined,
          }),
        ],
      }),
    );
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    await screen.findByTestId("purchase_invoice_detail.page");
    expect(
      screen.queryByTestId("purchase_invoice_detail.movements_panel"),
    ).not.toBeInTheDocument();
  });

  it("shows the extraction error when the extraction failed", async () => {
    getPurchaseInvoiceMock.mockResolvedValue(
      invoice({
        extractionStatus: ExtractionStatus.failed,
        extractionError: "No se pudieron leer los datos de la factura.",
        lines: [],
      }),
    );
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    expect(
      await screen.findByTestId("purchase_invoice_detail.extraction_error"),
    ).toHaveTextContent("No se pudieron leer los datos de la factura.");
    expect(
      screen.getByTestId("purchase_invoice_detail.lines_empty_state"),
    ).toBeInTheDocument();
  });

  it("renders an error state when the invoice does not exist", async () => {
    getPurchaseInvoiceMock.mockResolvedValue(null);
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    expect(
      await screen.findByTestId("purchase_invoice_detail.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Factura no encontrada")).toBeInTheDocument();
    expect(getPurchaseInvoiceMock).toHaveBeenCalledWith(10n);
  });

  it("rejects a non-numeric id without calling the backend", async () => {
    useParamsMock.mockReturnValue({ id: "abc" });
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    expect(
      await screen.findByTestId("purchase_invoice_detail.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("El identificador de la factura no es válido."),
    ).toBeInTheDocument();
    expect(getPurchaseInvoiceMock).not.toHaveBeenCalled();
  });
});
