import { u as useRole, j as jsxRuntimeExports, B as Button, T as TriangleAlert, C as ClipboardList, a as CalendarClock, U as Users, W as Wrench, P as Package, b as Tags, c as Truck, d as Boxes, F as FileText, R as Receipt, S as ScanBarcode, e as Wallet, f as Building2, H as HandCoins, g as Banknote, h as FileSpreadsheet, i as Settings, k as useBackend, l as useAuth, m as useQuery, L as Link, n as ShieldAlert, o as formatNumber, p as PartSort, q as ServiceSort, Q as QuoteSort, I as InvoiceSort } from "./index-EqGEeyjs.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { u as useCompanyProfile } from "./use-company-B0ILLjch.js";
import { P as Phone } from "./phone-D7UovjEM.js";
import { M as Mail } from "./mail-B11strfl.js";
import { M as MapPin } from "./map-pin-B-fyyO2n.js";
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
const DASHBOARD_MODULES = {
  workshop: "workshop",
  appointments: "appointments",
  technicians: "technicians",
  inventory: "inventory",
  services: "services",
  customers: "customers",
  quotes: "quotes",
  billing: "billing",
  pos: "pos",
  purchaseInvoices: "purchaseInvoices",
  receivables: "receivables",
  payables: "payables",
  expenses: "expenses",
  commissions: "commissions",
  accounting: "accounting"
};
function canAccess(modules, moduleKey) {
  if (modules === null) return true;
  return modules.includes(moduleKey);
}
function useDashboardMetrics(modules) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const canWorkshop = canAccess(modules, DASHBOARD_MODULES.workshop);
  const canAppointments = canAccess(modules, DASHBOARD_MODULES.appointments);
  const canTechnicians = canAccess(modules, DASHBOARD_MODULES.technicians);
  const canInventory = canAccess(modules, DASHBOARD_MODULES.inventory);
  const canServices = canAccess(modules, DASHBOARD_MODULES.services);
  const canCustomers = canAccess(modules, DASHBOARD_MODULES.customers);
  const canQuotes = canAccess(modules, DASHBOARD_MODULES.quotes);
  const canBilling = canAccess(modules, DASHBOARD_MODULES.billing);
  const canPos = canAccess(modules, DASHBOARD_MODULES.pos);
  const canPurchaseInvoices = canAccess(
    modules,
    DASHBOARD_MODULES.purchaseInvoices
  );
  const canReceivables = canAccess(modules, DASHBOARD_MODULES.receivables);
  const canPayables = canAccess(modules, DASHBOARD_MODULES.payables);
  const canExpenses = canAccess(modules, DASHBOARD_MODULES.expenses);
  const canCommissions = canAccess(modules, DASHBOARD_MODULES.commissions);
  const canAccounting = canAccess(modules, DASHBOARD_MODULES.accounting);
  return useQuery({
    queryKey: [
      "dashboard-metrics",
      modules === null ? "all" : [...modules].sort().join(","),
      token
    ],
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
        canWorkshop ? actor.listOrders(token, {}, 0n, 1n) : Promise.resolve(null),
        canAppointments ? actor.listAppointments(token, {}) : Promise.resolve(null),
        canTechnicians ? actor.listTechnicians(token, {}) : Promise.resolve(null),
        canInventory ? actor.listParts(token, {}, PartSort.name, 0n, 1n) : Promise.resolve(null),
        canServices ? actor.listServices(token, {}, ServiceSort.name, 0n, 1n) : Promise.resolve(null),
        canCustomers ? actor.listCustomers(token, null) : Promise.resolve(null),
        canQuotes ? actor.listQuotes(token, {}, QuoteSort.createdAt, 0n, 1n) : Promise.resolve(null),
        canBilling ? actor.listInvoices(token, {}, 0n, 1n) : Promise.resolve(null),
        canPos ? actor.listPosSales(token, {}, 0n, 1n) : Promise.resolve(null),
        canPurchaseInvoices ? actor.listPurchaseInvoices(token, {}, InvoiceSort.createdAt, 0n, 1n) : Promise.resolve(null),
        canReceivables ? actor.listReceivables(token, {}) : Promise.resolve(null),
        canPayables ? actor.listPayables(token) : Promise.resolve(null),
        canExpenses ? actor.listExpenses(token, {}, 0n, 1n) : Promise.resolve(null),
        canCommissions ? actor.listCommissionPayments(token, {}) : Promise.resolve(null),
        canAccounting ? actor.getAccountingSummary(token, {}) : Promise.resolve(null)
      ]);
      return {
        activeOrders: (orders == null ? void 0 : orders.total) ?? 0n,
        appointments: BigInt((appointments == null ? void 0 : appointments.length) ?? 0),
        technicians: BigInt((technicians == null ? void 0 : technicians.length) ?? 0),
        parts: (parts == null ? void 0 : parts.total) ?? 0n,
        services: (services == null ? void 0 : services.total) ?? 0n,
        customers: BigInt((customers == null ? void 0 : customers.length) ?? 0),
        quotes: (quotes == null ? void 0 : quotes.total) ?? 0n,
        invoices: (invoices == null ? void 0 : invoices.total) ?? 0n,
        posSales: (posSales == null ? void 0 : posSales.total) ?? 0n,
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
        moduleKey: "workshop"
      },
      {
        key: "appointments",
        label: "Citas",
        to: "/citas",
        icon: CalendarClock,
        metric: (m) => formatNumber(m.appointments),
        caption: "citas agendadas",
        tone: "primary",
        moduleKey: "appointments"
      },
      {
        key: "technicians",
        label: "Técnicos",
        to: "/tecnicos",
        icon: Users,
        metric: (m) => formatNumber(m.technicians),
        caption: "técnicos en nómina",
        tone: "primary",
        moduleKey: "technicians"
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
        moduleKey: "inventory"
      },
      {
        key: "services",
        label: "Servicios",
        to: "/servicios",
        icon: Wrench,
        metric: (m) => formatNumber(m.services),
        caption: "servicios ofrecidos",
        tone: "accent",
        moduleKey: "services"
      },
      {
        key: "service-categories",
        label: "Categorías de servicios",
        to: "/servicios/categorias",
        icon: Tags,
        metric: (m) => formatNumber(m.services),
        caption: "servicios clasificados",
        tone: "accent",
        moduleKey: "serviceCategories"
      },
      {
        key: "customers",
        label: "Clientes y motos",
        to: "/clientes",
        icon: Users,
        metric: (m) => formatNumber(m.customers),
        caption: "clientes registrados",
        tone: "accent",
        moduleKey: "customers"
      },
      {
        key: "suppliers",
        label: "Proveedores",
        to: "/proveedores",
        icon: Truck,
        metric: (m) => formatNumber(m.purchaseInvoices),
        caption: "facturas de compra",
        tone: "accent",
        moduleKey: "suppliers"
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
        moduleKey: "quotes"
      },
      {
        key: "invoices",
        label: "Facturas",
        to: "/facturas",
        icon: Receipt,
        metric: (m) => formatNumber(m.invoices),
        caption: "facturas de venta",
        tone: "primary",
        moduleKey: "billing"
      },
      {
        key: "pos",
        label: "POS mostrador",
        to: "/pos",
        icon: ScanBarcode,
        metric: (m) => formatNumber(m.posSales),
        caption: "ventas de mostrador",
        tone: "primary",
        moduleKey: "pos"
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
        moduleKey: "purchaseInvoices"
      },
      {
        key: "payables",
        label: "Cuentas por pagar",
        to: "/cuentas-por-pagar",
        icon: Wallet,
        metric: (m) => formatNumber(m.payables),
        caption: "cuentas pendientes",
        tone: "accent",
        moduleKey: "payables"
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
        moduleKey: "company"
      },
      {
        key: "receivables",
        label: "Cuentas por cobrar",
        to: "/cuentas-por-cobrar",
        icon: HandCoins,
        metric: (m) => formatNumber(m.receivables),
        caption: "cuentas por cobrar",
        tone: "info",
        moduleKey: "receivables"
      },
      {
        key: "expenses",
        label: "Gastos",
        to: "/gastos",
        icon: Banknote,
        metric: (m) => formatNumber(m.expenses),
        caption: "gastos registrados",
        tone: "info",
        moduleKey: "expenses"
      },
      {
        key: "commissions",
        label: "Comisiones y préstamos",
        to: "/comisiones",
        icon: HandCoins,
        metric: (m) => formatNumber(m.commissions),
        caption: "pagos de comisión",
        tone: "info",
        moduleKey: "commissions"
      },
      {
        key: "accounting",
        label: "Contabilidad",
        to: "/contabilidad",
        icon: FileSpreadsheet,
        metric: (m) => formatNumber(m.accounting),
        caption: "facturas del periodo",
        tone: "info",
        moduleKey: "accounting"
      },
      {
        key: "settings",
        label: "Configuración",
        to: "/configuracion",
        icon: Settings,
        metric: (m) => formatNumber(m.payables),
        caption: "cuentas por pagar",
        tone: "info",
        moduleKey: "settings"
      }
    ]
  }
];
function ShortcutCard({
  shortcut,
  metrics,
  index,
  accessible
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
        accessible ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "flow-shortcut-metric",
            "data-tone": shortcut.tone,
            "aria-label": `${shortcut.metric(metrics)} ${shortcut.caption}`,
            children: shortcut.metric(metrics)
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "flow-shortcut-metric text-muted-foreground",
            "data-tone": shortcut.tone,
            "aria-label": "Sin acceso a este módulo",
            children: "—"
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
  modules
}) {
  const shortcuts = group.shortcuts.filter(
    (shortcut) => canAccess(modules, shortcut.moduleKey ?? "")
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
            index,
            accessible: canAccess(modules, shortcut.moduleKey ?? "")
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-md text-xs text-muted-foreground", children: "Los accesos directos a los flujos que sí puedes usar siguen disponibles más abajo." })
      ]
    }
  );
}
function DashboardPage() {
  const { isAdmin, isLoading: isRoleLoading, modules } = useRole();
  const canCompany = canAccess(modules, "company");
  const profileQuery = useCompanyProfile({ enabled: canCompany });
  const metricsQuery = useDashboardMetrics(modules);
  const isError = metricsQuery.isError;
  const showSkeleton = isRoleLoading || canCompany && profileQuery.isLoading || metricsQuery.isLoading;
  const metrics = metricsQuery.data ?? EMPTY_METRICS;
  const profile = profileQuery.data ?? null;
  const refetchAll = () => {
    if (canCompany) {
      void profileQuery.refetch({ cancelRefetch: true });
    }
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
          showSkeleton ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeaderSkeleton, {}) : !canCompany ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyRestrictedNotice, {}) : profile ? /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeader, { profile }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyHeaderEmpty, {}),
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
                  modules
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
