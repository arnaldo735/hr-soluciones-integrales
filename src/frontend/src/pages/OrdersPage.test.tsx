import type {
  Customer,
  CustomerNotificationResult,
  Motorcycle,
  OrderPage,
  OrderView,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  NotificationSource,
  OrderStatus,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { OrdersPage } from "@/pages/OrdersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listOrdersMock = vi.fn();
const getCustomerMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const notifyCustomerMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();

// The accepted change makes the order list URL-driven: the status filter and
// the debounced search term live in the URL. `useSearch` reads a mutable object
// the tests reset per case, and `useNavigate` applies the search patch the page
// passes. A real router re-renders the route on navigation, so the mock store
// notifies subscribers and `useSearch` reads it through `useSyncExternalStore`;
// without that the page would keep rendering the stale query and never issue
// the backend call the tests assert on.
let searchParams: Record<string, unknown> = {};
const searchListeners = new Set<() => void>();

function setSearchParams(next: Record<string, unknown>) {
  searchParams = next;
  for (const listener of searchListeners) listener();
}

const navigateMock = vi.fn(
  (options: {
    search?:
      | Record<string, unknown>
      | ((previous: Record<string, unknown>) => Record<string, unknown>);
  }) => {
    if (typeof options.search === "function") {
      setSearchParams(options.search(searchParams));
    } else if (options.search) {
      setSearchParams(options.search);
    }
  },
);

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listOrders: listOrdersMock,
      getCustomer: getCustomerMock,
      listMotorcycles: listMotorcyclesMock,
      notifyCustomer: notifyCustomerMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  useSearch: () =>
    useSyncExternalStore(
      (listener) => {
        searchListeners.add(listener);
        return () => searchListeners.delete(listener);
      },
      () => searchParams,
    ),
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
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function orderView(overrides: Partial<OrderView["order"]> = {}): OrderView {
  return {
    order: {
      id: 7n,
      status: OrderStatus.inRepair,
      createdAt: 1_700_000_000_000_000_000n,
      statusHistory: [],
      labor: [],
      updatedAt: 1_700_000_000_000_000_000n,
      motorcycleId: 3n,
      customerId: 1n,
      parts: [],
      intakeMileage: 12_000n,
      orderNumber: "OT-0007",
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

function orderPage(items: OrderView[], total = items.length): OrderPage {
  return { items, total: BigInt(total), offset: 0n, limit: 10n };
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
    message: "Hola Ada, tu orden OT-0007 está lista.",
    ...overrides,
  };
}

describe("OrdersPage", () => {
  beforeEach(() => {
    listOrdersMock.mockReset();
    getCustomerMock.mockReset();
    listMotorcyclesMock.mockReset();
    notifyCustomerMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    navigateMock.mockClear();
    searchListeners.clear();
    searchParams = {};
    getCustomerMock.mockResolvedValue(customer());
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("lists orders with customer, plate, status and total", async () => {
    listOrdersMock.mockResolvedValue(orderPage([orderView()]));
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("OT-0007")).toBeInTheDocument();
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(await screen.findByText("ABC12D")).toBeInTheDocument();
    const row = screen.getByTestId("orders.row.1");
    expect(within(row).getByText("En reparación")).toBeInTheDocument();
    expect(within(row).getByText("$ 580")).toBeInTheDocument();
    expect(screen.getByTestId("orders.table")).toBeInTheDocument();
  });

  it("falls back to id placeholders when lookups are unavailable", async () => {
    listOrdersMock.mockResolvedValue(orderPage([orderView()]));
    getCustomerMock.mockResolvedValue(null);
    listMotorcyclesMock.mockResolvedValue([]);
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByText("OT-0007")).toBeInTheDocument();
    expect(screen.getByText("Cliente #1")).toBeInTheDocument();
    expect(screen.getByText("Moto #3")).toBeInTheDocument();
  });

  it("renders the empty state when there are no orders", async () => {
    listOrdersMock.mockResolvedValue(orderPage([]));
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByTestId("orders.empty_state")).toBeInTheDocument();
    expect(screen.getByText("Aún no hay órdenes")).toBeInTheDocument();
  });

  it("renders the error state and retries on demand", async () => {
    listOrdersMock.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<OrdersPage />);

    expect(await screen.findByTestId("orders.error_state")).toBeInTheDocument();
    expect(
      screen.getByText("No se pudieron cargar las órdenes"),
    ).toBeInTheDocument();

    listOrdersMock.mockResolvedValue(orderPage([orderView()]));
    await userEvent.click(screen.getByTestId("orders.retry_button"));
    expect(await screen.findByText("OT-0007")).toBeInTheDocument();
  });

  it("filters by status through the backend filter", async () => {
    listOrdersMock.mockResolvedValue(orderPage([]));
    renderWithProviders(<OrdersPage />);

    await waitFor(() => expect(listOrdersMock).toHaveBeenCalled());
    await userEvent.click(screen.getByTestId("orders.filter.ready"));

    await waitFor(() =>
      expect(listOrdersMock).toHaveBeenLastCalledWith(
        { status: OrderStatus.ready, search: undefined },
        0n,
        10n,
      ),
    );
  });

  it("shows pagination summary and disables prev on the first page", async () => {
    listOrdersMock.mockResolvedValue(orderPage([orderView()], 25));
    renderWithProviders(<OrdersPage />);

    await screen.findByText("OT-0007");
    expect(screen.getByTestId("orders.pagination.summary")).toHaveTextContent(
      "1–10 de 25",
    );
    expect(screen.getByTestId("orders.pagination_prev")).toBeDisabled();
    expect(screen.getByTestId("orders.pagination_next")).toBeEnabled();
  });

  // --- Characterization: the search term the URL change must keep -----------
  //
  // The accepted change reflects the search term in the URL. This test protects
  // the surrounding working behavior instead: the debounced term still reaches
  // the backend as the `search` filter. It never asserts the URL, because that
  // is exactly what is changing.

  it("passes the debounced search term to the backend filter", async () => {
    listOrdersMock.mockResolvedValue(orderPage([]));
    renderWithProviders(<OrdersPage />);

    await waitFor(() => expect(listOrdersMock).toHaveBeenCalled());

    await userEvent.type(screen.getByTestId("orders.search_input"), "frenos");

    await waitFor(
      () =>
        expect(listOrdersMock).toHaveBeenLastCalledWith(
          { status: undefined, search: "frenos" },
          0n,
          10n,
        ),
      { timeout: 2000 },
    );
  });

  // --- Characterization: the notify button journey --------------------------
  //
  // The accepted change adds a "Notificar al cliente" action to the order list.
  // The dialog component is covered in isolation; this test protects the page
  // wiring around it: the row action opens the dialog for that order's customer,
  // the recipient is the customer's registered email, and sending reaches the
  // backend with the customer, the order source and the order reference.

  it("opens the notify dialog for the order's customer and sends to the registered email", async () => {
    listOrdersMock.mockResolvedValue(orderPage([orderView()]));
    notifyCustomerMock.mockResolvedValue(notificationResult());
    renderWithProviders(<OrdersPage />);

    await screen.findByText("OT-0007");
    await userEvent.click(screen.getByTestId("orders.notify_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    // The recipient is the customer's registered email, not an editable field.
    expect(within(dialog).getByTestId("notify.recipient_input")).toHaveValue(
      "ada@example.com",
    );
    // The draft is prefilled with the order number.
    expect(within(dialog).getByTestId("notify.subject_input")).toHaveValue(
      "Estado de tu orden OT-0007",
    );

    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(notifyCustomerMock.mock.calls[0][0]).toMatchObject({
      customerId: 1n,
      source: NotificationSource.order,
      referenceId: 7n,
    });
    expect(
      await within(dialog).findByTestId("notify.success_state"),
    ).toHaveTextContent("ada@example.com");
  });

  it("blocks the notify send when the customer has no registered email", async () => {
    listOrdersMock.mockResolvedValue(orderPage([orderView()]));
    getCustomerMock.mockResolvedValue({ ...customer(), email: undefined });
    renderWithProviders(<OrdersPage />);

    await screen.findByText("OT-0007");
    await userEvent.click(screen.getByTestId("orders.notify_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(
      within(dialog).getByTestId("notify.no_email_state"),
    ).toBeInTheDocument();
    expect(within(dialog).getByTestId("notify.submit_button")).toBeDisabled();
    expect(notifyCustomerMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the WhatsApp action on the order list -------------
  //
  // The accepted change adds an "Enviar por WhatsApp" action to the order list.
  // The shared button is covered in isolation; this test protects the page
  // wiring around it: the row action asks the backend for the order's customer
  // with the order context and reference, and opens WhatsApp with the draft.

  it("opens WhatsApp for the order's customer with the order context", async () => {
    listOrdersMock.mockResolvedValue(orderPage([orderView()]));
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<OrdersPage />);

      await screen.findByText("OT-0007");
      await userEvent.click(screen.getByTestId("orders.whatsapp_button.1"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 1n,
        context: WhatsAppContext.order,
        referenceId: 7n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573000000000");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the order's customer has no phone registered", async () => {
    listOrdersMock.mockResolvedValue(orderPage([orderView()]));
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<OrdersPage />);

    await screen.findByText("OT-0007");
    await userEvent.click(screen.getByTestId("orders.whatsapp_button.1"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
