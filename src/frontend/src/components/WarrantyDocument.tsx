import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { DocumentFormat, WarrantyDocumentData } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  WARRANTY_CLAUSES,
  WARRANTY_DOCUMENT_TITLE,
  WARRANTY_IMPORTANT_TEXT,
} from "@/lib/warranty";
import { Download, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface WarrantyDocumentProps {
  /** Identification block of the warranty; `null` renders nothing at all. */
  data: WarrantyDocumentData | null;
  /** Issuing company name. */
  companyName: string;
  /** Optional permanent URL of the company logo. */
  companyLogoUrl?: string;
  /** Optional company contact line. */
  companyContact?: string;
  /** Optional fiscal block: NIT, régimen and responsabilidad tributaria. */
  companyFiscal?: string[];
  /** Paper width: A4 sheet or 80mm receipt roll. */
  format: DocumentFormat;
  /**
   * Texto guardado de "Términos y Condiciones de Garantía" (un único bloque).
   * Cuando se proporciona, reemplaza las cláusulas y el aviso IMPORTANTE
   * predeterminados; cuando es `null` o vacío se usa el texto predeterminado.
   */
  termsText?: string | null;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /** When provided, the format selector is shown and the choice is reported. */
  onFormatChange?: (format: DocumentFormat) => void;
  /** Optional real PDF download for the selected format. */
  onDownloadPdf?: (format: DocumentFormat) => void | Promise<void>;
  /** True while an overridden PDF download is in flight. */
  isDownloading?: boolean;
}

const FORMATS: Array<{ value: DocumentFormat; label: string }> = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" },
];

/**
 * Documento imprimible de "Términos y Condiciones de Garantía" de la orden de
 * trabajo. Reutiliza el lenguaje visual de `DocumentPreview` (encabezado de
 * empresa, hoja A4 o tirilla 80 mm) y añade el bloque de identificación
 * (cliente, motocicleta, fecha y técnico) más las 8 cláusulas y el aviso
 * IMPORTANTE. Cuando `data` es `null` no renderiza nada, ni espacio.
 */
export function WarrantyDocument({
  data,
  companyName,
  companyLogoUrl,
  companyContact,
  companyFiscal,
  format,
  termsText,
  ocid,
  onFormatChange,
  onDownloadPdf,
  isDownloading,
}: WarrantyDocumentProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [activeFormat, setActiveFormat] = useState<DocumentFormat>(format);

  useEffect(() => {
    setActiveFormat(format);
  }, [format]);

  if (!data) return null;

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
    window.print();
  };

  const fiscalLines = (companyFiscal ?? []).filter(
    (line) => line.trim() !== "",
  );
  const isNarrow = activeFormat === "receipt80";
  const savedTerms = termsText?.trim() ?? "";

  const identity: Array<{ label: string; value: string }> = [
    { label: "Cliente", value: data.customerName },
    {
      label: "Documento",
      value: data.customerDocument.trim() !== "" ? data.customerDocument : "—",
    },
    {
      label: "Motocicleta",
      value: `${data.motorcycleBrand} ${data.motorcycleModel}`.trim() || "—",
    },
    { label: "Año", value: data.motorcycleYear.toString() },
    { label: "Placa", value: data.motorcyclePlate.trim() || "—" },
    { label: "Fecha del servicio", value: formatDate(data.serviceDate) },
    {
      label: "Técnico",
      value:
        data.technicianName.trim() !== ""
          ? `${data.technicianCode} · ${data.technicianName}`
          : "—",
    },
  ];

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
          <header
            className={cn(
              "doc-header flex gap-4",
              isNarrow
                ? "flex-col items-center gap-3 text-center"
                : "items-start justify-between",
            )}
          >
            <div
              className={cn(
                "doc-header-identity flex min-w-0 gap-3",
                isNarrow
                  ? "w-full flex-col items-center gap-2 text-center"
                  : "items-start",
              )}
            >
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt=""
                  data-ocid={`${ocid}.logo`}
                  className="size-12 shrink-0 object-contain"
                />
              ) : null}
              <div
                className={cn(
                  "min-w-0",
                  isNarrow ? "w-full space-y-1" : undefined,
                )}
              >
                <p className="doc-title font-display text-lg font-bold tracking-tight">
                  {companyName}
                </p>
                {companyContact ? (
                  <p className="doc-meta text-xs">{companyContact}</p>
                ) : null}
                {fiscalLines.length > 0 ? (
                  <div
                    data-ocid={`${ocid}.fiscal_block`}
                    className={cn("space-y-0.5", isNarrow ? "mt-0" : "mt-1")}
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
            <div
              className={cn(
                "doc-header-title",
                isNarrow ? "w-full text-center" : "text-right",
              )}
            >
              <p className="font-display text-sm font-semibold uppercase tracking-wider">
                {WARRANTY_DOCUMENT_TITLE}
              </p>
              <p className="data-rail text-xs">{data.orderNumber}</p>
            </div>
          </header>

          <div className="doc-rule my-3" />

          <section
            data-ocid={`${ocid}.identity`}
            aria-label="Identificación del servicio"
            className="doc-warranty-identity"
          >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {identity.map((entry) => (
                <div key={entry.label} className="flex justify-between gap-2">
                  <dt className="doc-meta">{entry.label}</dt>
                  <dd className="text-right">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="doc-rule my-3" />

          <section
            data-ocid={`${ocid}.clauses`}
            aria-label="Cláusulas de garantía"
            className="doc-warranty-clauses"
          >
            {savedTerms !== "" ? (
              <p
                data-ocid={`${ocid}.terms_text`}
                className="doc-warranty-clause-body whitespace-pre-line"
              >
                {savedTerms}
              </p>
            ) : (
              <>
                {WARRANTY_CLAUSES.map((clause) => (
                  <article
                    key={clause.number}
                    data-ocid={`${ocid}.clause.${clause.number}`}
                    className="doc-warranty-clause"
                  >
                    <h3 className="doc-warranty-clause-title">
                      {clause.number}. {clause.title}
                    </h3>
                    <p className="doc-warranty-clause-body">{clause.body}</p>
                  </article>
                ))}
              </>
            )}
          </section>

          {savedTerms === "" ? (
            <div
              data-ocid={`${ocid}.important`}
              className="doc-warranty-important"
              role="note"
            >
              <p className="doc-warranty-important-title">IMPORTANTE</p>
              <p className="doc-warranty-important-body">
                {WARRANTY_IMPORTANT_TEXT}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
