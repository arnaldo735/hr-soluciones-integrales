import { q as useNavigate, r as useSearch, s as reactExports, j as jsxRuntimeExports, w as Badge, n as formatNumber, t as Search, v as Input, aC as MotorcycleSort, B as Button, T as TriangleAlert, L as Link, D as ChevronRight, G as Bike, ae as cn } from "./index-CzQEXdHP.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { c as useMotorcyclesPage } from "./use-customers-Dk1G98vS.js";
import { A as ArrowUp, a as ArrowDown } from "./arrow-up-DeDACNnx.js";
import { R as RotateCcw } from "./rotate-ccw-B7Gc93ig.js";
import { P as Phone } from "./phone-B-73ly9n.js";
import { C as ChevronLeft } from "./chevron-left-CY0scwou.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
const PAGE_SIZE = 50;
const SORT_LABELS = {
  [MotorcycleSort.plate]: "Placa",
  [MotorcycleSort.brand]: "Marca",
  [MotorcycleSort.year]: "Año",
  [MotorcycleSort.customerName]: "Cliente"
};
const SORT_OPTIONS = [
  MotorcycleSort.plate,
  MotorcycleSort.brand,
  MotorcycleSort.year,
  MotorcycleSort.customerName
];
function resolveSearch(raw) {
  const orden = SORT_OPTIONS.includes(raw.orden) ? raw.orden : MotorcycleSort.plate;
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    marca: typeof raw.marca === "string" ? raw.marca : "",
    orden,
    dir: raw.dir === "desc" ? "desc" : "asc",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1
  };
}
const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, i) => `motorcycle-skeleton-${i}`
);
function MotorcycleTableSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "motorcycles.loading_state", className: "space-y-2 p-4", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id)) });
}
function EmptyState({ hasFilters }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "motorcycles.empty_state",
      className: "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "size-5 text-muted-foreground", "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay motos registradas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ninguna moto coincide con la búsqueda o los filtros. Ajusta los criterios e intenta de nuevo." : "Registra motos desde la ficha de cada cliente para verlas aquí." })
        ] })
      ]
    }
  );
}
function SortHeader({
  field,
  label,
  active,
  dir,
  align = "left",
  onSort
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    TableHead,
    {
      className: align === "right" ? "text-right" : void 0,
      "aria-sort": active ? dir === "asc" ? "ascending" : "descending" : "none",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onSort(field),
          "data-ocid": `motorcycles.sort.${field}`,
          className: cn(
            "inline-flex items-center gap-1 rounded-sm font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active ? "text-primary" : "text-muted-foreground",
            align === "right" && "flex-row-reverse"
          ),
          children: [
            label,
            active ? dir === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "size-3", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "size-3", "aria-hidden": "true" }) : null
          ]
        }
      )
    }
  );
}
function MotorcyclesPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const search = reactExports.useMemo(() => resolveSearch(rawSearch), [rawSearch]);
  const [term, setTerm] = reactExports.useState(search.q);
  reactExports.useEffect(() => {
    setTerm(search.q);
  }, [search.q]);
  const applySearch = reactExports.useCallback(
    (patch) => {
      void navigate({
        to: "/motos",
        search: (prev) => {
          const next = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === void 0) {
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
  const offset = (search.pagina - 1) * PAGE_SIZE;
  const { data, isLoading, isError, refetch } = useMotorcyclesPage(
    {
      search: search.q || void 0,
      brand: search.marca || void 0
    },
    search.orden,
    search.dir,
    offset,
    PAGE_SIZE
  );
  const items = (data == null ? void 0 : data.items) ?? [];
  const total = Number((data == null ? void 0 : data.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search.q.trim() !== "" || search.marca.trim() !== "";
  const handleSort = reactExports.useCallback(
    (field) => {
      if (search.orden === field) {
        applySearch({
          dir: search.dir === "asc" ? "desc" : "asc",
          pagina: 1
        });
      } else {
        applySearch({ orden: field, dir: "asc", pagina: 1 });
      }
    },
    [search.orden, search.dir, applySearch]
  );
  const clearFilters = reactExports.useCallback(() => {
    setTerm("");
    void navigate({ to: "/motos", search: {}, replace: true });
  }, [navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "motorcycles.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Taller" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Motocicletas" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Listado paginado de motos con el cliente propietario incluido en la misma respuesta. Busca por placa, marca, modelo o cliente." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Badge,
            {
              variant: "outline",
              "data-ocid": "motorcycles.count_badge",
              className: "data-rail border-border bg-background text-muted-foreground",
              children: isLoading ? "…" : `${formatNumber(total)} motos`
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "section",
          {
            "data-ocid": "motorcycles.filters",
            className: "rounded-lg border border-border bg-card p-3 shadow-subtle",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
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
                    type: "search",
                    value: term,
                    onChange: (event) => setTerm(event.target.value),
                    placeholder: "Buscar por placa, marca, modelo o cliente…",
                    "aria-label": "Buscar motocicletas",
                    className: "pl-9",
                    "data-ocid": "motorcycles.search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: search.marca,
                  onChange: (event) => applySearch({ marca: event.target.value, pagina: 1 }),
                  placeholder: "Marca",
                  "aria-label": "Filtrar por marca",
                  "data-ocid": "motorcycles.brand_input"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: search.orden,
                  onValueChange: (value) => applySearch({ orden: value, pagina: 1 }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        size: "sm",
                        className: "w-[170px]",
                        "aria-label": "Ordenar por",
                        "data-ocid": "motorcycles.sort_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: SORT_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: SORT_LABELS[option] }, option)) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => applySearch({
                    dir: search.dir === "asc" ? "desc" : "asc",
                    pagina: 1
                  }),
                  "aria-label": search.dir === "asc" ? "Orden ascendente, cambiar a descendente" : "Orden descendente, cambiar a ascendente",
                  "data-ocid": "motorcycles.sort_dir_button",
                  className: "gap-1.5",
                  children: [
                    search.dir === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "size-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "size-4", "aria-hidden": "true" }),
                    search.dir === "asc" ? "Asc" : "Desc"
                  ]
                }
              ),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: clearFilters,
                  "data-ocid": "motorcycles.clear_filters_button",
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
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(MotorcycleTableSkeleton, {}) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "motorcycles.error_state",
              className: "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-5 text-destructive",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No se pudo cargar el listado de motos" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Revisa tu conexión e inténtalo de nuevo." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => void refetch({ cancelRefetch: true }),
                    "data-ocid": "motorcycles.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { hasFilters }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "motorcycles.table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: MotorcycleSort.plate,
                  label: "Placa",
                  active: search.orden === MotorcycleSort.plate,
                  dir: search.dir,
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: MotorcycleSort.brand,
                  label: "Marca",
                  active: search.orden === MotorcycleSort.brand,
                  dir: search.dir,
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Modelo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: MotorcycleSort.year,
                  label: "Año",
                  active: search.orden === MotorcycleSort.year,
                  dir: search.dir,
                  align: "right",
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Kilometraje" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: MotorcycleSort.customerName,
                  label: "Cliente",
                  active: search.orden === MotorcycleSort.customerName,
                  dir: search.dir,
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Teléfono" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: items.map((moto, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TableRow,
              {
                "data-ocid": `motorcycles.row.${index + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail font-medium", children: moto.plate }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: moto.brand || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[220px] truncate", children: moto.model || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: moto.year > 0n ? moto.year.toString() : "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "data-rail text-right text-muted-foreground", children: [
                    formatNumber(moto.mileage),
                    " km"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Link,
                    {
                      to: "/clientes/$id",
                      params: { id: moto.customerId.toString() },
                      "data-ocid": `motorcycles.customer_link.${index + 1}`,
                      className: "font-medium text-foreground underline-offset-4 hover:text-primary hover:underline",
                      children: moto.customerName || "—"
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-muted-foreground", children: moto.customerPhone ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "size-3.5", "aria-hidden": "true" }),
                    moto.customerPhone
                  ] }) : "—" })
                ]
              },
              moto.id.toString()
            )) })
          ] }),
          !isLoading && !isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Mostrando ",
              formatNumber(items.length),
              " de ",
              formatNumber(total)
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
                  "data-ocid": "motorcycles.pagination_prev",
                  className: "gap-1",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4", "aria-hidden": "true" }),
                    "Anterior"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                "Página ",
                search.pagina,
                " de ",
                totalPages
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  disabled: search.pagina >= totalPages,
                  onClick: () => applySearch({ pagina: search.pagina + 1 }),
                  "data-ocid": "motorcycles.pagination_next",
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
      ]
    }
  );
}
export {
  MotorcyclesPage
};
