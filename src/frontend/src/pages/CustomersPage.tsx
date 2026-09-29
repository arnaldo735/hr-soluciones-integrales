import { ContactImportDialog } from "@/components/ContactImportDialog";
import { parseCsv } from "@/components/CsvTransfer";
import { CustomerFormDialog } from "@/components/CustomerFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  CUSTOMER_CSV_HEADERS,
  type ContactImportRow,
  buildContactImportRows,
  useContactImport,
} from "@/hooks/use-contact-import";
import {
  CUSTOMERS_PAGE_SIZE,
  type CustomerSortDir,
  useCustomersPage,
  useExportCustomersAggregated,
} from "@/hooks/use-customers";
import { formatNumber } from "@/lib/format";
import type {
  Customer,
  CustomerListItem,
  ImportPreviewResult,
} from "@/lib/types";
import { CustomerSort } from "@/lib/types";
import {
  downloadXlsx,
  downloadXlsxTemplate,
  readSpreadsheet,
} from "@/lib/xlsx";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bike,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** One exported customer row, keyed by the shared CSV headers. */
function customerToCsvRow(
  customer: Customer,
  motorcycles: string,
): Record<string, string> {
  return {
    nombre: customer.name,
    telefono: customer.phone,
    documento: customer.document ?? "",
    direccion: customer.address ?? "",
    correo: customer.email ?? "",
    motos: motorcycles,
  };
}

const SORT_LABELS: Record<CustomerSort, string> = {
  [CustomerSort.name]: "Nombre",
  [CustomerSort.createdAt]: "Fecha de alta",
  [CustomerSort.motorcycleCount]: "Cantidad de motos",
};

const SORT_OPTIONS: CustomerSort[] = [
  CustomerSort.name,
  CustomerSort.createdAt,
  CustomerSort.motorcycleCount,
];

interface CustomersSearch {
  q?: string;
  orden?: CustomerSort;
  dir?: CustomerSortDir;
  pagina?: number;
}

/** Normalizes the raw URL search params into a fully-resolved directory state. */
function resolveSearch(
  raw: Record<string, unknown>,
): Required<CustomersSearch> {
  const orden = SORT_OPTIONS.includes(raw.orden as CustomerSort)
    ? (raw.orden as CustomerSort)
    : CustomerSort.name;
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    orden,
    dir: raw.dir === "desc" ? "desc" : "asc",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1,
  };
}

const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, i) => `customer-skeleton-${i}`,
);

function CustomerTableSkeleton() {
  return (
    <div data-ocid="customers.loading_state" className="space-y-2 p-4">
      {SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-11 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div
      data-ocid="customers.empty_state"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
        <Users className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold">
          {hasSearch ? "Sin resultados" : "Aún no hay clientes"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasSearch
            ? "Ningún cliente coincide con la búsqueda. Prueba con otro nombre, teléfono o placa."
            : "Registra tu primer cliente para vincular sus motos y órdenes de taller."}
        </p>
      </div>
    </div>
  );
}

interface SortHeaderProps {
  field: CustomerSort;
  label: string;
  active: boolean;
  dir: CustomerSortDir;
  align?: "left" | "right";
  onSort: (field: CustomerSort) => void;
}

/** Clickable column header that toggles the backend sort field and direction. */
function SortHeader({
  field,
  label,
  active,
  dir,
  align = "left",
  onSort,
}: SortHeaderProps) {
  return (
    <TableHead
      className={align === "right" ? "text-right" : undefined}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        data-ocid={`customers.sort.${field}`}
        className={[
          "inline-flex items-center gap-1 rounded-sm font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-primary" : "text-muted-foreground",
          align === "right" ? "flex-row-reverse" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="size-3" aria-hidden="true" />
          ) : (
            <ArrowDown className="size-3" aria-hidden="true" />
          )
        ) : null}
      </button>
    </TableHead>
  );
}

interface CustomerRowProps {
  customer: CustomerListItem;
  index: number;
  onEdit: (customer: CustomerListItem) => void;
}

/**
 * Fila memoizada del directorio. El conteo de motos llega en la misma respuesta
 * de la página, así que la fila no dispara ninguna consulta. La ficha
 * imprimible se construye con `useMemo` a partir del cliente, de modo que no se
 * rearma en cada render de la página ni al escribir en el buscador.
 */
