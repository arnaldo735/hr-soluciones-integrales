import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import type { InvoiceApplyResult } from "@/lib/types";
import { LineApplyStatus, PurchaseInvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const LINE_STATUS_LABELS: Record<LineApplyStatus, string> = {
  [LineApplyStatus.created]: "Creado",
  [LineApplyStatus.updated]: "Actualizado",
  [LineApplyStatus.error]: "Error",
  [LineApplyStatus.pending]: "Pendiente",
};

const LINE_STATUS_STYLES: Record<LineApplyStatus, string> = {
  [LineApplyStatus.created]: "border-success/50 bg-success/15 text-success",
  [LineApplyStatus.updated]: "border-primary/40 bg-primary/10 text-primary",
  [LineApplyStatus.error]:
    "border-destructive/50 bg-destructive/10 text-destructive",
  [LineApplyStatus.pending]: "border-border bg-muted text-muted-foreground",
};

interface InvoiceResultSummaryProps {
  result: InvoiceApplyResult;
  /** True when the invoice was already confirmed before this attempt. */
  wasAlreadyConfirmed: boolean;
  /** Clears the summary and returns to the upload zone. */
  onDismiss: () => void;
}

/**
 * Per-line outcome of a confirmation: how many parts were created, updated or
 * rejected, with the reason for every error. Also surfaces the idempotent case
 * where the invoice had already been confirmed and nothing was re-applied.
 */
export function InvoiceResultSummary({
  result,
  wasAlreadyConfirmed,
  onDismiss,
}: InvoiceResultSummaryProps) {
  const hasErrors = result.failed > 0n;
  const isConfirmed = result.status === PurchaseInvoiceStatus.confirmed;

  return (
    <section
      data-ocid="purchase_invoices.result_summary"
      className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-subtle"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-md border",
              hasErrors
                ? "border-warning/50 bg-warning/10 text-warning"
                : "border-success/50 bg-success/15 text-success",
            )}
          >
            {hasErrors ? (
              <AlertTriangle className="size-5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {hasErrors
                ? "Factura confirmada con errores"
                : "Factura confirmada"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isConfirmed
                ? "El inventario se actualizó con las líneas aplicadas."
                : "Algunas líneas no se pudieron aplicar. Corrige los errores y vuelve a confirmar."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-success/50 bg-success/15 font-mono text-[10px] uppercase tracking-wider text-success"
          >
            {formatNumber(result.created)} creado
            {result.created === 1n ? "" : "s"}
          </Badge>
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-wider text-primary"
          >
            {formatNumber(result.updated)} actualizado
            {result.updated === 1n ? "" : "s"}
          </Badge>
          {hasErrors ? (
            <Badge
              variant="outline"
              className="border-destructive/50 bg-destructive/10 font-mono text-[10px] uppercase tracking-wider text-destructive"
            >
              {formatNumber(result.failed)} con error
            </Badge>
          ) : null}
        </div>
      </div>

      {wasAlreadyConfirmed ? (
        <p
          data-ocid="purchase_invoices.result_idempotent_notice"
          className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
        >
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Esta factura ya había sido confirmada. No se volvió a registrar
            stock: el inventario no se duplicó.
          </span>
        </p>
      ) : null}

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[70px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Línea
              </TableHead>
              <TableHead className="w-[140px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Código
              </TableHead>
              <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Resultado
              </TableHead>
              <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Motivo
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.lines.map((line, index) => (
              <TableRow
                key={line.lineId.toString()}
                data-ocid={`purchase_invoices.result_row.${index + 1}`}
              >
                <TableCell className="data-rail text-muted-foreground">
                  {formatNumber(line.lineNumber)}
                </TableCell>
                <TableCell className="data-rail font-medium">
                  {line.code.trim() === "" ? "—" : line.code}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      LINE_STATUS_STYLES[line.status],
                    )}
                  >
                    {LINE_STATUS_LABELS[line.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {line.error ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onDismiss}
          data-ocid="purchase_invoices.result_dismiss_button"
        >
          Cargar otra factura
        </Button>
      </div>
    </section>
  );
}
