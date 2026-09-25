import type { StatusTone } from "@/components/StatusBadge";
import type {
  ExtractionStatus,
  LineApplyStatus,
  LineMatchStatus,
  PurchaseInvoiceStatus,
} from "@/lib/types";
import {
  ExtractionStatus as ExtractionStatusEnum,
  LineApplyStatus as LineApplyStatusEnum,
  LineMatchStatus as LineMatchStatusEnum,
  PurchaseInvoiceStatus as PurchaseInvoiceStatusEnum,
} from "@/lib/types";

/** Spanish label for the lifecycle state of a processed purchase invoice. */
export const INVOICE_STATUS_LABELS: Record<PurchaseInvoiceStatus, string> = {
  [PurchaseInvoiceStatusEnum.pending]: "Pendiente",
  [PurchaseInvoiceStatusEnum.confirmed]: "Confirmada",
  [PurchaseInvoiceStatusEnum.withErrors]: "Con errores",
};

/** Design-token tone for each invoice lifecycle state. */
export const INVOICE_STATUS_TONES: Record<PurchaseInvoiceStatus, StatusTone> = {
  [PurchaseInvoiceStatusEnum.pending]: "pending",
  [PurchaseInvoiceStatusEnum.confirmed]: "confirmed",
  [PurchaseInvoiceStatusEnum.withErrors]: "rejected",
};

/** Spanish label for the extraction phase of the uploaded document. */
export const EXTRACTION_STATUS_LABELS: Record<ExtractionStatus, string> = {
  [ExtractionStatusEnum.pending]: "Sin extraer",
  [ExtractionStatusEnum.extracting]: "Extrayendo",
  [ExtractionStatusEnum.extracted]: "Extraída",
  [ExtractionStatusEnum.failed]: "Falló la extracción",
};

/** Spanish label for the outcome of applying one line to inventory. */
export const LINE_APPLY_LABELS: Record<LineApplyStatus, string> = {
  [LineApplyStatusEnum.pending]: "Sin aplicar",
  [LineApplyStatusEnum.created]: "Creado",
  [LineApplyStatusEnum.updated]: "Actualizado",
  [LineApplyStatusEnum.error]: "Error",
};

/** Design-token tone for each line apply outcome. */
export const LINE_APPLY_TONES: Record<LineApplyStatus, StatusTone> = {
  [LineApplyStatusEnum.pending]: "neutral",
  [LineApplyStatusEnum.created]: "accepted",
  [LineApplyStatusEnum.updated]: "sent",
  [LineApplyStatusEnum.error]: "rejected",
};

/** Spanish label for whether a line matched an existing catalog part. */
export const LINE_MATCH_LABELS: Record<LineMatchStatus, string> = {
  [LineMatchStatusEnum.new]: "Repuesto nuevo",
  [LineMatchStatusEnum.existing]: "Repuesto existente",
};

/** Spanish label for the uploaded file kind. */
export const FILE_KIND_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "Imagen",
};

/** Human-readable byte size, e.g. `1,2 MB`. */
export function formatFileSize(bytes: bigint): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / (1024 * 1024))} MB`;
}
