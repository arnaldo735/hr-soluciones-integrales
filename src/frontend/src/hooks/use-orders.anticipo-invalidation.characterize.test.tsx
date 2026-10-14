import { useOpenShifts } from "@/hooks/use-cash";
import { useSetOrderAdvance } from "@/hooks/use-orders";
import type { OrderView, Shift } from "@/lib/types";
import { OrderStatus, PaymentMethod, ShiftStatus } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the Caja y Bancos refresh seam that the
 * accepted anticipo change relies on.
 *
 * Registering an advance payment (anticipo) on a workshop order writes an
 * income movement into the Caja/Bancos ledger, so `useSetOrderAdvance` must
 * invalidate the `["cash"]` query family after success. Otherwise the open
 * shifts and the balances would keep serving the pre-anticipo cache until a
 * manual reload — the exact desfase the accepted requirement forbids.
 *
 * These tests deliberately do NOT assert the balance value the panel shows —
 * that is the behavior the accepted change replaces. They protect the
 * invalidation seam the change builds on: the open-shifts query (a `["cash"]`
 * query) refetches once the anticipo succeeds, and does not refetch when it
 * fails.
 *
 * The backend is mocked, so this is hook/integration coverage of the frontend
 * invalidation seam, not a real backend. The PocketIC lane
 * (`backend.advance-movement.characterize.test.ts`) proves the movement itself
 * is written; this file proves the view refetches once it is.
 */

const setOrderAdvanceMock = vi.fn();
const listOpenShiftsMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      setOrderAdvance: setOrderAdvanceMock,
      listOpenShifts: listOpenShiftsMock,
    },
    isFetching: false,
  }),
}));

const TS = 1_700_000_000_000_000_000n;

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 7n,
    registerId: 1n,
    responsibleName: "Ana Torres",
    responsibleUserId: undefined,
    openedAt: TS,
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

/**
 * Mounts the open-shifts query (a `["cash"]` query) next to the anticipo
 * mutation, mirroring how the Caja/Bancos page composes them. The rendered
 * count lets the test observe the refetch without the page's own layout.
 */
function AnticipoInvalidationHarness() {
  const shifts = useOpenShifts();
  const setAdvance = useSetOrderAdvance();

  return (
    <div>
      <span data-ocid="harness.shift_count">
        {shifts.data?.length.toString() ?? "none"}
      </span>
      <button
        type="button"
        data-ocid="harness.set_advance"
        onClick={() =>
          setAdvance.mutate({
            id: 42n,
            amount: 20000n,
            method: PaymentMethod.cash,
          })
        }
      >
        Registrar anticipo
      </button>
    </div>
  );
}

describe("useSetOrderAdvance refreshes Caja y Bancos (characterization)", () => {
  beforeEach(() => {
    setOrderAdvanceMock.mockReset();
    listOpenShiftsMock.mockReset();
    listOpenShiftsMock.mockResolvedValue([shift()]);
  });

  it("refetches the open shifts after a successful anticipo", async () => {
    setOrderAdvanceMock.mockResolvedValue(orderView());
    renderWithProviders(<AnticipoInvalidationHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("1"),
    );
    const callsBefore = listOpenShiftsMock.mock.calls.length;

    // The backend now reports the shift the anticipo's movement landed in.
    listOpenShiftsMock.mockResolvedValue([
      shift(),
      shift({
        id: 8n,
        registerId: 2n,
        responsibleName: "Sistema (automático)",
      }),
    ]);
    await userEvent.click(screen.getByTestId("harness.set_advance"));

    await waitFor(() =>
      expect(listOpenShiftsMock.mock.calls.length).toBeGreaterThan(callsBefore),
    );
    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("2"),
    );
  });

  it("does not refetch the open shifts when the anticipo fails", async () => {
    setOrderAdvanceMock.mockRejectedValue(new Error("supera el total"));
    renderWithProviders(<AnticipoInvalidationHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("1"),
    );
    const callsBefore = listOpenShiftsMock.mock.calls.length;

    await userEvent.click(screen.getByTestId("harness.set_advance"));

    // Give the rejected mutation a chance to settle before asserting.
    await waitFor(() => expect(setOrderAdvanceMock).toHaveBeenCalledTimes(1));
    expect(listOpenShiftsMock.mock.calls.length).toBe(callsBefore);
  });
});
