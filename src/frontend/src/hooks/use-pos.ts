import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  Id,
  PartView,
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
  const { token } = useAuth();
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
      return actor.listPosSales(token, filter, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePosSale(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["pos-sale", id?.toString() ?? "none"],
    queryFn: async (): Promise<PosSale | null> => {
      if (!actor || id === null) return null;
      return actor.getPosSale(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/**
 * Resolves a scanned or manually typed code to a catalog part through the
 * backend `findPartByCode`, which matches both the barcode and the SKU.
 *
 * Returns the resolved `PartView` when the code exists and `null` when it does
 * not, so the POS can add the part to the cart or show the "producto no
 * encontrado" notice without adding anything.
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

export function useCreatePosSale() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PosSaleInput): Promise<PosSale> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPosSale(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      // Prefix-matches the picker query key ["parts", "picker", term] used by
      // useParts, so the POS product search refetches the updated stock after a
      // sale is registered.
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
