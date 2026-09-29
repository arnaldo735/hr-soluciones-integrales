import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { useCashMovements } from "@/hooks/use-cash";
import {
  colombiaEndOfDay,
  colombiaStartOfDay,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import {
  CashAccount,
  type CashMovement,
  CashMovementKind,
  type DataColumn,
  type Id,
  type PaymentMethod,
} from "@/lib/types";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  accountLabel,
  movementKindLabel,
  movementSourceLabel,
  paymentMethodLabel,
} from "./cash-labels";

const PAGE_SIZE = 20;

interface CashMovementsTableProps {
  /** Restrict the table to one shift; `null` lists every shift. */
  shiftId: Id | null;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /** Optional caption above the table. */
  caption?: string;
}

/**
 * Movements ledger for a shift (or every shift) with backend-side pagination
 * and filters. The backend orders rows by id descending, so the most recent
 * movement is always first.
 */
export function CashMovementsTable({
  shiftId,
  ocid,
  caption,
}: CashMovementsTableProps) {
  const [kind, setKind] = useState<CashMovementKind | "all">("all");
  const [account, setAccount] = useState<CashAccount | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "all">(
    "all",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const fromTimestamp = useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = useMemo(() => colombiaEndOfDay(to), [to]);

  const movementsQuery = useCashMovements({
    shiftId,
    kind: kind === "all" ? null : kind,
    account: account === "all" ? null : account,
    paymentMethod: paymentMethod === "all" ? null : paymentMethod,
    from: fromTimestamp,
    to: toTimestamp,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const items = movementsQuery.data?.items ?? [];
  const total = Number(movementsQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasFilters =
    kind !== "all" ||
    account !== "all" ||
    paymentMethod !== "all" ||
    from !== "" ||
    to !== "";

  function clearFilters() {
    setKind("all");
    setAccount("all");
    setPaymentMethod("all");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const columns = useMemo<Array<DataColumn<CashMovement>>>(
    () => [
      {
        key: "timestamp",
        header: "Fecha",
        render: (movement) => (
          <span className="data-rail text-muted-foreground">
            {formatDateTime(movement.timestamp)}
          </span>
        ),
      },
      {
        key: "kind",
        header: "Tipo",
        render: (movement) => (
          <StatusBadge
            label={movementKindLabel(movement.kind)}
            tone={
              movement.kind === CashMovementKind.income
                ? "accepted"
                : "rejected"
            }
          />
        ),
      },
      {
        key: "description",
        header: "Descripción",
        render: (movement) => (
          <div className="min-w-0 max-w-[280px]">
            <p className="truncate font-medium">{movement.description}</p>
            {movement.reference ? (
              <p className="data-rail truncate text-xs text-muted-foreground">
                Ref. {movement.reference}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "paymentMethod",
        header: "Medio",
        render: (movement) => (
          <span className="text-muted-foreground">
            {paymentMethodLabel(movement.paymentMethod)}
          </span>
        ),
      },
      {
        key: "account",
        header: "Cuenta",
        render: (movement) => (
          <StatusBadge
            label={accountLabel(movement.account)}
            tone={movement.account === CashAccount.cash ? "neutral" : "sent"}
          />
        ),
      },
      {
        key: "source",
        header: "Origen",
        render: (movement) => (
          <span className="text-xs text-muted-foreground">
            {movementSourceLabel(movement.source)}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Importe",
        numeric: true,
        render: (movement) => (
          <span
            className={
              movement.kind === CashMovementKind.income
                ? "data-rail font-semibold text-success"
                : "data-rail font-semibold text-destructive"
            }
          >
            {movement.kind === CashMovementKind.income ? "+" : "−"}
            {formatMoney(movement.amount)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <section className="min-w-0 space-y-3">
      <div
        data-ocid={`${ocid}.filters`}
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label
              htmlFor={`${ocid}-kind`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Tipo
            </Label>
            <Select
              value={kind}
              onValueChange={(value) => {
                setKind(value as CashMovementKind | "all");
                setPage(1);
              }}
            >
              <SelectTrigger
                id={`${ocid}-kind`}
                aria-label="Filtrar por tipo de movimiento"
                data-ocid={`${ocid}.kind_filter`}
                className="w-[150px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={CashMovementKind.income}>
                  Ingresos
                </SelectItem>
                <SelectItem value={CashMovementKind.expense}>
                  Egresos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor={`${ocid}-account`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cuenta
            </Label>
            <Select
              value={account}
              onValueChange={(value) => {
                setAccount(value as CashAccount | "all");
                setPage(1);
              }}
            >
              <SelectTrigger
                id={`${ocid}-account`}
                aria-label="Filtrar por cuenta"
                data-ocid={`${ocid}.account_filter`}
                className="w-[150px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value={CashAccount.cash}>Caja</SelectItem>
                <SelectItem value={CashAccount.bank}>Bancos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor={`${ocid}-method`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Medio
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value as PaymentMethod | "all");
                setPage(1);
              }}
            >
              <SelectTrigger
                id={`${ocid}-method`}
                aria-label="Filtrar por medio de pago"
                data-ocid={`${ocid}.method_filter`}
                className="w-[160px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor={`${ocid}-from`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Desde
            </Label>
            <Input
              id={`${ocid}-from`}
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="data-rail w-[160px]"
              data-ocid={`${ocid}.date_from_input`}
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor={`${ocid}-to`}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Hasta
            </Label>
            <Input
              id={`${ocid}-to`}
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="data-rail w-[160px]"
              data-ocid={`${ocid}.date_to_input`}
            />
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid={`${ocid}.clear_filters_button`}
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {movementsQuery.isLoading
            ? "Cargando…"
            : `${formatNumber(total)} movimiento${total === 1 ? "" : "s"}`}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Más recientes primero
        </p>
      </div>

      {movementsQuery.isError ? (
        <div
          data-ocid={`${ocid}.error_state`}
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar los movimientos.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void movementsQuery.refetch({ cancelRefetch: true })}
            data-ocid={`${ocid}.retry_button`}
          >
            Reintentar
          </Button>
        </div>
      ) : movementsQuery.isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
          <div data-ocid={`${ocid}.loading_state`} className="space-y-2 p-4">
            {Array.from(
              { length: 6 },
              (_, index) => `movement-skeleton-${index}`,
            ).map((id) => (
              <Skeleton key={id} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div
          data-ocid={`${ocid}.empty_state`}
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
            <Receipt
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold">
              {hasFilters ? "Sin resultados" : "Aún no hay movimientos"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? "Ajusta los filtros para encontrar movimientos del turno."
                : "Registra el primer ingreso o egreso del turno para verlo aquí."}
            </p>
          </div>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              data-ocid={`${ocid}.empty_clear_button`}
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(movement) => movement.id.toString()}
          ocid={ocid}
          caption={caption}
        />
      )}

      {!movementsQuery.isLoading && !movementsQuery.isError && total > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              data-ocid={`${ocid}.pagination_prev`}
              className="gap-1"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              data-ocid={`${ocid}.pagination_next`}
              className="gap-1"
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
