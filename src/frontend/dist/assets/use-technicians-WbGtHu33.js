import { k as useBackend, l as useQuery, ak as useQueryClient, al as useMutation } from "./index-CzQEXdHP.js";
function useTechnicians(params) {
  const { actor, isFetching } = useBackend();
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
      return actor.listTechnicians(filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useTechnicianWorkloads() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["technician-workloads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTechnicianWorkload();
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateTechnician() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createTechnician(input);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateTechnician(id, input);
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteTechnician(id);
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
