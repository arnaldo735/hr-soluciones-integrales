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
  useCreateMotorcycle,
  useUpdateMotorcycle,
} from "@/hooks/use-customers";
import type { Id, Motorcycle, MotorcycleInput } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MotorcycleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: Id;
  /** Existing motorcycle to edit, or `null` to register a new one. */
  motorcycle: Motorcycle | null;
}

interface FormState {
  plate: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
}

const EMPTY_FORM: FormState = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  mileage: "",
};

function toFormState(motorcycle: Motorcycle | null): FormState {
  if (!motorcycle) return EMPTY_FORM;
  return {
    plate: motorcycle.plate,
    brand: motorcycle.brand,
    model: motorcycle.model,
    year: motorcycle.year.toString(),
    mileage: motorcycle.mileage.toString(),
  };
}

/**
 * Create/edit dialog for a motorcycle owned by a customer. The draft lives in
 * local state and is seeded once when the dialog opens for an existing bike.
 */
export function MotorcycleFormDialog({
  open,
  onOpenChange,
  customerId,
  motorcycle,
}: MotorcycleFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const createMotorcycle = useCreateMotorcycle();
  const updateMotorcycle = useUpdateMotorcycle();
  const isEditing = motorcycle !== null;
  const isPending = createMotorcycle.isPending || updateMotorcycle.isPending;

  useEffect(() => {
    if (open) {
      setForm(toFormState(motorcycle));
      setError(null);
    }
  }, [open, motorcycle]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plate = form.plate.trim().toUpperCase();
    const brand = form.brand.trim();
    const model = form.model.trim();
    const year = Number.parseInt(form.year, 10);
    const mileage = Number.parseInt(form.mileage, 10);

    if (plate === "" || brand === "" || model === "") {
      setError("La placa, la marca y el modelo son obligatorios.");
      return;
    }
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      setError("Indica un año válido de 4 dígitos.");
      return;
    }
    if (!Number.isFinite(mileage) || mileage < 0) {
      setError("El kilometraje debe ser un número mayor o igual a cero.");
      return;
    }
    setError(null);

    const input: MotorcycleInput = {
      customerId,
      plate,
      brand,
      model,
      year: BigInt(year),
      mileage: BigInt(mileage),
    };

    if (isEditing && motorcycle) {
      updateMotorcycle.mutate(
        { id: motorcycle.id, input },
        {
          onSuccess: () => {
            toast.success("Moto actualizada");
            onOpenChange(false);
          },
          onError: () => setError("No se pudo guardar la moto."),
        },
      );
      return;
    }

    createMotorcycle.mutate(input, {
      onSuccess: () => {
        toast.success("Moto registrada");
        onOpenChange(false);
      },
      onError: () => setError("No se pudo guardar la moto."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="motorcycle.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar moto" : "Nueva moto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos de la motocicleta."
              : "Registra una motocicleta para este cliente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="motorcycle-plate">Placa</Label>
              <Input
                id="motorcycle-plate"
                value={form.plate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    plate: event.target.value,
                  }))
                }
                placeholder="ABC-123-A"
                className="data-rail uppercase"
                data-ocid="motorcycle.plate_input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motorcycle-year">Año</Label>
              <Input
                id="motorcycle-year"
                value={form.year}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    year: event.target.value,
                  }))
                }
                placeholder="2021"
                inputMode="numeric"
                className="data-rail"
                data-ocid="motorcycle.year_input"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="motorcycle-brand">Marca</Label>
              <Input
                id="motorcycle-brand"
                value={form.brand}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    brand: event.target.value,
                  }))
                }
                placeholder="Italika"
                data-ocid="motorcycle.brand_input"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motorcycle-model">Modelo</Label>
              <Input
                id="motorcycle-model"
                value={form.model}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    model: event.target.value,
                  }))
                }
                placeholder="FT150"
                data-ocid="motorcycle.model_input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="motorcycle-mileage">Kilometraje</Label>
            <Input
              id="motorcycle-mileage"
              value={form.mileage}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  mileage: event.target.value,
                }))
              }
              placeholder="18450"
              inputMode="numeric"
              className="data-rail"
              data-ocid="motorcycle.mileage_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="motorcycle.form.error_state"
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
              data-ocid="motorcycle.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="motorcycle.submit_button"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isEditing ? "Guardar cambios" : "Registrar moto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
