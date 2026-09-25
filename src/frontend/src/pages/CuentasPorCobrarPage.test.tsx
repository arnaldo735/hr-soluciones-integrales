import type {
  Receivable,
  ReceivablePayment,
  ReceivableSummary,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  ReceivableStatus,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { CuentasPorCobrarPage } from "@/pages/CuentasPorCobrarPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted "Cuentas por cobrar" view.
 *
 * The page lists credit-invoice balances with a summary, a status filter, a
 * search box and a "Registrar abono" action. These tests assert the observable
 * behavior: the summary cards, the listed balances, the filter and search
 * reaching the backend, and an abono reducing the pending balance and updating
 * the status.
 */

const listReceivablesMock = vi.fn();
const getReceivableSummaryMock = vi.fn();
const registerReceivablePaymentMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listReceivables: listReceivablesMock,
      getReceivableSummary: getReceivableSummaryMock,
      registerReceivablePayment: registerReceivablePaymentMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
    },
    isFetching: false,
  }),
}));

// The page keeps its filter and search in the URL, so the router mock holds a
// small external store: `navigate` writes into it and `useSearch` subscribes to
// it, so a navigation re-renders the page the same way a real router would.
const routerStore = (() => {
  let search: Record<string, unknown> = {};
  const listeners = new Set<() => void>();
  return {
    get: () => search,
    set(next: Record<string, unknown>) {
      search = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
})();

const navigateMock = vi.fn(
  (options: {
    search?:
      | Record<string, unknown>
      | ((previous: Record<string, unknown>) => Record<string, unknown>);
  }) => {
    const next = options.search;
    routerStore.set(
      typeof next === "function" ? next(routerStore.get()) : (next ?? {}),
    );
  },
);

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
  useNavigate: () => navigateMock,
  useSearch: () => useSyncExternalStore(routerStore.subscribe, routerStore.get),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

function receivable(overrides: Partial<Receivable> = {}): Receivable {
  return {
    invoiceId: 1n,
    invoiceNumber: "FAC-0001",
    customerId: 7n,
    customerName: "Ana Pérez",
    status: ReceivableStatus.pending,
    total: 500000n,
    paidAmount: 200000n,
    balance: 300000n,
    dueDate: TS,
    issuedAt: TS,
    ...overrides,
  };
}

function summary(
  overrides: Partial<ReceivableSummary> = {},
): ReceivableSummary {
  return {
    totalOutstanding: 300000n,
    totalOverdue: 0n,
    openCount: 1n,
    ...overrides,
  };
}

function payment(
  overrides: Partial<ReceivablePayment> = {},
): ReceivablePayment {
  return {
    id: 51n,
    invoiceId: 1n,
    amount: 300000n,
    method: "cash",
    note: "Abono en efectivo",
    at: TS,
    performedBy: undefined as never,
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
    message:
      "Hola Ana, le recordamos el saldo pendiente de la factura FAC-0001.",
    ...overrides,
  };
}

describe("CuentasPorCobrarPage", () => {
  beforeEach(() => {
    listReceivablesMock.mockReset();
    getReceivableSummaryMock.mockReset();
    registerReceivablePaymentMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    navigateMock.mockClear();
    routerStore.set({});

    listReceivablesMock.mockResolvedValue([receivable()]);
    getReceivableSummaryMock.mockResolvedValue(summary());
  });

  it("shows the portfolio summary cards", async () => {
    getReceivableSummaryMock.mockResolvedValue(
      summary({
        totalOutstanding: 300000n,
        totalOverdue: 50000n,
        openCount: 2n,
      }),
    );
    renderWithProviders(<CuentasPorCobrarPage />);

    const section = await screen.findByTestId("receivables.summary.section");
    expect(within(section).getByText("Total por cobrar")).toBeInTheDocument();
    expect(await within(section).findByText("$ 3.000")).toBeInTheDocument();
    expect(within(section).getByText("Total vencido")).toBeInTheDocument();
    expect(await within(section).findByText("$ 500")).toBeInTheDocument();
    expect(within(section).getByText("Facturas abiertas")).toBeInTheDocument();
    expect(await within(section).findByText("2")).toBeInTheDocument();
  });

  it("lists the pending balances with customer, invoice and status", async () => {
    renderWithProviders(<CuentasPorCobrarPage />);

    const table = await screen.findByTestId("receivables.table");
    expect(within(table).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(table).getByText("FAC-0001")).toBeInTheDocument();
    expect(within(table).getByText("$ 3.000")).toBeInTheDocument();
    expect(within(table).getByText("Pendiente")).toBeInTheDocument();
  });

  it("shows the due date column for each credit invoice", async () => {
    // The accepted list must carry the balance, the due date and the status of
    // every credit invoice. The due date is the first installment of the plan,
    // so it renders as a real formatted date rather than the empty placeholder.
    renderWithProviders(<CuentasPorCobrarPage />);

    const table = await screen.findByTestId("receivables.table");
    expect(within(table).getByText("Vencimiento")).toBeInTheDocument();

    const row = await within(table).findByTestId("receivables.row.1");
    // The due date is formatted (a year is present), not the "—" placeholder.
    expect(row).toHaveTextContent(/\d{4}/);
    expect(row).not.toHaveTextContent("—");
  });

  it("passes the selected status filter to the backend", async () => {
    renderWithProviders(<CuentasPorCobrarPage />);

    await userEvent.click(
      await screen.findByTestId("receivables.filter.overdue"),
    );

    await waitFor(() =>
      expect(listReceivablesMock).toHaveBeenLastCalledWith({
        status: ReceivableStatus.overdue,
        search: undefined,
      }),
    );
  });

  it("passes the debounced search term to the backend", async () => {
    renderWithProviders(<CuentasPorCobrarPage />);

    await userEvent.type(
      await screen.findByTestId("receivables.search_input"),
      "Ana",
    );

    await waitFor(
      () =>
        expect(listReceivablesMock).toHaveBeenLastCalledWith({
          status: undefined,
          search: "Ana",
        }),
      { timeout: 2000 },
    );
  });

  it("registers an abono in cents and reduces the pending balance", async () => {
    registerReceivablePaymentMock.mockResolvedValue(payment());
    // The first read is the pending balance; after the abono the refetch
    // returns the settled balance and the paid status.
    listReceivablesMock
      .mockResolvedValueOnce([receivable()])
      .mockResolvedValue([
        receivable({
          status: ReceivableStatus.paid,
          paidAmount: 500000n,
          balance: 0n,
        }),
      ]);
    renderWithProviders(<CuentasPorCobrarPage />);

    await userEvent.click(
      await screen.findByTestId("receivables.save_button.1"),
    );

    const dialog = await screen.findByTestId("receivables.payment_dialog");
    await userEvent.type(
      within(dialog).getByTestId("receivables.amount_input"),
      "3000",
    );
    await userEvent.click(
      within(dialog).getByTestId("receivables.submit_button"),
    );

    await waitFor(() =>
      expect(registerReceivablePaymentMock).toHaveBeenCalledTimes(1),
    );
    expect(registerReceivablePaymentMock.mock.calls[0][0]).toMatchObject({
      invoiceId: 1n,
      amount: 300000n,
      method: "cash",
    });

    // The list is refetched and the row now shows the settled balance.
    const table = await screen.findByTestId("receivables.table");
    await waitFor(() =>
      expect(within(table).getByText("Pagada")).toBeInTheDocument(),
    );
    expect(within(table).getByText("$ 0")).toBeInTheDocument();
  });

  it("blocks an abono above the pending balance and does not call the backend", async () => {
    renderWithProviders(<CuentasPorCobrarPage />);

    await userEvent.click(
      await screen.findByTestId("receivables.save_button.1"),
    );
    const dialog = await screen.findByTestId("receivables.payment_dialog");
    await userEvent.type(
      within(dialog).getByTestId("receivables.amount_input"),
      "9999",
    );
    await userEvent.click(
      within(dialog).getByTestId("receivables.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("receivables.form_error"),
    ).toHaveTextContent("saldo pendiente");
    expect(registerReceivablePaymentMock).not.toHaveBeenCalled();
  });

  it("clears the filters and returns to the unfiltered list", async () => {
    renderWithProviders(<CuentasPorCobrarPage />);

    await userEvent.click(
      await screen.findByTestId("receivables.filter.overdue"),
    );
    await waitFor(() =>
      expect(listReceivablesMock).toHaveBeenLastCalledWith({
        status: ReceivableStatus.overdue,
        search: undefined,
      }),
    );

    await userEvent.click(
      screen.getByTestId("receivables.clear_filters_button"),
    );

    await waitFor(() =>
      expect(listReceivablesMock).toHaveBeenLastCalledWith({
        status: undefined,
        search: undefined,
      }),
    );
  });

  // --- Accepted behavior: the WhatsApp action on the receivables list -------
  //
  // The accepted change adds an "Enviar por WhatsApp" action to the portfolio.
  // This test protects the page wiring: the row action asks the backend for the
  // invoice's customer with the receivable context and the invoice reference,
  // and opens WhatsApp with the draft.

  it("opens WhatsApp for the receivable's customer with the receivable context", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<CuentasPorCobrarPage />);

      await screen.findByTestId("receivables.table");
      await userEvent.click(
        screen.getByTestId("receivables.whatsapp_button.1"),
      );

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 7n,
        context: WhatsAppContext.receivable,
        referenceId: 1n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573001112222");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the receivable's customer has no phone registered", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<CuentasPorCobrarPage />);

    await screen.findByTestId("receivables.table");
    await userEvent.click(screen.getByTestId("receivables.whatsapp_button.1"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
