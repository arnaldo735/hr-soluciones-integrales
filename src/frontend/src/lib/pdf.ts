import { downloadFile } from "@/lib/download";
import {
  fiscalRegimeLabel,
  formatDate,
  formatMoney,
  formatNit,
  formatNumber,
  taxResponsibilityLabel,
} from "@/lib/format";
import type {
  CommissionLine,
  CommissionPayment,
  CommissionReport,
  CompanyProfile,
  ContactDocument,
  DocumentFormat,
  HopeMessage,
  WarrantyDocumentData,
} from "@/lib/types";
import {
  WARRANTY_CLAUSES,
  WARRANTY_DOCUMENT_TITLE,
  WARRANTY_IMPORTANT_TEXT,
} from "@/lib/warranty";
import type { jsPDF } from "jspdf";
import type autoTableType from "jspdf-autotable";

/**
 * Loads the heavy PDF libraries (jsPDF and jspdf-autotable) only when a
 * document is actually generated, so they never ship in the app's startup
 * bundle.
 */
export async function loadPdfLibs(): Promise<{
  jsPDF: typeof import("jspdf").jsPDF;
  autoTable: typeof autoTableType;
}> {
  const [jspdfModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return { jsPDF: jspdfModule.jsPDF, autoTable: autoTableModule.default };
}

/**
 * Saves a generated PDF through the shared mobile-safe download helper so the
 * file lands on the device on phone and tablet, not only on desktop.
 */
export async function savePdf(doc: jsPDF, filename: string): Promise<void> {
  await downloadFile({
    filename,
    mimeType: "application/pdf",
    data: doc.output("blob"),
  });
}

/** Company header block shared by every generated PDF. */
export interface PdfCompany {
  name: string;
  /** Trade name, when it differs from the legal name. */
  tradeName?: string;
  /**
   * Permanent URL of the company logo. When present it is drawn in the PDF
   * header, to the left of the company name, so downloaded documents carry the
   * same identity as the on-screen preview.
   */
  logoUrl?: string;
  /** Full DIAN label, e.g. `NIT 900.123.456-7`. */
  taxId?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  /** Website, e.g. `www.taller.com`. */
  website?: string;
  /** Fiscal regime label, e.g. `Responsable de IVA`. */
  fiscalRegime?: string;
  /** Tax responsibility label, e.g. `Gran contribuyente`. */
  taxResponsibility?: string;
}

/** Build the company header from the backend profile, with safe fallbacks. */
export function pdfCompanyFromProfile(
  profile: CompanyProfile | null | undefined,
): PdfCompany {
  if (!profile) {
    return { name: "Taller de motos" };
  }
  return {
    name: profile.legalName,
    tradeName: profile.tradeName,
    logoUrl: profile.logoUrl ?? undefined,
    taxId: formatNit(profile.taxId, profile.checkDigit),
    address: profile.address,
    city: profile.city,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    fiscalRegime: fiscalRegimeLabel(profile.fiscalRegime),
    taxResponsibility: taxResponsibilityLabel(profile.taxResponsibility),
  };
}

const MARGIN = 14;
const ACCENT: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];

/**
 * Displayable daily hope promise. `null` means there is nothing to print, so
 * the document is generated exactly as before without leaving an empty gap.
 */
export interface HopeMessageContent {
  text: string;
  citation: string;
}

/**
 * Extracts the printable promise from the backend message. Returns `null` when
 * the message is absent, disabled or has no text, so callers can skip the block
 * entirely instead of reserving space for it.
 */
export function hopeMessageContent(
  message: HopeMessage | null | undefined,
): HopeMessageContent | null {
  if (!message || !message.enabled) return null;
  const text = message.text.trim();
  if (text === "") return null;
  return { text, citation: message.citation.trim() };
}

/**
 * Paper literals for the hope card. The printed sheet is always light paper,
 * so the block keeps the same soft green surface, colored border and amber
 * citation in both themes — matching the on-screen `.doc-hope` block.
 */
const HOPE_SURFACE: [number, number, number] = [238, 247, 240];
const HOPE_BORDER: [number, number, number] = [183, 221, 196];
const HOPE_RULE: [number, number, number] = [31, 122, 69];
const HOPE_PROMISE: [number, number, number] = [28, 58, 40];
const HOPE_CITATION: [number, number, number] = [138, 90, 18];
const HOPE_QUOTE: [number, number, number] = [106, 168, 127];

