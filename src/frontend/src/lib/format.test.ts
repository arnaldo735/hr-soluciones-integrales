import {
  COLOMBIA_TIME_ZONE,
  colombiaDayKey,
  colombiaTimeLabel,
  effectiveTaxRate,
  fiscalRegimeLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatNit,
  formatNitBase,
  formatNumber,
  formatPrincipal,
  formatTaxRate,
  isIvaResponsible,
  nitCheckDigit,
  timestampToDate,
} from "@/lib/format";
import { FiscalRegime } from "@/lib/types";
import { describe, expect, it } from "vitest";

describe("format helpers", () => {
  it("formats integer cents as Colombian pesos with no decimals", () => {
    expect(formatMoney(25000000n)).toBe("$ 250.000");
    expect(formatMoney(25000n)).toBe("$ 250");
    expect(formatMoney(0n)).toBe("$ 0");
    expect(formatMoney(undefined)).toBe("—");
    expect(formatMoney(null)).toBe("—");
  });

  it("formats negative amounts with a leading sign", () => {
    expect(formatMoney(-25000000n)).toBe("-$ 250.000");
  });

  it("formats compact money for KPI tiles", () => {
    expect(formatMoneyCompact(2380000n)).toBe("$ 23,8 mil");
    expect(formatMoneyCompact(2500000n)).toBe("$ 25 mil");
    expect(formatMoneyCompact(undefined)).toBe("—");
  });

  it("formats whole numbers with Spanish thousands separators", () => {
    expect(formatNumber(1500n)).toBe("1.500");
    expect(formatNumber(0n)).toBe("0");
    expect(formatNumber(undefined)).toBe("—");
  });

  it("formats a whole-percent tax rate without decimals", () => {
    expect(formatTaxRate(19n)).toBe("19%");
    expect(formatTaxRate(16n)).toBe("16%");
    expect(formatTaxRate(undefined)).toBe("—");
  });

  it("converts nanosecond timestamps to dates", () => {
    const ns = 1_700_000_000_000_000_000n;
    const date = timestampToDate(ns);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getTime()).toBe(1_700_000_000_000);
    expect(formatDate(ns)).not.toBe("—");
    expect(formatDate(null)).toBe("—");
  });

  it("renders dates and times in the fixed Colombia timezone", () => {
    // 2023-11-14T22:13:20Z is 2023-11-14T17:13 in Bogota (UTC-5).
    const ns = 1_700_000_000_000_000_000n;
    const date = timestampToDate(ns);
    expect(date).not.toBeNull();
    expect(colombiaDayKey(date as Date)).toBe("2023-11-14");
    expect(colombiaTimeLabel(date as Date)).toBe("17:13");
    expect(formatDate(ns)).toContain("2023");
    // `formatDateTime` renders the es-CO 12-hour clock; the 24-hour wall clock
    // is available through `colombiaTimeLabel`.
    expect(formatDateTime(ns)).toContain("05:13");
    expect(COLOMBIA_TIME_ZONE).toBe("America/Bogota");
  });

  it("truncates long principals for dense tables", () => {
    expect(formatPrincipal("aaaaa-aa")).toBe("aaaaa-aa");
    expect(formatPrincipal("abcdefghijklmnopqrst")).toBe("abcdef…qrst");
    expect(formatPrincipal(null)).toBe("—");
  });

  it("computes the DIAN módulo 11 check digit for a NIT", () => {
    expect(nitCheckDigit("900123456")).toBe(8);
    expect(nitCheckDigit("900.123.456")).toBe(8);
    expect(nitCheckDigit("")).toBeNull();
    expect(nitCheckDigit("abc")).toBeNull();
  });

  it("formats a NIT with its check digit and falls back without one", () => {
    expect(formatNitBase("900123456")).toBe("900.123.456");
    expect(formatNit("900123456", 8n)).toBe("NIT 900.123.456-8");
    expect(formatNit("900123456")).toBe("NIT 900.123.456");
    expect(formatNit("")).toBe("—");
  });
});

/**
 * The company's fiscal regime is the single source of truth for whether IVA
 * applies. These helpers are the frontend seam every document view reads, so
 * they are covered directly rather than only through a page.
 */
describe("IVA regime helpers", () => {
  it("treats only responsableIva as IVA-responsible", () => {
    expect(isIvaResponsible(FiscalRegime.responsableIva)).toBe(true);
    expect(isIvaResponsible(FiscalRegime.noResponsableIva)).toBe(false);
  });

  it("treats an unknown or missing regime as not IVA-responsible", () => {
    expect(isIvaResponsible(undefined)).toBe(false);
    expect(isIvaResponsible(null)).toBe(false);
  });

  it("applies the configured rate only when the company is IVA-responsible", () => {
    expect(effectiveTaxRate(FiscalRegime.responsableIva, 16n)).toBe(16n);
    expect(effectiveTaxRate(FiscalRegime.responsableIva, 19n)).toBe(19n);
    expect(effectiveTaxRate(FiscalRegime.noResponsableIva, 16n)).toBe(0n);
    expect(effectiveTaxRate(FiscalRegime.noResponsableIva, 19n)).toBe(0n);
  });

  it("falls back to 0 when the rate is missing or empty", () => {
    expect(effectiveTaxRate(FiscalRegime.responsableIva, undefined)).toBe(0n);
    expect(effectiveTaxRate(FiscalRegime.responsableIva, null)).toBe(0n);
    expect(effectiveTaxRate(FiscalRegime.noResponsableIva, undefined)).toBe(0n);
  });

  it("labels both fiscal regimes in Spanish", () => {
    expect(fiscalRegimeLabel(FiscalRegime.responsableIva)).toBe(
      "Responsable de IVA",
    );
    expect(fiscalRegimeLabel(FiscalRegime.noResponsableIva)).toBe(
      "No responsable de IVA",
    );
  });
});
