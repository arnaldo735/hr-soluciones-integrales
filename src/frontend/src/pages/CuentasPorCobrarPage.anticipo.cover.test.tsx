import type { Receivable, ReceivableSummary } from "@/lib/types";
import { ReceivableStatus } from "@/lib/types";
import { CuentasPorCobrarPage } from "@/pages/CuentasPorCobrarPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted "anticipo" change on Cuentas por Cobrar.
 *
 * The accepted behavior: the pending balance of a credit invoice excludes the
 * anticipo applied (and the abonos), so the portfolio shows the saldo a cobrar
 * the backend computed and the abono form caps at that reduced balance.
 *
 * The backend actor is mocked; the real canister is not exercised here. The
 * backend's own balance arithmetic (total − anticipo − abonos) is outside this
 * file's reach; this test only asserts the page renders and enforces the
 * balance it is given.
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

/**
 * A credit invoice whose $ 6.000 total was discounted by a $ 2.000 anticipo, so
 * the backend reports a $ 4.000 balance (the saldo a cobrar).
 */
function receivable(overrides: Partial<Receivable> = {}): Receivable {
  return {
    invoiceId: 1n,
    invoiceNumber: "FAC-0001",
    customerId: 7n,
    customerName: "Ana Pérez",
    status: ReceivableStatus.pending,
    total: 600000n,
    paidAmount: 0n,
    balance: 400000n,
    dueDate: TS,
    issuedAt: TS,
    ...overrides,
  };
}

function summary(
  overrides: Partial<ReceivableSummary> = {},
): ReceivableSummary {
  return {
    totalOutstanding: 400000n,
    totalOverdue: 0n,
    openCount: 1n,
    ...overrides,
  };
}

describe("CuentasPorCobrarPage anticipo (cover)", () => {
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

  it("shows the saldo pendiente that already excludes the anticipo", async () => {
    renderWithProviders(<CuentasPorCobrarPage />);

    const table = await screen.findByTestId("receivables.table");
    const row = await within(table).findByTestId("receivables.row.1");
    // The saldo pendiente cell shows the balance the backend computed
    // (total − anticipo), while the Monto total column still shows the gross
    // total.
    const balanceCell = within(row).getByTitle(
      "Saldo pendiente = total − anticipo aplicado − abonos registrados",
    );
    expect(balanceCell).toHaveTextContent("$ 4.000");
    expect(row).toHaveTextContent("$ 6.000");
  });

  it("caps the abono at the balance that excludes the anticipo", async () => {
    renderWithProviders(<CuentasPorCobrarPage />);

    await userEvent.click(
      await screen.findByTestId("receivables.save_button.1"),
    );
    const dialog = await screen.findByTestId("receivables.payment_dialog");

    // The dialog states the reduced balance and explains it excludes the
    // anticipo.
    expect(dialog).toHaveTextContent("Saldo pendiente $ 4.000");
    expect(dialog).toHaveTextContent("ya excluye el anticipo");

    // An abono above the reduced balance is rejected without calling the
    // backend.
    await userEvent.type(
      within(dialog).getByTestId("receivables.amount_input"),
      "5000",
    );
    await userEvent.click(
      within(dialog).getByTestId("receivables.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("receivables.form_error"),
    ).toHaveTextContent("saldo pendiente");
    expect(registerReceivablePaymentMock).not.toHaveBeenCalled();
  });

  it("accepts an abono within the reduced balance", async () => {
    registerReceivablePaymentMock.mockResolvedValue({
      id: 51n,
      invoiceId: 1n,
      amount: 400000n,
      method: "cash",
      note: "Abono",
      at: TS,
      performedBy: undefined as never,
    });
    renderWithProviders(<CuentasPorCobrarPage />);

    await userEvent.click(
      await screen.findByTestId("receivables.save_button.1"),
    );
    const dialog = await screen.findByTestId("receivables.payment_dialog");
    await userEvent.type(
      within(dialog).getByTestId("receivables.amount_input"),
      "4000",
    );
    await userEvent.click(
      within(dialog).getByTestId("receivables.submit_button"),
    );

    await waitFor(() =>
      expect(registerReceivablePaymentMock).toHaveBeenCalledTimes(1),
    );
    // The hook calls the actor as (token, input).
    expect(registerReceivablePaymentMock.mock.calls[0][1]).toMatchObject({
      invoiceId: 1n,
      amount: 400000n,
    });
  });
});
