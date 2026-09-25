import { CsvTransfer } from "@/components/CsvTransfer";
import {
  INVENTORY_CSV_HEADERS,
  InventoryImportDialog,
} from "@/components/InventoryImportDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useBackend } from "@/hooks/use-backend";
import {
  useExportInventoryCsv,
  useZeroInventory,
} from "@/hooks/use-inventory-csv";
import { useRole } from "@/hooks/use-role";
import { formatMoney, formatNumber } from "@/lib/format";
import type {
  CsvRow,
  InventoryCsvRow,
  InventoryImportResult,
  InventoryImportRow,
  PartInput,
  PartView,
} from "@/lib/types";
import { PartSort } from "@/lib/types";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const SORT_LABELS: Record<PartSort, string> = {
  [PartSort.sku]: "SKU",
  [PartSort.name]: "Nombre",
  [PartSort.createdAt]: "Alta",
  [PartSort.stock]: "Existencia",
};

const SORT_OPTIONS: PartSort[] = [
  PartSort.sku,
  PartSort.name,
  PartSort.stock,
  PartSort.createdAt,
];

interface InventorySearch {
  q?: string;
  categoria?: string;
  marca?: string;
  bajo?: boolean;
  orden?: PartSort;
  dir?: "asc" | "desc";
  pagina?: number;
}

/** Normalizes the raw URL search params into a fully-resolved filter state. */
function resolveSearch(
  raw: Record<string, unknown>,
): Required<InventorySearch> {
  const orden = SORT_OPTIONS.includes(raw.orden as PartSort)
    ? (raw.orden as PartSort)
    : PartSort.sku;
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    categoria: typeof raw.categoria === "string" ? raw.categoria : "",
    marca: typeof raw.marca === "string" ? raw.marca : "",
    bajo: raw.bajo === true || raw.bajo === "true",
    orden,
    dir: raw.dir === "desc" ? "desc" : "asc",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1,
  };
}

/**
 * Builds a stable, serializable query key from the resolved filter state.
 *
 * React Query hashes the key structurally, so a freshly-built array with the
 * same values already dedupes; encoding it as one deterministic string makes
 * the identity explicit and guarantees that two renders with the same
 * filter/sort/page share a single cache entry and a single in-flight request.
 */
function partsQueryKey(search: Required<InventorySearch>): string {
  return [
    `q=${search.q}`,
    `categoria=${search.categoria}`,
    `marca=${search.marca}`,
    `bajo=${search.bajo ? 1 : 0}`,
    `orden=${search.orden}`,
    `dir=${search.dir}`,
    `pagina=${search.pagina}`,
  ].join("&");
}

