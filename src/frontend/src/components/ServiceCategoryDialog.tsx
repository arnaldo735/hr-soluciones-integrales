import type { ServiceCategoryUsage } from "@/backend";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateServiceCategory,
  useDeleteServiceCategory,
  useServiceCategories,
  useUpdateServiceCategory,
} from "@/hooks/use-service-categories";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, index) => `category-skeleton-${index}`,
);

interface CategoryFormState {
  name: string;
  description: string;
}

const EMPTY_FORM: CategoryFormState = { name: "", description: "" };

/** Delays a fast-changing value so the category search hits the backend calmly. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Translates a backend category failure into a Spanish message. The backend
 * traps with `duplicateName: <name>` and `inUse: <id> (<n> servicios activos)`,
 * so the raw error text is inspected for those markers.
 */
function categoryErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("duplicateName")) {
    return "Ya existe una categoría con ese nombre. Usa un nombre distinto.";
  }
  if (raw.includes("inUse")) {
    const match = raw.match(/(\d+)\s+servicios activos/);
    const count = match ? Number.parseInt(match[1], 10) : null;
    return count !== null
      ? `No se puede eliminar: ${count} servicio${count === 1 ? "" : "s"} activo${count === 1 ? "" : "s"} usa${count === 1 ? "" : "n"} esta categoría. Reasigna esos servicios antes de eliminarla.`
      : "No se puede eliminar: hay servicios activos que usan esta categoría. Reasigna esos servicios antes de eliminarla.";
  }
  if (raw.includes("notAuthorized")) {
    return "No tienes permisos para administrar categorías.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}

function CategoryForm({
  editing,
  onDone,
}: {
  editing: ServiceCategoryUsage | null;
  onDone: () => void;
}) {
  const createCategory = useCreateServiceCategory();
  const updateCategory = useUpdateServiceCategory();
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setForm(
      editing
        ? {
            name: editing.category.name,
            description: editing.category.description,
          }
        : EMPTY_FORM,
    );
  }, [editing]);

  const isPending = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    setError(null);
    const input = { name, description: form.description.trim() };
    const onError = (mutationError: unknown) =>
      setError(categoryErrorMessage(mutationError));

    if (editing) {
      updateCategory.mutate(
        { id: editing.category.id, input },
        {
          onSuccess: () => {
            toast.success("Categoría actualizada");
            onDone();
          },
          onError,
        },
      );
    } else {
      createCategory.mutate(input, {
        onSuccess: () => {
          toast.success("Categoría creada");
          onDone();
        },
        onError,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-ocid="service_categories.form"
      className="space-y-3 rounded-md border border-border bg-muted/40 p-3"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {editing ? "Editar categoría" : "Nueva categoría"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category-name">Nombre</Label>
          <Input
            id="category-name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Mantenimiento"
            data-ocid="service_categories.name_input"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category-description">Descripción</Label>
          <Textarea
            id="category-description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Servicios de mantenimiento preventivo y correctivo."
            rows={1}
            data-ocid="service_categories.description_input"
          />
        </div>
      </div>

      {error ? (
        <p
          data-ocid="service_categories.form_error"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDone}
            data-ocid="service_categories.cancel_edit_button"
          >
            <X className="size-4" aria-hidden="true" />
            Cancelar
          </Button>
        ) : null}
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          data-ocid="service_categories.submit_button"
          className="gap-2"
        >
          {editing ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {isPending
            ? "Guardando…"
            : editing
              ? "Guardar cambios"
              : "Crear categoría"}
        </Button>
      </div>
    </form>
  );
}

function CategoryRow({
  usage,
  onEdit,
  onDelete,
  isDeleting,
}: {
  usage: ServiceCategoryUsage;
  onEdit: (usage: ServiceCategoryUsage) => void;
  onDelete: (usage: ServiceCategoryUsage) => void;
  isDeleting: boolean;
}) {
  const serviceCount = Number(usage.serviceCount);
  const activeCount = Number(usage.activeServiceCount);
  const blocked = activeCount > 0;

  return (
    <li
      data-ocid={`service_categories.item.${usage.category.id.toString()}`}
      className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium">{usage.category.name}</p>
        {usage.category.description ? (
          <p className="truncate text-xs text-muted-foreground">
            {usage.category.description}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-status badge-draft">
            {formatNumber(usage.serviceCount)} servicio
            {serviceCount === 1 ? "" : "s"}
          </span>
          {activeCount > 0 ? (
            <span className="badge-status badge-accepted">
              {formatNumber(usage.activeServiceCount)} activo
              {activeCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          title="Editar categoría"
          aria-label={`Editar categoría ${usage.category.name}`}
          onClick={() => onEdit(usage)}
          data-ocid={`service_categories.edit_button.${usage.category.id.toString()}`}
          className="row-action"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          title={
            blocked
              ? "No se puede eliminar: tiene servicios activos"
              : "Eliminar categoría"
          }
          aria-label={`Eliminar categoría ${usage.category.name}`}
          disabled={blocked || isDeleting}
          onClick={() => onDelete(usage)}
          data-ocid={`service_categories.delete_button.${usage.category.id.toString()}`}
          className="row-action disabled:pointer-events-none disabled:opacity-40"
          data-variant="destructive"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

/**
 * Category management surface reachable from the services catalog. Lists every
 * category with its usage counts and supports create, rename/edit and delete.
 * Deleting a category that still has active services is refused by the backend
 * and the refusal is surfaced in Spanish.
 */
export function ServiceCategoryDialog({
  open,
  onOpenChange,
  embedded = false,
  search: controlledSearch,
  onSearchChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Renders the management surface inline instead of as a modal. Used by the
   * `/servicios/categorias` route, where the page itself is the destination.
   */
  embedded?: boolean;
  /**
   * Controlled search term. When provided, the parent owns the term (the
   * `/servicios/categorias` page persists it in the URL); otherwise the dialog
   * keeps it in local state.
   */
  search?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [localSearch, setLocalSearch] = useState("");
  const search = controlledSearch ?? localSearch;
  const setSearch = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearch(value);
    }
  };
  // Debounce the term so the category list is queried after typing stops
  // instead of on every keystroke.
  const debouncedSearch = useDebouncedValue(search, 300);
  const [editing, setEditing] = useState<ServiceCategoryUsage | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<ServiceCategoryUsage | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoriesQuery = useServiceCategories({ search: debouncedSearch });
  const deleteCategory = useDeleteServiceCategory();

  useEffect(() => {
    if (!open) {
      if (!onSearchChange) setLocalSearch("");
      setEditing(null);
      setPendingDelete(null);
      setDeleteError(null);
    }
  }, [open, onSearchChange]);

  const usages = categoriesQuery.data ?? [];

  const handleDelete = (usage: ServiceCategoryUsage) => {
    setDeleteError(null);
    deleteCategory.mutate(usage.category.id, {
      onSuccess: () => {
        toast.success("Categoría eliminada");
        setPendingDelete(null);
        if (editing?.category.id === usage.category.id) setEditing(null);
      },
      onError: (error) => {
        const message = categoryErrorMessage(error);
        setDeleteError(message);
        toast.error(message);
      },
    });
  };

  const body = (
    <>
      {embedded ? null : (
        <DialogHeader>
          <DialogTitle className="font-display">
            Categorías de servicios
          </DialogTitle>
          <DialogDescription>
            Administra las categorías del catálogo. Una categoría con servicios
            activos no se puede eliminar: reasigna esos servicios primero.
          </DialogDescription>
        </DialogHeader>
      )}

      <CategoryForm editing={editing} onDone={() => setEditing(null)} />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {categoriesQuery.isLoading
              ? "Cargando…"
              : `${formatNumber(usages.length)} categoría${usages.length === 1 ? "" : "s"}`}
          </p>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar categoría…"
            aria-label="Buscar categorías"
            className="h-8 w-[200px]"
            data-ocid="service_categories.search_input"
          />
        </div>

        {deleteError ? (
          <p
            data-ocid="service_categories.delete_error"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {deleteError}
          </p>
        ) : null}

        {categoriesQuery.isError ? (
          <div
            data-ocid="service_categories.error_state"
            className="flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-10 text-center"
          >
            <AlertTriangle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar las categorías.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void categoriesQuery.refetch()}
              data-ocid="service_categories.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : categoriesQuery.isLoading ? (
          <div
            data-ocid="service_categories.loading_state"
            className="space-y-2"
          >
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-16 w-full" />
            ))}
          </div>
        ) : usages.length === 0 ? (
          <div
            data-ocid="service_categories.empty_state"
            className="flex flex-col items-center gap-2 rounded-md border border-border bg-card px-6 py-10 text-center"
          >
            <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted">
              <FolderTree
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="font-display text-sm font-semibold">
              {search.trim() ? "Sin resultados" : "Aún no hay categorías"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {search.trim()
                ? "Ajusta la búsqueda para encontrar categorías."
                : "Crea la primera categoría para clasificar los servicios del catálogo."}
            </p>
          </div>
        ) : (
          <ul
            data-ocid="service_categories.list"
            className="scroll-slim max-h-[40vh] space-y-2 overflow-y-auto pr-1"
          >
            {usages.map((usage) => (
              <CategoryRow
                key={usage.category.id.toString()}
                usage={usage}
                onEdit={(next) => {
                  setEditing(next);
                  setDeleteError(null);
                }}
                onDelete={(next) => {
                  setPendingDelete(next);
                  setDeleteError(null);
                }}
                isDeleting={deleteCategory.isPending}
              />
            ))}
          </ul>
        )}
      </div>

      {pendingDelete ? (
        <div
          data-ocid="service_categories.delete_confirm"
          className={cn(
            "space-y-3 rounded-md border border-destructive/40 bg-destructive/[0.06] p-3",
          )}
        >
          <p className="text-sm">
            ¿Eliminar la categoría{" "}
            <span className="font-medium">{pendingDelete.category.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingDelete(null)}
              data-ocid="service_categories.delete_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={deleteCategory.isPending}
              onClick={() => handleDelete(pendingDelete)}
              data-ocid="service_categories.delete_confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </div>
      ) : null}

      {embedded ? null : (
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="service_categories.close_button"
          >
            Cerrar
          </Button>
        </DialogFooter>
      )}
    </>
  );

  if (embedded) {
    return (
      <div
        data-ocid="service_categories.dialog"
        className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-subtle"
      >
        {body}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="service_categories.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        {body}
      </DialogContent>
    </Dialog>
  );
}

export default ServiceCategoryDialog;
