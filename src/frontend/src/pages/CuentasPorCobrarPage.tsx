import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useReceivableSummary,
  useReceivables,
  useRegisterReceivablePayment,
} from "@/hooks/use-receivables";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type {
  DataColumn,
  Receivable,
  ReceivablePaymentInput,
  ReceivableStatus,
  RowAction,
} from "@/lib/types";
import { ReceivableStatus as ReceivableStatusEnum } from "@/lib/types";
import { WhatsAppContactKind, WhatsAppContext } from "@/lib/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | ReceivableStatus;

const FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: ReceivableStatusEnum.pending, label: "Pendientes" },
  { value: ReceivableStatusEnum.overdue, label: "Vencidas" },
  { value: ReceivableStatusEnum.paid, label: "Pagadas" },
];

const STATUS_LABELS: Record<ReceivableStatus, string> = {
  [ReceivableStatusEnum.pending]: "Pendiente",
  [ReceivableStatusEnum.overdue]: "Vencida",
  [ReceivableStatusEnum.paid]: "Pagada",
};

const STATUS_BADGE_CLASS: Record<ReceivableStatus, string> = {
  [ReceivableStatusEnum.pending]: "badge-open",
  [ReceivableStatusEnum.overdue]: "badge-overdue",
  [ReceivableStatusEnum.paid]: "badge-settled",
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
] as const;

/** Parse a decimal amount typed by the user into integer cents. */
function parseAmount(value: string): bigint | null {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (normalized === "") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}

/** Whole days between today and a due date, in Colombia time. */
function daysUntil(dueDate: bigint): number {
  const due = new Date(Number(dueDate / 1_000_000n));
  const now = new Date();
  const dueDay = Date.UTC(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
  );
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((dueDay - today) / 86_400_000);
}

