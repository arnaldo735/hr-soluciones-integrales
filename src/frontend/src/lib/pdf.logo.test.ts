import { pdfCompanyFromProfile } from "@/lib/pdf";
import type { CompanyProfile } from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { describe, expect, it } from "vitest";

/**
 * Coverage for the accepted company logo reaching generated PDFs.
 *
 * The accepted change persists a company logo and requires it to appear in
 * every printed document. `pdfCompanyFromProfile` is the seam that carries the
 * profile's `logoUrl` into the shared PDF header used by the commission
 * receipts/reports and the contact fichas, so this pins that the persisted logo
 * is forwarded — and that a profile without one yields no logo.
 *
 * The PDF bytes are not asserted; this covers the header data the PDF is built
 * from.
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
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

describe("pdfCompanyFromProfile logo", () => {
  it("carries the persisted logo URL into the PDF company header", () => {
    const company = pdfCompanyFromProfile(profile({ logoUrl: LOGO_URL }));
    expect(company.logoUrl).toBe(LOGO_URL);
  });

  it("omits the logo when the profile has none", () => {
    const company = pdfCompanyFromProfile(profile({ logoUrl: undefined }));
    expect(company.logoUrl).toBeUndefined();
  });

  it("omits the logo when there is no profile at all", () => {
    const company = pdfCompanyFromProfile(null);
    expect(company.logoUrl).toBeUndefined();
    expect(company.name).toBe("Taller de motos");
  });
});
