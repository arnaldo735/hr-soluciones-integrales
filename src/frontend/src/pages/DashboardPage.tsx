import { InvoiceSort } from "@/backend";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/use-backend";
import { useCompanyProfile } from "@/hooks/use-company";
import { useRole } from "@/hooks/use-role";
import { formatMoney, formatNumber } from "@/lib/format";
import type { CompanyProfile } from "@/lib/types";
import { PartSort, QuoteSort, ServiceSort } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Banknote,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  HandCoins,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  ScanBarcode,
  Settings,
  ShieldAlert,
  Tags,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ---------------------------------------------------------------------------
 * Live metrics
 * ------------------------------------------------------------------------- */

interface DashboardMetrics {
  activeOrders: bigint;
  appointments: bigint;
  technicians: bigint;
  parts: bigint;
  services: bigint;
  customers: bigint;
  quotes: bigint;
  invoices: bigint;
  posSales: bigint;
  purchaseInvoices: bigint;
  receivables: bigint;
  payables: bigint;
  expenses: bigint;
  commissions: bigint;
  accounting: bigint;
}

const EMPTY_METRICS: DashboardMetrics = {
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
  accounting: 0n,
};

/**
 * Aggregates the live counters shown on each flow shortcut. Every call is a
 * cheap list/count read; the panel is the only consumer, so the metrics live
 * here instead of in a shared hook.
 */
function useDashboardMetrics(isAdmin: boolean) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["dashboard-metrics", isAdmin],
    queryFn: async (): Promise<DashboardMetrics> => {
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
        accounting,
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
        isAdmin
          ? actor.listPurchaseInvoices({}, InvoiceSort.createdAt, 0n, 1n)
          : Promise.resolve(null),
        isAdmin ? actor.listReceivables({}) : Promise.resolve(null),
        isAdmin ? actor.listPayables() : Promise.resolve(null),
        isAdmin ? actor.listExpenses({}, 0n, 1n) : Promise.resolve(null),
        isAdmin ? actor.listCommissionPayments({}) : Promise.resolve(null),
        isAdmin ? actor.getAccountingSummary({}) : Promise.resolve(null),
      ]);

      return {
        activeOrders: orders.total,
        appointments: BigInt(appointments.length),
        technicians: BigInt(technicians.length),
        parts: parts.total,
        services: services.total,
        customers: BigInt(customers.length),
        quotes: quotes.total,
        invoices: invoices?.total ?? 0n,
        posSales: posSales.total,
        purchaseInvoices: purchaseInvoices?.total ?? 0n,
        receivables: BigInt(receivables?.length ?? 0),
        payables: BigInt(payables?.length ?? 0),
        expenses: expenses?.total ?? 0n,
        commissions: BigInt(commissionLines?.length ?? 0),
        accounting: accounting?.invoiceCount ?? 0n,
      };
    },
    enabled: !!actor && !isFetching,
  });
}

/* ---------------------------------------------------------------------------
 * Company nameplate header
 * ------------------------------------------------------------------------- */

function nitLabel(profile: CompanyProfile): string {
  const base = profile.taxId.trim();
  if (!base) return "—";
  const digit = profile.checkDigit;
  if (digit === undefined || digit === null) return base;
  return `${base}-${digit.toString()}`;
}

