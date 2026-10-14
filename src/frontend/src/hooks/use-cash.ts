import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  CashMovement,
  CashMovementFilter,
  CashMovementInput,
  CashMovementPage,
  CashRegister,
  CashRegisterFilter,
  CashRegisterInput,
  CashRegisterPage,
  CloseShiftInput,
  DailyShiftReport,
  Id,
  OpenShiftInput,
  Shift,
  ShiftFilter,
  ShiftPage,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Query key root shared by every Caja y Bancos query. */
const CASH_KEY = "cash";

/**
 * Query keys invalidated whenever a shift or a cash movement changes. The
 * daily report, the shift history and the open shift all derive from the same
 * ledger, so they are refreshed together.
 */
export function invalidateCashData(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  void queryClient.invalidateQueries({ queryKey: [CASH_KEY] });
  // A cash movement can come from an invoice, a POS sale, an expense or a
  // commission payment, so the accounting surfaces must refetch too.
  void queryClient.invalidateQueries({ queryKey: ["accounting-summary"] });
  void queryClient.invalidateQueries({ queryKey: ["accounting-report"] });
  void queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
}

/* ---------------------------------------------------------------------------
 * Catálogo de cajas y bancos
 * ------------------------------------------------------------------------- */

export interface CashRegisterListParams {
  /** Optional kind filter; `null` lists cajas and bancos. */
  kind: CashRegisterFilter["kind"] | null;
  /** Optional active filter; `null` lists active and inactive registers. */
  active: boolean | null;
  /** Free-text search over the register name; empty lists every register. */
  search: string;
  /** Zero-based offset of the first row to return. */
  offset: number;
  /** Maximum number of rows to return. */
  limit: number;
}

/** Catálogo de cajas y bancos con filtros, búsqueda y paginación. */
export function useCashRegisters(params: CashRegisterListParams) {
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
      params.limit,
    ],
    queryFn: async (): Promise<CashRegisterPage> => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter: CashRegisterFilter = {
        kind: params.kind ?? undefined,
        active: params.active ?? undefined,
        search: params.search.trim() || undefined,
      };
      return actor.listCashRegisters(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

/** Detalle de una caja o banco. */
export function useCashRegister(registerId: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [CASH_KEY, "register", registerId?.toString() ?? "none"],
    queryFn: async (): Promise<CashRegister | null> => {
      if (!actor || registerId === null) return null;
      return actor.getCashRegister(token, registerId);
    },
    enabled: !!actor && !isFetching && registerId !== null,
  });
}

/** Crea una caja o banco con su saldo inicial. */
export function useCreateCashRegister() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CashRegisterInput): Promise<CashRegister> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createCashRegister(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/** Edita el nombre, el tipo y el saldo inicial de una caja o banco. */
export function useUpdateCashRegister() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      registerId: Id;
      input: CashRegisterInput;
    }): Promise<CashRegister> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateCashRegister(
        token,
        variables.registerId,
        variables.input,
      );
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/** Activa o desactiva una caja o banco. */
export function useSetCashRegisterActive() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      registerId: Id;
      active: boolean;
    }): Promise<CashRegister> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setCashRegisterActive(
        token,
        variables.registerId,
        variables.active,
      );
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/** Elimina una caja o banco sin turnos abiertos. */
export function useDeleteCashRegister() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registerId: Id): Promise<void> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteCashRegister(token, registerId);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/* ---------------------------------------------------------------------------
 * Turnos
 * ------------------------------------------------------------------------- */

export interface ShiftListParams {
  /** Optional register filter; `null` lists every register. */
  registerId?: Id | null;
  /** Optional responsible filter; empty lists every responsible. */
  responsible?: string;
  /** Optional status filter; `null` lists every shift. */
  status: ShiftFilter["status"] | null;
  /** Inclusive lower bound of the opened-at range. */
  from: bigint | null;
  /** Inclusive upper bound of the opened-at range. */
  to: bigint | null;
  /** Zero-based offset of the first row to return. */
  offset: number;
  /** Maximum number of rows to return. */
  limit: number;
}

