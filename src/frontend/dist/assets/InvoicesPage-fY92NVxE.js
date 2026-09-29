import { Y as createLucideIcon, k as useBackend, l as useAuth, r as useNavigate, s as useSearch, t as reactExports, m as useQuery, aK as colombiaEndOfDay, aL as colombiaStartOfDay, j as jsxRuntimeExports, B as Button, v as Search, w as Input, K as Label, o as formatNumber, T as TriangleAlert, F as FileText, aM as PaymentStatus, L as Link, z as formatDate, y as formatMoney, Z as cn, A as WhatsAppContext, D as WhatsAppContactKind, G as ChevronRight, N as NotificationSource, x as Badge, aH as PaymentMethod, ao as useQueryClient, aN as PaymentCondition, O as OrderStatus, ap as useMutation, av as ue, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, a3 as DialogFooter } from "./index-EqGEeyjs.js";
import { S as ScanLine, B as BarcodeScanner } from "./BarcodeScanner-DxFj0yM1.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-DUFQVTg_.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-qVL9cwOA.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import { a as useIvaSettings } from "./use-company-B0ILLjch.js";
import { u as useDeleteInvoice } from "./use-invoices-BX2WFwg0.js";
import { u as useReceivables } from "./use-receivables-DiQwYlyH.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import { M as Mail } from "./mail-B11strfl.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { C as ChevronLeft } from "./chevron-left-C2006Y0h.js";
import "./check-LdjEv5O-.js";
import "./textarea-B0CUuiY-.js";
import "./use-whatsapp-DIGqY6EY.js";
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
  ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4", key: "1pf5j1" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M3 15h6", key: "4e2qda" }],
  ["path", { d: "M6 12v6", key: "1u72j0" }]
];
const FilePlus2 = createLucideIcon("file-plus-2", __iconNode);
const PAGE_SIZE = 20;
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
const PAYMENT_STATUS_LABELS = {
  [PaymentStatus.pending]: "Pendiente",
  [PaymentStatus.paid]: "Pagada"
};
const PAYMENT_STATUS_STYLES = {
  [PaymentStatus.pending]: "border-warning/50 bg-warning/15 text-warning",
  [PaymentStatus.paid]: "border-success/50 bg-success/15 text-success"
};
const ORDER_STATUS_LABELS = {
  [OrderStatus.received]: "Recibida",
  [OrderStatus.inRepair]: "En reparación",
  [OrderStatus.ready]: "Lista",
  [OrderStatus.delivered]: "Entregada",
  [OrderStatus.cancelled]: "Cancelada"
};
const INVOICEABLE_STATUSES = [OrderStatus.delivered];
const CONDITION_LABELS = {
  [PaymentCondition.cash]: "Contado",
  [PaymentCondition.credit]: "Crédito"
};
const CONDITION_STYLES = {
  [PaymentCondition.cash]: "border-border bg-muted text-muted-foreground",
  [PaymentCondition.credit]: "border-primary/40 bg-primary/10 text-primary"
};
const MAX_INSTALLMENTS = 36;
function PaymentStatusBadge({ status }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Badge,
    {
      variant: "outline",
      className: cn(
        "font-mono text-[10px] uppercase tracking-wider",
        PAYMENT_STATUS_STYLES[status]
      ),
      children: PAYMENT_STATUS_LABELS[status]
    }
  );
}
function ConditionBadge({ condition }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Badge,
    {
      variant: "outline",
      className: cn(
        "font-mono text-[10px] uppercase tracking-wider",
        CONDITION_STYLES[condition]
      ),
      children: CONDITION_LABELS[condition]
    }
  );
}
function useInvoiceCustomerEmails(customerIds) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const key = customerIds.map((id) => id.toString()).sort().join(",");
  return useQuery({
    queryKey: ["invoice-customer-emails", key],
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
function outstandingBalance(invoice) {
  const plan = invoice.installments;
  if (!plan)
    return invoice.paymentStatus === PaymentStatus.paid ? 0n : invoice.total;
  return plan.installments.reduce(
    (sum, installment) => installment.paid ? sum : sum + installment.amount,
    0n
  );
}
function addMonths(isoDate, months) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const clamped = Math.min(day, lastDay);
  const mm = `${target.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${clamped}`.padStart(2, "0");
  return `${target.getUTCFullYear()}-${mm}-${dd}`;
}
function formatIsoDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "—";
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}
function resolveSearch(raw) {
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    desde: typeof raw.desde === "string" ? raw.desde : "",
    hasta: typeof raw.hasta === "string" ? raw.hasta : "",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1
  };
}
function GenerateInvoiceDialog({
  open,
  onOpenChange
}) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [orderId, setOrderId] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState(PaymentMethod.cash);
  const [condition, setCondition] = reactExports.useState(
    PaymentCondition.cash
  );
  const [installmentCount, setInstallmentCount] = reactExports.useState("3");
  const [firstDueDate, setFirstDueDate] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const ordersQuery = useQuery({
    queryKey: ["orders", "invoiceable"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      const pages = await Promise.all(
        INVOICEABLE_STATUSES.map(
          (status) => actor.listOrders(token, { status }, 0n, 100n)
        )
      );
      return pages.flatMap((page) => page.items);
    },
    enabled: open && !!actor && !isFetching,
    // The invoiceable-order list is stable while the dialog is closed, so it is
    // reused across openings instead of refetching every time.
    staleTime: Number.POSITIVE_INFINITY
  });
  const invoicedOrdersQuery = useQuery({
    queryKey: ["invoices", "invoiced-order-ids"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      const page = await actor.listInvoices(token, {}, 0n, 1000n);
      const ids = /* @__PURE__ */ new Set();
      for (const invoice of page.items) {
        if (invoice.orderId !== void 0) {
          ids.add(invoice.orderId.toString());
        }
      }
      return ids;
    },
    enabled: open && !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY
  });
  const orders = reactExports.useMemo(() => {
    const items = ordersQuery.data ?? [];
    const invoiced = invoicedOrdersQuery.data;
    const available = invoiced ? items.filter((view) => !invoiced.has(view.order.id.toString())) : items;
    return [...available].sort(
      (a, b) => Number(b.order.createdAt - a.order.createdAt)
    );
  }, [ordersQuery.data, invoicedOrdersQuery.data]);
  const selectedOrder = reactExports.useMemo(
    () => orders.find((view) => view.order.id.toString() === orderId) ?? null,
    [orders, orderId]
  );
  const [scannedPart, setScannedPart] = reactExports.useState(null);
  const [scanOpen, setScanOpen] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!open) {
      setOrderId("");
      setMethod(PaymentMethod.cash);
      setCondition(PaymentCondition.cash);
      setInstallmentCount("3");
      setFirstDueDate("");
      setError(null);
      setScannedPart(null);
      setScanOpen(false);
    }
  }, [open]);
  const handlePartDetected = (part, code) => {
    setScannedPart({ part, code });
    ue.success(`${part.name} verificado en el catálogo`);
  };
  const clearScannedPart = () => setScannedPart(null);
  const isCredit = condition === PaymentCondition.credit;
  const parsedCount = Number.parseInt(installmentCount, 10);
  const validCount = Number.isFinite(parsedCount) && parsedCount >= 1 && parsedCount <= MAX_INSTALLMENTS;
  const creditReady = validCount && firstDueDate !== "";
  const previewTotal = (selectedOrder == null ? void 0 : selectedOrder.totals.total) ?? 0n;
  const previewRows = reactExports.useMemo(() => {
    if (!isCredit || !creditReady) return [];
    const base = previewTotal / BigInt(parsedCount);
    const remainder = previewTotal - base * BigInt(parsedCount);
    return Array.from({ length: parsedCount }, (_, index) => ({
      number: index + 1,
      amount: index === parsedCount - 1 ? base + remainder : base,
      dueDate: addMonths(firstDueDate, index)
    }));
  }, [isCredit, creditReady, previewTotal, parsedCount, firstDueDate]);
  const mutation = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createInvoiceFromOrder(
        token,
        input.orderId,
        input.method,
        input.condition,
        input.creditPlan
      );
    },
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      ue.success(`Factura ${invoice.number} generada`);
      onOpenChange(false);
      void navigate({
        to: "/facturas/$id",
        params: { id: invoice.id.toString() }
      });
    },
    onError: () => {
      setError(
        "No se pudo generar la factura. Solo las órdenes entregadas pueden facturarse."
      );
    }
  });
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!orderId) {
      setError("Selecciona una orden entregada para facturar.");
      return;
    }
    if (isCredit && !creditReady) {
      setError(
        "Para el pago a crédito define el número de cuotas y la fecha de la primera cuota."
      );
      return;
    }
    setError(null);
    mutation.mutate({
      orderId: BigInt(orderId),
      method,
      condition,
      creditPlan: isCredit ? {
        installmentCount: BigInt(parsedCount),
        firstDueDate: BigInt((/* @__PURE__ */ new Date(`${firstDueDate}T00:00:00Z`)).getTime()) * 1000000n
      } : null
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "invoices.generate_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Generar factura" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Solo las órdenes de taller entregadas pueden facturarse. El número de factura se asigna de forma consecutiva y los datos fiscales se toman de la configuración del negocio." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invoice-order", children: "Orden de taller entregada" }),
            ordersQuery.isLoading || invoicedOrdersQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }) : ordersQuery.isError || invoicedOrdersQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "invoices.generate_orders_error",
                className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                children: "No se pudieron cargar las órdenes facturables."
              }
            ) : orders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "invoices.generate_orders_empty",
                className: "rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground",
                children: "No hay órdenes entregadas pendientes de facturar. Marca la orden como entregada antes de generar su factura."
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: orderId, onValueChange: setOrderId, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectTrigger,
                {
                  id: "invoice-order",
                  "aria-label": "Orden de taller entregada",
                  "data-ocid": "invoices.order_select",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona una orden entregada" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: orders.map((view) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                SelectItem,
                {
                  value: view.order.id.toString(),
                  children: [
                    view.order.orderNumber,
                    " ·",
                    " ",
                    ORDER_STATUS_LABELS[view.order.status],
                    " ·",
                    " ",
                    formatMoney(view.totals.total)
                  ]
                },
                view.order.id.toString()
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 rounded-md border border-border bg-muted/20 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Verificar repuesto" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Escanea el código de barras o el SKU para consultar el repuesto en el catálogo. Las líneas de la factura provienen de la orden seleccionada." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => setScanOpen((current) => !current),
                  "aria-expanded": scanOpen,
                  "data-ocid": "invoices.scan_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-4", "aria-hidden": "true" }),
                    scanOpen ? "Cerrar escáner" : "Escanear código"
                  ]
                }
              )
            ] }),
            scanOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              BarcodeScanner,
              {
                ocid: "invoices.scanner",
                title: "Escanear repuesto",
                hint: "Apunta la cámara al código del repuesto o ingrésalo manualmente.",
                onDetected: handlePartDetected
              }
            ) : null,
            scannedPart ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "invoices.scanned_part",
                className: "flex items-start justify-between gap-3 rounded-md border border-success/40 bg-success/10 px-3 py-2.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-success", children: "Repuesto encontrado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: scannedPart.part.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail truncate text-xs text-muted-foreground", children: [
                      scannedPart.part.sku,
                      " ·",
                      " ",
                      formatMoney(scannedPart.part.salePrice),
                      " · código",
                      " ",
                      scannedPart.code
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      onClick: clearScannedPart,
                      "data-ocid": "invoices.clear_scanned_part_button",
                      className: "shrink-0 text-muted-foreground",
                      children: "Limpiar"
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "invoices.scanned_part_empty",
                className: "rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
                children: "Aún no has escaneado repuestos. El escaneo consulta el repuesto en el catálogo para verificarlo."
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invoice-method", children: "Método de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: method,
                onValueChange: (value) => setMethod(value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "invoice-method",
                      "aria-label": "Método de pago",
                      "data-ocid": "invoices.method_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: PAYMENT_METHOD_LABELS[option] }, option)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "text-sm font-medium", children: "Condición de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  "aria-pressed": !isCredit,
                  onClick: () => setCondition(PaymentCondition.cash),
                  "data-ocid": "invoices.condition_cash_button",
                  className: cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                    !isCredit ? "border-primary bg-primary/10 text-foreground" : "border-input text-muted-foreground hover:bg-muted/60"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-medium", children: "Contado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "Pago único al emitir" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  "aria-pressed": isCredit,
                  onClick: () => setCondition(PaymentCondition.credit),
                  "data-ocid": "invoices.condition_credit_button",
                  className: cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                    isCredit ? "border-primary bg-primary/10 text-foreground" : "border-input text-muted-foreground hover:bg-muted/60"
                  ),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-medium", children: "Crédito" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: "Cuotas con vencimiento" })
                  ]
                }
              )
            ] })
          ] }),
          isCredit ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-md border border-border bg-muted/30 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invoice-installments", children: "Número de cuotas" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "invoice-installments",
                    type: "number",
                    min: 1,
                    max: MAX_INSTALLMENTS,
                    value: installmentCount,
                    onChange: (event) => setInstallmentCount(event.target.value),
                    "aria-label": "Número de cuotas",
                    "data-ocid": "invoices.installment_count_input",
                    className: "data-rail"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "invoice-first-due", children: "Primera cuota" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "invoice-first-due",
                    type: "date",
                    value: firstDueDate,
                    onChange: (event) => setFirstDueDate(event.target.value),
                    "aria-label": "Fecha de la primera cuota",
                    "data-ocid": "invoices.first_due_date_input",
                    className: "data-rail"
                  }
                )
              ] })
            ] }),
            !validCount ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                "data-ocid": "invoices.installment_count_error",
                className: "text-xs text-destructive",
                children: [
                  "Define entre 1 y ",
                  MAX_INSTALLMENTS,
                  " cuotas."
                ]
              }
            ) : null,
            creditReady ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "invoices.installment_preview", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Vista previa del plan de cuotas" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "installment-table", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", children: "Cuota" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", children: "Vencimiento" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", className: "text-right", children: "Valor" })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewRows.map((row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "installment-number", children: [
                    row.number,
                    " / ",
                    parsedCount
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "installment-due", children: formatIsoDate(row.dueDate) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "installment-amount", children: formatMoney(row.amount) })
                ] }, row.number)) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "installment-summary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Total financiado",
                  " ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatMoney(previewTotal) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Cuotas ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatNumber(parsedCount) })
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "invoices.installment_preview_empty",
                className: "text-xs text-muted-foreground",
                children: "Completa el número de cuotas y la fecha de la primera cuota para ver el valor y el vencimiento de cada una."
              }
            )
          ] }) : null,
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "invoices.generate_error",
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
                "data-ocid": "invoices.generate_cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: mutation.isPending || orders.length === 0,
                "data-ocid": "invoices.generate_submit_button",
                children: mutation.isPending ? "Generando…" : "Generar factura"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function InvoicesPage() {
  var _a, _b;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { isIvaResponsible } = useIvaSettings();
  const rawSearch = useSearch({ strict: false });
  const search = reactExports.useMemo(() => resolveSearch(rawSearch), [rawSearch]);
  const [term, setTerm] = reactExports.useState(search.q);
  const [dialogOpen, setDialogOpen] = reactExports.useState(false);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [deleteError, setDeleteError] = reactExports.useState(null);
  const deleteInvoice = useDeleteInvoice();
  const [notifyTarget, setNotifyTarget] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setTerm(search.q);
  }, [search.q]);
  const applySearch = reactExports.useCallback(
    (patch) => {
      void navigate({
        to: "/facturas",
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
  const offset = (search.pagina - 1) * PAGE_SIZE;
  const invoicesQuery = useQuery({
    queryKey: ["invoices", search.q, search.desde, search.hasta, search.pagina],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listInvoices(
        token,
        {
          search: search.q || void 0,
          from: colombiaStartOfDay(search.desde) ?? void 0,
          to: colombiaEndOfDay(search.hasta) ?? void 0
        },
        BigInt(offset),
        BigInt(PAGE_SIZE)
      );
    },
    enabled: !!actor && !isFetching
  });
  const items = ((_a = invoicesQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = invoicesQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search.q !== "" || search.desde !== "" || search.hasta !== "";
  const customerIds = reactExports.useMemo(
    () => items.map((invoice) => invoice.customerId).filter((id) => id !== void 0),
    [items]
  );
  const emailsQuery = useInvoiceCustomerEmails(customerIds);
  const customerEmails = emailsQuery.data;
  const receivablesQuery = useReceivables({ status: null, search: "" });
  const invoicesWithAbonos = reactExports.useMemo(() => {
    const ids = /* @__PURE__ */ new Set();
    for (const receivable of receivablesQuery.data ?? []) {
      if (receivable.paidAmount > 0n) {
        ids.add(receivable.invoiceId.toString());
      }
    }
    return ids;
  }, [receivablesQuery.data]);
  const openNotify = (invoice) => {
    if (invoice.customerId === void 0) return;
    setNotifyTarget({
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerEmail: (customerEmails == null ? void 0 : customerEmails.get(invoice.customerId.toString())) ?? null,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number
    });
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteError(null);
    deleteInvoice.mutate(target.id, {
      onSuccess: () => {
        ue.success(`Factura ${target.number} eliminada`);
        setDeleteTarget(null);
      },
      onError: (error) => {
        setDeleteError(
          error.message || "No se pudo eliminar la factura. Intenta de nuevo."
        );
      }
    });
  };
  const clearFilters = () => {
    setTerm("");
    void navigate({ to: "/facturas", search: {}, replace: true });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "invoices.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Administración" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Facturación" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Facturas de contado y crédito con su plan de cuotas, impuestos y estado de cobro." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              onClick: () => setDialogOpen(true),
              "data-ocid": "invoices.generate_button",
              className: "gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlus2, { className: "size-4", "aria-hidden": "true" }),
                "Generar factura"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "section",
          {
            "data-ocid": "invoices.filters",
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
                    placeholder: "Buscar por número o cliente…",
                    "aria-label": "Buscar facturas",
                    className: "pl-9",
                    "data-ocid": "invoices.search_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "invoices-from",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Desde"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "invoices-from",
                    type: "date",
                    value: search.desde,
                    onChange: (event) => applySearch({ desde: event.target.value, pagina: 1 }),
                    className: "data-rail w-[160px]",
                    "data-ocid": "invoices.date_from_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "invoices-to",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Hasta"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "invoices-to",
                    type: "date",
                    value: search.hasta,
                    onChange: (event) => applySearch({ hasta: event.target.value, pagina: 1 }),
                    className: "data-rail w-[160px]",
                    "data-ocid": "invoices.date_to_input"
                  }
                )
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: clearFilters,
                  "data-ocid": "invoices.clear_filters_button",
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: invoicesQuery.isLoading ? "Cargando…" : `${formatNumber(total)} factura${total === 1 ? "" : "s"}` }) }),
          invoicesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "invoices.error_state",
              className: "flex flex-col items-center gap-3 px-6 py-14 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "size-6 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar las facturas." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: () => void invoicesQuery.refetch({ cancelRefetch: true }),
                    "data-ocid": "invoices.retry_button",
                    children: "Reintentar"
                  }
                )
              ]
            }
          ) : invoicesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "invoices.loading_state", className: "space-y-2 p-4", children: Array.from({ length: 6 }, (_, index) => `row-${index}`).map(
            (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id)
          ) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "invoices.empty_state",
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
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay facturas emitidas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta la búsqueda o el rango de fechas para encontrar facturas." : "Genera la primera factura a partir de una orden de taller entregada." })
                ] }),
                hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    onClick: clearFilters,
                    "data-ocid": "invoices.empty_clear_button",
                    children: "Limpiar filtros"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    onClick: () => setDialogOpen(true),
                    "data-ocid": "invoices.empty_generate_button",
                    className: "gap-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlus2, { className: "size-4", "aria-hidden": "true" }),
                      "Generar factura"
                    ]
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Número" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Cliente" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fecha" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Subtotal" }),
              isIvaResponsible ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Impuesto" }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Condición" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Método" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Saldo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Estado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: items.map((invoice, index) => {
              var _a2;
              const balance = outstandingBalance(invoice);
              const hasRegisteredPayments = invoice.paymentStatus === PaymentStatus.paid || (((_a2 = invoice.installments) == null ? void 0 : _a2.installments.some(
                (installment) => installment.paid
              )) ?? false) || invoicesWithAbonos.has(invoice.id.toString());
              const canDelete = !hasRegisteredPayments;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                TableRow,
                {
                  "data-ocid": `invoices.row.${index + 1}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Link,
                      {
                        to: "/facturas/$id",
                        params: { id: invoice.id.toString() },
                        "data-ocid": `invoices.link.${index + 1}`,
                        className: "data-rail text-sm font-medium text-primary underline-offset-4 hover:underline",
                        children: invoice.number
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[240px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: invoice.customerName }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: formatDate(invoice.issuedAt) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(invoice.subtotal) }),
                    isIvaResponsible ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(invoice.tax) }) : null,
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-semibold", children: formatMoney(invoice.total) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConditionBadge, { condition: invoice.paymentCondition }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: PAYMENT_METHOD_LABELS[invoice.paymentMethod] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TableCell,
                      {
                        "data-ocid": `invoices.balance.${index + 1}`,
                        className: cn(
                          "data-rail text-right",
                          balance > 0n ? "font-medium text-warning" : "text-muted-foreground"
                        ),
                        children: formatMoney(balance)
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatusBadge, { status: invoice.paymentStatus }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "icon",
                          onClick: () => openNotify(invoice),
                          "aria-label": `Notificar al cliente de la factura ${invoice.number}`,
                          "data-ocid": `invoices.notify_button.${index + 1}`,
                          className: "text-muted-foreground hover:text-primary",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "size-4", "aria-hidden": "true" })
                        }
                      ),
                      invoice.customerId !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        WhatsAppNotifyButton,
                        {
                          contactKind: WhatsAppContactKind.customer,
                          contactId: invoice.customerId,
                          context: WhatsAppContext.invoice,
                          referenceId: invoice.id,
                          contactName: invoice.customerName,
                          ocid: `invoices.whatsapp_button.${index + 1}`
                        }
                      ) : null,
                      canDelete ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "icon",
                          onClick: () => {
                            setDeleteError(null);
                            setDeleteTarget(invoice);
                          },
                          "aria-label": `Eliminar la factura ${invoice.number}`,
                          "data-ocid": `invoices.delete_button.${index + 1}`,
                          className: "text-muted-foreground hover:text-destructive",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                        }
                      ) : null
                    ] }) })
                  ]
                },
                invoice.id.toString()
              );
            }) })
          ] }),
          !invoicesQuery.isLoading && !invoicesQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-border px-4 py-2.5", children: [
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
                  "data-ocid": "invoices.pagination_prev",
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
                  "data-ocid": "invoices.pagination_next",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(GenerateInvoiceDialog, { open: dialogOpen, onOpenChange: setDialogOpen }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialog,
          {
            open: deleteTarget !== null,
            onOpenChange: (open) => {
              if (!open) {
                setDeleteTarget(null);
                setDeleteError(null);
              }
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { "data-ocid": "invoices.delete_dialog", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { className: "font-display", children: [
                  "¿Eliminar la factura ",
                  deleteTarget == null ? void 0 : deleteTarget.number,
                  "?"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Solo se pueden eliminar facturas pendientes de pago y sin abonos registrados. Al eliminarla, la orden o venta de origen queda disponible para facturarse de nuevo. Esta acción no se puede deshacer." })
              ] }),
              deleteError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  "data-ocid": "invoices.delete_error",
                  className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                  children: deleteError
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AlertDialogCancel,
                  {
                    "data-ocid": "invoices.delete_cancel_button",
                    disabled: deleteInvoice.isPending,
                    children: "Cancelar"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AlertDialogAction,
                  {
                    "data-ocid": "invoices.delete_confirm_button",
                    disabled: deleteInvoice.isPending,
                    onClick: (event) => {
                      event.preventDefault();
                      confirmDelete();
                    },
                    className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    children: deleteInvoice.isPending ? "Eliminando…" : "Eliminar factura"
                  }
                )
              ] })
            ] })
          }
        ),
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
            source: NotificationSource.invoice,
            referenceId: notifyTarget.invoiceId,
            defaultSubject: `Estado de tu factura ${notifyTarget.invoiceNumber}`,
            defaultMessage: `Hola ${notifyTarget.customerName}, te compartimos el estado actual de tu factura ${notifyTarget.invoiceNumber}. Si tienes alguna duda sobre el cobro o el plan de pagos, respóndenos a este correo y con gusto te atendemos.`
          }
        ) : null
      ]
    }
  );
}
export {
  InvoicesPage
};
