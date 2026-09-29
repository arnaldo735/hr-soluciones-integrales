import type { Id, Role, UserListItem } from "@/backend";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
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
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useRole } from "@/hooks/use-role";
import { formatDate } from "@/lib/format";
import type { DataColumn, RowAction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 25;

const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, index) => `users-skeleton-${index}`,
);

/** Maps a role name to the design system's `.badge-role` data-role family. */
function roleTone(roleName: string): "admin" | "mechanic" | "guest" | "custom" {
  const normalized = roleName.trim().toLowerCase();
  if (normalized === "administrador" || normalized === "admin") return "admin";
  if (normalized === "mecánico" || normalized === "mecanico") return "mechanic";
  if (normalized === "invitado" || normalized === "guest") return "guest";
  return "custom";
}

/** Reads the backend error message, tolerating non-Error rejections. */
function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "";
}

/** True when the backend rejected the write because the username is taken. */
function isDuplicateUsername(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("duplicateusername") ||
    message.includes("ya existe") ||
    message.includes("repetido") ||
    message.includes("en uso")
  );
}

/** True when the backend refused to remove the caller's own admin account. */
function isOwnAdminError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes("cannotremoveownadmin") ||
    message.includes("propia cuenta") ||
    message.includes("propio usuario") ||
    message.includes("administrador")
  );
}

/** A temporary password revealed once after creating or resetting a user. */
interface TempPasswordReveal {
  username: string;
  name: string;
  password: string;
  /** "created" after a new user, "reset" after a password reset. */
  origin: "created" | "reset";
}

/** The amber one-time temporary-password panel. */
function TempPasswordPanel({
  reveal,
  onDismiss,
}: {
  reveal: TempPasswordReveal;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reveal.password);
      setCopied(true);
      toast.success("Contraseña temporal copiada");
    } catch {
      toast.error("No se pudo copiar. Selecciónala manualmente.");
    }
  };

  return (
    <section
      data-ocid="users.temp_password_panel"
      aria-live="polite"
      className="temp-password-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <KeyRound
            className="mt-0.5 size-4 shrink-0"
            style={{ color: "oklch(var(--temp-password))" }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="temp-password-label">
              {reveal.origin === "created"
                ? "Contraseña temporal del nuevo usuario"
                : "Nueva contraseña temporal"}
            </p>
            <p className="mt-1 text-sm text-foreground">
              <span className="font-medium">{reveal.name}</span>
              <span className="users-username"> · {reveal.username}</span>
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Cerrar el aviso de contraseña temporal"
          data-ocid="users.temp_password_close_button"
          className="shrink-0 text-muted-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code
          data-ocid="users.temp_password_value"
          className="temp-password-value flex-1"
        >
          {reveal.password}
        </code>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleCopy()}
          data-ocid="users.temp_password_copy_button"
          className="gap-2"
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? "Copiada" : "Copiar"}
        </Button>
      </div>

      <p className="temp-password-note">
        Esta contraseña se muestra una sola vez. Cópiala y entrégala al usuario
        ahora; no podrás volver a verla.
      </p>
    </section>
  );
}

