import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type {
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DocumentPreviewProps {
  /** Document title, e.g. "Cotización" or "Factura". */
  title: string;
  /** Document number rendered next to the title. */
  number: string;
  /** Issuing company name. */
  companyName: string;
  /**
   * Optional permanent URL of the company logo. When present it is rendered in
   * the document header, to the left of the company name, so every printed
   * document carries the same identity as the dashboard.
   */
  companyLogoUrl?: string;
  /** Optional company contact line. */
  companyContact?: string;
  /** Optional fiscal block: NIT, régimen and responsabilidad tributaria. */
  companyFiscal?: string[];
  /** Header metadata blocks (customer, dates, payment method…). */
  meta: DocumentMeta[];
  /** Line items. */
  lines: DocumentLine[];
  /** Totals block. */
  totals: DocumentTotals[];
  /** Optional footer note. */
  footer?: string;
  /** Paper width: A4 sheet or 80mm receipt roll. */
  format: DocumentFormat;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /**
   * When provided, the format selector is shown and the chosen format is
   * reported back so the caller can generate a matching PDF. The preview
   * itself always follows the selected format.
   */
  onFormatChange?: (format: DocumentFormat) => void;
  /**
   * Optional real PDF download. When provided, "Descargar PDF" calls this
   * instead of the browser print dialog, so the downloaded file matches the
   * selected format exactly.
   */
  onDownloadPdf?: (format: DocumentFormat) => void | Promise<void>;
  /** True while an overridden PDF download is in flight. */
  isDownloading?: boolean;
}

const FORMATS: Array<{ value: DocumentFormat; label: string }> = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" },
];

/**
 * Printable fiscal document preview. Renders an A4 sheet or an 80mm receipt
 * roll, opens the browser print dialog, and downloads the same document as a
 * PDF. The format selector drives both the on-screen preview and the printed
 * page: the sheet carries the matching class so the named `@page` rule
 * (`a4` or `tirilla`) applies during printing.
 */
export function DocumentPreview({
  title,
  number,
  companyName,
  companyLogoUrl,
  companyContact,
  companyFiscal,
  meta,
  lines,
  totals,
  footer,
  format,
  ocid,
  onFormatChange,
  onDownloadPdf,
  isDownloading,
}: DocumentPreviewProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [activeFormat, setActiveFormat] = useState<DocumentFormat>(format);

  // Keep the local selection in sync when the caller controls the format.
  useEffect(() => {
    setActiveFormat(format);
  }, [format]);

  const selectFormat = (next: DocumentFormat) => {
    setActiveFormat(next);
    onFormatChange?.(next);
  };

  const print = () => {
    window.print();
  };

  const downloadPdf = () => {
    if (onDownloadPdf) {
      void onDownloadPdf(activeFormat);
      return;
    }
    // The browser's print dialog exposes "Save as PDF"; this is the supported
    // PDF path without shipping a PDF renderer into the bundle.
    window.print();
  };

  const fiscalLines = (companyFiscal ?? []).filter(
    (line) => line.trim() !== "",
  );

  return (
    <div data-ocid={ocid} className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onFormatChange ? (
            <fieldset
              aria-label="Formato del documento"
              data-ocid={`${ocid}.format_toggle`}
              className="doc-format-toggle"
            >
              {FORMATS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-active={activeFormat === option.value}
                  aria-pressed={activeFormat === option.value}
                  onClick={() => selectFormat(option.value)}
                  data-ocid={`${ocid}.format_${option.value}`}
                >
                  {option.label}
                </button>
              ))}
            </fieldset>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {activeFormat === "a4" ? "Hoja A4" : "Tirilla 80 mm"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={print}
            data-ocid={`${ocid}.print_button`}
            className="gap-1.5"
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={downloadPdf}
            disabled={isDownloading}
            data-ocid={`${ocid}.download_button`}
            className="gap-1.5"
          >
            <Download className="size-4" aria-hidden="true" />
            {isDownloading ? "Generando…" : "Descargar PDF"}
          </Button>
        </div>
      </div>

      <div className="scroll-slim overflow-x-auto py-2">
        <div
          ref={sheetRef}
          className={cn(
            "doc-preview invoice-sheet",
            activeFormat === "a4" ? "doc-preview-a4" : "doc-preview-80mm",
          )}
        >
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt=""
                  data-ocid={`${ocid}.logo`}
                  className="size-12 shrink-0 object-contain"
                />
              ) : null}
              <div className="min-w-0">
                <p className="doc-title font-display text-lg font-bold tracking-tight">
                  {companyName}
                </p>
                {companyContact ? (
                  <p className="doc-meta text-xs">{companyContact}</p>
                ) : null}
                {fiscalLines.length > 0 ? (
                  <div
                    data-ocid={`${ocid}.fiscal_block`}
                    className="mt-1 space-y-0.5"
                  >
                    {fiscalLines.map((line) => (
                      <p key={line} className="doc-meta text-xs">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-sm font-semibold uppercase tracking-wider">
                {title}
              </p>
              <p className="data-rail text-xs">{number}</p>
            </div>
          </header>

          <div className="doc-rule my-3" />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {meta.map((entry) => (
              <div key={entry.label} className="flex justify-between gap-2">
                <dt className="doc-meta">{entry.label}</dt>
                <dd className={cn("text-right", entry.rail && "data-rail")}>
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="doc-rule my-3" />

          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                <th className="pb-1 font-medium">Concepto</th>
                <th className="pb-1 text-right font-medium">Cant.</th>
                <th className="pb-1 text-right font-medium">P. unit.</th>
                <th className="pb-1 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.description}-${index}`}>
                  <td className="py-0.5 pr-2">{line.description}</td>
                  <td className="py-0.5 text-right tabular">{line.quantity}</td>
                  <td className="py-0.5 text-right tabular">
                    {formatMoney(BigInt(Math.round(line.unitPrice * 100)))}
                  </td>
                  <td className="py-0.5 text-right tabular">
                    {formatMoney(BigInt(Math.round(line.amount * 100)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="doc-rule my-3" />

          <dl className="ml-auto w-full max-w-[220px] space-y-1 text-xs">
            {totals.map((entry) => (
              <div
                key={entry.label}
                className={cn(
                  "flex justify-between gap-3",
                  entry.emphasis && "font-display text-sm font-bold",
                )}
              >
                <dt className={cn(!entry.emphasis && "doc-meta")}>
                  {entry.label}
                </dt>
                <dd className="text-right tabular">{entry.value}</dd>
              </div>
            ))}
          </dl>

          {footer ? (
            <>
              <div className="doc-rule my-3" />
              <p className="doc-meta text-center text-[10px]">{footer}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
