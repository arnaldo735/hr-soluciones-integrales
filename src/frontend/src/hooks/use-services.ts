import type { ZeroServicesResult } from "@/backend";
import { useBackend } from "@/hooks/use-backend";
import type {
  Id,
  Service,
  ServiceFilter,
  ServiceInput,
  ServicePage,
  ServiceSort,
} from "@/lib/types";
import { ServiceSort as ServiceSortEnum } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ServiceListParams {
  search: string;
  category: string | null;
  activeOnly: boolean;
  sort: ServiceSort;
  page: number;
  pageSize: number;
}

export function useServices(params: ServiceListParams) {
  const { actor, isFetching } = useBackend();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      "services",
      search,
      params.category ?? "all",
      params.activeOnly,
      params.sort,
      params.page,
      params.pageSize,
    ],
    queryFn: async (): Promise<ServicePage> => {
      if (!actor) throw new Error("Backend no disponible");
      const filter: ServiceFilter = {
        search: search.length > 0 ? search : undefined,
        category: params.category ?? undefined,
        activeOnly: params.activeOnly ? true : undefined,
      };
      return actor.listServices(filter, params.sort, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useService(id: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["service", id?.toString() ?? "none"],
    queryFn: async (): Promise<Service | null> => {
      if (!actor || id === null) return null;
      return actor.getService(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateService() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ServiceInput): Promise<Service> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createService(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useUpdateService() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: ServiceInput;
    }): Promise<Service> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateService(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useDeleteService() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteService(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

/**
 * Deletes every workshop service in the catalog and reports how many were
 * removed. Admin-gated on the backend; the caller must be an administrator.
 */
export function useZeroServices() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ZeroServicesResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.zeroServices();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["service"] });
      // The category catalog shows a per-category service count, so it must
      // refetch after the catalog is emptied.
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    },
  });
}

export { ServiceSortEnum as ServiceSort };
