import { av as ImportRowStatus, j as jsxRuntimeExports, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, ae as cn, T as TriangleAlert, aw as CircleCheck, $ as DialogFooter, B as Button, ah as LoaderCircle, k as useBackend, al as useMutation, ak as useQueryClient, u as useRole, q as useNavigate, r as useSearch, s as reactExports, l as useQuery, X, t as Search, v as Input, n as formatNumber, o as PartSort, d as Boxes, L as Link, x as formatMoney, D as ChevronRight, ar as ue, w as Badge } from "./index-CzQEXdHP.js";
import { C as CsvTransfer } from "./CsvTransfer-CksoJ4aZ.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { d as downloadXlsx } from "./xlsx-CMU5GsD8.js";
import { E as Eraser } from "./eraser-C3o97rGf.js";
import { P as Plus } from "./plus-BM-BDOEL.js";
import { R as RotateCcw } from "./rotate-ccw-B7Gc93ig.js";
import { P as Pencil } from "./pencil-Vues_1SE.js";
import { C as ChevronLeft } from "./chevron-left-CY0scwou.js";
import { A as ArrowUp, a as ArrowDown } from "./arrow-up-DeDACNnx.js";
import "./upload-DSxuh5Zf.js";
import "./download-6xWfJWG2.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
import "./download-DPgaDAHv.js";
const INVENTORY_CSV_HEADERS = [
  "sku",
  "nombre",
  "categoria",
  "marca",
  "unidad",
  "precio_venta",
  "precio_costo",
  "existencia",
  "umbral"
];
const STATUS_LABEL = {
  [ImportRowStatus.created]: "Creado",
  [ImportRowStatus.updated]: "Actualizado",
  [ImportRowStatus.error]: "Error"
};
const STATUS_TONE = {
  [ImportRowStatus.created]: "accepted",
  [ImportRowStatus.updated]: "sent",
  [ImportRowStatus.error]: "rejected"
};
function InventoryImportDialog({
  open,
  onOpenChange,
  rows,
  result,
  isPending,
  hasError,
  onConfirm
}) {
  const missingSku = rows.filter((row) => row.sku.trim() === "").length;
  const importable = rows.length - missingSku;
  const resultRows = (result == null ? void 0 : result.rows) ?? [];
  const failedRows = resultRows.filter(
    (row) => row.status === ImportRowStatus.error
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "inventory.import_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: result ? "Resultado de la importación" : "Importar inventario" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: result ? "Revisa el detalle por fila. Corrige las filas con error en tu archivo y vuelve a importar." : "Revisa las filas detectadas antes de confirmar. Las filas sin SKU se omiten." })
        ] }),
        result ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "inventory.import_summary",
              className: "flex flex-wrap items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-accepted", children: [
                  result.created.toString(),
                  " creados"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-sent", children: [
                  result.updated.toString(),
                  " actualizados"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "span",
                  {
                    className: cn(
                      "badge-status",
                      result.failed > 0n ? "badge-rejected" : "badge-neutral"
                    ),
                    children: [
                      result.failed.toString(),
                      " con error"
                    ]
                  }
                )
              ]
            }
          ),
          failedRows.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "mt-0.5 size-4 shrink-0",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              failedRows.length === 1 ? "Una fila no se pudo importar." : `${failedRows.length} filas no se pudieron importar.`,
              " ",
              "Corrige el motivo indicado y vuelve a intentarlo."
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CircleCheck,
              {
                className: "size-4 text-primary",
                "aria-hidden": "true"
              }
            ),
            "Todas las filas se procesaron correctamente."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fila" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "SKU" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Estado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Motivo" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: resultRows.map((row, index) => {
              var _a;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "tr",
                {
                  "data-ocid": `inventory.import_row.${index + 1}`,
                  className: cn(
                    "border-b border-border/60 last:border-0",
                    row.status === ImportRowStatus.error && "bg-destructive/[0.06]"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2 text-muted-foreground", children: row.rowNumber.toString() }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2", children: row.sku || "—" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      StatusBadge,
                      {
                        label: STATUS_LABEL[row.status],
                        tone: STATUS_TONE[row.status]
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: ((_a = row.error) == null ? void 0 : _a.trim()) || "—" })
                  ]
                },
                `${row.rowNumber.toString()}-${row.sku}-${index}`
              );
            }) })
          ] }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-accepted", children: [
              importable,
              " listas"
            ] }),
            missingSku > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-rejected", children: [
              missingSku,
              " sin SKU"
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fila" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "SKU" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Nombre" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Categoría" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Existencia" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Umbral" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row, index) => {
              const rowValid = row.sku.trim() !== "";
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "tr",
                {
                  "data-ocid": `inventory.import_row.${index + 1}`,
                  className: cn(
                    "border-b border-border/60 last:border-0",
                    !rowValid && "bg-destructive/[0.06]"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2 text-muted-foreground", children: row.rowNumber.toString() }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2", children: row.sku.trim() || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "Falta SKU" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: row.name || "—" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: row.category || "—" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2 text-right", children: row.quantity.toString() }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail px-3 py-2 text-right", children: row.lowStockThreshold.toString() })
                  ]
                },
                `${row.rowNumber.toString()}-${row.sku}-${index}`
              );
            }) })
          ] }) }),
          hasError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "inventory.import_error",
              className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
              children: "No se pudo completar la importación. Intenta de nuevo."
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => onOpenChange(false),
              "data-ocid": "inventory.import_close_button",
              children: result ? "Cerrar" : "Cancelar"
            }
          ),
          result ? null : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              disabled: isPending || importable === 0,
              onClick: onConfirm,
              "data-ocid": "inventory.import_confirm_button",
              className: "gap-2",
              children: [
                isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
                isPending ? "Importando…" : `Importar ${importable} repuesto${importable === 1 ? "" : "s"}`
              ]
            }
          )
        ] })
      ]
    }
  ) });
}
function useExportInventoryCsv() {
  const { actor } = useBackend();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.exportInventoryCsv();
    }
  });
}
function useZeroInventory() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.zeroInventory();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      void queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
    }
  });
}
const PAGE_SIZE = 50;
const SORT_LABELS = {
  [PartSort.sku]: "SKU",
  [PartSort.name]: "Nombre",
  [PartSort.createdAt]: "Alta",
  [PartSort.stock]: "Existencia"
};
const SORT_OPTIONS = [
  PartSort.sku,
  PartSort.name,
  PartSort.stock,
  PartSort.createdAt
];
function resolveSearch(raw) {
  const orden = SORT_OPTIONS.includes(raw.orden) ? raw.orden : PartSort.sku;
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    categoria: typeof raw.categoria === "string" ? raw.categoria : "",
    marca: typeof raw.marca === "string" ? raw.marca : "",
    bajo: raw.bajo === true || raw.bajo === "true",
    orden,
    dir: raw.dir === "desc" ? "desc" : "asc",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1
  };
}
function partsQueryKey(search) {
  return [
    `q=${search.q}`,
    `categoria=${search.categoria}`,
    `marca=${search.marca}`,
    `bajo=${search.bajo ? 1 : 0}`,
    `orden=${search.orden}`,
    `dir=${search.dir}`,
    `pagina=${search.pagina}`
  ].join("&");
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
      className: cn(align === "right" && "text-right"),
      "aria-sort": active ? dir === "asc" ? "ascending" : "descending" : "none",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onSort(field),
          "data-ocid": `inventory.sort.${field}`,
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
function StockCell({ part }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2", children: [
    part.lowStock ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Badge,
      {
        variant: "outline",
        "data-ocid": "inventory.low_stock_badge",
        className: "gap-1 border-warning/50 bg-warning/15 font-mono text-[10px] uppercase tracking-wider text-warning",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3", "aria-hidden": "true" }),
          "Bajo"
        ]
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-sm font-medium", children: formatNumber(part.totalStock) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: part.unit })
  ] });
}
const EMPTY_FORM = {
  sku: "",
  name: "",
  category: "",
  brand: "",
  unit: "pza",
  salePrice: "",
  costPrice: "",
  lowStockThreshold: "0"
};
function toCents(value) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(Math.round(parsed * 100));
}
function fromCents(value) {
  if (value === void 0) return "";
  return (Number(value) / 100).toFixed(2);
}
function toWhole(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}
function parseAmount(value) {
  const raw = (value ?? "").trim();
  if (raw === "") return 0n;
  const normalized = raw.includes(",") && raw.lastIndexOf(",") > raw.lastIndexOf(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(Math.round(parsed * 100));
}
function partToCsvRow(part) {
  return {
    sku: part.sku,
    nombre: part.name,
    categoria: part.category,
    marca: part.brand,
    unidad: part.unit,
    precio_venta: fromCents(part.salePrice),
    precio_costo: fromCents(part.costPrice),
    existencia: part.totalStock.toString(),
    umbral: part.lowStockThreshold.toString()
  };
}
function inventoryCsvRowToCsvRow(row) {
  return {
    sku: row.sku,
    nombre: row.name,
    categoria: row.category,
    marca: row.brand,
    unidad: row.unit,
    precio_venta: fromCents(row.salePrice),
    precio_costo: fromCents(row.costPrice),
    existencia: row.quantity.toString(),
    umbral: row.lowStockThreshold.toString()
  };
}
function csvRowToImportRow(row, index) {
  return {
    rowNumber: BigInt(index + 1),
    sku: (row.sku ?? "").trim(),
    name: (row.nombre ?? "").trim(),
    category: (row.categoria ?? "").trim(),
    brand: (row.marca ?? "").trim(),
    unit: (row.unidad ?? "").trim() || "pza",
    salePrice: parseAmount(row.precio_venta),
    costPrice: parseAmount(row.precio_costo),
    quantity: toWhole(row.existencia ?? ""),
    lowStockThreshold: toWhole(row.umbral ?? "")
  };
}
function PartFormDialog({
  open,
  onOpenChange,
  part,
  isAdmin
}) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      part ? {
        sku: part.sku,
        name: part.name,
        category: part.category,
        brand: part.brand,
        unit: part.unit,
        salePrice: fromCents(part.salePrice),
        costPrice: fromCents(part.costPrice),
        lowStockThreshold: part.lowStockThreshold.toString()
      } : EMPTY_FORM
    );
  }, [open, part]);
  const mutation = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return part ? actor.updatePart(part.id, input) : actor.createPart(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      ue.success(part ? "Repuesto actualizado" : "Repuesto registrado");
      onOpenChange(false);
    },
    onError: () => {
      setError("No se pudo guardar el repuesto. Intenta de nuevo.");
    }
  });
  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("El SKU y el nombre son obligatorios.");
      return;
    }
    setError(null);
    mutation.mutate({
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      unit: form.unit.trim() || "pza",
      salePrice: toCents(form.salePrice),
      costPrice: toCents(form.costPrice),
      lowStockThreshold: toWhole(form.lowStockThreshold)
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "inventory.part_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: part ? "Editar repuesto" : "Nuevo repuesto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: part ? "Actualiza los datos del catálogo. Los cambios aplican de inmediato." : "Registra un repuesto en el catálogo del taller." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-sku", children: "SKU / Código" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-sku",
                  value: form.sku,
                  onChange: (event) => update("sku", event.target.value),
                  placeholder: "REP-0001",
                  className: "data-rail",
                  "data-ocid": "inventory.sku_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-name", children: "Nombre" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-name",
                  value: form.name,
                  onChange: (event) => update("name", event.target.value),
                  placeholder: "Balata de freno delantera",
                  "data-ocid": "inventory.name_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-category", children: "Categoría" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-category",
                  value: form.category,
                  onChange: (event) => update("category", event.target.value),
                  placeholder: "Frenos",
                  "data-ocid": "inventory.category_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-brand", children: "Marca" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-brand",
                  value: form.brand,
                  onChange: (event) => update("brand", event.target.value),
                  placeholder: "Brembo",
                  "data-ocid": "inventory.brand_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-unit", children: "Unidad" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-unit",
                  value: form.unit,
                  onChange: (event) => update("unit", event.target.value),
                  placeholder: "pza",
                  "data-ocid": "inventory.unit_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-threshold", children: "Umbral de stock bajo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-threshold",
                  type: "number",
                  min: "0",
                  step: "1",
                  value: form.lowStockThreshold,
                  onChange: (event) => update("lowStockThreshold", event.target.value),
                  className: "data-rail",
                  "data-ocid": "inventory.threshold_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-sale", children: "Precio de venta (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-sale",
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: form.salePrice,
                  onChange: (event) => update("salePrice", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "inventory.sale_price_input"
                }
              )
            ] }),
            isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "part-cost", children: "Precio de costo (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "part-cost",
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: form.costPrice,
                  onChange: (event) => update("costPrice", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "inventory.cost_price_input"
                }
              )
            ] }) : null
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "inventory.form_error",
              className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
              children: error
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => onOpenChange(false),
                "data-ocid": "inventory.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: mutation.isPending,
                "data-ocid": "inventory.submit_button",
                children: mutation.isPending ? "Guardando…" : part ? "Guardar cambios" : "Registrar repuesto"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function ZeroInventoryDialog({
  open,
  onOpenChange,
  onZeroed
}) {
  const zeroInventory = useZeroInventory();
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);
  const handleConfirm = () => {
    setError(null);
    zeroInventory.mutate(void 0, {
      onSuccess: (result) => {
        onZeroed(result.affected);
        ue.success(
          result.affected === 1n ? "Se puso en ceros 1 repuesto." : `Se pusieron en ceros ${result.affected.toString()} repuestos.`
        );
        onOpenChange(false);
      },
      onError: () => {
        setError("No se pudo poner el inventario en ceros. Intenta de nuevo.");
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "inventory.zero_dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Poner inventario en ceros" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Esta acción establece en cero la existencia de todos los repuestos del catálogo. No se puede deshacer." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TriangleAlert,
        {
          className: "mt-0.5 size-4 shrink-0 text-destructive",
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: "Se perderán las existencias actuales de todos los repuestos. Esta operación es irreversible." })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        "data-ocid": "inventory.zero_error",
        className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        children: error
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => onOpenChange(false),
          disabled: zeroInventory.isPending,
          "data-ocid": "inventory.zero_cancel_button",
          children: "Cancelar"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "destructive",
          onClick: handleConfirm,
          disabled: zeroInventory.isPending,
          "data-ocid": "inventory.zero_confirm_button",
          className: "gap-2",
          children: [
            zeroInventory.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
            zeroInventory.isPending ? "Procesando…" : "Poner en ceros"
          ]
        }
      )
    ] })
  ] }) });
}
function InventoryPage() {
  var _a, _b;
  const { actor, isFetching } = useBackend();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rawSearch = useSearch({ strict: false });
  const search = reactExports.useMemo(() => resolveSearch(rawSearch), [rawSearch]);
  const [term, setTerm] = reactExports.useState(search.q);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [zeroDialogOpen, setZeroDialogOpen] = reactExports.useState(false);
  const [zeroedCount, setZeroedCount] = reactExports.useState(null);
  const [editing, setEditing] = reactExports.useState(null);
  const [importRows, setImportRows] = reactExports.useState(
    null
  );
  const [importResult, setImportResult] = reactExports.useState(null);
  const [importFailed, setImportFailed] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setTerm(search.q);
  }, [search.q]);
  const applySearch = reactExports.useCallback(
    (patch) => {
      void navigate({
        to: "/inventario",
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
  const partsQuery = useQuery({
    queryKey: ["parts", partsQueryKey(search)],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listPartsDir(
        {
          search: search.q || void 0,
          category: search.categoria || void 0,
          brand: search.marca || void 0,
          lowStockOnly: search.bajo || void 0
        },
        search.orden,
        search.dir === "desc",
        BigInt((search.pagina - 1) * PAGE_SIZE),
        BigInt(PAGE_SIZE)
      );
    },
    enabled: !!actor && !isFetching
  });
  const facetsQuery = useQuery({
    queryKey: ["parts", "facets"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listPartFacets();
    },
    enabled: !!actor && !isFetching,
    // The facet lists only change when the catalog changes, so they are kept
    // for the session and refreshed by the part mutations' invalidation.
    staleTime: Number.POSITIVE_INFINITY
  });
  const categories = reactExports.useMemo(
    () => {
      var _a2;
      return [...((_a2 = facetsQuery.data) == null ? void 0 : _a2.categories) ?? []].filter((value) => value.trim() !== "").sort((a, b) => a.localeCompare(b, "es"));
    },
    [facetsQuery.data]
  );
  const brands = reactExports.useMemo(
    () => {
      var _a2;
      return [...((_a2 = facetsQuery.data) == null ? void 0 : _a2.brands) ?? []].filter((value) => value.trim() !== "").sort((a, b) => a.localeCompare(b, "es"));
    },
    [facetsQuery.data]
  );
  const items = ((_a = partsQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = partsQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const loadedCount = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search.q !== "" || search.categoria !== "" || search.marca !== "" || search.bajo;
  const handleSort = (field) => {
    if (search.orden === field) {
      applySearch({ dir: search.dir === "asc" ? "desc" : "asc", pagina: 1 });
    } else {
      applySearch({ orden: field, dir: "asc", pagina: 1 });
    }
  };
  const clearFilters = () => {
    setTerm("");
    void navigate({ to: "/inventario", search: {}, replace: true });
  };
  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (part) => {
    setEditing(part);
    setDialogOpen(true);
  };
  const exportRows = reactExports.useMemo(() => items.map(partToCsvRow), [items]);
  const exportInventory = useExportInventoryCsv();
  const handleExport = async () => {
    try {
      const rows = await exportInventory.mutateAsync();
      await downloadXlsx(
        "inventario",
        "Inventario",
        INVENTORY_CSV_HEADERS,
        rows.map(inventoryCsvRowToCsvRow)
      );
    } catch {
      ue.error("No se pudo exportar el inventario. Intenta de nuevo.");
    }
  };
  const handleImport = (rows) => {
    if (rows.length === 0) {
      ue.error("El archivo no contiene filas válidas.");
      return;
    }
    setImportResult(null);
    setImportFailed(false);
    setImportRows(rows.map(csvRowToImportRow));
  };
  const confirmImport = async () => {
    if (!actor || !importRows) return;
    const payload = importRows.filter((row) => row.sku !== "");
    if (payload.length === 0) {
      ue.error("Ninguna fila tiene SKU. Corrige el archivo y reintenta.");
      return;
    }
    setImportFailed(false);
    try {
      const result = await actor.importInventoryCsv(payload);
      setImportResult(result);
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      void queryClient.invalidateQueries({
        queryKey: ["inventory-valuation"]
      });
      ue.success(
        `${result.created.toString()} creados · ${result.updated.toString()} actualizados · ${result.failed.toString()} con error`
      );
    } catch {
      setImportFailed(true);
      ue.error("No se pudo completar la importación.");
    }
  };
  const closeImport = () => {
    setImportRows(null);
    setImportResult(null);
    setImportFailed(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "inventory.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Almacén" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Inventario de repuestos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Catálogo con existencias por lote, precios y alertas de stock bajo." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CsvTransfer,
              {
                headers: INVENTORY_CSV_HEADERS,
                rows: exportRows,
                onImport: handleImport,
                onExport: handleExport,
                isExporting: exportInventory.isPending,
                filename: "inventario",
                sheetName: "Inventario",
                ocid: "inventory.csv",
                disabled: importRows !== null
              }
            ),
            isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setZeroDialogOpen(true),
                "data-ocid": "inventory.zero_button",
                className: "gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Eraser, { className: "size-4", "aria-hidden": "true" }),
                  "Poner inventario en ceros"
                ]
              }
            ) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: openCreate,
                "data-ocid": "inventory.new_part_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Nuevo repuesto"
                ]
              }
            )
          ] })
        ] }),
        zeroedCount !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "output",
          {
            "data-ocid": "inventory.zero_success",
            "aria-live": "polite",
            className: "flex items-start justify-between gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CircleCheck,
                  {
                    className: "mt-0.5 size-4 shrink-0 text-success",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Inventario puesto en ceros" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: zeroedCount === 1n ? "Se puso en ceros 1 repuesto." : `Se pusieron en ceros ${zeroedCount.toString()} repuestos.` })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "icon",
                  onClick: () => setZeroedCount(null),
                  "aria-label": "Cerrar aviso",
                  "data-ocid": "inventory.zero_success_close_button",
                  className: "shrink-0 text-muted-foreground",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
                }
              )
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "section",
          {
            "data-ocid": "inventory.filters",
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
                    value: term,
                    onChange: (event) => setTerm(event.target.value),
                    placeholder: "Buscar por nombre o SKU…",
                    "aria-label": "Buscar repuestos",
                    className: "pl-9",
                    "data-ocid": "inventory.search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: search.categoria || "all",
                  onValueChange: (value) => applySearch({
                    categoria: value === "all" ? "" : value,
                    pagina: 1
                  }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        className: "w-[170px]",
                        "aria-label": "Filtrar por categoría",
                        "data-ocid": "inventory.category_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Categoría" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas las categorías" }),
                      categories.map((category) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: category, children: category }, category))
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: search.marca || "all",
                  onValueChange: (value) => applySearch({ marca: value === "all" ? "" : value, pagina: 1 }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        className: "w-[160px]",
                        "aria-label": "Filtrar por marca",
                        "data-ocid": "inventory.brand_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Marca" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas las marcas" }),
                      brands.map((brand) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: brand, children: brand }, brand))
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: search.bajo ? "default" : "outline",
                  onClick: () => applySearch({ bajo: !search.bajo, pagina: 1 }),
                  "aria-pressed": search.bajo,
                  "data-ocid": "inventory.low_stock_toggle",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
                    "Solo stock bajo"
                  ]
                }
              ),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: clearFilters,
                  "data-ocid": "inventory.clear_filters_button",
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: partsQuery.isLoading ? "Cargando…" : `${formatNumber(total)} repuesto${total === 1 ? "" : "s"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline", children: "Orden" }),
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
                        className: "w-[150px]",
                        "aria-label": "Ordenar por",
                        "data-ocid": "inventory.sort_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: SORT_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: SORT_LABELS[option] }, option)) })
                  ]
                }
              )
            ] })
          ] }),
          partsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "inventory.error_state",
              className: "flex flex-col items-center gap-3 px-6 py-14 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-6 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el inventario." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => void partsQuery.refetch({ cancelRefetch: true }),
                    "data-ocid": "inventory.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : partsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "inventory.loading_state", className: "space-y-2 p-4", children: Array.from({ length: 6 }, (_, index) => `row-${index}`).map(
            (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id)
          ) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "inventory.empty_state",
              className: "flex flex-col items-center gap-3 px-6 py-16 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Boxes,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay repuestos registrados" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta la búsqueda o los filtros para encontrar repuestos." : "Registra el primer repuesto para comenzar a controlar existencias." })
                ] }),
                hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: clearFilters,
                    "data-ocid": "inventory.empty_clear_button",
                    children: "Limpiar filtros"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    onClick: openCreate,
                    "data-ocid": "inventory.empty_new_button",
                    className: "gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                      "Nuevo repuesto"
                    ]
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: PartSort.sku,
                  label: "SKU",
                  active: search.orden === PartSort.sku,
                  dir: search.dir,
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: PartSort.name,
                  label: "Nombre",
                  active: search.orden === PartSort.name,
                  dir: search.dir,
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Categoría" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Marca" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SortHeader,
                {
                  field: PartSort.stock,
                  label: "Existencia",
                  active: search.orden === PartSort.stock,
                  dir: search.dir,
                  align: "right",
                  onSort: handleSort
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "P. venta" }),
              isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "P. costo" }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-12 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: items.map((part, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TableRow,
              {
                "data-ocid": `inventory.row.${index + 1}`,
                className: cn(part.lowStock && "bg-warning/[0.04]"),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Link,
                    {
                      to: "/inventario/$id",
                      params: { id: part.id.toString() },
                      "data-ocid": `inventory.link.${index + 1}`,
                      className: "data-rail text-sm font-medium text-primary underline-offset-4 hover:underline",
                      children: part.sku
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[260px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: part.name }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: part.category || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: part.brand || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(StockCell, { part }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right", children: formatMoney(part.salePrice) }),
                  isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(part.costPrice) }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "icon",
                      onClick: () => openEdit(part),
                      "aria-label": `Editar ${part.name}`,
                      "data-ocid": `inventory.edit_button.${index + 1}`,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-4", "aria-hidden": "true" })
                    }
                  ) })
                ]
              },
              part.id.toString()
            )) })
          ] }),
          !partsQuery.isLoading && !partsQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Mostrando ",
              formatNumber(loadedCount),
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
                  "data-ocid": "inventory.pagination_prev",
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
                  "data-ocid": "inventory.pagination_next",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PartFormDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            part: editing,
            isAdmin
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ZeroInventoryDialog,
          {
            open: zeroDialogOpen,
            onOpenChange: setZeroDialogOpen,
            onZeroed: setZeroedCount
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          InventoryImportDialog,
          {
            open: importRows !== null,
            onOpenChange: (open) => {
              if (!open) closeImport();
            },
            rows: importRows ?? [],
            result: importResult,
            isPending: false,
            hasError: importFailed,
            onConfirm: () => void confirmImport()
          }
        )
      ]
    }
  );
}
export {
  InventoryPage
};
