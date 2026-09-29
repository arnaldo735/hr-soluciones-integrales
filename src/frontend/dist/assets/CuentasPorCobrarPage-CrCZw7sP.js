import { r as useNavigate, s as useSearch, bC as ReceivableStatus, t as reactExports, j as jsxRuntimeExports, y as formatMoney, z as formatDate, o as formatNumber, v as Search, w as Input, B as Button, T as TriangleAlert, e as Wallet, A as WhatsAppContext, D as WhatsAppContactKind, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, a3 as DialogFooter, av as ue } from "./index-EqGEeyjs.js";
import { D as DataTable } from "./DataTable-BGUSfdBQ.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { u as useReceivables, a as useReceivableSummary, b as useRegisterReceivablePayment } from "./use-receivables-DiQwYlyH.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import "./alert-dialog-qVL9cwOA.js";
import "./table-Dz_wGPQA.js";
import "./trash-2-HQabmlQI.js";
import "./check-LdjEv5O-.js";
import "./pencil-BajrtuU3.js";
import "./use-whatsapp-DIGqY6EY.js";
import "./pdf-BjjrMDP3.js";
import "./download-DPgaDAHv.js";
import "./warranty-BU5LnZHy.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
const FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: ReceivableStatus.pending, label: "Pendientes" },
  { value: ReceivableStatus.overdue, label: "Vencidas" },
  { value: ReceivableStatus.paid, label: "Pagadas" }
];
const STATUS_LABELS = {
  [ReceivableStatus.pending]: "Pendiente",
  [ReceivableStatus.overdue]: "Vencida",
  [ReceivableStatus.paid]: "Pagada"
};
const STATUS_BADGE_CLASS = {
  [ReceivableStatus.pending]: "badge-open",
  [ReceivableStatus.overdue]: "badge-overdue",
  [ReceivableStatus.paid]: "badge-settled"
};
const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" }
];
function parseAmount(value) {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (normalized === "") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}
function daysUntil(dueDate) {
  const due = new Date(Number(dueDate / 1000000n));
  const now = /* @__PURE__ */ new Date();
  const dueDay = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate()
  );
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return Math.round((dueDay - today) / 864e5);
}
function StatusPill({ status }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `badge-status ${STATUS_BADGE_CLASS[status]}`, children: STATUS_LABELS[status] });
}
function PaymentDialog({ open, onOpenChange, receivable }) {
  const [amount, setAmount] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState("cash");
  const [note, setNote] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const registerPayment = useRegisterReceivablePayment();
  reactExports.useEffect(() => {
    if (open) {
      setAmount("");
      setMethod("cash");
      setNote("");
      setError(null);
    }
  }, [open]);
  const balance = (receivable == null ? void 0 : receivable.balance) ?? 0n;
  function handleSubmit(event) {
    event.preventDefault();
    if (!receivable) return;
    const parsed = parseAmount(amount);
    if (parsed === null || parsed <= 0n) {
      setError("Captura un monto válido mayor a cero.");
      return;
    }
    if (parsed > balance) {
      setError(
        `El abono no puede superar el saldo pendiente de ${formatMoney(balance)}.`
      );
      return;
    }
    const input = {
      invoiceId: receivable.invoiceId,
      amount: parsed,
      method,
      note: note.trim() === "" ? void 0 : note.trim()
    };
    setError(null);
    registerPayment.mutate(input, {
      onSuccess: () => {
        ue.success("Abono registrado");
        onOpenChange(false);
      },
      onError: (mutationError) => {
        setError(
          mutationError.message || "No se pudo registrar el abono. Inténtalo de nuevo."
        );
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "receivables.payment_dialog",
      className: "sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Registrar abono" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: receivable ? `Factura ${receivable.invoiceNumber} · ${receivable.customerName}. Saldo pendiente ${formatMoney(balance)}.` : "Registra un abono sobre la cuenta por cobrar." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "receivable-amount", children: "Monto del abono (COP)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "receivable-amount",
                inputMode: "decimal",
                value: amount,
                onChange: (event) => setAmount(event.target.value),
                placeholder: "0.00",
                className: "data-rail",
                "data-ocid": "receivables.amount_input",
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Máximo ",
              formatMoney(balance),
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "receivable-method", children: "Método de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: method, onValueChange: setMethod, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectTrigger,
                {
                  id: "receivable-method",
                  "aria-label": "Método de pago del abono",
                  "data-ocid": "receivables.method_select",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "receivable-note", children: "Nota (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "receivable-note",
                value: note,
                onChange: (event) => setNote(event.target.value),
                placeholder: "Abono parcial acordado con el cliente",
                rows: 2,
                "data-ocid": "receivables.note_input"
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "receivables.form_error",
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
                "data-ocid": "receivables.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: registerPayment.isPending,
                "data-ocid": "receivables.submit_button",
                children: registerPayment.isPending ? "Registrando…" : "Registrar abono"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function TableSkeleton() {
  const rows = Array.from(
    { length: 6 },
    (_, index) => `receivable-row-${index}`
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "receivables.loading_state", className: "space-y-2 p-4", children: rows.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)) });
}
function CuentasPorCobrarPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const statusFilter = typeof rawSearch.status === "string" && (rawSearch.status === "all" || rawSearch.status === ReceivableStatus.pending || rawSearch.status === ReceivableStatus.overdue || rawSearch.status === ReceivableStatus.paid) ? rawSearch.status : "all";
  const search = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const [searchInput, setSearchInput] = reactExports.useState(search);
  const [paymentTarget, setPaymentTarget] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (searchInput === search) return;
    const handle = window.setTimeout(() => {
      void navigate({
        to: "/cuentas-por-cobrar",
        search: (previous) => ({
          ...previous,
          q: searchInput.trim().length > 0 ? searchInput : void 0
        }),
        replace: true
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchInput, search, navigate]);
  const receivablesQuery = useReceivables({
    status: statusFilter === "all" ? null : statusFilter,
    search
  });
  const summaryQuery = useReceivableSummary();
  const items = receivablesQuery.data ?? [];
  const summary = summaryQuery.data ?? null;
  const hasFilters = search.trim() !== "" || statusFilter !== "all";
  function setStatusFilter(next) {
    void navigate({
      to: "/cuentas-por-cobrar",
      search: (previous) => ({
        ...previous,
        status: next === "all" ? void 0 : next
      }),
      replace: true
    });
  }
  function clearFilters() {
    setSearchInput("");
    void navigate({
      to: "/cuentas-por-cobrar",
      search: () => ({}),
      replace: true
    });
  }
  const columns = reactExports.useMemo(
    () => [
      {
        key: "customer",
        header: "Cliente",
        render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[220px] truncate font-medium", children: row.customerName })
      },
      {
        key: "invoiceNumber",
        header: "N.º factura",
        render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: row.invoiceNumber })
      },
      {
        key: "total",
        header: "Monto total",
        numeric: true,
        render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: formatMoney(row.total) })
      },
      {
        key: "balance",
        header: "Saldo pendiente",
        numeric: true,
        render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold", children: formatMoney(row.balance) })
      },
      {
        key: "dueDate",
        header: "Vencimiento",
        render: (row) => {
          const overdue = row.status === ReceivableStatus.overdue;
          const days = daysUntil(row.dueDate);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: overdue ? "due-overdue" : "data-rail", children: [
            formatDate(row.dueDate),
            overdue && days < 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "due-overdue-days", children: [
              Math.abs(days),
              " d"
            ] }) : null
          ] });
        }
      },
      {
        key: "status",
        header: "Estado",
        render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx(StatusPill, { status: row.status })
      }
    ],
    []
  );
  const actions = reactExports.useMemo(
    () => [
      {
        kind: "save",
        label: "Registrar abono",
        onClick: (row) => setPaymentTarget(row),
        hidden: (row) => row.status === ReceivableStatus.paid
      }
    ],
    []
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "receivables.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Cuentas por cobrar",
            description: "Saldos pendientes de facturas a crédito por cliente, con vencimiento y estado de cada cuenta."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "receivables.summary.section",
            "aria-label": "Resumen de cartera",
            className: "accounts-summary",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-emphasis": "primary",
                  "data-ocid": "receivables.summary.total_card",
                  className: "accounts-card",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-label", children: "Total por cobrar" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-value", children: summaryQuery.isLoading ? "—" : formatMoney((summary == null ? void 0 : summary.totalOutstanding) ?? 0n) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-meta", children: "Saldo pendiente de toda la cartera" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-emphasis": "overdue",
                  "data-ocid": "receivables.summary.overdue_card",
                  className: "accounts-card",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-label", children: "Total vencido" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-value", children: summaryQuery.isLoading ? "—" : formatMoney((summary == null ? void 0 : summary.totalOverdue) ?? 0n) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-meta", children: "Cuentas con vencimiento cumplido" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "receivables.summary.open_card",
                  className: "accounts-card",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-label", children: "Facturas abiertas" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-value", children: summaryQuery.isLoading ? "—" : formatNumber((summary == null ? void 0 : summary.openCount) ?? 0n) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-meta", children: "Cuentas pendientes o vencidas" })
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "receivables.filters",
            className: "flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-subtle lg:flex-row lg:items-center lg:justify-between",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { "data-ocid": "receivables.filter.chips", className: "filter-chips", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "sr-only", children: "Filtrar por estado" }),
                FILTER_OPTIONS.map((option) => {
                  const isActive = statusFilter === option.value;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setStatusFilter(option.value),
                      "data-active": isActive,
                      "data-ocid": `receivables.filter.${option.value}`,
                      "aria-pressed": isActive,
                      className: "filter-chip",
                      children: option.label
                    },
                    option.value
                  );
                })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full lg:w-72", children: [
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
                      value: searchInput,
                      onChange: (event) => setSearchInput(event.target.value),
                      placeholder: "Buscar por cliente o N.º de factura…",
                      "aria-label": "Buscar cuentas por cobrar por cliente o número de factura",
                      "data-ocid": "receivables.search_input",
                      className: "h-9 pl-9"
                    }
                  )
                ] }),
                hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    onClick: clearFilters,
                    "data-ocid": "receivables.clear_filters_button",
                    className: "gap-2 text-muted-foreground",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                      "Limpiar"
                    ]
                  }
                ) : null
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "min-w-0 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: receivablesQuery.isLoading ? "Cargando…" : `${formatNumber(items.length)} cuenta${items.length === 1 ? "" : "s"}` }),
          receivablesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "receivables.error_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-6 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar las cuentas por cobrar." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => void receivablesQuery.refetch({ cancelRefetch: true }),
                    "data-ocid": "receivables.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : receivablesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "receivables.empty_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Wallet,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "No hay cuentas por cobrar" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta el estado o la búsqueda para encontrar cuentas." : "Las facturas a crédito aparecerán aquí con su saldo pendiente." })
                ] }),
                hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: clearFilters,
                    "data-ocid": "receivables.empty_clear_button",
                    children: "Limpiar filtros"
                  }
                ) : null
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              columns,
              rows: items,
              rowKey: (row) => row.invoiceId.toString(),
              actions,
              rowExtraActions: (row, index) => row.customerId === void 0 ? null : /* @__PURE__ */ jsxRuntimeExports.jsx(
                WhatsAppNotifyButton,
                {
                  contactKind: WhatsAppContactKind.customer,
                  contactId: row.customerId,
                  context: WhatsAppContext.receivable,
                  referenceId: row.invoiceId,
                  contactName: row.customerName,
                  ocid: `receivables.whatsapp_button.${index + 1}`
                }
              ),
              ocid: "receivables",
              caption: "Saldos pendientes por cliente"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PaymentDialog,
          {
            open: paymentTarget !== null,
            onOpenChange: (open) => {
              if (!open) setPaymentTarget(null);
            },
            receivable: paymentTarget
          }
        )
      ]
    }
  );
}
export {
  CuentasPorCobrarPage,
  CuentasPorCobrarPage as default
};
