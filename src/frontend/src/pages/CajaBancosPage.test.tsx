import type { UserListItem, UserPage } from "@/backend";
import type {
  CashMovement,
  CashMovementPage,
  CashRegister,
  CashRegisterPage,
  CompanyProfile,
  DailyShiftReport,
  Shift,
  ShiftPage,
} from "@/lib/types";
import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  CashRegisterKind,
  DocumentType,
  FiscalRegime,
  PaymentMethod,
  ShiftStatus,
  TaxResponsibility,
} from "@/lib/types";
import { CajaBancosPage } from "@/pages/CajaBancosPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Caja y Bancos coverage for the multi-register rework.
 *
 * The accepted change turns the single global shift into several registers
 * (cajas y bancos), each with at most one open shift, and adds an assignable
 * responsible. These tests exercise the real page against a typed local actor
 * mock, so they pin the observable wiring:
 *
 *   - several registers can have an open shift at once, each shown with its
 *     register name and responsible;
 *   - opening a shift sends the chosen register, responsible and opening
 *     balance, and a rejected second shift on the same register surfaces the
 *     backend's Spanish message;
 *   - a movement is registered against the chosen open shift;
 *   - closing a shift targets that specific shift;
 *   - the responsible can be changed by system user or free name;
 *   - the history filters by register and responsible reach `listShifts`.
 */

const listOpenShiftsMock = vi.fn();
const listCashRegistersMock = vi.fn();
const openShiftMock = vi.fn();
const closeShiftMock = vi.fn();
const setShiftResponsibleMock = vi.fn();
const listShiftsMock = vi.fn();
const listCashMovementsMock = vi.fn();
const registerCashMovementMock = vi.fn();
const getDailyShiftReportMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const listUsersPageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listOpenShifts: listOpenShiftsMock,
      listCashRegisters: listCashRegistersMock,
      openShift: openShiftMock,
      closeShift: closeShiftMock,
      setShiftResponsible: setShiftResponsibleMock,
      listShifts: listShiftsMock,
      listCashMovements: listCashMovementsMock,
      registerCashMovement: registerCashMovementMock,
      getDailyShiftReport: getDailyShiftReportMock,
      getCompanyProfile: getCompanyProfileMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
      listUsersPage: listUsersPageMock,
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
  return { items, total: BigInt(items.length), offset: 0n, limit: 100n };
}

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
    openedBy: PRINCIPAL,
    closedBy: undefined,
    notes: undefined,
    ...overrides,
  };
}

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

function shiftPage(items: Shift[]): ShiftPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 15n };
}

function dailyReport(
  overrides: Partial<DailyShiftReport> = {},
): DailyShiftReport {
  return {
    shift: shift(),
    registerName: "Caja principal",
    responsibleName: "Ana Torres",
    movements: [movement()],
    byPaymentMethod: [
      { method: PaymentMethod.transfer, income: 250000n, expense: 0n },
    ],
    cashIncome: 0n,
    cashExpense: 0n,
    bankIncome: 250000n,
    bankExpense: 0n,
    totalIncome: 250000n,
    totalExpense: 0n,
    ...overrides,
  };
}

function user(overrides: Partial<UserListItem> = {}): UserListItem {
  return {
    id: 5n,
    username: "ana",
    name: "Ana Torres",
    roleId: 1n,
    roleName: "Mecánico",
    active: true,
    createdAt: TS,
    ...overrides,
  };
}

function userPage(items: UserListItem[]): UserPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 100n };
}

function companyProfile(): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.responsableIva,
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: TS,
  };
}