const CustomerRow = memo(function CustomerRow({
  customer,
  index,
  onEdit,
}: CustomerRowProps) {
  return (
    <TableRow data-ocid={`customers.row.${index + 1}`}>
      <TableCell className="px-4">
        <Link
          to="/clientes/$id"
          params={{ id: customer.id.toString() }}
          data-ocid={`customers.link.${index + 1}`}
          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {customer.name}
        </Link>
      </TableCell>
      <TableCell className="data-rail text-muted-foreground">
        {customer.phone}
      </TableCell>
      <TableCell className="hidden max-w-[16rem] truncate text-muted-foreground md:table-cell">
        {customer.email ?? "—"}
      </TableCell>
      <TableCell className="data-rail hidden text-muted-foreground lg:table-cell">
        {customer.document ?? "—"}
      </TableCell>
      <TableCell className="text-right">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Bike className="size-3.5" aria-hidden="true" />
          <span className="data-rail tabular">
            {formatNumber(customer.motorcycleCount)}
          </span>
        </span>
      </TableCell>
      <TableCell className="px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Editar ${customer.name}`}
            onClick={() => onEdit(customer)}
            data-ocid={`customers.edit_button.${index + 1}`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            data-ocid={`customers.open_button.${index + 1}`}
          >
            <Link
              to="/clientes/$id"
              params={{ id: customer.id.toString() }}
              aria-label={`Abrir ficha de ${customer.name}`}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export function CustomersPage() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const search = useMemo(() => resolveSearch(rawSearch), [rawSearch]);

  const [term, setTerm] = useState(search.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerListItem | null>(null);
  const [importRows, setImportRows] = useState<ContactImportRow[] | null>(null);
  const [importResult, setImportResult] = useState<ImportPreviewResult | null>(
    null,
  );
  const [importFailed, setImportFailed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contactImport = useContactImport("customer");
  const exportCustomers = useExportCustomersAggregated();

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(search.q);
  }, [search.q]);

  const applySearch = useCallback(
    (patch: Partial<CustomersSearch>) => {
      void navigate({
        to: "/clientes",
        search: (prev: Record<string, unknown>) => {
          const next: Record<string, unknown> = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === undefined) {
              delete next[key];
            }
          }
          return next;
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (term === search.q) return;
    const handle = window.setTimeout(() => {
      applySearch({ q: term, pagina: 1 });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [term, search.q, applySearch]);

  const { data, isLoading, isError, refetch } = useCustomersPage(
    search.q,
    search.orden,
    search.dir,
    search.pagina,
  );
  const customers = data?.items ?? [];
  const total = Number(data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const hasSearch = search.q.trim() !== "";

  const handleSort = useCallback(
    (field: CustomerSort) => {
      if (search.orden === field) {
        applySearch({
          dir: search.dir === "asc" ? "desc" : "asc",
          pagina: 1,
        });
      } else {
        applySearch({ orden: field, dir: "asc", pagina: 1 });
      }
    },
    [search.orden, search.dir, applySearch],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((customer: CustomerListItem) => {
    setEditing(customer);
    setDialogOpen(true);
  }, []);

  // Export the complete directory from the backend in a single aggregated call
  // rather than only the rows on the current page, so the workbook never
  // silently omits clients and never fans out one read per customer.
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await exportCustomers.mutateAsync();
      const csvRows = rows.map((row) => {
        const summary = row.motorcycles
          .map((moto) => `${moto.brand} ${moto.model} (${moto.plate})`)
          .join("; ");
        return customerToCsvRow(row.customer, summary);
      });
      await downloadXlsx("clientes", "Clientes", CUSTOMER_CSV_HEADERS, csvRows);
    } catch {
      toast.error("No se pudo exportar los clientes. Intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    await downloadXlsxTemplate(
      "plantilla-clientes",
      "Clientes",
      CUSTOMER_CSV_HEADERS,
      {
        nombre: "María Fernanda Ríos",
        telefono: "310 555 0198",
        documento: "1.020.334.556",
        direccion: "Cra. 45 #26-15, Bogotá",
        correo: "maria.rios@correo.com",
        motos: "Yamaha FZ 2.0 (ABC12D)",
      },
    );
  };

  const handleFile = async (file: File) => {
    if (!actor) return;
    try {
      const parsed = await readSpreadsheet(file, parseCsv);
      if (parsed.length === 0) {
        toast.error("El archivo no contiene filas válidas.");
        return;
      }
      const existing = await actor.listCustomers(token, null);
      setImportResult(null);
      setImportFailed(false);
      setImportRows(buildContactImportRows("customer", parsed, existing));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo. Verifica el formato e intenta de nuevo.",
      );
    }
  };

  const confirmImport = () => {
    if (!importRows) return;
    setImportFailed(false);
    contactImport.mutate(importRows, {
      onSuccess: (result) => {
        setImportResult(result);
        toast.success(
          `${result.created.toString()} creados · ${result.updated.toString()} actualizados · ${result.failed.toString()} con error`,
        );
      },
      onError: () => {
        setImportFailed(true);
        toast.error("No se pudo completar la importación.");
      },
    });
  };

  const closeImport = () => {
    setImportRows(null);
    setImportResult(null);
    setImportFailed(false);
  };

  return (
    <div
      data-ocid="customers.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Directorio
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Clientes y motos
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Busca por nombre, teléfono o placa y abre la ficha del cliente para
            ver sus motos e historial de órdenes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="sr-only"
            data-ocid="customers.import_file_input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDownloadTemplate()}
            data-ocid="customers.template_button"
            className="gap-2"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Plantilla
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={importRows !== null}
            onClick={() => fileInputRef.current?.click()}
            data-ocid="customers.import_button"
            className="gap-2"
          >
            <Upload className="size-4" aria-hidden="true" />
            Importar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => void handleExport()}
            data-ocid="customers.export_button"
            className="gap-2"
          >
            <Download className="size-4" aria-hidden="true" />
            {isExporting ? "Exportando…" : "Exportar"}
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            data-ocid="customers.open_modal_button"
            className="gap-2"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Nuevo cliente
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por nombre, teléfono o placa…"
              aria-label="Buscar clientes"
              data-ocid="customers.search_input"
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={search.orden}
            onValueChange={(value) =>
              applySearch({ orden: value as CustomerSort, pagina: 1 })
            }
          >
            <SelectTrigger
              size="sm"
              className="w-[190px]"
              aria-label="Ordenar por"
              data-ocid="customers.sort_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {SORT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              applySearch({
                dir: search.dir === "asc" ? "desc" : "asc",
                pagina: 1,
              })
            }
            aria-label={
              search.dir === "asc"
                ? "Orden ascendente, cambiar a descendente"
                : "Orden descendente, cambiar a ascendente"
            }
            data-ocid="customers.sort_dir_button"
            className="gap-1.5"
          >
            {search.dir === "asc" ? (
              <ArrowUp className="size-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="size-4" aria-hidden="true" />
            )}
            {search.dir === "asc" ? "Asc" : "Desc"}
          </Button>
          <Badge
            variant="outline"
            data-ocid="customers.count_badge"
            className="data-rail border-border bg-background text-muted-foreground"
          >
            {isLoading ? "…" : `${formatNumber(total)} clientes`}
          </Badge>
        </div>

        {isLoading ? (
          <CustomerTableSkeleton />
        ) : isError ? (
          <div
            data-ocid="customers.error_state"
            className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10">
              <AlertTriangle
                className="size-5 text-destructive"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                No se pudo cargar el directorio
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Revisa tu conexión e inténtalo de nuevo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-ocid="customers.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState hasSearch={hasSearch} />
        ) : (
          <Table data-ocid="customers.table">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <SortHeader
                  field={CustomerSort.name}
                  label="Cliente"
                  active={search.orden === CustomerSort.name}
                  dir={search.dir}
                  onSort={handleSort}
                />
                <TableHead>Teléfono</TableHead>
                <TableHead className="hidden md:table-cell">Correo</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Documento
                </TableHead>
                <SortHeader
                  field={CustomerSort.motorcycleCount}
                  label="Motos"
                  active={search.orden === CustomerSort.motorcycleCount}
                  dir={search.dir}
                  align="right"
                  onSort={handleSort}
                />
                <TableHead className="w-24 px-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <CustomerRow
                  key={customer.id.toString()}
                  customer={customer}
                  index={index}
                  onEdit={openEdit}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {!isLoading && !isError && total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Mostrando {formatNumber(customers.length)} de{" "}
              {formatNumber(total)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={search.pagina <= 1}
                onClick={() => applySearch({ pagina: search.pagina - 1 })}
                data-ocid="customers.pagination_prev"
                className="gap-1"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Anterior
              </Button>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Página {search.pagina} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={search.pagina >= totalPages}
                onClick={() => applySearch({ pagina: search.pagina + 1 })}
                data-ocid="customers.pagination_next"
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Plus className="size-3" aria-hidden="true" />
        Las motos se registran desde la ficha de cada cliente.
      </p>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
      />

      <ContactImportDialog
        open={importRows !== null}
        onOpenChange={(open) => {
          if (!open) closeImport();
        }}
        kind="customer"
        rows={importRows ?? []}
        result={importResult}
        isPending={contactImport.isPending}
        hasError={importFailed}
        onConfirm={confirmImport}
      />
    </div>
  );
}
