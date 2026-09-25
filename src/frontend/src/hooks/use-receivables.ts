import { useBackend } from "@/hooks/use-backend";
import type {
  Receivable,
  ReceivableFilter,
  ReceivablePayment,
  ReceivablePaymentInput,
  ReceivableStatus,
  ReceivableSummary,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ReceivableListParams {
  status: ReceivableStatus | null;
  search: string;
}

/** Cuentas por cobrar derivadas de las facturas a crédito. */
export function useReceivables(params: ReceivableListParams) {
  const { actor, isFetching } = useBackend();
  const search = params.search.trim();

  return useQuery({
    queryKey: ["receivables", params.status ?? "all", search],
    queryFn: async (): Promise<Receivable[]> => {
      if (!actor) return [];
      const filter: ReceivableFilter = {
        status: params.status ?? undefined,
        search: search.length > 0 ? search : undefined,
      };
      return actor.listReceivables(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Resumen de cartera: total por cobrar, total vencido y cuentas abiertas. */
export function useReceivableSummary() {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["receivable-summary"],
    queryFn: async (): Promise<ReceivableSummary | null> => {
      if (!actor) return null;
      return actor.getReceivableSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Registra un abono sobre una cuenta por cobrar. */
export function useRegisterReceivablePayment() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: ReceivablePaymentInput,
    ): Promise<ReceivablePayment> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerReceivablePayment(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["receivables"] });
      void queryClient.invalidateQueries({ queryKey: ["receivable-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