/** Create-user dialog: nombre, usuario de acceso, rol y contraseña temporal. */
function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onCreated: (reveal: TempPasswordReveal) => void;
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setUsername("");
    // El rol por defecto es Mecánico (id 1), no el primero por id ascendente
    // (que sería Administrador). Así un usuario nuevo no queda como
    // administrador salvo que el administrador lo elija explícitamente.
    const defaultRole =
      roles.find((role) => role.id === 1n) ??
      roles.find((role) => role.id !== 0n);
    setRoleId(defaultRole?.id.toString() ?? "");
    setPassword("");
    setError(null);
  }, [open, roles]);

  const createUser = useMutation({
    mutationFn: async (input: {
      username: string;
      name: string;
      roleId: Id;
      temporaryPassword: string;
    }): Promise<UserListItem> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createUser(
        token,
        input.username,
        input.name,
        input.roleId,
        input.temporaryPassword,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedUsername || !roleId || !trimmedPassword) {
      setError("Completa el nombre, el usuario, el rol y la contraseña.");
      return;
    }
    if (trimmedPassword.length < 6) {
      setError("La contraseña temporal debe tener al menos 6 caracteres.");
      return;
    }

    setError(null);
    createUser.mutate(
      {
        username: trimmedUsername,
        name: trimmedName,
        roleId: BigInt(roleId),
        temporaryPassword: trimmedPassword,
      },
      {
        onSuccess: (created) => {
          onCreated({
            username: created.username,
            name: created.name,
            password: trimmedPassword,
            origin: "created",
          });
          toast.success("Usuario creado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            isDuplicateUsername(mutationError)
              ? "Ese usuario de acceso ya existe. Elige otro."
              : "No se pudo crear el usuario. Intenta de nuevo.",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="users.create_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Crear usuario</DialogTitle>
          <DialogDescription>
            Registra una persona con su usuario de acceso, rol y una contraseña
            temporal que deberás entregarle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-user-name">Nombre</Label>
            <Input
              id="new-user-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Juan Pérez"
              autoComplete="off"
              data-ocid="users.create_name_input"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-username">Usuario de acceso</Label>
            <Input
              id="new-user-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="juan.perez"
              autoComplete="off"
              className="data-rail"
              data-ocid="users.create_username_input"
              required
            />
            <p className="field-hint">
              Debe ser único. Con este usuario la persona iniciará sesión.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-role">Rol</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger
                id="new-user-role"
                aria-label="Rol del nuevo usuario"
                data-ocid="users.create_role_select"
              >
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem
                    key={role.id.toString()}
                    value={role.id.toString()}
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-password">Contraseña temporal</Label>
            <Input
              id="new-user-password"
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="off"
              className="data-rail"
              data-ocid="users.create_password_input"
              required
            />
            <p className="field-hint">
              Se mostrará una sola vez al crear el usuario para que la
              entregues.
            </p>
          </div>

          {error ? (
            <p
              data-ocid="users.create_error"
              role="alert"
              className="auth-alert"
              data-tone="error"
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
              disabled={createUser.isPending}
              data-ocid="users.create_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createUser.isPending}
              data-ocid="users.create_submit_button"
              className="gap-2"
            >
              {createUser.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              {createUser.isPending ? "Creando…" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Change-role dialog for a single user. */
function ChangeRoleDialog({
  user,
  roles,
  onOpenChange,
}: {
  user: UserListItem | null;
  roles: Role[];
  onOpenChange: (open: boolean) => void;
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setRoleId(user.roleId.toString());
    setError(null);
  }, [user]);

  const updateRole = useMutation({
    mutationFn: async (input: { userId: Id; roleId: Id }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateUserRole(token, input.userId, input.roleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !roleId) return;
    setError(null);
    updateRole.mutate(
      { userId: user.id, roleId: BigInt(roleId) },
      {
        onSuccess: () => {
          toast.success("Rol actualizado");
          onOpenChange(false);
        },
        onError: () => {
          setError("No se pudo actualizar el rol. Intenta de nuevo.");
        },
      },
    );
  };

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="users.role_dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Cambiar rol</DialogTitle>
          <DialogDescription>
            {user
              ? `Selecciona el nuevo rol para ${user.name} (${user.username}).`
              : "Selecciona el nuevo rol."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="change-role-select">Rol</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger
                id="change-role-select"
                aria-label="Nuevo rol del usuario"
                data-ocid="users.role_select"
              >
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem
                    key={role.id.toString()}
                    value={role.id.toString()}
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p
              data-ocid="users.role_error"
              role="alert"
              className="auth-alert"
              data-tone="error"
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
              disabled={updateRole.isPending}
              data-ocid="users.role_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateRole.isPending || !roleId}
              data-ocid="users.role_submit_button"
            >
              {updateRole.isPending ? "Guardando…" : "Guardar rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Delete confirmation that refuses to remove the caller's own admin account. */
function DeleteUserDialog({
  user,
  isSelf,
  onOpenChange,
  onDeleted,
}: {
  user: UserListItem | null;
  isSelf: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setError(null);
  }, [user]);

  const deleteUser = useMutation({
    mutationFn: async (userId: Id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteUser(token, userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    },
  });

  const handleConfirm = () => {
    if (!user) return;
    if (isSelf) {
      setError(
        "No puedes eliminar tu propia cuenta de administrador. Pide a otro administrador que lo haga.",
      );
      return;
    }
    setError(null);
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success("Usuario eliminado");
        onDeleted();
        onOpenChange(false);
      },
      onError: (mutationError) => {
        setError(
          isOwnAdminError(mutationError)
            ? "No puedes eliminar tu propia cuenta de administrador."
            : "No se pudo eliminar el usuario. Intenta de nuevo.",
        );
      },
    });
  };

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="users.delete_dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Eliminar usuario</DialogTitle>
          <DialogDescription>
            {user
              ? `¿Seguro que deseas eliminar a ${user.name} (${user.username})?`
              : "¿Seguro que deseas eliminar este usuario?"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-destructive">
            Esta acción no se puede deshacer. El usuario perderá el acceso al
            taller de forma permanente.
          </p>
        </div>

        {error ? (
          <p
            data-ocid="users.delete_error"
            role="alert"
            className="auth-alert"
            data-tone="error"
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
            disabled={deleteUser.isPending}
            data-ocid="users.delete_cancel_button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteUser.isPending}
            data-ocid="users.delete_confirm_button"
            className="gap-2"
          >
            {deleteUser.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {deleteUser.isPending ? "Eliminando…" : "Eliminar usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersPage() {
  const { actor, isFetching } = useBackend();
  const { token, user: sessionUser } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();

  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<UserListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [reveal, setReveal] = useState<TempPasswordReveal | null>(null);

  // Debounce the free-text term so typing stays responsive and the backend
  // receives one request per pause, not one per keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedTerm(term.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [term]);

  const usersQuery = useQuery({
    queryKey: ["users-page", debouncedTerm, page],
    queryFn: async () => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: BigInt(PAGE_SIZE) };
      }
      const offset = BigInt((page - 1) * PAGE_SIZE);
      return actor.listUsersPage(
        token,
        debouncedTerm.length > 0 ? debouncedTerm : null,
        offset,
        BigInt(PAGE_SIZE),
      );
    },
    enabled: !!actor && !isFetching,
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async (): Promise<Role[]> => {
      if (!actor) return [];
      return actor.listRoles(token);
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const roles = rolesQuery.data ?? [];
  const items = usersQuery.data?.items ?? [];
  const total = Number(usersQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasSearch = debouncedTerm !== "";

  const setActive = useMutation({
    mutationFn: async (input: { userId: Id; active: boolean }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setUserActive(token, input.userId, input.active);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (user: UserListItem) => {
      if (!actor) throw new Error("Backend no disponible");
      const result = await actor.resetUserPassword(token, user.id);
      return { result, user };
    },
    onSuccess: ({ result, user }) => {
      setReveal({
        username: user.username,
        name: user.name,
        password: result.temporaryPassword,
        origin: "reset",
      });
      toast.success("Contraseña restablecida");
    },
    onError: () => {
      toast.error("No se pudo restablecer la contraseña.");
    },
  });

  const handleToggleActive = useCallback(
    (user: UserListItem) => {
      setActive.mutate(
        { userId: user.id, active: !user.active },
        {
          onSuccess: () => {
            toast.success(
              user.active ? "Usuario desactivado" : "Usuario activado",
            );
          },
          onError: () => {
            toast.error("No se pudo cambiar el estado del usuario.");
          },
        },
      );
    },
    [setActive],
  );

  const handleResetPassword = useCallback(
    (user: UserListItem) => {
      resetPassword.mutate(user);
    },
    [resetPassword],
  );

  const isSelf = useCallback(
    (user: UserListItem) =>
      sessionUser !== null && sessionUser.userId === user.id,
    [sessionUser],
  );

  const columns: Array<DataColumn<UserListItem>> = useMemo(
    () => [
      {
        key: "name",
        header: "Nombre",
        render: (user) => (
          <div className="min-w-0 max-w-[260px]">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              Creado el {formatDate(user.createdAt)}
            </p>
          </div>
        ),
      },
      {
        key: "username",
        header: "Usuario de acceso",
        render: (user) => (
          <span className="users-username">{user.username}</span>
        ),
      },
      {
        key: "role",
        header: "Rol",
        render: (user) => (
          <span className="badge-role" data-role={roleTone(user.roleName)}>
            {user.roleName}
          </span>
        ),
      },
      {
        key: "active",
        header: "Estado",
        render: (user) => (
          <span
            className="badge-account"
            data-status={user.active ? "active" : "inactive"}
          >
            {user.active ? "Activo" : "Inactivo"}
          </span>
        ),
      },
    ],
    [],
  );

  const actions: Array<RowAction<UserListItem>> = useMemo(
    () => [
      {
        kind: "edit",
        label: "Cambiar rol",
        onClick: (user) => setRoleTarget(user),
      },
      {
        kind: "save",
        label: "Restablecer contraseña",
        onClick: handleResetPassword,
        disabled: () => resetPassword.isPending,
      },
      {
        kind: "cancel",
        label: "Activar o desactivar cuenta",
        onClick: handleToggleActive,
        disabled: () => setActive.isPending,
      },
      {
        kind: "delete",
        label: "Eliminar usuario",
        onClick: (user) => setDeleteTarget(user),
      },
    ],
    [
      handleResetPassword,
      handleToggleActive,
      resetPassword.isPending,
      setActive.isPending,
    ],
  );

  return (
    <div
      data-ocid="users.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Crea usuarios, asigna roles y controla quién puede entrar al taller. Cada persona inicia sesión con su usuario de acceso y contraseña."
        actions={
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            disabled={roles.length === 0}
            data-ocid="users.create_button"
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Crear usuario
          </Button>
        }
      />

      {reveal ? (
        <TempPasswordPanel reveal={reveal} onDismiss={() => setReveal(null)} />
      ) : null}

      <section
        data-ocid="users.toolbar"
        className="users-toolbar rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="users-toolbar-search">
          <Search aria-hidden="true" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar por nombre o usuario…"
            aria-label="Buscar usuarios por nombre o usuario"
            data-ocid="users.search_input"
          />
        </div>
        <div className="users-toolbar-actions">
          <span className="users-count">
            {usersQuery.isLoading
              ? "Cargando…"
              : `${total} usuario${total === 1 ? "" : "s"}`}
          </span>
        </div>
      </section>

      <section className="space-y-3">
        {usersQuery.isError ? (
          <div
            data-ocid="users.error_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar la lista de usuarios.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void usersQuery.refetch({ cancelRefetch: true })}
              data-ocid="users.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : usersQuery.isLoading ? (
          <div data-ocid="users.loading_state" className="space-y-2">
            {SKELETON_IDS.map((id) => (
              <Skeleton key={id} className="h-11 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="users.empty_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <Users
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {hasSearch ? "Sin resultados" : "Aún no hay usuarios"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {hasSearch
                  ? "Ajusta la búsqueda para encontrar al usuario."
                  : "Crea el primer usuario para que pueda iniciar sesión en el taller."}
              </p>
            </div>
            {hasSearch ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setTerm("")}
                data-ocid="users.empty_clear_button"
              >
                Limpiar búsqueda
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={roles.length === 0}
                data-ocid="users.empty_create_button"
                className="gap-2"
              >
                <Plus className="size-4" aria-hidden="true" />
                Crear usuario
              </Button>
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(user) => user.id.toString()}
            actions={actions}
            ocid="users"
          />
        )}

        {!usersQuery.isLoading && !usersQuery.isError && total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="users-count">
              Mostrando {items.length} de {total} · Página {page} de{" "}
              {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                data-ocid="users.pagination_prev"
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
                data-ocid="users.pagination_next"
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {!isAdmin ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Solo un administrador puede crear, editar o eliminar usuarios.
        </p>
      ) : null}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roles}
        onCreated={setReveal}
      />

      <ChangeRoleDialog
        user={roleTarget}
        roles={roles}
        onOpenChange={(open) => {
          if (!open) setRoleTarget(null);
        }}
      />

      <DeleteUserDialog
        user={deleteTarget}
        isSelf={deleteTarget !== null && isSelf(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={() => setDeleteTarget(null)}
      />

      {rolesQuery.isError ? (
        <p
          data-ocid="users.roles_error"
          className="flex items-center gap-2 text-xs text-destructive"
        >
          <UserCog className="size-3.5" aria-hidden="true" />
          No se pudieron cargar los roles. Recarga la página para intentarlo de
          nuevo.
        </p>
      ) : null}

      {rolesQuery.isLoading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Cargando roles…
        </p>
      ) : null}

      {!rolesQuery.isLoading && !rolesQuery.isError && roles.length === 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserX className="size-3.5" aria-hidden="true" />
          No hay roles disponibles. Crea un rol en Configuración → Roles antes
          de registrar usuarios.
        </p>
      ) : null}
    </div>
  );
}

export default UsersPage;
