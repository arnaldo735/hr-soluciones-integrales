import { DocumentPreview } from "@/components/DocumentPreview";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { WarrantyDocument } from "@/components/WarrantyDocument";
import {
  WhatsAppNotifyButton,
  buildWhatsAppUrl,
} from "@/components/WhatsAppNotifyButton";
import { AddLaborDialog } from "@/components/order/AddLaborDialog";
import { AddPartDialog } from "@/components/order/AddPartDialog";
import { CancelOrderDialog } from "@/components/order/CancelOrderDialog";
import { DeleteOrderDialog } from "@/components/order/DeleteOrderDialog";
import { LaborServiceLink } from "@/components/order/LaborServiceLink";
import { LaborTechnicianSelect } from "@/components/order/LaborTechnicianSelect";
import { OrderPhotosSection } from "@/components/order/OrderPhotosSection";
import { OrderStatusStepper } from "@/components/order/OrderStatusStepper";
import { ScanPartDialog } from "@/components/order/ScanPartDialog";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import {
  useBusinessSettings,
  useCompanyProfile,
  useIvaSettings,
} from "@/hooks/use-company";
import { useDailyHopeMessage } from "@/hooks/use-hope";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  errorMessage,
  nextStatus,
  useAddLabor,
  useAddOrderPart,
  useAddOrderPayment,
  useOrder,
  useOrderAdvanceReceipt,
  useOrderPayments,
  useRemoveLabor,
  useRemoveOrderPart,
  useSetOrderAdvance,
  useUpdateOilChangeInterval,
  useUpdateOrderStatus,
} from "@/hooks/use-orders";
import {
  SERVICE_TERMS_DEFAULT_TEXT,
  useServiceTermsSettings,
} from "@/hooks/use-service-terms";
import { useServices } from "@/hooks/use-services";
import { useTechnicians } from "@/hooks/use-technicians";
import {
  WARRANTY_TERMS_DEFAULT_TEXT,
  useWarrantyTermsSettings,
} from "@/hooks/use-warranty-terms";
import { usePrepareWhatsAppMessage } from "@/hooks/use-whatsapp";
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
import {
  downloadOrderAdvanceReceiptPdf,
  downloadWarrantyPdf,
  drawHopeMessage,
  hopeMessageContent,
  loadPdfLibs,
  pdfCompanyFromProfile,
} from "@/lib/pdf";
import type { HopeMessageContent } from "@/lib/pdf";
import { OrderStatus, PaymentMethod, ServiceSort } from "@/lib/types";
import type {
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
  Id,
  LaborItem,
  Motorcycle,
  OrderAdvanceReceipt,
  OrderPayment,
  OrderView,
  Service,
  WarrantyDocumentData,
} from "@/lib/types";
import {
  NotificationSource,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { warrantyAppliesToOrder } from "@/lib/warranty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import type { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Bike,
  Clock,
  FileText,
  HandCoins,
  Loader2,
  Mail,
  MessageCircle,
  Package,
  Plus,
  Printer,
  ReceiptText,
  Save,
  ScanLine,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundPlus,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Formatos de papel del documento de garantía (A4 o tirilla 80 mm). */
const WARRANTY_FORMATS: Array<{ value: DocumentFormat; label: string }> = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" },
];

/** Métodos de pago admitidos para el anticipo de una orden de taller. */
const ADVANCE_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: PaymentMethod.cash, label: "Efectivo" },
  { value: PaymentMethod.transfer, label: "Transferencia" },
];

/** Etiqueta en español del método de pago del anticipo. */
function advanceMethodLabel(method: PaymentMethod): string {
  return method === PaymentMethod.transfer ? "Transferencia" : "Efectivo";
}

/** Métodos de pago admitidos para un abono sobre la orden de trabajo. */
const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: PaymentMethod.cash, label: "Efectivo" },
  { value: PaymentMethod.transfer, label: "Transferencia" },
  { value: PaymentMethod.card, label: "Tarjeta" },
];

/** Etiqueta en español del método de pago de un abono. */
function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.transfer:
      return "Transferencia";
    case PaymentMethod.card:
      return "Tarjeta";
    case PaymentMethod.mixed:
      return "Mixto";
    default:
      return "Efectivo";
  }
}

function useOrderContext(customerId: Id | null, motorcycleId: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "order-context",
      customerId?.toString() ?? "none",
      motorcycleId?.toString() ?? "none",
    ],
    queryFn: async (): Promise<{
      customerName: string | null;
      customerDocument: string | null;
      customerEmail: string | null;
      motorcycle: Motorcycle | null;
    }> => {
      if (!actor || customerId === null) {
        return {
          customerName: null,
          customerDocument: null,
          customerEmail: null,
          motorcycle: null,
        };
      }
      const [customer, motos] = await Promise.all([
        actor.getCustomer(token, customerId),
        actor.listMotorcycles(token, customerId),
      ]);
      const motorcycle = motos.find((moto) => moto.id === motorcycleId) ?? null;
      const email = customer?.email?.trim() ?? "";
      const document = customer?.document?.trim() ?? "";
      return {
        customerName: customer?.name ?? null,
        customerDocument: document === "" ? null : document,
        customerEmail: email === "" ? null : email,
        motorcycle,
      };
    },
    enabled: !!actor && !isFetching && customerId !== null,
  });
}

function useAssignTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      technicianId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.assignTechnician(token, input.id, input.technicianId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"],
      });
    },
  });
}

function useUnassignTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      technicianId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.unassignTechnician(token, input.id, input.technicianId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"],
      });
    },
  });
}

function useUpdateLaborTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      laborId: Id;
      technicianId: Id | null;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateLaborTechnician(
        token,
        input.id,
        input.laborId,
        input.technicianId,
      );
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

/**
 * Replaces the catalog service linked to a labor line. The backend exposes no
 * dedicated "update labor service" method, so the line is removed and re-added
 * with the new `serviceId`, preserving its description, price and technician.
 */
function useReplaceLaborService() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      item: LaborItem;
      service: Service | null;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      await actor.removeLabor(token, input.id, input.item.id);
      return actor.addLabor(token, input.id, {
        description: input.item.description,
        price: input.item.price,
        technicianId: input.item.technicianId,
        serviceId: input.service?.id,
      });
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

/**
 * Builds the workshop-order PDF in the selected format (A4 sheet or 80 mm
 * tirilla) with the same content the on-screen preview shows. The blob is
 * handed to the shared mobile-safe `downloadFile` helper so the document is
 * saved on the device on phone and tablet, not only on desktop.
 */
async function buildOrderPdf(
  format: DocumentFormat,
  number: string,
  company: ReturnType<typeof pdfCompanyFromProfile>,
  meta: DocumentMeta[],
  lines: DocumentLine[],
  totals: DocumentTotals[],
  footer: string,
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
  doc.text("ORDEN DE TALLER", right, 14, { align: "right" });
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
  const footerY = afterTotals + (narrow ? 6 : 10);
  const footerLines = doc.splitTextToSize(footer, right - margin);
  doc.text(footerLines, margin, footerY);
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: footerY + footerLines.length * (narrow ? 2.6 : 3.4) + 1.5,
    narrow,
  });

  return doc;
}

interface WarrantyWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: Id;
  customerName: string;
  orderId: Id;
  warranty: WarrantyDocumentData;
  company: ReturnType<typeof pdfCompanyFromProfile>;
  hope: HopeMessageContent | null;
  termsText: string;
}

/**
 * Diálogo de envío del documento de garantía por WhatsApp. Reutiliza el flujo
 * compartido (consulta `prepareWhatsAppMessage`, mensaje editable y enlace
 * `wa.me`) y, antes de abrir WhatsApp, genera y descarga el PDF de la garantía
 * en el formato elegido para que el usuario lo adjunte en la conversación.
 */
function WarrantyWhatsAppDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  orderId,
  warranty,
  company,
  hope,
  termsText,
}: WarrantyWhatsAppDialogProps) {
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<DocumentFormat>("a4");
  const [isGenerating, setIsGenerating] = useState(false);

  const prepare = usePrepareWhatsAppMessage();
  const { mutate: prepareMessage } = prepare;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setHasPhone(null);
    setPhone(null);
    setMessage("");
    prepareMessage(
      {
        contactKind: WhatsAppContactKind.customer,
        contactId: customerId,
        context: WhatsAppContext.order,
        referenceId: orderId,
      },
      {
        onSuccess: (result) => {
          setHasPhone(result.hasPhone);
          setPhone(result.phone ?? null);
          setMessage(result.message);
        },
        onError: () => {
          setHasPhone(false);
          setError(
            "No se pudo preparar el mensaje de WhatsApp. Inténtalo de nuevo.",
          );
        },
      },
    );
  }, [open, customerId, orderId, prepareMessage]);

  async function handleSend() {
    const trimmed = message.trim();
    if (trimmed === "") {
      setError("El mensaje no puede estar vacío.");
      return;
    }
    if (!phone) {
      setError("El contacto no tiene un teléfono registrado.");
      return;
    }
    setIsGenerating(true);
    try {
      await downloadWarrantyPdf(warranty, company, format, hope, termsText);
    } catch {
      setError("No se pudo generar el PDF de la garantía. Inténtalo de nuevo.");
      setIsGenerating(false);
      return;
    }
    setIsGenerating(false);
    window.open(
      buildWhatsAppUrl(phone, trimmed),
      "_blank",
      "noopener,noreferrer",
    );
    onOpenChange(false);
  }

  const isPreparing = prepare.isPending || hasPhone === null;
  const canSend = hasPhone === true && message.trim() !== "" && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="order_detail.warranty_whatsapp_dialog"
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Enviar garantía por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Revisa y edita el mensaje antes de abrir WhatsApp con {customerName}
            . El PDF de la garantía se descargará en el formato elegido para que
            lo adjuntes en la conversación.
          </DialogDescription>
        </DialogHeader>

        {isPreparing ? (
          <div
            data-ocid="order_detail.warranty_whatsapp.loading_state"
            className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Preparando el mensaje…
          </div>
        ) : hasPhone === false ? (
          <div
            data-ocid="order_detail.warranty_whatsapp.no_phone_state"
            className="flex items-start gap-2.5 rounded-md border border-status-overdue/40 bg-status-overdue/10 px-3 py-2.5 text-xs text-status-overdue"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              {customerName} no tiene un teléfono registrado. Registra el
              teléfono del cliente antes de enviar la garantía por WhatsApp.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="warranty-whatsapp-phone">Teléfono</Label>
              <p
                id="warranty-whatsapp-phone"
                data-ocid="order_detail.warranty_whatsapp.phone_value"
                className="data-rail rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground"
              >
                {phone ?? "—"}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Documento adjunto</Label>
              <div
                data-ocid="order_detail.warranty_whatsapp.attachment_panel"
                className="rounded-md border border-border bg-muted/30 px-3 py-2.5"
              >
                <p className="flex items-center gap-2 text-xs text-foreground">
                  <FileText
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Términos y Condiciones de Garantía · {warranty.orderNumber}
                </p>
                <fieldset
                  aria-label="Formato del documento adjunto"
                  data-ocid="order_detail.warranty_whatsapp.format_toggle"
                  className="doc-format-toggle mt-2"
                >
                  {WARRANTY_FORMATS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      data-active={format === option.value}
                      aria-pressed={format === option.value}
                      onClick={() => setFormat(option.value)}
                      data-ocid={`order_detail.warranty_whatsapp.format_${option.value}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </fieldset>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warranty-whatsapp-message">Mensaje</Label>
              <Textarea
                id="warranty-whatsapp-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                data-ocid="order_detail.warranty_whatsapp.message_textarea"
              />
              <p className="text-xs text-muted-foreground">
                Puedes editar el texto. Se abrirá WhatsApp con este mensaje
                prellenado.
              </p>
            </div>
          </div>
        )}

        {error ? (
          <p
            data-ocid="order_detail.warranty_whatsapp.error_state"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="order_detail.warranty_whatsapp.cancel_button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            data-ocid="order_detail.warranty_whatsapp.send_button"
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <MessageCircle className="size-4" aria-hidden="true" />
            )}
            {isGenerating ? "Generando PDF…" : "Abrir WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailSkeleton() {
  return (
    <div data-ocid="order_detail.loading_state" className="space-y-4" aria-busy>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams({ from: "/ordenes/$id" });
  const navigate = useNavigate();
  const orderId = BigInt(id);

  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [isScanPartOpen, setIsScanPartOpen] = useState(false);
  const [isAddLaborOpen, setIsAddLaborOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isWarrantyOpen, setIsWarrantyOpen] = useState(false);
  const [isWarrantyWhatsAppOpen, setIsWarrantyWhatsAppOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [isAdvanceDeleteOpen, setIsAdvanceDeleteOpen] = useState(false);
  const [advanceAmountDraft, setAdvanceAmountDraft] = useState("");
  const [advanceMethodDraft, setAdvanceMethodDraft] = useState<PaymentMethod>(
    PaymentMethod.cash,
  );
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmountDraft, setPaymentAmountDraft] = useState("");
  const [paymentMethodDraft, setPaymentMethodDraft] = useState<PaymentMethod>(
    PaymentMethod.cash,
  );
  const [paymentNoteDraft, setPaymentNoteDraft] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<DocumentFormat>("a4");
  const [isReceiptDownloading, setIsReceiptDownloading] = useState(false);
  const [receiptDownloadError, setReceiptDownloadError] = useState<
    string | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [printFormat, setPrintFormat] = useState<DocumentFormat>("a4");
  const [warrantyFormat, setWarrantyFormat] = useState<DocumentFormat>("a4");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWarrantyDownloading, setIsWarrantyDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [warrantyDownloadError, setWarrantyDownloadError] = useState<
    string | null
  >(null);
  const [intervalDraft, setIntervalDraft] = useState("");
  const [intervalError, setIntervalError] = useState<string | null>(null);

  const orderQuery = useOrder(orderId);
  const view = orderQuery.data ?? null;
  const order = view?.order ?? null;

  // El backend rechaza un segundo anticipo editable cuando la OT ya tiene
  // factura. Se consulta la lista de facturas para bloquear la edición con un
  // mensaje claro en lugar de dejar que el backend falle.
  //
  // La consulta es auxiliar: si falla, sigue cargando o el actor aún no está
  // listo, NO debe ocultar el botón de anticipo. Solo se considera que la OT
  // está facturada cuando la consulta terminó con éxito y la orden aparece
  // explícitamente en la lista; el backend sigue siendo la autoridad final y
  // rechaza un segundo anticipo sobre una OT facturada.
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
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
    enabled: !!actor && !isFetching,
  });
  const invoicedOrderIds = invoicedOrdersQuery.data ?? new Set<string>();
  const invoicedOrdersLoaded = invoicedOrdersQuery.isSuccess;

  const { isIvaResponsible } = useIvaSettings();
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const business = businessQuery.data ?? null;
  const companyHeader = companyHeaderFromProfile(companyQuery.data);
  const companyLogoUrl =
    companyHeader?.logoUrl ?? companyQuery.data?.logoUrl ?? undefined;

  const serviceTermsQuery = useServiceTermsSettings();
  const serviceTermsFooter =
    serviceTermsQuery.data?.text?.trim() || SERVICE_TERMS_DEFAULT_TEXT;

  const warrantyTermsQuery = useWarrantyTermsSettings();
  const warrantyTermsText =
    warrantyTermsQuery.data?.text?.trim() || WARRANTY_TERMS_DEFAULT_TEXT;

  const servicesQuery = useServices({
    search: "",
    category: null,
    activeOnly: false,
    sort: ServiceSort.name,
    page: 1,
    pageSize: 200,
  });
  const services = servicesQuery.data?.items ?? [];
  const serviceNameById = new Map(
    services.map((service) => [service.id.toString(), service.name]),
  );
  const serviceNameFor = (serviceId: bigint): string | null =>
    serviceNameById.get(serviceId.toString()) ?? null;

  const contextQuery = useOrderContext(
    order?.customerId ?? null,
    order?.motorcycleId ?? null,
  );

  const updateStatus = useUpdateOrderStatus();
  const updateOilChangeInterval = useUpdateOilChangeInterval();
  const setOrderAdvance = useSetOrderAdvance();
  const addOrderPayment = useAddOrderPayment();
  const paymentsQuery = useOrderPayments(orderId);
  const payments = paymentsQuery.data ?? [];
  const receiptQuery = useOrderAdvanceReceipt(orderId);
  const receipt = receiptQuery.data ?? null;
  const removePart = useRemoveOrderPart();
  const removeLabor = useRemoveLabor();
  const assignTechnician = useAssignTechnician();
  const unassignTechnician = useUnassignTechnician();
  const updateLaborTechnician = useUpdateLaborTechnician();
  const replaceLaborService = useReplaceLaborService();

  const addOrderPart = useAddOrderPart();
  const addLabor = useAddLabor();

  // A factura is immutable, so its item search sends the chosen part/service and
  // quantity here as query params. On mount the line is appended automatically
  // as the first line of the order, then the params are cleared from the URL.
  const addSearch = useSearch({ from: "/ordenes/$id" });
  const addPartId = addSearch.addPartId;
  const addServiceId = addSearch.addServiceId;
  const addQuantity = addSearch.addQuantity;
  const addAppliedRef = useRef(false);

  useEffect(() => {
    if (addAppliedRef.current) return;
    if (addPartId === undefined && addServiceId === undefined) return;
    if (!order) return;
    addAppliedRef.current = true;

    const quantity = Math.max(1, Number.parseInt(addQuantity ?? "1", 10) || 1);

    if (addPartId !== undefined) {
      addOrderPart.mutate(
        {
          id: order.id,
          part: { partId: BigInt(addPartId), quantity: BigInt(quantity) },
        },
        {
          onSuccess: () =>
            toast.success("Repuesto anexado como primera línea de la orden"),
          onError: (error) => setActionError(errorMessage(error)),
        },
      );
    } else if (addServiceId !== undefined) {
      const service =
        services.find((item) => item.id.toString() === addServiceId) ?? null;
      addLabor.mutate(
        {
          id: order.id,
          labor: {
            description: service
              ? `${service.code} · ${service.name}`
              : "Servicio",
            price: (service?.laborRate ?? 0n) * BigInt(quantity),
            serviceId: service?.id,
          },
        },
        {
          onSuccess: () =>
            toast.success("Servicio anexado como primera línea de la orden"),
          onError: (error) => setActionError(errorMessage(error)),
        },
      );
    }

    void navigate({
      to: "/ordenes/$id",
      params: { id: order.id.toString() },
      search: {},
      replace: true,
    });
  }, [
    addPartId,
    addServiceId,
    addQuantity,
    order,
    services,
    addOrderPart,
    addLabor,
    navigate,
  ]);

  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly: false,
  });
  const technicians = techniciansQuery.data ?? [];
  const technicianById = new Map(
    technicians.map((technician) => [technician.id.toString(), technician]),
  );
  const assignedIds = order?.technicianIds ?? [];
  const assignedTechnicians = technicians.filter((technician) =>
    assignedIds.some((id) => id === technician.id),
  );
  const availableTechnicians = technicians.filter(
    (technician) => !assignedIds.some((id) => id === technician.id),
  );
  const isAssigning =
    assignTechnician.isPending || unassignTechnician.isPending;

  const upcoming = order ? nextStatus(order.status) : null;
  const isCancelled = order?.status === OrderStatus.cancelled;
  const isDelivered = order?.status === OrderStatus.delivered;
  const isEditable = !isCancelled && !isDelivered;

  const previousMileage = order?.previousMileage;
  const oilChangeInterval = order?.oilChangeInterval;
  const travelledKm =
    order && previousMileage !== undefined
      ? order.intakeMileage - previousMileage
      : null;
  const nextOilChangeKm =
    order && oilChangeInterval !== undefined
      ? order.intakeMileage + oilChangeInterval
      : null;

  useEffect(() => {
    setIntervalDraft(
      oilChangeInterval !== undefined ? oilChangeInterval.toString() : "",
    );
  }, [oilChangeInterval]);

  function handleSaveInterval() {
    if (!order) return;
    const trimmed = intervalDraft.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (
      value === null ||
      !Number.isFinite(value) ||
      value < 0 ||
      !Number.isInteger(value)
    ) {
      setIntervalError(
        "El intervalo debe ser un número entero de kilómetros (0 o más).",
      );
      return;
    }
    setIntervalError(null);
    updateOilChangeInterval.mutate(
      { id: order.id, oilChangeInterval: BigInt(value) },
      { onError: (error) => setIntervalError(errorMessage(error)) },
    );
  }

  function handleOpenAdvanceDialog() {
    setAdvanceError(null);
    setAdvanceAmountDraft(
      order?.advance ? (Number(order.advance.amount) / 100).toString() : "",
    );
    setAdvanceMethodDraft(order?.advance?.method ?? PaymentMethod.cash);
    setIsAdvanceOpen(true);
  }

  function handleSaveAdvance() {
    if (!order) return;
    const trimmed = advanceAmountDraft.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (
      value === null ||
      !Number.isFinite(value) ||
      value <= 0 ||
      !Number.isInteger(value)
    ) {
      setAdvanceError(
        "El anticipo debe ser un monto en pesos mayor que cero, sin decimales.",
      );
      return;
    }
    const amountCents = BigInt(Math.round(value * 100));
    // Cuando la OT aún no tiene repuestos ni mano de obra su total es 0. En ese
    // caso no se aplica límite superior: el anticipo puede registrarse y el
    // saldo pendiente se recalcula al agregar conceptos. Con total > 0 se
    // mantiene la invariante anticipo <= total.
    if (totals.total > 0n && amountCents > totals.total) {
      setAdvanceError(
        `El anticipo no puede superar el total de la orden (${formatMoney(totals.total)}).`,
      );
      return;
    }
    setAdvanceError(null);
    setOrderAdvance.mutate(
      { id: order.id, amount: amountCents, method: advanceMethodDraft },
      {
        onSuccess: () => setIsAdvanceOpen(false),
        onError: (error) => setAdvanceError(errorMessage(error)),
      },
    );
  }

  function handleDeleteAdvance() {
    if (!order) return;
    setActionError(null);
    setOrderAdvance.mutate(
      { id: order.id, amount: null, method: null },
      {
        onSuccess: () => setIsAdvanceDeleteOpen(false),
        onError: (error) => {
          setIsAdvanceDeleteOpen(false);
          setActionError(errorMessage(error));
        },
      },
    );
  }

  function handleOpenPaymentDialog() {
    setPaymentError(null);
    setPaymentAmountDraft("");
    setPaymentMethodDraft(PaymentMethod.cash);
    setPaymentNoteDraft("");
    setIsPaymentOpen(true);
  }

  function handleSavePayment() {
    if (!order) return;
    const trimmed = paymentAmountDraft.trim();
    const value = trimmed === "" ? null : Number(trimmed);
    if (
      value === null ||
      !Number.isFinite(value) ||
      value <= 0 ||
      !Number.isInteger(value)
    ) {
      setPaymentError(
        "El abono debe ser un monto en pesos mayor que cero, sin decimales.",
      );
      return;
    }
    const amountCents = BigInt(Math.round(value * 100));
    // Cuando la OT aún no tiene repuestos ni mano de obra su total es 0 y el
    // saldo pendiente también es 0. En ese caso no se aplica límite superior: el
    // abono puede registrarse y el saldo se recalcula al agregar conceptos. Con
    // total > 0 se mantiene la invariante abono <= saldo pendiente.
    if (totals.total > 0n && amountCents > pendingBalance) {
      setPaymentError(
        `El abono no puede superar el saldo pendiente (${formatMoney(pendingBalance)}).`,
      );
      return;
    }
    setPaymentError(null);
    const note = paymentNoteDraft.trim();
    addOrderPayment.mutate(
      {
        id: order.id,
        payment: {
          amount: amountCents,
          method: paymentMethodDraft,
          note: note === "" ? undefined : note,
        },
      },
      {
        onSuccess: () => setIsPaymentOpen(false),
        onError: (error) => setPaymentError(errorMessage(error)),
      },
    );
  }

  async function handleDownloadReceiptPdf(nextFormat: DocumentFormat) {
    if (!receipt) return;
    setReceiptDownloadError(null);
    setIsReceiptDownloading(true);
    try {
      await downloadOrderAdvanceReceiptPdf(
        receipt,
        pdfCompanyFromProfile(companyQuery.data),
        nextFormat,
        hopeMessage,
      );
    } catch {
      setReceiptDownloadError(
        "No se pudo guardar el PDF del recibo en este dispositivo. Intenta de nuevo.",
      );
    } finally {
      setIsReceiptDownloading(false);
    }
  }

  function handleAssign(technicianId: Id) {
    if (!order) return;
    setActionError(null);
    assignTechnician.mutate(
      { id: order.id, technicianId },
      { onError: (error) => setActionError(errorMessage(error)) },
    );
  }

  function handleUnassign(technicianId: Id) {
    if (!order) return;
    setActionError(null);
    unassignTechnician.mutate(
      { id: order.id, technicianId },
      { onError: (error) => setActionError(errorMessage(error)) },
    );
  }

  function handleAdvance() {
    if (!order || !upcoming) return;
    setActionError(null);
    updateStatus.mutate(
      { id: order.id, status: upcoming },
      { onError: (error) => setActionError(errorMessage(error)) },
    );
  }

  function handleRemovePart(orderPartId: Id) {
    if (!order) return;
    setActionError(null);
    removePart.mutate(
      { id: order.id, orderPartId },
      { onError: (error) => setActionError(errorMessage(error)) },
    );
  }

  function handleRemoveLabor(laborId: Id) {
    if (!order) return;
    setActionError(null);
    removeLabor.mutate(
      { id: order.id, laborId },
      { onError: (error) => setActionError(errorMessage(error)) },
    );
  }

  function handleLaborTechnician(laborId: Id, technicianId: Id | null) {
    if (!order) return;
    setActionError(null);
    updateLaborTechnician.mutate(
      { id: order.id, laborId, technicianId },
      { onError: (error) => setActionError(errorMessage(error)) },
    );
  }

  function handleLaborService(item: LaborItem, service: Service | null) {
    if (!order) return;
    setActionError(null);
    replaceLaborService.mutate(
      { id: order.id, item, service },
      { onError: (error) => setActionError(errorMessage(error)) },
    );
  }

  if (orderQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl animate-fade-in">
        <DetailSkeleton />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div
        data-ocid="order_detail.error_state"
        className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-20 text-center"
      >
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">
            No se pudo cargar la orden
          </h2>
          <p className="text-sm text-muted-foreground">
            Verifica la conexión con el backend e inténtalo de nuevo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void orderQuery.refetch()}
          data-ocid="order_detail.retry_button"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!view || !order) {
    return (
      <div
        data-ocid="order_detail.not_found_state"
        className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-20 text-center"
      >
        <Package className="size-6 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">
            Orden no encontrada
          </h2>
          <p className="text-sm text-muted-foreground">
            La orden solicitada no existe o fue eliminada.
          </p>
        </div>
        <Button asChild variant="outline" data-ocid="order_detail.back_button">
          <Link to="/ordenes">Volver a órdenes</Link>
        </Button>
      </div>
    );
  }

  const { totals } = view;
  const advance = order.advance ?? null;
  const advanceAmount = advance?.amount ?? 0n;
  const paymentsTotal = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0n,
  );
  const paidAmount = advanceAmount + paymentsTotal;
  // El backend calcula el saldo pendiente como `total − anticipo − abonos`
  // acotado a 0 (`balance = if (charged >= total) { 0 } else { total - charged }`),
  // de modo que nunca es negativo. El frontend replica esa misma fórmula acotada
  // para que el saldo mostrado y validado coincida con el del backend y no
  // rechace un abono válido por un desfase (p. ej. cuando lo abonado ya cubre el
  // total y el saldo real es 0, no un valor negativo).
  const pendingBalance =
    paidAmount >= totals.total ? 0n : totals.total - paidAmount;
  // Solo se bloquea por factura cuando la consulta auxiliar cargó con éxito y
  // confirma que la OT está facturada. Mientras carga, falla o el actor no está
  // listo, el botón permanece visible (fail-open) y el backend valida al guardar.
  const hasInvoice =
    invoicedOrdersLoaded && invoicedOrderIds.has(order.id.toString());
  const canEditAdvance = isEditable && !hasInvoice;
  const canRegisterPayment = isEditable && !hasInvoice;
  const advanceLockedMessage = isCancelled
    ? "La orden está cancelada; el anticipo no se puede editar."
    : isDelivered
      ? "La orden fue entregada; el anticipo no se puede editar."
      : hasInvoice
        ? "La orden ya fue facturada; el anticipo no se puede editar."
        : null;
  const paymentLockedMessage = isCancelled
    ? "La orden está cancelada; no se pueden registrar abonos."
    : isDelivered
      ? "La orden fue entregada; no se pueden registrar abonos."
      : hasInvoice
        ? "La orden ya fue facturada; no se pueden registrar abonos."
        : null;
  const motorcycle = contextQuery.data?.motorcycle ?? null;
  const customerName = contextQuery.data?.customerName ?? null;
  const customerEmail = contextQuery.data?.customerEmail ?? null;

  const documentLines: DocumentLine[] = [
    ...order.parts.map((part) => ({
      description: part.description,
      quantity: Number(part.quantity),
      unitPrice: Number(part.unitPrice) / 100,
      amount: (Number(part.quantity) * Number(part.unitPrice)) / 100,
    })),
    ...order.labor.map((item) => ({
      description: item.description,
      quantity: 1,
      unitPrice: Number(item.price) / 100,
      amount: Number(item.price) / 100,
    })),
  ];

  const documentMeta: DocumentMeta[] = [
    {
      label: "Cliente",
      value: customerName ?? `Cliente #${order.customerId.toString()}`,
    },
    {
      label: "Motocicleta",
      value: motorcycle
        ? `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}`
        : `Moto #${order.motorcycleId.toString()}`,
    },
    {
      label: "Placa",
      value: motorcycle?.plate ?? "—",
      rail: true,
    },
    {
      label: "Kilometraje",
      value: `${formatNumber(order.intakeMileage)} km`,
      rail: true,
    },
    {
      label: "Kilometraje anterior",
      value:
        previousMileage !== undefined
          ? `${formatNumber(previousMileage)} km`
          : "no registrado",
      rail: true,
    },
    {
      label: "Kilómetros recorridos",
      value:
        travelledKm !== null
          ? `${formatNumber(travelledKm)} km`
          : "no registrado",
      rail: true,
    },
    {
      label: "Próximo cambio de aceite",
      value:
        nextOilChangeKm !== null
          ? `${formatNumber(nextOilChangeKm)} km`
          : "no registrado",
      rail: true,
    },
    {
      label: "Estado",
      value: ORDER_STATUS_LABELS[order.status],
    },
    {
      label: "Ingreso",
      value: formatDateTime(order.createdAt),
    },
  ];

  const documentTotals: DocumentTotals[] = [
    { label: "Repuestos", value: formatMoney(totals.partsSubtotal) },
    { label: "Mano de obra", value: formatMoney(totals.laborSubtotal) },
    { label: "Subtotal", value: formatMoney(totals.subtotal) },
    ...(isIvaResponsible
      ? [
          {
            label: `Impuesto (${formatTaxRate(totals.taxRate)})`,
            value: formatMoney(totals.tax),
          },
        ]
      : []),
    { label: "Total", value: formatMoney(totals.total), emphasis: true },
    ...(advance
      ? [{ label: "Anticipo", value: `- ${formatMoney(advance.amount)}` }]
      : []),
    ...(paymentsTotal > 0n
      ? [{ label: "Abonos", value: `- ${formatMoney(paymentsTotal)}` }]
      : []),
    ...(advance || paymentsTotal > 0n
      ? [
          {
            label: "Saldo pendiente",
            value: formatMoney(pendingBalance),
            emphasis: true,
          },
        ]
      : []),
  ];

  const orderFooter = serviceTermsFooter;
  const orderNumber = order.orderNumber;

  // Datos del recibo de anticipo: identificación, anticipo, abonos y totales.
  const receiptMeta: DocumentMeta[] = receipt
    ? [
        { label: "Recibo", value: receipt.orderNumber, rail: true },
        { label: "Orden de taller", value: receipt.orderNumber, rail: true },
        { label: "Cliente", value: receipt.customerName },
        {
          label: "Documento",
          value:
            receipt.customerDocument && receipt.customerDocument.trim() !== ""
              ? receipt.customerDocument
              : "—",
          rail: true,
        },
        {
          label: "Motocicleta",
          value:
            `${receipt.motorcycleBrand} ${receipt.motorcycleModel}`.trim() ||
            "—",
        },
        {
          label: "Placa",
          value: receipt.motorcyclePlate.trim() || "—",
          rail: true,
        },
        { label: "Fecha de emisión", value: formatDate(receipt.issuedAt) },
        ...(receipt.advance
          ? [
              {
                label: "Método del anticipo",
                value: paymentMethodLabel(receipt.advance.method),
              },
              {
                label: "Fecha del anticipo",
                value: formatDate(receipt.advance.registeredAt),
              },
            ]
          : []),
      ]
    : [];

  const receiptLines: DocumentLine[] = receipt
    ? [
        ...(receipt.advance
          ? [
              {
                description: "Anticipo",
                quantity: 1,
                unitPrice: Number(receipt.advance.amount) / 100,
                amount: Number(receipt.advance.amount) / 100,
              },
            ]
          : []),
        ...receipt.payments.map((payment: OrderPayment) => ({
          description:
            payment.note && payment.note.trim() !== ""
              ? `Abono · ${payment.note}`
              : "Abono",
          quantity: 1,
          unitPrice: Number(payment.amount) / 100,
          amount: Number(payment.amount) / 100,
        })),
      ]
    : [];

  const receiptTotals: DocumentTotals[] = receipt
    ? [
        { label: "Total de la orden", value: formatMoney(receipt.total) },
        { label: "Total abonado", value: formatMoney(receipt.paidAmount) },
        {
          label: "Saldo pendiente",
          value: formatMoney(receipt.balance),
          emphasis: true,
        },
      ]
    : [];

  // El documento de garantía se activa cuando alguna línea de mano de obra está
  // vinculada a un servicio de catálogo de motor o cabeza de fuerza, o cuando su
  // descripción escrita a mano coincide con uno de esos nombres. El nombre del
  // servicio vinculado se resuelve desde el catálogo cargado en la página.
  const warrantyApplies = warrantyAppliesToOrder(order.labor, serviceNameFor);

  const responsibleTechnician =
    order.labor
      .map((item) =>
        item.technicianId === undefined
          ? null
          : (technicianById.get(item.technicianId.toString()) ?? null),
      )
      .find((technician) => technician !== null) ??
    assignedTechnicians[0] ??
    null;

  const warrantyData: WarrantyDocumentData | null = warrantyApplies
    ? {
        orderNumber,
        customerName: customerName ?? `Cliente #${order.customerId.toString()}`,
        customerDocument: contextQuery.data?.customerDocument ?? "",
        motorcycleBrand: motorcycle?.brand ?? "",
        motorcycleModel: motorcycle?.model ?? "",
        motorcycleYear: motorcycle?.year ?? 0n,
        motorcyclePlate: motorcycle?.plate ?? "",
        serviceDate: order.createdAt,
        technicianCode: responsibleTechnician?.code ?? "",
        technicianName: responsibleTechnician?.name ?? "",
      }
    : null;

  const warrantyCompany = pdfCompanyFromProfile(companyQuery.data);

  async function handleDownloadPdf(nextFormat: DocumentFormat) {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildOrderPdf(
        nextFormat,
        orderNumber,
        pdfCompanyFromProfile(companyQuery.data),
        documentMeta,
        documentLines,
        documentTotals,
        orderFooter,
        hopeMessage,
      );
      await downloadFile({
        filename: `Orden-${orderNumber}.pdf`,
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

  async function handleDownloadWarrantyPdf(nextFormat: DocumentFormat) {
    if (!warrantyData) return;
    setWarrantyDownloadError(null);
    setIsWarrantyDownloading(true);
    try {
      await downloadWarrantyPdf(
        warrantyData,
        warrantyCompany,
        nextFormat,
        hopeMessage,
        warrantyTermsText,
      );
    } catch {
      setWarrantyDownloadError(
        "No se pudo guardar el PDF de la garantía en este dispositivo. Intenta de nuevo.",
      );
    } finally {
      setIsWarrantyDownloading(false);
    }
  }

  return (
    <div
      data-ocid="order_detail.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
          data-ocid="order_detail.back_button"
        >
          <Link to="/ordenes">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a órdenes
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            data-ocid="order_detail.status_badge"
            className={ORDER_STATUS_BADGE[order.status]}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPrintOpen(true)}
            data-ocid="order_detail.print_button"
            className="gap-1.5"
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsNotifyOpen(true)}
            data-ocid="order_detail.notify_button"
            className="gap-1.5"
          >
            <Mail className="size-4" aria-hidden="true" />
            Notificar al cliente
          </Button>
          <WhatsAppNotifyButton
            contactKind={WhatsAppContactKind.customer}
            contactId={order.customerId}
            context={WhatsAppContext.order}
            referenceId={order.id}
            contactName={
              customerName ?? `Cliente #${order.customerId.toString()}`
            }
            variant="outline"
            size="sm"
            ocid="order_detail.whatsapp_button"
          />
          {warrantyApplies ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsWarrantyOpen(true)}
              data-ocid="order_detail.warranty_button"
              className="gap-1.5"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              Términos y Condiciones de Garantía
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCancelOpen(true)}
            disabled={isCancelled}
            data-ocid="order_detail.cancel_order_button"
            className="gap-1.5"
          >
            <Ban className="size-4" aria-hidden="true" />
            Cancelar orden
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            data-ocid="order_detail.delete_order_button"
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </div>

      {isCancelled ? (
        <div
          data-ocid="order_detail.cancelled_banner"
          className="flex items-start gap-3 rounded-md border border-status-cancelled/40 bg-status-cancelled/10 px-4 py-3"
        >
          <Ban
            className="mt-0.5 size-4 shrink-0 text-status-cancelled"
            aria-hidden="true"
          />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-status-cancelled">
              Orden cancelada
            </p>
            <p className="text-xs text-muted-foreground">
              {order.cancelReason
                ? `Motivo: ${order.cancelReason}`
                : "Sin motivo registrado."}
              {order.cancelledAt
                ? ` · ${formatDateTime(order.cancelledAt)}`
                : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              La orden ya no es facturable y no participa en los flujos activos
              del taller.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="gap-0 rounded-lg py-0 shadow-none">
        <CardContent className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Orden de taller
              </p>
              <h1
                data-ocid="order_detail.order_number"
                className="data-rail text-2xl font-semibold tracking-tight"
              >
                {order.orderNumber}
              </h1>
              <p className="text-xs text-muted-foreground">
                Ingreso {formatDateTime(order.createdAt)} · Actualizada{" "}
                {formatDateTime(order.updatedAt)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <UserRound className="size-3" aria-hidden="true" />
                Cliente
              </p>
              <p className="truncate text-sm font-medium">
                {customerName ?? `Cliente #${order.customerId.toString()}`}
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Bike className="size-3" aria-hidden="true" />
                Motocicleta
              </p>
              <p className="truncate text-sm font-medium">
                {motorcycle
                  ? `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}`
                  : `Moto #${order.motorcycleId.toString()}`}
              </p>
              {motorcycle ? (
                <p className="data-rail text-xs text-muted-foreground">
                  {motorcycle.plate}
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Kilometraje de ingreso
              </p>
              <p
                data-ocid="order_detail.intake_mileage_value"
                className="data-rail text-sm font-medium"
              >
                {formatNumber(order.intakeMileage)} km
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Total de la orden
              </p>
              <p className="data-rail text-sm font-semibold text-primary">
                {formatMoney(totals.total)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Kilometraje anterior
              </p>
              <p
                data-ocid="order_detail.previous_mileage_value"
                className="data-rail text-sm font-medium"
              >
                {previousMileage !== undefined
                  ? `${formatNumber(previousMileage)} km`
                  : "no registrado"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Kilómetros recorridos
              </p>
              <p
                data-ocid="order_detail.travelled_km_value"
                className="data-rail text-sm font-medium"
              >
                {travelledKm !== null
                  ? `${formatNumber(travelledKm)} km`
                  : "no registrado"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Próximo cambio de aceite
              </p>
              <p
                data-ocid="order_detail.next_oil_change_value"
                className="data-rail text-sm font-semibold text-primary"
              >
                {nextOilChangeKm !== null
                  ? `${formatNumber(nextOilChangeKm)} km`
                  : "no registrado"}
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-border bg-muted/30 px-4 py-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Intervalo de cambio de aceite (km)
                </p>
                <p className="data-rail text-sm font-medium">
                  {oilChangeInterval !== undefined
                    ? `${formatNumber(oilChangeInterval)} km`
                    : "no registrado"}
                </p>
              </div>
              {isEditable ? (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label
                      htmlFor="order-oil-interval-edit"
                      className="text-xs text-muted-foreground"
                    >
                      Nuevo intervalo (km)
                    </Label>
                    <Input
                      id="order-oil-interval-edit"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={intervalDraft}
                      onChange={(event) => {
                        setIntervalDraft(event.target.value);
                        setIntervalError(null);
                      }}
                      placeholder="Ej. 3000"
                      data-ocid="order_detail.oil_change_interval_input"
                      className="data-rail h-9 w-36"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveInterval}
                    disabled={updateOilChangeInterval.isPending}
                    data-ocid="order_detail.save_oil_change_interval_button"
                    className="gap-1.5"
                  >
                    <Save className="size-4" aria-hidden="true" />
                    {updateOilChangeInterval.isPending
                      ? "Guardando…"
                      : "Guardar intervalo"}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isCancelled
                    ? "La orden está cancelada; el intervalo no se puede editar."
                    : "La orden fue entregada; el intervalo no se puede editar."}
                </p>
              )}
            </div>
            {intervalError ? (
              <p
                data-ocid="order_detail.oil_change_interval_error"
                className="text-xs text-destructive"
              >
                {intervalError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1 rounded-md border border-border bg-muted/30 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Falla reportada
            </p>
            <p className="whitespace-pre-wrap text-sm">{order.problem}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-lg py-0 shadow-none">
        <CardHeader className="border-b border-border px-5 py-4">
          <CardTitle className="font-display text-sm font-semibold tracking-tight">
            Estado de la reparación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-5">
          <OrderStatusStepper status={order.status} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              {upcoming
                ? `Siguiente paso: ${ORDER_STATUS_LABELS[upcoming]}`
                : "La orden fue entregada al cliente."}
            </p>
            <Button
              type="button"
              onClick={handleAdvance}
              disabled={!upcoming || updateStatus.isPending}
              data-ocid="order_detail.advance_status_button"
              className="gap-2"
            >
              {updateStatus.isPending ? "Actualizando…" : "Avanzar estado"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {actionError ? (
            <div
              data-ocid="order_detail.action_error_state"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-xs text-destructive">{actionError}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <Package className="size-4 text-primary" aria-hidden="true" />
                Repuestos
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsScanPartOpen(true)}
                data-ocid="order_detail.scan_part_button"
                className="gap-1.5"
              >
                <ScanLine className="size-4" aria-hidden="true" />
                Escanear
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsAddPartOpen(true)}
                data-ocid="order_detail.add_part_button"
                className="gap-1.5"
              >
                <Plus className="size-4" aria-hidden="true" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {order.parts.length === 0 ? (
                <div
                  data-ocid="order_detail.parts.empty_state"
                  className="flex flex-col items-center gap-2 px-6 py-10 text-center"
                >
                  <Package
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">Sin repuestos</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Agrega los repuestos usados en la reparación; el costo
                    unitario de referencia alimenta el margen de la orden.
                  </p>
                </div>
              ) : (
                <Table data-ocid="order_detail.parts.table">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="pl-5 font-mono text-[11px] uppercase tracking-[0.14em]">
                        Repuesto
                      </TableHead>
                      <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                        Cant.
                      </TableHead>
                      <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                        P. unitario
                      </TableHead>
                      <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                        Importe
                      </TableHead>
                      <TableHead className="pr-5 text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.parts.map((part, index) => (
                      <TableRow
                        key={part.id.toString()}
                        data-ocid={`order_detail.parts.row.${index + 1}`}
                        className="odd:bg-muted/20"
                      >
                        <TableCell className="max-w-[18rem] pl-5">
                          <p className="truncate text-sm font-medium">
                            {part.description}
                          </p>
                          <p className="data-rail text-xs text-muted-foreground">
                            {part.lotId
                              ? `Lote #${part.lotId.toString()}`
                              : "Sin lote asignado"}
                          </p>
                        </TableCell>
                        <TableCell className="data-rail text-right text-sm">
                          {formatNumber(part.quantity)}
                        </TableCell>
                        <TableCell className="data-rail text-right text-sm text-muted-foreground">
                          {formatMoney(part.unitPrice)}
                        </TableCell>
                        <TableCell className="data-rail text-right text-sm font-semibold">
                          {formatMoney(part.quantity * part.unitPrice)}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePart(part.id)}
                            disabled={removePart.isPending}
                            aria-label={`Quitar ${part.description}`}
                            data-ocid={`order_detail.parts.remove_button.${index + 1}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <Wrench className="size-4 text-primary" aria-hidden="true" />
                Mano de obra y servicios
              </CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsAddLaborOpen(true)}
                data-ocid="order_detail.add_labor_button"
                className="gap-1.5"
              >
                <Plus className="size-4" aria-hidden="true" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {order.labor.length === 0 ? (
                <div
                  data-ocid="order_detail.labor.empty_state"
                  className="flex flex-col items-center gap-2 px-6 py-10 text-center"
                >
                  <Wrench
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium">Sin mano de obra</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Registra los servicios realizados con su precio.
                  </p>
                </div>
              ) : (
                <Table data-ocid="order_detail.labor.table">
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="pl-5 font-mono text-[11px] uppercase tracking-[0.14em]">
                        Servicio
                      </TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-[0.14em]">
                        Técnico responsable
                      </TableHead>
                      <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                        Precio
                      </TableHead>
                      <TableHead className="pr-5 text-right font-mono text-[11px] uppercase tracking-[0.14em]">
                        <span className="sr-only">Acciones</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.labor.map((item, index) => {
                      const responsible =
                        item.technicianId === undefined
                          ? null
                          : (technicianById.get(item.technicianId.toString()) ??
                            null);
                      return (
                        <TableRow
                          key={item.id.toString()}
                          data-ocid={`order_detail.labor.row.${index + 1}`}
                          className="odd:bg-muted/20"
                        >
                          <TableCell className="max-w-[18rem] pl-5">
                            <p className="truncate text-sm">
                              {item.description}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <LaborServiceLink
                                item={item}
                                ocid={`order_detail.labor.service.${index + 1}`}
                                disabled={replaceLaborService.isPending}
                                onChange={(service) =>
                                  handleLaborService(item, service)
                                }
                              />
                              {responsible ? (
                                <p className="data-rail truncate text-xs text-muted-foreground">
                                  {responsible.code} · {responsible.name}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Sin técnico responsable
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-[15rem]">
                            <LaborTechnicianSelect
                              id={`order-labor-technician-${item.id.toString()}`}
                              ocid={`order_detail.labor.technician_select.${index + 1}`}
                              value={item.technicianId ?? null}
                              onChange={(technicianId) =>
                                handleLaborTechnician(item.id, technicianId)
                              }
                              showLabel={false}
                              disabled={updateLaborTechnician.isPending}
                            />
                          </TableCell>
                          <TableCell className="data-rail text-right text-sm font-semibold">
                            {formatMoney(item.price)}
                          </TableCell>
                          <TableCell className="pr-5 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLabor(item.id)}
                              disabled={removeLabor.isPending}
                              aria-label={`Quitar ${item.description}`}
                              data-ocid={`order_detail.labor.remove_button.${index + 1}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <OrderPhotosSection orderId={order.id} photos={order.photos} />
        </div>

        <div className="space-y-5">
          <Card
            data-ocid="order_detail.technicians.panel"
            className="gap-0 rounded-lg py-0 shadow-none"
          >
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <UserRoundPlus
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                Técnicos asignados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5">
              {assignedTechnicians.length === 0 ? (
                <p
                  data-ocid="order_detail.technicians.empty_state"
                  className="text-xs text-muted-foreground"
                >
                  Sin técnicos asignados. Selecciona uno para asignarlo a esta
                  orden.
                </p>
              ) : (
                <ul
                  data-ocid="order_detail.technicians.list"
                  className="space-y-2"
                >
                  {assignedTechnicians.map((technician, index) => (
                    <li
                      key={technician.id.toString()}
                      data-ocid={`order_detail.technicians.item.${index + 1}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="data-rail shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                            {technician.code}
                          </span>
                          <p className="truncate text-sm font-medium">
                            {technician.name}
                          </p>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {technician.specialty}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnassign(technician.id)}
                        disabled={isAssigning}
                        aria-label={`Quitar a ${technician.name}`}
                        data-ocid={`order_detail.technicians.remove_button.${index + 1}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 border-t border-border pt-4">
                <label
                  htmlFor="order-detail-technician-picker"
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Asignar técnico
                </label>
                {techniciansQuery.isLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : availableTechnicians.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No hay más técnicos activos disponibles.
                  </p>
                ) : (
                  <select
                    id="order-detail-technician-picker"
                    data-ocid="order_detail.technicians.select"
                    value=""
                    disabled={isAssigning}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value.length > 0) handleAssign(BigInt(value));
                    }}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecciona un técnico…</option>
                    {availableTechnicians.map((technician) => (
                      <option
                        key={technician.id.toString()}
                        value={technician.id.toString()}
                      >
                        {technician.code} · {technician.name} ·{" "}
                        {technician.specialty}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            data-ocid="order_detail.advance.panel"
            className="gap-0 rounded-lg py-0 shadow-none"
          >
            <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <HandCoins className="size-4 text-primary" aria-hidden="true" />
                Anticipo
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {advance ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsReceiptOpen(true)}
                    data-ocid="order_detail.advance.receipt_button"
                    className="gap-1.5"
                  >
                    <ReceiptText className="size-4" aria-hidden="true" />
                    Imprimir recibo de anticipo
                  </Button>
                ) : null}
                {canRegisterPayment ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenPaymentDialog}
                    data-ocid="order_detail.advance.add_payment_button"
                    className="gap-1.5"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Registrar abono
                  </Button>
                ) : null}
                {canEditAdvance ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOpenAdvanceDialog}
                    data-ocid="order_detail.advance.edit_button"
                    className="gap-1.5"
                  >
                    {advance ? "Editar" : "Registrar"}
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-5">
              {advance ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monto</span>
                    <span
                      data-ocid="order_detail.advance.amount"
                      className="data-rail font-semibold"
                    >
                      {formatMoney(advance.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Método</span>
                    <span
                      data-ocid="order_detail.advance.method"
                      className="font-medium"
                    >
                      {advanceMethodLabel(advance.method)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registrado {formatDateTime(advance.registeredAt)}
                  </p>
                  {canEditAdvance ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAdvanceDeleteOpen(true)}
                      disabled={setOrderAdvance.isPending}
                      data-ocid="order_detail.advance.delete_button"
                      className="w-full gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Eliminar anticipo
                    </Button>
                  ) : null}
                </>
              ) : (
                <div
                  data-ocid="order_detail.advance.empty_state"
                  className="space-y-1"
                >
                  <p className="text-sm text-muted-foreground">
                    Sin anticipo registrado.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    El anticipo es opcional. Regístralo para descontarlo del
                    saldo pendiente de la orden.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Abonos registrados
                </p>
                {paymentsQuery.isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : payments.length === 0 ? (
                  <p
                    data-ocid="order_detail.advance.payments.empty_state"
                    className="text-xs text-muted-foreground"
                  >
                    Sin abonos registrados.
                  </p>
                ) : (
                  <ul
                    data-ocid="order_detail.advance.payments.list"
                    className="space-y-2"
                  >
                    {payments.map((payment, index) => (
                      <li
                        key={payment.id.toString()}
                        data-ocid={`order_detail.advance.payments.item.${index + 1}`}
                        className="rounded-md border border-border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">
                            {formatMoney(payment.amount)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {paymentMethodLabel(payment.method)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(payment.registeredAt)}
                        </p>
                        {payment.note && payment.note.trim() !== "" ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {payment.note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total abonado</span>
                <span
                  data-ocid="order_detail.advance.paid_amount"
                  className="data-rail font-medium"
                >
                  {formatMoney(paidAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold">
                  Saldo pendiente
                </span>
                <span
                  data-ocid="order_detail.advance.pending_balance"
                  className="data-rail text-lg font-semibold text-primary"
                >
                  {formatMoney(pendingBalance)}
                </span>
              </div>

              {!canEditAdvance && advanceLockedMessage ? (
                <p
                  data-ocid="order_detail.advance.locked_state"
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  {advanceLockedMessage}
                </p>
              ) : null}

              {!canRegisterPayment && paymentLockedMessage ? (
                <p
                  data-ocid="order_detail.advance.payment_locked_state"
                  className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  {paymentLockedMessage}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card
            data-ocid="order_detail.totals.panel"
            className="gap-0 rounded-lg py-0 shadow-none"
          >
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="font-display text-sm font-semibold tracking-tight">
                Totales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Repuestos</span>
                <span className="data-rail">
                  {formatMoney(totals.partsSubtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mano de obra</span>
                <span className="data-rail">
                  {formatMoney(totals.laborSubtotal)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="data-rail">
                  {formatMoney(totals.subtotal)}
                </span>
              </div>
              {isIvaResponsible ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Impuesto ({formatTaxRate(totals.taxRate)})
                  </span>
                  <span className="data-rail">{formatMoney(totals.tax)}</span>
                </div>
              ) : null}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold">
                  Total
                </span>
                <span
                  data-ocid="order_detail.totals.total"
                  className="data-rail text-lg font-semibold text-primary"
                >
                  {formatMoney(totals.total)}
                </span>
              </div>
              {advance ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Anticipo</span>
                  <span
                    data-ocid="order_detail.totals.advance"
                    className="data-rail"
                  >
                    - {formatMoney(advance.amount)}
                  </span>
                </div>
              ) : null}
              {paymentsTotal > 0n ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Abonos</span>
                  <span
                    data-ocid="order_detail.totals.payments"
                    className="data-rail"
                  >
                    - {formatMoney(paymentsTotal)}
                  </span>
                </div>
              ) : null}
              {advance || paymentsTotal > 0n ? (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold">
                      Saldo pendiente
                    </span>
                    <span
                      data-ocid="order_detail.totals.balance"
                      className="data-rail text-lg font-semibold text-primary"
                    >
                      {formatMoney(pendingBalance)}
                    </span>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card
            data-ocid="order_detail.history.panel"
            className="gap-0 rounded-lg py-0 shadow-none"
          >
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <Clock
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Historial de estados
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <ol
                data-ocid="order_detail.history.timeline"
                className="relative space-y-4 border-l border-border pl-5"
              >
                {order.statusHistory.map((change, index) => (
                  <li
                    key={`${change.at.toString()}-${change.to}`}
                    data-ocid={`order_detail.history.item.${index + 1}`}
                    className="relative"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.4375rem] top-1 size-2.5 rounded-full border-2 border-background bg-primary"
                    />
                    <p className="text-sm font-medium">
                      {ORDER_STATUS_LABELS[change.to]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {change.from
                        ? `Desde ${ORDER_STATUS_LABELS[change.from]} · `
                        : "Orden creada · "}
                      {formatDateTime(change.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isPrintOpen} onOpenChange={setIsPrintOpen}>
        <DialogContent
          data-ocid="order_detail.print_dialog"
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Imprimir orden de taller
            </DialogTitle>
            <DialogDescription>
              Imprime la orden {order.orderNumber} en hoja A4 o en tirilla de 80
              mm, o descárgala como PDF.
            </DialogDescription>
          </DialogHeader>

          <DocumentPreview
            title="Orden de taller"
            number={order.orderNumber}
            companyName={
              companyHeader?.legalName ??
              business?.name ??
              "HR SOLUCIONES INTEGRALES"
            }
            companyLogoUrl={companyLogoUrl}
            companyContact={
              companyHeader
                ? companyContactLine(companyHeader)
                : business
                  ? [business.address, business.phone]
                      .filter((part) => part.trim() !== "")
                      .join(" · ")
                  : undefined
            }
            companyFiscal={
              companyHeader ? companyFiscalLines(companyHeader) : undefined
            }
            meta={documentMeta}
            lines={documentLines}
            totals={documentTotals}
            footer={orderFooter}
            hopeMessage={hopeMessage}
            format={printFormat}
            ocid="order_detail.document"
            onFormatChange={setPrintFormat}
            onDownloadPdf={handleDownloadPdf}
            isDownloading={isDownloading}
          />
          {downloadError ? (
            <div
              data-ocid="order_detail.download_error"
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
                onClick={() => void handleDownloadPdf(printFormat)}
                data-ocid="order_detail.download_retry_button"
              >
                Reintentar
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isWarrantyOpen} onOpenChange={setIsWarrantyOpen}>
        <DialogContent
          data-ocid="order_detail.warranty_dialog"
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Términos y Condiciones de Garantía
            </DialogTitle>
            <DialogDescription>
              Documento de garantía de la orden {order.orderNumber}.
              Previsualiza en hoja A4 o tirilla de 80 mm, imprime, descarga el
              PDF o envíalo por WhatsApp al cliente.
            </DialogDescription>
          </DialogHeader>

          <WarrantyDocument
            data={warrantyData}
            companyName={
              companyHeader?.legalName ??
              business?.name ??
              "HR SOLUCIONES INTEGRALES"
            }
            companyLogoUrl={companyLogoUrl}
            companyContact={
              companyHeader
                ? companyContactLine(companyHeader)
                : business
                  ? [business.address, business.phone]
                      .filter((part) => part.trim() !== "")
                      .join(" · ")
                  : undefined
            }
            companyFiscal={
              companyHeader ? companyFiscalLines(companyHeader) : undefined
            }
            format={warrantyFormat}
            termsText={warrantyTermsText}
            ocid="order_detail.warranty_document"
            onFormatChange={setWarrantyFormat}
            onDownloadPdf={handleDownloadWarrantyPdf}
            isDownloading={isWarrantyDownloading}
          />

          {warrantyDownloadError ? (
            <div
              data-ocid="order_detail.warranty_download_error"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
            >
              <p className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {warrantyDownloadError}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDownloadWarrantyPdf(warrantyFormat)}
                data-ocid="order_detail.warranty_download_retry_button"
              >
                Reintentar
              </Button>
            </div>
          ) : null}

          <div className="no-print flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWarrantyWhatsAppOpen(true)}
              data-ocid="order_detail.warranty_whatsapp_button"
              className="gap-1.5"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Enviar por WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {warrantyData ? (
        <WarrantyWhatsAppDialog
          open={isWarrantyWhatsAppOpen}
          onOpenChange={setIsWarrantyWhatsAppOpen}
          customerId={order.customerId}
          customerName={
            customerName ?? `Cliente #${order.customerId.toString()}`
          }
          orderId={order.id}
          warranty={warrantyData}
          company={warrantyCompany}
          hope={hopeMessage}
          termsText={warrantyTermsText}
        />
      ) : null}

      <AddPartDialog
        orderId={order.id}
        open={isAddPartOpen}
        onOpenChange={setIsAddPartOpen}
      />
      <ScanPartDialog
        orderId={order.id}
        open={isScanPartOpen}
        onOpenChange={setIsScanPartOpen}
      />
      <AddLaborDialog
        orderId={order.id}
        open={isAddLaborOpen}
        onOpenChange={setIsAddLaborOpen}
      />
      <CancelOrderDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
      />
      <DeleteOrderDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDeleted={() => void navigate({ to: "/ordenes" })}
      />
      <Dialog open={isAdvanceOpen} onOpenChange={setIsAdvanceOpen}>
        <DialogContent
          data-ocid="order_detail.advance_dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {advance ? "Editar anticipo" : "Registrar anticipo"}
            </DialogTitle>
            <DialogDescription>
              {totals.total > 0n
                ? `El anticipo se descuenta del total de la orden. No puede superar ${formatMoney(totals.total)}.`
                : "El anticipo se descuenta del total de la orden. La orden aún no tiene repuestos ni mano de obra, así que puedes registrar cualquier monto; el saldo se recalculará al agregar conceptos."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-advance-dialog-amount">Monto (COP)</Label>
              <Input
                id="order-advance-dialog-amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={advanceAmountDraft}
                onChange={(event) => {
                  setAdvanceAmountDraft(event.target.value);
                  setAdvanceError(null);
                }}
                placeholder="Ej. 50000"
                data-ocid="order_detail.advance_dialog.amount_input"
                className="data-rail"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-advance-dialog-method">
                Método de pago
              </Label>
              <Select
                value={advanceMethodDraft}
                onValueChange={(value) => {
                  setAdvanceMethodDraft(value as PaymentMethod);
                  setAdvanceError(null);
                }}
              >
                <SelectTrigger
                  id="order-advance-dialog-method"
                  data-ocid="order_detail.advance_dialog.method_select"
                  className="w-full"
                >
                  <SelectValue placeholder="Selecciona el método" />
                </SelectTrigger>
                <SelectContent>
                  {ADVANCE_METHODS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {advanceError ? (
              <p
                data-ocid="order_detail.advance_dialog.error_state"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {advanceError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdvanceOpen(false)}
              data-ocid="order_detail.advance_dialog.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveAdvance}
              disabled={setOrderAdvance.isPending}
              data-ocid="order_detail.advance_dialog.save_button"
              className="gap-2"
            >
              {setOrderAdvance.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {setOrderAdvance.isPending ? "Guardando…" : "Guardar anticipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdvanceDeleteOpen} onOpenChange={setIsAdvanceDeleteOpen}>
        <DialogContent
          data-ocid="order_detail.advance_delete_dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Eliminar anticipo
            </DialogTitle>
            <DialogDescription>
              Se eliminará el anticipo de {formatMoney(advanceAmount)} de la
              orden {order.orderNumber}. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdvanceDeleteOpen(false)}
              data-ocid="order_detail.advance_delete_dialog.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAdvance}
              disabled={setOrderAdvance.isPending}
              data-ocid="order_detail.advance_delete_dialog.confirm_button"
              className="gap-2"
            >
              {setOrderAdvance.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {setOrderAdvance.isPending ? "Eliminando…" : "Eliminar anticipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent
          data-ocid="order_detail.payment_dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Registrar abono</DialogTitle>
            <DialogDescription>
              {totals.total > 0n
                ? `El abono se descuenta del saldo pendiente de la orden. No puede superar ${formatMoney(pendingBalance)}.`
                : "El abono se descuenta del saldo pendiente de la orden. La orden aún no tiene repuestos ni mano de obra, así que puedes registrar cualquier monto; el saldo se recalculará al agregar conceptos."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-payment-dialog-amount">Monto (COP)</Label>
              <Input
                id="order-payment-dialog-amount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={paymentAmountDraft}
                onChange={(event) => {
                  setPaymentAmountDraft(event.target.value);
                  setPaymentError(null);
                }}
                placeholder="Ej. 50000"
                data-ocid="order_detail.payment_dialog.amount_input"
                className="data-rail"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-payment-dialog-method">
                Método de pago
              </Label>
              <Select
                value={paymentMethodDraft}
                onValueChange={(value) => {
                  setPaymentMethodDraft(value as PaymentMethod);
                  setPaymentError(null);
                }}
              >
                <SelectTrigger
                  id="order-payment-dialog-method"
                  data-ocid="order_detail.payment_dialog.method_select"
                  className="w-full"
                >
                  <SelectValue placeholder="Selecciona el método" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-payment-dialog-note">Nota (opcional)</Label>
              <Textarea
                id="order-payment-dialog-note"
                value={paymentNoteDraft}
                onChange={(event) => {
                  setPaymentNoteDraft(event.target.value);
                  setPaymentError(null);
                }}
                rows={3}
                placeholder="Ej. Abono parcial en efectivo"
                data-ocid="order_detail.payment_dialog.note_textarea"
              />
            </div>

            {paymentError ? (
              <p
                data-ocid="order_detail.payment_dialog.error_state"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
              >
                {paymentError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentOpen(false)}
              data-ocid="order_detail.payment_dialog.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSavePayment}
              disabled={addOrderPayment.isPending}
              data-ocid="order_detail.payment_dialog.save_button"
              className="gap-2"
            >
              {addOrderPayment.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {addOrderPayment.isPending ? "Guardando…" : "Guardar abono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent
          data-ocid="order_detail.advance_receipt_dialog"
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Recibo de anticipo
            </DialogTitle>
            <DialogDescription>
              Recibo de anticipo de la orden {order.orderNumber}. Previsualiza
              en hoja A4 o tirilla de 80 mm, imprime o descarga el PDF.
            </DialogDescription>
          </DialogHeader>

          {receiptQuery.isLoading ? (
            <div
              data-ocid="order_detail.advance_receipt.loading_state"
              className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Cargando el recibo…
            </div>
          ) : receipt ? (
            <DocumentPreview
              title="Recibo de anticipo"
              number={receipt.orderNumber}
              companyName={
                companyHeader?.legalName ??
                business?.name ??
                "HR SOLUCIONES INTEGRALES"
              }
              companyLogoUrl={companyLogoUrl}
              companyContact={
                companyHeader
                  ? companyContactLine(companyHeader)
                  : business
                    ? [business.address, business.phone]
                        .filter((part) => part.trim() !== "")
                        .join(" · ")
                    : undefined
              }
              companyFiscal={
                companyHeader ? companyFiscalLines(companyHeader) : undefined
              }
              meta={receiptMeta}
              lines={receiptLines}
              totals={receiptTotals}
              footer="Recibo generado por el sistema de taller. Conserve este comprobante como constancia del anticipo y los abonos."
              hopeMessage={hopeMessage}
              format={receiptFormat}
              ocid="order_detail.advance_receipt"
              onFormatChange={setReceiptFormat}
              onDownloadPdf={handleDownloadReceiptPdf}
              isDownloading={isReceiptDownloading}
            />
          ) : (
            <p
              data-ocid="order_detail.advance_receipt.empty_state"
              className="text-sm text-muted-foreground"
            >
              No se pudo cargar el recibo de anticipo.
            </p>
          )}

          {receiptDownloadError ? (
            <div
              data-ocid="order_detail.advance_receipt.download_error"
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
            >
              <p className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {receiptDownloadError}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDownloadReceiptPdf(receiptFormat)}
                data-ocid="order_detail.advance_receipt.download_retry_button"
              >
                Reintentar
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <NotifyCustomerDialog
        open={isNotifyOpen}
        onOpenChange={setIsNotifyOpen}
        customerId={order.customerId}
        customerName={customerName ?? `Cliente #${order.customerId.toString()}`}
        customerEmail={customerEmail}
        source={NotificationSource.order}
        referenceId={order.id}
        defaultSubject={`Estado de tu orden ${order.orderNumber}`}
        defaultMessage={`Hola ${customerName ?? "cliente"}, te informamos el estado actual de tu orden ${order.orderNumber}: ${ORDER_STATUS_LABELS[order.status]}. Si necesitas más detalles sobre la reparación, respóndenos a este correo y con gusto te atendemos.`}
      />
    </div>
  );
}
