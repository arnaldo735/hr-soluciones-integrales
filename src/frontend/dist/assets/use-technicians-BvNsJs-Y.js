import { k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation } from "./index-EqGEeyjs.js";
function useTechnicians(params) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();
  return useQuery({
    queryKey: [
      "technicians",
      search,
      params.specialty ?? "all",
      params.activeOnly
    ],
    queryFn: async () => {
      if (!actor) return [];
      const filter = {
        search: search.length > 0 ? search : void 0,
        specialty: params.specialty ?? void 0,
        activeOnly: params.activeOnly ? true : void 0
      };
      return actor.listTechnicians(token, filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useTechnicianWorkloads() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["technician-workloads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTechnicianWorkload(token);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createTechnician(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technicians"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"]
      });
    }
  });
}
function useUpdateTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateTechnician(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technicians"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"]
      });
    }
  });
}
function useDeleteTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteTechnician(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technicians"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"]
      });
    }
  });
}
export {
  useTechnicianWorkloads as a,
  useDeleteTechnician as b,
  useCreateTechnician as c,
  useUpdateTechnician as d,
  useTechnicians as u
};
