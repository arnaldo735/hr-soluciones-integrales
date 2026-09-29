import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Id, Supplier } from "@/lib/types";
import { LineMatchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Plus, ScanLine, Trash2 } from "lucide-react";

/** Sentinel value for the "create a new supplier" option in the select. */
export const NEW_SUPPLIER_VALUE = "__new__";

/** One editable invoice line held in local review state. */
export interface ReviewLine {
  /** Stable client-side key; never the array index. */
  key: string;
  /** Backend line id when the line came from an extraction. */
  id?: bigint;
  code: string;
  description: string;
  /** Quantity as typed by the user; parsed on save. */
  quantity: string;
  /** Unit cost in pesos with up to two decimals; converted to cents on save. */
  unitCost: string;
  /** IVA as a whole percentage typed by the user; parsed on save. */
  taxRate: string;
  /** Discount as a whole percentage typed by the user; parsed on save. */
  discountRate: string;
  /** Line total in pesos with up to two decimals; converted to cents on save. */
  total: string;
  /** Whether the code matches an existing part, from the backend. */
  matchStatus: LineMatchStatus;
}

/** Editable header fields of the invoice under review. */
export interface ReviewHeader {
  /** Selected supplier id, or `null` when creating a new supplier. */
  supplierId: Id | null;
  /** Free-text supplier name, used when no existing supplier is selected. */
  supplierName: string;
  /** Supplier NIT (tax id) as extracted or typed by the user. */
  supplierTaxId: string;
  invoiceNumber: string;
  /** Invoice date as a `YYYY-MM-DD` input value. */
  invoiceDate: string;
  /** Forma de pago (contado, crédito…), free text. */
  paymentMethod: string;
  /** Medio de pago (efectivo, transferencia, tarjeta…), free text. */
  paymentMeans: string;
}

interface InvoiceReviewPanelProps {
  header: ReviewHeader;
  onHeaderChange: (patch: Partial<ReviewHeader>) => void;
  lines: ReviewLine[];
  onLineChange: (key: string, patch: Partial<ReviewLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (key: string) => void;
  /**
   * Opens the barcode scanner for one line so a scanned code can fill its
   * code, description and unit cost. Omitted when scanning is unavailable.
   */
  onScanLine?: (key: string) => void;
  suppliers: Supplier[];
  suppliersLoading: boolean;
  /** True while the review is being saved to the backend. */
  isSaving: boolean;
  /** True while the invoice is being confirmed. */
  isConfirming: boolean;
  /** Validation message blocking confirmation, or `null` when ready. */
  validationError: string | null;
  onSave: () => void;
  onConfirm: () => void;
  /** True once the invoice has been confirmed; the panel becomes read-only. */
  confirmed: boolean;
  /**
   * Spanish notice shown when the automatic extraction failed or returned no
   * lines. The panel still opens so the user can complete the invoice by hand.
   */
  extractionNotice?: string | null;
}

/**
 * Parses a peso input with up to two decimals into integer cents. Accepts
 * `12500`, `12500.5` and `12500,50`; returns `null` when invalid.
 */
export function parsePesosToCents(value: string): bigint | null {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (normalized === "" || normalized === ".") return null;
  const [wholePart = "", fractionPart = ""] = normalized.split(".");
  const whole = wholePart === "" ? 0n : BigInt(wholePart);
  const fraction = `${fractionPart}00`.slice(0, 2);
  return whole * 100n + BigInt(fraction);
}

/** Parses a quantity input into a non-negative integer. Returns `null` when invalid. */
export function parseQuantityInput(value: string): bigint | null {
  const cleaned = value.replace(/[^\d]/g, "");
  if (cleaned === "") return null;
  return BigInt(cleaned);
}

/**
 * Parses a percentage input into a whole non-negative integer. Accepts a comma
 * or a dot as the decimal separator and rounds to the nearest whole percent,
 * matching the backend's integer `taxRate` / `discountRate`. Returns `null`
 * when the input is empty or not a number.
 */
export function parsePercentInput(value: string): bigint | null {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (normalized === "" || normalized === ".") return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed));
}

/**
 * Line total in cents derived from the edited quantity, unit cost, IVA and
 * discount: `cantidad × costo unitario × (1 − descuento%) × (1 + IVA%)`,
 * rounded to the nearest cent. Used as the default when the user has not typed
 * an explicit total.
 */
