import { CashMovementsTable } from "@/components/cash/CashMovementsTable";
import type { CashMovement, CashMovementPage } from "@/lib/types";
import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  PaymentMethod,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the Caja y Bancos movements ledger filters.
 *
 * The accepted change adds a register (caja/banco) dimension to the ledger.
 * The existing filters — kind, account, payment method and date range — must
 * keep reaching `listCashMovements` as the typed filter the backend consumes,
 * and the table must keep rendering the movement rows it receives.
 *
 * These tests exercise the real table against a typed local actor mock, so they
 * pin the observable wiring rather than the table's internal state.
 */

const listCashMovementsMock = vi.fn();
const listCashRegistersMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCashMovements: listCashMovementsMock,
      listCashRegisters: listCashRegistersMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

function movement(overrides: Partial<CashMovement> = {}): CashMovement {
  return {
    id: 1n,
    shiftId: 7n,
    timestamp: TS,
    kind: CashMovementKind.income,
    paymentMethod: PaymentMethod.transfer,
    account: CashAccount.bank,
    amount: 250000n,
    description: "Consignación cliente",
    reference: undefined,
    source: CashMovementSource.manual,
    ...overrides,
  };
}

function movementPage(items: CashMovement[]): CashMovementPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 20n };
}

describe("CashMovementsTable (characterization)", () => {
  beforeEach(() => {
    listCashMovementsMock.mockReset();
    listCashRegistersMock.mockReset();
    listCashMovementsMock.mockResolvedValue(movementPage([]));
    listCashRegistersMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 100n,
    });
  });

  it("sends the kind, account and payment-method filters to listCashMovements", async () => {
    renderWithProviders(
      <CashMovementsTable shiftId={7n} ocid="caja.movements" />,
    );

    // The initial load is unfiltered and scoped to the shift.
    await waitFor(() =>
      expect(listCashMovementsMock).toHaveBeenCalledWith(
        null,
        {
          shiftId: 7n,
          registerId: undefined,
          kind: undefined,
          account: undefined,
          paymentMethod: undefined,
          from: undefined,
          to: undefined,
        },
        0n,
        20n,
      ),
    );

    // Filter by egresos.
    await userEvent.click(
      await screen.findByTestId("caja.movements.kind_filter"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Egresos" }),
    );
    await waitFor(() =>
      expect(listCashMovementsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ kind: CashMovementKind.expense }),
        0n,
        20n,
      ),
    );

    // Filter by Caja.
    await userEvent.click(screen.getByTestId("caja.movements.account_filter"));
    await userEvent.click(await screen.findByRole("option", { name: "Caja" }));
    await waitFor(() =>
      expect(listCashMovementsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ account: CashAccount.cash }),
        0n,
        20n,
      ),
    );

    // Filter by Efectivo.
    await userEvent.click(screen.getByTestId("caja.movements.method_filter"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Efectivo" }),
    );
    await waitFor(() =>
      expect(listCashMovementsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ paymentMethod: PaymentMethod.cash }),
        0n,
        20n,
      ),
    );
  });

  it("converts a date range into inclusive Colombia-local bounds", async () => {
    renderWithProviders(
      <CashMovementsTable shiftId={7n} ocid="caja.movements" />,
    );

    await waitFor(() => expect(listCashMovementsMock).toHaveBeenCalled());

    await userEvent.type(
      await screen.findByTestId("caja.movements.date_from_input"),
      "2026-01-01",
    );
    await waitFor(() =>
      expect(listCashMovementsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ from: expect.any(BigInt) }),
        0n,
        20n,
      ),
    );
    const lastCall = listCashMovementsMock.mock.calls.at(-1);
    expect(lastCall?.[1].from).toBe(1767243600000000000n);
  });

  it("renders the movement rows the backend returns", async () => {
    listCashMovementsMock.mockResolvedValue(movementPage([movement()]));
    renderWithProviders(
      <CashMovementsTable shiftId={7n} ocid="caja.movements" />,
    );

    const table = await screen.findByTestId("caja.movements.table");
    expect(within(table).getByText("Consignación cliente")).toBeInTheDocument();
    expect(within(table).getByText("Transferencia")).toBeInTheDocument();
    expect(within(table).getByText("Bancos")).toBeInTheDocument();
    expect(within(table).getByText("+$ 2.500")).toBeInTheDocument();
  });
});
