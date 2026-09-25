import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBackend } from "@/hooks/use-backend";
import { useCompanyProfile, useIvaSettings } from "@/hooks/use-company";
import { useCustomerDetail } from "@/hooks/use-customers";
import { downloadFile } from "@/lib/download";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatTaxRate,
} from "@/lib/format";
import { loadPdfLibs, pdfCompanyFromProfile } from "@/lib/pdf";
import type {
  BusinessSettings,
  CompanyProfile,
  CustomerDetail,
  InstallmentPlanView,
  InstallmentRow,
  Invoice,
  PaymentCondition,
} from "@/lib/types";
import {
  NotificationSource,
  PaymentCondition as PaymentConditionEnum,
  PaymentMethod,
  PaymentStatus,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import type { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Download,
  Mail,
  Printer,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Customer fiscal address resolved from the backend customer record.
 * The invoice's own `customerAddress` snapshot is authoritative; when it is
 * absent the document falls back to the customer's contact data.
 */
function resolveFiscalAddress(
  invoice: Invoice,
  customer: CustomerDetail | null,
): string {
  const stored = invoice.customerAddress?.trim();
  if (stored) return stored;
  const record = customer?.customer;
  if (record) {
    const address = record.address?.trim();
    if (address) return address;
    const parts = [record.document?.trim(), record.phone.trim()].filter(
      (value): value is string => !!value && value !== "",
    );
    if (parts.length > 0) return parts.join(" · ");
  }
  return "—";
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto",
};

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  PaymentMethod.cash,
  PaymentMethod.card,
  PaymentMethod.transfer,
  PaymentMethod.mixed,
];

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.pending]: "Pendiente de pago",
  [PaymentStatus.paid]: "Pagada",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.pending]: "border-warning/50 bg-warning/15 text-warning",
  [PaymentStatus.paid]: "border-success/50 bg-success/15 text-success",
};

const CONDITION_LABELS: Record<PaymentCondition, string> = {
  [PaymentConditionEnum.cash]: "Contado",
  [PaymentConditionEnum.credit]: "Crédito",
};

/** Builds the display view of a credit plan from the invoice's installments. */
function buildPlanView(invoice: Invoice): InstallmentPlanView | null {
  const plan = invoice.installments;
  if (!plan) return null;
  const rows: InstallmentRow[] = plan.installments.map((installment) => ({
    number: Number(installment.number),
    amount: installment.amount,
    dueDate: installment.dueDate,
    paid: installment.paid,
    paidAt: installment.paidAt ?? null,
  }));
  const paidCount = rows.filter((row) => row.paid).length;
  const pendingAmount = rows.reduce(
    (sum, row) => (row.paid ? sum : sum + row.amount),
    0n,
  );
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0n);
  return {
    installmentCount: Number(plan.installmentCount),
    firstDueDate: plan.firstDueDate,
    rows,
    paidCount,
    pendingCount: rows.length - paidCount,
    pendingAmount,
    totalAmount,
  };
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      data-ocid="invoice_detail.status_badge"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        PAYMENT_STATUS_STYLES[status],
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

