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
 * Cover for the accepted requirement that the Caja/Bancos ledger labels every
 * collection origin in Spanish: POS, factura and cartera.
 *
 * The accepted change routes a POS sale, an invoice collection and a receivable
 * payment into the Caja/Bancos ledger with `source = #pos`, `#invoice` and
 * `#receivable` respectively. The sibling
 * `CashMovementsTable.pos-source.characterize.test.tsx` protects the POS row;
 * this file completes the criterion by rendering an invoice-sourced and a
 * receivable-sourced movement through the real table and asserting the Spanish
 * origin label ("Factura", "Cartera") alongside the account and method.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * ledger rendering seam, not a real backend. The PocketIC lane
 * (`backend.payment-method-shift.cover.test.ts`) proves the movements are
 * actually written with those sources.
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
    amount: 120000n,
    description: "Cobro factura FAC-0001",
    reference: "FAC-0001",
    source: CashMovementSource.invoice,
    ...overrides,
  };
}

function movementPage(items: CashMovement[]): CashMovementPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 20n };
}

describe("CashMovementsTable collection sources (cover)", () => {
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

  it("labels an invoice collection as Factura in the method's account", async () => {
    listCashMovementsMock.mockResolvedValue(
      movementPage([
        movement({
          source: CashMovementSource.invoice,
          paymentMethod: PaymentMethod.transfer,
          account: CashAccount.bank,
          description: "Cobro factura FAC-0001",
          reference: "FAC-0001",
        }),
      ]),
    );
    renderWithProviders(
      <CashMovementsTable shiftId={7n} ocid="caja.movements" />,
    );

    const table = await screen.findByTestId("caja.movements.table");
    expect(
      within(table).getByText("Cobro factura FAC-0001"),
    ).toBeInTheDocument();
    expect(within(table).getByText("Factura")).toBeInTheDocument();
    expect(within(table).getByText("Transferencia")).toBeInTheDocument();
    expect(within(table).getByText("Bancos")).toBeInTheDocument();
  });

  it("labels a receivable payment as Cartera in the method's account", async () => {
    listCashMovementsMock.mockResolvedValue(
      movementPage([
        movement({
          source: CashMovementSource.receivable,
          paymentMethod: PaymentMethod.cash,
          account: CashAccount.cash,
          amount: 30000n,
          description: "Abono cartera FAC-0002",
          reference: "FAC-0002",
        }),
      ]),
    );
    renderWithProviders(
      <CashMovementsTable shiftId={7n} ocid="caja.movements" />,
    );

    const table = await screen.findByTestId("caja.movements.table");
    expect(
      within(table).getByText("Abono cartera FAC-0002"),
    ).toBeInTheDocument();
    expect(within(table).getByText("Cartera")).toBeInTheDocument();
    expect(within(table).getByText("Efectivo")).toBeInTheDocument();
    expect(within(table).getByText("Caja")).toBeInTheDocument();
  });
});
