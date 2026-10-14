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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCashRegister, useUpdateCashRegister } from "@/hooks/use-cash";
import type {
  CashRegister,
  CashRegisterInput,
  CashRegisterKind,
} from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CASH_REGISTER_KIND_LABELS,
  CASH_REGISTER_KIND_OPTIONS,
  centsToInput,
  parseAmount,
} from "./cash-labels";

interface CashRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Register being edited; `null` creates a new one. */
  register: CashRegister | null;
}

interface CashRegisterFormState {
  name: string;
  kind: CashRegisterKind;
  openingBalance: string;
}

function emptyForm(): CashRegisterFormState {
  return {
    name: "",
    kind: CASH_REGISTER_KIND_OPTIONS[0],
    openingBalance: "",
  };
}

/**
 * Creates or edits a caja/banco: nombre, tipo (Caja/Banco) y saldo inicial en
 * COP. The backend rejects duplicate names, so the Spanish trap is surfaced
 * verbatim when the save fails.
 */
export function CashRegisterDialog({
  open,
  onOpenChange,
  register,
}: CashRegisterDialogProps) {
  const [form, setForm] = useState<CashRegisterFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const createRegister = useCreateCashRegister();
  const updateRegister = useUpdateCashRegister();
  const isEditing = register !== null;
  const isPending = createRegister.isPending || updateRegister.isPending;

  useEffect(() => {
    if (!open) return;
    if (register) {
      setForm({
        name: register.name,
        kind: register.kind,
        openingBalance: centsToInput(register.openingBalance),
      });
    } else {
      setForm(emptyForm());
    }
    setError(null);
  }, [open, register]);

  function update<K extends keyof CashRegisterFormState>(
    key: K,
    value: CashRegisterFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (name === "") {
      setError("Escribe el nombre de la caja o banco.");
      return;
    }
    const openingBalance = parseAmount(form.openingBalance);
    if (openingBalance === null) {
      setError("Captura el saldo inicial en COP (puede ser 0).");
      return;
    }

    const input: CashRegisterInput = {
      name,
      kind: form.kind,
      openingBalance,
    };

    setError(null);
    const onSuccess = () => {
      toast.success(
        isEditing ? "Caja o banco actualizado" : "Caja o banco creado",
      );
      onOpenChange(false);
    };
    const onError = (mutationError: Error) => {
      setError(
        mutationError.message ||
          "No se pudo guardar la caja o banco. Intenta de nuevo.",
      );
    };

    if (register) {
      updateRegister.mutate(
        { registerId: register.id, input },
        { onSuccess, onError },
      );
    } else {
      createRegister.mutate(input, { onSuccess, onError });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="caja.registers.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar caja o banco" : "Nueva caja o banco"}
          </DialogTitle>
          <DialogDescription>
            Define el nombre, el tipo y el saldo inicial en pesos colombianos.
            El saldo inicial es la base para calcular los turnos de este
            registro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="register-name">Nombre</Label>
            <Input
              id="register-name"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Caja principal, Banco Bogotá…"
              maxLength={80}
              data-ocid="caja.registers.name_input"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="register-kind">Tipo</Label>
              <Select
                value={form.kind}
                onValueChange={(value) =>
                  update("kind", value as CashRegisterKind)
                }
              >
                <SelectTrigger
                  id="register-kind"
                  aria-label="Tipo de caja o banco"
                  data-ocid="caja.registers.kind_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASH_REGISTER_KIND_OPTIONS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {CASH_REGISTER_KIND_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="register-opening">Saldo inicial (COP)</Label>
              <Input
                id="register-opening"
                inputMode="decimal"
                value={form.openingBalance}
                onChange={(event) =>
                  update("openingBalance", event.target.value)
                }
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.registers.opening_balance_input"
                required
              />
            </div>
          </div>

          {error ? (
            <p
              data-ocid="caja.registers.error_state"
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
              data-ocid="caja.registers.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="caja.registers.submit_button"
            >
              {isPending
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Crear caja o banco"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
