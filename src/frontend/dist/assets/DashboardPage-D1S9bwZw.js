import { u as useRole, j as jsxRuntimeExports, B as Button, T as TriangleAlert, C as ClipboardList, a as CalendarClock, U as Users, W as Wrench, P as Package, b as Tags, c as Truck, d as Boxes, F as FileText, R as Receipt, S as ScanBarcode, e as Wallet, f as Building2, H as HandCoins, g as Banknote, h as FileSpreadsheet, i as Settings, k as useBackend, l as useQuery, L as Link, m as ShieldAlert, n as formatNumber, o as PartSort, p as ServiceSort, Q as QuoteSort, I as InvoiceSort } from "./index-CzQEXdHP.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { u as useCompanyProfile } from "./use-company-Db6O1TYw.js";
import { P as Phone } from "./phone-B-73ly9n.js";
import { M as Mail } from "./mail-BsdNiCp8.js";
import { M as MapPin } from "./map-pin-CS4Az_ye.js";
const EMPTY_METRICS = {
  activeOrders: 0n,
  appointments: 0n,
  technicians: 0n,
  parts: 0n,
  services: 0n,
  customers: 0n,
  quotes: 0n,
  invoices: 0n,
  posSales: 0n,
  purchaseInvoices: 0n,
  receivables: 0n,
  payables: 0n,
  expenses: 0n,
  commissions: 0n,
  accounting: 0n
};
function useDashboardMetrics(isAdmin) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["dashboard-metrics", isAdmin],
    queryFn: async () => {
      if (!actor) return EMPTY_METRICS;
      const [
        orders,
        appointments,
        technicians,
        parts,
        services,
        customers,
        quotes,
        invoices,
        posSales,
        purchaseInvoices,
        receivables,
        payables,
        expenses,
        commissionLines,
        accounting
      ] = await Promise.all([
        actor.listOrders({}, 0n, 1n),
        actor.listAppointments({}),
        actor.listTechnicians({}),
        actor.listParts({}, PartSort.name, 0n, 1n),
        actor.listServices({}, ServiceSort.name, 0n, 1n),
        actor.listCustomers(null),
        actor.listQuotes({}, QuoteSort.createdAt, 0n, 1n),
        isAdmin ? actor.listInvoices({}, 0n, 1n) : Promise.resolve(null),
        actor.listPosSales({}, 0n, 1n),
        isAdmin ? actor.listPurchaseInvoices({}, InvoiceSort.createdAt, 0n, 1n) : Promise.resolve(null),
        isAdmin ? actor.listReceivables({}) : Promise.resolve(null),
        isAdmin ? actor.listPayables() : Promise.resolve(null),
        isAdmin ? actor.listExpenses({}, 0n, 1n) : Promise.resolve(null),
        isAdmin ? actor.listCommissionPayments({}) : Promise.resolve(null),
        isAdmin ? actor.getAccountingSummary({}) : Promise.resolve(null)
      ]);
      return {
        activeOrders: orders.total,
        appointments: BigInt(appointments.length),
        technicians: BigInt(technicians.length),
        parts: parts.total,
        services: services.total,
        customers: BigInt(customers.length),
        quotes: quotes.total,
        invoices: (invoices == null ? void 0 : invoices.total) ?? 0n,
        posSales: posSales.total,
        purchaseInvoices: (purchaseInvoices == null ? void 0 : purchaseInvoices.total) ?? 0n,
        receivables: BigInt((receivables == null ? void 0 : receivables.length) ?? 0),
        payables: BigInt((payables == null ? void 0 : payables.length) ?? 0),
        expenses: (expenses == null ? void 0 : expenses.total) ?? 0n,
        commissions: BigInt((commissionLines == null ? void 0 : commissionLines.length) ?? 0),
        accounting: (accounting == null ? void 0 : accounting.invoiceCount) ?? 0n
      };
    },
    enabled: !!actor && !isFetching
  });
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
const FLOW_GROUPS = [
  {
    id: "taller",
    label: "Taller",
    icon: Wrench,
    shortcuts: [
      {
        key: "orders",
        label: "Órdenes de taller",
        to: "/ordenes",
        icon: ClipboardList,
        metric: (m) => formatNumber(m.activeOrders),
        caption: "órdenes registradas",
        tone: "primary",
        adminOnly: false
      },
      {
        key: "appointments",
        label: "Citas",
        to: "/citas",
        icon: CalendarClock,
        metric: (m) => formatNumber(m.appointments),
        caption: "citas agendadas",
        tone: "primary",
        adminOnly: false
      },
      {
        key: "technicians",
        label: "Técnicos",
        to: "/tecnicos",
        icon: Users,
        metric: (m) => formatNumber(m.technicians),
        caption: "técnicos en nómina",
        tone: "primary",
        adminOnly: false
      }
    ]
  },
  {
    id: "catalogo",
    label: "Catálogo",
    icon: Boxes,
    shortcuts: [
      {
        key: "inventory",
        label: "Inventario",
        to: "/inventario",
        icon: Package,
        metric: (m) => formatNumber(m.parts),
        caption: "repuestos en catálogo",
        tone: "accent",
        adminOnly: false
      },
      {
        key: "services",
        label: "Servicios",
        to: "/servicios",
        icon: Wrench,
        metric: (m) => formatNumber(m.services),
        caption: "servicios ofrecidos",
        tone: "accent",
        adminOnly: false
      },
      {
        key: "service-categories",
        label: "Categorías de servicios",
        to: "/servicios/categorias",
        icon: Tags,
        metric: (m) => formatNumber(m.services),
        caption: "servicios clasificados",
        tone: "accent",
        adminOnly: true
      },
      {
        key: "customers",
        label: "Clientes y motos",
        to: "/clientes",
        icon: Users,
        metric: (m) => formatNumber(m.customers),
        caption: "clientes registrados",
        tone: "accent",
        adminOnly: false
      },
      {
        key: "suppliers",
        label: "Proveedores",
        to: "/proveedores",
        icon: Truck,
        metric: (m) => formatNumber(m.purchaseInvoices),
        caption: "facturas de compra",
        tone: "accent",
        adminOnly: true
      }
    ]
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: Receipt,
    shortcuts: [
      {
        key: "quotes",
        label: "Cotizaciones",
        to: "/cotizaciones",
        icon: FileText,
        metric: (m) => formatNumber(m.quotes),
        caption: "cotizaciones emitidas",
        tone: "primary",
        adminOnly: false
      },
      {
        key: "invoices",
        label: "Facturas",
        to: "/facturas",
        icon: Receipt,
        metric: (m) => formatNumber(m.invoices),
        caption: "facturas de venta",
        tone: "primary",
        adminOnly: true
      },
      {
        key: "pos",
        label: "POS mostrador",
        to: "/pos",
        icon: ScanBarcode,
        metric: (m) => formatNumber(m.posSales),
        caption: "ventas de mostrador",
        tone: "primary",
        adminOnly: false
      }
    ]
  },
  {
    id: "compras",
    label: "Compras",
    icon: Truck,
    shortcuts: [
      {
        key: "purchase-invoices",
        label: "Facturas de compra",
        to: "/facturas-compra",
        icon: Receipt,
        metric: (m) => formatNumber(m.purchaseInvoices),
        caption: "facturas registradas",
        tone: "accent",
        adminOnly: true
      },
      {
        key: "payables",
        label: "Cuentas por pagar",
        to: "/cuentas-por-pagar",
        icon: Wallet,
        metric: (m) => formatNumber(m.payables),
        caption: "cuentas pendientes",
        tone: "accent",
        adminOnly: true
      }
    ]
  },
  {
    id: "administracion",
    label: "Administración",
    icon: Settings,
    shortcuts: [
      {
        key: "company",
        label: "Empresa",
        to: "/empresa",
        icon: Building2,
        metric: (m) => formatNumber(m.customers),
        caption: "clientes en cartera",
        tone: "info",
        adminOnly: true
      },
      {
        key: "receivables",
        label: "Cuentas por cobrar",
        to: "/cuentas-por-cobrar",
        icon: HandCoins,
        metric: (m) => formatNumber(m.receivables),
        caption: "cuentas por cobrar",
        tone: "info",
        adminOnly: true
      },
      {
        key: "expenses",
        label: "Gastos",
        to: "/gastos",
        icon: Banknote,
        metric: (m) => formatNumber(m.expenses),
        caption: "gastos registrados",
        tone: "info",
        adminOnly: true
      },
      {
        key: "commissions",
        label: "Comisiones y préstamos",
        to: "/comisiones",
        icon: HandCoins,
        metric: (m) => formatNumber(m.commissions),
        caption: "pagos de comisión",
        tone: "info",
        adminOnly: true
      },
      {
        key: "accounting",
        label: "Contabilidad",
        to: "/contabilidad",
        icon: FileSpreadsheet,
        metric: (m) => formatNumber(m.accounting),
        caption: "facturas del periodo",
        tone: "info",
        adminOnly: true
      },
      {
        key: "settings",
        label: "Configuración",
        to: "/configuracion",
        icon: Settings,
        metric: (m) => formatNumber(m.payables),
        caption: "cuentas por pagar",
        tone: "info",
        adminOnly: true
      }
    ]
  }
];
function ShortcutCard({
  shortcut,
  metrics,
  index
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: shortcut.to,
      "data-ocid": `dashboard.shortcut.${index + 1}`,
      "data-tone": shortcut.tone,
      className: "flow-shortcut",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flow-shortcut-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flow-shortcut-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(shortcut.icon, { className: "size-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flow-shortcut-name", children: shortcut.label })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "flow-shortcut-metric",
            "data-tone": shortcut.tone,
            "aria-label": `${shortcut.metric(metrics)} ${shortcut.caption}`,
            children: shortcut.metric(metrics)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flow-shortcut-caption", children: shortcut.caption })
      ]
    }
  );
}
function FlowGroupSection({
  group,
  metrics,
  isAdmin
}) {
  const shortcuts = group.shortcuts.filter(
    (shortcut) => isAdmin || !shortcut.adminOnly
  );
  if (shortcuts.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": `dashboard.flow.${group.id}`,
      "aria-label": group.label,
      className: "flow-group",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flow-group-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flow-group-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(group.icon, { className: "size-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "flow-group-label", children: group.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flow-group-count", children: [
            formatNumber(BigInt(shortcuts.length)),
            " módulos"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flow-shortcuts", children: shortcuts.map((shortcut, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ShortcutCard,
          {
            shortcut,
            metrics,
            index
          },
          shortcut.key
        )) })
      ]
    }
  );
}
function FlowSkeleton() {
  const groups = Array.from({ length: 3 }, (_, i) => `flow-skeleton-${i}`);
  const cards = Array.from({ length: 3 }, (_, i) => `flow-card-${i}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-ocid": "dashboard.flows.loading",
      className: "space-y-4",
      "aria-busy": "true",
      "aria-hidden": "true",
      children: groups.map((groupId) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flow-group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "mb-3 h-4 w-28" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flow-shortcuts", children: cards.map((cardId) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 w-full rounded-md" }, cardId)) })
      ] }, groupId))
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Los módulos de administración, compras y los importes de costo requieren un administrador. Solicita acceso para ver el panel completo." })
        ] })
      ]
    }
  );
}
function DashboardPage() {
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const profileQuery = useCompanyProfile();
  const metricsQuery = useDashboardMetrics(isAdmin);
  const isError = profileQuery.isError || metricsQuery.isError;
  const showSkeleton = isRoleLoading || profileQuery.isLoading || metricsQuery.isLoading;
  const metrics = metricsQuery.data ?? EMPTY_METRICS;
  const profile = profileQuery.data ?? null;
  const refetchAll = () => {
    void profileQuery.refetch({ cancelRefetch: true });
    void metricsQuery.refetch({ cancelRefetch: true });
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Identidad del taller y accesos directos a cada flujo de trabajo." })
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
          showSkeleton ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeaderSkeleton, {}) : profile ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeader, { profile }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeaderEmpty, {}),
          !isRoleLoading && !isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(MechanicNotice, {}) : null,
          showSkeleton ? /* @__PURE__ */ jsxRuntimeExports.jsx(FlowSkeleton, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              "data-ocid": "dashboard.flows.section",
              className: "space-y-4",
              "aria-label": "Accesos directos por flujo",
              children: FLOW_GROUPS.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                FlowGroupSection,
                {
                  group,
                  metrics,
                  isAdmin
                },
                group.id
              ))
            }
          )
        ] })
      ]
    }
  );
}
export {
  DashboardPage
};
