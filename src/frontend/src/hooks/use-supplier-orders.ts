import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  Id,
  SupplierOrder,
  SupplierOrderFilter,
  SupplierOrderInput,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface SupplierOrderListParams {
  supplierId: Id | null;
  search: string;
}

/** Pedidos a proveedor, opcionalmente acotados a un proveedor. */
export function useSupplierOrders(params: SupplierOrderListParams) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      "supplier-orders",
      params.supplierId?.toString() ?? "all",
      search,
    ],
    queryFn: async (): Promise<SupplierOrder[]> => {
      if (!actor) return [];
      const filter: SupplierOrderFilter = {
        supplierId: params.supplierId ?? undefined,
        search: search.length > 0 ? search : undefined,
      };
      return actor.listSupplierOrders(token, filter);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Guarda un pedido a proveedor con cantidad, SKU y descripción. */
export function useCreateSupplierOrder() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SupplierOrderInput): Promise<SupplierOrder> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createSupplierOrder(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
    },
  });
}
