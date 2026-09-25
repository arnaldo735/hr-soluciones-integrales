import { PurchaseInvoiceDetail } from "@/components/purchase-invoices-history/PurchaseInvoiceDetail";
import { useParams } from "@tanstack/react-router";

/**
 * Detalle de una factura de compra procesada: encabezado extraído, ítems con
 * el resultado de su aplicación al inventario y enlaces a los movimientos
 * generados. La ruta `/facturas-compra/$id` apunta a este componente.
 */
export function PurchaseInvoiceDetailPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const rawId = params.id ?? "";

  if (!/^\d+$/.test(rawId)) {
    return (
      <div
        data-ocid="purchase_invoice_detail.error_state"
        className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center"
      >
        <p className="font-display text-sm font-semibold">
          Factura no encontrada
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          El identificador de la factura no es válido.
        </p>
      </div>
    );
  }

  return <PurchaseInvoiceDetail invoiceId={BigInt(rawId)} />;
}
