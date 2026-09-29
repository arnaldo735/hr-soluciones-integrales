import type {
  Id,
  ServiceCategory,
  ServiceCategoryFilter,
  ServiceCategoryInput,
  ServiceCategoryUsage,
} from "@/backend";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ServiceCategoryListParams {
  search: string;
}

/**
 * Lists service categories together with their usage counts. The backend
 * returns `ServiceCategoryUsage` rows so the catalog can show how many
 * services (and how many active services) reference each category.
 */
export function useServiceCategories(params: ServiceCategoryListParams) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();

  return useQuery({
    queryKey: ["service-categories", search],
    queryFn: async (): Promise<ServiceCategoryUsage[]> => {
      if (!actor) return [];
      const filter: ServiceCategoryFilter = {
        search: search.length > 0 ? search : undefined,
      };
      return actor.listServiceCategories(token, filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useServiceCategory(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["service-category", id?.toString() ?? "none"],
    queryFn: async (): Promise<ServiceCategory | null> => {
      if (!actor || id === null) return null;
      return actor.getServiceCategory(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateServiceCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: ServiceCategoryInput,
    ): Promise<ServiceCategory> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createServiceCategory(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    },
  });
}

export function useUpdateServiceCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: ServiceCategoryInput;
    }): Promise<ServiceCategory> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateServiceCategory(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    },
  });
}

export function useDeleteServiceCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteServiceCategory(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    },
  });
}
