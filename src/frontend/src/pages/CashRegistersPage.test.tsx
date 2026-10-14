import type { CashRegister, CashRegisterPage, Shift } from "@/lib/types";
import { CashRegisterKind, ShiftStatus } from "@/lib/types";
import { CashRegistersPage } from "@/pages/CashRegistersPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Catálogo de cajas y bancos coverage.
 *
 * The accepted change adds an administrable catalog where each caja/banco is a
 * register that groups its own shifts and movements. These tests exercise the
 * real page against a typed local actor mock, so they pin the observable
 * behavior:
 *
 *   - the catalog lists name, tipo (Caja/Banco), saldo inicial, estado and
 *     whether the register has an open shift;
 *   - a caja and a banco can be created with their kind and opening balance;
 *   - deleting a register with an open shift is blocked, while a register
 *     without one can be deleted;
 *   - activating/deactivating a register reaches the backend.
 */

const listCashRegistersMock = vi.fn();
const listOpenShiftsMock = vi.fn();
const createCashRegisterMock = vi.fn();
const updateCashRegisterMock = vi.fn();
const setCashRegisterActiveMock = vi.fn();
const deleteCashRegisterMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCashRegisters: listCashRegistersMock,
      listOpenShifts: listOpenShiftsMock,
      createCashRegister: createCashRegisterMock,
      updateCashRegister: updateCashRegisterMock,
      setCashRegisterActive: setCashRegisterActiveMock,
      deleteCashRegister: deleteCashRegisterMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;
const PRINCIPAL = Principal.fromText("aaaaa-aa");

function register(overrides: Partial<CashRegister> = {}): CashRegister {
  return {
    id: 1n,
    name: "Caja principal",
    kind: CashRegisterKind.cash,
    openingBalance: 0n,
    active: true,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

function registerPage(items: CashRegister[]): CashRegisterPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 15n };
}

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 7n,
    registerId: 1n,
    responsibleName: "Ana Torres",
    responsibleUserId: undefined,
    status: ShiftStatus.open,
    openingCash: 100000n,
    openingBank: 0n,
    declaredClosingCash: undefined,
    declaredClosingBank: undefined,
    computedClosingCash: 100000n,
    computedClosingBank: 0n,
    differenceCash: 0n,
    differenceBank: 0n,
    openedAt: TS,
    closedAt: undefined,
    openedBy: PRINCIPAL,
    closedBy: undefined,
    notes: undefined,
    ...overrides,
  };
}

