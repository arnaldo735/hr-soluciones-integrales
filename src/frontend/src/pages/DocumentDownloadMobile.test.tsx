import type {
  BusinessSettings,
  CompanyProfile,
  PosSale,
  PosSalePage,
  QuoteView,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  PaymentCondition,
  PaymentMethod,
  QuoteStatus,
  TaxResponsibility,
} from "@/lib/types";
import { PosHistoryPage } from "@/pages/PosHistoryPage";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: the document download buttons save the file on the device
 * on phone and tablet, and a failed save shows a clear Spanish notice with a
 * retry.
 *
 * The accepted change routes every document download through the shared
 * mobile-safe `downloadFile` helper. The invoice detail and the POS sale page
 * already have their own coverage; this file closes the remaining document
 * surfaces the requirement names — the cotización (quote detail) and the
 * comprobante (POS history receipt) — and pins the horizontal-scroll
 * containment the requirement asks for on narrow screens.
 *
 * The helper itself is mocked so the test observes the page wiring (the file
 * name, the MIME type, the loading/error/retry states) rather than the real
 * save path, which only a real browser can exercise.
 */

const downloadFileMock = vi.fn();

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return {
    ...actual,
    downloadFile: (...args: unknown[]) => downloadFileMock(...args),
  };
});

const getQuoteMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const listCustomersMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const listPosSalesMock = vi.fn();
const getPosSaleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getQuote: getQuoteMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      listCustomers: listCustomersMock,
      listMotorcycles: listMotorcyclesMock,
      listPosSales: listPosSalesMock,
      getPosSale: getPosSaleMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ id: "7" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function business(): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
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

function quoteView(): QuoteView {
  return {
    quote: {
      id: 7n,
      status: QuoteStatus.draft,
      serviceLines: [],
      createdAt: 1_700_000_000_000_000_000n,
      quoteNumber: "COT-0007",
      updatedAt: 1_700_000_000_000_000_000n,
      notes: undefined,
      discount: 0n,
      motorcycleId: 2n,
      customerId: 1n,
      partLines: [
        {
          id: 1n,
          description: "Balata de freno",
          quantity: 2n,
          unitPrice: 25000n,
          partId: 1n,
        },
      ],
      taxRate: 16n,
    },
    totals: {
      tax: 8000n,
      total: 58000n,
      taxableBase: 50000n,
      servicesSubtotal: 0n,
      partsSubtotal: 50000n,
      discount: 0n,
      taxRate: 16n,
      subtotal: 50000n,
    },
  };
}

function sale(): PosSale {
  return {
    id: 1n,
    saleNumber: "POS-0001",
    lines: [
      {
        partId: 1n,
        description: "Balata de freno",
        quantity: 2n,
        unitPrice: 25000n,
        amount: 50000n,
        discount: 0n,
      },
    ],
    subtotal: 50000n,
    discount: 0n,
    taxRate: 16n,
    tax: 8000n,
    total: 58000n,
    amountReceived: 60000n,
    change: 2000n,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
  };
}

function salePage(items: PosSale[]): PosSalePage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 20n };
}

describe("document download on mobile and tablet", () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    getQuoteMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPosSalesMock.mockReset();
    getPosSaleMock.mockReset();
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    listCustomersMock.mockResolvedValue([]);
    listMotorcyclesMock.mockResolvedValue([]);
    listPosSalesMock.mockResolvedValue(salePage([sale()]));
    getPosSaleMock.mockResolvedValue(sale());
  });

  it("saves the quote PDF through the shared download helper", async () => {
    getQuoteMock.mockResolvedValue(quoteView());
    downloadFileMock.mockResolvedValue(undefined);
    renderWithProviders(<QuoteDetailPage />);

    await screen.findAllByText("COT-0007");
    await userEvent.click(
      screen.getByTestId("quote_detail.document.download_button"),
    );

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledTimes(1));
    expect(downloadFileMock.mock.calls[0][0]).toMatchObject({
      filename: "Cotizacion-COT-0007.pdf",
      mimeType: "application/pdf",
    });
    // A successful save leaves no error notice behind.
    expect(
      screen.queryByTestId("quote_detail.download_error"),
    ).not.toBeInTheDocument();
  });

  it("shows a Spanish notice and a retry when the quote PDF cannot be saved", async () => {
    getQuoteMock.mockResolvedValue(quoteView());
    downloadFileMock.mockRejectedValue(new Error("no save path"));
    renderWithProviders(<QuoteDetailPage />);

    await screen.findAllByText("COT-0007");
    await userEvent.click(
      screen.getByTestId("quote_detail.document.download_button"),
    );

    const error = await screen.findByTestId("quote_detail.download_error");
    expect(error).toHaveTextContent(
      "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo.",
    );
    expect(
      screen.getByTestId("quote_detail.download_retry_button"),
    ).toBeInTheDocument();

    // The retry re-runs the download.
    await userEvent.click(
      screen.getByTestId("quote_detail.download_retry_button"),
    );
    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledTimes(2));
  });

  it("saves the POS receipt PDF through the shared download helper", async () => {
    downloadFileMock.mockResolvedValue(undefined);
    renderWithProviders(<PosHistoryPage />);

    await screen.findByText("POS-0001");
    await userEvent.click(screen.getByTestId("pos_history.edit_button.1"));
    await screen.findByTestId("pos_history.receipt_dialog");

    await userEvent.click(
      screen.getByTestId("pos_history.receipt_a4.download_button"),
    );

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledTimes(1));
    expect(downloadFileMock.mock.calls[0][0]).toMatchObject({
      filename: "Comprobante-POS-0001.pdf",
      mimeType: "application/pdf",
    });
  });

  it("shows a Spanish notice and a retry when the POS receipt cannot be saved", async () => {
    downloadFileMock.mockRejectedValue(new Error("no save path"));
    renderWithProviders(<PosHistoryPage />);

    await screen.findByText("POS-0001");
    await userEvent.click(screen.getByTestId("pos_history.edit_button.1"));
    await screen.findByTestId("pos_history.receipt_dialog");

    await userEvent.click(
      screen.getByTestId("pos_history.receipt_a4.download_button"),
    );

    const error = await screen.findByTestId("pos_history.download_error");
    expect(error).toHaveTextContent(
      "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo.",
    );
    expect(
      screen.getByTestId("pos_history.download_retry_button"),
    ).toBeInTheDocument();
  });

  it("wraps the printable document in a horizontally scrollable container", async () => {
    getQuoteMock.mockResolvedValue(quoteView());
    renderWithProviders(<QuoteDetailPage />);

    await screen.findAllByText("COT-0007");

    // The document sheet must sit inside an `overflow-x-auto` wrapper so a wide
    // A4 sheet scrolls sideways on a phone instead of overflowing the viewport.
    const sheet = document.querySelector(".doc-preview");
    expect(sheet).not.toBeNull();
    const scroller = (sheet as HTMLElement).parentElement;
    expect(scroller).not.toBeNull();
    expect(scroller?.className).toContain("overflow-x-auto");
  });
});
