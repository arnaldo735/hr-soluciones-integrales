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
import { useShifts } from "@/hooks/use-cash";
import {
  colombiaEndOfDay,
  colombiaStartOfDay,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import {
  type DataColumn,
  type Id,
  type RowAction,
  type Shift,
  ShiftStatus,
} from "@/lib/types";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 15;

interface ShiftHistoryTableProps {
  /** Opens the daily report of the selected shift. */
  onOpenReport: (shiftId: Id) => void;
}

/**
 * History of closed shifts with backend-side pagination and a status/date
 * filter. Each row opens the shift's daily report.
 */
export function ShiftHistoryTable({ onOpenReport }: ShiftHistoryTableProps) {
  const [status, setStatus] = useState<ShiftStatus | "all">(ShiftStatus.closed);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const fromTimestamp = useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = useMemo(() => colombiaEndOfDay(to), [to]);

  const shiftsQuery = useShifts({
    status: status === "all" ? null : status,
    from: fromTimestamp,
    to: toTimestamp,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });

  const items = shiftsQuery.data?.items ?? [];
  const total = Number(shiftsQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasFilters = status !== ShiftStatus.closed || from !== "" || to !== "";

  function clearFilters() {
    setStatus(ShiftStatus.closed);
    setFrom("");
    setTo("");
    setPage(1);
  }

  const columns = useMemo<Array<DataColumn<Shift>>>(
    () => [
      {
        key: "id",
        header: "Turno",
        render: (shift) => (
          <span className="data-rail text-sm font-medium">
            #{shift.id.toString()}
          </span>
        ),
      },
      {
        key: "status",
        header: "Estado",
        render: (shift) => (
          <StatusBadge
            label={shift.status === ShiftStatus.open ? "Abierto" : "Cerrado"}
            tone={shift.status === ShiftStatus.open ? "accepted" : "neutral"}
          />
        ),
      },
      {
        key: "openedAt",
        header: "Apertura",
        render: (shift) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(shift.openedAt)}
          </span>
        ),
      },
      {
        key: "closedAt",
        header: "Cierre",
        render: (shift) => (
          <span className="text-sm text-muted-foreground">
            {shift.closedAt ? formatDateTime(shift.closedAt) : "—"}
          </span>
        ),
      },
      {
        key: "openingCash",
        header: "Inicial caja",
        numeric: true,
        render: (shift) => (
          <span className="data-rail text-muted-foreground">
            {formatMoney(shift.openingCash)}
          </span>
        ),
      },
      {
        key: "computedClosingCash",
        header: "Final caja",
        numeric: true,
        render: (shift) => (
          <span className="data-rail font-medium">
            {formatMoney(shift.computedClosingCash)}
          </span>
        ),
      },
      {
        key: "computedClosingBank",
        header: "Final bancos",
        numeric: true,
        render: (shift) => (
          <span className="data-rail font-medium">
            {formatMoney(shift.computedClosingBank)}
          </span>
        ),
      },
      {
        key: "difference",
        header: "Diferencia",
        numeric: true,
        render: (shift) => {
          const difference = shift.differenceCash + shift.differenceBank;
          return (
            <span
              className={
                difference === 0n
                  ? "data-rail text-muted-foreground"
                  : difference > 0n
                    ? "data-rail font-semibold text-success"
                    : "data-rail font-semibold text-destructive"
              }
            >
              {difference > 0n ? "+" : ""}
              {formatMoney(difference)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const actions = useMemo<Array<RowAction<Shift>>>(
    () => [
      {
        kind: "edit",
        label: "Ver informe del turno",
        onClick: (shift) => onOpenReport(shift.id),
      },
    ],
    [onOpenReport],
  );

  return (
    <section className="min-w-0 space-y-3">
      <div
        data-ocid="caja.history.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label
              htmlFor="history-status"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Estado
            </Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as ShiftStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger
                id="history-status"
                aria-label="Filtrar por estado del turno"
                data-ocid="caja.history.status_filter"
                className="w-[160px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ShiftStatus.closed}>Cerrados</SelectItem>
                <SelectItem value={ShiftStatus.open}>Abiertos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="history-from"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Desde
            </Label>
            <Input
              id="history-from"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="data-rail w-[160px]"
              data-ocid="caja.history.date_from_input"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="history-to"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Hasta
            </Label>
            <Input
              id="history-to"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="data-rail w-[160px]"
              data-ocid="caja.history.date_to_input"
            />
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="caja.history.clear_filters_button"
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
          {shiftsQuery.isLoading
            ? "Cargando…"
            : `${formatNumber(total)} turno${total === 1 ? "" : "s"}`}
        </p>
      </div>

      {shiftsQuery.isError ? (
        <div
          data-ocid="caja.history.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el historial de turnos.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void shiftsQuery.refetch({ cancelRefetch: true })}
            data-ocid="caja.history.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : shiftsQuery.isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
          <div data-ocid="caja.history.loading_state" className="space-y-2 p-4">
            {Array.from(
              { length: 5 },
              (_, index) => `shift-skeleton-${index}`,
            ).map((id) => (
              <Skeleton key={id} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div
          data-ocid="caja.history.empty_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
            <History
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold">
              {hasFilters ? "Sin resultados" : "Aún no hay turnos cerrados"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? "Ajusta los filtros para encontrar turnos en el historial."
                : "Cuando cierres un turno aparecerá aquí con su informe diario."}
            </p>
          </div>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              data-ocid="caja.history.empty_clear_button"
            >
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(shift) => shift.id.toString()}
          actions={actions}
          ocid="caja.history"
          caption="Historial de turnos"
        />
      )}

      {!shiftsQuery.isLoading && !shiftsQuery.isError && total > 0 ? (
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
              data-ocid="caja.history.pagination_prev"
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
              data-ocid="caja.history.pagination_next"
              className="gap-1"
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="size-3.5" aria-hidden="true" />
        Usa el botón de cada turno para abrir su informe diario imprimible.
      </p>
    </section>
  );
}
