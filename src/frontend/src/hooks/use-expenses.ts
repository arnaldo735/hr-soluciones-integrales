import { useBackend } from "@/hooks/use-backend";
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryFilter,
  ExpenseCategoryInput,
  ExpenseCategoryUsage,
  ExpenseFilter,
  ExpenseInput,
  ExpensePage,
  ExpenseSummary,
  Id,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ExpenseListParams {
  search: string;
  categoryId: Id | null;
  paymentMethod: string | null;
  from: bigint | null;
  to: bigint | null;
  page: number;
  pageSize: number;
}

export function useExpenses(params: ExpenseListParams) {
  const { actor, isFetching } = useBackend();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      "expenses",
      search,
      params.categoryId?.toString() ?? "all",
      params.paymentMethod ?? "all",
      params.from?.toString() ?? "none",
      params.to?.toString() ?? "none",
      params.page,
      params.pageSize,
    ],
    queryFn: async (): Promise<ExpensePage> => {
      if (!actor) throw new Error("Backend no disponible");
      const filter: ExpenseFilter = {
        search: search.length > 0 ? search : undefined,
        categoryId: params.categoryId ?? undefined,
        paymentMethod: params.paymentMethod ?? undefined,
        from: params.from ?? undefined,
        to: params.to ?? undefined,
      };
      return actor.listExpenses(filter, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExpense(id: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["expense", id?.toString() ?? "none"],
    queryFn: async (): Promise<Expense | null> => {
      if (!actor || id === null) return null;
      return actor.getExpense(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useExpenseSummary(filter: ExpenseFilter) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: [
      "expense-summary",
      filter.categoryId?.toString() ?? "all",
      filter.from?.toString() ?? "none",
      filter.to?.toString() ?? "none",
    ],
    queryFn: async (): Promise<ExpenseSummary | null> => {
      if (!actor) return null;
      return actor.getExpenseSummary(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateExpense() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExpenseInput): Promise<Expense> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createExpense(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: ExpenseInput;
    }): Promise<Expense> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateExpense(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    },
  });
}

/* ---------------------------------------------------------------------------
 * Administrable expense categories.
 *
 * Expense categories are backend-owned records (name + description) rather
 * than a fixed enum. These hooks mirror the service-category CRUD hooks and
 * keep the ledger in sync: renaming or deleting a category changes the
 * `categoryName` shown on every expense, so the expense list and summary are
 * invalidated alongside the category list.
 * ------------------------------------------------------------------------- */

export interface ExpenseCategoryListParams {
  search: string;
}

/**
 * Lists expense categories together with their usage counts. The backend
 * returns `ExpenseCategoryUsage` rows so the management surface can show how
 * many expenses reference each category before offering a delete.
 */
export function useExpenseCategories(params: ExpenseCategoryListParams) {
  const { actor, isFetching } = useBackend();
  const search = params.search.trim();

  return useQuery({
    queryKey: ["expense-categories", search],
    queryFn: async (): Promise<ExpenseCategoryUsage[]> => {
      if (!actor) return [];
      const filter: ExpenseCategoryFilter = {
        search: search.length > 0 ? search : undefined,
      };
      return actor.listExpenseCategories(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExpenseCategory(id: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["expense-category", id?.toString() ?? "none"],
    queryFn: async (): Promise<ExpenseCategory | null> => {
      if (!actor || id === null) return null;
      return actor.getExpenseCategory(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateExpenseCategory() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: ExpenseCategoryInput,
    ): Promise<ExpenseCategory> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createExpenseCategory(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });
}

export function useUpdateExpenseCategory() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: ExpenseCategoryInput;
    }): Promise<ExpenseCategory> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateExpenseCategory(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      // A rename changes `categoryName` on every expense and on the summary
      // breakdown, so refresh the ledger too.
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    },
  });
}

export function useDeleteExpenseCategory() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteExpenseCategory(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    },
  });
}
