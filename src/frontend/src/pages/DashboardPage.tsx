import { AlertListDialog } from "@/components/dashboard/AlertListDialog";
import {
  type AlertRecord,
  statusLabel,
} from "@/components/dashboard/AlertRecordDetailDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyProfile } from "@/hooks/use-company";
import { useDashboardAlerts } from "@/hooks/use-dashboard-alerts";
import { useRole } from "@/hooks/use-role";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import type { CompanyProfile, DashboardAlertsSummary } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  Settings,
  ShieldAlert,
  Truck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef, useState } from "react";

/* ---------------------------------------------------------------------------
 * Alert definitions
 * ------------------------------------------------------------------------- */

type AlertTone = "info" | "warning" | "danger" | "ok";

interface AlertDefinition {
  /** Stable key used for list keys and test markers. */
  key: string;
  /** Visible Spanish alert name. */
  title: string;
  /** Destination module label. */
  moduleLabel: string;
  /** Route the card links to. */
  to: string;
  icon: LucideIcon;
  tone: AlertTone;
  /** Módulo del backend que habilita esta alerta; `null` = siempre visible. */
  moduleKey: string | null;
  /**
   * `true` cuando la ruta destino está envuelta en la guarda de administrador.
   * La tarjeta solo se muestra a un administrador para no ofrecer un enlace que
   * la guarda rechazaría.
   */
  adminOnly: boolean;
  /** Reads the live count from the summary; `undefined` = sección no permitida. */
  count: (summary: DashboardAlertsSummary) => bigint | undefined;
  /** Mensaje en español propio de la alerta; usa el genérico si se omite. */
  message?: (count: bigint) => string;
}

/**
 * Conjunto de alertas del panel. Cada tarjeta respeta los módulos del rol
 * activo: una sección ausente del resumen (rol sin permiso) no se renderiza.
 */
const ALERT_DEFINITIONS: AlertDefinition[] = [
  {
    key: "unapprovedOrders",
    title: "OT sin aprobar",
    moduleLabel: "Órdenes de taller",
    to: "/ordenes",
    icon: ClipboardList,
    tone: "warning",
    moduleKey: "workshop",
    adminOnly: false,
    count: (summary) => summary.unapprovedOrders?.count,
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
    count: (summary) => summary.appointments?.count,
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
    count: (summary) => summary.finishedOrders?.count,
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
    count: (summary) => summary.pendingQuotes?.count,
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
    count: (summary) => summary.lowStockParts?.count,
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
    count: (summary) => summary.receivables?.count,
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
    count: (summary) => summary.payables?.count,
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
    count: (summary) => summary.supplierOrders?.count,
  },
  {
    key: "overdueInstallments",
    title: "Cuotas vencidas",
    moduleLabel: "Facturas",
    to: "/facturas",
    icon: AlertTriangle,
    tone: "danger",
    moduleKey: "receivables",
    adminOnly: true,
    count: (summary) => summary.overdueInstallments?.count,
    message: (count) => {
      if (count === 0n) return "Todo al día, sin cuotas vencidas.";
      const n = formatNumber(count);
      return count === 1n
        ? `Tiene ${n} cuota vencida, haga clic aquí para verla.`
        : `Tiene ${n} cuotas vencidas, haga clic aquí para verlas.`;
    },
  },
];

/** Mensaje en español del conteo de una alerta. */
function alertMessage(count: bigint): string {
  if (count === 0n) return "Todo al día, sin pendientes.";
  const n = formatNumber(count);
  return count === 1n
    ? `Tiene ${n} pendiente, haga clic aquí para verlo.`
    : `Tiene ${n} pendientes, haga clic aquí para verlos.`;
}

/* ---------------------------------------------------------------------------
 * Mapeo de registros por tipo de alerta
 * ------------------------------------------------------------------------- */

