import { StatusBadge } from "@/components/StatusBadge";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONES,
} from "@/components/purchase-invoices-history/status";
import type { PurchaseInvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InvoiceStatusBadgeProps {
  status: PurchaseInvoiceStatus;
  className?: string;
}

/** Status pill for a processed purchase invoice (pendiente / confirmada / con errores). */
export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  return (
    <StatusBadge
      label={INVOICE_STATUS_LABELS[status]}
      tone={INVOICE_STATUS_TONES[status]}
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        className,
      )}
    />
  );
}
