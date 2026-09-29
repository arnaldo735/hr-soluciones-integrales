import type { BusinessSettings } from "@/lib/types";
import { UserRole } from "@/lib/types";
import { SettingsPage } from "@/pages/SettingsPage";
import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the user-management seam in Configuración.
 *
 * The accepted change moves user and role management out of Configuración and
 * onto their own screens (`/configuracion/usuarios` and `/configuracion/roles`).
 * These tests protect the contract that must survive that rework: the page
 * still exposes a user-management section that links to both management
 * screens, and the rest of the page keeps rendering around it.
 *
 * They deliberately do not assert the old inline users table or the
 * principal-based identity model, which the accepted change intentionally
 * replaces.
 */

const getBusinessSettingsMock = vi.fn();
const getCallerUserProfileMock = vi.fn();
const getDriveConnectionStatusMock = vi.fn();
const listBackupsMock = vi.fn();
const getLocalBackupManifestMock = vi.fn();
const getBackupSectionMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getBusinessSettings: getBusinessSettingsMock,
      getCallerUserProfile: getCallerUserProfileMock,
      getDriveConnectionStatus: getDriveConnectionStatusMock,
      listBackups: listBackupsMock,
      getLocalBackupManifest: getLocalBackupManifestMock,
      getBackupSection: getBackupSectionMock,
    },
    isFetching: false,
  }),
}));

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

function settings(): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
  };
}

describe("SettingsPage user management (characterization)", () => {
  beforeEach(() => {
    getBusinessSettingsMock.mockReset();
    getCallerUserProfileMock.mockReset();
    getDriveConnectionStatusMock.mockReset();
    listBackupsMock.mockReset();
    getLocalBackupManifestMock.mockReset();
    getBackupSectionMock.mockReset();

    getBusinessSettingsMock.mockResolvedValue(settings());
    getCallerUserProfileMock.mockResolvedValue({
      name: "Dueño",
      role: UserRole.admin,
      createdAt: 0n,
    });
    getDriveConnectionStatusMock.mockResolvedValue({ connected: false });
    listBackupsMock.mockResolvedValue({ __kind__: "ok", ok: [] });
  });

  it("links to the users and roles management screens", async () => {
    renderWithProviders(<SettingsPage />);

    const card = await screen.findByTestId("settings.user_management.card");
    expect(card).toBeInTheDocument();
    expect(screen.getByTestId("settings.users.link")).toHaveAttribute(
      "href",
      "/configuracion/usuarios",
    );
    expect(screen.getByTestId("settings.roles.link")).toHaveAttribute(
      "href",
      "/configuracion/roles",
    );
  });

  it("keeps the rest of the page rendered around the management links", async () => {
    renderWithProviders(<SettingsPage />);

    expect(
      await screen.findByTestId("settings.user_management.card"),
    ).toBeInTheDocument();
    // The surrounding sections still render on the same page.
    expect(screen.getByTestId("settings.business.card")).toBeInTheDocument();
    expect(screen.getByTestId("settings.profile.card")).toBeInTheDocument();
    expect(screen.getByTestId("settings.password.card")).toBeInTheDocument();
  });
});
