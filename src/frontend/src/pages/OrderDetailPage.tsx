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
import { Label } from "@/components/ui/label";
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
  useOrder,
  useRemoveLabor,
  useRemoveOrderPart,
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
  downloadWarrantyPdf,
  drawHopeMessage,
  hopeMessageContent,
  loadPdfLibs,
  pdfCompanyFromProfile,
} from "@/lib/pdf";
import type { HopeMessageContent } from "@/lib/pdf";
import { OrderStatus, ServiceSort } from "@/lib/types";
import type {
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
  Id,
  LaborItem,
  Motorcycle,
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
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import type { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Bike,
  Clock,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Package,
  Plus,
  Printer,
  ScanLine,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundPlus,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

/** Formatos de papel del documento de garantía (A4 o tirilla 80 mm). */
const WARRANTY_FORMATS: Array<{ value: DocumentFormat; label: string }> = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" },
];

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [printFormat, setPrintFormat] = useState<DocumentFormat>("a4");
  const [warrantyFormat, setWarrantyFormat] = useState<DocumentFormat>("a4");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isWarrantyDownloading, setIsWarrantyDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [warrantyDownloadError, setWarrantyDownloadError] = useState<
    string | null
  >(null);

  const orderQuery = useOrder(orderId);
  const view = orderQuery.data ?? null;
  const order = view?.order ?? null;

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
  const removePart = useRemoveOrderPart();
  const removeLabor = useRemoveLabor();
  const assignTechnician = useAssignTechnician();
  const unassignTechnician = useUnassignTechnician();
  const updateLaborTechnician = useUpdateLaborTechnician();
  const replaceLaborService = useReplaceLaborService();

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
  ];

  const orderFooter = serviceTermsFooter;
  const orderNumber = order.orderNumber;

  // El documento de garantía se activa cuando alguna línea de mano de obra está
  // vinculada a un servicio de catálogo de motor o cabeza de fuerza. El nombre
  // se resuelve desde el catálogo cargado en la página.
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
              <p className="data-rail text-sm font-medium">
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
