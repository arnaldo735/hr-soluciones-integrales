import { CashBalancesPanel } from "@/components/cash/CashBalancesPanel";
import type { Shift } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Characterization coverage for the Caja y Bancos balance panel structure that
 * must survive the accepted change.
 *
 * The accepted change makes the panel show the live balance of each open shift
 * (derived from the ledger) instead of the stored `computedClosingCash/Bank`
 * snapshot taken when the shift was opened. These tests deliberately do NOT
 * assert the displayed balance value — that is the behavior the change
 * replaces. They protect the surrounding contract instead:
 *
 *   - one card per open shift, each labelled with its register name and
 *     responsible;
 *   - the opening-balance hints and the Caja/Bancos/Total tile labels;
 *   - the empty state when no shift is open;
 *   - the error state when the shifts query fails;
 *   - the loading skeleton while the shifts query is in flight.
 *
 * The panel is a pure presentational component, so it is rendered directly with
 * typed `Shift` fixtures and no actor mock.
 */

const TS = 1_700_000_000_000_000_000n;

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 7n,
    registerId: 1n,
    responsibleName: "Ana Torres",
    responsibleUserId: undefined,
    status: ShiftStatus.open,
    openingCash: 100000n,
    openingBank: 500000n,
    declaredClosingCash: undefined,
    declaredClosingBank: undefined,
    computedClosingCash: 100000n,
    computedClosingBank: 500000n,
    differenceCash: 0n,
    differenceBank: 0n,
    openedAt: TS,
    closedAt: undefined,
    openedBy: undefined as never,
    closedBy: undefined,
    notes: undefined,
    ...overrides,
  };
}

function registerNames(entries: Array<[bigint, string]>): Map<string, string> {
  return new Map(entries.map(([id, name]) => [id.toString(), name]));
}

describe("CashBalancesPanel (characterization)", () => {
  it("renders one card per open shift with its register name and responsible", () => {
    render(
      <CashBalancesPanel
        shifts={[
          shift({ id: 7n, registerId: 1n, responsibleName: "Ana Torres" }),
          shift({
            id: 8n,
            registerId: 2n,
            responsibleName: "Carlos Pérez",
            openingCash: 0n,
            openingBank: 900000n,
          }),
        ]}
        registerNames={registerNames([
          [1n, "Caja principal"],
          [2n, "Banco Bogotá"],
        ])}
        isLoading={false}
        isError={false}
      />,
    );

    const section = screen.getByTestId("caja.balances.section");
    expect(within(section).getByText("Caja principal")).toBeInTheDocument();
    expect(within(section).getByText("Banco Bogotá")).toBeInTheDocument();
    expect(within(section).getByText(/Ana Torres/)).toBeInTheDocument();
    expect(within(section).getByText(/Carlos Pérez/)).toBeInTheDocument();
    // One card per open shift.
    expect(screen.getByTestId("caja.balances.register.1")).toBeInTheDocument();
    expect(screen.getByTestId("caja.balances.register.2")).toBeInTheDocument();
  });

  it("shows the Caja, Bancos and Total tiles with the opening-balance hints", () => {
    render(
      <CashBalancesPanel
        shifts={[shift()]}
        registerNames={registerNames([[1n, "Caja principal"]])}
        isLoading={false}
        isError={false}
      />,
    );

    const card = screen.getByTestId("caja.balances.register.1");
    expect(
      within(card).getByTestId("caja.balances.register.1.cash"),
    ).toHaveTextContent("Caja (efectivo)");
    expect(
      within(card).getByTestId("caja.balances.register.1.bank"),
    ).toHaveTextContent("Bancos");
    expect(
      within(card).getByTestId("caja.balances.register.1.total"),
    ).toHaveTextContent("Total disponible");
    // The opening balances are shown as hints, independent of the live balance.
    expect(
      within(card).getByText(/Saldo inicial \$ 1\.000/),
    ).toBeInTheDocument();
    expect(
      within(card).getByText(/Saldo inicial \$ 5\.000/),
    ).toBeInTheDocument();
  });

  it("falls back to a register id label when the name is unknown", () => {
    render(
      <CashBalancesPanel
        shifts={[shift({ registerId: 3n })]}
        registerNames={new Map()}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByText("Caja #3")).toBeInTheDocument();
  });

  it("shows the empty state when no shift is open", () => {
    render(
      <CashBalancesPanel
        shifts={[]}
        registerNames={new Map()}
        isLoading={false}
        isError={false}
      />,
    );

    expect(screen.getByTestId("caja.balances.closed_state")).toHaveTextContent(
      "No hay turnos abiertos",
    );
    expect(
      screen.queryByTestId("caja.balances.section"),
    ).not.toBeInTheDocument();
  });

  it("shows the error state when the shifts query fails", () => {
    render(
      <CashBalancesPanel
        shifts={[]}
        registerNames={new Map()}
        isLoading={false}
        isError={true}
      />,
    );

    expect(screen.getByTestId("caja.balances.error_state")).toHaveTextContent(
      "No se pudieron cargar los saldos de caja y bancos.",
    );
  });

  it("shows the loading skeleton while the shifts query is in flight", () => {
    render(
      <CashBalancesPanel
        shifts={[]}
        registerNames={new Map()}
        isLoading={true}
        isError={false}
      />,
    );

    expect(
      screen.getByTestId("caja.balances.loading_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("caja.balances.section"),
    ).not.toBeInTheDocument();
  });
});
