import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Shift } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Banknote, Landmark, Wallet } from "lucide-react";

interface CashBalancesPanelProps {
  /** The currently open shift, or `null` when the register is closed. */
  shift: Shift | null;
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

/**
 * Caja y Bancos balance panel. Shows the opening balances of the open shift
 * and the computed closing balances the backend derives from the ledger, so
 * the operator always sees how much cash and how much bank money the register
 * currently holds.
 */
export function CashBalancesPanel({
  shift,
  isLoading,
  isError,
}: CashBalancesPanelProps) {
  if (isLoading) {
    return (
      <section
        data-ocid="caja.balances.loading_state"
        aria-label="Saldos de caja y bancos"
        className="grid gap-4 sm:grid-cols-3"
      >
        {Array.from(
          { length: 3 },
          (_, index) => `balance-skeleton-${index}`,
        ).map((id) => (
          <Skeleton key={id} className="h-[104px] w-full rounded-lg" />
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

  if (!shift) {
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
          La caja está cerrada
        </p>
        <p className="max-w-md text-xs text-muted-foreground">
          Abre un turno con el saldo inicial de caja y bancos para empezar a
          registrar movimientos del día.
        </p>
      </section>
    );
  }

  const isOpen = shift.status === "open";

  return (
    <section
      data-ocid="caja.balances.section"
      aria-label="Saldos de caja y bancos"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Turno #{shift.id.toString()} · abierto{" "}
          {formatDateTime(shift.openedAt)}
        </p>
        <StatusBadge
          label={isOpen ? "Turno abierto" : "Turno cerrado"}
          tone={isOpen ? "accepted" : "neutral"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <BalanceTile
          ocid="caja.balances.cash"
          label="Caja (efectivo)"
          value={formatMoney(shift.computedClosingCash)}
          hint={`Saldo inicial ${formatMoney(shift.openingCash)}`}
          icon={<Banknote className="size-4" />}
          accentClass="bg-primary"
        />
        <BalanceTile
          ocid="caja.balances.bank"
          label="Bancos"
          value={formatMoney(shift.computedClosingBank)}
          hint={`Saldo inicial ${formatMoney(shift.openingBank)}`}
          icon={<Landmark className="size-4" />}
          accentClass="bg-info"
        />
        <BalanceTile
          ocid="caja.balances.total"
          label="Total disponible"
          value={formatMoney(
            shift.computedClosingCash + shift.computedClosingBank,
          )}
          hint="Caja más bancos del turno"
          icon={<Wallet className="size-4" />}
          accentClass="bg-accent"
        />
      </div>
    </section>
  );
}
