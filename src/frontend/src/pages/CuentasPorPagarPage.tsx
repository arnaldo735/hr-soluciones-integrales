import { PageHeader } from "@/components/PageHeader";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { Payable, Payment, PaymentInput, Purchase } from "@/lib/types";
import { PayableStatus, PaymentMethod } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  HandCoins,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PAYABLES_QUERY_KEY = ["payables"] as const;
const PURCHASES_QUERY_KEY = ["purchases"] as const;

type StatusFilter = "all" | PayableStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: PayableStatus.pending, label: "Pendientes" },
  { value: PayableStatus.overdue, label: "Vencidas" },
  { value: PayableStatus.paid, label: "Pagadas" },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto",
};

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  PaymentMethod.cash,
  PaymentMethod.card,
  PaymentMethod.transfer,
  PaymentMethod.mixed,
];

const STATUS_LABELS: Record<PayableStatus, string> = {
  [PayableStatus.pending]: "Pendiente",
  [PayableStatus.overdue]: "Vencida",
  [PayableStatus.paid]: "Pagada",
};

const STATUS_BADGE_CLASS: Record<PayableStatus, string> = {
  [PayableStatus.pending]: "badge-open",
  [PayableStatus.overdue]: "badge-overdue",
  [PayableStatus.paid]: "badge-settled",
};

/** Saldos pendientes con proveedores, derivados de las compras registradas. */
function usePayables() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: PAYABLES_QUERY_KEY,
    queryFn: async (): Promise<Payable[]> => {
      if (!actor) return [];
      return actor.listPayables(token);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Todas las compras, para resolver la referencia de compra de cada cuenta. */
function usePurchases() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: PURCHASES_QUERY_KEY,
    queryFn: async (): Promise<Purchase[]> => {
      if (!actor) return [];
      return actor.listPurchases(token, null);
    },
    enabled: !!actor && !isFetching,
  });
}

function useRegisterPayment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentInput): Promise<Payment> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerPayment(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
  });
}

function parseAmountToCents(value: string): bigint | null {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return BigInt(Math.round(amount * 100));
}

