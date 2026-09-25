import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorMessage, useDeleteOrder } from "@/hooks/use-orders";
import type { Id } from "@/lib/types";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteOrderDialogProps {
  orderId: Id;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the order is deleted, e.g. to navigate back to the list. */
  onDeleted?: () => void;
}

/**
 * Permanently deletes a workshop order. The confirmation is explicit and warns
 * that the action is irreversible; the deletion is recorded in the history.
 */
export function DeleteOrderDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onDeleted,
}: DeleteOrderDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const deleteOrder = useDeleteOrder();

  function handleOpenChange(next: boolean) {
    if (!next) setFormError(null);
    onOpenChange(next);
  }

  function handleConfirm() {
    setFormError(null);
    deleteOrder.mutate(orderId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-ocid="order_detail.delete_order.modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Trash2 className="size-4 text-destructive" aria-hidden="true" />
            Eliminar la orden {orderNumber}
          </DialogTitle>
          <DialogDescription>
            Esta acción es irreversible. La orden, sus repuestos, su mano de
            obra y su evidencia fotográfica se eliminan de forma permanente y la
            operación queda registrada en el historial.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <div
            data-ocid="order_detail.delete_order.error_state"
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
            data-ocid="order_detail.delete_order.dismiss_button"
          >
            Conservar orden
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteOrder.isPending}
            data-ocid="order_detail.delete_order.confirm_button"
          >
            {deleteOrder.isPending ? "Eliminando…" : "Eliminar definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
