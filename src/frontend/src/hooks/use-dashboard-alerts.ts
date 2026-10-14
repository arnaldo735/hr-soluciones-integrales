import type { DashboardAlertsSummary } from "@/backend";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";

export type {
  DashboardAlertsSummary,
  ReminderAppointment,
  ReminderFinishedOrder,
  ReminderLowStockPart,
  ReminderOrder,
  ReminderPayable,
  ReminderQuote,
  ReminderReceivable,
  ReminderSupplierOrder,
} from "@/backend";

/** Clave de React Query del resumen de alertas del panel. */
export const DASHBOARD_ALERTS_QUERY_KEY = ["dashboard-alerts"] as const;

/**
 * Consulta el resumen de alertas del panel principal. Solo se ejecuta con
 * sesión iniciada; el backend decide qué secciones devuelve según los módulos
 * del rol activo, de modo que un rol parcial nunca recibe una sección para la
 * que no tiene permiso.
 */
export function useDashboardAlerts() {
  const { actor, isFetching } = useBackend();
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: DASHBOARD_ALERTS_QUERY_KEY,
    queryFn: async (): Promise<DashboardAlertsSummary> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getDashboardAlerts(token);
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 60_000,
  });
}
