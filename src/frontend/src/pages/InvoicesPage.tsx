import { BarcodeScanner } from "@/components/BarcodeScanner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useIvaSettings } from "@/hooks/use-company";
import { useDeleteInvoice } from "@/hooks/use-invoices";
import { useReceivables } from "@/hooks/use-receivables";
import { companyHeaderFromProfile } from "@/lib/company-header";
import {
  colombiaEndOfDay,
  colombiaStartOfDay,
  formatDate,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import type {
  CreditPlanInput,
  Id,
  Invoice,
  OrderView,
  PartView,
  PaymentCondition,
} from "@/lib/types";
import {
  NotificationSource,
  OrderStatus,
  PaymentCondition as PaymentConditionEnum,
  PaymentMethod,
  PaymentStatus,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  Mail,
  RotateCcw,
  ScanLine,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

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
  [PaymentStatus.pending]: "Pendiente",
  [PaymentStatus.paid]: "Pagada",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.pending]: "border-warning/50 bg-warning/15 text-warning",
  [PaymentStatus.paid]: "border-success/50 bg-success/15 text-success",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.received]: "Recibida",
  [OrderStatus.inRepair]: "En reparación",
  [OrderStatus.ready]: "Lista",
  [OrderStatus.delivered]: "Entregada",
  [OrderStatus.cancelled]: "Cancelada",
};

/**
 * Only orders in the `delivered` state can be invoiced. Orders that are merely
 * `ready` must not appear as invoiceable.
 */
const INVOICEABLE_STATUSES: OrderStatus[] = [OrderStatus.delivered];

const CONDITION_LABELS: Record<PaymentCondition, string> = {
  [PaymentConditionEnum.cash]: "Contado",
  [PaymentConditionEnum.credit]: "Crédito",
};

const CONDITION_STYLES: Record<PaymentCondition, string> = {
  [PaymentConditionEnum.cash]: "border-border bg-muted text-muted-foreground",
  [PaymentConditionEnum.credit]: "border-primary/40 bg-primary/10 text-primary",
};

const MAX_INSTALLMENTS = 36;

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        PAYMENT_STATUS_STYLES[status],
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

function ConditionBadge({ condition }: { condition: PaymentCondition }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        CONDITION_STYLES[condition],
      )}
    >
      {CONDITION_LABELS[condition]}
    </Badge>
  );
}

/**
 * Resolves the registered email of each customer referenced by a page of
 * invoices. `listInvoices` returns only ids, so the notification action needs a
 * lookup pass to know whether the recipient has an email on file.
 */
function useInvoiceCustomerEmails(customerIds: Id[]) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const key = customerIds
    .map((id) => id.toString())
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["invoice-customer-emails", key],
    queryFn: async (): Promise<Map<string, string | null>> => {
      const emails = new Map<string, string | null>();
      if (!actor) return emails;
      const unique = Array.from(
        new Set(customerIds.map((id) => id.toString())),
      );
      const results = await Promise.all(
        unique.map(async (id) => {
          const customer = await actor.getCustomer(token, BigInt(id));
          return { id, email: customer?.email?.trim() ?? "" };
        }),
      );
      for (const entry of results) {
        emails.set(entry.id, entry.email === "" ? null : entry.email);
      }
      return emails;
    },
    enabled: !!actor && !isFetching,
    // Customer emails change rarely; the per-page lookup is reused while the
    // page stays in the cache instead of re-fanning out on every visit.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/** Outstanding balance for a credit invoice: total minus settled installments. */
function outstandingBalance(invoice: Invoice): bigint {
  const plan = invoice.installments;
  if (!plan)
    return invoice.paymentStatus === PaymentStatus.paid ? 0n : invoice.total;
  return plan.installments.reduce(
    (sum, installment) => (installment.paid ? sum : sum + installment.amount),
    0n,
  );
}

/** Adds whole months to a `YYYY-MM-DD` date, clamping the day to month length. */
function addMonths(isoDate: string, months: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const clamped = Math.min(day, lastDay);
  const mm = `${target.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${clamped}`.padStart(2, "0");
  return `${target.getUTCFullYear()}-${mm}-${dd}`;
}

/** Formats a `YYYY-MM-DD` string as a short Spanish date without timezone drift. */
function formatIsoDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "—";
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

interface InvoiceSearch {
  q?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
}

