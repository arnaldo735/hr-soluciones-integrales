import { aZ as ExtractionStatus, aP as PurchaseInvoiceStatus, aQ as LineApplyStatus, aR as LineMatchStatus, j as jsxRuntimeExports, Z as cn } from "./index-EqGEeyjs.js";
import { S as StatusBadge } from "./StatusBadge-DoLeoyAw.js";
const INVOICE_STATUS_LABELS = {
  [PurchaseInvoiceStatus.pending]: "Pendiente",
  [PurchaseInvoiceStatus.confirmed]: "Confirmada",
  [PurchaseInvoiceStatus.withErrors]: "Con errores"
};
const INVOICE_STATUS_TONES = {
  [PurchaseInvoiceStatus.pending]: "pending",
  [PurchaseInvoiceStatus.confirmed]: "confirmed",
  [PurchaseInvoiceStatus.withErrors]: "rejected"
};
const EXTRACTION_STATUS_LABELS = {
  [ExtractionStatus.pending]: "Sin extraer",
  [ExtractionStatus.extracting]: "Extrayendo",
  [ExtractionStatus.extracted]: "Extraída",
  [ExtractionStatus.failed]: "Falló la extracción"
};
const LINE_APPLY_LABELS = {
  [LineApplyStatus.pending]: "Sin aplicar",
  [LineApplyStatus.created]: "Creado",
  [LineApplyStatus.updated]: "Actualizado",
  [LineApplyStatus.error]: "Error"
};
const LINE_APPLY_TONES = {
  [LineApplyStatus.pending]: "neutral",
  [LineApplyStatus.created]: "accepted",
  [LineApplyStatus.updated]: "sent",
  [LineApplyStatus.error]: "rejected"
};
const LINE_MATCH_LABELS = {
  [LineMatchStatus.new]: "Repuesto nuevo",
  [LineMatchStatus.existing]: "Repuesto existente"
};
const FILE_KIND_LABELS = {
  pdf: "PDF",
  image: "Imagen"
};
function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / (1024 * 1024))} MB`;
}
function InvoiceStatusBadge({
  status,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    StatusBadge,
    {
      label: INVOICE_STATUS_LABELS[status],
      tone: INVOICE_STATUS_TONES[status],
      className: cn(
        "font-mono text-[10px] uppercase tracking-wider",
        className
      )
    }
  );
}
export {
  EXTRACTION_STATUS_LABELS as E,
  FILE_KIND_LABELS as F,
  InvoiceStatusBadge as I,
  LINE_APPLY_TONES as L,
  LINE_APPLY_LABELS as a,
  LINE_MATCH_LABELS as b,
  formatFileSize as f
};
