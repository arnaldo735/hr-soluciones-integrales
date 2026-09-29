import type { HopeMessage, PurchaseInvoice } from "@/lib/types";
import {
  ExtractionStatus,
  HopeMode,
  InvoiceFileKind,
  LineApplyStatus,
  LineMatchStatus,
  PurchaseInvoiceStatus,
} from "@/lib/types";
import { PurchaseInvoiceDetailPage } from "@/pages/PurchaseInvoiceDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted daily Biblical-hope block in the purchase-invoice
 * detail view.
 *
 * The accepted change renders the promise in the footer of every printable
 * document, including the factura de compra. `PurchaseInvoiceDetail` reads the
 * promise through `useDailyHopeMessage`, gates it with `hopeMessageContent`, and
 * passes it to the shared `DocumentPreview`. These tests exercise the real page
 * with a typed local actor mock and assert the observable contract:
 *
 * - an enabled promise renders inside the styled card in the print preview;
 * - a disabled or empty promise renders no card and no placeholder;
 * - the rest of the detail view still renders.
 *
 * The backend is a typed local mock, so this suite proves the frontend
 * contract, not the deployed canister.
 */

const getPurchaseInvoiceMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const useParamsMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getPurchaseInvoice: getPurchaseInvoiceMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
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
  useParams: () => useParamsMock(),
}));

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
    lines: [
      {
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
      },
    ],
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    confirmedAt: 1_700_000_000_000_000_000n,
    confirmedBy: undefined,
    ...overrides,
  };
}

function hopeMessage(overrides: Partial<HopeMessage> = {}): HopeMessage {
  return {
    enabled: true,
    mode: HopeMode.auto,
    text: "El Señor es mi pastor; nada me faltará.",
    citation: "Salmos 23:1",
    referenceDate: "26/09/2026",
    ...overrides,
  };
}

describe("purchase invoice detail — daily hope block (cover)", () => {
  beforeEach(() => {
    getPurchaseInvoiceMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    getCompanyProfileMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ id: "10" });
    getPurchaseInvoiceMock.mockResolvedValue(invoice());
    getCompanyProfileMock.mockResolvedValue(null);
  });

  it("renders the promise inside the styled card in the print preview", async () => {
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage());
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    const card = await screen.findByTestId(
      "purchase_invoice_detail.document.hope_message",
    );
    expect(card).toHaveClass("doc-hope");
    expect(card).toHaveAttribute("aria-label", "Mensaje de esperanza");
    expect(
      screen.getByText("El Señor es mi pastor; nada me faltará."),
    ).toHaveClass("doc-hope-text");
    expect(screen.getByText("Salmos 23:1")).toHaveClass("doc-hope-citation");
  });

  it("renders no card and no placeholder when the promise is disabled", async () => {
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage({ enabled: false }));
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    // The detail view renders, but the print preview carries no hope card.
    await screen.findByTestId("purchase_invoice_detail.page");
    await waitFor(() =>
      expect(getDailyHopeMessageMock).toHaveBeenCalledTimes(1),
    );
    expect(
      screen.queryByTestId("purchase_invoice_detail.document.hope_message"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("El Señor es mi pastor; nada me faltará."),
    ).not.toBeInTheDocument();
  });

  it("renders no card when the promise text is empty", async () => {
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage({ text: "   " }));
    renderWithProviders(<PurchaseInvoiceDetailPage />);

    await screen.findByTestId("purchase_invoice_detail.page");
    await waitFor(() =>
      expect(getDailyHopeMessageMock).toHaveBeenCalledTimes(1),
    );
    expect(
      screen.queryByTestId("purchase_invoice_detail.document.hope_message"),
    ).not.toBeInTheDocument();
  });
});
