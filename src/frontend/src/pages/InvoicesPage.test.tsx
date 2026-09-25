import type {
  CompanyProfile,
  Customer,
  CustomerNotificationResult,
  Invoice,
  InvoicePage,
  OrderView,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  InvoiceLineKind,
  InvoiceOrigin,
  NotificationSource,
  OrderStatus,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  TaxResponsibility,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listInvoicesMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const listOrdersMock = vi.fn();
const getCustomerMock = vi.fn();
const notifyCustomerMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listInvoices: listInvoicesMock,
      getCompanyProfile: getCompanyProfileMock,
      listOrders: listOrdersMock,
      getCustomer: getCustomerMock,
      notifyCustomer: notifyCustomerMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
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

function page(items: Invoice[], total = items.length): InvoicePage {
  return { items, total: BigInt(total), offset: 0n, limit: 20n };
}

function orderView(
  status: OrderStatus,
  overrides: Partial<OrderView["order"]> = {},
): OrderView {
  return {
    order: {
      id: 42n,
      status,
      createdAt: 1_700_000_000_000_000_000n,
      statusHistory: [],
      labor: [],
      updatedAt: 1_700_000_000_000_000_000n,
      motorcycleId: 3n,
      customerId: 1n,
      parts: [],
      intakeMileage: 12_000n,
      orderNumber: "OT-0042",
      problem: "Frenos",
      technicianIds: [],
      photos: [],
      ...overrides,
    },
    totals: {
      tax: 8000n,
      total: 58000n,
      partsSubtotal: 50000n,
      laborSubtotal: 0n,
      taxRate: 16n,
      subtotal: 50000n,
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

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 000 0000",
    email: "ada@example.com",
    document: "LOAA1815",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function notificationResult(
  overrides: Partial<CustomerNotificationResult> = {},
): CustomerNotificationResult {
  return {
    sent: true,
    email: "ada@example.com",
    customerId: 1n,
    ...overrides,
  };
}

function preparedWhatsApp(
  overrides: Partial<WhatsAppMessageResult> = {},
): WhatsAppMessageResult {
  return {
    contactKind: WhatsAppContactKind.customer,
    contactId: 1n,
    contactName: "Ada Lovelace",
    hasPhone: true,
    phone: "+57 300 000 0000",
    message: "Hola Ada, te compartimos la factura FAC-0001.",
    ...overrides,
  };
}

describe("InvoicesPage", () => {
  beforeEach(() => {
    listInvoicesMock.mockReset();
    getCompanyProfileMock.mockReset();
    listOrdersMock.mockReset();
    getCustomerMock.mockReset();
    notifyCustomerMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    navigateMock.mockReset();
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getCustomerMock.mockResolvedValue(customer());
    listOrdersMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 100n,
    });
  });

  it("lists invoices with totals, method and payment status", async () => {
    listInvoicesMock.mockResolvedValue(page([invoice()]));
    renderWithProviders(<InvoicesPage />);

    expect(await screen.findByText("FAC-0001")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("$ 500")).toBeInTheDocument();
    expect(screen.getByText("$ 80")).toBeInTheDocument();
    // The accepted change adds a Saldo column; a pending cash invoice shows its
    // total there too, so the total amount appears twice.
    expect(screen.getAllByText("$ 580")).toHaveLength(2);
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("1 factura")).toBeInTheDocument();
  });

  it("renders an empty state when no invoices exist", async () => {
    listInvoicesMock.mockResolvedValue(page([]));
    renderWithProviders(<InvoicesPage />);

    expect(
      await screen.findByTestId("invoices.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay facturas emitidas"),
    ).toBeInTheDocument();
  });

  it("renders an error state when the invoice list fails", async () => {
    listInvoicesMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InvoicesPage />);

    expect(
      await screen.findByTestId("invoices.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudieron cargar las facturas."),
    ).toBeInTheDocument();
  });

  it("requests the first page with the default filter", async () => {
    listInvoicesMock.mockResolvedValue(page([]));
    renderWithProviders(<InvoicesPage />);

    await waitFor(() => expect(listInvoicesMock).toHaveBeenCalled());
    expect(listInvoicesMock).toHaveBeenCalledWith(
      { search: undefined, from: undefined, to: undefined },
      0n,
      20n,
    );
  });

  it("shows pagination controls when more than one page exists", async () => {
    listInvoicesMock.mockResolvedValue(page([invoice()], 45));
    renderWithProviders(<InvoicesPage />);

    await screen.findByText("FAC-0001");
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByTestId("invoices.pagination_prev")).toBeDisabled();
    expect(screen.getByTestId("invoices.pagination_next")).toBeEnabled();
  });

  // --- Accepted change: the fiscal regime decides IVA -----------------------

  it("hides the tax column for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ fiscalRegime: FiscalRegime.noResponsableIva }),
    );
    listInvoicesMock.mockResolvedValue(
      page([invoice({ taxRate: 0n, tax: 0n, total: 50000n })]),
    );
    renderWithProviders(<InvoicesPage />);

    await screen.findByText("FAC-0001");

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.queryByText("Impuesto")).not.toBeInTheDocument();
    // The total is the plain subtotal, with no tax added. The accepted Saldo
    // column repeats it for a pending invoice, so it appears three times.
    expect(screen.getAllByText("$ 500")).toHaveLength(3);
  });

  // --- Accepted change: only delivered orders are invoiceable --------------
  //
  // The accepted change restricts the generate dialog to delivered orders. The
  // dialog must ask the backend only for delivered orders, so a ready order can
  // never be offered for invoicing.

  it("asks the backend only for delivered orders when generating an invoice", async () => {
    listInvoicesMock.mockResolvedValue(page([]));
    renderWithProviders(<InvoicesPage />);

    await userEvent.click(
      await screen.findByTestId("invoices.generate_button"),
    );

    await waitFor(() => expect(listOrdersMock).toHaveBeenCalled());
    // Exactly one status is requested, and it is `delivered`.
    expect(listOrdersMock).toHaveBeenCalledTimes(1);
    expect(listOrdersMock).toHaveBeenCalledWith(
      { status: OrderStatus.delivered },
      0n,
      100n,
    );
  });

  it("offers a delivered order and never a ready one", async () => {
    listInvoicesMock.mockResolvedValue(page([]));
    // The backend is asked only for delivered orders, so it returns only the
    // delivered one; a ready order is never in the response.
    listOrdersMock.mockResolvedValue({
      items: [orderView(OrderStatus.delivered)],
      total: 1n,
      offset: 0n,
      limit: 100n,
    });
    renderWithProviders(<InvoicesPage />);

    await userEvent.click(
      await screen.findByTestId("invoices.generate_button"),
    );

    const select = await screen.findByTestId("invoices.order_select");
    expect(select).toBeInTheDocument();
    // The delivered order is offered. Radix renders both a hidden native option
    // and the visible item, so match all occurrences.
    await userEvent.click(select);
    expect((await screen.findAllByText(/OT-0042/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Entregada/).length).toBeGreaterThan(0);
    // A ready order is never offered.
    expect(screen.queryByText(/Lista/)).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no delivered orders to invoice", async () => {
    listInvoicesMock.mockResolvedValue(page([]));
    listOrdersMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 100n,
    });
    renderWithProviders(<InvoicesPage />);

    await userEvent.click(
      await screen.findByTestId("invoices.generate_button"),
    );

    expect(
      await screen.findByTestId("invoices.generate_orders_empty"),
    ).toBeInTheDocument();
    // With nothing invoiceable, the submit action is disabled.
    expect(
      screen.getByTestId("invoices.generate_submit_button"),
    ).toBeDisabled();
  });

  // --- Characterization: the existing email notify journey ------------------
  //
  // The accepted change adds a WhatsApp action beside the email action on this
  // page. This test protects the email wiring around it: the row action opens
  // the dialog for that invoice's customer, the recipient is the registered
  // email, and the send carries the customer, the invoice source and the
  // invoice reference.

  it("opens the notify dialog for the invoice's customer and sends to the registered email", async () => {
    listInvoicesMock.mockResolvedValue(page([invoice()]));
    notifyCustomerMock.mockResolvedValue(notificationResult());
    renderWithProviders(<InvoicesPage />);

    await screen.findByText("FAC-0001");
    await userEvent.click(screen.getByTestId("invoices.notify_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(within(dialog).getByTestId("notify.recipient_input")).toHaveValue(
      "ada@example.com",
    );
    expect(within(dialog).getByTestId("notify.subject_input")).toHaveValue(
      "Estado de tu factura FAC-0001",
    );

    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(notifyCustomerMock.mock.calls[0][0]).toMatchObject({
      customerId: 1n,
      source: NotificationSource.invoice,
      referenceId: 1n,
    });
    expect(
      await within(dialog).findByTestId("notify.success_state"),
    ).toHaveTextContent("ada@example.com");
  });

  it("blocks the notify send when the customer has no registered email", async () => {
    listInvoicesMock.mockResolvedValue(page([invoice()]));
    getCustomerMock.mockResolvedValue({ ...customer(), email: undefined });
    renderWithProviders(<InvoicesPage />);

    await screen.findByText("FAC-0001");
    await userEvent.click(screen.getByTestId("invoices.notify_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(
      within(dialog).getByTestId("notify.no_email_state"),
    ).toBeInTheDocument();
    expect(within(dialog).getByTestId("notify.submit_button")).toBeDisabled();
    expect(notifyCustomerMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the WhatsApp action on the invoice list -----------
  //
  // The accepted change adds an "Enviar por WhatsApp" action beside the email
  // action. This test protects the page wiring: the row action asks the backend
  // for the invoice's customer with the invoice context and reference, and
  // opens WhatsApp with the draft.

  it("opens WhatsApp for the invoice's customer with the invoice context", async () => {
    listInvoicesMock.mockResolvedValue(page([invoice()]));
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<InvoicesPage />);

      await screen.findByText("FAC-0001");
      await userEvent.click(screen.getByTestId("invoices.whatsapp_button.1"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 1n,
        context: WhatsAppContext.invoice,
        referenceId: 1n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573000000000");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the invoice's customer has no phone registered", async () => {
    listInvoicesMock.mockResolvedValue(page([invoice()]));
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<InvoicesPage />);

    await screen.findByText("FAC-0001");
    await userEvent.click(screen.getByTestId("invoices.whatsapp_button.1"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
