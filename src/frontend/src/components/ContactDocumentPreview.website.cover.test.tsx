import { ContactDocumentPreview } from "@/components/ContactDocumentPreview";
import type { CompanyProfile, ContactDocument } from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: the company website is part of the complete
 * header shown on the printed contact ficha (cliente / proveedor).
 *
 * The accepted change adds `profile.website` to the contact line that
 * `ContactDocumentPreview` builds from the company profile, so the on-screen
 * ficha carries the same complete identity as the PDF. This pins that the
 * persisted website reaches the rendered header — and that a profile without
 * one simply omits it.
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

describe("ContactDocumentPreview company website (cover)", () => {
  beforeEach(() => {
    getCompanyProfileMock.mockReset();
  });

  it("shows the persisted website in the ficha header", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    const dialog = await openPreview();

    // The website is part of the contact line, alongside dirección, ciudad,
    // teléfono and correo.
    expect(
      await within(dialog).findByText(/https:\/\/hrsolucionesintegrales\.com/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/contacto@hrsolucionesintegrales\.com/),
    ).toBeInTheDocument();
  });

  it("omits the website when the profile has none", async () => {
    getCompanyProfileMock.mockResolvedValue(profile({ website: undefined }));
    const dialog = await openPreview();

    // The header still renders the rest of the contact line.
    expect(
      await within(dialog).findByText(/Calle 45 #12-30, Bogotá/),
    ).toBeInTheDocument();
    // The website URL is absent; the email that shares its domain is not.
    expect(
      within(dialog).queryByText(/https:\/\/hrsolucionesintegrales\.com/),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(/contacto@hrsolucionesintegrales\.com/),
    ).toBeInTheDocument();
  });
});
