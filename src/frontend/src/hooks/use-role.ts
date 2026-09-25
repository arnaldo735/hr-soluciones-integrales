import { useBackend } from "@/hooks/use-backend";
import { UserRole } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export interface CallerRole {
  /** The caller's role, or `null` while it is still being resolved. */
  role: UserRole | null;
  /** True only when the caller holds the owner/administrator role. */
  isAdmin: boolean;
  /** True while the role query is in flight or the actor is not ready. */
  isLoading: boolean;
  /** True when the role could not be resolved. */
  isError: boolean;
  refetch: () => void;
}

/**
 * Resolves the caller's role from the backend. The first registered user is
 * promoted to `admin` by the backend, so this is the single source of truth
 * for role-aware navigation and route gating.
 */
export function useRole(): CallerRole {
  const { actor, isFetching } = useBackend();

  const query = useQuery({
    queryKey: ["caller-role"],
    queryFn: async (): Promise<UserRole> => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    // The role is stable for the whole session, so it is resolved once and
    // reused by every screen that gates on it.
    staleTime: Number.POSITIVE_INFINITY,
  });

  const role = query.data ?? null;

  return {
    role,
    isAdmin: role === UserRole.admin,
    isLoading: query.isLoading || isFetching || (!actor && !query.isError),
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
