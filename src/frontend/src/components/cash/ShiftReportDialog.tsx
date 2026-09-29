import { DocumentPreview } from "@/components/DocumentPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyShiftReport } from "@/hooks/use-cash";
import { useCompanyProfile } from "@/hooks/use-company";
import { useDailyHopeMessage } from "@/hooks/use-hope";
import { downloadFile } from "@/lib/download";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import {
  drawHopeMessage,
  hopeMessageContent,
  loadPdfLibs,
  pdfCompanyFromProfile,
} from "@/lib/pdf";
import type { HopeMessageContent } from "@/lib/pdf";
import type {
  DailyShiftReport,
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
  Id,
} from "@/lib/types";
import type { jsPDF } from "jspdf";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  accountLabel,
  movementKindLabel,
  movementSourceLabel,
  paymentMethodLabel,
} from "./cash-labels";

interface ShiftReportDialogProps {
  /** Shift whose daily report is shown, or `null` when the dialog is closed. */
  shiftId: Id | null;
  onClose: () => void;
}

/** Builds the printable lines, meta and totals from the daily report. */
function reportDocument(report: DailyShiftReport): {
  number: string;
  meta: DocumentMeta[];
  lines: DocumentLine[];
  totals: DocumentTotals[];
  footer: string;
} {
  const shift = report.shift;
  const lines: DocumentLine[] = report.movements.map((movement) => ({
    description: `${movementKindLabel(movement.kind)} · ${movement.description}${
      movement.reference ? ` (${movement.reference})` : ""
    }`,
    quantity: 1,
    unitPrice: Number(movement.amount),
    amount: Number(movement.amount),
  }));

  const meta: DocumentMeta[] = [
    { label: "Turno", value: `#${shift.id.toString()}`, rail: true },
    { label: "Apertura", value: formatDateTime(shift.openedAt) },
    {
      label: "Cierre",
      value: shift.closedAt ? formatDateTime(shift.closedAt) : "Turno abierto",
    },
    { label: "Saldo inicial caja", value: formatMoney(shift.openingCash) },
    { label: "Saldo inicial bancos", value: formatMoney(shift.openingBank) },
    {
      label: "Movimientos",
      value: formatNumber(BigInt(report.movements.length)),
    },
  ];

  const totals: DocumentTotals[] = [
    { label: "Ingresos en efectivo", value: formatMoney(report.cashIncome) },
    { label: "Ingresos por bancos", value: formatMoney(report.bankIncome) },
    { label: "Total ingresos", value: formatMoney(report.totalIncome) },
    { label: "Egresos en efectivo", value: formatMoney(report.cashExpense) },
    { label: "Egresos por bancos", value: formatMoney(report.bankExpense) },
    { label: "Total egresos", value: formatMoney(report.totalExpense) },
    {
      label: "Saldo final caja",
      value: formatMoney(shift.computedClosingCash),
    },
    {
      label: "Saldo final bancos",
      value: formatMoney(shift.computedClosingBank),
    },
    {
      label: "Total disponible",
      value: formatMoney(shift.computedClosingCash + shift.computedClosingBank),
      emphasis: true,
    },
  ];

  return {
    number: `Turno #${shift.id.toString()}`,
    meta,
    lines,
    totals,
    footer:
      "Informe diario del turno generado por el sistema de taller. Conserva este comprobante.",
  };
}

/** Builds the daily-report PDF in the selected format. */
async function buildReportPdf(
  format: DocumentFormat,
  report: DailyShiftReport,
  company: ReturnType<typeof pdfCompanyFromProfile>,
  document: ReturnType<typeof reportDocument>,
  hope: HopeMessageContent | null,
): Promise<jsPDF> {
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
  const contact = [company.taxId, company.address, company.phone]
    .filter((value): value is string => !!value && value.trim() !== "")
    .join(narrow ? " · " : "  ·  ");
  let cursor = 18.5;
  if (contact !== "") {
    const contactLines = doc.splitTextToSize(contact, right - margin);
    doc.text(contactLines, margin, cursor);
    cursor += contactLines.length * (narrow ? 3 : 4);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 8.5 : 11);
  doc.setTextColor(30, 41, 59);
  doc.text("INFORME DIARIO DE TURNO", right, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 9);
  doc.setTextColor(100, 116, 139);
  doc.text(document.number, right, 18.5, { align: "right" });

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor + 1, right, cursor + 1);
  cursor += 5;

  if (narrow) {
    for (const entry of document.meta) {
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
      body: document.meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 45, textColor: [100, 116, 139] },
        1: { fontStyle: "bold", textColor: [30, 41, 59] },
      },
      margin: { left: margin, right: margin },
    });
    cursor =
      ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? cursor) + 4;
  }

  autoTable(doc, {
    startY: cursor,
    head: [["Movimiento", "Medio", "Cuenta", "Importe"]],
    body: report.movements.map((movement) => [
      `${movementKindLabel(movement.kind)} · ${movement.description}`,
      paymentMethodLabel(movement.paymentMethod),
      accountLabel(movement.account),
      formatMoney(movement.amount),
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 6.5 : 8.5,
      cellPadding: narrow ? 1.2 : 2,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: { 3: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  const afterLines =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? cursor;

  autoTable(doc, {
    startY: afterLines + 4,
    head: [["Medio de pago", "Ingresos", "Egresos"]],
    body: report.byPaymentMethod.map((entry) => [
      paymentMethodLabel(entry.method),
      formatMoney(entry.income),
      formatMoney(entry.expense),
    ]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: narrow ? 6.5 : 8.5, cellPadding: 2 },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin },
  });

  const afterMethods =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? afterLines + 4;

  autoTable(doc, {
    startY: afterMethods + 4,
    body: document.totals.map((entry) => [entry.label, entry.value]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 7 : 9,
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] },
    },
    margin: { left: narrow ? margin : right - 90, right: margin },
  });

  const afterTotals =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? afterMethods + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  const footerY = afterTotals + (narrow ? 6 : 10);
  const footerLines = doc.splitTextToSize(document.footer, right - margin);
  doc.text(footerLines, margin, footerY);
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: footerY + footerLines.length * (narrow ? 2.6 : 3.4) + 1.5,
    narrow,
  });

  return doc;
}

