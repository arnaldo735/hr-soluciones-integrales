import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  accountForPaymentMethod,
  accountLabel,
  centsToInput,
  movementKindLabel,
  movementSourceLabel,
  parseAmount,
  paymentMethodLabel,
} from "@/components/cash/cash-labels";
import {
  CashAccount,
  CashMovementKind,
  CashMovementSource,
  PaymentMethod,
} from "@/lib/types";
import { describe, expect, it } from "vitest";

/**
 * Characterization coverage for the Caja y Bancos label and money helpers.
 *
 * The accepted change turns the single global shift into several registers
 * (cajas y bancos) and adds an assignable responsible. Those helpers are reused
 * by the new register and responsible UI, so their observable contract must
 * survive the rework:
 *
 *   - a payment method maps to the account it affects (efectivo -> Caja,
 *     transferencia/tarjeta -> Bancos, mixto -> no derived account);
 *   - amounts typed by the operator parse into integer cents and render back
 *     into a plain decimal string;
 *   - the Spanish labels for kind, account, method and source stay stable.
 *
 * These are pure functions, so the tests pin the contract directly rather than
 * through a rendered page.
 */

describe("cash-labels (characterization)", () => {
  it("maps each payment method to the account it affects", () => {
    expect(accountForPaymentMethod(PaymentMethod.cash)).toBe(CashAccount.cash);
    expect(accountForPaymentMethod(PaymentMethod.transfer)).toBe(
      CashAccount.bank,
    );
    expect(accountForPaymentMethod(PaymentMethod.card)).toBe(CashAccount.bank);
    // A mixed payment is split by the backend, so the form asks explicitly.
    expect(accountForPaymentMethod(PaymentMethod.mixed)).toBeNull();
  });

  it("parses a typed amount into integer cents", () => {
    expect(parseAmount("1000")).toBe(100000n);
    expect(parseAmount("1000.50")).toBe(100050n);
    // Currency symbols and spaces are stripped; the dot is the decimal mark.
    expect(parseAmount("$ 1234.56")).toBe(123456n);
    expect(parseAmount("0")).toBe(0n);
    // An empty or non-numeric entry has no amount.
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  it("renders integer cents back into a decimal input string", () => {
    expect(centsToInput(100000n)).toBe("1000.00");
    expect(centsToInput(100050n)).toBe("1000.50");
    expect(centsToInput(0n)).toBe("0.00");
  });

  it("keeps the Spanish labels for kind, account, method and source", () => {
    expect(movementKindLabel(CashMovementKind.income)).toBe("Ingreso");
    expect(movementKindLabel(CashMovementKind.expense)).toBe("Egreso");

    expect(accountLabel(CashAccount.cash)).toBe("Caja");
    expect(accountLabel(CashAccount.bank)).toBe("Bancos");

    expect(paymentMethodLabel(PaymentMethod.cash)).toBe("Efectivo");
    expect(paymentMethodLabel(PaymentMethod.transfer)).toBe("Transferencia");
    expect(paymentMethodLabel(PaymentMethod.card)).toBe("Tarjeta");
    expect(paymentMethodLabel(PaymentMethod.mixed)).toBe("Mixto");

    expect(movementSourceLabel(CashMovementSource.manual)).toBe("Manual");
    expect(movementSourceLabel(CashMovementSource.pos)).toBe("POS");
    expect(movementSourceLabel(CashMovementSource.invoice)).toBe("Factura");
    expect(movementSourceLabel(CashMovementSource.expense)).toBe("Gasto");
    expect(movementSourceLabel(CashMovementSource.purchase)).toBe("Compra");
    expect(movementSourceLabel(CashMovementSource.commission)).toBe("Comisión");
    expect(movementSourceLabel(CashMovementSource.receivable)).toBe("Cartera");
    expect(movementSourceLabel(CashMovementSource.other)).toBe("Otro");
  });

  it("offers every payment method in the movement form", () => {
    expect(PAYMENT_METHOD_OPTIONS).toEqual([
      PaymentMethod.cash,
      PaymentMethod.transfer,
      PaymentMethod.card,
      PaymentMethod.mixed,
    ]);
    for (const method of PAYMENT_METHOD_OPTIONS) {
      expect(PAYMENT_METHOD_LABELS[method]).toBeTruthy();
    }
  });
});
