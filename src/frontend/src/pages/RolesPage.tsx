import type { Role, RoleInput } from "@/backend";
import { RoleKind } from "@/backend";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/* ---------------------------------------------------------------------------
 * Module catalog — the English backend module keys mapped to Spanish labels,
 * grouped by the six navigation flows so the picker reads like the sidebar.
 * ------------------------------------------------------------------------- */

interface ModuleOption {
  key: string;
  label: string;
}

interface ModuleGroup {
  id: string;
  label: string;
  modules: ModuleOption[];
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: "panel",
    label: "Panel",
    modules: [{ key: "dashboard", label: "Resumen operativo" }],
  },
  {
    id: "taller",
    label: "Taller",
    modules: [
      { key: "workshop", label: "Órdenes de taller" },
      { key: "appointments", label: "Citas" },
      { key: "technicians", label: "Técnicos" },
    ],
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
      { key: "suppliers", label: "Proveedores" },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    modules: [
      { key: "quotes", label: "Cotizaciones" },
      { key: "billing", label: "Facturas" },
      { key: "pos", label: "POS mostrador" },
    ],
  },
  {
    id: "compras",
    label: "Compras",
    modules: [
      { key: "purchases", label: "Compras" },
      { key: "supplierOrders", label: "Pedidos a proveedor" },
      { key: "purchaseInvoices", label: "Facturas de compra" },
      { key: "payables", label: "Cuentas por pagar" },
    ],
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
      { key: "settings", label: "Configuración" },
    ],
  },
];

/** Flat lookup from module key to its Spanish label. */
const MODULE_LABELS = new Map<string, string>(
  MODULE_GROUPS.flatMap((group) =>
    group.modules.map((module) => [module.key, module.label] as const),
  ),
);

/** Spanish label for a module key, falling back to the raw key. */
function moduleLabel(key: string): string {
  return MODULE_LABELS.get(key) ?? key;
}

/* ---------------------------------------------------------------------------
 * Role presentation helpers.
 * ------------------------------------------------------------------------- */

type RoleBadgeTone = "admin" | "mechanic" | "guest" | "custom";

/**
 * Maps a role to one of the four badge tones. Built-in roles are identified by
 * their Spanish name; every custom role renders as `custom` — the role name
 * carries the identity, the badge color stays within the four-tone system.
 */
function roleBadgeTone(role: Role): RoleBadgeTone {
  if (role.kind === RoleKind.custom) return "custom";
  const normalized = role.name.trim().toLowerCase();
  if (normalized === "administrador") return "admin";
  if (normalized === "mecánico" || normalized === "mecanico") return "mechanic";
  if (normalized === "invitado") return "guest";
  return "custom";
}

/** True when the role is one of the three built-in roles. */
function isBuiltin(role: Role): boolean {
  return role.kind === RoleKind.builtin;
}

/**
 * Translates a backend role failure into a Spanish message. The backend traps
 * with Spanish prose (Runtime.trap), not English tokens, so the matchers below
 * look for the actual Spanish substrings it emits.
 */
function roleErrorMessage(error: unknown): string {
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

/* ---------------------------------------------------------------------------
 * Data hooks — listRoles plus the three admin write endpoints. Every write
 * receives the session token (null on the Internet Identity admin path).
 * ------------------------------------------------------------------------- */

function useRoles() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["roles"],
    queryFn: async (): Promise<Role[]> => {
      if (!actor) return [];
      return actor.listRoles(token);
    },
    enabled: !!actor && !isFetching,
  });
}

