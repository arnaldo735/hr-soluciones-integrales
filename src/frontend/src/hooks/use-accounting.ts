import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  AccountingPeriod,
  AccountingReportView,
  AccountingSummary,
  InventoryValuation,
  LedgerEntry,
  ProfitBlock,
  ProfitBlockView,
  ProfitBreakdown,
  ProfitBreakdownView,
  ServiceProfitLineView,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

/** Visible Spanish labels for the three profit blocks. */
const PROFIT_BLOCK_LABELS: Record<ProfitBlockView["key"], string> = {
  parts: "Repuestos",
  services: "Servicios",
  total: "Total consolidado",
};

/** Maps one backend profit block into its labelled presentation shape. */
function toProfitBlockView(
  key: ProfitBlockView["key"],
  block: ProfitBlock,
): ProfitBlockView {
  return {
    key,
    label: PROFIT_BLOCK_LABELS[key],
    income: block.income,
    cost: block.cost,
    commission: block.commission,
    margin: block.margin,
    marginBps: block.marginBps,
  };
}

/** Maps the backend profit breakdown into the labelled view shape. */
function toProfitBreakdownView(profit: ProfitBreakdown): ProfitBreakdownView {
  return {
    parts: toProfitBlockView("parts", profit.parts),
    services: toProfitBlockView("services", profit.services),
    total: toProfitBlockView("total", profit.total),
    totalCommission: profit.totalCommission,
    netProfit: profit.netProfit,
    serviceLines: profit.serviceLines.map(
      (line, index): ServiceProfitLineView => ({
        key: `${line.invoiceId.toString()}-${index}`,
        invoiceId: line.invoiceId,
        invoiceNumber: line.invoiceNumber,
        orderId: line.orderId ?? null,
        description: line.description,
        serviceId: line.serviceId ?? null,
        technicianId: line.technicianId ?? null,
        technicianName: line.technicianName,
        charged: line.charged,
        commission: line.commission,
        profit: line.profit,
      }),
    ),
  };
}

/** Aggregated income, expenses and profit for a period. */
export function useAccountingSummary(period: AccountingPeriod) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      "accounting-summary",
      period.from?.toString() ?? "none",
      period.to?.toString() ?? "none",
    ],
    queryFn: async (): Promise<AccountingSummary | null> => {
      if (!actor) return null;
      return actor.getAccountingSummary(token, period);
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Full accounting report with ledger entries and breakdowns. The profit
 * breakdown is mapped into its labelled view shape, including the technician
 * commission and the per-service detail.
 */
export function useAccountingReport(period: AccountingPeriod) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      "accounting-report",
      period.from?.toString() ?? "none",
      period.to?.toString() ?? "none",
    ],
    queryFn: async (): Promise<AccountingReportView | null> => {
      if (!actor) return null;
      const report = await actor.getAccountingReport(token, period);
      return {
        ...report,
        profit: toProfitBreakdownView(report.profit),
      };
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Snapshot valuation of the current inventory: cost, sale value and projected
 * margin per part, per category and in total. Not period-scoped — it always
 * reflects the stock on hand right now.
 */
export function useInventoryValuation() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["inventory-valuation"],
    queryFn: async (): Promise<InventoryValuation | null> => {
      if (!actor) return null;
      return actor.getInventoryValuation(token);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Raw ledger entries for a period. */
export function useLedgerEntries(period: AccountingPeriod) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: [
      "ledger-entries",
      period.from?.toString() ?? "none",
      period.to?.toString() ?? "none",
    ],
    queryFn: async (): Promise<LedgerEntry[]> => {
      if (!actor) return [];
      return actor.listLedgerEntries(token, period);
    },
    enabled: !!actor && !isFetching,
  });
}
