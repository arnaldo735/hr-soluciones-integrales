import { StatusBadge } from "@/components/StatusBadge";
import { InvoiceStatusBadge } from "@/components/purchase-invoices-history/InvoiceStatusBadge";
import {
  EXTRACTION_STATUS_LABELS,
  FILE_KIND_LABELS,
  LINE_APPLY_LABELS,
  LINE_APPLY_TONES,
  LINE_MATCH_LABELS,
  formatFileSize,
} from "@/components/purchase-invoices-history/status";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePurchaseInvoice } from "@/hooks/use-purchase-invoices";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import type { Id, PurchaseInvoice, PurchaseInvoiceLine } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  FileText,
  PackagePlus,
  RefreshCw,
} from "lucide-react";

/** Total cost of the extracted lines, in cents. */
function linesTotal(invoice: PurchaseInvoice): bigint {
  return invoice.lines.reduce(
    (sum, line) => sum + line.unitCost * line.quantity,
    0n,
  );
}

/** Count of lines that failed to apply to inventory. */
function errorCount(invoice: PurchaseInvoice): number {
  return invoice.lines.filter((line) => line.applyStatus === "error").length;
}

function MetaField({
  label,
  value,
  rail,
}: {
  label: string;
  value: string;
  rail?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className={cn("text-sm font-medium", rail && "data-rail")}>
        {value}
      </dd>
    </div>
  );
}

/** Link to the inventory movements generated for one applied line. */
function MovementLink({
  line,
  index,
}: {
  line: PurchaseInvoiceLine;
  index: number;
}) {
  if (line.matchedPartId === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <Button type="button" variant="outline" size="sm" asChild className="gap-1">
      <Link
        to="/inventario/$id"
        params={{ id: line.matchedPartId.toString() }}
        data-ocid={`purchase_invoice_detail.movement_link.${index + 1}`}
      >
        <Boxes className="size-3.5" aria-hidden="true" />
        Ver movimientos
      </Link>
    </Button>
  );
}