/** Historial de turnos de caja, más recientes primero. */
export function useShifts(params: ShiftListParams) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      CASH_KEY,
      "shifts",
      params.registerId?.toString() ?? "all",
      params.responsible?.trim() ?? "",
      params.status ?? "all",
      params.from?.toString() ?? "none",
      params.to?.toString() ?? "none",
      params.offset,
      params.limit,
    ],
    queryFn: async (): Promise<ShiftPage> => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter: ShiftFilter = {
        registerId: params.registerId ?? undefined,
        responsible: params.responsible?.trim() || undefined,
        status: params.status ?? undefined,
        from: params.from ?? undefined,
        to: params.to ?? undefined,
      };
      return actor.listShifts(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

/** Detalle de un turno de caja. */
export function useShift(shiftId: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [CASH_KEY, "shift", shiftId?.toString() ?? "none"],
    queryFn: async (): Promise<Shift | null> => {
      if (!actor || shiftId === null) return null;
      return actor.getShift(token, shiftId);
    },
    enabled: !!actor && !isFetching && shiftId !== null,
  });
}

/** Turno abierto de una caja o banco, o `null` cuando está cerrada. */
export function useOpenShift(registerId: Id | null = null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [CASH_KEY, "open-shift", registerId?.toString() ?? "none"],
    queryFn: async (): Promise<Shift | null> => {
      if (!actor || registerId === null) return null;
      return actor.getOpenShift(token, registerId);
    },
    enabled: !!actor && !isFetching && registerId !== null,
  });
}

/** Todos los turnos abiertos, agrupables por caja o banco. */
export function useOpenShifts() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [CASH_KEY, "open-shifts"],
    queryFn: async (): Promise<Shift[]> => {
      if (!actor) return [];
      return actor.listOpenShifts(token);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Abre un turno sobre una caja o banco con su saldo inicial declarado. */
export function useOpenShiftMutation() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OpenShiftInput): Promise<Shift> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.openShift(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/** Cierra el turno con el saldo final declarado y calcula la diferencia. */
export function useCloseShift() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      shiftId: Id;
      input: CloseShiftInput;
    }): Promise<Shift> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.closeShift(token, variables.shiftId, variables.input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/** Cambia el responsable de un turno abierto. */
export function useSetShiftResponsible() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      shiftId: Id;
      responsibleName: string;
      responsibleUserId: Id | null;
    }): Promise<Shift> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setShiftResponsible(
        token,
        variables.shiftId,
        variables.responsibleName,
        variables.responsibleUserId,
      );
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/* ---------------------------------------------------------------------------
 * Movimientos
 * ------------------------------------------------------------------------- */

export interface CashMovementListParams {
  /** Optional shift filter; `null` lists every shift. */
  shiftId: Id | null;
  /** Optional register filter; `null` lists every register. */
  registerId?: Id | null;
  /** Optional movement kind filter; `null` lists income and expense. */
  kind: CashMovementFilter["kind"] | null;
  /** Optional account filter; `null` lists cash and bank. */
  account: CashMovementFilter["account"] | null;
  /** Optional payment method filter; `null` lists every method. */
  paymentMethod: CashMovementFilter["paymentMethod"] | null;
  /** Inclusive lower bound of the movement timestamp. */
  from: bigint | null;
  /** Inclusive upper bound of the movement timestamp. */
  to: bigint | null;
  /** Zero-based offset of the first row to return. */
  offset: number;
  /** Maximum number of rows to return. */
  limit: number;
}

/** Movimientos de caja y bancos con filtros, orden y paginación. */
export function useCashMovements(params: CashMovementListParams) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      CASH_KEY,
      "movements",
      params.shiftId?.toString() ?? "all",
      params.registerId?.toString() ?? "all",
      params.kind ?? "all",
      params.account ?? "all",
      params.paymentMethod ?? "all",
      params.from?.toString() ?? "none",
      params.to?.toString() ?? "none",
      params.offset,
      params.limit,
    ],
    queryFn: async (): Promise<CashMovementPage> => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter: CashMovementFilter = {
        shiftId: params.shiftId ?? undefined,
        registerId: params.registerId ?? undefined,
        kind: params.kind ?? undefined,
        account: params.account ?? undefined,
        paymentMethod: params.paymentMethod ?? undefined,
        from: params.from ?? undefined,
        to: params.to ?? undefined,
      };
      return actor.listCashMovements(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

/** Registra un ingreso o egreso clasificado por medio de pago. */
export function useRegisterCashMovement() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CashMovementInput): Promise<CashMovement> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerCashMovement(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    },
  });
}

/**
 * Informe diario del turno: movimientos, totales por medio de pago y saldos
 * finales. Es la fuente del documento imprimible en A4 y tirilla 80 mm.
 */
export function useDailyShiftReport(shiftId: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [CASH_KEY, "daily-report", shiftId?.toString() ?? "none"],
    queryFn: async (): Promise<DailyShiftReport | null> => {
      if (!actor || shiftId === null) return null;
      return actor.getDailyShiftReport(token, shiftId);
    },
    enabled: !!actor && !isFetching && shiftId !== null,
  });
}
