import { DataTable } from "@/components/DataTable";
import { DocumentPreview } from "@/components/DocumentPreview";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBusinessSettings,
  useCompanyProfile,
  useIvaSettings,
} from "@/hooks/use-company";
import { useDailyHopeMessage } from "@/hooks/use-hope";
import { usePosSale, usePosSales } from "@/hooks/use-pos";
import {
  SERVICE_TERMS_DEFAULT_TEXT,
  useServiceTermsSettings,
} from "@/hooks/use-service-terms";
import {
  companyContactLine,
  companyFiscalLines,
  companyHeaderFromProfile,
} from "@/lib/company-header";
import { downloadFile } from "@/lib/download";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  formatTaxRate,
} from "@/lib/format";
import { loadPdfLibs, pdfCompanyFromProfile } from "@/lib/pdf";
import { drawHopeMessage, hopeMessageContent } from "@/lib/pdf";
import type { HopeMessageContent } from "@/lib/pdf";
import type {
  DataColumn,
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
  PaymentCondition,
  PosSale,
} from "@/lib/types";
import {
  PaymentCondition as PaymentConditionEnum,
  PaymentMethod,
} from "@/lib/types";
import { Link } from "@tanstack/react-router";
import type { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 20;

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto",
};

function paymentLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method;
}

const CONDITION_LABELS: Record<PaymentCondition, string> = {
  [PaymentConditionEnum.cash]: "Contado",
  [PaymentConditionEnum.credit]: "Crédito",
};

function conditionLabel(condition: PaymentCondition): string {
  return CONDITION_LABELS[condition] ?? condition;
}

/**
 * Builds the POS receipt PDF in the selected format (A4 sheet or 80 mm
 * tirilla) with the same content the on-screen preview shows. The blob is
 * handed to the shared mobile-safe `downloadFile` helper so the receipt is
 * saved on the device on phone and tablet, not only on desktop.
 */
