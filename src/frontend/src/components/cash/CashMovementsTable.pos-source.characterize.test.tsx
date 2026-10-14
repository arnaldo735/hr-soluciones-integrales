import { CashMovementsTable } from "@/components/cash/CashMovementsTable";
import type { CashMovement, CashMovementPage } from "@/lib/types";
import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  PaymentMethod,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the Caja/Bancos ledger rendering of a
 * POS-sourced movement.
 *
 * The accepted change makes a POS sale record a cash movement with
 * `source = #pos` whose account is derived from the payment method
 * (efectivo -> Caja, transferencia -> Bancos). These tests deliberately do NOT
 * assert that the backend creates such a movement — that is the behavior the
 * change adds. They protect the display seam the new movement flows through:
 * the ledger must render a POS-sourced row with its account, method, source
 * label and signed amount, so the movement is visible in the shift once it
 * exists.
 *
 * They exercise the real table against a typed local actor mock, so they pin
 * the observable rendering rather than the table's internal state.
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
    description: "Venta POS POS-0001",
    reference: "POS-0001",
    source: CashMovementSource.pos,
    ...overrides,
  };
}

function movementPage(items: CashMovement[]): CashMovementPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 20n };
}

describe("CashMovementsTable POS source (characterization)", () => {
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

  it("renders a transfer POS sale as an income in Bancos", async () => {
    listCashMovementsMock.mockResolvedValue(movementPage([movement()]));
    renderWithProviders(
      <CashMovementsTable shiftId={7n} ocid="caja.movements" />,
    );

    const table = await screen.findByTestId("caja.movements.table");
    expect(within(table).getByText("Venta POS POS-0001")).toBeInTheDocument();
    expect(within(table).getByText("Transferencia")).toBeInTheDocument();
    expect(within(table).getByText("Bancos")).toBeInTheDocument();
    expect(within(table).getByText("POS")).toBeInTheDocument();
    expect(within(table).getByText("+$ 2.500")).toBeInTheDocument();
  });

  it("renders a cash POS sale as an income in Caja", async () => {
    listCashMovementsMock.mockResolvedValue(
      movementPage([
        movement({
          paymentMethod: PaymentMethod.cash,
          account: CashAccount.cash,
          amount: 120000n,
          description: "Venta POS POS-0002",
          reference: "POS-0002",
        }),
      ]),
    );
    renderWithProviders(
      <CashMovementsTable shiftId={7n} ocid="caja.movements" />,
    );

    const table = await screen.findByTestId("caja.movements.table");
    expect(within(table).getByText("Venta POS POS-0002")).toBeInTheDocument();
    expect(within(table).getByText("Efectivo")).toBeInTheDocument();
    expect(within(table).getByText("Caja")).toBeInTheDocument();
    expect(within(table).getByText("POS")).toBeInTheDocument();
    expect(within(table).getByText("+$ 1.200")).toBeInTheDocument();
  });
});
