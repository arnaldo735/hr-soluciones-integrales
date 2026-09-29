import { j as jsxRuntimeExports, B as Button, L as Link, o as formatNumber, z as formatDate, aj as formatDateTime, y as formatMoney, F as FileText, az as CircleCheck, T as TriangleAlert, d as Boxes, Z as cn, t as reactExports, al as useParams } from "./index-EqGEeyjs.js";
import { D as DocumentPreview } from "./DocumentPreview-C4gHQdTZ.js";
import { S as StatusBadge } from "./StatusBadge-DoLeoyAw.js";
import { I as InvoiceStatusBadge, E as EXTRACTION_STATUS_LABELS, F as FILE_KIND_LABELS, f as formatFileSize, L as LINE_APPLY_TONES, a as LINE_APPLY_LABELS, b as LINE_MATCH_LABELS } from "./InvoiceStatusBadge-CViqbrlK.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import { u as useCompanyProfile } from "./use-company-B0ILLjch.js";
import { u as useDailyHopeMessage } from "./use-hope-35eM4bcJ.js";
import { g as usePurchaseInvoice } from "./use-purchase-invoices-CnpFpiIX.js";
import { c as companyHeaderFromProfile, b as companyContactLine, a as companyFiscalLines } from "./company-header-Ds_ApIKF.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { h as hopeMessageContent, p as pdfCompanyFromProfile, l as loadPdfLibs, m as measureHopeMessage, a as drawHopeMessage } from "./pdf-BjjrMDP3.js";
import { A as ArrowLeft } from "./arrow-left-DSEilCsK.js";
import { P as PackagePlus } from "./package-plus-DDYRgHvR.js";
import { R as RefreshCw } from "./refresh-cw-DqHpo3iM.js";
import { A as ArrowUpRight } from "./arrow-up-right-D2nMGIMz.js";
import { P as Printer } from "./printer-CZZ39YEy.js";
import "./download-C8tLpeh6.js";
import "./warranty-BU5LnZHy.js";
function linesTotal(invoice) {
  return invoice.lines.reduce(
    (sum, line) => sum + line.unitCost * line.quantity,
    0n
  );
}
function errorCount(invoice) {
  return invoice.lines.filter((line) => line.applyStatus === "error").length;
}
function MetaField({
  label,
  value,
  rail
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: cn("text-sm font-medium", rail && "data-rail"), children: value })
  ] });
}
function MovementLink({
  line,
  index
}) {
  if (line.matchedPartId === void 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", asChild: true, className: "gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/inventario/$id",
      params: { id: line.matchedPartId.toString() },
      "data-ocid": `purchase_invoice_detail.movement_link.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { className: "size-3.5", "aria-hidden": "true" }),
        "Ver movimientos"
      ]
    }
  ) });
}
function LineRow({
  line,
  index
}) {
  const amount = line.unitCost * line.quantity;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { "data-ocid": `purchase_invoice_detail.line.${index + 1}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-xs text-muted-foreground", children: formatNumber(line.lineNumber) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "max-w-[280px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: line.description }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail block text-xs text-muted-foreground", children: line.code })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right", children: formatNumber(line.quantity) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(line.unitCost) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-medium", children: formatMoney(amount) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      StatusBadge,
      {
        label: LINE_APPLY_LABELS[line.applyStatus],
        tone: LINE_APPLY_TONES[line.applyStatus],
        className: "font-mono text-[10px] uppercase tracking-wider"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: LINE_MATCH_LABELS[line.matchStatus] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[240px]", children: line.applyError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        "data-ocid": `purchase_invoice_detail.line_error.${index + 1}`,
        className: "flex items-start gap-1 text-xs text-destructive",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "mt-0.5 size-3.5 shrink-0",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 break-words", children: line.applyError })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MovementLink, { line, index }) })
  ] });
}
function DetailSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoice_detail.loading_state",
      className: "mx-auto w-full max-w-6xl space-y-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-56" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 w-full" })
      ]
    }
  );
}
function DetailError() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoice_detail.error_state",
      className: "mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-6 text-destructive", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Factura no encontrada" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "La factura de compra solicitada no existe o fue eliminada del registro." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/facturas-compra",
            "data-ocid": "purchase_invoice_detail.back_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
              "Volver al historial"
            ]
          }
        ) })
      ]
    }
  );
}
async function buildPurchaseInvoicePdf(format, number, company, meta, lines, totals, footer, hope) {
  var _a, _b;
  const { jsPDF, autoTable } = await loadPdfLibs();
  const narrow = format === "receipt80";
  const margin = narrow ? 3 : 14;
  const right = narrow ? 77 : 196;
  const doc = new jsPDF({ unit: "mm", format: narrow ? [80, 297] : "a4" });
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
  doc.text("FACTURA DE COMPRA", right, 14, { align: "right" });
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
  cursor = (((_b = doc.lastAutoTable) == null ? void 0 : _b.finalY) ?? cursor) + 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 7 : 9);
  for (const entry of totals) {
    doc.setTextColor(100, 116, 139);
    doc.text(entry.label, right - 40, cursor, { align: "right" });
    doc.setFont("helvetica", entry.emphasis ? "bold" : "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(entry.value, right, cursor, { align: "right" });
    doc.setFont("helvetica", "normal");
    cursor += narrow ? 4 : 5;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  const footerLines = doc.splitTextToSize(footer, right - margin);
  const noteLineHeight = narrow ? 2.6 : 3.4;
  const noteHeight = footerLines.length * noteLineHeight;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - (narrow ? 4 : 8);
  const hopeHeight = hope ? measureHopeMessage(doc, hope, { x: margin, right, narrow }) : 0;
  const gap = hope ? 2 : 0;
  const footerY = Math.min(
    narrow ? 290 : 288,
    bottomLimit - noteHeight - gap - hopeHeight
  );
  if (hope) {
    drawHopeMessage(doc, hope, {
      x: margin,
      right,
      y: footerY - gap - hopeHeight,
      narrow
    });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(footerLines, margin, footerY);
  return doc.output("blob");
}
function PurchaseInvoicePrint({ invoice }) {
  var _a, _b;
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const [format, setFormat] = reactExports.useState("a4");
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const profile = companyQuery.data ?? null;
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const companyHeader = companyHeaderFromProfile(profile);
  const companyName = (companyHeader == null ? void 0 : companyHeader.legalName) ?? "Taller de motos";
  const companyContact = companyContactLine(companyHeader);
  const companyFiscal = companyFiscalLines(companyHeader);
  const number = ((_a = invoice.invoiceNumber) == null ? void 0 : _a.trim()) || `#${invoice.id.toString()}`;
  const total = linesTotal(invoice);
  const meta = [
    {
      label: "Proveedor",
      value: ((_b = invoice.supplierName) == null ? void 0 : _b.trim()) || "Sin identificar"
    },
    {
      label: "NIT / ID fiscal",
      value: invoice.supplierTaxId || "—",
      rail: true
    },
    { label: "Número", value: number, rail: true },
    { label: "Fecha de factura", value: formatDate(invoice.invoiceDate) },
    { label: "Cargada el", value: formatDateTime(invoice.createdAt) },
    { label: "Método de pago", value: invoice.paymentMethod || "—" },
    { label: "Medio de pago", value: invoice.paymentMeans || "—" }
  ];
  const lines = invoice.lines.map((line) => ({
    description: line.code ? `${line.code} · ${line.description}` : line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitCost) / 100,
    amount: Number(line.total) / 100
  }));
  const totals = [
    { label: "Total de líneas", value: formatNumber(invoice.lines.length) },
    { label: "Total", value: formatMoney(total), emphasis: true }
  ];
  const footer = "Documento de compra generado por el sistema de taller. Conserva este comprobante como soporte de la entrada de inventario.";
  async function handleDownloadPdf(nextFormat) {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const blob = await buildPurchaseInvoicePdf(
        nextFormat,
        number,
        pdfCompanyFromProfile(profile),
        meta,
        lines,
        totals,
        footer,
        hopeMessage
      );
      await downloadFile({
        filename: `Factura-compra-${number.replace(/[^\w-]+/g, "_")}.pdf`,
        mimeType: "application/pdf",
        data: blob
      });
    } catch {
      setDownloadError(
        "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo."
      );
    } finally {
      setIsDownloading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "purchase_invoice_detail.print_panel",
      className: "space-y-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center gap-2 print:hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "size-4 text-muted-foreground", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Imprimir factura de compra" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground print:hidden", children: [
          "Elige ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "A4" }),
          " o",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Tirilla 80 mm" }),
          " y usa",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Imprimir" }),
          " o",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Descargar PDF" }),
          " para guardar el archivo en el dispositivo."
        ] }),
        downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "purchase_invoice_detail.print_error",
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
                  onClick: () => void handleDownloadPdf(format),
                  "data-ocid": "purchase_invoice_detail.print_retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DocumentPreview,
          {
            title: "Factura de compra",
            number,
            companyName,
            companyLogoUrl: companyHeader == null ? void 0 : companyHeader.logoUrl,
            companyContact,
            companyFiscal,
            meta,
            lines,
            totals,
            footer,
            hopeMessage,
            format,
            ocid: "purchase_invoice_detail.document",
            onFormatChange: setFormat,
            onDownloadPdf: handleDownloadPdf,
            isDownloading
          }
        )
      ]
    }
  );
}
function PurchaseInvoiceDetail({
  invoiceId
}) {
  var _a, _b, _c, _d;
  const invoiceQuery = usePurchaseInvoice(invoiceId);
  if (invoiceQuery.isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(DetailSkeleton, {});
  const invoice = invoiceQuery.data ?? null;
  if (invoiceQuery.isError || !invoice) return /* @__PURE__ */ jsxRuntimeExports.jsx(DetailError, {});
  const total = linesTotal(invoice);
  const failures = errorCount(invoice);
  const isConfirmed = invoice.status === "confirmed";
  const appliedLines = invoice.lines.filter(
    (line) => line.matchedPartId !== void 0
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoice_detail.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/facturas-compra",
              "data-ocid": "purchase_invoice_detail.back_link",
              className: "gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Historial de facturas"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(InvoiceStatusBadge, { status: invoice.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Compras · Factura procesada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "data-rail text-2xl font-semibold tracking-tight", children: ((_a = invoice.invoiceNumber) == null ? void 0 : _a.trim()) || `Factura #${invoice.id.toString()}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            ((_b = invoice.supplierName) == null ? void 0 : _b.trim()) || "Proveedor sin identificar",
            " ·",
            " ",
            formatNumber(invoice.lines.length),
            " ítem",
            invoice.lines.length === 1 ? "" : "s",
            " extraído",
            invoice.lines.length === 1 ? "" : "s"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "purchase_invoice_detail.header_panel",
            className: "rounded-lg border border-border bg-card p-5 shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Proveedor",
                    value: ((_c = invoice.supplierName) == null ? void 0 : _c.trim()) || "Sin identificar"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Número de factura",
                    value: ((_d = invoice.invoiceNumber) == null ? void 0 : _d.trim()) || "—",
                    rail: true
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Fecha de factura",
                    value: formatDate(invoice.invoiceDate)
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Cargada el",
                    value: formatDateTime(invoice.createdAt)
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Extracción",
                    value: EXTRACTION_STATUS_LABELS[invoice.extractionStatus]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Archivo",
                    value: `${FILE_KIND_LABELS[invoice.file.kind] ?? invoice.file.kind} · ${formatFileSize(invoice.file.sizeBytes)}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Confirmada el",
                    value: invoice.confirmedAt ? formatDateTime(invoice.confirmedAt) : "—"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(MetaField, { label: "Total de líneas", value: formatMoney(total), rail: true })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-3.5", "aria-hidden": "true" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: invoice.file.fileName })
                ] }),
                isConfirmed ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  StatusBadge,
                  {
                    label: `${formatNumber(invoice.lines.length - failures)} aplicadas`,
                    tone: "accepted",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3", "aria-hidden": "true" }),
                    className: "font-mono text-[10px] uppercase tracking-wider"
                  }
                ) : null,
                failures > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  StatusBadge,
                  {
                    label: `${formatNumber(failures)} con error`,
                    tone: "rejected",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3", "aria-hidden": "true" }),
                    className: "font-mono text-[10px] uppercase tracking-wider"
                  }
                ) : null
              ] }),
              invoice.extractionError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  "data-ocid": "purchase_invoice_detail.extraction_error",
                  className: "mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                  children: invoice.extractionError
                }
              ) : null
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "Ítems extraídos y resultado de aplicación" }),
            isConfirmed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "inline-flex items-center gap-1.5 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PackagePlus, { className: "size-3.5", "aria-hidden": "true" }),
              "Cada línea aplicada generó un movimiento de inventario."
            ] }) : null
          ] }),
          invoice.lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "purchase_invoice_detail.lines_empty_state",
              className: "flex flex-col items-center gap-2 px-6 py-14 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  RefreshCw,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin ítems extraídos" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "La extracción no devolvió líneas para esta factura. Revisa el archivo cargado o vuelve a ejecutar la extracción." })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "#" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Descripción" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Cant." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Costo unit." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Aplicación" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Coincidencia" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Detalle" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Inventario" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: invoice.lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(LineRow, { line, index }, line.id.toString())) })
          ] }) }),
          invoice.lines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "Total de la factura",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "data-rail text-foreground", children: formatMoney(total) })
          ] }) }) : null
        ] }),
        appliedLines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "purchase_invoice_detail.movements_panel",
            className: "rounded-lg border border-border bg-card p-5 shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-3 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Boxes,
                  {
                    className: "size-4 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Movimientos de inventario generados" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "Abre el repuesto afectado para ver sus lotes, movimientos y ajustes de existencias." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: appliedLines.map((line, index) => {
                var _a2;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "li",
                  {
                    className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: line.description }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail block text-xs text-muted-foreground", children: [
                          line.code,
                          " · ",
                          formatNumber(line.quantity),
                          " ×",
                          " ",
                          formatMoney(line.unitCost)
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          asChild: true,
                          className: "gap-1",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Link,
                            {
                              to: "/inventario/$id",
                              params: { id: ((_a2 = line.matchedPartId) == null ? void 0 : _a2.toString()) ?? "" },
                              "data-ocid": `purchase_invoice_detail.part_link.${index + 1}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "size-3.5", "aria-hidden": "true" }),
                                "Ver repuesto"
                              ]
                            }
                          )
                        }
                      )
                    ]
                  },
                  line.id.toString()
                );
              }) })
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(PurchaseInvoicePrint, { invoice })
      ]
    }
  );
}
function PurchaseInvoiceDetailPage() {
  const params = useParams({ strict: false });
  const rawId = params.id ?? "";
  if (!/^\d+$/.test(rawId)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "purchase_invoice_detail.error_state",
        className: "mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Factura no encontrada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "El identificador de la factura no es válido." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PurchaseInvoiceDetail, { invoiceId: BigInt(rawId) });
}
export {
  PurchaseInvoiceDetailPage
};
