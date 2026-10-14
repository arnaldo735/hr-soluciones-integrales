import { u as useBackend, i as useAuth, k as useQuery, aj as useQueryClient, ak as useMutation } from "./index-CGU00UGU.js";
const CASH_KEY = "cash";
function invalidateCashData(queryClient) {
  void queryClient.invalidateQueries({ queryKey: [CASH_KEY] });
  void queryClient.invalidateQueries({ queryKey: ["accounting-summary"] });
  void queryClient.invalidateQueries({ queryKey: ["accounting-report"] });
  void queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
}
function useCashRegisters(params) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      CASH_KEY,
      "registers",
      params.kind ?? "all",
      params.active === null ? "all" : params.active ? "active" : "inactive",
      params.search.trim(),
      params.offset,
      params.limit
    ],
    queryFn: async () => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter = {
        kind: params.kind ?? void 0,
        active: params.active ?? void 0,
        search: params.search.trim() || void 0
      };
      return actor.listCashRegisters(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit)
      );
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateCashRegister() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createCashRegister(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useUpdateCashRegister() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateCashRegister(
        token,
        variables.registerId,
        variables.input
      );
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useSetCashRegisterActive() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setCashRegisterActive(
        token,
        variables.registerId,
        variables.active
      );
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useDeleteCashRegister() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (registerId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteCashRegister(token, registerId);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useShifts(params) {
  var _a, _b, _c, _d;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      CASH_KEY,
      "shifts",
      ((_a = params.registerId) == null ? void 0 : _a.toString()) ?? "all",
      ((_b = params.responsible) == null ? void 0 : _b.trim()) ?? "",
      params.status ?? "all",
      ((_c = params.from) == null ? void 0 : _c.toString()) ?? "none",
      ((_d = params.to) == null ? void 0 : _d.toString()) ?? "none",
      params.offset,
      params.limit
    ],
    queryFn: async () => {
      var _a2;
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter = {
        registerId: params.registerId ?? void 0,
        responsible: ((_a2 = params.responsible) == null ? void 0 : _a2.trim()) || void 0,
        status: params.status ?? void 0,
        from: params.from ?? void 0,
        to: params.to ?? void 0
      };
      return actor.listShifts(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit)
      );
    },
    enabled: !!actor && !isFetching
  });
}
function useOpenShifts() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [CASH_KEY, "open-shifts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listOpenShifts(token);
    },
    enabled: !!actor && !isFetching
  });
}
function useOpenShiftMutation() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.openShift(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useCloseShift() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.closeShift(token, variables.shiftId, variables.input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useSetShiftResponsible() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setShiftResponsible(
        token,
        variables.shiftId,
        variables.responsibleName,
        variables.responsibleUserId
      );
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useCashMovements(params) {
  var _a, _b, _c, _d;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      CASH_KEY,
      "movements",
      ((_a = params.shiftId) == null ? void 0 : _a.toString()) ?? "all",
      ((_b = params.registerId) == null ? void 0 : _b.toString()) ?? "all",
      params.kind ?? "all",
      params.account ?? "all",
      params.paymentMethod ?? "all",
      ((_c = params.from) == null ? void 0 : _c.toString()) ?? "none",
      ((_d = params.to) == null ? void 0 : _d.toString()) ?? "none",
      params.offset,
      params.limit
    ],
    queryFn: async () => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter = {
        shiftId: params.shiftId ?? void 0,
        registerId: params.registerId ?? void 0,
        kind: params.kind ?? void 0,
        account: params.account ?? void 0,
        paymentMethod: params.paymentMethod ?? void 0,
        from: params.from ?? void 0,
        to: params.to ?? void 0
      };
      return actor.listCashMovements(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit)
      );
    },
    enabled: !!actor && !isFetching
  });
}
function useRegisterCashMovement() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerCashMovement(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useDailyShiftReport(shiftId) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [CASH_KEY, "daily-report", (shiftId == null ? void 0 : shiftId.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || shiftId === null) return null;
      return actor.getDailyShiftReport(token, shiftId);
    },
    enabled: !!actor && !isFetching && shiftId !== null
  });
}
export {
  useOpenShifts as a,
  useCashRegisters as b,
  useCashMovements as c,
  useCloseShift as d,
  useOpenShiftMutation as e,
  useShifts as f,
  useDailyShiftReport as g,
  useSetShiftResponsible as h,
  invalidateCashData as i,
  useCreateCashRegister as j,
  useUpdateCashRegister as k,
  useSetCashRegisterActive as l,
  useDeleteCashRegister as m,
  useRegisterCashMovement as u
};
