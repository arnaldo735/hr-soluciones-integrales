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
import type {
  ContactImportKind,
  ContactImportRow,
} from "@/hooks/use-contact-import";
import type { ImportPreviewResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

const KIND_LABEL: Record<ContactImportKind, string> = {
  customer: "clientes",
  supplier: "proveedores",
};

const STATUS_LABEL: Record<"valid" | "invalid", string> = {
  valid: "Válida",
  invalid: "Con error",
};

const STATUS_TONE: Record<"valid" | "invalid", StatusTone> = {
  valid: "accepted",
  invalid: "rejected",
};

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which directory is being imported. */
  kind: ContactImportKind;
  /** Parsed rows awaiting confirmation. */
  rows: ContactImportRow[];
  /** Result returned by the backend after the import ran. */
  result: ImportPreviewResult | null;
  /** True while the backend call is in flight. */
  isPending: boolean;
  /** True when the backend call itself failed. */
  hasError: boolean;
  onConfirm: () => void;
}

/**
 * Two-phase contact import dialog shared by Clientes and Proveedores: a
 * per-row preview with valid/invalid status and the error reason before the
 * backend call, then a per-row result summary with creados/actualizados/errores
 * so failed rows can be corrected and retried.
 */
export function ContactImportDialog({
  open,
  onOpenChange,
  kind,
  rows,
  result,
  isPending,
  hasError,
  onConfirm,
}: ContactImportDialogProps) {
  const validRows = rows.filter((row) => !row.error);
  const invalidRows = rows.filter((row) => row.error);
  const resultByKey = new Map(
    (result?.rows ?? []).map((row) => [row.key, row] as const),
  );
  const failedRows = (result?.rows ?? []).filter(
    (row) => row.status === "invalid",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid={`contacts.import_dialog.${kind}`}
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {result
              ? "Resultado de la importación"
              : `Importar ${KIND_LABEL[kind]}`}
          </DialogTitle>
          <DialogDescription>
            {result
              ? "Revisa el detalle por fila. Corrige las filas con error en tu archivo y vuelve a importar."
              : "Revisa las filas detectadas antes de confirmar. Las filas con error no se importan hasta corregirlas."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div
              data-ocid={`contacts.import_summary.${kind}`}
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
                      Nombre
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
                  {rows.map((row, index) => {
                    const outcome = resultByKey.get(row.key);
                    const status = outcome?.status ?? "valid";
                    return (
                      <tr
                        key={row.key}
                        data-ocid={`contacts.import_row.${kind}.${index + 1}`}
                        className={cn(
                          "border-b border-border/60 last:border-0",
                          status === "invalid" && "bg-destructive/[0.06]",
                        )}
                      >
                        <td className="data-rail px-3 py-2 text-muted-foreground">
                          {row.rowNumber}
                        </td>
                        <td className="px-3 py-2">{row.name || "—"}</td>
                        <td className="px-3 py-2">
                          <StatusBadge
                            label={STATUS_LABEL[status]}
                            tone={STATUS_TONE[status]}
                          />
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {outcome?.error?.trim() || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="badge-status badge-accepted">
                {validRows.length} listas
              </span>
              {invalidRows.length > 0 ? (
                <span className="badge-status badge-rejected">
                  {invalidRows.length} con error
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
                      Nombre
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Documento / Teléfono
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Acción
                    </th>
                    <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Motivo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={row.key}
                      data-ocid={`contacts.import_row.${kind}.${index + 1}`}
                      className={cn(
                        "border-b border-border/60 last:border-0",
                        row.error && "bg-destructive/[0.06]",
                      )}
                    >
                      <td className="data-rail px-3 py-2 text-muted-foreground">
                        {row.rowNumber}
                      </td>
                      <td className="px-3 py-2">
                        {row.name || (
                          <span className="text-destructive">Falta nombre</span>
                        )}
                      </td>
                      <td className="data-rail px-3 py-2 text-muted-foreground">
                        {row.document || row.phone || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <StatusBadge label="Con error" tone="rejected" />
                        ) : row.matchedId !== null ? (
                          <StatusBadge label="Actualizar" tone="sent" />
                        ) : (
                          <StatusBadge label="Crear" tone="accepted" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.error?.trim() || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasError ? (
              <p
                data-ocid={`contacts.import_error.${kind}`}
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
            data-ocid={`contacts.import_close_button.${kind}`}
          >
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {result ? null : (
            <Button
              type="button"
              disabled={isPending || validRows.length === 0}
              onClick={onConfirm}
              data-ocid={`contacts.import_confirm_button.${kind}`}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isPending
                ? "Importando…"
                : `Importar ${validRows.length} fila${validRows.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