/**
 * Convierte los ítems ya cargados de una sección en registros normalizados que
 * el detalle anidado sabe renderizar. No dispara consultas nuevas: reutiliza
 * los datos de `getDashboardAlerts`.
 */
function buildRecords(
  key: string,
  summary: DashboardAlertsSummary,
): AlertRecord[] {
  switch (key) {
    case "unapprovedOrders":
      return (summary.unapprovedOrders?.items ?? []).map((item) => ({
        kind: "order",
        key: `order-${item.id}`,
        title: `${item.orderNumber} · ${item.customerName}`,
        subtitle: item.plate,
        fields: [
          { label: "Orden", value: item.orderNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Placa", value: item.plate || "—" },
          { label: "Estado", value: "Pendiente de aprobación" },
        ],
      }));
    case "finishedOrders":
      return (summary.finishedOrders?.items ?? []).map((item) => ({
        kind: "order",
        key: `finished-${item.id}`,
        title: `${item.orderNumber} · ${item.customerName}`,
        subtitle: item.plate,
        fields: [
          { label: "Orden", value: item.orderNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Placa", value: item.plate || "—" },
          { label: "Días en taller", value: formatNumber(item.daysInWorkshop) },
        ],
      }));
    case "appointments":
      return (summary.appointments?.items ?? []).map((item) => ({
        kind: "appointment",
        key: `appointment-${item.id}`,
        title: item.customerName,
        subtitle: statusLabel(item.status),
        fields: [
          { label: "Cliente", value: item.customerName },
          { label: "Estado", value: statusLabel(item.status) },
          { label: "Programada", value: formatDateTime(item.scheduledAt) },
        ],
      }));
    case "pendingQuotes":
      return (summary.pendingQuotes?.items ?? []).map((item) => ({
        kind: "quote",
        key: `quote-${item.id}`,
        title: `${item.quoteNumber} · ${item.customerName}`,
        subtitle: statusLabel(item.status),
        fields: [
          { label: "Cotización", value: item.quoteNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Estado", value: statusLabel(item.status) },
          { label: "Creada", value: formatDate(item.createdAt) },
        ],
      }));
    case "lowStockParts":
      return (summary.lowStockParts?.items ?? []).map((item) => ({
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
            value: formatNumber(item.lowStockThreshold),
          },
        ],
      }));
    case "receivables":
      return (summary.receivables?.items ?? []).map((item) => ({
        kind: "receivable",
        key: `receivable-${item.invoiceId}`,
        title: item.customerName,
        subtitle: item.invoiceNumber,
        fields: [
          { label: "Factura", value: item.invoiceNumber },
          { label: "Cliente", value: item.customerName },
          { label: "Saldo", value: formatMoney(item.balance) },
          { label: "Vence", value: formatDate(item.dueDate) },
          { label: "Estado", value: statusLabel(item.status) },
        ],
      }));
    case "payables":
      return (summary.payables?.items ?? []).map((item) => ({
        kind: "payable",
        key: `payable-${item.supplierId}`,
        title: item.supplierName,
        subtitle: formatMoney(item.balance),
        fields: [
          { label: "Proveedor", value: item.supplierName },
          { label: "Saldo", value: formatMoney(item.balance) },
          { label: "Vence", value: formatDate(item.dueDate) },
          { label: "Estado", value: statusLabel(item.status) },
        ],
      }));
    case "supplierOrders":
      return (summary.supplierOrders?.items ?? []).map((item) => ({
        kind: "supplierOrder",
        key: `supplier-order-${item.id}`,
        title: item.description || item.sku,
        subtitle: item.supplierName,
        fields: [
          { label: "Proveedor", value: item.supplierName },
          { label: "Descripción", value: item.description || "—" },
          { label: "SKU", value: item.sku || "—" },
          { label: "Cantidad", value: formatNumber(item.quantity) },
          { label: "Creado", value: formatDate(item.createdAt) },
        ],
      }));
    case "overdueInstallments":
      return (summary.overdueInstallments?.items ?? []).map((item) => ({
        kind: "overdueInstallment",
        key: `installment-${item.invoiceId}-${item.installmentNumber}`,
        title: `${item.invoiceNumber} · ${item.customerName}`,
        subtitle: `Cuota ${formatNumber(item.installmentNumber)}`,
        fields: [
          { label: "Factura", value: item.invoiceNumber },
          { label: "Cliente", value: item.customerName },
          {
            label: "Cuota",
            value: formatNumber(item.installmentNumber),
          },
          { label: "Monto", value: formatMoney(item.amount) },
          { label: "Vence", value: formatDate(item.dueDate) },
        ],
      }));
    default:
      return [];
  }
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

/**
 * Aviso neutral para un rol que no tiene el módulo `company`: el panel sigue
 * funcionando y solo se omite la identidad del taller.
 */
function CompanyRestrictedNotice() {
  return (
    <div
      data-ocid="dashboard.company_header.restricted_state"
      className="company-header"
    >
      <div className="company-header-logo" aria-hidden="true">
        <Building2 className="size-6" />
      </div>
      <p className="company-header-name">Perfil de empresa restringido</p>
      <p className="company-header-legal">
        Tu rol no incluye el módulo de empresa
      </p>
      <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
        Las alertas de los módulos que sí puedes usar siguen disponibles más
        abajo.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Alert grid
 * ------------------------------------------------------------------------- */

function AlertCard({
  alert,
  count,
  index,
  onOpen,
}: {
  alert: AlertDefinition;
  count: bigint;
  index: number;
  onOpen: (trigger: HTMLButtonElement) => void;
}) {
  const isClear = count === 0n;
  const Icon = alert.icon;
  const message = alert.message ? alert.message(count) : alertMessage(count);

  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      data-ocid={`dashboard.alert.${index + 1}`}
      data-tone={alert.tone}
      data-clear={isClear ? "true" : "false"}
      className="alert-card"
      aria-label={`${alert.title}: ${message}`}
    >
      <span className="alert-card-strip" aria-hidden="true" />
      <span className="alert-card-body">
        <span className="alert-card-head">
          <span className="alert-card-icon" aria-hidden="true">
            <Icon className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="alert-card-title block">{alert.title}</span>
            <span className="alert-card-module block">{alert.moduleLabel}</span>
          </span>
        </span>
        <span className="alert-card-count">{formatNumber(count)}</span>
        <span className="alert-card-message">{message}</span>
        <span className="alert-card-cta">
          Ver registros
          <ArrowRight aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

function AlertGridSkeleton() {
  const cards = Array.from({ length: 6 }, (_, i) => `alert-skeleton-${i}`);
  return (
    <div
      data-ocid="dashboard.alerts.loading"
      className="alert-grid"
      aria-busy="true"
      aria-hidden="true"
    >
      {cards.map((cardId) => (
        <div key={cardId} className="alert-card">
          <span className="alert-card-strip" />
          <span className="alert-card-body">
            <span className="alert-card-head">
              <Skeleton className="size-9 rounded-md" />
              <span className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </span>
            </span>
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-4 w-full" />
          </span>
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
          Las alertas de administración, compras y cuentas por pagar requieren
          un administrador. Solicita acceso para ver el panel completo.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export function DashboardPage() {
  const { isAdmin, isLoading: isRoleLoading, modules } = useRole();
  const canCompany = modules === null || modules.includes("company");
  const profileQuery = useCompanyProfile({ enabled: canCompany });
  const alertsQuery = useDashboardAlerts();
  const [openAlertKey, setOpenAlertKey] = useState<string | null>(null);
  // Tarjeta que abrió el modal de alerta. El diálogo es controlado por estado
  // (sin `DialogTrigger`), así que Radix no tiene un disparador al cual
  // devolver el foco; se restaura manualmente a esta tarjeta al cerrar.
  const alertTriggerRef = useRef<HTMLButtonElement | null>(null);

  const isError = alertsQuery.isError;
  const showSkeleton =
    isRoleLoading ||
    (canCompany && profileQuery.isLoading) ||
    alertsQuery.isLoading;

  const summary = alertsQuery.data;
  const profile = profileQuery.data ?? null;

  // Solo se renderizan las alertas cuya sección devolvió el backend; una
  // sección ausente significa que el rol no tiene el módulo correspondiente.
  // Las tarjetas cuya ruta destino está en la guarda de administrador se
  // ocultan a un rol no administrador para no ofrecer un enlace rechazado.
  const alerts = summary
    ? ALERT_DEFINITIONS.map((alert) => ({
        alert,
        count: alert.count(summary),
      })).filter(
        (entry): entry is { alert: AlertDefinition; count: bigint } =>
          entry.count !== undefined && (isAdmin || !entry.alert.adminOnly),
      )
    : [];

  // La alerta abierta se resuelve contra las alertas visibles para el rol: si
  // el rol no tiene la sección, no se abre aunque el estado la conserve.
  const openAlert = openAlertKey
    ? (alerts.find((entry) => entry.alert.key === openAlertKey)?.alert ?? null)
    : null;
  const openCount = openAlertKey
    ? (alerts.find((entry) => entry.alert.key === openAlertKey)?.count ?? 0n)
    : 0n;
  const openRecords =
    openAlert && summary ? buildRecords(openAlert.key, summary) : [];
  const openMessage = openAlert
    ? openAlert.message
      ? openAlert.message(openCount)
      : alertMessage(openCount)
    : "";

  // "Actualizar" and "Reintentar" must always hit the backend, so the cached
  // freshness window is bypassed explicitly instead of relying on staleTime.
  const refetchAll = () => {
    if (canCompany) {
      void profileQuery.refetch({ cancelRefetch: true });
    }
    void alertsQuery.refetch({ cancelRefetch: true });
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
            Identidad del taller y alertas de trabajo pendiente por módulo.
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
          ) : !canCompany ? (
            <CompanyRestrictedNotice />
          ) : profile ? (
            <CompanyHeader profile={profile} />
          ) : (
            <CompanyHeaderEmpty />
          )}

          {!isRoleLoading && !isAdmin ? <MechanicNotice /> : null}

          {showSkeleton ? (
            <AlertGridSkeleton />
          ) : alerts.length === 0 ? (
            <div
              data-ocid="dashboard.alerts.empty_state"
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-6 py-12 text-center"
            >
              <Boxes
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Sin alertas disponibles</p>
              <p className="text-xs text-muted-foreground">
                Tu rol no tiene módulos con alertas configuradas.
              </p>
            </div>
          ) : (
            <section
              data-ocid="dashboard.alerts.section"
              aria-label="Alertas de trabajo pendiente"
            >
              <div className="alert-grid">
                {alerts.map(({ alert, count }, index) => (
                  <AlertCard
                    key={alert.key}
                    alert={alert}
                    count={count}
                    index={index}
                    onOpen={(trigger) => {
                      alertTriggerRef.current = trigger;
                      setOpenAlertKey(alert.key);
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <AlertListDialog
        title={openAlert?.title ?? null}
        message={openMessage}
        count={openCount}
        icon={openAlert?.icon ?? Boxes}
        records={openRecords}
        moduleTo={openAlert?.to ?? "/"}
        moduleLabel={openAlert?.moduleLabel ?? ""}
        isLoading={showSkeleton}
        onOpenChange={(next) => {
          if (!next) setOpenAlertKey(null);
        }}
        onCloseAutoFocus={(event) => {
          // Radix enfocaría <body> al no existir `DialogTrigger`; se evita y se
          // devuelve el foco a la tarjeta que abrió el modal.
          event.preventDefault();
          alertTriggerRef.current?.focus();
        }}
      />
    </div>
  );
}
