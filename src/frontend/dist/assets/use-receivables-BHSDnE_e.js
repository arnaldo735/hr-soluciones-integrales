import { u as useBackend, i as useAuth, k as useQuery, aj as useQueryClient, ak as useMutation } from "./index-CGU00UGU.js";
import { i as invalidateCashData } from "./use-cash-DSqK78YD.js";
function useReceivables(params) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();
  return useQuery({
    queryKey: ["receivables", params.status ?? "all", search],
    queryFn: async () => {
      if (!actor) return [];
      const filter = {
        status: params.status ?? void 0,
        search: search.length > 0 ? search : void 0
      };
      return actor.listReceivables(token, filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useReceivableSummary() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["receivable-summary"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReceivableSummary(token);
    },
    enabled: !!actor && !isFetching
  });
}
function useRegisterReceivablePayment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerReceivablePayment(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["receivables"] });
      void queryClient.invalidateQueries({ queryKey: ["receivable-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      invalidateCashData(queryClient);
    }
  });
}
export {
  useReceivableSummary as a,
  useRegisterReceivablePayment as b,
  useReceivables as u
};
