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
import { useMotorcyclesPage } from "@/hooks/use-customers";
import { formatNumber } from "@/lib/format";
import type { MotorcycleListItem } from "@/lib/types";
import { MotorcycleSort } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bike,
  ChevronLeft,
  ChevronRight,
  Phone,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Rows requested per page by the paginated motorcycles listing. */
const PAGE_SIZE = 50;

const SORT_LABELS: Record<MotorcycleSort, string> = {
  [MotorcycleSort.plate]: "Placa",
  [MotorcycleSort.brand]: "Marca",
  [MotorcycleSort.year]: "Año",
  [MotorcycleSort.customerName]: "Cliente",
};

const SORT_OPTIONS: MotorcycleSort[] = [
  MotorcycleSort.plate,
  MotorcycleSort.brand,
  MotorcycleSort.year,
  MotorcycleSort.customerName,
];

type SortDir = "asc" | "desc";

interface MotorcyclesSearch {
  q?: string;
  marca?: string;
  orden?: MotorcycleSort;
  dir?: SortDir;
  pagina?: number;
}

/** Normalizes the raw URL search params into a fully-resolved listing state. */
function resolveSearch(
  raw: Record<string, unknown>,
): Required<MotorcyclesSearch> {
  const orden = SORT_OPTIONS.includes(raw.orden as MotorcycleSort)
    ? (raw.orden as MotorcycleSort)
    : MotorcycleSort.plate;
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    marca: typeof raw.marca === "string" ? raw.marca : "",
    orden,
    dir: raw.dir === "desc" ? "desc" : "asc",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1,
  };
}

const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, i) => `motorcycle-skeleton-${i}`,
);

function MotorcycleTableSkeleton() {
  return (
    <div data-ocid="motorcycles.loading_state" className="space-y-2 p-4">
      {SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-11 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div
      data-ocid="motorcycles.empty_state"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
        <Bike className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-display text-sm font-semibold">
          {hasFilters ? "Sin resultados" : "Aún no hay motos registradas"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasFilters
            ? "Ninguna moto coincide con la búsqueda o los filtros. Ajusta los criterios e intenta de nuevo."
            : "Registra motos desde la ficha de cada cliente para verlas aquí."}
        </p>
      </div>
    </div>
  );
}

interface SortHeaderProps {
  field: MotorcycleSort;
  label: string;
  active: boolean;
  dir: SortDir;
  align?: "left" | "right";
  onSort: (field: MotorcycleSort) => void;
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
        data-ocid={`motorcycles.sort.${field}`}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-primary" : "text-muted-foreground",
          align === "right" && "flex-row-reverse",
        )}
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