function CompanyHeaderSkeleton() {
  return (
    <div
      data-ocid="dashboard.company_header.loading"
      className="company-header"
      aria-busy="true"
      aria-hidden="true"
    >
      <Skeleton className="mx-auto size-14 rounded-md" />
      <Skeleton className="mx-auto mt-3 h-6 w-64" />
      <Skeleton className="mx-auto mt-2 h-3 w-40" />
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function CompanyHeaderEmpty() {
  return (
    <div
      data-ocid="dashboard.company_header.empty_state"
      className="company-header"
    >
      <div className="company-header-logo" aria-hidden="true">
        <Building2 className="size-6" />
      </div>
      <p className="company-header-name">Sin datos de la empresa</p>
      <p className="company-header-legal">
        Completa el perfil para mostrarlo aquí
      </p>
      <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
        Aún no se ha configurado la razón social, el NIT ni los datos de
        contacto del taller.
      </p>
      <div className="mt-4 flex justify-center border-t border-border pt-4">
        <Link
          to="/empresa"
          data-ocid="dashboard.company_header.configure_link"
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="size-3.5" aria-hidden="true" />
          Configurar empresa
        </Link>
      </div>
    </div>
  );
}

function CompanyHeader({ profile }: { profile: CompanyProfile }) {
  const displayName = profile.tradeName?.trim() || profile.legalName;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  const fields: Array<{
    key: string;
    icon: LucideIcon;
    label: string;
    value: string;
  }> = [
    { key: "nit", icon: FileText, label: "NIT", value: nitLabel(profile) },
    { key: "phone", icon: Phone, label: "Tel", value: profile.phone || "—" },
    { key: "email", icon: Mail, label: "Correo", value: profile.email || "—" },
    {
      key: "address",
      icon: MapPin,
      label: "Dirección",
      value: [profile.address, profile.city].filter(Boolean).join(", ") || "—",
    },
  ];

  return (
    <header data-ocid="dashboard.company_header" className="company-header">
      <div className="company-header-logo" aria-hidden="true">
        {profile.logoUrl ? (
          <img
            src={profile.logoUrl}
            alt=""
            className="size-full rounded-md object-cover"
          />
        ) : (
          initials || <Building2 className="size-6" />
        )}
      </div>
      <h2 className="company-header-name">{displayName}</h2>
      <p className="company-header-legal">{profile.legalName}</p>
      <dl className="company-header-rail">
        {fields.map((field) => (
          <div key={field.key} className="company-header-field">
            <field.icon
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <dt className="sr-only">{field.label}</dt>
            <dd>
              <span className="text-muted-foreground">{field.label}: </span>
              <strong>{field.value}</strong>
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

/* ---------------------------------------------------------------------------
 * Flow shortcuts
 * ------------------------------------------------------------------------- */

type ShortcutTone = "primary" | "accent" | "info";

interface Shortcut {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  metric: (metrics: DashboardMetrics) => string;
  caption: string;
  tone: ShortcutTone;
  adminOnly: boolean;
}

interface FlowGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcuts: Shortcut[];
}

const FLOW_GROUPS: FlowGroup[] = [
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
        adminOnly: false,
      },
      {
        key: "appointments",
        label: "Citas",
        to: "/citas",
        icon: CalendarClock,
        metric: (m) => formatNumber(m.appointments),
        caption: "citas agendadas",
        tone: "primary",
        adminOnly: false,
      },
      {
        key: "technicians",
        label: "Técnicos",
        to: "/tecnicos",
        icon: Users,
        metric: (m) => formatNumber(m.technicians),
        caption: "técnicos en nómina",
        tone: "primary",
        adminOnly: false,
      },
    ],
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
        adminOnly: false,
      },
      {
        key: "services",
        label: "Servicios",
        to: "/servicios",
        icon: Wrench,
        metric: (m) => formatNumber(m.services),
        caption: "servicios ofrecidos",
        tone: "accent",
        adminOnly: false,
      },
      {
        key: "service-categories",
        label: "Categorías de servicios",
        to: "/servicios/categorias",
        icon: Tags,
        metric: (m) => formatNumber(m.services),
        caption: "servicios clasificados",
        tone: "accent",
        adminOnly: true,
      },
      {
        key: "customers",
        label: "Clientes y motos",
        to: "/clientes",
        icon: Users,
        metric: (m) => formatNumber(m.customers),
        caption: "clientes registrados",
        tone: "accent",
        adminOnly: false,
      },
      {
        key: "suppliers",
        label: "Proveedores",
        to: "/proveedores",
        icon: Truck,
        metric: (m) => formatNumber(m.purchaseInvoices),
        caption: "facturas de compra",
        tone: "accent",
        adminOnly: true,
      },
    ],
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
        adminOnly: false,
      },
      {
        key: "invoices",
        label: "Facturas",
        to: "/facturas",
        icon: Receipt,
        metric: (m) => formatNumber(m.invoices),
        caption: "facturas de venta",
        tone: "primary",
        adminOnly: true,
      },
      {
        key: "pos",
        label: "POS mostrador",
        to: "/pos",
        icon: ScanBarcode,
        metric: (m) => formatNumber(m.posSales),
        caption: "ventas de mostrador",
        tone: "primary",
        adminOnly: false,
      },
    ],
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
        adminOnly: true,
      },
      {
        key: "payables",
        label: "Cuentas por pagar",
        to: "/cuentas-por-pagar",
        icon: Wallet,
        metric: (m) => formatNumber(m.payables),
        caption: "cuentas pendientes",
        tone: "accent",
        adminOnly: true,
      },
    ],
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
        adminOnly: true,
      },
      {
        key: "receivables",
        label: "Cuentas por cobrar",
        to: "/cuentas-por-cobrar",
        icon: HandCoins,
        metric: (m) => formatNumber(m.receivables),
        caption: "cuentas por cobrar",
        tone: "info",
        adminOnly: true,
      },
      {
        key: "expenses",
        label: "Gastos",
        to: "/gastos",
        icon: Banknote,
        metric: (m) => formatNumber(m.expenses),
        caption: "gastos registrados",
        tone: "info",
        adminOnly: true,
      },
      {
        key: "commissions",
        label: "Comisiones y préstamos",
        to: "/comisiones",
        icon: HandCoins,
        metric: (m) => formatNumber(m.commissions),
        caption: "pagos de comisión",
        tone: "info",
        adminOnly: true,
      },
      {
        key: "accounting",
        label: "Contabilidad",
        to: "/contabilidad",
        icon: FileSpreadsheet,
        metric: (m) => formatNumber(m.accounting),
        caption: "facturas del periodo",
        tone: "info",
        adminOnly: true,
      },
      {
        key: "settings",
        label: "Configuración",
        to: "/configuracion",
        icon: Settings,
        metric: (m) => formatNumber(m.payables),
        caption: "cuentas por pagar",
        tone: "info",
        adminOnly: true,
      },
    ],
  },
];

