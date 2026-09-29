import { t as reactExports, j as jsxRuntimeExports, B as Button, T as TriangleAlert, an as ShieldCheck, k as useBackend, l as useAuth, m as useQuery, bk as RoleKind, Z as cn, z as formatDate, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, w as Input, a3 as DialogFooter, ao as useQueryClient, ap as useMutation, av as ue } from "./index-EqGEeyjs.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { C as Checkbox } from "./checkbox-BNL-r_nI.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { L as Lock } from "./lock-BMYeStMW.js";
import { P as Pencil } from "./pencil-BajrtuU3.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { C as Check } from "./check-LdjEv5O-.js";
import "./index-DDy-lNY6.js";
const MODULE_GROUPS = [
  {
    id: "panel",
    label: "Panel",
    modules: [{ key: "dashboard", label: "Resumen operativo" }]
  },
  {
    id: "taller",
    label: "Taller",
    modules: [
      { key: "workshop", label: "Órdenes de taller" },
      { key: "appointments", label: "Citas" },
      { key: "technicians", label: "Técnicos" }
    ]
  },
  {
    id: "catalogo",
    label: "Catálogo",
    modules: [
      { key: "inventory", label: "Inventario" },
      { key: "services", label: "Servicios" },
      { key: "serviceCategories", label: "Categorías de servicios" },
      { key: "customers", label: "Clientes y motos" },
      { key: "motorcycles", label: "Motocicletas" },
      { key: "suppliers", label: "Proveedores" }
    ]
  },
  {
    id: "ventas",
    label: "Ventas",
    modules: [
      { key: "quotes", label: "Cotizaciones" },
      { key: "billing", label: "Facturas" },
      { key: "pos", label: "POS mostrador" }
    ]
  },
  {
    id: "compras",
    label: "Compras",
    modules: [
      { key: "purchases", label: "Compras" },
      { key: "supplierOrders", label: "Pedidos a proveedor" },
      { key: "purchaseInvoices", label: "Facturas de compra" },
      { key: "payables", label: "Cuentas por pagar" }
    ]
  },
  {
    id: "administracion",
    label: "Administración",
    modules: [
      { key: "company", label: "Empresa" },
      { key: "expenses", label: "Gastos" },
      { key: "expenseCategories", label: "Categorías de gastos" },
      { key: "commissions", label: "Comisiones y préstamos" },
      { key: "accounting", label: "Contabilidad" },
      { key: "cash", label: "Caja y bancos" },
      { key: "receivables", label: "Cuentas por cobrar" },
      { key: "users", label: "Usuarios" },
      { key: "roles", label: "Roles" },
      { key: "settings", label: "Configuración" }
    ]
  }
];
const MODULE_LABELS = new Map(
  MODULE_GROUPS.flatMap(
    (group) => group.modules.map((module) => [module.key, module.label])
  )
);
function moduleLabel(key) {
  return MODULE_LABELS.get(key) ?? key;
}
function roleBadgeTone(role) {
  if (role.kind === RoleKind.custom) return "custom";
  const normalized = role.name.trim().toLowerCase();
  if (normalized === "administrador") return "admin";
  if (normalized === "mecánico" || normalized === "mecanico") return "mechanic";
  if (normalized === "invitado") return "guest";
  return "custom";
}
function isBuiltin(role) {
  return role.kind === RoleKind.builtin;
}
function roleErrorMessage(error) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.includes("El rol está asignado a uno o más usuarios")) {
    return "No se puede eliminar: hay usuarios asignados a este rol. Reasigna esos usuarios antes de eliminarlo.";
  }
  if (raw.includes("Ya existe un rol con el nombre")) {
    return "Ya existe un rol con ese nombre. Elige un nombre diferente.";
  }
  if (raw.includes("No autorizado") || raw.includes("no autorizado")) {
    return "No tienes permisos para administrar roles.";
  }
  if (raw.includes("no existe") || raw.includes("No existe")) {
    return "El rol ya no existe. Actualiza la lista e intenta de nuevo.";
  }
  if (raw.includes("inválido") || raw.includes("inválida")) {
    return "Revisa el nombre y selecciona al menos un módulo permitido.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}
function useRoles() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRoles(token);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateRole() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createRole(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    }
  });
}
function useUpdateRole() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateRole(token, roleId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    }
  });
}
function useDeleteRole() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteRole(token, roleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    }
  });
}
function ModulePicker({
  selected,
  onToggle,
  disabled
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-ocid": "roles.module_picker",
      className: "scroll-slim max-h-[42vh] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/30 p-3",
      children: MODULE_GROUPS.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: group.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-1.5 sm:grid-cols-2", children: group.modules.map((module) => {
          const checked = selected.includes(module.key);
          const inputId = `role-module-${module.key}`;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "label",
            {
              htmlFor: inputId,
              className: cn(
                "flex cursor-pointer items-center gap-2 rounded-sm border border-transparent px-2 py-1.5 text-sm transition-smooth",
                checked && "border-primary/30 bg-primary/5",
                disabled && "cursor-not-allowed opacity-60"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Checkbox,
                  {
                    id: inputId,
                    checked,
                    disabled,
                    onCheckedChange: (value) => onToggle(module.key, value === true),
                    "data-ocid": `roles.module_checkbox.${module.key}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate", children: module.label })
              ]
            },
            module.key
          );
        }) })
      ] }, group.id))
    }
  );
}
function RoleFormDialog({
  open,
  onOpenChange,
  editing
}) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const [form, setForm] = reactExports.useState({ name: "", modules: [] });
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      editing ? { name: editing.name, modules: [...editing.modules] } : { name: "", modules: [] }
    );
  }, [open, editing]);
  const isPending = createRole.isPending || updateRole.isPending;
  const toggleModule = (key, checked) => {
    setForm((current) => ({
      ...current,
      modules: checked ? [...current.modules, key] : current.modules.filter((entry) => entry !== key)
    }));
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("El nombre del rol es obligatorio.");
      return;
    }
    if (form.modules.length === 0) {
      setError("Selecciona al menos un módulo permitido.");
      return;
    }
    setError(null);
    const input = { name, modules: form.modules };
    const onError = (mutationError) => setError(roleErrorMessage(mutationError));
    if (editing) {
      updateRole.mutate(
        { roleId: editing.id, input },
        {
          onSuccess: () => {
            ue.success("Rol actualizado");
            onOpenChange(false);
          },
          onError
        }
      );
    } else {
      createRole.mutate(input, {
        onSuccess: () => {
          ue.success("Rol creado");
          onOpenChange(false);
        },
        onError
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "roles.form_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: editing ? "Editar rol" : "Crear rol" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: editing ? "Renombra el rol y ajusta los módulos que habilita." : "Define un nombre y marca los módulos que este rol podrá usar." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "role-name", className: "field-label", children: "Nombre del rol" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "role-name",
                value: form.name,
                onChange: (event) => setForm((current) => ({ ...current, name: event.target.value })),
                placeholder: "Jefe de taller",
                autoComplete: "off",
                "data-ocid": "roles.name_input",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-label", children: "Módulos permitidos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ModulePicker,
              {
                selected: form.modules,
                onToggle: toggleModule,
                disabled: isPending
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-hint", children: form.modules.length === 0 ? "Sin módulos seleccionados." : `${form.modules.length} módulo${form.modules.length === 1 ? "" : "s"} seleccionado${form.modules.length === 1 ? "" : "s"}.` })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              "data-ocid": "roles.form_error",
              className: "flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "mt-0.5 size-4 shrink-0",
                    "aria-hidden": "true"
                  }
                ),
                error
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => onOpenChange(false),
                "data-ocid": "roles.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: isPending,
                "data-ocid": "roles.submit_button",
                className: "gap-2",
                children: [
                  editing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  isPending ? "Guardando…" : editing ? "Guardar cambios" : "Crear rol"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function DeleteRoleDialog({
  role,
  onOpenChange
}) {
  const deleteRole = useDeleteRole();
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (role) setError(null);
  }, [role]);
  const handleConfirm = () => {
    if (!role) return;
    deleteRole.mutate(role.id, {
      onSuccess: () => {
        ue.success("Rol eliminado");
        onOpenChange(false);
      },
      onError: (mutationError) => {
        const message = roleErrorMessage(mutationError);
        setError(message);
        ue.error(message);
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: role !== null, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "roles.delete_dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Eliminar rol" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
        "¿Eliminar el rol",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: role == null ? void 0 : role.name }),
        "? Esta acción no se puede deshacer."
      ] })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "p",
      {
        "data-ocid": "roles.delete_error",
        className: "flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "mt-0.5 size-4 shrink-0",
              "aria-hidden": "true"
            }
          ),
          error
        ]
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => onOpenChange(false),
          "data-ocid": "roles.delete_cancel_button",
          children: "Cancelar"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          disabled: deleteRole.isPending,
          onClick: handleConfirm,
          "data-ocid": "roles.delete_confirm_button",
          className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          children: deleteRole.isPending ? "Eliminando…" : "Eliminar"
        }
      )
    ] })
  ] }) });
}
function RoleCard({
  role,
  onEdit,
  onDelete
}) {
  const builtin = isBuiltin(role);
  const tone = roleBadgeTone(role);
  const modules = role.modules;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "li",
    {
      "data-ocid": `roles.item.${role.id.toString()}`,
      className: cn(
        "relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle",
        builtin && "bg-muted/30"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            "aria-hidden": "true",
            className: cn(
              "absolute inset-y-0 left-0 w-0.5 rounded-l-lg",
              tone === "admin" && "bg-primary",
              tone === "mechanic" && "bg-accent",
              tone === "guest" && "bg-muted-foreground",
              tone === "custom" && "bg-info"
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "truncate font-display text-base font-semibold tracking-tight", children: role.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge-role", "data-role": tone, children: tone === "admin" ? "Administrador" : tone === "mechanic" ? "Mecánico" : tone === "guest" ? "Invitado" : "Personalizado" }),
              builtin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "size-3", "aria-hidden": "true" }),
                "Integrado"
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] tabular-nums text-muted-foreground", children: [
              "Creado el ",
              formatDate(role.createdAt)
            ] })
          ] }),
          builtin ? null : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                title: "Editar rol",
                "aria-label": `Editar rol ${role.name}`,
                onClick: () => onEdit(role),
                "data-ocid": `roles.edit_button.${role.id.toString()}`,
                className: "row-action",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5", "aria-hidden": "true" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                title: "Eliminar rol",
                "aria-label": `Eliminar rol ${role.name}`,
                onClick: () => onDelete(role),
                "data-ocid": `roles.delete_button.${role.id.toString()}`,
                className: "row-action",
                "data-variant": "destructive",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5", "aria-hidden": "true" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: modules.length === 0 ? "Sin módulos permitidos" : `${modules.length} módulo${modules.length === 1 ? "" : "s"} permitido${modules.length === 1 ? "" : "s"}` }),
          modules.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "flex flex-wrap gap-1.5", children: modules.map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "li",
            {
              className: "rounded-sm border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground",
              children: moduleLabel(key)
            },
            key
          )) }) : null
        ] }),
        builtin ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Rol integrado del sistema: no se puede renombrar ni eliminar." }) : null
      ]
    }
  );
}
const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, index) => `role-skeleton-${index}`
);
function RolesPage() {
  const rolesQuery = useRoles();
  const [formOpen, setFormOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const roles = reactExports.useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const builtinRoles = reactExports.useMemo(() => roles.filter(isBuiltin), [roles]);
  const customRoles = reactExports.useMemo(
    () => roles.filter((role) => !isBuiltin(role)),
    [roles]
  );
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (role) => {
    setEditing(role);
    setFormOpen(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "roles.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Roles",
            description: "Administra los roles del taller y los módulos que cada uno habilita. Los roles integrados no se pueden modificar; los roles personalizados se pueden crear, editar y eliminar cuando no estén asignados a ningún usuario.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: openCreate,
                "data-ocid": "roles.create_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Crear rol"
                ]
              }
            )
          }
        ),
        rolesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "roles.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-10 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-5 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: "No se pudieron cargar los roles." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => void rolesQuery.refetch(),
                  "data-ocid": "roles.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : rolesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "roles.loading_state", className: "space-y-3", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-32 w-full rounded-lg" }, id)) }) : roles.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "roles.empty_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-10 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                ShieldCheck,
                {
                  className: "size-5 text-muted-foreground",
                  "aria-hidden": "true"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Aún no hay roles configurados" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Crea el primer rol personalizado para asignar módulos específicos a los usuarios del taller." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  size: "sm",
                  onClick: openCreate,
                  "data-ocid": "roles.empty_create_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                    "Crear rol"
                  ]
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold tracking-tight", children: "Roles integrados" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs tabular-nums text-muted-foreground", children: builtinRoles.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Roles del sistema con permisos predefinidos. No se pueden renombrar ni eliminar." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "ul",
              {
                "data-ocid": "roles.builtin_list",
                className: "grid gap-3 lg:grid-cols-2",
                children: builtinRoles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  RoleCard,
                  {
                    role,
                    onEdit: openEdit,
                    onDelete: setPendingDelete
                  },
                  role.id.toString()
                ))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold tracking-tight", children: "Roles personalizados" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs tabular-nums text-muted-foreground", children: customRoles.length })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Roles creados por el administrador. Se pueden editar y eliminar mientras no estén asignados a ningún usuario." }),
            customRoles.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "roles.custom_empty_state",
                className: "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ShieldCheck,
                    {
                      className: "size-5 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Aún no hay roles personalizados." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      onClick: openCreate,
                      "data-ocid": "roles.custom_empty_create_button",
                      className: "gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                        "Crear rol"
                      ]
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "ul",
              {
                "data-ocid": "roles.custom_list",
                className: "grid gap-3 lg:grid-cols-2",
                children: customRoles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  RoleCard,
                  {
                    role,
                    onEdit: openEdit,
                    onDelete: setPendingDelete
                  },
                  role.id.toString()
                ))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          RoleFormDialog,
          {
            open: formOpen,
            onOpenChange: (open) => {
              setFormOpen(open);
              if (!open) setEditing(null);
            },
            editing
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DeleteRoleDialog,
          {
            role: pendingDelete,
            onOpenChange: (open) => {
              if (!open) setPendingDelete(null);
            }
          }
        )
      ]
    }
  );
}
export {
  RolesPage,
  RolesPage as default
};
