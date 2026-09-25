import { s as reactExports, j as jsxRuntimeExports, t as Search, v as Input, B as Button, L as Link, aL as ShoppingCart, T as TriangleAlert, n as formatNumber, D as ChevronRight, ag as formatDateTime, aK as PaymentCondition, x as formatMoney, aj as formatTaxRate, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, aE as PaymentMethod } from "./index-CzQEXdHP.js";
import { D as DataTable } from "./DataTable-CAP1Nt9Z.js";
import { D as DocumentPreview } from "./DocumentPreview-CccqIWmY.js";
import { P as PageHeader } from "./PageHeader-JDKYCqW_.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { b as useBusinessSettings, u as useCompanyProfile, a as useIvaSettings } from "./use-company-Db6O1TYw.js";
import { a as usePosSales, b as usePosSale } from "./use-pos-C7UmEllx.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { p as pdfCompanyFromProfile, l as loadPdfLibs } from "./pdf-CwHQGLGj.js";
import { C as ChevronLeft } from "./chevron-left-CY0scwou.js";
import "./alert-dialog-BQof8xF8.js";
import "./table-CKrT3zG1.js";
import "./trash-2-M_celBpV.js";
import "./check-DrBSQP0y.js";
import "./pencil-Vues_1SE.js";
import "./printer-D9qf1U3g.js";
import "./download-6xWfJWG2.js";
const PAGE_SIZE = 20;
const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto"
};
function paymentLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
const CONDITION_LABELS = {
  [PaymentCondition.cash]: "Contado",
  [PaymentCondition.credit]: "Crédito"
};
function conditionLabel(condition) {
  return CONDITION_LABELS[condition] ?? condition;
}
async function buildReceiptPdf(format, number, company, meta, lines, totals, footer) {
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
  doc.text("COMPROBANTE", right, 14, { align: "right" });
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
  doc.text(
    doc.splitTextToSize(footer, right - margin),
    margin,
    afterTotals + (narrow ? 6 : 10)
  );
  return doc;
}
function ReceiptDialog({
  saleId,
  onClose
}) {
  var _a;
  const saleQuery = usePosSale(saleId);
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const { isIvaResponsible } = useIvaSettings();
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const sale = saleQuery.data ?? null;
  const business = businessQuery.data ?? null;
  const companyLogoUrl = ((_a = companyQuery.data) == null ? void 0 : _a.logoUrl) ?? void 0;
  const lines = ((sale == null ? void 0 : sale.lines) ?? []).map((line) => ({
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    amount: Number(line.amount)
  }));
  const meta = sale ? [
    {
      label: "Cliente",
      value: sale.customerName ?? "Venta de mostrador"
    },
    { label: "Método", value: paymentLabel(sale.paymentMethod) },
    { label: "Condición", value: conditionLabel(sale.paymentCondition) },
    { label: "Recibido", value: formatMoney(sale.amountReceived) },
    { label: "Cambio", value: formatMoney(sale.change) }
  ] : [];
  const totals = sale ? [
    { label: "Subtotal", value: formatMoney(sale.subtotal) },
    ...isIvaResponsible ? [
      {
        label: `Impuesto (${formatTaxRate(sale.taxRate)})`,
        value: formatMoney(sale.tax)
      }
    ] : [],
    { label: "Descuento", value: `-${formatMoney(sale.discount)}` },
    { label: "Total", value: formatMoney(sale.total), emphasis: true }
  ] : [];
  const receiptFooter = "Gracias por su compra. Conserve este comprobante.";
  async function handleDownloadPdf(nextFormat) {
    if (!sale) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildReceiptPdf(
        nextFormat,
        sale.saleNumber,
        pdfCompanyFromProfile(companyQuery.data),
        meta,
        lines,
        totals,
        receiptFooter
      );
      await downloadFile({
        filename: `Comprobante-${sale.saleNumber}.pdf`,
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
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open: saleId !== null,
      onOpenChange: (open) => {
        if (!open) onClose();
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        DialogContent,
        {
          "data-ocid": "pos_history.receipt_dialog",
          className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Comprobante de venta" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Reimprime el comprobante en hoja A4 o en tirilla de 80 mm." })
            ] }),
            saleQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "pos_history.receipt_loading", className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-40" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[420px] w-full" })
            ] }) : !sale ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "pos_history.receipt_error",
                className: "flex flex-col items-center gap-2 py-10 text-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "size-5 text-destructive",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el comprobante de esta venta." })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DocumentPreview,
                {
                  title: "Comprobante",
                  number: sale.saleNumber,
                  companyName: (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES",
                  companyLogoUrl,
                  companyContact: business ? [business.address, business.phone].filter((value) => value.length > 0).join(" · ") : void 0,
                  meta,
                  lines,
                  totals,
                  footer: receiptFooter,
                  format: "a4",
                  ocid: "pos_history.receipt_a4",
                  onDownloadPdf: handleDownloadPdf,
                  isDownloading
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DocumentPreview,
                {
                  title: "Comprobante",
                  number: sale.saleNumber,
                  companyName: (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES",
                  companyLogoUrl,
                  meta,
                  lines,
                  totals,
                  footer: "Gracias por su compra.",
                  format: "receipt80",
                  ocid: "pos_history.receipt_80mm",
                  onDownloadPdf: handleDownloadPdf,
                  isDownloading
                }
              ),
              downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "pos_history.download_error",
                  className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
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
                        onClick: () => void handleDownloadPdf("a4"),
                        "data-ocid": "pos_history.download_retry_button",
                        children: "Reintentar"
                      }
                    )
                  ]
                }
              ) : null
            ] })
          ]
        }
      )
    }
  );
}
function PosHistoryPage() {
  var _a, _b;
  const [search, setSearch] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const [receiptId, setReceiptId] = reactExports.useState(null);
  const salesQuery = usePosSales({
    search,
    page,
    pageSize: PAGE_SIZE
  });
  const sales = ((_a = salesQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = salesQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const columns = [
    {
      key: "saleNumber",
      header: "Venta",
      render: (sale) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-sm font-medium", children: sale.saleNumber })
    },
    {
      key: "soldAt",
      header: "Fecha",
      render: (sale) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: formatDateTime(sale.soldAt) })
    },
    {
      key: "customer",
      header: "Cliente",
      render: (sale) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: sale.customerName ?? "Venta de mostrador" })
    },
    {
      key: "items",
      header: "Artículos",
      numeric: true,
      render: (sale) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatNumber(sale.lines.length) })
    },
    {
      key: "paymentCondition",
      header: "Condición",
      render: (sale) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        StatusBadge,
        {
          label: conditionLabel(sale.paymentCondition),
          tone: sale.paymentCondition === PaymentCondition.credit ? "pending" : "neutral"
        }
      )
    },
    {
      key: "paymentMethod",
      header: "Pago",
      render: (sale) => /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: paymentLabel(sale.paymentMethod), tone: "neutral" })
    },
    {
      key: "total",
      header: "Total",
      numeric: true,
      render: (sale) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold", children: formatMoney(sale.total) })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "pos_history.page", className: "animate-fade-in space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        eyebrow: "Ventas",
        title: "Historial de ventas",
        description: "Todas las ventas de mostrador con su factura asociada. Busca por número de venta o cliente y reimprime el comprobante.",
        actions: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", asChild: true, className: "gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/pos", "data-ocid": "pos_history.new_sale_link", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "size-4", "aria-hidden": "true" }),
          "Nueva venta"
        ] }) }),
        toolbar: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full max-w-sm", children: [
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
              value: search,
              onChange: (event) => {
                setSearch(event.target.value);
                setPage(1);
              },
              placeholder: "Buscar por venta, cliente o factura",
              "aria-label": "Buscar ventas",
              "data-ocid": "pos_history.search_input",
              className: "pl-9"
            }
          )
        ] })
      }
    ),
    salesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "pos_history.loading_state", className: "space-y-2", children: Array.from({ length: 6 }, (_, i) => `pos-history-skeleton-${i}`).map(
      (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, id)
    ) }) : salesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "pos_history.error_state",
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "size-6 text-destructive",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No se pudo cargar el historial" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Ocurrió un problema al consultar las ventas. Intenta de nuevo." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => void salesQuery.refetch(),
              "data-ocid": "pos_history.retry_button",
              children: "Reintentar"
            }
          )
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DataTable,
        {
          columns,
          rows: sales,
          rowKey: (sale) => sale.id.toString(),
          ocid: "pos_history",
          caption: `${formatNumber(total)} ventas registradas`,
          emptyMessage: "No hay ventas que coincidan con la búsqueda.",
          actions: [
            {
              kind: "edit",
              label: "Reimprimir comprobante",
              onClick: (sale) => setReceiptId(sale.id)
            }
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Página ",
          formatNumber(page),
          " de ",
          formatNumber(totalPages)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              disabled: page <= 1,
              onClick: () => setPage((current) => Math.max(1, current - 1)),
              "data-ocid": "pos_history.pagination_prev",
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
              disabled: page >= totalPages,
              onClick: () => setPage((current) => Math.min(totalPages, current + 1)),
              "data-ocid": "pos_history.pagination_next",
              className: "gap-1",
              children: [
                "Siguiente",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptDialog, { saleId: receiptId, onClose: () => setReceiptId(null) })
  ] });
}
export {
  PosHistoryPage,
  PosHistoryPage as default
};
