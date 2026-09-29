import { Y as createLucideIcon, k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation, t as reactExports, j as jsxRuntimeExports, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, o as formatNumber, w as Input, T as TriangleAlert, B as Button, b as Tags, Z as cn, a3 as DialogFooter, K as Label, X, av as ue, aL as colombiaStartOfDay, aK as colombiaEndOfDay, z as formatDate, y as formatMoney, v as Search, R as Receipt, G as ChevronRight, e as Wallet, F as FileText, aY as colombiaDateInput, ai as ExternalBlob } from "./index-EqGEeyjs.js";
import { D as DataTable } from "./DataTable-BGUSfdBQ.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { C as Check } from "./check-LdjEv5O-.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { P as Pencil } from "./pencil-BajrtuU3.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { C as Card, c as CardContent } from "./card-YKA4f36t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import { C as ChevronLeft } from "./chevron-left-C2006Y0h.js";
import { U as Upload } from "./upload-CmMwQ1re.js";
import "./alert-dialog-qVL9cwOA.js";
import "./table-Dz_wGPQA.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M13.234 20.252 21 12.3", key: "1cbrk9" }],
  [
    "path",
    {
      d: "m16 6-8.414 8.586a2 2 0 0 0 0 2.828 2 2 0 0 0 2.828 0l8.414-8.586a4 4 0 0 0 0-5.656 4 4 0 0 0-5.656 0l-8.415 8.585a6 6 0 1 0 8.486 8.486",
      key: "1pkts6"
    }
  ]
];
const Paperclip = createLucideIcon("paperclip", __iconNode);
function useExpenses(params) {
  var _a, _b, _c;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();
  return useQuery({
    queryKey: [
      "expenses",
      search,
      ((_a = params.categoryId) == null ? void 0 : _a.toString()) ?? "all",
      params.paymentMethod ?? "all",
      ((_b = params.from) == null ? void 0 : _b.toString()) ?? "none",
      ((_c = params.to) == null ? void 0 : _c.toString()) ?? "none",
      params.page,
      params.pageSize
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      const filter = {
        search: search.length > 0 ? search : void 0,
        categoryId: params.categoryId ?? void 0,
        paymentMethod: params.paymentMethod ?? void 0,
        from: params.from ?? void 0,
        to: params.to ?? void 0
      };
      return actor.listExpenses(token, filter, offset, limit);
    },
    enabled: !!actor && !isFetching
  });
}
function useExpenseSummary(filter) {
  var _a, _b, _c;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "expense-summary",
      ((_a = filter.categoryId) == null ? void 0 : _a.toString()) ?? "all",
      ((_b = filter.from) == null ? void 0 : _b.toString()) ?? "none",
      ((_c = filter.to) == null ? void 0 : _c.toString()) ?? "none"
    ],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getExpenseSummary(token, filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateExpense() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createExpense(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    }
  });
}
function useUpdateExpense() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateExpense(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    }
  });
}
function useDeleteExpense() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteExpense(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    }
  });
}
function useExpenseCategories(params) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();
  return useQuery({
    queryKey: ["expense-categories", search],
    queryFn: async () => {
      if (!actor) return [];
      const filter = {
        search: search.length > 0 ? search : void 0
      };
      return actor.listExpenseCategories(token, filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateExpenseCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createExpenseCategory(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    }
  });
}
function useUpdateExpenseCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateExpenseCategory(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    }
  });
}
function useDeleteExpenseCategory() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteExpenseCategory(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
    }
  });
}
const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, index) => `expense-category-skeleton-${index}`
);
const EMPTY_FORM = { name: "", description: "" };
function categoryErrorMessage(error) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("duplicateName")) {
    return "Ya existe una categoría con ese nombre. Usa un nombre distinto.";
  }
  if (raw.includes("inUse")) {
    const match = raw.match(/(\d+)\s+gastos/);
    const count = match ? Number.parseInt(match[1], 10) : null;
    return count !== null ? `No se puede eliminar: ${count} gasto${count === 1 ? "" : "s"} usa${count === 1 ? "" : "n"} esta categoría. Reasigna esos gastos antes de eliminarla.` : "No se puede eliminar: hay gastos registrados con esta categoría. Reasigna esos gastos antes de eliminarla.";
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
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
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
      "data-ocid": "expense_categories.form",
      className: "space-y-3 rounded-md border border-border bg-muted/40 p-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: editing ? "Editar categoría" : "Nueva categoría" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-category-name", children: "Nombre" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "expense-category-name",
                value: form.name,
                onChange: (event) => setForm((current) => ({ ...current, name: event.target.value })),
                placeholder: "Repuestos",
                "data-ocid": "expense_categories.name_input",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-category-description", children: "Descripción" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "expense-category-description",
                value: form.description,
                onChange: (event) => setForm((current) => ({
                  ...current,
                  description: event.target.value
                })),
                placeholder: "Compra de repuestos y consumibles para el taller.",
                rows: 1,
                "data-ocid": "expense_categories.description_input"
              }
            )
          ] })
        ] }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "expense_categories.form_error",
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
              "data-ocid": "expense_categories.cancel_edit_button",
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
              "data-ocid": "expense_categories.submit_button",
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
  const expenseCount = Number(usage.expenseCount);
  const blocked = expenseCount > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      "data-ocid": `expense_categories.item.${usage.category.id.toString()}`,
      className: "flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: usage.category.name }),
          usage.category.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: usage.category.description }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-draft", children: [
            formatNumber(usage.expenseCount),
            " gasto",
            expenseCount === 1 ? "" : "s"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              title: "Editar categoría",
              "aria-label": `Editar categoría ${usage.category.name}`,
              onClick: () => onEdit(usage),
              "data-ocid": `expense_categories.edit_button.${usage.category.id.toString()}`,
              className: "row-action",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5", "aria-hidden": "true" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              title: blocked ? "No se puede eliminar: tiene gastos registrados" : "Eliminar categoría",
              "aria-label": `Eliminar categoría ${usage.category.name}`,
              disabled: blocked || isDeleting,
              onClick: () => onDelete(usage),
              "data-ocid": `expense_categories.delete_button.${usage.category.id.toString()}`,
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
function ExpenseCategoryDialog({
  open,
  onOpenChange
}) {
  const [search, setSearch] = reactExports.useState("");
  const [editing, setEditing] = reactExports.useState(null);
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const [deleteError, setDeleteError] = reactExports.useState(null);
  const categoriesQuery = useExpenseCategories({ search });
  const deleteCategory = useDeleteExpenseCategory();
  reactExports.useEffect(() => {
    if (!open) {
      setSearch("");
      setEditing(null);
      setPendingDelete(null);
      setDeleteError(null);
    }
  }, [open]);
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "expense_categories.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Categorías de gastos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Administra las categorías de gastos. Una categoría con gastos registrados no se puede eliminar: reasigna esos gastos primero." })
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
                "aria-label": "Buscar categorías de gastos",
                className: "h-8 w-[200px]",
                "data-ocid": "expense_categories.search_input"
              }
            )
          ] }),
          deleteError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              "data-ocid": "expense_categories.delete_error",
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
              "data-ocid": "expense_categories.error_state",
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
                    "data-ocid": "expense_categories.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : categoriesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              "data-ocid": "expense_categories.loading_state",
              className: "space-y-2",
              children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 w-full" }, id))
            }
          ) : usages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "expense_categories.empty_state",
              className: "flex flex-col items-center gap-2 rounded-md border border-border bg-card px-6 py-10 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-10 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tags,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: search.trim() ? "Sin resultados" : "Aún no hay categorías" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: search.trim() ? "Ajusta la búsqueda para encontrar categorías." : "Crea la primera categoría para clasificar los gastos operativos." })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "ul",
            {
              "data-ocid": "expense_categories.list",
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
            "data-ocid": "expense_categories.delete_confirm",
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
                    "data-ocid": "expense_categories.delete_cancel_button",
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
                    "data-ocid": "expense_categories.delete_confirm_button",
                    className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    children: deleteCategory.isPending ? "Eliminando…" : "Eliminar"
                  }
                )
              ] })
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            "data-ocid": "expense_categories.close_button",
            children: "Cerrar"
          }
        ) })
      ]
    }
  ) });
}
const PAGE_SIZE = 20;
const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mixed: "Mixto"
};
const PAYMENT_METHOD_OPTIONS = ["cash", "card", "transfer", "mixed"];
function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
function parseAmount(value) {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (normalized === "") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}
function centsToInput(cents) {
  return (Number(cents) / 100).toFixed(2);
}
function isImageFile(filename) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filename);
}
function useSuppliers() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["suppliers", "expense-form"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSuppliers(token, null);
    },
    enabled: !!actor && !isFetching
  });
}
function emptyForm() {
  return {
    date: colombiaDateInput(BigInt(Date.now()) * 1000000n),
    concept: "",
    categoryId: "",
    supplierId: "",
    amount: "",
    tax: "",
    paymentMethod: "cash",
    receiptUrl: "",
    receiptName: ""
  };
}
function toFormState(expense) {
  var _a;
  return {
    date: colombiaDateInput(expense.date),
    concept: expense.concept,
    categoryId: expense.categoryId.toString(),
    supplierId: ((_a = expense.supplierId) == null ? void 0 : _a.toString()) ?? "",
    amount: centsToInput(expense.amount),
    tax: centsToInput(expense.tax),
    paymentMethod: expense.paymentMethod,
    receiptUrl: expense.receiptUrl ?? "",
    receiptName: expense.receiptUrl ? "Comprobante adjunto" : ""
  };
}
function ExpenseDialog({ open, onOpenChange, expense }) {
  const [form, setForm] = reactExports.useState(emptyForm);
  const [error, setError] = reactExports.useState(null);
  const [uploading, setUploading] = reactExports.useState(false);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [categoriesOpen, setCategoriesOpen] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const suppliersQuery = useSuppliers();
  const categoriesQuery = useExpenseCategories({ search: "" });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const isEditing = expense !== null;
  const isPending = createExpense.isPending || updateExpense.isPending;
  const suppliers = suppliersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  reactExports.useEffect(() => {
    if (open) {
      setForm(expense ? toFormState(expense) : emptyForm());
      setError(null);
      setUploadProgress(0);
    }
  }, [open, expense]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function handleFileChange(event) {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name
      ).withUploadProgress((percentage) => setUploadProgress(percentage));
      update("receiptUrl", blob.getDirectURL());
      update("receiptName", file.name);
    } catch {
      setError("No se pudo adjuntar el comprobante. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }
  function clearReceipt() {
    update("receiptUrl", "");
    update("receiptName", "");
  }
  function handleSubmit(event) {
    event.preventDefault();
    const concept = form.concept.trim();
    if (concept === "") {
      setError("El concepto del gasto es obligatorio.");
      return;
    }
    if (form.categoryId === "") {
      setError("Selecciona una categoría para el gasto.");
      return;
    }
    const amount = parseAmount(form.amount);
    if (amount === null || amount === 0n) {
      setError("Captura un monto válido mayor a cero.");
      return;
    }
    const tax = parseAmount(form.tax) ?? 0n;
    const date = colombiaStartOfDay(form.date);
    if (date === null) {
      setError("Selecciona una fecha válida.");
      return;
    }
    const input = {
      date,
      concept,
      categoryId: BigInt(form.categoryId),
      supplierId: form.supplierId === "" ? void 0 : BigInt(form.supplierId),
      amount,
      tax,
      paymentMethod: form.paymentMethod,
      receiptUrl: form.receiptUrl === "" ? void 0 : form.receiptUrl
    };
    setError(null);
    const onSuccess = () => {
      ue.success(isEditing ? "Gasto actualizado" : "Gasto registrado");
      onOpenChange(false);
    };
    const onError = (mutationError) => {
      setError(
        mutationError.message || "No se pudo guardar el gasto. Inténtalo de nuevo."
      );
    };
    if (isEditing && expense) {
      updateExpense.mutate({ id: expense.id, input }, { onSuccess, onError });
    } else {
      createExpense.mutate(input, { onSuccess, onError });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        "data-ocid": "expenses.dialog",
        className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: isEditing ? "Editar gasto" : "Registrar gasto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Captura el gasto operativo con su comprobante. Los gastos alimentan automáticamente el módulo de Contabilidad." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-date", children: "Fecha" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "expense-date",
                    type: "date",
                    value: form.date,
                    onChange: (event) => update("date", event.target.value),
                    className: "data-rail",
                    "data-ocid": "expenses.date_input",
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-category", children: "Categoría" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: () => setCategoriesOpen(true),
                      "data-ocid": "expenses.manage_categories_button",
                      className: "h-6 gap-1.5 px-2 text-xs text-muted-foreground",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tags, { className: "size-3.5", "aria-hidden": "true" }),
                        "Categorías"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: form.categoryId,
                    onValueChange: (value) => update("categoryId", value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "expense-category",
                          "aria-label": "Categoría del gasto",
                          "data-ocid": "expenses.category_select",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona una categoría" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: categories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none", disabled: true, children: "Sin categorías disponibles" }) : categories.map((usage) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectItem,
                        {
                          value: usage.category.id.toString(),
                          children: usage.category.name
                        },
                        usage.category.id.toString()
                      )) })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-concept", children: "Concepto" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    id: "expense-concept",
                    value: form.concept,
                    onChange: (event) => update("concept", event.target.value),
                    placeholder: "Compra de aceite sintético y filtros para servicio",
                    rows: 2,
                    "data-ocid": "expenses.concept_input",
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-supplier", children: "Proveedor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: form.supplierId === "" ? "none" : form.supplierId,
                    onValueChange: (value) => update("supplierId", value === "none" ? "" : value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "expense-supplier",
                          "aria-label": "Proveedor del gasto",
                          "data-ocid": "expenses.supplier_select",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sin proveedor" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sin proveedor" }),
                        suppliers.map((supplier) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectItem,
                          {
                            value: supplier.id.toString(),
                            children: supplier.name
                          },
                          supplier.id.toString()
                        ))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-amount", children: "Monto (COP)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "expense-amount",
                    inputMode: "decimal",
                    value: form.amount,
                    onChange: (event) => update("amount", event.target.value),
                    placeholder: "0.00",
                    className: "data-rail",
                    "data-ocid": "expenses.amount_input",
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-tax", children: "Impuesto (COP)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "expense-tax",
                    inputMode: "decimal",
                    value: form.tax,
                    onChange: (event) => update("tax", event.target.value),
                    placeholder: "0.00",
                    className: "data-rail",
                    "data-ocid": "expenses.tax_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-method", children: "Método de pago" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: form.paymentMethod,
                    onValueChange: (value) => update("paymentMethod", value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "expense-method",
                          "aria-label": "Método de pago",
                          "data-ocid": "expenses.method_select",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: paymentMethodLabel(option) }, option)) })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "expense-receipt", children: "Comprobante adjunto" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    ref: fileInputRef,
                    id: "expense-receipt",
                    type: "file",
                    accept: "image/*,application/pdf",
                    onChange: handleFileChange,
                    className: "sr-only",
                    "data-ocid": "expenses.receipt_input"
                  }
                ),
                form.receiptUrl === "" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      var _a;
                      return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                    },
                    disabled: uploading,
                    "data-ocid": "expenses.upload_button",
                    className: "flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-4 py-6 text-sm text-muted-foreground transition-smooth hover:border-primary/50 hover:bg-muted/50 disabled:opacity-60",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-4", "aria-hidden": "true" }),
                      uploading ? `Subiendo… ${uploadProgress}%` : "Subir comprobante (imagen o PDF)"
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "expenses.receipt_preview",
                    className: "flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-card", children: isImageFile(form.receiptName) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: form.receiptUrl,
                          alt: "Vista previa del comprobante",
                          className: "size-full object-cover"
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                        FileText,
                        {
                          className: "size-4 text-muted-foreground",
                          "aria-hidden": "true"
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 flex-1 truncate text-sm", children: form.receiptName }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "sm",
                          onClick: clearReceipt,
                          "aria-label": "Quitar comprobante",
                          "data-ocid": "expenses.remove_receipt_button",
                          className: "gap-1.5 text-muted-foreground",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5", "aria-hidden": "true" }),
                            "Quitar"
                          ]
                        }
                      )
                    ]
                  }
                )
              ] })
            ] }),
            error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "expenses.form_error",
                className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                children: error
              }
            ) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => onOpenChange(false),
                  "data-ocid": "expenses.cancel_button",
                  children: "Cancelar"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "submit",
                  disabled: isPending || uploading,
                  "data-ocid": "expenses.submit_button",
                  children: isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Registrar gasto"
                }
              )
            ] })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ExpenseCategoryDialog,
      {
        open: categoriesOpen,
        onOpenChange: setCategoriesOpen
      }
    )
  ] });
}
function TableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, index) => `expense-row-${index}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "expenses.loading_state", className: "space-y-2 p-4", children: rows.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)) });
}
function ExpensesPage() {
  var _a, _b;
  const [search, setSearch] = reactExports.useState("");
  const [categoryId, setCategoryId] = reactExports.useState("all");
  const [paymentMethod, setPaymentMethod] = reactExports.useState("all");
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [categoriesOpen, setCategoriesOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const fromTimestamp = reactExports.useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = reactExports.useMemo(() => colombiaEndOfDay(to), [to]);
  const categoriesQuery = useExpenseCategories({ search: "" });
  const categories = categoriesQuery.data ?? [];
  const expensesQuery = useExpenses({
    search,
    categoryId: categoryId === "all" ? null : categoryId,
    paymentMethod: paymentMethod === "all" ? null : paymentMethod,
    from: fromTimestamp,
    to: toTimestamp,
    page,
    pageSize: PAGE_SIZE
  });
  const summaryFilter = reactExports.useMemo(
    () => ({
      categoryId: categoryId === "all" ? void 0 : categoryId,
      paymentMethod: paymentMethod === "all" ? void 0 : paymentMethod,
      from: fromTimestamp ?? void 0,
      to: toTimestamp ?? void 0
    }),
    [categoryId, paymentMethod, fromTimestamp, toTimestamp]
  );
  const summaryQuery = useExpenseSummary(summaryFilter);
  const deleteExpense = useDeleteExpense();
  const items = ((_a = expensesQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = expensesQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summary = summaryQuery.data ?? null;
  const hasFilters = search.trim() !== "" || categoryId !== "all" || paymentMethod !== "all" || from !== "" || to !== "";
  const clearFilters = reactExports.useCallback(() => {
    setSearch("");
    setCategoryId("all");
    setPaymentMethod("all");
    setFrom("");
    setTo("");
    setPage(1);
  }, []);
  const openCreate = reactExports.useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);
  const openEdit = reactExports.useCallback((expense) => {
    setEditing(expense);
    setDialogOpen(true);
  }, []);
  const handleDelete = reactExports.useCallback(
    (expense) => {
      deleteExpense.mutate(expense.id, {
        onSuccess: () => ue.success("Gasto eliminado"),
        onError: () => ue.error("No se pudo eliminar el gasto.")
      });
    },
    [deleteExpense]
  );
  const columns = reactExports.useMemo(
    () => [
      {
        key: "date",
        header: "Fecha",
        render: (expense) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: formatDate(expense.date) })
      },
      {
        key: "concept",
        header: "Concepto",
        render: (expense) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 max-w-[280px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: expense.concept }),
          expense.receiptUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: expense.receiptUrl,
              target: "_blank",
              rel: "noreferrer",
              className: "mt-0.5 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Paperclip, { className: "size-3", "aria-hidden": "true" }),
                "Ver comprobante"
              ]
            }
          ) : null
        ] })
      },
      {
        key: "category",
        header: "Categoría",
        render: (expense) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: expense.categoryName })
      },
      {
        key: "supplier",
        header: "Proveedor",
        render: (expense) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[180px] truncate text-muted-foreground", children: expense.supplierName ?? "—" })
      },
      {
        key: "paymentMethod",
        header: "Método",
        render: (expense) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: paymentMethodLabel(expense.paymentMethod) })
      },
      {
        key: "tax",
        header: "Impuesto",
        numeric: true,
        render: (expense) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: formatMoney(expense.tax) })
      },
      {
        key: "amount",
        header: "Monto",
        numeric: true,
        render: (expense) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold", children: formatMoney(expense.amount) })
      }
    ],
    []
  );
  const actions = reactExports.useMemo(
    () => [
      {
        kind: "edit",
        label: "Editar gasto",
        onClick: openEdit
      },
      {
        kind: "delete",
        label: "Eliminar gasto",
        onClick: handleDelete
      }
    ],
    [openEdit, handleDelete]
  );
  const categoryTotals = (summary == null ? void 0 : summary.byCategory) ?? [];
  const maxCategoryTotal = categoryTotals.reduce(
    (max, entry) => entry.total > max ? entry.total : max,
    0n
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "expenses.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Gastos",
            description: "Registro de gastos operativos por categoría y periodo. Alimentan automáticamente el módulo de Contabilidad.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setCategoriesOpen(true),
                  "data-ocid": "expenses.manage_categories_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Tags, { className: "size-4", "aria-hidden": "true" }),
                    "Categorías"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: openCreate,
                  "data-ocid": "expenses.create_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                    "Registrar gasto"
                  ]
                }
              )
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "expenses.kpi.section",
            "aria-label": "Totales del periodo",
            className: "grid gap-4 sm:grid-cols-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-primary"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Total del periodo" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: summaryQuery.isLoading ? "—" : formatMoney((summary == null ? void 0 : summary.total) ?? 0n) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: hasFilters ? "Con los filtros aplicados" : "Todos los gastos" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-warning"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Gastos registrados" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: summaryQuery.isLoading ? "—" : formatNumber((summary == null ? void 0 : summary.count) ?? 0n) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Movimientos en el periodo" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-success"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Categorías con gasto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: summaryQuery.isLoading ? "—" : categoryTotals.length }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Desglose por categoría" })
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "section",
          {
            "data-ocid": "expenses.filters",
            className: "rounded-lg border border-border bg-card p-3 shadow-subtle",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[220px] flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Search,
                  {
                    className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "search",
                    value: search,
                    onChange: (event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    },
                    placeholder: "Buscar por concepto o proveedor…",
                    "aria-label": "Buscar gastos",
                    className: "pl-9",
                    "data-ocid": "expenses.search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "expenses-category",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Categoría"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: categoryId === "all" ? "all" : categoryId.toString(),
                    onValueChange: (value) => {
                      setCategoryId(value === "all" ? "all" : BigInt(value));
                      setPage(1);
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "expenses-category",
                          "aria-label": "Filtrar por categoría",
                          "data-ocid": "expenses.category_filter",
                          className: "w-[170px]",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas" }),
                        categories.map((usage) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectItem,
                          {
                            value: usage.category.id.toString(),
                            children: usage.category.name
                          },
                          usage.category.id.toString()
                        ))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "expenses-method",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Método"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: paymentMethod,
                    onValueChange: (value) => {
                      setPaymentMethod(value);
                      setPage(1);
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "expenses-method",
                          "aria-label": "Filtrar por método de pago",
                          "data-ocid": "expenses.method_filter",
                          className: "w-[160px]",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos" }),
                        PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: paymentMethodLabel(option) }, option))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "expenses-from",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Desde"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "expenses-from",
                    type: "date",
                    value: from,
                    onChange: (event) => {
                      setFrom(event.target.value);
                      setPage(1);
                    },
                    className: "data-rail w-[160px]",
                    "data-ocid": "expenses.date_from_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "expenses-to",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Hasta"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "expenses-to",
                    type: "date",
                    value: to,
                    onChange: (event) => {
                      setTo(event.target.value);
                      setPage(1);
                    },
                    className: "data-rail w-[160px]",
                    "data-ocid": "expenses.date_to_input"
                  }
                )
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: clearFilters,
                  "data-ocid": "expenses.clear_filters_button",
                  className: "gap-2 text-muted-foreground",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                    "Limpiar"
                  ]
                }
              ) : null
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "min-w-0 space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: expensesQuery.isLoading ? "Cargando…" : `${formatNumber(total)} gasto${total === 1 ? "" : "s"}` }) }),
            expensesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "expenses.error_state",
                className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "size-6 text-destructive",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar los gastos." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: () => void expensesQuery.refetch({ cancelRefetch: true }),
                      "data-ocid": "expenses.retry_button",
                      children: "Reintentar"
                    }
                  )
                ]
              }
            ) : expensesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "expenses.empty_state",
                className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Receipt,
                    {
                      className: "size-5 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay gastos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta la búsqueda o los filtros para encontrar gastos." : "Registra el primer gasto operativo para alimentar el módulo de Contabilidad." })
                  ] }),
                  hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: clearFilters,
                      "data-ocid": "expenses.empty_clear_button",
                      children: "Limpiar filtros"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      onClick: openCreate,
                      "data-ocid": "expenses.empty_create_button",
                      className: "gap-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                        "Registrar gasto"
                      ]
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                columns,
                rows: items,
                rowKey: (expense) => expense.id.toString(),
                actions,
                ocid: "expenses",
                caption: "Gastos operativos"
              }
            ),
            !expensesQuery.isLoading && !expensesQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                "Página ",
                page,
                " de ",
                totalPages
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    disabled: page <= 1,
                    onClick: () => setPage((current) => Math.max(1, current - 1)),
                    "data-ocid": "expenses.pagination_prev",
                    className: "gap-1",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4", "aria-hidden": "true" }),
                      "Anterior"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    disabled: page >= totalPages,
                    onClick: () => setPage((current) => Math.min(totalPages, current + 1)),
                    "data-ocid": "expenses.pagination_next",
                    className: "gap-1",
                    children: [
                      "Siguiente",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
                    ]
                  }
                )
              ] })
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "aside",
            {
              "data-ocid": "expenses.category_panel",
              "aria-label": "Totales por categoría",
              className: "space-y-3",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-border px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Wallet,
                    {
                      className: "size-4 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Totales por categoría" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3 px-4 py-4", children: summaryQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: Array.from(
                  { length: 4 },
                  (_, index) => `category-skeleton-${index}`
                ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-full" }, id)) }) : categoryTotals.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "expenses.category_empty_state",
                    className: "py-4 text-center text-xs text-muted-foreground",
                    children: "Sin gastos en el periodo seleccionado."
                  }
                ) : categoryTotals.map((entry) => {
                  const share = maxCategoryTotal > 0n ? Number(entry.total * 100n / maxCategoryTotal) : 0;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "div",
                    {
                      "data-ocid": `expenses.category_item.${entry.categoryId.toString()}`,
                      className: "space-y-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs text-muted-foreground", children: entry.categoryName }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 text-xs font-semibold", children: formatMoney(entry.total) })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "div",
                          {
                            className: "h-1.5 overflow-hidden rounded-full bg-muted",
                            role: "presentation",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                className: cn(
                                  "h-full rounded-full bg-primary transition-smooth"
                                ),
                                style: { width: `${Math.max(share, 2)}%` }
                              }
                            )
                          }
                        )
                      ]
                    },
                    entry.categoryId.toString()
                  );
                }) })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ExpenseDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            expense: editing
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ExpenseCategoryDialog,
          {
            open: categoriesOpen,
            onOpenChange: setCategoriesOpen
          }
        )
      ]
    }
  );
}
export {
  ExpensesPage,
  ExpensesPage as default
};
