import { ae as useParams, u as useBackend, i as useAuth, y as useNavigate, r as reactExports, k as useQuery, j as jsxRuntimeExports, p as TriangleAlert, B as Button, L as Link, aJ as PaymentStatus, aK as PaymentCondition, v as formatDateTime, s as formatMoney, ah as formatTaxRate, E as Badge, n as CalendarClock, g as formatNumber, G as WhatsAppContext, H as WhatsAppContactKind, R as Receipt, Q as HandCoins, N as NotificationSource, af as PaymentMethod, Y as cn, aj as useQueryClient, ak as useMutation, ag as ue, t as formatDate, C as CircleCheck, Z as ServiceSort, A as Search, I as Input, K as Label, P as Package, W as Wrench, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./index-CGU00UGU.js";
import { S as ScanLine, B as BarcodeScanner } from "./BarcodeScanner-k4b1rg_J.js";
import { D as DocumentPreview } from "./DocumentPreview-C649Rq7f.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-BN6Hn3vt.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-OerZ78XY.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DAMKlNv-.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-CgkL2s6g.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BiDX8q3v.js";
import { S as Skeleton } from "./skeleton-CFVvrB7j.js";
import { i as invalidateCashData } from "./use-cash-DSqK78YD.js";
import { a as useIvaSettings, u as useCompanyProfile } from "./use-company-5EPbuX7J.js";
import { f as useCustomerDetail } from "./use-customers-AvIgzy15.js";
import { u as useDailyHopeMessage } from "./use-hope-CwB0ZtwO.js";
import { u as useDeleteInvoice } from "./use-invoices-FDMD755I.js";
import { i as useParts } from "./use-orders-D84oSfic.js";
import { u as useServices } from "./use-services-lFlTBNVv.js";
import { c as companyHeaderFromProfile, a as companyFiscalLines, b as companyContactLine } from "./company-header-CpUnBox6.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { h as hopeMessageContent, p as pdfCompanyFromProfile, l as loadPdfLibs, b as drawHopeMessage } from "./pdf-BD7aJTXW.js";
import { A as ArrowLeft } from "./arrow-left-D7b8NWid.js";
import { B as BadgeCheck } from "./badge-check-ZwHZX41k.js";
import { M as Mail } from "./mail-DzSJsLqJ.js";
import { T as Trash2 } from "./trash-2-D0SVHflY.js";
import { I as Info } from "./info-CxBcIkkP.js";
import { E as ExternalLink } from "./external-link-2dQlTg1o.js";
import "./check-D7OXHYR_.js";
import "./printer-eU4pYBq-.js";
import "./download-7j9WzMf6.js";
import "./textarea-DsfSgmp0.js";
import "./use-whatsapp-BZ-lGjYP.js";
import "./index-ddFCuYd6.js";
import "./index-wj725hjP.js";
import "./chevron-up-Dje9nq9I.js";
import "./warranty-HTI4GveV.js";
function resolveFiscalAddress(invoice, customer) {
  var _a, _b, _c;
  const stored = (_a = invoice.customerAddress) == null ? void 0 : _a.trim();
  if (stored) return stored;
  const record = customer == null ? void 0 : customer.customer;
  if (record) {
    const address = (_b = record.address) == null ? void 0 : _b.trim();
    if (address) return address;
    const parts = [(_c = record.document) == null ? void 0 : _c.trim(), record.phone.trim()].filter(
      (value) => !!value && value !== ""
    );
    if (parts.length > 0) return parts.join(" · ");
  }
  return "—";
}
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
  [PaymentStatus.pending]: "Pendiente de pago",
  [PaymentStatus.paid]: "Pagada"
};
const PAYMENT_STATUS_STYLES = {
  [PaymentStatus.pending]: "border-warning/50 bg-warning/15 text-warning",
  [PaymentStatus.paid]: "border-success/50 bg-success/15 text-success"
};
const CONDITION_LABELS = {
  [PaymentCondition.cash]: "Contado",
  [PaymentCondition.credit]: "Crédito"
};
function buildPlanView(invoice) {
  const plan = invoice.installments;
  if (!plan) return null;
  const rows = plan.installments.map((installment) => ({
    number: Number(installment.number),
    amount: installment.amount,
    dueDate: installment.dueDate,
    paid: installment.paid,
    paidAt: installment.paidAt ?? null
  }));
  const paidCount = rows.filter((row) => row.paid).length;
  const pendingAmount = rows.reduce(
    (sum, row) => row.paid ? sum : sum + row.amount,
    0n
  );
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0n);
  return {
    installmentCount: Number(plan.installmentCount),
    firstDueDate: plan.firstDueDate,
    rows,
    paidCount,
    pendingCount: rows.length - paidCount,
    pendingAmount,
    totalAmount
  };
}
function PaymentStatusBadge({ status }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Badge,
    {
      variant: "outline",
      "data-ocid": "invoice_detail.status_badge",
      className: cn(
        "font-mono text-[10px] uppercase tracking-wider",
        PAYMENT_STATUS_STYLES[status]
      ),
      children: PAYMENT_STATUS_LABELS[status]
    }
  );
}
function MarkPaidDialog({
  open,
  onOpenChange,
  invoice
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [method, setMethod] = reactExports.useState(invoice.paymentMethod);
  const [error, setError] = reactExports.useState(null);
  const advanceApplied = invoice.advanceApplied ?? 0n;
  const saldoACobrar = invoice.total - advanceApplied;
  const mutation = useMutation({
    mutationFn: async (paymentMethod) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.markInvoicePaid(token, invoice.id, paymentMethod);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["invoice", invoice.id.toString()]
      });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      invalidateCashData(queryClient);
      ue.success(`Factura ${invoice.number} marcada como pagada`);
      onOpenChange(false);
    },
    onError: (error2) => {
      setError(
        error2.message || "No se pudo registrar el pago. Intenta de nuevo."
      );
    }
  });
  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);
    mutation.mutate(method);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "invoice_detail.paid_dialog",
      className: "sm:max-w-md",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Marcar como pagada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
            "Confirma el método con el que el cliente liquidó la factura",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-foreground", children: invoice.number }),
            " ",
            "por ",
            formatMoney(saldoACobrar),
            ".",
            advanceApplied > 0n ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mt-1 block text-xs", children: [
              "Total ",
              formatMoney(invoice.total),
              " · anticipo aplicado",
              " ",
              formatMoney(advanceApplied),
              "."
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "paid-method", children: "Método de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: method,
                onValueChange: (value) => setMethod(value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "paid-method",
                      "aria-label": "Método de pago",
                      "data-ocid": "invoice_detail.paid_method_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: PAYMENT_METHOD_LABELS[option] }, option)) })
                ]
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "invoice_detail.paid_error",
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
                "data-ocid": "invoice_detail.paid_cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: mutation.isPending,
                "data-ocid": "invoice_detail.paid_submit_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "size-4", "aria-hidden": "true" }),
                  mutation.isPending ? "Registrando…" : "Confirmar pago"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function InstallmentPlanPanel({
  invoice,
  plan
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = reactExports.useState(null);
  const mutation = useMutation({
    mutationFn: async (installmentNumber) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerInstallmentPayment(
        token,
        invoice.id,
        BigInt(installmentNumber)
      );
    },
    onSuccess: (updated, installmentNumber) => {
      void queryClient.invalidateQueries({
        queryKey: ["invoice", invoice.id.toString()]
      });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      invalidateCashData(queryClient);
      setError(null);
      if (updated.paymentStatus === PaymentStatus.paid) {
        ue.success(
          `Cuota ${installmentNumber} registrada. La factura quedó pagada.`
        );
      } else {
        ue.success(`Cuota ${installmentNumber} registrada`);
      }
    },
    onError: (error2) => {
      setError(
        error2.message || "No se pudo registrar el pago de la cuota. Intenta de nuevo."
      );
    }
  });
  const today = Date.now();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "invoice_detail.installments_panel",
      className: "rounded-lg border border-border bg-card p-5 shadow-subtle print:hidden",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-4 flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              CalendarClock,
              {
                className: "size-4 text-muted-foreground",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Plan de cuotas" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                "Primera cuota el ",
                formatDate(plan.firstDueDate),
                " ·",
                " ",
                formatNumber(plan.installmentCount),
                " cuotas"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Badge,
            {
              variant: "outline",
              "data-ocid": "invoice_detail.installments_progress",
              className: cn(
                "font-mono text-[10px] uppercase tracking-wider",
                plan.pendingCount === 0 ? "border-success/50 bg-success/15 text-success" : "border-warning/50 bg-warning/15 text-warning"
              ),
              children: [
                formatNumber(plan.paidCount),
                " / ",
                formatNumber(plan.rows.length),
                " ",
                "pagadas"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "installment-table", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", children: "Cuota" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", children: "Vencimiento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", className: "text-right", children: "Valor" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", children: "Estado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", className: "text-right", children: "Acción" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: plan.rows.map((row) => {
            const overdue = !row.paid && Number(row.dueDate / 1000000n) < today;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "tr",
              {
                "data-paid": row.paid ? "true" : "false",
                "data-overdue": overdue ? "true" : "false",
                "data-ocid": `invoice_detail.installment_row.${row.number}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "installment-number", children: [
                    row.number,
                    " / ",
                    plan.rows.length
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "installment-due", children: [
                    formatDate(row.dueDate),
                    overdue ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-[11px] font-medium text-destructive", children: "Vencida" }) : null
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "installment-amount", children: formatMoney(row.amount) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: row.paid ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-success", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3.5", "aria-hidden": "true" }),
                    "Pagada",
                    row.paidAt ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                      "· ",
                      formatDate(row.paidAt)
                    ] }) : null
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Pendiente" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "text-right", children: row.paid ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      disabled: mutation.isPending,
                      onClick: () => mutation.mutate(row.number),
                      "data-ocid": `invoice_detail.pay_installment_button.${row.number}`,
                      className: "gap-1",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "size-3.5", "aria-hidden": "true" }),
                        "Registrar pago"
                      ]
                    }
                  ) })
                ]
              },
              row.number
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "installment-summary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Total financiado ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatMoney(plan.totalAmount) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Pagado",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatMoney(plan.totalAmount - plan.pendingAmount) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "Saldo pendiente ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: formatMoney(plan.pendingAmount) })
          ] })
        ] }),
        (invoice.advanceApplied ?? 0n) > 0n ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
          "El plan de cuotas se calculó sobre el saldo a cobrar (",
          formatMoney(invoice.total - (invoice.advanceApplied ?? 0n)),
          "), no sobre el total de la factura."
        ] }) : null,
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "invoice_detail.installment_error",
            className: "mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
            children: error
          }
        ) : null
      ]
    }
  );
}
function parseQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
function InvoiceItemSearch({
  invoice,
  onGoToOrigin
}) {
  var _a, _b;
  const [search, setSearch] = reactExports.useState("");
  const [quantity, setQuantity] = reactExports.useState("1");
  const inputRef = reactExports.useRef(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const liveTerm = search.trim();
  const term = debouncedSearch.trim();
  const partsQuery = useParts(debouncedSearch);
  const servicesQuery = useServices({
    search: debouncedSearch,
    category: null,
    activeOnly: true,
    sort: ServiceSort.name,
    page: 1,
    pageSize: 1e3,
    enabled: term.length > 0
  });
  const parts = liveTerm.length > 0 && term.length > 0 ? ((_a = partsQuery.data) == null ? void 0 : _a.items) ?? [] : [];
  const services = liveTerm.length > 0 && term.length > 0 ? ((_b = servicesQuery.data) == null ? void 0 : _b.items) ?? [] : [];
  const results = [
    ...parts.map((part) => ({ kind: "part", part })),
    ...services.map(
      (service) => ({ kind: "service", service })
    )
  ];
  const isLoading = partsQuery.isLoading || servicesQuery.isLoading;
  const isError = partsQuery.isError || servicesQuery.isError;
  const chosenQuantity = parseQuantity(quantity) > 0 ? parseQuantity(quantity) : 1;
  const handleSelect = (result) => {
    var _a2;
    onGoToOrigin(result, chosenQuantity);
    setSearch("");
    setQuantity("1");
    (_a2 = inputRef.current) == null ? void 0 : _a2.focus();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": "invoice_detail.item_search",
      className: "gap-0 rounded-lg py-0 shadow-none print:hidden",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 text-primary", "aria-hidden": "true" }),
          "Buscar ítem para anexar"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 px-5 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Busca un repuesto o servicio, escoge la cantidad y confirma. La línea se anexa como primera del documento de origen; esta factura emitida no se modifica." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
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
                  ref: inputRef,
                  type: "search",
                  value: search,
                  onChange: (event) => setSearch(event.target.value),
                  placeholder: "Buscar repuesto o servicio por código o nombre…",
                  "aria-label": "Buscar repuesto o servicio por código o nombre",
                  "data-ocid": "invoice_detail.item_search_input",
                  className: "h-9 pl-8 text-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-1.5 sm:w-24", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Label,
                {
                  htmlFor: "invoice-item-quantity",
                  className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                  children: "Cantidad"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "invoice-item-quantity",
                  type: "number",
                  inputMode: "numeric",
                  min: 1,
                  step: 1,
                  value: quantity,
                  onChange: (event) => setQuantity(event.target.value),
                  "aria-label": "Cantidad a anexar",
                  "data-ocid": "invoice_detail.item_quantity_input",
                  className: "data-rail h-9"
                }
              )
            ] })
          ] }),
          liveTerm.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "invoice_detail.item_search.prompt_state",
              className: "rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground",
              children: "Escribe el código o el nombre del repuesto o servicio para ver coincidencias."
            }
          ) : isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              "data-ocid": "invoice_detail.item_search.loading_state",
              className: "space-y-1.5",
              children: Array.from(
                { length: 3 },
                (_, index) => `invoice-item-skeleton-${index}`
              ).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, key))
            }
          ) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "invoice_detail.item_search.error_state",
              className: "text-xs text-destructive",
              children: "No se pudo cargar el catálogo. Inténtalo de nuevo."
            }
          ) : results.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "invoice_detail.item_search.empty_state",
              className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
              children: `Sin repuestos ni servicios que coincidan con “${term}”.`
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "ul",
            {
              "data-ocid": "invoice_detail.item_search.list",
              className: "max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-1",
              children: results.map((result, index) => {
                const isPart = result.kind === "part";
                const code = isPart ? result.part.sku : result.service.code;
                const name = isPart ? result.part.name : result.service.name;
                const price = isPart ? result.part.salePrice : result.service.laborRate;
                const meta = isPart ? `${formatNumber(result.part.totalStock)} ${result.part.unit}` : result.service.category;
                return /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "li",
                  {
                    children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleSelect(result),
                        "data-ocid": `invoice_detail.item_search.item.${index + 1}`,
                        className: "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "span",
                                {
                                  className: isPart ? "shrink-0 rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-primary" : "shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground",
                                  children: isPart ? "Repuesto" : "Servicio"
                                }
                              ),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: code }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: name })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block truncate text-xs text-muted-foreground", children: meta })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 text-xs font-medium", children: formatMoney(price) })
                        ]
                      }
                    )
                  },
                  isPart ? `part-${result.part.id.toString()}` : `service-${result.service.id.toString()}`
                );
              })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: invoice.orderId !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "size-3.5", "aria-hidden": "true" }),
            "Al confirmar, se anexa en la orden de origen."
          ] }) : invoice.origin === "quote" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-3.5", "aria-hidden": "true" }),
            "Al confirmar, se anexa en la cotización de origen."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "size-3.5", "aria-hidden": "true" }),
            "Al confirmar, se anexa en la venta POS de origen."
          ] }) })
        ] })
      ]
    }
  );
}
async function buildInvoicePdf(format, number, company, meta, lines, totals, hope) {
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
  doc.text("FACTURA", right, 14, { align: "right" });
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
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: afterTotals + (narrow ? 6 : 10),
    narrow
  });
  return doc;
}
function InvoiceDetailPage() {
  var _a;
  const { id } = useParams({ strict: false });
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [paidOpen, setPaidOpen] = reactExports.useState(false);
  const [notifyOpen, setNotifyOpen] = reactExports.useState(false);
  const [deleteOpen, setDeleteOpen] = reactExports.useState(false);
  const [deleteError, setDeleteError] = reactExports.useState(null);
  const [printFormat, setPrintFormat] = reactExports.useState("a4");
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const [scanOpen, setScanOpen] = reactExports.useState(false);
  const [scannedPart, setScannedPart] = reactExports.useState(null);
  const { isIvaResponsible } = useIvaSettings();
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const deleteInvoice = useDeleteInvoice();
  const invoiceId = BigInt(id);
  const invoiceQuery = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getInvoice(token, invoiceId);
    },
    enabled: !!actor && !isFetching
  });
  const businessQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings(token);
    },
    enabled: !!actor && !isFetching,
    staleTime: 6e4
  });
  const invoice = invoiceQuery.data ?? null;
  const business = businessQuery.data ?? null;
  const customerQuery = useCustomerDetail((invoice == null ? void 0 : invoice.customerId) ?? null);
  const customer = customerQuery.data ?? null;
  const fiscalAddress = invoice ? resolveFiscalAddress(invoice, customer) : "—";
  if (invoiceQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "invoice_detail.loading_state",
        className: "mx-auto w-full max-w-4xl space-y-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[520px] w-full" })
        ]
      }
    );
  }
  if (invoiceQuery.isError || !invoice) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "invoice_detail.error_state",
        className: "mx-auto flex w-full max-w-4xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-6 text-destructive", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Factura no encontrada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "La factura solicitada no existe o fue eliminada del registro." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/facturas", "data-ocid": "invoice_detail.back_button", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
            "Volver a facturación"
          ] }) })
        ]
      }
    );
  }
  const isPaid = invoice.paymentStatus === PaymentStatus.paid;
  const isCredit = invoice.paymentCondition === PaymentCondition.credit;
  const plan = buildPlanView(invoice);
  const hasRegisteredPayments = isPaid || ((plan == null ? void 0 : plan.rows.some((row) => row.paid)) ?? false);
  const canDelete = !hasRegisteredPayments;
  const canScan = !hasRegisteredPayments;
  const documentLines = invoice.lines.map((line) => ({
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice) / 100,
    amount: Number(line.amount) / 100
  }));
  const documentMeta = [
    { label: "Cliente", value: invoice.customerName },
    { label: "NIT/RUC", value: invoice.customerTaxId || "—", rail: true },
    { label: "Dirección fiscal", value: fiscalAddress },
    { label: "Emitida", value: formatDateTime(invoice.issuedAt) },
    { label: "Método", value: PAYMENT_METHOD_LABELS[invoice.paymentMethod] },
    { label: "Condición", value: CONDITION_LABELS[invoice.paymentCondition] },
    { label: "Estado", value: PAYMENT_STATUS_LABELS[invoice.paymentStatus] }
  ];
  const advanceApplied = invoice.advanceApplied ?? 0n;
  const hasAdvance = advanceApplied > 0n;
  const saldoACobrar = invoice.total - advanceApplied;
  const documentTotals = [
    { label: "Subtotal", value: formatMoney(invoice.subtotal) },
    ...isIvaResponsible ? [
      {
        label: `Impuesto (${formatTaxRate(invoice.taxRate)})`,
        value: formatMoney(invoice.tax)
      }
    ] : [],
    {
      label: "Total",
      value: formatMoney(invoice.total),
      emphasis: !hasAdvance
    },
    ...hasAdvance ? [
      {
        label: "Anticipo aplicado",
        value: `− ${formatMoney(advanceApplied)}`
      },
      {
        label: "Saldo a cobrar",
        value: formatMoney(saldoACobrar),
        emphasis: true
      }
    ] : []
  ];
  const companyHeader = companyHeaderFromProfile(companyQuery.data);
  const handleDownloadPdf = async (format) => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildInvoicePdf(
        format,
        invoice.number,
        pdfCompanyFromProfile(companyQuery.data),
        documentMeta,
        documentLines,
        documentTotals,
        hopeMessage
      );
      await downloadFile({
        filename: `Factura-${invoice.number}.pdf`,
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
  };
  const handlePartDetected = (part, code) => {
    setScannedPart({ part, code });
    ue.success(`${part.name} verificado en el catálogo`);
  };
  const clearScannedPart = () => setScannedPart(null);
  const handleGoToOrigin = (result, quantity) => {
    const itemName = result.kind === "part" ? result.part.name : result.service.name;
    const search = result.kind === "part" ? {
      addPartId: result.part.id.toString(),
      addQuantity: String(quantity)
    } : {
      addServiceId: result.service.id.toString(),
      addQuantity: String(quantity)
    };
    ue.success(
      `${quantity} × ${itemName} listo para anexar en el documento de origen`
    );
    if (invoice.orderId !== void 0) {
      void navigate({
        to: "/ordenes/$id",
        params: { id: invoice.orderId.toString() },
        search
      });
      return;
    }
    if (invoice.origin === "quote") {
      void navigate({ to: "/cotizaciones", search });
      return;
    }
    void navigate({ to: "/pos", search });
  };
  const confirmDelete = () => {
    setDeleteError(null);
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        ue.success(`Factura ${invoice.number} eliminada`);
        setDeleteOpen(false);
        void navigate({ to: "/facturas" });
      },
      onError: (error) => {
        setDeleteError(
          error.message || "No se pudo eliminar la factura. Intenta de nuevo."
        );
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "invoice_detail.page",
      className: "mx-auto w-full max-w-4xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 print:hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/facturas",
              "data-ocid": "invoice_detail.back_link",
              className: "gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Facturación"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatusBadge, { status: invoice.paymentStatus }),
            isPaid ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Badge,
              {
                variant: "outline",
                "data-ocid": "invoice_detail.paid_badge",
                className: "gap-1 border-success/50 bg-success/15 font-mono text-[10px] uppercase tracking-wider text-success",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "size-3", "aria-hidden": "true" }),
                  "Pagada"
                ]
              }
            ) : isCredit && plan ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Badge,
              {
                variant: "outline",
                "data-ocid": "invoice_detail.credit_badge",
                className: "gap-1 border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-wider text-primary",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarClock, { className: "size-3", "aria-hidden": "true" }),
                  "Crédito · ",
                  formatNumber(plan.pendingCount),
                  " cuotas pendientes"
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: () => setPaidOpen(true),
                "data-ocid": "invoice_detail.mark_paid_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "size-4", "aria-hidden": "true" }),
                  "Marcar como pagada"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setNotifyOpen(true),
                "data-ocid": "invoice_detail.notify_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "size-4", "aria-hidden": "true" }),
                  "Notificar al cliente"
                ]
              }
            ),
            canScan ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => setScanOpen((current) => !current),
                "aria-expanded": scanOpen,
                "data-ocid": "invoice_detail.scan_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-4", "aria-hidden": "true" }),
                  scanOpen ? "Cerrar escáner" : "Escanear repuesto"
                ]
              }
            ) : null,
            invoice.customerId !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              WhatsAppNotifyButton,
              {
                contactKind: WhatsAppContactKind.customer,
                contactId: invoice.customerId,
                context: WhatsAppContext.invoice,
                referenceId: invoice.id,
                contactName: invoice.customerName,
                variant: "outline",
                size: "sm",
                ocid: "invoice_detail.whatsapp_button"
              }
            ) : null,
            canDelete ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                },
                "data-ocid": "invoice_detail.delete_button",
                className: "gap-2 text-destructive hover:text-destructive",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" }),
                  "Eliminar"
                ]
              }
            ) : null
          ] })
        ] }),
        downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "invoice_detail.download_error",
            className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 print:hidden",
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
                  "data-ocid": "invoice_detail.download_retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 print:hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "size-4 text-muted-foreground", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            "Vista previa del documento fiscal. Elige",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "A4" }),
            " o",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Tirilla 80 mm" }),
            " y usa ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Imprimir" }),
            " o",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Descargar PDF" }),
            " ",
            "para guardar el archivo en el dispositivo."
          ] })
        ] }),
        isCredit && plan ? /* @__PURE__ */ jsxRuntimeExports.jsx(InstallmentPlanPanel, { invoice, plan }) : null,
        hasAdvance ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "invoice_detail.advance_panel",
            "aria-label": "Anticipo aplicado",
            className: "rounded-lg border border-border bg-card p-4 shadow-subtle print:hidden",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  HandCoins,
                  {
                    className: "size-4 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Anticipo aplicado" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "mt-3 grid gap-2 sm:grid-cols-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border bg-muted/20 px-3 py-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: "Total" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail mt-0.5 text-sm font-medium", children: formatMoney(invoice.total) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-border bg-muted/20 px-3 py-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: "Anticipo aplicado" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "dd",
                    {
                      "data-ocid": "invoice_detail.advance_applied",
                      className: "data-rail mt-0.5 text-sm font-medium text-success",
                      children: [
                        "− ",
                        formatMoney(advanceApplied)
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-primary/40 bg-primary/10 px-3 py-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-primary", children: "Saldo a cobrar" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "dd",
                    {
                      "data-ocid": "invoice_detail.saldo_a_cobrar",
                      className: "data-rail mt-0.5 text-sm font-semibold",
                      children: formatMoney(saldoACobrar)
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
                "El anticipo registrado en la orden de taller se descontó del total.",
                isCredit ? " El plan de cuotas se calcula sobre el saldo a cobrar." : " El saldo a cobrar es el monto pendiente de pago."
              ] })
            ]
          }
        ) : null,
        canScan ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "invoice_detail.readonly_notice",
            "aria-label": "Factura de solo lectura",
            className: "flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4 print:hidden",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Info,
                  {
                    className: "mt-0.5 size-4 shrink-0 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Factura de solo lectura" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Una factura emitida es un documento cerrado: sus líneas no se editan aquí. Para buscar un ítem, escoger la cantidad y anexarlo como primera línea del documento, hazlo en el documento de origen y vuelve a generarla." })
                ] })
              ] }),
              invoice.orderId !== void 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  asChild: true,
                  className: "shrink-0 gap-1.5",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Link,
                    {
                      to: "/ordenes/$id",
                      params: { id: invoice.orderId.toString() },
                      search: {},
                      "data-ocid": "invoice_detail.origin_link",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3.5", "aria-hidden": "true" }),
                        "Ir a la orden de origen"
                      ]
                    }
                  )
                }
              ) : null
            ]
          }
        ) : null,
        canScan ? /* @__PURE__ */ jsxRuntimeExports.jsx(InvoiceItemSearch, { invoice, onGoToOrigin: handleGoToOrigin }) : null,
        canScan && scanOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "invoice_detail.scan_panel",
            className: "space-y-3 rounded-lg border border-border bg-card p-4 shadow-subtle print:hidden",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ScanLine,
                  {
                    className: "mt-0.5 size-4 shrink-0 text-primary",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Verificar repuesto por código" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Escanea el código de barras o el SKU para consultar el repuesto en el catálogo. La factura ya emitida no se modifica; para anexar líneas usa el documento de origen." })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                BarcodeScanner,
                {
                  ocid: "invoice_detail.scanner",
                  title: "Escanear repuesto",
                  hint: "Apunta la cámara al código del repuesto o ingrésalo manualmente.",
                  onDetected: handlePartDetected
                }
              ),
              scannedPart ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "invoice_detail.scanned_part",
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
                        "data-ocid": "invoice_detail.clear_scanned_part_button",
                        className: "shrink-0 text-muted-foreground",
                        children: "Limpiar"
                      }
                    )
                  ]
                }
              ) : null
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DocumentPreview,
          {
            title: "Factura",
            number: invoice.number,
            companyName: (companyHeader == null ? void 0 : companyHeader.legalName) ?? (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES",
            companyLogoUrl: (companyHeader == null ? void 0 : companyHeader.logoUrl) ?? void 0,
            companyContact: companyContactLine(companyHeader),
            companyFiscal: companyFiscalLines(companyHeader),
            meta: documentMeta,
            lines: documentLines,
            totals: documentTotals,
            hopeMessage,
            format: printFormat,
            ocid: "invoice_detail.document",
            onFormatChange: setPrintFormat,
            onDownloadPdf: handleDownloadPdf,
            isDownloading
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MarkPaidDialog,
          {
            open: paidOpen,
            onOpenChange: setPaidOpen,
            invoice
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialog,
          {
            open: deleteOpen,
            onOpenChange: (open) => {
              if (!open) {
                setDeleteOpen(false);
                setDeleteError(null);
              }
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { "data-ocid": "invoice_detail.delete_dialog", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogTitle, { className: "font-display", children: [
                  "¿Eliminar la factura ",
                  invoice.number,
                  "?"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Solo se pueden eliminar facturas pendientes de pago y sin abonos registrados. Al eliminarla, la orden o venta de origen queda disponible para facturarse de nuevo. Esta acción no se puede deshacer." })
              ] }),
              deleteError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  "data-ocid": "invoice_detail.delete_error",
                  className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                  children: deleteError
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AlertDialogCancel,
                  {
                    "data-ocid": "invoice_detail.delete_cancel_button",
                    disabled: deleteInvoice.isPending,
                    children: "Cancelar"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AlertDialogAction,
                  {
                    "data-ocid": "invoice_detail.delete_confirm_button",
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
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          NotifyCustomerDialog,
          {
            open: notifyOpen,
            onOpenChange: setNotifyOpen,
            customerId: invoice.customerId ?? 0n,
            customerName: invoice.customerName,
            customerEmail: ((_a = customer == null ? void 0 : customer.customer.email) == null ? void 0 : _a.trim()) || null,
            source: NotificationSource.invoice,
            referenceId: invoice.id,
            defaultSubject: `Estado de tu factura ${invoice.number}`,
            defaultMessage: `Hola ${invoice.customerName}, te compartimos el estado actual de tu factura ${invoice.number} por ${formatMoney(invoice.total)}. Si tienes alguna duda sobre el cobro o el plan de pagos, respóndenos a este correo y con gusto te atendemos.`
          }
        )
      ]
    }
  );
}
export {
  InvoiceDetailPage
};
