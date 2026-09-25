import { useBackend } from "@/hooks/use-backend";
import type {
  Id,
  PosSale,
  PosSaleFilter,
  PosSaleInput,
  PosSalePage,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface PosSaleListParams {
  search: string;
  from: bigint | null;
  to: bigint | null;
  page: number;
  pageSize: number;
}

/** Counter sales history, newest first. */
export function usePosSales(params: PosSaleListParams) {
  const { actor, isFetching } = useBackend();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      "pos-sales",
      search,
      params.from?.toString() ?? "none",
      params.to?.toString() ?? "none",
      params.page,
      params.pageSize,
    ],
    queryFn: async (): Promise<PosSalePage> => {
      if (!actor) throw new Error("Backend no disponible");
      const filter: PosSaleFilter = {
        search: search.length > 0 ? search : undefined,
        from: params.from ?? undefined,
        to: params.to ?? undefined,
      };
      return actor.listPosSales(filter, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePosSale(id: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["pos-sale", id?.toString() ?? "none"],
    queryFn: async (): Promise<PosSale | null> => {
      if (!actor || id === null) return null;
      return actor.getPosSale(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreatePosSale() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PosSaleInput): Promise<PosSale> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPosSale(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
