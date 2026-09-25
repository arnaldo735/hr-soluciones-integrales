import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  CustomerNotificationResult,
  PartView,
  PosSale,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  NotificationSource,
  PaymentCondition,
  PaymentMethod,
  TaxResponsibility,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { PosPage } from "@/pages/PosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS customer seam.
 *
 * The accepted change adds a live customer search and a quick-create form to
 * the counter POS. These tests protect the surrounding working behavior that
 * must survive it: the customer list is loaded from the backend, the dropdown
 * offers every registered customer, and the customer chosen for a cash sale is
 * carried in the payload. They never assert the new search or quick-create
 * behavior.
 */

const listPartsMock = vi.fn();
const listCustomersMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const createPosSaleMock = vi.fn();
const createCustomerMock = vi.fn();
const notifyCustomerMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listParts: listPartsMock,
      listCustomers: listCustomersMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      createPosSale: createPosSaleMock,
      createCustomer: createCustomerMock,
      notifyCustomer: notifyCustomerMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
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
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 7n,
    name: "Ana Pérez",
    phone: "+57 300 111 2222",
    email: "ana@example.com",
    address: "Calle 1 #2-3",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function business(overrides: Partial<BusinessSettings> = {}): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
    ...overrides,
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

function sale(overrides: Partial<PosSale> = {}): PosSale {
  return {
    id: 1n,
    saleNumber: "POS-0001",
    lines: [
      {
        partId: 1n,
        description: "Balata de freno",
        quantity: 1n,
        unitPrice: 25000n,
        amount: 25000n,
        discount: 0n,
      },
    ],
    subtotal: 25000n,
    discount: 0n,
    taxRate: 16n,
    tax: 4000n,
    total: 29000n,
    amountReceived: 30000n,
    change: 1000n,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
    ...overrides,
  };
}

function notificationResult(
  overrides: Partial<CustomerNotificationResult> = {},
): CustomerNotificationResult {
  return {
    sent: true,
    email: "ana@example.com",
    customerId: 7n,
    ...overrides,
  };
}

function preparedWhatsApp(
  overrides: Partial<WhatsAppMessageResult> = {},
): WhatsAppMessageResult {
  return {
    contactKind: WhatsAppContactKind.customer,
    contactId: 7n,
    contactName: "Ana Pérez",
    hasPhone: true,
    phone: "+57 300 111 2222",
    message: "Hola Ana, le escribimos de Taller HR Motos.",
    ...overrides,
  };
}

