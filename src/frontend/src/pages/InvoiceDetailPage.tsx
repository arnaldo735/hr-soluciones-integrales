import { BarcodeScanner } from "@/components/BarcodeScanner";
import { DocumentPreview } from "@/components/DocumentPreview";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { invalidateCashData } from "@/hooks/use-cash";
import { useCompanyProfile, useIvaSettings } from "@/hooks/use-company";
import { useCustomerDetail } from "@/hooks/use-customers";
import { useDailyHopeMessage } from "@/hooks/use-hope";
import { useDeleteInvoice } from "@/hooks/use-invoices";
import { useParts } from "@/hooks/use-orders";
import { useServices } from "@/hooks/use-services";
import {
  companyContactLine,
  companyFiscalLines,
  companyHeaderFromProfile,
} from "@/lib/company-header";
import { downloadFile } from "@/lib/download";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatTaxRate,
} from "@/lib/format";
import { loadPdfLibs, pdfCompanyFromProfile } from "@/lib/pdf";
import { drawHopeMessage, hopeMessageContent } from "@/lib/pdf";
import type { HopeMessageContent } from "@/lib/pdf";
import type {
  CompanyProfile,
  CustomerDetail,
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
  Id,
  InstallmentPlanView,
  InstallmentRow,
  Invoice,
  PartView,
  PaymentCondition,
  Service,
} from "@/lib/types";
import {
  NotificationSource,
  PaymentCondition as PaymentConditionEnum,
  PaymentMethod,
  PaymentStatus,
  ServiceSort,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import type { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  HandCoins,
  Info,
  Mail,
  Package,
  Receipt,
  ScanLine,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>(invoice.paymentMethod);
  const [error, setError] = useState<string | null>(null);

  // The advance already settled part of the factura, so the amount the customer
  // still owes is the saldo a cobrar, not the gross total.
  const advanceApplied = invoice.advanceApplied ?? 0n;
  const saldoACobrar = invoice.total - advanceApplied;

  const mutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.markInvoicePaid(token, invoice.id, paymentMethod);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["invoice", invoice.id.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      // Collecting the factura writes a movement into the Caja y Bancos ledger.
      invalidateCashData(queryClient);
      toast.success(`Factura ${invoice.number} marcada como pagada`);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      setError(
        error.message || "No se pudo registrar el pago. Intenta de nuevo.",
      );
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
            por {formatMoney(saldoACobrar)}.
            {advanceApplied > 0n ? (
              <span className="mt-1 block text-xs">
                Total {formatMoney(invoice.total)} · anticipo aplicado{" "}
                {formatMoney(advanceApplied)}.
              </span>
            ) : null}
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
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (installmentNumber: number) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerInstallmentPayment(
        token,
        invoice.id,
        BigInt(installmentNumber),
      );
    },
    onSuccess: (updated: Invoice, installmentNumber: number) => {
      void queryClient.invalidateQueries({
        queryKey: ["invoice", invoice.id.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      // Each installment payment writes a movement into the Caja y Bancos ledger.
      invalidateCashData(queryClient);
      setError(null);
      if (updated.paymentStatus === PaymentStatus.paid) {
        toast.success(
          `Cuota ${installmentNumber} registrada. La factura quedó pagada.`,
        );
      } else {
        toast.success(`Cuota ${installmentNumber} registrada`);
      }
    },
    onError: (error: Error) => {
      setError(
        error.message ||
          "No se pudo registrar el pago de la cuota. Intenta de nuevo.",
      );
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

      {(invoice.advanceApplied ?? 0n) > 0n ? (
        <p className="mt-2 text-xs text-muted-foreground">
          El plan de cuotas se calculó sobre el saldo a cobrar (
          {formatMoney(invoice.total - (invoice.advanceApplied ?? 0n))}), no
          sobre el total de la factura.
        </p>
      ) : null}

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

/** Parses a quantity input into a positive integer, defaulting to 0. */
function parseQuantity(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

/** Delays a fast-changing value so catalog searches hit the backend calmly. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

/** A combined search result: a catalog part or a catalog service. */
type InvoiceItemResult =
  | { kind: "part"; part: PartView }
  | { kind: "service"; service: Service };

/**
 * Item search for a factura. A factura is an immutable fiscal document, so this
 * picker never edits its lines: it lets the user search the parts and services
 * catalogs, choose the quantity before appending, and then sends them to the
 * origin document (workshop order, quote or POS) where the line is appended as
 * the first line. The chosen quantity is carried in the confirmation so the
 * user knows exactly what will be appended.
 */
function InvoiceItemSearch({
  invoice,
  onGoToOrigin,
}: {
  invoice: Invoice;
  onGoToOrigin: (result: InvoiceItemResult, quantity: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const liveTerm = search.trim();
  const term = debouncedSearch.trim();

  const partsQuery = useParts(debouncedSearch);
  const servicesQuery = useServices({
    search: debouncedSearch,
    category: null,
    activeOnly: true,
    sort: ServiceSort.name,
    page: 1,
    pageSize: 1000,
    enabled: term.length > 0,
  });

  const parts =
    liveTerm.length > 0 && term.length > 0
      ? (partsQuery.data?.items ?? [])
      : [];
  const services =
    liveTerm.length > 0 && term.length > 0
      ? (servicesQuery.data?.items ?? [])
      : [];
  const results: InvoiceItemResult[] = [
    ...parts.map((part): InvoiceItemResult => ({ kind: "part", part })),
    ...services.map(
      (service): InvoiceItemResult => ({ kind: "service", service }),
    ),
  ];

  const isLoading = partsQuery.isLoading || servicesQuery.isLoading;
  const isError = partsQuery.isError || servicesQuery.isError;

  // The quantity chosen before appending. A blank or invalid entry falls back
  // to 1 so a tap always carries a valid quantity.
  const chosenQuantity =
    parseQuantity(quantity) > 0 ? parseQuantity(quantity) : 1;

  const handleSelect = (result: InvoiceItemResult) => {
    onGoToOrigin(result, chosenQuantity);
    setSearch("");
    setQuantity("1");
    inputRef.current?.focus();
  };

  return (
    <Card
      data-ocid="invoice_detail.item_search"
      className="gap-0 rounded-lg py-0 shadow-none print:hidden"
    >
      <CardHeader className="border-b border-border px-5 py-4">
        <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
          <Search className="size-4 text-primary" aria-hidden="true" />
          Buscar ítem para anexar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-5">
        <p className="text-xs text-muted-foreground">
          Busca un repuesto o servicio, escoge la cantidad y confirma. La línea
          se anexa como primera del documento de origen; esta factura emitida no
          se modifica.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar repuesto o servicio por código o nombre…"
              aria-label="Buscar repuesto o servicio por código o nombre"
              data-ocid="invoice_detail.item_search_input"
              className="h-9 pl-8 text-sm"
            />
          </div>
          <div className="w-full space-y-1.5 sm:w-24">
            <Label
              htmlFor="invoice-item-quantity"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cantidad
            </Label>
            <Input
              id="invoice-item-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              aria-label="Cantidad a anexar"
              data-ocid="invoice_detail.item_quantity_input"
              className="data-rail h-9"
            />
          </div>
        </div>

        {liveTerm.length === 0 ? (
          <p
            data-ocid="invoice_detail.item_search.prompt_state"
            className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground"
          >
            Escribe el código o el nombre del repuesto o servicio para ver
            coincidencias.
          </p>
        ) : isLoading ? (
          <div
            data-ocid="invoice_detail.item_search.loading_state"
            className="space-y-1.5"
          >
            {Array.from(
              { length: 3 },
              (_, index) => `invoice-item-skeleton-${index}`,
            ).map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p
            data-ocid="invoice_detail.item_search.error_state"
            className="text-xs text-destructive"
          >
            No se pudo cargar el catálogo. Inténtalo de nuevo.
          </p>
        ) : results.length === 0 ? (
          <p
            data-ocid="invoice_detail.item_search.empty_state"
            className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
          >
            {`Sin repuestos ni servicios que coincidan con “${term}”.`}
          </p>
        ) : (
          <ul
            data-ocid="invoice_detail.item_search.list"
            className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-1"
          >
            {results.map((result, index) => {
              const isPart = result.kind === "part";
              const code = isPart ? result.part.sku : result.service.code;
              const name = isPart ? result.part.name : result.service.name;
              const price = isPart
                ? result.part.salePrice
                : result.service.laborRate;
              const meta = isPart
                ? `${formatNumber(result.part.totalStock)} ${result.part.unit}`
                : result.service.category;
              return (
                <li
                  key={
                    isPart
                      ? `part-${result.part.id.toString()}`
                      : `service-${result.service.id.toString()}`
                  }
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    data-ocid={`invoice_detail.item_search.item.${index + 1}`}
                    className="flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={
                            isPart
                              ? "shrink-0 rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-primary"
                              : "shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
                          }
                        >
                          {isPart ? "Repuesto" : "Servicio"}
                        </span>
                        <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                          {code}
                        </span>
                        <span className="truncate text-sm font-medium">
                          {name}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {meta}
                      </span>
                    </span>
                    <span className="data-rail shrink-0 text-xs font-medium">
                      {formatMoney(price)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {invoice.orderId !== undefined ? (
            <>
              <Package className="size-3.5" aria-hidden="true" />
              Al confirmar, se anexa en la orden de origen.
            </>
          ) : invoice.origin === "quote" ? (
            <>
              <Wrench className="size-3.5" aria-hidden="true" />
              Al confirmar, se anexa en la cotización de origen.
            </>
          ) : (
            <>
              <Package className="size-3.5" aria-hidden="true" />
              Al confirmar, se anexa en la venta POS de origen.
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Builds the invoice PDF in the selected format (A4 sheet or 80 mm tirilla)
 * with the same content the shared `DocumentPreview` shows on screen. The blob
 * is handed to the shared mobile-safe `downloadFile` helper so the file lands
 * on the device on phone and tablet, not only on desktop.
 */
async function buildInvoicePdf(
  format: DocumentFormat,
  number: string,
  company: ReturnType<typeof pdfCompanyFromProfile>,
  meta: DocumentMeta[],
  lines: DocumentLine[],
  totals: DocumentTotals[],
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
  doc.text("FACTURA", right, 14, { align: "right" });
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

  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: afterTotals + (narrow ? 6 : 10),
    narrow,
  });

  return doc;
}

export function InvoiceDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [paidOpen, setPaidOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [printFormat, setPrintFormat] = useState<DocumentFormat>("a4");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scannedPart, setScannedPart] = useState<{
    part: PartView;
    code: string;
  } | null>(null);
  const { isIvaResponsible } = useIvaSettings();
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const deleteInvoice = useDeleteInvoice();

  const invoiceId = BigInt(id);

  const invoiceQuery = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getInvoice(token, invoiceId);
    },
    enabled: !!actor && !isFetching,
  });

  const businessQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings(token);
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

  // A factura can only be deleted while it is pending and has no registered
  // payments. A credit invoice with any settled installment already has a
  // payment, so it is not deletable either.
  const hasRegisteredPayments =
    isPaid || (plan?.rows.some((row) => row.paid) ?? false);
  const canDelete = !hasRegisteredPayments;

  // Scanning is only offered while the factura can still be edited: pending and
  // without any registered payment. A paid factura is a closed document.
  const canScan = !hasRegisteredPayments;

  const documentLines: DocumentLine[] = invoice.lines.map((line) => ({
    description: line.description,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice) / 100,
    amount: Number(line.amount) / 100,
  }));

  const documentMeta: DocumentMeta[] = [
    { label: "Cliente", value: invoice.customerName },
    { label: "NIT/RUC", value: invoice.customerTaxId || "—", rail: true },
    { label: "Dirección fiscal", value: fiscalAddress },
    { label: "Emitida", value: formatDateTime(invoice.issuedAt) },
    { label: "Método", value: PAYMENT_METHOD_LABELS[invoice.paymentMethod] },
    { label: "Condición", value: CONDITION_LABELS[invoice.paymentCondition] },
    { label: "Estado", value: PAYMENT_STATUS_LABELS[invoice.paymentStatus] },
  ];

  const advanceApplied = invoice.advanceApplied ?? 0n;
  const hasAdvance = advanceApplied > 0n;
  const saldoACobrar = invoice.total - advanceApplied;

  const documentTotals: DocumentTotals[] = [
    { label: "Subtotal", value: formatMoney(invoice.subtotal) },
    ...(isIvaResponsible
      ? [
          {
            label: `Impuesto (${formatTaxRate(invoice.taxRate)})`,
            value: formatMoney(invoice.tax),
          },
        ]
      : []),
    {
      label: "Total",
      value: formatMoney(invoice.total),
      emphasis: !hasAdvance,
    },
    ...(hasAdvance
      ? [
          {
            label: "Anticipo aplicado",
            value: `− ${formatMoney(advanceApplied)}`,
          },
          {
            label: "Saldo a cobrar",
            value: formatMoney(saldoACobrar),
            emphasis: true,
          },
        ]
      : []),
  ];

  // Complete company identity for the printed factura. Unconfigured fields are
  // dropped by the shared helpers, so the header never shows an orphan label.
  const companyHeader = companyHeaderFromProfile(companyQuery.data);

  const handleDownloadPdf = async (format: DocumentFormat) => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildInvoicePdf(
        format,
        invoice.number,
        pdfCompanyFromProfile(companyQuery.data),
        documentMeta,
        documentLines,
        documentTotals,
        hopeMessage,
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

  const handlePartDetected = (part: PartView, code: string) => {
    setScannedPart({ part, code });
    toast.success(`${part.name} verificado en el catálogo`);
  };

  const clearScannedPart = () => setScannedPart(null);

  /**
   * Sends the user to the document that owns the factura's lines so the chosen
   * item can be appended there as the first line. A factura is immutable, so
   * this page never edits its own lines: the selection travels as query params
   * (`addPartId`/`addServiceId` + `addQuantity`) and the origin document appends
   * it on mount.
   */
  const handleGoToOrigin = (result: InvoiceItemResult, quantity: number) => {
    const itemName =
      result.kind === "part" ? result.part.name : result.service.name;
    const search =
      result.kind === "part"
        ? {
            addPartId: result.part.id.toString(),
            addQuantity: String(quantity),
          }
        : {
            addServiceId: result.service.id.toString(),
            addQuantity: String(quantity),
          };
    toast.success(
      `${quantity} × ${itemName} listo para anexar en el documento de origen`,
    );
    if (invoice.orderId !== undefined) {
      void navigate({
        to: "/ordenes/$id",
        params: { id: invoice.orderId.toString() },
        search,
      });
      return;
    }
    if (invoice.origin === "quote") {
      // La factura no conserva el id de la cotización de origen, así que se
      // abre el listado transportando el ítem y la cantidad elegidos; la lista
      // retoma la cotización en borrador y anexa la línea como primera.
      void navigate({ to: "/cotizaciones", search });
      return;
    }
    void navigate({ to: "/pos", search });
  };

  const confirmDelete = () => {
    setDeleteError(null);
    deleteInvoice.mutate(invoice.id, {
      onSuccess: () => {
        toast.success(`Factura ${invoice.number} eliminada`);
        setDeleteOpen(false);
        void navigate({ to: "/facturas" });
      },
      onError: (error: Error) => {
        setDeleteError(
          error.message || "No se pudo eliminar la factura. Intenta de nuevo.",
        );
      },
    });
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
          <PaymentStatusBadge status={invoice.paymentStatus} />
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
          {canScan ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setScanOpen((current) => !current)}
              aria-expanded={scanOpen}
              data-ocid="invoice_detail.scan_button"
              className="gap-2"
            >
              <ScanLine className="size-4" aria-hidden="true" />
              {scanOpen ? "Cerrar escáner" : "Escanear repuesto"}
            </Button>
          ) : null}
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
          {canDelete ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              data-ocid="invoice_detail.delete_button"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
            </Button>
          ) : null}
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
            onClick={() => void handleDownloadPdf(printFormat)}
            data-ocid="invoice_detail.download_retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      <div className="flex items-center gap-2 print:hidden">
        <Receipt className="size-4 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Vista previa del documento fiscal. Elige{" "}
          <span className="font-medium text-foreground">A4</span> o{" "}
          <span className="font-medium text-foreground">Tirilla 80 mm</span> y
          usa <span className="font-medium text-foreground">Imprimir</span> o{" "}
          <span className="font-medium text-foreground">Descargar PDF</span>{" "}
          para guardar el archivo en el dispositivo.
        </p>
      </div>

      {isCredit && plan ? (
        <InstallmentPlanPanel invoice={invoice} plan={plan} />
      ) : null}

      {hasAdvance ? (
        <section
          data-ocid="invoice_detail.advance_panel"
          aria-label="Anticipo aplicado"
          className="rounded-lg border border-border bg-card p-4 shadow-subtle print:hidden"
        >
          <div className="flex items-center gap-2">
            <HandCoins
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="font-display text-sm font-semibold">
              Anticipo aplicado
            </h2>
          </div>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Total
              </dt>
              <dd className="data-rail mt-0.5 text-sm font-medium">
                {formatMoney(invoice.total)}
              </dd>
            </div>
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Anticipo aplicado
              </dt>
              <dd
                data-ocid="invoice_detail.advance_applied"
                className="data-rail mt-0.5 text-sm font-medium text-success"
              >
                − {formatMoney(advanceApplied)}
              </dd>
            </div>
            <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                Saldo a cobrar
              </dt>
              <dd
                data-ocid="invoice_detail.saldo_a_cobrar"
                className="data-rail mt-0.5 text-sm font-semibold"
              >
                {formatMoney(saldoACobrar)}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">
            El anticipo registrado en la orden de taller se descontó del total.
            {isCredit
              ? " El plan de cuotas se calcula sobre el saldo a cobrar."
              : " El saldo a cobrar es el monto pendiente de pago."}
          </p>
        </section>
      ) : null}

      {canScan ? (
        <section
          data-ocid="invoice_detail.readonly_notice"
          aria-label="Factura de solo lectura"
          className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4 print:hidden"
        >
          <div className="flex min-w-0 items-start gap-2">
            <Info
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold">
                Factura de solo lectura
              </h2>
              <p className="text-xs text-muted-foreground">
                Una factura emitida es un documento cerrado: sus líneas no se
                editan aquí. Para buscar un ítem, escoger la cantidad y anexarlo
                como primera línea del documento, hazlo en el documento de
                origen y vuelve a generarla.
              </p>
            </div>
          </div>
          {invoice.orderId !== undefined ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="shrink-0 gap-1.5"
            >
              <Link
                to="/ordenes/$id"
                params={{ id: invoice.orderId.toString() }}
                search={{}}
                data-ocid="invoice_detail.origin_link"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Ir a la orden de origen
              </Link>
            </Button>
          ) : null}
        </section>
      ) : null}

      {canScan ? (
        <InvoiceItemSearch invoice={invoice} onGoToOrigin={handleGoToOrigin} />
      ) : null}

      {canScan && scanOpen ? (
        <section
          data-ocid="invoice_detail.scan_panel"
          className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-subtle print:hidden"
        >
          <div className="flex items-start gap-2">
            <ScanLine
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold">
                Verificar repuesto por código
              </h2>
              <p className="text-xs text-muted-foreground">
                Escanea el código de barras o el SKU para consultar el repuesto
                en el catálogo. La factura ya emitida no se modifica; para
                anexar líneas usa el documento de origen.
              </p>
            </div>
          </div>

          <BarcodeScanner
            ocid="invoice_detail.scanner"
            title="Escanear repuesto"
            hint="Apunta la cámara al código del repuesto o ingrésalo manualmente."
            onDetected={handlePartDetected}
          />

          {scannedPart ? (
            <div
              data-ocid="invoice_detail.scanned_part"
              className="flex items-start justify-between gap-3 rounded-md border border-success/40 bg-success/10 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-success">
                  Repuesto encontrado
                </p>
                <p className="truncate text-sm font-medium">
                  {scannedPart.part.name}
                </p>
                <p className="data-rail truncate text-xs text-muted-foreground">
                  {scannedPart.part.sku} ·{" "}
                  {formatMoney(scannedPart.part.salePrice)} · código{" "}
                  {scannedPart.code}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearScannedPart}
                data-ocid="invoice_detail.clear_scanned_part_button"
                className="shrink-0 text-muted-foreground"
              >
                Limpiar
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <DocumentPreview
        title="Factura"
        number={invoice.number}
        companyName={
          companyHeader?.legalName ??
          business?.name ??
          "HR SOLUCIONES INTEGRALES"
        }
        companyLogoUrl={companyHeader?.logoUrl ?? undefined}
        companyContact={companyContactLine(companyHeader)}
        companyFiscal={companyFiscalLines(companyHeader)}
        meta={documentMeta}
        lines={documentLines}
        totals={documentTotals}
        hopeMessage={hopeMessage}
        format={printFormat}
        ocid="invoice_detail.document"
        onFormatChange={setPrintFormat}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={isDownloading}
      />

      <MarkPaidDialog
        open={paidOpen}
        onOpenChange={setPaidOpen}
        invoice={invoice}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent data-ocid="invoice_detail.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              ¿Eliminar la factura {invoice.number}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Solo se pueden eliminar facturas pendientes de pago y sin abonos
              registrados. Al eliminarla, la orden o venta de origen queda
              disponible para facturarse de nuevo. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError ? (
            <p
              data-ocid="invoice_detail.delete_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {deleteError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="invoice_detail.delete_cancel_button"
              disabled={deleteInvoice.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="invoice_detail.delete_confirm_button"
              disabled={deleteInvoice.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInvoice.isPending ? "Eliminando…" : "Eliminar factura"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
