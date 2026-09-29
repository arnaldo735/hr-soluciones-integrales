import type { RemindersSummary } from "@/backend";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";

export type {
  ReminderAppointment,
  ReminderFinishedOrder,
  ReminderOrder,
  ReminderPayable,
  ReminderQuote,
  ReminderReceivable,
  ReminderSection,
  RemindersSummary,
} from "@/backend";

/** Clave de React Query del resumen de recordatorios. */
export const REMINDERS_QUERY_KEY = ["reminders-summary"] as const;

/**
 * Consulta el resumen de pendientes del usuario activo. Solo se ejecuta con
 * sesión iniciada; el backend decide qué secciones devuelve según los módulos
 * del rol.
 */
export function useRemindersSummary() {
  const { actor, isFetching } = useBackend();
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: REMINDERS_QUERY_KEY,
    queryFn: async (): Promise<RemindersSummary> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getRemindersSummary(token);
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 60_000,
  });
}

/** True cuando el resumen trae al menos un pendiente en alguna sección. */
export function hasAnyReminder(summary: RemindersSummary | undefined): boolean {
  if (!summary) return false;
  return Object.values(summary).some(
    (section) =>
      typeof section === "object" &&
      section !== null &&
      "count" in section &&
      section.count > 0n,
  );
}
