import { K as createLucideIcon, k as useBackend, q as useNavigate, r as useSearch, s as reactExports, j as jsxRuntimeExports, B as Button, h as FileSpreadsheet, t as Search, v as Input, aB as CustomerSort, w as Badge, n as formatNumber, T as TriangleAlert, D as ChevronRight, ar as ue, U as Users, L as Link, G as Bike } from "./index-CzQEXdHP.js";
import { u as useContactImport, C as ContactImportDialog, b as buildContactImportRows, a as CUSTOMER_CSV_HEADERS } from "./use-contact-import-Bt9A9EHu.js";
import { p as parseCsv } from "./CsvTransfer-CksoJ4aZ.js";
import { C as CustomerFormDialog } from "./CustomerFormDialog-CNcRZ4AG.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { a as useExportCustomersAggregated, b as useCustomersPage, C as CUSTOMERS_PAGE_SIZE } from "./use-customers-Dk1G98vS.js";
import { r as readSpreadsheet, a as downloadXlsxTemplate, d as downloadXlsx } from "./xlsx-CMU5GsD8.js";
import { U as Upload } from "./upload-DSxuh5Zf.js";
import { D as Download } from "./download-6xWfJWG2.js";
import { A as ArrowUp, a as ArrowDown } from "./arrow-up-DeDACNnx.js";
import { C as ChevronLeft } from "./chevron-left-CY0scwou.js";
import { P as Plus } from "./plus-BM-BDOEL.js";
import { P as Pencil } from "./pencil-Vues_1SE.js";
import "./StatusBadge-jkc1GroD.js";
import "./label-Bo6gHS3t.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
import "./download-DPgaDAHv.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["line", { x1: "19", x2: "19", y1: "8", y2: "14", key: "1bvyxn" }],
  ["line", { x1: "22", x2: "16", y1: "11", y2: "11", key: "1shjgl" }]
];
const UserPlus = createLucideIcon("user-plus", __iconNode);
function customerToCsvRow(customer, motorcycles) {
  return {
    nombre: customer.name,
    telefono: customer.phone,
    documento: customer.document ?? "",
    direccion: customer.address ?? "",
    correo: customer.email ?? "",
    motos: motorcycles
  };
}
const SORT_LABELS = {
  [CustomerSort.name]: "Nombre",
  [CustomerSort.createdAt]: "Fecha de alta",
  [CustomerSort.motorcycleCount]: "Cantidad de motos"
};
const SORT_OPTIONS = [
  CustomerSort.name,
  CustomerSort.createdAt,
  CustomerSort.motorcycleCount
];
function resolveSearch(raw) {
  const orden = SORT_OPTIONS.includes(raw.orden) ? raw.orden : CustomerSort.name;
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    orden,
    dir: raw.dir === "desc" ? "desc" : "asc",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1
  };
}
const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, i) => `customer-skeleton-${i}`
);
function CustomerTableSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "customers.loading_state", className: "space-y-2 p-4", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id)) });
}
function EmptyState({ hasSearch }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "customers.empty_state",
      className: "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "size-5 text-muted-foreground", "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasSearch ? "Sin resultados" : "Aún no hay clientes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasSearch ? "Ningún cliente coincide con la búsqueda. Prueba con otro nombre, teléfono o placa." : "Registra tu primer cliente para vincular sus motos y órdenes de taller." })
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
          "data-ocid": `customers.sort.${field}`,
          className: [
            "inline-flex items-center gap-1 rounded-sm font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
            "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active ? "text-primary" : "text-muted-foreground",
            align === "right" ? "flex-row-reverse" : ""
          ].filter(Boolean).join(" "),
          children: [
            label,
            active ? dir === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "size-3", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "size-3", "aria-hidden": "true" }) : null
          ]
        }
      )
    }
  );
}
const CustomerRow = reactExports.memo(function CustomerRow2({
  customer,
  index,
  onEdit
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { "data-ocid": `customers.row.${index + 1}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/clientes/$id",
        params: { id: customer.id.toString() },
        "data-ocid": `customers.link.${index + 1}`,
        className: "font-medium text-foreground underline-offset-4 hover:text-primary hover:underline",
        children: customer.name
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-muted-foreground", children: customer.phone }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "hidden max-w-[16rem] truncate text-muted-foreground md:table-cell", children: customer.email ?? "—" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail hidden text-muted-foreground lg:table-cell", children: customer.document ?? "—" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "size-3.5", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail tabular", children: formatNumber(customer.motorcycleCount) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "icon",
          "aria-label": `Editar ${customer.name}`,
          onClick: () => onEdit(customer),
          "data-ocid": `customers.edit_button.${index + 1}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-4", "aria-hidden": "true" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          asChild: true,
          variant: "ghost",
          size: "icon",
          "data-ocid": `customers.open_button.${index + 1}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Link,
            {
              to: "/clientes/$id",
              params: { id: customer.id.toString() },
              "aria-label": `Abrir ficha de ${customer.name}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
            }
          )
        }
      )
    ] }) })
  ] });
});
function CustomersPage() {
  const { actor } = useBackend();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const search = reactExports.useMemo(() => resolveSearch(rawSearch), [rawSearch]);
  const [term, setTerm] = reactExports.useState(search.q);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [importRows, setImportRows] = reactExports.useState(null);
  const [importResult, setImportResult] = reactExports.useState(
    null
  );
  const [importFailed, setImportFailed] = reactExports.useState(false);
  const [isExporting, setIsExporting] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const contactImport = useContactImport("customer");
  const exportCustomers = useExportCustomersAggregated();
  reactExports.useEffect(() => {
    setTerm(search.q);
  }, [search.q]);
  const applySearch = reactExports.useCallback(
    (patch) => {
      void navigate({
        to: "/clientes",
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
  const { data, isLoading, isError, refetch } = useCustomersPage(
    search.q,
    search.orden,
    search.dir,
    search.pagina
  );
  const customers = (data == null ? void 0 : data.items) ?? [];
  const total = Number((data == null ? void 0 : data.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const hasSearch = search.q.trim() !== "";
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
  const openCreate = reactExports.useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);
  const openEdit = reactExports.useCallback((customer) => {
    setEditing(customer);
    setDialogOpen(true);
  }, []);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const rows = await exportCustomers.mutateAsync();
      const csvRows = rows.map((row) => {
        const summary = row.motorcycles.map((moto) => `${moto.brand} ${moto.model} (${moto.plate})`).join("; ");
        return customerToCsvRow(row.customer, summary);
      });
      await downloadXlsx("clientes", "Clientes", CUSTOMER_CSV_HEADERS, csvRows);
    } catch {
      ue.error("No se pudo exportar los clientes. Intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };
  const handleDownloadTemplate = async () => {
    await downloadXlsxTemplate(
      "plantilla-clientes",
      "Clientes",
      CUSTOMER_CSV_HEADERS,
      {
        nombre: "María Fernanda Ríos",
        telefono: "310 555 0198",
        documento: "1.020.334.556",
        direccion: "Cra. 45 #26-15, Bogotá",
        correo: "maria.rios@correo.com",
        motos: "Yamaha FZ 2.0 (ABC12D)"
      }
    );
  };
  const handleFile = async (file) => {
    if (!actor) return;
    try {
      const parsed = await readSpreadsheet(file, parseCsv);
      if (parsed.length === 0) {
        ue.error("El archivo no contiene filas válidas.");
        return;
      }
      const existing = await actor.listCustomers(null);
      setImportResult(null);
      setImportFailed(false);
      setImportRows(buildContactImportRows("customer", parsed, existing));
    } catch (error) {
      ue.error(
        error instanceof Error ? error.message : "No se pudo leer el archivo. Verifica el formato e intenta de nuevo."
      );
    }
  };
  const confirmImport = () => {
    if (!importRows) return;
    setImportFailed(false);
    contactImport.mutate(importRows, {
      onSuccess: (result) => {
        setImportResult(result);
        ue.success(
          `${result.created.toString()} creados · ${result.updated.toString()} actualizados · ${result.failed.toString()} con error`
        );
      },
      onError: () => {
        setImportFailed(true);
        ue.error("No se pudo completar la importación.");
      }
    });
  };
  const closeImport = () => {
    setImportRows(null);
    setImportResult(null);
    setImportFailed(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "customers.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Directorio" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Clientes y motos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Busca por nombre, teléfono o placa y abre la ficha del cliente para ver sus motos e historial de órdenes." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
                className: "sr-only",
                "data-ocid": "customers.import_file_input",
                onChange: (event) => {
                  var _a;
                  const file = (_a = event.target.files) == null ? void 0 : _a[0];
                  if (file) void handleFile(file);
                  event.target.value = "";
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => void handleDownloadTemplate(),
                "data-ocid": "customers.template_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileSpreadsheet, { className: "size-4", "aria-hidden": "true" }),
                  "Plantilla"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                disabled: importRows !== null,
                onClick: () => {
                  var _a;
                  return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                },
                "data-ocid": "customers.import_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-4", "aria-hidden": "true" }),
                  "Importar"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                disabled: isExporting,
                onClick: () => void handleExport(),
                "data-ocid": "customers.export_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
                  isExporting ? "Exportando…" : "Exportar"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: openCreate,
                "data-ocid": "customers.open_modal_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "size-4", "aria-hidden": "true" }),
                  "Nuevo cliente"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-border bg-muted/30 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1", children: [
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
                  placeholder: "Buscar por nombre, teléfono o placa…",
                  "aria-label": "Buscar clientes",
                  "data-ocid": "customers.search_input",
                  className: "h-9 pl-9"
                }
              )
            ] }),
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
                      className: "w-[190px]",
                      "aria-label": "Ordenar por",
                      "data-ocid": "customers.sort_select",
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
                "data-ocid": "customers.sort_dir_button",
                className: "gap-1.5",
                children: [
                  search.dir === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "size-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "size-4", "aria-hidden": "true" }),
                  search.dir === "asc" ? "Asc" : "Desc"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                "data-ocid": "customers.count_badge",
                className: "data-rail border-border bg-background text-muted-foreground",
                children: isLoading ? "…" : `${formatNumber(total)} clientes`
              }
            )
          ] }),
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CustomerTableSkeleton, {}) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "customers.error_state",
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
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No se pudo cargar el directorio" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Revisa tu conexión e inténtalo de nuevo." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: () => refetch(),
                    "data-ocid": "customers.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : customers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { hasSearch }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "customers.table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: CustomerSort.name,
                  label: "Cliente",
                  active: search.orden === CustomerSort.name,
                  dir: search.dir,
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Teléfono" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "hidden md:table-cell", children: "Correo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "hidden lg:table-cell", children: "Documento" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: CustomerSort.motorcycleCount,
                  label: "Motos",
                  active: search.orden === CustomerSort.motorcycleCount,
                  dir: search.dir,
                  align: "right",
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-24 px-4 text-right", children: "Acciones" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: customers.map((customer, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              CustomerRow,
              {
                customer,
                index,
                onEdit: openEdit
              },
              customer.id.toString()
            )) })
          ] }),
          !isLoading && !isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Mostrando ",
              formatNumber(customers.length),
              " de",
              " ",
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
                  "data-ocid": "customers.pagination_prev",
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
                  "data-ocid": "customers.pagination_next",
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
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-3", "aria-hidden": "true" }),
          "Las motos se registran desde la ficha de cada cliente."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CustomerFormDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            customer: editing
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ContactImportDialog,
          {
            open: importRows !== null,
            onOpenChange: (open) => {
              if (!open) closeImport();
            },
            kind: "customer",
            rows: importRows ?? [],
            result: importResult,
            isPending: contactImport.isPending,
            hasError: importFailed,
            onConfirm: confirmImport
          }
        )
      ]
    }
  );
}
export {
  CustomersPage
};
