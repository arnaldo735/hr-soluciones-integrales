import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { CancelOrderDialog } from "@/components/order/CancelOrderDialog";
import { DeleteOrderDialog } from "@/components/order/DeleteOrderDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  useOrderLookups,
  useOrders,
} from "@/hooks/use-orders";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import {
  type Id,
  NotificationSource,
  OrderStatus,
  type OrderStatus as OrderStatusType,
  type OrderView,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Mail,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 10;

type StatusFilter = OrderStatusType | "all";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  ...ORDER_STATUS_FLOW.map((status) => ({
    value: status as StatusFilter,
    label: ORDER_STATUS_LABELS[status],
  })),
  {
    value: OrderStatus.cancelled,
    label: ORDER_STATUS_LABELS[OrderStatus.cancelled],
  },
];

function TableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, i) => `orders-skeleton-${i}`);
  return (
    <div data-ocid="orders.loading_state" className="space-y-2 p-4" aria-busy>
      {rows.map((id) => (
        <Skeleton key={id} className="h-10 w-full" />
      ))}
    </div>
  );
}

/**
 * Resolves the registered email of each customer referenced by a page of
 * orders. `listOrders` returns only ids, so the notification action needs a
 * lookup pass to know whether the recipient has an email on file.
 */
function useOrderCustomerEmails(customerIds: Id[]) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const key = customerIds
    .map((id) => id.toString())
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["order-customer-emails", key],
    queryFn: async (): Promise<Map<string, string | null>> => {
      const emails = new Map<string, string | null>();
      if (!actor) return emails;
      const unique = Array.from(
        new Set(customerIds.map((id) => id.toString())),
      );
      const results = await Promise.all(
        unique.map(async (id) => {
          const customer = await actor.getCustomer(token, BigInt(id));
          return { id, email: customer?.email?.trim() ?? "" };
        }),
      );
      for (const entry of results) {
        emails.set(entry.id, entry.email === "" ? null : entry.email);
      }
      return emails;
    },
    enabled: !!actor && !isFetching,
    // Customer emails change rarely; the per-page lookup is reused while the
    // page stays in the cache instead of re-fanning out on every visit.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function OrdersPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;

  const statusFilter: StatusFilter =
    typeof rawSearch.status === "string" &&
    (rawSearch.status === "all" ||
      ORDER_STATUS_FLOW.includes(rawSearch.status as OrderStatusType) ||
      rawSearch.status === OrderStatus.cancelled)
      ? (rawSearch.status as StatusFilter)
      : "all";
  const search = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const page =
    typeof rawSearch.page === "number" && rawSearch.page >= 1
      ? Math.floor(rawSearch.page)
      : 1;

  const [searchInput, setSearchInput] = useState(search);
  const [cancelTarget, setCancelTarget] = useState<{
    id: Id;
    orderNumber: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id;
    orderNumber: string;
  } | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<{
    customerId: Id;
    customerName: string;
    customerEmail: string | null;
    orderId: Id;
    orderNumber: string;
  } | null>(null);

  // Debounce the typed term into the URL. The URL is the single source of
  // truth for the query, so the term survives reloads and can be shared.
  useEffect(() => {
    if (searchInput === search) return;
    const handle = window.setTimeout(() => {
      void navigate({
        to: "/ordenes",
        search: (previous) => ({
          ...previous,
          q: searchInput.trim().length > 0 ? searchInput : undefined,
          page: 1,
        }),
        replace: true,
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, search, navigate]);

  const { data, isLoading, isError, refetch, isFetching } = useOrders({
    status: statusFilter === "all" ? null : statusFilter,
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const total = data ? Number(data.total) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const lookups = useOrderLookups(
    items.map((view) => view.order.customerId),
    items.map((view) => view.order.motorcycleId),
  );
  const customerNames = lookups.data?.customers;
  const motorcyclePlates = lookups.data?.motorcycles;

  const emailsQuery = useOrderCustomerEmails(
    items.map((view) => view.order.customerId),
  );
  const customerEmails = emailsQuery.data;

  function setStatusFilter(next: StatusFilter) {
    void navigate({
      to: "/ordenes",
      search: (previous) => ({
        ...previous,
        status: next === "all" ? undefined : next,
        page: 1,
      }),
      replace: true,
    });
  }

  function setPage(next: number) {
    void navigate({
      to: "/ordenes",
      search: (previous) => ({ ...previous, page: next }),
      replace: true,
    });
  }

  function openNotify(view: OrderView) {
    const order = view.order;
    setNotifyTarget({
      customerId: order.customerId,
      customerName:
        customerNames?.get(order.customerId.toString()) ??
        `Cliente #${order.customerId.toString()}`,
      customerEmail: customerEmails?.get(order.customerId.toString()) ?? null,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  }

  const hasQuery = search.length > 0 || statusFilter !== "all";

  return (
    <div
      data-ocid="orders.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Órdenes de taller
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Ingresos, reparaciones en curso y entregas con su estado, moto y
            total facturable.
          </p>
        </div>
        <Button asChild data-ocid="orders.new_order_button" className="gap-2">
          <Link to="/ordenes/nueva">
            <Plus className="size-4" aria-hidden="true" />
            Nueva orden
          </Link>
        </Button>
      </header>

      <Card className="gap-0 rounded-lg py-0 shadow-none">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            data-ocid="orders.filter.tabs"
            className="flex flex-wrap items-center gap-1"
          >
            {FILTER_OPTIONS.map((option) => {
              const isActive = statusFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  data-ocid={`orders.filter.${option.value}`}
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth"
                      : "rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted/50 hover:text-foreground"
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por orden, cliente, moto o placa…"
              aria-label="Buscar órdenes por número, cliente, moto o placa"
              data-ocid="orders.search_input"
              className="h-9 pl-9"
            />
          </div>
        </div>

        {isError ? (
          <div
            data-ocid="orders.error_state"
            className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          >
            <AlertTriangle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                No se pudieron cargar las órdenes
              </p>
              <p className="text-xs text-muted-foreground">
                Verifica la conexión con el backend e inténtalo de nuevo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch({ cancelRefetch: true })}
              data-ocid="orders.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <div
            data-ocid="orders.empty_state"
            className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted/40">
              <ClipboardList
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {hasQuery ? "Sin resultados" : "Aún no hay órdenes"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {hasQuery
                  ? "Ajusta el filtro de estado o la búsqueda para encontrar la orden."
                  : "Registra el ingreso de una moto para comenzar a operar el taller."}
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              data-ocid="orders.empty_state.new_order_button"
            >
              <Link to="/ordenes/nueva">Nueva orden</Link>
            </Button>
          </div>
        ) : (
          <div className="scroll-slim overflow-x-auto">
            <Table data-ocid="orders.table">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4 font-mono text-[11px] uppercase tracking-[0.14em]">
                    Orden
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">
                    Cliente
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">
                    Placa
                  </TableHead>
                  <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">
                    Estado
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                    Total
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                    Fecha
                  </TableHead>
                  <TableHead className="pr-4 text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((view, index) => {
                  const order = view.order;
                  const isCancelled = order.status === OrderStatus.cancelled;
                  return (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`orders.row.${index + 1}`}
                      className="odd:bg-muted/20"
                    >
                      <TableCell className="pl-4">
                        <Link
                          to="/ordenes/$id"
                          params={{ id: order.id.toString() }}
                          data-ocid={`orders.link.${index + 1}`}
                          className="data-rail text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate text-sm">
                        {customerNames?.get(order.customerId.toString()) ??
                          `Cliente #${order.customerId.toString()}`}
                      </TableCell>
                      <TableCell className="data-rail text-sm text-muted-foreground">
                        {motorcyclePlates?.get(order.motorcycleId.toString()) ??
                          `Moto #${order.motorcycleId.toString()}`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={ORDER_STATUS_BADGE[order.status]}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="data-rail text-right text-sm font-semibold">
                        {formatMoney(view.totals.total)}
                      </TableCell>
                      <TableCell className="data-rail text-right text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openNotify(view)}
                            aria-label={`Notificar al cliente de la orden ${order.orderNumber}`}
                            data-ocid={`orders.notify_button.${index + 1}`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Mail className="size-4" aria-hidden="true" />
                          </Button>
                          <WhatsAppNotifyButton
                            contactKind={WhatsAppContactKind.customer}
                            contactId={order.customerId}
                            context={WhatsAppContext.order}
                            referenceId={order.id}
                            contactName={
                              customerNames?.get(order.customerId.toString()) ??
                              `Cliente #${order.customerId.toString()}`
                            }
                            size="icon"
                            variant="ghost"
                            ocid={`orders.whatsapp_button.${index + 1}`}
                            className="text-muted-foreground hover:text-success"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setCancelTarget({
                                id: order.id,
                                orderNumber: order.orderNumber,
                              })
                            }
                            disabled={isCancelled}
                            aria-label={`Cancelar la orden ${order.orderNumber}`}
                            data-ocid={`orders.cancel_button.${index + 1}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Ban className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDeleteTarget({
                                id: order.id,
                                orderNumber: order.orderNumber,
                              })
                            }
                            aria-label={`Eliminar la orden ${order.orderNumber}`}
                            data-ocid={`orders.delete_button.${index + 1}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!isError && !isLoading && items.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p
              data-ocid="orders.pagination.summary"
              className="data-rail text-xs text-muted-foreground"
            >
              {formatNumber(rangeStart)}–{formatNumber(rangeEnd)} de{" "}
              {formatNumber(total)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || isFetching}
                data-ocid="orders.pagination_prev"
                className="gap-1"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Anterior
              </Button>
              <span className="data-rail text-xs text-muted-foreground">
                {formatNumber(page)} / {formatNumber(totalPages)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isFetching}
                data-ocid="orders.pagination_next"
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {cancelTarget ? (
        <CancelOrderDialog
          orderId={cancelTarget.id}
          orderNumber={cancelTarget.orderNumber}
          open
          onOpenChange={(next) => {
            if (!next) setCancelTarget(null);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteOrderDialog
          orderId={deleteTarget.id}
          orderNumber={deleteTarget.orderNumber}
          open
          onOpenChange={(next) => {
            if (!next) setDeleteTarget(null);
          }}
        />
      ) : null}

      {notifyTarget ? (
        <NotifyCustomerDialog
          open
          onOpenChange={(next) => {
            if (!next) setNotifyTarget(null);
          }}
          customerId={notifyTarget.customerId}
          customerName={notifyTarget.customerName}
          customerEmail={notifyTarget.customerEmail}
          source={NotificationSource.order}
          referenceId={notifyTarget.orderId}
          defaultSubject={`Estado de tu orden ${notifyTarget.orderNumber}`}
          defaultMessage={`Hola ${notifyTarget.customerName}, te informamos el estado actual de tu orden ${notifyTarget.orderNumber}. Si necesitas más detalles sobre la reparación, respóndenos a este correo y con gusto te atendemos.`}
        />
      ) : null}
    </div>
  );
}
