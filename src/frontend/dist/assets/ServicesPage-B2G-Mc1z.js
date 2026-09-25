import { K as createLucideIcon, k as useBackend, u as useRole, ak as useQueryClient, q as useNavigate, r as useSearch, s as reactExports, p as ServiceSort, j as jsxRuntimeExports, B as Button, aA as FolderTree, aw as CircleCheck, X, t as Search, v as Input, n as formatNumber, T as TriangleAlert, W as Wrench, N as NotificationSource, ar as ue, x as formatMoney, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, $ as DialogFooter, ah as LoaderCircle, ae as cn } from "./index-CzQEXdHP.js";
import { C as CsvTransfer } from "./CsvTransfer-CksoJ4aZ.js";
import { D as DataTable } from "./DataTable-CAP1Nt9Z.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-B37TcS0T.js";
import { P as PageHeader } from "./PageHeader-JDKYCqW_.js";
import { u as useServiceCategories, S as ServiceCategoryDialog } from "./ServiceCategoryDialog-BT3gmny-.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Textarea } from "./textarea-C9U8oXYV.js";
import { u as useCustomers } from "./use-customers-Dk1G98vS.js";
import { b as useDeleteService, u as useServices, c as useCreateService, d as useUpdateService, e as useZeroServices } from "./use-services-yKEXS84x.js";
import { E as Eraser } from "./eraser-C3o97rGf.js";
import { P as Plus } from "./plus-BM-BDOEL.js";
import { R as RotateCcw } from "./rotate-ccw-B7Gc93ig.js";
import "./xlsx-CMU5GsD8.js";
import "./download-DPgaDAHv.js";
import "./upload-DSxuh5Zf.js";
import "./download-6xWfJWG2.js";
import "./alert-dialog-BQof8xF8.js";
import "./table-CKrT3zG1.js";
import "./trash-2-M_celBpV.js";
import "./check-DrBSQP0y.js";
import "./pencil-Vues_1SE.js";
import "./chevron-up-B1sEs4Rc.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
];
const Lock = createLucideIcon("lock", __iconNode);
const PAGE_SIZE = 100;
const SORT_LABELS = {
  [ServiceSort.code]: "Código",
  [ServiceSort.name]: "Nombre",
  [ServiceSort.category]: "Categoría",
  [ServiceSort.laborRate]: "Tarifa"
};
const SORT_OPTIONS = [
  ServiceSort.code,
  ServiceSort.name,
  ServiceSort.category,
  ServiceSort.laborRate
];
const CSV_HEADERS = [
  "codigo",
  "nombre",
  "descripcion",
  "categoria",
  "tarifa",
  "duracion_min",
  "activo"
];
const SKELETON_IDS = Array.from(
  { length: 6 },
  (_, index) => `service-skeleton-${index}`
);
function toCents(value) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(Math.round(parsed * 100));
}
function fromCents(value) {
  if (value === void 0) return "";
  return (Number(value) / 100).toFixed(2);
}
function toMinutes(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}
function parseActive(value) {
  const normalized = value.trim().toLowerCase();
  return !["0", "false", "no", "inactivo", "inactiva"].includes(normalized);
}
const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  category: "",
  laborRate: "",
  estimatedMinutes: "60",
  active: true
};
function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  categories
}) {
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      service ? {
        code: service.code,
        name: service.name,
        description: service.description,
        category: service.category,
        laborRate: fromCents(service.laborRate),
        estimatedMinutes: service.estimatedMinutes.toString(),
        active: service.active
      } : EMPTY_FORM
    );
  }, [open, service]);
  const categoryOptions = reactExports.useMemo(() => {
    const names = categories.map((usage) => usage.category.name);
    if (form.category && !names.includes(form.category)) {
      return [form.category, ...names];
    }
    return names;
  }, [categories, form.category]);
  const isPending = createService.isPending || updateService.isPending;
  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError("El código y el nombre son obligatorios.");
      return;
    }
    setError(null);
    const input = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      laborRate: toCents(form.laborRate),
      estimatedMinutes: toMinutes(form.estimatedMinutes),
      active: form.active
    };
    const onError = () => setError("No se pudo guardar el servicio. Intenta de nuevo.");
    if (service) {
      updateService.mutate(
        { id: service.id, input },
        {
          onSuccess: () => {
            ue.success("Servicio actualizado");
            onOpenChange(false);
          },
          onError
        }
      );
    } else {
      createService.mutate(input, {
        onSuccess: () => {
          ue.success("Servicio registrado");
          onOpenChange(false);
        },
        onError
      });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "services.form_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: service ? "Editar servicio" : "Nuevo servicio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: service ? "Actualiza la tarifa de mano de obra y la duración estimada." : "Registra un servicio para usarlo como línea de mano de obra en órdenes, cotizaciones y POS." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-code", children: "Código" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "service-code",
                  value: form.code,
                  onChange: (event) => update("code", event.target.value),
                  placeholder: "SRV-0001",
                  className: "data-rail",
                  "data-ocid": "services.code_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-name", children: "Nombre" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "service-name",
                  value: form.name,
                  onChange: (event) => update("name", event.target.value),
                  placeholder: "Cambio de aceite y filtro",
                  "data-ocid": "services.name_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-category", children: "Categoría" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: form.category || "none",
                  onValueChange: (value) => update("category", value === "none" ? "" : value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        id: "service-category",
                        "data-ocid": "services.category_select",
                        "aria-label": "Categoría del servicio",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona una categoría" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sin categoría" }),
                      categoryOptions.map((name) => {
                        const usage = categories.find(
                          (item) => item.category.name === name
                        );
                        return /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: name, children: usage ? `${name} · ${formatNumber(usage.serviceCount)}` : name }, name);
                      })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-rate", children: "Tarifa de mano de obra (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "service-rate",
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: form.laborRate,
                  onChange: (event) => update("laborRate", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "services.labor_rate_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-duration", children: "Duración estimada (min)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "service-duration",
                  type: "number",
                  min: "0",
                  step: "5",
                  value: form.estimatedMinutes,
                  onChange: (event) => update("estimatedMinutes", event.target.value),
                  className: "data-rail",
                  "data-ocid": "services.duration_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-active", children: "Estado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: form.active ? "active" : "inactive",
                  onValueChange: (value) => update("active", value === "active"),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        id: "service-active",
                        "data-ocid": "services.active_select",
                        "aria-label": "Estado del servicio",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "active", children: "Activo" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "inactive", children: "Inactivo" })
                    ] })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "service-description", children: "Descripción" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "service-description",
                value: form.description,
                onChange: (event) => update("description", event.target.value),
                placeholder: "Incluye revisión de niveles, cambio de aceite y filtro.",
                rows: 3,
                "data-ocid": "services.description_input"
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "services.form_error",
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
                "data-ocid": "services.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: isPending,
                "data-ocid": "services.submit_button",
                children: isPending ? "Guardando…" : service ? "Guardar cambios" : "Registrar servicio"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
