import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CashRegisterDialog } from "@/components/cash/CashRegisterDialog";
import {
  cashRegisterKindLabel,
  registerShiftStatusLabel,
  registerStatusLabel,
} from "@/components/cash/cash-labels";
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
import {
  useCashRegisters,
  useDeleteCashRegister,
  useOpenShifts,
  useSetCashRegisterActive,
} from "@/hooks/use-cash";
import { formatMoney, formatNumber } from "@/lib/format";
import type {
  CashRegister,
  CashRegisterKind,
  DataColumn,
  RowAction,
} from "@/lib/types";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Plus,
  RotateCcw,
  Search,
  Wallet,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 15;

/**
 * Catálogo de cajas y bancos: alta, edición, activación y eliminación de los
 * registros que agrupan los turnos de caja. Un registro con turno abierto no
 * se puede eliminar ni desactivar.
 */
export function CashRegistersPage() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<CashRegisterKind | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CashRegister | null>(null);

  const registersQuery = useCashRegisters({
    kind: kind === "all" ? null : kind,
    active: status === "all" ? null : status === "active",
    search,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  });
  const openShiftsQuery = useOpenShifts();
  const setActive = useSetCashRegisterActive();
  const deleteRegister = useDeleteCashRegister();

  const items = registersQuery.data?.items ?? [];
  const total = Number(registersQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const openRegisterIds = useMemo(() => {
    const ids = new Set<string>();
    for (const shift of openShiftsQuery.data ?? []) {
      ids.add(shift.registerId.toString());
    }
    return ids;
  }, [openShiftsQuery.data]);

  const hasFilters = search.trim() !== "" || kind !== "all" || status !== "all";

  function clearFilters() {
    setSearch("");
    setKind("all");
    setStatus("all");
    setPage(1);
  }
  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  const openEdit = useCallback((register: CashRegister) => {
    setEditing(register);
    setDialogOpen(true);
  }, []);

  const toggleActive = useCallback(
    (register: CashRegister) => {
      setActive.mutate(
        { registerId: register.id, active: !register.active },
        {
          onSuccess: () => {
            toast.success(
              register.active
                ? "Caja o banco desactivado"
                : "Caja o banco activado",
            );
          },
          onError: (error: Error) => {
            toast.error(
              error.message ||
                "No se pudo cambiar el estado de la caja o banco.",
            );
          },
        },
      );
    },
    [setActive],
  );

  const removeRegister = useCallback(
    (register: CashRegister) => {
      deleteRegister.mutate(register.id, {
        onSuccess: () => {
          toast.success("Caja o banco eliminado");
        },
        onError: (error: Error) => {
          toast.error(
            error.message ||
              "No se pudo eliminar la caja o banco. Verifica que no tenga un turno abierto.",
          );
        },
      });
    },
    [deleteRegister],
  );

  const columns = useMemo<Array<DataColumn<CashRegister>>>(
    () => [
      {
        key: "name",
        header: "Nombre",
        render: (register) => (
          <div className="flex min-w-0 items-center gap-2">
            {register.kind === "bank" ? (
              <Landmark
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            ) : (
              <Wallet
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            <span className="truncate text-sm font-medium">
              {register.name}
            </span>
          </div>
        ),
      },
      {
        key: "kind",
        header: "Tipo",
        render: (register) => (
          <span className="text-sm text-muted-foreground">
            {cashRegisterKindLabel(register.kind)}
          </span>
        ),
      },
      {
        key: "openingBalance",
        header: "Saldo inicial",
        numeric: true,
        render: (register) => (
          <span className="data-rail font-medium">
            {formatMoney(register.openingBalance)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Estado",
        render: (register) => (
          <StatusBadge
            label={registerStatusLabel(register.active)}
            tone={register.active ? "accepted" : "neutral"}
          />
        ),
      },
      {
        key: "shift",
        header: "Turno",
        render: (register) => {
          const hasOpenShift = openRegisterIds.has(register.id.toString());
          return (
            <StatusBadge
              label={registerShiftStatusLabel(hasOpenShift)}
              tone={hasOpenShift ? "pending" : "neutral"}
            />
          );
        },
      },
    ],
    [openRegisterIds],
  );

  const actions = useMemo<Array<RowAction<CashRegister>>>(
    () => [
      {
        kind: "edit",
        label: "Editar caja o banco",
        onClick: openEdit,
      },
      {
        kind: "save",
        label: "Activar o desactivar",
        onClick: toggleActive,
      },
      {
        kind: "delete",
        label: "Eliminar caja o banco",
        onClick: removeRegister,
        disabled: (register) => openRegisterIds.has(register.id.toString()),
      },
    ],
    [openRegisterIds, openEdit, toggleActive, removeRegister],
  );

  return (
    <div
      data-ocid="caja.registers.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Cajas y bancos"
        description="Catálogo de cajas y bancos del taller. Cada registro agrupa sus propios turnos y movimientos; los inactivos conservan su historial."
        actions={
          <Button
            type="button"
            onClick={openCreate}
            data-ocid="caja.registers.create_button"
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nueva caja o banco
          </Button>
        }
      />

      <div
        data-ocid="caja.registers.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <Label
              htmlFor="register-search"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Buscar
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="register-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Nombre de la caja o banco"
                className="pl-9"
                data-ocid="caja.registers.search_input"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="register-kind-filter"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Tipo
            </Label>
            <Select
              value={kind}
              onValueChange={(value) => {
                setKind(value as CashRegisterKind | "all");
                setPage(1);
              }}
            >
              <SelectTrigger
                id="register-kind-filter"
                aria-label="Filtrar por tipo"
                data-ocid="caja.registers.kind_filter"
                className="w-[150px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cash">Caja</SelectItem>
                <SelectItem value="bank">Banco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="register-status-filter"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Estado
            </Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as "all" | "active" | "inactive");
                setPage(1);
              }}
            >
              <SelectTrigger
                id="register-status-filter"
                aria-label="Filtrar por estado"
                data-ocid="caja.registers.status_filter"
                className="w-[150px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="inactive">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="caja.registers.clear_filters_button"
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
          {registersQuery.isLoading
            ? "Cargando…"
            : `${formatNumber(total)} registro${total === 1 ? "" : "s"}`}
        </p>
      </div>

      {registersQuery.isError ? (
        <div
          data-ocid="caja.registers.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el catálogo de cajas y bancos.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void registersQuery.refetch({ cancelRefetch: true })}
            data-ocid="caja.registers.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : registersQuery.isLoading ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
          <div
            data-ocid="caja.registers.loading_state"
            className="space-y-2 p-4"
          >
            {Array.from(
              { length: 5 },
              (_, index) => `register-skeleton-${index}`,
            ).map((id) => (
              <Skeleton key={id} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div
          data-ocid="caja.registers.empty_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
            <Landmark
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold">
              {hasFilters ? "Sin resultados" : "Aún no hay cajas ni bancos"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? "No encontramos cajas ni bancos con esos criterios. Ajusta la búsqueda o los filtros."
                : "Crea la primera caja o banco para empezar a abrir turnos y registrar movimientos."}
            </p>
          </div>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              data-ocid="caja.registers.empty_clear_button"
            >
              Limpiar filtros
            </Button>
          ) : (
            <Button
              type="button"
              onClick={openCreate}
              data-ocid="caja.registers.empty_create_button"
              className="gap-1.5"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nueva caja o banco
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(register) => register.id.toString()}
          actions={actions}
          ocid="caja.registers"
          caption="Catálogo de cajas y bancos"
        />
      )}

      {!registersQuery.isLoading && !registersQuery.isError && total > 0 ? (
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
              data-ocid="caja.registers.pagination_prev"
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
              data-ocid="caja.registers.pagination_next"
              className="gap-1"
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      <CashRegisterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        register={editing}
      />
    </div>
  );
}

export default CashRegistersPage;