/**
 * Daily shift report: every movement of the shift, totals by payment method
 * and the final balances, printable in A4 and 80 mm tirilla through the shared
 * `DocumentPreview`.
 */
export function ShiftReportDialog({
  shiftId,
  onClose,
}: ShiftReportDialogProps) {
  const reportQuery = useDailyShiftReport(shiftId);
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const report = reportQuery.data ?? null;
  const document = report ? reportDocument(report) : null;
  const companyName = companyQuery.data?.legalName ?? "Taller de motos";
  const companyLogoUrl = companyQuery.data?.logoUrl ?? undefined;
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);

  async function handleDownloadPdf(format: DocumentFormat) {
    if (!report || !document) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildReportPdf(
        format,
        report,
        pdfCompanyFromProfile(companyQuery.data),
        document,
        hopeMessage,
      );
      await downloadFile({
        filename: `informe-turno-${report.shift.id.toString()}.pdf`,
        mimeType: "application/pdf",
        data: doc.output("blob"),
      });
    } catch {
      setDownloadError(
        "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Dialog
      open={shiftId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        data-ocid="caja.report.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Informe diario del turno
          </DialogTitle>
          <DialogDescription>
            Todos los movimientos del turno, totales por medio de pago y saldos
            finales. Imprimible en hoja A4 o tirilla de 80 mm.
          </DialogDescription>
        </DialogHeader>

        {reportQuery.isLoading ? (
          <div data-ocid="caja.report.loading_state" className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        ) : reportQuery.isError || !report || !document ? (
          <div
            data-ocid="caja.report.error_state"
            className="flex flex-col items-center gap-3 py-10 text-center"
          >
            <AlertTriangle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el informe del turno.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void reportQuery.refetch({ cancelRefetch: true })}
              data-ocid="caja.report.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              data-ocid="caja.report.payment_methods"
              className="rounded-lg border border-border bg-card p-4"
            >
              <h3 className="font-display text-sm font-semibold">
                Totales por medio de pago
              </h3>
              <div className="mt-3 space-y-2">
                {report.byPaymentMethod.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Sin movimientos registrados en este turno.
                  </p>
                ) : (
                  report.byPaymentMethod.map((entry) => (
                    <div
                      key={entry.method}
                      data-ocid={`caja.report.method.${entry.method}`}
                      className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-b-0 last:pb-0"
                    >
                      <span className="text-muted-foreground">
                        {paymentMethodLabel(entry.method)}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="data-rail text-xs text-success">
                          +{formatMoney(entry.income)}
                        </span>
                        <span className="data-rail text-xs text-destructive">
                          −{formatMoney(entry.expense)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DocumentPreview
              title="Informe diario de turno"
              number={document.number}
              companyName={companyName}
              companyLogoUrl={companyLogoUrl}
              meta={document.meta}
              lines={document.lines}
              totals={document.totals}
              footer={document.footer}
              hopeMessage={hopeMessage}
              format="a4"
              ocid="caja.report.a4"
              onDownloadPdf={handleDownloadPdf}
              isDownloading={isDownloading}
            />
            <DocumentPreview
              title="Informe diario de turno"
              number={document.number}
              companyName={companyName}
              companyLogoUrl={companyLogoUrl}
              meta={document.meta}
              lines={document.lines}
              totals={document.totals}
              footer={document.footer}
              hopeMessage={hopeMessage}
              format="receipt80"
              ocid="caja.report.80mm"
              onDownloadPdf={handleDownloadPdf}
              isDownloading={isDownloading}
            />

            {downloadError ? (
              <div
                data-ocid="caja.report.download_error"
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
              >
                <p className="flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {downloadError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDownloadPdf("a4")}
                  data-ocid="caja.report.download_retry_button"
                >
                  Reintentar
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
