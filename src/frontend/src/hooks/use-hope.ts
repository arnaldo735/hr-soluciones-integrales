import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { colombiaDayKey } from "@/lib/format";
import type { HopeMessage, HopeSettings, HopeSettingsInput } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/**
 * Colombia is a fixed UTC-5 offset with no DST, so the next local midnight is
 * always 00:00 UTC-5. Returns the milliseconds until that instant (at least
 * one second) so a mounted tab refreshes the promise right after the day flips.
 */
function msUntilNextColombiaMidnight(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((entry) => entry.type === type);
    return part ? Number(part.value) : 0;
  };
  const secondsToday =
    read("hour") * 3600 + read("minute") * 60 + read("second");
  const secondsLeft = 86_400 - secondsToday;
  return Math.max(secondsLeft, 1) * 1_000;
}

/**
 * Colombia calendar day (`YYYY-MM-DD`) that re-renders the consumer when the
 * day flips, so the daily promise query re-keys even in a long-lived session.
 */
function useColombiaDayKey(): string {
  const [dayKey, setDayKey] = useState(() => colombiaDayKey(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setDayKey(colombiaDayKey(new Date()));
        schedule();
      }, msUntilNextColombiaMidnight(new Date()));
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return dayKey;
}

/**
 * Configuración vigente del mensaje de esperanza (fila única). Requiere el
 * módulo `company`; se comparte entre la configuración y los documentos, por
 * eso se obtiene una vez por sesión y solo se refresca al guardar.
 */
export function useHopeSettings(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["hope-settings"],
    queryFn: async (): Promise<HopeSettings | null> => {
      if (!actor) return null;
      return actor.getHopeSettings(token);
    },
    enabled: enabled && !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * Promesa vigente para hoy (rotada en modo automático o fija en modo manual).
 * Es una consulta pública: no exige token. La clave incluye el día calendario
 * de Colombia y el `staleTime` es corto, de modo que la promesa se refresca al
 * cambiar el día aunque la pestaña permanezca montada durante la medianoche.
 */
export function useDailyHopeMessage(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useBackend();
  const enabled = options?.enabled ?? true;
  const dayKey = useColombiaDayKey();

  return useQuery({
    queryKey: ["daily-hope", dayKey],
    queryFn: async (): Promise<HopeMessage | null> => {
      if (!actor) return null;
      return actor.getDailyHopeMessage();
    },
    enabled: enabled && !!actor && !isFetching,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateHopeSettings() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: HopeSettingsInput): Promise<HopeSettings> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateHopeSettings(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hope-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["daily-hope"] });
    },
  });
}
