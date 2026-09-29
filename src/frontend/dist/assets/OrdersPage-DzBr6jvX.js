import { r as useNavigate, s as useSearch, O as OrderStatus, t as reactExports, j as jsxRuntimeExports, B as Button, L as Link, v as Search, w as Input, T as TriangleAlert, C as ClipboardList, x as Badge, y as formatMoney, z as formatDate, A as WhatsAppContext, D as WhatsAppContactKind, E as Ban, o as formatNumber, G as ChevronRight, N as NotificationSource, k as useBackend, l as useAuth, m as useQuery } from "./index-EqGEeyjs.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-DUFQVTg_.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { C as CancelOrderDialog, D as DeleteOrderDialog } from "./DeleteOrderDialog-CmKHuh1g.js";
import { C as Card } from "./card-YKA4f36t.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import { O as ORDER_STATUS_FLOW, u as useOrders, a as useOrderLookups, b as ORDER_STATUS_LABELS, c as ORDER_STATUS_BADGE } from "./use-orders-BVudDwaF.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { M as Mail } from "./mail-B11strfl.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { C as ChevronLeft } from "./chevron-left-C2006Y0h.js";
import "./textarea-B0CUuiY-.js";
import "./use-whatsapp-DIGqY6EY.js";
import "./pdf-BjjrMDP3.js";
import "./download-DPgaDAHv.js";
import "./warranty-BU5LnZHy.js";
const PAGE_SIZE = 10;
const FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  ...ORDER_STATUS_FLOW.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status]
  })),
  {
    value: OrderStatus.cancelled,
    label: ORDER_STATUS_LABELS[OrderStatus.cancelled]
  }
];
function TableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, i) => `orders-skeleton-${i}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "orders.loading_state", className: "space-y-2 p-4", "aria-busy": true, children: rows.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)) });
}
function useOrderCustomerEmails(customerIds) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const key = customerIds.map((id) => id.toString()).sort().join(",");
  return useQuery({
    queryKey: ["order-customer-emails", key],
    queryFn: async () => {
      const emails = /* @__PURE__ */ new Map();
      if (!actor) return emails;
      const unique = Array.from(
        new Set(customerIds.map((id) => id.toString()))
      );
      const results = await Promise.all(
        unique.map(async (id) => {
          var _a;
          const customer = await actor.getCustomer(token, BigInt(id));
          return { id, email: ((_a = customer == null ? void 0 : customer.email) == null ? void 0 : _a.trim()) ?? "" };
        })
      );
      for (const entry of results) {
        emails.set(entry.id, entry.email === "" ? null : entry.email);
      }
      return emails;
    },
    enabled: !!actor && !isFetching,
    // Customer emails change rarely; the per-page lookup is reused while the
    // page stays in the cache instead of re-fanning out on every visit.
    staleTime: Number.POSITIVE_INFINITY
  });
}
function OrdersPage() {
  var _a, _b;
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const statusFilter = typeof rawSearch.status === "string" && (rawSearch.status === "all" || ORDER_STATUS_FLOW.includes(rawSearch.status) || rawSearch.status === OrderStatus.cancelled) ? rawSearch.status : "all";
  const search = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const page = typeof rawSearch.page === "number" && rawSearch.page >= 1 ? Math.floor(rawSearch.page) : 1;
  const [searchInput, setSearchInput] = reactExports.useState(search);
  const [cancelTarget, setCancelTarget] = reactExports.useState(null);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [notifyTarget, setNotifyTarget] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (searchInput === search) return;
    const handle = window.setTimeout(() => {
      void navigate({
        to: "/ordenes",
        search: (previous) => ({
          ...previous,
          q: searchInput.trim().length > 0 ? searchInput : void 0,
          page: 1
        }),
        replace: true
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, search, navigate]);
  const { data, isLoading, isError, refetch, isFetching } = useOrders({
    status: statusFilter === "all" ? null : statusFilter,
    search,
    page,
    pageSize: PAGE_SIZE
  });
  const items = (data == null ? void 0 : data.items) ?? [];
  const total = data ? Number(data.total) : 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const lookups = useOrderLookups(
    items.map((view) => view.order.customerId),
    items.map((view) => view.order.motorcycleId)
  );
  const customerNames = (_a = lookups.data) == null ? void 0 : _a.customers;
  const motorcyclePlates = (_b = lookups.data) == null ? void 0 : _b.motorcycles;
  const emailsQuery = useOrderCustomerEmails(
    items.map((view) => view.order.customerId)
  );
  const customerEmails = emailsQuery.data;
  function setStatusFilter(next) {
    void navigate({
      to: "/ordenes",
      search: (previous) => ({
        ...previous,
        status: next === "all" ? void 0 : next,
        page: 1
      }),
      replace: true
    });
  }
  function setPage(next) {
    void navigate({
      to: "/ordenes",
      search: (previous) => ({ ...previous, page: next }),
      replace: true
    });
  }
  function openNotify(view) {
    const order = view.order;
    setNotifyTarget({
      customerId: order.customerId,
      customerName: (customerNames == null ? void 0 : customerNames.get(order.customerId.toString())) ?? `Cliente #${order.customerId.toString()}`,
      customerEmail: (customerEmails == null ? void 0 : customerEmails.get(order.customerId.toString())) ?? null,
      orderId: order.id,
      orderNumber: order.orderNumber
    });
  }
  const hasQuery = search.length > 0 || statusFilter !== "all";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "orders.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Órdenes de taller" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Ingresos, reparaciones en curso y entregas con su estado, moto y total facturable." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, "data-ocid": "orders.new_order_button", className: "gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/ordenes/nueva", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
            "Nueva orden"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                "data-ocid": "orders.filter.tabs",
                className: "flex flex-wrap items-center gap-1",
                children: FILTER_OPTIONS.map((option) => {
                  const isActive = statusFilter === option.value;
                  return /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setStatusFilter(option.value),
                      "data-ocid": `orders.filter.${option.value}`,
                      "aria-pressed": isActive,
                      className: isActive ? "rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth" : "rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted/50 hover:text-foreground",
                      children: option.label
                    },
                    option.value
                  );
                })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full lg:w-72", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Search,
                {
                  className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "search",
                  value: searchInput,
                  onChange: (event) => setSearchInput(event.target.value),
                  placeholder: "Buscar por orden, cliente, moto o placa…",
                  "aria-label": "Buscar órdenes por número, cliente, moto o placa",
                  "data-ocid": "orders.search_input",
                  className: "h-9 pl-9"
                }
              )
            ] })
          ] }),
          isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "orders.error_state",
              className: "flex flex-col items-center gap-3 px-6 py-14 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-5 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "No se pudieron cargar las órdenes" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => void refetch({ cancelRefetch: true }),
                    "data-ocid": "orders.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "orders.empty_state",
              className: "flex flex-col items-center gap-3 px-6 py-16 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ClipboardList,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasQuery ? "Sin resultados" : "Aún no hay órdenes" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasQuery ? "Ajusta el filtro de estado o la búsqueda para encontrar la orden." : "Registra el ingreso de una moto para comenzar a operar el taller." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    asChild: true,
                    size: "sm",
                    variant: "outline",
                    "data-ocid": "orders.empty_state.new_order_button",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/ordenes/nueva", children: "Nueva orden" })
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "orders.table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-muted/50 hover:bg-muted/50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-4 font-mono text-[11px] uppercase tracking-[0.14em]", children: "Orden" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.14em]", children: "Cliente" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.14em]", children: "Placa" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.14em]", children: "Estado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: "Fecha" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: items.map((view, index) => {
              const order = view.order;
              const isCancelled = order.status === OrderStatus.cancelled;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TableRow,
                {
                  "data-ocid": `orders.row.${index + 1}`,
                  className: "odd:bg-muted/20",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pl-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Link,
                      {
                        to: "/ordenes/$id",
                        params: { id: order.id.toString() },
                        "data-ocid": `orders.link.${index + 1}`,
                        className: "data-rail text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        children: order.orderNumber
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[16rem] truncate text-sm", children: (customerNames == null ? void 0 : customerNames.get(order.customerId.toString())) ?? `Cliente #${order.customerId.toString()}` }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-sm text-muted-foreground", children: (motorcyclePlates == null ? void 0 : motorcyclePlates.get(order.motorcycleId.toString())) ?? `Moto #${order.motorcycleId.toString()}` }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Badge,
                      {
                        variant: "outline",
                        className: ORDER_STATUS_BADGE[order.status],
                        children: ORDER_STATUS_LABELS[order.status]
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-sm font-semibold", children: formatMoney(view.totals.total) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-xs text-muted-foreground", children: formatDate(order.createdAt) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "icon",
                          onClick: () => openNotify(view),
                          "aria-label": `Notificar al cliente de la orden ${order.orderNumber}`,
                          "data-ocid": `orders.notify_button.${index + 1}`,
                          className: "text-muted-foreground hover:text-primary",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "size-4", "aria-hidden": "true" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        WhatsAppNotifyButton,
                        {
                          contactKind: WhatsAppContactKind.customer,
                          contactId: order.customerId,
                          context: WhatsAppContext.order,
                          referenceId: order.id,
                          contactName: (customerNames == null ? void 0 : customerNames.get(order.customerId.toString())) ?? `Cliente #${order.customerId.toString()}`,
                          size: "icon",
                          variant: "ghost",
                          ocid: `orders.whatsapp_button.${index + 1}`,
                          className: "text-muted-foreground hover:text-success"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "icon",
                          onClick: () => setCancelTarget({
                            id: order.id,
                            orderNumber: order.orderNumber
                          }),
                          disabled: isCancelled,
                          "aria-label": `Cancelar la orden ${order.orderNumber}`,
                          "data-ocid": `orders.cancel_button.${index + 1}`,
                          className: "text-muted-foreground hover:text-destructive",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "size-4", "aria-hidden": "true" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "icon",
                          onClick: () => setDeleteTarget({
                            id: order.id,
                            orderNumber: order.orderNumber
                          }),
                          "aria-label": `Eliminar la orden ${order.orderNumber}`,
                          "data-ocid": `orders.delete_button.${index + 1}`,
                          className: "text-muted-foreground hover:text-destructive",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                        }
                      )
                    ] }) })
                  ]
                },
                order.id.toString()
              );
            }) })
          ] }) }),
          !isError && !isLoading && items.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                "data-ocid": "orders.pagination.summary",
                className: "data-rail text-xs text-muted-foreground",
                children: [
                  formatNumber(rangeStart),
                  "–",
                  formatNumber(rangeEnd),
                  " de",
                  " ",
                  formatNumber(total)
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => setPage(Math.max(1, page - 1)),
                  disabled: page <= 1 || isFetching,
                  "data-ocid": "orders.pagination_prev",
                  className: "gap-1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4", "aria-hidden": "true" }),
                    "Anterior"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-xs text-muted-foreground", children: [
                formatNumber(page),
                " / ",
                formatNumber(totalPages)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => setPage(Math.min(totalPages, page + 1)),
                  disabled: page >= totalPages || isFetching,
                  "data-ocid": "orders.pagination_next",
                  className: "gap-1",
                  children: [
                    "Siguiente",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
                  ]
                }
              )
            ] })
          ] }) : null
        ] }),
        cancelTarget ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          CancelOrderDialog,
          {
            orderId: cancelTarget.id,
            orderNumber: cancelTarget.orderNumber,
            open: true,
            onOpenChange: (next) => {
              if (!next) setCancelTarget(null);
            }
          }
        ) : null,
        deleteTarget ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          DeleteOrderDialog,
          {
            orderId: deleteTarget.id,
            orderNumber: deleteTarget.orderNumber,
            open: true,
            onOpenChange: (next) => {
              if (!next) setDeleteTarget(null);
            }
          }
        ) : null,
        notifyTarget ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          NotifyCustomerDialog,
          {
            open: true,
            onOpenChange: (next) => {
              if (!next) setNotifyTarget(null);
            },
            customerId: notifyTarget.customerId,
            customerName: notifyTarget.customerName,
            customerEmail: notifyTarget.customerEmail,
            source: NotificationSource.order,
            referenceId: notifyTarget.orderId,
            defaultSubject: `Estado de tu orden ${notifyTarget.orderNumber}`,
            defaultMessage: `Hola ${notifyTarget.customerName}, te informamos el estado actual de tu orden ${notifyTarget.orderNumber}. Si necesitas más detalles sobre la reparación, respóndenos a este correo y con gusto te atendemos.`
          }
        ) : null
      ]
    }
  );
}
export {
  OrdersPage
};
