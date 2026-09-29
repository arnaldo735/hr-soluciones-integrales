import {
  documentTypeLabel,
  fiscalRegimeLabel,
  formatNit,
  taxResponsibilityLabel,
} from "@/lib/format";
import type { CompanyProfile } from "@/lib/types";

/**
 * The complete company identity block shared by every printable document
 * (OT, cotización, factura, compra, recibo POS A4 y tirilla 80 mm).
 *
 * Every field is optional: a value the company has not configured is omitted
 * cleanly instead of leaving an empty label or a blank gap. `DocumentPreview`
 * consumes this shape through its existing `companyName` / `companyLogoUrl` /
 * `companyContact` / `companyFiscal` props, so the header stays a single
 * source of truth without changing the preview's public API.
 */
export interface CompanyHeaderData {
  /** Razón social (legal name). */
  legalName: string;
  /** Nombre comercial, when it differs from the razón social. */
  tradeName?: string;
  /** Permanent URL of the company logo. */
  logoUrl?: string;
  /** Full DIAN label, e.g. `NIT 900.123.456-7`. */
  taxId?: string;
  /** Fiscal regime label, e.g. `No responsable de IVA`. */
  fiscalRegime?: string;
  /** Tax responsibility label, e.g. `Gran contribuyente`. */
  taxResponsibility?: string;
  /** Street address. */
  address?: string;
  /** City. */
  city?: string;
  /** Phone number. */
  phone?: string;
  /** Contact email. */
  email?: string;
  /** Website. */
  website?: string;
}

/** Trim a value and return `undefined` when it is empty or whitespace. */
function clean(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Builds the complete company header from the backend `CompanyProfile`.
 * Unconfigured fields are dropped, so the caller never renders an orphan
 * label or an empty row. Returns `null` when there is no profile at all.
 */
export function companyHeaderFromProfile(
  profile: CompanyProfile | null | undefined,
): CompanyHeaderData | null {
  if (!profile) return null;

  const legalName = clean(profile.legalName);
  if (!legalName) return null;

  return {
    legalName,
    tradeName: clean(profile.tradeName),
    logoUrl: clean(profile.logoUrl),
    taxId: clean(formatNit(profile.taxId, profile.checkDigit)),
    fiscalRegime: clean(fiscalRegimeLabel(profile.fiscalRegime)),
    taxResponsibility: clean(taxResponsibilityLabel(profile.taxResponsibility)),
    address: clean(profile.address),
    city: clean(profile.city),
    phone: clean(profile.phone),
    email: clean(profile.email),
    website: clean(profile.website),
  };
}

/**
 * The contact line for a printable header: dirección, ciudad, teléfono,
 * correo y sitio web, joined with `·`. Returns `undefined` when none of them
 * is configured, so the header omits the line entirely.
 */
export function companyContactLine(
  header: CompanyHeaderData | null,
): string | undefined {
  if (!header) return undefined;
  const parts = [
    header.address,
    header.city,
    header.phone,
    header.email,
    header.website,
  ].filter((value): value is string => !!value);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/**
 * The fiscal block for a printable header: NIT with dígito de verificación,
 * régimen fiscal y responsabilidad tributaria. Blank entries are dropped so
 * the block never renders an empty row.
 */
export function companyFiscalLines(header: CompanyHeaderData | null): string[] {
  if (!header) return [];
  return [header.taxId, header.fiscalRegime, header.taxResponsibility].filter(
    (value): value is string => !!value,
  );
}

/**
 * The document type and number with its dígito de verificación, e.g.
 * `NIT 900.123.456-7`. Used by the printable header's document identity.
 */
export function companyDocumentLabel(
  header: CompanyHeaderData | null,
): string | undefined {
  return header?.taxId;
}

/** The document type label alone, e.g. `NIT` or `Cédula de ciudadanía`. */
export function companyDocumentTypeLabel(
  profile: CompanyProfile | null | undefined,
): string | undefined {
  if (!profile) return undefined;
  return documentTypeLabel(profile.documentType);
}
