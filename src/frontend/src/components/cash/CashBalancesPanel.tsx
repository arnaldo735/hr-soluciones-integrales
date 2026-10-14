import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Shift } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Banknote, Landmark, Wallet } from "lucide-react";

interface CashBalancesPanelProps {
  /** Every open shift, one per caja/banco. */
  shifts: Shift[];
  /** Display name per register id, when known. */
  registerNames: Map<string, string>;
  isLoading: boolean;
  isError: boolean;
}

interface BalanceTileProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  accentClass: string;
  ocid: string;
}

function BalanceTile({
  label,
  value,
  hint,
  icon,
  accentClass,
  ocid,
}: BalanceTileProps) {
  return (
    <Card
      data-ocid={ocid}
      className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none"
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-0.5", accentClass)}
      />
      <CardContent className="space-y-1 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <span className="text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        </div>
        <p className="data-rail text-2xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

interface RegisterBalancesProps {
  shift: Shift;
  registerName: string;
  index: number;
}

/** One card per open shift with its own Caja, Bancos and total balances. */
function RegisterBalances({
  shift,
  registerName,
  index,
}: RegisterBalancesProps) {
  const total = shift.computedClosingCash + shift.computedClosingBank;
  return (
    <Card
      data-ocid={`caja.balances.register.${index + 1}`}
      className="gap-0 overflow-hidden rounded-lg py-0 shadow-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold">
            {registerName}
          </p>
          <p className="data-rail text-[11px] text-muted-foreground">
            Turno #{shift.id.toString()} · {shift.responsibleName || "—"}
          </p>
        </div>
        <StatusBadge label="Turno abierto" tone="accepted" />
      </div>
      <CardContent className="grid gap-4 px-5 py-4 sm:grid-cols-3">
        <BalanceTile
          ocid={`caja.balances.register.${index + 1}.cash`}
          label="Caja (efectivo)"
          value={formatMoney(shift.computedClosingCash)}
          hint={`Saldo inicial ${formatMoney(shift.openingCash)}`}
          icon={<Banknote className="size-4" />}
          accentClass="bg-primary"
        />
        <BalanceTile
          ocid={`caja.balances.register.${index + 1}.bank`}
          label="Bancos"
          value={formatMoney(shift.computedClosingBank)}
          hint={`Saldo inicial ${formatMoney(shift.openingBank)}`}
          icon={<Landmark className="size-4" />}
          accentClass="bg-info"
        />
        <BalanceTile
          ocid={`caja.balances.register.${index + 1}.total`}
          label="Total disponible"
          value={formatMoney(total)}
          hint="Caja más bancos del turno"
          icon={<Wallet className="size-4" />}
          accentClass="bg-accent"
        />
      </CardContent>
    </Card>
  );
}

/**
 * Caja y Bancos balance panel. Shows one card per open shift with the opening
 * balances and the computed closing balances the backend derives from the
 * ledger, so the operator always sees how much cash and how much bank money
 * each caja/banco currently holds.
 */
export function CashBalancesPanel({
  shifts,
  registerNames,
  isLoading,
  isError,
}: CashBalancesPanelProps) {
  if (isLoading) {
    return (
      <section
        data-ocid="caja.balances.loading_state"
        aria-label="Saldos de caja y bancos"
        className="space-y-4"
      >
        {Array.from(
          { length: 2 },
          (_, index) => `balance-skeleton-${index}`,
        ).map((id) => (
          <Skeleton key={id} className="h-[180px] w-full rounded-lg" />
        ))}
      </section>
    );
  }

  if (isError) {
    return (
      <section
        data-ocid="caja.balances.error_state"
        aria-label="Saldos de caja y bancos"
        className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        No se pudieron cargar los saldos de caja y bancos.
      </section>
    );
  }

  if (shifts.length === 0) {
    return (
      <section
        data-ocid="caja.balances.closed_state"
        aria-label="Saldos de caja y bancos"
        className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-6 py-8 text-center"
      >
        <div className="flex size-11 items-center justify-center rounded-md border border-border bg-card">
          <Wallet className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="font-display text-sm font-semibold">
          No hay turnos abiertos
        </p>
        <p className="max-w-md text-xs text-muted-foreground">
          Abre un turno en una caja o banco con su saldo inicial para empezar a
          registrar movimientos del día.
        </p>
      </section>
    );
  }

  const grandTotal = shifts.reduce(
    (sum, shift) => sum + shift.computedClosingCash + shift.computedClosingBank,
    0n,
  );

  return (
    <section
      data-ocid="caja.balances.section"
      aria-label="Saldos de caja y bancos"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {shifts.length} turno{shifts.length === 1 ? "" : "s"} abierto
          {shifts.length === 1 ? "" : "s"} · Total disponible{" "}
          {formatMoney(grandTotal)}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {shifts.length} turno{shifts.length === 1 ? "" : "s"} · Saldos
          calculados en vivo
        </p>
      </div>

      <div className="space-y-4">
        {shifts.map((shift, index) => (
          <RegisterBalances
            key={shift.id.toString()}
            shift={shift}
            registerName={
              registerNames.get(shift.registerId.toString()) ??
              `Caja #${shift.registerId.toString()}`
            }
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
