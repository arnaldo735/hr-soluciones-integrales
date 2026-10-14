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
 * Cover for the accepted change that refreshes the Caja y Bancos view after
 * collecting an invoice.
 *
 * Collecting a credit invoice (`markInvoicePaid`) and paying an installment
 * (`registerInstallmentPayment`) each write a movement into the Caja/Bancos
 * ledger, so the invoice detail must invalidate the `["cash"]` query family
 * after success. Otherwise the open shifts, the movements and the balances
 * would keep serving the pre-collection cache until a manual reload.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend invalidation seam, not a real backend. The PocketIC lane
 * (`backend.payment-method-shift.cover.test.ts`) proves the movement itself is
 * written; this file proves the view refetches once it is.
 */

const getInvoiceMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const markInvoicePaidMock = vi.fn();
const registerInstallmentPaymentMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getInvoice: getInvoiceMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      markInvoicePaid: markInvoicePaidMock,
      registerInstallmentPayment: registerInstallmentPaymentMock,
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
      installmentCount: 2n,
      installments: [
        { number: 1n, amount: 30000n, dueDate, paid: false },
        { number: 2n, amount: 30000n, dueDate, paid: false },
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

describe("InvoiceDetailPage Caja/Bancos refresh (cover)", () => {
  beforeEach(() => {
    getInvoiceMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    markInvoicePaidMock.mockReset();
    registerInstallmentPaymentMock.mockReset();
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("invalidates the cash family after marking an invoice as paid", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    markInvoicePaidMock.mockResolvedValue(
      invoice({ paymentStatus: PaymentStatus.paid }),
    );
    const { queryClient } = renderWithProviders(<InvoiceDetailPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await userEvent.click(
      await screen.findByTestId("invoice_detail.mark_paid_button"),
    );
    await userEvent.click(
      await screen.findByTestId("invoice_detail.paid_submit_button"),
    );

    await waitFor(() => expect(markInvoicePaidMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cash"] }),
    );
  });

  it("invalidates the cash family after registering an installment", async () => {
    getInvoiceMock.mockResolvedValue(creditInvoice());
    registerInstallmentPaymentMock.mockResolvedValue(
      creditInvoice({ paymentStatus: PaymentStatus.pending }),
    );
    const { queryClient } = renderWithProviders(<InvoiceDetailPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await screen.findByTestId("invoice_detail.installments_panel");
    await userEvent.click(
      screen.getByTestId("invoice_detail.pay_installment_button.1"),
    );

    await waitFor(() =>
      expect(registerInstallmentPaymentMock).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cash"] }),
    );
  });
});