export function computeLineTotalCents(
  quantity: bigint,
  unitCost: bigint,
  taxRate: bigint,
  discountRate: bigint,
): bigint {
  const gross = quantity * unitCost;
  const afterDiscount = (gross * (100n - discountRate)) / 100n;
  return (afterDiscount * (100n + taxRate)) / 100n;
}

/**
 * Formats integer cents as a peso input value with two decimals and no
 * thousands separators, so an extracted cost round-trips exactly.
 */
export function centsToPesosInput(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

function MatchBadge({ status }: { status: LineMatchStatus }) {
  const isExisting = status === LineMatchStatus.existing;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        isExisting
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-success/50 bg-success/15 text-success",
      )}
    >
      {isExisting ? "Actualiza" : "Nuevo"}
    </Badge>
  );
}

/**
 * Editable review of an extracted purchase invoice: header fields (supplier,
 * number, date) plus a table of lines the user can correct, extend or prune.
 * Each line shows whether its code matches an existing part or creates a new
 * one, and the running total is recomputed from the edited values.
 */
export function InvoiceReviewPanel({
  header,
  onHeaderChange,
  lines,
  onLineChange,
  onAddLine,
  onRemoveLine,
  onScanLine,
  suppliers,
  suppliersLoading,
  isSaving,
  isConfirming,
  validationError,
  onSave,
  onConfirm,
  confirmed,
  extractionNotice = null,
}: InvoiceReviewPanelProps) {
  const isNewSupplier = header.supplierId === null;
  const busy = isSaving || isConfirming;

  const totalCents = lines.reduce((sum, line) => {
    const quantity = parseQuantityInput(line.quantity) ?? 0n;
    const unitCost = parsePesosToCents(line.unitCost) ?? 0n;
    const taxRate = parsePercentInput(line.taxRate) ?? 0n;
    const discountRate = parsePercentInput(line.discountRate) ?? 0n;
    // An explicit total wins; otherwise it is derived from the other fields so
    // the running total always reflects what the user sees.
    const explicitTotal = parsePesosToCents(line.total);
    return (
      sum +
      (explicitTotal ??
        computeLineTotalCents(quantity, unitCost, taxRate, discountRate))
    );
  }, 0n);

  const newCount = lines.filter(
    (line) => line.matchStatus === LineMatchStatus.new,
  ).length;
  const existingCount = lines.length - newCount;

  return (
    <section
      data-ocid="purchase_invoices.review_panel"
      className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-subtle"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Revisión de la factura
          </p>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Verifica los datos extraídos
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Corrige el NIT, la forma y el medio de pago, y en cada línea el
            código, la descripción, la cantidad, el costo, el IVA, el descuento
            y el valor total. Puedes añadir ítems faltantes o eliminar los
            incorrectos antes de confirmar.
          </p>
        </div>
        {confirmed ? (
          <Badge
            variant="outline"
            className="border-success/50 bg-success/15 font-mono text-[10px] uppercase tracking-wider text-success"
          >
            Confirmada
          </Badge>
        ) : null}
      </div>

      {extractionNotice ? (
        <p
          data-ocid="purchase_invoices.extraction_notice"
          className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>{extractionNotice}</span>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pi-supplier">Proveedor</Label>
          <Select
            value={header.supplierId?.toString() ?? NEW_SUPPLIER_VALUE}
            onValueChange={(value) => {
              if (value === NEW_SUPPLIER_VALUE) {
                onHeaderChange({ supplierId: null });
                return;
              }
              const supplier = suppliers.find(
                (entry) => entry.id.toString() === value,
              );
              onHeaderChange({
                supplierId: BigInt(value),
                supplierName: supplier?.name ?? header.supplierName,
              });
            }}
            disabled={confirmed || suppliersLoading}
          >
            <SelectTrigger
              id="pi-supplier"
              aria-label="Proveedor de la factura"
              data-ocid="purchase_invoices.supplier_select"
            >
              <SelectValue placeholder="Selecciona un proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_SUPPLIER_VALUE}>
                + Crear proveedor nuevo
              </SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem
                  key={supplier.id.toString()}
                  value={supplier.id.toString()}
                >
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isNewSupplier ? (
          <div className="space-y-1.5">
            <Label htmlFor="pi-supplier-name">Nombre del proveedor nuevo</Label>
            <Input
              id="pi-supplier-name"
              value={header.supplierName}
              onChange={(event) =>
                onHeaderChange({ supplierName: event.target.value })
              }
              placeholder="Ej. Repuestos El Motor"
              disabled={confirmed}
              aria-label="Nombre del proveedor nuevo"
              data-ocid="purchase_invoices.supplier_name_input"
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="pi-supplier-tax-id">NIT del proveedor</Label>
          <Input
            id="pi-supplier-tax-id"
            value={header.supplierTaxId}
            onChange={(event) =>
              onHeaderChange({ supplierTaxId: event.target.value })
            }
            placeholder="Ej. 900123456-7"
            disabled={confirmed}
            aria-label="NIT del proveedor"
            data-ocid="purchase_invoices.supplier_tax_id_input"
            className="data-rail"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pi-invoice-number">Número de factura</Label>
          <Input
            id="pi-invoice-number"
            value={header.invoiceNumber}
            onChange={(event) =>
              onHeaderChange({ invoiceNumber: event.target.value })
            }
            placeholder="Ej. FE-10245"
            disabled={confirmed}
            aria-label="Número de factura"
            data-ocid="purchase_invoices.invoice_number_input"
            className="data-rail"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pi-invoice-date">Fecha de la factura</Label>
          <Input
            id="pi-invoice-date"
            type="date"
            value={header.invoiceDate}
            onChange={(event) =>
              onHeaderChange({ invoiceDate: event.target.value })
            }
            disabled={confirmed}
            aria-label="Fecha de la factura"
            data-ocid="purchase_invoices.invoice_date_input"
            className="data-rail"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pi-payment-method">Forma de pago</Label>
          <Input
            id="pi-payment-method"
            value={header.paymentMethod}
            onChange={(event) =>
              onHeaderChange({ paymentMethod: event.target.value })
            }
            placeholder="Ej. Crédito"
            disabled={confirmed}
            aria-label="Forma de pago"
            data-ocid="purchase_invoices.payment_method_input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pi-payment-means">Medio de pago</Label>
          <Input
            id="pi-payment-means"
            value={header.paymentMeans}
            onChange={(event) =>
              onHeaderChange({ paymentMeans: event.target.value })
            }
            placeholder="Ej. Transferencia"
            disabled={confirmed}
            aria-label="Medio de pago"
            data-ocid="purchase_invoices.payment_means_input"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[130px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Código
              </TableHead>
              <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Descripción
              </TableHead>
              <TableHead className="w-[110px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Cantidad
              </TableHead>
              <TableHead className="w-[150px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Costo unitario
              </TableHead>
              <TableHead className="w-[96px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                IVA %
              </TableHead>
              <TableHead className="w-[110px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Descuento %
              </TableHead>
              <TableHead className="w-[150px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Valor total
              </TableHead>
              <TableHead className="w-[110px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Coincidencia
              </TableHead>
              <TableHead className="w-[96px] pr-3 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={9}
                  data-ocid="purchase_invoices.lines_empty_state"
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No hay líneas en esta factura. Añade los ítems manualmente.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, index) => {
                const quantity = parseQuantityInput(line.quantity) ?? 0n;
                const unitCost = parsePesosToCents(line.unitCost) ?? 0n;
                const taxRate = parsePercentInput(line.taxRate) ?? 0n;
                const discountRate = parsePercentInput(line.discountRate) ?? 0n;
                const derivedTotal = computeLineTotalCents(
                  quantity,
                  unitCost,
                  taxRate,
                  discountRate,
                );
                return (
                  <TableRow
                    key={line.key}
                    data-ocid={`purchase_invoices.line_row.${index + 1}`}
                  >
                    <TableCell className="align-top">
                      <Input
                        value={line.code}
                        onChange={(event) =>
                          onLineChange(line.key, { code: event.target.value })
                        }
                        disabled={confirmed}
                        aria-label={`Código de la línea ${index + 1}`}
                        data-ocid={`purchase_invoices.line_code_input.${index + 1}`}
                        className="data-rail h-8"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        value={line.description}
                        onChange={(event) =>
                          onLineChange(line.key, {
                            description: event.target.value,
                          })
                        }
                        disabled={confirmed}
                        aria-label={`Descripción de la línea ${index + 1}`}
                        data-ocid={`purchase_invoices.line_description_input.${index + 1}`}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) =>
                          onLineChange(line.key, {
                            quantity: event.target.value,
                          })
                        }
                        disabled={confirmed}
                        aria-label={`Cantidad de la línea ${index + 1}`}
                        data-ocid={`purchase_invoices.line_quantity_input.${index + 1}`}
                        className="data-rail h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        inputMode="decimal"
                        value={line.unitCost}
                        onChange={(event) =>
                          onLineChange(line.key, {
                            unitCost: event.target.value,
                          })
                        }
                        disabled={confirmed}
                        aria-label={`Costo unitario de la línea ${index + 1}`}
                        data-ocid={`purchase_invoices.line_cost_input.${index + 1}`}
                        className="data-rail h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        inputMode="numeric"
                        value={line.taxRate}
                        onChange={(event) =>
                          onLineChange(line.key, {
                            taxRate: event.target.value,
                          })
                        }
                        disabled={confirmed}
                        aria-label={`IVA de la línea ${index + 1}`}
                        data-ocid={`purchase_invoices.line_tax_rate_input.${index + 1}`}
                        className="data-rail h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        inputMode="numeric"
                        value={line.discountRate}
                        onChange={(event) =>
                          onLineChange(line.key, {
                            discountRate: event.target.value,
                          })
                        }
                        disabled={confirmed}
                        aria-label={`Descuento de la línea ${index + 1}`}
                        data-ocid={`purchase_invoices.line_discount_input.${index + 1}`}
                        className="data-rail h-8 text-right"
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        inputMode="decimal"
                        value={line.total}
                        onChange={(event) =>
                          onLineChange(line.key, { total: event.target.value })
                        }
                        disabled={confirmed}
                        aria-label={`Valor total de la línea ${index + 1}`}
                        data-ocid={`purchase_invoices.line_total_input.${index + 1}`}
                        className="data-rail h-8 text-right"
                      />
                      <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                        Calculado {formatMoney(derivedTotal)}
                      </span>
                    </TableCell>
                    <TableCell className="align-top pt-3">
                      <MatchBadge status={line.matchStatus} />
                    </TableCell>
                    <TableCell className="align-top pr-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onScanLine ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => onScanLine(line.key)}
                            disabled={confirmed}
                            aria-label={`Escanear código para la línea ${index + 1}`}
                            data-ocid={`purchase_invoices.line_scan_button.${index + 1}`}
                            className="size-8 text-muted-foreground hover:text-primary"
                          >
                            <ScanLine className="size-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => onRemoveLine(line.key)}
                          disabled={confirmed}
                          aria-label={`Eliminar la línea ${index + 1}`}
                          data-ocid={`purchase_invoices.line_delete_button.${index + 1}`}
                          className="size-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddLine}
          disabled={confirmed}
          data-ocid="purchase_invoices.add_line_button"
          className="gap-1.5"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir línea
        </Button>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>
            <span className="data-rail font-medium text-foreground">
              {formatNumber(existingCount)}
            </span>{" "}
            actualiza{existingCount === 1 ? "" : "n"}
          </span>
          <span>
            <span className="data-rail font-medium text-foreground">
              {formatNumber(newCount)}
            </span>{" "}
            nuevo{newCount === 1 ? "" : "s"}
          </span>
          <span className="text-sm">
            Total{" "}
            <strong className="data-rail text-foreground">
              {formatMoney(totalCents)}
            </strong>
          </span>
        </div>
      </div>

      {validationError ? (
        <p
          data-ocid="purchase_invoices.review_validation_error"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {validationError}
        </p>
      ) : null}

      {!confirmed ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSave}
            disabled={busy}
            data-ocid="purchase_invoices.save_review_button"
          >
            {isSaving ? "Guardando…" : "Guardar revisión"}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            data-ocid="purchase_invoices.confirm_button"
            className="gap-2"
          >
            {isConfirming
              ? "Confirmando…"
              : "Confirmar y actualizar inventario"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