describe("CashRegistersPage (catálogo)", () => {
  beforeEach(() => {
    listCashRegistersMock.mockReset();
    listOpenShiftsMock.mockReset();
    createCashRegisterMock.mockReset();
    updateCashRegisterMock.mockReset();
    setCashRegisterActiveMock.mockReset();
    deleteCashRegisterMock.mockReset();

    listOpenShiftsMock.mockResolvedValue([]);
    listCashRegistersMock.mockResolvedValue(
      registerPage([
        register({
          id: 1n,
          name: "Caja principal",
          kind: CashRegisterKind.cash,
          openingBalance: 100000n,
        }),
        register({
          id: 2n,
          name: "Banco Bogotá",
          kind: CashRegisterKind.bank,
          openingBalance: 500000n,
        }),
      ]),
    );
  });

  it("lists cajas and bancos with tipo, saldo inicial and estado", async () => {
    renderWithProviders(<CashRegistersPage />);

    const table = await screen.findByTestId("caja.registers.table");
    expect(within(table).getByText("Caja principal")).toBeInTheDocument();
    expect(within(table).getByText("Banco Bogotá")).toBeInTheDocument();
    expect(within(table).getByText("Caja")).toBeInTheDocument();
    expect(within(table).getByText("Banco")).toBeInTheDocument();
    expect(within(table).getByText("$ 1.000")).toBeInTheDocument();
    expect(within(table).getByText("$ 5.000")).toBeInTheDocument();
    expect(within(table).getAllByText("Activa").length).toBe(2);
  });

  it("marks a register with an open shift and blocks its deletion", async () => {
    listOpenShiftsMock.mockResolvedValue([shift({ registerId: 1n })]);
    renderWithProviders(<CashRegistersPage />);

    const table = await screen.findByTestId("caja.registers.table");
    expect(within(table).getByText("Con turno abierto")).toBeInTheDocument();
    expect(within(table).getByText("Sin turno abierto")).toBeInTheDocument();

    // The register with the open shift cannot be deleted; the other can.
    expect(screen.getByTestId("caja.registers.delete_button.1")).toBeDisabled();
    expect(screen.getByTestId("caja.registers.delete_button.2")).toBeEnabled();
  });

  it("creates a caja with its opening balance", async () => {
    createCashRegisterMock.mockResolvedValue(register());
    renderWithProviders(<CashRegistersPage />);

    await userEvent.click(
      await screen.findByTestId("caja.registers.create_button"),
    );
    const dialog = await screen.findByTestId("caja.registers.dialog");

    await userEvent.type(
      within(dialog).getByTestId("caja.registers.name_input"),
      "Caja mostrador",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.registers.opening_balance_input"),
      "1000",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.registers.submit_button"),
    );

    await waitFor(() =>
      expect(createCashRegisterMock).toHaveBeenCalledTimes(1),
    );
    expect(createCashRegisterMock).toHaveBeenCalledWith(null, {
      name: "Caja mostrador",
      kind: CashRegisterKind.cash,
      openingBalance: 100000n,
    });
  });

  it("creates a banco choosing the tipo", async () => {
    createCashRegisterMock.mockResolvedValue(
      register({ kind: CashRegisterKind.bank }),
    );
    renderWithProviders(<CashRegistersPage />);

    await userEvent.click(
      await screen.findByTestId("caja.registers.create_button"),
    );
    const dialog = await screen.findByTestId("caja.registers.dialog");

    await userEvent.type(
      within(dialog).getByTestId("caja.registers.name_input"),
      "Banco Davivienda",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.registers.kind_select"),
    );
    await userEvent.click(await screen.findByRole("option", { name: "Banco" }));
    await userEvent.type(
      within(dialog).getByTestId("caja.registers.opening_balance_input"),
      "5000",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.registers.submit_button"),
    );

    await waitFor(() =>
      expect(createCashRegisterMock).toHaveBeenCalledTimes(1),
    );
    expect(createCashRegisterMock).toHaveBeenCalledWith(null, {
      name: "Banco Davivienda",
      kind: CashRegisterKind.bank,
      openingBalance: 500000n,
    });
  });

  it("surfaces the duplicate-name error from the backend", async () => {
    createCashRegisterMock.mockRejectedValue(
      new Error("Ya existe una caja o banco con ese nombre"),
    );
    renderWithProviders(<CashRegistersPage />);

    await userEvent.click(
      await screen.findByTestId("caja.registers.create_button"),
    );
    const dialog = await screen.findByTestId("caja.registers.dialog");

    await userEvent.type(
      within(dialog).getByTestId("caja.registers.name_input"),
      "Caja principal",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.registers.opening_balance_input"),
      "0",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.registers.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("caja.registers.error_state"),
    ).toHaveTextContent("Ya existe una caja o banco con ese nombre");
  });

  it("deletes a register without an open shift after confirmation", async () => {
    deleteCashRegisterMock.mockResolvedValue(undefined);
    renderWithProviders(<CashRegistersPage />);

    await screen.findByTestId("caja.registers.table");
    await userEvent.click(screen.getByTestId("caja.registers.delete_button.2"));

    const dialog = await screen.findByTestId("caja.registers.delete_dialog");
    await userEvent.click(
      within(dialog).getByTestId("caja.registers.confirm_button"),
    );

    await waitFor(() =>
      expect(deleteCashRegisterMock).toHaveBeenCalledWith(null, 2n),
    );
  });

  it("activates or deactivates a register", async () => {
    setCashRegisterActiveMock.mockResolvedValue(register({ active: false }));
    renderWithProviders(<CashRegistersPage />);

    await screen.findByTestId("caja.registers.table");
    await userEvent.click(screen.getByTestId("caja.registers.save_button.1"));

    await waitFor(() =>
      expect(setCashRegisterActiveMock).toHaveBeenCalledWith(null, 1n, false),
    );
  });
});
