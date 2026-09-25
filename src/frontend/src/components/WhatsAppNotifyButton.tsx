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
import { Textarea } from "@/components/ui/textarea";
import {
  useContactDocumentPdf,
  usePrepareWhatsAppMessage,
} from "@/hooks/use-whatsapp";
import type {
  ContactDocument,
  DocumentFormat,
  Id,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, FileText, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface WhatsAppNotifyButtonProps {
  /** Tipo de contacto destinatario: cliente o proveedor. */
  contactKind: WhatsAppContactKind;
  /** Identificador del contacto en el backend. */
  contactId: Id;
  /** Contexto del mensaje: cita, orden, cotización, factura, cobro o servicio. */
  context: WhatsAppContext;
  /** Documento de referencia opcional (orden, cotización, factura o venta). */
  referenceId?: Id;
  /** Nombre visible del contacto, usado en el diálogo. */
  contactName: string;
  /** Etiqueta accesible del botón; por defecto «Enviar por WhatsApp». */
  label?: string;
  /** Variante visual del botón. */
  variant?: "default" | "outline" | "ghost";
  /** Tamaño del botón. */
  size?: "default" | "sm" | "icon";
  /** Clases adicionales para el botón. */
  className?: string;
  /** Identificador determinista del botón. */
  ocid?: string;
  /**
   * Documento imprimible que se adjunta al mensaje. Cuando se proporciona, el
   * diálogo muestra un selector de formato (A4 / Tirilla 80 mm) y, al abrir
   * WhatsApp, genera y descarga el PDF en el formato elegido.
   */
  attachment?: ContactDocument;
}

/** Construye el enlace `wa.me` con el teléfono normalizado y el texto editable. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const FORMATS: Array<{ value: DocumentFormat; label: string }> = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" },
];

/**
 * Botón compartido «Enviar por WhatsApp». Al pulsarlo consulta al backend el
 * teléfono normalizado y el mensaje sugerido, abre un diálogo con el texto
 * editable y, al confirmar, abre WhatsApp en una pestaña nueva con el mensaje
 * prellenado. Se deshabilita con un aviso claro cuando el contacto no tiene
 * teléfono registrado.
 *
 * Cuando se pasa `attachment`, el diálogo permite elegir el formato del
 * documento y, antes de abrir WhatsApp, genera y descarga el PDF de la ficha
 * para que el usuario lo adjunte en la conversación.
 */
export function WhatsAppNotifyButton({
  contactKind,
  contactId,
  context,
  referenceId,
  contactName,
  label = "Enviar por WhatsApp",
  variant = "outline",
  size = "sm",
  className,
  ocid,
  attachment,
}: WhatsAppNotifyButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<DocumentFormat>("a4");
  const [isGenerating, setIsGenerating] = useState(false);

  const prepare = usePrepareWhatsAppMessage();
  const { mutate: prepareMessage } = prepare;
  const { download } = useContactDocumentPdf();

  // Al abrir el diálogo se consulta el backend y se siembra el borrador.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setHasPhone(null);
    setPhone(null);
    setMessage("");
    prepareMessage(
      { contactKind, contactId, context, referenceId },
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
  }, [open, contactKind, contactId, context, referenceId, prepareMessage]);

  function handleOpen() {
    setOpen(true);
  }

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

    // Genera y descarga el PDF antes de abrir WhatsApp para que el archivo
    // esté disponible al adjuntarlo en la conversación.
    if (attachment) {
      setIsGenerating(true);
      try {
        const fileName = await download(attachment, format);
        toast.success(`Documento ${fileName} descargado para adjuntar.`);
      } catch {
        setError(
          "No se pudo generar el PDF del documento. Inténtalo de nuevo.",
        );
        setIsGenerating(false);
        return;
      }
      setIsGenerating(false);
    }

    window.open(
      buildWhatsAppUrl(phone, trimmed),
      "_blank",
      "noopener,noreferrer",
    );
    toast.success(`Abriendo WhatsApp para ${contactName}`);
    setOpen(false);
  }

  const isPreparing = prepare.isPending || hasPhone === null;
  const canSend = hasPhone === true && message.trim() !== "" && !isGenerating;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleOpen}
        aria-label={`${label} a ${contactName}`}
        data-ocid={ocid}
        className={className}
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        {size === "icon" ? null : label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="whatsapp.dialog" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Enviar por WhatsApp
            </DialogTitle>
            <DialogDescription>
              Revisa y edita el mensaje antes de abrir WhatsApp con{" "}
              {contactName}.
            </DialogDescription>
          </DialogHeader>

          {isPreparing ? (
            <div
              data-ocid="whatsapp.loading_state"
              className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Preparando el mensaje…
            </div>
          ) : hasPhone === false ? (
            <div
              data-ocid="whatsapp.no_phone_state"
              className="flex items-start gap-2.5 rounded-md border border-status-overdue/40 bg-status-overdue/10 px-3 py-2.5 text-xs text-status-overdue"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                {contactName} no tiene un teléfono registrado. Registra el
                teléfono del contacto antes de enviar el mensaje por WhatsApp.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp-phone">Teléfono</Label>
                <p
                  id="whatsapp-phone"
                  data-ocid="whatsapp.phone_value"
                  className="data-rail rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground"
                >
                  {phone ?? "—"}
                </p>
              </div>

              {attachment ? (
                <div className="space-y-1.5">
                  <Label>Documento adjunto</Label>
                  <div
                    data-ocid="whatsapp.attachment_panel"
                    className="rounded-md border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <p className="flex items-center gap-2 text-xs text-foreground">
                      <FileText
                        className="size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {attachment.title} · {attachment.number}
                    </p>
                    <fieldset
                      aria-label="Formato del documento adjunto"
                      data-ocid="whatsapp.format_toggle"
                      className="doc-format-toggle mt-2"
                    >
                      {FORMATS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-active={format === option.value}
                          aria-pressed={format === option.value}
                          onClick={() => setFormat(option.value)}
                          data-ocid={`whatsapp.format_${option.value}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </fieldset>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Al abrir WhatsApp se descargará el PDF en este formato
                      para que lo adjuntes en la conversación.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp-message">Mensaje</Label>
                <Textarea
                  id="whatsapp-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={7}
                  data-ocid="whatsapp.message_textarea"
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
              data-ocid="whatsapp.form.error_state"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="whatsapp.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              data-ocid="whatsapp.send_button"
              className={cn("gap-2")}
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
    </>
  );
}
