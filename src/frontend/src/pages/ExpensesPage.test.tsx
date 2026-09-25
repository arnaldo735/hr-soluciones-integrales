import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryTotal,
  ExpenseCategoryUsage,
  ExpensePage,
  ExpenseSummary,
  Supplier,
} from "@/lib/types";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the expenses ledger and its administrable categories.
 *
 * The accepted change turns the expense categories into backend-owned records
 * (create, rename, delete) instead of a fixed enum. These tests protect the
 * ledger behavior around that change (list, filters, pagination, summary,
 * create/edit/delete, supplier dropdown, notifications) and pin the new
 * administrable-category behavior: the selector sources from the backend, a
 * new category appears immediately, a rename is reflected, and an in-use
 * category cannot be deleted.
 */

const listExpensesMock = vi.fn();
const getExpenseSummaryMock = vi.fn();
const createExpenseMock = vi.fn();
const updateExpenseMock = vi.fn();
const deleteExpenseMock = vi.fn();
const listSuppliersMock = vi.fn();
const listExpenseCategoriesMock = vi.fn();
const createExpenseCategoryMock = vi.fn();
const updateExpenseCategoryMock = vi.fn();
const deleteExpenseCategoryMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listExpenses: listExpensesMock,
      getExpenseSummary: getExpenseSummaryMock,
      createExpense: createExpenseMock,
      updateExpense: updateExpenseMock,
      deleteExpense: deleteExpenseMock,
      listSuppliers: listSuppliersMock,
      listExpenseCategories: listExpenseCategoriesMock,
      createExpenseCategory: createExpenseCategoryMock,
      updateExpenseCategory: updateExpenseCategoryMock,
      deleteExpenseCategory: deleteExpenseCategoryMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function category(overrides: Partial<ExpenseCategory> = {}): ExpenseCategory {
  return {
    id: 3n,
    name: "Repuestos",
    description: "Compra de repuestos y consumibles",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function usage(
  overrides: Partial<ExpenseCategoryUsage> = {},
): ExpenseCategoryUsage {
  return {
    category: category(),
    expenseCount: 0n,
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 1n,
    date: 1_700_000_000_000_000_000n,
    concept: "Compra de aceite sintético",
    categoryId: 3n,
    categoryName: "Repuestos",
    supplierId: 7n,
    supplierName: "Repuestos del Norte",
    amount: 250_000n,
    tax: 40_000n,
    paymentMethod: "cash",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function summary(overrides: Partial<ExpenseSummary> = {}): ExpenseSummary {
  return {
    total: 250_000n,
    count: 1n,
    byCategory: [
      { categoryId: 3n, categoryName: "Repuestos", total: 250_000n },
    ] satisfies ExpenseCategoryTotal[],
    ...overrides,
  };
}

function page(items: Expense[], total = items.length): ExpensePage {
  return {
    items,
    total: BigInt(total),
    offset: 0n,
    limit: 20n,
    summary: summary(),
  };
}

function supplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 7n,
    name: "Repuestos del Norte",
    contactName: "Ana",
    phone: "+57 300 000 0000",
    email: "ana@example.com",
    address: "Calle 1",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

describe("ExpensesPage", () => {
  beforeEach(() => {
    listExpensesMock.mockReset();
    getExpenseSummaryMock.mockReset();
    createExpenseMock.mockReset();
    updateExpenseMock.mockReset();
    deleteExpenseMock.mockReset();
    listSuppliersMock.mockReset();
    listExpenseCategoriesMock.mockReset();
    createExpenseCategoryMock.mockReset();
    updateExpenseCategoryMock.mockReset();
    deleteExpenseCategoryMock.mockReset();
    listExpensesMock.mockResolvedValue(page([]));
    getExpenseSummaryMock.mockResolvedValue(
      summary({ total: 0n, count: 0n, byCategory: [] }),
    );
    listSuppliersMock.mockResolvedValue([]);
    listExpenseCategoriesMock.mockResolvedValue([]);
  });

  it("lists expenses with concept, supplier, method, tax and amount", async () => {
    listExpensesMock.mockResolvedValue(page([expense()]));
    renderWithProviders(<ExpensesPage />);

    expect(
      await screen.findByText("Compra de aceite sintético"),
    ).toBeInTheDocument();
    expect(screen.getByText("Repuestos del Norte")).toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("$ 400")).toBeInTheDocument();
    expect(screen.getByText("$ 2.500")).toBeInTheDocument();
  });

  it("renders an empty state when there are no expenses", async () => {
    renderWithProviders(<ExpensesPage />);

    expect(
      await screen.findByTestId("expenses.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay gastos")).toBeInTheDocument();
  });

  it("renders an error state and retries on demand", async () => {
    listExpensesMock.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<ExpensesPage />);

    expect(
      await screen.findByTestId("expenses.error_state"),
    ).toBeInTheDocument();
    listExpensesMock.mockResolvedValue(page([expense()]));
    await userEvent.click(screen.getByTestId("expenses.retry_button"));

    expect(
      await screen.findByText("Compra de aceite sintético"),
    ).toBeInTheDocument();
  });

  it("passes the trimmed search term to the backend", async () => {
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.type(
      screen.getByTestId("expenses.search_input"),
      "  aceite  ",
    );

    await waitFor(() =>
      expect(listExpensesMock).toHaveBeenCalledWith(
        expect.objectContaining({ search: "aceite" }),
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("passes the selected payment method to the backend", async () => {
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(screen.getByTestId("expenses.method_filter"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Tarjeta" }),
    );

    await waitFor(() =>
      expect(listExpensesMock).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: "card" }),
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("passes the date range to the backend as Colombia day bounds", async () => {
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.type(
      screen.getByTestId("expenses.date_from_input"),
      "2026-01-05",
    );
    await userEvent.type(
      screen.getByTestId("expenses.date_to_input"),
      "2026-01-10",
    );

    await waitFor(() => {
      const lastCall =
        listExpensesMock.mock.calls[listExpensesMock.mock.calls.length - 1];
      const filter = lastCall[0] as { from?: bigint; to?: bigint };
      expect(filter.from).toBeDefined();
      expect(filter.to).toBeDefined();
      expect(filter.from! < filter.to!).toBe(true);
    });
  });

  it("requests the next page when the pagination control is used", async () => {
    listExpensesMock.mockResolvedValue(page([expense()], 45));
    renderWithProviders(<ExpensesPage />);
    await screen.findByText("Compra de aceite sintético");

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("expenses.pagination_next"));

    await waitFor(() =>
      expect(listExpensesMock).toHaveBeenCalledWith(
        expect.anything(),
        20n,
        expect.anything(),
      ),
    );
  });

  it("shows the period totals from the summary", async () => {
    getExpenseSummaryMock.mockResolvedValue(
      summary({ total: 1_234_500n, count: 3n }),
    );
    renderWithProviders(<ExpensesPage />);

    expect(await screen.findByText("$ 12.345")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the category breakdown panel with its totals", async () => {
    getExpenseSummaryMock.mockResolvedValue(
      summary({
        total: 250_000n,
        count: 1n,
        byCategory: [
          { categoryId: 3n, categoryName: "Repuestos", total: 250_000n },
        ],
      }),
    );
    renderWithProviders(<ExpensesPage />);

    const panel = await screen.findByTestId("expenses.category_panel");
    expect(await within(panel).findByText("$ 2.500")).toBeInTheDocument();
  });

  it("clears the filters and returns to the unfiltered list", async () => {
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.type(screen.getByTestId("expenses.search_input"), "aceite");
    await userEvent.click(
      await screen.findByTestId("expenses.clear_filters_button"),
    );

    expect(screen.getByTestId("expenses.search_input")).toHaveValue("");
    await waitFor(() =>
      expect(listExpensesMock).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined }),
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("registers an expense with the typed concept, amount and method", async () => {
    listExpenseCategoriesMock.mockResolvedValue([usage()]);
    createExpenseMock.mockResolvedValue(expense());
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(screen.getByTestId("expenses.create_button"));
    await userEvent.type(
      screen.getByTestId("expenses.concept_input"),
      "Cambio de aceite",
    );
    await userEvent.type(screen.getByTestId("expenses.amount_input"), "150.50");
    await userEvent.type(screen.getByTestId("expenses.tax_input"), "19");
    await userEvent.click(screen.getByTestId("expenses.category_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Repuestos" }),
    );
    await userEvent.click(screen.getByTestId("expenses.submit_button"));

    await waitFor(() => expect(createExpenseMock).toHaveBeenCalledTimes(1));
    expect(createExpenseMock.mock.calls[0][0]).toMatchObject({
      concept: "Cambio de aceite",
      categoryId: 3n,
      amount: 15050n,
      tax: 1900n,
      paymentMethod: "cash",
    });
  });

  it("blocks a zero amount and does not call the backend", async () => {
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(screen.getByTestId("expenses.create_button"));
    await userEvent.type(
      screen.getByTestId("expenses.concept_input"),
      "Prueba",
    );
    await userEvent.type(screen.getByTestId("expenses.amount_input"), "0");
    await userEvent.click(screen.getByTestId("expenses.submit_button"));

    expect(
      await screen.findByTestId("expenses.form_error"),
    ).toBeInTheDocument();
    expect(createExpenseMock).not.toHaveBeenCalled();
  });

  it("edits an existing expense with its current values", async () => {
    listExpensesMock.mockResolvedValue(page([expense()]));
    listExpenseCategoriesMock.mockResolvedValue([usage()]);
    updateExpenseMock.mockResolvedValue(expense());
    renderWithProviders(<ExpensesPage />);
    await screen.findByText("Compra de aceite sintético");

    await userEvent.click(screen.getByTestId("expenses.edit_button.1"));
    expect(screen.getByTestId("expenses.concept_input")).toHaveValue(
      "Compra de aceite sintético",
    );

    await userEvent.clear(screen.getByTestId("expenses.concept_input"));
    await userEvent.type(
      screen.getByTestId("expenses.concept_input"),
      "Compra de filtros",
    );
    await userEvent.click(screen.getByTestId("expenses.submit_button"));

    await waitFor(() => expect(updateExpenseMock).toHaveBeenCalledTimes(1));
    expect(updateExpenseMock.mock.calls[0][0]).toBe(1n);
    expect(updateExpenseMock.mock.calls[0][1]).toMatchObject({
      concept: "Compra de filtros",
      categoryId: 3n,
    });
  });

  it("deletes an expense only after confirming", async () => {
    listExpensesMock.mockResolvedValue(page([expense()]));
    deleteExpenseMock.mockResolvedValue(true);
    renderWithProviders(<ExpensesPage />);
    await screen.findByText("Compra de aceite sintético");

    await userEvent.click(screen.getByTestId("expenses.delete_button.1"));
    expect(deleteExpenseMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("expenses.confirm_button"));
    await waitFor(() => expect(deleteExpenseMock).toHaveBeenCalledWith(1n));
  });

  it("offers the registered suppliers in the expense form", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(screen.getByTestId("expenses.create_button"));
    await userEvent.click(screen.getByTestId("expenses.supplier_select"));

    expect(
      await screen.findByRole("option", { name: "Repuestos del Norte" }),
    ).toBeInTheDocument();
  });

  it("reports a successful save with a notification", async () => {
    listExpenseCategoriesMock.mockResolvedValue([usage()]);
    createExpenseMock.mockResolvedValue(expense());
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(screen.getByTestId("expenses.create_button"));
    await userEvent.type(
      screen.getByTestId("expenses.concept_input"),
      "Prueba",
    );
    await userEvent.type(screen.getByTestId("expenses.amount_input"), "10");
    await userEvent.click(screen.getByTestId("expenses.category_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Repuestos" }),
    );
    await userEvent.click(screen.getByTestId("expenses.submit_button"));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Gasto registrado"),
    );
  });

  // --- Accepted behavior: administrable expense categories ------------------
  //
  // The accepted change replaces the fixed category enum with backend-owned
  // records. These tests pin the observable contract: the selector sources its
  // options from the backend, a newly created category appears immediately, a
  // rename is reflected on the expenses that use it, and an in-use category
  // cannot be deleted.

  it("sources the category selector from the backend categories", async () => {
    listExpenseCategoriesMock.mockResolvedValue([
      usage({ category: category({ id: 3n, name: "Repuestos" }) }),
      usage({ category: category({ id: 4n, name: "Renta" }) }),
    ]);
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(screen.getByTestId("expenses.create_button"));
    await userEvent.click(screen.getByTestId("expenses.category_select"));

    expect(
      await screen.findByRole("option", { name: "Repuestos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Renta" })).toBeInTheDocument();
  });

  it("creates a category from the management dialog and shows it immediately", async () => {
    // The list is empty until the create succeeds; the refetch then returns the
    // new category, so the dialog must re-query rather than serve its cache.
    listExpenseCategoriesMock
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        usage({ category: category({ id: 9n, name: "Lavado" }) }),
      ]);
    createExpenseCategoryMock.mockResolvedValue(
      category({ id: 9n, name: "Lavado" }),
    );
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(
      screen.getAllByTestId("expenses.manage_categories_button")[0],
    );
    await screen.findByTestId("expense_categories.dialog");

    await userEvent.type(
      screen.getByTestId("expense_categories.name_input"),
      "Lavado",
    );
    await userEvent.click(
      screen.getByTestId("expense_categories.submit_button"),
    );

    await waitFor(() =>
      expect(createExpenseCategoryMock).toHaveBeenCalledWith({
        name: "Lavado",
        description: "",
      }),
    );
    expect(await screen.findByText("Lavado")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Categoría creada");
  });

  it("renames a category and reflects the change on the expenses that use it", async () => {
    listExpenseCategoriesMock.mockResolvedValue([usage()]);
    updateExpenseCategoryMock.mockResolvedValue(
      category({ name: "Repuestos y consumibles" }),
    );
    // The ledger refetch after the rename returns the expense with the new
    // denormalized category name.
    listExpensesMock
      .mockResolvedValueOnce(page([expense()]))
      .mockResolvedValue(
        page([expense({ categoryName: "Repuestos y consumibles" })]),
      );
    renderWithProviders(<ExpensesPage />);
    await screen.findByText("Compra de aceite sintético");

    await userEvent.click(
      screen.getAllByTestId("expenses.manage_categories_button")[0],
    );
    await screen.findByTestId("expense_categories.dialog");

    await userEvent.click(
      screen.getByTestId("expense_categories.edit_button.3"),
    );
    const nameInput = screen.getByTestId("expense_categories.name_input");
    expect(nameInput).toHaveValue("Repuestos");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Repuestos y consumibles");
    await userEvent.click(
      screen.getByTestId("expense_categories.submit_button"),
    );

    await waitFor(() =>
      expect(updateExpenseCategoryMock).toHaveBeenCalledWith(3n, {
        name: "Repuestos y consumibles",
        description: "Compra de repuestos y consumibles",
      }),
    );
    // The rename is reflected on the expense that uses the category.
    expect(
      await screen.findByText("Repuestos y consumibles"),
    ).toBeInTheDocument();
  });

  it("warns and keeps an in-use category when deletion is refused", async () => {
    // The backend refuses to delete a category that still has expenses; the
    // dialog surfaces the Spanish warning and the category stays in the list.
    listExpenseCategoriesMock.mockResolvedValue([usage({ expenseCount: 2n })]);
    deleteExpenseCategoryMock.mockRejectedValue(
      new Error("inUse: 3 (2 gastos)"),
    );
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(
      screen.getAllByTestId("expenses.manage_categories_button")[0],
    );
    await screen.findByTestId("expense_categories.dialog");

    // The delete control is disabled while the category is in use.
    expect(
      screen.getByTestId("expense_categories.delete_button.3"),
    ).toBeDisabled();
    expect(screen.getByText("Repuestos")).toBeInTheDocument();
    expect(deleteExpenseCategoryMock).not.toHaveBeenCalled();
  });

  it("deletes an unused category after confirming", async () => {
    listExpenseCategoriesMock
      .mockResolvedValueOnce([usage({ expenseCount: 0n })])
      .mockResolvedValue([]);
    deleteExpenseCategoryMock.mockResolvedValue(true);
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(
      screen.getAllByTestId("expenses.manage_categories_button")[0],
    );
    await screen.findByTestId("expense_categories.dialog");

    await userEvent.click(
      screen.getByTestId("expense_categories.delete_button.3"),
    );
    await userEvent.click(
      screen.getByTestId("expense_categories.delete_confirm_button"),
    );

    await waitFor(() =>
      expect(deleteExpenseCategoryMock).toHaveBeenCalledWith(3n),
    );
    expect(toast.success).toHaveBeenCalledWith("Categoría eliminada");
  });

  it("surfaces the backend refusal when a category is still in use", async () => {
    // A category whose usage count is stale can still be attempted; the backend
    // trap is translated into a Spanish warning and the category remains.
    listExpenseCategoriesMock.mockResolvedValue([usage({ expenseCount: 0n })]);
    deleteExpenseCategoryMock.mockRejectedValue(
      new Error("inUse: 3 (2 gastos)"),
    );
    renderWithProviders(<ExpensesPage />);
    await screen.findByTestId("expenses.empty_state");

    await userEvent.click(
      screen.getAllByTestId("expenses.manage_categories_button")[0],
    );
    await screen.findByTestId("expense_categories.dialog");

    await userEvent.click(
      screen.getByTestId("expense_categories.delete_button.3"),
    );
    await userEvent.click(
      screen.getByTestId("expense_categories.delete_confirm_button"),
    );

    const error = await screen.findByTestId("expense_categories.delete_error");
    expect(error).toHaveTextContent("No se puede eliminar");
    expect(error).toHaveTextContent("2 gastos");
    // The category is still listed.
    expect(screen.getByTestId("expense_categories.item.3")).toHaveTextContent(
      "Repuestos",
    );
  });
});
