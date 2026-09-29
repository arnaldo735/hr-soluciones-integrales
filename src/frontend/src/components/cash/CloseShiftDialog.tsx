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
import { useCloseShift } from "@/hooks/use-cash";
import { formatMoney } from "@/lib/format";
import type { CloseShiftInput, Shift } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { centsToInput, parseAmount } from "./cash-labels";

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The open shift being closed. */
  shift: Shift;
}

interface CloseShiftFormState {
  declaredClosingCash: string;
  declaredClosingBank: string;
  notes: string;
}

function initialForm(shift: Shift): CloseShiftFormState {
  return {
    declaredClosingCash: centsToInput(shift.computedClosingCash),
    declaredClosingBank: centsToInput(shift.computedClosingBank),
    notes: "",
  };
}

interface DifferenceRowProps {
  label: string;
  computed: bigint;
  declared: bigint | null;
  difference: bigint | null;
  ocid: string;
}

function DifferenceRow({
  label,
  computed,
  declared,
  difference,
  ocid,
}: DifferenceRowProps) {
  const tone =
    difference === null || difference === 0n
      ? "text-muted-foreground"
      : difference > 0n
        ? "text-success"
        : "text-destructive";
  return (
    <div
      data-ocid={ocid}
      className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4 text-right">
        <span className="data-rail text-xs text-muted-foreground">
          Sistema {formatMoney(computed)}
        </span>
        <span className="data-rail text-sm font-medium">
          {declared === null ? "—" : formatMoney(declared)}
        </span>
        <span className={cn("data-rail w-24 text-sm font-semibold", tone)}>
          {difference === null
            ? "—"
            : `${difference > 0n ? "+" : ""}${formatMoney(difference)}`}
        </span>
      </div>
    </div>
  );
}

/**
 * Closes the open shift with the declared closing balances of Caja and Bancos.
 * The computed balances come from the backend ledger; the difference between
 * the declared and the computed amount is shown live before confirming.
 */
export function CloseShiftDialog({
  open,
  onOpenChange,
  shift,
}: CloseShiftDialogProps) {
  const [form, setForm] = useState<CloseShiftFormState>(() =>
    initialForm(shift),
  );
  const [error, setError] = useState<string | null>(null);
  const closeShift = useCloseShift();

  useEffect(() => {
    if (open) {
      setForm(initialForm(shift));
      setError(null);
    }
  }, [open, shift]);

  function update<K extends keyof CloseShiftFormState>(
    key: K,
    value: CloseShiftFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const declaredCash = parseAmount(form.declaredClosingCash);
  const declaredBank = parseAmount(form.declaredClosingBank);
  const differenceCash =
    declaredCash === null ? null : declaredCash - shift.computedClosingCash;
  const differenceBank =
    declaredBank === null ? null : declaredBank - shift.computedClosingBank;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (declaredCash === null) {
      setError("Captura el saldo final declarado de caja.");
      return;
    }
    if (declaredBank === null) {
      setError("Captura el saldo final declarado de bancos.");
      return;
    }

    const input: CloseShiftInput = {
      declaredClosingCash: declaredCash,
      declaredClosingBank: declaredBank,
      notes: form.notes.trim() === "" ? undefined : form.notes.trim(),
    };

    setError(null);
    closeShift.mutate(
      { shiftId: shift.id, input },
      {
        onSuccess: () => {
          toast.success("Turno cerrado");
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setError(
            mutationError.message ||
              "No se pudo cerrar el turno. Inténtalo de nuevo.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="caja.close_shift.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Cerrar turno de caja
          </DialogTitle>
          <DialogDescription>
            Declara el saldo final contado en caja y en bancos. La diferencia se
            calcula contra el saldo que el sistema registró en el turno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="close-cash">
                Saldo final declarado en caja (COP)
              </Label>
              <Input
                id="close-cash"
                inputMode="decimal"
                value={form.declaredClosingCash}
                onChange={(event) =>
                  update("declaredClosingCash", event.target.value)
                }
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.close_shift.cash_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close-bank">
                Saldo final declarado en bancos (COP)
              </Label>
              <Input
                id="close-bank"
                inputMode="decimal"
                value={form.declaredClosingBank}
                onChange={(event) =>
                  update("declaredClosingBank", event.target.value)
                }
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.close_shift.bank_input"
                required
              />
            </div>
          </div>

          <div
            data-ocid="caja.close_shift.differences"
            className="rounded-lg border border-border bg-muted/30 px-4 py-2"
          >
            <div className="flex items-center justify-between gap-3 pb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Cuenta
              </span>
              <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>Sistema</span>
                <span>Declarado</span>
                <span className="w-24 text-right">Diferencia</span>
              </div>
            </div>
            <DifferenceRow
              ocid="caja.close_shift.difference_cash"
              label="Caja (efectivo)"
              computed={shift.computedClosingCash}
              declared={declaredCash}
              difference={differenceCash}
            />
            <DifferenceRow
              ocid="caja.close_shift.difference_bank"
              label="Bancos"
              computed={shift.computedClosingBank}
              declared={declaredBank}
              difference={differenceBank}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="close-notes">Notas (opcional)</Label>
            <Textarea
              id="close-notes"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Explica cualquier diferencia detectada al cerrar"
              rows={2}
              data-ocid="caja.close_shift.notes_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="caja.close_shift.error_state"
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
              data-ocid="caja.close_shift.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={closeShift.isPending}
              data-ocid="caja.close_shift.submit_button"
            >
              {closeShift.isPending ? "Cerrando…" : "Cerrar turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
