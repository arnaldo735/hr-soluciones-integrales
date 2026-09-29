import { Y as createLucideIcon, k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation, aq as AppointmentStatus, t as reactExports, ar as colombiaLocalToDate, as as timestampToDate, at as colombiaDayKey, j as jsxRuntimeExports, B as Button, K as Label, w as Input, X, T as TriangleAlert, A as WhatsAppContext, D as WhatsAppContactKind, G as ChevronRight, au as colombiaTimeLabel, W as Wrench, z as formatDate, ak as LoaderCircle, C as ClipboardList, av as ue, aj as formatDateTime, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, a3 as DialogFooter, aw as colombiaTimestamp, v as Search } from "./index-EqGEeyjs.js";
import { D as DataTable } from "./DataTable-BGUSfdBQ.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { S as StatusBadge } from "./StatusBadge-DoLeoyAw.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { u as useCustomers } from "./use-customers-97P-fDYn.js";
import { u as useTechnicians } from "./use-technicians-BvNsJs-Y.js";
import { C as ChevronLeft } from "./chevron-left-C2006Y0h.js";
import { C as Check } from "./check-LdjEv5O-.js";
import "./alert-dialog-qVL9cwOA.js";
import "./table-Dz_wGPQA.js";
import "./trash-2-HQabmlQI.js";
import "./pencil-BajrtuU3.js";
import "./use-whatsapp-DIGqY6EY.js";
import "./pdf-BjjrMDP3.js";
import "./download-DPgaDAHv.js";
import "./warranty-BU5LnZHy.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M8 2v4", key: "1cmpym" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "M8 14h.01", key: "6423bh" }],
  ["path", { d: "M12 14h.01", key: "1etili" }],
  ["path", { d: "M16 14h.01", key: "1gbofw" }],
  ["path", { d: "M8 18h.01", key: "lrp35t" }],
  ["path", { d: "M12 18h.01", key: "mhygvu" }],
  ["path", { d: "M16 18h.01", key: "kzsmim" }]
];
const CalendarDays = createLucideIcon("calendar-days", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M16 19h6", key: "xwg31i" }],
  ["path", { d: "M16 2v4", key: "4m81vk" }],
  ["path", { d: "M19 16v6", key: "tddt3s" }],
  ["path", { d: "M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5", key: "1glfrc" }],
  ["path", { d: "M3 10h18", key: "8toen8" }],
  ["path", { d: "M8 2v4", key: "1cmpym" }]
];
const CalendarPlus = createLucideIcon("calendar-plus", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M3 12h.01", key: "nlz23k" }],
  ["path", { d: "M3 18h.01", key: "1tta3j" }],
  ["path", { d: "M3 6h.01", key: "1rqtza" }],
  ["path", { d: "M8 12h13", key: "1za7za" }],
  ["path", { d: "M8 18h13", key: "1lx6n3" }],
  ["path", { d: "M8 6h13", key: "ik3vkj" }]
];
const List = createLucideIcon("list", __iconNode);
const APPOINTMENT_STATUS_LABELS = {
  [AppointmentStatus.scheduled]: "Agendada",
  [AppointmentStatus.confirmed]: "Confirmada",
  [AppointmentStatus.attended]: "Atendida",
  [AppointmentStatus.noShow]: "No asistió",
  [AppointmentStatus.cancelled]: "Cancelada"
};
const APPOINTMENT_STATUS_BADGE = {
  [AppointmentStatus.scheduled]: "badge-scheduled",
  [AppointmentStatus.confirmed]: "badge-confirmed",
  [AppointmentStatus.attended]: "badge-attended",
  [AppointmentStatus.noShow]: "badge-noshow",
  [AppointmentStatus.cancelled]: "badge-cancelled"
};
function useAppointments(params) {
  var _a, _b, _c;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "appointments",
      params.status ?? "all",
      ((_a = params.technicianId) == null ? void 0 : _a.toString()) ?? "all",
      ((_b = params.from) == null ? void 0 : _b.toString()) ?? "none",
      ((_c = params.to) == null ? void 0 : _c.toString()) ?? "none"
    ],
    queryFn: async () => {
      if (!actor) return [];
      const filter = {
        status: params.status ?? void 0,
        technicianId: params.technicianId ?? void 0,
        from: params.from ?? void 0,
        to: params.to ?? void 0
      };
      return actor.listAppointments(token, filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateAppointment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createAppointment(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });
}
function useUpdateAppointment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateAppointment(token, id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });
}
function useUpdateAppointmentStatus() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateAppointmentStatus(token, id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });
}
function useDeleteAppointment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteAppointment(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });
}
function useConvertAppointmentToOrder() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.convertAppointmentToOrder(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}
const STATUS_TONE = {
  [AppointmentStatus.scheduled]: "scheduled",
  [AppointmentStatus.confirmed]: "confirmed",
  [AppointmentStatus.attended]: "attended",
  [AppointmentStatus.noShow]: "noshow",
  [AppointmentStatus.cancelled]: "cancelled"
};
const STATUS_ORDER = [
  AppointmentStatus.scheduled,
  AppointmentStatus.confirmed,
  AppointmentStatus.attended,
  AppointmentStatus.noShow,
  AppointmentStatus.cancelled
];
const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + index);
    return cell;
  });
}
const EMPTY_FORM = {
  customerId: "",
  motorcycleId: "",
  technicianId: "",
  date: "",
  time: "09:00",
  duration: "60",
  reason: ""
};
function toFormState(appointment) {
  var _a;
  if (!appointment) return EMPTY_FORM;
  const date = timestampToDate(appointment.scheduledAt);
  return {
    customerId: appointment.customerId.toString(),
    motorcycleId: appointment.motorcycleId.toString(),
    technicianId: ((_a = appointment.technicianId) == null ? void 0 : _a.toString()) ?? "",
    date: date ? colombiaDayKey(date) : "",
    time: date ? colombiaTimeLabel(date) : "09:00",
    duration: appointment.durationMinutes.toString(),
    reason: appointment.reason
  };
}
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
function CustomerSearch({
  value,
  onChange,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Search,
      {
        className: "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        type: "search",
        value,
        onChange: (event) => onChange(event.target.value),
        placeholder: "Buscar por nombre, teléfono o placa…",
        "aria-label": "Buscar cliente por nombre, teléfono o placa",
        "data-ocid": ocid,
        className: "h-9 pl-8 text-sm"
      }
    )
  ] });
}
function CustomerPrompt({
  ocid,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "p",
    {
      "data-ocid": ocid,
      className: "rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground",
      children
    }
  );
}
function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  technicians
}) {
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  const [seededFor, setSeededFor] = reactExports.useState(null);
  const [customerSearch, setCustomerSearch] = reactExports.useState("");
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const isEditing = appointment !== null;
  const isPending = createAppointment.isPending || updateAppointment.isPending;
  const seedKey = open ? (appointment == null ? void 0 : appointment.id.toString()) ?? "new" : null;
  if (seedKey !== seededFor) {
    setSeededFor(seedKey);
    setForm(toFormState(appointment));
    setError(null);
    setCustomerSearch("");
  }
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const selectedCustomerId = form.customerId === "" ? null : BigInt(form.customerId);
  const customersQuery = useCustomers(debouncedCustomerSearch);
  const customerTerm = debouncedCustomerSearch.trim();
  const customerResults = customersQuery.data ?? [];
  const customers = customerTerm.length > 0 ? customerResults : [];
  const selectedCustomer = customerResults.find((customer) => customer.id === selectedCustomerId) ?? null;
  const motorcyclesQuery = useQuery({
    queryKey: ["appointment-form-motorcycles", form.customerId, token],
    queryFn: async () => {
      if (!actor || selectedCustomerId === null) return [];
      return actor.listMotorcycles(token, selectedCustomerId);
    },
    enabled: open && !!actor && !isFetching && selectedCustomerId !== null,
    // A customer's motorcycles are stable, so the list is reused while the
    // dialog is reopened for the same customer.
    staleTime: Number.POSITIVE_INFINITY
  });
  const motorcycles = motorcyclesQuery.data ?? [];
  const handleSubmit = (event) => {
    event.preventDefault();
    const reason = form.reason.trim();
    const scheduledAt = colombiaTimestamp(form.date, form.time);
    if (form.customerId === "" || form.motorcycleId === "") {
      setError("Selecciona el cliente y la moto de la cita.");
      return;
    }
    if (scheduledAt === null) {
      setError("Indica una fecha y hora válidas para la cita.");
      return;
    }
    if (reason === "") {
      setError("Describe el motivo de la cita.");
      return;
    }
    setError(null);
    const input = {
      customerId: BigInt(form.customerId),
      motorcycleId: BigInt(form.motorcycleId),
      technicianId: form.technicianId === "" ? void 0 : BigInt(form.technicianId),
      scheduledAt,
      durationMinutes: BigInt(form.duration),
      reason
    };
    if (isEditing && appointment) {
      updateAppointment.mutate(
        { id: appointment.id, input },
        {
          onSuccess: () => {
            ue.success("Cita actualizada");
            onOpenChange(false);
          },
          onError: () => setError("No se pudo guardar la cita.")
        }
      );
      return;
    }
    createAppointment.mutate(input, {
      onSuccess: () => {
        ue.success("Cita agendada");
        onOpenChange(false);
      },
      onError: () => setError("No se pudo agendar la cita.")
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "appointments.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: isEditing ? "Editar cita" : "Nueva cita" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: isEditing ? "Actualiza el cliente, la moto, el horario o el técnico asignado." : "Agenda un servicio vinculando cliente, moto, horario y técnico." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "appointment-customer-search", children: "Cliente" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CustomerSearch,
              {
                value: customerSearch,
                onChange: setCustomerSearch,
                ocid: "appointments.customer_search_input"
              }
            ),
            customerTerm.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerPrompt, { ocid: "appointments.customer_search.prompt_state", children: "Escribe el nombre, el teléfono o la placa del cliente para ver coincidencias." }) : customersQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }) : customersQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "appointments.customer_search.error_state",
                className: "text-xs text-destructive",
                children: "No se pudo cargar el directorio de clientes. Inténtalo de nuevo."
              }
            ) : customers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "appointments.customer_search.empty_state",
                className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
                children: `Sin clientes que coincidan con “${customerTerm}”.`
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "ul",
              {
                "data-ocid": "appointments.customer_search.list",
                className: "max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1",
                children: customers.map((customer, index) => {
                  const isSelected = customer.id === selectedCustomerId;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setForm((current) => ({
                          ...current,
                          customerId: customer.id.toString(),
                          motorcycleId: ""
                        }));
                        setError(null);
                      },
                      "aria-pressed": isSelected,
                      "data-ocid": `appointments.customer_search.item.${index + 1}`,
                      className: isSelected ? "flex w-full items-center justify-between gap-3 rounded-sm border border-primary/40 bg-primary/5 px-2.5 py-2 text-left transition-colors focus-visible:outline-none" : "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: customer.name }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail mt-0.5 block truncate text-xs text-muted-foreground", children: customer.phone })
                        ] }),
                        isSelected ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Check,
                          {
                            className: "size-4 shrink-0 text-primary",
                            "aria-hidden": "true"
                          }
                        ) : null
                      ]
                    }
                  ) }, customer.id.toString());
                })
              }
            ),
            selectedCustomer ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "appointments.customer_selected",
                className: "flex items-start justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: "Cliente seleccionado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: selectedCustomer.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail truncate text-xs text-muted-foreground", children: selectedCustomer.phone })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "icon",
                      onClick: () => {
                        setForm((current) => ({
                          ...current,
                          customerId: "",
                          motorcycleId: ""
                        }));
                        setError(null);
                      },
                      "aria-label": "Cambiar el cliente seleccionado",
                      "data-ocid": "appointments.clear_customer_button",
                      className: "shrink-0 text-muted-foreground hover:text-destructive",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
                    }
                  )
                ]
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "appointment-motorcycle", children: "Moto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: form.motorcycleId === "" ? void 0 : form.motorcycleId,
                onValueChange: (value) => setForm((current) => ({ ...current, motorcycleId: value })),
                disabled: form.customerId === "" || motorcycles.length === 0,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "appointment-motorcycle",
                      "data-ocid": "appointments.motorcycle_select",
                      className: "w-full",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectValue,
                        {
                          placeholder: form.customerId === "" ? "Elige primero un cliente" : motorcyclesQuery.isLoading ? "Cargando motos…" : motorcycles.length === 0 ? "El cliente no tiene motos registradas" : "Selecciona una moto"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: motorcycles.map((motorcycle) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    SelectItem,
                    {
                      value: motorcycle.id.toString(),
                      children: [
                        motorcycle.brand,
                        " ",
                        motorcycle.model,
                        " · ",
                        motorcycle.plate
                      ]
                    },
                    motorcycle.id.toString()
                  )) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "appointment-date", children: "Fecha" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "appointment-date",
                  type: "date",
                  value: form.date,
                  onChange: (event) => setForm((current) => ({
                    ...current,
                    date: event.target.value
                  })),
                  className: "data-rail",
                  "data-ocid": "appointments.date_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "appointment-time", children: "Hora" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "appointment-time",
                  type: "time",
                  value: form.time,
                  onChange: (event) => setForm((current) => ({
                    ...current,
                    time: event.target.value
                  })),
                  className: "data-rail",
                  "data-ocid": "appointments.time_input"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "appointment-duration", children: "Duración" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: form.duration,
                  onValueChange: (value) => setForm((current) => ({ ...current, duration: value })),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        id: "appointment-duration",
                        "data-ocid": "appointments.duration_select",
                        className: "w-full",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: DURATION_OPTIONS.map((minutes) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: minutes.toString(), children: [
                      minutes,
                      " min"
                    ] }, minutes)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "appointment-technician", children: "Técnico asignado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: form.technicianId === "" ? "none" : form.technicianId,
                  onValueChange: (value) => setForm((current) => ({
                    ...current,
                    technicianId: value === "none" ? "" : value
                  })),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        id: "appointment-technician",
                        "data-ocid": "appointments.technician_select",
                        className: "w-full",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sin asignar" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sin asignar" }),
                      technicians.map((technician) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectItem,
                        {
                          value: technician.id.toString(),
                          children: technician.name
                        },
                        technician.id.toString()
                      ))
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "appointment-reason", children: "Motivo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "appointment-reason",
                value: form.reason,
                onChange: (event) => setForm((current) => ({
                  ...current,
                  reason: event.target.value
                })),
                placeholder: "Ej. Servicio de afinación y cambio de aceite",
                rows: 3,
                "data-ocid": "appointments.reason_input"
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "appointments.form.error_state",
              className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
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
                "data-ocid": "appointments.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: isPending,
                "data-ocid": "appointments.submit_button",
                children: [
                  isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
                  isEditing ? "Guardar cambios" : "Agendar cita"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function ListSkeleton() {
  const rows = Array.from(
    { length: 6 },
    (_, i) => `appointments-skeleton-${i}`
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-ocid": "appointments.loading_state",
      className: "space-y-2 p-4",
      "aria-busy": true,
      children: rows.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id))
    }
  );
}
function AppointmentsPage() {
  const [view, setView] = reactExports.useState("list");
  const [statusFilter, setStatusFilter] = reactExports.useState(
    "all"
  );
  const [technicianFilter, setTechnicianFilter] = reactExports.useState("all");
  const [fromDate, setFromDate] = reactExports.useState("");
  const [toDate, setToDate] = reactExports.useState("");
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [cursor, setCursor] = reactExports.useState(() => /* @__PURE__ */ new Date());
  const fromTimestamp = reactExports.useMemo(() => {
    if (fromDate === "") return null;
    const parsed = colombiaLocalToDate(`${fromDate}T00:00`);
    return parsed ? BigInt(parsed.getTime()) * 1000000n : null;
  }, [fromDate]);
  const toTimestampValue = reactExports.useMemo(() => {
    if (toDate === "") return null;
    const parsed = colombiaLocalToDate(`${toDate}T23:59`);
    return parsed ? BigInt(parsed.getTime() + 59e3) * 1000000n : null;
  }, [toDate]);
  const { data, isLoading, isError, refetch } = useAppointments({
    status: statusFilter === "all" ? null : statusFilter,
    technicianId: technicianFilter === "all" ? null : BigInt(technicianFilter),
    from: fromTimestamp,
    to: toTimestampValue
  });
  const appointments = data ?? [];
  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly: false
  });
  const technicians = techniciansQuery.data ?? [];
  const customersQuery = useCustomers("");
  const customers = customersQuery.data ?? [];
  const customerNames = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const customer of customers) {
      map.set(customer.id.toString(), customer.name);
    }
    return map;
  }, [customers]);
  const technicianNames = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const technician of technicians) {
      map.set(technician.id.toString(), technician.name);
    }
    return map;
  }, [technicians]);
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const convertToOrder = useConvertAppointmentToOrder();
  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (appointment) => {
    setEditing(appointment);
    setDialogOpen(true);
  };
  const changeStatus = (appointment, status) => {
    updateStatus.mutate(
      { id: appointment.id, status },
      {
        onSuccess: () => ue.success(
          `Cita marcada como ${APPOINTMENT_STATUS_LABELS[status]}`
        ),
        onError: () => ue.error("No se pudo actualizar el estado de la cita.")
      }
    );
  };
  const handleDelete = (appointment) => {
    deleteAppointment.mutate(appointment.id, {
      onSuccess: () => ue.success("Cita eliminada"),
      onError: () => ue.error("No se pudo eliminar la cita.")
    });
  };
  const handleConvert = (appointment) => {
    convertToOrder.mutate(appointment.id, {
      onSuccess: (order) => ue.success(`Orden ${order.order.orderNumber} creada desde la cita`),
      onError: () => ue.error("No se pudo convertir la cita en orden.")
    });
  };
  const columns = [
    {
      key: "scheduledAt",
      header: "Fecha y hora",
      render: (appointment) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-sm font-medium", children: formatDateTime(appointment.scheduledAt) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-xs text-muted-foreground", children: [
          appointment.durationMinutes.toString(),
          " min"
        ] })
      ] })
    },
    {
      key: "customer",
      header: "Cliente",
      render: (appointment) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: customerNames.get(appointment.customerId.toString()) ?? `Cliente #${appointment.customerId.toString()}` })
    },
    {
      key: "technician",
      header: "Técnico",
      render: (appointment) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: appointment.technicianId ? technicianNames.get(appointment.technicianId.toString()) ?? `Técnico #${appointment.technicianId.toString()}` : "Sin asignar" })
    },
    {
      key: "reason",
      header: "Motivo",
      render: (appointment) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[18rem] truncate text-sm text-muted-foreground", children: appointment.reason })
    },
    {
      key: "status",
      header: "Estado",
      render: (appointment) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatusBadge,
        {
          label: APPOINTMENT_STATUS_LABELS[appointment.status],
          tone: STATUS_TONE[appointment.status]
        }
      )
    }
  ];
  const actions = [
    {
      kind: "edit",
      label: "Editar cita",
      onClick: openEdit
    },
    {
      kind: "save",
      label: "Confirmar cita",
      onClick: (appointment) => changeStatus(appointment, AppointmentStatus.confirmed),
      hidden: (appointment) => appointment.status !== AppointmentStatus.scheduled
    },
    {
      kind: "save",
      label: "Marcar como atendida",
      onClick: (appointment) => changeStatus(appointment, AppointmentStatus.attended),
      hidden: (appointment) => appointment.status !== AppointmentStatus.confirmed
    },
    {
      kind: "cancel",
      label: "Cancelar cita",
      onClick: (appointment) => changeStatus(appointment, AppointmentStatus.cancelled),
      hidden: (appointment) => appointment.status === AppointmentStatus.cancelled || appointment.status === AppointmentStatus.attended
    },
    {
      kind: "delete",
      label: "Eliminar cita",
      onClick: handleDelete
    }
  ];
  const monthGrid = reactExports.useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );
  const appointmentsByDay = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const appointment of appointments) {
      const date = timestampToDate(appointment.scheduledAt);
      if (!date) continue;
      const key = colombiaDayKey(date);
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(appointment);
      } else {
        map.set(key, [appointment]);
      }
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => Number(a.scheduledAt - b.scheduledAt));
    }
    return map;
  }, [appointments]);
  const todayKey = colombiaDayKey(/* @__PURE__ */ new Date());
  const monthLabel = `${MONTH_LABELS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const shiftMonth = (delta) => {
    setCursor(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1)
    );
  };
  const hasFilters = statusFilter !== "all" || technicianFilter !== "all" || fromDate !== "" || toDate !== "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "appointments.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Taller",
            title: "Citas",
            description: "Agenda de servicios por técnico, día y motocicleta. Confirma, atiende o convierte una cita en orden de taller.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: openCreate,
                "data-ocid": "appointments.open_modal_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarPlus, { className: "size-4", "aria-hidden": "true" }),
                  "Nueva cita"
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-border bg-muted/30 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "appointments.view.tabs",
                  className: "flex items-center gap-1 rounded-md border border-border bg-background p-0.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setView("list"),
                        "aria-pressed": view === "list",
                        "data-ocid": "appointments.view.list_tab",
                        className: view === "list" ? "inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth" : "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(List, { className: "size-3.5", "aria-hidden": "true" }),
                          "Lista"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setView("calendar"),
                        "aria-pressed": view === "calendar",
                        "data-ocid": "appointments.view.calendar_tab",
                        className: view === "calendar" ? "inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth" : "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "size-3.5", "aria-hidden": "true" }),
                          "Calendario"
                        ]
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: statusFilter,
                    onValueChange: (value) => setStatusFilter(value),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          "data-ocid": "appointments.status_select",
                          className: "h-9 w-[11rem]",
                          "aria-label": "Filtrar por estado",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos los estados" }),
                        STATUS_ORDER.map((status) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: status, children: APPOINTMENT_STATUS_LABELS[status] }, status))
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: technicianFilter,
                    onValueChange: setTechnicianFilter,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          "data-ocid": "appointments.technician_filter_select",
                          className: "h-9 w-[11rem]",
                          "aria-label": "Filtrar por técnico",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos los técnicos" }),
                        technicians.map((technician) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectItem,
                          {
                            value: technician.id.toString(),
                            children: technician.name
                          },
                          technician.id.toString()
                        ))
                      ] })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "appointments-from",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Desde"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "appointments-from",
                    type: "date",
                    value: fromDate,
                    onChange: (event) => setFromDate(event.target.value),
                    className: "data-rail h-9 w-[10.5rem]",
                    "data-ocid": "appointments.from_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "appointments-to",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Hasta"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "appointments-to",
                    type: "date",
                    value: toDate,
                    onChange: (event) => setToDate(event.target.value),
                    className: "data-rail h-9 w-[10.5rem]",
                    "data-ocid": "appointments.to_input"
                  }
                )
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => {
                    setStatusFilter("all");
                    setTechnicianFilter("all");
                    setFromDate("");
                    setToDate("");
                  },
                  "data-ocid": "appointments.clear_filters_button",
                  className: "gap-1.5 text-muted-foreground",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5", "aria-hidden": "true" }),
                    "Limpiar filtros"
                  ]
                }
              ) : null
            ] })
          ] }),
          isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "appointments.error_state",
              className: "flex flex-col items-center gap-3 px-6 py-14 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-5 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "No se pudieron cargar las citas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => void refetch({ cancelRefetch: true }),
                    "data-ocid": "appointments.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, {}) : view === "list" ? appointments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "appointments.empty_state",
              className: "flex flex-col items-center gap-3 px-6 py-16 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CalendarDays,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay citas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta el rango de fechas, el estado o el técnico para encontrar la cita." : "Agenda la primera cita para organizar el trabajo del taller por día y técnico." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "outline",
                    onClick: openCreate,
                    "data-ocid": "appointments.empty_state.new_appointment_button",
                    children: "Nueva cita"
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              columns,
              rows: appointments,
              rowKey: (appointment) => appointment.id.toString(),
              actions,
              rowExtraActions: (appointment, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                WhatsAppNotifyButton,
                {
                  contactKind: WhatsAppContactKind.customer,
                  contactId: appointment.customerId,
                  context: WhatsAppContext.appointment,
                  referenceId: appointment.id,
                  contactName: customerNames.get(appointment.customerId.toString()) ?? `Cliente #${appointment.customerId.toString()}`,
                  ocid: `appointments.whatsapp_button.${index + 1}`
                }
              ),
              ocid: "appointments",
              caption: `${appointments.length} citas`
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "appointments.calendar", className: "p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "icon",
                  onClick: () => shiftMonth(-1),
                  "aria-label": "Mes anterior",
                  "data-ocid": "appointments.calendar_prev",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4", "aria-hidden": "true" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold capitalize", children: monthLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "icon",
                  onClick: () => shiftMonth(1),
                  "aria-label": "Mes siguiente",
                  "data-ocid": "appointments.calendar_next",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-md border border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "calendar-grid border-b border-border bg-muted/40", children: WEEKDAY_LABELS.map((label) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: label
                },
                label
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "calendar-grid", children: monthGrid.map((day) => {
                const key = colombiaDayKey(day);
                const inMonth = day.getMonth() === cursor.getMonth();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const dayAppointments = appointmentsByDay.get(key) ?? [];
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-weekend": isWeekend,
                    "data-today": key === todayKey,
                    className: inMonth ? "calendar-cell" : "calendar-cell opacity-45",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "calendar-daynum", children: day.getDate() }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 space-y-0.5", children: [
                        dayAppointments.slice(0, 3).map((appointment) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => openEdit(appointment),
                            title: `${colombiaTimeLabel(
                              timestampToDate(appointment.scheduledAt) ?? /* @__PURE__ */ new Date()
                            )} · ${appointment.reason}`,
                            className: `calendar-event ${APPOINTMENT_STATUS_BADGE[appointment.status]}`,
                            children: [
                              colombiaTimeLabel(
                                timestampToDate(appointment.scheduledAt) ?? /* @__PURE__ */ new Date()
                              ),
                              " ",
                              appointment.reason
                            ]
                          },
                          appointment.id.toString()
                        )),
                        dayAppointments.length > 3 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "px-1.5 text-[10px] text-muted-foreground", children: [
                          "+",
                          dayAppointments.length - 3,
                          " más"
                        ] }) : null
                      ] })
                    ]
                  },
                  key
                );
              }) })
            ] }),
            appointments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "appointments.calendar.empty_state",
                className: "mt-3 text-center text-xs text-muted-foreground",
                children: "No hay citas en el rango seleccionado. Ajusta los filtros o agenda una nueva cita."
              }
            ) : null
          ] })
        ] }),
        appointments.some(
          (appointment) => appointment.status === AppointmentStatus.attended
        ) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-4 shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-4 text-primary", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Citas atendidas listas para orden de taller" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: appointments.filter(
            (appointment) => appointment.status === AppointmentStatus.attended
          ).map((appointment, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              "data-ocid": `appointments.convert.item.${index + 1}`,
              className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: customerNames.get(appointment.customerId.toString()) ?? `Cliente #${appointment.customerId.toString()}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-xs text-muted-foreground", children: [
                    formatDate(appointment.scheduledAt),
                    " ·",
                    " ",
                    appointment.reason
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "outline",
                    onClick: () => handleConvert(appointment),
                    disabled: convertToOrder.isPending,
                    "data-ocid": `appointments.convert_button.${index + 1}`,
                    className: "gap-1.5",
                    children: [
                      convertToOrder.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        LoaderCircle,
                        {
                          className: "size-3.5 animate-spin",
                          "aria-hidden": "true"
                        }
                      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "size-3.5", "aria-hidden": "true" }),
                      "Convertir en orden"
                    ]
                  }
                )
              ]
            },
            appointment.id.toString()
          )) })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AppointmentFormDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            appointment: editing,
            technicians
          }
        )
      ]
    }
  );
}
export {
  AppointmentsPage,
  AppointmentsPage as default
};
