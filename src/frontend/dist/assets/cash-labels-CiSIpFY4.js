import { af as PaymentMethod, bH as CashRegisterKind, bD as CashMovementKind, bE as CashAccount, bF as CashMovementSource } from "./index-CGU00UGU.js";
const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.mixed]: "Mixto"
};
const PAYMENT_METHOD_OPTIONS = [
  PaymentMethod.cash,
  PaymentMethod.transfer,
  PaymentMethod.card,
  PaymentMethod.mixed
];
function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
function movementKindLabel(kind) {
  return kind === CashMovementKind.income ? "Ingreso" : "Egreso";
}
function accountLabel(account) {
  return account === CashAccount.cash ? "Caja" : "Bancos";
}
const CASH_REGISTER_KIND_LABELS = {
  [CashRegisterKind.cash]: "Caja",
  [CashRegisterKind.bank]: "Banco"
};
const CASH_REGISTER_KIND_OPTIONS = [
  CashRegisterKind.cash,
  CashRegisterKind.bank
];
function cashRegisterKindLabel(kind) {
  return CASH_REGISTER_KIND_LABELS[kind] ?? kind;
}
function registerStatusLabel(active) {
  return active ? "Activa" : "Inactiva";
}
function registerShiftStatusLabel(hasOpenShift) {
  return hasOpenShift ? "Con turno abierto" : "Sin turno abierto";
}
function movementSourceLabel(source) {
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
    case CashMovementSource.advance:
      return "Anticipo";
    default:
      return "Otro";
  }
}
function accountForPaymentMethod(method) {
  if (method === PaymentMethod.cash) return CashAccount.cash;
  if (method === PaymentMethod.transfer || method === PaymentMethod.card) {
    return CashAccount.bank;
  }
  return null;
}
function parseAmount(value) {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (normalized === "") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}
function centsToInput(cents) {
  return (Number(cents) / 100).toFixed(2);
}
export {
  CASH_REGISTER_KIND_OPTIONS as C,
  PAYMENT_METHOD_OPTIONS as P,
  accountForPaymentMethod as a,
  PAYMENT_METHOD_LABELS as b,
  accountLabel as c,
  paymentMethodLabel as d,
  movementSourceLabel as e,
  centsToInput as f,
  cashRegisterKindLabel as g,
  CASH_REGISTER_KIND_LABELS as h,
  registerShiftStatusLabel as i,
  movementKindLabel as m,
  parseAmount as p,
  registerStatusLabel as r
};
