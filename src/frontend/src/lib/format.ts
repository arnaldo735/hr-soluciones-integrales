import type {
  DocumentType,
  FiscalRegime,
  Money,
  TaxResponsibility,
  Timestamp,
} from "@/lib/types";

/** Fixed business timezone: Colombia (UTC-5, no DST). */
export const COLOMBIA_TIME_ZONE = "America/Bogota";

const numberFormatter = new Intl.NumberFormat("es-CO");

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: COLOMBIA_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: COLOMBIA_TIME_ZONE,
});

const wallClockFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: COLOMBIA_TIME_ZONE,
});

/**
 * Format integer cents as Colombian pesos: `$ 250.000`.
 * Thousands separator is `.`, there are no decimals, and a space separates the
 * `$` sign from the digits. Built deterministically so the output does not
 * depend on the runtime's `es-CO` currency symbol placement.
 */
function formatCop(cents: Money): string {
  const amount = Number(cents) / 100;
  const sign = amount < 0 ? "-" : "";
  return `${sign}$ ${numberFormatter.format(Math.round(Math.abs(amount)))}`;
}

/**
 * Backend money values are integer cents stored as `bigint`.
 * Convert to a decimal amount before formatting.
 */
export function formatMoney(cents: Money | undefined | null): string {
  if (cents === undefined || cents === null) return "—";
  return formatCop(cents);
}

