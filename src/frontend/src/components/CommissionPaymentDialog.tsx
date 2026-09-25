import { CommissionDocument } from "@/components/CommissionDocument";
import type { CommissionCompany } from "@/components/CommissionDocument";
import { motorcycleLabel } from "@/components/CommissionDocument";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCommissionLines,
  usePayTechnicianCommission,
} from "@/hooks/use-commissions";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { downloadCommissionPaymentPdf } from "@/lib/pdf";
import type {
  CommissionPayment,
  CommissionPeriod,
  TechnicianCommissionSummary,
} from "@/lib/types";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CommissionPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Technician whose commissions are being paid. */
  summary: TechnicianCommissionSummary | null;
  /** Period the payment consolidates. */
  period: CommissionPeriod;
  /** Company header data for the generated receipt. */
  company: CommissionCompany;
}

/** Translate a backend rejection into a Spanish message. */
function paymentErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.toLowerCase();
  // The backend traps Spanish text: "No hay comisiones pendientes para pagar"
  // and "Técnico no encontrado". Match those first, then fall back to the
  // English markers for any other rejection surface.
  if (
    message.includes("no hay comisiones pendientes") ||
    message.includes("nothing") ||
    message.includes("no pending")
  ) {
    return "Este técnico no tiene comisiones pendientes en el periodo seleccionado.";
  }
  if (message.includes("amount") || message.includes("invalid")) {
    return "El monto de la comisión no es válido. Revisa las líneas del periodo.";
  }
  if (message.includes("deduct")) {
    return "Uno de los préstamos ya fue deducido en otro pago.";
  }
  if (
    message.includes("técnico no encontrado") ||
    message.includes("technician no encontrado") ||
    message.includes("not found") ||
    message.includes("technician")
  ) {
    return "No se encontró el técnico seleccionado.";
  }
  return "No se pudo registrar el pago de comisiones. Intenta de nuevo.";
}

/**
 * Confirms and executes the payment of one technician's pending commissions
 * for a period, then renders the resulting receipt with a real PDF download.
 */
