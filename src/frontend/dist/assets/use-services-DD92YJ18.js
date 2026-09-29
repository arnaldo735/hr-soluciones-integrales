import { k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation } from "./index-EqGEeyjs.js";
function useServices(params) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();
  const enabled = params.enabled ?? true;
  return useQuery({
    queryKey: [
      "services",
      search,
      params.category ?? "all",
      params.activeOnly,
      params.sort,
      params.page,
      params.pageSize
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      const filter = {
        search: search.length > 0 ? search : void 0,
        category: params.category ?? void 0,
        activeOnly: params.activeOnly ? true : void 0
      };
      return actor.listServices(token, filter, params.sort, offset, limit);
    },
    enabled: !!actor && !isFetching && enabled
  });
}
function useService(id) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["service", (id == null ? void 0 : id.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getService(token, id);
    },
    enabled: !!actor && !isFetching && id !== null
  });
}
function useCreateService() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createService(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    }
  });
}
function useUpdateService() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateService(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    }
  });
}
function useDeleteService() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteService(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    }
  });
}
function useZeroServices() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.zeroServices(token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["service"] });
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    }
  });
}
export {
  useService as a,
  useDeleteService as b,
  useCreateService as c,
  useUpdateService as d,
  useZeroServices as e,
  useServices as u
};
