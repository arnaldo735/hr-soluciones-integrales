import { c as createLucideIcon, j as jsxRuntimeExports, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter, B as Button, L as Link, r as reactExports, C as CircleCheck, g as formatNumber, h as ChevronRight, u as useBackend, i as useAuth, k as useQuery, l as useRole, m as ClipboardList, n as CalendarClock, W as Wrench, F as FileText, P as Package, R as Receipt, o as Banknote, T as Truck, p as TriangleAlert, q as Boxes, s as formatMoney, t as formatDate, v as formatDateTime, w as Building2, S as Settings, x as ShieldAlert } from "./index-CGU00UGU.js";
import { S as Skeleton } from "./skeleton-CFVvrB7j.js";
import { A as ArrowUpRight } from "./arrow-up-right-BsxvYost.js";
import { u as useCompanyProfile } from "./use-company-5EPbuX7J.js";
import { P as Phone } from "./phone-CSDJeZ5O.js";
import { M as Mail } from "./mail-DzSJsLqJ.js";
import { M as MapPin } from "./map-pin-CbigMgc-.js";
import { A as ArrowRight } from "./arrow-right-CHXxQuLV.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12", key: "o97t9d" }],
  [
    "path",
    {
      d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
      key: "oot6mr"
    }
  ]
];
const Inbox = createLucideIcon("inbox", __iconNode);
function FieldRow({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-b-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "shrink-0 text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "min-w-0 break-words text-right text-sm font-medium text-foreground", children: value })
  ] });
}
function AlertRecordDetailDialog({
  record,
  moduleTo,
  moduleLabel,
  onOpenChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: record !== null, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    DialogContent,
    {
      "data-ocid": "dashboard.record_detail.dialog",
      className: "max-h-[85vh] overflow-y-auto sm:max-w-md",
      children: record ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: record.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: record.subtitle ?? "Detalle del registro" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "dl",
          {
            "data-ocid": "dashboard.record_detail.fields",
            className: "rounded-md border border-border bg-card px-3 py-1",
            children: record.fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              FieldRow,
              {
                label: field.label,
                value: field.value
              },
              field.label
            ))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => onOpenChange(false),
              "data-ocid": "dashboard.record_detail.back_button",
              children: "Volver a la lista"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, "data-ocid": "dashboard.record_detail.module_link", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: moduleTo, children: [
            "Ir a ",
            moduleLabel,
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { "aria-hidden": "true" })
          ] }) })
        ] })
      ] }) : null
    }
  ) });
}
function statusLabel(status) {
  const labels = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    scheduled: "Programada",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
    inProgress: "En proceso",
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    paid: "Pagada",
    overdue: "Vencida",
    open: "Abierta",
    partial: "Abono parcial"
  };
  return labels[status] ?? status;
}
function RecordRow({
  record,
  index,
  onSelect
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      "data-ocid": `dashboard.alert_list.item.${index + 1}`,
      onClick: () => onSelect(record),
      className: "flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium text-foreground", children: record.title }),
          record.subtitle ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-xs text-muted-foreground", children: record.subtitle }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChevronRight,
          {
            className: "size-4 shrink-0 text-muted-foreground",
            "aria-hidden": "true"
          }
        )
      ]
    }
  ) });
}
function ListSkeleton() {
  const rows = Array.from({ length: 4 }, (_, i) => `alert-list-skeleton-${i}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-ocid": "dashboard.alert_list.loading_state",
      className: "space-y-2",
      "aria-busy": "true",
      "aria-hidden": "true",
      children: rows.map((rowId) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-40" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "size-4 rounded-sm" })
          ]
        },
        rowId
      ))
    }
  );
}
function AlertListDialog({
  title,
  message,
  count,
  icon: Icon,
  records,
  moduleTo,
  moduleLabel,
  isLoading,
  onOpenChange,
  onCloseAutoFocus
}) {
  const [selected, setSelected] = reactExports.useState(null);
  const open = title !== null;
  const hasRecords = records.length > 0;
  const handleOpenChange = (next) => {
    if (!next) setSelected(null);
    onOpenChange(next);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        "data-ocid": "dashboard.alert_list.dialog",
        className: "max-h-[85vh] overflow-y-auto sm:max-w-lg",
        onCloseAutoFocus,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 font-display", children: [
              Icon ? /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-5 text-primary", "aria-hidden": "true" }) : null,
              title
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: message })
          ] }),
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(ListSkeleton, {}) : hasRecords ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "ul",
            {
              "data-ocid": "dashboard.alert_list.list",
              className: "divide-y divide-border overflow-hidden rounded-md border border-border bg-card",
              children: records.map((record, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                RecordRow,
                {
                  record,
                  index,
                  onSelect: setSelected
                },
                record.key
              ))
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "dashboard.alert_list.empty_state",
              className: "flex flex-col items-center gap-2 rounded-md border border-border bg-card px-6 py-10 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Inbox,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Sin registros por ahora" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Esta alerta no tiene registros pendientes." })
              ]
            }
          ),
          !isLoading && hasRecords && count > BigInt(records.length) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              "data-ocid": "dashboard.alert_list.more_notice",
              className: "flex items-center gap-2 text-xs text-muted-foreground",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3.5 shrink-0", "aria-hidden": "true" }),
                "Se muestran ",
                formatNumber(BigInt(records.length)),
                " de",
                " ",
                formatNumber(count),
                " registros. Abre el módulo para verlos todos."
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "sm:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => handleOpenChange(false),
                "data-ocid": "dashboard.alert_list.close_button",
                children: "Cerrar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, "data-ocid": "dashboard.alert_list.module_link", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: moduleTo, children: "Ver módulo completo" }) })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AlertRecordDetailDialog,
      {
        record: selected,
        moduleTo,
        moduleLabel,
        onOpenChange: (next) => {
          if (!next) setSelected(null);
        }
      }
    )
  ] });
}
const DASHBOARD_ALERTS_QUERY_KEY = ["dashboard-alerts"];
function useDashboardAlerts() {
  const { actor, isFetching } = useBackend();
  const { token, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: DASHBOARD_ALERTS_QUERY_KEY,
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getDashboardAlerts(token);
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 6e4
  });
}
const ALERT_DEFINITIONS = [
  {
    key: "unapprovedOrders",
    title: "OT sin aprobar",
    moduleLabel: "Órdenes de taller",
    to: "/ordenes",
    icon: ClipboardList,
    tone: "warning",
    moduleKey: "workshop",
    adminOnly: false,
    count: (summary) => {
      var _a;
      return (_a = summary.unapprovedOrders) == null ? void 0 : _a.count;
    }
  },
  {
    key: "appointments",
    title: "Citas pendientes",
    moduleLabel: "Citas",
    to: "/citas",
    icon: CalendarClock,
    tone: "info",
    moduleKey: "appointments",
    adminOnly: false,
    count: (summary) => {
      var _a;
      return (_a = summary.appointments) == null ? void 0 : _a.count;
    }
  },
  {
    key: "finishedOrders",
    title: "Motos terminadas",
    moduleLabel: "Órdenes de taller",
    to: "/ordenes",
    icon: Wrench,
    tone: "warning",
    moduleKey: "workshop",
    adminOnly: false,
    count: (summary) => {
      var _a;
      return (_a = summary.finishedOrders) == null ? void 0 : _a.count;
    }
  },
  {
    key: "pendingQuotes",
    title: "Cotizaciones pendientes",
    moduleLabel: "Cotizaciones",
    to: "/cotizaciones",
    icon: FileText,
    tone: "info",
    moduleKey: "quotes",
    adminOnly: false,
    count: (summary) => {
      var _a;
      return (_a = summary.pendingQuotes) == null ? void 0 : _a.count;
    }
  },
  {
    key: "lowStockParts",
    title: "Inventario por agotarse",
    moduleLabel: "Inventario",
    to: "/inventario",
    icon: Package,
    tone: "warning",
    moduleKey: "inventory",
    adminOnly: false,
    count: (summary) => {
      var _a;
      return (_a = summary.lowStockParts) == null ? void 0 : _a.count;
    }
  },
  {
    key: "receivables",
    title: "Cuentas por cobrar",
    moduleLabel: "Cuentas por cobrar",
    to: "/cuentas-por-cobrar",
    icon: Receipt,
    tone: "danger",
    moduleKey: "receivables",
    adminOnly: true,
    count: (summary) => {
      var _a;
      return (_a = summary.receivables) == null ? void 0 : _a.count;
    }
  },
  {
    key: "payables",
    title: "Cuentas por pagar",
    moduleLabel: "Cuentas por pagar",
    to: "/cuentas-por-pagar",
    icon: Banknote,
    tone: "danger",
    moduleKey: "payables",
    adminOnly: true,
    count: (summary) => {
      var _a;
      return (_a = summary.payables) == null ? void 0 : _a.count;
    }
  },
  {
    key: "supplierOrders",
    title: "Pedidos a proveedor",
    moduleLabel: "Proveedores",
    to: "/proveedores",
    icon: Truck,
    tone: "info",
    moduleKey: "suppliers",
    adminOnly: true,
    count: (summary) => {
      var _a;
      return (_a = summary.supplierOrders) == null ? void 0 : _a.count;
    }
  },
  {
    key: "overdueInstallments",
    title: "Cuotas vencidas",
    moduleLabel: "Facturas",
    to: "/facturas",
    icon: TriangleAlert,
    tone: "danger",
    moduleKey: "receivables",
    adminOnly: true,
    count: (summary) => {
      var _a;
      return (_a = summary.overdueInstallments) == null ? void 0 : _a.count;
    },
    message: (count) => {
      if (count === 0n) return "Todo al día, sin cuotas vencidas.";
      const n = formatNumber(count);
      return count === 1n ? `Tiene ${n} cuota vencida, haga clic aquí para verla.` : `Tiene ${n} cuotas vencidas, haga clic aquí para verlas.`;
    }
  }
];
function alertMessage(count) {
  if (count === 0n) return "Todo al día, sin pendientes.";
  const n = formatNumber(count);
  return count === 1n ? `Tiene ${n} pendiente, haga clic aquí para verlo.` : `Tiene ${n} pendientes, haga clic aquí para verlos.`;
}
function buildRecords(key, summary) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i;
  switch (key) {
    case "unapprovedOrders":
      return (((_a = summary.unapprovedOrders) == null ? void 0 : _a.items) ?? []).map((item) => ({
        kind: "order",
        key: `order-${item.id}`,
        title: `${item.orderNumber} · ${item.customerName}`,
        subtitle: item.plate,
        fields: [
          { label: "Orden", value: item.orderNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Placa", value: item.plate || "—" },
          { label: "Estado", value: "Pendiente de aprobación" }
        ]
      }));
    case "finishedOrders":
      return (((_b = summary.finishedOrders) == null ? void 0 : _b.items) ?? []).map((item) => ({
        kind: "order",
        key: `finished-${item.id}`,
        title: `${item.orderNumber} · ${item.customerName}`,
        subtitle: item.plate,
        fields: [
          { label: "Orden", value: item.orderNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Placa", value: item.plate || "—" },
          { label: "Días en taller", value: formatNumber(item.daysInWorkshop) }
        ]
      }));
    case "appointments":
      return (((_c = summary.appointments) == null ? void 0 : _c.items) ?? []).map((item) => ({
        kind: "appointment",
        key: `appointment-${item.id}`,
        title: item.customerName,
        subtitle: statusLabel(item.status),
        fields: [
          { label: "Cliente", value: item.customerName },
          { label: "Estado", value: statusLabel(item.status) },
          { label: "Programada", value: formatDateTime(item.scheduledAt) }
        ]
      }));
    case "pendingQuotes":
      return (((_d = summary.pendingQuotes) == null ? void 0 : _d.items) ?? []).map((item) => ({
        kind: "quote",
        key: `quote-${item.id}`,
        title: `${item.quoteNumber} · ${item.customerName}`,
        subtitle: statusLabel(item.status),
        fields: [
          { label: "Cotización", value: item.quoteNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Estado", value: statusLabel(item.status) },
          { label: "Creada", value: formatDate(item.createdAt) }
        ]
      }));
    case "lowStockParts":
      return (((_e = summary.lowStockParts) == null ? void 0 : _e.items) ?? []).map((item) => ({
        kind: "part",
        key: `part-${item.id}`,
        title: item.name,
        subtitle: item.sku,
        fields: [
          { label: "Repuesto", value: item.name },
          { label: "SKU", value: item.sku || "—" },
          { label: "Existencia", value: formatNumber(item.totalStock) },
          {
            label: "Mínimo",
            value: formatNumber(item.lowStockThreshold)
          }
        ]
      }));
    case "receivables":
      return (((_f = summary.receivables) == null ? void 0 : _f.items) ?? []).map((item) => ({
        kind: "receivable",
        key: `receivable-${item.invoiceId}`,
        title: item.customerName,
        subtitle: item.invoiceNumber,
        fields: [
          { label: "Factura", value: item.invoiceNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Saldo", value: formatMoney(item.balance) },
          { label: "Vence", value: formatDate(item.dueDate) },
          { label: "Estado", value: statusLabel(item.status) }
        ]
      }));
    case "payables":
      return (((_g = summary.payables) == null ? void 0 : _g.items) ?? []).map((item) => ({
        kind: "payable",
        key: `payable-${item.supplierId}`,
        title: item.supplierName,
        subtitle: formatMoney(item.balance),
        fields: [
          { label: "Proveedor", value: item.supplierName },
          { label: "Saldo", value: formatMoney(item.balance) },
          { label: "Vence", value: formatDate(item.dueDate) },
          { label: "Estado", value: statusLabel(item.status) }
        ]
      }));
    case "supplierOrders":
      return (((_h = summary.supplierOrders) == null ? void 0 : _h.items) ?? []).map((item) => ({
        kind: "supplierOrder",
        key: `supplier-order-${item.id}`,
        title: item.description || item.sku,
        subtitle: item.supplierName,
        fields: [
          { label: "Proveedor", value: item.supplierName },
          { label: "Descripción", value: item.description || "—" },
          { label: "SKU", value: item.sku || "—" },
          { label: "Cantidad", value: formatNumber(item.quantity) },
          { label: "Creado", value: formatDate(item.createdAt) }
        ]
      }));
    case "overdueInstallments":
      return (((_i = summary.overdueInstallments) == null ? void 0 : _i.items) ?? []).map((item) => ({
        kind: "overdueInstallment",
        key: `installment-${item.invoiceId}-${item.installmentNumber}`,
        title: `${item.invoiceNumber} · ${item.customerName}`,
        subtitle: `Cuota ${formatNumber(item.installmentNumber)}`,
        fields: [
          { label: "Factura", value: item.invoiceNumber },
          { label: "Cliente", value: item.customerName },
          {
            label: "Cuota",
            value: formatNumber(item.installmentNumber)
          },
          { label: "Monto", value: formatMoney(item.amount) },
          { label: "Vence", value: formatDate(item.dueDate) }
        ]
      }));
    default:
      return [];
  }
}
function nitLabel(profile) {
  const base = profile.taxId.trim();
  if (!base) return "—";
  const digit = profile.checkDigit;
  if (digit === void 0 || digit === null) return base;
  return `${base}-${digit.toString()}`;
}
function CompanyHeaderSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "dashboard.company_header.loading",
      className: "company-header",
      "aria-busy": "true",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "mx-auto size-14 rounded-md" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "mx-auto mt-3 h-6 w-64" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "mx-auto mt-2 h-3 w-40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-32" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-32" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-40" })
        ] })
      ]
    }
  );
}
function CompanyHeaderEmpty() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "dashboard.company_header.empty_state",
      className: "company-header",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "company-header-logo", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "company-header-name", children: "Sin datos de la empresa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "company-header-legal", children: "Completa el perfil para mostrarlo aquí" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-md text-xs text-muted-foreground", children: "Aún no se ha configurado la razón social, el NIT ni los datos de contacto del taller." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex justify-center border-t border-border pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/empresa",
            "data-ocid": "dashboard.company_header.configure_link",
            className: "inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "size-3.5", "aria-hidden": "true" }),
              "Configurar empresa"
            ]
          }
        ) })
      ]
    }
  );
}
function CompanyHeader({ profile }) {
  var _a;
  const displayName = ((_a = profile.tradeName) == null ? void 0 : _a.trim()) || profile.legalName;
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => {
    var _a2;
    return ((_a2 = word[0]) == null ? void 0 : _a2.toUpperCase()) ?? "";
  }).join("");
  const fields = [
    { key: "nit", icon: FileText, label: "NIT", value: nitLabel(profile) },
    { key: "phone", icon: Phone, label: "Tel", value: profile.phone || "—" },
    { key: "email", icon: Mail, label: "Correo", value: profile.email || "—" },
    {
      key: "address",
      icon: MapPin,
      label: "Dirección",
      value: [profile.address, profile.city].filter(Boolean).join(", ") || "—"
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { "data-ocid": "dashboard.company_header", className: "company-header", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "company-header-logo", "aria-hidden": "true", children: profile.logoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: profile.logoUrl,
        alt: "",
        className: "size-full rounded-md object-cover"
      }
    ) : initials || /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-6" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "company-header-name", children: displayName }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "company-header-legal", children: profile.legalName }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "company-header-rail", children: fields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "company-header-field", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        field.icon,
        {
          className: "size-3.5 text-muted-foreground",
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "sr-only", children: field.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          field.label,
          ": "
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: field.value })
      ] })
    ] }, field.key)) })
  ] });
}
function CompanyRestrictedNotice() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "dashboard.company_header.restricted_state",
      className: "company-header",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "company-header-logo", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "company-header-name", children: "Perfil de empresa restringido" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "company-header-legal", children: "Tu rol no incluye el módulo de empresa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-md text-xs text-muted-foreground", children: "Las alertas de los módulos que sí puedes usar siguen disponibles más abajo." })
      ]
    }
  );
}
function AlertCard({
  alert,
  count,
  index,
  onOpen
}) {
  const isClear = count === 0n;
  const Icon = alert.icon;
  const message = alert.message ? alert.message(count) : alertMessage(count);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: (event) => onOpen(event.currentTarget),
      "data-ocid": `dashboard.alert.${index + 1}`,
      "data-tone": alert.tone,
      "data-clear": isClear ? "true" : "false",
      className: "alert-card",
      "aria-label": `${alert.title}: ${message}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "alert-card-strip", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "alert-card-body", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "alert-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "alert-card-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "alert-card-title block", children: alert.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "alert-card-module block", children: alert.moduleLabel })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "alert-card-count", children: formatNumber(count) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "alert-card-message", children: message }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "alert-card-cta", children: [
            "Ver registros",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { "aria-hidden": "true" })
          ] })
        ] })
      ]
    }
  );
}
function AlertGridSkeleton() {
  const cards = Array.from({ length: 6 }, (_, i) => `alert-skeleton-${i}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-ocid": "dashboard.alerts.loading",
      className: "alert-grid",
      "aria-busy": "true",
      "aria-hidden": "true",
      children: cards.map((cardId) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "alert-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "alert-card-strip" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "alert-card-body", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "alert-card-head", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "size-9 rounded-md" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-32" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-16" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" })
        ] })
      ] }, cardId))
    }
  );
}
function MechanicNotice() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "dashboard.admin_only_notice",
      className: "flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ShieldAlert,
          {
            className: "mt-0.5 size-4 shrink-0 text-muted-foreground",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Vista de mecánico" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Las alertas de administración, compras y cuentas por pagar requieren un administrador. Solicita acceso para ver el panel completo." })
        ] })
      ]
    }
  );
}
function DashboardPage() {
  var _a, _b;
  const { isAdmin, isLoading: isRoleLoading, modules } = useRole();
  const canCompany = modules === null || modules.includes("company");
  const profileQuery = useCompanyProfile({ enabled: canCompany });
  const alertsQuery = useDashboardAlerts();
  const [openAlertKey, setOpenAlertKey] = reactExports.useState(null);
  const alertTriggerRef = reactExports.useRef(null);
  const isError = alertsQuery.isError;
  const showSkeleton = isRoleLoading || canCompany && profileQuery.isLoading || alertsQuery.isLoading;
  const summary = alertsQuery.data;
  const profile = profileQuery.data ?? null;
  const alerts = summary ? ALERT_DEFINITIONS.map((alert) => ({
    alert,
    count: alert.count(summary)
  })).filter(
    (entry) => entry.count !== void 0 && (isAdmin || !entry.alert.adminOnly)
  ) : [];
  const openAlert = openAlertKey ? ((_a = alerts.find((entry) => entry.alert.key === openAlertKey)) == null ? void 0 : _a.alert) ?? null : null;
  const openCount = openAlertKey ? ((_b = alerts.find((entry) => entry.alert.key === openAlertKey)) == null ? void 0 : _b.count) ?? 0n : 0n;
  const openRecords = openAlert && summary ? buildRecords(openAlert.key, summary) : [];
  const openMessage = openAlert ? openAlert.message ? openAlert.message(openCount) : alertMessage(openCount) : "";
  const refetchAll = () => {
    if (canCompany) {
      void profileQuery.refetch({ cancelRefetch: true });
    }
    void alertsQuery.refetch({ cancelRefetch: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "dashboard.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-6",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Panel de operación" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Identidad del taller y alertas de trabajo pendiente por módulo." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: refetchAll,
              "data-ocid": "dashboard.refresh_button",
              children: "Actualizar"
            }
          )
        ] }),
        isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "dashboard.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-5 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "No se pudo cargar el panel" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: refetchAll,
                  "data-ocid": "dashboard.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          showSkeleton ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeaderSkeleton, {}) : !canCompany ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyRestrictedNotice, {}) : profile ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeader, { profile }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeaderEmpty, {}),
          !isRoleLoading && !isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(MechanicNotice, {}) : null,
          showSkeleton ? /* @__PURE__ */ jsxRuntimeExports.jsx(AlertGridSkeleton, {}) : alerts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "dashboard.alerts.empty_state",
              className: "flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-6 py-12 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Boxes,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Sin alertas disponibles" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Tu rol no tiene módulos con alertas configuradas." })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "section",
            {
              "data-ocid": "dashboard.alerts.section",
              "aria-label": "Alertas de trabajo pendiente",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert-grid", children: alerts.map(({ alert, count }, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                AlertCard,
                {
                  alert,
                  count,
                  index,
                  onOpen: (trigger) => {
                    alertTriggerRef.current = trigger;
                    setOpenAlertKey(alert.key);
                  }
                },
                alert.key
              )) })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertListDialog,
          {
            title: (openAlert == null ? void 0 : openAlert.title) ?? null,
            message: openMessage,
            count: openCount,
            icon: (openAlert == null ? void 0 : openAlert.icon) ?? Boxes,
            records: openRecords,
            moduleTo: (openAlert == null ? void 0 : openAlert.to) ?? "/",
            moduleLabel: (openAlert == null ? void 0 : openAlert.moduleLabel) ?? "",
            isLoading: showSkeleton,
            onOpenChange: (next) => {
              if (!next) setOpenAlertKey(null);
            },
            onCloseAutoFocus: (event) => {
              var _a2;
              event.preventDefault();
              (_a2 = alertTriggerRef.current) == null ? void 0 : _a2.focus();
            }
          }
        )
      ]
    }
  );
}
export {
  DashboardPage
};
