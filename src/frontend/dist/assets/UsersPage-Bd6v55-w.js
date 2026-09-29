import { Y as createLucideIcon, k as useBackend, l as useAuth, u as useRole, ao as useQueryClient, t as reactExports, m as useQuery, ap as useMutation, av as ue, j as jsxRuntimeExports, z as formatDate, B as Button, v as Search, w as Input, T as TriangleAlert, U as Users, an as ShieldCheck, ax as UserCog, ak as LoaderCircle, X, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, a3 as DialogFooter } from "./index-EqGEeyjs.js";
import { D as DataTable } from "./DataTable-BGUSfdBQ.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { K as KeyRound, C as Copy } from "./key-round-DJ0fLI8j.js";
import { C as Check } from "./check-LdjEv5O-.js";
import { U as UserPlus } from "./user-plus-DKuGcj-q.js";
import "./alert-dialog-qVL9cwOA.js";
import "./table-Dz_wGPQA.js";
import "./trash-2-HQabmlQI.js";
import "./pencil-BajrtuU3.js";
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
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["line", { x1: "17", x2: "22", y1: "8", y2: "13", key: "3nzzx3" }],
  ["line", { x1: "22", x2: "17", y1: "8", y2: "13", key: "1swrse" }]
];
const UserX = createLucideIcon("user-x", __iconNode);
const PAGE_SIZE = 25;
const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, index) => `users-skeleton-${index}`
);
function roleTone(roleName) {
  const normalized = roleName.trim().toLowerCase();
  if (normalized === "administrador" || normalized === "admin") return "admin";
  if (normalized === "mecánico" || normalized === "mecanico") return "mechanic";
  if (normalized === "invitado" || normalized === "guest") return "guest";
  return "custom";
}
function errorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "";
}
function isDuplicateUsername(error) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("duplicateusername") || message.includes("ya existe") || message.includes("repetido") || message.includes("en uso");
}
function isOwnAdminError(error) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("cannotremoveownadmin") || message.includes("propia cuenta") || message.includes("propio usuario") || message.includes("administrador");
}
function TempPasswordPanel({
  reveal,
  onDismiss
}) {
  const [copied, setCopied] = reactExports.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reveal.password);
      setCopied(true);
      ue.success("Contraseña temporal copiada");
    } catch {
      ue.error("No se pudo copiar. Selecciónala manualmente.");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "users.temp_password_panel",
      "aria-live": "polite",
      className: "temp-password-panel",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              KeyRound,
              {
                className: "mt-0.5 size-4 shrink-0",
                style: { color: "oklch(var(--temp-password))" },
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "temp-password-label", children: reveal.origin === "created" ? "Contraseña temporal del nuevo usuario" : "Nueva contraseña temporal" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: reveal.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "users-username", children: [
                  " · ",
                  reveal.username
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "icon",
              onClick: onDismiss,
              "aria-label": "Cerrar el aviso de contraseña temporal",
              "data-ocid": "users.temp_password_close_button",
              className: "shrink-0 text-muted-foreground",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "code",
            {
              "data-ocid": "users.temp_password_value",
              className: "temp-password-value flex-1",
              children: reveal.password
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => void handleCopy(),
              "data-ocid": "users.temp_password_copy_button",
              className: "gap-2",
              children: [
                copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-4", "aria-hidden": "true" }),
                copied ? "Copiada" : "Copiar"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "temp-password-note", children: "Esta contraseña se muestra una sola vez. Cópiala y entrégala al usuario ahora; no podrás volver a verla." })
      ]
    }
  );
}
function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onCreated
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = reactExports.useState("");
  const [username, setUsername] = reactExports.useState("");
  const [roleId, setRoleId] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!open) return;
    setName("");
    setUsername("");
    const defaultRole = roles.find((role) => role.id === 1n) ?? roles.find((role) => role.id !== 0n);
    setRoleId((defaultRole == null ? void 0 : defaultRole.id.toString()) ?? "");
    setPassword("");
    setError(null);
  }, [open, roles]);
  const createUser = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createUser(
        token,
        input.username,
        input.name,
        input.roleId,
        input.temporaryPassword
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    }
  });
  const handleSubmit = (event) => {
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
        temporaryPassword: trimmedPassword
      },
      {
        onSuccess: (created) => {
          onCreated({
            username: created.username,
            name: created.name,
            password: trimmedPassword,
            origin: "created"
          });
          ue.success("Usuario creado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            isDuplicateUsername(mutationError) ? "Ese usuario de acceso ya existe. Elige otro." : "No se pudo crear el usuario. Intenta de nuevo."
          );
        }
      }
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "users.create_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Crear usuario" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Registra una persona con su usuario de acceso, rol y una contraseña temporal que deberás entregarle." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "new-user-name", children: "Nombre" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "new-user-name",
                value: name,
                onChange: (event) => setName(event.target.value),
                placeholder: "Juan Pérez",
                autoComplete: "off",
                "data-ocid": "users.create_name_input",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "new-user-username", children: "Usuario de acceso" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "new-user-username",
                value: username,
                onChange: (event) => setUsername(event.target.value),
                placeholder: "juan.perez",
                autoComplete: "off",
                className: "data-rail",
                "data-ocid": "users.create_username_input",
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-hint", children: "Debe ser único. Con este usuario la persona iniciará sesión." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "new-user-role", children: "Rol" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: roleId, onValueChange: setRoleId, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectTrigger,
                {
                  id: "new-user-role",
                  "aria-label": "Rol del nuevo usuario",
                  "data-ocid": "users.create_role_select",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona un rol" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: roles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectItem,
                {
                  value: role.id.toString(),
                  children: role.name
                },
                role.id.toString()
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "new-user-password", children: "Contraseña temporal" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "new-user-password",
                type: "text",
                value: password,
                onChange: (event) => setPassword(event.target.value),
                placeholder: "Mínimo 6 caracteres",
                autoComplete: "off",
                className: "data-rail",
                "data-ocid": "users.create_password_input",
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "field-hint", children: "Se mostrará una sola vez al crear el usuario para que la entregues." })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              "data-ocid": "users.create_error",
              role: "alert",
              className: "auth-alert",
              "data-tone": "error",
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
                disabled: createUser.isPending,
                "data-ocid": "users.create_cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: createUser.isPending,
                "data-ocid": "users.create_submit_button",
                className: "gap-2",
                children: [
                  createUser.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "size-4", "aria-hidden": "true" }),
                  createUser.isPending ? "Creando…" : "Crear usuario"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function ChangeRoleDialog({
  user,
  roles,
  onOpenChange
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [roleId, setRoleId] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!user) return;
    setRoleId(user.roleId.toString());
    setError(null);
  }, [user]);
  const updateRole = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateUserRole(token, input.userId, input.roleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    }
  });
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!user || !roleId) return;
    setError(null);
    updateRole.mutate(
      { userId: user.id, roleId: BigInt(roleId) },
      {
        onSuccess: () => {
          ue.success("Rol actualizado");
          onOpenChange(false);
        },
        onError: () => {
          setError("No se pudo actualizar el rol. Intenta de nuevo.");
        }
      }
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: user !== null, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "users.role_dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Cambiar rol" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: user ? `Selecciona el nuevo rol para ${user.name} (${user.username}).` : "Selecciona el nuevo rol." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "change-role-select", children: "Rol" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: roleId, onValueChange: setRoleId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SelectTrigger,
            {
              id: "change-role-select",
              "aria-label": "Nuevo rol del usuario",
              "data-ocid": "users.role_select",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona un rol" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: roles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            SelectItem,
            {
              value: role.id.toString(),
              children: role.name
            },
            role.id.toString()
          )) })
        ] })
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "p",
        {
          "data-ocid": "users.role_error",
          role: "alert",
          className: "auth-alert",
          "data-tone": "error",
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
            disabled: updateRole.isPending,
            "data-ocid": "users.role_cancel_button",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            disabled: updateRole.isPending || !roleId,
            "data-ocid": "users.role_submit_button",
            children: updateRole.isPending ? "Guardando…" : "Guardar rol"
          }
        )
      ] })
    ] })
  ] }) });
}
function DeleteUserDialog({
  user,
  isSelf,
  onOpenChange,
  onDeleted
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!user) return;
    setError(null);
  }, [user]);
  const deleteUser = useMutation({
    mutationFn: async (userId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteUser(token, userId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    }
  });
  const handleConfirm = () => {
    if (!user) return;
    if (isSelf) {
      setError(
        "No puedes eliminar tu propia cuenta de administrador. Pide a otro administrador que lo haga."
      );
      return;
    }
    setError(null);
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        ue.success("Usuario eliminado");
        onDeleted();
        onOpenChange(false);
      },
      onError: (mutationError) => {
        setError(
          isOwnAdminError(mutationError) ? "No puedes eliminar tu propia cuenta de administrador." : "No se pudo eliminar el usuario. Intenta de nuevo."
        );
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: user !== null, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "users.delete_dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Eliminar usuario" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: user ? `¿Seguro que deseas eliminar a ${user.name} (${user.username})?` : "¿Seguro que deseas eliminar este usuario?" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TriangleAlert,
        {
          className: "mt-0.5 size-4 shrink-0 text-destructive",
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: "Esta acción no se puede deshacer. El usuario perderá el acceso al taller de forma permanente." })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "p",
      {
        "data-ocid": "users.delete_error",
        role: "alert",
        className: "auth-alert",
        "data-tone": "error",
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
          disabled: deleteUser.isPending,
          "data-ocid": "users.delete_cancel_button",
          children: "Cancelar"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "destructive",
          onClick: handleConfirm,
          disabled: deleteUser.isPending,
          "data-ocid": "users.delete_confirm_button",
          className: "gap-2",
          children: [
            deleteUser.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
            deleteUser.isPending ? "Eliminando…" : "Eliminar usuario"
          ]
        }
      )
    ] })
  ] }) });
}
function UsersPage() {
  var _a, _b;
  const { actor, isFetching } = useBackend();
  const { token, user: sessionUser } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();
  const [term, setTerm] = reactExports.useState("");
  const [debouncedTerm, setDebouncedTerm] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const [createOpen, setCreateOpen] = reactExports.useState(false);
  const [roleTarget, setRoleTarget] = reactExports.useState(null);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [reveal, setReveal] = reactExports.useState(null);
  reactExports.useEffect(() => {
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
        BigInt(PAGE_SIZE)
      );
    },
    enabled: !!actor && !isFetching
  });
  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRoles(token);
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY
  });
  const roles = rolesQuery.data ?? [];
  const items = ((_a = usersQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = usersQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasSearch = debouncedTerm !== "";
  const setActive = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setUserActive(token, input.userId, input.active);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
    }
  });
  const resetPassword = useMutation({
    mutationFn: async (user) => {
      if (!actor) throw new Error("Backend no disponible");
      const result = await actor.resetUserPassword(token, user.id);
      return { result, user };
    },
    onSuccess: ({ result, user }) => {
      setReveal({
        username: user.username,
        name: user.name,
        password: result.temporaryPassword,
        origin: "reset"
      });
      ue.success("Contraseña restablecida");
    },
    onError: () => {
      ue.error("No se pudo restablecer la contraseña.");
    }
  });
  const handleToggleActive = reactExports.useCallback(
    (user) => {
      setActive.mutate(
        { userId: user.id, active: !user.active },
        {
          onSuccess: () => {
            ue.success(
              user.active ? "Usuario desactivado" : "Usuario activado"
            );
          },
          onError: () => {
            ue.error("No se pudo cambiar el estado del usuario.");
          }
        }
      );
    },
    [setActive]
  );
  const handleResetPassword = reactExports.useCallback(
    (user) => {
      resetPassword.mutate(user);
    },
    [resetPassword]
  );
  const isSelf = reactExports.useCallback(
    (user) => sessionUser !== null && sessionUser.userId === user.id,
    [sessionUser]
  );
  const columns = reactExports.useMemo(
    () => [
      {
        key: "name",
        header: "Nombre",
        render: (user) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 max-w-[260px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: user.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate text-xs text-muted-foreground", children: [
            "Creado el ",
            formatDate(user.createdAt)
          ] })
        ] })
      },
      {
        key: "username",
        header: "Usuario de acceso",
        render: (user) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "users-username", children: user.username })
      },
      {
        key: "role",
        header: "Rol",
        render: (user) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "badge-role", "data-role": roleTone(user.roleName), children: user.roleName })
      },
      {
        key: "active",
        header: "Estado",
        render: (user) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "badge-account",
            "data-status": user.active ? "active" : "inactive",
            children: user.active ? "Activo" : "Inactivo"
          }
        )
      }
    ],
    []
  );
  const actions = reactExports.useMemo(
    () => [
      {
        kind: "edit",
        label: "Cambiar rol",
        onClick: (user) => setRoleTarget(user)
      },
      {
        kind: "save",
        label: "Restablecer contraseña",
        onClick: handleResetPassword,
        disabled: () => resetPassword.isPending
      },
      {
        kind: "cancel",
        label: "Activar o desactivar cuenta",
        onClick: handleToggleActive,
        disabled: () => setActive.isPending
      },
      {
        kind: "delete",
        label: "Eliminar usuario",
        onClick: (user) => setDeleteTarget(user)
      }
    ],
    [
      handleResetPassword,
      handleToggleActive,
      resetPassword.isPending,
      setActive.isPending
    ]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "users.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Usuarios",
            description: "Crea usuarios, asigna roles y controla quién puede entrar al taller. Cada persona inicia sesión con su usuario de acceso y contraseña.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: () => setCreateOpen(true),
                disabled: roles.length === 0,
                "data-ocid": "users.create_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Crear usuario"
                ]
              }
            )
          }
        ),
        reveal ? /* @__PURE__ */ jsxRuntimeExports.jsx(TempPasswordPanel, { reveal, onDismiss: () => setReveal(null) }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "users.toolbar",
            className: "users-toolbar rounded-lg border border-border bg-card p-3 shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "users-toolbar-search", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { "aria-hidden": "true" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: term,
                    onChange: (event) => setTerm(event.target.value),
                    placeholder: "Buscar por nombre o usuario…",
                    "aria-label": "Buscar usuarios por nombre o usuario",
                    "data-ocid": "users.search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "users-toolbar-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "users-count", children: usersQuery.isLoading ? "Cargando…" : `${total} usuario${total === 1 ? "" : "s"}` }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
          usersQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "users.error_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-6 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar la lista de usuarios." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => void usersQuery.refetch({ cancelRefetch: true }),
                    "data-ocid": "users.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : usersQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "users.loading_state", className: "space-y-2", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id)) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "users.empty_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Users,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasSearch ? "Sin resultados" : "Aún no hay usuarios" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasSearch ? "Ajusta la búsqueda para encontrar al usuario." : "Crea el primer usuario para que pueda iniciar sesión en el taller." })
                ] }),
                hasSearch ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => setTerm(""),
                    "data-ocid": "users.empty_clear_button",
                    children: "Limpiar búsqueda"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    onClick: () => setCreateOpen(true),
                    disabled: roles.length === 0,
                    "data-ocid": "users.empty_create_button",
                    className: "gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                      "Crear usuario"
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
              rowKey: (user) => user.id.toString(),
              actions,
              ocid: "users"
            }
          ),
          !usersQuery.isLoading && !usersQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "users-count", children: [
              "Mostrando ",
              items.length,
              " de ",
              total,
              " · Página ",
              page,
              " de",
              " ",
              totalPages
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  disabled: page <= 1,
                  onClick: () => setPage((current) => Math.max(1, current - 1)),
                  "data-ocid": "users.pagination_prev",
                  children: "Anterior"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  disabled: page >= totalPages,
                  onClick: () => setPage((current) => Math.min(totalPages, current + 1)),
                  "data-ocid": "users.pagination_next",
                  children: "Siguiente"
                }
              )
            ] })
          ] }) : null
        ] }),
        !isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "size-3.5", "aria-hidden": "true" }),
          "Solo un administrador puede crear, editar o eliminar usuarios."
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CreateUserDialog,
          {
            open: createOpen,
            onOpenChange: setCreateOpen,
            roles,
            onCreated: setReveal
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChangeRoleDialog,
          {
            user: roleTarget,
            roles,
            onOpenChange: (open) => {
              if (!open) setRoleTarget(null);
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DeleteUserDialog,
          {
            user: deleteTarget,
            isSelf: deleteTarget !== null && isSelf(deleteTarget),
            onOpenChange: (open) => {
              if (!open) setDeleteTarget(null);
            },
            onDeleted: () => setDeleteTarget(null)
          }
        ),
        rolesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": "users.roles_error",
            className: "flex items-center gap-2 text-xs text-destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserCog, { className: "size-3.5", "aria-hidden": "true" }),
              "No se pudieron cargar los roles. Recarga la página para intentarlo de nuevo."
            ]
          }
        ) : null,
        rolesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-3.5 animate-spin", "aria-hidden": "true" }),
          "Cargando roles…"
        ] }) : null,
        !rolesQuery.isLoading && !rolesQuery.isError && roles.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserX, { className: "size-3.5", "aria-hidden": "true" }),
          "No hay roles disponibles. Crea un rol en Configuración → Roles antes de registrar usuarios."
        ] }) : null
      ]
    }
  );
}
export {
  UsersPage,
  UsersPage as default
};
