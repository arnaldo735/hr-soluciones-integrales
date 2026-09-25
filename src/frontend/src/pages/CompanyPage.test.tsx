import type { CompanyProfile } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { CompanyPage } from "@/pages/CompanyPage";
import { renderWithProviders } from "@/test/helpers";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the company profile page's fiscal editing.
 *
 * The money format, the currency label and the default tax rate are
 * intentionally changing, so this file never asserts the exact rendered
 * currency string or the 16% default. It protects the surrounding working
 * behavior instead: the profile load, the admin-only editing gate, the
 * validation, the payload sent to the backend, and the printable preview.
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

describe("CompanyPage", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    updateCompanyProfileMock.mockReset();
    useRoleMock.mockReturnValue(roleState(true));
  });

  it("loads the company profile into the form", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    expect(await screen.findByTestId("company.form")).toBeInTheDocument();
    expect(screen.getByTestId("company.legal_name_input")).toHaveValue(
      "HR SOLUCIONES INTEGRALES S.A.S.",
    );
    expect(screen.getByTestId("company.tax_id_input")).toHaveValue("900123456");
    expect(screen.getByTestId("company.check_digit_input")).toHaveValue("8");
    expect(screen.getByTestId("company.city_input")).toHaveValue(
      "Bogotá D.C., Cundinamarca",
    );
    expect(screen.getByTestId("company.tax_rate_input")).toHaveValue("16");
  });

  it("renders the printable document preview with the company data", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    expect(await screen.findByTestId("company.preview")).toBeInTheDocument();
    expect(screen.getByText("Vista previa en documentos")).toBeInTheDocument();
    expect(
      screen.getByTestId("company.preview.print_button"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("company.preview.download_button"),
    ).toBeInTheDocument();
  });

  it("shows the fiscal block with the NIT check digit, regime and responsibility", async () => {
    getCompanyProfileMock.mockResolvedValue(
      profile({
        taxResponsibility: TaxResponsibility.granContribuyente,
        fiscalRegime: FiscalRegime.noResponsableIva,
      }),
    );
    renderWithProviders(<CompanyPage />);

    // The fiscal block only renders once the profile query resolves.
    const fiscalBlock = await screen.findByTestId(
      "company.preview.fiscal_block",
    );
    expect(fiscalBlock).toHaveTextContent("NIT 900.123.456-8");
    expect(fiscalBlock).toHaveTextContent("No responsable de IVA");
    expect(fiscalBlock).toHaveTextContent("Gran contribuyente");
  });

  it("enables the save button for an administrator with a valid form", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    // The accepted behavior: a valid admin form is immediately saveable, so the
    // button is not stuck disabled while the profile is loaded and untouched.
    const saveButton = await screen.findByTestId("company.save_button");
    expect(saveButton).toBeEnabled();
  });

  it("enables the save button after an administrator edits a field", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const legalName = await screen.findByTestId("company.legal_name_input");
    await userEvent.clear(legalName);
    await userEvent.type(legalName, "Taller Nuevo S.A.S.");

    expect(screen.getByTestId("company.save_button")).toBeEnabled();
  });

  it("rejects an out-of-range tax rate before saving", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const taxRate = await screen.findByTestId("company.tax_rate_input");
    await userEvent.clear(taxRate);
    await userEvent.type(taxRate, "150");

    expect(screen.getByTestId("company.tax_rate_error")).toBeInTheDocument();
    expect(screen.getByTestId("company.save_button")).toBeDisabled();
    expect(updateCompanyProfileMock).not.toHaveBeenCalled();
  });

  it("disables the save button when a required field is cleared", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const legalName = await screen.findByTestId("company.legal_name_input");
    await userEvent.clear(legalName);

    expect(screen.getByTestId("company.save_button")).toBeDisabled();
    expect(updateCompanyProfileMock).not.toHaveBeenCalled();
  });

  it("blocks saving a NIT whose check digit does not match", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const checkDigit = await screen.findByTestId("company.check_digit_input");
    await userEvent.clear(checkDigit);
    await userEvent.type(checkDigit, "3");

    // The invalid digit disables the save action, so no update reaches the
    // backend.
    expect(screen.getByTestId("company.save_button")).toBeDisabled();
    expect(updateCompanyProfileMock).not.toHaveBeenCalled();
  });

  it("saves the trimmed profile with the fiscal fields and tax rate as a bigint", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const legalName = await screen.findByTestId("company.legal_name_input");
    await userEvent.clear(legalName);
    await userEvent.type(legalName, "  Taller Nuevo S.A.S.  ");
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    expect(updateCompanyProfileMock.mock.calls[0][0]).toEqual({
      legalName: "Taller Nuevo S.A.S.",
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
    });
  });

  it("disables editing and hides the save action for a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    expect(await screen.findByTestId("company.form")).toBeInTheDocument();
    expect(screen.getByTestId("company.legal_name_input")).toBeDisabled();
    expect(screen.getByTestId("company.tax_rate_input")).toBeDisabled();
    expect(screen.queryByTestId("company.save_button")).not.toBeInTheDocument();
  });

  // --- Characterization: the fiscal regime the IVA change depends on --------
  //
  // The accepted change makes the company's fiscal regime the source of truth
  // for IVA. These tests protect the seam that carries it: the regime select is
  // editable only for an administrator, and the loaded regime reaches the save
  // payload unchanged. They never assert what rate the regime implies.

  it("keeps the fiscal regime select editable only for an administrator", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    expect(
      await screen.findByTestId("company.fiscal_regime_select"),
    ).toBeEnabled();
  });

  it("keeps the fiscal regime select disabled for a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    expect(
      await screen.findByTestId("company.fiscal_regime_select"),
    ).toBeDisabled();
  });

  it("renders an error state with a retry when the profile fails to load", async () => {
    getCompanyProfileMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<CompanyPage />);

    expect(
      await screen.findByTestId("company.form.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudieron cargar los datos de la empresa."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("company.form.retry_button")).toBeInTheDocument();
  });

  it("lets an administrator edit every company field", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");

    // The premise of the requirement: an admin can fill in the whole form.
    // This asserts editability only, never the save button's enable condition.
    for (const id of [
      "company.legal_name_input",
      "company.trade_name_input",
      "company.tax_id_input",
      "company.check_digit_input",
      "company.address_input",
      "company.city_input",
      "company.phone_input",
      "company.email_input",
      "company.website_input",
      "company.tax_rate_input",
      "company.document_type_select",
      "company.fiscal_regime_select",
      "company.tax_responsibility_select",
    ]) {
      expect(screen.getByTestId(id)).toBeEnabled();
    }
  });

  it("shows the required-field messages when an incomplete form is submitted", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const legalName = await screen.findByTestId("company.legal_name_input");
    await userEvent.clear(legalName);
    await userEvent.clear(screen.getByTestId("company.tax_id_input"));
    await userEvent.clear(screen.getByTestId("company.address_input"));
    await userEvent.clear(screen.getByTestId("company.city_input"));
    await userEvent.clear(screen.getByTestId("company.phone_input"));
    await userEvent.clear(screen.getByTestId("company.email_input"));

    fireEvent.submit(screen.getByTestId("company.form"));

    expect(screen.getByTestId("company.legal_name_error")).toHaveTextContent(
      "Ingresa la razón social.",
    );
    expect(screen.getByTestId("company.tax_id_error")).toHaveTextContent(
      "Ingresa el número de documento.",
    );
    expect(screen.getByTestId("company.address_error")).toHaveTextContent(
      "Ingresa la dirección.",
    );
    expect(screen.getByTestId("company.city_error")).toHaveTextContent(
      "Ingresa la ciudad o departamento.",
    );
    expect(screen.getByTestId("company.phone_error")).toHaveTextContent(
      "Ingresa el teléfono.",
    );
    expect(screen.getByTestId("company.email_error")).toHaveTextContent(
      "Ingresa el correo electrónico.",
    );
    expect(updateCompanyProfileMock).not.toHaveBeenCalled();
  });

  it("omits cleared optional fields from the save payload", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await userEvent.clear(
      await screen.findByTestId("company.trade_name_input"),
    );
    await userEvent.clear(screen.getByTestId("company.website_input"));
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    const input = updateCompanyProfileMock.mock.calls[0][0];
    expect(input.tradeName).toBeUndefined();
    expect(input.website).toBeUndefined();
    // Required fields are still sent, so the omission is specific to the
    // optional ones that were cleared.
    expect(input.legalName).toBe("HR SOLUCIONES INTEGRALES S.A.S.");
  });

  // --- Characterization: adjacent behavior the save-gating change must keep --
  //
  // The accepted change stops an empty check digit and an empty tax rate from
  // blocking the save. These tests protect the surrounding rules that must
  // survive it: a *mismatched* check digit still blocks with its Spanish
  // message, the tax-rate bounds stay inclusive at 0 and 100, and a successful
  // save still reports success and sends the fiscal payload.

  it("keeps the mismatch message and blocks saving when the check digit is wrong", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const checkDigit = await screen.findByTestId("company.check_digit_input");
    await userEvent.clear(checkDigit);
    await userEvent.type(checkDigit, "3");
    fireEvent.submit(screen.getByTestId("company.form"));

    // The requirement keeps the mismatch blocking, so the Spanish message
    // naming the expected digit is still shown and no update is sent.
    expect(screen.getByTestId("company.check_digit_error")).toHaveTextContent(
      "El dígito de verificación no coincide con el número de documento.",
    );
    expect(screen.getByTestId("company.check_digit_error")).toHaveTextContent(
      "900.123.456",
    );
    expect(screen.getByTestId("company.save_button")).toBeDisabled();
    expect(updateCompanyProfileMock).not.toHaveBeenCalled();
  });

  it("accepts the inclusive tax-rate bounds of 0 and 100", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const taxRate = await screen.findByTestId("company.tax_rate_input");

    await userEvent.clear(taxRate);
    await userEvent.type(taxRate, "0");
    expect(
      screen.queryByTestId("company.tax_rate_error"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("company.save_button")).toBeEnabled();

    await userEvent.clear(taxRate);
    await userEvent.type(taxRate, "100");
    expect(
      screen.queryByTestId("company.tax_rate_error"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("company.save_button")).toBeEnabled();
  });

  it("reports success and sends the fiscal payload when a valid form is saved", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    // The accepted success notification is still raised after the update.
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Datos de la empresa guardados",
      ),
    );
    // The NIT check digit is sent as a bigint, not a string.
    expect(updateCompanyProfileMock.mock.calls[0][0]).toMatchObject({
      documentType: DocumentType.nit,
      taxId: "900123456",
      checkDigit: 8n,
      taxRate: 16n,
    });
  });

  // --- Accepted behavior: the check digit and tax rate stop blocking save ---
  //
  // The accepted change makes an empty check digit and an empty tax rate
  // non-blocking. These tests pin the new behavior: the save button stays
  // enabled, the system computes the missing values, and the payload carries
  // the computed check digit and the default 19% tax rate.

  it("enables saving and computes the check digit when it is left empty", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const checkDigit = await screen.findByTestId("company.check_digit_input");
    await userEvent.clear(checkDigit);

    // An empty check digit no longer blocks the save.
    expect(
      screen.queryByTestId("company.check_digit_error"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("company.save_button")).toBeEnabled();

    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    // The system computes the DIAN módulo 11 digit for 900123456 (8) and sends
    // it as a bigint, so the backend's required check digit is satisfied.
    expect(updateCompanyProfileMock.mock.calls[0][0]).toMatchObject({
      documentType: DocumentType.nit,
      taxId: "900123456",
      checkDigit: 8n,
    });
  });

  it("enables saving and defaults the tax rate to 19 when it is left empty", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    const taxRate = await screen.findByTestId("company.tax_rate_input");
    await userEvent.clear(taxRate);

    // An empty tax rate no longer blocks the save and shows no range error.
    expect(
      screen.queryByTestId("company.tax_rate_error"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("company.save_button")).toBeEnabled();

    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    // The empty field falls back to the documented 19% default.
    expect(updateCompanyProfileMock.mock.calls[0][0]).toMatchObject({
      taxRate: 19n,
    });
  });

  it("shows the saving state and disables the button while the save is in flight", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    let resolveSave: ((value: CompanyProfile) => void) | undefined;
    updateCompanyProfileMock.mockImplementation(
      () =>
        new Promise<CompanyProfile>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.click(screen.getByTestId("company.save_button"));

    // While the mutation is pending the button reports the in-progress label
    // and cannot be submitted again.
    const pendingButton = await screen.findByTestId("company.save_button");
    expect(pendingButton).toHaveTextContent("Guardando…");
    expect(pendingButton).toBeDisabled();

    resolveSave?.(profile());
    await waitFor(() =>
      expect(screen.getByTestId("company.save_button")).toHaveTextContent(
        "Guardar datos",
      ),
    );
    expect(screen.getByTestId("company.save_button")).toBeEnabled();
  });

  it("reports a failed save with an error notification", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockRejectedValue(
      new Error("No se pudo contactar el backend"),
    );
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudieron guardar los datos",
        expect.objectContaining({
          description: "No se pudo contactar el backend",
        }),
      ),
    );
    // The failure leaves the form editable so the administrator can retry.
    expect(screen.getByTestId("company.save_button")).toBeEnabled();
  });

  it("keeps the saved values after the profile is reloaded", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(
      profile({ legalName: "Taller Nuevo S.A.S." }),
    );
    renderWithProviders(<CompanyPage />);

    const legalName = await screen.findByTestId("company.legal_name_input");
    await userEvent.clear(legalName);
    await userEvent.type(legalName, "Taller Nuevo S.A.S.");
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );

    // A successful save invalidates the profile query, so the page refetches
    // and renders the persisted value rather than the stale draft.
    getCompanyProfileMock.mockResolvedValue(
      profile({ legalName: "Taller Nuevo S.A.S." }),
    );
    await waitFor(() =>
      expect(getCompanyProfileMock.mock.calls.length).toBeGreaterThan(1),
    );
    await waitFor(() =>
      expect(screen.getByTestId("company.legal_name_input")).toHaveValue(
        "Taller Nuevo S.A.S.",
      ),
    );
  });
});
