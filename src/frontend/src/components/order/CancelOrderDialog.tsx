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
import { errorMessage, useCancelOrder } from "@/hooks/use-orders";
import type { Id } from "@/lib/types";
import { AlertTriangle, Ban } from "lucide-react";
import { useState } from "react";

interface CancelOrderDialogProps {
  orderId: Id;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Cancels a workshop order. The reason is mandatory: the confirm action stays
 * disabled until the user types one, and the backend rejects an empty reason.
 */
export function CancelOrderDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const cancelOrder = useCancelOrder();

  const reasonValid = reason.trim().length > 0;

  function reset() {
    setReason("");
    setFormError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!reasonValid) {
      setFormError("Indica el motivo de la cancelación.");
      return;
    }

    cancelOrder.mutate(
      { id: orderId, reason: reason.trim() },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => setFormError(errorMessage(error)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-ocid="order_detail.cancel_order.modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Ban className="size-4 text-destructive" aria-hidden="true" />
            Cancelar la orden {orderNumber}
          </DialogTitle>
          <DialogDescription>
            La orden cancelada deja de ser facturable y sale de los flujos
            activos del taller. El motivo queda registrado en el historial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-order-reason">
              Motivo de la cancelación
            </Label>
            <Textarea
              id="cancel-order-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setFormError(null);
              }}
              rows={3}
              placeholder="Ej. El cliente desistió de la reparación."
              data-ocid="order_detail.cancel_order.reason_textarea"
            />
            <p className="text-xs text-muted-foreground">
              El motivo es obligatorio.
            </p>
          </div>

          {formError ? (
            <div
              data-ocid="order_detail.cancel_order.error_state"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-xs text-destructive">{formError}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-ocid="order_detail.cancel_order.dismiss_button"
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reasonValid || cancelOrder.isPending}
              data-ocid="order_detail.cancel_order.confirm_button"
            >
              {cancelOrder.isPending ? "Cancelando…" : "Cancelar orden"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
