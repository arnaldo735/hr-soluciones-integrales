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
import { Textarea } from "@/components/ui/textarea";
import { useNotifyCustomer } from "@/hooks/use-notifications";
import type {
  CustomerNotificationInput,
  Id,
  NotificationSource,
} from "@/lib/types";
import { AlertTriangle, Loader2, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NotifyCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cliente destinatario de la notificación. */
  customerId: Id;
  /** Nombre visible del cliente, usado en el encabezado del diálogo. */
  customerName: string;
  /** Correo registrado del cliente; `null` cuando no tiene uno. */
  customerEmail: string | null;
  /** Módulo desde el que se envía la notificación. */
  source: NotificationSource;
  /** Documento de referencia (orden, cotización, factura o venta). */
  referenceId?: Id;
  /** Asunto prellenado, editable por el usuario. */
  defaultSubject: string;
  /** Mensaje de estado prellenado, editable por el usuario. */
  defaultMessage: string;
}

/**
 * Diálogo compartido de notificación al cliente. El asunto y el mensaje llegan
 * prellenados y son editables; el destinatario se toma del correo registrado y
 * el envío queda bloqueado cuando el cliente no tiene correo.
 */
export function NotifyCustomerDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerEmail,
  source,
  referenceId,
  defaultSubject,
  defaultMessage,
}: NotifyCustomerDialogProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const notifyCustomer = useNotifyCustomer();
  const hasEmail = customerEmail !== null && customerEmail.trim() !== "";

  // Siembra el borrador cada vez que el diálogo se abre para un destinatario.
  useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setError(null);
      setSentTo(null);
    }
  }, [open, defaultSubject, defaultMessage]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasEmail) return;

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (trimmedSubject === "" || trimmedMessage === "") {
      setError("El asunto y el mensaje son obligatorios.");
      return;
    }
    setError(null);

    const input: CustomerNotificationInput = {
      customerId,
      source,
      referenceId,
      subject: trimmedSubject,
      message: trimmedMessage,
    };

    notifyCustomer.mutate(input, {
      onSuccess: (result) => {
        if (!result.sent) {
          setSentTo(null);
          setError("No se pudo enviar la notificación.");
          return;
        }
        setError(null);
        setSentTo(result.email);
        toast.success(`Notificación enviada a ${result.email}`);
      },
      onError: () => {
        setSentTo(null);
        setError("No se pudo enviar la notificación.");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="notify.dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            Notificar al cliente
          </DialogTitle>
          <DialogDescription>
            Envía el estado del servicio a {customerName} por correo.
          </DialogDescription>
        </DialogHeader>

        {hasEmail ? (
          <div className="space-y-1.5">
            <Label htmlFor="notify-recipient">Destinatario</Label>
            <Input
              id="notify-recipient"
              value={customerEmail ?? ""}
              readOnly
              className="data-rail"
              data-ocid="notify.recipient_input"
            />
          </div>
        ) : (
          <div
            data-ocid="notify.no_email_state"
            className="flex items-start gap-2.5 rounded-md border border-status-overdue/40 bg-status-overdue/10 px-3 py-2.5 text-xs text-status-overdue"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              {customerName} no tiene un correo registrado. Registra el correo
              del cliente antes de enviar la notificación.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="notify-subject">Asunto</Label>
            <Input
              id="notify-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={!hasEmail}
              data-ocid="notify.subject_input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notify-message">Mensaje</Label>
            <Textarea
              id="notify-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              disabled={!hasEmail}
              data-ocid="notify.message_textarea"
            />
          </div>

          {error ? (
            <p
              data-ocid="notify.form.error_state"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          ) : null}

          {sentTo ? (
            <p
              data-ocid="notify.success_state"
              className="flex items-center gap-2 rounded-md border border-status-settled/40 bg-status-settled/10 px-3 py-2 text-xs text-status-settled"
            >
              <MailCheck className="size-4 shrink-0" aria-hidden="true" />
              Notificación enviada a {sentTo}.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="notify.cancel_button"
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={!hasEmail || notifyCustomer.isPending}
              data-ocid="notify.submit_button"
            >
              {notifyCustomer.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Enviar notificación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
