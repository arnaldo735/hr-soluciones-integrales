import { CustomerFormDialog } from "@/components/CustomerFormDialog";
import { DocumentPreview } from "@/components/DocumentPreview";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { PageHeader } from "@/components/PageHeader";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { Button } from "@/components/ui/button";
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
import { useBackend } from "@/hooks/use-backend";
import {
  useBusinessSettings,
  useCompanyProfile,
  useIvaSettings,
} from "@/hooks/use-company";
import { useCustomers } from "@/hooks/use-customers";
import { findPartBySku, useParts } from "@/hooks/use-orders";
import { useCreatePosSale } from "@/hooks/use-pos";
import { downloadFile } from "@/lib/download";
import { formatMoney, formatNumber, formatTaxRate } from "@/lib/format";
import { loadPdfLibs, pdfCompanyFromProfile } from "@/lib/pdf";
import type {
  CreditPlanInput,
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
  PartView,
  PaymentCondition,
  PosSale,
  PosSaleLineInput,
} from "@/lib/types";
import {
  NotificationSource,
  PaymentCondition as PaymentConditionEnum,
  PaymentMethod,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import type { jsPDF } from "jspdf";
import {
  AlertTriangle,
  Barcode,
  CalendarClock,
  CheckCircle2,
  Mail,
  Minus,
  Plus,
  Receipt,
  ScanLine,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
];

const CONDITION_LABELS: Record<PaymentCondition, string> = {
  [PaymentConditionEnum.cash]: "Contado",
  [PaymentConditionEnum.credit]: "Crédito",
};

const MAX_INSTALLMENTS = 36;

interface CartLine {
  partId: bigint;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Per-line discount in cents. */
  discount: number;
  stock: number;
}

/** Parses a user-entered decimal amount into integer cents. */
function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/** Parses a user-entered quantity into a positive integer. */
function parseQuantity(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
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

/** Delays a fast-changing value so the customer search hits the backend calmly. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

function CartRow({
  line,
  index,
  onQuantity,
  onDiscount,
  onRemove,
}: {
  line: CartLine;
  index: number;
  onQuantity: (partId: bigint, quantity: number) => void;
  onDiscount: (partId: bigint, discount: number) => void;
  onRemove: (partId: bigint) => void;
}) {
  const lineAmount = line.unitPrice * line.quantity - line.discount;
  const overStock = line.quantity > line.stock;

  return (
    <li
      data-ocid={`pos.cart_item.${index + 1}`}
      className={cn(
        "space-y-2 border-b border-border px-3 py-3 last:border-b-0",
        overStock && "bg-destructive/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{line.name}</p>
          <p className="data-rail text-[11px] text-muted-foreground">
            {line.sku}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Quitar ${line.name} del carrito`}
          data-ocid={`pos.remove_button.${index + 1}`}
          onClick={() => onRemove(line.partId)}
          className="row-action shrink-0"
          data-variant="destructive"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-sm border border-input">
          <button
            type="button"
            aria-label={`Disminuir cantidad de ${line.name}`}
            data-ocid={`pos.quantity_decrease.${index + 1}`}
            onClick={() => onQuantity(line.partId, line.quantity - 1)}
            className="flex size-7 items-center justify-center text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
          >
            <Minus className="size-3.5" aria-hidden="true" />
          </button>
          <input
            type="number"
            min={1}
            value={line.quantity}
            aria-label={`Cantidad de ${line.name}`}
            data-ocid={`pos.quantity_input.${index + 1}`}
            onChange={(event) =>
              onQuantity(line.partId, parseQuantity(event.target.value))
            }
            className="data-rail h-7 w-12 border-x border-input bg-transparent text-center text-sm outline-none"
          />
          <button
            type="button"
            aria-label={`Aumentar cantidad de ${line.name}`}
            data-ocid={`pos.quantity_increase.${index + 1}`}
            onClick={() => onQuantity(line.partId, line.quantity + 1)}
            className="flex size-7 items-center justify-center text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Label
            htmlFor={`pos-discount-${index}`}
            className="text-[11px] text-muted-foreground"
          >
            Desc.
          </Label>
          <Input
            id={`pos-discount-${index}`}
            type="number"
            min={0}
            step="0.01"
            value={(line.discount / 100).toFixed(2)}
            aria-label={`Descuento de ${line.name}`}
            data-ocid={`pos.discount_input.${index + 1}`}
            onChange={(event) =>
              onDiscount(line.partId, parseAmount(event.target.value))
            }
            className="data-rail h-7 w-20 text-right text-sm"
          />
        </div>

        <span className="data-rail ml-auto text-sm font-semibold">
          {formatMoney(BigInt(lineAmount))}
        </span>
      </div>

      {overStock ? (
        <p
          data-ocid={`pos.line_stock_warning.${index + 1}`}
          className="flex items-center gap-1 text-[11px] text-destructive"
        >
          <AlertTriangle className="size-3" aria-hidden="true" />
          Solo hay {formatNumber(line.stock)} en existencia.
        </p>
      ) : null}
    </li>
  );
}

/**
 * Builds the POS sale receipt PDF in the selected format (A4 sheet or 80 mm
 * tirilla) with the same content the on-screen preview shows. The blob is
 * handed to the shared mobile-safe `downloadFile` helper so the receipt is
 * saved on the device on phone and tablet, not only on desktop.
 */
async function buildReceiptPdf(
  format: DocumentFormat,
  number: string,
  company: ReturnType<typeof pdfCompanyFromProfile>,
  meta: DocumentMeta[],
  lines: DocumentLine[],
  totals: DocumentTotals[],
  footer: string,
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
  doc.text("COMPROBANTE", right, 14, { align: "right" });
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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    doc.splitTextToSize(footer, right - margin),
    margin,
    afterTotals + (narrow ? 6 : 10),
  );

  return doc;
}

export function PosPage() {
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("none");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.cash,
  );
  const [condition, setCondition] = useState<PaymentCondition>(
    PaymentConditionEnum.cash,
  );
  const [installmentCount, setInstallmentCount] = useState("3");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [completedSale, setCompletedSale] = useState<PosSale | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [scanPending, setScanPending] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const { actor } = useBackend();

  const debouncedPartSearch = useDebouncedValue(search, 250);
  const partsQuery = useParts(debouncedPartSearch);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);
  const customersQuery = useCustomers(debouncedCustomerSearch);
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const { isIvaResponsible, taxRate: effectiveTaxRate } = useIvaSettings();
  const createSale = useCreatePosSale();

  const parts = partsQuery.data?.items ?? [];
  const customers = customersQuery.data ?? [];
  const business = businessQuery.data ?? null;
  const companyLogoUrl = companyQuery.data?.logoUrl ?? undefined;

  // Cliente seleccionado para la venta; "none" es la venta de mostrador.
  const selectedCustomer =
    customerId === "none"
      ? null
      : (customers.find((customer) => customer.id.toString() === customerId) ??
        null);
  const selectedCustomerEmail = selectedCustomer?.email?.trim()
    ? selectedCustomer.email
    : null;

  // Snapshot of the customer ids known when the create dialog opened, so the
  // newly registered customer can be selected once the list refreshes.
  const knownCustomerIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (customerDialogOpen) {
      knownCustomerIdsRef.current = new Set(
        customers.map((customer) => customer.id.toString()),
      );
      return;
    }
    const known = knownCustomerIdsRef.current;
    if (known === null) return;
    const created = customers.find(
      (customer) => !known.has(customer.id.toString()),
    );
    knownCustomerIdsRef.current = null;
    if (created) {
      setCustomerId(created.id.toString());
      setCustomerSearch("");
    }
  }, [customerDialogOpen, customers]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );
    const discount = cart.reduce((sum, line) => sum + line.discount, 0);
    const taxable = Math.max(subtotal - discount, 0);
    const taxRate = Number(effectiveTaxRate);
    const tax = Math.round((taxable * taxRate) / 100);
    return { subtotal, discount, tax, total: taxable + tax };
  }, [cart, effectiveTaxRate]);

  const receivedCents = parseAmount(amountReceived);
  const change = receivedCents - totals.total;
  const isCredit = condition === PaymentConditionEnum.credit;
  const isCash = paymentMethod === PaymentMethod.cash && !isCredit;
  const insufficientCash = isCash && receivedCents < totals.total;

  const parsedCount = Number.parseInt(installmentCount, 10);
  const validCount =
    Number.isFinite(parsedCount) &&
    parsedCount >= 1 &&
    parsedCount <= MAX_INSTALLMENTS;
  const creditReady = validCount && firstDueDate !== "";
  const creditCustomerMissing = isCredit && customerId === "none";

  const previewRows = useMemo(() => {
    if (!isCredit || !creditReady) return [];
    const total = BigInt(totals.total);
    const base = total / BigInt(parsedCount);
    const remainder = total - base * BigInt(parsedCount);
    return Array.from({ length: parsedCount }, (_, index) => ({
      number: index + 1,
      amount: index === parsedCount - 1 ? base + remainder : base,
      dueDate: addMonths(firstDueDate, index),
    }));
  }, [isCredit, creditReady, totals.total, parsedCount, firstDueDate]);

  const stockIssues = cart.filter((line) => line.quantity > line.stock);
  const hasStockIssue = stockIssues.length > 0;
  const canCharge =
    cart.length > 0 &&
    !hasStockIssue &&
    !insufficientCash &&
    !creditCustomerMissing &&
    (!isCredit || creditReady) &&
    !createSale.isPending;

  const addPart = (part: PartView) => {
    setCart((current) => {
      const existing = current.find((line) => line.partId === part.id);
      if (existing) {
        return current.map((line) =>
          line.partId === part.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...current,
        {
          partId: part.id,
          sku: part.sku,
          name: part.name,
          unitPrice: Number(part.salePrice),
          quantity: 1,
          discount: 0,
          stock: Number(part.totalStock),
        },
      ];
    });
  };

  const handleBarcode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = barcode.trim();
    if (code === "" || scanPending) return;
    if (!actor) {
      toast.error("Backend no disponible. Intenta de nuevo.");
      return;
    }
    setScanPending(true);
    try {
      const match = await findPartBySku(actor, code);
      if (!match) {
        toast.error(`No se encontró ningún producto con el código ${code}`);
        return;
      }
      addPart(match);
      setBarcode("");
      barcodeRef.current?.focus();
    } catch {
      toast.error("No se pudo consultar el catálogo. Intenta de nuevo.");
    } finally {
      setScanPending(false);
    }
  };

  const updateQuantity = (partId: bigint, quantity: number) => {
    setCart((current) =>
      current.map((line) =>
        line.partId === partId
          ? { ...line, quantity: Math.max(1, quantity) }
          : line,
      ),
    );
  };

  const updateDiscount = (partId: bigint, discount: number) => {
    setCart((current) =>
      current.map((line) =>
        line.partId === partId ? { ...line, discount } : line,
      ),
    );
  };

  const removeLine = (partId: bigint) => {
    setCart((current) => current.filter((line) => line.partId !== partId));
  };

  const resetSale = () => {
    setCart([]);
    setCustomerId("none");
    setCustomerSearch("");
    setPaymentMethod(PaymentMethod.cash);
    setCondition(PaymentConditionEnum.cash);
    setInstallmentCount("3");
    setFirstDueDate("");
    setAmountReceived("");
    setCompletedSale(null);
  };

  const handleCharge = () => {
    if (!canCharge) return;
    const lines: PosSaleLineInput[] = cart.map((line) => ({
      partId: line.partId,
      quantity: BigInt(line.quantity),
      discount: BigInt(line.discount),
    }));
    const selectedCustomer = customerId === "none" ? null : BigInt(customerId);

    const creditPlan: CreditPlanInput | undefined =
      isCredit && creditReady
        ? {
            installmentCount: BigInt(parsedCount),
            firstDueDate:
              BigInt(new Date(`${firstDueDate}T00:00:00Z`).getTime()) *
              1_000_000n,
          }
        : undefined;

    createSale.mutate(
      {
        lines,
        paymentMethod,
        paymentCondition: condition,
        amountReceived: BigInt(isCash ? receivedCents : totals.total),
        customerId: selectedCustomer ?? undefined,
        creditPlan,
      },
      {
        onSuccess: (sale) => {
          setCompletedSale(sale);
          setCart([]);
          setAmountReceived("");
          toast.success(`Venta ${sale.saleNumber} registrada`);
        },
        onError: (error) => {
          const message = String(error);
          if (message.includes("insufficientStock")) {
            toast.error(
              "Stock insuficiente en uno o más productos. Ajusta el carrito.",
            );
          } else if (message.includes("emptyCart")) {
            toast.error("El carrito está vacío.");
          } else if (message.includes("insufficientPayment")) {
            toast.error("El monto recibido no cubre el total de la venta.");
          } else if (
            message.includes("customerRequired") ||
            message.includes("creditRequiresCustomer")
          ) {
            toast.error(
              "La venta a crédito exige un cliente registrado. Selecciona uno.",
            );
          } else {
            toast.error("No se pudo registrar la venta. Intenta de nuevo.");
          }
        },
      },
    );
  };

  const receiptLines: DocumentLine[] = (completedSale?.lines ?? []).map(
    (line) => ({
      description: line.description,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      amount: Number(line.amount),
    }),
  );

  const receiptMeta: DocumentMeta[] = completedSale
    ? [
        {
          label: "Cliente",
          value: completedSale.customerName ?? "Venta de mostrador",
        },
        {
          label: "Método",
          value:
            PAYMENT_METHOD_LABELS[
              completedSale.paymentMethod as PaymentMethod
            ] ?? completedSale.paymentMethod,
        },
        {
          label: "Condición",
          value: CONDITION_LABELS[completedSale.paymentCondition],
        },
        {
          label: "Recibido",
          value: formatMoney(completedSale.amountReceived),
        },
        { label: "Cambio", value: formatMoney(completedSale.change) },
      ]
    : [];

  const receiptTotals: DocumentTotals[] = completedSale
    ? [
        { label: "Subtotal", value: formatMoney(completedSale.subtotal) },
        ...(isIvaResponsible
          ? [
              {
                label: `Impuesto (${formatTaxRate(completedSale.taxRate)})`,
                value: formatMoney(completedSale.tax),
              },
            ]
          : []),
        {
          label: "Descuento",
          value: `-${formatMoney(completedSale.discount)}`,
        },
        {
          label: "Total",
          value: formatMoney(completedSale.total),
          emphasis: true,
        },
      ]
    : [];

  const receiptFooter = "Gracias por su compra. Conserve este comprobante.";

  async function handleDownloadReceipt(nextFormat: DocumentFormat) {
    if (!completedSale) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildReceiptPdf(
        nextFormat,
        completedSale.saleNumber,
        pdfCompanyFromProfile(companyQuery.data),
        receiptMeta,
        receiptLines,
        receiptTotals,
        receiptFooter,
      );
      await downloadFile({
        filename: `Comprobante-${completedSale.saleNumber}.pdf`,
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
  }

  if (completedSale) {
    return (
      <div
        data-ocid="pos.page"
        className="mx-auto w-full max-w-3xl animate-fade-in space-y-5"
      >
        <PageHeader
          eyebrow="Ventas"
          title="Venta registrada"
          description={`La venta ${completedSale.saleNumber} se cobró correctamente y el stock ya fue descontado.`}
          actions={
            <Button
              type="button"
              onClick={resetSale}
              data-ocid="pos.new_sale_button"
              className="gap-2"
            >
              <ShoppingCart className="size-4" aria-hidden="true" />
              Nueva venta
            </Button>
          }
        />

        <div
          data-ocid="pos.success_state"
          className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3"
        >
          <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Cobro completado</p>
            <p className="text-xs text-muted-foreground">
              Total cobrado {formatMoney(completedSale.total)} · Cambio{" "}
              {formatMoney(completedSale.change)}
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Receipt
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="font-display text-sm font-semibold">
              Comprobante de venta
            </h2>
          </div>
          <DocumentPreview
            title="Comprobante"
            number={completedSale.saleNumber}
            companyName={business?.name ?? "HR SOLUCIONES INTEGRALES"}
            companyLogoUrl={companyLogoUrl}
            companyContact={
              business
                ? [business.address, business.phone]
                    .filter((value) => value.length > 0)
                    .join(" · ")
                : undefined
            }
            meta={receiptMeta}
            lines={receiptLines}
            totals={receiptTotals}
            footer={receiptFooter}
            format="a4"
            ocid="pos.receipt_a4"
            onDownloadPdf={handleDownloadReceipt}
            isDownloading={isDownloading}
          />
          <DocumentPreview
            title="Comprobante"
            number={completedSale.saleNumber}
            companyName={business?.name ?? "HR SOLUCIONES INTEGRALES"}
            companyLogoUrl={companyLogoUrl}
            meta={receiptMeta}
            lines={receiptLines}
            totals={receiptTotals}
            footer="Gracias por su compra."
            format="receipt80"
            ocid="pos.receipt_80mm"
            onDownloadPdf={handleDownloadReceipt}
            isDownloading={isDownloading}
          />
          {downloadError ? (
            <div
              data-ocid="pos.download_error"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
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
                onClick={() => void handleDownloadReceipt("a4")}
                data-ocid="pos.download_retry_button"
              >
                Reintentar
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div data-ocid="pos.page" className="animate-fade-in space-y-5">
      <PageHeader
        eyebrow="Ventas"
        title="POS de mostrador"
        description="Venta directa con búsqueda por texto y lector de código de barras. Descuenta stock y genera la factura al cobrar, de contado o a crédito con cuotas."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={resetSale}
            disabled={cart.length === 0}
            data-ocid="pos.clear_button"
            className="gap-2"
          >
            <X className="size-4" aria-hidden="true" />
            Vaciar carrito
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* --- Product search column ------------------------------------- */}
        <section
          data-ocid="pos.product_panel"
          className="counter-panel flex min-h-[520px] flex-col"
        >
          <div className="space-y-3 border-b border-border p-4">
            <form onSubmit={handleBarcode} className="space-y-1.5">
              <Label htmlFor="pos-barcode" className="text-xs">
                Código de barras
              </Label>
              <div className="relative">
                <ScanLine
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="pos-barcode"
                  ref={barcodeRef}
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="Escanea o escribe el SKU y presiona Enter"
                  autoComplete="off"
                  aria-label="Código de barras"
                  data-ocid="pos.barcode_input"
                  className="counter-scan pl-9"
                />
              </div>
            </form>

            <div className="space-y-1.5">
              <Label htmlFor="pos-search" className="text-xs">
                Buscar producto
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="pos-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nombre, marca o SKU"
                  aria-label="Buscar producto"
                  data-ocid="pos.search_input"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="scroll-slim flex-1 overflow-y-auto">
            {partsQuery.isLoading ? (
              <div data-ocid="pos.loading_state" className="space-y-2 p-4">
                {Array.from({ length: 6 }, (_, i) => `pos-skeleton-${i}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-12 w-full" />
                  ),
                )}
              </div>
            ) : partsQuery.isError ? (
              <div
                data-ocid="pos.error_state"
                className="flex flex-col items-center gap-2 px-6 py-16 text-center"
              >
                <AlertTriangle
                  className="size-6 text-destructive"
                  aria-hidden="true"
                />
                <p className="font-display text-sm font-semibold">
                  No se pudo cargar el catálogo
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Verifica la conexión con el backend e inténtalo de nuevo.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void partsQuery.refetch({ cancelRefetch: true })
                  }
                  data-ocid="pos.retry_button"
                >
                  Reintentar
                </Button>
              </div>
            ) : parts.length === 0 ? (
              <div
                data-ocid="pos.empty_state"
                className="flex flex-col items-center gap-2 px-6 py-16 text-center"
              >
                <Barcode
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="font-display text-sm font-semibold">
                  {debouncedPartSearch.trim() === ""
                    ? "Sin productos"
                    : "Sin resultados"}
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {debouncedPartSearch.trim() === ""
                    ? "No hay productos en el catálogo. Registra el repuesto para venderlo."
                    : `Ningún producto coincide con “${debouncedPartSearch.trim()}”. Ajusta el término o regístralo en el catálogo.`}
                </p>
              </div>
            ) : (
              <ul
                data-ocid="pos.product_list"
                className="divide-y divide-border"
              >
                {parts.map((part, index) => {
                  const outOfStock = Number(part.totalStock) <= 0;
                  return (
                    <li key={part.id.toString()}>
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addPart(part)}
                        data-ocid={`pos.product_item.${index + 1}`}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-smooth hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {part.name}
                          </p>
                          <p className="data-rail text-[11px] text-muted-foreground">
                            {part.sku} · {part.brand}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="data-rail text-sm font-semibold">
                            {formatMoney(part.salePrice)}
                          </p>
                          <p
                            className={cn(
                              "data-rail text-[11px]",
                              outOfStock
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {outOfStock
                              ? "Sin existencia"
                              : `${formatNumber(part.totalStock)} disp.`}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* --- Cart column ----------------------------------------------- */}
        <section
          data-ocid="pos.cart_panel"
          className="counter-panel flex min-h-[520px] flex-col"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="font-display text-sm font-semibold">Carrito</h2>
            </div>
            <span className="data-rail text-xs text-muted-foreground">
              {formatNumber(cart.length)} art.
            </span>
          </header>

          <div className="scroll-slim flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div
                data-ocid="pos.cart_empty_state"
                className="flex flex-col items-center gap-2 px-6 py-16 text-center"
              >
                <ShoppingCart
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="font-display text-sm font-semibold">
                  Carrito vacío
                </p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Escanea un código de barras o selecciona un producto para
                  comenzar la venta.
                </p>
              </div>
            ) : (
              <ul data-ocid="pos.cart_list">
                {cart.map((line, index) => (
                  <CartRow
                    key={line.partId.toString()}
                    line={line}
                    index={index}
                    onQuantity={updateQuantity}
                    onDiscount={updateDiscount}
                    onRemove={removeLine}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t border-border p-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="pos-customer"
                className="flex items-center gap-1.5 text-xs"
              >
                <UserRound className="size-3.5" aria-hidden="true" />
                Cliente {isCredit ? "(obligatorio a crédito)" : "(opcional)"}
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="pos-customer-search"
                    type="search"
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    placeholder="Buscar por nombre, teléfono o placa"
                    aria-label="Buscar cliente por nombre, teléfono o placa"
                    autoComplete="off"
                    data-ocid="pos.customer_search_input"
                    className="pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCustomerDialogOpen(true)}
                  data-ocid="pos.create_customer_button"
                  className="shrink-0 gap-2"
                >
                  <UserRoundPlus className="size-4" aria-hidden="true" />
                  Crear cliente
                </Button>
              </div>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger
                  id="pos-customer"
                  aria-label="Cliente"
                  data-ocid="pos.customer_select"
                >
                  <SelectValue placeholder="Venta de mostrador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Venta de mostrador</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.id.toString()}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customerSearch.trim() !== "" && customers.length === 0 ? (
                <p
                  data-ocid="pos.customer_search_empty_state"
                  className="text-xs text-muted-foreground"
                >
                  Sin clientes que coincidan con “{customerSearch.trim()}”.
                  Puedes crear uno nuevo.
                </p>
              ) : null}
              {selectedCustomer ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNotifyOpen(true)}
                    data-ocid="pos.notify_button"
                    className="flex-1 gap-2"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    Notificar al cliente
                  </Button>
                  <WhatsAppNotifyButton
                    contactKind={WhatsAppContactKind.customer}
                    contactId={selectedCustomer.id}
                    context={WhatsAppContext.service}
                    contactName={selectedCustomer.name}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    ocid="pos.whatsapp_button"
                  />
                </div>
              ) : null}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium">Condición de pago</legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={!isCredit}
                  onClick={() => setCondition(PaymentConditionEnum.cash)}
                  data-ocid="pos.condition_cash_button"
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                    !isCredit
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <span className="block font-medium">Contado</span>
                  <span className="block text-xs text-muted-foreground">
                    Pago único
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={isCredit}
                  onClick={() => setCondition(PaymentConditionEnum.credit)}
                  data-ocid="pos.condition_credit_button"
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                    isCredit
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <span className="block font-medium">Crédito</span>
                  <span className="block text-xs text-muted-foreground">
                    Cuotas
                  </span>
                </button>
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="pos-method" className="text-xs">
                Método de pago
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as PaymentMethod)
                }
              >
                <SelectTrigger
                  id="pos-method"
                  aria-label="Método de pago"
                  data-ocid="pos.payment_method_select"
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

            {isCredit ? (
              <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pos-installments" className="text-xs">
                      Número de cuotas
                    </Label>
                    <Input
                      id="pos-installments"
                      type="number"
                      min={1}
                      max={MAX_INSTALLMENTS}
                      value={installmentCount}
                      onChange={(event) =>
                        setInstallmentCount(event.target.value)
                      }
                      aria-label="Número de cuotas"
                      data-ocid="pos.installment_count_input"
                      className="data-rail"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pos-first-due" className="text-xs">
                      Primera cuota
                    </Label>
                    <Input
                      id="pos-first-due"
                      type="date"
                      value={firstDueDate}
                      onChange={(event) => setFirstDueDate(event.target.value)}
                      aria-label="Fecha de la primera cuota"
                      data-ocid="pos.first_due_date_input"
                      className="data-rail"
                    />
                  </div>
                </div>

                {!validCount ? (
                  <p
                    data-ocid="pos.installment_count_error"
                    className="text-xs text-destructive"
                  >
                    Define entre 1 y {MAX_INSTALLMENTS} cuotas.
                  </p>
                ) : null}

                {creditReady ? (
                  <div data-ocid="pos.installment_preview">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Plan de cuotas
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
                  </div>
                ) : (
                  <p
                    data-ocid="pos.installment_preview_empty"
                    className="text-xs text-muted-foreground"
                  >
                    Completa el número de cuotas y la fecha de la primera cuota
                    para ver el plan.
                  </p>
                )}
              </div>
            ) : null}

            {isCash ? (
              <div className="space-y-1.5">
                <Label htmlFor="pos-received" className="text-xs">
                  Efectivo recibido
                </Label>
                <Input
                  id="pos-received"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountReceived}
                  onChange={(event) => setAmountReceived(event.target.value)}
                  placeholder="0.00"
                  aria-label="Efectivo recibido"
                  data-ocid="pos.amount_received_input"
                  className="data-rail text-right"
                />
              </div>
            ) : null}

            <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="data-rail">
                  {formatMoney(BigInt(totals.subtotal))}
                </dd>
              </div>
              {isIvaResponsible ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    Impuesto ({formatTaxRate(effectiveTaxRate)})
                  </dt>
                  <dd className="data-rail">
                    {formatMoney(BigInt(totals.tax))}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Descuento</dt>
                <dd className="data-rail">
                  -{formatMoney(BigInt(totals.discount))}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                <dt className="font-display text-sm font-semibold">Total</dt>
                <dd
                  data-ocid="pos.total_value"
                  className="counter-total text-primary"
                >
                  {formatMoney(BigInt(totals.total))}
                </dd>
              </div>
              {isCash && receivedCents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Cambio</dt>
                  <dd
                    data-ocid="pos.change_value"
                    className={cn(
                      "data-rail font-medium",
                      change < 0 && "text-destructive",
                    )}
                  >
                    {formatMoney(BigInt(Math.max(change, 0)))}
                  </dd>
                </div>
              ) : null}
            </dl>

            {hasStockIssue ? (
              <p
                data-ocid="pos.stock_warning"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                Stock insuficiente en {formatNumber(stockIssues.length)}{" "}
                {stockIssues.length === 1 ? "producto" : "productos"}. Ajusta
                las cantidades antes de cobrar.
              </p>
            ) : null}

            {insufficientCash ? (
              <p
                data-ocid="pos.payment_warning"
                className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                El efectivo recibido no cubre el total de la venta.
              </p>
            ) : null}

            {creditCustomerMissing ? (
              <p
                data-ocid="pos.credit_customer_warning"
                className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                La venta a crédito exige un cliente registrado. Selecciona un
                cliente para continuar.
              </p>
            ) : null}

            {isCredit && !creditReady ? (
              <p
                data-ocid="pos.credit_plan_warning"
                className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
              >
                <CalendarClock
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                Define el número de cuotas y la fecha de la primera cuota para
                generar la factura a crédito.
              </p>
            ) : null}

            <Button
              type="button"
              onClick={handleCharge}
              disabled={!canCharge}
              data-ocid="pos.charge_button"
              className="w-full gap-2"
              size="lg"
            >
              <Receipt className="size-4" aria-hidden="true" />
              {createSale.isPending
                ? "Cobrando…"
                : isCredit
                  ? "Cobrar a crédito"
                  : "Cobrar"}
            </Button>
          </div>
        </section>
      </div>

      <CustomerFormDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={null}
      />

      {selectedCustomer ? (
        <NotifyCustomerDialog
          open={notifyOpen}
          onOpenChange={setNotifyOpen}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          customerEmail={selectedCustomerEmail}
          source={NotificationSource.pos}
          defaultSubject="Información de tu compra en mostrador"
          defaultMessage={`Hola ${selectedCustomer.name}, gracias por tu compra en nuestro mostrador. Si necesitas la factura, el detalle de los repuestos o quieres agendar una revisión, respóndenos a este correo y con gusto te atendemos.`}
        />
      ) : null}
    </div>
  );
}

export default PosPage;
