import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  Id,
  Technician,
  TechnicianFilter,
  TechnicianInput,
  TechnicianWorkload,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface TechnicianListParams {
  search: string;
  specialty: string | null;
  activeOnly: boolean;
}

export function useTechnicians(params: TechnicianListParams) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      "technicians",
      search,
      params.specialty ?? "all",
      params.activeOnly,
    ],
    queryFn: async (): Promise<Technician[]> => {
      if (!actor) return [];
      const filter: TechnicianFilter = {
        search: search.length > 0 ? search : undefined,
        specialty: params.specialty ?? undefined,
        activeOnly: params.activeOnly ? true : undefined,
      };
      return actor.listTechnicians(token, filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTechnician(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["technician", id?.toString() ?? "none"],
    queryFn: async (): Promise<Technician | null> => {
      if (!actor || id === null) return null;
      return actor.getTechnician(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useTechnicianWorkloads() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["technician-workloads"],
    queryFn: async (): Promise<TechnicianWorkload[]> => {
      if (!actor) return [];
      return actor.listTechnicianWorkload(token);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TechnicianInput): Promise<Technician> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createTechnician(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technicians"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"],
      });
    },
  });
}

export function useUpdateTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: TechnicianInput;
    }): Promise<Technician> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateTechnician(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technicians"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"],
      });
    },
  });
}

export function useDeleteTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteTechnician(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technicians"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"],
      });
    },
  });
}