async function buildReceiptPdf(
  format: DocumentFormat,
  number: string,
  company: ReturnType<typeof pdfCompanyFromProfile>,
  meta: DocumentMeta[],
  lines: DocumentLine[],
  totals: DocumentTotals[],
  footer: string,
  hope: HopeMessageContent | null,
): Promise<jsPDF> {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const narrow = format === "receipt80";
  const margin = narrow ? 3 : 14;
  const right = narrow ? 77 : 196;
  const doc = new jsPDF({
    unit: "mm",
    format: narrow ? [80, 297] : "a4",
  });

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
    head: [["Concepto", "Cant.", "P. unit.", "Importe"]],
    body: lines.map((line) => [
      line.description,
      formatNumber(line.quantity),
      formatMoney(BigInt(Math.round(line.unitPrice * 100))),
      formatMoney(BigInt(Math.round(line.amount * 100))),
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 6.5 : 8.5,
      cellPadding: narrow ? 1.2 : 2,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  const afterLines =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? cursor;

  autoTable(doc, {
    startY: afterLines + 4,
    body: totals.map((entry) => [entry.label, entry.value]),
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
      ?.finalY ?? afterLines + 4;

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
    narrow,
  });

  return doc;
}

function ReceiptDialog({
  saleId,
  onClose,
}: {
  saleId: bigint | null;
  onClose: () => void;
}) {
  const saleQuery = usePosSale(saleId);
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const serviceTermsQuery = useServiceTermsSettings();
  const { isIvaResponsible } = useIvaSettings();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const sale = saleQuery.data ?? null;
  const business = businessQuery.data ?? null;

  // Complete company identity for the reprinted receipt: logo, razón social,
  // NIT con dígito de verificación, régimen, responsabilidad, dirección,
  // ciudad, teléfono, correo y web. Unconfigured fields are omitted cleanly.
  const companyHeader = companyHeaderFromProfile(companyQuery.data);
  const receiptCompanyName =
    companyHeader?.legalName ?? business?.name ?? "HR SOLUCIONES INTEGRALES";
  const receiptCompanyLogoUrl = companyHeader?.logoUrl;
  const receiptCompanyContact = companyContactLine(companyHeader);
  const receiptCompanyFiscal = companyFiscalLines(companyHeader);

  const lines: DocumentLine[] = (sale?.lines ?? []).map((line) => ({
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    amount: Number(line.amount),
  }));

  const meta: DocumentMeta[] = sale
    ? [
        {
          label: "Cliente",
          value: sale.customerName ?? "Venta de mostrador",
        },
        { label: "Método", value: paymentLabel(sale.paymentMethod) },
        { label: "Condición", value: conditionLabel(sale.paymentCondition) },
        { label: "Recibido", value: formatMoney(sale.amountReceived) },
        { label: "Cambio", value: formatMoney(sale.change) },
      ]
    : [];

  const totals: DocumentTotals[] = sale
    ? [
        { label: "Subtotal", value: formatMoney(sale.subtotal) },
        ...(isIvaResponsible
          ? [
              {
                label: `Impuesto (${formatTaxRate(sale.taxRate)})`,
                value: formatMoney(sale.tax),
              },
            ]
          : []),
        { label: "Descuento", value: `-${formatMoney(sale.discount)}` },
        { label: "Total", value: formatMoney(sale.total), emphasis: true },
      ]
    : [];

  // Pie de página editable "Términos y condiciones del Servicio". Mientras la
  // configuración carga, o cuando el administrador la dejó vacía, se usa el
  // texto de recepción por defecto para que el comprobante nunca quede sin pie.
  const serviceTermsText = serviceTermsQuery.data?.text?.trim() ?? "";
  const receiptFooter =
    serviceTermsText !== "" ? serviceTermsText : SERVICE_TERMS_DEFAULT_TEXT;

  async function handleDownloadPdf(nextFormat: DocumentFormat) {
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
        receiptFooter,
        hopeMessage,
      );
      await downloadFile({
        filename: `Comprobante-${sale.saleNumber}.pdf`,
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
      open={saleId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        data-ocid="pos_history.receipt_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Comprobante de venta
          </DialogTitle>
          <DialogDescription>
            Reimprime el comprobante en hoja A4 o en tirilla de 80 mm.
          </DialogDescription>
        </DialogHeader>

        {saleQuery.isLoading ? (
          <div data-ocid="pos_history.receipt_loading" className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        ) : !sale ? (
          <div
            data-ocid="pos_history.receipt_error"
            className="flex flex-col items-center gap-2 py-10 text-center"
          >
            <AlertTriangle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el comprobante de esta venta.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <DocumentPreview
              title="Comprobante"
              number={sale.saleNumber}
              companyName={receiptCompanyName}
              companyLogoUrl={receiptCompanyLogoUrl}
              companyContact={receiptCompanyContact}
              companyFiscal={receiptCompanyFiscal}
              meta={meta}
              lines={lines}
              totals={totals}
              footer={receiptFooter}
              hopeMessage={hopeMessage}
              format="a4"
              ocid="pos_history.receipt_a4"
              onDownloadPdf={handleDownloadPdf}
              isDownloading={isDownloading}
            />
            <DocumentPreview
              title="Comprobante"
              number={sale.saleNumber}
              companyName={receiptCompanyName}
              companyLogoUrl={receiptCompanyLogoUrl}
              companyContact={receiptCompanyContact}
              companyFiscal={receiptCompanyFiscal}
              meta={meta}
              lines={lines}
              totals={totals}
              footer={receiptFooter}
              hopeMessage={hopeMessage}
              format="receipt80"
              ocid="pos_history.receipt_80mm"
              onDownloadPdf={handleDownloadPdf}
              isDownloading={isDownloading}
            />
            {downloadError ? (
              <div
                data-ocid="pos_history.download_error"
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
                  data-ocid="pos_history.download_retry_button"
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

export function PosHistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [receiptId, setReceiptId] = useState<bigint | null>(null);

  const salesQuery = usePosSales({
    search,
    from: null,
    to: null,
    page,
    pageSize: PAGE_SIZE,
  });

  const sales = salesQuery.data?.items ?? [];
  const total = Number(salesQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: Array<DataColumn<PosSale>> = [
    {
      key: "saleNumber",
      header: "Venta",
      render: (sale) => (
        <span className="data-rail text-sm font-medium">{sale.saleNumber}</span>
      ),
    },
    {
      key: "soldAt",
      header: "Fecha",
      render: (sale) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(sale.soldAt)}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      render: (sale) => (
        <span className="text-sm">
          {sale.customerName ?? "Venta de mostrador"}
        </span>
      ),
    },
    {
      key: "items",
      header: "Artículos",
      numeric: true,
      render: (sale) => (
        <span className="data-rail">{formatNumber(sale.lines.length)}</span>
      ),
    },
    {
      key: "paymentCondition",
      header: "Condición",
      render: (sale) => (
        <StatusBadge
          label={conditionLabel(sale.paymentCondition)}
          tone={
            sale.paymentCondition === PaymentConditionEnum.credit
              ? "pending"
              : "neutral"
          }
        />
      ),
    },
    {
      key: "paymentMethod",
      header: "Pago",
      render: (sale) => (
        <StatusBadge label={paymentLabel(sale.paymentMethod)} tone="neutral" />
      ),
    },
    {
      key: "total",
      header: "Total",
      numeric: true,
      render: (sale) => (
        <span className="data-rail font-semibold">
          {formatMoney(sale.total)}
        </span>
      ),
    },
  ];

  return (
    <div data-ocid="pos_history.page" className="animate-fade-in space-y-5">
      <PageHeader
        eyebrow="Ventas"
        title="Historial de ventas"
        description="Todas las ventas de mostrador con su factura asociada. Busca por número de venta o cliente y reimprime el comprobante."
        actions={
          <Button type="button" asChild className="gap-2">
            <Link to="/pos" data-ocid="pos_history.new_sale_link">
              <ShoppingCart className="size-4" aria-hidden="true" />
              Nueva venta
            </Link>
          </Button>
        }
        toolbar={
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por venta, cliente o factura"
              aria-label="Buscar ventas"
              data-ocid="pos_history.search_input"
              className="pl-9"
            />
          </div>
        }
      />

      {salesQuery.isLoading ? (
        <div data-ocid="pos_history.loading_state" className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => `pos-history-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-12 w-full" />
            ),
          )}
        </div>
      ) : salesQuery.isError ? (
        <div
          data-ocid="pos_history.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="font-display text-sm font-semibold">
            No se pudo cargar el historial
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Ocurrió un problema al consultar las ventas. Intenta de nuevo.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void salesQuery.refetch()}
            data-ocid="pos_history.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={sales}
            rowKey={(sale) => sale.id.toString()}
            ocid="pos_history"
            caption={`${formatNumber(total)} ventas registradas`}
            emptyMessage="No hay ventas que coincidan con la búsqueda."
            actions={[
              {
                kind: "edit",
                label: "Reimprimir comprobante",
                onClick: (sale) => setReceiptId(sale.id),
              },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Página {formatNumber(page)} de {formatNumber(totalPages)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                data-ocid="pos_history.pagination_prev"
                className="gap-1"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                data-ocid="pos_history.pagination_next"
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      <ReceiptDialog saleId={receiptId} onClose={() => setReceiptId(null)} />
    </div>
  );
}

export default PosHistoryPage;
