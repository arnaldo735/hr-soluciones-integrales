import { LaborTechnicianSelect } from "@/components/order/LaborTechnicianSelect";
import { ServicePicker } from "@/components/order/ServicePicker";
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
import { errorMessage, useAddLabor } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/format";
import type { Id, Service } from "@/lib/types";
import { AlertTriangle, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

interface AddLaborDialogProps {
  orderId: Id;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Cents to the editable decimal string used by the price input. */
function centsToInput(cents: bigint): string {
  return (Number(cents) / 100).toFixed(2);
}

export function AddLaborDialog({
  orderId,
  open,
  onOpenChange,
}: AddLaborDialogProps) {
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [technicianId, setTechnicianId] = useState<Id | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const addLabor = useAddLabor();

  // Radix Dialog does not fire onOpenChange when a controlled `open` prop
  // flips, so the draft is reset from an effect keyed on [open].
  useEffect(() => {
    if (open) {
      setDescription("");
      setPrice("");
      setTechnicianId(null);
      setService(null);
      setFormError(null);
    }
  }, [open]);

  const priceValue = Number(price);
  const priceValid =
    price.trim() !== "" && Number.isFinite(priceValue) && priceValue >= 0;
  const descriptionValid = description.trim().length > 0;

  function reset() {
    setDescription("");
    setPrice("");
    setTechnicianId(null);
    setService(null);
    setFormError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleServiceChange(next: Service | null) {
    setService(next);
    setFormError(null);
    if (next) {
      setDescription(`${next.code} · ${next.name}`);
      setPrice(centsToInput(next.laborRate));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!descriptionValid) {
      setFormError("Describe el servicio o la mano de obra realizada.");
      return;
    }
    if (!priceValid) {
      setFormError("Captura un precio válido (mayor o igual a cero).");
      return;
    }

    addLabor.mutate(
      {
        id: orderId,
        labor: {
          description: description.trim(),
          price: BigInt(Math.round(priceValue * 100)),
          technicianId: technicianId ?? undefined,
          serviceId: service?.id ?? undefined,
        },
      },
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
      <DialogContent data-ocid="order_detail.add_labor.modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Wrench className="size-4 text-primary" aria-hidden="true" />
            Agregar mano de obra
          </DialogTitle>
          <DialogDescription>
            Elige un servicio del catálogo para autocompletar la descripción y
            la tarifa, o escribe una línea libre. El precio siempre queda
            editable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <ServicePicker
            id="add-labor-service"
            ocid="order_detail.add_labor.service"
            value={service}
            onChange={handleServiceChange}
            disabled={addLabor.isPending}
          />

          <div className="space-y-2">
            <Label htmlFor="add-labor-description">Descripción</Label>
            <Input
              id="add-labor-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setFormError(null);
              }}
              placeholder="Ej. Cambio de aceite y filtro"
              data-ocid="order_detail.add_labor.description_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-labor-price">Precio (COP)</Label>
            <Input
              id="add-labor-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setFormError(null);
              }}
              placeholder="0.00"
              data-ocid="order_detail.add_labor.price_input"
              className="data-rail"
            />
            {priceValid ? (
              <p className="data-rail text-xs text-muted-foreground">
                {formatMoney(BigInt(Math.round(priceValue * 100)))}
              </p>
            ) : null}
          </div>

          <LaborTechnicianSelect
            id="add-labor-technician"
            ocid="order_detail.add_labor.technician_select"
            value={technicianId}
            onChange={(next) => {
              setTechnicianId(next);
              setFormError(null);
            }}
            activeOnly
            disabled={addLabor.isPending}
          />

          {formError ? (
            <div
              data-ocid="order_detail.add_labor.error_state"
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
              data-ocid="order_detail.add_labor.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addLabor.isPending}
              data-ocid="order_detail.add_labor.submit_button"
            >
              {addLabor.isPending ? "Agregando…" : "Agregar servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
