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
 * Coverage for the company logo control on the company data page.
 *
 * The accepted change makes the administrator able to upload or change the
 * company logo from the company data page and have it saved and visible. The
 * logo must be uploaded to the platform storage and a *permanent* URL persisted
 * — never an in-memory `blob:` object URL. These tests pin that accepted
 * behavior: the image-only guard, the preview that reflects the selected file,
 * the remove action, the permanent `logoUrl` carried in the save payload, and
 * the logo shown in the dashboard header.
 *
 * The upload transport (`StorageClient.putFile` + `getDirectURL`) is mocked so
 * the test observes the URL the page stores and sends, not the platform's byte
 * handling. The mock deliberately returns a gateway URL, so a page that
 * persisted `ExternalBlob.getDirectURL()`'s `blob:` value would fail here.
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

// The object-storage package is the upload transport. `ExternalBlob` only
// produces an in-memory `blob:` URL; the permanent URL comes from the storage
// client's `getDirectURL(hash)` after `putFile` pushes the bytes. Both are
// mocked so the test observes the URL the page stores and sends.
const fromBytesMock = vi.fn();
const putFileMock = vi.fn();
const getDirectURLMock = vi.fn();
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: {
    fromBytes: (...args: unknown[]) => fromBytesMock(...args),
  },
  StorageClient: class {
    putFile(...args: unknown[]) {
      return putFileMock(...args);
    }
    getDirectURL(...args: unknown[]) {
      return getDirectURLMock(...args);
    }
  },
}));