function useCreateRole() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoleInput): Promise<Role> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createRole(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

function useUpdateRole() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      input,
    }: {
      roleId: bigint;
      input: RoleInput;
    }): Promise<Role> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateRole(token, roleId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

function useDeleteRole() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: bigint): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteRole(token, roleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

/* ---------------------------------------------------------------------------
 * Module picker — checkbox list grouped by flow.
 * ------------------------------------------------------------------------- */

function ModulePicker({
  selected,
  onToggle,
  disabled,
}: {
  selected: string[];
  onToggle: (key: string, checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div
      data-ocid="roles.module_picker"
      className="scroll-slim max-h-[42vh] space-y-3 overflow-y-auto rounded-md border border-border bg-muted/30 p-3"
    >
      {MODULE_GROUPS.map((group) => (
        <fieldset key={group.id} className="space-y-1.5">
          <legend className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {group.label}
          </legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {group.modules.map((module) => {
              const checked = selected.includes(module.key);
              const inputId = `role-module-${module.key}`;
              return (
                <label
                  key={module.key}
                  htmlFor={inputId}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm border border-transparent px-2 py-1.5 text-sm transition-smooth",
                    checked && "border-primary/30 bg-primary/5",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) =>
                      onToggle(module.key, value === true)
                    }
                    data-ocid={`roles.module_checkbox.${module.key}`}
                  />
                  <span className="min-w-0 truncate">{module.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Create / edit dialog.
 * ------------------------------------------------------------------------- */

interface RoleFormState {
  name: string;
  modules: string[];
}

function RoleFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Role | null;
}) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const [form, setForm] = useState<RoleFormState>({ name: "", modules: [] });
  const [error, setError] = useState<string | null>(null);

  // Initialize the draft once per open, from the role being edited.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      editing
        ? { name: editing.name, modules: [...editing.modules] }
        : { name: "", modules: [] },
    );
  }, [open, editing]);

  const isPending = createRole.isPending || updateRole.isPending;

  const toggleModule = (key: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      modules: checked
        ? [...current.modules, key]
        : current.modules.filter((entry) => entry !== key),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
    const input: RoleInput = { name, modules: form.modules };
    const onError = (mutationError: unknown) =>
      setError(roleErrorMessage(mutationError));

    if (editing) {
      updateRole.mutate(
        { roleId: editing.id, input },
        {
          onSuccess: () => {
            toast.success("Rol actualizado");
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      createRole.mutate(input, {
        onSuccess: () => {
          toast.success("Rol creado");
          onOpenChange(false);
        },
        onError,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="roles.form_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Editar rol" : "Crear rol"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Renombra el rol y ajusta los módulos que habilita."
              : "Define un nombre y marca los módulos que este rol podrá usar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name" className="field-label">
              Nombre del rol
            </Label>
            <Input
              id="role-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Jefe de taller"
              autoComplete="off"
              data-ocid="roles.name_input"
              required
            />
          </div>

          <div className="space-y-1.5">
            <p className="field-label">Módulos permitidos</p>
            <ModulePicker
              selected={form.modules}
              onToggle={toggleModule}
              disabled={isPending}
            />
            <p className="field-hint">
              {form.modules.length === 0
                ? "Sin módulos seleccionados."
                : `${form.modules.length} módulo${form.modules.length === 1 ? "" : "s"} seleccionado${form.modules.length === 1 ? "" : "s"}.`}
            </p>
          </div>

          {error ? (
            <p
              data-ocid="roles.form_error"
              className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="roles.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="roles.submit_button"
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
                  : "Crear rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------------------
 * Delete confirmation dialog.
 * ------------------------------------------------------------------------- */

function DeleteRoleDialog({
  role,
  onOpenChange,
}: {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteRole = useDeleteRole();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) setError(null);
  }, [role]);

  const handleConfirm = () => {
    if (!role) return;
    deleteRole.mutate(role.id, {
      onSuccess: () => {
        toast.success("Rol eliminado");
        onOpenChange(false);
      },
      onError: (mutationError) => {
        const message = roleErrorMessage(mutationError);
        setError(message);
        toast.error(message);
      },
    });
  };

  return (
    <Dialog open={role !== null} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="roles.delete_dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Eliminar rol</DialogTitle>
          <DialogDescription>
            ¿Eliminar el rol{" "}
            <span className="font-medium text-foreground">{role?.name}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p
            data-ocid="roles.delete_error"
            className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="roles.delete_cancel_button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={deleteRole.isPending}
            onClick={handleConfirm}
            data-ocid="roles.delete_confirm_button"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRole.isPending ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------------------
 * Role card.
 * ------------------------------------------------------------------------- */

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}) {
  const builtin = isBuiltin(role);
  const tone = roleBadgeTone(role);
  const modules = role.modules;

  return (
    <li
      data-ocid={`roles.item.${role.id.toString()}`}
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle",
        builtin && "bg-muted/30",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-0.5 rounded-l-lg",
          tone === "admin" && "bg-primary",
          tone === "mechanic" && "bg-accent",
          tone === "guest" && "bg-muted-foreground",
          tone === "custom" && "bg-info",
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-base font-semibold tracking-tight">
              {role.name}
            </h3>
            <span className="badge-role" data-role={tone}>
              {tone === "admin"
                ? "Administrador"
                : tone === "mechanic"
                  ? "Mecánico"
                  : tone === "guest"
                    ? "Invitado"
                    : "Personalizado"}
            </span>
            {builtin ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Lock className="size-3" aria-hidden="true" />
                Integrado
              </span>
            ) : null}
          </div>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            Creado el {formatDate(role.createdAt)}
          </p>
        </div>

        {builtin ? null : (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              title="Editar rol"
              aria-label={`Editar rol ${role.name}`}
              onClick={() => onEdit(role)}
              data-ocid={`roles.edit_button.${role.id.toString()}`}
              className="row-action"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Eliminar rol"
              aria-label={`Eliminar rol ${role.name}`}
              onClick={() => onDelete(role)}
              data-ocid={`roles.delete_button.${role.id.toString()}`}
              className="row-action"
              data-variant="destructive"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {modules.length === 0
            ? "Sin módulos permitidos"
            : `${modules.length} módulo${modules.length === 1 ? "" : "s"} permitido${modules.length === 1 ? "" : "s"}`}
        </p>
        {modules.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {modules.map((key) => (
              <li
                key={key}
                className="rounded-sm border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
              >
                {moduleLabel(key)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {builtin ? (
        <p className="text-xs text-muted-foreground">
          Rol integrado del sistema: no se puede renombrar ni eliminar.
        </p>
      ) : null}
    </li>
  );
}

/* ---------------------------------------------------------------------------
 * Page.
 * ------------------------------------------------------------------------- */

const SKELETON_IDS = Array.from(
  { length: 3 },
  (_, index) => `role-skeleton-${index}`,
);

/**
 * Roles management surface at `/configuracion/roles`. Lists every role with its
 * allowed modules, keeps the three built-in roles read-only, and supports
 * creating, renaming/editing and deleting custom roles. Deleting a role that is
 * still assigned to a user is refused by the backend and surfaced in Spanish.
 */
export function RolesPage() {
  const rolesQuery = useRoles();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null);

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const builtinRoles = useMemo(() => roles.filter(isBuiltin), [roles]);
  const customRoles = useMemo(
    () => roles.filter((role) => !isBuiltin(role)),
    [roles],
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setFormOpen(true);
  };

  return (
    <div
      data-ocid="roles.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Roles"
        description="Administra los roles del taller y los módulos que cada uno habilita. Los roles integrados no se pueden modificar; los roles personalizados se pueden crear, editar y eliminar cuando no estén asignados a ningún usuario."
        actions={
          <Button
            type="button"
            onClick={openCreate}
            data-ocid="roles.create_button"
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Crear rol
          </Button>
        }
      />

      {rolesQuery.isError ? (
        <div
          data-ocid="roles.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-10 text-center"
        >
          <AlertTriangle
            className="size-5 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-destructive">
            No se pudieron cargar los roles.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void rolesQuery.refetch()}
            data-ocid="roles.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : rolesQuery.isLoading ? (
        <div data-ocid="roles.loading_state" className="space-y-3">
          {SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div
          data-ocid="roles.empty_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center"
        >
          <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted">
            <ShieldCheck
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="font-display text-sm font-semibold">
            Aún no hay roles configurados
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Crea el primer rol personalizado para asignar módulos específicos a
            los usuarios del taller.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            data-ocid="roles.empty_create_button"
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Crear rol
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Roles integrados
              </h2>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {builtinRoles.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Roles del sistema con permisos predefinidos. No se pueden
              renombrar ni eliminar.
            </p>
            <ul
              data-ocid="roles.builtin_list"
              className="grid gap-3 lg:grid-cols-2"
            >
              {builtinRoles.map((role) => (
                <RoleCard
                  key={role.id.toString()}
                  role={role}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Roles personalizados
              </h2>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {customRoles.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Roles creados por el administrador. Se pueden editar y eliminar
              mientras no estén asignados a ningún usuario.
            </p>
            {customRoles.length === 0 ? (
              <div
                data-ocid="roles.custom_empty_state"
                className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center"
              >
                <ShieldCheck
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Aún no hay roles personalizados.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openCreate}
                  data-ocid="roles.custom_empty_create_button"
                  className="gap-2"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Crear rol
                </Button>
              </div>
            ) : (
              <ul
                data-ocid="roles.custom_list"
                className="grid gap-3 lg:grid-cols-2"
              >
                {customRoles.map((role) => (
                  <RoleCard
                    key={role.id.toString()}
                    role={role}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <RoleFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
      />

      <DeleteRoleDialog
        role={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      />
    </div>
  );
}

export default RolesPage;