/** Días de atraso de una cuenta vencida, en días calendario. */
function overdueDays(dueDate: bigint): number {
  const due = new Date(Number(dueDate / 1_000_000n));
  if (Number.isNaN(due.getTime())) return 0;
  const diff = Date.now() - due.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

/**
 * Referencia de compra de una cuenta: la compra pendiente más antigua del
 * proveedor. El backend deriva el vencimiento de esa misma compra.
 */
function purchaseReference(
  purchases: Purchase[],
  supplierId: bigint,
): string | null {
  const pending = purchases
    .filter(
      (purchase) =>
        purchase.supplierId === supplierId &&
        purchase.paidAmount < purchase.total,
    )
    .sort((a, b) => Number(a.createdAt - b.createdAt));
  const oldest = pending[0];
  return oldest ? `#${oldest.id.toString()}` : null;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable: Payable | null;
  reference: string | null;
}

function PaymentDialog({
  open,
  onOpenChange,
  payable,
  reference,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.cash);
  const [error, setError] = useState<string | null>(null);
  const registerPayment = useRegisterPayment();

  const balance = payable?.balance ?? 0n;

  function handleOpenChange(next: boolean) {
    if (next) {
      setAmount(balance > 0n ? (Number(balance) / 100).toFixed(2) : "");
      setMethod(PaymentMethod.cash);
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payable) return;
    const cents = parseAmountToCents(amount);
    if (cents === null) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    if (cents > payable.balance) {
      setError(
        `El monto no puede superar el saldo pendiente de ${formatMoney(payable.balance)}.`,
      );
      return;
    }
    setError(null);
    registerPayment.mutate(
      {
        supplierId: payable.supplierId,
        amount: cents,
        method,
      },
      {
        onSuccess: () => {
          toast.success("Pago registrado");
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setError(
            mutationError.message ||
              "No se pudo registrar el pago. Revisa el monto e inténtalo de nuevo.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="payables.payment_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Registrar pago</DialogTitle>
          <DialogDescription>
            {payable
              ? `Aplica un pago total o parcial a la cuenta de ${payable.supplierName}.`
              : "Aplica un pago total o parcial al saldo pendiente del proveedor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payable-payment-amount">Monto (COP)</Label>
            <Input
              id="payable-payment-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="1500.00"
              data-ocid="payables.payment_amount_input"
              className="data-rail"
              required
            />
            <p className="text-xs text-muted-foreground">
              Saldo pendiente actual: {formatMoney(balance)}
              {reference ? ` · Compra ${reference}` : ""}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payable-payment-method">Método de pago</Label>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            >
              <SelectTrigger
                id="payable-payment-method"
                data-ocid="payables.payment_method_select"
                className="w-full"
              >
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {PAYMENT_METHOD_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p
              data-ocid="payables.payment_error"
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
              data-ocid="payables.payment_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registerPayment.isPending}
              data-ocid="payables.payment_submit_button"
            >
              {registerPayment.isPending ? "Registrando…" : "Registrar pago"}
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
    (_, index) => `payables-skeleton-${index}`,
  );
  return (
    <div data-ocid="payables.loading_state" className="space-y-2 p-4" aria-busy>
      {rows.map((id) => (
        <Skeleton key={id} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function CuentasPorPagarPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;

  const statusFilter: StatusFilter =
    rawSearch.status === PayableStatus.pending ||
    rawSearch.status === PayableStatus.overdue ||
    rawSearch.status === PayableStatus.paid
      ? (rawSearch.status as PayableStatus)
      : "all";
  const search = typeof rawSearch.q === "string" ? rawSearch.q : "";

  const [searchInput, setSearchInput] = useState(search);
  const [paymentTarget, setPaymentTarget] = useState<Payable | null>(null);

  // Debounce the typed term into the URL. The URL is the single source of
  // truth for the query, so the term survives reloads and can be shared.
  useEffect(() => {
    if (searchInput === search) return;
    const handle = window.setTimeout(() => {
      void navigate({
        to: "/cuentas-por-pagar",
        search: (previous) => ({
          ...previous,
          q: searchInput.trim().length > 0 ? searchInput : undefined,
        }),
        replace: true,
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchInput, search, navigate]);

  const payablesQuery = usePayables();
  const purchasesQuery = usePurchases();

  const payables = payablesQuery.data ?? [];
  const purchases = purchasesQuery.data ?? [];

  const isLoading = payablesQuery.isLoading || purchasesQuery.isLoading;
  const isError = payablesQuery.isError || purchasesQuery.isError;

  // "Actualizar" and "Reintentar" must always hit the backend, so the cached
  // freshness window is bypassed explicitly instead of relying on staleTime.
  function refetchAll() {
    void payablesQuery.refetch({ cancelRefetch: true });
    void purchasesQuery.refetch({ cancelRefetch: true });
  }

  const term = search.trim().toLowerCase();
  const filtered = payables.filter((payable) => {
    if (statusFilter !== "all" && payable.status !== statusFilter) return false;
    if (term === "") return true;
    const reference = purchaseReference(purchases, payable.supplierId) ?? "";
    return (
      payable.supplierName.toLowerCase().includes(term) ||
      reference.toLowerCase().includes(term)
    );
  });

  const totalOutstanding = payables
    .filter((payable) => payable.status !== PayableStatus.paid)
    .reduce((sum, payable) => sum + payable.balance, 0n);
  const totalOverdue = payables
    .filter((payable) => payable.status === PayableStatus.overdue)
    .reduce((sum, payable) => sum + payable.balance, 0n);
  const openCount = payables.filter(
    (payable) => payable.status !== PayableStatus.paid,
  ).length;

  function countFor(filter: StatusFilter): number {
    if (filter === "all") return payables.length;
    return payables.filter((payable) => payable.status === filter).length;
  }

  function setStatusFilter(next: StatusFilter) {
    void navigate({
      to: "/cuentas-por-pagar",
      search: (previous) => ({
        ...previous,
        status: next === "all" ? undefined : next,
      }),
      replace: true,
    });
  }

  const hasQuery = search.length > 0 || statusFilter !== "all";

  return (
    <div
      data-ocid="payables.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Cuentas por pagar"
        description="Saldos pendientes con proveedores, vencimientos y registro de pagos."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refetchAll}
            disabled={isLoading}
            data-ocid="payables.refresh_button"
          >
            Actualizar
          </Button>
        }
      />

      <section
        data-ocid="payables.summary"
        aria-label="Resumen de cuentas por pagar"
        className="accounts-summary"
      >
        <div className="accounts-card" data-emphasis="primary">
          <p className="accounts-card-label">Total por pagar</p>
          <p className="accounts-card-value">{formatMoney(totalOutstanding)}</p>
          <p className="accounts-card-meta">Saldo pendiente con proveedores</p>
        </div>
        <div className="accounts-card" data-emphasis="overdue">
          <p className="accounts-card-label">Total vencido</p>
          <p className="accounts-card-value">{formatMoney(totalOverdue)}</p>
          <p className="accounts-card-meta">Cuentas con vencimiento superado</p>
        </div>
        <div className="accounts-card">
          <p className="accounts-card-label">Cuentas abiertas</p>
          <p className="accounts-card-value">{formatNumber(openCount)}</p>
          <p className="accounts-card-meta">
            Pendientes y vencidas por liquidar
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <fieldset
          data-ocid="payables.filter.chips"
          className="filter-chips"
          aria-label="Filtrar por estado"
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                data-active={isActive}
                data-ocid={`payables.filter.${option.value}`}
                aria-pressed={isActive}
                className="filter-chip"
              >
                {option.label}
                <span className="filter-chip-count">
                  {formatNumber(countFor(option.value))}
                </span>
              </button>
            );
          })}
        </fieldset>

        <div className="relative w-full lg:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar proveedor o referencia"
            aria-label="Buscar por proveedor o referencia de compra"
            data-ocid="payables.search_input"
            className="pl-9"
          />
        </div>
      </div>

      {isError ? (
        <div
          data-ocid="payables.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
        >
          <AlertTriangle
            className="size-5 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              No se pudieron cargar las cuentas por pagar
            </p>
            <p className="text-xs text-muted-foreground">
              Verifica la conexión con el backend e inténtalo de nuevo.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refetchAll}
            data-ocid="payables.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
          <TableSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="payables.empty_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
            <HandCoins
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold">
              {hasQuery ? "Sin cuentas que coincidan" : "Sin cuentas por pagar"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasQuery
                ? "Ajusta el filtro o la búsqueda para ver otras cuentas."
                : "Registra compras a proveedor para generar saldos pendientes."}
            </p>
          </div>
          {hasQuery ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchInput("");
                void navigate({
                  to: "/cuentas-por-pagar",
                  search: {},
                  replace: true,
                });
              }}
              data-ocid="payables.clear_filters_button"
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          data-ocid="payables.table"
          className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
        >
          <div className="scroll-slim overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Proveedor
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Referencia
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Monto total
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Saldo pendiente
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Vencimiento
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="w-px pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((payable, index) => {
                  const reference = purchaseReference(
                    purchases,
                    payable.supplierId,
                  );
                  const isOverdue = payable.status === PayableStatus.overdue;
                  const isPaid = payable.status === PayableStatus.paid;
                  const days = isOverdue ? overdueDays(payable.dueDate) : 0;
                  return (
                    <TableRow
                      key={payable.supplierId.toString()}
                      data-ocid={`payables.row.${index + 1}`}
                    >
                      <TableCell className="pl-4 font-medium">
                        {payable.supplierName}
                      </TableCell>
                      <TableCell className="data-rail text-muted-foreground">
                        {reference ?? "—"}
                      </TableCell>
                      <TableCell className="data-rail text-right">
                        {formatMoney(payable.totalPurchased)}
                      </TableCell>
                      <TableCell className="data-rail text-right font-semibold">
                        {formatMoney(payable.balance)}
                      </TableCell>
                      <TableCell>
                        <span className={isOverdue ? "due-overdue" : ""}>
                          {formatDate(payable.dueDate)}
                        </span>
                        {isOverdue && days > 0 ? (
                          <span className="due-overdue-days">
                            {`+${formatNumber(days)} d`}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`badge-status ${STATUS_BADGE_CLASS[payable.status]}`}
                          data-ocid={`payables.status_badge.${index + 1}`}
                        >
                          {STATUS_LABELS[payable.status]}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="row-actions" data-pinned="false">
                          <button
                            type="button"
                            title="Registrar pago"
                            aria-label={`Registrar pago a ${payable.supplierName}`}
                            disabled={isPaid || payable.balance <= 0n}
                            data-ocid={`payables.pay_button.${index + 1}`}
                            onClick={() => setPaymentTarget(payable)}
                            className="row-action disabled:pointer-events-none disabled:opacity-40"
                          >
                            <Wallet className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <PaymentDialog
        open={paymentTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPaymentTarget(null);
        }}
        payable={paymentTarget}
        reference={
          paymentTarget
            ? purchaseReference(purchases, paymentTarget.supplierId)
            : null
        }
      />
    </div>
  );
}
