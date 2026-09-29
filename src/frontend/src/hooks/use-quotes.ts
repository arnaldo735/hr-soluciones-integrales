import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  Id,
  PartView,
  PaymentMethod,
  QuoteFilter,
  QuoteInput,
  QuotePage,
  QuoteSort,
  QuoteStatus,
  QuoteView,
} from "@/lib/types";
import {
  QuoteSort as QuoteSortEnum,
  QuoteStatus as QuoteStatusEnum,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Spanish labels for every quote status. */
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  [QuoteStatusEnum.draft]: "Borrador",
  [QuoteStatusEnum.sent]: "Enviada",
  [QuoteStatusEnum.accepted]: "Aceptada",
  [QuoteStatusEnum.rejected]: "Rechazada",
  [QuoteStatusEnum.expired]: "Vencida",
};

/** Badge class per quote status, using the design system's status tokens. */
export const QUOTE_STATUS_BADGE: Record<QuoteStatus, string> = {
  [QuoteStatusEnum.draft]: "badge-draft",
  [QuoteStatusEnum.sent]: "badge-sent",
  [QuoteStatusEnum.accepted]: "badge-accepted",
  [QuoteStatusEnum.rejected]: "badge-rejected",
  [QuoteStatusEnum.expired]: "badge-expired",
};

export interface QuoteListParams {
  status: QuoteStatus | null;
  search: string;
  sort: QuoteSort;
  page: number;
  pageSize: number;
}

export function useQuotes(params: QuoteListParams) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      "quotes",
      params.status ?? "all",
      search,
      params.sort,
      params.page,
      params.pageSize,
    ],
    queryFn: async (): Promise<QuotePage> => {
      if (!actor) throw new Error("Backend no disponible");
      const filter: QuoteFilter = {
        status: params.status ?? undefined,
        search: search.length > 0 ? search : undefined,
      };
      return actor.listQuotes(token, filter, params.sort, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Resolves display names for the customers and motorcycles referenced by a
 * page of quotes. `listQuotes` returns only ids, so the list view needs a
 * lookup pass to render readable rows. Motorcycle plates are resolved through
 * each customer's motorcycle list because the backend exposes no direct
 * motorcycle-by-id lookup.
 */
export function useQuoteLookups(customerIds: Id[], motorcycleIds: Id[]) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const customerKey = customerIds
    .map((id) => id.toString())
    .sort()
    .join(",");
  const motorcycleKey = motorcycleIds
    .map((id) => id.toString())
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["quote-lookups", customerKey, motorcycleKey],
    queryFn: async (): Promise<{
      customers: Map<string, string>;
      motorcycles: Map<string, string>;
    }> => {
      const customers = new Map<string, string>();
      const motorcycles = new Map<string, string>();
      if (!actor) return { customers, motorcycles };

      const uniqueCustomers = Array.from(
        new Set(customerIds.map((id) => id.toString())),
      );

      const results = await Promise.all(
        uniqueCustomers.map(async (id) => {
          const [customer, motos] = await Promise.all([
            actor.getCustomer(token, BigInt(id)),
            actor.listMotorcycles(token, BigInt(id)),
          ]);
          return { id, name: customer?.name ?? null, motos };
        }),
      );

      for (const entry of results) {
        if (entry.name) customers.set(entry.id, entry.name);
        for (const moto of entry.motos) {
          motorcycles.set(moto.id.toString(), moto.plate);
        }
      }

      return { customers, motorcycles };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useQuote(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["quote", id?.toString() ?? "none"],
    queryFn: async (): Promise<QuoteView | null> => {
      if (!actor || id === null) return null;
      return actor.getQuote(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/**
 * Resolves a scanned or typed barcode/SKU to a catalog part through the
 * backend `findPartByCode`, which matches both the barcode and the SKU.
 *
 * Returns the resolved `PartView` when the code exists and `null` when it does
 * not, so the caller can add the part to the active line or show the
 * "producto no encontrado" notice without adding anything.
 */
export function useFindPartByCode() {
  const { actor } = useBackend();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (code: string): Promise<PartView | null> => {
      if (!actor) throw new Error("Backend no disponible");
      const result = await actor.findPartByCode(token, code);
      return result.__kind__ === "found" ? result.found : null;
    },
  });
}

export function useCreateQuote() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: QuoteInput): Promise<QuoteView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createQuote(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useUpdateQuote() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: QuoteInput;
    }): Promise<QuoteView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateQuote(token, id, input);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({
        queryKey: ["quote", view.quote.id.toString()],
      });
    },
  });
}

export function useUpdateQuoteStatus() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: Id;
      status: QuoteStatus;
    }): Promise<QuoteView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateQuoteStatus(token, id, status);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({
        queryKey: ["quote", view.quote.id.toString()],
      });
    },
  });
}

export function useDeleteQuote() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteQuote(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useConvertQuoteToInvoice() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      paymentMethod,
    }: {
      id: Id;
      paymentMethod: PaymentMethod;
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.convertQuoteToInvoice(token, id, paymentMethod);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useConvertQuoteToOrder() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.convertQuoteToOrder(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export { QuoteSortEnum as QuoteSort };
