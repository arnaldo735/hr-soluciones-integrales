import { InvoiceSort as InvoiceSortEnum } from "@/backend";
import { InvoiceStatusBadge } from "@/components/purchase-invoices-history/InvoiceStatusBadge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { usePurchaseInvoices } from "@/hooks/use-purchase-invoices";
import { formatDate, formatNumber } from "@/lib/format";
import type {
  Id,
  InvoiceSort,
  PurchaseInvoiceStatus,
  Supplier,
} from "@/lib/types";
import { PurchaseInvoiceStatus as PurchaseInvoiceStatusEnum } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: PurchaseInvoiceStatus[] = [
  PurchaseInvoiceStatusEnum.pending,
  PurchaseInvoiceStatusEnum.confirmed,
  PurchaseInvoiceStatusEnum.withErrors,
];

const STATUS_LABELS: Record<PurchaseInvoiceStatus, string> = {
  [PurchaseInvoiceStatusEnum.pending]: "Pendiente",
  [PurchaseInvoiceStatusEnum.confirmed]: "Confirmada",
  [PurchaseInvoiceStatusEnum.withErrors]: "Con errores",
};

const SORT_OPTIONS: Array<{ value: InvoiceSort; label: string }> = [
  { value: InvoiceSortEnum.createdAt, label: "Más recientes" },
  { value: InvoiceSortEnum.invoiceDate, label: "Fecha de factura" },
  { value: InvoiceSortEnum.invoiceNumber, label: "Número de factura" },
];

const ALL = "all";