function MarkPaidDialog({
  open,
  onOpenChange,
  invoice,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>(invoice.paymentMethod);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.markInvoicePaid(invoice.id, paymentMethod);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["invoice", invoice.id.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`Factura ${invoice.number} marcada como pagada`);
      onOpenChange(false);
    },
    onError: () => {
      setError("No se pudo registrar el pago. Intenta de nuevo.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    mutation.mutate(method);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="invoice_detail.paid_dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Marcar como pagada</DialogTitle>
          <DialogDescription>
            Confirma el método con el que el cliente liquidó la factura{" "}
            <span className="data-rail text-foreground">{invoice.number}</span>{" "}
            por {formatMoney(invoice.total)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="paid-method">Método de pago</Label>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            >
              <SelectTrigger
                id="paid-method"
                aria-label="Método de pago"
                data-ocid="invoice_detail.paid_method_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {PAYMENT_METHOD_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p
              data-ocid="invoice_detail.paid_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="invoice_detail.paid_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              data-ocid="invoice_detail.paid_submit_button"
              className="gap-2"
            >
              <BadgeCheck className="size-4" aria-hidden="true" />
              {mutation.isPending ? "Registrando…" : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InstallmentPlanPanel({
  invoice,
  plan,
}: {
  invoice: Invoice;
  plan: InstallmentPlanView;
}) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (installmentNumber: number) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerInstallmentPayment(
        invoice.id,
        BigInt(installmentNumber),
      );
    },
    onSuccess: (updated: Invoice, installmentNumber: number) => {
      void queryClient.invalidateQueries({
        queryKey: ["invoice", invoice.id.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setError(null);
      if (updated.paymentStatus === PaymentStatus.paid) {
        toast.success(
          `Cuota ${installmentNumber} registrada. La factura quedó pagada.`,
        );
      } else {
        toast.success(`Cuota ${installmentNumber} registrada`);
      }
    },
    onError: () => {
      setError("No se pudo registrar el pago de la cuota. Intenta de nuevo.");
    },
  });

  const today = Date.now();

  return (
    <section
      data-ocid="invoice_detail.installments_panel"
      className="rounded-lg border border-border bg-card p-5 shadow-subtle print:hidden"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-display text-sm font-semibold">
              Plan de cuotas
            </h2>
            <p className="text-xs text-muted-foreground">
              Primera cuota el {formatDate(plan.firstDueDate)} ·{" "}
              {formatNumber(plan.installmentCount)} cuotas
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          data-ocid="invoice_detail.installments_progress"
          className={cn(
            "font-mono text-[10px] uppercase tracking-wider",
            plan.pendingCount === 0
              ? "border-success/50 bg-success/15 text-success"
              : "border-warning/50 bg-warning/15 text-warning",
          )}
        >
          {formatNumber(plan.paidCount)} / {formatNumber(plan.rows.length)}{" "}
          pagadas
        </Badge>
      </header>

      <table className="installment-table">
        <thead>
          <tr>
            <th scope="col">Cuota</th>
            <th scope="col">Vencimiento</th>
            <th scope="col" className="text-right">
              Valor
            </th>
            <th scope="col">Estado</th>
            <th scope="col" className="text-right">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {plan.rows.map((row) => {
            const overdue =
              !row.paid && Number(row.dueDate / 1_000_000n) < today;
            return (
              <tr
                key={row.number}
                data-paid={row.paid ? "true" : "false"}
                data-overdue={overdue ? "true" : "false"}
                data-ocid={`invoice_detail.installment_row.${row.number}`}
              >
                <td className="installment-number">
                  {row.number} / {plan.rows.length}
                </td>
                <td className="installment-due">
                  {formatDate(row.dueDate)}
                  {overdue ? (
                    <span className="ml-2 text-[11px] font-medium text-destructive">
                      Vencida
                    </span>
                  ) : null}
                </td>
                <td className="installment-amount">
                  {formatMoney(row.amount)}
                </td>
                <td>
                  {row.paid ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      Pagada
                      {row.paidAt ? (
                        <span className="text-muted-foreground">
                          · {formatDate(row.paidAt)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="text-right">
                  {row.paid ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate(row.number)}
                      data-ocid={`invoice_detail.pay_installment_button.${row.number}`}
                      className="gap-1"
                    >
                      <BadgeCheck className="size-3.5" aria-hidden="true" />
                      Registrar pago
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="installment-summary">
        <span>
          Total financiado <strong>{formatMoney(plan.totalAmount)}</strong>
        </span>
        <span>
          Pagado{" "}
          <strong>{formatMoney(plan.totalAmount - plan.pendingAmount)}</strong>
        </span>
        <span>
          Saldo pendiente <strong>{formatMoney(plan.pendingAmount)}</strong>
        </span>
      </div>

      {error ? (
        <p
          data-ocid="invoice_detail.installment_error"
          className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

function FiscalBlock({
  title,
  lines,
}: {
  title: string;
  lines: Array<{ label: string; value: string; rail?: boolean }>;
}) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <dl className="space-y-1">
        {lines.map((line) => (
          <div key={line.label} className="flex gap-2 text-sm">
            <dt className="w-24 shrink-0 text-muted-foreground">
              {line.label}
            </dt>
            <dd
              className={cn(
                "min-w-0 break-words font-medium",
                line.rail && "data-rail",
              )}
            >
              {line.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Builds the invoice PDF with the same content the on-screen document shows.
 * The generated blob is handed to the shared mobile-safe `downloadFile` helper
 * so the file lands on the device on phone and tablet, not only on desktop.
 */
async function buildInvoicePdf(
  invoice: Invoice,
  companyProfile: CompanyProfile | null | undefined,
  fiscalAddress: string,
  showTax: boolean,
): Promise<jsPDF> {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const company = pdfCompanyFromProfile(companyProfile);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const right = 196;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text(company.name, margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const contact = [company.taxId, company.address, company.phone]
    .filter((value): value is string => !!value && value.trim() !== "")
    .join("  ·  ");
  if (contact !== "") doc.text(contact, margin, 23.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("FACTURA", right, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(invoice.number, right, 23.5, { align: "right" });

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, 31, right, 31);

  autoTable(doc, {
    startY: 37,
    body: [
      ["Cliente", invoice.customerName],
      ["NIT/RUC", invoice.customerTaxId || "—"],
      ["Dirección fiscal", fiscalAddress],
      ["Emitida", formatDateTime(invoice.issuedAt)],
      ["Método", PAYMENT_METHOD_LABELS[invoice.paymentMethod]],
      ["Condición", CONDITION_LABELS[invoice.paymentCondition]],
      ["Estado", PAYMENT_STATUS_LABELS[invoice.paymentStatus]],
    ],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 40, textColor: [100, 116, 139] },
      1: { fontStyle: "bold", textColor: [30, 41, 59] },
    },
    margin: { left: margin, right: margin },
  });

  const afterMeta =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 37;

  autoTable(doc, {
    startY: afterMeta + 6,
    head: [["Concepto", "Cantidad", "Precio unitario", "Importe"]],
    body: invoice.lines.map((line) => [
      line.description,
      formatNumber(line.quantity),
      formatMoney(line.unitPrice),
      formatMoney(line.amount),
    ]),
    theme: "striped",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  const afterLines =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? afterMeta + 6;

  const totalsBody: string[][] = [
    ["Subtotal", formatMoney(invoice.subtotal)],
    ...(showTax
      ? [
          [
            `Impuesto (${formatTaxRate(invoice.taxRate)})`,
            formatMoney(invoice.tax),
          ],
        ]
      : []),
    ["Total", formatMoney(invoice.total)],
  ];

  autoTable(doc, {
    startY: afterLines + 6,
    body: totalsBody,
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 45, halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] },
    },
    margin: { left: right - 90, right: margin },
  });

  const afterTotals =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? afterLines + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Documento fiscal generado por el sistema de taller. Conserve esta factura como comprobante de su servicio.",
    margin,
    afterTotals + 10,
  );

  return doc;
}

function InvoiceDocument({
  invoice,
  business,
  companyLogoUrl,
  fiscalAddress,
  showTax,
}: {
  invoice: Invoice;
  business: BusinessSettings | null;
  companyLogoUrl?: string;
  fiscalAddress: string;
  showTax: boolean;
}) {
  return (
    <article
      data-ocid="invoice_detail.document"
      className="invoice-sheet rounded-lg border border-border bg-card p-6 shadow-subtle sm:p-8"
    >
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            {companyLogoUrl ? (
              <img
                src={companyLogoUrl}
                alt=""
                data-ocid="invoice_detail.document.logo"
                className="size-12 shrink-0 object-contain"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-md bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
                HR
              </span>
            )}
            <span className="font-display text-lg font-semibold tracking-tight">
              {business?.name ?? "HR SOLUCIONES INTEGRALES"}
            </span>
          </div>
          <div className="space-y-0.5 text-sm text-muted-foreground">
            {business?.taxId ? (
              <p className="data-rail">NIT/RUC: {business.taxId}</p>
            ) : null}
            {business?.address ? <p>{business.address}</p> : null}
            {business?.phone ? (
              <p className="data-rail">Tel: {business.phone}</p>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Factura
          </p>
          <p className="data-rail text-2xl font-semibold tracking-tight">
            {invoice.number}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Emitida el {formatDate(invoice.issuedAt)}
          </p>
          <div className="mt-2 flex justify-end">
            <PaymentStatusBadge status={invoice.paymentStatus} />
          </div>
        </div>
      </header>

      <section className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
        <FiscalBlock
          title="Cliente"
          lines={[
            { label: "Nombre", value: invoice.customerName },
            {
              label: "NIT/RUC",
              value: invoice.customerTaxId || "—",
              rail: true,
            },
            { label: "Dirección fiscal", value: fiscalAddress },
          ]}
        />
        <FiscalBlock
          title="Emisión"
          lines={[
            {
              label: "Fecha",
              value: formatDateTime(invoice.issuedAt),
            },
            {
              label: "Orden",
              value: invoice.orderId ? `#${invoice.orderId.toString()}` : "—",
              rail: true,
            },
            {
              label: "Método",
              value: PAYMENT_METHOD_LABELS[invoice.paymentMethod],
            },
            {
              label: "Condición",
              value: CONDITION_LABELS[invoice.paymentCondition],
            },
          ]}
        />
      </section>

      <section className="py-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Concepto
              </TableHead>
              <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Cantidad
              </TableHead>
              <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Precio unitario
              </TableHead>
              <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Importe
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lines.map((line, index) => (
              <TableRow
                key={`${line.description}-${index}`}
                data-ocid={`invoice_detail.line.${index + 1}`}
              >
                <TableCell className="max-w-[320px] whitespace-normal">
                  {line.description}
                </TableCell>
                <TableCell className="data-rail text-right">
                  {formatNumber(line.quantity)}
                </TableCell>
                <TableCell className="data-rail text-right text-muted-foreground">
                  {formatMoney(line.unitPrice)}
                </TableCell>
                <TableCell className="data-rail text-right font-medium">
                  {formatMoney(line.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="flex justify-end border-t border-border pt-6">
        <dl className="w-full max-w-xs space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="data-rail font-medium">
              {formatMoney(invoice.subtotal)}
            </dd>
          </div>
          {showTax ? (
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">
                Impuesto ({formatTaxRate(invoice.taxRate)})
              </dt>
              <dd className="data-rail font-medium">
                {formatMoney(invoice.tax)}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
            <dt className="font-display text-sm font-semibold">Total</dt>
            <dd className="data-rail text-lg font-semibold text-primary">
              {formatMoney(invoice.total)}
            </dd>
          </div>
        </dl>
      </section>

      <footer className="mt-6 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Documento fiscal generado por HR SOLUCIONES INTEGRALES. Conserve esta
          factura como comprobante de su servicio.
        </p>
      </footer>
    </article>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { actor, isFetching } = useBackend();
  const [paidOpen, setPaidOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { isIvaResponsible } = useIvaSettings();
  const companyQuery = useCompanyProfile();

  const invoiceId = BigInt(id);

  const invoiceQuery = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getInvoice(invoiceId);
    },
    enabled: !!actor && !isFetching,
  });

  const businessQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });

  const invoice = invoiceQuery.data ?? null;
  const business = businessQuery.data ?? null;

  // Resolve the customer record so the fiscal address reaches the document.
  const customerQuery = useCustomerDetail(invoice?.customerId ?? null);
  const customer = customerQuery.data ?? null;
  const fiscalAddress = invoice ? resolveFiscalAddress(invoice, customer) : "—";

  if (invoiceQuery.isLoading) {
    return (
      <div
        data-ocid="invoice_detail.loading_state"
        className="mx-auto w-full max-w-4xl space-y-4"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    );
  }

  if (invoiceQuery.isError || !invoice) {
    return (
      <div
        data-ocid="invoice_detail.error_state"
        className="mx-auto flex w-full max-w-4xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center"
      >
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        <p className="font-display text-sm font-semibold">
          Factura no encontrada
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          La factura solicitada no existe o fue eliminada del registro.
        </p>
        <Button type="button" variant="outline" asChild>
          <Link to="/facturas" data-ocid="invoice_detail.back_button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a facturación
          </Link>
        </Button>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === PaymentStatus.paid;
  const isCredit = invoice.paymentCondition === PaymentConditionEnum.credit;
  const plan = buildPlanView(invoice);

  const handleDownloadPdf = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildInvoicePdf(
        invoice,
        companyQuery.data,
        fiscalAddress,
        isIvaResponsible,
      );
      await downloadFile({
        filename: `Factura-${invoice.number}.pdf`,
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
  };

  return (
    <div
      data-ocid="invoice_detail.page"
      className="mx-auto w-full max-w-4xl animate-fade-in space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link
            to="/facturas"
            data-ocid="invoice_detail.back_link"
            className="gap-1"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Facturación
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {isPaid ? (
            <Badge
              variant="outline"
              data-ocid="invoice_detail.paid_badge"
              className="gap-1 border-success/50 bg-success/15 font-mono text-[10px] uppercase tracking-wider text-success"
            >
              <BadgeCheck className="size-3" aria-hidden="true" />
              Pagada
            </Badge>
          ) : isCredit && plan ? (
            <Badge
              variant="outline"
              data-ocid="invoice_detail.credit_badge"
              className="gap-1 border-primary/40 bg-primary/10 font-mono text-[10px] uppercase tracking-wider text-primary"
            >
              <CalendarClock className="size-3" aria-hidden="true" />
              Crédito · {formatNumber(plan.pendingCount)} cuotas pendientes
            </Badge>
          ) : (
            <Button
              type="button"
              onClick={() => setPaidOpen(true)}
              data-ocid="invoice_detail.mark_paid_button"
              className="gap-2"
            >
              <BadgeCheck className="size-4" aria-hidden="true" />
              Marcar como pagada
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setNotifyOpen(true)}
            data-ocid="invoice_detail.notify_button"
            className="gap-2"
          >
            <Mail className="size-4" aria-hidden="true" />
            Notificar al cliente
          </Button>
          {invoice.customerId !== undefined ? (
            <WhatsAppNotifyButton
              contactKind={WhatsAppContactKind.customer}
              contactId={invoice.customerId}
              context={WhatsAppContext.invoice}
              referenceId={invoice.id}
              contactName={invoice.customerName}
              variant="outline"
              size="sm"
              ocid="invoice_detail.whatsapp_button"
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            data-ocid="invoice_detail.print_button"
            className="gap-2"
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir / PDF
          </Button>
          <Button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={isDownloading}
            data-ocid="invoice_detail.download_button"
            className="gap-2"
          >
            <Download className="size-4" aria-hidden="true" />
            {isDownloading ? "Generando…" : "Descargar PDF"}
          </Button>
        </div>
      </div>

      {downloadError ? (
        <div
          data-ocid="invoice_detail.download_error"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 print:hidden"
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
            onClick={() => void handleDownloadPdf()}
            data-ocid="invoice_detail.download_retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2 print:hidden">
        <Receipt className="size-4 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Vista previa del documento fiscal. Usa{" "}
          <span className="font-medium text-foreground">Descargar PDF</span>{" "}
          para guardar el archivo en el dispositivo o{" "}
          <span className="font-medium text-foreground">Imprimir / PDF</span>{" "}
          para abrir el diálogo del sistema.
        </p>
      </div>

      {isCredit && plan ? (
        <InstallmentPlanPanel invoice={invoice} plan={plan} />
      ) : null}

      <div className="scroll-slim overflow-x-auto">
        <InvoiceDocument
          invoice={invoice}
          business={business}
          companyLogoUrl={companyQuery.data?.logoUrl ?? undefined}
          fiscalAddress={fiscalAddress}
          showTax={isIvaResponsible}
        />
      </div>

      <MarkPaidDialog
        open={paidOpen}
        onOpenChange={setPaidOpen}
        invoice={invoice}
      />

      <NotifyCustomerDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        customerId={invoice.customerId ?? 0n}
        customerName={invoice.customerName}
        customerEmail={customer?.customer.email?.trim() || null}
        source={NotificationSource.invoice}
        referenceId={invoice.id}
        defaultSubject={`Estado de tu factura ${invoice.number}`}
        defaultMessage={`Hola ${invoice.customerName}, te compartimos el estado actual de tu factura ${invoice.number} por ${formatMoney(invoice.total)}. Si tienes alguna duda sobre el cobro o el plan de pagos, respóndenos a este correo y con gusto te atendemos.`}
      />
    </div>
  );
}
