import type {
  BusinessSettings,
  CompanyProfile,
  Invoice,
  PosSale,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  InvoiceLineKind,
  InvoiceOrigin,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  TaxResponsibility,
} from "@/lib/types";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { PosPage } from "@/pages/PosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: a failed document download shows a clear Spanish notice
 * with a retry, and the retry re-runs the download.
 *
 * The accepted change routes every document download through the shared
 * mobile-safe helper, which can reject when no save path is available on the
 * device. These tests pin the observable failure contract on the two document
 * pages that own a download action: the invoice detail and the POS receipt.
 * They never assert the PDF bytes or the real save path.
 */

const downloadFileMock = vi.fn();

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return {
    ...actual,
    downloadFile: (...args: unknown[]) => downloadFileMock(...args),
  };
});

const getInvoiceMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const listPartsMock = vi.fn();
const listCustomersMock = vi.fn();
const createPosSaleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getInvoice: getInvoiceMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      listParts: listPartsMock,
      listCustomers: listCustomersMock,
      createPosSale: createPosSaleMock,
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
  useParams: () => ({ id: "1" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 1n,
    number: "FAC-0001",
    orderId: 42n,
    customerId: 1n,
    customerName: "Ada Lovelace",
    customerTaxId: "LOAA1815",
    customerAddress: "Av. Reforma 100",
    lines: [
      {
        kind: InvoiceLineKind.part,
        description: "Balata de freno",
        quantity: 2n,
        unitPrice: 25000n,
        amount: 50000n,
        unitCost: 15000n,
      },
    ],
    subtotal: 50000n,
    taxRate: 16n,
    tax: 8000n,
    total: 58000n,
    discount: 0n,
    origin: InvoiceOrigin.workshopOrder,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    paymentStatus: PaymentStatus.pending,
    issuedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

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

describe("document download failure and retry", () => {
  beforeEach(() => {
    downloadFileMock.mockReset();
    getInvoiceMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    listPartsMock.mockReset();
    listCustomersMock.mockReset();
    createPosSaleMock.mockReset();
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    listCustomersMock.mockResolvedValue([]);
  });

  it("shows a Spanish notice and a retry when the invoice PDF cannot be saved", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    downloadFileMock.mockRejectedValue(new Error("no save path"));
    renderWithProviders(<InvoiceDetailPage />);

    await userEvent.click(
      await screen.findByTestId("invoice_detail.download_button"),
    );

    const error = await screen.findByTestId("invoice_detail.download_error");
    expect(error).toHaveTextContent(
      "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo.",
    );
    expect(
      screen.getByTestId("invoice_detail.download_retry_button"),
    ).toBeInTheDocument();
  });

  it("re-runs the invoice download when the retry is pressed", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    downloadFileMock.mockRejectedValue(new Error("no save path"));
    renderWithProviders(<InvoiceDetailPage />);

    await userEvent.click(
      await screen.findByTestId("invoice_detail.download_button"),
    );
    await screen.findByTestId("invoice_detail.download_error");
    expect(downloadFileMock).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByTestId("invoice_detail.download_retry_button"),
    );

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledTimes(2));
  });

  it("clears the invoice notice once a retry succeeds", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    downloadFileMock
      .mockRejectedValueOnce(new Error("no save path"))
      .mockResolvedValueOnce(undefined);
    renderWithProviders(<InvoiceDetailPage />);

    await userEvent.click(
      await screen.findByTestId("invoice_detail.download_button"),
    );
    await screen.findByTestId("invoice_detail.download_error");

    await userEvent.click(
      screen.getByTestId("invoice_detail.download_retry_button"),
    );

    await waitFor(() =>
      expect(
        screen.queryByTestId("invoice_detail.download_error"),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows a Spanish notice and a retry when the POS receipt cannot be saved", async () => {
    listPartsMock.mockResolvedValue({
      items: [
        {
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
        },
      ],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    createPosSaleMock.mockResolvedValue(sale());
    downloadFileMock.mockRejectedValue(new Error("no save path"));
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await screen.findByTestId("pos.success_state");
    await userEvent.click(screen.getByTestId("pos.receipt_a4.download_button"));

    const error = await screen.findByTestId("pos.download_error");
    expect(error).toHaveTextContent(
      "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo.",
    );
    expect(screen.getByTestId("pos.download_retry_button")).toBeInTheDocument();
  });
});
