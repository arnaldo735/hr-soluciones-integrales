import type { CompanyProfile } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { CompanyPage } from "@/pages/CompanyPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the company profile's fiscal regime.
 *
 * The accepted change makes an empty `fiscalRegime` coerce to a valid default
 * before it reaches the backend, so a save no longer fails Candid decoding.
 * This file protects the surrounding working behavior that must survive it: a
 * profile loaded with the default `responsableIva` regime renders that regime
 * in the select and sends that same variant in the save payload.
 *
 * It deliberately does not assert what happens when the backend returns an
 * empty or unknown regime, nor how a non-default regime round-trips — those are
 * the behaviors the accepted change alters.
 */

const useRoleMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const updateCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCompanyProfile: getCompanyProfileMock,
      updateCompanyProfile: updateCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("CompanyPage fiscal regime (characterization)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    updateCompanyProfileMock.mockReset();
    useRoleMock.mockReturnValue(roleState(true));
  });

  it("renders the loaded responsableIva regime in the select", async () => {
    getCompanyProfileMock.mockResolvedValue(
      profile({ fiscalRegime: FiscalRegime.responsableIva }),
    );
    renderWithProviders(<CompanyPage />);

    const select = await screen.findByTestId("company.fiscal_regime_select");
    // The select shows the loaded regime's Spanish label, not the placeholder.
    expect(select).toHaveTextContent("Responsable de IVA");
  });

  it("sends the loaded responsableIva variant unchanged in the payload", async () => {
    getCompanyProfileMock.mockResolvedValue(
      profile({ fiscalRegime: FiscalRegime.responsableIva }),
    );
    updateCompanyProfileMock.mockResolvedValue(
      profile({ fiscalRegime: FiscalRegime.responsableIva }),
    );
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    // A valid loaded regime is carried through as its own variant, so the
    // normalization the accepted change adds never rewrites a valid value.
    expect(updateCompanyProfileMock.mock.calls[0][0]).toMatchObject({
      fiscalRegime: FiscalRegime.responsableIva,
    });
  });

  // --- Accepted behavior: an empty or unknown regime never reaches Candid ---
  //
  // The reported bug is that saving the company produced
  // `Invalid variant fiscalRegime` because an empty string was sent as a
  // variant. The accepted fix normalizes an empty or unrecognized regime to a
  // valid variant before the save, so the payload always carries a real variant
  // and the select never renders empty.

  it("coerces an empty loaded regime to a valid variant in the select and payload", async () => {
    // The backend can return an empty regime (the pre-fix stored value). The
    // page must not render it as an empty select nor send it back as "".
    getCompanyProfileMock.mockResolvedValue(
      profile({ fiscalRegime: "" as unknown as FiscalRegime }),
    );
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const select = await screen.findByTestId("company.fiscal_regime_select");
    // The select shows a real option, not the empty placeholder.
    expect(select).toHaveTextContent("No responsable de IVA");

    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    const sent = updateCompanyProfileMock.mock.calls[0][0].fiscalRegime;
    // The payload carries a valid variant, never an empty string.
    expect(sent).toBe(FiscalRegime.noResponsableIva);
    expect(sent).not.toBe("");
  });

  it("coerces an unknown loaded regime to a valid variant in the payload", async () => {
    getCompanyProfileMock.mockResolvedValue(
      profile({ fiscalRegime: "regimenInvalido" as unknown as FiscalRegime }),
    );
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    expect(updateCompanyProfileMock.mock.calls[0][0].fiscalRegime).toBe(
      FiscalRegime.noResponsableIva,
    );
  });
});
