import {
  companyContactLine,
  companyFiscalLines,
  companyHeaderFromProfile,
} from "@/lib/company-header";
import type { CompanyProfile } from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { describe, expect, it } from "vitest";

/**
 * Characterization: the complete company header data shared by every printable
 * document (OT, cotización, factura, compra, POS mostrador, informes de
 * contabilidad, informe de turno, fichas de cliente/proveedor).
 *
 * The accepted change reworks the header *layout* so each company datum gets
 * its own space without overlapping, in A4 and 80mm, on screen and in the PDF.
 * The data contract that feeds that layout must not change: the header carries
 * logo, razón social, NIT con dígito de verificación, régimen, responsabilidad,
 * dirección, ciudad, teléfono, correo y sitio web, and drops unconfigured
 * fields cleanly instead of leaving an orphan label or an empty row.
 *
 * This file pins only that data contract — the pure transformation from the
 * backend `CompanyProfile` into the header shape. It deliberately does not
 * assert any pixel position or drawing coordinate, which the accepted change
 * intentionally alters.
 */

const LOGO_URL = "https://gateway.example.com/logo-hash.png";

function profile(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.responsableIva,
    taxResponsibility: TaxResponsibility.granContribuyente,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: LOGO_URL,
    taxRate: 19n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

describe("company header data (characterization)", () => {
  it("carries every company datum from the profile", () => {
    const header = companyHeaderFromProfile(profile());
    expect(header).not.toBeNull();
    if (!header) return;

    expect(header.legalName).toBe("HR SOLUCIONES INTEGRALES S.A.S.");
    expect(header.tradeName).toBe("Taller HR Motos");
    expect(header.logoUrl).toBe(LOGO_URL);
    // NIT with its dígito de verificación, DIAN-formatted.
    expect(header.taxId).toBe("NIT 900.123.456-8");
    // Régimen and responsabilidad resolved to their Spanish labels.
    expect(header.fiscalRegime).toBe("Responsable de IVA");
    expect(header.taxResponsibility).toBe("Gran contribuyente");
    expect(header.address).toBe("Calle 45 #12-30, Bogotá");
    expect(header.city).toBe("Bogotá D.C., Cundinamarca");
    expect(header.phone).toBe("+57 300 000 0000");
    expect(header.email).toBe("contacto@hrsolucionesintegrales.com");
    expect(header.website).toBe("https://hrsolucionesintegrales.com");
  });

  it("joins dirección, ciudad, teléfono, correo y sitio web into the contact line", () => {
    const header = companyHeaderFromProfile(profile());
    const contact = companyContactLine(header);

    expect(contact).toBe(
      "Calle 45 #12-30, Bogotá · Bogotá D.C., Cundinamarca · +57 300 000 0000 · contacto@hrsolucionesintegrales.com · https://hrsolucionesintegrales.com",
    );
  });

  it("lists NIT, régimen y responsabilidad as the fiscal block", () => {
    const header = companyHeaderFromProfile(profile());
    expect(companyFiscalLines(header)).toEqual([
      "NIT 900.123.456-8",
      "Responsable de IVA",
      "Gran contribuyente",
    ]);
  });

  it("drops unconfigured fields instead of rendering empty rows", () => {
    const header = companyHeaderFromProfile(
      profile({
        tradeName: undefined,
        logoUrl: undefined,
        email: undefined,
        website: undefined,
        address: "",
        city: "   ",
        phone: "",
      }),
    );
    expect(header).not.toBeNull();
    if (!header) return;

    expect(header.tradeName).toBeUndefined();
    expect(header.logoUrl).toBeUndefined();
    expect(header.email).toBeUndefined();
    expect(header.website).toBeUndefined();
    expect(header.address).toBeUndefined();
    expect(header.city).toBeUndefined();
    expect(header.phone).toBeUndefined();

    // The contact line disappears entirely when none of its parts is set.
    expect(companyContactLine(header)).toBeUndefined();
    // The razón social and the fiscal block still carry the identity.
    expect(header.legalName).toBe("HR SOLUCIONES INTEGRALES S.A.S.");
    expect(companyFiscalLines(header)).toEqual([
      "NIT 900.123.456-8",
      "Responsable de IVA",
      "Gran contribuyente",
    ]);
  });

  it("keeps the NIT without a check digit when the profile has none", () => {
    const header = companyHeaderFromProfile(profile({ checkDigit: undefined }));
    expect(header?.taxId).toBe("NIT 900.123.456");
  });

  it("returns null when there is no profile or no razón social", () => {
    expect(companyHeaderFromProfile(null)).toBeNull();
    expect(companyHeaderFromProfile(undefined)).toBeNull();
    expect(companyHeaderFromProfile(profile({ legalName: "   " }))).toBeNull();
  });

  it("yields no contact line and no fiscal block without a header", () => {
    expect(companyContactLine(null)).toBeUndefined();
    expect(companyFiscalLines(null)).toEqual([]);
  });
});