function SortHeader({
  field,
  label,
  active,
  dir,
  align = "left",
  onSort,
}: {
  field: PartSort;
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  align?: "left" | "right";
  onSort: (field: PartSort) => void;
}) {
  return (
    <TableHead
      className={cn(align === "right" && "text-right")}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        data-ocid={`inventory.sort.${field}`}
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

function StockCell({ part }: { part: PartView }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {part.lowStock ? (
        <Badge
          variant="outline"
          data-ocid="inventory.low_stock_badge"
          className="gap-1 border-warning/50 bg-warning/15 font-mono text-[10px] uppercase tracking-wider text-warning"
        >
          <AlertTriangle className="size-3" aria-hidden="true" />
          Bajo
        </Badge>
      ) : null}
      <span className="data-rail text-sm font-medium">
        {formatNumber(part.totalStock)}
      </span>
      <span className="text-xs text-muted-foreground">{part.unit}</span>
    </div>
  );
}

interface PartFormState {
  sku: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  salePrice: string;
  costPrice: string;
  lowStockThreshold: string;
}

const EMPTY_FORM: PartFormState = {
  sku: "",
  name: "",
  category: "",
  brand: "",
  unit: "pza",
  salePrice: "",
  costPrice: "",
  lowStockThreshold: "0",
};

/** Backend money is integer cents; the form edits decimal amounts. */
function toCents(value: string): bigint {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(Math.round(parsed * 100));
}

function fromCents(value: bigint | undefined): string {
  if (value === undefined) return "";
  return (Number(value) / 100).toFixed(2);
}

function toWhole(value: string): bigint {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}

/** Decimal amount for a CSV cell, tolerating `1.234,56` and `1234.56`. */
function parseAmount(value: string | undefined): bigint {
  const raw = (value ?? "").trim();
  if (raw === "") return 0n;
  const normalized =
    raw.includes(",") && raw.lastIndexOf(",") > raw.lastIndexOf(".")
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(Math.round(parsed * 100));
}

/** One exported inventory row, keyed by the shared CSV headers. */
function partToCsvRow(part: PartView): CsvRow {
  return {
    sku: part.sku,
    nombre: part.name,
    categoria: part.category,
    marca: part.brand,
    unidad: part.unit,
    precio_venta: fromCents(part.salePrice),
    precio_costo: fromCents(part.costPrice),
    existencia: part.totalStock.toString(),
    umbral: part.lowStockThreshold.toString(),
  };
}

/**
 * Maps a backend export row onto the shared CSV headers. The backend row
 * carries the part's current stock quantity, so the `existencia` cell is
 * populated and an export/re-import round-trip preserves stock.
 */
function inventoryCsvRowToCsvRow(row: InventoryCsvRow): CsvRow {
  return {
    sku: row.sku,
    nombre: row.name,
    categoria: row.category,
    marca: row.brand,
    unidad: row.unit,
    precio_venta: fromCents(row.salePrice),
    precio_costo: fromCents(row.costPrice),
    existencia: row.quantity.toString(),
    umbral: row.lowStockThreshold.toString(),
  };
}

/**
 * Maps a parsed spreadsheet row onto the backend import shape. `rowNumber` is
 * the 1-based position in the file so the result summary can point back at it.
 * The `existencia` cell becomes the row's stock quantity; a blank or invalid
 * cell yields zero.
 */
function csvRowToImportRow(row: CsvRow, index: number): InventoryImportRow {
  return {
    rowNumber: BigInt(index + 1),
    sku: (row.sku ?? "").trim(),
    name: (row.nombre ?? "").trim(),
    category: (row.categoria ?? "").trim(),
    brand: (row.marca ?? "").trim(),
    unit: (row.unidad ?? "").trim() || "pza",
    salePrice: parseAmount(row.precio_venta),
    costPrice: parseAmount(row.precio_costo),
    quantity: toWhole(row.existencia ?? ""),
    lowStockThreshold: toWhole(row.umbral ?? ""),
  };
}

function PartFormDialog({
  open,
  onOpenChange,
  part,
  isAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartView | null;
  isAdmin: boolean;
}) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PartFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      part
        ? {
            sku: part.sku,
            name: part.name,
            category: part.category,
            brand: part.brand,
            unit: part.unit,
            salePrice: fromCents(part.salePrice),
            costPrice: fromCents(part.costPrice),
            lowStockThreshold: part.lowStockThreshold.toString(),
          }
        : EMPTY_FORM,
    );
  }, [open, part]);

  const mutation = useMutation({
    mutationFn: async (input: PartInput) => {
      if (!actor) throw new Error("Backend no disponible");
      return part ? actor.updatePart(part.id, input) : actor.createPart(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      toast.success(part ? "Repuesto actualizado" : "Repuesto registrado");
      onOpenChange(false);
    },
    onError: () => {
      setError("No se pudo guardar el repuesto. Intenta de nuevo.");
    },
  });

  const update = (field: keyof PartFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("El SKU y el nombre son obligatorios.");
      return;
    }
    setError(null);
    mutation.mutate({
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      unit: form.unit.trim() || "pza",
      salePrice: toCents(form.salePrice),
      costPrice: toCents(form.costPrice),
      lowStockThreshold: toWhole(form.lowStockThreshold),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="inventory.part_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {part ? "Editar repuesto" : "Nuevo repuesto"}
          </DialogTitle>
          <DialogDescription>
            {part
              ? "Actualiza los datos del catálogo. Los cambios aplican de inmediato."
              : "Registra un repuesto en el catálogo del taller."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="part-sku">SKU / Código</Label>
              <Input
                id="part-sku"
                value={form.sku}
                onChange={(event) => update("sku", event.target.value)}
                placeholder="REP-0001"
                className="data-rail"
                data-ocid="inventory.sku_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-name">Nombre</Label>
              <Input
                id="part-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Balata de freno delantera"
                data-ocid="inventory.name_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-category">Categoría</Label>
              <Input
                id="part-category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                placeholder="Frenos"
                data-ocid="inventory.category_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-brand">Marca</Label>
              <Input
                id="part-brand"
                value={form.brand}
                onChange={(event) => update("brand", event.target.value)}
                placeholder="Brembo"
                data-ocid="inventory.brand_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-unit">Unidad</Label>
              <Input
                id="part-unit"
                value={form.unit}
                onChange={(event) => update("unit", event.target.value)}
                placeholder="pza"
                data-ocid="inventory.unit_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-threshold">Umbral de stock bajo</Label>
              <Input
                id="part-threshold"
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={(event) =>
                  update("lowStockThreshold", event.target.value)
                }
                className="data-rail"
                data-ocid="inventory.threshold_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="part-sale">Precio de venta (COP)</Label>
              <Input
                id="part-sale"
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(event) => update("salePrice", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="inventory.sale_price_input"
              />
            </div>
            {isAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="part-cost">Precio de costo (COP)</Label>
                <Input
                  id="part-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) => update("costPrice", event.target.value)}
                  placeholder="0.00"
                  className="data-rail"
                  data-ocid="inventory.cost_price_input"
                />
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              data-ocid="inventory.form_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="inventory.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              data-ocid="inventory.submit_button"
            >
              {mutation.isPending
                ? "Guardando…"
                : part
                  ? "Guardar cambios"
                  : "Registrar repuesto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ZeroInventoryDialog({
  open,
  onOpenChange,
  onZeroed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onZeroed: (affected: bigint) => void;
}) {
  const zeroInventory = useZeroInventory();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);

  const handleConfirm = () => {
    setError(null);
    zeroInventory.mutate(undefined, {
      onSuccess: (result) => {
        onZeroed(result.affected);
        toast.success(
          result.affected === 1n
            ? "Se puso en ceros 1 repuesto."
            : `Se pusieron en ceros ${result.affected.toString()} repuestos.`,
        );
        onOpenChange(false);
      },
      onError: () => {
        setError("No se pudo poner el inventario en ceros. Intenta de nuevo.");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="inventory.zero_dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Poner inventario en ceros
          </DialogTitle>
          <DialogDescription>
            Esta acción establece en cero la existencia de todos los repuestos
            del catálogo. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-destructive">
            Se perderán las existencias actuales de todos los repuestos. Esta
            operación es irreversible.
          </p>
        </div>

        {error ? (
          <p
            data-ocid="inventory.zero_error"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={zeroInventory.isPending}
            data-ocid="inventory.zero_cancel_button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={zeroInventory.isPending}
            data-ocid="inventory.zero_confirm_button"
            className="gap-2"
          >
            {zeroInventory.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {zeroInventory.isPending ? "Procesando…" : "Poner en ceros"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InventoryPage() {
  const { actor, isFetching } = useBackend();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const search = useMemo(() => resolveSearch(rawSearch), [rawSearch]);

  const [term, setTerm] = useState(search.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [zeroDialogOpen, setZeroDialogOpen] = useState(false);
  const [zeroedCount, setZeroedCount] = useState<bigint | null>(null);
  const [editing, setEditing] = useState<PartView | null>(null);
  const [importRows, setImportRows] = useState<InventoryImportRow[] | null>(
    null,
  );
  const [importResult, setImportResult] =
    useState<InventoryImportResult | null>(null);
  const [importFailed, setImportFailed] = useState(false);

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(search.q);
  }, [search.q]);

  const applySearch = useCallback(
    (patch: Partial<InventorySearch>) => {
      void navigate({
        to: "/inventario",
        search: (prev: Record<string, unknown>) => {
          const next: Record<string, unknown> = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === undefined || value === false) {
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

  // One page at a time, resolved entirely in the backend: the offset is derived
  // from the URL page and the backend returns the page plus the filtered total.
  // The sort direction is resolved in the backend through `listPartsDir`, so
  // descending returns the true top-N of the whole catalog rather than a
  // reversed slice of the ascending page. The stable string key means a
  // filter/sort/page change produces exactly one new cache entry and one
  // request, and React Query cancels the obsolete in-flight request.
  const partsQuery = useQuery({
    queryKey: ["parts", partsQueryKey(search)],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listPartsDir(
        {
          search: search.q || undefined,
          category: search.categoria || undefined,
          brand: search.marca || undefined,
          lowStockOnly: search.bajo || undefined,
        },
        search.orden,
        search.dir === "desc",
        BigInt((search.pagina - 1) * PAGE_SIZE),
        BigInt(PAGE_SIZE),
      );
    },
    enabled: !!actor && !isFetching,
  });

  // The backend computes the distinct category and brand values in one call,
  // so the option lists no longer require reading a broad page of the catalog.
  const facetsQuery = useQuery({
    queryKey: ["parts", "facets"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listPartFacets();
    },
    enabled: !!actor && !isFetching,
    // The facet lists only change when the catalog changes, so they are kept
    // for the session and refreshed by the part mutations' invalidation.
    staleTime: Number.POSITIVE_INFINITY,
  });

  // Radix SelectItem rejects an empty `value`, so blank facet values are
  // dropped before rendering the option lists.
  const categories = useMemo(
    () =>
      [...(facetsQuery.data?.categories ?? [])]
        .filter((value) => value.trim() !== "")
        .sort((a, b) => a.localeCompare(b, "es")),
    [facetsQuery.data],
  );

  const brands = useMemo(
    () =>
      [...(facetsQuery.data?.brands ?? [])]
        .filter((value) => value.trim() !== "")
        .sort((a, b) => a.localeCompare(b, "es")),
    [facetsQuery.data],
  );

  // The backend resolves the sort direction, so the page arrives already in the
  // requested order and is rendered as-is (no client-side reversal).
  const items = partsQuery.data?.items ?? [];
  const total = Number(partsQuery.data?.total ?? 0n);
  const loadedCount = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters =
    search.q !== "" ||
    search.categoria !== "" ||
    search.marca !== "" ||
    search.bajo;

  const handleSort = (field: PartSort) => {
    if (search.orden === field) {
      applySearch({ dir: search.dir === "asc" ? "desc" : "asc", pagina: 1 });
    } else {
      applySearch({ orden: field, dir: "asc", pagina: 1 });
    }
  };

  const clearFilters = () => {
    setTerm("");
    void navigate({ to: "/inventario", search: {}, replace: true });
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (part: PartView) => {
    setEditing(part);
    setDialogOpen(true);
  };

  const exportRows = useMemo(() => items.map(partToCsvRow), [items]);

  const exportInventory = useExportInventoryCsv();

  // Export the complete inventory from the backend rather than only the pages
  // loaded into the infinite query, so the workbook never silently omits rows.
  const handleExport = async () => {
    try {
      const rows = await exportInventory.mutateAsync();
      await downloadXlsx(
        "inventario",
        "Inventario",
        INVENTORY_CSV_HEADERS,
        rows.map(inventoryCsvRowToCsvRow),
      );
    } catch {
      toast.error("No se pudo exportar el inventario. Intenta de nuevo.");
    }
  };

  const handleImport = (rows: CsvRow[]) => {
    if (rows.length === 0) {
      toast.error("El archivo no contiene filas válidas.");
      return;
    }
    setImportResult(null);
    setImportFailed(false);
    setImportRows(rows.map(csvRowToImportRow));
  };

  const confirmImport = async () => {
    if (!actor || !importRows) return;
    const payload = importRows.filter((row) => row.sku !== "");
    if (payload.length === 0) {
      toast.error("Ninguna fila tiene SKU. Corrige el archivo y reintenta.");
      return;
    }
    setImportFailed(false);
    try {
      const result = await actor.importInventoryCsv(payload);
      setImportResult(result);
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      void queryClient.invalidateQueries({
        queryKey: ["inventory-valuation"],
      });
      toast.success(
        `${result.created.toString()} creados · ${result.updated.toString()} actualizados · ${result.failed.toString()} con error`,
      );
    } catch {
      setImportFailed(true);
      toast.error("No se pudo completar la importación.");
    }
  };

  const closeImport = () => {
    setImportRows(null);
    setImportResult(null);
    setImportFailed(false);
  };

  return (
    <div
      data-ocid="inventory.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Almacén
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Inventario de repuestos
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Catálogo con existencias por lote, precios y alertas de stock bajo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CsvTransfer
            headers={INVENTORY_CSV_HEADERS}
            rows={exportRows}
            onImport={handleImport}
            onExport={handleExport}
            isExporting={exportInventory.isPending}
            filename="inventario"
            sheetName="Inventario"
            ocid="inventory.csv"
            disabled={importRows !== null}
          />
          {isAdmin ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setZeroDialogOpen(true)}
              data-ocid="inventory.zero_button"
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Eraser className="size-4" aria-hidden="true" />
              Poner inventario en ceros
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={openCreate}
            data-ocid="inventory.new_part_button"
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo repuesto
          </Button>
        </div>
      </header>

      {zeroedCount !== null ? (
        <output
          data-ocid="inventory.zero_success"
          aria-live="polite"
          className="flex items-start justify-between gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Inventario puesto en ceros
              </p>
              <p className="text-sm text-muted-foreground">
                {zeroedCount === 1n
                  ? "Se puso en ceros 1 repuesto."
                  : `Se pusieron en ceros ${zeroedCount.toString()} repuestos.`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZeroedCount(null)}
            aria-label="Cerrar aviso"
            data-ocid="inventory.zero_success_close_button"
            className="shrink-0 text-muted-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </output>
      ) : null}

      <section
        data-ocid="inventory.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por nombre o SKU…"
              aria-label="Buscar repuestos"
              className="pl-9"
              data-ocid="inventory.search_input"
            />
          </div>

          <Select
            value={search.categoria || "all"}
            onValueChange={(value) =>
              applySearch({
                categoria: value === "all" ? "" : value,
                pagina: 1,
              })
            }
          >
            <SelectTrigger
              className="w-[170px]"
              aria-label="Filtrar por categoría"
              data-ocid="inventory.category_select"
            >
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={search.marca || "all"}
            onValueChange={(value) =>
              applySearch({ marca: value === "all" ? "" : value, pagina: 1 })
            }
          >
            <SelectTrigger
              className="w-[160px]"
              aria-label="Filtrar por marca"
              data-ocid="inventory.brand_select"
            >
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={search.bajo ? "default" : "outline"}
            onClick={() => applySearch({ bajo: !search.bajo, pagina: 1 })}
            aria-pressed={search.bajo}
            data-ocid="inventory.low_stock_toggle"
            className="gap-2"
          >
            <AlertTriangle className="size-4" aria-hidden="true" />
            Solo stock bajo
          </Button>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="inventory.clear_filters_button"
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
            {partsQuery.isLoading
              ? "Cargando…"
              : `${formatNumber(total)} repuesto${total === 1 ? "" : "s"}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
              Orden
            </span>
            <Select
              value={search.orden}
              onValueChange={(value) =>
                applySearch({ orden: value as PartSort, pagina: 1 })
              }
            >
              <SelectTrigger
                size="sm"
                className="w-[150px]"
                aria-label="Ordenar por"
                data-ocid="inventory.sort_select"
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
          </div>
        </div>

        {partsQuery.isError ? (
          <div
            data-ocid="inventory.error_state"
            className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el inventario.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void partsQuery.refetch({ cancelRefetch: true })}
              data-ocid="inventory.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : partsQuery.isLoading ? (
          <div data-ocid="inventory.loading_state" className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, index) => `row-${index}`).map(
              (id) => (
                <Skeleton key={id} className="h-9 w-full" />
              ),
            )}
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="inventory.empty_state"
            className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <Boxes
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {hasFilters
                  ? "Sin resultados"
                  : "Aún no hay repuestos registrados"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {hasFilters
                  ? "Ajusta la búsqueda o los filtros para encontrar repuestos."
                  : "Registra el primer repuesto para comenzar a controlar existencias."}
              </p>
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                data-ocid="inventory.empty_clear_button"
              >
                Limpiar filtros
              </Button>
            ) : (
              <Button
                type="button"
                onClick={openCreate}
                data-ocid="inventory.empty_new_button"
                className="gap-2"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nuevo repuesto
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <SortHeader
                  field={PartSort.sku}
                  label="SKU"
                  active={search.orden === PartSort.sku}
                  dir={search.dir}
                  onSort={handleSort}
                />
                <SortHeader
                  field={PartSort.name}
                  label="Nombre"
                  active={search.orden === PartSort.name}
                  dir={search.dir}
                  onSort={handleSort}
                />
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Categoría
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Marca
                </TableHead>
                <SortHeader
                  field={PartSort.stock}
                  label="Existencia"
                  active={search.orden === PartSort.stock}
                  dir={search.dir}
                  align="right"
                  onSort={handleSort}
                />
                <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  P. venta
                </TableHead>
                {isAdmin ? (
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    P. costo
                  </TableHead>
                ) : null}
                <TableHead className="w-12 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((part, index) => (
                <TableRow
                  key={part.id.toString()}
                  data-ocid={`inventory.row.${index + 1}`}
                  className={cn(part.lowStock && "bg-warning/[0.04]")}
                >
                  <TableCell>
                    <Link
                      to="/inventario/$id"
                      params={{ id: part.id.toString() }}
                      data-ocid={`inventory.link.${index + 1}`}
                      className="data-rail text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {part.sku}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <span className="block truncate font-medium">
                      {part.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {part.category || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {part.brand || "—"}
                  </TableCell>
                  <TableCell>
                    <StockCell part={part} />
                  </TableCell>
                  <TableCell className="data-rail text-right">
                    {formatMoney(part.salePrice)}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="data-rail text-right text-muted-foreground">
                      {formatMoney(part.costPrice)}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(part)}
                      aria-label={`Editar ${part.name}`}
                      data-ocid={`inventory.edit_button.${index + 1}`}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!partsQuery.isLoading && !partsQuery.isError && total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Mostrando {formatNumber(loadedCount)} de {formatNumber(total)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={search.pagina <= 1}
                onClick={() => applySearch({ pagina: search.pagina - 1 })}
                data-ocid="inventory.pagination_prev"
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
                data-ocid="inventory.pagination_next"
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <PartFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        part={editing}
        isAdmin={isAdmin}
      />

      <ZeroInventoryDialog
        open={zeroDialogOpen}
        onOpenChange={setZeroDialogOpen}
        onZeroed={setZeroedCount}
      />

      <InventoryImportDialog
        open={importRows !== null}
        onOpenChange={(open) => {
          if (!open) closeImport();
        }}
        rows={importRows ?? []}
        result={importResult}
        isPending={false}
        hasError={importFailed}
        onConfirm={() => void confirmImport()}
      />
    </div>
  );
}
