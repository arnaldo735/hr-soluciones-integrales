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
import { useOpenShiftMutation } from "@/hooks/use-cash";
import type { OpenShiftInput } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseAmount } from "./cash-labels";

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OpenShiftFormState {
  openingCash: string;
  openingBank: string;
  notes: string;
}

function emptyForm(): OpenShiftFormState {
  return { openingCash: "", openingBank: "", notes: "" };
}

/**
 * Opens a cash shift with the declared opening balances of Caja and Bancos.
 * The backend rejects a second open shift, so the caller blocks this dialog
 * while a shift is already open.
 */
export function OpenShiftDialog({ open, onOpenChange }: OpenShiftDialogProps) {
  const [form, setForm] = useState<OpenShiftFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const openShift = useOpenShiftMutation();

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);

  function update<K extends keyof OpenShiftFormState>(
    key: K,
    value: OpenShiftFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const openingCash = parseAmount(form.openingCash);
    const openingBank = parseAmount(form.openingBank);
    if (openingCash === null) {
      setError("Captura el saldo inicial de caja (puede ser 0).");
      return;
    }
    if (openingBank === null) {
      setError("Captura el saldo inicial de bancos (puede ser 0).");
      return;
    }

    const input: OpenShiftInput = {
      openingCash,
      openingBank,
      notes: form.notes.trim() === "" ? undefined : form.notes.trim(),
    };

    setError(null);
    openShift.mutate(input, {
      onSuccess: () => {
        toast.success("Turno abierto");
        onOpenChange(false);
      },
      onError: (mutationError: Error) => {
        setError(
          mutationError.message ||
            "No se pudo abrir el turno. Verifica que no haya otro turno abierto.",
        );
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="caja.open_shift.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Abrir turno de caja
          </DialogTitle>
          <DialogDescription>
            Declara el saldo inicial de efectivo en caja y de dinero en bancos.
            Estos saldos son la base para calcular el cierre del turno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="open-cash">Saldo inicial en caja (COP)</Label>
              <Input
                id="open-cash"
                inputMode="decimal"
                value={form.openingCash}
                onChange={(event) => update("openingCash", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.open_shift.cash_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="open-bank">Saldo inicial en bancos (COP)</Label>
              <Input
                id="open-bank"
                inputMode="decimal"
                value={form.openingBank}
                onChange={(event) => update("openingBank", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.open_shift.bank_input"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="open-notes">Notas (opcional)</Label>
            <Textarea
              id="open-notes"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Observaciones de la apertura del turno"
              rows={2}
              data-ocid="caja.open_shift.notes_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="caja.open_shift.error_state"
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
              data-ocid="caja.open_shift.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={openShift.isPending}
              data-ocid="caja.open_shift.submit_button"
            >
              {openShift.isPending ? "Abriendo…" : "Abrir turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
