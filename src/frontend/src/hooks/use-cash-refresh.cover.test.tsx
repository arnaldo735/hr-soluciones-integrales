import { useOpenShifts } from "@/hooks/use-cash";
import { useCreatePosSale } from "@/hooks/use-pos";
import { useRegisterReceivablePayment } from "@/hooks/use-receivables";
import type { PosSale, ReceivablePayment, Shift } from "@/lib/types";
import { PaymentCondition, PaymentMethod, ShiftStatus } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change that refreshes the Caja y Bancos view after a
 * sale, an invoice collection or a receivable payment.
 *
 * Each of those flows writes a movement into the Caja/Bancos ledger, so the
 * frontend must invalidate the `["cash"]` query family (and the accounting
 * surfaces) after the mutation succeeds. Otherwise the open shifts, the
 * movements and the balances would keep serving the pre-movement cache until a
 * manual reload.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend invalidation seam, not a real backend. The PocketIC lane
 * (`backend.payment-method-shift.cover.test.ts`) proves the movement itself is
 * written; this file proves the view refetches once it is.
 */

const listOpenShiftsMock = vi.fn();
const createPosSaleMock = vi.fn();
const registerReceivablePaymentMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listOpenShifts: listOpenShiftsMock,
      createPosSale: createPosSaleMock,
      registerReceivablePayment: registerReceivablePaymentMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 7n,
    registerId: 1n,
    responsibleName: "Ana Torres",
    responsibleUserId: undefined,
    openedAt: 1_700_000_000_000_000_000n,
    closedAt: undefined,
    openingCash: 0n,
    openingBank: 0n,
    declaredClosingCash: undefined,
    declaredClosingBank: undefined,
    computedClosingCash: 0n,
    computedClosingBank: 0n,
    differenceCash: 0n,
    differenceBank: 0n,
    status: ShiftStatus.open,
    openedBy: undefined as never,
    closedBy: undefined,
    notes: undefined,
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
    taxRate: 0n,
    tax: 0n,
    total: 25000n,
    amountReceived: 25000n,
    change: 0n,
    paymentMethod: PaymentMethod.transfer,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
    ...overrides,
  };
}

function receivablePayment(
  overrides: Partial<ReceivablePayment> = {},
): ReceivablePayment {
  return {
    id: 1n,
    invoiceId: 1n,
    amount: 30000n,
    method: "transfer",
    note: undefined,
    performedBy: undefined as never,
    at: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/**
 * Mounts the open-shifts query (a `["cash"]` query) next to the mutation under
 * test, mirroring how the Caja/Bancos page composes them. The rendered count
 * lets the test observe the refetch without the page's own layout.
 */
function CashRefreshHarness({ flow }: { flow: "pos" | "receivable" }) {
  const shifts = useOpenShifts();
  const createSale = useCreatePosSale();
  const registerPayment = useRegisterReceivablePayment();

  return (
    <div>
      <span data-ocid="harness.shift_count">
        {shifts.data?.length.toString() ?? "none"}
      </span>
      {flow === "pos" ? (
        <button
          type="button"
          data-ocid="harness.pos_charge"
          onClick={() =>
            createSale.mutate({
              lines: [{ partId: 1n, quantity: 1n, discount: 0n }],
              paymentMethod: PaymentMethod.transfer,
              paymentCondition: PaymentCondition.cash,
              amountReceived: 25000n,
            })
          }
        >
          Cobrar
        </button>
      ) : (
        <button
          type="button"
          data-ocid="harness.receivable_pay"
          onClick={() =>
            registerPayment.mutate({
              invoiceId: 1n,
              amount: 30000n,
              method: "transfer",
            })
          }
        >
          Abonar
        </button>
      )}
    </div>
  );
}

describe("Caja/Bancos refresh after a collection (cover)", () => {
  beforeEach(() => {
    listOpenShiftsMock.mockReset();
    createPosSaleMock.mockReset();
    registerReceivablePaymentMock.mockReset();
    listOpenShiftsMock.mockResolvedValue([shift()]);
  });

  it("refetches the open shifts after a POS sale", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<CashRefreshHarness flow="pos" />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("1"),
    );
    const callsBefore = listOpenShiftsMock.mock.calls.length;

    // The backend now reports the shift the sale's movement landed in.
    listOpenShiftsMock.mockResolvedValue([
      shift(),
      shift({
        id: 8n,
        registerId: 2n,
        responsibleName: "Sistema (automático)",
      }),
    ]);
    await userEvent.click(screen.getByTestId("harness.pos_charge"));

    await waitFor(() =>
      expect(listOpenShiftsMock.mock.calls.length).toBeGreaterThan(callsBefore),
    );
    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("2"),
    );
  });

  it("refetches the open shifts after a receivable payment", async () => {
    registerReceivablePaymentMock.mockResolvedValue(receivablePayment());
    renderWithProviders(<CashRefreshHarness flow="receivable" />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("1"),
    );
    const callsBefore = listOpenShiftsMock.mock.calls.length;

    listOpenShiftsMock.mockResolvedValue([
      shift(),
      shift({
        id: 9n,
        registerId: 2n,
        responsibleName: "Sistema (automático)",
      }),
    ]);
    await userEvent.click(screen.getByTestId("harness.receivable_pay"));

    await waitFor(() =>
      expect(listOpenShiftsMock.mock.calls.length).toBeGreaterThan(callsBefore),
    );
    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("2"),
    );
  });

  it("does not refetch the open shifts when the sale fails", async () => {
    createPosSaleMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<CashRefreshHarness flow="pos" />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("1"),
    );
    const callsBefore = listOpenShiftsMock.mock.calls.length;

    await userEvent.click(screen.getByTestId("harness.pos_charge"));

    // Give the rejected mutation a chance to settle before asserting.
    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    expect(listOpenShiftsMock.mock.calls.length).toBe(callsBefore);
  });
});
