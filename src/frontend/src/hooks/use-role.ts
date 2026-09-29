import { useAuth } from "@/hooks/use-auth";
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
  /**
   * Módulos permitidos del rol activo. `null` significa sin restricción por
   * módulo (administrador por Internet Identity); un arreglo vacío significa
   * que el rol no habilita ningún módulo.
   */
  modules: string[] | null;
  /** Nombre del rol activo, listo para mostrar. */
  roleName: string;
  refetch: () => void;
}

/**
 * Resuelve el rol efectivo del llamador. Cuando hay una sesión con usuario y
 * contraseña, el rol y los módulos vienen de esa sesión; en la vía de Internet
 * Identity se consulta el rol al backend. Es la única fuente de verdad para la
 * navegación y las guardas de ruta.
 */
export function useRole(): CallerRole {
  const { actor, isFetching } = useBackend();
  const auth = useAuth();

  const query = useQuery({
    queryKey: ["caller-role"],
    queryFn: async (): Promise<UserRole> => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && !auth.user,
    // The role is stable for the whole session, so it is resolved once and
    // reused by every screen that gates on it.
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Con sesión de contraseña, el rol y los módulos vienen de la sesión.
  if (auth.user) {
    return {
      role: auth.isAdmin ? UserRole.admin : UserRole.user,
      isAdmin: auth.isAdmin,
      isLoading: false,
      isError: false,
      modules: auth.modules,
      roleName: auth.roleName,
      refetch: auth.refetch,
    };
  }

  const role = query.data ?? null;

  return {
    role,
    isAdmin: role === UserRole.admin,
    isLoading:
      auth.isRestoring ||
      query.isLoading ||
      isFetching ||
      (!actor && !query.isError),
    isError: query.isError,
    modules: null,
    roleName: role === UserRole.admin ? "Administrador" : "Mecánico",
    refetch: () => {
      void query.refetch();
    },
  };
}
