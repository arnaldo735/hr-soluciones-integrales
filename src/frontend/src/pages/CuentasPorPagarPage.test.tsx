import type { Payable, Payment, Purchase } from "@/lib/types";
import { PayableStatus, PaymentMethod } from "@/lib/types";
import { CuentasPorPagarPage } from "@/pages/CuentasPorPagarPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted "Cuentas por pagar" view.
 *
 * The page derives supplier balances from registered purchases, shows a
 * client-side summary, filters by status and by supplier/reference, and
 * registers a payment against a supplier balance. These tests assert the
 * observable behavior: the summary totals, the listed balances with their
 * purchase reference, the status filter, the search, and a payment in cents
 * that reaches the backend with the supplier id.
 */

const listPayablesMock = vi.fn();
const listPurchasesMock = vi.fn();
const registerPaymentMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listPayables: listPayablesMock,
      listPurchases: listPurchasesMock,
      registerPayment: registerPaymentMock,
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

function payable(overrides: Partial<Payable> = {}): Payable {
  return {
    supplierId: 1n,
    supplierName: "Repuestos del Norte",
    status: PayableStatus.pending,
    totalPurchased: 800000n,
    totalPaid: 300000n,
    balance: 500000n,
    dueDate: TS,
    ...overrides,
  };
}

function purchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 42n,
    supplierId: 1n,
    total: 800000n,
    paidAmount: 300000n,
    createdAt: TS,
    items: [],
    ...overrides,
  };
}

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 9n,
    supplierId: 1n,
    amount: 500000n,
    method: PaymentMethod.cash,
    note: "Pago en efectivo",
    purchaseId: 42n,
    at: TS,
    performedBy: undefined as never,
    ...overrides,
  };
}

