import { k as useBackend, m as useQuery, t as reactExports, at as colombiaDayKey, l as useAuth, ao as useQueryClient, ap as useMutation } from "./index-EqGEeyjs.js";
function msUntilNextColombiaMidnight(now) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Bogota"
  }).formatToParts(now);
  const read = (type) => {
    const part = parts.find((entry) => entry.type === type);
    return part ? Number(part.value) : 0;
  };
  const secondsToday = read("hour") * 3600 + read("minute") * 60 + read("second");
  const secondsLeft = 86400 - secondsToday;
  return Math.max(secondsLeft, 1) * 1e3;
}
function useColombiaDayKey() {
  const [dayKey, setDayKey] = reactExports.useState(() => colombiaDayKey(/* @__PURE__ */ new Date()));
  reactExports.useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setDayKey(colombiaDayKey(/* @__PURE__ */ new Date()));
        schedule();
      }, msUntilNextColombiaMidnight(/* @__PURE__ */ new Date()));
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return dayKey;
}
function useHopeSettings(options) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["hope-settings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getHopeSettings(token);
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY
  });
}
function useDailyHopeMessage(options) {
  const { actor, isFetching } = useBackend();
  const dayKey = useColombiaDayKey();
  return useQuery({
    queryKey: ["daily-hope", dayKey],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyHopeMessage();
    },
    enabled: !!actor && !isFetching,
    staleTime: 6e4,
    refetchOnWindowFocus: true
  });
}
function useUpdateHopeSettings() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateHopeSettings(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hope-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["daily-hope"] });
    }
  });
}
export {
  useHopeSettings as a,
  useUpdateHopeSettings as b,
  useDailyHopeMessage as u
};