describe("CajaBancosPage (multi-register)", () => {
  beforeEach(() => {
    listOpenShiftsMock.mockReset();
    listCashRegistersMock.mockReset();
    openShiftMock.mockReset();
    closeShiftMock.mockReset();
    setShiftResponsibleMock.mockReset();
    listShiftsMock.mockReset();
    listCashMovementsMock.mockReset();
    registerCashMovementMock.mockReset();
    getDailyShiftReportMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    listUsersPageMock.mockReset();

    listOpenShiftsMock.mockResolvedValue([]);
    listCashRegistersMock.mockResolvedValue(
      registerPage([
        register({
          id: 1n,
          name: "Caja principal",
          kind: CashRegisterKind.cash,
        }),
        register({ id: 2n, name: "Banco Bogotá", kind: CashRegisterKind.bank }),
      ]),
    );
    listShiftsMock.mockResolvedValue(shiftPage([]));
    listCashMovementsMock.mockResolvedValue(movementPage([]));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDailyHopeMessageMock.mockResolvedValue(null);
    listUsersPageMock.mockResolvedValue(userPage([user()]));
  });

  it("shows a caja and a banco open at the same time with their responsible", async () => {
    listOpenShiftsMock.mockResolvedValue([
      shift({ id: 7n, registerId: 1n, responsibleName: "Ana Torres" }),
      shift({
        id: 8n,
        registerId: 2n,
        responsibleName: "Carlos Pérez",
        openingCash: 0n,
        openingBank: 900000n,
        computedClosingCash: 0n,
        computedClosingBank: 900000n,
      }),
    ]);
    renderWithProviders(<CajaBancosPage />);

    const list = await screen.findByTestId("caja.open_shifts.list");
    expect(within(list).getByText("Caja principal")).toBeInTheDocument();
    expect(within(list).getByText("Banco Bogotá")).toBeInTheDocument();
    expect(within(list).getByText(/Ana Torres/)).toBeInTheDocument();
    expect(within(list).getByText(/Carlos Pérez/)).toBeInTheDocument();
    // Two open shifts, so two close buttons are offered.
    expect(
      screen.getByTestId("caja.open_shifts.close_button.1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("caja.open_shifts.close_button.2"),
    ).toBeInTheDocument();
  });

  it("opens a shift on the chosen register with a system-user responsible", async () => {
    openShiftMock.mockResolvedValue(shift());
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.open_shift_button"));
    const dialog = await screen.findByTestId("caja.open_shift.dialog");

    // Choose the banco register.
    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.register_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Banco Bogotá/ }),
    );
    // Choose the system user; its name fills the responsible field.
    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.responsible_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Ana Torres/ }),
    );
    // A banco only asks for the bank opening balance.
    await userEvent.type(
      within(dialog).getByTestId("caja.open_shift.bank_input"),
      "9000",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.submit_button"),
    );

    await waitFor(() => expect(openShiftMock).toHaveBeenCalledTimes(1));
    expect(openShiftMock).toHaveBeenCalledWith(null, {
      registerId: 2n,
      responsibleName: "Ana Torres",
      responsibleUserId: 5n,
      openingCash: 0n,
      openingBank: 900000n,
      notes: undefined,
    });
  });

  it("opens a shift with a free-text responsible", async () => {
    openShiftMock.mockResolvedValue(shift());
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.open_shift_button"));
    const dialog = await screen.findByTestId("caja.open_shift.dialog");

    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.register_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Caja principal/ }),
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.open_shift.responsible_input"),
      "Turno de la tarde",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.open_shift.cash_input"),
      "1000",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.submit_button"),
    );

    await waitFor(() => expect(openShiftMock).toHaveBeenCalledTimes(1));
    expect(openShiftMock).toHaveBeenCalledWith(null, {
      registerId: 1n,
      responsibleName: "Turno de la tarde",
      responsibleUserId: undefined,
      openingCash: 100000n,
      openingBank: 0n,
      notes: undefined,
    });
  });

  it("surfaces the backend error when a register already has an open shift", async () => {
    openShiftMock.mockRejectedValue(
      new Error("Ya hay un turno abierto para esta caja o banco"),
    );
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.open_shift_button"));
    const dialog = await screen.findByTestId("caja.open_shift.dialog");

    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.register_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Caja principal/ }),
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.open_shift.responsible_input"),
      "Ana Torres",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.open_shift.cash_input"),
      "1000",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.open_shift.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("caja.open_shift.error_state"),
    ).toHaveTextContent("Ya hay un turno abierto para esta caja o banco");
  });

  it("registers a movement against the chosen open shift", async () => {
    listOpenShiftsMock.mockResolvedValue([
      shift({ id: 7n, registerId: 1n, responsibleName: "Ana Torres" }),
      shift({
        id: 8n,
        registerId: 2n,
        responsibleName: "Carlos Pérez",
        openingCash: 0n,
        openingBank: 900000n,
        computedClosingCash: 0n,
        computedClosingBank: 900000n,
      }),
    ]);
    registerCashMovementMock.mockResolvedValue(movement());
    renderWithProviders(<CajaBancosPage />);

    // Open the movement dialog from the second (banco) shift card.
    await userEvent.click(
      await screen.findByTestId("caja.open_shifts.movement_button.2"),
    );
    const dialog = await screen.findByTestId("caja.movement.dialog");

    // The dialog is pre-selected with the banco shift.
    expect(
      within(dialog).getByTestId("caja.movement.shift_select"),
    ).toHaveTextContent(/Banco Bogotá/);

    await userEvent.type(
      within(dialog).getByTestId("caja.movement.amount_input"),
      "2500",
    );
    await userEvent.type(
      within(dialog).getByTestId("caja.movement.description_input"),
      "Consignación cliente",
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.movement.submit_button"),
    );

    await waitFor(() =>
      expect(registerCashMovementMock).toHaveBeenCalledTimes(1),
    );
    expect(registerCashMovementMock).toHaveBeenCalledWith(null, {
      kind: CashMovementKind.income,
      paymentMethod: PaymentMethod.cash,
      account: CashAccount.cash,
      amount: 250000n,
      description: "Consignación cliente",
      reference: undefined,
      source: CashMovementSource.manual,
      shiftId: 8n,
    });
  });

  it("closes only the chosen shift", async () => {
    listOpenShiftsMock.mockResolvedValue([
      shift({ id: 7n, registerId: 1n, responsibleName: "Ana Torres" }),
      shift({
        id: 8n,
        registerId: 2n,
        responsibleName: "Carlos Pérez",
        openingCash: 0n,
        openingBank: 900000n,
        computedClosingCash: 0n,
        computedClosingBank: 900000n,
      }),
    ]);
    closeShiftMock.mockResolvedValue(
      shift({
        id: 8n,
        registerId: 2n,
        status: ShiftStatus.closed,
        closedAt: TS,
      }),
    );
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(
      await screen.findByTestId("caja.open_shifts.close_button.2"),
    );
    const dialog = await screen.findByTestId("caja.close_shift.dialog");
    expect(dialog).toHaveTextContent("Banco Bogotá");

    await userEvent.click(
      within(dialog).getByTestId("caja.close_shift.submit_button"),
    );

    await waitFor(() => expect(closeShiftMock).toHaveBeenCalledTimes(1));
    expect(closeShiftMock).toHaveBeenCalledWith(null, 8n, {
      declaredClosingCash: 0n,
      declaredClosingBank: 900000n,
      notes: undefined,
    });
  });

  it("changes the responsible of an open shift", async () => {
    listOpenShiftsMock.mockResolvedValue([
      shift({ id: 7n, registerId: 1n, responsibleName: "Ana Torres" }),
    ]);
    setShiftResponsibleMock.mockResolvedValue(
      shift({ responsibleName: "Ana Torres", responsibleUserId: 5n }),
    );
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(
      await screen.findByTestId("caja.open_shifts.responsible_button.1"),
    );
    const dialog = await screen.findByTestId("caja.responsible.dialog");

    await userEvent.click(
      within(dialog).getByTestId("caja.responsible.user_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: /Ana Torres/ }),
    );
    await userEvent.click(
      within(dialog).getByTestId("caja.responsible.submit_button"),
    );

    await waitFor(() =>
      expect(setShiftResponsibleMock).toHaveBeenCalledTimes(1),
    );
    expect(setShiftResponsibleMock).toHaveBeenCalledWith(
      null,
      7n,
      "Ana Torres",
      5n,
    );
  });

  it("shows the chosen shift's report with its register and responsible", async () => {
    listOpenShiftsMock.mockResolvedValue([
      shift({ id: 7n, registerId: 1n, responsibleName: "Ana Torres" }),
      shift({
        id: 8n,
        registerId: 2n,
        responsibleName: "Carlos Pérez",
        openingCash: 0n,
        openingBank: 900000n,
        computedClosingCash: 0n,
        computedClosingBank: 900000n,
      }),
    ]);
    getDailyShiftReportMock.mockResolvedValue(
      dailyReport({
        shift: shift({
          id: 8n,
          registerId: 2n,
          responsibleName: "Carlos Pérez",
        }),
        registerName: "Banco Bogotá",
        responsibleName: "Carlos Pérez",
      }),
    );
    renderWithProviders(<CajaBancosPage />);

    // Open the report from the second (banco) shift card.
    await userEvent.click(
      await screen.findByTestId("caja.open_shifts.report_button.2"),
    );
    const dialog = await screen.findByTestId("caja.report.dialog");

    // The report is scoped to the chosen shift, not the first one.
    await waitFor(() =>
      expect(getDailyShiftReportMock).toHaveBeenCalledWith(null, 8n),
    );
    expect(dialog).toHaveTextContent("Banco Bogotá");
    expect(dialog).toHaveTextContent("Carlos Pérez");
  });

  it("sends the register and responsible filters to listShifts", async () => {
    renderWithProviders(<CajaBancosPage />);

    await userEvent.click(await screen.findByTestId("caja.tab.history"));
    await waitFor(() =>
      expect(listShiftsMock).toHaveBeenCalledWith(
        null,
        {
          registerId: undefined,
          responsible: undefined,
          status: ShiftStatus.closed,
          from: undefined,
          to: undefined,
        },
        0n,
        15n,
      ),
    );

    // Filter by the banco register.
    await userEvent.click(
      await screen.findByTestId("caja.history.register_filter"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Banco Bogotá" }),
    );
    await waitFor(() =>
      expect(listShiftsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ registerId: 2n }),
        0n,
        15n,
      ),
    );

    // Filter by responsible.
    await userEvent.type(
      screen.getByTestId("caja.history.responsible_input"),
      "Carlos",
    );
    await waitFor(() =>
      expect(listShiftsMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ responsible: "Carlos" }),
        0n,
        15n,
      ),
    );
  });
});
