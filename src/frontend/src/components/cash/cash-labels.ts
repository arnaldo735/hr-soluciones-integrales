import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  PaymentMethod,
} from "@/lib/types";

/** Spanish label for a payment method. */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.mixed]: "Mixto",
};

/** Payment methods offered when registering a cash movement. */
export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  PaymentMethod.cash,
  PaymentMethod.transfer,
  PaymentMethod.card,
  PaymentMethod.mixed,
];

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method;
}

/** Spanish label for a cash movement kind. */
export function movementKindLabel(kind: CashMovementKind): string {
  return kind === CashMovementKind.income ? "Ingreso" : "Egreso";
}

/** Spanish label for the account a movement affects. */
export function accountLabel(account: CashAccount): string {
  return account === CashAccount.cash ? "Caja" : "Bancos";
}

/** Spanish label for the origin of a movement. */
export function movementSourceLabel(source: CashMovementSource): string {
  switch (source) {
    case CashMovementSource.manual:
      return "Manual";
    case CashMovementSource.pos:
      return "POS";
    case CashMovementSource.invoice:
      return "Factura";
    case CashMovementSource.expense:
      return "Gasto";
    case CashMovementSource.purchase:
      return "Compra";
    case CashMovementSource.commission:
      return "Comisión";
    case CashMovementSource.receivable:
      return "Cartera";
    default:
      return "Otro";
  }
}

/**
 * The account a payment method affects. Cash movements hit Caja; transfer and
 * card movements hit Bancos. A mixed payment is split by the backend, so the
 * form asks the operator to pick the account explicitly.
 */
export function accountForPaymentMethod(
  method: PaymentMethod,
): CashAccount | null {
  if (method === PaymentMethod.cash) return CashAccount.cash;
  if (method === PaymentMethod.transfer || method === PaymentMethod.card) {
    return CashAccount.bank;
  }
  return null;
}

/** Parse a decimal amount typed by the user into integer cents. */
export function parseAmount(value: string): bigint | null {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (normalized === "") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}

/** Render integer cents as a plain decimal string for a form input. */
export function centsToInput(cents: bigint): string {
  return (Number(cents) / 100).toFixed(2);
}