/** Normalizes the raw URL search params into a fully-resolved filter state. */
function resolveSearch(raw: Record<string, unknown>): Required<InvoiceSearch> {
  const pagina = Number(raw.pagina);
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    desde: typeof raw.desde === "string" ? raw.desde : "",
    hasta: typeof raw.hasta === "string" ? raw.hasta : "",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1,
  };
}

function GenerateInvoiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.cash);
  const [condition, setCondition] = useState<PaymentCondition>(
    PaymentConditionEnum.cash,
  );
  const [installmentCount, setInstallmentCount] = useState("3");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["orders", "invoiceable"],
    queryFn: async (): Promise<OrderView[]> => {
      if (!actor) throw new Error("Backend no disponible");
      const pages = await Promise.all(
        INVOICEABLE_STATUSES.map((status) =>
          actor.listOrders(token, { status }, 0n, 100n),
        ),
      );
      return pages.flatMap((page) => page.items);
    },
    enabled: open && !!actor && !isFetching,
    // The invoiceable-order list is stable while the dialog is closed, so it is
    // reused across openings instead of refetching every time.
    staleTime: Number.POSITIVE_INFINITY,
  });

  // The backend rejects a second invoice for the same order
  // (`hasInvoiceForOrder`). Mirror that guard here so an already-invoiced OT is
  // never offered as selectable. The page's own invoice list is paginated and
  // filtered, so the dialog reads the full invoice list to build the set.
  const invoicedOrdersQuery = useQuery({
    queryKey: ["invoices", "invoiced-order-ids"],
    queryFn: async (): Promise<Set<string>> => {
      if (!actor) throw new Error("Backend no disponible");
      const page = await actor.listInvoices(token, {}, 0n, 1000n);
      const ids = new Set<string>();
      for (const invoice of page.items) {
        if (invoice.orderId !== undefined) {
          ids.add(invoice.orderId.toString());
        }
      }
      return ids;
    },
    enabled: open && !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const orders = useMemo(() => {
    const items = ordersQuery.data ?? [];
    const invoiced = invoicedOrdersQuery.data;
    const available = invoiced
      ? items.filter((view) => !invoiced.has(view.order.id.toString()))
      : items;
    return [...available].sort((a, b) =>
      Number(b.order.createdAt - a.order.createdAt),
    );
  }, [ordersQuery.data, invoicedOrdersQuery.data]);

  const selectedOrder = useMemo(
    () => orders.find((view) => view.order.id.toString() === orderId) ?? null,
    [orders, orderId],
  );

  // Scanned part resolved against the catalog. The scan is a verification
  // lookup: `createInvoiceFromOrder` only takes the order id, so the factura
  // lines come from the selected OT and the scan never mutates them.
  const [scannedPart, setScannedPart] = useState<{
    part: PartView;
    code: string;
  } | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setOrderId("");
      setMethod(PaymentMethod.cash);
      setCondition(PaymentConditionEnum.cash);
      setInstallmentCount("3");
      setFirstDueDate("");
      setError(null);
      setScannedPart(null);
      setScanOpen(false);
    }
  }, [open]);

  const handlePartDetected = (part: PartView, code: string) => {
    setScannedPart({ part, code });
    toast.success(`${part.name} verificado en el catálogo`);
  };

  const clearScannedPart = () => setScannedPart(null);

  const isCredit = condition === PaymentConditionEnum.credit;
  const parsedCount = Number.parseInt(installmentCount, 10);
  const validCount =
    Number.isFinite(parsedCount) &&
    parsedCount >= 1 &&
    parsedCount <= MAX_INSTALLMENTS;
  const creditReady = validCount && firstDueDate !== "";

  const previewTotal = selectedOrder?.totals.total ?? 0n;
  const previewRows = useMemo(() => {
    if (!isCredit || !creditReady) return [];
    const base = previewTotal / BigInt(parsedCount);
    const remainder = previewTotal - base * BigInt(parsedCount);
    return Array.from({ length: parsedCount }, (_, index) => ({
      number: index + 1,
      amount: index === parsedCount - 1 ? base + remainder : base,
      dueDate: addMonths(firstDueDate, index),
    }));
  }, [isCredit, creditReady, previewTotal, parsedCount, firstDueDate]);

  const mutation = useMutation({
    mutationFn: async (input: {
      orderId: bigint;
      method: PaymentMethod;
      condition: PaymentCondition;
      creditPlan: CreditPlanInput | null;
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createInvoiceFromOrder(
        token,
        input.orderId,
        input.method,
        input.condition,
        input.creditPlan,
      );
    },
    onSuccess: (invoice: Invoice) => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(`Factura ${invoice.number} generada`);
      onOpenChange(false);
      void navigate({
        to: "/facturas/$id",
        params: { id: invoice.id.toString() },
      });
    },
    onError: () => {
      setError(
        "No se pudo generar la factura. Solo las órdenes entregadas pueden facturarse.",
      );
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderId) {
      setError("Selecciona una orden entregada para facturar.");
      return;
    }
    if (isCredit && !creditReady) {
      setError(
        "Para el pago a crédito define el número de cuotas y la fecha de la primera cuota.",
      );
      return;
    }
    setError(null);
    mutation.mutate({
      orderId: BigInt(orderId),
      method,
      condition,
      creditPlan: isCredit
        ? {
            installmentCount: BigInt(parsedCount),
            firstDueDate:
              BigInt(new Date(`${firstDueDate}T00:00:00Z`).getTime()) *
              1_000_000n,
          }
        : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="invoices.generate_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Generar factura</DialogTitle>
          <DialogDescription>
            Solo las órdenes de taller entregadas pueden facturarse. El número
            de factura se asigna de forma consecutiva y los datos fiscales se
            toman de la configuración del negocio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-order">Orden de taller entregada</Label>
            {ordersQuery.isLoading || invoicedOrdersQuery.isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : ordersQuery.isError || invoicedOrdersQuery.isError ? (
              <p
                data-ocid="invoices.generate_orders_error"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                No se pudieron cargar las órdenes facturables.
              </p>
            ) : orders.length === 0 ? (
              <p
                data-ocid="invoices.generate_orders_empty"
                className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
              >
                No hay órdenes entregadas pendientes de facturar. Marca la orden
                como entregada antes de generar su factura.
              </p>
            ) : (
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger
                  id="invoice-order"
                  aria-label="Orden de taller entregada"
                  data-ocid="invoices.order_select"
                >
                  <SelectValue placeholder="Selecciona una orden entregada" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((view) => (
                    <SelectItem
                      key={view.order.id.toString()}
                      value={view.order.id.toString()}
                    >
                      {view.order.orderNumber} ·{" "}
                      {ORDER_STATUS_LABELS[view.order.status]} ·{" "}
                      {formatMoney(view.totals.total)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Verificar repuesto</p>
                <p className="text-xs text-muted-foreground">
                  Escanea el código de barras o el SKU para consultar el
                  repuesto en el catálogo. Las líneas de la factura provienen de
                  la orden seleccionada.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScanOpen((current) => !current)}
                aria-expanded={scanOpen}
                data-ocid="invoices.scan_button"
                className="gap-1.5"
              >
                <ScanLine className="size-4" aria-hidden="true" />
                {scanOpen ? "Cerrar escáner" : "Escanear código"}
              </Button>
            </div>

            {scanOpen ? (
              <BarcodeScanner
                ocid="invoices.scanner"
                title="Escanear repuesto"
                hint="Apunta la cámara al código del repuesto o ingrésalo manualmente."
                onDetected={handlePartDetected}
              />
            ) : null}

            {scannedPart ? (
              <div
                data-ocid="invoices.scanned_part"
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
                  data-ocid="invoices.clear_scanned_part_button"
                  className="shrink-0 text-muted-foreground"
                >
                  Limpiar
                </Button>
              </div>
            ) : (
              <p
                data-ocid="invoices.scanned_part_empty"
                className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
              >
                Aún no has escaneado repuestos. El escaneo consulta el repuesto
                en el catálogo para verificarlo.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoice-method">Método de pago</Label>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            >
              <SelectTrigger
                id="invoice-method"
                aria-label="Método de pago"
                data-ocid="invoices.method_select"
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

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Condición de pago</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={!isCredit}
                onClick={() => setCondition(PaymentConditionEnum.cash)}
                data-ocid="invoices.condition_cash_button"
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                  !isCredit
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:bg-muted/60",
                )}
              >
                <span className="block font-medium">Contado</span>
                <span className="block text-xs text-muted-foreground">
                  Pago único al emitir
                </span>
              </button>
              <button
                type="button"
                aria-pressed={isCredit}
                onClick={() => setCondition(PaymentConditionEnum.credit)}
                data-ocid="invoices.condition_credit_button"
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                  isCredit
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:bg-muted/60",
                )}
              >
                <span className="block font-medium">Crédito</span>
                <span className="block text-xs text-muted-foreground">
                  Cuotas con vencimiento
                </span>
              </button>
            </div>
          </fieldset>

          {isCredit ? (
            <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-installments">Número de cuotas</Label>
                  <Input
                    id="invoice-installments"
                    type="number"
                    min={1}
                    max={MAX_INSTALLMENTS}
                    value={installmentCount}
                    onChange={(event) =>
                      setInstallmentCount(event.target.value)
                    }
                    aria-label="Número de cuotas"
                    data-ocid="invoices.installment_count_input"
                    className="data-rail"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-first-due">Primera cuota</Label>
                  <Input
                    id="invoice-first-due"
                    type="date"
                    value={firstDueDate}
                    onChange={(event) => setFirstDueDate(event.target.value)}
                    aria-label="Fecha de la primera cuota"
                    data-ocid="invoices.first_due_date_input"
                    className="data-rail"
                  />
                </div>
              </div>

              {!validCount ? (
                <p
                  data-ocid="invoices.installment_count_error"
                  className="text-xs text-destructive"
                >
                  Define entre 1 y {MAX_INSTALLMENTS} cuotas.
                </p>
              ) : null}

              {creditReady ? (
                <div data-ocid="invoices.installment_preview">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Vista previa del plan de cuotas
                  </p>
                  <table className="installment-table">
                    <thead>
                      <tr>
                        <th scope="col">Cuota</th>
                        <th scope="col">Vencimiento</th>
                        <th scope="col" className="text-right">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => (
                        <tr key={row.number}>
                          <td className="installment-number">
                            {row.number} / {parsedCount}
                          </td>
                          <td className="installment-due">
                            {formatIsoDate(row.dueDate)}
                          </td>
                          <td className="installment-amount">
                            {formatMoney(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="installment-summary">
                    <span>
                      Total financiado{" "}
                      <strong>{formatMoney(previewTotal)}</strong>
                    </span>
                    <span>
                      Cuotas <strong>{formatNumber(parsedCount)}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <p
                  data-ocid="invoices.installment_preview_empty"
                  className="text-xs text-muted-foreground"
                >
                  Completa el número de cuotas y la fecha de la primera cuota
                  para ver el valor y el vencimiento de cada una.
                </p>
              )}
            </div>
          ) : null}

          {error ? (
            <p
              data-ocid="invoices.generate_error"
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
              data-ocid="invoices.generate_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || orders.length === 0}
              data-ocid="invoices.generate_submit_button"
            >
              {mutation.isPending ? "Generando…" : "Generar factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InvoicesPage() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { isIvaResponsible } = useIvaSettings();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const search = useMemo(() => resolveSearch(rawSearch), [rawSearch]);

  const [term, setTerm] = useState(search.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteInvoice = useDeleteInvoice();
  const [notifyTarget, setNotifyTarget] = useState<{
    customerId: Id;
    customerName: string;
    customerEmail: string | null;
    invoiceId: Id;
    invoiceNumber: string;
  } | null>(null);

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(search.q);
  }, [search.q]);

  const applySearch = useCallback(
    (patch: Partial<InvoiceSearch>) => {
      void navigate({
        to: "/facturas",
        search: (prev: Record<string, unknown>) => {
          const next: Record<string, unknown> = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === undefined || value === false) {
              delete next[key];
            }
          }
          return next;
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (term === search.q) return;
    const handle = window.setTimeout(() => {
      applySearch({ q: term, pagina: 1 });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [term, search.q, applySearch]);

  const offset = (search.pagina - 1) * PAGE_SIZE;

  const invoicesQuery = useQuery({
    queryKey: ["invoices", search.q, search.desde, search.hasta, search.pagina],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listInvoices(
        token,
        {
          search: search.q || undefined,
          from: colombiaStartOfDay(search.desde) ?? undefined,
          to: colombiaEndOfDay(search.hasta) ?? undefined,
        },
        BigInt(offset),
        BigInt(PAGE_SIZE),
      );
    },
    enabled: !!actor && !isFetching,
  });

  const items = invoicesQuery.data?.items ?? [];
  const total = Number(invoicesQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters =
    search.q !== "" || search.desde !== "" || search.hasta !== "";

  const customerIds = useMemo(
    () =>
      items
        .map((invoice) => invoice.customerId)
        .filter((id): id is Id => id !== undefined),
    [items],
  );
  const emailsQuery = useInvoiceCustomerEmails(customerIds);
  const customerEmails = emailsQuery.data;

  // The backend's deleteInvoice guard also rejects a factura with any abono
  // (receivable payment) registered, even when it is still pending. The
  // receivables list exposes `paidAmount` as the sum of those abonos, so an
  // invoice with `paidAmount > 0` must not offer the delete action.
  const receivablesQuery = useReceivables({ status: null, search: "" });
  const invoicesWithAbonos = useMemo(() => {
    const ids = new Set<string>();
    for (const receivable of receivablesQuery.data ?? []) {
      if (receivable.paidAmount > 0n) {
        ids.add(receivable.invoiceId.toString());
      }
    }
    return ids;
  }, [receivablesQuery.data]);

  const openNotify = (invoice: Invoice) => {
    if (invoice.customerId === undefined) return;
    setNotifyTarget({
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      customerEmail: customerEmails?.get(invoice.customerId.toString()) ?? null,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
    });
  };

  /**
   * A factura can only be deleted while it is pending and has no registered
   * payments. The backend is the authority: when it rejects the deletion the
   * Spanish message is surfaced and the row stays in the list.
   */
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteError(null);
    deleteInvoice.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Factura ${target.number} eliminada`);
        setDeleteTarget(null);
      },
      onError: (error: Error) => {
        setDeleteError(
          error.message || "No se pudo eliminar la factura. Intenta de nuevo.",
        );
      },
    });
  };

  const clearFilters = () => {
    setTerm("");
    void navigate({ to: "/facturas", search: {}, replace: true });
  };

  return (
    <div
      data-ocid="invoices.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Administración
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Facturación
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Facturas de contado y crédito con su plan de cuotas, impuestos y
            estado de cobro.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          data-ocid="invoices.generate_button"
          className="gap-2"
        >
          <FilePlus2 className="size-4" aria-hidden="true" />
          Generar factura
        </Button>
      </header>

      <section
        data-ocid="invoices.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar por número o cliente…"
              aria-label="Buscar facturas"
              className="pl-9"
              data-ocid="invoices.search_input"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="invoices-from"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Desde
            </Label>
            <Input
              id="invoices-from"
              type="date"
              value={search.desde}
              onChange={(event) =>
                applySearch({ desde: event.target.value, pagina: 1 })
              }
              className="data-rail w-[160px]"
              data-ocid="invoices.date_from_input"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="invoices-to"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Hasta
            </Label>
            <Input
              id="invoices-to"
              type="date"
              value={search.hasta}
              onChange={(event) =>
                applySearch({ hasta: event.target.value, pagina: 1 })
              }
              className="data-rail w-[160px]"
              data-ocid="invoices.date_to_input"
            />
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="invoices.clear_filters_button"
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {invoicesQuery.isLoading
              ? "Cargando…"
              : `${formatNumber(total)} factura${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {invoicesQuery.isError ? (
          <div
            data-ocid="invoices.error_state"
            className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar las facturas.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void invoicesQuery.refetch({ cancelRefetch: true })
              }
              data-ocid="invoices.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : invoicesQuery.isLoading ? (
          <div data-ocid="invoices.loading_state" className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, index) => `row-${index}`).map(
              (id) => (
                <Skeleton key={id} className="h-9 w-full" />
              ),
            )}
          </div>
        ) : items.length === 0 ? (
          <div
            data-ocid="invoices.empty_state"
            className="flex flex-col items-center gap-3 px-6 py-16 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <FileText
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {hasFilters ? "Sin resultados" : "Aún no hay facturas emitidas"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {hasFilters
                  ? "Ajusta la búsqueda o el rango de fechas para encontrar facturas."
                  : "Genera la primera factura a partir de una orden de taller entregada."}
              </p>
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                data-ocid="invoices.empty_clear_button"
              >
                Limpiar filtros
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                data-ocid="invoices.empty_generate_button"
                className="gap-2"
              >
                <FilePlus2 className="size-4" aria-hidden="true" />
                Generar factura
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Número
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Cliente
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Fecha
                </TableHead>
                <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Subtotal
                </TableHead>
                {isIvaResponsible ? (
                  <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Impuesto
                  </TableHead>
                ) : null}
                <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Total
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Condición
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Método
                </TableHead>
                <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Saldo
                </TableHead>
                <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((invoice, index) => {
                const balance = outstandingBalance(invoice);
                // A factura can only be deleted while it is pending and has no
                // registered payments. This mirrors the backend deleteInvoice
                // guard exactly: it is rejected when the invoice is paid, when
                // any installment is settled, or when a receivable abono exists
                // for it (even if the invoice is still pending).
                const hasRegisteredPayments =
                  invoice.paymentStatus === PaymentStatus.paid ||
                  (invoice.installments?.installments.some(
                    (installment) => installment.paid,
                  ) ??
                    false) ||
                  invoicesWithAbonos.has(invoice.id.toString());
                const canDelete = !hasRegisteredPayments;
                return (
                  <TableRow
                    key={invoice.id.toString()}
                    data-ocid={`invoices.row.${index + 1}`}
                  >
                    <TableCell>
                      <Link
                        to="/facturas/$id"
                        params={{ id: invoice.id.toString() }}
                        data-ocid={`invoices.link.${index + 1}`}
                        className="data-rail text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {invoice.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <span className="block truncate font-medium">
                        {invoice.customerName}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.issuedAt)}
                    </TableCell>
                    <TableCell className="data-rail text-right text-muted-foreground">
                      {formatMoney(invoice.subtotal)}
                    </TableCell>
                    {isIvaResponsible ? (
                      <TableCell className="data-rail text-right text-muted-foreground">
                        {formatMoney(invoice.tax)}
                      </TableCell>
                    ) : null}
                    <TableCell className="data-rail text-right font-semibold">
                      {formatMoney(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <ConditionBadge condition={invoice.paymentCondition} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {PAYMENT_METHOD_LABELS[invoice.paymentMethod]}
                    </TableCell>
                    <TableCell
                      data-ocid={`invoices.balance.${index + 1}`}
                      className={cn(
                        "data-rail text-right",
                        balance > 0n
                          ? "font-medium text-warning"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatMoney(balance)}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={invoice.paymentStatus} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openNotify(invoice)}
                          aria-label={`Notificar al cliente de la factura ${invoice.number}`}
                          data-ocid={`invoices.notify_button.${index + 1}`}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Mail className="size-4" aria-hidden="true" />
                        </Button>
                        {invoice.customerId !== undefined ? (
                          <WhatsAppNotifyButton
                            contactKind={WhatsAppContactKind.customer}
                            contactId={invoice.customerId}
                            context={WhatsAppContext.invoice}
                            referenceId={invoice.id}
                            contactName={invoice.customerName}
                            ocid={`invoices.whatsapp_button.${index + 1}`}
                          />
                        ) : null}
                        {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(invoice);
                            }}
                            aria-label={`Eliminar la factura ${invoice.number}`}
                            data-ocid={`invoices.delete_button.${index + 1}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!invoicesQuery.isLoading && !invoicesQuery.isError && total > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Página {search.pagina} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={search.pagina <= 1}
                onClick={() => applySearch({ pagina: search.pagina - 1 })}
                data-ocid="invoices.pagination_prev"
                className="gap-1"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={search.pagina >= totalPages}
                onClick={() => applySearch({ pagina: search.pagina + 1 })}
                data-ocid="invoices.pagination_next"
                className="gap-1"
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <GenerateInvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent data-ocid="invoices.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              ¿Eliminar la factura {deleteTarget?.number}?
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
              data-ocid="invoices.delete_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {deleteError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="invoices.delete_cancel_button"
              disabled={deleteInvoice.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="invoices.delete_confirm_button"
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

      {notifyTarget ? (
        <NotifyCustomerDialog
          open
          onOpenChange={(next) => {
            if (!next) setNotifyTarget(null);
          }}
          customerId={notifyTarget.customerId}
          customerName={notifyTarget.customerName}
          customerEmail={notifyTarget.customerEmail}
          source={NotificationSource.invoice}
          referenceId={notifyTarget.invoiceId}
          defaultSubject={`Estado de tu factura ${notifyTarget.invoiceNumber}`}
          defaultMessage={`Hola ${notifyTarget.customerName}, te compartimos el estado actual de tu factura ${notifyTarget.invoiceNumber}. Si tienes alguna duda sobre el cobro o el plan de pagos, respóndenos a este correo y con gusto te atendemos.`}
        />
      ) : null}
    </div>
  );
}