function StatusPill({ status }: { status: ReceivableStatus }) {
  return (
    <span className={`badge-status ${STATUS_BADGE_CLASS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable: Receivable | null;
}

function PaymentDialog({ open, onOpenChange, receivable }: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerPayment = useRegisterReceivablePayment();

  useEffect(() => {
    if (open) {
      setAmount("");
      setMethod("cash");
      setNote("");
      setError(null);
    }
  }, [open]);

  const balance = receivable?.balance ?? 0n;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receivable) return;

    const parsed = parseAmount(amount);
    if (parsed === null || parsed <= 0n) {
      setError("Captura un monto válido mayor a cero.");
      return;
    }
    if (parsed > balance) {
      setError(
        `El abono no puede superar el saldo pendiente de ${formatMoney(balance)}.`,
      );
      return;
    }

    const input: ReceivablePaymentInput = {
      invoiceId: receivable.invoiceId,
      amount: parsed,
      method,
      note: note.trim() === "" ? undefined : note.trim(),
    };

    setError(null);
    registerPayment.mutate(input, {
      onSuccess: () => {
        toast.success("Abono registrado");
        onOpenChange(false);
      },
      onError: (mutationError: Error) => {
        setError(
          mutationError.message ||
            "No se pudo registrar el abono. Inténtalo de nuevo.",
        );
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="receivables.payment_dialog"
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Registrar abono</DialogTitle>
          <DialogDescription>
            {receivable
              ? `Factura ${receivable.invoiceNumber} · ${receivable.customerName}. Saldo pendiente ${formatMoney(balance)}.`
              : "Registra un abono sobre la cuenta por cobrar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="receivable-amount">Monto del abono (COP)</Label>
            <Input
              id="receivable-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="data-rail"
              data-ocid="receivables.amount_input"
              required
            />
            <p className="text-xs text-muted-foreground">
              Máximo {formatMoney(balance)}.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receivable-method">Método de pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger
                id="receivable-method"
                aria-label="Método de pago del abono"
                data-ocid="receivables.method_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receivable-note">Nota (opcional)</Label>
            <Textarea
              id="receivable-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Abono parcial acordado con el cliente"
              rows={2}
              data-ocid="receivables.note_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="receivables.form_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="receivables.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registerPayment.isPending}
              data-ocid="receivables.submit_button"
            >
              {registerPayment.isPending ? "Registrando…" : "Registrar abono"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TableSkeleton() {
  const rows = Array.from(
    { length: 6 },
    (_, index) => `receivable-row-${index}`,
  );
  return (
    <div data-ocid="receivables.loading_state" className="space-y-2 p-4">
      {rows.map((id) => (
        <Skeleton key={id} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CuentasPorCobrarPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;

  const statusFilter: StatusFilter =
    typeof rawSearch.status === "string" &&
    (rawSearch.status === "all" ||
      rawSearch.status === ReceivableStatusEnum.pending ||
      rawSearch.status === ReceivableStatusEnum.overdue ||
      rawSearch.status === ReceivableStatusEnum.paid)
      ? (rawSearch.status as StatusFilter)
      : "all";
  const search = typeof rawSearch.q === "string" ? rawSearch.q : "";

  const [searchInput, setSearchInput] = useState(search);
  const [paymentTarget, setPaymentTarget] = useState<Receivable | null>(null);

  // Debounce the typed term into the URL. The URL is the single source of
  // truth for the query, so the term survives reloads and can be shared.
  useEffect(() => {
    if (searchInput === search) return;
    const handle = window.setTimeout(() => {
      void navigate({
        to: "/cuentas-por-cobrar",
        search: (previous) => ({
          ...previous,
          q: searchInput.trim().length > 0 ? searchInput : undefined,
        }),
        replace: true,
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchInput, search, navigate]);

  const receivablesQuery = useReceivables({
    status: statusFilter === "all" ? null : statusFilter,
    search,
  });
  const summaryQuery = useReceivableSummary();

  const items = receivablesQuery.data ?? [];
  const summary = summaryQuery.data ?? null;

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  function setStatusFilter(next: StatusFilter) {
    void navigate({
      to: "/cuentas-por-cobrar",
      search: (previous) => ({
        ...previous,
        status: next === "all" ? undefined : next,
      }),
      replace: true,
    });
  }

  function clearFilters() {
    setSearchInput("");
    void navigate({
      to: "/cuentas-por-cobrar",
      search: () => ({}),
      replace: true,
    });
  }

  const columns = useMemo<Array<DataColumn<Receivable>>>(
    () => [
      {
        key: "customer",
        header: "Cliente",
        render: (row) => (
          <span className="block max-w-[220px] truncate font-medium">
            {row.customerName}
          </span>
        ),
      },
      {
        key: "invoiceNumber",
        header: "N.º factura",
        render: (row) => (
          <span className="data-rail text-muted-foreground">
            {row.invoiceNumber}
          </span>
        ),
      },
      {
        key: "total",
        header: "Monto total",
        numeric: true,
        render: (row) => (
          <span className="data-rail text-muted-foreground">
            {formatMoney(row.total)}
          </span>
        ),
      },
      {
        key: "balance",
        header: "Saldo pendiente",
        numeric: true,
        render: (row) => (
          <span className="data-rail font-semibold">
            {formatMoney(row.balance)}
          </span>
        ),
      },
      {
        key: "dueDate",
        header: "Vencimiento",
        render: (row) => {
          const overdue = row.status === ReceivableStatusEnum.overdue;
          const days = daysUntil(row.dueDate);
          return (
            <span className={overdue ? "due-overdue" : "data-rail"}>
              {formatDate(row.dueDate)}
              {overdue && days < 0 ? (
                <span className="due-overdue-days">{Math.abs(days)} d</span>
              ) : null}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Estado",
        render: (row) => <StatusPill status={row.status} />,
      },
    ],
    [],
  );

  const actions = useMemo<Array<RowAction<Receivable>>>(
    () => [
      {
        kind: "save",
        label: "Registrar abono",
        onClick: (row) => setPaymentTarget(row),
        hidden: (row) => row.status === ReceivableStatusEnum.paid,
      },
    ],
    [],
  );

  return (
    <div
      data-ocid="receivables.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Cuentas por cobrar"
        description="Saldos pendientes de facturas a crédito por cliente, con vencimiento y estado de cada cuenta."
      />

      <section
        data-ocid="receivables.summary.section"
        aria-label="Resumen de cartera"
        className="accounts-summary"
      >
        <div
          data-emphasis="primary"
          data-ocid="receivables.summary.total_card"
          className="accounts-card"
        >
          <p className="accounts-card-label">Total por cobrar</p>
          <p className="accounts-card-value">
            {summaryQuery.isLoading
              ? "—"
              : formatMoney(summary?.totalOutstanding ?? 0n)}
          </p>
          <p className="accounts-card-meta">
            Saldo pendiente de toda la cartera
          </p>
        </div>

        <div
          data-emphasis="overdue"
          data-ocid="receivables.summary.overdue_card"
          className="accounts-card"
        >
          <p className="accounts-card-label">Total vencido</p>
          <p className="accounts-card-value">
            {summaryQuery.isLoading
              ? "—"
              : formatMoney(summary?.totalOverdue ?? 0n)}
          </p>
          <p className="accounts-card-meta">Cuentas con vencimiento cumplido</p>
        </div>

        <div
          data-ocid="receivables.summary.open_card"
          className="accounts-card"
        >
          <p className="accounts-card-label">Facturas abiertas</p>
          <p className="accounts-card-value">
            {summaryQuery.isLoading
              ? "—"
              : formatNumber(summary?.openCount ?? 0n)}
          </p>
          <p className="accounts-card-meta">Cuentas pendientes o vencidas</p>
        </div>
      </section>

      <section
        data-ocid="receivables.filters"
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-subtle lg:flex-row lg:items-center lg:justify-between"
      >
        <fieldset data-ocid="receivables.filter.chips" className="filter-chips">
          <legend className="sr-only">Filtrar por estado</legend>
          {FILTER_OPTIONS.map((option) => {
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                data-active={isActive}
                data-ocid={`receivables.filter.${option.value}`}
                aria-pressed={isActive}
                className="filter-chip"
              >
                {option.label}
              </button>
            );
          })}
        </fieldset>

        <div className="flex items-center gap-2">
          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por cliente o N.º de factura…"
              aria-label="Buscar cuentas por cobrar por cliente o número de factura"
              data-ocid="receivables.search_input"
              className="h-9 pl-9"
            />
          </div>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="receivables.clear_filters_button"
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      <section className="min-w-0 space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {receivablesQuery.isLoading
            ? "Cargando…"
            : `${formatNumber(items.length)} cuenta${items.length === 1 ? "" : "s"}`}
        </p>

        {receivablesQuery.isError ? (
          <div
            data-ocid="receivables.error_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar las cuentas por cobrar.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void receivablesQuery.refetch({ cancelRefetch: true })
              }
              data-ocid="receivables.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : receivablesQuery.isLoading ? (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
            <TableSkeleton />
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="receivables.empty_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <Wallet
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {hasFilters ? "Sin resultados" : "No hay cuentas por cobrar"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {hasFilters
                  ? "Ajusta el estado o la búsqueda para encontrar cuentas."
                  : "Las facturas a crédito aparecerán aquí con su saldo pendiente."}
              </p>
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                data-ocid="receivables.empty_clear_button"
              >
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(row) => row.invoiceId.toString()}
            actions={actions}
            rowExtraActions={(row, index) =>
              row.customerId === undefined ? null : (
                <WhatsAppNotifyButton
                  contactKind={WhatsAppContactKind.customer}
                  contactId={row.customerId}
                  context={WhatsAppContext.receivable}
                  referenceId={row.invoiceId}
                  contactName={row.customerName}
                  ocid={`receivables.whatsapp_button.${index + 1}`}
                />
              )
            }
            ocid="receivables"
            caption="Saldos pendientes por cliente"
          />
        )}
      </section>

      <PaymentDialog
        open={paymentTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPaymentTarget(null);
        }}
        receivable={paymentTarget}
      />
    </div>
  );
}

export default CuentasPorCobrarPage;
