import { ai as useParams, q as useNavigate, s as reactExports, aE as PaymentMethod, j as jsxRuntimeExports, T as TriangleAlert, B as Button, L as Link, aG as QuoteStatus, y as formatDate, x as formatMoney, aj as formatTaxRate, X, J as Save, F as FileText, z as WhatsAppContext, A as WhatsAppContactKind, ag as formatDateTime, E as UserRound, G as Bike, v as Input, P as Package, n as formatNumber, W as Wrench, R as Receipt, N as NotificationSource, ar as ue, t as Search, p as ServiceSort } from "./index-CzQEXdHP.js";
import { D as DocumentPreview } from "./DocumentPreview-CccqIWmY.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-B37TcS0T.js";
import { P as PageHeader } from "./PageHeader-JDKYCqW_.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-C6uRFdie.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BQof8xF8.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-D8aqbagN.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Separator } from "./separator-BScobYQZ.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Textarea } from "./textarea-C9U8oXYV.js";
import { b as useBusinessSettings, u as useCompanyProfile, a as useIvaSettings } from "./use-company-Db6O1TYw.js";
import { u as useCustomers } from "./use-customers-Dk1G98vS.js";
import { e as useMotorcycles, g as errorMessage, i as useParts } from "./use-orders-CNKkgAC3.js";
import { c as useQuote, d as useCreateQuote, e as useUpdateQuote, f as useUpdateQuoteStatus, a as useDeleteQuote, g as useConvertQuoteToOrder, h as useConvertQuoteToInvoice, Q as QUOTE_STATUS_LABELS } from "./use-quotes-CqX2ye5n.js";
import { u as useServices } from "./use-services-yKEXS84x.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { p as pdfCompanyFromProfile, l as loadPdfLibs } from "./pdf-CwHQGLGj.js";
import { A as ArrowLeft } from "./arrow-left-DLNUnNNY.js";
import { M as Mail } from "./mail-BsdNiCp8.js";
import { T as Trash2 } from "./trash-2-M_celBpV.js";
import { C as Check } from "./check-DrBSQP0y.js";
import { A as ArrowRight } from "./arrow-right-23X64hNX.js";
import { P as Printer } from "./printer-D9qf1U3g.js";
import { B as BadgeCheck } from "./badge-check-CD02knlg.js";
import { P as Plus } from "./plus-BM-BDOEL.js";
import "./download-6xWfJWG2.js";
import "./use-whatsapp-hGj8iSf3.js";
import "./chevron-up-B1sEs4Rc.js";
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
const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto"
};
const PAYMENT_METHOD_OPTIONS = [
  PaymentMethod.cash,
  PaymentMethod.card,
  PaymentMethod.transfer,
  PaymentMethod.mixed
];
let draftCounter = 0;
function nextKey(prefix) {
  draftCounter += 1;
  return `${prefix}-${draftCounter}`;
}
function parseMoney(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}
function parseQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}
function centsToInput(cents) {
  return (Number(cents) / 100).toFixed(2);
}
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
function PickerSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Search,
      {
        className: "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        type: "search",
        value,
        onChange: (event) => onChange(event.target.value),
        placeholder,
        "aria-label": ariaLabel,
        "data-ocid": ocid,
        className: "h-8 pl-8 text-xs"
      }
    )
  ] });
}
function PickerPrompt({ ocid, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "p",
    {
      "data-ocid": ocid,
      className: "rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground",
      children
    }
  );
}
function PartLinesEditor({
  lines,
  onChange
}) {
  var _a;
  const [search, setSearch] = reactExports.useState("");
  const [activePartKey, setActivePartKey] = reactExports.useState(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const term = debouncedSearch.trim();
  const partsQuery = useParts(debouncedSearch);
  const parts = term.length > 0 ? ((_a = partsQuery.data) == null ? void 0 : _a.items) ?? [] : [];
  const update = (key, patch) => {
    onChange(
      lines.map((line) => line.key === key ? { ...line, ...patch } : line)
    );
  };
  const selectPart = (key, part) => {
    update(key, {
      partId: part.id,
      description: part.name,
      unitPrice: centsToInput(part.salePrice)
    });
  };
  const clearPart = (key) => {
    update(key, { partId: null });
  };
  const addLine = () => {
    onChange([
      ...lines,
      {
        key: nextKey("part"),
        partId: null,
        description: "",
        quantity: "1",
        unitPrice: "0.00"
      }
    ]);
  };
  const removeLine = (key) => {
    onChange(lines.filter((line) => line.key !== key));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between border-b border-border px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "size-4 text-primary", "aria-hidden": "true" }),
        "Repuestos"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "outline",
          onClick: addLine,
          "data-ocid": "quote_detail.add_part_button",
          className: "gap-1.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
            "Agregar"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 px-5 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PickerSearch,
        {
          value: search,
          onChange: setSearch,
          placeholder: "Buscar por SKU o nombre…",
          ariaLabel: "Buscar repuesto por SKU o nombre",
          ocid: "quote_detail.part_search_input"
        }
      ),
      term.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(PickerPrompt, { ocid: "quote_detail.part_search.prompt_state", children: "Escribe el SKU o el nombre del repuesto para ver coincidencias." }) : partsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          "data-ocid": "quote_detail.part_search.loading_state",
          className: "space-y-1.5",
          children: Array.from(
            { length: 3 },
            (_, index) => `quote-part-skeleton-${index}`
          ).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, key))
        }
      ) : partsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "quote_detail.part_search.error_state",
          className: "text-xs text-destructive",
          children: "No se pudo cargar el catálogo de repuestos. Inténtalo de nuevo."
        }
      ) : parts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "quote_detail.part_search.empty_state",
          className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
          children: `Sin repuestos que coincidan con “${term}”.`
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "ul",
        {
          "data-ocid": "quote_detail.part_search.list",
          className: "max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1",
          children: parts.map((part, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                if (activePartKey !== null) selectPart(activePartKey, part);
              },
              "data-ocid": `quote_detail.part_search.item.${index + 1}`,
              className: "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: part.sku }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: part.name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail mt-0.5 block truncate text-xs text-muted-foreground", children: [
                  formatNumber(part.totalStock),
                  " ",
                  part.unit,
                  " ·",
                  " ",
                  formatMoney(part.salePrice)
                ] })
              ] })
            }
          ) }, part.id.toString()))
        }
      ),
      lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "quote_detail.parts.empty_state",
          className: "rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground",
          children: "Sin repuestos. Agrega las piezas que incluye la cotización."
        }
      ) : lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": `quote_detail.part_line.${index + 1}`,
          className: "grid gap-3 rounded-md border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_5rem_7rem_auto]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: `part-${line.key}`,
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: "Repuesto"
                }
              ),
              line.partId !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": `quote_detail.part_selected.${index + 1}`,
                  className: "flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: line.description || "Repuesto seleccionado" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail truncate text-xs text-muted-foreground", children: formatMoney(BigInt(parseMoney(line.unitPrice))) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "ghost",
                        size: "icon",
                        onClick: () => clearPart(line.key),
                        "aria-label": "Quitar el repuesto seleccionado",
                        "data-ocid": `quote_detail.clear_part_button.${index + 1}`,
                        className: "shrink-0 text-muted-foreground hover:text-destructive",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
                      }
                    )
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setActivePartKey(line.key),
                  "aria-pressed": activePartKey === line.key,
                  "data-ocid": `quote_detail.part_pick_button.${index + 1}`,
                  className: activePartKey === line.key ? "flex h-9 w-full items-center gap-2 rounded-md border border-primary/50 bg-primary/5 px-3 text-left text-xs text-foreground focus-visible:outline-none" : "flex h-9 w-full items-center gap-2 rounded-md border border-dashed border-border px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-3.5 shrink-0", "aria-hidden": "true" }),
                    activePartKey === line.key ? "Elige un repuesto de la lista de arriba" : "Usar el buscador de arriba"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: `part-qty-${line.key}`,
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: "Cant."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: `part-qty-${line.key}`,
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                  step: 1,
                  value: line.quantity,
                  onChange: (event) => update(line.key, { quantity: event.target.value }),
                  "data-ocid": `quote_detail.part_quantity_input.${index + 1}`,
                  className: "data-rail"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: `part-price-${line.key}`,
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: "Precio unit."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: `part-price-${line.key}`,
                  type: "number",
                  inputMode: "decimal",
                  min: 0,
                  step: "0.01",
                  value: line.unitPrice,
                  onChange: (event) => update(line.key, { unitPrice: event.target.value }),
                  "data-ocid": `quote_detail.part_price_input.${index + 1}`,
                  className: "data-rail"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                onClick: () => removeLine(line.key),
                "aria-label": "Quitar repuesto",
                "data-ocid": `quote_detail.remove_part_button.${index + 1}`,
                className: "text-muted-foreground hover:text-destructive",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
              }
            ) })
          ]
        },
        line.key
      ))
    ] })
  ] });
}
function ServiceLinesEditor({
  lines,
  onChange
}) {
  var _a;
  const [search, setSearch] = reactExports.useState("");
  const [activeServiceKey, setActiveServiceKey] = reactExports.useState(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const term = debouncedSearch.trim();
  const servicesQuery = useServices({
    search: debouncedSearch,
    category: null,
    activeOnly: true,
    sort: ServiceSort.name,
    page: 1,
    pageSize: 100
  });
  const services = term.length > 0 ? ((_a = servicesQuery.data) == null ? void 0 : _a.items) ?? [] : [];
  const update = (key, patch) => {
    onChange(
      lines.map((line) => line.key === key ? { ...line, ...patch } : line)
    );
  };
  const selectService = (key, service) => {
    update(key, {
      serviceId: service.id,
      description: service.name,
      unitPrice: centsToInput(service.laborRate)
    });
  };
  const clearService = (key) => {
    update(key, { serviceId: null });
  };
  const addLine = () => {
    onChange([
      ...lines,
      {
        key: nextKey("service"),
        serviceId: null,
        description: "",
        quantity: "1",
        unitPrice: "0.00"
      }
    ]);
  };
  const removeLine = (key) => {
    onChange(lines.filter((line) => line.key !== key));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between border-b border-border px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-4 text-primary", "aria-hidden": "true" }),
        "Servicios"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          variant: "outline",
          onClick: addLine,
          "data-ocid": "quote_detail.add_service_button",
          className: "gap-1.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
            "Agregar"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 px-5 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        PickerSearch,
        {
          value: search,
          onChange: setSearch,
          placeholder: "Buscar por código o nombre…",
          ariaLabel: "Buscar servicio por código o nombre",
          ocid: "quote_detail.service_search_input"
        }
      ),
      term.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(PickerPrompt, { ocid: "quote_detail.service_search.prompt_state", children: "Escribe el código o el nombre del servicio para ver coincidencias." }) : servicesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          "data-ocid": "quote_detail.service_search.loading_state",
          className: "space-y-1.5",
          children: Array.from(
            { length: 3 },
            (_, index) => `quote-service-skeleton-${index}`
          ).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, key))
        }
      ) : servicesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "quote_detail.service_search.error_state",
          className: "text-xs text-destructive",
          children: "No se pudo cargar el catálogo de servicios. Inténtalo de nuevo."
        }
      ) : services.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "quote_detail.service_search.empty_state",
          className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
          children: `Sin servicios que coincidan con “${term}”.`
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "ul",
        {
          "data-ocid": "quote_detail.service_search.list",
          className: "max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1",
          children: services.map((service, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                if (activeServiceKey !== null) {
                  selectService(activeServiceKey, service);
                }
              },
              "data-ocid": `quote_detail.service_search.item.${index + 1}`,
              className: "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: service.code }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: service.name })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block truncate text-xs text-muted-foreground", children: service.category })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 text-xs font-medium", children: formatMoney(service.laborRate) })
              ]
            }
          ) }, service.id.toString()))
        }
      ),
      lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "quote_detail.services.empty_state",
          className: "rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground",
          children: "Sin servicios. Agrega la mano de obra o los servicios cotizados."
        }
      ) : lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": `quote_detail.service_line.${index + 1}`,
          className: "grid gap-3 rounded-md border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_5rem_7rem_auto]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: `service-${line.key}`,
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: "Servicio"
                }
              ),
              line.serviceId !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": `quote_detail.service_selected.${index + 1}`,
                  className: "flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: line.description || "Servicio seleccionado" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail truncate text-xs text-muted-foreground", children: formatMoney(BigInt(parseMoney(line.unitPrice))) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "ghost",
                        size: "icon",
                        onClick: () => clearService(line.key),
                        "aria-label": "Quitar el servicio seleccionado",
                        "data-ocid": `quote_detail.clear_service_button.${index + 1}`,
                        className: "shrink-0 text-muted-foreground hover:text-destructive",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
                      }
                    )
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveServiceKey(line.key),
                  "aria-pressed": activeServiceKey === line.key,
                  "data-ocid": `quote_detail.service_pick_button.${index + 1}`,
                  className: activeServiceKey === line.key ? "flex h-9 w-full items-center gap-2 rounded-md border border-primary/50 bg-primary/5 px-3 text-left text-xs text-foreground focus-visible:outline-none" : "flex h-9 w-full items-center gap-2 rounded-md border border-dashed border-border px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-3.5 shrink-0", "aria-hidden": "true" }),
                    activeServiceKey === line.key ? "Elige un servicio de la lista de arriba" : "Usar el buscador de arriba"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: `service-qty-${line.key}`,
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: "Cant."
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: `service-qty-${line.key}`,
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                  step: 1,
                  value: line.quantity,
                  onChange: (event) => update(line.key, { quantity: event.target.value }),
                  "data-ocid": `quote_detail.service_quantity_input.${index + 1}`,
                  className: "data-rail"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: `service-price-${line.key}`,
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: "Tarifa"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: `service-price-${line.key}`,
                  type: "number",
                  inputMode: "decimal",
                  min: 0,
                  step: "0.01",
                  value: line.unitPrice,
                  onChange: (event) => update(line.key, { unitPrice: event.target.value }),
                  "data-ocid": `quote_detail.service_price_input.${index + 1}`,
                  className: "data-rail"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                onClick: () => removeLine(line.key),
                "aria-label": "Quitar servicio",
                "data-ocid": `quote_detail.remove_service_button.${index + 1}`,
                className: "text-muted-foreground hover:text-destructive",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
              }
            ) })
          ]
        },
        line.key
      ))
    ] })
  ] });
}
async function buildQuotePdf(format, number, company, meta, lines, totals, footer) {
  var _a, _b, _c;
  const { jsPDF, autoTable } = await loadPdfLibs();
  const narrow = format === "receipt80";
  const margin = narrow ? 3 : 14;
  const right = narrow ? 77 : 196;
  const doc = new jsPDF({
    unit: "mm",
    format: narrow ? [80, 297] : "a4"
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 10 : 15);
  doc.setTextColor(30, 41, 59);
  doc.text(company.name, margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 8.5);
  doc.setTextColor(100, 116, 139);
  const contact = [company.taxId, company.address, company.phone].filter((value) => !!value && value.trim() !== "").join(narrow ? " · " : "  ·  ");
  let cursor = 18.5;
  if (contact !== "") {
    const contactLines = doc.splitTextToSize(contact, right - margin);
    doc.text(contactLines, margin, cursor);
    cursor += contactLines.length * (narrow ? 3 : 4);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 8.5 : 11);
  doc.setTextColor(30, 41, 59);
  doc.text("COTIZACIÓN", right, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 9);
  doc.setTextColor(100, 116, 139);
  doc.text(number, right, 18.5, { align: "right" });
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor + 1, right, cursor + 1);
  cursor += 5;
  if (narrow) {
    for (const entry of meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(entry.label, margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const value = doc.splitTextToSize(entry.value, right - margin);
      doc.text(value, margin, cursor + 3);
      cursor += 3 + value.length * 3 + 1.5;
    }
  } else {
    autoTable(doc, {
      startY: cursor,
      body: meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 40, textColor: [100, 116, 139] },
        1: { fontStyle: "bold", textColor: [30, 41, 59] }
      },
      margin: { left: margin, right: margin }
    });
    cursor = (((_a = doc.lastAutoTable) == null ? void 0 : _a.finalY) ?? cursor) + 4;
  }
  autoTable(doc, {
    startY: cursor,
    head: [["Concepto", "Cant.", "P. unit.", "Importe"]],
    body: lines.map((line) => [
      line.description,
      formatNumber(line.quantity),
      formatMoney(BigInt(Math.round(line.unitPrice * 100))),
      formatMoney(BigInt(Math.round(line.amount * 100)))
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 6.5 : 8.5,
      cellPadding: narrow ? 1.2 : 2,
      overflow: "linebreak"
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" }
    },
    margin: { left: margin, right: margin }
  });
  const afterLines = ((_b = doc.lastAutoTable) == null ? void 0 : _b.finalY) ?? cursor;
  autoTable(doc, {
    startY: afterLines + 4,
    body: totals.map((entry) => [entry.label, entry.value]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 7 : 9,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] }
    },
    margin: { left: narrow ? margin : right - 90, right: margin }
  });
  const afterTotals = ((_c = doc.lastAutoTable) == null ? void 0 : _c.finalY) ?? afterLines + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    doc.splitTextToSize(footer, right - margin),
    margin,
    afterTotals + (narrow ? 6 : 10)
  );
  return doc;
}
function QuoteDetailPage() {
  var _a, _b, _c;
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const isNew = params.id === void 0 || params.id === "nueva";
  const quoteId = isNew ? null : BigInt(params.id);
  const quoteQuery = useQuote(quoteId);
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const { isIvaResponsible, taxRate: effectiveTaxRate } = useIvaSettings();
  const [customerId, setCustomerId] = reactExports.useState(null);
  const [notes, setNotes] = reactExports.useState("");
  const [discount, setDiscount] = reactExports.useState("0.00");
  const [partLines, setPartLines] = reactExports.useState([]);
  const [serviceLines, setServiceLines] = reactExports.useState([]);
  const [formError, setFormError] = reactExports.useState(null);
  const [initialized, setInitialized] = reactExports.useState(false);
  const [printFormat, setPrintFormat] = reactExports.useState("a4");
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const [deleteOpen, setDeleteOpen] = reactExports.useState(false);
  const [convertOpen, setConvertOpen] = reactExports.useState(false);
  const [notifyOpen, setNotifyOpen] = reactExports.useState(false);
  const [paymentMethod, setPaymentMethod] = reactExports.useState(
    PaymentMethod.cash
  );
  const [customerSearch, setCustomerSearch] = reactExports.useState("");
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);
  const customersQuery = useCustomers(debouncedCustomerSearch);
  const motorcyclesQuery = useMotorcycles(customerId);
  const customerTerm = debouncedCustomerSearch.trim();
  const customerResults = customersQuery.data ?? [];
  const customers = customerTerm.length > 0 ? customerResults : [];
  const selectedCustomer = customerResults.find((item) => item.id === customerId) ?? null;
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const updateStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();
  const convertToOrder = useConvertQuoteToOrder();
  const convertToInvoice = useConvertQuoteToInvoice();
  const view = quoteQuery.data ?? null;
  const quote = (view == null ? void 0 : view.quote) ?? null;
  const business = businessQuery.data ?? null;
  const companyLogoUrl = ((_a = companyQuery.data) == null ? void 0 : _a.logoUrl) ?? void 0;
  reactExports.useEffect(() => {
    if (isNew || initialized || !quote) return;
    setCustomerId(quote.customerId);
    setNotes(quote.notes ?? "");
    setDiscount(centsToInput(quote.discount));
    setPartLines(
      quote.partLines.map((line) => ({
        key: nextKey("part"),
        partId: line.partId,
        description: line.description,
        quantity: line.quantity.toString(),
        unitPrice: centsToInput(line.unitPrice)
      }))
    );
    setServiceLines(
      quote.serviceLines.map((line) => ({
        key: nextKey("service"),
        serviceId: line.serviceId ?? null,
        description: line.description,
        quantity: line.quantity.toString(),
        unitPrice: centsToInput(line.unitPrice)
      }))
    );
    setInitialized(true);
  }, [isNew, initialized, quote]);
  const motorcycles = motorcyclesQuery.data ?? [];
  const motorcycleId = ((_b = motorcycles[0]) == null ? void 0 : _b.id) ?? null;
  const selectedMotorcycle = motorcycles[0];
  const liveTotals = reactExports.useMemo(() => {
    const partsSubtotal = partLines.reduce(
      (sum, line) => sum + parseQuantity(line.quantity) * parseMoney(line.unitPrice),
      0
    );
    const servicesSubtotal = serviceLines.reduce(
      (sum, line) => sum + parseQuantity(line.quantity) * parseMoney(line.unitPrice),
      0
    );
    const subtotal = partsSubtotal + servicesSubtotal;
    const discountCents = Math.min(parseMoney(discount), subtotal);
    const taxableBase = subtotal - discountCents;
    const taxRate = Number(effectiveTaxRate);
    const tax = Math.round(taxableBase * taxRate / 100);
    return {
      partsSubtotal,
      servicesSubtotal,
      subtotal,
      discount: discountCents,
      taxableBase,
      tax,
      total: taxableBase + tax,
      taxRate
    };
  }, [partLines, serviceLines, discount, effectiveTaxRate]);
  const isEditing = isNew || initialized;
  const isPending = createQuote.isPending || updateQuote.isPending || updateStatus.isPending;
  function buildInput() {
    if (customerId === null) {
      setFormError("Selecciona el cliente de la cotización.");
      return null;
    }
    if (motorcycleId === null) {
      setFormError(
        "El cliente seleccionado no tiene motos registradas. Registra una moto antes de cotizar."
      );
      return null;
    }
    const parts = [];
    for (const line of partLines) {
      if (line.partId === null) {
        setFormError("Selecciona un repuesto en cada línea de repuestos.");
        return null;
      }
      const quantity = parseQuantity(line.quantity);
      if (quantity <= 0) {
        setFormError("Cada repuesto necesita una cantidad mayor a cero.");
        return null;
      }
      parts.push({
        partId: line.partId,
        quantity: BigInt(quantity),
        unitPrice: BigInt(parseMoney(line.unitPrice))
      });
    }
    const services = [];
    for (const line of serviceLines) {
      const quantity = parseQuantity(line.quantity);
      if (quantity <= 0) {
        setFormError("Cada servicio necesita una cantidad mayor a cero.");
        return null;
      }
      const description = line.description.trim();
      if (description === "") {
        setFormError("Selecciona un servicio o describe la partida.");
        return null;
      }
      services.push({
        serviceId: line.serviceId ?? void 0,
        description,
        quantity: BigInt(quantity),
        unitPrice: BigInt(parseMoney(line.unitPrice))
      });
    }
    if (parts.length === 0 && services.length === 0) {
      setFormError("Agrega al menos un repuesto o un servicio.");
      return null;
    }
    return {
      customerId,
      motorcycleId,
      notes: notes.trim() === "" ? void 0 : notes.trim(),
      discount: BigInt(parseMoney(discount)),
      partLines: parts,
      serviceLines: services
    };
  }
  function handleSave() {
    setFormError(null);
    const input = buildInput();
    if (!input) return;
    if (isNew) {
      createQuote.mutate(input, {
        onSuccess: (created) => {
          ue.success(`Cotización ${created.quote.quoteNumber} creada`);
          void navigate({
            to: "/cotizaciones/$id",
            params: { id: created.quote.id.toString() }
          });
        },
        onError: (error) => setFormError(errorMessage(error))
      });
      return;
    }
    if (quoteId === null) return;
    updateQuote.mutate(
      { id: quoteId, input },
      {
        onSuccess: () => {
          ue.success("Cotización actualizada");
          setInitialized(false);
        },
        onError: (error) => setFormError(errorMessage(error))
      }
    );
  }
  function handleCancelEdit() {
    if (isNew) {
      void navigate({ to: "/cotizaciones" });
      return;
    }
    setInitialized(false);
    setFormError(null);
  }
  function handleStatusChange(status2) {
    if (quoteId === null) return;
    setFormError(null);
    updateStatus.mutate(
      { id: quoteId, status: status2 },
      {
        onSuccess: () => ue.success("Estado actualizado"),
        onError: (error) => setFormError(errorMessage(error))
      }
    );
  }
  function handleDelete() {
    if (quoteId === null) return;
    deleteQuote.mutate(quoteId, {
      onSuccess: () => {
        ue.success("Cotización eliminada");
        void navigate({ to: "/cotizaciones" });
      },
      onError: (error) => setFormError(errorMessage(error))
    });
  }
  function handleConvertToOrder() {
    if (quoteId === null) return;
    setFormError(null);
    convertToOrder.mutate(quoteId, {
      onSuccess: (order) => {
        ue.success(`Orden ${order.order.orderNumber} creada`);
        setConvertOpen(false);
        void navigate({
          to: "/ordenes/$id",
          params: { id: order.order.id.toString() }
        });
      },
      onError: (error) => setFormError(errorMessage(error))
    });
  }
  function handleConvertToInvoice() {
    if (quoteId === null) return;
    setFormError(null);
    convertToInvoice.mutate(
      { id: quoteId, paymentMethod },
      {
        onSuccess: (invoice) => {
          ue.success(`Factura ${invoice.number} generada`);
          setConvertOpen(false);
          void navigate({
            to: "/facturas/$id",
            params: { id: invoice.id.toString() }
          });
        },
        onError: (error) => setFormError(errorMessage(error))
      }
    );
  }
  if (!isNew && quoteQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "quote_detail.loading_state",
        className: "mx-auto w-full max-w-5xl space-y-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-40 w-full" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 w-full" })
        ]
      }
    );
  }
  if (!isNew && (quoteQuery.isError || !quote)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "quote_detail.error_state",
        className: "mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-6 text-destructive", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Cotización no encontrada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "La cotización solicitada no existe o fue eliminada del registro." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cotizaciones", "data-ocid": "quote_detail.back_button", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
            "Volver a cotizaciones"
          ] }) })
        ]
      }
    );
  }
  const status = (quote == null ? void 0 : quote.status) ?? QuoteStatus.draft;
  const canConvert = status === QuoteStatus.accepted;
  const documentLines = [
    ...partLines.map((line) => ({
      description: line.description || "Repuesto",
      quantity: parseQuantity(line.quantity),
      unitPrice: parseMoney(line.unitPrice) / 100,
      amount: parseQuantity(line.quantity) * parseMoney(line.unitPrice) / 100
    })),
    ...serviceLines.map((line) => ({
      description: line.description || "Servicio",
      quantity: parseQuantity(line.quantity),
      unitPrice: parseMoney(line.unitPrice) / 100,
      amount: parseQuantity(line.quantity) * parseMoney(line.unitPrice) / 100
    }))
  ];
  const documentMeta = [
    {
      label: "Cliente",
      value: (selectedCustomer == null ? void 0 : selectedCustomer.name) ?? (quote ? `Cliente #${quote.customerId.toString()}` : "—")
    },
    {
      label: "Moto",
      value: selectedMotorcycle ? `${selectedMotorcycle.brand} ${selectedMotorcycle.model} · ${selectedMotorcycle.plate}` : quote ? `#${quote.motorcycleId.toString()}` : "—",
      rail: true
    },
    {
      label: "Fecha",
      value: formatDate((quote == null ? void 0 : quote.createdAt) ?? null)
    },
    {
      label: "Estado",
      value: QUOTE_STATUS_LABELS[status]
    }
  ];
  const documentTotals = [
    { label: "Subtotal", value: formatMoney(BigInt(liveTotals.subtotal)) },
    { label: "Descuento", value: formatMoney(BigInt(liveTotals.discount)) },
    ...isIvaResponsible ? [
      {
        label: `Impuesto (${formatTaxRate(BigInt(liveTotals.taxRate))})`,
        value: formatMoney(BigInt(liveTotals.tax))
      }
    ] : [],
    {
      label: "Total",
      value: formatMoney(BigInt(liveTotals.total)),
      emphasis: true
    }
  ];
  const quoteFooter = "Cotización sujeta a disponibilidad de refacciones. Precios válidos por 15 días.";
  async function handleDownloadPdf(nextFormat) {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildQuotePdf(
        nextFormat,
        (quote == null ? void 0 : quote.quoteNumber) ?? "BORRADOR",
        pdfCompanyFromProfile(companyQuery.data),
        documentMeta,
        documentLines,
        documentTotals,
        quoteFooter
      );
      await downloadFile({
        filename: `Cotizacion-${(quote == null ? void 0 : quote.quoteNumber) ?? "BORRADOR"}.pdf`,
        mimeType: "application/pdf",
        data: doc.output("blob")
      });
    } catch {
      setDownloadError(
        "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo."
      );
    } finally {
      setIsDownloading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "quote_detail.page",
      className: "mx-auto w-full max-w-5xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 print:hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              asChild: true,
              className: "-ml-2 gap-1.5 text-muted-foreground",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cotizaciones", "data-ocid": "quote_detail.back_link", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Cotizaciones"
              ] })
            }
          ),
          !isNew ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            StatusBadge,
            {
              label: QUOTE_STATUS_LABELS[status],
              tone: QUOTE_STATUS_TONE[status]
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Ventas",
            title: isNew ? "Nueva cotización" : (quote == null ? void 0 : quote.quoteNumber) ?? "Cotización",
            description: isNew ? "Selecciona cliente y moto, agrega repuestos y servicios, y revisa los totales en vivo." : `Creada ${formatDateTime((quote == null ? void 0 : quote.createdAt) ?? null)} · Actualizada ${formatDateTime((quote == null ? void 0 : quote.updatedAt) ?? null)}`,
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: handleCancelEdit,
                    "data-ocid": "quote_detail.cancel_button",
                    className: "gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" }),
                      "Cancelar"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    onClick: handleSave,
                    disabled: isPending,
                    "data-ocid": "quote_detail.save_button",
                    className: "gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                      isPending ? "Guardando…" : "Guardar"
                    ]
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: () => setInitialized(true),
                  "data-ocid": "quote_detail.edit_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-4", "aria-hidden": "true" }),
                    "Editar"
                  ]
                }
              ),
              !isNew ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setNotifyOpen(true),
                  "data-ocid": "quote_detail.notify_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "size-4", "aria-hidden": "true" }),
                    "Notificar al cliente"
                  ]
                }
              ) : null,
              !isNew && quote ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                WhatsAppNotifyButton,
                {
                  contactKind: WhatsAppContactKind.customer,
                  contactId: quote.customerId,
                  context: WhatsAppContext.quote,
                  referenceId: quote.id,
                  contactName: (selectedCustomer == null ? void 0 : selectedCustomer.name) ?? `Cliente #${quote.customerId.toString()}`,
                  variant: "outline",
                  size: "sm",
                  ocid: "quote_detail.whatsapp_button"
                }
              ) : null,
              !isNew ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setDeleteOpen(true),
                  "data-ocid": "quote_detail.delete_button",
                  className: "gap-2 text-destructive hover:text-destructive",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" }),
                    "Eliminar"
                  ]
                }
              ) : null
            ] })
          }
        ),
        formError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "quote_detail.error_banner",
            className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "mt-0.5 size-4 shrink-0 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: formError })
            ]
          }
        ) : null,
        isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-4 text-primary", "aria-hidden": "true" }),
              "Cliente"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 px-5 py-5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "quote-customer-search", children: "Buscar cliente" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  PickerSearch,
                  {
                    value: customerSearch,
                    onChange: setCustomerSearch,
                    placeholder: "Buscar por nombre, documento o teléfono…",
                    ariaLabel: "Buscar cliente por nombre, documento o teléfono",
                    ocid: "quote_detail.customer_search_input"
                  }
                ),
                customerTerm.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(PickerPrompt, { ocid: "quote_detail.customer_search.prompt_state", children: "Escribe el nombre, el documento o el teléfono del cliente para ver coincidencias." }) : customersQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }) : customersQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "quote_detail.customer_search.error_state",
                    className: "text-xs text-destructive",
                    children: "No se pudo cargar el directorio de clientes. Inténtalo de nuevo."
                  }
                ) : customers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "quote_detail.customer_search.empty_state",
                    className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
                    children: `Sin clientes que coincidan con “${customerTerm}”.`
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "ul",
                  {
                    "data-ocid": "quote_detail.customer_search.list",
                    className: "max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1",
                    children: customers.map((customer, index) => {
                      const isSelected = customer.id === customerId;
                      return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setCustomerId(customer.id);
                            setFormError(null);
                          },
                          "aria-pressed": isSelected,
                          "data-ocid": `quote_detail.customer_search.item.${index + 1}`,
                          className: isSelected ? "flex w-full items-center justify-between gap-3 rounded-sm border border-primary/40 bg-primary/5 px-2.5 py-2 text-left transition-colors focus-visible:outline-none" : "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: customer.name }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail mt-0.5 block truncate text-xs text-muted-foreground", children: customer.phone })
                            ] }),
                            isSelected ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Check,
                              {
                                className: "size-4 shrink-0 text-primary",
                                "aria-hidden": "true"
                              }
                            ) : null
                          ]
                        }
                      ) }, customer.id.toString());
                    })
                  }
                )
              ] }),
              selectedCustomer ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "quote_detail.customer_selected",
                  className: "flex items-start justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: "Cliente seleccionado" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: selectedCustomer.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail truncate text-xs text-muted-foreground", children: selectedCustomer.phone })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "ghost",
                        size: "icon",
                        onClick: () => {
                          setCustomerId(null);
                          setFormError(null);
                        },
                        "aria-label": "Quitar el cliente seleccionado",
                        "data-ocid": "quote_detail.clear_customer_button",
                        className: "shrink-0 text-muted-foreground hover:text-destructive",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
                      }
                    )
                  ]
                }
              ) : null,
              customerId !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "size-3", "aria-hidden": "true" }),
                  "Motocicleta"
                ] }),
                motorcyclesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }) : selectedMotorcycle ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "quote_detail.motorcycle_summary",
                    className: "flex h-9 items-center rounded-md border border-border bg-muted/20 px-3 text-xs",
                    children: `${selectedMotorcycle.brand} ${selectedMotorcycle.model} · ${selectedMotorcycle.plate}`
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "quote_detail.motorcycle_missing_state",
                    className: "rounded-md border border-dashed border-warning/50 bg-warning/10 px-3 py-2.5 text-xs text-warning",
                    children: "Este cliente no tiene motos registradas. Registra una moto antes de guardar la cotización."
                  }
                )
              ] }) : null
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PartLinesEditor, { lines: partLines, onChange: setPartLines }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ServiceLinesEditor, { lines: serviceLines, onChange: setServiceLines }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm font-semibold tracking-tight", children: "Notas y descuento" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-5 px-5 py-5 sm:grid-cols-[1fr_10rem]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "quote-notes", children: "Notas para el cliente" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    id: "quote-notes",
                    value: notes,
                    onChange: (event) => setNotes(event.target.value),
                    rows: 3,
                    placeholder: "Condiciones, vigencia o comentarios de la cotización…",
                    "data-ocid": "quote_detail.notes_textarea"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "quote-discount", children: "Descuento" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "quote-discount",
                    type: "number",
                    inputMode: "decimal",
                    min: 0,
                    step: "0.01",
                    value: discount,
                    onChange: (event) => setDiscount(event.target.value),
                    "data-ocid": "quote_detail.discount_input",
                    className: "data-rail"
                  }
                )
              ] })
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-3", "aria-hidden": "true" }),
                "Cliente"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: (selectedCustomer == null ? void 0 : selectedCustomer.name) ?? `Cliente #${quote == null ? void 0 : quote.customerId.toString()}` })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "size-3", "aria-hidden": "true" }),
                "Motocicleta"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: selectedMotorcycle ? `${selectedMotorcycle.brand} ${selectedMotorcycle.model}` : `Moto #${quote == null ? void 0 : quote.motorcycleId.toString()}` }),
              selectedMotorcycle ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: selectedMotorcycle.plate }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Repuestos" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-sm font-medium", children: formatMoney(view == null ? void 0 : view.totals.partsSubtotal) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Servicios" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-sm font-medium", children: formatMoney(view == null ? void 0 : view.totals.servicesSubtotal) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm font-semibold tracking-tight", children: "Partidas" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-5 py-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "size-3", "aria-hidden": "true" }),
                  "Repuestos"
                ] }),
                quote && quote.partLines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: quote.partLines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "li",
                  {
                    "data-ocid": `quote_detail.part_item.${index + 1}`,
                    className: "flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate", children: line.description }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail shrink-0 text-muted-foreground", children: [
                        formatNumber(line.quantity),
                        " ×",
                        " ",
                        formatMoney(line.unitPrice),
                        " =",
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: formatMoney(line.quantity * line.unitPrice) })
                      ] })
                    ]
                  },
                  line.id.toString()
                )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sin repuestos en esta cotización." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-3", "aria-hidden": "true" }),
                  "Servicios"
                ] }),
                quote && quote.serviceLines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: quote.serviceLines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "li",
                  {
                    "data-ocid": `quote_detail.service_item.${index + 1}`,
                    className: "flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 truncate", children: line.description }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail shrink-0 text-muted-foreground", children: [
                        formatNumber(line.quantity),
                        " ×",
                        " ",
                        formatMoney(line.unitPrice),
                        " =",
                        " ",
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: formatMoney(line.quantity * line.unitPrice) })
                      ] })
                    ]
                  },
                  line.id.toString()
                )) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sin servicios en esta cotización." })
              ] }),
              (quote == null ? void 0 : quote.notes) ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Notas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-sm", children: quote.notes })
                ] })
              ] }) : null
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 lg:grid-cols-[1fr_20rem]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
            !isNew ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm font-semibold tracking-tight", children: "Estado de la cotización" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 px-5 py-5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: STATUS_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: option === status ? "default" : "outline",
                    disabled: updateStatus.isPending || option === status,
                    onClick: () => handleStatusChange(option),
                    "data-ocid": `quote_detail.status_button.${option}`,
                    children: QUOTE_STATUS_LABELS[option]
                  },
                  option
                )) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: canConvert ? "La cotización fue aceptada: puedes convertirla en orden de taller o factura." : "Solo las cotizaciones aceptadas pueden convertirse en orden o factura." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      onClick: () => setConvertOpen(true),
                      disabled: !canConvert,
                      "data-ocid": "quote_detail.convert_button",
                      className: "gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "size-4", "aria-hidden": "true" }),
                        "Convertir"
                      ]
                    }
                  )
                ] })
              ] })
            ] }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between border-b border-border px-5 py-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "size-4 text-primary", "aria-hidden": "true" }),
                  "Impresión"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      size: "sm",
                      variant: printFormat === "a4" ? "default" : "outline",
                      onClick: () => setPrintFormat("a4"),
                      "data-ocid": "quote_detail.format_a4_button",
                      children: "A4"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      size: "sm",
                      variant: printFormat === "receipt80" ? "default" : "outline",
                      onClick: () => setPrintFormat("receipt80"),
                      "data-ocid": "quote_detail.format_80mm_button",
                      children: "Tirilla 80 mm"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "px-5 py-5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DocumentPreview,
                  {
                    title: "Cotización",
                    number: (quote == null ? void 0 : quote.quoteNumber) ?? "BORRADOR",
                    companyName: (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES",
                    companyLogoUrl,
                    companyContact: business ? [business.address, business.phone].filter((part) => part.trim() !== "").join(" · ") : void 0,
                    meta: documentMeta,
                    lines: documentLines,
                    totals: documentTotals,
                    footer: quoteFooter,
                    format: printFormat,
                    ocid: "quote_detail.document",
                    onFormatChange: setPrintFormat,
                    onDownloadPdf: handleDownloadPdf,
                    isDownloading
                  }
                ),
                downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "quote_detail.download_error",
                    className: "mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2 text-xs text-destructive", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          TriangleAlert,
                          {
                            className: "mt-0.5 size-3.5 shrink-0",
                            "aria-hidden": "true"
                          }
                        ),
                        downloadError
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          onClick: () => void handleDownloadPdf(printFormat),
                          "data-ocid": "quote_detail.download_retry_button",
                          children: "Reintentar"
                        }
                      )
                    ]
                  }
                ) : null
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                "data-ocid": "quote_detail.totals.panel",
                className: "gap-0 rounded-lg py-0 shadow-none",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm font-semibold tracking-tight", children: "Totales" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 px-5 py-5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Repuestos" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(BigInt(liveTotals.partsSubtotal)) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Servicios" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(BigInt(liveTotals.servicesSubtotal)) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(BigInt(liveTotals.subtotal)) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Descuento" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail", children: [
                        "−",
                        formatMoney(BigInt(liveTotals.discount))
                      ] })
                    ] }),
                    isIvaResponsible ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                        "Impuesto (",
                        formatTaxRate(BigInt(liveTotals.taxRate)),
                        ")"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(BigInt(liveTotals.tax)) })
                    ] }) : null,
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: "Total" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          "data-ocid": "quote_detail.totals.total",
                          className: "data-rail text-lg font-semibold text-primary",
                          children: formatMoney(BigInt(liveTotals.total))
                        }
                      )
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Receipt,
                  {
                    className: "size-4 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                "Resumen"
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2 px-5 py-5 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Partidas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatNumber(partLines.length + serviceLines.length) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Estado" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    StatusBadge,
                    {
                      label: QUOTE_STATUS_LABELS[status],
                      tone: QUOTE_STATUS_TONE[status]
                    }
                  )
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: deleteOpen, onOpenChange: setDeleteOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { "data-ocid": "quote_detail.delete_dialog", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "¿Eliminar esta cotización?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Esta acción no se puede deshacer. La cotización se quitará de forma permanente del registro." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { "data-ocid": "quote_detail.delete_cancel_button", children: "Cancelar" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              AlertDialogAction,
              {
                "data-ocid": "quote_detail.delete_confirm_button",
                onClick: handleDelete,
                className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                children: "Eliminar"
              }
            )
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: convertOpen, onOpenChange: setConvertOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { "data-ocid": "quote_detail.convert_dialog", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Convertir cotización" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Conserva el cliente, la moto y las partidas. Elige el destino de la conversión." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "convert-method", children: "Método de pago (para factura)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: paymentMethod,
                  onValueChange: (value) => setPaymentMethod(value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        id: "convert-method",
                        "aria-label": "Método de pago",
                        "data-ocid": "quote_detail.convert_method_select",
                        className: "w-full",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: PAYMENT_METHOD_LABELS[option] }, option)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: handleConvertToOrder,
                  disabled: convertToOrder.isPending,
                  "data-ocid": "quote_detail.convert_order_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-4", "aria-hidden": "true" }),
                    convertToOrder.isPending ? "Creando…" : "Orden de taller"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: handleConvertToInvoice,
                  disabled: convertToInvoice.isPending,
                  "data-ocid": "quote_detail.convert_invoice_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "size-4", "aria-hidden": "true" }),
                    convertToInvoice.isPending ? "Generando…" : "Factura"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { "data-ocid": "quote_detail.convert_cancel_button", children: "Cancelar" }) })
        ] }) }),
        !isNew && quote ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          NotifyCustomerDialog,
          {
            open: notifyOpen,
            onOpenChange: setNotifyOpen,
            customerId: quote.customerId,
            customerName: (selectedCustomer == null ? void 0 : selectedCustomer.name) ?? `Cliente #${quote.customerId.toString()}`,
            customerEmail: ((_c = selectedCustomer == null ? void 0 : selectedCustomer.email) == null ? void 0 : _c.trim()) ? selectedCustomer.email : null,
            source: NotificationSource.quote,
            referenceId: quote.id,
            defaultSubject: `Estado de tu cotización ${quote.quoteNumber}`,
            defaultMessage: `Hola ${(selectedCustomer == null ? void 0 : selectedCustomer.name) ?? "cliente"}, te compartimos el estado actual de tu cotización ${quote.quoteNumber}. Si deseas aprobarla o tienes alguna duda sobre las partidas, respóndenos a este correo y con gusto te ayudamos.`
          }
        ) : null
      ]
    }
  );
}
export {
  QuoteDetailPage,
  QuoteDetailPage as default
};
