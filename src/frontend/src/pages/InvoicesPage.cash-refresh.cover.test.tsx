import type {
  CompanyProfile,
  Customer,
  Invoice,
  InvoicePage,
  OrderView,
  Receivable,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  InvoiceLineKind,
  InvoiceOrigin,
  OrderStatus,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  ReceivableStatus,
  TaxResponsibility,
} from "@/lib/types";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change that refreshes the Caja y Bancos view after
 * generating an invoice from a delivered OT.
 *
 * Generating the invoice records the OT sale's saldo a cobrar as an income
 * movement in the account of the chosen payment method, so `InvoicesPage` must
 * invalidate the `["cash"]` query family after success. Otherwise the open
 * shifts, the movements and the balances would keep serving the pre-invoice
 * cache until a manual reload.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend invalidation seam, not a real backend. The PocketIC lane
 * (`backend.invoice-collection.cover.test.ts`) proves the movement itself is
 * written; this file proves the view refetches once it is.
 */

const listInvoicesMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const listOrdersMock = vi.fn();
const getCustomerMock = vi.fn();
const listReceivablesMock = vi.fn();
const createInvoiceFromOrderMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listInvoices: listInvoicesMock,
      getCompanyProfile: getCompanyProfileMock,
      listOrders: listOrdersMock,
      getCustomer: getCustomerMock,
      listReceivables: listReceivablesMock,
      createInvoiceFromOrder: createInvoiceFromOrderMock,
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
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

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
    taxRate: 0n,
    tax: 0n,
    total: 50000n,
    discount: 0n,
    origin: InvoiceOrigin.workshopOrder,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    paymentStatus: PaymentStatus.paid,
    issuedAt: TS,
    ...overrides,
  };
}

function page(items: Invoice[], total = items.length): InvoicePage {
  return { items, total: BigInt(total), offset: 0n, limit: 20n };
}

/**
 * A delivered OT with a $ 300 anticipo on a $ 800 total, so the saldo a cobrar
 * is $ 500. Amounts are in cents.
 */
function orderViewWithAdvance(): OrderView {
  return {
    order: {
      id: 42n,
      status: OrderStatus.delivered,
      createdAt: TS,
      statusHistory: [],
      labor: [],
      updatedAt: TS,
      motorcycleId: 3n,
      customerId: 1n,
      parts: [],
      intakeMileage: 12_000n,
      orderNumber: "OT-0042",
      problem: "Frenos",
      technicianIds: [],
      photos: [],
      payments: [],
      advance: {
        amount: 30000n,
        method: PaymentMethod.cash,
        registeredAt: TS,
        registeredBy: { toText: () => "aaaaa-aa" } as never,
      },
    },
    totals: {
      tax: 0n,
      total: 80000n,
      partsSubtotal: 80000n,
      laborSubtotal: 0n,
      taxRate: 0n,
      subtotal: 80000n,
      paidAmount: 30000n,
      balance: 50000n,
    },
  };
}

function companyProfile(): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.noResponsableIva,
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 0n,
    updatedAt: TS,
  };
}

function customer(): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 000 0000",
    email: "ada@example.com",
    document: "LOAA1815",
    createdAt: TS,
  };
}

function receivable(): Receivable {
  return {
    invoiceId: 1n,
    invoiceNumber: "FAC-0001",
    customerId: 1n,
    customerName: "Ada Lovelace",
    total: 50000n,
    paidAmount: 0n,
    balance: 50000n,
    dueDate: TS,
    issuedAt: TS,
    status: ReceivableStatus.pending,
  };
}

/** Opens the generate dialog and selects the delivered OT with an advance. */
async function openDialogAndSelectOrder() {
  await userEvent.click(await screen.findByTestId("invoices.generate_button"));
  const select = await screen.findByTestId("invoices.order_select");
  await userEvent.click(select);
  await userEvent.click(await screen.findByRole("option", { name: /OT-0042/ }));
}

describe("InvoicesPage Caja/Bancos refresh (cover)", () => {
  beforeEach(() => {
    listInvoicesMock.mockReset();
    getCompanyProfileMock.mockReset();
    listOrdersMock.mockReset();
    getCustomerMock.mockReset();
    listReceivablesMock.mockReset();
    createInvoiceFromOrderMock.mockReset();
    navigateMock.mockReset();

    listInvoicesMock.mockResolvedValue(page([]));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getCustomerMock.mockResolvedValue(customer());
    listReceivablesMock.mockResolvedValue([receivable()]);
    listOrdersMock.mockResolvedValue({
      items: [orderViewWithAdvance()],
      total: 1n,
      offset: 0n,
      limit: 100n,
    });
  });

  it("invalidates the cash family after generating an OT invoice", async () => {
    createInvoiceFromOrderMock.mockResolvedValue(invoice());
    const { queryClient } = renderWithProviders(<InvoicesPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await openDialogAndSelectOrder();
    await userEvent.click(
      await screen.findByTestId("invoices.generate_submit_button"),
    );

    await waitFor(() =>
      expect(createInvoiceFromOrderMock).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["cash"] }),
    );
  });

  it("does not invalidate the cash family when generating the invoice fails", async () => {
    createInvoiceFromOrderMock.mockRejectedValue(new Error("boom"));
    const { queryClient } = renderWithProviders(<InvoicesPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await openDialogAndSelectOrder();
    await userEvent.click(
      await screen.findByTestId("invoices.generate_submit_button"),
    );

    await waitFor(() =>
      expect(createInvoiceFromOrderMock).toHaveBeenCalledTimes(1),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ["cash"] });
  });
});
