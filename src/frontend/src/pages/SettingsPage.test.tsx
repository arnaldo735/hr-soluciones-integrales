import type { BusinessSettings } from "@/lib/types";
import { UserRole } from "@/lib/types";
import { SettingsPage } from "@/pages/SettingsPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the Configuración page after the user-management rework.
 *
 * The accepted change moves user and role management to their own screens
 * (`/configuracion/usuarios` and `/configuracion/roles`). Configuración now
 * keeps the business settings, the backup cards, the caller profile and the
 * change-password card, and links out to the two management screens. These
 * tests protect that composition and the profile/password contracts.
 */

const getBusinessSettingsMock = vi.fn();
const updateBusinessSettingsMock = vi.fn();
const getCallerUserProfileMock = vi.fn();
const saveCallerUserProfileMock = vi.fn();
const changeOwnPasswordMock = vi.fn();
const getDriveConnectionStatusMock = vi.fn();
const listBackupsMock = vi.fn();
const getLocalBackupManifestMock = vi.fn();
const getBackupSectionMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getBusinessSettings: getBusinessSettingsMock,
      updateBusinessSettings: updateBusinessSettingsMock,
      getCallerUserProfile: getCallerUserProfileMock,
      saveCallerUserProfile: saveCallerUserProfileMock,
      changeOwnPassword: changeOwnPasswordMock,
      getDriveConnectionStatus: getDriveConnectionStatusMock,
      listBackups: listBackupsMock,
      getLocalBackupManifest: getLocalBackupManifestMock,
      getBackupSection: getBackupSectionMock,
    },
    isFetching: false,
  }),
}));

// The profile and password cards read the session from the auth context. Only
// `useAuth` is stubbed; the real `AuthProvider` that `renderWithProviders`
// mounts is preserved.
vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return { ...actual, useAuth: () => useAuthMock() };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// The page links to the users and roles screens with TanStack Router's `Link`,
// which needs a router context. Rendering it as a plain anchor keeps the
// navigation contract observable without mounting a router.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

function settings(overrides: Partial<BusinessSettings> = {}): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
    ...overrides,
  };
}

