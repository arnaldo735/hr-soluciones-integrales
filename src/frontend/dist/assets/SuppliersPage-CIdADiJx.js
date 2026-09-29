import { r as useNavigate, k as useBackend, l as useAuth, s as useSearch, t as reactExports, aG as PayableStatus, j as jsxRuntimeExports, B as Button, h as FileSpreadsheet, y as formatMoney, v as Search, w as Input, T as TriangleAlert, c as Truck, L as Link, f as Building2, m as useQuery, ao as useQueryClient, ap as useMutation, av as ue, x as Badge, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, a3 as DialogFooter, p as PartSort } from "./index-EqGEeyjs.js";
import { u as useContactImport, C as ContactImportDialog, b as buildContactImportRows, S as SUPPLIER_CSV_HEADERS } from "./use-contact-import--HBKcXer.js";
import { p as parseCsv } from "./CsvTransfer-BhNDqkOb.js";
import { C as Card, c as CardContent } from "./card-YKA4f36t.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import { r as readSpreadsheet, a as downloadXlsxTemplate, d as downloadXlsx } from "./xlsx-DZNJ8zzC.js";
import { U as Upload } from "./upload-CmMwQ1re.js";
import { D as Download } from "./download-C8tLpeh6.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { A as ArrowRight } from "./arrow-right-Chrmeonu.js";
import { P as PackagePlus } from "./package-plus-DDYRgHvR.js";
import { P as Pencil } from "./pencil-BajrtuU3.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { C as Check } from "./check-LdjEv5O-.js";
import "./StatusBadge-DoLeoyAw.js";
import "./download-DPgaDAHv.js";
function supplierToCsvRow(supplier) {
  return {
    nombre: supplier.name,
    documento: supplier.taxId ?? "",
    telefono: supplier.phone,
    correo: supplier.email ?? "",
    direccion: supplier.address ?? ""
  };
}
const SUPPLIERS_QUERY_KEY = ["suppliers"];
const PAYABLES_QUERY_KEY = ["payables"];
const PURCHASES_QUERY_KEY = ["purchases"];
const PART_SEARCH_LIMIT = 1000n;
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
function useSuppliers(search) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [...SUPPLIERS_QUERY_KEY, search],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSuppliers(
        token,
        search.trim() === "" ? null : search.trim()
      );
    },
    enabled: !!actor && !isFetching
  });
}
function usePayables() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: PAYABLES_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPayables(token);
    },
    enabled: !!actor && !isFetching
  });
}
function useSaveSupplier() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      if (input.id === null) return actor.createSupplier(token, input.values);
      return actor.updateSupplier(token, input.id, input.values);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
    }
  });
}
function payableFor(payables, supplierId) {
  return payables.find((entry) => entry.supplierId === supplierId) ?? null;
}
function usePartSearch(term) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const trimmed = term.trim();
  return useQuery({
    queryKey: ["parts", "purchase-search", trimmed],
    queryFn: async () => {
      if (!actor) return [];
      const page = await actor.listParts(
        token,
        { search: trimmed === "" ? void 0 : trimmed },
        PartSort.name,
        0n,
        PART_SEARCH_LIMIT
      );
      return page.items;
    },
    enabled: !!actor && !isFetching,
    staleTime: 3e4
  });
}
function useCreatePurchase() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPurchase(token, {
        supplierId: input.supplierId,
        items: input.items
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
    }
  });
}
function parseQuantity(value) {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return BigInt(parsed);
}
function parseCostToCents(value) {
  const parsed = Number.parseFloat(value.replace(",", ".").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return BigInt(Math.round(parsed * 100));
}
function centsToInput(value) {
  if (value === void 0) return "";
  return (Number(value) / 100).toFixed(2);
}
function newPurchaseLine(key) {
  return { key, part: null, lotNumber: "", quantity: "1", unitCost: "" };
}
function PartPicker({
  index,
  selected,
  onSelect
}) {
  const [term, setTerm] = reactExports.useState("");
  const [open, setOpen] = reactExports.useState(false);
  const debouncedTerm = useDebouncedValue(term, 250);
  const partsQuery = usePartSearch(debouncedTerm);
  const results = partsQuery.data ?? [];
  if (selected) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: selected.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail truncate text-xs text-muted-foreground", children: [
          selected.sku,
          " · ",
          selected.brand || "Sin marca",
          " · Existencia",
          " ",
          selected.totalStock.toString(),
          " ",
          selected.unit
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          onClick: () => {
            setTerm("");
            setOpen(false);
            onSelect(null);
          },
          "data-ocid": `suppliers.part_clear_button.${index}`,
          className: "shrink-0 gap-1.5 text-muted-foreground",
          children: "Cambiar"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
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
          onChange: (event) => {
            setTerm(event.target.value);
            setOpen(true);
          },
          onFocus: () => setOpen(true),
          placeholder: "Buscar repuesto por nombre o SKU…",
          "aria-label": `Buscar repuesto para la partida ${index}`,
          "data-ocid": `suppliers.part_search_input.${index}`,
          className: "pl-9"
        }
      )
    ] }),
    open ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": `suppliers.part_results.${index}`,
        className: "max-h-52 overflow-y-auto rounded-md border border-border bg-card",
        children: partsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-3 text-xs text-muted-foreground", children: "Buscando repuestos…" }) : partsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-3 text-xs text-destructive", children: "No se pudo cargar el catálogo de repuestos. Inténtalo de nuevo." }) : results.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-3 text-xs text-muted-foreground", children: debouncedTerm.trim() === "" ? "Escribe para buscar en el catálogo de repuestos." : "Sin resultados. Ningún repuesto coincide con la búsqueda." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: results.map((part, resultIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              onSelect(part);
              setOpen(false);
            },
            "data-ocid": `suppliers.part_option.${index}.${resultIndex + 1}`,
            className: "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: part.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail block truncate text-xs text-muted-foreground", children: [
                  part.sku,
                  " · ",
                  part.brand || "Sin marca",
                  " · Existencia",
                  " ",
                  part.totalStock.toString(),
                  " ",
                  part.unit
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 text-xs text-muted-foreground", children: formatMoney(part.costPrice) })
            ]
          }
        ) }, part.id.toString())) })
      }
    ) : null
  ] });
}
function PurchaseDialog({ open, onOpenChange, supplier }) {
  const [lines, setLines] = reactExports.useState([
    newPurchaseLine("line-1")
  ]);
  const [error, setError] = reactExports.useState(null);
  const createPurchase = useCreatePurchase();
  function handleOpenChange(next) {
    if (next) {
      setLines([newPurchaseLine("line-1")]);
      setError(null);
    }
    onOpenChange(next);
  }
  function updateLine(key, patch) {
    setLines(
      (current) => current.map((line) => line.key === key ? { ...line, ...patch } : line)
    );
  }
  function selectPart(key, part) {
    updateLine(key, {
      part,
      unitCost: centsToInput(part.costPrice)
    });
  }
  function addLine() {
    setLines((current) => [
      ...current,
      newPurchaseLine(`line-${current.length + 1}-${Date.now()}`)
    ]);
  }
  function removeLine(key) {
    setLines((current) => current.filter((line) => line.key !== key));
  }
  function handleSubmit(event) {
    event.preventDefault();
    const items = [];
    for (const line of lines) {
      if (!line.part) {
        setError("Selecciona un repuesto del catálogo en cada partida.");
        return;
      }
      const lotNumber = line.lotNumber.trim();
      if (lotNumber === "") {
        setError("Cada partida necesita un número de lote o serie.");
        return;
      }
      const quantity = parseQuantity(line.quantity);
      if (quantity === null) {
        setError("Las cantidades deben ser números enteros mayores a cero.");
        return;
      }
      const unitCost = parseCostToCents(line.unitCost);
      if (unitCost === null) {
        setError("Los costos unitarios deben ser mayores a cero.");
        return;
      }
      items.push({ partId: line.part.id, lotNumber, quantity, unitCost });
    }
    if (items.length === 0) {
      setError("Agrega al menos una partida a la compra.");
      return;
    }
    setError(null);
    createPurchase.mutate(
      { supplierId: supplier.id, items },
      {
        onSuccess: () => {
          ue.success("Compra registrada y stock actualizado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            mutationError.message || "No se pudo registrar la compra. Revisa los datos e inténtalo de nuevo."
          );
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "suppliers.purchase_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Registrar compra de reposición" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
            "Elige los repuestos del catálogo para ",
            supplier.name,
            ". Al registrar la compra, el stock aumenta y se crea el lote indicado."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": `suppliers.purchase_line.${index + 1}`,
              className: "rounded-md border border-border bg-muted/20 p-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                    "Partida ",
                    index + 1
                  ] }),
                  lines.length > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: () => removeLine(line.key),
                      "aria-label": `Quitar partida ${index + 1}`,
                      "data-ocid": `suppliers.remove_line_button.${index + 1}`,
                      className: "gap-1.5 text-destructive hover:text-destructive",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5", "aria-hidden": "true" }),
                        "Quitar"
                      ]
                    }
                  ) : null
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Repuesto" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      PartPicker,
                      {
                        index: index + 1,
                        selected: line.part,
                        onSelect: (part) => selectPart(line.key, part)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `purchase-lot-${line.key}`, children: "Lote / serie" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: `purchase-lot-${line.key}`,
                          value: line.lotNumber,
                          onChange: (event) => updateLine(line.key, {
                            lotNumber: event.target.value
                          }),
                          placeholder: "L-2026-041",
                          "data-ocid": `suppliers.lot_input.${index + 1}`,
                          className: "data-rail",
                          required: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `purchase-qty-${line.key}`, children: "Cantidad" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: `purchase-qty-${line.key}`,
                          value: line.quantity,
                          onChange: (event) => updateLine(line.key, { quantity: event.target.value }),
                          inputMode: "numeric",
                          placeholder: "10",
                          "data-ocid": `suppliers.quantity_input.${index + 1}`,
                          className: "data-rail",
                          required: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `purchase-cost-${line.key}`, children: "Costo unitario (COP)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: `purchase-cost-${line.key}`,
                          value: line.unitCost,
                          onChange: (event) => updateLine(line.key, { unitCost: event.target.value }),
                          inputMode: "decimal",
                          placeholder: "450.00",
                          "data-ocid": `suppliers.unit_cost_input.${index + 1}`,
                          className: "data-rail",
                          required: true
                        }
                      )
                    ] })
                  ] })
                ] })
              ]
            },
            line.key
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: addLine,
              "data-ocid": "suppliers.add_line_button",
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                "Agregar partida"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              PackagePlus,
              {
                className: "mt-0.5 size-4 shrink-0 text-primary",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Esta compra incrementa las existencias y genera un lote por cada partida. El saldo por pagar del proveedor se actualiza al instante." })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "suppliers.purchase_error",
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
                "data-ocid": "suppliers.purchase_cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: createPurchase.isPending,
                "data-ocid": "suppliers.purchase_submit_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4", "aria-hidden": "true" }),
                  createPurchase.isPending ? "Registrando…" : "Registrar compra"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function PayableStatusBadge({ payable }) {
  if (!payable) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Badge,
      {
        variant: "outline",
        className: "border-border bg-muted/40 text-muted-foreground",
        children: "Sin compras"
      }
    );
  }
  if (payable.status === PayableStatus.paid) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Badge,
      {
        variant: "outline",
        className: "border-success/40 bg-success/10 text-success",
        children: "Pagada"
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Badge,
    {
      variant: "outline",
      className: "border-warning/40 bg-warning/10 text-warning",
      children: "Pendiente"
    }
  );
}
const EMPTY_FORM = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  taxId: "",
  address: ""
};
function toFormState(supplier) {
  return {
    name: supplier.name,
    contactName: supplier.contactName ?? "",
    phone: supplier.phone,
    email: supplier.email ?? "",
    taxId: supplier.taxId ?? "",
    address: supplier.address ?? ""
  };
}
function toSupplierInput(form) {
  const trimmed = {
    name: form.name.trim(),
    contactName: form.contactName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    taxId: form.taxId.trim(),
    address: form.address.trim()
  };
  return {
    name: trimmed.name,
    phone: trimmed.phone,
    contactName: trimmed.contactName === "" ? void 0 : trimmed.contactName,
    email: trimmed.email === "" ? void 0 : trimmed.email,
    taxId: trimmed.taxId === "" ? void 0 : trimmed.taxId,
    address: trimmed.address === "" ? void 0 : trimmed.address
  };
}
function SupplierDialog({ open, onOpenChange, supplier }) {
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  const saveSupplier = useSaveSupplier();
  const isEditing = supplier !== null;
  function handleOpenChange(next) {
    if (next) {
      setForm(supplier ? toFormState(supplier) : EMPTY_FORM);
      setError(null);
    }
    onOpenChange(next);
  }
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function handleSubmit(event) {
    event.preventDefault();
    const values = toSupplierInput(form);
    if (values.name === "") {
      setError("El nombre del proveedor es obligatorio.");
      return;
    }
    if (values.phone === "") {
      setError("El teléfono de contacto es obligatorio.");
      return;
    }
    setError(null);
    saveSupplier.mutate(
      { id: supplier ? supplier.id : null, values },
      {
        onSuccess: () => {
          ue.success(
            isEditing ? "Proveedor actualizado" : "Proveedor registrado"
          );
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            mutationError.message || "No se pudo guardar el proveedor. Inténtalo de nuevo."
          );
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "suppliers.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: isEditing ? "Editar proveedor" : "Nuevo proveedor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Datos de contacto y fiscales para compras de reposición y cuentas por pagar." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-name", children: "Nombre o razón social" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "supplier-name",
                  value: form.name,
                  onChange: (event) => update("name", event.target.value),
                  placeholder: "Refacciones del Norte S.A. de C.V.",
                  "data-ocid": "suppliers.name_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-contact", children: "Persona de contacto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "supplier-contact",
                  value: form.contactName,
                  onChange: (event) => update("contactName", event.target.value),
                  placeholder: "Laura Medina",
                  "data-ocid": "suppliers.contact_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-phone", children: "Teléfono" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "supplier-phone",
                  value: form.phone,
                  onChange: (event) => update("phone", event.target.value),
                  placeholder: "81 8345 2210",
                  "data-ocid": "suppliers.phone_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-email", children: "Correo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "supplier-email",
                  type: "email",
                  value: form.email,
                  onChange: (event) => update("email", event.target.value),
                  placeholder: "ventas@repuestosandinos.com.co",
                  "data-ocid": "suppliers.email_input"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-tax-id", children: "NIT / ID fiscal" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "supplier-tax-id",
                  value: form.taxId,
                  onChange: (event) => update("taxId", event.target.value),
                  placeholder: "900.123.456-7",
                  "data-ocid": "suppliers.tax_id_input",
                  className: "data-rail"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-address", children: "Dirección" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "supplier-address",
                  value: form.address,
                  onChange: (event) => update("address", event.target.value),
                  placeholder: "Cra. 43A #1-50, Medellín, Antioquia",
                  "data-ocid": "suppliers.address_input"
                }
              )
            ] })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "suppliers.form_error",
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
                "data-ocid": "suppliers.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: saveSupplier.isPending,
                "data-ocid": "suppliers.submit_button",
                children: saveSupplier.isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Registrar proveedor"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function TableSkeleton() {
  const rows = Array.from({ length: 5 }, (_, index) => `supplier-row-${index}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "suppliers.loading_state", className: "space-y-2 p-4", children: rows.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id)) });
}
function SuppliersPage() {
  const navigate = useNavigate();
  const { actor } = useBackend();
  const { token } = useAuth();
  const rawSearch = useSearch({ strict: false });
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const [search, setSearch] = reactExports.useState(urlTerm);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [editing, setEditing] = reactExports.useState(null);
  const [purchaseSupplier, setPurchaseSupplier] = reactExports.useState(
    null
  );
  const [importRows, setImportRows] = reactExports.useState(null);
  const [importResult, setImportResult] = reactExports.useState(
    null
  );
  const [importFailed, setImportFailed] = reactExports.useState(false);
  const [isExporting, setIsExporting] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const contactImport = useContactImport("supplier");
  reactExports.useEffect(() => {
    setSearch(urlTerm);
  }, [urlTerm]);
  const applySearch = reactExports.useCallback(
    (value) => {
      void navigate({
        to: "/proveedores",
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
    if (search === urlTerm) return;
    const handle = window.setTimeout(() => applySearch(search), 300);
    return () => window.clearTimeout(handle);
  }, [search, urlTerm, applySearch]);
  const suppliersQuery = useSuppliers(search);
  const payablesQuery = usePayables();
  const saveSupplier = useSaveSupplier();
  const suppliers = suppliersQuery.data ?? [];
  const payables = payablesQuery.data ?? [];
  const isLoading = suppliersQuery.isLoading || payablesQuery.isLoading;
  const isError = suppliersQuery.isError || payablesQuery.isError;
  const pendingTotal = payables.filter((entry) => entry.status === PayableStatus.pending).reduce((sum, entry) => sum + entry.balance, 0n);
  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(supplier) {
    setEditing(supplier);
    setDialogOpen(true);
  }
  function refetchAll() {
    void suppliersQuery.refetch();
    void payablesQuery.refetch();
  }
  async function handleExport() {
    if (!actor) return;
    setIsExporting(true);
    try {
      const all = await actor.listSuppliers(token, null);
      await downloadXlsx(
        "proveedores",
        "Proveedores",
        SUPPLIER_CSV_HEADERS,
        all.map(supplierToCsvRow)
      );
    } catch {
      ue.error("No se pudo exportar los proveedores. Intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  }
  async function handleDownloadTemplate() {
    await downloadXlsxTemplate(
      "plantilla-proveedores",
      "Proveedores",
      SUPPLIER_CSV_HEADERS,
      {
        nombre: "Repuestos Andinos S.A.S.",
        documento: "900.123.456-7",
        telefono: "604 444 8890",
        correo: "ventas@repuestosandinos.com.co",
        direccion: "Cra. 43A #1-50, Medellín, Antioquia"
      }
    );
  }
  async function handleFile(file) {
    if (!actor) return;
    try {
      const parsed = await readSpreadsheet(file, parseCsv);
      if (parsed.length === 0) {
        ue.error("El archivo no contiene filas válidas.");
        return;
      }
      const existing = await actor.listSuppliers(token, null);
      setImportResult(null);
      setImportFailed(false);
      setImportRows(buildContactImportRows("supplier", parsed, existing));
    } catch (error) {
      ue.error(
        error instanceof Error ? error.message : "No se pudo leer el archivo. Verifica el formato e intenta de nuevo."
      );
    }
  }
  function confirmImport() {
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
  }
  function closeImport() {
    setImportRows(null);
    setImportResult(null);
    setImportFailed(false);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "suppliers.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Proveedores y compras" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Directorio de proveedores, compras de reposición y saldo pendiente por liquidar." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
                className: "sr-only",
                "data-ocid": "suppliers.import_file_input",
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
                "data-ocid": "suppliers.template_button",
                className: "gap-1.5",
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
                "data-ocid": "suppliers.import_button",
                className: "gap-1.5",
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
                "data-ocid": "suppliers.export_button",
                className: "gap-1.5",
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
                "data-ocid": "suppliers.create_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Nuevo proveedor"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "suppliers.kpi.section",
            "aria-label": "Resumen de cuentas por pagar",
            className: "grid gap-4 sm:grid-cols-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-primary"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Proveedores" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: isLoading ? "—" : suppliers.length }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Registrados en el directorio" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-warning"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Cuentas pendientes" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: isLoading ? "—" : payables.filter(
                    (entry) => entry.status === PayableStatus.pending
                  ).length }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Proveedores con saldo por pagar" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "absolute inset-y-0 left-0 w-0.5 bg-destructive"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Saldo total pendiente" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: isLoading ? "—" : formatMoney(pendingTotal) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Por liquidar con proveedores" })
                ] })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            "data-ocid": "suppliers.table.card",
            className: "gap-0 overflow-hidden rounded-lg py-0 shadow-none",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 border-b border-border px-4 py-3", children: [
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
                      value: search,
                      onChange: (event) => setSearch(event.target.value),
                      placeholder: "Buscar por nombre, contacto o NIT…",
                      "aria-label": "Buscar proveedores",
                      "data-ocid": "suppliers.search_input",
                      className: "pl-9"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: refetchAll,
                    "data-ocid": "suppliers.refresh_button",
                    children: "Actualizar"
                  }
                )
              ] }),
              isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "suppliers.error_state",
                  className: "flex flex-col items-center gap-3 px-6 py-12 text-center",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TriangleAlert,
                      {
                        className: "size-5 text-destructive",
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "No se pudieron cargar los proveedores" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        onClick: refetchAll,
                        "data-ocid": "suppliers.retry_button",
                        children: "Reintentar"
                      }
                    )
                  ]
                }
              ) : isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : suppliers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "suppliers.empty_state",
                  className: "flex flex-col items-center gap-3 px-6 py-14 text-center",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Truck,
                      {
                        className: "size-5 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: search.trim() === "" ? "Aún no hay proveedores" : "Sin resultados" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: search.trim() === "" ? "Registra tu primer proveedor para dar de alta compras de reposición y controlar cuentas por pagar." : "Ningún proveedor coincide con la búsqueda. Prueba con otro nombre, contacto o NIT." })
                    ] }),
                    search.trim() === "" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        size: "sm",
                        onClick: openCreate,
                        "data-ocid": "suppliers.empty_create_button",
                        className: "gap-1.5",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                          "Nuevo proveedor"
                        ]
                      }
                    ) : null
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "suppliers.table", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-4", children: "Proveedor" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Contacto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Teléfono" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Datos fiscales" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Saldo pendiente" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Estado" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right", children: "Acciones" })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: suppliers.map((supplier, index) => {
                  const payable = payableFor(payables, supplier.id);
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    TableRow,
                    {
                      "data-ocid": `suppliers.row.${index + 1}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pl-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Link,
                          {
                            to: "/proveedores/$id",
                            params: { id: supplier.id.toString() },
                            "data-ocid": `suppliers.link.${index + 1}`,
                            className: "group flex min-w-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Building2,
                                {
                                  className: "size-3.5 text-muted-foreground",
                                  "aria-hidden": "true"
                                }
                              ) }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate font-medium group-hover:text-primary", children: supplier.name }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                ArrowRight,
                                {
                                  className: "size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
                                  "aria-hidden": "true"
                                }
                              )
                            ]
                          }
                        ) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: supplier.contactName ?? "—" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-muted-foreground", children: supplier.phone }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-xs text-muted-foreground", children: supplier.taxId ?? "—" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-semibold", children: payable ? formatMoney(payable.balance) : "—" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PayableStatusBadge, { payable }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              type: "button",
                              variant: "ghost",
                              size: "sm",
                              onClick: () => setPurchaseSupplier(supplier),
                              "aria-label": `Registrar compra a ${supplier.name}`,
                              "data-ocid": `suppliers.purchase_button.${index + 1}`,
                              className: "gap-1.5",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  PackagePlus,
                                  {
                                    className: "size-3.5",
                                    "aria-hidden": "true"
                                  }
                                ),
                                "Compra"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Button,
                            {
                              type: "button",
                              variant: "ghost",
                              size: "sm",
                              onClick: () => openEdit(supplier),
                              "aria-label": `Editar ${supplier.name}`,
                              "data-ocid": `suppliers.edit_button.${index + 1}`,
                              className: "gap-1.5",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-3.5", "aria-hidden": "true" }),
                                "Editar"
                              ]
                            }
                          )
                        ] }) })
                      ]
                    },
                    supplier.id.toString()
                  );
                }) })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          SupplierDialog,
          {
            open: dialogOpen,
            onOpenChange: setDialogOpen,
            supplier: editing
          }
        ),
        purchaseSupplier ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          PurchaseDialog,
          {
            open: purchaseSupplier !== null,
            onOpenChange: (next) => {
              if (!next) setPurchaseSupplier(null);
            },
            supplier: purchaseSupplier
          }
        ) : null,
        saveSupplier.isError && !dialogOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "suppliers.save_error",
            className: "text-sm text-destructive",
            children: "No se pudo guardar el proveedor. Inténtalo de nuevo."
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ContactImportDialog,
          {
            open: importRows !== null,
            onOpenChange: (open) => {
              if (!open) closeImport();
            },
            kind: "supplier",
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
  SuppliersPage
};
