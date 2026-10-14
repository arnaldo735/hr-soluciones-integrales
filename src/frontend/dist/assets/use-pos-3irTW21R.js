import { u as useBackend, i as useAuth, aj as useQueryClient, ak as useMutation, k as useQuery } from "./index-CGU00UGU.js";
import { i as invalidateCashData } from "./use-cash-DSqK78YD.js";
function usePosSales(params) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();
  return useQuery({
    queryKey: [
      "pos-sales",
      search,
      "none",
      "none",
      params.page,
      params.pageSize
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      const filter = {
        search: search.length > 0 ? search : void 0,
        from: void 0,
        to: void 0
      };
      return actor.listPosSales(token, filter, offset, limit);
    },
    enabled: !!actor && !isFetching
  });
}
function usePosSale(id) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["pos-sale", (id == null ? void 0 : id.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getPosSale(token, id);
    },
    enabled: !!actor && !isFetching && id !== null
  });
}
function useFindPartByCode() {
  const { actor } = useBackend();
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (code) => {
      if (!actor) throw new Error("Backend no disponible");
      const result = await actor.findPartByCode(token, code);
      return result.__kind__ === "found" ? result.found : null;
    }
  });
}
function useCreatePosSale() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPosSale(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      invalidateCashData(queryClient);
    }
  });
}
export {
  useFindPartByCode as a,
  usePosSales as b,
  usePosSale as c,
  useCreatePosSale as u
};
