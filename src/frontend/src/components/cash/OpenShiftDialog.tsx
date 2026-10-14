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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useCashRegisters, useOpenShiftMutation } from "@/hooks/use-cash";
import type { CashRegisterKind, Id, OpenShiftInput } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cashRegisterKindLabel, parseAmount } from "./cash-labels";

interface OpenShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OpenShiftFormState {
  registerId: string;
  responsibleName: string;
  responsibleUserId: string;
  openingCash: string;
  openingBank: string;
  notes: string;
}

function emptyForm(): OpenShiftFormState {
  return {
    registerId: "",
    responsibleName: "",
    responsibleUserId: "",
    openingCash: "",
    openingBank: "",
    notes: "",
  };
}

/**
 * Opens a shift on a chosen caja/banco with its declared opening balance and an
 * assigned responsible. Several registers can have an open shift at once, but
 * the backend rejects a second open shift on the same register.
 */
export function OpenShiftDialog({ open, onOpenChange }: OpenShiftDialogProps) {
  const [form, setForm] = useState<OpenShiftFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const openShift = useOpenShiftMutation();
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  const registersQuery = useCashRegisters({
    kind: null,
    active: true,
    search: "",
    offset: 0,
    limit: 100,
  });

  const usersQuery = useQuery({
    queryKey: ["users-page", "", 1],
    queryFn: async () => {
      if (!actor) return { items: [], total: 0n, offset: 0n, limit: 0n };
      return actor.listUsersPage(token, null, 0n, 100n);
    },
    enabled: !!actor && !isFetching,
  });

  const registers = useMemo(
    () => registersQuery.data?.items ?? [],
    [registersQuery.data],
  );
  const users = useMemo(
    () => (usersQuery.data?.items ?? []).filter((user) => user.active),
    [usersQuery.data],
  );

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

  const selectedRegister = registers.find(
    (register) => register.id.toString() === form.registerId,
  );
  const registerKind: CashRegisterKind | null = selectedRegister?.kind ?? null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.registerId === "") {
      setError("Elige la caja o banco donde abrirás el turno.");
      return;
    }
    const responsibleName = form.responsibleName.trim();
    if (responsibleName === "") {
      setError("Asigna un responsable del turno.");
      return;
    }
    // Only the balance that applies to the register kind is required; the
    // other one is sent as 0 and never blocks saving.
    const cashApplies = registerKind !== "bank";
    const bankApplies = registerKind !== "cash";
    const openingCash = cashApplies ? parseAmount(form.openingCash) : 0n;
    const openingBank = bankApplies ? parseAmount(form.openingBank) : 0n;
    if (cashApplies && openingCash === null) {
      setError("Captura el saldo inicial de caja (puede ser 0).");
      return;
    }
    if (bankApplies && openingBank === null) {
      setError("Captura el saldo inicial de bancos (puede ser 0).");
      return;
    }

    const input: OpenShiftInput = {
      registerId: BigInt(form.registerId),
      responsibleName,
      responsibleUserId:
        form.responsibleUserId === ""
          ? undefined
          : BigInt(form.responsibleUserId),
      openingCash: openingCash ?? 0n,
      openingBank: openingBank ?? 0n,
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
            "No se pudo abrir el turno. Verifica que la caja o banco no tenga ya un turno abierto.",
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
            Elige la caja o banco, asigna el responsable y declara el saldo
            inicial. Puedes tener varios turnos abiertos, uno por caja o banco.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="open-register">Caja o banco</Label>
            <Select
              value={form.registerId}
              onValueChange={(value) => update("registerId", value)}
            >
              <SelectTrigger
                id="open-register"
                aria-label="Caja o banco"
                data-ocid="caja.open_shift.register_select"
              >
                <SelectValue placeholder="Elige una caja o banco" />
              </SelectTrigger>
              <SelectContent>
                {registers.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No hay cajas o bancos activos
                  </SelectItem>
                ) : (
                  registers.map((register) => (
                    <SelectItem
                      key={register.id.toString()}
                      value={register.id.toString()}
                    >
                      {register.name} · {cashRegisterKindLabel(register.kind)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="open-responsible">Responsable del turno</Label>
            <Select
              value={form.responsibleUserId}
              onValueChange={(value) => {
                if (value === "__free__") {
                  update("responsibleUserId", "");
                  return;
                }
                const user = users.find(
                  (candidate) => candidate.id.toString() === value,
                );
                setForm((current) => ({
                  ...current,
                  responsibleUserId: value,
                  responsibleName: user?.name ?? current.responsibleName,
                }));
              }}
            >
              <SelectTrigger
                id="open-responsible"
                aria-label="Responsable del turno"
                data-ocid="caja.open_shift.responsible_select"
              >
                <SelectValue placeholder="Elige un usuario o escribe un nombre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__free__">
                  Escribir un nombre libre
                </SelectItem>
                {users.map((user) => (
                  <SelectItem
                    key={user.id.toString()}
                    value={user.id.toString()}
                  >
                    {user.name} · {user.roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="open-responsible-name"
              value={form.responsibleName}
              onChange={(event) =>
                update("responsibleName", event.target.value)
              }
              placeholder="Nombre del responsable"
              data-ocid="caja.open_shift.responsible_input"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="open-cash">
                Saldo inicial en caja (COP)
                {registerKind === "bank" ? (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (no aplica)
                  </span>
                ) : null}
              </Label>
              <Input
                id="open-cash"
                inputMode="decimal"
                value={form.openingCash}
                onChange={(event) => update("openingCash", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.open_shift.cash_input"
                required={registerKind !== "bank"}
                disabled={registerKind === "bank"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="open-bank">
                Saldo inicial en bancos (COP)
                {registerKind === "cash" ? (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    (no aplica)
                  </span>
                ) : null}
              </Label>
              <Input
                id="open-bank"
                inputMode="decimal"
                value={form.openingBank}
                onChange={(event) => update("openingBank", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.open_shift.bank_input"
                required={registerKind !== "cash"}
                disabled={registerKind === "cash"}
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