/** Supplier directory used to populate the supplier filter. */
function useSupplierDirectory() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["suppliers", "purchase-invoice-filter"],
    queryFn: async (): Promise<Supplier[]> => {
      if (!actor) return [];
      return actor.listSuppliers(token, null);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

interface PurchaseInvoiceListProps {
  /** Current page (1-based). */
  page: number;
  /** Called when the page changes. */
  onPageChange: (page: number) => void;
  /** Current status filter, or `null` for every status. */
  status: PurchaseInvoiceStatus | null;
  onStatusChange: (status: PurchaseInvoiceStatus | null) => void;
  /** Current supplier filter, or `null` for every supplier. */
  supplierId: Id | null;
  onSupplierChange: (supplierId: Id | null) => void;
  /** Current free-text search term. */
  search: string;
  onSearchChange: (search: string) => void;
  /** Current sort field. */
  sort: InvoiceSort;
  onSortChange: (sort: InvoiceSort) => void;
}

/**
 * Processed purchase-invoice history: supplier, number, date, item count and
 * status, with status/supplier/search filters and pagination.
 */
export function PurchaseInvoiceList({
  page,
  onPageChange,
  status,
  onStatusChange,
  supplierId,
  onSupplierChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: PurchaseInvoiceListProps) {
  const [term, setTerm] = useState(search);
  const suppliersQuery = useSupplierDirectory();
  const suppliers = suppliersQuery.data ?? [];

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(search);
  }, [search]);

  // Debounce the free-text term so typing stays responsive.
  useEffect(() => {
    if (term === search) return;
    const handle = window.setTimeout(() => onSearchChange(term), 300);
    return () => window.clearTimeout(handle);
  }, [term, search, onSearchChange]);

  const offset = (page - 1) * PAGE_SIZE;

  const invoicesQuery = usePurchaseInvoices({
    status,
    supplierId,
    search,
    sort,
    offset,
    limit: PAGE_SIZE,
  });

  const items = invoicesQuery.data?.items ?? [];
  const total = Number(invoicesQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== null || supplierId !== null || search !== "";

  const supplierNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const supplier of suppliers) {
      map.set(supplier.id.toString(), supplier.name);
    }
    return map;
  }, [suppliers]);

  const clearFilters = () => {
    setTerm("");
    onStatusChange(null);
    onSupplierChange(null);
    onSearchChange("");
  };

  return (
    <div className="space-y-4">
      <section
        data-ocid="purchase_invoices.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por proveedor, número o archivo…"
              aria-label="Buscar facturas de compra"
              className="pl-9"
              data-ocid="purchase_invoices.search_input"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="purchase-invoices-status"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Estado
            </Label>
            <Select
              value={status ?? ALL}
              onValueChange={(value) =>
                onStatusChange(
                  value === ALL ? null : (value as PurchaseInvoiceStatus),
                )
              }
            >
              <SelectTrigger
                id="purchase-invoices-status"
                aria-label="Filtrar por estado"
                className="w-[170px]"
                data-ocid="purchase_invoices.status_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los estados</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="purchase-invoices-supplier"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Proveedor
            </Label>
            <Select
              value={supplierId?.toString() ?? ALL}
              onValueChange={(value) =>
                onSupplierChange(value === ALL ? null : BigInt(value))
              }
            >
              <SelectTrigger
                id="purchase-invoices-supplier"
                aria-label="Filtrar por proveedor"
                className="w-[220px]"
                data-ocid="purchase_invoices.supplier_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los proveedores</SelectItem>
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

          <div className="space-y-1">
            <Label
              htmlFor="purchase-invoices-sort"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Ordenar por
            </Label>
            <Select
              value={sort}
              onValueChange={(value) => onSortChange(value as InvoiceSort)}
            >
              <SelectTrigger
                id="purchase-invoices-sort"
                aria-label="Ordenar facturas"
                className="w-[190px]"
                data-ocid="purchase_invoices.sort_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="purchase_invoices.clear_filters_button"
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {invoicesQuery.isLoading
              ? "Cargando…"
              : `${formatNumber(total)} factura${total === 1 ? "" : "s"} procesada${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {invoicesQuery.isError ? (
          <div
            data-ocid="purchase_invoices.error_state"
            className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar las facturas de compra.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void invoicesQuery.refetch()}
              data-ocid="purchase_invoices.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : invoicesQuery.isLoading ? (
          <div
            data-ocid="purchase_invoices.loading_state"
            className="space-y-2 p-4"
          >
            {Array.from({ length: 6 }, (_, index) => `row-${index}`).map(
              (id) => (
                <Skeleton key={id} className="h-9 w-full" />
              ),
            )}
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="purchase_invoices.empty_state"
            className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <FileText
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {hasFilters
                  ? "Sin resultados"
                  : "Aún no hay facturas de compra procesadas"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {hasFilters
                  ? "Ajusta el estado, el proveedor o la búsqueda para encontrar facturas."
                  : "Carga una factura en PDF o foto desde Compras para actualizar el inventario."}
              </p>
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                data-ocid="purchase_invoices.empty_clear_button"
              >
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Número
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Proveedor
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Fecha
                </TableHead>
                <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Ítems
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((invoice, index) => {
                const supplierLabel =
                  invoice.supplierName?.trim() ||
                  (invoice.supplierId !== undefined
                    ? supplierNames.get(invoice.supplierId.toString())
                    : undefined) ||
                  "Proveedor sin identificar";
                return (
                  <TableRow
                    key={invoice.id.toString()}
                    data-ocid={`purchase_invoices.row.${index + 1}`}
                  >
                    <TableCell>
                      <Link
                        to="/facturas-compra/$id"
                        params={{ id: invoice.id.toString() }}
                        data-ocid={`purchase_invoices.link.${index + 1}`}
                        className="data-rail text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {invoice.invoiceNumber?.trim() ||
                          `#${invoice.id.toString()}`}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      <span className="block truncate font-medium">
                        {supplierLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.invoiceDate ?? invoice.createdAt)}
                    </TableCell>
                    <TableCell className="data-rail text-right text-muted-foreground">
                      {formatNumber(invoice.lines.length)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        asChild
                        className={cn("gap-1 text-muted-foreground")}
                      >
                        <Link
                          to="/facturas-compra/$id"
                          params={{ id: invoice.id.toString() }}
                          data-ocid={`purchase_invoices.detail_button.${index + 1}`}
                        >
                          Ver detalle
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!invoicesQuery.isLoading && !invoicesQuery.isError && total > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                data-ocid="purchase_invoices.pagination_prev"
                className="gap-1"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                data-ocid="purchase_invoices.pagination_next"
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
