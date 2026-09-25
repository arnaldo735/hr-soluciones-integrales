import { useBackend } from "@/hooks/use-backend";
import type {
  CommissionLine,
  CommissionPayment,
  CommissionPaymentInput,
  CommissionPeriod,
  CommissionReport,
  Id,
  TechnicianCommissionSummary,
  TechnicianLoan,
  TechnicianLoanInput,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Stable query-key fragment for a commission period. */
function periodKey(period: CommissionPeriod): [string, string] {
  return [period.from?.toString() ?? "none", period.to?.toString() ?? "none"];
}

/** Labor lines attributed to one technician (or all) inside a period. */
export function useCommissionLines(
  technicianId: Id | null,
  period: CommissionPeriod,
) {
  const { actor, isFetching } = useBackend();
  const [from, to] = periodKey(period);

  return useQuery({
    queryKey: ["commission-lines", technicianId?.toString() ?? "all", from, to],
    queryFn: async (): Promise<CommissionLine[]> => {
      if (!actor) return [];
      return actor.listCommissionLines(technicianId, period);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Consolidated commission summary for one technician in a period. */
export function useTechnicianCommissionSummary(
  technicianId: Id | null,
  period: CommissionPeriod,
) {
  const { actor, isFetching } = useBackend();
  const [from, to] = periodKey(period);

  return useQuery({
    queryKey: [
      "technician-commission-summary",
      technicianId?.toString() ?? "none",
      from,
      to,
    ],
    queryFn: async (): Promise<TechnicianCommissionSummary | null> => {
      if (!actor || technicianId === null) return null;
      return actor.getTechnicianCommissionSummary(technicianId, period);
    },
    enabled: !!actor && !isFetching && technicianId !== null,
  });
}

/** General commission report across every technician for a period. */
export function useCommissionReport(period: CommissionPeriod) {
  const { actor, isFetching } = useBackend();
  const [from, to] = periodKey(period);

  return useQuery({
    queryKey: ["commission-report", from, to],
    queryFn: async (): Promise<CommissionReport | null> => {
      if (!actor) return null;
      return actor.getCommissionReport(period);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Loans registered for a technician, optionally only the pending ones. */
export function useTechnicianLoans(
  technicianId: Id | null,
  pendingOnly = false,
) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: [
      "technician-loans",
      technicianId?.toString() ?? "all",
      pendingOnly,
    ],
    queryFn: async (): Promise<TechnicianLoan[]> => {
      if (!actor) return [];
      return actor.listTechnicianLoans({
        technicianId: technicianId ?? undefined,
        pendingOnly: pendingOnly ? true : undefined,
      });
    },
    enabled: !!actor && !isFetching,
  });
}

/** Register a loan/advance for a technician. */
export function useCreateTechnicianLoan() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TechnicianLoanInput): Promise<TechnicianLoan> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createTechnicianLoan(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technician-loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-commission-summary"],
      });
      void queryClient.invalidateQueries({ queryKey: ["commission-report"] });
    },
  });
}

/** Remove a pending loan. Deducted loans cannot be deleted. */
export function useDeleteTechnicianLoan() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteTechnicianLoan(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technician-loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-commission-summary"],
      });
      void queryClient.invalidateQueries({ queryKey: ["commission-report"] });
    },
  });
}

/**
 * Pay the pending commissions of one technician for a period. The backend
 * consolidates the pending lines and deducts every pending loan in full.
 */
export function usePayTechnicianCommission() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CommissionPaymentInput,
    ): Promise<CommissionPayment> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.payTechnicianCommission(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["commission-lines"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-commission-summary"],
      });
      void queryClient.invalidateQueries({ queryKey: ["commission-report"] });
      void queryClient.invalidateQueries({ queryKey: ["technician-loans"] });
      void queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
    },
  });
}

/**
 * Payments already issued, optionally filtered by technician and period.
 *
 * Pass `allPeriods` when the caller needs the complete set of settled lines:
 * the backend marks a labor line as paid globally, so a line paid in an earlier
 * period must still be recognised as paid in the current one.
 */
export function useCommissionPayments(
  technicianId: Id | null,
  period: CommissionPeriod,
  allPeriods = false,
) {
  const { actor, isFetching } = useBackend();
  const [from, to] = periodKey(period);

  return useQuery({
    queryKey: [
      "commission-payments",
      technicianId?.toString() ?? "all",
      allPeriods ? "all" : from,
      allPeriods ? "all" : to,
    ],
    queryFn: async (): Promise<CommissionPayment[]> => {
      if (!actor) return [];
      return actor.listCommissionPayments({
        technicianId: technicianId ?? undefined,
        from: allPeriods ? undefined : period.from,
        to: allPeriods ? undefined : period.to,
      });
    },
    enabled: !!actor && !isFetching,
  });
}
