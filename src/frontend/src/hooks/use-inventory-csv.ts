import { useBackend } from "@/hooks/use-backend";
import type {
  InventoryCsvRow,
  InventoryImportResult,
  InventoryImportRow,
  ZeroInventoryResult,
} from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Exports the whole inventory as flat CSV rows. */
export function useExportInventoryCsv() {
  const { actor } = useBackend();

  return useMutation({
    mutationFn: async (): Promise<InventoryCsvRow[]> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.exportInventoryCsv();
    },
  });
}

/** Imports inventory rows and reports per-row created/updated/failed status. */
export function useImportInventoryCsv() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      rows: InventoryImportRow[],
    ): Promise<InventoryImportResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.importInventoryCsv(rows);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      void queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      // Imported stock changes the on-hand snapshot, so the valuation report
      // must refetch instead of serving its cached totals.
      void queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
    },
  });
}

/**
 * Sets every part's stock to zero and reports how many parts were affected.
 * Admin-gated on the backend; the caller must be an administrator.
 */
export function useZeroInventory() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ZeroInventoryResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.zeroInventory();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      void queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      // The low-stock list is the dashboard panel, which reads the
      // ['dashboard-summary'] query, so it must be invalidated too.
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      // Zeroing stock changes the on-hand snapshot, so the valuation report
      // must refetch instead of serving its cached totals.
      void queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
    },
  });
}