function ShortcutCard({
  shortcut,
  metrics,
  index,
}: {
  shortcut: Shortcut;
  metrics: DashboardMetrics;
  index: number;
}) {
  return (
    <Link
      to={shortcut.to}
      data-ocid={`dashboard.shortcut.${index + 1}`}
      data-tone={shortcut.tone}
      className="flow-shortcut"
    >
      <span className="flow-shortcut-head">
        <span className="flow-shortcut-icon" aria-hidden="true">
          <shortcut.icon className="size-4" />
        </span>
        <span className="flow-shortcut-name">{shortcut.label}</span>
      </span>
      <span
        className="flow-shortcut-metric"
        data-tone={shortcut.tone}
        aria-label={`${shortcut.metric(metrics)} ${shortcut.caption}`}
      >
        {shortcut.metric(metrics)}
      </span>
      <span className="flow-shortcut-caption">{shortcut.caption}</span>
    </Link>
  );
}

function FlowGroupSection({
  group,
  metrics,
  isAdmin,
}: {
  group: FlowGroup;
  metrics: DashboardMetrics;
  isAdmin: boolean;
}) {
  const shortcuts = group.shortcuts.filter(
    (shortcut) => isAdmin || !shortcut.adminOnly,
  );

  if (shortcuts.length === 0) return null;

  return (
    <section
      data-ocid={`dashboard.flow.${group.id}`}
      aria-label={group.label}
      className="flow-group"
    >
      <div className="flow-group-head">
        <span className="flow-group-icon" aria-hidden="true">
          <group.icon className="size-4" />
        </span>
        <h3 className="flow-group-label">{group.label}</h3>
        <span className="flow-group-count">
          {formatNumber(BigInt(shortcuts.length))} módulos
        </span>
      </div>
      <div className="flow-shortcuts">
        {shortcuts.map((shortcut, index) => (
          <ShortcutCard
            key={shortcut.key}
            shortcut={shortcut}
            metrics={metrics}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function FlowSkeleton() {
  const groups = Array.from({ length: 3 }, (_, i) => `flow-skeleton-${i}`);
  const cards = Array.from({ length: 3 }, (_, i) => `flow-card-${i}`);
  return (
    <div
      data-ocid="dashboard.flows.loading"
      className="space-y-4"
      aria-busy="true"
      aria-hidden="true"
    >
      {groups.map((groupId) => (
        <div key={groupId} className="flow-group">
          <Skeleton className="mb-3 h-4 w-28" />
          <div className="flow-shortcuts">
            {cards.map((cardId) => (
              <Skeleton key={cardId} className="h-24 w-full rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MechanicNotice() {
  return (
    <div
      data-ocid="dashboard.admin_only_notice"
      className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3"
    >
      <ShieldAlert
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Vista de mecánico</p>
        <p className="text-xs text-muted-foreground">
          Los módulos de administración, compras y los importes de costo
          requieren un administrador. Solicita acceso para ver el panel
          completo.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function DashboardPage() {
  const { isAdmin, isLoading: isRoleLoading } = useRole();
  const profileQuery = useCompanyProfile();
  const metricsQuery = useDashboardMetrics(isAdmin);

  const isError = profileQuery.isError || metricsQuery.isError;
  const showSkeleton =
    isRoleLoading || profileQuery.isLoading || metricsQuery.isLoading;

  const metrics = metricsQuery.data ?? EMPTY_METRICS;
  const profile = profileQuery.data ?? null;

  // "Actualizar" and "Reintentar" must always hit the backend, so the cached
  // freshness window is bypassed explicitly instead of relying on staleTime.
  const refetchAll = () => {
    void profileQuery.refetch({ cancelRefetch: true });
    void metricsQuery.refetch({ cancelRefetch: true });
  };

  return (
    <div
      data-ocid="dashboard.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-6"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Panel de operación
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Identidad del taller y accesos directos a cada flujo de trabajo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refetchAll}
          data-ocid="dashboard.refresh_button"
        >
          Actualizar
        </Button>
      </header>

      {isError ? (
        <div
          data-ocid="dashboard.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
        >
          <AlertTriangle
            className="size-5 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold">No se pudo cargar el panel</p>
            <p className="text-xs text-muted-foreground">
              Verifica la conexión con el backend e inténtalo de nuevo.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refetchAll}
            data-ocid="dashboard.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          {showSkeleton ? (
            <CompanyHeaderSkeleton />
          ) : profile ? (
            <CompanyHeader profile={profile} />
          ) : (
            <CompanyHeaderEmpty />
          )}

          {!isRoleLoading && !isAdmin ? <MechanicNotice /> : null}

          {showSkeleton ? (
            <FlowSkeleton />
          ) : (
            <div
              data-ocid="dashboard.flows.section"
              className="space-y-4"
              aria-label="Accesos directos por flujo"
            >
              {FLOW_GROUPS.map((group) => (
                <FlowGroupSection
                  key={group.id}
                  group={group}
                  metrics={metrics}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