export function MotorcyclesPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const search = useMemo(() => resolveSearch(rawSearch), [rawSearch]);

  const [term, setTerm] = useState(search.q);

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(search.q);
  }, [search.q]);

  const applySearch = useCallback(
    (patch: Partial<MotorcyclesSearch>) => {
      void navigate({
        to: "/motos",
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

  // One page at a time, resolved in the backend: the offset is derived from the
  // URL page and `listMotorcyclesPageDir` returns the page plus the filtered
  // total with each motorcycle's owner name and phone already included, so the
  // listing never fans out one request per motorcycle. The sort direction is
  // resolved in the backend through the `descending` flag, so descending shows
  // the true top-N of the whole listing rather than a reversed slice. The hook
  // builds a stable string query key (direction included), so a filter/sort/
  // page change produces exactly one new cache entry and one request, and React
  // Query cancels the obsolete in-flight request. No polling or refetch
  // interval is configured.
  const offset = (search.pagina - 1) * PAGE_SIZE;
  const { data, isLoading, isError, refetch } = useMotorcyclesPage(
    {
      search: search.q || undefined,
      brand: search.marca || undefined,
    },
    search.orden,
    search.dir,
    offset,
    PAGE_SIZE,
  );

  // Rows arrive already ordered by the backend in the requested direction.
  const items = data?.items ?? [];

  const total = Number(data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search.q.trim() !== "" || search.marca.trim() !== "";

  const handleSort = useCallback(
    (field: MotorcycleSort) => {
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

  const clearFilters = useCallback(() => {
    setTerm("");
    void navigate({ to: "/motos", search: {}, replace: true });
  }, [navigate]);

  return (
    <div
      data-ocid="motorcycles.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Taller
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Motocicletas
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Listado paginado de motos con el cliente propietario incluido en la
            misma respuesta. Busca por placa, marca, modelo o cliente.
          </p>
        </div>
        <Badge
          variant="outline"
          data-ocid="motorcycles.count_badge"
          className="data-rail border-border bg-background text-muted-foreground"
        >
          {isLoading ? "…" : `${formatNumber(total)} motos`}
        </Badge>
      </header>

      <section
        data-ocid="motorcycles.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por placa, marca, modelo o cliente…"
              aria-label="Buscar motocicletas"
              className="pl-9"
              data-ocid="motorcycles.search_input"
            />
          </div>

          <div className="relative w-[180px]">
            <Input
              value={search.marca}
              onChange={(event) =>
                applySearch({ marca: event.target.value, pagina: 1 })
              }
              placeholder="Marca"
              aria-label="Filtrar por marca"
              data-ocid="motorcycles.brand_input"
            />
          </div>

          <Select
            value={search.orden}
            onValueChange={(value) =>
              applySearch({ orden: value as MotorcycleSort, pagina: 1 })
            }
          >
            <SelectTrigger
              size="sm"
              className="w-[170px]"
              aria-label="Ordenar por"
              data-ocid="motorcycles.sort_select"
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
            data-ocid="motorcycles.sort_dir_button"
            className="gap-1.5"
          >
            {search.dir === "asc" ? (
              <ArrowUp className="size-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="size-4" aria-hidden="true" />
            )}
            {search.dir === "asc" ? "Asc" : "Desc"}
          </Button>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              data-ocid="motorcycles.clear_filters_button"
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        {isLoading ? (
          <MotorcycleTableSkeleton />
        ) : isError ? (
          <div
            data-ocid="motorcycles.error_state"
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
                No se pudo cargar el listado de motos
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Revisa tu conexión e inténtalo de nuevo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch({ cancelRefetch: true })}
              data-ocid="motorcycles.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <Table data-ocid="motorcycles.table">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <SortHeader
                  field={MotorcycleSort.plate}
                  label="Placa"
                  active={search.orden === MotorcycleSort.plate}
                  dir={search.dir}
                  onSort={handleSort}
                />
                <SortHeader
                  field={MotorcycleSort.brand}
                  label="Marca"
                  active={search.orden === MotorcycleSort.brand}
                  dir={search.dir}
                  onSort={handleSort}
                />
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Modelo
                </TableHead>
                <SortHeader
                  field={MotorcycleSort.year}
                  label="Año"
                  active={search.orden === MotorcycleSort.year}
                  dir={search.dir}
                  align="right"
                  onSort={handleSort}
                />
                <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Kilometraje
                </TableHead>
                <SortHeader
                  field={MotorcycleSort.customerName}
                  label="Cliente"
                  active={search.orden === MotorcycleSort.customerName}
                  dir={search.dir}
                  onSort={handleSort}
                />
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Teléfono
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((moto: MotorcycleListItem, index: number) => (
                <TableRow
                  key={moto.id.toString()}
                  data-ocid={`motorcycles.row.${index + 1}`}
                >
                  <TableCell className="data-rail font-medium">
                    {moto.plate}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {moto.brand || "—"}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate">
                    {moto.model || "—"}
                  </TableCell>
                  <TableCell className="data-rail text-right text-muted-foreground">
                    {moto.year > 0n ? moto.year.toString() : "—"}
                  </TableCell>
                  <TableCell className="data-rail text-right text-muted-foreground">
                    {formatNumber(moto.mileage)} km
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/clientes/$id"
                      params={{ id: moto.customerId.toString() }}
                      data-ocid={`motorcycles.customer_link.${index + 1}`}
                      className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {moto.customerName || "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="data-rail text-muted-foreground">
                    {moto.customerPhone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="size-3.5" aria-hidden="true" />
                        {moto.customerPhone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!isLoading && !isError && total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Mostrando {formatNumber(items.length)} de {formatNumber(total)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={search.pagina <= 1}
                onClick={() => applySearch({ pagina: search.pagina - 1 })}
                data-ocid="motorcycles.pagination_prev"
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
                data-ocid="motorcycles.pagination_next"
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