function LineRow({
  line,
  index,
}: { line: PurchaseInvoiceLine; index: number }) {
  const amount = line.unitCost * line.quantity;
  return (
    <TableRow data-ocid={`purchase_invoice_detail.line.${index + 1}`}>
      <TableCell className="data-rail text-xs text-muted-foreground">
        {formatNumber(line.lineNumber)}
      </TableCell>
      <TableCell className="max-w-[280px]">
        <span className="block truncate font-medium">{line.description}</span>
        <span className="data-rail block text-xs text-muted-foreground">
          {line.code}
        </span>
      </TableCell>
      <TableCell className="data-rail text-right">
        {formatNumber(line.quantity)}
      </TableCell>
      <TableCell className="data-rail text-right text-muted-foreground">
        {formatMoney(line.unitCost)}
      </TableCell>
      <TableCell className="data-rail text-right font-medium">
        {formatMoney(amount)}
      </TableCell>
      <TableCell>
        <StatusBadge
          label={LINE_APPLY_LABELS[line.applyStatus]}
          tone={LINE_APPLY_TONES[line.applyStatus]}
          className="font-mono text-[10px] uppercase tracking-wider"
        />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {LINE_MATCH_LABELS[line.matchStatus]}
      </TableCell>
      <TableCell className="max-w-[240px]">
        {line.applyError ? (
          <span
            data-ocid={`purchase_invoice_detail.line_error.${index + 1}`}
            className="flex items-start gap-1 text-xs text-destructive"
          >
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="min-w-0 break-words">{line.applyError}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="pr-4 text-right">
        <MovementLink line={line} index={index} />
      </TableCell>
    </TableRow>
  );
}

function DetailSkeleton() {
  return (
    <div
      data-ocid="purchase_invoice_detail.loading_state"
      className="mx-auto w-full max-w-6xl space-y-4"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function DetailError() {
  return (
    <div
      data-ocid="purchase_invoice_detail.error_state"
      className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center"
    >
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <p className="font-display text-sm font-semibold">
        Factura no encontrada
      </p>
      <p className="max-w-sm text-xs text-muted-foreground">
        La factura de compra solicitada no existe o fue eliminada del registro.
      </p>
      <Button type="button" variant="outline" asChild>
        <Link
          to="/facturas-compra"
          data-ocid="purchase_invoice_detail.back_button"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al historial
        </Link>
      </Button>
    </div>
  );
}

interface PurchaseInvoiceDetailProps {
  invoiceId: Id;
}

/**
 * Detail view of one processed purchase invoice: extracted header, the lines
 * with their apply result, and links to the inventory movements generated.
 */
export function PurchaseInvoiceDetail({
  invoiceId,
}: PurchaseInvoiceDetailProps) {
  const invoiceQuery = usePurchaseInvoice(invoiceId);

  if (invoiceQuery.isLoading) return <DetailSkeleton />;

  const invoice = invoiceQuery.data ?? null;
  if (invoiceQuery.isError || !invoice) return <DetailError />;

  const total = linesTotal(invoice);
  const failures = errorCount(invoice);
  const isConfirmed = invoice.status === "confirmed";
  // A #withErrors invoice still generates lots and movements for its successful
  // lines, so the panel is driven by the applied lines rather than the status.
  const appliedLines = invoice.lines.filter(
    (line) => line.matchedPartId !== undefined,
  );

  return (
    <div
      data-ocid="purchase_invoice_detail.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link
            to="/facturas-compra"
            data-ocid="purchase_invoice_detail.back_link"
            className="gap-1"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Historial de facturas
          </Link>
        </Button>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <header className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Compras · Factura procesada
        </p>
        <h1 className="data-rail text-2xl font-semibold tracking-tight">
          {invoice.invoiceNumber?.trim() || `Factura #${invoice.id.toString()}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {invoice.supplierName?.trim() || "Proveedor sin identificar"} ·{" "}
          {formatNumber(invoice.lines.length)} ítem
          {invoice.lines.length === 1 ? "" : "s"} extraído
          {invoice.lines.length === 1 ? "" : "s"}
        </p>
      </header>

      <section
        data-ocid="purchase_invoice_detail.header_panel"
        className="rounded-lg border border-border bg-card p-5 shadow-subtle"
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaField
            label="Proveedor"
            value={invoice.supplierName?.trim() || "Sin identificar"}
          />
          <MetaField
            label="Número de factura"
            value={invoice.invoiceNumber?.trim() || "—"}
            rail
          />
          <MetaField
            label="Fecha de factura"
            value={formatDate(invoice.invoiceDate)}
          />
          <MetaField
            label="Cargada el"
            value={formatDateTime(invoice.createdAt)}
          />
          <MetaField
            label="Extracción"
            value={EXTRACTION_STATUS_LABELS[invoice.extractionStatus]}
          />
          <MetaField
            label="Archivo"
            value={`${FILE_KIND_LABELS[invoice.file.kind] ?? invoice.file.kind} · ${formatFileSize(invoice.file.sizeBytes)}`}
          />
          <MetaField
            label="Confirmada el"
            value={
              invoice.confirmedAt ? formatDateTime(invoice.confirmedAt) : "—"
            }
          />
          <MetaField label="Total de líneas" value={formatMoney(total)} rail />
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5" aria-hidden="true" />
            <span className="data-rail">{invoice.file.fileName}</span>
          </span>
          {isConfirmed ? (
            <StatusBadge
              label={`${formatNumber(invoice.lines.length - failures)} aplicadas`}
              tone="accepted"
              icon={<CheckCircle2 className="size-3" aria-hidden="true" />}
              className="font-mono text-[10px] uppercase tracking-wider"
            />
          ) : null}
          {failures > 0 ? (
            <StatusBadge
              label={`${formatNumber(failures)} con error`}
              tone="rejected"
              icon={<AlertTriangle className="size-3" aria-hidden="true" />}
              className="font-mono text-[10px] uppercase tracking-wider"
            />
          ) : null}
        </div>

        {invoice.extractionError ? (
          <p
            data-ocid="purchase_invoice_detail.extraction_error"
            className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {invoice.extractionError}
          </p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Ítems extraídos y resultado de aplicación
          </p>
          {isConfirmed ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <PackagePlus className="size-3.5" aria-hidden="true" />
              Cada línea aplicada generó un movimiento de inventario.
            </p>
          ) : null}
        </div>

        {invoice.lines.length === 0 ? (
          <div
            data-ocid="purchase_invoice_detail.lines_empty_state"
            className="flex flex-col items-center gap-2 px-6 py-14 text-center"
          >
            <RefreshCw
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-display text-sm font-semibold">
              Sin ítems extraídos
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              La extracción no devolvió líneas para esta factura. Revisa el
              archivo cargado o vuelve a ejecutar la extracción.
            </p>
          </div>
        ) : (
          <div className="scroll-slim overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Descripción
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Cant.
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Costo unit.
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Total
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Aplicación
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Coincidencia
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Detalle
                  </TableHead>
                  <TableHead className="pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Inventario
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line, index) => (
                  <LineRow key={line.id.toString()} line={line} index={index} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {invoice.lines.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Total de la factura{" "}
              <strong className="data-rail text-foreground">
                {formatMoney(total)}
              </strong>
            </span>
          </div>
        ) : null}
      </section>

      {appliedLines.length > 0 ? (
        <section
          data-ocid="purchase_invoice_detail.movements_panel"
          className="rounded-lg border border-border bg-card p-5 shadow-subtle"
        >
          <header className="mb-3 flex items-center gap-2">
            <Boxes
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="font-display text-sm font-semibold">
              Movimientos de inventario generados
            </h2>
          </header>
          <p className="mb-3 text-xs text-muted-foreground">
            Abre el repuesto afectado para ver sus lotes, movimientos y ajustes
            de existencias.
          </p>
          <ul className="space-y-1.5">
            {appliedLines.map((line, index) => (
              <li
                key={line.id.toString()}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {line.description}
                  </span>
                  <span className="data-rail block text-xs text-muted-foreground">
                    {line.code} · {formatNumber(line.quantity)} ×{" "}
                    {formatMoney(line.unitCost)}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1"
                >
                  <Link
                    to="/inventario/$id"
                    params={{ id: line.matchedPartId?.toString() ?? "" }}
                    data-ocid={`purchase_invoice_detail.part_link.${index + 1}`}
                  >
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    Ver repuesto
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
