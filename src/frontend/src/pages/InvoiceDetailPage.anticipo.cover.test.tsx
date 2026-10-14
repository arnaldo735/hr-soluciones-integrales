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
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted "anticipo" change on the invoice detail.
 *
 * The accepted behavior: when an OT with an advance is invoiced, the invoice
 * shows total, anticipo aplicado and saldo a cobrar (total − anticipo); a credit
 * invoice's installment plan is computed on the saldo a cobrar, not the total;
 * and an invoice with no advance keeps the existing behavior (saldo a cobrar
 * equals the total, no anticipo panel).
 *
 * The backend actor is mocked; the real canister is not exercised here. The
 * backend's own discount arithmetic is outside this file's reach.
 */

const getInvoiceMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const markInvoicePaidMock = vi.fn();
const registerInstallmentPaymentMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getInvoice: getInvoiceMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      markInvoicePaid: markInvoicePaidMock,
      registerInstallmentPayment: registerInstallmentPaymentMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
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
  useSearch: () => ({}),
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

/**
 * A credit invoice whose $ 600 total was discounted by a $ 200 anticipo, so the
 * plan finances the $ 400 saldo a cobrar in two $ 200 installments.
 */
function creditInvoiceWithAdvance(overrides: Partial<Invoice> = {}): Invoice {
  const dueDate = 1_800_000_000_000_000_000n;
  return invoice({
    paymentCondition: PaymentCondition.credit,
    total: 60000n,
    subtotal: 60000n,
    tax: 0n,
    taxRate: 0n,
    advanceApplied: 20000n,
    installments: {
      firstDueDate: dueDate,
      installmentCount: 2n,
      installments: [
        { number: 1n, amount: 20000n, dueDate, paid: false },
        { number: 2n, amount: 20000n, dueDate, paid: false },
      ],
    },
    ...overrides,
  });
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

function companyProfile(
  overrides: Partial<CompanyProfile> = {},
): CompanyProfile {
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
    ...overrides,
  };
}

describe("InvoiceDetailPage anticipo (cover)", () => {
  beforeEach(() => {
    getInvoiceMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    markInvoicePaidMock.mockReset();
    registerInstallmentPaymentMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("shows total, anticipo aplicado and saldo a cobrar", async () => {
    getInvoiceMock.mockResolvedValue(
      invoice({ total: 58000n, advanceApplied: 18000n }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    const panel = await screen.findByTestId("invoice_detail.advance_panel");
    expect(panel).toHaveTextContent("Total");
    expect(panel).toHaveTextContent("$ 580");
    expect(
      within(panel).getByTestId("invoice_detail.advance_applied"),
    ).toHaveTextContent("$ 180");
    expect(
      within(panel).getByTestId("invoice_detail.saldo_a_cobrar"),
    ).toHaveTextContent("$ 400");
  });

  it("computes a credit invoice's installments on the saldo a cobrar", async () => {
    const view = creditInvoiceWithAdvance();
    getInvoiceMock.mockResolvedValue(view);
    renderWithProviders(<InvoiceDetailPage />);

    const panel = await screen.findByTestId(
      "invoice_detail.installments_panel",
    );

    // The plan finances the saldo a cobrar (total − anticipo), not the total.
    const installmentSum = view.installments?.installments.reduce(
      (sum, installment) => sum + installment.amount,
      0n,
    );
    expect(installmentSum).toBe(view.total - (view.advanceApplied ?? 0n));
    expect(panel).toHaveTextContent("Total financiado");
    expect(panel).toHaveTextContent("$ 400");
    expect(panel).toHaveTextContent("Saldo pendiente");
    expect(panel).toHaveTextContent("$ 400");
    // The panel explains the plan was computed on the saldo a cobrar.
    expect(panel).toHaveTextContent("se calculó sobre el saldo a cobrar");
  });

  it("keeps a no-advance invoice's saldo a cobrar equal to its total", async () => {
    getInvoiceMock.mockResolvedValue(invoice({ total: 58000n }));
    renderWithProviders(<InvoiceDetailPage />);

    // No advance means no anticipo panel and no saldo a cobrar row.
    await screen.findByTestId("invoice_detail.document");
    expect(
      screen.queryByTestId("invoice_detail.advance_panel"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("invoice_detail.saldo_a_cobrar"),
    ).not.toBeInTheDocument();
  });
});
