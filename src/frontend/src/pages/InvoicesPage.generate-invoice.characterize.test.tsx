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
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the "generar factura desde una OT" contract
 * that the accepted Caja/Bancos change must extend without breaking.
 *
 * The accepted change makes `createInvoiceFromOrder` record the OT sale's saldo
 * a cobrar (total − anticipo) as a Caja/Bancos income movement, and makes the
 * frontend refresh the Caja y Bancos view after generating the invoice. These
 * tests deliberately do NOT assert anything about the movement or the cash
 * refresh — that is exactly the behavior the change adds. They protect the
 * surrounding dialog contract that must keep working once the movement is
 * recorded:
 *
 *   - the dialog asks the backend only for delivered orders and offers the
 *     selected OT with its advance preview (total, anticipo aplicado, saldo a
 *     cobrar = total − anticipo);
 *   - submitting a cash invoice calls `createInvoiceFromOrder` with the
 *     selected order id, the chosen method and the `cash` condition, and no
 *     credit plan, then navigates to the new invoice's detail;
 *   - submitting a credit invoice passes a credit plan whose installments
 *     finance the saldo a cobrar, not the gross total.
 *
 * The backend actor is mocked; the real canister is not exercised here. The
 * PocketIC lane is the only place the movement itself can be proven.
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
function orderViewWithAdvance(
  overrides: Partial<OrderView["order"]> = {},
): OrderView {
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
      ...overrides,
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

function companyProfile(
  overrides: Partial<CompanyProfile> = {},
): CompanyProfile {
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
    ...overrides,
  };
}

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 000 0000",
    email: "ada@example.com",
    document: "LOAA1815",
    createdAt: TS,
    ...overrides,
  };
}

function receivable(overrides: Partial<Receivable> = {}): Receivable {
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
    ...overrides,
  };
}

/** Opens the generate dialog and selects the delivered OT with an advance. */
async function openDialogAndSelectOrder() {
  await userEvent.click(await screen.findByTestId("invoices.generate_button"));
  const select = await screen.findByTestId("invoices.order_select");
  await userEvent.click(select);
  await userEvent.click(await screen.findByRole("option", { name: /OT-0042/ }));
}

describe("InvoicesPage generate-invoice contract (characterization)", () => {
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

  it("shows the selected OT's total, anticipo aplicado and saldo a cobrar", async () => {
    renderWithProviders(<InvoicesPage />);
    await openDialogAndSelectOrder();

    const preview = await screen.findByTestId("invoices.advance_preview");
    // Total $ 800, anticipo $ 300, saldo a cobrar $ 500.
    expect(preview).toHaveTextContent("$ 800");
    expect(
      within(preview).getByTestId("invoices.advance_preview_applied"),
    ).toHaveTextContent("$ 300");
    expect(
      within(preview).getByTestId("invoices.advance_preview_saldo"),
    ).toHaveTextContent("$ 500");
  });

  it("submits a cash invoice with the selected order, method and condition", async () => {
    createInvoiceFromOrderMock.mockResolvedValue(invoice());
    renderWithProviders(<InvoicesPage />);
    await openDialogAndSelectOrder();

    await userEvent.click(
      await screen.findByTestId("invoices.generate_submit_button"),
    );

    await waitFor(() =>
      expect(createInvoiceFromOrderMock).toHaveBeenCalledTimes(1),
    );
    // The dialog defaults to efectivo + contado, so the call carries the
    // selected order id, the cash method, the cash condition and no plan.
    expect(createInvoiceFromOrderMock).toHaveBeenCalledWith(
      null,
      42n,
      PaymentMethod.cash,
      PaymentCondition.cash,
      null,
    );
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/facturas/$id",
        params: { id: "1" },
      }),
    );
  });

  it("submits a credit invoice with a plan financing the saldo a cobrar", async () => {
    createInvoiceFromOrderMock.mockResolvedValue(
      invoice({ paymentCondition: PaymentCondition.credit }),
    );
    renderWithProviders(<InvoicesPage />);
    await openDialogAndSelectOrder();

    await userEvent.click(
      await screen.findByTestId("invoices.condition_credit_button"),
    );
    await userEvent.clear(
      await screen.findByTestId("invoices.installment_count_input"),
    );
    await userEvent.type(
      screen.getByTestId("invoices.installment_count_input"),
      "2",
    );
    await userEvent.type(
      screen.getByTestId("invoices.first_due_date_input"),
      "2026-01-15",
    );

    // The preview finances the saldo a cobrar ($ 500), not the total ($ 800):
    // two installments of $ 250.
    const preview = await screen.findByTestId("invoices.installment_preview");
    expect(preview).toHaveTextContent("$ 500");
    expect(preview).toHaveTextContent("$ 250");

    await userEvent.click(
      screen.getByTestId("invoices.generate_submit_button"),
    );

    await waitFor(() =>
      expect(createInvoiceFromOrderMock).toHaveBeenCalledTimes(1),
    );
    const call = createInvoiceFromOrderMock.mock.calls[0];
    expect(call[0]).toBeNull();
    expect(call[1]).toBe(42n);
    expect(call[2]).toBe(PaymentMethod.cash);
    expect(call[3]).toBe(PaymentCondition.credit);
    expect(call[4]).toMatchObject({ installmentCount: 2n });
    expect(call[4].firstDueDate).toBe(
      BigInt(new Date("2026-01-15T00:00:00Z").getTime()) * 1_000_000n,
    );
  });
});