export function CommissionPaymentDialog({
  open,
  onOpenChange,
  summary,
  period,
  company,
}: CommissionPaymentDialogProps) {
  const [receipt, setReceipt] = useState<CommissionPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payCommission = usePayTechnicianCommission();

  // Lines attributed to the technician in the period, rendered in the receipt.
  const linesQuery = useCommissionLines(summary?.technicianId ?? null, period);
  const lines = linesQuery.data ?? [];

  // Reset the dialog state each time it opens for a new technician.
  useEffect(() => {
    if (open) {
      setReceipt(null);
      setError(null);
    }
  }, [open]);

  const handlePay = () => {
    if (!summary) return;
    setError(null);
    payCommission.mutate(
      { technicianId: summary.technicianId, period },
      {
        onSuccess: (payment) => {
          setReceipt(payment);
          toast.success("Pago de comisiones registrado");
        },
        onError: (mutationError) => {
          setError(paymentErrorMessage(mutationError));
        },
      },
    );
  };

  const hasPending = summary !== null && summary.lineCount > 0n;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="commission_payment.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {receipt ? "Comprobante de pago" : "Pagar comisiones"}
          </DialogTitle>
          <DialogDescription>
            {receipt
              ? "El pago quedó registrado. Descarga el comprobante en PDF."
              : "Se consolidan las comisiones pendientes y se descuentan los préstamos completos."}
          </DialogDescription>
        </DialogHeader>

        {receipt ? (
          <CommissionDocument
            kind="receipt"
            payment={receipt}
            lines={lines}
            company={company}
            onDownload={() =>
              void downloadCommissionPaymentPdf(receipt, company)
            }
            ocid="commission_payment.receipt"
          />
        ) : summary ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="font-display text-sm font-semibold">
                {summary.technicianName}
              </p>
              <p className="data-rail text-xs text-muted-foreground">
                {summary.technicianCode} · comisión{" "}
                {formatNumber(summary.commissionRate)}%
              </p>
            </div>

            <dl className="divide-y divide-border rounded-lg border border-border">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="text-sm text-muted-foreground">
                  Líneas de mano de obra
                </dt>
                <dd className="data-rail text-sm">
                  {formatNumber(summary.lineCount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="text-sm text-muted-foreground">
                  Base de mano de obra
                </dt>
                <dd className="data-rail text-sm">
                  {formatMoney(summary.baseAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="text-sm text-muted-foreground">
                  Comisión generada
                </dt>
                <dd className="data-rail text-sm">
                  {formatMoney(summary.commissionAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="text-sm text-muted-foreground">
                  Préstamos deducidos ({formatNumber(summary.pendingLoanCount)})
                </dt>
                <dd className="data-rail text-sm text-destructive">
                  − {formatMoney(summary.pendingLoansAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-3">
                <dt className="font-display text-sm font-semibold">
                  Neto a pagar
                </dt>
                <dd className="data-rail text-base font-semibold">
                  {formatMoney(summary.netPayable)}
                </dd>
              </div>
            </dl>

            {!hasPending ? (
              <p
                data-ocid="commission_payment.empty_state"
                className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
              >
                Este técnico no tiene comisiones pendientes en el periodo
                seleccionado.
              </p>
            ) : null}

            <section
              data-ocid="commission_payment.breakdown"
              className="space-y-2"
            >
              <div className="min-w-0">
                <h3 className="font-display text-sm font-semibold">
                  Desglose por servicio y moto
                </h3>
                <p className="text-xs text-muted-foreground">
                  Solo la mano de obra vinculada a un servicio del catálogo de
                  taller genera comisión. Cada línea se paga una sola vez.
                </p>
              </div>

              {linesQuery.isLoading ? (
                <div
                  data-ocid="commission_payment.breakdown.loading_state"
                  className="space-y-2"
                >
                  {Array.from(
                    { length: 3 },
                    (_, index) => `payment-line-${index}`,
                  ).map((id) => (
                    <Skeleton key={id} className="h-9 w-full" />
                  ))}
                </div>
              ) : lines.length === 0 ? (
                <p
                  data-ocid="commission_payment.breakdown.empty_state"
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  Sin líneas de comisión pendientes en el periodo seleccionado.
                </p>
              ) : (
                <div className="scroll-slim overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr className="text-left">
                        <th className="px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Fecha
                        </th>
                        <th className="px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Orden
                        </th>
                        <th className="px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Servicio
                        </th>
                        <th className="px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Moto
                        </th>
                        <th className="px-3 py-2 text-right font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Comisión
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr
                          key={line.laborId.toString()}
                          data-ocid={`commission_payment.breakdown.row.${index + 1}`}
                          className="border-t border-border"
                        >
                          <td className="data-rail whitespace-nowrap px-3 py-2 text-muted-foreground">
                            {formatDate(line.serviceDate)}
                          </td>
                          <td className="data-rail whitespace-nowrap px-3 py-2">
                            {line.orderNumber}
                          </td>
                          <td className="px-3 py-2">
                            <span className="block max-w-[200px] truncate">
                              {line.serviceName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            <span className="block max-w-[180px] truncate">
                              {motorcycleLabel(line)}
                            </span>
                          </td>
                          <td className="data-rail whitespace-nowrap px-3 py-2 text-right font-medium">
                            {formatMoney(line.commissionAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {error ? (
              <p
                data-ocid="commission_payment.error_state"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecciona un técnico para pagar sus comisiones.
          </p>
        )}

        <DialogFooter>
          {receipt ? (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              data-ocid="commission_payment.close_button"
              className="gap-1.5"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Listo
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-ocid="commission_payment.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handlePay}
                disabled={payCommission.isPending || !hasPending}
                data-ocid="commission_payment.confirm_button"
                className="gap-1.5"
              >
                {payCommission.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Pagar comisiones
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
