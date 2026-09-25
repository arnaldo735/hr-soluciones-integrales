import type { ServiceCategoryUsage } from "@/backend";
import { CsvTransfer } from "@/components/CsvTransfer";
import { DataTable } from "@/components/DataTable";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { PageHeader } from "@/components/PageHeader";
import { ServiceCategoryDialog } from "@/components/ServiceCategoryDialog";
import { StatusBadge } from "@/components/StatusBadge";
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
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "@/hooks/use-backend";
import { useCustomers } from "@/hooks/use-customers";
import { useRole } from "@/hooks/use-role";
import { useServiceCategories } from "@/hooks/use-service-categories";
import {
  ServiceSort,
  useCreateService,
  useDeleteService,
  useServices,
  useUpdateService,
  useZeroServices,
} from "@/hooks/use-services";
import { formatMoney, formatNumber } from "@/lib/format";
import type {
  CsvRow,
  DataColumn,
  Id,
  RowAction,
  Service,
  ServiceInput,
} from "@/lib/types";
import { NotificationSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Eraser,
  FolderTree,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 100;

const SORT_LABELS: Record<ServiceSort, string> = {
  [ServiceSort.code]: "Código",
  [ServiceSort.name]: "Nombre",
  [ServiceSort.category]: "Categoría",
  [ServiceSort.laborRate]: "Tarifa",
};

const SORT_OPTIONS: ServiceSort[] = [
  ServiceSort.code,
  ServiceSort.name,
  ServiceSort.category,
  ServiceSort.laborRate,
];

const CSV_HEADERS = [
  "codigo",
  "nombre",
  "descripcion",
  "categoria",
  "tarifa",
  "duracion_min",
  "activo",
];

const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, index) => `service-skeleton-${index}`,
);

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

function toMinutes(value: string): bigint {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}

function parseActive(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return !["0", "false", "no", "inactivo", "inactiva"].includes(normalized);
}

interface ServiceFormState {
  code: string;
  name: string;
  description: string;
  category: string;
  laborRate: string;
  estimatedMinutes: string;
  active: boolean;
}

const EMPTY_FORM: ServiceFormState = {
  code: "",
  name: "",
  description: "",
  category: "",
  laborRate: "",
  estimatedMinutes: "60",
  active: true,
};

