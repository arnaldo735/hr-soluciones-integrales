import { ContactDocumentPreview } from "@/components/ContactDocumentPreview";
import type { CompanyProfile, ContactDocument } from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted company logo reaching the printed contact ficha.
 *
 * The accepted change persists a company logo and requires it to appear in
 * every printed document. `ContactDocumentPreview` is the seam that reads the
 * company profile and hands its `logoUrl` to the shared `DocumentPreview`, so
 * this pins that the persisted profile logo actually reaches the rendered
 * ficha — and that a profile without a logo renders none.
 *
 * The backend actor is mocked; the real profile is not exercised here.
 */

const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { getCompanyProfile: getCompanyProfileMock },
    isFetching: false,
  }),
}));

vi.mock("@/lib/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdf")>();
  return { ...actual, downloadContactDocumentPdf: vi.fn() };
});

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

function customerDocument(): ContactDocument {
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: "CLI-1",
    name: "Ada Lovelace",
    meta: [{ label: "Documento", value: "LOAA1815", rail: true }],
    sections: [],
    footer: "Ficha de cliente generada para Ada Lovelace.",
  };
}

async function openPreview() {
  renderWithProviders(
    <ContactDocumentPreview
      document={customerDocument()}
      ocid="contact.preview_button"
    />,
  );
  await userEvent.click(screen.getByTestId("contact.preview_button"));
  return await screen.findByTestId("contact.preview_button.dialog");
}

describe("ContactDocumentPreview company logo", () => {
  beforeEach(() => {
    getCompanyProfileMock.mockReset();
  });

  it("renders the persisted company logo in the ficha header", async () => {
    getCompanyProfileMock.mockResolvedValue(profile({ logoUrl: LOGO_URL }));
    const dialog = await openPreview();

    const logo = await within(dialog).findByTestId(
      "contact.preview_button.preview.logo",
    );
    expect(logo).toHaveAttribute("src", LOGO_URL);
  });

  it("renders no logo when the company profile has none", async () => {
    getCompanyProfileMock.mockResolvedValue(profile({ logoUrl: undefined }));
    const dialog = await openPreview();

    // The document header is rendered (company name present) without a logo.
    expect(
      await within(dialog).findByText("HR SOLUCIONES INTEGRALES S.A.S."),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByTestId("contact.preview_button.preview.logo"),
    ).not.toBeInTheDocument();
  });
});