describe("PosPage customer seam", () => {
  beforeEach(() => {
    listPartsMock.mockReset();
    listCustomersMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createPosSaleMock.mockReset();
    createCustomerMock.mockReset();
    notifyCustomerMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    listCustomersMock.mockResolvedValue([customer()]);
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("loads the customer list from the backend", async () => {
    renderWithProviders(<PosPage />);

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());
  });

  it("offers every registered customer in the customer dropdown", async () => {
    listCustomersMock.mockResolvedValue([
      customer({ id: 7n, name: "Ana Pérez" }),
      customer({ id: 8n, name: "Carlos Ruiz" }),
    ]);
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.customer_select"));

    expect(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Carlos Ruiz" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Venta de mostrador" }),
    ).toBeInTheDocument();
  });

  it("sends the selected customer with a cash sale", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.click(screen.getByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "300",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    expect(createPosSaleMock.mock.calls[0][0]).toMatchObject({
      paymentCondition: PaymentCondition.cash,
      customerId: 7n,
    });
  });

  it("keeps the counter sale customerless when none is chosen", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "300",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    expect(createPosSaleMock.mock.calls[0][0]).toMatchObject({
      customerId: undefined,
    });
  });

  it("shows the chosen customer on the receipt", async () => {
    createPosSaleMock.mockResolvedValue(sale({ customerName: "Ana Pérez" }));
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.click(screen.getByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "300",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    const receipt = await screen.findByTestId("pos.receipt_a4");
    expect(within(receipt).getByText("Ana Pérez")).toBeInTheDocument();
  });

  it("passes the typed customer search term to the backend", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Ana",
    );

    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith("Ana"),
      { timeout: 2000 },
    );
  });

  it("shows the empty state when the search matches no customer", async () => {
    listCustomersMock.mockImplementation((search: string | null) =>
      Promise.resolve(search ? [] : [customer()]),
    );
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Zzz",
    );

    expect(
      await screen.findByTestId("pos.customer_search_empty_state"),
    ).toHaveTextContent("Sin clientes que coincidan");
  });

  it("registers a new customer from the POS and selects it", async () => {
    const created = customer({ id: 8n, name: "Nuevo Cliente" });
    createCustomerMock.mockResolvedValue(created);
    // Before the create the directory holds only Ana; after the create the
    // refetch returns the new customer too.
    listCustomersMock
      .mockResolvedValueOnce([customer()])
      .mockResolvedValue([customer(), created]);
    renderWithProviders(<PosPage />);

    await userEvent.click(
      await screen.findByTestId("pos.create_customer_button"),
    );

    const dialog = await screen.findByTestId("customer.dialog");
    await userEvent.type(
      within(dialog).getByTestId("customer.name_input"),
      "Nuevo Cliente",
    );
    await userEvent.type(
      within(dialog).getByTestId("customer.phone_input"),
      "3001112222",
    );
    await userEvent.click(within(dialog).getByTestId("customer.submit_button"));

    await waitFor(() => expect(createCustomerMock).toHaveBeenCalledTimes(1));
    expect(createCustomerMock.mock.calls[0][0]).toMatchObject({
      name: "Nuevo Cliente",
      phone: "3001112222",
    });

    // The newly created customer is selected in the POS customer picker.
    await waitFor(() =>
      expect(screen.getByTestId("pos.customer_select")).toHaveTextContent(
        "Nuevo Cliente",
      ),
    );
  });

  // --- Characterization: the existing email notify journey ------------------
  //
  // The accepted change adds a WhatsApp action beside the email action on this
  // page. This test protects the email wiring around it: with a customer
  // selected, the notify action opens the dialog for that customer, the
  // recipient is the registered email, and the send carries the POS source.

  it("opens the notify dialog for the selected customer and sends to their email", async () => {
    notifyCustomerMock.mockResolvedValue(notificationResult());
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );
    await userEvent.click(await screen.findByTestId("pos.notify_button"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(within(dialog).getByTestId("notify.recipient_input")).toHaveValue(
      "ana@example.com",
    );

    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(notifyCustomerMock.mock.calls[0][0]).toMatchObject({
      customerId: 7n,
      source: NotificationSource.pos,
    });
    expect(
      await within(dialog).findByTestId("notify.success_state"),
    ).toHaveTextContent("ana@example.com");
  });

  it("blocks the notify send when the selected customer has no email", async () => {
    listCustomersMock.mockResolvedValue([customer({ email: undefined })]);
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );
    await userEvent.click(await screen.findByTestId("pos.notify_button"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(
      within(dialog).getByTestId("notify.no_email_state"),
    ).toBeInTheDocument();
    expect(within(dialog).getByTestId("notify.submit_button")).toBeDisabled();
    expect(notifyCustomerMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the WhatsApp action on the POS --------------------
  //
  // The accepted change adds an "Enviar por WhatsApp" action beside the email
  // action. This test protects the page wiring: with a customer selected, the
  // action asks the backend for that customer with the service context, and
  // opens WhatsApp with the draft.

  it("opens WhatsApp for the selected customer with the service context", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<PosPage />);

      await userEvent.click(await screen.findByTestId("pos.customer_select"));
      await userEvent.click(
        await screen.findByRole("option", { name: "Ana Pérez" }),
      );
      await userEvent.click(await screen.findByTestId("pos.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 7n,
        context: WhatsAppContext.service,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573001112222");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the selected customer has no phone registered", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );
    await userEvent.click(await screen.findByTestId("pos.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
