import { K as createLucideIcon, s as reactExports, j as jsxRuntimeExports, t as Search, v as Input, aM as PurchaseInvoiceStatus, I as InvoiceSort, B as Button, n as formatNumber, T as TriangleAlert, F as FileText, L as Link, y as formatDate, ae as cn, D as ChevronRight, k as useBackend, l as useQuery, aw as CircleCheck, w as Badge, aN as LineApplyStatus, aO as LineMatchStatus, x as formatMoney, ah as LoaderCircle, X, af as ExternalBlob, aP as loadConfig, aQ as HttpAgent, aR as StorageClient, aS as CloudUpload, aT as InvoiceFileKind, ar as ue, aI as colombiaStartOfDay, aU as colombiaDateInput, aV as ExtractionStatus } from "./index-CzQEXdHP.js";
import { P as PageHeader } from "./PageHeader-JDKYCqW_.js";
import { u as usePurchaseInvoices, I as InvoiceStatusBadge, a as useCreatePurchaseInvoiceDraft, b as useRunPurchaseInvoiceExtraction, c as useUpdatePurchaseInvoiceReview, d as useConfirmPurchaseInvoice, e as useCreateSupplier } from "./use-purchase-invoices-Ny1gl9qq.js";
import { L as Label, P as Primitive } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { R as RotateCcw } from "./rotate-ccw-B7Gc93ig.js";
import { C as ChevronLeft } from "./chevron-left-CY0scwou.js";
import { T as Trash2 } from "./trash-2-M_celBpV.js";
import { P as Plus } from "./plus-BM-BDOEL.js";
import "./StatusBadge-jkc1GroD.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }]
];
const History = createLucideIcon("history", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
];
const Image$1 = createLucideIcon("image", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 16v-4", key: "1dtifu" }],
  ["path", { d: "M12 8h.01", key: "e9boi3" }]
];
const Info = createLucideIcon("info", __iconNode);
const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  PurchaseInvoiceStatus.pending,
  PurchaseInvoiceStatus.confirmed,
  PurchaseInvoiceStatus.withErrors
];
const STATUS_LABELS$1 = {
  [PurchaseInvoiceStatus.pending]: "Pendiente",
  [PurchaseInvoiceStatus.confirmed]: "Confirmada",
  [PurchaseInvoiceStatus.withErrors]: "Con errores"
};
const SORT_OPTIONS = [
  { value: InvoiceSort.createdAt, label: "Más recientes" },
  { value: InvoiceSort.invoiceDate, label: "Fecha de factura" },
  { value: InvoiceSort.invoiceNumber, label: "Número de factura" }
];
const ALL = "all";
function useSupplierDirectory() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["suppliers", "purchase-invoice-filter"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSuppliers(null);
    },
    enabled: !!actor && !isFetching,
    staleTime: 6e4
  });
}
function PurchaseInvoiceList({
  page,
  onPageChange,
  status,
  onStatusChange,
  supplierId,
  onSupplierChange,
  search,
  onSearchChange,
  sort,
  onSortChange
}) {
  var _a, _b;
  const [term, setTerm] = reactExports.useState(search);
  const suppliersQuery = useSupplierDirectory();
  const suppliers = suppliersQuery.data ?? [];
  reactExports.useEffect(() => {
    setTerm(search);
  }, [search]);
  reactExports.useEffect(() => {
    if (term === search) return;
    const handle = window.setTimeout(() => onSearchChange(term), 300);
    return () => window.clearTimeout(handle);
  }, [term, search, onSearchChange]);
  const offset = (page - 1) * PAGE_SIZE;
  const invoicesQuery = usePurchaseInvoices({
    status,
    supplierId,
    search,
    sort,
    offset,
    limit: PAGE_SIZE
  });
  const items = ((_a = invoicesQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = invoicesQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== null || supplierId !== null || search !== "";
  const supplierNames = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const supplier of suppliers) {
      map.set(supplier.id.toString(), supplier.name);
    }
    return map;
  }, [suppliers]);
  const clearFilters = () => {
    setTerm("");
    onStatusChange(null);
    onSupplierChange(null);
    onSearchChange("");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "section",
      {
        "data-ocid": "purchase_invoices.filters",
        className: "rounded-lg border border-border bg-card p-3 shadow-subtle",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
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
                placeholder: "Buscar por proveedor, número o archivo…",
                "aria-label": "Buscar facturas de compra",
                className: "pl-9",
                "data-ocid": "purchase_invoices.search_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "purchase-invoices-status",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Estado"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: status ?? ALL,
                onValueChange: (value) => onStatusChange(
                  value === ALL ? null : value
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "purchase-invoices-status",
                      "aria-label": "Filtrar por estado",
                      className: "w-[170px]",
                      "data-ocid": "purchase_invoices.status_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ALL, children: "Todos los estados" }),
                    STATUS_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: STATUS_LABELS$1[option] }, option))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "purchase-invoices-supplier",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Proveedor"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: (supplierId == null ? void 0 : supplierId.toString()) ?? ALL,
                onValueChange: (value) => onSupplierChange(value === ALL ? null : BigInt(value)),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "purchase-invoices-supplier",
                      "aria-label": "Filtrar por proveedor",
                      className: "w-[220px]",
                      "data-ocid": "purchase_invoices.supplier_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ALL, children: "Todos los proveedores" }),
                    suppliers.map((supplier) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectItem,
                      {
                        value: supplier.id.toString(),
                        children: supplier.name
                      },
                      supplier.id.toString()
                    ))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "purchase-invoices-sort",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Ordenar por"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: sort,
                onValueChange: (value) => onSortChange(value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "purchase-invoices-sort",
                      "aria-label": "Ordenar facturas",
                      className: "w-[190px]",
                      "data-ocid": "purchase_invoices.sort_select",
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
              "data-ocid": "purchase_invoices.clear_filters_button",
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: invoicesQuery.isLoading ? "Cargando…" : `${formatNumber(total)} factura${total === 1 ? "" : "s"} procesada${total === 1 ? "" : "s"}` }) }),
      invoicesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "purchase_invoices.error_state",
          className: "flex flex-col items-center gap-3 px-6 py-14 text-center",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "size-6 text-destructive",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar las facturas de compra." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => void invoicesQuery.refetch(),
                "data-ocid": "purchase_invoices.retry_button",
                children: "Reintentar"
              }
            )
          ]
        }
      ) : invoicesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          "data-ocid": "purchase_invoices.loading_state",
          className: "space-y-2 p-4",
          children: Array.from({ length: 6 }, (_, index) => `row-${index}`).map(
            (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id)
          )
        }
      ) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "purchase_invoices.empty_state",
          className: "flex flex-col items-center gap-3 px-6 py-16 text-center",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              FileText,
              {
                className: "size-5 text-muted-foreground",
                "aria-hidden": "true"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay facturas de compra procesadas" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta el estado, el proveedor o la búsqueda para encontrar facturas." : "Carga una factura en PDF o foto desde Compras para actualizar el inventario." })
            ] }),
            hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: clearFilters,
                "data-ocid": "purchase_invoices.empty_clear_button",
                children: "Limpiar filtros"
              }
            ) : null
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Número" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Proveedor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fecha" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Ítems" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Estado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: items.map((invoice, index) => {
          var _a2, _b2;
          const supplierLabel = ((_a2 = invoice.supplierName) == null ? void 0 : _a2.trim()) || (invoice.supplierId !== void 0 ? supplierNames.get(invoice.supplierId.toString()) : void 0) || "Proveedor sin identificar";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TableRow,
            {
              "data-ocid": `purchase_invoices.row.${index + 1}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Link,
                  {
                    to: "/facturas-compra/$id",
                    params: { id: invoice.id.toString() },
                    "data-ocid": `purchase_invoices.link.${index + 1}`,
                    className: "data-rail text-sm font-medium text-primary underline-offset-4 hover:underline",
                    children: ((_b2 = invoice.invoiceNumber) == null ? void 0 : _b2.trim()) || `#${invoice.id.toString()}`
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[260px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: supplierLabel }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: formatDate(invoice.invoiceDate ?? invoice.createdAt) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatNumber(invoice.lines.length) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(InvoiceStatusBadge, { status: invoice.status }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    asChild: true,
                    className: cn("gap-1 text-muted-foreground"),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Link,
                      {
                        to: "/facturas-compra/$id",
                        params: { id: invoice.id.toString() },
                        "data-ocid": `purchase_invoices.detail_button.${index + 1}`,
                        children: "Ver detalle"
                      }
                    )
                  }
                ) })
              ]
            },
            invoice.id.toString()
          );
        }) })
      ] }),
      !invoicesQuery.isLoading && !invoicesQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-border px-4 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
          "Página ",
          page,
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
              disabled: page <= 1,
              onClick: () => onPageChange(page - 1),
              "data-ocid": "purchase_invoices.pagination_prev",
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
              disabled: page >= totalPages,
              onClick: () => onPageChange(page + 1),
              "data-ocid": "purchase_invoices.pagination_next",
              className: "gap-1",
              children: [
                "Siguiente",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
              ]
            }
          )
        ] })
      ] }) : null
    ] })
  ] });
}
const LINE_STATUS_LABELS = {
  [LineApplyStatus.created]: "Creado",
  [LineApplyStatus.updated]: "Actualizado",
  [LineApplyStatus.error]: "Error",
  [LineApplyStatus.pending]: "Pendiente"
};
const LINE_STATUS_STYLES = {
  [LineApplyStatus.created]: "border-success/50 bg-success/15 text-success",
  [LineApplyStatus.updated]: "border-primary/40 bg-primary/10 text-primary",
  [LineApplyStatus.error]: "border-destructive/50 bg-destructive/10 text-destructive",
  [LineApplyStatus.pending]: "border-border bg-muted text-muted-foreground"
};
function InvoiceResultSummary({
  result,
  wasAlreadyConfirmed,
  onDismiss
}) {
  const hasErrors = result.failed > 0n;
  const isConfirmed = result.status === PurchaseInvoiceStatus.confirmed;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "purchase_invoices.result_summary",
      className: "space-y-4 rounded-lg border border-border bg-card p-4 shadow-subtle",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-md border",
                  hasErrors ? "border-warning/50 bg-warning/10 text-warning" : "border-success/50 bg-success/15 text-success"
                ),
                children: hasErrors ? /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-5", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-5", "aria-hidden": "true" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold tracking-tight", children: hasErrors ? "Factura confirmada con errores" : "Factura confirmada" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: isConfirmed ? "El inventario se actualizó con las líneas aplicadas." : "Algunas líneas no se pudieron aplicar. Corrige los errores y vuelve a confirmar." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Badge,
              {
                variant: "outline",
                className: "border-success/50 bg-success/15 font-mono text-[10px] uppercase tracking-wider text-success",
                children: [
                  formatNumber(result.created),
                  " creado",
                  result.created === 1n ? "" : "s"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Badge,
              {
                variant: "outline",
                className: "border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-wider text-primary",
                children: [
                  formatNumber(result.updated),
                  " actualizado",
                  result.updated === 1n ? "" : "s"
                ]
              }
            ),
            hasErrors ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Badge,
              {
                variant: "outline",
                className: "border-destructive/50 bg-destructive/10 font-mono text-[10px] uppercase tracking-wider text-destructive",
                children: [
                  formatNumber(result.failed),
                  " con error"
                ]
              }
            ) : null
          ] })
        ] }),
        wasAlreadyConfirmed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": "purchase_invoices.result_idempotent_notice",
            className: "flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "mt-0.5 size-3.5 shrink-0", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Esta factura ya había sido confirmada. No se volvió a registrar stock: el inventario no se duplicó." })
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[70px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Línea" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[140px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Código" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Resultado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Motivo" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: result.lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TableRow,
            {
              "data-ocid": `purchase_invoices.result_row.${index + 1}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-muted-foreground", children: formatNumber(line.lineNumber) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail font-medium", children: line.code.trim() === "" ? "—" : line.code }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: cn(
                      "font-mono text-[10px] uppercase tracking-wider",
                      LINE_STATUS_STYLES[line.status]
                    ),
                    children: LINE_STATUS_LABELS[line.status]
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: line.error ?? "—" })
              ]
            },
            line.lineId.toString()
          )) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: onDismiss,
            "data-ocid": "purchase_invoices.result_dismiss_button",
            children: "Cargar otra factura"
          }
        ) })
      ]
    }
  );
}
const NEW_SUPPLIER_VALUE = "__new__";
function parsePesosToCents(value) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (normalized === "" || normalized === ".") return null;
  const [wholePart = "", fractionPart = ""] = normalized.split(".");
  const whole = wholePart === "" ? 0n : BigInt(wholePart);
  const fraction = `${fractionPart}00`.slice(0, 2);
  return whole * 100n + BigInt(fraction);
}
function parseQuantityInput(value) {
  const cleaned = value.replace(/[^\d]/g, "");
  if (cleaned === "") return null;
  return BigInt(cleaned);
}
function parsePercentInput(value) {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (normalized === "" || normalized === ".") return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed));
}
function computeLineTotalCents(quantity, unitCost, taxRate, discountRate) {
  const gross = quantity * unitCost;
  const afterDiscount = gross * (100n - discountRate) / 100n;
  return afterDiscount * (100n + taxRate) / 100n;
}
function centsToPesosInput(cents) {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}
function MatchBadge({ status }) {
  const isExisting = status === LineMatchStatus.existing;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Badge,
    {
      variant: "outline",
      className: cn(
        "font-mono text-[10px] uppercase tracking-wider",
        isExisting ? "border-primary/40 bg-primary/10 text-primary" : "border-success/50 bg-success/15 text-success"
      ),
      children: isExisting ? "Actualiza" : "Nuevo"
    }
  );
}
function InvoiceReviewPanel({
  header,
  onHeaderChange,
  lines,
  onLineChange,
  onAddLine,
  onRemoveLine,
  suppliers,
  suppliersLoading,
  isSaving,
  isConfirming,
  validationError,
  onSave,
  onConfirm,
  confirmed,
  extractionNotice = null
}) {
  var _a;
  const isNewSupplier = header.supplierId === null;
  const busy = isSaving || isConfirming;
  const totalCents = lines.reduce((sum, line) => {
    const quantity = parseQuantityInput(line.quantity) ?? 0n;
    const unitCost = parsePesosToCents(line.unitCost) ?? 0n;
    const taxRate = parsePercentInput(line.taxRate) ?? 0n;
    const discountRate = parsePercentInput(line.discountRate) ?? 0n;
    const explicitTotal = parsePesosToCents(line.total);
    return sum + (explicitTotal ?? computeLineTotalCents(quantity, unitCost, taxRate, discountRate));
  }, 0n);
  const newCount = lines.filter(
    (line) => line.matchStatus === LineMatchStatus.new
  ).length;
  const existingCount = lines.length - newCount;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "purchase_invoices.review_panel",
      className: "space-y-4 rounded-lg border border-border bg-card p-4 shadow-subtle",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Revisión de la factura" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold tracking-tight", children: "Verifica los datos extraídos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-xs text-muted-foreground", children: "Corrige el NIT, la forma y el medio de pago, y en cada línea el código, la descripción, la cantidad, el costo, el IVA, el descuento y el valor total. Puedes añadir ítems faltantes o eliminar los incorrectos antes de confirmar." })
          ] }),
          confirmed ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              className: "border-success/50 bg-success/15 font-mono text-[10px] uppercase tracking-wider text-success",
              children: "Confirmada"
            }
          ) : null
        ] }),
        extractionNotice ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": "purchase_invoices.extraction_notice",
            className: "flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "mt-0.5 size-4 shrink-0",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: extractionNotice })
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pi-supplier", children: "Proveedor" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: ((_a = header.supplierId) == null ? void 0 : _a.toString()) ?? NEW_SUPPLIER_VALUE,
                onValueChange: (value) => {
                  if (value === NEW_SUPPLIER_VALUE) {
                    onHeaderChange({ supplierId: null });
                    return;
                  }
                  const supplier = suppliers.find(
                    (entry) => entry.id.toString() === value
                  );
                  onHeaderChange({
                    supplierId: BigInt(value),
                    supplierName: (supplier == null ? void 0 : supplier.name) ?? header.supplierName
                  });
                },
                disabled: confirmed || suppliersLoading,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "pi-supplier",
                      "aria-label": "Proveedor de la factura",
                      "data-ocid": "purchase_invoices.supplier_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona un proveedor" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: NEW_SUPPLIER_VALUE, children: "+ Crear proveedor nuevo" }),
                    suppliers.map((supplier) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectItem,
                      {
                        value: supplier.id.toString(),
                        children: supplier.name
                      },
                      supplier.id.toString()
                    ))
                  ] })
                ]
              }
            )
          ] }),
          isNewSupplier ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pi-supplier-name", children: "Nombre del proveedor nuevo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pi-supplier-name",
                value: header.supplierName,
                onChange: (event) => onHeaderChange({ supplierName: event.target.value }),
                placeholder: "Ej. Repuestos El Motor",
                disabled: confirmed,
                "aria-label": "Nombre del proveedor nuevo",
                "data-ocid": "purchase_invoices.supplier_name_input"
              }
            )
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pi-supplier-tax-id", children: "NIT del proveedor" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pi-supplier-tax-id",
                value: header.supplierTaxId,
                onChange: (event) => onHeaderChange({ supplierTaxId: event.target.value }),
                placeholder: "Ej. 900123456-7",
                disabled: confirmed,
                "aria-label": "NIT del proveedor",
                "data-ocid": "purchase_invoices.supplier_tax_id_input",
                className: "data-rail"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pi-invoice-number", children: "Número de factura" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pi-invoice-number",
                value: header.invoiceNumber,
                onChange: (event) => onHeaderChange({ invoiceNumber: event.target.value }),
                placeholder: "Ej. FE-10245",
                disabled: confirmed,
                "aria-label": "Número de factura",
                "data-ocid": "purchase_invoices.invoice_number_input",
                className: "data-rail"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pi-invoice-date", children: "Fecha de la factura" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pi-invoice-date",
                type: "date",
                value: header.invoiceDate,
                onChange: (event) => onHeaderChange({ invoiceDate: event.target.value }),
                disabled: confirmed,
                "aria-label": "Fecha de la factura",
                "data-ocid": "purchase_invoices.invoice_date_input",
                className: "data-rail"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pi-payment-method", children: "Forma de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pi-payment-method",
                value: header.paymentMethod,
                onChange: (event) => onHeaderChange({ paymentMethod: event.target.value }),
                placeholder: "Ej. Crédito",
                disabled: confirmed,
                "aria-label": "Forma de pago",
                "data-ocid": "purchase_invoices.payment_method_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pi-payment-means", children: "Medio de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pi-payment-means",
                value: header.paymentMeans,
                onChange: (event) => onHeaderChange({ paymentMeans: event.target.value }),
                placeholder: "Ej. Transferencia",
                disabled: confirmed,
                "aria-label": "Medio de pago",
                "data-ocid": "purchase_invoices.payment_means_input"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[130px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Código" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Descripción" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[110px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Cantidad" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[150px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Costo unitario" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[96px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "IVA %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[110px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Descuento %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[150px] text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Valor total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[110px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Coincidencia" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-[56px] pr-3 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { className: "hover:bg-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            TableCell,
            {
              colSpan: 9,
              "data-ocid": "purchase_invoices.lines_empty_state",
              className: "px-4 py-10 text-center text-sm text-muted-foreground",
              children: "No hay líneas en esta factura. Añade los ítems manualmente."
            }
          ) }) : lines.map((line, index) => {
            const quantity = parseQuantityInput(line.quantity) ?? 0n;
            const unitCost = parsePesosToCents(line.unitCost) ?? 0n;
            const taxRate = parsePercentInput(line.taxRate) ?? 0n;
            const discountRate = parsePercentInput(line.discountRate) ?? 0n;
            const derivedTotal = computeLineTotalCents(
              quantity,
              unitCost,
              taxRate,
              discountRate
            );
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TableRow,
              {
                "data-ocid": `purchase_invoices.line_row.${index + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: line.code,
                      onChange: (event) => onLineChange(line.key, { code: event.target.value }),
                      disabled: confirmed,
                      "aria-label": `Código de la línea ${index + 1}`,
                      "data-ocid": `purchase_invoices.line_code_input.${index + 1}`,
                      className: "data-rail h-8"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: line.description,
                      onChange: (event) => onLineChange(line.key, {
                        description: event.target.value
                      }),
                      disabled: confirmed,
                      "aria-label": `Descripción de la línea ${index + 1}`,
                      "data-ocid": `purchase_invoices.line_description_input.${index + 1}`,
                      className: "h-8"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      inputMode: "numeric",
                      value: line.quantity,
                      onChange: (event) => onLineChange(line.key, {
                        quantity: event.target.value
                      }),
                      disabled: confirmed,
                      "aria-label": `Cantidad de la línea ${index + 1}`,
                      "data-ocid": `purchase_invoices.line_quantity_input.${index + 1}`,
                      className: "data-rail h-8 text-right"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      inputMode: "decimal",
                      value: line.unitCost,
                      onChange: (event) => onLineChange(line.key, {
                        unitCost: event.target.value
                      }),
                      disabled: confirmed,
                      "aria-label": `Costo unitario de la línea ${index + 1}`,
                      "data-ocid": `purchase_invoices.line_cost_input.${index + 1}`,
                      className: "data-rail h-8 text-right"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      inputMode: "numeric",
                      value: line.taxRate,
                      onChange: (event) => onLineChange(line.key, {
                        taxRate: event.target.value
                      }),
                      disabled: confirmed,
                      "aria-label": `IVA de la línea ${index + 1}`,
                      "data-ocid": `purchase_invoices.line_tax_rate_input.${index + 1}`,
                      className: "data-rail h-8 text-right"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      inputMode: "numeric",
                      value: line.discountRate,
                      onChange: (event) => onLineChange(line.key, {
                        discountRate: event.target.value
                      }),
                      disabled: confirmed,
                      "aria-label": `Descuento de la línea ${index + 1}`,
                      "data-ocid": `purchase_invoices.line_discount_input.${index + 1}`,
                      className: "data-rail h-8 text-right"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "align-top", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        inputMode: "decimal",
                        value: line.total,
                        onChange: (event) => onLineChange(line.key, { total: event.target.value }),
                        disabled: confirmed,
                        "aria-label": `Valor total de la línea ${index + 1}`,
                        "data-ocid": `purchase_invoices.line_total_input.${index + 1}`,
                        className: "data-rail h-8 text-right"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-1 block text-right text-[10px] text-muted-foreground", children: [
                      "Calculado ",
                      formatMoney(derivedTotal)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top pt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MatchBadge, { status: line.matchStatus }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "align-top pr-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      size: "icon",
                      variant: "ghost",
                      onClick: () => onRemoveLine(line.key),
                      disabled: confirmed,
                      "aria-label": `Eliminar la línea ${index + 1}`,
                      "data-ocid": `purchase_invoices.line_delete_button.${index + 1}`,
                      className: "size-8 text-muted-foreground hover:text-destructive",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                    }
                  ) })
                ]
              },
              line.key
            );
          }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: onAddLine,
              disabled: confirmed,
              "data-ocid": "purchase_invoices.add_line_button",
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                "Añadir línea"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium text-foreground", children: formatNumber(existingCount) }),
              " ",
              "actualiza",
              existingCount === 1 ? "" : "n"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium text-foreground", children: formatNumber(newCount) }),
              " ",
              "nuevo",
              newCount === 1 ? "" : "s"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm", children: [
              "Total",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "data-rail text-foreground", children: formatMoney(totalCents) })
            ] })
          ] })
        ] }),
        validationError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "purchase_invoices.review_validation_error",
            className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
            children: validationError
          }
        ) : null,
        !confirmed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: onSave,
              disabled: busy,
              "data-ocid": "purchase_invoices.save_review_button",
              children: isSaving ? "Guardando…" : "Guardar revisión"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              onClick: onConfirm,
              disabled: busy,
              "data-ocid": "purchase_invoices.confirm_button",
              className: "gap-2",
              children: isConfirming ? "Confirmando…" : "Confirmar y actualizar inventario"
            }
          )
        ] }) : null
      ]
    }
  );
}
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext3(rootComponentName, defaultContext) {
    const BaseContext = reactExports.createContext(defaultContext);
    BaseContext.displayName = rootComponentName + "Context";
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      var _a;
      const { scope, children, ...context } = props;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const value = reactExports.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext2(consumerName, scope) {
      var _a;
      const Context = ((_a = scope == null ? void 0 : scope[scopeName]) == null ? void 0 : _a[index]) || BaseContext;
      const context = reactExports.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext2];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return reactExports.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = (scope == null ? void 0 : scope[scopeName]) || scopeContexts;
      return reactExports.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
}
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return reactExports.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}
var PROGRESS_NAME = "Progress";
var DEFAULT_MAX = 100;
var [createProgressContext] = createContextScope(PROGRESS_NAME);
var [ProgressProvider, useProgressContext] = createProgressContext(PROGRESS_NAME);
var Progress$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeProgress,
      value: valueProp = null,
      max: maxProp,
      getValueLabel = defaultGetValueLabel,
      ...progressProps
    } = props;
    if ((maxProp || maxProp === 0) && !isValidMaxNumber(maxProp)) {
      console.error(getInvalidMaxError(`${maxProp}`, "Progress"));
    }
    const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
    if (valueProp !== null && !isValidValueNumber(valueProp, max)) {
      console.error(getInvalidValueError(`${valueProp}`, "Progress"));
    }
    const value = isValidValueNumber(valueProp, max) ? valueProp : null;
    const valueLabel = isNumber(value) ? getValueLabel(value, max) : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressProvider, { scope: __scopeProgress, value, max, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "aria-valuemax": max,
        "aria-valuemin": 0,
        "aria-valuenow": isNumber(value) ? value : void 0,
        "aria-valuetext": valueLabel,
        role: "progressbar",
        "data-state": getProgressState(value, max),
        "data-value": value ?? void 0,
        "data-max": max,
        ...progressProps,
        ref: forwardedRef
      }
    ) });
  }
);
Progress$1.displayName = PROGRESS_NAME;
var INDICATOR_NAME = "ProgressIndicator";
var ProgressIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeProgress, ...indicatorProps } = props;
    const context = useProgressContext(INDICATOR_NAME, __scopeProgress);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": getProgressState(context.value, context.max),
        "data-value": context.value ?? void 0,
        "data-max": context.max,
        ...indicatorProps,
        ref: forwardedRef
      }
    );
  }
);
ProgressIndicator.displayName = INDICATOR_NAME;
function defaultGetValueLabel(value, max) {
  return `${Math.round(value / max * 100)}%`;
}
function getProgressState(value, maxValue) {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}
function isNumber(value) {
  return typeof value === "number";
}
function isValidMaxNumber(max) {
  return isNumber(max) && !isNaN(max) && max > 0;
}
function isValidValueNumber(value, max) {
  return isNumber(value) && !isNaN(value) && value <= max && value >= 0;
}
function getInvalidMaxError(propValue, componentName) {
  return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`;
}
function getInvalidValueError(propValue, componentName) {
  return `Invalid prop \`value\` of value \`${propValue}\` supplied to \`${componentName}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
var Root = Progress$1;
var Indicator = ProgressIndicator;
function Progress({
  className,
  value,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Root,
    {
      "data-slot": "progress",
      className: cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Indicator,
        {
          "data-slot": "progress-indicator",
          className: "bg-primary h-full w-full flex-1 transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  );
}
const STATUS_LABELS = {
  uploading: "Subiendo",
  extracting: "Analizando",
  ready: "Lista para revisar",
  failed: "Error"
};
const STATUS_STYLES = {
  uploading: "border-border bg-muted text-muted-foreground",
  extracting: "border-primary/40 bg-primary/10 text-primary",
  ready: "border-success/50 bg-success/15 text-success",
  failed: "border-destructive/50 bg-destructive/10 text-destructive"
};
const MANUAL_REVIEW_LABEL = "Revisar manualmente";
function InvoiceUploadList({
  items,
  onRetry,
  onRemove,
  onReview,
  activeKey
}) {
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "purchase_invoices.upload_list",
      className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "Archivos de esta sesión" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-xs text-muted-foreground", children: items.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: items.map((item, index) => {
          const isActive = activeKey === item.key;
          const isReviewable = item.status === "ready" || item.status === "failed" && item.extractionFailed === true;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              "data-ocid": `purchase_invoices.upload_item.${index + 1}`,
              className: cn(
                "flex flex-wrap items-center gap-3 px-4 py-3 transition-smooth",
                isActive && "bg-primary/5"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground", children: item.isPdf ? /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image$1, { className: "size-4", "aria-hidden": "true" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-1.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "min-w-0 truncate text-sm font-medium", children: item.fileName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Badge,
                      {
                        variant: "outline",
                        className: cn(
                          "shrink-0 font-mono text-[10px] uppercase tracking-wider",
                          STATUS_STYLES[item.status]
                        ),
                        children: [
                          item.status === "uploading" || item.status === "extracting" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                            LoaderCircle,
                            {
                              className: "mr-1 size-3 animate-spin",
                              "aria-hidden": "true"
                            }
                          ) : null,
                          item.status === "failed" && item.extractionFailed ? MANUAL_REVIEW_LABEL : STATUS_LABELS[item.status]
                        ]
                      }
                    )
                  ] }),
                  item.status === "uploading" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Progress,
                    {
                      value: item.progress,
                      "aria-label": `Progreso de subida de ${item.fileName}`,
                      "data-ocid": `purchase_invoices.upload_progress.${index + 1}`,
                      className: "h-1.5"
                    }
                  ) : null,
                  item.status === "failed" && item.error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "p",
                    {
                      "data-ocid": `purchase_invoices.upload_error.${index + 1}`,
                      className: "flex items-start gap-1.5 text-xs text-destructive",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          TriangleAlert,
                          {
                            className: "mt-0.5 size-3.5 shrink-0",
                            "aria-hidden": "true"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.error })
                      ]
                    }
                  ) : null
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
                  isReviewable ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      size: "sm",
                      variant: isActive ? "default" : "outline",
                      onClick: () => onReview(item.key),
                      "data-ocid": `purchase_invoices.review_button.${index + 1}`,
                      className: "gap-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3.5", "aria-hidden": "true" }),
                        "Revisar"
                      ]
                    }
                  ) : null,
                  item.status === "failed" && !item.extractionFailed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      size: "sm",
                      variant: "outline",
                      onClick: () => onRetry(item.key),
                      "data-ocid": `purchase_invoices.retry_button.${index + 1}`,
                      className: "gap-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-3.5", "aria-hidden": "true" }),
                        "Reintentar"
                      ]
                    }
                  ) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      size: "icon",
                      variant: "ghost",
                      onClick: () => onRemove(item.key),
                      "aria-label": `Quitar ${item.fileName} de la lista`,
                      "data-ocid": `purchase_invoices.remove_button.${index + 1}`,
                      className: "size-8 text-muted-foreground hover:text-destructive",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
                    }
                  )
                ] })
              ]
            },
            item.key
          );
        }) })
      ]
    }
  );
}
const DEDUP_SENTINEL = "!caf!";
let handlePromise = null;
async function getStorageHandle() {
  if (!handlePromise) {
    handlePromise = (async () => {
      var _a;
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if ((_a = config.backend_host) == null ? void 0 : _a.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {
        });
      }
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent
      );
      return {
        client,
        agent,
        gatewayUrl: config.storage_gateway_url,
        projectId: config.project_id
      };
    })().catch((error) => {
      handlePromise = null;
      throw error;
    });
  }
  return handlePromise;
}
async function uploadInvoiceFile(file, onProgress) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
  const { client, gatewayUrl, projectId } = await getStorageHandle();
  const { hash } = await client.putFile(
    await blob.getBytes(),
    onProgress,
    blob.contentType,
    blob.filename
  );
  return {
    objectId: `${DEDUP_SENTINEL}${hash}`,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: BigInt(file.size),
    gatewayUrl,
    projectId
  };
}
const MAX_INVOICE_BYTES = 1e6;
const MAX_INVOICE_SIZE_LABEL = "1 MB";
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
];
const INVOICE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const ACCEPTED_FORMATS_LABEL = "PDF, JPG, PNG o WEBP";
function isAcceptedInvoiceFile(file) {
  return ACCEPTED_MIME_TYPES.includes(file.type);
}
function validateInvoiceFile(file) {
  if (!isAcceptedInvoiceFile(file)) {
    return `"${file.name}" no es un formato válido. Sube un archivo ${ACCEPTED_FORMATS_LABEL}.`;
  }
  if (file.size > MAX_INVOICE_BYTES) {
    return `"${file.name}" supera el tamaño máximo de ${MAX_INVOICE_SIZE_LABEL}.`;
  }
  if (file.size === 0) {
    return `"${file.name}" está vacío. Verifica el archivo e inténtalo de nuevo.`;
  }
  return null;
}
const MAX_IMAGE_EDGE = 2e3;
const IMAGE_JPEG_QUALITY = 0.82;
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}
function encodeImage(image, width, height, mimeType) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, IMAGE_JPEG_QUALITY);
  });
}
async function downscaleInvoiceImage(file) {
  if (file.size <= MAX_INVOICE_BYTES) return file;
  if (file.type === "application/pdf") return file;
  try {
    const image = await loadImage(file);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longestEdge > MAX_IMAGE_EDGE ? MAX_IMAGE_EDGE / longestEdge : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const blob = await encodeImage(image, width, height, "image/jpeg");
    if (!blob || blob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
async function prepareInvoiceFile(file) {
  const problem = validateInvoiceFile(file);
  if (problem === null) return { file };
  if (isAcceptedInvoiceFile(file) && file.type !== "application/pdf") {
    const downscaled = await downscaleInvoiceImage(file);
    const remaining = validateInvoiceFile(downscaled);
    if (remaining === null) return { file: downscaled };
    return { error: remaining };
  }
  return { error: problem };
}
function UploadZone({ onFiles, disabled = false }) {
  const inputRef = reactExports.useRef(null);
  const [isDragging, setIsDragging] = reactExports.useState(false);
  const openPicker = reactExports.useCallback(() => {
    var _a;
    if (disabled) return;
    (_a = inputRef.current) == null ? void 0 : _a.click();
  }, [disabled]);
  const handleDrop = reactExports.useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [disabled, onFiles]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoices.dropzone",
      onDragOver: (event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      },
      onDragLeave: (event) => {
        event.preventDefault();
        setIsDragging(false);
      },
      onDrop: handleDrop,
      className: cn(
        "surface-grid relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-smooth",
        isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:border-primary/50",
        disabled && "pointer-events-none opacity-60"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: cn(
              "flex size-12 items-center justify-center rounded-md border transition-smooth",
              isDragging ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
            ),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "size-6", "aria-hidden": "true" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Arrastra las facturas aquí" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "o selecciona los archivos desde tu equipo · ",
            ACCEPTED_FORMATS_LABEL,
            " · máx. ",
            MAX_INVOICE_SIZE_LABEL
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-3.5", "aria-hidden": "true" }),
            "PDF"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Image$1, { className: "size-3.5", "aria-hidden": "true" }),
            "Foto de la factura"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: openPicker,
            disabled,
            "data-ocid": "purchase_invoices.upload_button",
            className: "mt-1 inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-medium shadow-subtle transition-smooth hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { className: "size-4", "aria-hidden": "true" }),
              "Seleccionar archivos"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: inputRef,
            type: "file",
            multiple: true,
            accept: INVOICE_ACCEPT,
            className: "sr-only",
            "aria-label": "Seleccionar facturas de compra",
            "data-ocid": "purchase_invoices.file_input",
            onChange: (event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) onFiles(files);
              event.target.value = "";
            }
          }
        )
      ]
    }
  );
}
let keyCounter = 0;
function nextKey(prefix) {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}
function isPdfFile(file) {
  return file.type === "application/pdf";
}
function errorMessage(error, fallback) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) return error;
  return fallback;
}
function normalizePesosInput(raw) {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (cleaned === "") return "";
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);
  if (decimalIndex === -1) return cleaned;
  const whole = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
  const fraction = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, "");
  return fraction === "" ? whole : `${whole}.${fraction}`;
}
function toReviewLines(invoice) {
  return invoice.lines.map((line) => ({
    key: nextKey("line"),
    id: line.id,
    code: line.code,
    description: line.description,
    quantity: line.quantity.toString(),
    unitCost: normalizePesosInput(centsToPesosInput(line.unitCost)),
    taxRate: line.taxRate.toString(),
    discountRate: line.discountRate.toString(),
    total: normalizePesosInput(centsToPesosInput(line.total)),
    matchStatus: line.matchStatus
  }));
}
function toReviewHeader(invoice) {
  return {
    supplierId: invoice.supplierId ?? null,
    supplierName: invoice.supplierName ?? "",
    supplierTaxId: invoice.supplierTaxId ?? "",
    invoiceNumber: invoice.invoiceNumber ?? "",
    invoiceDate: colombiaDateInput(invoice.invoiceDate),
    paymentMethod: invoice.paymentMethod ?? "",
    paymentMeans: invoice.paymentMeans ?? ""
  };
}
function emptyReviewHeader() {
  return {
    supplierId: null,
    supplierName: "",
    supplierTaxId: "",
    invoiceNumber: "",
    invoiceDate: "",
    paymentMethod: "",
    paymentMeans: ""
  };
}
const EXTRACTION_NOTICE = "No se pudieron leer los datos del documento. Puedes completar el proveedor, el número, la fecha y las líneas manualmente antes de confirmar.";
const EXTRACTION_UNAVAILABLE_MESSAGE = "No se pudo analizar automáticamente. Completa los datos manualmente o sube una foto de la factura.";
function isTechnicalErrorMessage(message) {
  return /CAFFEINE_[A-Z_]*API_KEY/i.test(message) || /IC0\d{3}/i.test(message) || /\btrap\b/i.test(message) || /\bReject(ed)?\b/i.test(message) || /is not set/i.test(message);
}
function extractionFailureMessage(error) {
  const raw = errorMessage(error, EXTRACTION_UNAVAILABLE_MESSAGE);
  return isTechnicalErrorMessage(raw) ? EXTRACTION_UNAVAILABLE_MESSAGE : raw;
}
function extractionReturnedNothing(invoice) {
  return invoice.extractionStatus === ExtractionStatus.failed || invoice.lines.length === 0;
}
const TABS = [
  { value: "cargar", label: "Cargar y revisar", icon: FileText },
  { value: "historial", label: "Historial", icon: History }
];
function PurchaseInvoicesPage() {
  const { actor, isFetching } = useBackend();
  const createDraft = useCreatePurchaseInvoiceDraft();
  const runExtraction = useRunPurchaseInvoiceExtraction();
  const updateReview = useUpdatePurchaseInvoiceReview();
  const confirmInvoice = useConfirmPurchaseInvoice();
  const createSupplier = useCreateSupplier();
  const [tab, setTab] = reactExports.useState("cargar");
  const [items, setItems] = reactExports.useState([]);
  const [activeKey, setActiveKey] = reactExports.useState(null);
  const [header, setHeader] = reactExports.useState(null);
  const [lines, setLines] = reactExports.useState([]);
  const [result, setResult] = reactExports.useState(null);
  const [wasAlreadyConfirmed, setWasAlreadyConfirmed] = reactExports.useState(false);
  const [validationError, setValidationError] = reactExports.useState(null);
  const [batchError, setBatchError] = reactExports.useState(null);
  const [historyPage, setHistoryPage] = reactExports.useState(1);
  const [historyStatus, setHistoryStatus] = reactExports.useState(null);
  const [historySupplierId, setHistorySupplierId] = reactExports.useState(null);
  const [historySearch, setHistorySearch] = reactExports.useState("");
  const [historySort, setHistorySort] = reactExports.useState(
    InvoiceSort.createdAt
  );
  const activeInvoiceId = reactExports.useMemo(() => {
    const item = items.find((entry) => entry.key === activeKey);
    return (item == null ? void 0 : item.invoiceId) ?? null;
  }, [items, activeKey]);
  const activeItem = items.find((entry) => entry.key === activeKey) ?? null;
  const isConfirmed = result !== null;
  const busy = updateReview.isPending || confirmInvoice.isPending || createSupplier.isPending;
  const itemsRef = reactExports.useRef([]);
  itemsRef.current = items;
  const activeKeyRef = reactExports.useRef(null);
  activeKeyRef.current = activeKey;
  const extractedHeadersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const claimActiveKey = reactExports.useCallback((key) => {
    if (activeKeyRef.current !== null) return false;
    activeKeyRef.current = key;
    setActiveKey(key);
    return true;
  }, []);
  const forceActiveKey = reactExports.useCallback((key) => {
    activeKeyRef.current = key;
    setActiveKey(key);
  }, []);
  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "invoice-review"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSuppliers(null);
    },
    enabled: !!actor && !isFetching
  });
  const patchItem = reactExports.useCallback((key, patch) => {
    setItems(
      (current) => current.map(
        (entry) => entry.key === key ? { ...entry, ...patch } : entry
      )
    );
  }, []);
  const processFile = reactExports.useCallback(
    async (key, file) => {
      let draftId = null;
      try {
        patchItem(key, { status: "uploading", progress: 0, error: void 0 });
        const uploaded = await uploadInvoiceFile(file, (percentage) => {
          patchItem(key, { progress: percentage });
        });
        patchItem(key, { status: "extracting", progress: 100 });
        const draft = await createDraft.mutateAsync({
          kind: isPdfFile(file) ? InvoiceFileKind.pdf : InvoiceFileKind.image,
          mimeType: uploaded.mimeType,
          fileName: uploaded.fileName,
          objectId: uploaded.objectId,
          sizeBytes: uploaded.sizeBytes,
          gatewayUrl: uploaded.gatewayUrl,
          projectId: uploaded.projectId
        });
        draftId = draft.id;
        const extracted = await runExtraction.mutateAsync(draft.id);
        patchItem(key, { invoiceId: extracted.id });
        extractedHeadersRef.current.set(key, toReviewHeader(extracted));
        if (extractionReturnedNothing(extracted)) {
          patchItem(key, {
            status: "failed",
            extractionFailed: true,
            error: extracted.extractionError ?? "No se pudieron leer los datos de la factura."
          });
          if (claimActiveKey(key)) {
            setHeader(toReviewHeader(extracted));
            setLines([]);
            setResult(null);
            setValidationError(null);
          }
          return;
        }
        patchItem(key, {
          status: "ready",
          error: void 0,
          extractionFailed: false
        });
        if (claimActiveKey(key)) {
          setHeader(toReviewHeader(extracted));
          setLines(toReviewLines(extracted));
          setResult(null);
          setValidationError(null);
        }
      } catch (error) {
        if (draftId !== null) {
          patchItem(key, {
            invoiceId: draftId,
            status: "failed",
            extractionFailed: true,
            error: extractionFailureMessage(error)
          });
          if (claimActiveKey(key)) {
            setHeader(emptyReviewHeader());
            setLines([]);
            setResult(null);
            setValidationError(null);
          }
          return;
        }
        patchItem(key, {
          status: "failed",
          error: errorMessage(
            error,
            "No se pudo procesar la factura. Inténtalo de nuevo."
          )
        });
      }
    },
    [createDraft, runExtraction, patchItem, claimActiveKey]
  );
  const handleFiles = reactExports.useCallback(
    (files) => {
      void (async () => {
        const accepted = [];
        const rejected = [];
        for (const file of files) {
          const prepared = await prepareInvoiceFile(file);
          if ("error" in prepared) {
            rejected.push(prepared.error);
            continue;
          }
          accepted.push({ key: nextKey("upload"), file: prepared.file });
        }
        if (rejected.length > 0) {
          setBatchError(rejected.join(" "));
        } else {
          setBatchError(null);
        }
        if (accepted.length === 0) return;
        setItems((current) => [
          ...current,
          ...accepted.map(({ key, file }) => ({
            key,
            fileName: file.name,
            isPdf: isPdfFile(file),
            progress: 0,
            status: "uploading"
          }))
        ]);
        for (const { key, file } of accepted) {
          void processFile(key, file);
        }
      })();
    },
    [processFile]
  );
  const handleRetry = reactExports.useCallback(
    (key) => {
      const item = itemsRef.current.find((entry) => entry.key === key);
      if (!item) return;
      if (item.invoiceId !== void 0) {
        patchItem(key, { status: "extracting", error: void 0 });
        void runExtraction.mutateAsync(item.invoiceId).then((invoice) => {
          extractedHeadersRef.current.set(key, toReviewHeader(invoice));
          if (extractionReturnedNothing(invoice)) {
            patchItem(key, {
              status: "failed",
              extractionFailed: true,
              error: invoice.extractionError ?? "No se pudieron leer los datos de la factura."
            });
            forceActiveKey(key);
            setHeader(toReviewHeader(invoice));
            setLines([]);
            setResult(null);
            setValidationError(null);
            return;
          }
          patchItem(key, {
            status: "ready",
            error: void 0,
            extractionFailed: false
          });
          forceActiveKey(key);
          setHeader(toReviewHeader(invoice));
          setLines(toReviewLines(invoice));
          setResult(null);
          setValidationError(null);
        }).catch((error) => {
          patchItem(key, {
            status: "failed",
            extractionFailed: true,
            error: extractionFailureMessage(error)
          });
          forceActiveKey(key);
          setHeader(
            extractedHeadersRef.current.get(key) ?? emptyReviewHeader()
          );
          setLines([]);
          setResult(null);
          setValidationError(null);
        });
        return;
      }
      patchItem(key, {
        status: "failed",
        error: "Vuelve a seleccionar el archivo para reintentar la carga desde el inicio."
      });
    },
    [patchItem, runExtraction, forceActiveKey]
  );
  const handleRemove = reactExports.useCallback((key) => {
    setItems((current) => current.filter((entry) => entry.key !== key));
    extractedHeadersRef.current.delete(key);
    if (activeKeyRef.current === key) {
      activeKeyRef.current = null;
      setActiveKey(null);
    }
  }, []);
  const handleReview = reactExports.useCallback(
    (key) => {
      const item = itemsRef.current.find((entry) => entry.key === key);
      if (!(item == null ? void 0 : item.invoiceId)) return;
      forceActiveKey(key);
      setResult(null);
      setValidationError(null);
      if (item.extractionFailed) {
        setHeader(extractedHeadersRef.current.get(key) ?? emptyReviewHeader());
        setLines([]);
        return;
      }
      if (!actor) return;
      void actor.getPurchaseInvoice(item.invoiceId).then((invoice) => {
        if (!invoice) return;
        setHeader(toReviewHeader(invoice));
        setLines(toReviewLines(invoice));
      }).catch(() => {
        ue.error("No se pudo cargar la factura para revisión.");
      });
    },
    [actor, forceActiveKey]
  );
  const handleHeaderChange = reactExports.useCallback((patch) => {
    setHeader((current) => current ? { ...current, ...patch } : current);
  }, []);
  const handleLineChange = reactExports.useCallback(
    (key, patch) => {
      setLines(
        (current) => current.map(
          (line) => line.key === key ? { ...line, ...patch } : line
        )
      );
    },
    []
  );
  const handleAddLine = reactExports.useCallback(() => {
    setLines((current) => [
      ...current,
      {
        key: nextKey("line"),
        code: "",
        description: "",
        quantity: "1",
        unitCost: "0",
        taxRate: "0",
        discountRate: "0",
        total: "0.00",
        matchStatus: LineMatchStatus.new
      }
    ]);
  }, []);
  const handleRemoveLine = reactExports.useCallback((key) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);
  const resolveSupplierId = reactExports.useCallback(
    async (name) => {
      const trimmed = name.trim();
      if (trimmed === "") {
        setValidationError("Escribe el nombre del proveedor nuevo.");
        return null;
      }
      const existing = suppliersQuery.data ?? [];
      const match = existing.find(
        (supplier) => supplier.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (match) return match.id;
      try {
        const created = await createSupplier.mutateAsync({
          name: trimmed,
          phone: ""
        });
        return created.id;
      } catch (error) {
        setValidationError(
          errorMessage(error, "No se pudo crear el proveedor nuevo.")
        );
        return null;
      }
    },
    [createSupplier, suppliersQuery.data]
  );
  const buildReviewInput = reactExports.useCallback(async () => {
    if (!header) return null;
    if (header.supplierId === null && header.supplierName.trim() === "") {
      setValidationError(
        "Selecciona un proveedor existente o escribe el nombre del proveedor nuevo."
      );
      return null;
    }
    if (lines.length === 0) {
      setValidationError("Añade al menos una línea a la factura.");
      return null;
    }
    const parsed = lines.map((line) => ({
      id: line.id,
      code: line.code.trim(),
      description: line.description.trim(),
      quantity: parseQuantityInput(line.quantity),
      unitCost: parsePesosToCents(line.unitCost),
      taxRate: parsePercentInput(line.taxRate) ?? 0n,
      discountRate: parsePercentInput(line.discountRate) ?? 0n,
      total: parsePesosToCents(line.total)
    }));
    const invalidIndex = parsed.findIndex(
      (line) => line.code === "" || line.quantity === null || line.quantity === 0n || line.unitCost === null
    );
    if (invalidIndex >= 0) {
      setValidationError(
        `Revisa la línea ${invalidIndex + 1}: el código, la cantidad (mayor que cero) y el costo son obligatorios.`
      );
      return null;
    }
    let supplierId = header.supplierId;
    if (supplierId === null) {
      supplierId = await resolveSupplierId(header.supplierName);
      if (supplierId === null) return null;
      setHeader((current) => current ? { ...current, supplierId } : current);
    }
    setValidationError(null);
    return {
      header: {
        supplierId,
        supplierName: void 0,
        supplierTaxId: header.supplierTaxId.trim(),
        invoiceNumber: header.invoiceNumber.trim() === "" ? void 0 : header.invoiceNumber.trim(),
        invoiceDate: header.invoiceDate ? colombiaStartOfDay(header.invoiceDate) ?? void 0 : void 0,
        paymentMethod: header.paymentMethod.trim(),
        paymentMeans: header.paymentMeans.trim()
      },
      lines: parsed.map((line) => {
        const quantity = line.quantity;
        const unitCost = line.unitCost;
        const total = line.total ?? computeLineTotalCents(
          quantity,
          unitCost,
          line.taxRate,
          line.discountRate
        );
        return {
          id: line.id,
          code: line.code,
          description: line.description,
          quantity,
          unitCost,
          taxRate: line.taxRate,
          discountRate: line.discountRate,
          total
        };
      })
    };
  }, [header, lines, resolveSupplierId]);
  const handleSave = reactExports.useCallback(() => {
    if (activeInvoiceId === null) return;
    void (async () => {
      const input = await buildReviewInput();
      if (!input) return;
      updateReview.mutate(
        { invoiceId: activeInvoiceId, input },
        {
          onSuccess: (invoice) => {
            setHeader(toReviewHeader(invoice));
            setLines(toReviewLines(invoice));
            ue.success("Revisión guardada");
          },
          onError: (error) => {
            setValidationError(
              errorMessage(error, "No se pudo guardar la revisión.")
            );
          }
        }
      );
    })();
  }, [activeInvoiceId, buildReviewInput, updateReview]);
  const handleConfirm = reactExports.useCallback(() => {
    if (activeInvoiceId === null) return;
    const runConfirm = (alreadyConfirmed) => {
      confirmInvoice.mutate(activeInvoiceId, {
        onSuccess: (applyResult) => {
          setResult(applyResult);
          setWasAlreadyConfirmed(alreadyConfirmed);
          if (applyResult.failed > 0n) {
            ue.warning(
              `Factura confirmada con ${applyResult.failed} línea(s) con error.`
            );
          } else {
            ue.success("Factura confirmada e inventario actualizado.");
          }
        },
        onError: (error) => {
          setValidationError(
            errorMessage(error, "No se pudo confirmar la factura.")
          );
        }
      });
    };
    void (async () => {
      const input = await buildReviewInput();
      if (!input) return;
      if ((activeItem == null ? void 0 : activeItem.status) === "ready" && isConfirmed) {
        runConfirm(true);
        return;
      }
      updateReview.mutate(
        { invoiceId: activeInvoiceId, input },
        {
          onSuccess: (invoice) => {
            setHeader(toReviewHeader(invoice));
            setLines(toReviewLines(invoice));
            runConfirm(invoice.status === PurchaseInvoiceStatus.confirmed);
          },
          onError: (error) => {
            setValidationError(
              errorMessage(error, "No se pudo guardar la revisión.")
            );
          }
        }
      );
    })();
  }, [
    activeInvoiceId,
    activeItem,
    isConfirmed,
    buildReviewInput,
    updateReview,
    confirmInvoice
  ]);
  const handleDismissResult = reactExports.useCallback(() => {
    setResult(null);
    setWasAlreadyConfirmed(false);
    activeKeyRef.current = null;
    setActiveKey(null);
    setHeader(null);
    setLines([]);
    setValidationError(null);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoices.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Compras",
            title: "Facturas de compra",
            description: "Sube la factura en PDF o foto, revisa los datos extraídos y confirma para actualizar el inventario con la entrada de stock."
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            role: "tablist",
            "aria-label": "Secciones de facturas de compra",
            "data-ocid": "purchase_invoices.tabs",
            className: "inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1",
            children: TABS.map(({ value, label, icon: Icon }) => {
              const selected = tab === value;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  role: "tab",
                  "aria-selected": selected,
                  onClick: () => setTab(value),
                  "data-ocid": `purchase_invoices.tab.${value}`,
                  className: cn(
                    "inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    selected ? "bg-card text-foreground shadow-subtle" : "text-muted-foreground hover:text-foreground"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4", "aria-hidden": "true" }),
                    label
                  ]
                },
                value
              );
            })
          }
        ),
        tab === "historial" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          PurchaseInvoiceList,
          {
            page: historyPage,
            onPageChange: setHistoryPage,
            status: historyStatus,
            onStatusChange: (next) => {
              setHistoryStatus(next);
              setHistoryPage(1);
            },
            supplierId: historySupplierId,
            onSupplierChange: (next) => {
              setHistorySupplierId(next);
              setHistoryPage(1);
            },
            search: historySearch,
            onSearchChange: (next) => {
              setHistorySearch(next);
              setHistoryPage(1);
            },
            sort: historySort,
            onSortChange: (next) => {
              setHistorySort(next);
              setHistoryPage(1);
            }
          }
        ) : result ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          InvoiceResultSummary,
          {
            result,
            wasAlreadyConfirmed,
            onDismiss: handleDismissResult
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UploadZone, { onFiles: handleFiles }),
          batchError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              "data-ocid": "purchase_invoices.batch_error",
              className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "mt-0.5 size-4 shrink-0",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: batchError })
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            InvoiceUploadList,
            {
              items,
              onRetry: handleRetry,
              onRemove: handleRemove,
              onReview: handleReview,
              activeKey
            }
          ),
          (activeItem == null ? void 0 : activeItem.extractionFailed) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "section",
            {
              "data-ocid": "purchase_invoices.extraction_failed",
              className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "mt-0.5 size-5 shrink-0 text-warning",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No se pudieron leer los datos del documento" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "max-w-xl text-xs text-muted-foreground", children: [
                      activeItem.error ? `${activeItem.error} ` : "",
                      "Puedes completar la factura manualmente en la revisión o reintentar el análisis."
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: () => handleRetry(activeItem.key),
                      "data-ocid": "purchase_invoices.failed_retry_button",
                      className: "gap-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                        "Reintentar"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      onClick: () => handleReview(activeItem.key),
                      "data-ocid": "purchase_invoices.manual_button",
                      className: "gap-1.5",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-4", "aria-hidden": "true" }),
                        "Completar manualmente"
                      ]
                    }
                  )
                ] })
              ]
            }
          ) : null,
          header && activeItem ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            InvoiceReviewPanel,
            {
              header,
              onHeaderChange: handleHeaderChange,
              lines,
              onLineChange: handleLineChange,
              onAddLine: handleAddLine,
              onRemoveLine: handleRemoveLine,
              suppliers: suppliersQuery.data ?? [],
              suppliersLoading: suppliersQuery.isLoading,
              isSaving: updateReview.isPending,
              isConfirming: confirmInvoice.isPending || createSupplier.isPending,
              validationError,
              onSave: handleSave,
              onConfirm: handleConfirm,
              confirmed: isConfirmed,
              extractionNotice: activeItem.extractionFailed ? EXTRACTION_NOTICE : null
            }
          ) : null,
          items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "section",
            {
              "data-ocid": "purchase_invoices.empty_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  FileText,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Aún no has cargado facturas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-xs text-muted-foreground", children: "Arrastra una factura en PDF o una foto para extraer sus datos automáticamente y actualizar el inventario." })
                ] })
              ]
            }
          ) : null
        ] }),
        tab === "cargar" && busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "purchase_invoices.busy_state",
            className: "text-center text-xs text-muted-foreground",
            children: "Procesando la factura…"
          }
        ) : null
      ]
    }
  );
}
export {
  PurchaseInvoicesPage
};
