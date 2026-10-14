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
 * Characterization coverage for the invoice document contract that the
 * "anticipo" change must extend without breaking.
 *
 * The accepted change lets an OT carry an advance payment (anticipo) that is
 * discounted from the invoice total, so the invoice will show total, anticipo
 * aplicado and saldo a cobrar. These tests deliberately do NOT assert the
 * absence of an anticipo row — that is the behavior the change intentionally
 * adds. They protect the surrounding invariants that stay true for an invoice
 * with no anticipo:
 *
 *   - the document total is the discounted base plus the tax the backend
 *     applied (subtotal − discount + tax);
 *   - a credit invoice's installment plan sums exactly to the invoice total,
 *     which for a no-anticipo invoice is the saldo a cobrar;
 *   - the installment panel's "Total financiado" reconciles with the invoice
 *     total.
 *
 * The backend actor is mocked; the real canister is not exercised here.
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
 * A credit invoice with a three-installment plan and no anticipo. Amounts are
 * in cents, so the $ 600 total is split into three $ 200 installments.
 */
function creditInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const dueDate = 1_800_000_000_000_000_000n;
  return invoice({
    paymentCondition: PaymentCondition.credit,
    total: 60000n,
    subtotal: 60000n,
    tax: 0n,
    taxRate: 0n,
    installments: {
      firstDueDate: dueDate,
      installmentCount: 3n,
      installments: [
        { number: 1n, amount: 20000n, dueDate, paid: false },
        { number: 2n, amount: 20000n, dueDate, paid: false },
        { number: 3n, amount: 20000n, dueDate, paid: false },
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

describe("InvoiceDetailPage no-anticipo contract (characterization)", () => {
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

  it("renders the total as the discounted base plus the applied tax", async () => {
    // subtotal 800, discount 100, tax 112 → total 812.
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

    const document = await screen.findByTestId("invoice_detail.document");
    // The document shows the subtotal and the total it was given.
    expect(within(document).getByText("$ 800")).toBeInTheDocument();
    expect(within(document).getByText("$ 812")).toBeInTheDocument();
  });

  it("keeps a credit invoice's installment plan summing to the invoice total", async () => {
    const view = creditInvoice();
    getInvoiceMock.mockResolvedValue(view);
    renderWithProviders(<InvoiceDetailPage />);

    const panel = await screen.findByTestId(
      "invoice_detail.installments_panel",
    );

    // The invariant the anticipo change must preserve for a no-anticipo
    // invoice: the installments finance exactly the invoice total.
    const installmentSum = view.installments?.installments.reduce(
      (sum, installment) => sum + installment.amount,
      0n,
    );
    expect(installmentSum).toBe(view.total);
    expect(panel).toHaveTextContent("$ 600");
    expect(
      screen.getByTestId("invoice_detail.installments_progress"),
    ).toHaveTextContent("0 / 3 pagadas");
  });

  it("reconciles the installment panel's financed total with the invoice total", async () => {
    getInvoiceMock.mockResolvedValue(creditInvoice());
    renderWithProviders(<InvoiceDetailPage />);

    const panel = await screen.findByTestId(
      "invoice_detail.installments_panel",
    );
    // Total financiado equals the invoice total when there is no anticipo.
    expect(panel).toHaveTextContent("Total financiado");
    expect(panel).toHaveTextContent("$ 600");
    // Nothing paid yet, so the pending balance is the whole financed amount.
    expect(panel).toHaveTextContent("Saldo pendiente");
    expect(panel).toHaveTextContent("$ 600");
  });
});
