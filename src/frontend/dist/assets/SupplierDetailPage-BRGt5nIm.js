import { Y as createLucideIcon, k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation, t as reactExports, j as jsxRuntimeExports, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, w as Input, C as ClipboardList, a3 as DialogFooter, B as Button, av as ue, al as useParams, aG as PayableStatus, L as Link, e as Wallet, T as TriangleAlert, f as Building2, z as formatDate, x as Badge, R as Receipt, y as formatMoney, o as formatNumber, aH as PaymentMethod, v as Search, p as PartSort } from "./index-EqGEeyjs.js";
import { S as ScanLine, B as BarcodeScanner } from "./BarcodeScanner-DxFj0yM1.js";
import { C as ContactDocumentPreview } from "./ContactDocumentPreview-CPtpdE92.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-qVL9cwOA.js";
import { C as Card, c as CardContent, a as CardHeader, b as CardTitle } from "./card-YKA4f36t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import { u as useDeletePurchase } from "./use-purchase-invoices-CnpFpiIX.js";
import { s as supplierContactDocument } from "./use-whatsapp-DIGqY6EY.js";
import { A as ArrowLeft } from "./arrow-left-DSEilCsK.js";
import { P as PackagePlus } from "./package-plus-DDYRgHvR.js";
import { P as Phone } from "./phone-D7UovjEM.js";
import { M as Mail } from "./mail-B11strfl.js";
import { M as MapPin } from "./map-pin-B-fyyO2n.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import "./check-LdjEv5O-.js";
import "./DocumentPreview-C4gHQdTZ.js";
import "./printer-CZZ39YEy.js";
import "./download-C8tLpeh6.js";
import "./use-hope-35eM4bcJ.js";
import "./pdf-BjjrMDP3.js";
import "./download-DPgaDAHv.js";
import "./warranty-BU5LnZHy.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" }],
  ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }]
];
const CreditCard = createLucideIcon("credit-card", __iconNode);
function useSupplierOrders(params) {
  var _a;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const search = params.search.trim();
  return useQuery({
    queryKey: [
      "supplier-orders",
      ((_a = params.supplierId) == null ? void 0 : _a.toString()) ?? "all",
      search
    ],
    queryFn: async () => {
      if (!actor) return [];
      const filter = {
        supplierId: params.supplierId ?? void 0,
        search: search.length > 0 ? search : void 0
      };
      return actor.listSupplierOrders(token, filter);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateSupplierOrder() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createSupplierOrder(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
    }
  });
}
function parseQuantity$1(value) {
  const normalized = value.trim();
  if (normalized === "") return null;
  const quantity = Number(normalized);
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  return BigInt(quantity);
}
function SupplierOrderDialog({
  open,
  onOpenChange,
  supplierId
}) {
  const [quantity, setQuantity] = reactExports.useState("1");
  const [sku, setSku] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const createSupplierOrder = useCreateSupplierOrder();
  function handleOpenChange(next) {
    if (next) {
      setQuantity("1");
      setSku("");
      setDescription("");
      setError(null);
    }
    onOpenChange(next);
  }
  function handleSubmit(event) {
    event.preventDefault();
    const parsedQuantity = parseQuantity$1(quantity);
    if (parsedQuantity === null) {
      setError("La cantidad debe ser un número entero mayor a cero.");
      return;
    }
    const trimmedSku = sku.trim();
    if (trimmedSku === "") {
      setError("Ingresa el SKU del repuesto solicitado.");
      return;
    }
    const trimmedDescription = description.trim();
    if (trimmedDescription === "") {
      setError("Ingresa una descripción del pedido.");
      return;
    }
    setError(null);
    createSupplierOrder.mutate(
      {
        supplierId,
        quantity: parsedQuantity,
        sku: trimmedSku,
        description: trimmedDescription
      },
      {
        onSuccess: () => {
          ue.success("Pedido a proveedor guardado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            mutationError.message || "No se pudo guardar el pedido. Revisa los datos e inténtalo de nuevo."
          );
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "supplier_order.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Pedido a proveedor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Registra un pedido con la cantidad, el SKU y la descripción del repuesto que necesitas solicitar." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-order-quantity", children: "Cantidad" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "supplier-order-quantity",
                value: quantity,
                onChange: (event) => setQuantity(event.target.value),
                inputMode: "numeric",
                placeholder: "10",
                "data-ocid": "supplier_order.quantity_input",
                className: "data-rail",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-order-sku", children: "SKU" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "supplier-order-sku",
                value: sku,
                onChange: (event) => setSku(event.target.value),
                placeholder: "FIL-ACE-10W40",
                "data-ocid": "supplier_order.sku_input",
                className: "data-rail",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "supplier-order-description", children: "Descripción" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "supplier-order-description",
                value: description,
                onChange: (event) => setDescription(event.target.value),
                placeholder: "Filtro de aceite para motos 150cc…",
                "data-ocid": "supplier_order.description_input",
                rows: 3,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ClipboardList,
              {
                className: "mt-0.5 size-4 shrink-0 text-primary",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "El pedido queda registrado en el detalle del proveedor para hacerle seguimiento a la solicitud." })
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "supplier_order.error",
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
                "data-ocid": "supplier_order.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: createSupplierOrder.isPending,
                "data-ocid": "supplier_order.submit_button",
                children: createSupplierOrder.isPending ? "Guardando…" : "Guardar pedido"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
const PART_SEARCH_LIMIT = 1000n;
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
function useSupplier(id) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["supplier", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSupplier(token, id);
    },
    enabled: !!actor && !isFetching
  });
}
function usePayable(id) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["payable", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPayable(token, id);
    },
    enabled: !!actor && !isFetching
  });
}
function usePurchases(id) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["purchases", id.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPurchases(token, id);
    },
    enabled: !!actor && !isFetching
  });
}
function usePayments(id) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["payments", id.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPayments(token, id);
    },
    enabled: !!actor && !isFetching
  });
}
function useCreatePurchase() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPurchase(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["purchases"] });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier"] });
    }
  });
}
function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
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
function useRegisterPayment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerPayment(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
      void queryClient.invalidateQueries({ queryKey: ["purchases"] });
    }
  });
}
function parseAmountToCents(value) {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return BigInt(Math.round(amount * 100));
}
function parseQuantity(value) {
  const normalized = value.trim();
  if (normalized === "") return null;
  const quantity = Number(normalized);
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  return BigInt(quantity);
}
function parseId(value) {
  const normalized = value.trim();
  if (normalized === "") return null;
  try {
    const id = BigInt(normalized);
    return id >= 0n ? id : null;
  } catch {
    return null;
  }
}
function newItemDraft(key) {
  return { key, part: null, lotNumber: "", quantity: "1", unitCost: "" };
}
function centsToInput(value) {
  if (value === void 0) return "";
  return (Number(value) / 100).toFixed(2);
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
          "data-ocid": `supplier_detail.part_clear_button.${index}`,
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
          placeholder: "Buscar repuesto por ID o SKU…",
          "aria-label": `Buscar repuesto para la partida ${index}`,
          "data-ocid": `supplier_detail.part_search_input.${index}`,
          className: "pl-9"
        }
      )
    ] }),
    open ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": `supplier_detail.part_results.${index}`,
        className: "max-h-52 overflow-y-auto rounded-md border border-border bg-card",
        children: partsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-3 text-xs text-muted-foreground", children: "Buscando repuestos…" }) : partsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-3 text-xs text-destructive", children: "No se pudo cargar el catálogo de repuestos. Inténtalo de nuevo." }) : results.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-3 py-3 text-xs text-muted-foreground", children: debouncedTerm.trim() === "" ? "Escribe para buscar en el catálogo de repuestos." : "Sin resultados. Ningún repuesto coincide con la búsqueda." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: results.map((part, resultIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              onSelect(part);
              setOpen(false);
            },
            "data-ocid": `supplier_detail.part_option.${index}.${resultIndex + 1}`,
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
function PurchaseDialog({
  open,
  onOpenChange,
  supplierId
}) {
  const [items, setItems] = reactExports.useState([
    newItemDraft("item-1")
  ]);
  const [error, setError] = reactExports.useState(null);
  const [scanItemKey, setScanItemKey] = reactExports.useState(null);
  const createPurchase = useCreatePurchase();
  function handleOpenChange(next) {
    if (next) {
      setItems([newItemDraft("item-1")]);
      setError(null);
      setScanItemKey(null);
    }
    onOpenChange(next);
  }
  function updateItem(key, patch) {
    setItems(
      (current) => current.map((item) => item.key === key ? { ...item, ...patch } : item)
    );
  }
  function selectPart(key, part) {
    updateItem(key, {
      part,
      unitCost: part === null ? "" : centsToInput(part.costPrice)
    });
  }
  function handleScanCode(part) {
    const key = scanItemKey;
    if (key === null) return;
    selectPart(key, part);
    ue.success(`${part.name} asignado a la partida`);
    setScanItemKey(null);
  }
  function addItem() {
    setItems((current) => [
      ...current,
      newItemDraft(`item-${current.length + 1}-${Date.now()}`)
    ]);
  }
  function removeItem(key) {
    setItems((current) => current.filter((item) => item.key !== key));
  }
  function handleSubmit(event) {
    event.preventDefault();
    const parsed = [];
    for (const item of items) {
      const quantity = parseQuantity(item.quantity);
      const unitCost = parseAmountToCents(item.unitCost);
      const lotNumber = item.lotNumber.trim();
      if (!item.part) {
        setError("Selecciona un repuesto del catálogo en cada partida.");
        return;
      }
      if (lotNumber === "") {
        setError("Cada partida necesita un número de lote o serie.");
        return;
      }
      if (quantity === null) {
        setError("Las cantidades deben ser números enteros mayores a cero.");
        return;
      }
      if (unitCost === null) {
        setError("Los costos unitarios deben ser mayores a cero.");
        return;
      }
      parsed.push({ partId: item.part.id, lotNumber, quantity, unitCost });
    }
    if (parsed.length === 0) {
      setError("Agrega al menos una partida a la compra.");
      return;
    }
    setError(null);
    createPurchase.mutate(
      { supplierId, items: parsed },
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: handleOpenChange, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        "data-ocid": "supplier_detail.purchase_dialog",
        className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Registrar compra de reposición" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Al registrar la compra, el stock de cada repuesto aumenta automáticamente y se crea el lote o número de serie indicado." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: items.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": `supplier_detail.purchase_item.${index + 1}`,
                className: "rounded-md border border-border bg-muted/20 p-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                      "Partida ",
                      index + 1
                    ] }),
                    items.length > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "ghost",
                        size: "sm",
                        onClick: () => removeItem(item.key),
                        "aria-label": `Quitar partida ${index + 1}`,
                        "data-ocid": `supplier_detail.remove_item_button.${index + 1}`,
                        className: "gap-1.5 text-destructive hover:text-destructive",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5", "aria-hidden": "true" }),
                          "Quitar"
                        ]
                      }
                    ) : null
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `part-search-${item.key}`, children: "Repuesto (ID o SKU)" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Button,
                          {
                            type: "button",
                            variant: "outline",
                            size: "sm",
                            onClick: () => setScanItemKey(item.key),
                            "data-ocid": `supplier_detail.scan_part_button.${index + 1}`,
                            className: "gap-1.5",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-3.5", "aria-hidden": "true" }),
                              "Escanear"
                            ]
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        PartPicker,
                        {
                          index: index + 1,
                          selected: item.part,
                          onSelect: (part) => selectPart(item.key, part)
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `lot-${item.key}`, children: "Lote / serie" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: `lot-${item.key}`,
                          value: item.lotNumber,
                          onChange: (event) => updateItem(item.key, { lotNumber: event.target.value }),
                          placeholder: "L-2026-041",
                          "data-ocid": `supplier_detail.lot_input.${index + 1}`,
                          className: "data-rail",
                          required: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `qty-${item.key}`, children: "Cantidad" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: `qty-${item.key}`,
                          value: item.quantity,
                          onChange: (event) => updateItem(item.key, { quantity: event.target.value }),
                          inputMode: "numeric",
                          placeholder: "10",
                          "data-ocid": `supplier_detail.quantity_input.${index + 1}`,
                          className: "data-rail",
                          required: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `cost-${item.key}`, children: "Costo unitario (COP)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Input,
                        {
                          id: `cost-${item.key}`,
                          value: item.unitCost,
                          onChange: (event) => updateItem(item.key, { unitCost: event.target.value }),
                          inputMode: "decimal",
                          placeholder: "450.00",
                          "data-ocid": `supplier_detail.unit_cost_input.${index + 1}`,
                          className: "data-rail",
                          required: true
                        }
                      )
                    ] })
                  ] })
                ]
              },
              item.key
            )) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: addItem,
                "data-ocid": "supplier_detail.add_item_button",
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
                "data-ocid": "supplier_detail.purchase_error",
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
                  "data-ocid": "supplier_detail.purchase_cancel_button",
                  children: "Cancelar"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "submit",
                  disabled: createPurchase.isPending,
                  "data-ocid": "supplier_detail.purchase_submit_button",
                  children: createPurchase.isPending ? "Registrando…" : "Registrar compra"
                }
              )
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Dialog,
      {
        open: scanItemKey !== null,
        onOpenChange: (open2) => {
          if (!open2) setScanItemKey(null);
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          DialogContent,
          {
            "data-ocid": "supplier_detail.scan_part_dialog",
            className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 font-display", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-4 text-primary", "aria-hidden": "true" }),
                  "Escanear repuesto"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Lee el código de barras del repuesto o ingrésalo manualmente para asignarlo a la partida seleccionada." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                BarcodeScanner,
                {
                  ocid: "supplier_detail.scan_part",
                  title: "Lector de códigos",
                  hint: "Apunta la cámara al código del repuesto o ingrésalo manualmente.",
                  onDetected: (part) => handleScanCode(part),
                  onNotFound: (code) => {
                    ue.error(`Producto no encontrado para el código ${code}`);
                  }
                }
              )
            ]
          }
        )
      }
    )
  ] });
}
function PaymentDialog({
  open,
  onOpenChange,
  supplierId,
  purchases,
  suggestedAmount
}) {
  const [amount, setAmount] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState(PaymentMethod.cash);
  const [purchaseId, setPurchaseId] = reactExports.useState("none");
  const [note, setNote] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const registerPayment = useRegisterPayment();
  function handleOpenChange(next) {
    if (next) {
      setAmount(
        suggestedAmount > 0n ? (Number(suggestedAmount) / 100).toFixed(2) : ""
      );
      setMethod(PaymentMethod.cash);
      setPurchaseId("none");
      setNote("");
      setError(null);
    }
    onOpenChange(next);
  }
  function handleSubmit(event) {
    event.preventDefault();
    const cents = parseAmountToCents(amount);
    if (cents === null) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    const linkedPurchase = purchaseId === "none" ? null : parseId(purchaseId);
    if (purchaseId !== "none" && linkedPurchase === null) {
      setError("La compra seleccionada no es válida.");
      return;
    }
    const trimmedNote = note.trim();
    setError(null);
    registerPayment.mutate(
      {
        supplierId,
        amount: cents,
        method,
        purchaseId: linkedPurchase ?? void 0,
        note: trimmedNote === "" ? void 0 : trimmedNote
      },
      {
        onSuccess: () => {
          ue.success("Pago registrado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            mutationError.message || "No se pudo registrar el pago. Revisa el monto e inténtalo de nuevo."
          );
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "supplier_detail.payment_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Registrar pago" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Aplica un pago total o parcial al saldo pendiente del proveedor." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payment-amount", children: "Monto (COP)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "payment-amount",
                value: amount,
                onChange: (event) => setAmount(event.target.value),
                inputMode: "decimal",
                placeholder: "1500.00",
                "data-ocid": "supplier_detail.payment_amount_input",
                className: "data-rail",
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Saldo pendiente actual: ",
              formatMoney(suggestedAmount)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payment-method", children: "Método de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: method,
                onValueChange: (value) => setMethod(value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "payment-method",
                      "data-ocid": "supplier_detail.payment_method_select",
                      className: "w-full",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona un método" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: PAYMENT_METHOD_LABELS[option] }, option)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payment-purchase", children: "Compra (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: purchaseId, onValueChange: setPurchaseId, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectTrigger,
                {
                  id: "payment-purchase",
                  "data-ocid": "supplier_detail.payment_purchase_select",
                  className: "w-full",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sin compra específica" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sin compra específica" }),
                purchases.map((purchase) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SelectItem,
                  {
                    value: purchase.id.toString(),
                    children: `Compra #${purchase.id.toString()} · ${formatDate(purchase.createdAt)} · ${formatMoney(purchase.total)}`
                  },
                  purchase.id.toString()
                ))
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payment-note", children: "Nota (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "payment-note",
                value: note,
                onChange: (event) => setNote(event.target.value),
                placeholder: "Transferencia bancaria, referencia 8842…",
                "data-ocid": "supplier_detail.payment_note_input",
                rows: 3
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "supplier_detail.payment_error",
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
                "data-ocid": "supplier_detail.payment_cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: registerPayment.isPending,
                "data-ocid": "supplier_detail.payment_submit_button",
                children: registerPayment.isPending ? "Registrando…" : "Registrar pago"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function DeletePurchaseDialog({
  open,
  onOpenChange,
  purchase
}) {
  const [error, setError] = reactExports.useState(null);
  const deletePurchase = useDeletePurchase();
  function handleOpenChange(next) {
    if (next) setError(null);
    onOpenChange(next);
  }
  function confirmDelete() {
    if (!purchase) return;
    setError(null);
    deletePurchase.mutate(purchase.id, {
      onSuccess: () => {
        ue.success(`Compra #${purchase.id.toString()} eliminada`);
        onOpenChange(false);
      },
      onError: (mutationError) => {
        setError(
          mutationError.message || "No se pudo eliminar la compra. Inténtalo de nuevo."
        );
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { "data-ocid": "supplier_detail.delete_purchase_dialog", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { className: "font-display", children: [
        "¿Eliminar la compra #",
        (purchase == null ? void 0 : purchase.id.toString()) ?? "",
        "?"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Solo se pueden eliminar compras que aún no han sido aceptadas ni confirmadas. Al eliminarla se revierten sus lotes y movimientos de inventario asociados. Esta acción no se puede deshacer." })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        "data-ocid": "supplier_detail.delete_purchase_error",
        className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        children: error
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AlertDialogCancel,
        {
          "data-ocid": "supplier_detail.delete_purchase_cancel_button",
          disabled: deletePurchase.isPending,
          children: "Cancelar"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        AlertDialogAction,
        {
          "data-ocid": "supplier_detail.delete_purchase_confirm_button",
          disabled: deletePurchase.isPending,
          onClick: (event) => {
            event.preventDefault();
            confirmDelete();
          },
          className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          children: deletePurchase.isPending ? "Eliminando…" : "Eliminar compra"
        }
      )
    ] })
  ] }) });
}
function DetailSkeleton() {
  const rows = Array.from({ length: 4 }, (_, index) => `detail-row-${index}`);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "supplier_detail.loading_state", className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" })
    ] }),
    rows.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-11 w-full" }, id))
  ] });
}
function InfoRow({
  icon: Icon,
  label,
  value,
  mono
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Icon,
      {
        className: "mt-0.5 size-3.5 shrink-0 text-muted-foreground",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `truncate text-sm ${mono ? "data-rail" : ""}`, children: value })
    ] })
  ] });
}
function SupplierDetailPage() {
  const params = useParams({ from: "/proveedores/$id" });
  const supplierId = BigInt(params.id);
  const supplierQuery = useSupplier(supplierId);
  const payableQuery = usePayable(supplierId);
  const purchasesQuery = usePurchases(supplierId);
  const paymentsQuery = usePayments(supplierId);
  const supplierOrdersQuery = useSupplierOrders({
    supplierId,
    search: ""
  });
  const [purchaseOpen, setPurchaseOpen] = reactExports.useState(false);
  const [paymentOpen, setPaymentOpen] = reactExports.useState(false);
  const [supplierOrderOpen, setSupplierOrderOpen] = reactExports.useState(false);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const supplier = supplierQuery.data ?? null;
  const payable = payableQuery.data ?? null;
  const purchases = purchasesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const supplierOrders = supplierOrdersQuery.data ?? [];
  const isLoading = supplierQuery.isLoading || payableQuery.isLoading || purchasesQuery.isLoading || paymentsQuery.isLoading;
  const isError = supplierQuery.isError || payableQuery.isError || purchasesQuery.isError || paymentsQuery.isError;
  function refetchAll() {
    void supplierQuery.refetch();
    void payableQuery.refetch();
    void purchasesQuery.refetch();
    void paymentsQuery.refetch();
    void supplierOrdersQuery.refetch();
  }
  const balance = (payable == null ? void 0 : payable.balance) ?? 0n;
  const isPaid = (payable == null ? void 0 : payable.status) === PayableStatus.paid;
  const contactDocument = supplier ? supplierContactDocument(supplier) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "supplier_detail.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              asChild: true,
              variant: "ghost",
              size: "sm",
              "data-ocid": "supplier_detail.back_button",
              className: "gap-1.5",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/proveedores", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Proveedores"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: refetchAll,
                "data-ocid": "supplier_detail.refresh_button",
                children: "Actualizar"
              }
            ),
            supplier && contactDocument ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              ContactDocumentPreview,
              {
                document: contactDocument,
                ocid: "supplier_detail.preview_button",
                label: "Ver ficha"
              }
            ) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setPaymentOpen(true),
                disabled: isLoading || isPaid,
                "data-ocid": "supplier_detail.open_payment_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "size-4", "aria-hidden": "true" }),
                  "Registrar pago"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setSupplierOrderOpen(true),
                disabled: isLoading,
                "data-ocid": "supplier_detail.open_supplier_order_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "size-4", "aria-hidden": "true" }),
                  "Pedido a proveedor"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                size: "sm",
                onClick: () => setPurchaseOpen(true),
                disabled: isLoading,
                "data-ocid": "supplier_detail.open_purchase_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PackagePlus, { className: "size-4", "aria-hidden": "true" }),
                  "Registrar compra"
                ]
              }
            )
          ] })
        ] }),
        isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "supplier_detail.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-5 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "No se pudo cargar el proveedor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: refetchAll,
                  "data-ocid": "supplier_detail.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(DetailSkeleton, {}) : !supplier ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "supplier_detail.not_found_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Building2,
                {
                  className: "size-5 text-muted-foreground",
                  "aria-hidden": "true"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Proveedor no encontrado" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "El proveedor solicitado no existe o fue eliminado. Vuelve al directorio para elegir otro." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/proveedores", children: "Volver a proveedores" }) })
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Card,
            {
              "data-ocid": "supplier_detail.header.card",
              className: "gap-0 overflow-hidden rounded-lg py-0 shadow-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex flex-wrap items-start justify-between gap-4 px-5 py-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Building2,
                      {
                        className: "size-5 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate font-display text-xl font-semibold tracking-tight", children: supplier.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        "Proveedor registrado el ",
                        formatDate(supplier.createdAt)
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "outline",
                      "data-ocid": "supplier_detail.status_badge",
                      className: isPaid ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning",
                      children: isPaid ? "Pagada" : "Pendiente"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 border-t border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    InfoRow,
                    {
                      icon: Phone,
                      label: "Teléfono",
                      value: supplier.phone,
                      mono: true
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    InfoRow,
                    {
                      icon: Mail,
                      label: "Correo",
                      value: supplier.email ?? "—"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    InfoRow,
                    {
                      icon: Receipt,
                      label: "NIT / ID fiscal",
                      value: supplier.taxId ?? "—",
                      mono: true
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    InfoRow,
                    {
                      icon: MapPin,
                      label: "Dirección",
                      value: supplier.address ?? "—"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    InfoRow,
                    {
                      icon: Building2,
                      label: "Contacto",
                      value: supplier.contactName ?? "—"
                    }
                  )
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "section",
            {
              "data-ocid": "supplier_detail.payable.section",
              "aria-label": "Resumen de cuenta por pagar",
              className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
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
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Total comprado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xl font-semibold leading-none", children: formatMoney((payable == null ? void 0 : payable.totalPurchased) ?? 0n) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      "aria-hidden": "true",
                      className: "absolute inset-y-0 left-0 w-0.5 bg-success"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Total pagado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xl font-semibold leading-none", children: formatMoney((payable == null ? void 0 : payable.totalPaid) ?? 0n) })
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
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Saldo pendiente" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xl font-semibold leading-none", children: formatMoney(balance) })
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
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Estado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-xl font-semibold leading-none", children: isPaid ? "Pagada" : "Pendiente" })
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Card,
            {
              "data-ocid": "supplier_detail.purchases.card",
              className: "gap-0 overflow-hidden rounded-lg py-0 shadow-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "size-4 text-primary", "aria-hidden": "true" }),
                    "Compras registradas"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "outline",
                      className: "border-border bg-muted/40 text-muted-foreground",
                      children: formatNumber(purchases.length)
                    }
                  )
                ] }) }),
                purchases.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "supplier_detail.purchases.empty_state",
                    className: "flex flex-col items-center gap-3 px-6 py-12 text-center",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        PackagePlus,
                        {
                          className: "size-5 text-muted-foreground",
                          "aria-hidden": "true"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "Sin compras registradas" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Registra una compra de reposición para aumentar el stock y generar el lote correspondiente." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          size: "sm",
                          onClick: () => setPurchaseOpen(true),
                          "data-ocid": "supplier_detail.purchases.empty_create_button",
                          className: "gap-1.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(PackagePlus, { className: "size-4", "aria-hidden": "true" }),
                            "Registrar compra"
                          ]
                        }
                      )
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "supplier_detail.purchases.table", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-4", children: "Compra" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Fecha" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Repuestos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Total" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Pagado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: purchases.map((purchase, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    TableRow,
                    {
                      "data-ocid": `supplier_detail.purchase_row.${index + 1}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "data-rail pl-4 font-medium", children: [
                          "#",
                          purchase.id.toString()
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: formatDate(purchase.createdAt) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: purchase.items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          Badge,
                          {
                            variant: "outline",
                            className: "border-border bg-muted/40 font-normal text-muted-foreground",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: item.lotNumber }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail", children: [
                                "×",
                                formatNumber(item.quantity)
                              ] })
                            ]
                          },
                          item.id.toString()
                        )) }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-semibold", children: formatMoney(purchase.total) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(purchase.paidAmount) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: purchase.accepted ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Badge,
                          {
                            variant: "outline",
                            "data-ocid": `supplier_detail.purchase_accepted_badge.${index + 1}`,
                            className: "border-success/40 bg-success/10 font-mono text-[10px] uppercase tracking-wider text-success",
                            children: "Aceptada"
                          }
                        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "icon",
                            onClick: () => setDeleteTarget(purchase),
                            "aria-label": `Eliminar la compra #${purchase.id.toString()}`,
                            "data-ocid": `supplier_detail.delete_purchase_button.${index + 1}`,
                            className: "size-8 text-muted-foreground hover:text-destructive",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                          }
                        ) })
                      ]
                    },
                    purchase.id.toString()
                  )) })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Card,
            {
              "data-ocid": "supplier_detail.supplier_orders.card",
              className: "gap-0 overflow-hidden rounded-lg py-0 shadow-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ClipboardList,
                      {
                        className: "size-4 text-primary",
                        "aria-hidden": "true"
                      }
                    ),
                    "Pedidos a proveedor"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "outline",
                      className: "border-border bg-muted/40 text-muted-foreground",
                      children: formatNumber(supplierOrders.length)
                    }
                  )
                ] }) }),
                supplierOrders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "supplier_detail.supplier_orders.empty_state",
                    className: "flex flex-col items-center gap-3 px-6 py-12 text-center",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        ClipboardList,
                        {
                          className: "size-5 text-muted-foreground",
                          "aria-hidden": "true"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "Sin pedidos a proveedor" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Registra un pedido con la cantidad, el SKU y la descripción del repuesto que necesitas solicitar." })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          size: "sm",
                          onClick: () => setSupplierOrderOpen(true),
                          "data-ocid": "supplier_detail.supplier_orders.empty_create_button",
                          className: "gap-1.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "size-4", "aria-hidden": "true" }),
                            "Pedido a proveedor"
                          ]
                        }
                      )
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "supplier_detail.supplier_orders.table", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-4 text-right", children: "Cantidad" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "SKU" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Descripción" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right", children: "Fecha" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: supplierOrders.map((order, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    TableRow,
                    {
                      "data-ocid": `supplier_detail.supplier_order_row.${index + 1}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail pl-4 text-right font-semibold", children: formatNumber(order.quantity) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail", children: order.sku }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[24rem] truncate text-muted-foreground", children: order.description }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right text-muted-foreground", children: formatDate(order.createdAt) })
                      ]
                    },
                    order.id.toString()
                  )) })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Card,
            {
              "data-ocid": "supplier_detail.payments.card",
              className: "gap-0 overflow-hidden rounded-lg py-0 shadow-none",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      CreditCard,
                      {
                        className: "size-4 text-primary",
                        "aria-hidden": "true"
                      }
                    ),
                    "Pagos registrados"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      variant: "outline",
                      className: "border-border bg-muted/40 text-muted-foreground",
                      children: formatNumber(payments.length)
                    }
                  )
                ] }) }),
                payments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "supplier_detail.payments.empty_state",
                    className: "flex flex-col items-center gap-3 px-6 py-12 text-center",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Wallet,
                        {
                          className: "size-5 text-muted-foreground",
                          "aria-hidden": "true"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "Sin pagos registrados" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: isPaid ? "Este proveedor no tiene saldo pendiente por liquidar." : "Registra un pago total o parcial para reducir el saldo pendiente." })
                      ] }),
                      !isPaid ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          size: "sm",
                          onClick: () => setPaymentOpen(true),
                          "data-ocid": "supplier_detail.payments.empty_create_button",
                          className: "gap-1.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "size-4", "aria-hidden": "true" }),
                            "Registrar pago"
                          ]
                        }
                      ) : null
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "supplier_detail.payments.table", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-4", children: "Fecha" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Método" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Compra" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Nota" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right", children: "Monto" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: payments.map((payment, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    TableRow,
                    {
                      "data-ocid": `supplier_detail.payment_row.${index + 1}`,
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pl-4 text-muted-foreground", children: formatDate(payment.at) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Badge,
                          {
                            variant: "outline",
                            className: "border-border bg-muted/40 font-normal text-muted-foreground",
                            children: PAYMENT_METHOD_LABELS[payment.method]
                          }
                        ) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-muted-foreground", children: payment.purchaseId !== void 0 ? `#${payment.purchaseId.toString()}` : "—" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[16rem] truncate text-muted-foreground", children: payment.note ?? "—" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail pr-4 text-right font-semibold", children: formatMoney(payment.amount) })
                      ]
                    },
                    payment.id.toString()
                  )) })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PurchaseDialog,
            {
              open: purchaseOpen,
              onOpenChange: setPurchaseOpen,
              supplierId
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PaymentDialog,
            {
              open: paymentOpen,
              onOpenChange: setPaymentOpen,
              supplierId,
              purchases,
              suggestedAmount: balance
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SupplierOrderDialog,
            {
              open: supplierOrderOpen,
              onOpenChange: setSupplierOrderOpen,
              supplierId
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DeletePurchaseDialog,
            {
              open: deleteTarget !== null,
              onOpenChange: (open) => {
                if (!open) setDeleteTarget(null);
              },
              purchase: deleteTarget
            }
          )
        ] })
      ]
    }
  );
}
export {
  SupplierDetailPage
};