/** Compact money for KPI tiles, e.g. `$ 23,8 mil`. */
export function formatMoneyCompact(cents: Money | undefined | null): string {
  if (cents === undefined || cents === null) return "—";
  const amount = Number(cents) / 100;
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${sign}$ ${numberFormatter.format(Math.round(abs / 100_000) / 10)} M`;
  }
  if (abs >= 1_000) {
    return `${sign}$ ${numberFormatter.format(Math.round(abs / 100) / 10)} mil`;
  }
  return `${sign}$ ${numberFormatter.format(Math.round(abs))}`;
}

/** Plain integer with Spanish thousands separators. */
export function formatNumber(
  value: bigint | number | undefined | null,
): string {
  if (value === undefined || value === null) return "—";
  return numberFormatter.format(Number(value));
}

/**
 * Percentage from a backend tax rate expressed in whole percentage points
 * (19 -> "19%"), matching the backend's `tax = subtotal * taxRate / 100`.
 */
export function formatTaxRate(percent: bigint | undefined | null): string {
  if (percent === undefined || percent === null) return "—";
  return `${Math.round(Number(percent))}%`;
}

/** Spanish label for the company document type. */
export function documentTypeLabel(type: DocumentType): string {
  switch (type) {
    case "nit":
      return "NIT";
    case "cedulaCiudadania":
      return "Cédula de ciudadanía";
    case "cedulaExtranjeria":
      return "Cédula de extranjería";
    default:
      return "Documento";
  }
}

/** Spanish label for the fiscal regime (responsabilidad frente al IVA). */
export function fiscalRegimeLabel(regime: FiscalRegime): string {
  return regime === "responsableIva"
    ? "Responsable de IVA"
    : "No responsable de IVA";
}

/**
 * The company's fiscal regime is the single source of truth for whether IVA
 * applies. Only `responsableIva` charges tax; every other value (including a
 * missing profile) means no IVA is applied.
 */
export function isIvaResponsible(
  regime: FiscalRegime | undefined | null,
): boolean {
  return regime === "responsableIva";
}

/**
 * Effective tax rate in whole percentage points. A company that is not
 * responsible for IVA always charges 0%, regardless of the configured rate,
 * which is preserved so it can be reused when the regime changes back.
 */
export function effectiveTaxRate(
  regime: FiscalRegime | undefined | null,
  taxRate: bigint | undefined | null,
): bigint {
  if (!isIvaResponsible(regime)) return 0n;
  return taxRate ?? 0n;
}

/** Spanish label for the DIAN tax responsibility. */
export function taxResponsibilityLabel(value: TaxResponsibility): string {
  switch (value) {
    case "granContribuyente":
      return "Gran contribuyente";
    case "autorretenedor":
      return "Autorretenedor";
    case "agenteRetencionIva":
      return "Agente de retención IVA";
    case "regimenSimple":
      return "Régimen simple";
    case "noAplica":
      return "No aplica";
    default:
      return "No aplica";
  }
}

/** Strip every non-digit character from a document number. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * DIAN módulo 11 check digit for a NIT: weights 2..7 cycle right-to-left over
 * the document digits; a remainder below 2 is the digit itself, otherwise the
 * digit is `11 - remainder`. Returns `null` when there are no digits.
 */
export function nitCheckDigit(documentNumber: string): number | null {
  const digits = onlyDigits(documentNumber);
  if (digits === "") return null;
  let sum = 0;
  let weight = 2;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += Number(digits[index]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  return remainder < 2 ? remainder : 11 - remainder;
}

/** Group a NIT base number with dots: `900123456` -> `900.123.456`. */
export function formatNitBase(documentNumber: string): string {
  const digits = onlyDigits(documentNumber);
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Full DIAN-style NIT label: `NIT 900.123.456-7`. Falls back to the plain
 * document number when there is no check digit.
 */
export function formatNit(
  documentNumber: string,
  checkDigit?: bigint | number | null,
): string {
  const base = formatNitBase(documentNumber);
  if (base === "") return "—";
  if (checkDigit === undefined || checkDigit === null) return `NIT ${base}`;
  return `NIT ${base}-${Number(checkDigit)}`;
}

/**
 * Motoko `Time.now()` values are nanosecond bigints. Convert through this
 * helper before any JavaScript `Date` operation.
 */
export function timestampToDate(
  timestamp: Timestamp | undefined | null,
): Date | null {
  if (timestamp === undefined || timestamp === null) return null;
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(timestamp: Timestamp | undefined | null): string {
  const date = timestampToDate(timestamp);
  return date ? dateFormatter.format(date) : "—";
}

export function formatDateTime(
  timestamp: Timestamp | undefined | null,
): string {
  const date = timestampToDate(timestamp);
  return date ? dateTimeFormatter.format(date) : "—";
}

/** Truncate a principal for display in dense tables. */
export function formatPrincipal(principal: string | undefined | null): string {
  if (!principal) return "—";
  if (principal.length <= 14) return principal;
  return `${principal.slice(0, 6)}…${principal.slice(-4)}`;
}

export interface ColombiaParts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
}

/**
 * Wall-clock parts of a `Date` in Colombia time, independent of the browser
 * timezone. Returns `null` for an invalid date.
 */
export function toColombiaParts(date: Date): ColombiaParts | null {
  if (Number.isNaN(date.getTime())) return null;
  const parts = wallClockFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((entry) => entry.type === type);
    return part ? Number(part.value) : Number.NaN;
  };
  const year = read("year");
  const month = read("month");
  const day = read("day");
  const hours = read("hour");
  const minutes = read("minute");
  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }
  return { year, month, day, hours, minutes };
}

/** `YYYY-MM-DD` key for a date in Colombia time. */
export function colombiaDayKey(date: Date): string {
  const parts = toColombiaParts(date);
  if (!parts) return "";
  const month = `${parts.month}`.padStart(2, "0");
  const day = `${parts.day}`.padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

/** `HH:mm` label for a date in Colombia time. */
export function colombiaTimeLabel(date: Date): string {
  const parts = toColombiaParts(date);
  if (!parts) return "";
  const hours = `${parts.hours}`.padStart(2, "0");
  const minutes = `${parts.minutes}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** `YYYY-MM-DD` for a date input from a backend nanosecond timestamp. */
export function colombiaDateInput(
  timestamp: Timestamp | undefined | null,
): string {
  const date = timestampToDate(timestamp);
  return date ? colombiaDayKey(date) : "";
}

/**
 * Build a `Date` from a `YYYY-MM-DDTHH:mm` string interpreted as Colombia
 * wall-clock time. Colombia is a fixed UTC-5 offset with no DST, so the
 * conversion is a constant shift.
 */
export function colombiaLocalToDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = match[4] === undefined ? 0 : Number(match[4]);
  const minutes = match[5] === undefined ? 0 : Number(match[5]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hours > 23 ||
    minutes > 59
  ) {
    return null;
  }
  const utcMs = Date.UTC(year, month - 1, day, hours + 5, minutes);
  const date = new Date(utcMs);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Nanosecond timestamp for a `YYYY-MM-DD` date input at Colombia start of day. */
export function colombiaStartOfDay(value: string): bigint | null {
  const date = colombiaLocalToDate(`${value}T00:00`);
  return date ? BigInt(date.getTime()) * 1_000_000n : null;
}

/** Nanosecond timestamp for a `YYYY-MM-DD` date input at Colombia end of day. */
export function colombiaEndOfDay(value: string): bigint | null {
  const date = colombiaLocalToDate(`${value}T23:59`);
  if (!date) return null;
  return BigInt(date.getTime() + 59_000) * 1_000_000n;
}

/** Nanosecond timestamp for a Colombia-local `YYYY-MM-DD` + `HH:mm` pair. */
export function colombiaTimestamp(
  dateValue: string,
  timeValue: string,
): bigint | null {
  if (dateValue === "" || timeValue === "") return null;
  const date = colombiaLocalToDate(`${dateValue}T${timeValue}`);
  return date ? BigInt(date.getTime()) * 1_000_000n : null;
}
