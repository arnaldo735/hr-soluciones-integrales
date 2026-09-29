import { StatusBadge } from "@/components/StatusBadge";
import type { StatusTone } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InventoryImportResult, InventoryImportRow } from "@/lib/types";
import { ImportRowStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

/** CSV column order shared by the inventory export and import templates. */
export const INVENTORY_CSV_HEADERS = [
  "sku",
  "codigo_barras",
  "nombre",
  "categoria",
  "marca",
  "unidad",
  "precio_venta",
  "precio_costo",
  "existencia",
  "umbral",
];

const STATUS_LABEL: Record<ImportRowStatus, string> = {
  [ImportRowStatus.created]: "Creado",
  [ImportRowStatus.updated]: "Actualizado",
  [ImportRowStatus.error]: "Error",
};

const STATUS_TONE: Record<ImportRowStatus, StatusTone> = {
  [ImportRowStatus.created]: "accepted",
  [ImportRowStatus.updated]: "sent",
  [ImportRowStatus.error]: "rejected",
};

interface InventoryImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Parsed rows awaiting confirmation. */
  rows: InventoryImportRow[];
  /** Result returned by the backend after the import ran. */
  result: InventoryImportResult | null;
  /** True while the backend call is in flight. */
  isPending: boolean;
  /** True when the backend call itself failed. */
  hasError: boolean;
  onConfirm: () => void;
}

/**
 * Two-phase inventory import dialog: a preview of the parsed CSV rows before
 * the backend call, then a per-row result summary so failed rows can be
 * corrected and retried.
 */
export function InventoryImportDialog({
  open,
  onOpenChange,
  rows,
  result,
  isPending,
  hasError,
  onConfirm,
}: InventoryImportDialogProps) {
  const missingSku = rows.filter((row) => row.sku.trim() === "").length;
  const importable = rows.length - missingSku;
  const resultRows = result?.rows ?? [];
  const failedRows = resultRows.filter(
    (row) => row.status === ImportRowStatus.error,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="inventory.import_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {result ? "Resultado de la importación" : "Importar inventario"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? "Revisa el detalle por fila. Corrige las filas con error en tu archivo y vuelve a importar."
              : "Revisa las filas detectadas antes de confirmar. Las filas sin SKU se omiten."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div
              data-ocid="inventory.import_summary"
              className="flex flex-wrap items-center gap-2"
            >
              <span className="badge-status badge-accepted">
                {result.created.toString()} creados
              </span>
              <span className="badge-status badge-sent">
                {result.updated.toString()} actualizados
              </span>
              <span
                className={cn(
                  "badge-status",
                  result.failed > 0n ? "badge-rejected" : "badge-neutral",
                )}
              >
                {result.failed.toString()} con error
              </span>
            </div>

            {failedRows.length > 0 ? (
              <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {failedRows.length === 1
                    ? "Una fila no se pudo importar."
                    : `${failedRows.length} filas no se pudieron importar.`}{" "}
                  Corrige el motivo indicado y vuelve a intentarlo.
                </span>
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                Todas las filas se procesaron correctamente.
              </p>
            )}

            <div className="scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Fila
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      SKU
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resultRows.map((row, index) => (
                    <tr
                      key={`${row.rowNumber.toString()}-${row.sku}-${index}`}
                      data-ocid={`inventory.import_row.${index + 1}`}
                      className={cn(
                        "border-b border-border/60 last:border-0",
                        row.status === ImportRowStatus.error &&
                          "bg-destructive/[0.06]",
                      )}
                    >
                      <td className="data-rail px-3 py-2 text-muted-foreground">
                        {row.rowNumber.toString()}
                      </td>
                      <td className="data-rail px-3 py-2">{row.sku || "—"}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={STATUS_LABEL[row.status]}
                          tone={STATUS_TONE[row.status]}
                        />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.error?.trim() || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="badge-status badge-accepted">
                {importable} listas
              </span>
              {missingSku > 0 ? (
                <span className="badge-status badge-rejected">
                  {missingSku} sin SKU
                </span>
              ) : null}
            </div>

            <div className="scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Fila
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      SKU
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Nombre
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Categoría
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Existencia
                    </th>
                    <th className="px-3 py-2 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Umbral
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const rowValid = row.sku.trim() !== "";
                    return (
                      <tr
                        key={`${row.rowNumber.toString()}-${row.sku}-${index}`}
                        data-ocid={`inventory.import_row.${index + 1}`}
                        className={cn(
                          "border-b border-border/60 last:border-0",
                          !rowValid && "bg-destructive/[0.06]",
                        )}
                      >
                        <td className="data-rail px-3 py-2 text-muted-foreground">
                          {row.rowNumber.toString()}
                        </td>
                        <td className="data-rail px-3 py-2">
                          {row.sku.trim() || (
                            <span className="text-destructive">Falta SKU</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{row.name || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.category || "—"}
                        </td>
                        <td className="data-rail px-3 py-2 text-right">
                          {row.quantity.toString()}
                        </td>
                        <td className="data-rail px-3 py-2 text-right">
                          {row.lowStockThreshold.toString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasError ? (
              <p
                data-ocid="inventory.import_error"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                No se pudo completar la importación. Intenta de nuevo.
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="inventory.import_close_button"
          >
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {result ? null : (
            <Button
              type="button"
              disabled={isPending || importable === 0}
              onClick={onConfirm}
              data-ocid="inventory.import_confirm_button"
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isPending
                ? "Importando…"
                : `Importar ${importable} repuesto${importable === 1 ? "" : "s"}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
