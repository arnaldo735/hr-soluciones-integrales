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
import { useRegisterCashMovement } from "@/hooks/use-cash";
import {
  CashAccount,
  type CashMovementInput,
  CashMovementKind,
  CashMovementSource,
  PaymentMethod,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Banknote, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  accountForPaymentMethod,
  accountLabel,
  movementKindLabel,
  parseAmount,
} from "./cash-labels";

interface CashMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MovementFormState {
  kind: CashMovementKind;
  paymentMethod: PaymentMethod;
  account: CashAccount;
  amount: string;
  description: string;
  reference: string;
}

function emptyForm(): MovementFormState {
  return {
    kind: CashMovementKind.income,
    paymentMethod: PaymentMethod.cash,
    account: CashAccount.cash,
    amount: "",
    description: "",
    reference: "",
  };
}

/**
 * Registers an ingreso or egreso classified by payment method. The account is
 * derived from the method — efectivo affects Caja, transferencia and tarjeta
 * affect Bancos — and can be chosen explicitly for a mixed payment.
 */
export function CashMovementDialog({
  open,
  onOpenChange,
}: CashMovementDialogProps) {
  const [form, setForm] = useState<MovementFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const registerMovement = useRegisterCashMovement();

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);

  function update<K extends keyof MovementFormState>(
    key: K,
    value: MovementFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectPaymentMethod(method: PaymentMethod) {
    const derived = accountForPaymentMethod(method);
    setForm((current) => ({
      ...current,
      paymentMethod: method,
      account: derived ?? current.account,
    }));
  }

  const derivedAccount = accountForPaymentMethod(form.paymentMethod);
  const isMixed = form.paymentMethod === PaymentMethod.mixed;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const description = form.description.trim();
    if (description === "") {
      setError("Describe el movimiento para poder identificarlo.");
      return;
    }
    const amount = parseAmount(form.amount);
    if (amount === null || amount === 0n) {
      setError("Captura un monto válido mayor a cero.");
      return;
    }

    const input: CashMovementInput = {
      kind: form.kind,
      paymentMethod: form.paymentMethod,
      account: form.account,
      amount,
      description,
      reference:
        form.reference.trim() === "" ? undefined : form.reference.trim(),
      source: CashMovementSource.manual,
    };

    setError(null);
    registerMovement.mutate(input, {
      onSuccess: () => {
        toast.success(
          form.kind === CashMovementKind.income
            ? "Ingreso registrado"
            : "Egreso registrado",
        );
        onOpenChange(false);
      },
      onError: (mutationError: Error) => {
        setError(
          mutationError.message ||
            "No se pudo registrar el movimiento. Inténtalo de nuevo.",
        );
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="caja.movement.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Registrar movimiento
          </DialogTitle>
          <DialogDescription>
            Clasifica el movimiento por medio de pago. El efectivo afecta Caja;
            la transferencia y la tarjeta afectan Bancos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Tipo de movimiento</legend>
            <div className="grid grid-cols-2 gap-2">
              {[CashMovementKind.income, CashMovementKind.expense].map(
                (kind) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={form.kind === kind}
                    onClick={() => update("kind", kind)}
                    data-ocid={`caja.movement.kind_${kind}`}
                    className={cn(
                      "flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-smooth",
                      form.kind === kind
                        ? kind === CashMovementKind.income
                          ? "border-success/50 bg-success/10 text-success"
                          : "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-input bg-card text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {movementKindLabel(kind)}
                  </button>
                ),
              )}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="movement-method">Medio de pago</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(value) =>
                  selectPaymentMethod(value as PaymentMethod)
                }
              >
                <SelectTrigger
                  id="movement-method"
                  aria-label="Medio de pago"
                  data-ocid="caja.movement.method_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="movement-amount">Monto (COP)</Label>
              <Input
                id="movement-amount"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => update("amount", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="caja.movement.amount_input"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="movement-account">Cuenta afectada</Label>
            {isMixed ? (
              <Select
                value={form.account}
                onValueChange={(value) =>
                  update("account", value as CashAccount)
                }
              >
                <SelectTrigger
                  id="movement-account"
                  aria-label="Cuenta afectada"
                  data-ocid="caja.movement.account_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CashAccount.cash}>Caja</SelectItem>
                  <SelectItem value={CashAccount.bank}>Bancos</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div
                data-ocid="caja.movement.account_hint"
                className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 text-sm"
              >
                {form.account === CashAccount.cash ? (
                  <Banknote
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <Landmark className="size-4 text-info" aria-hidden="true" />
                )}
                <span className="font-medium">
                  {accountLabel(form.account)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {derivedAccount === CashAccount.cash
                    ? "El efectivo afecta Caja"
                    : "La transferencia y la tarjeta afectan Bancos"}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="movement-description">Descripción</Label>
            <Textarea
              id="movement-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Venta de repuestos, pago de domicilio, consignación…"
              rows={2}
              data-ocid="caja.movement.description_input"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="movement-reference">Referencia (opcional)</Label>
            <Input
              id="movement-reference"
              value={form.reference}
              onChange={(event) => update("reference", event.target.value)}
              placeholder="Número de comprobante o soporte"
              className="data-rail"
              data-ocid="caja.movement.reference_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="caja.movement.error_state"
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
              data-ocid="caja.movement.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registerMovement.isPending}
              data-ocid="caja.movement.submit_button"
            >
              {registerMovement.isPending ? "Registrando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
