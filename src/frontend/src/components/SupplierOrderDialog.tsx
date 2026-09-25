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
import { useCreateSupplierOrder } from "@/hooks/use-supplier-orders";
import { ClipboardList } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SupplierOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: bigint;
}

function parseQuantity(value: string): bigint | null {
  const normalized = value.trim();
  if (normalized === "") return null;
  const quantity = Number(normalized);
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  return BigInt(quantity);
}

/**
 * Pedido a proveedor con únicamente cantidad, SKU y descripción.
 * Guarda el pedido y lo deja disponible en el detalle del proveedor.
 */
export function SupplierOrderDialog({
  open,
  onOpenChange,
  supplierId,
}: SupplierOrderDialogProps) {
  const [quantity, setQuantity] = useState("1");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createSupplierOrder = useCreateSupplierOrder();

  function handleOpenChange(next: boolean) {
    if (next) {
      setQuantity("1");
      setSku("");
      setDescription("");
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedQuantity = parseQuantity(quantity);
    if (parsedQuantity === null) {
      setError("La cantidad debe ser un número entero mayor a cero.");
      return;
    }
    const trimmedSku = sku.trim();
    if (trimmedSku === "") {
      setError("Ingresa el SKU del repuesto solicitado.");
      return;
    }
    const trimmedDescription = description.trim();
    if (trimmedDescription === "") {
      setError("Ingresa una descripción del pedido.");
      return;
    }
    setError(null);
    createSupplierOrder.mutate(
      {
        supplierId,
        quantity: parsedQuantity,
        sku: trimmedSku,
        description: trimmedDescription,
      },
      {
        onSuccess: () => {
          toast.success("Pedido a proveedor guardado");
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setError(
            mutationError.message ||
              "No se pudo guardar el pedido. Revisa los datos e inténtalo de nuevo.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="supplier_order.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Pedido a proveedor</DialogTitle>
          <DialogDescription>
            Registra un pedido con la cantidad, el SKU y la descripción del
            repuesto que necesitas solicitar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supplier-order-quantity">Cantidad</Label>
            <Input
              id="supplier-order-quantity"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              inputMode="numeric"
              placeholder="10"
              data-ocid="supplier_order.quantity_input"
              className="data-rail"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supplier-order-sku">SKU</Label>
            <Input
              id="supplier-order-sku"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="FIL-ACE-10W40"
              data-ocid="supplier_order.sku_input"
              className="data-rail"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supplier-order-description">Descripción</Label>
            <Textarea
              id="supplier-order-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Filtro de aceite para motos 150cc…"
              data-ocid="supplier_order.description_input"
              rows={3}
              required
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
            <ClipboardList
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              El pedido queda registrado en el detalle del proveedor para
              hacerle seguimiento a la solicitud.
            </p>
          </div>

          {error ? (
            <p
              data-ocid="supplier_order.error"
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
              data-ocid="supplier_order.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createSupplierOrder.isPending}
              data-ocid="supplier_order.submit_button"
            >
              {createSupplierOrder.isPending ? "Guardando…" : "Guardar pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