/**
 * Measures the height the hope card will occupy for the given layout, without
 * drawing anything. Callers use it to reserve space above a fixed footer so the
 * card never runs past the bottom margin. Returns 0 when there is no promise.
 */
export function measureHopeMessage(
  doc: jsPDF,
  hope: HopeMessageContent | null,
  options: { x: number; right: number; narrow: boolean },
): number {
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
  const citationLines =
    hope.citation !== "" ? doc.splitTextToSize(hope.citation, textWidth) : [];

  const contentHeight =
    promiseLines.length * promiseLine +
    (citationLines.length > 0 ? 1.5 + citationLines.length * citationLine : 0);
  return contentHeight + padY * 2;
}

/**
 * Draws the daily hope promise as a devotional card below the existing footer
 * note: a soft green surface with a colored border and a 2px green left rail,
 * a faded decorative opening quote mark, the promise in italic type one point
 * larger than the footer, and the citation in bold amber. Returns the Y
 * position after the block so callers can stack further content. A `null`
 * promise draws nothing at all.
 */
export function drawHopeMessage(
  doc: jsPDF,
  hope: HopeMessageContent | null,
  options: { x: number; right: number; y: number; narrow: boolean },
): number {
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
  const citationLines =
    hope.citation !== "" ? doc.splitTextToSize(hope.citation, textWidth) : [];

  const contentHeight =
    promiseLines.length * promiseLine +
    (citationLines.length > 0 ? 1.5 + citationLines.length * citationLine : 0);
  const boxHeight = contentHeight + padY * 2;
  const boxTop = options.y;

  // Soft surface + colored border + 2px green left rail.
  doc.setFillColor(...HOPE_SURFACE);
  doc.setDrawColor(...HOPE_BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, boxTop, width, boxHeight, 0.8, 0.8, "FD");
  doc.setDrawColor(...HOPE_RULE);
  doc.setLineWidth(0.7);
  doc.line(x + 0.35, boxTop + 0.6, x + 0.35, boxTop + boxHeight - 0.6);

  // Decorative opening quote mark, faded in the top-left corner.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 12 : 18);
  doc.setTextColor(...HOPE_QUOTE);
  doc.text("\u201C", x + padX - 1, boxTop + padY + (narrow ? 2.5 : 3.5));

  // Promise: italic, one point larger than the footer, centered.
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

/** Y position where the last autoTable finished, for stacking content below. */
function tableEndY(doc: jsPDF, fallback: number): number {
  const withTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

/** Supported raster formats for the embedded company logo. */
const LOGO_FORMATS = new Set(["PNG", "JPEG", "JPG", "WEBP"]);

/**
 * Cache of logo URLs already resolved to a data URL. jsPDF can only embed an
 * image synchronously from a data URL or a same-origin source; a remote
 * gateway URL must be fetched and re-encoded first, so the resolved value is
 * memoized per URL to avoid re-fetching on every download.
 */
const logoDataUrlCache = new Map<string, Promise<string | null>>();

/**
 * Resolves a remote logo URL to a data URL the PDF can embed synchronously.
 * Returns `null` when the image cannot be loaded (cross-origin, unreachable or
 * an unsupported format) so a broken logo never blocks the document.
 */
function loadLogoDataUrl(logoUrl: string): Promise<string | null> {
  const cached = logoDataUrlCache.get(logoUrl);
  if (cached) return cached;

  const pending = new Promise<string | null>((resolve) => {
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

/**
 * Draws the company logo at `(x, y)` and returns the width it occupies, or 0
 * when there is no logo or the image cannot be embedded. The caller shifts the
 * company name to the right by the returned width so the header stays aligned.
 */
function drawLogo(
  doc: jsPDF,
  logoDataUrl: string | null,
  x: number,
  y: number,
  size: number,
): number {
  if (!logoDataUrl) return 0;
  try {
    const format = doc.getImageProperties(logoDataUrl).fileType.toUpperCase();
    if (!LOGO_FORMATS.has(format)) return 0;
    doc.addImage(logoDataUrl, format, x, y, size, size);
    return size + 3;
  } catch {
    // A cross-origin or unreachable logo must never break the document.
    return 0;
  }
}

function drawHeader(
  doc: jsPDF,
  company: PdfCompany,
  title: string,
  logoDataUrl: string | null,
): number {
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
    company.website,
  ]
    .filter((value): value is string => !!value && value.trim() !== "")
    .join("  ·  ");
  if (contact !== "") {
    doc.text(contact, textX, 23.5);
  }

  const fiscal = [company.fiscalRegime, company.taxResponsibility]
    .filter((value): value is string => !!value && value.trim() !== "")
    .join("  ·  ");
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

function drawFooter(doc: jsPDF, note: string): void {
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

function periodLabel(from?: bigint, to?: bigint): string {
  if (!from && !to) return "Todo el historial";
  const start = from ? formatDate(from) : "Inicio";
  const end = to ? formatDate(to) : "Hoy";
  return `${start} — ${end}`;
}

/** `Marca Modelo · PLACA` for a commission line, matching the on-screen label. */
function motorcycleLabel(line: CommissionLine): string {
  const model = `${line.motorcycleBrand} ${line.motorcycleModel}`.trim();
  const plate = line.motorcyclePlate.trim();
  if (model === "" && plate === "") return "—";
  if (plate === "") return model;
  if (model === "") return plate;
  return `${model} · ${plate}`;
}

/** Column headers shared by the receipt and report breakdown tables. */
const BREAKDOWN_HEAD = [
  "Fecha servicio",
  "Orden",
  "Servicio",
  "Moto (marca / modelo / placa)",
  "Base",
  "Comisión",
];

/** One breakdown row: fecha del servicio, orden, servicio, moto, base, comisión. */
function breakdownRow(line: CommissionLine): string[] {
  return [
    formatDate(line.serviceDate),
    line.orderNumber,
    line.serviceName,
    motorcycleLabel(line),
    formatMoney(line.baseAmount),
    `${formatNumber(line.commissionRate)}% · ${formatMoney(line.commissionAmount)}`,
  ];
}

/** Right-aligns the Base and Comisión columns of a breakdown table. */
const BREAKDOWN_COLUMN_STYLES = {
  4: { halign: "right" as const },
  5: { halign: "right" as const },
};

/**
 * Real downloadable PDF receipt for a single technician commission payment:
 * generated commissions, deducted loans and the net amount paid.
 */
export async function downloadCommissionPaymentPdf(
  payment: CommissionPayment,
  company: PdfCompany,
): Promise<void> {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl
    ? await loadLogoDataUrl(company.logoUrl)
    : null;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let cursor = drawHeader(
    doc,
    company,
    "Comprobante de pago de comisiones",
    logoDataUrl,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Técnico: ${payment.technicianName} (${payment.technicianCode})`,
    MARGIN,
    cursor,
  );
  cursor += 5;
  doc.text(
    `Periodo: ${periodLabel(payment.period.from, payment.period.to)}`,
    MARGIN,
    cursor,
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
        formatMoney(payment.commissionAmount),
      ],
      [
        "Base de mano de obra",
        "Monto sobre el que se calculó la comisión",
        formatMoney(payment.baseAmount),
      ],
      [
        "Préstamos deducidos",
        `${payment.loans.length} préstamo(s) aplicados en su totalidad`,
        `− ${formatMoney(payment.loansDeducted)}`,
      ],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 55 },
      2: { halign: "right", cellWidth: 35 },
    },
    margin: { left: MARGIN, right: MARGIN },
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
      margin: { left: MARGIN, right: MARGIN },
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
        formatMoney(loan.amount),
      ]),
      theme: "striped",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      columnStyles: { 3: { halign: "right" } },
      margin: { left: MARGIN, right: MARGIN },
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
    "Comprobante generado por el sistema de taller. Los préstamos se descuentan completos al pagar.",
  );

  await savePdf(
    doc,
    `comisiones-${payment.technicianCode}-${payment.id.toString()}.pdf`,
  );
}

/**
 * Real downloadable PDF of the general commission report: per-technician
 * totals plus the grand total for the selected period.
 *
 * When `lines` is provided, the report also prints the per-line breakdown by
 * servicio, moto (marca / modelo / placa) and fecha del servicio, grouped by
 * technician, so the PDF matches the on-screen report.
 */
export async function downloadCommissionReportPdf(
  report: CommissionReport,
  company: PdfCompany,
  lines: CommissionLine[] = [],
): Promise<void> {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl
    ? await loadLogoDataUrl(company.logoUrl)
    : null;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const cursor = drawHeader(
    doc,
    company,
    "Reporte general de comisiones",
    logoDataUrl,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Periodo: ${periodLabel(report.period.from, report.period.to)}`,
    MARGIN,
    cursor,
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
        "Neto a pagar",
      ],
    ],
    body: report.technicians.map((row) => [
      row.technicianName,
      row.technicianCode,
      `${formatNumber(row.commissionRate)}%`,
      formatNumber(row.lineCount),
      formatMoney(row.baseAmount),
      formatMoney(row.commissionAmount),
      formatMoney(row.pendingLoansAmount),
      formatMoney(row.netPayable),
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
        formatMoney(report.totalNetPayable),
      ],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: ACCENT, textColor: 255, fontStyle: "bold" },
    footStyles: {
      fillColor: [226, 232, 240],
      textColor: ACCENT,
      fontStyle: "bold",
    },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  if (lines.length > 0) {
    const afterTotals = tableEndY(doc, cursor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...ACCENT);
    doc.text("Desglose por servicio, moto y fecha", MARGIN, afterTotals + 8);

    // Group the lines by technician so each block carries its own heading.
    const groups = new Map<
      string,
      { label: string; lines: CommissionLine[] }
    >();
    for (const line of lines) {
      const key = line.technicianId.toString();
      const group = groups.get(key);
      if (group) {
        group.lines.push(line);
      } else {
        groups.set(key, {
          label: `${line.technicianName} (${line.technicianCode})`,
          lines: [line],
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
        margin: { left: MARGIN, right: MARGIN },
      });
      blockY = tableEndY(doc, blockY) + 8;
    }
  }

  drawFooter(
    doc,
    "Reporte generado por el sistema de taller. Totales por técnico y total general del periodo.",
  );

  await savePdf(doc, "reporte-comisiones.pdf");
}

/* ---------------------------------------------------------------------------
 * Contact documents (ficha de cliente / ficha de proveedor).
 * The same data the on-screen document renders, emitted in A4 or 80mm tirilla.
 * ------------------------------------------------------------------------- */

/** Geometry for each supported contact-document format. */
interface ContactLayout {
  /** jsPDF page format: A4 sheet or a continuous 80mm roll. */
  pageFormat: "a4" | [number, number];
  /** Left/right page margin in mm. */
  margin: number;
  /** Base body font size in points. */
  fontSize: number;
  /** Title font size in points. */
  titleSize: number;
  /** Right edge of the content area, in mm. */
  right: number;
  /** Y position of the footer line, in mm. */
  footerY: number;
  /** True for the narrow receipt roll, which stacks meta rows vertically. */
  narrow: boolean;
}

const A4_LAYOUT: ContactLayout = {
  pageFormat: "a4",
  margin: MARGIN,
  fontSize: 9,
  titleSize: 15,
  right: 196,
  footerY: 288,
  narrow: false,
};

/** 80mm roll: 3mm side margins leave 74mm of content, continuous height. */
const TIRILLA_LAYOUT: ContactLayout = {
  pageFormat: [80, 297],
  margin: 3,
  fontSize: 7.5,
  titleSize: 10,
  right: 77,
  footerY: 290,
  narrow: true,
};

function layoutFor(format: DocumentFormat): ContactLayout {
  return format === "receipt80" ? TIRILLA_LAYOUT : A4_LAYOUT;
}

/** Draws the company header block and returns the Y cursor below it. */
function drawContactHeader(
  doc: jsPDF,
  company: PdfCompany,
  title: string,
  layout: ContactLayout,
  logoDataUrl: string | null,
): number {
  const { margin, right, narrow } = layout;

  // 80mm tirilla: the roll is too narrow for a two-column header, so the logo,
  // the company identity and the title/number block are centered horizontally
  // across the usable width. A4 keeps its left-aligned identity and
  // right-aligned title exactly as before.
  if (narrow) {
    const center = (margin + right) / 2;
    const contentWidth = right - margin;

    // Each datum is its own stacked block: the cursor advances by the real
    // height of the block just drawn (lineHeight × number of wrapped lines),
    // so a wrapped contact or fiscal line can never be overlapped by the next
    // block. No fixed per-line increments that undercount wrapped text.
    const nameSize = layout.titleSize;
    const nameLine = 4.2;
    const metaSize = 6.5;
    const metaLine = 3;
    const titleSize = 8.5;
    const titleLine = 4;

    const logoSize = 8;
    let logoWidth = 0;
    if (logoDataUrl) {
      try {
        const format = doc
          .getImageProperties(logoDataUrl)
          .fileType.toUpperCase();
        if (LOGO_FORMATS.has(format)) {
          doc.addImage(
            logoDataUrl,
            format,
            center - logoSize / 2,
            8,
            logoSize,
            logoSize,
          );
          logoWidth = logoSize;
        }
      } catch {
        // A cross-origin or unreachable logo must never break the document.
        logoWidth = 0;
      }
    }

    // First baseline sits below the logo box (or the top margin when there is
    // no logo), leaving a clear gap so the name never touches the logo.
    let cursor = logoWidth > 0 ? 8 + logoSize + 4 : 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(nameSize);
    doc.setTextColor(...ACCENT);
    const nameLines = doc.splitTextToSize(company.name, contentWidth);
    doc.text(nameLines, center, cursor, { align: "center" });
    cursor += nameLines.length * nameLine + 1.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(metaSize);
    doc.setTextColor(...MUTED);
    const contact = [
      company.taxId,
      company.address,
      company.city,
      company.phone,
      company.email,
      company.website,
    ]
      .filter((value): value is string => !!value && value.trim() !== "")
      .join(" · ");
    if (contact !== "") {
      const lines = doc.splitTextToSize(contact, contentWidth);
      doc.text(lines, center, cursor, { align: "center" });
      cursor += lines.length * metaLine + 1.5;
    }

    const fiscal = [company.fiscalRegime, company.taxResponsibility]
      .filter((value): value is string => !!value && value.trim() !== "")
      .join("  ·  ");
    if (fiscal !== "") {
      const fiscalLines = doc.splitTextToSize(fiscal, contentWidth);
      doc.text(fiscalLines, center, cursor, { align: "center" });
      cursor += fiscalLines.length * metaLine + 1.5;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(titleSize);
    doc.setTextColor(...ACCENT);
    const titleLines = doc.splitTextToSize(title.toUpperCase(), contentWidth);
    doc.text(titleLines, center, cursor, { align: "center" });
    cursor += titleLines.length * titleLine + 2;

    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.4);
    doc.line(margin, cursor, right, cursor);
    return cursor + 4;
  }

  const logoWidth = drawLogo(doc, logoDataUrl, margin, 7, 12);
  const textX = margin + logoWidth;

  // The title is right-aligned at `right`; reserve its column so a long razón
  // social wraps instead of running under the title.
  const titleColumnWidth = 70;
  const nameWidth = Math.max(right - textX - titleColumnWidth, 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(layout.titleSize);
  doc.setTextColor(...ACCENT);
  const nameLines = doc.splitTextToSize(company.name, nameWidth);
  doc.text(nameLines, textX, 14);
  // Advance by the real height of the wrapped name so the contact block never
  // overlaps a two-line razón social.
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
    company.website,
  ]
    .filter((value): value is string => !!value && value.trim() !== "")
    .join("  ·  ");
  // Advance by the real height of each block (lineHeight × wrapped lines) so a
  // two-line contact or fiscal block is never overlapped by the next one.
  const metaLine = 4;
  if (contact !== "") {
    const lines = doc.splitTextToSize(contact, right - textX);
    doc.text(lines, textX, cursor);
    cursor += lines.length * metaLine;
  }

  const fiscal = [company.fiscalRegime, company.taxResponsibility]
    .filter((value): value is string => !!value && value.trim() !== "")
    .join("  ·  ");
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

/**
 * Draws the per-page footer note, the daily hope promise and page counter.
 *
 * The hope card is stacked *above* the footer note so it never runs past the
 * bottom margin: the footer is anchored to the page bottom, and the card is
 * placed just above it. When the card would collide with the body content the
 * footer keeps its fixed position and the card is clamped to the available
 * space, so the block is always fully inside the page.
 */
function drawContactFooter(
  doc: jsPDF,
  note: string,
  layout: ContactLayout,
  hope: HopeMessageContent | null,
): void {
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

    // Reserve the space the hope card needs above the footer note, so the
    // footer stays anchored to the page bottom and the card never overflows.
    const hopeHeight = hope
      ? measureHopeMessage(doc, hope, {
          x: layout.margin,
          right: layout.right,
          narrow: layout.narrow,
        })
      : 0;
    const gap = hope ? 2 : 0;
    const footerY = Math.min(
      layout.footerY,
      bottomLimit - noteHeight - gap - hopeHeight,
    );

    if (hope) {
      drawHopeMessage(doc, hope, {
        x: layout.margin,
        right: layout.right,
        y: footerY - gap - hopeHeight,
        narrow: layout.narrow,
      });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(layout.narrow ? 6 : 7.5);
    doc.setTextColor(...MUTED);
    doc.text(noteLines, layout.margin, footerY);
    doc.text(`Página ${page} de ${pageCount}`, layout.right, footerY, {
      align: "right",
    });
  }
}

/**
 * Real downloadable PDF of a contact document (ficha de cliente o de
 * proveedor). Renders the same data as the on-screen document in either an A4
 * sheet or an 80mm tirilla roll, reusing the shared company header/footer.
 */
export async function downloadContactDocumentPdf(
  document: ContactDocument,
  company: PdfCompany,
  format: DocumentFormat,
  hope?: HopeMessageContent | null,
): Promise<void> {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl
    ? await loadLogoDataUrl(company.logoUrl)
    : null;
  const layout = layoutFor(format);
  const doc = new jsPDF({ unit: "mm", format: layout.pageFormat });
  let cursor = drawContactHeader(
    doc,
    company,
    document.title,
    layout,
    logoDataUrl,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(layout.narrow ? 8 : 10);
  doc.setTextColor(...ACCENT);
  doc.text(document.name, layout.margin, cursor);
  cursor += layout.narrow ? 4 : 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(layout.narrow ? 6.5 : 8.5);
  doc.setTextColor(...MUTED);
  doc.text(document.number, layout.margin, cursor);
  cursor += layout.narrow ? 4 : 6;

  if (layout.narrow) {
    // The roll is too narrow for a two-column grid: stack label/value rows.
    for (const entry of document.meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(entry.label, layout.margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...ACCENT);
      const value = doc.splitTextToSize(
        entry.value,
        layout.right - layout.margin,
      );
      doc.text(value, layout.margin, cursor + 3);
      cursor += 3 + value.length * 3 + 1.5;
    }
  } else {
    autoTable(doc, {
      startY: cursor,
      body: document.meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 40, textColor: MUTED },
        1: { fontStyle: "bold", textColor: ACCENT },
      },
      margin: { left: layout.margin, right: layout.margin },
    });
    cursor = tableEndY(doc, cursor) + 4;
  }

  for (const section of document.sections) {
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
        overflow: "linebreak",
      },
      headStyles: { fillColor: [71, 85, 105], textColor: 255 },
      margin: { left: layout.margin, right: layout.margin },
    });
    cursor = tableEndY(doc, cursor) + (layout.narrow ? 4 : 6);
  }

  drawContactFooter(
    doc,
    document.footer ??
      "Documento generado por el sistema de taller. Conserva este comprobante.",
    layout,
    hope ?? null,
  );

  const slug = document.kind === "customer" ? "cliente" : "proveedor";
  await savePdf(doc, `ficha-${slug}-${document.number}.pdf`);
}

/* ---------------------------------------------------------------------------
 * Términos y Condiciones de Garantía (documento de la orden de trabajo).
 * El mismo contenido que la vista previa en pantalla, en A4 o tirilla 80 mm.
 * ------------------------------------------------------------------------- */

/** Paper literals for the IMPORTANTE notice, matching the on-screen block. */
const WARRANTY_NOTICE_SURFACE: [number, number, number] = [254, 243, 199];
const WARRANTY_NOTICE_BORDER: [number, number, number] = [217, 119, 6];
const WARRANTY_NOTICE_TITLE: [number, number, number] = [146, 64, 14];
const WARRANTY_NOTICE_BODY: [number, number, number] = [69, 26, 3];

/**
 * Draws the identification block of the warranty document (cliente,
 * motocicleta, fecha y técnico) and returns the Y cursor below it. A4 uses a
 * two-column label/value grid; the 80mm roll stacks each row.
 */
function drawWarrantyIdentity(
  doc: jsPDF,
  data: WarrantyDocumentData,
  layout: ContactLayout,
): number {
  const { margin, right, narrow } = layout;
  const rows: Array<[string, string]> = [
    ["Cliente", data.customerName],
    [
      "Documento",
      data.customerDocument.trim() !== "" ? data.customerDocument : "—",
    ],
    [
      "Motocicleta",
      `${data.motorcycleBrand} ${data.motorcycleModel}`.trim() || "—",
    ],
    ["Año", data.motorcycleYear.toString()],
    ["Placa", data.motorcyclePlate.trim() || "—"],
    ["Fecha del servicio", formatDate(data.serviceDate)],
    [
      "Técnico",
      data.technicianName.trim() !== ""
        ? `${data.technicianCode} · ${data.technicianName}`
        : "—",
    ],
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

/**
 * Real downloadable PDF of the "Términos y Condiciones de Garantía" document.
 * Renders the identification block, the warranty terms and the IMPORTANTE
 * notice in either an A4 sheet or an 80mm tirilla roll, reusing the shared
 * company header/footer and the daily hope block.
 *
 * When `termsText` is provided (the admin-edited global text), it replaces the
 * default 8 clauses and the IMPORTANTE notice with that single block, so the
 * PDF matches the on-screen document exactly.
 */
export async function downloadWarrantyPdf(
  data: WarrantyDocumentData,
  company: PdfCompany,
  format: DocumentFormat,
  hope?: HopeMessageContent | null,
  termsText?: string | null,
): Promise<void> {
  const { jsPDF } = await loadPdfLibs();
  const logoDataUrl = company.logoUrl
    ? await loadLogoDataUrl(company.logoUrl)
    : null;
  const layout = layoutFor(format);
  const doc = new jsPDF({ unit: "mm", format: layout.pageFormat });
  let cursor = drawContactHeader(
    doc,
    company,
    WARRANTY_DOCUMENT_TITLE,
    layout,
    logoDataUrl,
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

  const savedTerms = termsText?.trim() ?? "";

  if (savedTerms !== "") {
    // Single admin-edited block: draw it as one flowing paragraph, matching the
    // on-screen `.doc-warranty-clause-body` rendering.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(clauseBodySize);
    doc.setTextColor(...MUTED);
    const termLines = doc.splitTextToSize(
      savedTerms,
      layout.right - layout.margin,
    );
    doc.text(termLines, layout.margin, cursor);
    cursor += termLines.length * clauseLine + clauseGap;

    drawContactFooter(
      doc,
      "Documento generado por el sistema de taller. Conserve esta garantía junto a su orden de servicio.",
      layout,
      hope ?? null,
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
      layout.right - layout.margin,
    );
    doc.text(titleLines, layout.margin, cursor);
    cursor += titleLines.length * clauseLine + 0.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(clauseBodySize);
    doc.setTextColor(...MUTED);
    const bodyLines = doc.splitTextToSize(
      clause.body,
      layout.right - layout.margin,
    );
    doc.text(bodyLines, layout.margin, cursor);
    cursor += bodyLines.length * clauseLine + clauseGap;
  }

  // IMPORTANTE notice: soft amber card with a colored left rail.
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
    noticeTextWidth,
  );
  const noticeHeight =
    noticeTitleLines.length * clauseLine +
    1.5 +
    noticeBodyLines.length * clauseLine +
    noticePadY * 2;

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
    "FD",
  );
  doc.setDrawColor(...WARRANTY_NOTICE_BORDER);
  doc.setLineWidth(0.7);
  doc.line(
    layout.margin + 0.35,
    cursor + 0.6,
    layout.margin + 0.35,
    cursor + noticeHeight - 0.6,
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
    hope ?? null,
  );

  await savePdf(doc, `garantia-${data.orderNumber}.pdf`);
}
