import { useOpenShifts } from "@/hooks/use-cash";
import { useConvertQuoteToInvoice } from "@/hooks/use-quotes";
import type { Invoice, Shift } from "@/lib/types";
import {
  InvoiceLineKind,
  InvoiceOrigin,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  ShiftStatus,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change that refreshes the Caja y Bancos view after an
 * accepted quote is converted into an invoice.
 *
 * `convertQuoteToInvoice` records the collection as an income movement in the
 * account of the chosen payment method, so `useConvertQuoteToInvoice` must
 * invalidate the `["cash"]` query family after success. Otherwise the open
 * shifts, the movements and the balances would keep serving the pre-conversion
 * cache until a manual reload.
 *
 * The backend is mocked, so this is hook/integration coverage of the frontend
 * invalidation seam, not a real backend. The PocketIC lane
 * (`backend.invoice-collection.cover.test.ts`) proves the movement itself is
 * written; this file proves the view refetches once it is.
 */

const convertQuoteToInvoiceMock = vi.fn();
const listOpenShiftsMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      convertQuoteToInvoice: convertQuoteToInvoiceMock,
      listOpenShifts: listOpenShiftsMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 1n,
    number: "FAC-0001",
    orderId: undefined,
    customerId: 1n,
    customerName: "Ada Lovelace",
    customerTaxId: "LOAA1815",
    customerAddress: "Av. Reforma 100",
    lines: [
      {
        kind: InvoiceLineKind.service,
        description: "Servicio de afinación",
        quantity: 1n,
        unitPrice: 120000n,
        amount: 120000n,
        unitCost: 0n,
      },
    ],
    subtotal: 120000n,
    taxRate: 0n,
    tax: 0n,
    total: 120000n,
    discount: 0n,
    origin: InvoiceOrigin.quote,
    paymentMethod: PaymentMethod.transfer,
    paymentCondition: PaymentCondition.cash,
    paymentStatus: PaymentStatus.paid,
    issuedAt: TS,
    ...overrides,
  };
}

/**
 * Mounts the open-shifts query (a `["cash"]` query) next to the conversion
 * mutation, mirroring how the quote detail composes them. The rendered count
 * lets the test observe the refetch without the page's own layout.
 */
function CashRefreshHarness() {
  const shifts = useOpenShifts();
  const convert = useConvertQuoteToInvoice();

  return (
    <div>
      <span data-ocid="harness.shift_count">
        {shifts.data?.length.toString() ?? "none"}
      </span>
      <button
        type="button"
        data-ocid="harness.convert_quote"
        onClick={() =>
          convert.mutate({ id: 7n, paymentMethod: PaymentMethod.transfer })
        }
      >
        Convertir en factura
      </button>
    </div>
  );
}

describe("useConvertQuoteToInvoice refreshes Caja y Bancos (cover)", () => {
  beforeEach(() => {
    convertQuoteToInvoiceMock.mockReset();
    listOpenShiftsMock.mockReset();
    listOpenShiftsMock.mockResolvedValue([shift()]);
  });

  it("refetches the open shifts after converting an accepted quote", async () => {
    convertQuoteToInvoiceMock.mockResolvedValue(invoice());
    renderWithProviders(<CashRefreshHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("1"),
    );
    const callsBefore = listOpenShiftsMock.mock.calls.length;

    // The backend now reports the shift the conversion's movement landed in.
    listOpenShiftsMock.mockResolvedValue([
      shift(),
      shift({
        id: 8n,
        registerId: 2n,
        responsibleName: "Sistema (automático)",
      }),
    ]);
    await userEvent.click(screen.getByTestId("harness.convert_quote"));

    await waitFor(() =>
      expect(listOpenShiftsMock.mock.calls.length).toBeGreaterThan(callsBefore),
    );
    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("2"),
    );
  });

  it("does not refetch the open shifts when the conversion fails", async () => {
    convertQuoteToInvoiceMock.mockRejectedValue(
      new Error("Solo se puede convertir una cotización aceptada"),
    );
    renderWithProviders(<CashRefreshHarness />);

    await waitFor(() =>
      expect(screen.getByTestId("harness.shift_count")).toHaveTextContent("1"),
    );
    const callsBefore = listOpenShiftsMock.mock.calls.length;

    await userEvent.click(screen.getByTestId("harness.convert_quote"));

    // Give the rejected mutation a chance to settle before asserting.
    await waitFor(() =>
      expect(convertQuoteToInvoiceMock).toHaveBeenCalledTimes(1),
    );
    expect(listOpenShiftsMock.mock.calls.length).toBe(callsBefore);
  });
});
