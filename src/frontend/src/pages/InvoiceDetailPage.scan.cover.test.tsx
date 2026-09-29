import type {
  BusinessSettings,
  CompanyProfile,
  Invoice,
  PartView,
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
import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the facturas scan-to-verify journey after the accepted change that
 * unified the barcode lookup into `findPartByCode` (barcode or SKU).
 *
 * A factura is immutable once issued, so scanning here only verifies the part
 * against the catalog: a resolved code shows the "Repuesto encontrado" panel
 * with the part's name, SKU and price, and an unknown code shows the shared
 * scanner's Spanish "producto no encontrado" notice. The page passes no
 * `onNotFound`, so that notice is the component's own.
 *
 * The scanner resolves through `useBackend().actor.findPartByCode`, so the actor
 * is mocked with a stable object (a fresh actor per render would restart the
 * camera and is a harness artifact, not product behavior).
 */

const getInvoiceMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const findPartByCodeMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getInvoice: getInvoiceMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      findPartByCode: findPartByCodeMock,
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
  useNavigate: () => vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 10n,
    sku: "BAL-001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 2n,
    totalStock: 8n,
    barcode: "",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

async function openScannerAndSubmit(code: string) {
  await userEvent.click(screen.getByTestId("invoice_detail.scan_button"));
  await userEvent.type(
    screen.getByTestId("invoice_detail.scanner.input"),
    code,
  );
  await userEvent.click(
    screen.getByTestId("invoice_detail.scanner.submit_button"),
  );
}

describe("InvoiceDetailPage scan-to-verify (cover)", () => {
  beforeEach(() => {
    getInvoiceMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    findPartByCodeMock.mockReset();
    getInvoiceMock.mockResolvedValue(invoice());
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("shows the resolved part in the verification panel", async () => {
    const scanned = part({
      id: 99n,
      sku: "REP-9999",
      name: "Cadena de transmisión",
      salePrice: 80000n,
    });
    findPartByCodeMock.mockResolvedValue({ __kind__: "found", found: scanned });
    renderWithProviders(<InvoiceDetailPage />);
    await screen.findByTestId("invoice_detail.document");

    await openScannerAndSubmit("REP-9999");

    const panel = await screen.findByTestId("invoice_detail.scanned_part");
    expect(panel).toHaveTextContent("Cadena de transmisión");
    expect(panel).toHaveTextContent("REP-9999");
    // The scan queried the backend with the scanned code. The token is null
    // because the test renders without an auth session.
    expect(findPartByCodeMock).toHaveBeenCalledWith(null, "REP-9999");
  });

  it("shows the Spanish not-found notice and no panel for an unknown code", async () => {
    findPartByCodeMock.mockResolvedValue({ __kind__: "notFound" });
    renderWithProviders(<InvoiceDetailPage />);
    await screen.findByTestId("invoice_detail.document");

    await openScannerAndSubmit("NO-EXISTE");

    const notice = await screen.findByTestId(
      "invoice_detail.scanner.not_found_state",
    );
    expect(notice).toHaveTextContent("Producto no encontrado");
    expect(notice).toHaveTextContent("NO-EXISTE");
    expect(
      screen.queryByTestId("invoice_detail.scanned_part"),
    ).not.toBeInTheDocument();
  });

  it("clears the verification panel when the user dismisses it", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: part({ id: 99n, sku: "REP-9999", name: "Cadena de transmisión" }),
    });
    renderWithProviders(<InvoiceDetailPage />);
    await screen.findByTestId("invoice_detail.document");

    await openScannerAndSubmit("REP-9999");
    await screen.findByTestId("invoice_detail.scanned_part");

    await userEvent.click(
      screen.getByTestId("invoice_detail.clear_scanned_part_button"),
    );

    expect(
      screen.queryByTestId("invoice_detail.scanned_part"),
    ).not.toBeInTheDocument();
  });
});
