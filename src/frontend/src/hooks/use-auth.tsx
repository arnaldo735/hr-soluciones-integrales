import { useBackend } from "@/hooks/use-backend";
import type { SessionInfo } from "@/lib/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

/**
 * Clave de almacenamiento del token de sesión. La sesión con usuario y
 * contraseña vive en `localStorage` para sobrevivir a una recarga; el backend
 * sigue siendo la fuente de verdad y `getSession` la valida en cada arranque.
 */
const SESSION_TOKEN_KEY = "hr-session-token";

/** Lee el token guardado, tolerando entornos sin `localStorage`. */
function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Guarda o borra el token de sesión de forma tolerante a fallos. */
function writeStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // La persistencia es best-effort; la sesión en memoria sigue funcionando.
  }
}

/** Motivo por el que un ingreso falló, para mostrar el aviso correcto. */
export type AuthErrorKind =
  | "invalidCredentials"
  | "inactiveAccount"
  | "unknown";

export interface AuthContextValue {
  /** Usuario de la sesión activa, o `null` si no hay sesión. */
  user: SessionInfo | null;
  /** Token de la sesión con contraseña, o `null` en la vía Internet Identity. */
  token: string | null;
  /** True cuando hay una sesión válida (contraseña o Internet Identity). */
  isAuthenticated: boolean;
  /** True mientras se restaura la sesión al cargar la aplicación. */
  isRestoring: boolean;
  /** True cuando el usuario activo es administrador. */
  isAdmin: boolean;
  /** Módulos permitidos del rol activo; `null` = sin restricción (admin II). */
  modules: string[] | null;
  /** Nombre del rol activo, listo para mostrar. */
  roleName: string;
  /** Inicia sesión con usuario y contraseña. */
  login: (username: string, password: string) => Promise<void>;
  /** Cierra la sesión activa (contraseña o Internet Identity). */
  logout: () => void;
  /** Vuelve a leer la sesión desde el backend. */
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Traduce el error del backend a un motivo de ingreso reconocible. */
export function classifyAuthError(error: unknown): AuthErrorKind {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const normalized = message.toLowerCase();
  if (normalized.includes("desactivada")) return "inactiveAccount";
  if (
    normalized.includes("incorrect") ||
    normalized.includes("credencial") ||
    normalized.includes("usuario")
  ) {
    return "invalidCredentials";
  }
  return "unknown";
}

/**
 * Sesión compartida de la aplicación. Resuelve el usuario activo por dos vías:
 * la sesión con usuario y contraseña (token en `localStorage`, validado con
 * `getSession`) y la vía de Internet Identity para el administrador. Expone el
 * usuario, su rol y sus módulos permitidos, y las acciones de ingreso y salida.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useBackend();
  const { isAuthenticated: isIdentityAuthenticated, clear } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => readStoredToken());

  const sessionQuery = useQuery({
    queryKey: ["auth-session", token],
    queryFn: async (): Promise<SessionInfo | null> => {
      if (!actor || !token) return null;
      return actor.getSession(token);
    },
    enabled: !!actor && !isFetching && !!token,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  // Un token vencido o revocado se descarta para no bloquear el arranque.
  useEffect(() => {
    if (!token) return;
    if (!sessionQuery.isError && sessionQuery.data !== null) return;
    if (sessionQuery.isError || sessionQuery.data === null) {
      writeStoredToken(null);
      setToken(null);
    }
  }, [token, sessionQuery.isError, sessionQuery.data]);

  const sessionUser = token ? (sessionQuery.data ?? null) : null;

  const login = useCallback(
    async (username: string, password: string) => {
      if (!actor) throw new Error("Backend no disponible");
      const result = await actor.login(username, password);
      writeStoredToken(result.token);
      setToken(result.token);
      queryClient.setQueryData(["auth-session", result.token], result.user);
    },
    [actor, queryClient],
  );

  const logout = useCallback(() => {
    const activeToken = token;
    writeStoredToken(null);
    setToken(null);
    queryClient.removeQueries({ queryKey: ["auth-session"] });
    if (activeToken && actor) {
      void actor.logout(activeToken).catch(() => {
        // El cierre local ya ocurrió; un fallo de red no debe bloquear la salida.
      });
    }
    if (isIdentityAuthenticated) {
      clear();
    }
  }, [actor, token, queryClient, isIdentityAuthenticated, clear]);

  const refetch = useCallback(() => {
    void sessionQuery.refetch();
  }, [sessionQuery]);

  const value = useMemo<AuthContextValue>(() => {
    const isPasswordSession = !!sessionUser;
    const isAdmin = isPasswordSession
      ? sessionUser.roleId === 0n
      : isIdentityAuthenticated;
    const roleName = isPasswordSession
      ? sessionUser.roleName
      : isIdentityAuthenticated
        ? "Administrador"
        : "Invitado";
    // Mientras haya un token guardado, la sesión se considera en restauración
    // hasta que el actor esté listo y la consulta haya resuelto. Con el actor
    // aún no disponible la consulta queda deshabilitada y `isLoading` es
    // `false`, así que también se cubre ese caso para no parpadear el login.
    const isRestoring =
      !!token &&
      (!actor ||
        isFetching ||
        sessionQuery.isLoading ||
        sessionQuery.isPending);
    return {
      user: sessionUser,
      token,
      isAuthenticated: isPasswordSession || isIdentityAuthenticated,
      isRestoring,
      isAdmin,
      modules: isPasswordSession ? sessionUser.modules : null,
      roleName,
      login,
      logout,
      refetch,
    };
  }, [
    sessionUser,
    token,
    actor,
    isFetching,
    isIdentityAuthenticated,
    sessionQuery.isLoading,
    sessionQuery.isPending,
    login,
    logout,
    refetch,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Accede a la sesión compartida. Debe usarse dentro de `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
