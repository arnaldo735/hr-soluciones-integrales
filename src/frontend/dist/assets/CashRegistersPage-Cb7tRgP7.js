import { r as reactExports, j as jsxRuntimeExports, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogDescription, K as Label, I as Input, f as DialogFooter, B as Button, ag as ue, bC as Landmark, aD as Wallet, s as formatMoney, A as Search, g as formatNumber, p as TriangleAlert, h as ChevronRight } from "./index-CGU00UGU.js";
import { D as DataTable } from "./DataTable--FR5L5JM.js";
import { P as PageHeader } from "./PageHeader-CxkpEYhr.js";
import { S as StatusBadge } from "./StatusBadge-DYrsc8Lu.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BiDX8q3v.js";
import { j as useCreateCashRegister, k as useUpdateCashRegister, b as useCashRegisters, a as useOpenShifts, l as useSetCashRegisterActive, m as useDeleteCashRegister } from "./use-cash-DSqK78YD.js";
import { f as centsToInput, C as CASH_REGISTER_KIND_OPTIONS, h as CASH_REGISTER_KIND_LABELS, p as parseAmount, g as cashRegisterKindLabel, r as registerStatusLabel, i as registerShiftStatusLabel } from "./cash-labels-CiSIpFY4.js";
import { S as Skeleton } from "./skeleton-CFVvrB7j.js";
import { P as Plus } from "./plus-CPedN7BF.js";
import { R as RotateCcw } from "./rotate-ccw-CJSSmG56.js";
import { C as ChevronLeft } from "./chevron-left-Coib6isK.js";
import "./alert-dialog-DAMKlNv-.js";
import "./table-B6hoRRgq.js";
import "./trash-2-D0SVHflY.js";
import "./check-D7OXHYR_.js";
import "./pencil-D17_67q5.js";
import "./index-ddFCuYd6.js";
import "./index-wj725hjP.js";
import "./chevron-up-Dje9nq9I.js";
function emptyForm() {
  return {
    name: "",
    kind: CASH_REGISTER_KIND_OPTIONS[0],
    openingBalance: ""
  };
}
function CashRegisterDialog({
  open,
  onOpenChange,
  register
}) {
  const [form, setForm] = reactExports.useState(emptyForm);
  const [error, setError] = reactExports.useState(null);
  const createRegister = useCreateCashRegister();
  const updateRegister = useUpdateCashRegister();
  const isEditing = register !== null;
  const isPending = createRegister.isPending || updateRegister.isPending;
  reactExports.useEffect(() => {
    if (!open) return;
    if (register) {
      setForm({
        name: register.name,
        kind: register.kind,
        openingBalance: centsToInput(register.openingBalance)
      });
    } else {
      setForm(emptyForm());
    }
    setError(null);
  }, [open, register]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function handleSubmit(event) {
    event.preventDefault();
    const name = form.name.trim();
    if (name === "") {
      setError("Escribe el nombre de la caja o banco.");
      return;
    }
    const openingBalance = parseAmount(form.openingBalance);
    if (openingBalance === null) {
      setError("Captura el saldo inicial en COP (puede ser 0).");
      return;
    }
    const input = {
      name,
      kind: form.kind,
      openingBalance
    };
    setError(null);
    const onSuccess = () => {
      ue.success(
        isEditing ? "Caja o banco actualizado" : "Caja o banco creado"
      );
      onOpenChange(false);
    };
    const onError = (mutationError) => {
      setError(
        mutationError.message || "No se pudo guardar la caja o banco. Intenta de nuevo."
      );
    };
    if (register) {
      updateRegister.mutate(
        { registerId: register.id, input },
        { onSuccess, onError }
      );
    } else {
      createRegister.mutate(input, { onSuccess, onError });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "caja.registers.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: isEditing ? "Editar caja o banco" : "Nueva caja o banco" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Define el nombre, el tipo y el saldo inicial en pesos colombianos. El saldo inicial es la base para calcular los turnos de este registro." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "register-name", children: "Nombre" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "register-name",
                value: form.name,
                onChange: (event) => update("name", event.target.value),
                placeholder: "Caja principal, Banco Bogotá…",
                maxLength: 80,
                "data-ocid": "caja.registers.name_input",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "register-kind", children: "Tipo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: form.kind,
                  onValueChange: (value) => update("kind", value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        id: "register-kind",
                        "aria-label": "Tipo de caja o banco",
                        "data-ocid": "caja.registers.kind_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CASH_REGISTER_KIND_OPTIONS.map((kind) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: kind, children: CASH_REGISTER_KIND_LABELS[kind] }, kind)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "register-opening", children: "Saldo inicial (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "register-opening",
                  inputMode: "decimal",
                  value: form.openingBalance,
                  onChange: (event) => update("openingBalance", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "caja.registers.opening_balance_input",
                  required: true
                }
              )
            ] })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "caja.registers.error_state",
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
                "data-ocid": "caja.registers.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: isPending,
                "data-ocid": "caja.registers.submit_button",
                children: isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear caja o banco"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
const PAGE_SIZE = 15;
function CashRegistersPage() {
  var _a, _b;
  const [search, setSearch] = reactExports.useState("");
  const [kind, setKind] = reactExports.useState("all");
  const [status, setStatus] = reactExports.useState("all");
  const [page, setPage] = reactExports.useState(1);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const registersQuery = useCashRegisters({
    kind: kind === "all" ? null : kind,
    active: status === "all" ? null : status === "active",
    search,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE
  });
  const openShiftsQuery = useOpenShifts();
  const setActive = useSetCashRegisterActive();
  const deleteRegister = useDeleteCashRegister();
  const items = ((_a = registersQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = registersQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const openRegisterIds = reactExports.useMemo(() => {
    const ids = /* @__PURE__ */ new Set();
    for (const shift of openShiftsQuery.data ?? []) {
      ids.add(shift.registerId.toString());
    }
    return ids;
  }, [openShiftsQuery.data]);
  const hasFilters = search.trim() !== "" || kind !== "all" || status !== "all";
  function clearFilters() {
    setSearch("");
    setKind("all");
    setStatus("all");
    setPage(1);
  }
  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  const openEdit = reactExports.useCallback((register) => {
    setEditing(register);
    setDialogOpen(true);
  }, []);
  const toggleActive = reactExports.useCallback(
    (register) => {
      setActive.mutate(
        { registerId: register.id, active: !register.active },
        {
          onSuccess: () => {
            ue.success(
              register.active ? "Caja o banco desactivado" : "Caja o banco activado"
            );
          },
          onError: (error) => {
            ue.error(
              error.message || "No se pudo cambiar el estado de la caja o banco."
            );
          }
        }
      );
    },
    [setActive]
  );
  const removeRegister = reactExports.useCallback(
    (register) => {
      deleteRegister.mutate(register.id, {
        onSuccess: () => {
          ue.success("Caja o banco eliminado");
        },
        onError: (error) => {
          ue.error(
            error.message || "No se pudo eliminar la caja o banco. Verifica que no tenga un turno abierto."
          );
        }
      });
    },
    [deleteRegister]
  );
  const columns = reactExports.useMemo(
    () => [
      {
        key: "name",
        header: "Nombre",
        render: (register) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
          register.kind === "bank" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Landmark,
            {
              className: "size-4 shrink-0 text-muted-foreground",
              "aria-hidden": "true"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            Wallet,
            {
              className: "size-4 shrink-0 text-muted-foreground",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: register.name })
        ] })
      },
      {
        key: "kind",
        header: "Tipo",
        render: (register) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: cashRegisterKindLabel(register.kind) })
      },
      {
        key: "openingBalance",
        header: "Saldo inicial",
        numeric: true,
        render: (register) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium", children: formatMoney(register.openingBalance) })
      },
      {
        key: "status",
        header: "Estado",
        render: (register) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusBadge,
          {
            label: registerStatusLabel(register.active),
            tone: register.active ? "accepted" : "neutral"
          }
        )
      },
      {
        key: "shift",
        header: "Turno",
        render: (register) => {
          const hasOpenShift = openRegisterIds.has(register.id.toString());
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            StatusBadge,
            {
              label: registerShiftStatusLabel(hasOpenShift),
              tone: hasOpenShift ? "pending" : "neutral"
            }
          );
        }
      }
    ],
    [openRegisterIds]
  );
  const actions = reactExports.useMemo(
    () => [
      {
        kind: "edit",
        label: "Editar caja o banco",
        onClick: openEdit
      },
      {
        kind: "save",
        label: "Activar o desactivar",
        onClick: toggleActive
      },
      {
        kind: "delete",
        label: "Eliminar caja o banco",
        onClick: removeRegister,
        disabled: (register) => openRegisterIds.has(register.id.toString())
      }
    ],
    [openRegisterIds, openEdit, toggleActive, removeRegister]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "caja.registers.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Cajas y bancos",
            description: "Catálogo de cajas y bancos del taller. Cada registro agrupa sus propios turnos y movimientos; los inactivos conservan su historial.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: openCreate,
                "data-ocid": "caja.registers.create_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Nueva caja o banco"
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "caja.registers.filters",
            className: "rounded-lg border border-border bg-card p-3 shadow-subtle",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "register-search",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Buscar"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
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
                      id: "register-search",
                      value: search,
                      onChange: (event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      },
                      placeholder: "Nombre de la caja o banco",
                      className: "pl-9",
                      "data-ocid": "caja.registers.search_input"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "register-kind-filter",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Tipo"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: kind,
                    onValueChange: (value) => {
                      setKind(value);
                      setPage(1);
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "register-kind-filter",
                          "aria-label": "Filtrar por tipo",
                          "data-ocid": "caja.registers.kind_filter",
                          className: "w-[150px]",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cash", children: "Caja" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "bank", children: "Banco" })
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "register-status-filter",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Estado"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: status,
                    onValueChange: (value) => {
                      setStatus(value);
                      setPage(1);
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "register-status-filter",
                          "aria-label": "Filtrar por estado",
                          "data-ocid": "caja.registers.status_filter",
                          className: "w-[150px]",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "active", children: "Activas" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "inactive", children: "Inactivas" })
                      ] })
                    ]
                  }
                )
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: clearFilters,
                  "data-ocid": "caja.registers.clear_filters_button",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: registersQuery.isLoading ? "Cargando…" : `${formatNumber(total)} registro${total === 1 ? "" : "s"}` }) }),
        registersQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "caja.registers.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-6 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el catálogo de cajas y bancos." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => void registersQuery.refetch({ cancelRefetch: true }),
                  "data-ocid": "caja.registers.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : registersQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "caja.registers.loading_state",
            className: "space-y-2 p-4",
            children: Array.from(
              { length: 5 },
              (_, index) => `register-skeleton-${index}`
            ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id))
          }
        ) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "caja.registers.empty_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Landmark,
                {
                  className: "size-5 text-muted-foreground",
                  "aria-hidden": "true"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay cajas ni bancos" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "No encontramos cajas ni bancos con esos criterios. Ajusta la búsqueda o los filtros." : "Crea la primera caja o banco para empezar a abrir turnos y registrar movimientos." })
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: clearFilters,
                  "data-ocid": "caja.registers.empty_clear_button",
                  children: "Limpiar filtros"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: openCreate,
                  "data-ocid": "caja.registers.empty_create_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                    "Nueva caja o banco"
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
            rowKey: (register) => register.id.toString(),
            actions,
            ocid: "caja.registers",
            caption: "Catálogo de cajas y bancos"
          }
        ),
        !registersQuery.isLoading && !registersQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
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
                "data-ocid": "caja.registers.pagination_prev",
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
                "data-ocid": "caja.registers.pagination_next",
                className: "gap-1",
                children: [
                  "Siguiente",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
                ]
              }
            )
          ] })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CashRegisterDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            register: editing
          }
        )
      ]
    }
  );
}
export {
  CashRegistersPage,
  CashRegistersPage as default
};