describe("CuentasPorPagarPage", () => {
  beforeEach(() => {
    listPayablesMock.mockReset();
    listPurchasesMock.mockReset();
    registerPaymentMock.mockReset();
    navigateMock.mockClear();
    routerStore.set({});

    listPayablesMock.mockResolvedValue([payable()]);
    listPurchasesMock.mockResolvedValue([purchase()]);
  });

  it("shows the summary totals derived from the payables", async () => {
    listPayablesMock.mockResolvedValue([
      payable({ supplierId: 1n, balance: 500000n }),
      payable({
        supplierId: 2n,
        supplierName: "Lubricantes Sur",
        status: PayableStatus.overdue,
        balance: 200000n,
      }),
      payable({
        supplierId: 3n,
        supplierName: "Frenos Andinos",
        status: PayableStatus.paid,
        balance: 0n,
      }),
    ]);
    renderWithProviders(<CuentasPorPagarPage />);

    const section = await screen.findByTestId("payables.summary");
    expect(within(section).getByText("Total por pagar")).toBeInTheDocument();
    expect(await within(section).findByText("$ 7.000")).toBeInTheDocument();
    expect(within(section).getByText("Total vencido")).toBeInTheDocument();
    expect(await within(section).findByText("$ 2.000")).toBeInTheDocument();
    expect(within(section).getByText("Cuentas abiertas")).toBeInTheDocument();
    expect(await within(section).findByText("2")).toBeInTheDocument();
  });

  it("lists the supplier balance with its purchase reference and status", async () => {
    renderWithProviders(<CuentasPorPagarPage />);

    const table = await screen.findByTestId("payables.table");
    expect(within(table).getByText("Repuestos del Norte")).toBeInTheDocument();
    expect(within(table).getByText("#42")).toBeInTheDocument();
    expect(within(table).getByText("$ 8.000")).toBeInTheDocument();
    expect(within(table).getByText("$ 5.000")).toBeInTheDocument();
    expect(within(table).getByText("Pendiente")).toBeInTheDocument();
  });

  it("shows the due date column for each supplier balance", async () => {
    // The accepted list must carry the balance, the due date and the status of
    // every supplier account. The due date is derived from the pending purchase
    // plus the credit term, so it renders as a real formatted date.
    renderWithProviders(<CuentasPorPagarPage />);

    const table = await screen.findByTestId("payables.table");
    expect(within(table).getByText("Vencimiento")).toBeInTheDocument();

    const row = await within(table).findByTestId("payables.row.1");
    // The due date is formatted (a year is present), not the "—" placeholder.
    expect(row).toHaveTextContent(/\d{4}/);
  });

  it("filters the listed balances by status", async () => {
    listPayablesMock.mockResolvedValue([
      payable({ supplierId: 1n, supplierName: "Repuestos del Norte" }),
      payable({
        supplierId: 2n,
        supplierName: "Lubricantes Sur",
        status: PayableStatus.overdue,
      }),
    ]);
    renderWithProviders(<CuentasPorPagarPage />);

    await screen.findByTestId("payables.table");
    await userEvent.click(await screen.findByTestId("payables.filter.overdue"));

    const table = await screen.findByTestId("payables.table");
    expect(within(table).getByText("Lubricantes Sur")).toBeInTheDocument();
    expect(
      within(table).queryByText("Repuestos del Norte"),
    ).not.toBeInTheDocument();
  });

  it("filters the listed balances by supplier name", async () => {
    listPayablesMock.mockResolvedValue([
      payable({ supplierId: 1n, supplierName: "Repuestos del Norte" }),
      payable({ supplierId: 2n, supplierName: "Lubricantes Sur" }),
    ]);
    renderWithProviders(<CuentasPorPagarPage />);

    await screen.findByTestId("payables.table");
    await userEvent.type(
      await screen.findByTestId("payables.search_input"),
      "Lubricantes",
    );

    await waitFor(() => {
      const table = screen.getByTestId("payables.table");
      expect(within(table).getByText("Lubricantes Sur")).toBeInTheDocument();
      expect(
        within(table).queryByText("Repuestos del Norte"),
      ).not.toBeInTheDocument();
    });
  });

  it("registers a payment in cents against the supplier balance", async () => {
    registerPaymentMock.mockResolvedValue(payment());
    renderWithProviders(<CuentasPorPagarPage />);

    await userEvent.click(await screen.findByTestId("payables.pay_button.1"));

    const dialog = await screen.findByTestId("payables.payment_dialog");
    await userEvent.type(
      within(dialog).getByTestId("payables.payment_amount_input"),
      "2000",
    );
    await userEvent.click(
      within(dialog).getByTestId("payables.payment_submit_button"),
    );

    await waitFor(() => expect(registerPaymentMock).toHaveBeenCalledTimes(1));
    expect(registerPaymentMock.mock.calls[0][0]).toMatchObject({
      supplierId: 1n,
      amount: 200000n,
      method: PaymentMethod.cash,
    });
  });

  it("blocks a payment above the pending balance and does not call the backend", async () => {
    renderWithProviders(<CuentasPorPagarPage />);

    await userEvent.click(await screen.findByTestId("payables.pay_button.1"));
    const dialog = await screen.findByTestId("payables.payment_dialog");
    await userEvent.clear(
      within(dialog).getByTestId("payables.payment_amount_input"),
    );
    await userEvent.type(
      within(dialog).getByTestId("payables.payment_amount_input"),
      "9999",
    );
    await userEvent.click(
      within(dialog).getByTestId("payables.payment_submit_button"),
    );

    expect(
      await within(dialog).findByTestId("payables.payment_error"),
    ).toHaveTextContent("saldo pendiente");
    expect(registerPaymentMock).not.toHaveBeenCalled();
  });

  it("disables the pay action for a settled account", async () => {
    listPayablesMock.mockResolvedValue([
      payable({ status: PayableStatus.paid, balance: 0n }),
    ]);
    renderWithProviders(<CuentasPorPagarPage />);

    expect(await screen.findByTestId("payables.pay_button.1")).toBeDisabled();
  });
});
