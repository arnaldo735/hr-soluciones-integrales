import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type RemindersSummary,
  useRemindersSummary,
} from "@/hooks/use-reminders";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Receipt,
  Wallet,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

interface RemindersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Máximo de ítems mostrados por sección; el resto se resume en el conteo. */
const MAX_ITEMS = 5;

interface ReminderRow {
  key: string;
  primary: string;
  secondary: string;
  meta: string;
  to: string;
}

interface ReminderSectionView {
  key: string;
  title: string;
  icon: ReactNode;
  count: number;
  rows: ReminderRow[];
  to: string;
}

function buildSections(summary: RemindersSummary): ReminderSectionView[] {
  const sections: ReminderSectionView[] = [];

  if (summary.appointments) {
    sections.push({
      key: "appointments",
      title: "Citas pendientes",
      icon: <CalendarClock className="size-4" aria-hidden="true" />,
      count: Number(summary.appointments.count),
      to: "/citas",
      rows: summary.appointments.items.slice(0, MAX_ITEMS).map((item) => ({
        key: `appointment-${item.id}`,
        primary: item.customerName,
        secondary: item.status,
        meta: formatDateTime(item.scheduledAt),
        to: "/citas",
      })),
    });
  }

  if (summary.receivables) {
    sections.push({
      key: "receivables",
      title: "Cuentas por cobrar",
      icon: <Receipt className="size-4" aria-hidden="true" />,
      count: Number(summary.receivables.count),
      to: "/cuentas-por-cobrar",
      rows: summary.receivables.items.slice(0, MAX_ITEMS).map((item) => ({
        key: `receivable-${item.invoiceId}`,
        primary: item.customerName,
        secondary: formatMoney(item.balance),
        meta: `Vence ${formatDate(item.dueDate)}`,
        to: "/cuentas-por-cobrar",
      })),
    });
  }

  if (summary.payables) {
    sections.push({
      key: "payables",
      title: "Cuentas por pagar",
      icon: <Wallet className="size-4" aria-hidden="true" />,
      count: Number(summary.payables.count),
      to: "/cuentas-por-pagar",
      rows: summary.payables.items.slice(0, MAX_ITEMS).map((item) => ({
        key: `payable-${item.supplierId}`,
        primary: item.supplierName,
        secondary: formatMoney(item.balance),
        meta: `Vence ${formatDate(item.dueDate)}`,
        to: "/cuentas-por-pagar",
      })),
    });
  }

  if (summary.unapprovedOrders) {
    sections.push({
      key: "unapprovedOrders",
      title: "OT sin aprobar",
      icon: <ClipboardList className="size-4" aria-hidden="true" />,
      count: Number(summary.unapprovedOrders.count),
      to: "/ordenes",
      rows: summary.unapprovedOrders.items.slice(0, MAX_ITEMS).map((item) => ({
        key: `order-${item.id}`,
        primary: `${item.orderNumber} · ${item.customerName}`,
        secondary: item.plate,
        meta: "Pendiente de aprobación",
        to: "/ordenes",
      })),
    });
  }

  if (summary.pendingQuotes) {
    sections.push({
      key: "pendingQuotes",
      title: "Cotizaciones por aprobar",
      icon: <FileText className="size-4" aria-hidden="true" />,
      count: Number(summary.pendingQuotes.count),
      to: "/cotizaciones",
      rows: summary.pendingQuotes.items.slice(0, MAX_ITEMS).map((item) => ({
        key: `quote-${item.id}`,
        primary: `${item.quoteNumber} · ${item.customerName}`,
        secondary: item.status,
        meta: formatDate(item.createdAt),
        to: "/cotizaciones",
      })),
    });
  }

  if (summary.finishedOrders) {
    sections.push({
      key: "finishedMotorcycles",
      title: "Motos terminadas en taller",
      icon: <Wrench className="size-4" aria-hidden="true" />,
      count: Number(summary.finishedOrders.count),
      to: "/ordenes",
      rows: summary.finishedOrders.items.slice(0, MAX_ITEMS).map((item) => ({
        key: `finished-${item.id}`,
        primary: `${item.orderNumber} · ${item.customerName}`,
        secondary: item.plate,
        meta: `${Number(item.daysInWorkshop)} días en taller`,
        to: "/ordenes",
      })),
    });
  }

  return sections;
}

function SectionBlock({ section }: { section: ReminderSectionView }) {
  const hasItems = section.count > 0 && section.rows.length > 0;

  return (
    <section
      data-ocid={`reminders.section.${section.key}`}
      className="rounded-md border border-border bg-card"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground">{section.icon}</span>
          <h3 className="truncate font-display text-sm font-semibold text-foreground">
            {section.title}
          </h3>
        </div>
        <span
          data-ocid={`reminders.count.${section.key}`}
          className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary"
        >
          {section.count}
        </span>
      </header>

      {hasItems ? (
        <ul className="divide-y divide-border">
          {section.rows.map((row) => (
            <li key={row.key}>
              <Link
                to={row.to}
                data-ocid={`reminders.item.${section.key}`}
                className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {row.primary}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.meta}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-foreground">
                  {row.secondary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p
          data-ocid={`reminders.empty_state.${section.key}`}
          className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground"
        >
          <CheckCircle2
            className="size-4 shrink-0 text-success"
            aria-hidden="true"
          />
          Al día
        </p>
      )}

      {section.count > section.rows.length ? (
        <div className="border-t border-border px-3 py-2">
          <Link
            to={section.to}
            data-ocid={`reminders.link.${section.key}`}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver los {section.count} pendientes
          </Link>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Diálogo de recordatorios: resume los pendientes del taller al iniciar sesión
 * y al volver a la pestaña. Cada ítem navega a su módulo y el usuario puede
 * cerrarlo para no volver a verlo en la sesión actual.
 */
export function RemindersDialog({ open, onOpenChange }: RemindersDialogProps) {
  const { data, isLoading, isError, refetch } = useRemindersSummary();
  const sections = data ? buildSections(data) : [];
  const totalPending = sections.reduce(
    (sum, section) => sum + section.count,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="reminders.dialog"
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <BellRing className="size-5 text-primary" aria-hidden="true" />
            Recordatorios del taller
          </DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Revisando los pendientes del taller…"
              : totalPending > 0
                ? `Tienes ${totalPending} pendientes por atender.`
                : "Revisa el estado de tus pendientes."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div
            data-ocid="reminders.loading_state"
            className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Cargando pendientes…
          </div>
        ) : isError ? (
          <div
            role="alert"
            data-ocid="reminders.error_state"
            className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                No se pudieron cargar los recordatorios
              </p>
              <p className="text-muted-foreground">
                Revisa tu conexión e inténtalo de nuevo.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                data-ocid="reminders.retry_button"
              >
                Reintentar
              </Button>
            </div>
          </div>
        ) : sections.length === 0 ? (
          <p
            data-ocid="reminders.empty_state"
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-4 text-sm text-muted-foreground"
          >
            <CheckCircle2
              className="size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            No hay pendientes por ahora. ¡Todo al día!
          </p>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <SectionBlock key={section.key} section={section} />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            data-ocid="reminders.close_button"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
