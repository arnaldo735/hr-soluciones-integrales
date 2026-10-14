import { useAddOrderPayment, useOrderPayments } from "@/hooks/use-orders";
import type { OrderPayment, OrderView } from "@/lib/types";
import { OrderStatus, PaymentMethod } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change that refreshes the abonos list after a new
 * abono is registered on a workshop order.
 *
 * `useAddOrderPayment` must invalidate the `["order-payments", id]` query family
 * (alongside the order, orders and cash families) once the mutation succeeds.
 * Otherwise the order detail would keep serving the pre-abono list from cache
 * and the pending balance shown would not match the backend's until a manual
 * reload — the exact desfase the accepted requirement forbids.
 *
 * The backend is mocked, so this is hook/integration coverage of the frontend
 * invalidation seam, not a real backend. The PocketIC lane
 * (`backend.order-payments.test.ts`) proves the abono is actually recorded and
 * the balance recalculated; this file proves the list refetches once it is.
 */

const addOrderPaymentMock = vi.fn();
const listOrderPaymentsMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      addOrderPayment: addOrderPaymentMock,
      listOrderPayments: listOrderPaymentsMock,
    },
    isFetching: false,
  }),
}));

const TS = 1_700_000_000_000_000_000n;

function orderView(): OrderView {
  return {
    order: {
      id: 42n,
      orderNumber: "OT-0001",
      status: OrderStatus.received,
      customerId: 1n,
      motorcycleId: 7n,
      intakeMileage: 15000n,
      problem: "Frenos ruidosos",
      parts: [],
      labor: [],
      technicianIds: [],
      statusHistory: [],
      createdAt: TS,
      updatedAt: TS,
      photos: [],
      payments: [],
    },
    totals: {
      partsSubtotal: 0n,
      laborSubtotal: 0n,
      subtotal: 0n,
      taxRate: 0n,
      tax: 0n,
      total: 80000n,
      paidAmount: 0n,
      balance: 80000n,
    },
  };
}

function payment(overrides: Partial<OrderPayment> = {}): OrderPayment {
  return {
    id: 1n,
    amount: 20000n,
    method: PaymentMethod.cash,
    note: undefined,
    registeredAt: TS,
    registeredBy: undefined as never,
    ...overrides,
  };
}

/**
 * Mounts the abonos list next to the add-abono mutation, mirroring how the
 * order detail composes them. The rendered count lets the test observe the
 * refetch without the page's own layout.
 */
function PaymentInvalidationHarness() {
  const payments = useOrderPayments(42n);
  const addPayment = useAddOrderPayment();

  return (
    <div>
      <span data-ocid="harness.payment_count">
        {payments.data?.length.toString() ?? "none"}
      </span>
      <button
        type="button"
        data-ocid="harness.add_payment"
        onClick={() =>
          addPayment.mutate({
            id: 42n,
            payment: { amount: 20000n, method: PaymentMethod.cash },
          })
        }
      >
        Registrar abono
      </button>
    </div>
  );
}

describe("useAddOrderPayment refreshes the abonos list (cover)", () => {
  beforeEach(() => {
    addOrderPaymentMock.mockReset();
    listOrderPaymentsMock.mockReset();
    listOrderPaymentsMock.mockResolvedValue([]);
  });

  it("refetches the abonos list after a successful abono", async () => {
    addOrderPaymentMock.mockResolvedValue(orderView());
    renderWithProviders(<PaymentInvalidationHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.payment_count")).toHaveTextContent(
        "0",
      ),
    );
    const callsBefore = listOrderPaymentsMock.mock.calls.length;

    // The backend now reports the abono that was just registered.
    listOrderPaymentsMock.mockResolvedValue([payment()]);
    await userEvent.click(screen.getByTestId("harness.add_payment"));

    await waitFor(() =>
      expect(listOrderPaymentsMock.mock.calls.length).toBeGreaterThan(
        callsBefore,
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("harness.payment_count")).toHaveTextContent(
        "1",
      ),
    );
  });

  it("does not refetch the abonos list when the abono fails", async () => {
    addOrderPaymentMock.mockRejectedValue(new Error("supera el saldo"));
    renderWithProviders(<PaymentInvalidationHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.payment_count")).toHaveTextContent(
        "0",
      ),
    );
    const callsBefore = listOrderPaymentsMock.mock.calls.length;

    await userEvent.click(screen.getByTestId("harness.add_payment"));

    // Give the rejected mutation a chance to settle before asserting.
    await waitFor(() => expect(addOrderPaymentMock).toHaveBeenCalledTimes(1));
    expect(listOrderPaymentsMock.mock.calls.length).toBe(callsBefore);
  });
});