const IMPORT_CODE_HELP_ID = "services-import-code-help";
const IMPORT_EDIT_FIELDS = [
  { key: "nombre", label: "Nombre", type: "text" },
  { key: "descripcion", label: "Descripción", type: "text" },
  { key: "categoria", label: "Categoría", type: "text" },
  { key: "tarifa", label: "Tarifa", type: "number", align: "right" },
  { key: "duracion_min", label: "Min", type: "number", align: "right" }
];
function ImportPreviewDialog({
  open,
  onOpenChange,
  rows,
  onConfirm,
  isPending
}) {
  const [draft, setDraft] = reactExports.useState([]);
  const [rowIds, setRowIds] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (!open) return;
    setDraft(rows.map((row) => ({ ...row })));
    setRowIds(rows.map((_, index) => `import-row-${index}`));
  }, [open, rows]);
  const updateCell = (index, field, value) => {
    setDraft(
      (current) => current.map(
        (row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };
  const valid = draft.filter((row) => {
    var _a, _b;
    return ((_a = row.codigo) == null ? void 0 : _a.trim()) && ((_b = row.nombre) == null ? void 0 : _b.trim());
  });
  const invalid = draft.length - valid.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "services.import_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-5xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Vista previa de importación" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Revisa y ajusta los datos antes de confirmar. Puedes editar cualquier campo excepto el código. Las filas sin código o sin nombre se omiten." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-accepted", children: [
            valid.length,
            " listas"
          ] }),
          invalid > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "badge-status badge-rejected", children: [
            invalid,
            " con errores"
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              id: IMPORT_CODE_HELP_ID,
              className: "flex items-center gap-1.5 text-xs text-muted-foreground",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "size-3.5", "aria-hidden": "true" }),
                "El código no se puede modificar; se conserva tal como viene en el archivo."
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim max-h-[45vh] overflow-auto rounded-md border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[900px] text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Código" }),
            IMPORT_EDIT_FIELDS.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                className: cn(
                  "px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
                  field.align === "right" ? "text-right" : "text-left"
                ),
                children: field.label
              },
              field.key
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Activo" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: draft.map((row, index) => {
            var _a, _b;
            const rowValid = !!((_a = row.codigo) == null ? void 0 : _a.trim()) && !!((_b = row.nombre) == null ? void 0 : _b.trim());
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "tr",
              {
                "data-ocid": `services.import_row.${index + 1}`,
                className: cn(
                  "border-b border-border/60 last:border-0",
                  !rowValid && "bg-destructive/[0.06]"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        value: row.codigo ?? "",
                        readOnly: true,
                        "aria-readonly": "true",
                        "aria-describedby": IMPORT_CODE_HELP_ID,
                        "aria-label": `Código de la fila ${index + 1} (no editable)`,
                        className: "h-8 cursor-not-allowed bg-muted pr-8 font-mono text-xs text-muted-foreground",
                        "data-ocid": `services.import_code.${index + 1}`
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Lock,
                      {
                        className: "pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    )
                  ] }) }),
                  IMPORT_EDIT_FIELDS.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      type: field.type,
                      min: field.type === "number" ? "0" : void 0,
                      step: field.key === "tarifa" ? "0.01" : void 0,
                      value: row[field.key] ?? "",
                      onChange: (event) => updateCell(index, field.key, event.target.value),
                      "aria-label": `${field.label} de la fila ${index + 1}`,
                      className: cn(
                        "h-8 text-sm",
                        field.align === "right" && "text-right",
                        (field.key === "tarifa" || field.key === "duracion_min") && "data-rail"
                      ),
                      "data-ocid": `services.import_${field.key}.${index + 1}`
                    }
                  ) }, field.key)),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Select,
                    {
                      value: parseActive(row.activo ?? "1") ? "1" : "0",
                      onValueChange: (value) => updateCell(index, "activo", value),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SelectTrigger,
                          {
                            size: "sm",
                            "aria-label": `Estado de la fila ${index + 1}`,
                            "data-ocid": `services.import_activo.${index + 1}`,
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "1", children: "Activo" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "0", children: "Inactivo" })
                        ] })
                      ]
                    }
                  ) })
                ]
              },
              rowIds[index] ?? `import-row-${index}`
            );
          }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => onOpenChange(false),
              "data-ocid": "services.import_cancel_button",
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              disabled: isPending || valid.length === 0,
              onClick: () => onConfirm(draft),
              "data-ocid": "services.import_confirm_button",
              children: isPending ? "Importando…" : `Importar ${valid.length} servicio${valid.length === 1 ? "" : "s"}`
            }
          )
        ] })
      ]
    }
  ) });
}
function ZeroServicesDialog({
  open,
  onOpenChange,
  onZeroed
}) {
  const zeroServices = useZeroServices();
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!open) return;
    setError(null);
  }, [open]);
  const handleConfirm = () => {
    setError(null);
    zeroServices.mutate(void 0, {
      onSuccess: (result) => {
        onZeroed(result.deleted);
        ue.success(
          result.deleted === 1n ? "Se eliminó 1 servicio del catálogo." : `Se eliminaron ${result.deleted.toString()} servicios del catálogo.`
        );
        onOpenChange(false);
      },
      onError: () => {
        setError(
          "No se pudieron poner los servicios en cero. Intenta de nuevo."
        );
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "services.zero_dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Poner servicios en cero" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Esta acción elimina todos los servicios del catálogo de taller. No se puede deshacer." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TriangleAlert,
        {
          className: "mt-0.5 size-4 shrink-0 text-destructive",
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: "Se eliminarán todos los servicios registrados. Esta operación es irreversible." })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        "data-ocid": "services.zero_error",
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
          disabled: zeroServices.isPending,
          "data-ocid": "services.zero_cancel_button",
          children: "Cancelar"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "destructive",
          onClick: handleConfirm,
          disabled: zeroServices.isPending,
          "data-ocid": "services.zero_confirm_button",
          className: "gap-2",
          children: [
            zeroServices.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
            zeroServices.isPending ? "Procesando…" : "Poner en cero"
          ]
        }
      )
    ] })
  ] }) });
}
function ServicesPage() {
  var _a, _b;
  const { actor } = useBackend();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const [term, setTerm] = reactExports.useState(urlTerm);
  const [debouncedTerm, setDebouncedTerm] = reactExports.useState(urlTerm);
  const [category, setCategory] = reactExports.useState("");
  const [activeOnly, setActiveOnly] = reactExports.useState(false);
  const [sort, setSort] = reactExports.useState(ServiceSort.code);
  const [page, setPage] = reactExports.useState(1);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [categoriesOpen, setCategoriesOpen] = reactExports.useState(false);
  const [zeroDialogOpen, setZeroDialogOpen] = reactExports.useState(false);
  const [zeroedCount, setZeroedCount] = reactExports.useState(null);
  const [importRows, setImportRows] = reactExports.useState(null);
  const [importSummary, setImportSummary] = reactExports.useState(
    null
  );
  const [isImporting, setIsImporting] = reactExports.useState(false);
  const [notifyTarget, setNotifyTarget] = reactExports.useState(null);
  const deleteService = useDeleteService();
  const customersQuery = useCustomers("");
  const customers = customersQuery.data ?? [];
  const applySearch = reactExports.useCallback(
    (value) => {
      void navigate({
        to: "/servicios",
        search: (prev) => {
          const { q: _previous, ...rest } = prev;
          return value === "" ? rest : { ...rest, q: value };
        },
        replace: true
      });
    },
    [navigate]
  );
  reactExports.useEffect(() => {
    setTerm(urlTerm);
    setDebouncedTerm(urlTerm);
  }, [urlTerm]);
  reactExports.useEffect(() => {
    if (term === urlTerm) return;
    const handle = window.setTimeout(() => {
      setDebouncedTerm(term);
      setPage(1);
      applySearch(term);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [term, urlTerm, applySearch]);
  const servicesQuery = useServices({
    search: debouncedTerm,
    category: category || null,
    activeOnly,
    sort,
    page,
    pageSize: PAGE_SIZE
  });
  const categoriesQuery = useServiceCategories({ search: "" });
  const categoryUsages = categoriesQuery.data ?? [];
  const items = ((_a = servicesQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = servicesQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = debouncedTerm !== "" || category !== "" || activeOnly;
  const clearFilters = () => {
    setTerm("");
    setDebouncedTerm("");
    setCategory("");
    setActiveOnly(false);
    setPage(1);
    applySearch("");
  };
  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (service) => {
    setEditing(service);
    setDialogOpen(true);
  };
  const handleDelete = (service) => {
    deleteService.mutate(service.id, {
      onSuccess: () => ue.success("Servicio eliminado"),
      onError: () => ue.error("No se pudo eliminar el servicio.")
    });
  };
  const openNotify = () => {
    var _a2;
    const customer = customers[0];
    if (!customer) {
      ue.error(
        "Registra un cliente con correo para notificar sobre este servicio."
      );
      return;
    }
    setNotifyTarget({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: ((_a2 = customer.email) == null ? void 0 : _a2.trim()) ? customer.email : null
    });
  };
  const columns = [
    {
      key: "code",
      header: "Código",
      render: (service) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-sm font-medium", children: service.code })
    },
    {
      key: "name",
      header: "Nombre",
      render: (service) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 max-w-[280px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: service.name }),
        service.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: service.description }) : null
      ] })
    },
    {
      key: "category",
      header: "Categoría",
      render: (service) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: service.category || "—" })
    },
    {
      key: "laborRate",
      header: "Tarifa",
      numeric: true,
      render: (service) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(service.laborRate) })
    },
    {
      key: "estimatedMinutes",
      header: "Duración",
      numeric: true,
      render: (service) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-muted-foreground", children: [
        formatNumber(service.estimatedMinutes),
        " min"
      ] })
    },
    {
      key: "active",
      header: "Estado",
      render: (service) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatusBadge,
        {
          label: service.active ? "Activo" : "Inactivo",
          tone: service.active ? "accepted" : "cancelled"
        }
      )
    }
  ];
  const actions = [
    {
      kind: "edit",
      label: "Editar servicio",
      onClick: openEdit
    },
    {
      kind: "save",
      label: "Notificar al cliente",
      onClick: openNotify,
      hidden: () => customers.length === 0
    },
    {
      kind: "delete",
      label: "Eliminar servicio",
      onClick: handleDelete
    }
  ];
  const exportRows = items.map((service) => ({
    codigo: service.code,
    nombre: service.name,
    descripcion: service.description,
    categoria: service.category,
    tarifa: (Number(service.laborRate) / 100).toFixed(2),
    duracion_min: service.estimatedMinutes.toString(),
    activo: service.active ? "1" : "0"
  }));
  const handleImport = (rows) => {
    if (rows.length === 0) {
      ue.error("El archivo no contiene filas válidas.");
      return;
    }
    setImportSummary(null);
    setImportRows(rows);
  };
  const confirmImport = async (rows) => {
    if (!actor) return;
    const valid = rows.filter(
      (row) => {
        var _a2, _b2;
        return ((_a2 = row.codigo) == null ? void 0 : _a2.trim()) && ((_b2 = row.nombre) == null ? void 0 : _b2.trim());
      }
    );
    const skipped = rows.length - valid.length;
    const inputs = valid.map((row) => {
      var _a2, _b2;
      return {
        code: row.codigo.trim(),
        name: row.nombre.trim(),
        description: ((_a2 = row.descripcion) == null ? void 0 : _a2.trim()) ?? "",
        category: ((_b2 = row.categoria) == null ? void 0 : _b2.trim()) ?? "",
        laborRate: toCents(row.tarifa ?? ""),
        estimatedMinutes: toMinutes(row.duracion_min ?? ""),
        active: parseActive(row.activo ?? "1")
      };
    });
    setIsImporting(true);
    try {
      const created = await actor.bulkCreateServices(inputs);
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      setImportSummary({
        imported: created.length,
        skipped,
        errors: []
      });
      ue.success(
        `${created.length} servicio${created.length === 1 ? "" : "s"} importado${created.length === 1 ? "" : "s"}`
      );
      setImportRows(null);
    } catch {
      setImportSummary({
        imported: 0,
        skipped,
        errors: ["No se pudo completar la importación. Intenta de nuevo."]
      });
      ue.error("No se pudo completar la importación.");
    } finally {
      setIsImporting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "services.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Catálogo",
            title: "Servicios de taller",
            description: "Catálogo de mano de obra con tarifas y duración estimada. Los servicios activos se ofrecen en órdenes, cotizaciones y POS.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                CsvTransfer,
                {
                  headers: CSV_HEADERS,
                  rows: exportRows,
                  onImport: handleImport,
                  filename: "servicios",
                  sheetName: "Servicios",
                  ocid: "services.csv",
                  disabled: isImporting
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setCategoriesOpen(true),
                  "data-ocid": "services.manage_categories_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(FolderTree, { className: "size-4", "aria-hidden": "true" }),
                    "Categorías"
                  ]
                }
              ),
              isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setZeroDialogOpen(true),
                  "data-ocid": "services.zero_button",
                  className: "gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eraser, { className: "size-4", "aria-hidden": "true" }),
                    "Poner servicios en cero"
                  ]
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: openCreate,
                  "data-ocid": "services.new_service_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                    "Nuevo servicio"
                  ]
                }
              )
            ] })
          }
        ),
        zeroedCount !== null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "output",
          {
            "data-ocid": "services.zero_success",
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
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: "Servicios puestos en cero" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: zeroedCount === 1n ? "Se eliminó 1 servicio del catálogo." : `Se eliminaron ${zeroedCount.toString()} servicios del catálogo.` })
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
                  "data-ocid": "services.zero_success_close_button",
                  className: "shrink-0 text-muted-foreground",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
                }
              )
            ]
          }
        ) : null,
        importSummary ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "services.import_summary",
            className: "flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-4 text-primary", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium", children: [
                  importSummary.imported,
                  " importado",
                  importSummary.imported === 1 ? "" : "s"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                  " · ",
                  importSummary.skipped,
                  " omitido",
                  importSummary.skipped === 1 ? "" : "s"
                ] })
              ] }),
              importSummary.errors.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-destructive", children: importSummary.errors.join(" ") }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  onClick: () => setImportSummary(null),
                  "data-ocid": "services.import_summary_dismiss",
                  className: "ml-auto text-muted-foreground",
                  children: "Cerrar"
                }
              )
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "section",
          {
            "data-ocid": "services.filters",
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
                    placeholder: "Buscar por nombre o código…",
                    "aria-label": "Buscar servicios",
                    className: "pl-9",
                    "data-ocid": "services.search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: category || "all",
                  onValueChange: (value) => {
                    setCategory(value === "all" ? "" : value);
                    setPage(1);
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        className: "w-[190px]",
                        "aria-label": "Filtrar por categoría",
                        "data-ocid": "services.category_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Categoría" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas las categorías" }),
                      categoryUsages.map((usage) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectItem,
                        {
                          value: usage.category.name,
                          children: `${usage.category.name} · ${formatNumber(usage.serviceCount)}`
                        },
                        usage.category.id.toString()
                      ))
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: activeOnly ? "default" : "outline",
                  onClick: () => {
                    setActiveOnly((current) => !current);
                    setPage(1);
                  },
                  "aria-pressed": activeOnly,
                  "data-ocid": "services.active_toggle",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-4", "aria-hidden": "true" }),
                    "Solo activos"
                  ]
                }
              ),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: clearFilters,
                  "data-ocid": "services.clear_filters_button",
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
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: servicesQuery.isLoading ? "Cargando…" : `${formatNumber(total)} servicio${total === 1 ? "" : "s"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:inline", children: "Orden" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: sort,
                  onValueChange: (value) => {
                    setSort(value);
                    setPage(1);
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        size: "sm",
                        className: "w-[150px]",
                        "aria-label": "Ordenar por",
                        "data-ocid": "services.sort_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: SORT_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: SORT_LABELS[option] }, option)) })
                  ]
                }
              )
            ] })
          ] }),
          servicesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "services.error_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-6 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el catálogo de servicios." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => void servicesQuery.refetch({ cancelRefetch: true }),
                    "data-ocid": "services.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : servicesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "services.loading_state", className: "space-y-2", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id)) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "services.empty_state",
              className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Wrench,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay servicios registrados" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta la búsqueda o los filtros para encontrar servicios." : "Registra el primer servicio para usarlo como línea de mano de obra." })
                ] }),
                hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: clearFilters,
                    "data-ocid": "services.empty_clear_button",
                    children: "Limpiar filtros"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    onClick: openCreate,
                    "data-ocid": "services.empty_new_button",
                    className: "gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                      "Nuevo servicio"
                    ]
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              columns,
              rows: items,
              rowKey: (service) => service.id.toString(),
              actions,
              ocid: "services"
            }
          ),
          !servicesQuery.isLoading && !servicesQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Mostrando ",
              formatNumber(items.length),
              " de ",
              formatNumber(total),
              " · Página ",
              page,
              " de ",
              totalPages
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  disabled: page <= 1,
                  onClick: () => setPage((current) => Math.max(1, current - 1)),
                  "data-ocid": "services.pagination_prev",
                  children: "Anterior"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  disabled: page >= totalPages,
                  onClick: () => setPage((current) => Math.min(totalPages, current + 1)),
                  "data-ocid": "services.pagination_next",
                  children: "Siguiente"
                }
              )
            ] })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ServiceFormDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            service: editing,
            categories: categoryUsages
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ServiceCategoryDialog,
          {
            open: categoriesOpen,
            onOpenChange: setCategoriesOpen
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ZeroServicesDialog,
          {
            open: zeroDialogOpen,
            onOpenChange: setZeroDialogOpen,
            onZeroed: setZeroedCount
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ImportPreviewDialog,
          {
            open: importRows !== null,
            onOpenChange: (open) => {
              if (!open) setImportRows(null);
            },
            rows: importRows ?? [],
            onConfirm: (rows) => void confirmImport(rows),
            isPending: isImporting
          }
        ),
        notifyTarget ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          NotifyCustomerDialog,
          {
            open: true,
            onOpenChange: (open) => {
              if (!open) setNotifyTarget(null);
            },
            customerId: notifyTarget.customerId,
            customerName: notifyTarget.customerName,
            customerEmail: notifyTarget.customerEmail,
            source: NotificationSource.service,
            defaultSubject: "Información de servicios de taller",
            defaultMessage: `Hola ${notifyTarget.customerName}, te compartimos la información actualizada de nuestros servicios de taller. Si deseas agendar una revisión, respóndenos a este correo y coordinamos la cita.`
          }
        ) : null
      ]
    }
  );
}
export {
  ServicesPage,
  ServicesPage as default
};
