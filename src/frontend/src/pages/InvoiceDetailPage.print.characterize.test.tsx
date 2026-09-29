import type { BusinessSettings, CompanyProfile, Invoice } from "@/lib/types";
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
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the invoice detail print/download seam.
 *
 * The accepted change makes every generated document printable in A4 and 80 mm
 * receipt formats, which will rework how the invoice detail produces its
 * document. These tests protect the behavior that already works and that the
 * new format selector must keep: the "Imprimir / PDF" action opens the browser
 * print dialog, the "Descargar PDF" action builds a PDF and hands it to the
 * shared mobile-safe download helper under the invoice's file name, and the
 * on-screen document keeps rendering the fiscal data and reconciled totals.
 *
 * They assert the current backend contract (the session token is the first
 * argument of every actor call) and never assert the exact copy of the new
 * format controls.
 */

const {
  getInvoiceMock,
  getBusinessSettingsMock,
  getCompanyProfileMock,
  downloadFileMock,
  outputMock,
} = vi.hoisted(() => ({
  getInvoiceMock: vi.fn(),
  getBusinessSettingsMock: vi.fn(),
  getCompanyProfileMock: vi.fn(),
  downloadFileMock: vi.fn(),
  outputMock: vi.fn(() => new Blob(["pdf"], { type: "application/pdf" })),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getInvoice: getInvoiceMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/lib/download", () => ({
  downloadFile: downloadFileMock,
}));

// The PDF renderer is heavy and irrelevant to the page wiring under test: the
// seam is that the page builds a document and hands its blob to `downloadFile`.
vi.mock("@/lib/pdf", () => ({
  loadPdfLibs: vi.fn(async () => ({
    jsPDF: class {
      output = outputMock;
      setFont() {}
      setFontSize() {}
      setTextColor() {}
      text() {}
      setDrawColor() {}
      setLineWidth() {}
      line() {}
    },
    autoTable: vi.fn(),
  })),
  pdfCompanyFromProfile: () => ({ name: "HR SOLUCIONES INTEGRALES" }),
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

describe("InvoiceDetailPage print and download (characterization)", () => {
  beforeEach(() => {
    getInvoiceMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    downloadFileMock.mockReset();
    outputMock.mockClear();
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("reads the invoice with the session token as the first argument", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");
    expect(getInvoiceMock).toHaveBeenCalledWith(null, 1n);
  });

  it("opens the browser print dialog from the print action", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    try {
      renderWithProviders(<InvoiceDetailPage />);

      await screen.findByTestId("invoice_detail.document");
      await userEvent.click(screen.getByTestId("invoice_detail.print_button"));

      expect(printSpy).toHaveBeenCalledTimes(1);
    } finally {
      printSpy.mockRestore();
    }
  });

  it("builds a PDF and downloads it under the invoice file name", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    downloadFileMock.mockResolvedValue(undefined);
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");
    await userEvent.click(screen.getByTestId("invoice_detail.download_button"));

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledTimes(1));
    expect(downloadFileMock.mock.calls[0][0]).toMatchObject({
      filename: "Factura-FAC-0001.pdf",
      mimeType: "application/pdf",
    });
    expect(outputMock).toHaveBeenCalledWith("blob");
  });

  it("surfaces a retry when the download fails", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    downloadFileMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");
    await userEvent.click(screen.getByTestId("invoice_detail.download_button"));

    expect(
      await screen.findByTestId("invoice_detail.download_error"),
    ).toHaveTextContent("No se pudo guardar el PDF en este dispositivo");
    expect(
      screen.getByTestId("invoice_detail.download_retry_button"),
    ).toBeInTheDocument();
  });

  it("keeps the document totals reconciled with the lines", async () => {
    getInvoiceMock.mockResolvedValue(
      invoice({
        lines: [
          {
            kind: InvoiceLineKind.part,
            description: "Balata de freno",
            quantity: 2n,
            unitPrice: 25000n,
            amount: 50000n,
            unitCost: 15000n,
          },
          {
            kind: InvoiceLineKind.service,
            description: "Ajuste de frenos",
            quantity: 1n,
            unitPrice: 30000n,
            amount: 30000n,
            unitCost: 0n,
          },
        ],
        subtotal: 80000n,
        discount: 10000n,
        taxRate: 16n,
        tax: 11200n,
        total: 81200n,
      }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");

    // The document shows the subtotal and the total it was given; the fixture
    // keeps subtotal = sum(lines) and total = subtotal - discount + tax.
    expect(screen.getByText("$ 800")).toBeInTheDocument();
    expect(screen.getByText("$ 812")).toBeInTheDocument();
    expect(screen.getByText("Balata de freno")).toBeInTheDocument();
    expect(screen.getByText("Ajuste de frenos")).toBeInTheDocument();
  });
});
