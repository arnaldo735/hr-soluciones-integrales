const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jspdf.es.min-COcQXSaH.js","assets/index-EqGEeyjs.js","assets/index-DgxGT68j.css"])))=>i.map(i=>d[i]);
import { b6 as taxResponsibilityLabel, b5 as fiscalRegimeLabel, aI as formatNit, a_ as __vitePreload, z as formatDate, y as formatMoney, o as formatNumber } from "./index-EqGEeyjs.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { a as WARRANTY_CLAUSES, b as WARRANTY_IMPORTANT_TEXT, W as WARRANTY_DOCUMENT_TITLE } from "./warranty-BU5LnZHy.js";
async function loadPdfLibs() {
  const [jspdfModule, autoTableModule] = await Promise.all([
    __vitePreload(() => import("./jspdf.es.min-COcQXSaH.js").then((n) => n.j), true ? __vite__mapDeps([0,1,2]) : void 0),
    __vitePreload(() => import("./jspdf.plugin.autotable-DcYGvqni.js"), true ? [] : void 0)
  ]);
  return { jsPDF: jspdfModule.jsPDF, autoTable: autoTableModule.default };
}
async function savePdf(doc, filename) {
  await downloadFile({
    filename,
    mimeType: "application/pdf",
    data: doc.output("blob")
  });
}
function pdfCompanyFromProfile(profile) {
  if (!profile) {
    return { name: "Taller de motos" };
  }
  return {
    name: profile.legalName,
    tradeName: profile.tradeName,
    logoUrl: profile.logoUrl ?? void 0,
    taxId: formatNit(profile.taxId, profile.checkDigit),
    address: profile.address,
    city: profile.city,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    fiscalRegime: fiscalRegimeLabel(profile.fiscalRegime),
    taxResponsibility: taxResponsibilityLabel(profile.taxResponsibility)
  };
}
const MARGIN = 14;
const ACCENT = [30, 41, 59];
const MUTED = [100, 116, 139];
function hopeMessageContent(message) {
  if (!message || !message.enabled) return null;
  const text = message.text.trim();
  if (text === "") return null;
  return { text, citation: message.citation.trim() };
}
const HOPE_SURFACE = [238, 247, 240];
const HOPE_BORDER = [183, 221, 196];
const HOPE_RULE = [31, 122, 69];
const HOPE_PROMISE = [28, 58, 40];
const HOPE_CITATION = [138, 90, 18];
const HOPE_QUOTE = [106, 168, 127];
function measureHopeMessage(doc, hope, options) {
  if (!hope) return 0;
  const { x, right, narrow } = options;
  const padX = narrow ? 2.5 : 4;
  const padY = narrow ? 2.5 : 3.5;
  const textWidth = right - x - padX * 2;
  const promiseSize = narrow ? 7 : 9;
  const promiseLine = narrow ? 3 : 4;
  const citationLine = narrow ? 2.8 : 3.6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(promiseSize);
  const promiseLines = doc.splitTextToSize(hope.text, textWidth);
  const citationLines = hope.citation !== "" ? doc.splitTextToSize(hope.citation, textWidth) : [];
  const contentHeight = promiseLines.length * promiseLine + (citationLines.length > 0 ? 1.5 + citationLines.length * citationLine : 0);
  return contentHeight + padY * 2;
}
function drawHopeMessage(doc, hope, options) {
  if (!hope) return options.y;
  const { x, right, narrow } = options;
  const width = right - x;
  const padX = narrow ? 2.5 : 4;
  const padY = narrow ? 2.5 : 3.5;
  const textWidth = width - padX * 2;
  const promiseSize = narrow ? 7 : 9;
  const citationSize = narrow ? 6.5 : 8;
  const promiseLine = narrow ? 3 : 4;
  const citationLine = narrow ? 2.8 : 3.6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(promiseSize);
  const promiseLines = doc.splitTextToSize(hope.text, textWidth);
  const citationLines = hope.citation !== "" ? doc.splitTextToSize(hope.citation, textWidth) : [];
  const contentHeight = promiseLines.length * promiseLine + (citationLines.length > 0 ? 1.5 + citationLines.length * citationLine : 0);
  const boxHeight = contentHeight + padY * 2;
  const boxTop = options.y;
  doc.setFillColor(...HOPE_SURFACE);
  doc.setDrawColor(...HOPE_BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, boxTop, width, boxHeight, 0.8, 0.8, "FD");
  doc.setDrawColor(...HOPE_RULE);
  doc.setLineWidth(0.7);
  doc.line(x + 0.35, boxTop + 0.6, x + 0.35, boxTop + boxHeight - 0.6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 12 : 18);
  doc.setTextColor(...HOPE_QUOTE);
  doc.text("“", x + padX - 1, boxTop + padY + (narrow ? 2.5 : 3.5));
  doc.setFont("helvetica", "italic");
  doc.setFontSize(promiseSize);
  doc.setTextColor(...HOPE_PROMISE);
  let cursor = boxTop + padY + promiseLine * 0.75;
  doc.text(promiseLines, x + width / 2, cursor, { align: "center" });
  cursor += (promiseLines.length - 1) * promiseLine;
  if (citationLines.length > 0) {
    cursor += 1.5 + citationLine * 0.75;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(citationSize);
    doc.setTextColor(...HOPE_CITATION);
    doc.text(citationLines, x + width / 2, cursor, { align: "center" });
    cursor += (citationLines.length - 1) * citationLine;
  }
  return boxTop + boxHeight;
}
function tableEndY(doc, fallback) {
  var _a;
  const withTable = doc;
  return ((_a = withTable.lastAutoTable) == null ? void 0 : _a.finalY) ?? fallback;
}
const LOGO_FORMATS = /* @__PURE__ */ new Set(["PNG", "JPEG", "JPG", "WEBP"]);
const logoDataUrlCache = /* @__PURE__ */ new Map();
function loadLogoDataUrl(logoUrl) {
  const cached = logoDataUrlCache.get(logoUrl);
  if (cached) return cached;
  const pending = new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context || canvas.width === 0 || canvas.height === 0) {
          resolve(null);
          return;
        }
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = logoUrl;
  });
  logoDataUrlCache.set(logoUrl, pending);
  return pending;
}
function drawLogo(doc, logoDataUrl, x, y, size) {
  if (!logoDataUrl) return 0;
  try {
    const format = doc.getImageProperties(logoDataUrl).fileType.toUpperCase();
    if (!LOGO_FORMATS.has(format)) return 0;
    doc.addImage(logoDataUrl, format, x, y, size, size);
    return size + 3;
  } catch {
    return 0;
  }
}
function drawHeader(doc, company, title, logoDataUrl) {
  const logoWidth = drawLogo(doc, logoDataUrl, MARGIN, 11, 12);
  const textX = MARGIN + logoWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...ACCENT);
  doc.text(company.name, textX, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const contact = [
    company.taxId,
    company.address,
    company.city,
    company.phone,
    company.email,
    company.website
  ].filter((value) => !!value && value.trim() !== "").join("  ·  ");
  if (contact !== "") {
    doc.text(contact, textX, 23.5);
  }
  const fiscal = [company.fiscalRegime, company.taxResponsibility].filter((value) => !!value && value.trim() !== "").join("  ·  ");
  if (fiscal !== "") {
    doc.text(fiscal, textX, 28);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), 196, 18, { align: "right" });
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, 31, 196, 31);
  return 37;
}
function drawFooter(doc, note) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(note, MARGIN, 288);
    doc.text(`Página ${page} de ${pageCount}`, 196, 288, { align: "right" });
  }
}
function periodLabel(from, to) {
  if (!from && !to) return "Todo el historial";
  const start = from ? formatDate(from) : "Inicio";
  const end = to ? formatDate(to) : "Hoy";
  return `${start} — ${end}`;
}
function motorcycleLabel(line) {
  const model = `${line.motorcycleBrand} ${line.motorcycleModel}`.trim();
  const plate = line.motorcyclePlate.trim();
  if (model === "" && plate === "") return "—";
  if (plate === "") return model;
  if (model === "") return plate;
  return `${model} · ${plate}`;
}
const BREAKDOWN_HEAD = [
  "Fecha servicio",
  "Orden",
  "Servicio",
  "Moto (marca / modelo / placa)",
  "Base",
  "Comisión"
];
function breakdownRow(line) {
  return [
    formatDate(line.serviceDate),
    line.orderNumber,
    line.serviceName,
    motorcycleLabel(line),
    formatMoney(line.baseAmount),
    `${formatNumber(line.commissionRate)}% · ${formatMoney(line.commissionAmount)}`
  ];
}
const BREAKDOWN_COLUMN_STYLES = {
  4: { halign: "right" },
  5: { halign: "right" }
};
async function downloadCommissionPaymentPdf(payment, company) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl ? await loadLogoDataUrl(company.logoUrl) : null;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let cursor = drawHeader(
    doc,
    company,
    "Comprobante de pago de comisiones",
    logoDataUrl
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Técnico: ${payment.technicianName} (${payment.technicianCode})`,
    MARGIN,
    cursor
  );
  cursor += 5;
  doc.text(
    `Periodo: ${periodLabel(payment.period.from, payment.period.to)}`,
    MARGIN,
    cursor
  );
  cursor += 5;
  doc.text(`Emitido: ${formatDate(payment.paidAt)}`, MARGIN, cursor);
  cursor += 7;
  autoTable(doc, {
    startY: cursor,
    head: [["Concepto", "Detalle", "Importe"]],
    body: [
      [
        "Comisiones generadas",
        `${formatNumber(payment.lineCount)} línea(s) de mano de obra`,
        formatMoney(payment.commissionAmount)
      ],
      [
        "Base de mano de obra",
        "Monto sobre el que se calculó la comisión",
        formatMoney(payment.baseAmount)
      ],
      [
        "Préstamos deducidos",
        `${payment.loans.length} préstamo(s) aplicados en su totalidad`,
        `− ${formatMoney(payment.loansDeducted)}`
      ]
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 55 },
      2: { halign: "right", cellWidth: 35 }
    },
    margin: { left: MARGIN, right: MARGIN }
  });
  if (payment.lines.length > 0) {
    const afterSummary = tableEndY(doc, cursor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...ACCENT);
    doc.text("Desglose por servicio, moto y fecha", MARGIN, afterSummary + 8);
    autoTable(doc, {
      startY: afterSummary + 11,
      head: [BREAKDOWN_HEAD],
      body: payment.lines.map(breakdownRow),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      columnStyles: BREAKDOWN_COLUMN_STYLES,
      margin: { left: MARGIN, right: MARGIN }
    });
  }
  if (payment.loans.length > 0) {
    const afterLoans = tableEndY(doc, cursor);
    autoTable(doc, {
      startY: afterLoans + 6,
      head: [["Préstamo deducido", "Fecha", "Nota", "Importe"]],
      body: payment.loans.map((loan) => [
        `#${loan.loanId.toString()}`,
        formatDate(loan.date),
        loan.note && loan.note.trim() !== "" ? loan.note : "—",
        formatMoney(loan.amount)
      ]),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      columnStyles: { 3: { halign: "right" } },
      margin: { left: MARGIN, right: MARGIN }
    });
  }
  const finalY = tableEndY(doc, cursor);
  const netY = finalY + 10;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(120, netY - 5, 196, netY - 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ACCENT);
  doc.text("Neto pagado", 120, netY);
  doc.text(formatMoney(payment.netPaid), 196, netY, { align: "right" });
  drawFooter(
    doc,
    "Comprobante generado por el sistema de taller. Los préstamos se descuentan completos al pagar."
  );
  await savePdf(
    doc,
    `comisiones-${payment.technicianCode}-${payment.id.toString()}.pdf`
  );
}
async function downloadCommissionReportPdf(report, company, lines = []) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl ? await loadLogoDataUrl(company.logoUrl) : null;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cursor = drawHeader(
    doc,
    company,
    "Reporte general de comisiones",
    logoDataUrl
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Periodo: ${periodLabel(report.period.from, report.period.to)}`,
    MARGIN,
    cursor
  );
  autoTable(doc, {
    startY: cursor + 6,
    head: [
      [
        "Técnico",
        "Código",
        "%",
        "Líneas",
        "Base",
        "Comisión",
        "Préstamos",
        "Neto a pagar"
      ]
    ],
    body: report.technicians.map((row) => [
      row.technicianName,
      row.technicianCode,
      `${formatNumber(row.commissionRate)}%`,
      formatNumber(row.lineCount),
      formatMoney(row.baseAmount),
      formatMoney(row.commissionAmount),
      formatMoney(row.pendingLoansAmount),
      formatMoney(row.netPayable)
    ]),
    foot: [
      [
        "Total general",
        "",
        "",
        "",
        formatMoney(report.totalBase),
        formatMoney(report.totalCommission),
        formatMoney(report.totalPendingLoans),
        formatMoney(report.totalNetPayable)
      ]
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: ACCENT,
      fontStyle: "bold"
    },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" }
    },
    margin: { left: MARGIN, right: MARGIN }
  });
  if (lines.length > 0) {
    const afterTotals = tableEndY(doc, cursor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...ACCENT);
    doc.text("Desglose por servicio, moto y fecha", MARGIN, afterTotals + 8);
    const groups = /* @__PURE__ */ new Map();
    for (const line of lines) {
      const key = line.technicianId.toString();
      const group = groups.get(key);
      if (group) {
        group.lines.push(line);
      } else {
        groups.set(key, {
          label: `${line.technicianName} (${line.technicianCode})`,
          lines: [line]
        });
      }
    }
    let blockY = afterTotals + 12;
    for (const group of groups.values()) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...ACCENT);
      doc.text(group.label, MARGIN, blockY);
      autoTable(doc, {
        startY: blockY + 2,
        head: [BREAKDOWN_HEAD],
        body: group.lines.map(breakdownRow),
        theme: "striped",
        styles: { font: "helvetica", fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105], textColor: 255 },
        columnStyles: BREAKDOWN_COLUMN_STYLES,
        margin: { left: MARGIN, right: MARGIN }
      });
      blockY = tableEndY(doc, blockY) + 8;
    }
  }
  drawFooter(
    doc,
    "Reporte generado por el sistema de taller. Totales por técnico y total general del periodo."
  );
  await savePdf(doc, "reporte-comisiones.pdf");
}
const A4_LAYOUT = {
  pageFormat: "a4",
  margin: MARGIN,
  fontSize: 9,
  titleSize: 15,
  right: 196,
  footerY: 288,
  narrow: false
};
const TIRILLA_LAYOUT = {
  pageFormat: [80, 297],
  margin: 3,
  fontSize: 7.5,
  titleSize: 10,
  right: 77,
  footerY: 290,
  narrow: true
};
function layoutFor(format) {
  return format === "receipt80" ? TIRILLA_LAYOUT : A4_LAYOUT;
}
function drawContactHeader(doc, company, title, layout, logoDataUrl) {
  const { margin, right, narrow } = layout;
  if (narrow) {
    const center = (margin + right) / 2;
    const contentWidth = right - margin;
    const nameSize = layout.titleSize;
    const nameLine2 = 4.2;
    const metaSize = 6.5;
    const metaLine2 = 3;
    const titleSize = 8.5;
    const titleLine = 4;
    const logoSize = 8;
    let logoWidth2 = 0;
    if (logoDataUrl) {
      try {
        const format = doc.getImageProperties(logoDataUrl).fileType.toUpperCase();
        if (LOGO_FORMATS.has(format)) {
          doc.addImage(
            logoDataUrl,
            format,
            center - logoSize / 2,
            8,
            logoSize,
            logoSize
          );
          logoWidth2 = logoSize;
        }
      } catch {
        logoWidth2 = 0;
      }
    }
    let cursor2 = logoWidth2 > 0 ? 8 + logoSize + 4 : 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(nameSize);
    doc.setTextColor(...ACCENT);
    const nameLines2 = doc.splitTextToSize(company.name, contentWidth);
    doc.text(nameLines2, center, cursor2, { align: "center" });
    cursor2 += nameLines2.length * nameLine2 + 1.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(metaSize);
    doc.setTextColor(...MUTED);
    const contact2 = [
      company.taxId,
      company.address,
      company.city,
      company.phone,
      company.email,
      company.website
    ].filter((value) => !!value && value.trim() !== "").join(" · ");
    if (contact2 !== "") {
      const lines = doc.splitTextToSize(contact2, contentWidth);
      doc.text(lines, center, cursor2, { align: "center" });
      cursor2 += lines.length * metaLine2 + 1.5;
    }
    const fiscal2 = [company.fiscalRegime, company.taxResponsibility].filter((value) => !!value && value.trim() !== "").join("  ·  ");
    if (fiscal2 !== "") {
      const fiscalLines = doc.splitTextToSize(fiscal2, contentWidth);
      doc.text(fiscalLines, center, cursor2, { align: "center" });
      cursor2 += fiscalLines.length * metaLine2 + 1.5;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(titleSize);
    doc.setTextColor(...ACCENT);
    const titleLines = doc.splitTextToSize(title.toUpperCase(), contentWidth);
    doc.text(titleLines, center, cursor2, { align: "center" });
    cursor2 += titleLines.length * titleLine + 2;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.line(margin, cursor2, right, cursor2);
    return cursor2 + 4;
  }
  const logoWidth = drawLogo(doc, logoDataUrl, margin, 7, 12);
  const textX = margin + logoWidth;
  const titleColumnWidth = 70;
  const nameWidth = Math.max(right - textX - titleColumnWidth, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(layout.titleSize);
  doc.setTextColor(...ACCENT);
  const nameLines = doc.splitTextToSize(company.name, nameWidth);
  doc.text(nameLines, textX, 14);
  const nameLine = layout.titleSize * 0.42;
  let cursor = 14 + (nameLines.length - 1) * nameLine + 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const contact = [
    company.taxId,
    company.address,
    company.city,
    company.phone,
    company.email,
    company.website
  ].filter((value) => !!value && value.trim() !== "").join("  ·  ");
  const metaLine = 4;
  if (contact !== "") {
    const lines = doc.splitTextToSize(contact, right - textX);
    doc.text(lines, textX, cursor);
    cursor += lines.length * metaLine;
  }
  const fiscal = [company.fiscalRegime, company.taxResponsibility].filter((value) => !!value && value.trim() !== "").join("  ·  ");
  if (fiscal !== "") {
    const fiscalLines = doc.splitTextToSize(fiscal, right - textX);
    doc.text(fiscalLines, textX, cursor);
    cursor += fiscalLines.length * metaLine;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ACCENT);
  doc.text(title.toUpperCase(), right, 14, { align: "right" });
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor + 2, right, cursor + 2);
  return cursor + 6;
}
function drawContactFooter(doc, note, layout, hope) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomLimit = pageHeight - (layout.narrow ? 4 : 8);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(layout.narrow ? 6 : 7.5);
    doc.setTextColor(...MUTED);
    const noteLines = doc.splitTextToSize(note, layout.right - layout.margin);
    const noteLineHeight = layout.narrow ? 2.6 : 3.4;
    const noteHeight = noteLines.length * noteLineHeight;
    const hopeHeight = hope ? measureHopeMessage(doc, hope, {
      x: layout.margin,
      right: layout.right,
      narrow: layout.narrow
    }) : 0;
    const gap = hope ? 2 : 0;
    const footerY = Math.min(
      layout.footerY,
      bottomLimit - noteHeight - gap - hopeHeight
    );
    if (hope) {
      drawHopeMessage(doc, hope, {
        x: layout.margin,
        right: layout.right,
        y: footerY - gap - hopeHeight,
        narrow: layout.narrow
      });
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(layout.narrow ? 6 : 7.5);
    doc.setTextColor(...MUTED);
    doc.text(noteLines, layout.margin, footerY);
    doc.text(`Página ${page} de ${pageCount}`, layout.right, footerY, {
      align: "right"
    });
  }
}
async function downloadContactDocumentPdf(document2, company, format, hope) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl ? await loadLogoDataUrl(company.logoUrl) : null;
  const layout = layoutFor(format);
  const doc = new jsPDF({ unit: "mm", format: layout.pageFormat });
  let cursor = drawContactHeader(
    doc,
    company,
    document2.title,
    layout,
    logoDataUrl
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(layout.narrow ? 8 : 10);
  doc.setTextColor(...ACCENT);
  doc.text(document2.name, layout.margin, cursor);
  cursor += layout.narrow ? 4 : 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(layout.narrow ? 6.5 : 8.5);
  doc.setTextColor(...MUTED);
  doc.text(document2.number, layout.margin, cursor);
  cursor += layout.narrow ? 4 : 6;
  if (layout.narrow) {
    for (const entry of document2.meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(entry.label, layout.margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ACCENT);
      const value = doc.splitTextToSize(
        entry.value,
        layout.right - layout.margin
      );
      doc.text(value, layout.margin, cursor + 3);
      cursor += 3 + value.length * 3 + 1.5;
    }
  } else {
    autoTable(doc, {
      startY: cursor,
      body: document2.meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 40, textColor: MUTED },
        1: { fontStyle: "bold", textColor: ACCENT }
      },
      margin: { left: layout.margin, right: layout.margin }
    });
    cursor = tableEndY(doc, cursor) + 4;
  }
  for (const section of document2.sections) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(layout.narrow ? 7.5 : 9.5);
    doc.setTextColor(...ACCENT);
    doc.text(section.title, layout.margin, cursor);
    cursor += layout.narrow ? 3.5 : 4;
    if (section.rows.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(layout.narrow ? 6.5 : 8.5);
      doc.setTextColor(...MUTED);
      doc.text(section.emptyNote ?? "Sin registros.", layout.margin, cursor);
      cursor += layout.narrow ? 5 : 7;
      continue;
    }
    autoTable(doc, {
      startY: cursor,
      head: [section.columns],
      body: section.rows,
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: layout.narrow ? 6.5 : 8,
        cellPadding: layout.narrow ? 1.2 : 2,
        overflow: "linebreak"
      },
      headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      margin: { left: layout.margin, right: layout.margin }
    });
    cursor = tableEndY(doc, cursor) + (layout.narrow ? 4 : 6);
  }
  drawContactFooter(
    doc,
    document2.footer ?? "Documento generado por el sistema de taller. Conserva este comprobante.",
    layout,
    hope ?? null
  );
  const slug = document2.kind === "customer" ? "cliente" : "proveedor";
  await savePdf(doc, `ficha-${slug}-${document2.number}.pdf`);
}
const WARRANTY_NOTICE_SURFACE = [254, 243, 199];
const WARRANTY_NOTICE_BORDER = [217, 119, 6];
const WARRANTY_NOTICE_TITLE = [146, 64, 14];
const WARRANTY_NOTICE_BODY = [69, 26, 3];
function drawWarrantyIdentity(doc, data, layout) {
  const { margin, right, narrow } = layout;
  const rows = [
    ["Cliente", data.customerName],
    [
      "Documento",
      data.customerDocument.trim() !== "" ? data.customerDocument : "—"
    ],
    [
      "Motocicleta",
      `${data.motorcycleBrand} ${data.motorcycleModel}`.trim() || "—"
    ],
    ["Año", data.motorcycleYear.toString()],
    ["Placa", data.motorcyclePlate.trim() || "—"],
    ["Fecha del servicio", formatDate(data.serviceDate)],
    [
      "Técnico",
      data.technicianName.trim() !== "" ? `${data.technicianCode} · ${data.technicianName}` : "—"
    ]
  ];
  let cursor = 0;
  if (narrow) {
    for (const [label, value] of rows) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(label, margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ACCENT);
      const valueLines = doc.splitTextToSize(value, right - margin);
      doc.text(valueLines, margin, cursor + 3);
      cursor += 3 + valueLines.length * 3 + 1.5;
    }
    return cursor;
  }
  const labelWidth = 42;
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(label, margin, cursor);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT);
    const valueLines = doc.splitTextToSize(value, right - margin - labelWidth);
    doc.text(valueLines, margin + labelWidth, cursor);
    cursor += Math.max(valueLines.length, 1) * 4 + 1;
  }
  return cursor;
}
async function downloadWarrantyPdf(data, company, format, hope, termsText) {
  const { jsPDF } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl ? await loadLogoDataUrl(company.logoUrl) : null;
  const layout = layoutFor(format);
  const doc = new jsPDF({ unit: "mm", format: layout.pageFormat });
  let cursor = drawContactHeader(
    doc,
    company,
    WARRANTY_DOCUMENT_TITLE,
    layout,
    logoDataUrl
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(layout.narrow ? 8 : 10);
  doc.setTextColor(...ACCENT);
  doc.text(`Orden de servicio ${data.orderNumber}`, layout.margin, cursor);
  cursor += layout.narrow ? 4 : 6;
  cursor = drawWarrantyIdentity(doc, data, layout) + (layout.narrow ? 2 : 3);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.3);
  doc.line(layout.margin, cursor, layout.right, cursor);
  cursor += layout.narrow ? 4 : 6;
  const clauseTitleSize = layout.narrow ? 7 : 9;
  const clauseBodySize = layout.narrow ? 6.5 : 8.5;
  const clauseLine = layout.narrow ? 2.8 : 3.8;
  const clauseGap = layout.narrow ? 3 : 4.5;
  const savedTerms = (termsText == null ? void 0 : termsText.trim()) ?? "";
  if (savedTerms !== "") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(clauseBodySize);
    doc.setTextColor(...MUTED);
    const termLines = doc.splitTextToSize(
      savedTerms,
      layout.right - layout.margin
    );
    doc.text(termLines, layout.margin, cursor);
    cursor += termLines.length * clauseLine + clauseGap;
    drawContactFooter(
      doc,
      "Documento generado por el sistema de taller. Conserve esta garantía junto a su orden de servicio.",
      layout,
      hope ?? null
    );
    await savePdf(doc, `garantia-${data.orderNumber}.pdf`);
    return;
  }
  for (const clause of WARRANTY_CLAUSES) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(clauseTitleSize);
    doc.setTextColor(...ACCENT);
    const titleLines = doc.splitTextToSize(
      `${clause.number}. ${clause.title}`,
      layout.right - layout.margin
    );
    doc.text(titleLines, layout.margin, cursor);
    cursor += titleLines.length * clauseLine + 0.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(clauseBodySize);
    doc.setTextColor(...MUTED);
    const bodyLines = doc.splitTextToSize(
      clause.body,
      layout.right - layout.margin
    );
    doc.text(bodyLines, layout.margin, cursor);
    cursor += bodyLines.length * clauseLine + clauseGap;
  }
  const noticePadX = layout.narrow ? 2.5 : 4;
  const noticePadY = layout.narrow ? 2.5 : 3.5;
  const noticeTextWidth = layout.right - layout.margin - noticePadX * 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(layout.narrow ? 7 : 9);
  const noticeTitleLines = doc.splitTextToSize("IMPORTANTE", noticeTextWidth);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(clauseBodySize);
  const noticeBodyLines = doc.splitTextToSize(
    WARRANTY_IMPORTANT_TEXT,
    noticeTextWidth
  );
  const noticeHeight = noticeTitleLines.length * clauseLine + 1.5 + noticeBodyLines.length * clauseLine + noticePadY * 2;
  doc.setFillColor(...WARRANTY_NOTICE_SURFACE);
  doc.setDrawColor(...WARRANTY_NOTICE_BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(
    layout.margin,
    cursor,
    layout.right - layout.margin,
    noticeHeight,
    0.8,
    0.8,
    "FD"
  );
  doc.setDrawColor(...WARRANTY_NOTICE_BORDER);
  doc.setLineWidth(0.7);
  doc.line(
    layout.margin + 0.35,
    cursor + 0.6,
    layout.margin + 0.35,
    cursor + noticeHeight - 0.6
  );
  let noticeCursor = cursor + noticePadY + clauseLine * 0.75;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(layout.narrow ? 7 : 9);
  doc.setTextColor(...WARRANTY_NOTICE_TITLE);
  doc.text(noticeTitleLines, layout.margin + noticePadX, noticeCursor);
  noticeCursor += noticeTitleLines.length * clauseLine + 1.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(clauseBodySize);
  doc.setTextColor(...WARRANTY_NOTICE_BODY);
  doc.text(noticeBodyLines, layout.margin + noticePadX, noticeCursor);
  drawContactFooter(
    doc,
    "Documento generado por el sistema de taller. Conserve esta garantía junto a su orden de servicio.",
    layout,
    hope ?? null
  );
  await savePdf(doc, `garantia-${data.orderNumber}.pdf`);
}
export {
  drawHopeMessage as a,
  downloadCommissionPaymentPdf as b,
  downloadCommissionReportPdf as c,
  downloadWarrantyPdf as d,
  downloadContactDocumentPdf as e,
  hopeMessageContent as h,
  loadPdfLibs as l,
  measureHopeMessage as m,
  pdfCompanyFromProfile as p
};
