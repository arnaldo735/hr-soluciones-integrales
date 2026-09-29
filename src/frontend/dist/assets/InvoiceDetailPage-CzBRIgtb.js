import { al as useParams, k as useBackend, l as useAuth, r as useNavigate, t as reactExports, m as useQuery, j as jsxRuntimeExports, T as TriangleAlert, B as Button, L as Link, aM as PaymentStatus, aN as PaymentCondition, aj as formatDateTime, y as formatMoney, am as formatTaxRate, x as Badge, a as CalendarClock, o as formatNumber, A as WhatsAppContext, D as WhatsAppContactKind, R as Receipt, N as NotificationSource, aH as PaymentMethod, Z as cn, ao as useQueryClient, ap as useMutation, av as ue, z as formatDate, az as CircleCheck, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, a3 as DialogFooter } from "./index-EqGEeyjs.js";
import { S as ScanLine, B as BarcodeScanner } from "./BarcodeScanner-DxFj0yM1.js";
import { D as DocumentPreview } from "./DocumentPreview-C4gHQdTZ.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-DUFQVTg_.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-qVL9cwOA.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { a as useIvaSettings, u as useCompanyProfile } from "./use-company-B0ILLjch.js";
import { f as useCustomerDetail } from "./use-customers-97P-fDYn.js";
import { u as useDailyHopeMessage } from "./use-hope-35eM4bcJ.js";
import { u as useDeleteInvoice } from "./use-invoices-BX2WFwg0.js";
import { u as useServiceTermsSettings, S as SERVICE_TERMS_DEFAULT_TEXT } from "./use-service-terms-DA5dJHUn.js";
import { c as companyHeaderFromProfile, a as companyFiscalLines, b as companyContactLine } from "./company-header-Ds_ApIKF.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { h as hopeMessageContent, p as pdfCompanyFromProfile, l as loadPdfLibs, a as drawHopeMessage } from "./pdf-BjjrMDP3.js";
import { A as ArrowLeft } from "./arrow-left-DSEilCsK.js";
import { B as BadgeCheck } from "./badge-check-DSGowkmi.js";
import { M as Mail } from "./mail-B11strfl.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import "./check-LdjEv5O-.js";
import "./printer-CZZ39YEy.js";
import "./download-C8tLpeh6.js";
import "./textarea-B0CUuiY-.js";
import "./use-whatsapp-DIGqY6EY.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
import "./warranty-BU5LnZHy.js";
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
            formatMoney(invoice.total),
            "."
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
async function buildInvoicePdf(format, number, company, meta, lines, totals, footer, hope) {
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
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  const footerY = afterTotals + (narrow ? 6 : 10);
  const footerLines = doc.splitTextToSize(footer, right - margin);
  doc.text(footerLines, margin, footerY);
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: footerY + footerLines.length * (narrow ? 2.6 : 3.4) + 1.5,
    narrow
  });
  return doc;
}
function InvoiceDetailPage() {
  var _a, _b, _c;
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
  const serviceTermsQuery = useServiceTermsSettings();
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
  const documentTotals = [
    { label: "Subtotal", value: formatMoney(invoice.subtotal) },
    ...isIvaResponsible ? [
      {
        label: `Impuesto (${formatTaxRate(invoice.taxRate)})`,
        value: formatMoney(invoice.tax)
      }
    ] : [],
    { label: "Total", value: formatMoney(invoice.total), emphasis: true }
  ];
  const serviceTermsText = ((_b = (_a = serviceTermsQuery.data) == null ? void 0 : _a.text) == null ? void 0 : _b.trim()) || SERVICE_TERMS_DEFAULT_TEXT;
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
        serviceTermsText,
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
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Escanea el código de barras o el SKU para consultar el repuesto en el catálogo. La factura ya emitida no se modifica." })
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
            footer: serviceTermsText,
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
            customerEmail: ((_c = customer == null ? void 0 : customer.customer.email) == null ? void 0 : _c.trim()) || null,
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
