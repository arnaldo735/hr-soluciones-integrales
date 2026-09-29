import { k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation, t as reactExports, j as jsxRuntimeExports, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, o as formatNumber, w as Input, T as TriangleAlert, B as Button, aD as FolderTree, Z as cn, a3 as DialogFooter, _ as Dialog, $ as DialogContent, K as Label, X, av as ue } from "./index-EqGEeyjs.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { C as Check } from "./check-LdjEv5O-.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { P as Pencil } from "./pencil-BajrtuU3.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
function useServiceCategories(params) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();
  return useQuery({
    queryKey: ["service-categories", search],
    queryFn: async () => {
      if (!actor) return [];
      const filter = {
        search: search.length > 0 ? search : void 0
      };
      return actor.listServiceCategories(token, filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateServiceCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createServiceCategory(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    }
  });
}
function useUpdateServiceCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateServiceCategory(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    }
  });
}
function useDeleteServiceCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteServiceCategory(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    }
  });
}
const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, index) => `category-skeleton-${index}`
);
const EMPTY_FORM = { name: "", description: "" };
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
function categoryErrorMessage(error) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("duplicateName")) {
    return "Ya existe una categoría con ese nombre. Usa un nombre distinto.";
  }
  if (raw.includes("inUse")) {
    const match = raw.match(/(\d+)\s+servicios activos/);
    const count = match ? Number.parseInt(match[1], 10) : null;
    return count !== null ? `No se puede eliminar: ${count} servicio${count === 1 ? "" : "s"} activo${count === 1 ? "" : "s"} usa${count === 1 ? "" : "n"} esta categoría. Reasigna esos servicios antes de eliminarla.` : "No se puede eliminar: hay servicios activos que usan esta categoría. Reasigna esos servicios antes de eliminarla.";
  }
  if (raw.includes("notAuthorized")) {
    return "No tienes permisos para administrar categorías.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}
function CategoryForm({
  editing,
  onDone
}) {
  const createCategory = useCreateServiceCategory();
  const updateCategory = useUpdateServiceCategory();
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setError(null);
    setForm(
      editing ? {
        name: editing.category.name,
        description: editing.category.description
      } : EMPTY_FORM
    );
  }, [editing]);
  const isPending = createCategory.isPending || updateCategory.isPending;
  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    setError(null);
    const input = { name, description: form.description.trim() };
    const onError = (mutationError) => setError(categoryErrorMessage(mutationError));
    if (editing) {
      updateCategory.mutate(
        { id: editing.category.id, input },
        {
          onSuccess: () => {
            ue.success("Categoría actualizada");
            onDone();
          },
          onError
        }
      );
    } else {
      createCategory.mutate(input, {
        onSuccess: () => {
          ue.success("Categoría creada");
          onDone();
        },
        onError
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      onSubmit: handleSubmit,
      "data-ocid": "service_categories.form",
      className: "space-y-3 rounded-md border border-border bg-muted/40 p-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: editing ? "Editar categoría" : "Nueva categoría" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "category-name", children: "Nombre" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "category-name",
                value: form.name,
                onChange: (event) => setForm((current) => ({ ...current, name: event.target.value })),
                placeholder: "Mantenimiento",
                "data-ocid": "service_categories.name_input",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "category-description", children: "Descripción" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "category-description",
                value: form.description,
                onChange: (event) => setForm((current) => ({
                  ...current,
                  description: event.target.value
                })),
                placeholder: "Servicios de mantenimiento preventivo y correctivo.",
                rows: 1,
                "data-ocid": "service_categories.description_input"
              }
            )
          ] })
        ] }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "service_categories.form_error",
            className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
            children: error
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
          editing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              onClick: onDone,
              "data-ocid": "service_categories.cancel_edit_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" }),
                "Cancelar"
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "submit",
              size: "sm",
              disabled: isPending,
              "data-ocid": "service_categories.submit_button",
              className: "gap-2",
              children: [
                editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                isPending ? "Guardando…" : editing ? "Guardar cambios" : "Crear categoría"
              ]
            }
          )
        ] })
      ]
    }
  );
}
function CategoryRow({
  usage,
  onEdit,
  onDelete,
  isDeleting
}) {
  const serviceCount = Number(usage.serviceCount);
  const activeCount = Number(usage.activeServiceCount);
  const blocked = activeCount > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      "data-ocid": `service_categories.item.${usage.category.id.toString()}`,
      className: "flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: usage.category.name }),
          usage.category.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: usage.category.description }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-draft", children: [
              formatNumber(usage.serviceCount),
              " servicio",
              serviceCount === 1 ? "" : "s"
            ] }),
            activeCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-accepted", children: [
              formatNumber(usage.activeServiceCount),
              " activo",
              activeCount === 1 ? "" : "s"
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              title: "Editar categoría",
              "aria-label": `Editar categoría ${usage.category.name}`,
              onClick: () => onEdit(usage),
              "data-ocid": `service_categories.edit_button.${usage.category.id.toString()}`,
              className: "row-action",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5", "aria-hidden": "true" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              title: blocked ? "No se puede eliminar: tiene servicios activos" : "Eliminar categoría",
              "aria-label": `Eliminar categoría ${usage.category.name}`,
              disabled: blocked || isDeleting,
              onClick: () => onDelete(usage),
              "data-ocid": `service_categories.delete_button.${usage.category.id.toString()}`,
              className: "row-action disabled:pointer-events-none disabled:opacity-40",
              "data-variant": "destructive",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5", "aria-hidden": "true" })
            }
          )
        ] })
      ]
    }
  );
}
function ServiceCategoryDialog({
  open,
  onOpenChange,
  embedded = false,
  search: controlledSearch,
  onSearchChange
}) {
  const [localSearch, setLocalSearch] = reactExports.useState("");
  const search = controlledSearch ?? localSearch;
  const setSearch = (value) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearch(value);
    }
  };
  const debouncedSearch = useDebouncedValue(search, 300);
  const [editing, setEditing] = reactExports.useState(null);
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const [deleteError, setDeleteError] = reactExports.useState(null);
  const categoriesQuery = useServiceCategories({ search: debouncedSearch });
  const deleteCategory = useDeleteServiceCategory();
  reactExports.useEffect(() => {
    if (!open) {
      if (!onSearchChange) setLocalSearch("");
      setEditing(null);
      setPendingDelete(null);
      setDeleteError(null);
    }
  }, [open, onSearchChange]);
  const usages = categoriesQuery.data ?? [];
  const handleDelete = (usage) => {
    setDeleteError(null);
    deleteCategory.mutate(usage.category.id, {
      onSuccess: () => {
        ue.success("Categoría eliminada");
        setPendingDelete(null);
        if ((editing == null ? void 0 : editing.category.id) === usage.category.id) setEditing(null);
      },
      onError: (error) => {
        const message = categoryErrorMessage(error);
        setDeleteError(message);
        ue.error(message);
      }
    });
  };
  const body = /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    embedded ? null : /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Categorías de servicios" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Administra las categorías del catálogo. Una categoría con servicios activos no se puede eliminar: reasigna esos servicios primero." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CategoryForm, { editing, onDone: () => setEditing(null) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: categoriesQuery.isLoading ? "Cargando…" : `${formatNumber(usages.length)} categoría${usages.length === 1 ? "" : "s"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: search,
            onChange: (event) => setSearch(event.target.value),
            placeholder: "Buscar categoría…",
            "aria-label": "Buscar categorías",
            className: "h-8 w-[200px]",
            "data-ocid": "service_categories.search_input"
          }
        )
      ] }),
      deleteError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "p",
        {
          "data-ocid": "service_categories.delete_error",
          className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "mt-0.5 size-4 shrink-0",
                "aria-hidden": "true"
              }
            ),
            deleteError
          ]
        }
      ) : null,
      categoriesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "service_categories.error_state",
          className: "flex flex-col items-center gap-3 rounded-md border border-border bg-card px-6 py-10 text-center",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "size-5 text-destructive",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar las categorías." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => void categoriesQuery.refetch(),
                "data-ocid": "service_categories.retry_button",
                children: "Reintentar"
              }
            )
          ]
        }
      ) : categoriesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          "data-ocid": "service_categories.loading_state",
          className: "space-y-2",
          children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 w-full" }, id))
        }
      ) : usages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "service_categories.empty_state",
          className: "flex flex-col items-center gap-2 rounded-md border border-border bg-card px-6 py-10 text-center",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-10 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              FolderTree,
              {
                className: "size-5 text-muted-foreground",
                "aria-hidden": "true"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: search.trim() ? "Sin resultados" : "Aún no hay categorías" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: search.trim() ? "Ajusta la búsqueda para encontrar categorías." : "Crea la primera categoría para clasificar los servicios del catálogo." })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "ul",
        {
          "data-ocid": "service_categories.list",
          className: "scroll-slim max-h-[40vh] space-y-2 overflow-y-auto pr-1",
          children: usages.map((usage) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            CategoryRow,
            {
              usage,
              onEdit: (next) => {
                setEditing(next);
                setDeleteError(null);
              },
              onDelete: (next) => {
                setPendingDelete(next);
                setDeleteError(null);
              },
              isDeleting: deleteCategory.isPending
            },
            usage.category.id.toString()
          ))
        }
      )
    ] }),
    pendingDelete ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "service_categories.delete_confirm",
        className: cn(
          "space-y-3 rounded-md border border-destructive/40 bg-destructive/[0.06] p-3"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
            "¿Eliminar la categoría",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: pendingDelete.category.name }),
            "? Esta acción no se puede deshacer."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setPendingDelete(null),
                "data-ocid": "service_categories.delete_cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                size: "sm",
                disabled: deleteCategory.isPending,
                onClick: () => handleDelete(pendingDelete),
                "data-ocid": "service_categories.delete_confirm_button",
                className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                children: deleteCategory.isPending ? "Eliminando…" : "Eliminar"
              }
            )
          ] })
        ]
      }
    ) : null,
    embedded ? null : /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        type: "button",
        variant: "outline",
        onClick: () => onOpenChange(false),
        "data-ocid": "service_categories.close_button",
        children: "Cerrar"
      }
    ) })
  ] });
  if (embedded) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": "service_categories.dialog",
        className: "space-y-4 rounded-lg border border-border bg-card p-4 shadow-subtle",
        children: body
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    DialogContent,
    {
      "data-ocid": "service_categories.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
      children: body
    }
  ) });
}
export {
  ServiceCategoryDialog as S,
  useServiceCategories as u
};
