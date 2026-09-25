import type {
  Customer,
  CustomerNotificationResult,
  Motorcycle,
  QuotePage,
  QuoteView,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  NotificationSource,
  QuoteSort,
  QuoteStatus,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { QuotesPage } from "@/pages/QuotesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the quote list's existing email notification.
 *
 * The accepted change adds a "Enviar por WhatsApp" action next to the existing
 * email action on this page. These tests protect the behavior that must survive
 * it: the row action opens the shared "Notificar al cliente" dialog for that
 * quote's customer, the recipient is the customer's registered email, and
 * sending reaches the backend with the customer, the quote source and the quote
 * reference. They never assert the absence of a WhatsApp action.
 */

const listQuotesMock = vi.fn();
const getCustomerMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const notifyCustomerMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listQuotes: listQuotesMock,
      getCustomer: getCustomerMock,
      listMotorcycles: listMotorcyclesMock,
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
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function quoteView(overrides: Partial<QuoteView["quote"]> = {}): QuoteView {
  return {
    quote: {
      id: 9n,
      status: QuoteStatus.sent,
      serviceLines: [],
      createdAt: 1_700_000_000_000_000_000n,
      quoteNumber: "COT-0009",
      updatedAt: 1_700_000_000_000_000_000n,
      discount: 0n,
      motorcycleId: 3n,
      customerId: 1n,
      partLines: [],
      taxRate: 16n,
      ...overrides,
    },
    totals: {
      tax: 8000n,
      total: 58000n,
      taxableBase: 50000n,
      servicesSubtotal: 0n,
      partsSubtotal: 50000n,
      discount: 0n,
      taxRate: 16n,
      subtotal: 50000n,
    },
  };
}

function quotePage(items: QuoteView[], total = items.length): QuotePage {
  return { items, total: BigInt(total), offset: 0n, limit: 20n };
}

function customer(): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 000 0000",
    email: "ada@example.com",
    document: "LOAA1815",
    createdAt: 1_700_000_000_000_000_000n,
  };
}

function motorcycle(): Motorcycle {
  return {
    id: 3n,
    model: "MT-07",
    mileage: 12_000n,
    createdAt: 1_700_000_000_000_000_000n,
    year: 2021n,
    customerId: 1n,
    brand: "Yamaha",
    plate: "ABC12D",
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
    message: "Hola Ada, te compartimos la cotización COT-0009.",
    ...overrides,
  };
}

describe("QuotesPage", () => {
  beforeEach(() => {
    listQuotesMock.mockReset();
    getCustomerMock.mockReset();
    listMotorcyclesMock.mockReset();
    notifyCustomerMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getCustomerMock.mockResolvedValue(customer());
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("lists quotes with number, customer and totals", async () => {
    listQuotesMock.mockResolvedValue(quotePage([quoteView()]));
    renderWithProviders(<QuotesPage />);

    expect(await screen.findByText("COT-0009")).toBeInTheDocument();
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ABC12D")).toBeInTheDocument();
  });

  it("renders the empty state when there are no quotes", async () => {
    listQuotesMock.mockResolvedValue(quotePage([]));
    renderWithProviders(<QuotesPage />);

    expect(await screen.findByTestId("quotes.empty_state")).toBeInTheDocument();
  });

  // --- Characterization: the existing email notify journey ------------------
  //
  // The accepted change adds a WhatsApp action beside the email action. This
  // test protects the email wiring around it: the row action opens the dialog
  // for that quote's customer, the recipient is the registered email, and the
  // send carries the customer, the quote source and the quote reference.

  it("opens the notify dialog for the quote's customer and sends to the registered email", async () => {
    listQuotesMock.mockResolvedValue(quotePage([quoteView()]));
    notifyCustomerMock.mockResolvedValue(notificationResult());
    renderWithProviders(<QuotesPage />);

    await screen.findByText("COT-0009");
    await userEvent.click(screen.getByTestId("quotes.save_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(within(dialog).getByTestId("notify.recipient_input")).toHaveValue(
      "ada@example.com",
    );
    expect(within(dialog).getByTestId("notify.subject_input")).toHaveValue(
      "Estado de tu cotización COT-0009",
    );

    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(notifyCustomerMock.mock.calls[0][0]).toMatchObject({
      customerId: 1n,
      source: NotificationSource.quote,
      referenceId: 9n,
    });
    expect(
      await within(dialog).findByTestId("notify.success_state"),
    ).toHaveTextContent("ada@example.com");
  });

  it("blocks the notify send when the customer has no registered email", async () => {
    listQuotesMock.mockResolvedValue(quotePage([quoteView()]));
    getCustomerMock.mockResolvedValue({ ...customer(), email: undefined });
    renderWithProviders(<QuotesPage />);

    await screen.findByText("COT-0009");
    await userEvent.click(screen.getByTestId("quotes.save_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(
      within(dialog).getByTestId("notify.no_email_state"),
    ).toBeInTheDocument();
    expect(within(dialog).getByTestId("notify.submit_button")).toBeDisabled();
    expect(notifyCustomerMock).not.toHaveBeenCalled();
  });

  it("passes the selected sort to the backend", async () => {
    listQuotesMock.mockResolvedValue(quotePage([]));
    renderWithProviders(<QuotesPage />);

    await waitFor(() => expect(listQuotesMock).toHaveBeenCalled());
    expect(listQuotesMock).toHaveBeenLastCalledWith(
      { status: undefined, search: undefined },
      QuoteSort.createdAt,
      0n,
      20n,
    );
  });

  // --- Accepted behavior: the WhatsApp action on the quote list -------------
  //
  // The accepted change adds an "Enviar por WhatsApp" action beside the email
  // action. This test protects the page wiring: the row action asks the backend
  // for the quote's customer with the quote context and reference, and opens
  // WhatsApp with the draft.

  it("opens WhatsApp for the quote's customer with the quote context", async () => {
    listQuotesMock.mockResolvedValue(quotePage([quoteView()]));
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<QuotesPage />);

      await screen.findByText("COT-0009");
      await userEvent.click(screen.getByTestId("quotes.whatsapp_button.1"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 1n,
        context: WhatsAppContext.quote,
        referenceId: 9n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573000000000");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the quote's customer has no phone registered", async () => {
    listQuotesMock.mockResolvedValue(quotePage([quoteView()]));
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<QuotesPage />);

    await screen.findByText("COT-0009");
    await userEvent.click(screen.getByTestId("quotes.whatsapp_button.1"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
