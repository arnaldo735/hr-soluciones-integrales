import type { BusinessSettings, UserView } from "@/lib/types";
import { UserRole } from "@/lib/types";
import { SettingsPage } from "@/pages/SettingsPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getBusinessSettingsMock = vi.fn();
const updateBusinessSettingsMock = vi.fn();
const getCallerUserProfileMock = vi.fn();
const listUsersMock = vi.fn();
const getDriveConnectionStatusMock = vi.fn();
const listBackupsMock = vi.fn();
const downloadLocalBackupMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getBusinessSettings: getBusinessSettingsMock,
      updateBusinessSettings: updateBusinessSettingsMock,
      getCallerUserProfile: getCallerUserProfileMock,
      listUsers: listUsersMock,
      getDriveConnectionStatus: getDriveConnectionStatusMock,
      listBackups: listBackupsMock,
      downloadLocalBackup: downloadLocalBackupMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

function user(overrides: Partial<UserView> = {}): UserView {
  return {
    principal: Principal.fromText("aaaaa-aa"),
    name: "Dueño",
    role: UserRole.admin,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

describe("SettingsPage", () => {
  beforeEach(() => {
    getBusinessSettingsMock.mockReset();
    updateBusinessSettingsMock.mockReset();
    getCallerUserProfileMock.mockReset();
    listUsersMock.mockReset();
    getDriveConnectionStatusMock.mockReset();
    listBackupsMock.mockReset();
    downloadLocalBackupMock.mockReset();
    getCallerUserProfileMock.mockResolvedValue({
      name: "Dueño",
      role: UserRole.admin,
      createdAt: 0n,
    });
    listUsersMock.mockResolvedValue([]);
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

  it("lists users with their role labels", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    listUsersMock.mockResolvedValue([
      user(),
      user({
        principal: Principal.fromText("2vxsx-fae"),
        name: "Mecánico",
        role: UserRole.user,
      }),
    ]);
    renderWithProviders(<SettingsPage />);

    expect(await screen.findByText("Dueño")).toBeInTheDocument();
    const table = screen.getByTestId("settings.users.table");
    // The mechanic's name, role badge and role select all read "Mecánico".
    expect(
      within(table).getAllByText("Mecánico").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(table).getAllByText("Administrador").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders an empty state when no users are registered", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    listUsersMock.mockResolvedValue([]);
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.users.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay usuarios registrados"),
    ).toBeInTheDocument();
  });

  // --- Characterization: the existing settings sections keep rendering ------
  //
  // The accepted change adds a Google Drive backup card to this page. These
  // tests protect the sections that were already there: the page heading, the
  // business settings form, the caller profile card and the users card all
  // render together, and the profile read still seeds the name field.

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
    expect(screen.getByTestId("settings.users.card")).toBeInTheDocument();
  });

  // --- Accepted behavior: the Google Drive backup card ----------------------
  //
  // The accepted change adds the backup card to Configuración. It renders
  // alongside the existing sections and offers to connect when the
  // administrator has not authorized their Drive account yet.

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
  //
  // The accepted change adds a "Descargar copia local" action to the backup
  // area. These tests protect the surrounding page composition that must
  // survive it: the Drive backup card renders together with the business
  // settings, profile and users sections, and the page still loads its
  // business settings read.

  it("renders the Drive backup card alongside every existing section", async () => {
    getBusinessSettingsMock.mockResolvedValue(settings());
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.drive.card"),
    ).toBeInTheDocument();
    // The pre-existing sections are still present on the same page.
    expect(screen.getByTestId("settings.business.card")).toBeInTheDocument();
    expect(screen.getByTestId("settings.profile.card")).toBeInTheDocument();
    expect(screen.getByTestId("settings.users.card")).toBeInTheDocument();
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
  //
  // The accepted change adds a "Descargar copia local" action to Configuración,
  // beside the Google Drive backup. These tests protect the page composition:
  // both backup cards render together with the existing sections, and the local
  // download action is available to the administrator.

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
    expect(screen.getByTestId("settings.users.card")).toBeInTheDocument();
  });
});