// `uploadImage` builds the storage client from the deployment config.
vi.mock("@caffeineai/core-infrastructure", () => ({
  loadConfig: () =>
    Promise.resolve({
      backend_host: "https://icp.example.com",
      bucket_name: "bucket",
      storage_gateway_url: "https://gateway.example.com",
      backend_canister_id: "aaaaa-aa",
      project_id: "project-1",
    }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

/** The permanent gateway URL the mocked storage client resolves to. */
const PERMANENT_LOGO_URL = "https://gateway.example.com/logo-hash.png";

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

/** A `File` whose bytes jsdom can read back through `arrayBuffer()`. */
function imageFile(name = "logo.png", type = "image/png"): File {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
  const file = new File([bytes], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(bytes),
  });
  return file;
}

/** The hidden file input the "Subir logo" button opens. */
function logoInput(): HTMLInputElement {
  return screen.getByTestId("company.logo.input") as HTMLInputElement;
}

describe("CompanyPage logo", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    updateCompanyProfileMock.mockReset();
    fromBytesMock.mockReset();
    putFileMock.mockReset();
    getDirectURLMock.mockReset();
    useRoleMock.mockReturnValue(roleState(true));
    // The blob carries the bytes and metadata; the permanent URL is what the
    // storage client resolves after the upload.
    fromBytesMock.mockReturnValue({
      getBytes: () => Promise.resolve(new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
      contentType: "image/png",
      filename: "logo.png",
    });
    putFileMock.mockResolvedValue({ hash: "logo-hash" });
    getDirectURLMock.mockReturnValue(PERMANENT_LOGO_URL);
  });

  it("shows the stored logo in the preview when the profile has one", async () => {
    getCompanyProfileMock.mockResolvedValue(
      profile({ logoUrl: "https://cdn.example.com/logo.png" }),
    );
    renderWithProviders(<CompanyPage />);

    const preview = await screen.findByTestId("company.logo.preview");
    const image = preview.querySelector("img");
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("src", "https://cdn.example.com/logo.png");
  });

  it("shows the placeholder instead of an image when there is no logo", async () => {
    getCompanyProfileMock.mockResolvedValue(profile({ logoUrl: undefined }));
    renderWithProviders(<CompanyPage />);

    const preview = await screen.findByTestId("company.logo.preview");
    expect(preview.querySelector("img")).toBeNull();
    // The remove action only exists once a logo is set.
    expect(
      screen.queryByTestId("company.logo.remove_button"),
    ).not.toBeInTheDocument();
  });

  it("previews the selected image and offers to remove it", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.upload(logoInput(), imageFile());

    await waitFor(() =>
      expect(screen.getByTestId("company.logo.preview").querySelector("img")),
    );
    // The preview shows the permanent uploaded URL, not an in-memory blob URL.
    expect(
      screen.getByTestId("company.logo.preview").querySelector("img"),
    ).toHaveAttribute("src", PERMANENT_LOGO_URL);
    expect(
      screen.getByTestId("company.logo.remove_button"),
    ).toBeInTheDocument();
  });

  it("rejects a non-image file without changing the preview", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    // `userEvent.upload` honors the input's `accept="image/*"` and refuses to
    // set a non-matching file, so the change event is dispatched directly to
    // exercise the page's own image-type guard.
    fireEvent.change(logoInput(), {
      target: {
        files: [new File(["texto"], "notas.txt", { type: "text/plain" })],
      },
    });

    expect(
      await screen.findByTestId("company.logo.error_state"),
    ).toHaveTextContent("Selecciona un archivo de imagen");
    expect(
      screen.getByTestId("company.logo.preview").querySelector("img"),
    ).toBeNull();
    // A rejected file is never uploaded.
    expect(putFileMock).not.toHaveBeenCalled();
  });

  it("clears the logo when the remove action is used", async () => {
    getCompanyProfileMock.mockResolvedValue(
      profile({ logoUrl: "https://cdn.example.com/logo.png" }),
    );
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.click(screen.getByTestId("company.logo.remove_button"));

    expect(
      screen.getByTestId("company.logo.preview").querySelector("img"),
    ).toBeNull();
    expect(
      screen.queryByTestId("company.logo.remove_button"),
    ).not.toBeInTheDocument();
  });

  it("uploads the bytes and sends the permanent URL in the save payload", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.upload(logoInput(), imageFile());
    await waitFor(() => expect(putFileMock).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    const input = updateCompanyProfileMock.mock.calls[0][0];
    expect(input).toMatchObject({ logoUrl: PERMANENT_LOGO_URL });
    // The persisted URL is the permanent gateway URL, never an in-memory blob.
    expect(input.logoUrl).not.toMatch(/^blob:/);
  });

  it("omits the logo from the payload when none is set", async () => {
    getCompanyProfileMock.mockResolvedValue(profile({ logoUrl: undefined }));
    updateCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    expect(updateCompanyProfileMock.mock.calls[0][0].logoUrl).toBeUndefined();
  });

  it("keeps the uploaded logo after the profile is reloaded", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(
      profile({ logoUrl: PERMANENT_LOGO_URL }),
    );
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.upload(logoInput(), imageFile());
    await waitFor(() => expect(putFileMock).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByTestId("company.save_button"));

    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );

    // A successful save invalidates the profile query, so the page refetches
    // and renders the persisted logo rather than the stale draft.
    getCompanyProfileMock.mockResolvedValue(
      profile({ logoUrl: PERMANENT_LOGO_URL }),
    );
    await waitFor(() =>
      expect(getCompanyProfileMock.mock.calls.length).toBeGreaterThan(1),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId("company.logo.preview").querySelector("img"),
      ).toHaveAttribute("src", PERMANENT_LOGO_URL),
    );
  });

  it("disables the logo controls for a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    expect(screen.getByTestId("company.logo.upload_button")).toBeDisabled();
    expect(logoInput()).toBeDisabled();
  });

  it("reports a successful logo upload with a notification", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.upload(logoInput(), imageFile());

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Logo cargado",
        expect.objectContaining({ description: expect.any(String) }),
      ),
    );
  });

  it("surfaces an upload failure and does not persist a logo", async () => {
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    putFileMock.mockRejectedValue(new Error("No se pudo subir el archivo."));
    renderWithProviders(<CompanyPage />);

    await screen.findByTestId("company.form");
    await userEvent.upload(logoInput(), imageFile());

    // A failed upload shows the error and leaves the preview empty, so no
    // non-durable URL can be saved.
    expect(
      await screen.findByTestId("company.logo.error_state"),
    ).toHaveTextContent("No se pudo subir el archivo.");
    expect(
      screen.getByTestId("company.logo.preview").querySelector("img"),
    ).toBeNull();

    await userEvent.click(screen.getByTestId("company.save_button"));
    await waitFor(() =>
      expect(updateCompanyProfileMock).toHaveBeenCalledTimes(1),
    );
    expect(updateCompanyProfileMock.mock.calls[0][0].logoUrl).toBeUndefined();
  });
});
