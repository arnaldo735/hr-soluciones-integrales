import { k as useBackend, ak as useQueryClient, al as useMutation, l as useQuery } from "./index-CzQEXdHP.js";
function usePosSales(params) {
  const { actor, isFetching } = useBackend();
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
      return actor.listPosSales(filter, offset, limit);
    },
    enabled: !!actor && !isFetching
  });
}
function usePosSale(id) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["pos-sale", (id == null ? void 0 : id.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getPosSale(id);
    },
    enabled: !!actor && !isFetching && id !== null
  });
}
function useCreatePosSale() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPosSale(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos-sales"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });
}
export {
  usePosSales as a,
  usePosSale as b,
  useCreatePosSale as u
};