describe("SettingsPage", () => {
  beforeEach(() => {
    getBusinessSettingsMock.mockReset();
    updateBusinessSettingsMock.mockReset();
    getCallerUserProfileMock.mockReset();
    saveCallerUserProfileMock.mockReset();
    changeOwnPasswordMock.mockReset();
    getDriveConnectionStatusMock.mockReset();
    listBackupsMock.mockReset();
    getLocalBackupManifestMock.mockReset();
    getBackupSectionMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      token: null,
      user: null,
      isAdmin: false,
      modules: null,
      roleName: "Invitado",
      isAuthenticated: false,
      isLoading: false,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetch: vi.fn(),
    });
    getCallerUserProfileMock.mockResolvedValue({
      name: "Dueño",
      role: UserRole.admin,
      createdAt: 0n,
    });
    getDriveConnectionStatusMock.mockResolvedValue({ connected: false });
    listBackupsMock.mockResolvedValue({ __kind__: "ok", ok: [] });
  });

  it("loads the business settings into the form", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.business.form"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.business.name_input")).toHaveValue(
      "HR SOLUCIONES INTEGRALES",
    );
    expect(screen.getByTestId("settings.business.tax_id_input")).toHaveValue(
      "900.123.456-7",
    );
    expect(screen.getByTestId("settings.business.tax_rate_input")).toHaveValue(
      "16",
    );
  });

  it("rejects an out-of-range tax rate before saving", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    const taxRate = await screen.findByTestId(
      "settings.business.tax_rate_input",
    );
    await userEvent.clear(taxRate);
    await userEvent.type(taxRate, "150");

    expect(
      screen.getByTestId("settings.business.tax_rate_error"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.business.save_button")).toBeDisabled();
    expect(updateBusinessSettingsMock).not.toHaveBeenCalled();
  });

  it("saves the trimmed business settings with the tax rate as a bigint", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    updateBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    const name = await screen.findByTestId("settings.business.name_input");
    await userEvent.clear(name);
    await userEvent.type(name, "  Taller Nuevo  ");
    await userEvent.click(screen.getByTestId("settings.business.save_button"));

    await waitFor(() =>
      expect(updateBusinessSettingsMock).toHaveBeenCalledTimes(1),
    );
    expect(updateBusinessSettingsMock.mock.calls[0][0]).toEqual({
      name: "Taller Nuevo",
      taxId: "900.123.456-7",
      address: "Calle 45 #12-30, Bogotá",
      phone: "+57 300 000 0000",
      taxRate: 16n,
    });
  });

  it("renders an error state when the business settings fail to load", async () => {
    getBusinessSettingsMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.business.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudieron cargar los datos del negocio."),
    ).toBeInTheDocument();
  });

  // --- Accepted behavior: user and role management moved to their own screens

  it("links to the users and roles management screens", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.user_management.card"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.users.link")).toHaveAttribute(
      "href",
      "/configuracion/usuarios",
    );
    expect(screen.getByTestId("settings.roles.link")).toHaveAttribute(
      "href",
      "/configuracion/roles",
    );
  });

  // --- Characterization: the existing settings sections keep rendering ------
  //
  // The accepted change reworks the user-management seam. These tests protect
  // the sections that were already there: the page heading, the business
  // settings form, the caller profile card and the backup cards all render
  // together, and the profile read still seeds the name field.

  it("renders the heading and all existing sections together", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    expect(screen.getByTestId("settings.page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Configuración" }),
    ).toBeInTheDocument();

    expect(
      await screen.findByTestId("settings.business.form"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.profile.card")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.user_management.card"),
    ).toBeInTheDocument();
  });

  // --- Accepted behavior: the Google Drive backup card ----------------------

  it("renders the Google Drive backup card with the connect action", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    getDriveConnectionStatusMock.mockResolvedValue({ connected: false });
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.drive.card"),
    ).toBeInTheDocument();
    expect(screen.getByText("Respaldo en Google Drive")).toBeInTheDocument();
    expect(
      await screen.findByTestId("settings.drive.connect_button"),
    ).toBeInTheDocument();
  });

  it("seeds the profile name field from the caller profile read", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    getCallerUserProfileMock.mockResolvedValue({
      name: "Dueño del taller",
      role: UserRole.admin,
      createdAt: 0n,
    });
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.profile.name_input"),
    ).toHaveValue("Dueño del taller");
  });

  // --- Characterization: the Drive backup card sits among the existing
  // sections ----------------------------------------------------------------

  it("renders the Drive backup card alongside every existing section", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.drive.card"),
    ).toBeInTheDocument();
    // The pre-existing sections are still present on the same page.
    expect(screen.getByTestId("settings.business.card")).toBeInTheDocument();
    expect(screen.getByTestId("settings.profile.card")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.user_management.card"),
    ).toBeInTheDocument();
    // The Drive card keeps its own heading and setup panel.
    expect(screen.getByText("Respaldo en Google Drive")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.drive.setup_panel"),
    ).toBeInTheDocument();
  });

  it("keeps the business settings read working while the Drive card loads", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    // The Drive status never settles, so the page must still render the rest.
    getDriveConnectionStatusMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.business.form"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.business.name_input")).toHaveValue(
      "HR SOLUCIONES INTEGRALES",
    );
    expect(
      screen.getByTestId("settings.drive.connection.loading_state"),
    ).toBeInTheDocument();
  });

  // --- Accepted behavior: the local backup download sits next to Drive ------

  it("renders the local backup card next to the Drive backup card", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.drive.card"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.local_backup.card"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.local_backup.download_button"),
    ).toHaveTextContent("Descargar copia local");
    // The pre-existing sections are still present on the same page.
    expect(screen.getByTestId("settings.business.card")).toBeInTheDocument();
    expect(screen.getByTestId("settings.profile.card")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.user_management.card"),
    ).toBeInTheDocument();
  });

  // --- Accepted behavior: the caller's own profile and password -------------
  //
  // The accepted change lets each user see their name, username and role in
  // Configuración and change their own password by entering the current one.

  it("shows the caller's name, username and role from the session", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    useAuthMock.mockReturnValue({
      token: "session-token",
      user: {
        userId: 1n,
        username: "dueno.taller",
        name: "Dueño",
        roleId: 1n,
        roleName: "Administrador",
        modules: [],
      },
      isAdmin: true,
      modules: [],
      roleName: "Administrador",
      isAuthenticated: true,
      isLoading: false,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetch: vi.fn(),
    });
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.profile.name_value"),
    ).toHaveTextContent("Dueño");
    expect(
      screen.getByTestId("settings.profile.username_value"),
    ).toHaveTextContent("dueno.taller");
    expect(screen.getByTestId("settings.profile.role_value")).toHaveTextContent(
      "Administrador",
    );
  });

  it("changes the caller's password with the current one", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    changeOwnPasswordMock.mockResolvedValue(true);
    useAuthMock.mockReturnValue({
      token: "session-token",
      user: {
        userId: 1n,
        username: "dueno.taller",
        name: "Dueño",
        roleId: 1n,
        roleName: "Administrador",
        modules: [],
      },
      isAdmin: true,
      modules: [],
      roleName: "Administrador",
      isAuthenticated: true,
      isLoading: false,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetch: vi.fn(),
    });
    renderWithProviders(<SettingsPage />);

    await screen.findByTestId("settings.password.form");
    await userEvent.type(
      screen.getByTestId("settings.password.current_input"),
      "actual-123",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.new_input"),
      "nueva-456",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.confirm_input"),
      "nueva-456",
    );
    await userEvent.click(
      screen.getByTestId("settings.password.submit_button"),
    );

    await waitFor(() => expect(changeOwnPasswordMock).toHaveBeenCalledTimes(1));
    expect(changeOwnPasswordMock).toHaveBeenCalledWith(
      "session-token",
      "actual-123",
      "nueva-456",
    );
    expect(
      await screen.findByTestId("settings.password.success_state"),
    ).toBeInTheDocument();
  });

  it("reports a wrong current password without clearing the form", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    changeOwnPasswordMock.mockResolvedValue(false);
    useAuthMock.mockReturnValue({
      token: "session-token",
      user: {
        userId: 1n,
        username: "dueno.taller",
        name: "Dueño",
        roleId: 1n,
        roleName: "Administrador",
        modules: [],
      },
      isAdmin: true,
      modules: [],
      roleName: "Administrador",
      isAuthenticated: true,
      isLoading: false,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetch: vi.fn(),
    });
    renderWithProviders(<SettingsPage />);

    await screen.findByTestId("settings.password.form");
    await userEvent.type(
      screen.getByTestId("settings.password.current_input"),
      "mala",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.new_input"),
      "nueva-456",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.confirm_input"),
      "nueva-456",
    );
    await userEvent.click(
      screen.getByTestId("settings.password.submit_button"),
    );

    expect(
      await screen.findByTestId("settings.password.error_state"),
    ).toHaveTextContent("La contraseña actual no es correcta");
  });

  it("refuses to change the password without a password session", async () => {
    // The Internet Identity admin path has no session token, so the card must
    // explain that a username/password session is required instead of calling
    // the backend with an empty token.
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    await screen.findByTestId("settings.password.form");
    await userEvent.type(
      screen.getByTestId("settings.password.current_input"),
      "actual-123",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.new_input"),
      "nueva-456",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.confirm_input"),
      "nueva-456",
    );
    await userEvent.click(
      screen.getByTestId("settings.password.submit_button"),
    );

    expect(
      await screen.findByTestId("settings.password.error_state"),
    ).toHaveTextContent(
      "Debes iniciar sesión con usuario y contraseña para cambiarla.",
    );
    expect(changeOwnPasswordMock).not.toHaveBeenCalled();
  });

  it("blocks the password change when the new passwords do not match", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    await screen.findByTestId("settings.password.form");
    await userEvent.type(
      screen.getByTestId("settings.password.current_input"),
      "actual-123",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.new_input"),
      "nueva-456",
    );
    await userEvent.type(
      screen.getByTestId("settings.password.confirm_input"),
      "otra-789",
    );

    expect(
      screen.getByTestId("settings.password.confirm_error"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.password.submit_button"),
    ).toBeDisabled();
    expect(changeOwnPasswordMock).not.toHaveBeenCalled();
  });
});
