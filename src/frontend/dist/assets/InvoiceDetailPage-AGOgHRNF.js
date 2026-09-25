import { ai as useParams, k as useBackend, s as reactExports, l as useQuery, j as jsxRuntimeExports, T as TriangleAlert, B as Button, L as Link, aJ as PaymentStatus, aK as PaymentCondition, w as Badge, a as CalendarClock, n as formatNumber, z as WhatsAppContext, A as WhatsAppContactKind, R as Receipt, N as NotificationSource, x as formatMoney, ak as useQueryClient, al as useMutation, ar as ue, y as formatDate, ae as cn, aw as CircleCheck, ag as formatDateTime, aj as formatTaxRate, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, aE as PaymentMethod, $ as DialogFooter } from "./index-CzQEXdHP.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-B37TcS0T.js";
import { W as WhatsAppNotifyButton } from "./WhatsAppNotifyButton-C6uRFdie.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { a as useIvaSettings, u as useCompanyProfile } from "./use-company-Db6O1TYw.js";
import { f as useCustomerDetail } from "./use-customers-Dk1G98vS.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { l as loadPdfLibs, p as pdfCompanyFromProfile } from "./pdf-CwHQGLGj.js";
import { A as ArrowLeft } from "./arrow-left-DLNUnNNY.js";
import { B as BadgeCheck } from "./badge-check-CD02knlg.js";
import { M as Mail } from "./mail-BsdNiCp8.js";
import { P as Printer } from "./printer-D9qf1U3g.js";
import { D as Download } from "./download-6xWfJWG2.js";
import "./textarea-C9U8oXYV.js";
import "./use-whatsapp-hGj8iSf3.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
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
  const queryClient = useQueryClient();
  const [method, setMethod] = reactExports.useState(invoice.paymentMethod);
  const [error, setError] = reactExports.useState(null);
  const mutation = useMutation({
    mutationFn: async (paymentMethod) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.markInvoicePaid(invoice.id, paymentMethod);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["invoice", invoice.id.toString()]
      });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      ue.success(`Factura ${invoice.number} marcada como pagada`);
      onOpenChange(false);
    },
    onError: () => {
      setError("No se pudo registrar el pago. Intenta de nuevo.");
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
  const queryClient = useQueryClient();
  const [error, setError] = reactExports.useState(null);
  const mutation = useMutation({
    mutationFn: async (installmentNumber) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerInstallmentPayment(
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
    onError: () => {
      setError("No se pudo registrar el pago de la cuota. Intenta de nuevo.");
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
function FiscalBlock({
  title,
  lines
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "space-y-1", children: lines.map((line) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "w-24 shrink-0 text-muted-foreground", children: line.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "dd",
        {
          className: cn(
            "min-w-0 break-words font-medium",
            line.rail && "data-rail"
          ),
          children: line.value
        }
      )
    ] }, line.label)) })
  ] });
}
async function buildInvoicePdf(invoice, companyProfile, fiscalAddress, showTax) {
  var _a, _b, _c;
  const { jsPDF, autoTable } = await loadPdfLibs();
  const company = pdfCompanyFromProfile(companyProfile);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const right = 196;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text(company.name, margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const contact = [company.taxId, company.address, company.phone].filter((value) => !!value && value.trim() !== "").join("  ·  ");
  if (contact !== "") doc.text(contact, margin, 23.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("FACTURA", right, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(invoice.number, right, 23.5, { align: "right" });
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, 31, right, 31);
  autoTable(doc, {
    startY: 37,
    body: [
      ["Cliente", invoice.customerName],
      ["NIT/RUC", invoice.customerTaxId || "—"],
      ["Dirección fiscal", fiscalAddress],
      ["Emitida", formatDateTime(invoice.issuedAt)],
      ["Método", PAYMENT_METHOD_LABELS[invoice.paymentMethod]],
      ["Condición", CONDITION_LABELS[invoice.paymentCondition]],
      ["Estado", PAYMENT_STATUS_LABELS[invoice.paymentStatus]]
    ],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 40, textColor: [100, 116, 139] },
      1: { fontStyle: "bold", textColor: [30, 41, 59] }
    },
    margin: { left: margin, right: margin }
  });
  const afterMeta = ((_a = doc.lastAutoTable) == null ? void 0 : _a.finalY) ?? 37;
  autoTable(doc, {
    startY: afterMeta + 6,
    head: [["Concepto", "Cantidad", "Precio unitario", "Importe"]],
    body: invoice.lines.map((line) => [
      line.description,
      formatNumber(line.quantity),
      formatMoney(line.unitPrice),
      formatMoney(line.amount)
    ]),
    theme: "striped",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" }
    },
    margin: { left: margin, right: margin }
  });
  const afterLines = ((_b = doc.lastAutoTable) == null ? void 0 : _b.finalY) ?? afterMeta + 6;
  const totalsBody = [
    ["Subtotal", formatMoney(invoice.subtotal)],
    ...showTax ? [
      [
        `Impuesto (${formatTaxRate(invoice.taxRate)})`,
        formatMoney(invoice.tax)
      ]
    ] : [],
    ["Total", formatMoney(invoice.total)]
  ];
  autoTable(doc, {
    startY: afterLines + 6,
    body: totalsBody,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 45, halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] }
    },
    margin: { left: right - 90, right: margin }
  });
  const afterTotals = ((_c = doc.lastAutoTable) == null ? void 0 : _c.finalY) ?? afterLines + 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Documento fiscal generado por el sistema de taller. Conserve esta factura como comprobante de su servicio.",
    margin,
    afterTotals + 10
  );
  return doc;
}
function InvoiceDocument({
  invoice,
  business,
  companyLogoUrl,
  fiscalAddress,
  showTax
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      "data-ocid": "invoice_detail.document",
      className: "invoice-sheet rounded-lg border border-border bg-card p-6 shadow-subtle sm:p-8",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              companyLogoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: companyLogoUrl,
                  alt: "",
                  "data-ocid": "invoice_detail.document.logo",
                  className: "size-12 shrink-0 object-contain"
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex size-8 items-center justify-center rounded-md bg-gradient-primary font-display text-sm font-bold text-primary-foreground", children: "HR" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-lg font-semibold tracking-tight", children: (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5 text-sm text-muted-foreground", children: [
              (business == null ? void 0 : business.taxId) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail", children: [
                "NIT/RUC: ",
                business.taxId
              ] }) : null,
              (business == null ? void 0 : business.address) ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: business.address }) : null,
              (business == null ? void 0 : business.phone) ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail", children: [
                "Tel: ",
                business.phone
              ] }) : null
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Factura" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold tracking-tight", children: invoice.number }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
              "Emitida el ",
              formatDate(invoice.issuedAt)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatusBadge, { status: invoice.paymentStatus }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid gap-6 border-b border-border py-6 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FiscalBlock,
            {
              title: "Cliente",
              lines: [
                { label: "Nombre", value: invoice.customerName },
                {
                  label: "NIT/RUC",
                  value: invoice.customerTaxId || "—",
                  rail: true
                },
                { label: "Dirección fiscal", value: fiscalAddress }
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FiscalBlock,
            {
              title: "Emisión",
              lines: [
                {
                  label: "Fecha",
                  value: formatDateTime(invoice.issuedAt)
                },
                {
                  label: "Orden",
                  value: invoice.orderId ? `#${invoice.orderId.toString()}` : "—",
                  rail: true
                },
                {
                  label: "Método",
                  value: PAYMENT_METHOD_LABELS[invoice.paymentMethod]
                },
                {
                  label: "Condición",
                  value: CONDITION_LABELS[invoice.paymentCondition]
                }
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Concepto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Cantidad" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Precio unitario" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Importe" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: invoice.lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            TableRow,
            {
              "data-ocid": `invoice_detail.line.${index + 1}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[320px] whitespace-normal", children: line.description }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right", children: formatNumber(line.quantity) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(line.unitPrice) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-medium", children: formatMoney(line.amount) })
              ]
            },
            `${line.description}-${index}`
          )) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "flex justify-end border-t border-border pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "w-full max-w-xs space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: "Subtotal" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail font-medium", children: formatMoney(invoice.subtotal) })
          ] }),
          showTax ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("dt", { className: "text-muted-foreground", children: [
              "Impuesto (",
              formatTaxRate(invoice.taxRate),
              ")"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail font-medium", children: formatMoney(invoice.tax) })
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 border-t border-border pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-display text-sm font-semibold", children: "Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail text-lg font-semibold text-primary", children: formatMoney(invoice.total) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "mt-6 border-t border-border pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Documento fiscal generado por HR SOLUCIONES INTEGRALES. Conserve esta factura como comprobante de su servicio." }) })
      ]
    }
  );
}
function InvoiceDetailPage() {
  var _a, _b;
  const { id } = useParams({ strict: false });
  const { actor, isFetching } = useBackend();
  const [paidOpen, setPaidOpen] = reactExports.useState(false);
  const [notifyOpen, setNotifyOpen] = reactExports.useState(false);
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const { isIvaResponsible } = useIvaSettings();
  const companyQuery = useCompanyProfile();
  const invoiceId = BigInt(id);
  const invoiceQuery = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getInvoice(invoiceId);
    },
    enabled: !!actor && !isFetching
  });
  const businessQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings();
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
  const handleDownloadPdf = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildInvoicePdf(
        invoice,
        companyQuery.data,
        fiscalAddress,
        isIvaResponsible
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => window.print(),
                "data-ocid": "invoice_detail.print_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "size-4", "aria-hidden": "true" }),
                  "Imprimir / PDF"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: () => void handleDownloadPdf(),
                disabled: isDownloading,
                "data-ocid": "invoice_detail.download_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
                  isDownloading ? "Generando…" : "Descargar PDF"
                ]
              }
            )
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
                  onClick: () => void handleDownloadPdf(),
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
            "Vista previa del documento fiscal. Usa",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Descargar PDF" }),
            " ",
            "para guardar el archivo en el dispositivo o",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Imprimir / PDF" }),
            " ",
            "para abrir el diálogo del sistema."
          ] })
        ] }),
        isCredit && plan ? /* @__PURE__ */ jsxRuntimeExports.jsx(InstallmentPlanPanel, { invoice, plan }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          InvoiceDocument,
          {
            invoice,
            business,
            companyLogoUrl: ((_a = companyQuery.data) == null ? void 0 : _a.logoUrl) ?? void 0,
            fiscalAddress,
            showTax: isIvaResponsible
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          MarkPaidDialog,
          {
            open: paidOpen,
            onOpenChange: setPaidOpen,
            invoice
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          NotifyCustomerDialog,
          {
            open: notifyOpen,
            onOpenChange: setNotifyOpen,
            customerId: invoice.customerId ?? 0n,
            customerName: invoice.customerName,
            customerEmail: ((_b = customer == null ? void 0 : customer.customer.email) == null ? void 0 : _b.trim()) || null,
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
