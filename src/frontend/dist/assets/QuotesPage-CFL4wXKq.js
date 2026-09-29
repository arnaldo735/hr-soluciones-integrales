import { r as useNavigate, s as useSearch, t as reactExports, j as jsxRuntimeExports, v as Search, w as Input, K as Label, aJ as QuoteStatus, Q as QuoteSort, B as Button, T as TriangleAlert, F as FileText, A as WhatsAppContext, D as WhatsAppContactKind, o as formatNumber, G as ChevronRight, N as NotificationSource, k as useBackend, l as useAuth, m as useQuery, av as ue, z as formatDate, y as formatMoney } from "./index-EqGEeyjs.js";
import { D as DataTable } from "./DataTable-BGUSfdBQ.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-DUFQVTg_.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { S as StatusBadge } from "./StatusBadge-DoLeoyAw.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { u as useQuotes, a as useDeleteQuote, b as useQuoteLookups, Q as QUOTE_STATUS_LABELS } from "./use-quotes-Bc2WK5dC.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { C as ChevronLeft } from "./chevron-left-C2006Y0h.js";
import "./alert-dialog-qVL9cwOA.js";
import "./table-Dz_wGPQA.js";
import "./trash-2-HQabmlQI.js";
import "./check-LdjEv5O-.js";
import "./pencil-BajrtuU3.js";
import "./textarea-B0CUuiY-.js";
import "./use-whatsapp-DIGqY6EY.js";
import "./pdf-BjjrMDP3.js";
import "./download-DPgaDAHv.js";
import "./warranty-BU5LnZHy.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
const PAGE_SIZE = 20;
const QUOTE_STATUS_TONE = {
  [QuoteStatus.draft]: "draft",
  [QuoteStatus.sent]: "sent",
  [QuoteStatus.accepted]: "accepted",
  [QuoteStatus.rejected]: "rejected",
  [QuoteStatus.expired]: "expired"
};
const STATUS_OPTIONS = [
  QuoteStatus.draft,
  QuoteStatus.sent,
  QuoteStatus.accepted,
  QuoteStatus.rejected,
  QuoteStatus.expired
];
const SORT_OPTIONS = [
  { value: QuoteSort.createdAt, label: "Más recientes" },
  { value: QuoteSort.number, label: "Número" },
  { value: QuoteSort.customer, label: "Cliente" },
  { value: QuoteSort.total, label: "Total" }
];
function useQuoteCustomerEmails(customerIds) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const key = customerIds.map((id) => id.toString()).sort().join(",");
  return useQuery({
    queryKey: ["quote-customer-emails", key],
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
function resolveSearch(raw) {
  const pagina = Number(raw.pagina);
  const estado = typeof raw.estado === "string" && STATUS_OPTIONS.includes(raw.estado) ? raw.estado : "";
  const orden = typeof raw.orden === "string" && SORT_OPTIONS.some((option) => option.value === raw.orden) ? raw.orden : QuoteSort.createdAt;
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    estado,
    orden,
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1
  };
}
function QuotesPage() {
  var _a, _b, _c, _d;
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const search = reactExports.useMemo(() => resolveSearch(rawSearch), [rawSearch]);
  const [term, setTerm] = reactExports.useState(search.q);
  const [notifyTarget, setNotifyTarget] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setTerm(search.q);
  }, [search.q]);
  const applySearch = reactExports.useCallback(
    (patch) => {
      void navigate({
        to: "/cotizaciones",
        search: (prev) => {
          const next = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === void 0 || value === false) {
              delete next[key];
            }
          }
          return next;
        },
        replace: true
      });
    },
    [navigate]
  );
  reactExports.useEffect(() => {
    if (term === search.q) return;
    const handle = window.setTimeout(() => {
      applySearch({ q: term, pagina: 1 });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [term, search.q, applySearch]);
  const status = search.estado || null;
  const sort = search.orden;
  const quotesQuery = useQuotes({
    status,
    search: search.q,
    sort,
    page: search.pagina,
    pageSize: PAGE_SIZE
  });
  const deleteQuote = useDeleteQuote();
  const items = ((_a = quotesQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = quotesQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search.q !== "" || search.estado !== "";
  const customerIds = reactExports.useMemo(
    () => items.map((view) => view.quote.customerId),
    [items]
  );
  const motorcycleIds = reactExports.useMemo(
    () => items.map((view) => view.quote.motorcycleId),
    [items]
  );
  const lookupsQuery = useQuoteLookups(customerIds, motorcycleIds);
  const customerNames = (_c = lookupsQuery.data) == null ? void 0 : _c.customers;
  const motorcyclePlates = (_d = lookupsQuery.data) == null ? void 0 : _d.motorcycles;
  const emailsQuery = useQuoteCustomerEmails(customerIds);
  const customerEmails = emailsQuery.data;
  const openNotify = (view) => {
    const quote = view.quote;
    setNotifyTarget({
      customerId: quote.customerId,
      customerName: (customerNames == null ? void 0 : customerNames.get(quote.customerId.toString())) ?? `Cliente #${quote.customerId.toString()}`,
      customerEmail: (customerEmails == null ? void 0 : customerEmails.get(quote.customerId.toString())) ?? null,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber
    });
  };
  const clearFilters = () => {
    setTerm("");
    void navigate({ to: "/cotizaciones", search: {}, replace: true });
  };
  const handleDelete = (view) => {
    deleteQuote.mutate(view.quote.id, {
      onSuccess: () => {
        ue.success(`Cotización ${view.quote.quoteNumber} eliminada`);
      },
      onError: () => {
        ue.error("No se pudo eliminar la cotización. Intenta de nuevo.");
      }
    });
  };
  const columns = [
    {
      key: "number",
      header: "Número",
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => void navigate({
            to: "/cotizaciones/$id",
            params: { id: view.quote.id.toString() }
          }),
          className: "data-rail text-sm font-medium text-primary underline-offset-4 hover:underline",
          children: view.quote.quoteNumber
        }
      )
    },
    {
      key: "customer",
      header: "Cliente",
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[220px] truncate font-medium", children: (customerNames == null ? void 0 : customerNames.get(view.quote.customerId.toString())) ?? `Cliente #${view.quote.customerId.toString()}` })
    },
    {
      key: "motorcycle",
      header: "Moto",
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: (motorcyclePlates == null ? void 0 : motorcyclePlates.get(view.quote.motorcycleId.toString())) ?? `#${view.quote.motorcycleId.toString()}` })
    },
    {
      key: "date",
      header: "Fecha",
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: formatDate(view.quote.createdAt) })
    },
    {
      key: "parts",
      header: "Repuestos",
      numeric: true,
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: formatMoney(view.totals.partsSubtotal) })
    },
    {
      key: "services",
      header: "Servicios",
      numeric: true,
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: formatMoney(view.totals.servicesSubtotal) })
    },
    {
      key: "total",
      header: "Total",
      numeric: true,
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold", children: formatMoney(view.totals.total) })
    },
    {
      key: "status",
      header: "Estado",
      render: (view) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatusBadge,
        {
          label: QUOTE_STATUS_LABELS[view.quote.status],
          tone: QUOTE_STATUS_TONE[view.quote.status]
        }
      )
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "quotes.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Ventas",
            title: "Cotizaciones",
            description: "Presupuestos de repuestos y servicios para tus clientes, con conversión a orden de taller o factura.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: () => void navigate({ to: "/cotizaciones/nueva" }),
                "data-ocid": "quotes.new_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Nueva cotización"
                ]
              }
            ),
            toolbar: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[220px] flex-1", children: [
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
                    value: term,
                    onChange: (event) => setTerm(event.target.value),
                    placeholder: "Buscar por número o cliente…",
                    "aria-label": "Buscar cotizaciones",
                    className: "pl-9",
                    "data-ocid": "quotes.search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "quotes-status",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Estado"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: search.estado === "" ? "all" : search.estado,
                    onValueChange: (value) => applySearch({
                      estado: value === "all" ? "" : value,
                      pagina: 1
                    }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "quotes-status",
                          "aria-label": "Filtrar por estado",
                          "data-ocid": "quotes.status_select",
                          className: "w-[170px]",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos los estados" }),
                        STATUS_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: QUOTE_STATUS_LABELS[option] }, option))
                      ] })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "quotes-sort",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Ordenar"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: sort,
                    onValueChange: (value) => applySearch({ orden: value, pagina: 1 }),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "quotes-sort",
                          "aria-label": "Ordenar cotizaciones",
                          "data-ocid": "quotes.sort_select",
                          className: "w-[170px]",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: SORT_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
                    ]
                  }
                )
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: clearFilters,
                  "data-ocid": "quotes.clear_filters_button",
                  className: "gap-2 text-muted-foreground",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                    "Limpiar"
                  ]
                }
              ) : null
            ] })
          }
        ),
        quotesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "quotes.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-6 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar las cotizaciones." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => void quotesQuery.refetch({ cancelRefetch: true }),
                  "data-ocid": "quotes.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : quotesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "quotes.loading_state",
            className: "space-y-2 rounded-lg border border-border bg-card p-4 shadow-subtle",
            children: Array.from({ length: 6 }, (_, index) => `row-${index}`).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id))
          }
        ) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "quotes.empty_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                FileText,
                {
                  className: "size-5 text-muted-foreground",
                  "aria-hidden": "true"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay cotizaciones" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta la búsqueda o el estado para encontrar cotizaciones." : "Crea la primera cotización seleccionando cliente, moto y las partidas de repuestos y servicios." })
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: clearFilters,
                  "data-ocid": "quotes.empty_clear_button",
                  children: "Limpiar filtros"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: () => void navigate({ to: "/cotizaciones/nueva" }),
                  "data-ocid": "quotes.empty_new_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                    "Nueva cotización"
                  ]
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DataTable,
          {
            ocid: "quotes",
            columns,
            rows: items,
            rowKey: (view) => view.quote.id.toString(),
            caption: quotesQuery.isLoading ? "Cargando…" : `${formatNumber(total)} cotización${total === 1 ? "" : "es"}`,
            onRowClick: (view) => void navigate({
              to: "/cotizaciones/$id",
              params: { id: view.quote.id.toString() }
            }),
            actions: [
              {
                kind: "edit",
                label: "Editar cotización",
                onClick: (view) => void navigate({
                  to: "/cotizaciones/$id",
                  params: { id: view.quote.id.toString() }
                })
              },
              {
                kind: "save",
                label: "Notificar al cliente",
                onClick: openNotify
              },
              {
                kind: "delete",
                label: "Eliminar cotización",
                onClick: handleDelete,
                disabled: () => deleteQuote.isPending
              }
            ],
            rowExtraActions: (view, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              WhatsAppNotifyButton,
              {
                contactKind: WhatsAppContactKind.customer,
                contactId: view.quote.customerId,
                context: WhatsAppContext.quote,
                referenceId: view.quote.id,
                contactName: (customerNames == null ? void 0 : customerNames.get(view.quote.customerId.toString())) ?? `Cliente #${view.quote.customerId.toString()}`,
                ocid: `quotes.whatsapp_button.${index + 1}`
              }
            )
          }
        ),
        !quotesQuery.isLoading && !quotesQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
            "Página ",
            search.pagina,
            " de ",
            totalPages
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                disabled: search.pagina <= 1,
                onClick: () => applySearch({ pagina: search.pagina - 1 }),
                "data-ocid": "quotes.pagination_prev",
                className: "gap-1",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4", "aria-hidden": "true" }),
                  "Anterior"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                disabled: search.pagina >= totalPages,
                onClick: () => applySearch({ pagina: search.pagina + 1 }),
                "data-ocid": "quotes.pagination_next",
                className: "gap-1",
                children: [
                  "Siguiente",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
                ]
              }
            )
          ] })
        ] }) : null,
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
            source: NotificationSource.quote,
            referenceId: notifyTarget.quoteId,
            defaultSubject: `Estado de tu cotización ${notifyTarget.quoteNumber}`,
            defaultMessage: `Hola ${notifyTarget.customerName}, te compartimos el estado actual de tu cotización ${notifyTarget.quoteNumber}. Si deseas aprobarla o tienes alguna duda sobre las partidas, respóndenos a este correo y con gusto te ayudamos.`
          }
        ) : null
      ]
    }
  );
}
export {
  QuotesPage,
  QuotesPage as default
};