function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  categories: ServiceCategoryUsage[];
}) {
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      service
        ? {
            code: service.code,
            name: service.name,
            description: service.description,
            category: service.category,
            laborRate: fromCents(service.laborRate),
            estimatedMinutes: service.estimatedMinutes.toString(),
            active: service.active,
          }
        : EMPTY_FORM,
    );
  }, [open, service]);

  // A service may still carry a category that is no longer in the catalog
  // (legacy free-text value). Keep it selectable so editing never silently
  // drops the current category.
  const categoryOptions = useMemo(() => {
    const names = categories.map((usage) => usage.category.name);
    if (form.category && !names.includes(form.category)) {
      return [form.category, ...names];
    }
    return names;
  }, [categories, form.category]);

  const isPending = createService.isPending || updateService.isPending;

  const update = (field: keyof ServiceFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError("El código y el nombre son obligatorios.");
      return;
    }
    setError(null);
    const input: ServiceInput = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      laborRate: toCents(form.laborRate),
      estimatedMinutes: toMinutes(form.estimatedMinutes),
      active: form.active,
    };
    const onError = () =>
      setError("No se pudo guardar el servicio. Intenta de nuevo.");
    if (service) {
      updateService.mutate(
        { id: service.id, input },
        {
          onSuccess: () => {
            toast.success("Servicio actualizado");
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      createService.mutate(input, {
        onSuccess: () => {
          toast.success("Servicio registrado");
          onOpenChange(false);
        },
        onError,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="services.form_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {service ? "Editar servicio" : "Nuevo servicio"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Actualiza la tarifa de mano de obra y la duración estimada."
              : "Registra un servicio para usarlo como línea de mano de obra en órdenes, cotizaciones y POS."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="service-code">Código</Label>
              <Input
                id="service-code"
                value={form.code}
                onChange={(event) => update("code", event.target.value)}
                placeholder="SRV-0001"
                className="data-rail"
                data-ocid="services.code_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-name">Nombre</Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Cambio de aceite y filtro"
                data-ocid="services.name_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-category">Categoría</Label>
              <Select
                value={form.category || "none"}
                onValueChange={(value) =>
                  update("category", value === "none" ? "" : value)
                }
              >
                <SelectTrigger
                  id="service-category"
                  data-ocid="services.category_select"
                  aria-label="Categoría del servicio"
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categoryOptions.map((name) => {
                    const usage = categories.find(
                      (item) => item.category.name === name,
                    );
                    return (
                      <SelectItem key={name} value={name}>
                        {usage
                          ? `${name} · ${formatNumber(usage.serviceCount)}`
                          : name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-rate">Tarifa de mano de obra (COP)</Label>
              <Input
                id="service-rate"
                type="number"
                min="0"
                step="0.01"
                value={form.laborRate}
                onChange={(event) => update("laborRate", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="services.labor_rate_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-duration">Duración estimada (min)</Label>
              <Input
                id="service-duration"
                type="number"
                min="0"
                step="5"
                value={form.estimatedMinutes}
                onChange={(event) =>
                  update("estimatedMinutes", event.target.value)
                }
                className="data-rail"
                data-ocid="services.duration_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-active">Estado</Label>
              <Select
                value={form.active ? "active" : "inactive"}
                onValueChange={(value) => update("active", value === "active")}
              >
                <SelectTrigger
                  id="service-active"
                  data-ocid="services.active_select"
                  aria-label="Estado del servicio"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-description">Descripción</Label>
            <Textarea
              id="service-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Incluye revisión de niveles, cambio de aceite y filtro."
              rows={3}
              data-ocid="services.description_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="services.form_error"
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
              data-ocid="services.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="services.submit_button"
            >
              {isPending
                ? "Guardando…"
                : service
                  ? "Guardar cambios"
                  : "Registrar servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ImportSummary {
  imported: number;
  skipped: number;
  errors: string[];
}

const IMPORT_CODE_HELP_ID = "services-import-code-help";

/** Editable preview columns; the code is intentionally excluded (locked). */
const IMPORT_EDIT_FIELDS: Array<{
  key: string;
  label: string;
  type: "text" | "number";
  align?: "right";
}> = [
  { key: "nombre", label: "Nombre", type: "text" },
  { key: "descripcion", label: "Descripción", type: "text" },
  { key: "categoria", label: "Categoría", type: "text" },
  { key: "tarifa", label: "Tarifa", type: "number", align: "right" },
  { key: "duracion_min", label: "Min", type: "number", align: "right" },
];

function ImportPreviewDialog({
  open,
  onOpenChange,
  rows,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: CsvRow[];
  onConfirm: (rows: CsvRow[]) => void;
  isPending: boolean;
}) {
  // The preview owns an editable draft so the user can correct any field
  // except the code before confirming the bulk import.
  const [draft, setDraft] = useState<CsvRow[]>([]);
  // Stable per-row identity generated once when the dialog opens. It must not
  // depend on editable content: a content-derived key would change while the
  // user types and remount the row, dropping the in-progress edit.
  const [rowIds, setRowIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(rows.map((row) => ({ ...row })));
    setRowIds(rows.map((_, index) => `import-row-${index}`));
  }, [open, rows]);

  const updateCell = (index: number, field: string, value: string) => {
    setDraft((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const valid = draft.filter((row) => row.codigo?.trim() && row.nombre?.trim());
  const invalid = draft.length - valid.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="services.import_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-5xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Vista previa de importación
          </DialogTitle>
          <DialogDescription>
            Revisa y ajusta los datos antes de confirmar. Puedes editar
            cualquier campo excepto el código. Las filas sin código o sin nombre
            se omiten.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-status badge-accepted">
            {valid.length} listas
          </span>
          {invalid > 0 ? (
            <span className="badge-status badge-rejected">
              {invalid} con errores
            </span>
          ) : null}
          <p
            id={IMPORT_CODE_HELP_ID}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Lock className="size-3.5" aria-hidden="true" />
            El código no se puede modificar; se conserva tal como viene en el
            archivo.
          </p>
        </div>

        <div className="scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Código
                </th>
                {IMPORT_EDIT_FIELDS.map((field) => (
                  <th
                    key={field.key}
                    className={cn(
                      "px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
                      field.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Activo
                </th>
              </tr>
            </thead>
            <tbody>
              {draft.map((row, index) => {
                const rowValid = !!row.codigo?.trim() && !!row.nombre?.trim();
                return (
                  <tr
                    key={rowIds[index] ?? `import-row-${index}`}
                    data-ocid={`services.import_row.${index + 1}`}
                    className={cn(
                      "border-b border-border/60 last:border-0",
                      !rowValid && "bg-destructive/[0.06]",
                    )}
                  >
                    <td className="px-3 py-2">
                      <div className="relative">
                        <Input
                          value={row.codigo ?? ""}
                          readOnly
                          aria-readonly="true"
                          aria-describedby={IMPORT_CODE_HELP_ID}
                          aria-label={`Código de la fila ${index + 1} (no editable)`}
                          className="h-8 cursor-not-allowed bg-muted pr-8 font-mono text-xs text-muted-foreground"
                          data-ocid={`services.import_code.${index + 1}`}
                        />
                        <Lock
                          className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                    </td>
                    {IMPORT_EDIT_FIELDS.map((field) => (
                      <td key={field.key} className="px-3 py-2">
                        <Input
                          type={field.type}
                          min={field.type === "number" ? "0" : undefined}
                          step={field.key === "tarifa" ? "0.01" : undefined}
                          value={row[field.key] ?? ""}
                          onChange={(event) =>
                            updateCell(index, field.key, event.target.value)
                          }
                          aria-label={`${field.label} de la fila ${index + 1}`}
                          className={cn(
                            "h-8 text-sm",
                            field.align === "right" && "text-right",
                            (field.key === "tarifa" ||
                              field.key === "duracion_min") &&
                              "data-rail",
                          )}
                          data-ocid={`services.import_${field.key}.${index + 1}`}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <Select
                        value={parseActive(row.activo ?? "1") ? "1" : "0"}
                        onValueChange={(value) =>
                          updateCell(index, "activo", value)
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Estado de la fila ${index + 1}`}
                          data-ocid={`services.import_activo.${index + 1}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Activo</SelectItem>
                          <SelectItem value="0">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="services.import_cancel_button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isPending || valid.length === 0}
            onClick={() => onConfirm(draft)}
            data-ocid="services.import_confirm_button"
          >
            {isPending
              ? "Importando…"
              : `Importar ${valid.length} servicio${valid.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ZeroServicesDialog({
  open,
  onOpenChange,
  onZeroed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onZeroed: (deleted: bigint) => void;
}) {
  const zeroServices = useZeroServices();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);

  const handleConfirm = () => {
    setError(null);
    zeroServices.mutate(undefined, {
      onSuccess: (result) => {
        onZeroed(result.deleted);
        toast.success(
          result.deleted === 1n
            ? "Se eliminó 1 servicio del catálogo."
            : `Se eliminaron ${result.deleted.toString()} servicios del catálogo.`,
        );
        onOpenChange(false);
      },
      onError: () => {
        setError(
          "No se pudieron poner los servicios en cero. Intenta de nuevo.",
        );
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="services.zero_dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Poner servicios en cero
          </DialogTitle>
          <DialogDescription>
            Esta acción elimina todos los servicios del catálogo de taller. No
            se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-destructive">
            Se eliminarán todos los servicios registrados. Esta operación es
            irreversible.
          </p>
        </div>

        {error ? (
          <p
            data-ocid="services.zero_error"
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
            disabled={zeroServices.isPending}
            data-ocid="services.zero_cancel_button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={zeroServices.isPending}
            data-ocid="services.zero_confirm_button"
            className="gap-2"
          >
            {zeroServices.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {zeroServices.isPending ? "Procesando…" : "Poner en cero"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ServicesPage() {
  const { actor } = useBackend();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";

  const [term, setTerm] = useState(urlTerm);
  const [debouncedTerm, setDebouncedTerm] = useState(urlTerm);
  const [category, setCategory] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState<ServiceSort>(ServiceSort.code);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [zeroDialogOpen, setZeroDialogOpen] = useState(false);
  const [zeroedCount, setZeroedCount] = useState<bigint | null>(null);
  const [importRows, setImportRows] = useState<CsvRow[] | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<{
    customerId: Id;
    customerName: string;
    customerEmail: string | null;
  } | null>(null);

  const deleteService = useDeleteService();
  const customersQuery = useCustomers("");
  const customers = customersQuery.data ?? [];

  const applySearch = useCallback(
    (value: string) => {
      void navigate({
        to: "/servicios",
        search: (prev: Record<string, unknown>) => {
          const { q: _previous, ...rest } = prev;
          return value === "" ? rest : { ...rest, q: value };
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(urlTerm);
    setDebouncedTerm(urlTerm);
  }, [urlTerm]);

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (term === urlTerm) return;
    const handle = window.setTimeout(() => {
      setDebouncedTerm(term);
      setPage(1);
      applySearch(term);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [term, urlTerm, applySearch]);

  const servicesQuery = useServices({
    search: debouncedTerm,
    category: category || null,
    activeOnly,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });

  // The category catalog supplies both the filter options and the form
  // dropdown, with each category's service count.
  const categoriesQuery = useServiceCategories({ search: "" });
  const categoryUsages = categoriesQuery.data ?? [];

  const items = servicesQuery.data?.items ?? [];
  const total = Number(servicesQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = debouncedTerm !== "" || category !== "" || activeOnly;

  const clearFilters = () => {
    setTerm("");
    setDebouncedTerm("");
    setCategory("");
    setActiveOnly(false);
    setPage(1);
    applySearch("");
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    deleteService.mutate(service.id, {
      onSuccess: () => toast.success("Servicio eliminado"),
      onError: () => toast.error("No se pudo eliminar el servicio."),
    });
  };

  const openNotify = () => {
    const customer = customers[0];
    if (!customer) {
      toast.error(
        "Registra un cliente con correo para notificar sobre este servicio.",
      );
      return;
    }
    setNotifyTarget({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email?.trim() ? customer.email : null,
    });
  };

  const columns: Array<DataColumn<Service>> = [
    {
      key: "code",
      header: "Código",
      render: (service) => (
        <span className="data-rail text-sm font-medium">{service.code}</span>
      ),
    },
    {
      key: "name",
      header: "Nombre",
      render: (service) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="truncate font-medium">{service.name}</p>
          {service.description ? (
            <p className="truncate text-xs text-muted-foreground">
              {service.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      render: (service) => (
        <span className="text-muted-foreground">{service.category || "—"}</span>
      ),
    },
    {
      key: "laborRate",
      header: "Tarifa",
      numeric: true,
      render: (service) => (
        <span className="data-rail">{formatMoney(service.laborRate)}</span>
      ),
    },
    {
      key: "estimatedMinutes",
      header: "Duración",
      numeric: true,
      render: (service) => (
        <span className="data-rail text-muted-foreground">
          {formatNumber(service.estimatedMinutes)} min
        </span>
      ),
    },
    {
      key: "active",
      header: "Estado",
      render: (service) => (
        <StatusBadge
          label={service.active ? "Activo" : "Inactivo"}
          tone={service.active ? "accepted" : "cancelled"}
        />
      ),
    },
  ];

  const actions: Array<RowAction<Service>> = [
    {
      kind: "edit",
      label: "Editar servicio",
      onClick: openEdit,
    },
    {
      kind: "save",
      label: "Notificar al cliente",
      onClick: openNotify,
      hidden: () => customers.length === 0,
    },
    {
      kind: "delete",
      label: "Eliminar servicio",
      onClick: handleDelete,
    },
  ];

  const exportRows: CsvRow[] = items.map((service) => ({
    codigo: service.code,
    nombre: service.name,
    descripcion: service.description,
    categoria: service.category,
    tarifa: (Number(service.laborRate) / 100).toFixed(2),
    duracion_min: service.estimatedMinutes.toString(),
    activo: service.active ? "1" : "0",
  }));

  const handleImport = (rows: CsvRow[]) => {
    if (rows.length === 0) {
      toast.error("El archivo no contiene filas válidas.");
      return;
    }
    setImportSummary(null);
    setImportRows(rows);
  };

  const confirmImport = async (rows: CsvRow[]) => {
    if (!actor) return;
    const valid = rows.filter(
      (row) => row.codigo?.trim() && row.nombre?.trim(),
    );
    const skipped = rows.length - valid.length;
    const inputs: ServiceInput[] = valid.map((row) => ({
      code: row.codigo.trim(),
      name: row.nombre.trim(),
      description: row.descripcion?.trim() ?? "",
      category: row.categoria?.trim() ?? "",
      laborRate: toCents(row.tarifa ?? ""),
      estimatedMinutes: toMinutes(row.duracion_min ?? ""),
      active: parseActive(row.activo ?? "1"),
    }));

    setIsImporting(true);
    try {
      const created = await actor.bulkCreateServices(inputs);
      // The bulk import bypasses the CRUD hooks, so refresh the catalog here
      // with the same queryKey the service hooks invalidate.
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      setImportSummary({
        imported: created.length,
        skipped,
        errors: [],
      });
      toast.success(
        `${created.length} servicio${created.length === 1 ? "" : "s"} importado${created.length === 1 ? "" : "s"}`,
      );
      setImportRows(null);
    } catch {
      setImportSummary({
        imported: 0,
        skipped,
        errors: ["No se pudo completar la importación. Intenta de nuevo."],
      });
      toast.error("No se pudo completar la importación.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      data-ocid="services.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Catálogo"
        title="Servicios de taller"
        description="Catálogo de mano de obra con tarifas y duración estimada. Los servicios activos se ofrecen en órdenes, cotizaciones y POS."
        actions={
          <>
            <CsvTransfer
              headers={CSV_HEADERS}
              rows={exportRows}
              onImport={handleImport}
              filename="servicios"
              sheetName="Servicios"
              ocid="services.csv"
              disabled={isImporting}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoriesOpen(true)}
              data-ocid="services.manage_categories_button"
              className="gap-2"
            >
              <FolderTree className="size-4" aria-hidden="true" />
              Categorías
            </Button>
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setZeroDialogOpen(true)}
                data-ocid="services.zero_button"
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Eraser className="size-4" aria-hidden="true" />
                Poner servicios en cero
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={openCreate}
              data-ocid="services.new_service_button"
              className="gap-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo servicio
            </Button>
          </>
        }
      />

      {zeroedCount !== null ? (
        <output
          data-ocid="services.zero_success"
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
                Servicios puestos en cero
              </p>
              <p className="text-sm text-muted-foreground">
                {zeroedCount === 1n
                  ? "Se eliminó 1 servicio del catálogo."
                  : `Se eliminaron ${zeroedCount.toString()} servicios del catálogo.`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZeroedCount(null)}
            aria-label="Cerrar aviso"
            data-ocid="services.zero_success_close_button"
            className="shrink-0 text-muted-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </output>
      ) : null}

      {importSummary ? (
        <div
          data-ocid="services.import_summary"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle"
        >
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          <p className="text-sm">
            <span className="font-medium">
              {importSummary.imported} importado
              {importSummary.imported === 1 ? "" : "s"}
            </span>
            <span className="text-muted-foreground">
              {" · "}
              {importSummary.skipped} omitido
              {importSummary.skipped === 1 ? "" : "s"}
            </span>
          </p>
          {importSummary.errors.length > 0 ? (
            <p className="text-sm text-destructive">
              {importSummary.errors.join(" ")}
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImportSummary(null)}
            data-ocid="services.import_summary_dismiss"
            className="ml-auto text-muted-foreground"
          >
            Cerrar
          </Button>
        </div>
      ) : null}

      <section
        data-ocid="services.filters"
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
              placeholder="Buscar por nombre o código…"
              aria-label="Buscar servicios"
              className="pl-9"
              data-ocid="services.search_input"
            />
          </div>

          <Select
            value={category || "all"}
            onValueChange={(value) => {
              setCategory(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-[190px]"
              aria-label="Filtrar por categoría"
              data-ocid="services.category_select"
            >
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categoryUsages.map((usage) => (
                <SelectItem
                  key={usage.category.id.toString()}
                  value={usage.category.name}
                >
                  {`${usage.category.name} · ${formatNumber(usage.serviceCount)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={activeOnly ? "default" : "outline"}
            onClick={() => {
              setActiveOnly((current) => !current);
              setPage(1);
            }}
            aria-pressed={activeOnly}
            data-ocid="services.active_toggle"
            className="gap-2"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Solo activos
          </Button>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="services.clear_filters_button"
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {servicesQuery.isLoading
              ? "Cargando…"
              : `${formatNumber(total)} servicio${total === 1 ? "" : "s"}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
              Orden
            </span>
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as ServiceSort);
                setPage(1);
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-[150px]"
                aria-label="Ordenar por"
                data-ocid="services.sort_select"
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

        {servicesQuery.isError ? (
          <div
            data-ocid="services.error_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el catálogo de servicios.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void servicesQuery.refetch({ cancelRefetch: true })
              }
              data-ocid="services.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : servicesQuery.isLoading ? (
          <div data-ocid="services.loading_state" className="space-y-2">
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-11 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="services.empty_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <Wrench
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {hasFilters
                  ? "Sin resultados"
                  : "Aún no hay servicios registrados"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {hasFilters
                  ? "Ajusta la búsqueda o los filtros para encontrar servicios."
                  : "Registra el primer servicio para usarlo como línea de mano de obra."}
              </p>
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                data-ocid="services.empty_clear_button"
              >
                Limpiar filtros
              </Button>
            ) : (
              <Button
                type="button"
                onClick={openCreate}
                data-ocid="services.empty_new_button"
                className="gap-2"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nuevo servicio
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(service) => service.id.toString()}
            actions={actions}
            ocid="services"
          />
        )}

        {!servicesQuery.isLoading && !servicesQuery.isError && total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Mostrando {formatNumber(items.length)} de {formatNumber(total)} ·
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                data-ocid="services.pagination_prev"
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                data-ocid="services.pagination_next"
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editing}
        categories={categoryUsages}
      />

      <ServiceCategoryDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />

      <ZeroServicesDialog
        open={zeroDialogOpen}
        onOpenChange={setZeroDialogOpen}
        onZeroed={setZeroedCount}
      />

      <ImportPreviewDialog
        open={importRows !== null}
        onOpenChange={(open) => {
          if (!open) setImportRows(null);
        }}
        rows={importRows ?? []}
        onConfirm={(rows) => void confirmImport(rows)}
        isPending={isImporting}
      />

      {notifyTarget ? (
        <NotifyCustomerDialog
          open
          onOpenChange={(open) => {
            if (!open) setNotifyTarget(null);
          }}
          customerId={notifyTarget.customerId}
          customerName={notifyTarget.customerName}
          customerEmail={notifyTarget.customerEmail}
          source={NotificationSource.service}
          defaultSubject="Información de servicios de taller"
          defaultMessage={`Hola ${notifyTarget.customerName}, te compartimos la información actualizada de nuestros servicios de taller. Si deseas agendar una revisión, respóndenos a este correo y coordinamos la cita.`}
        />
      ) : null}
    </div>
  );
}

export default ServicesPage;
