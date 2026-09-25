import type { DriveConnectionStatus } from "@/backend";
import { useDriveConnection } from "@/hooks/use-backup";
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
} from "@/hooks/use-company";
import { useRole } from "@/hooks/use-role";
import type { CompanyProfile } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the shared-data hooks the caching change
 * touches: the caller role, the company profile and the Drive connection.
 *
 * The accepted change makes these three reads shared across screens and stops
 * them from repeating on every module switch. These tests protect the contract
 * that must survive that change: each hook still resolves the backend value,
 * exposes the derived flags the shell depends on, keeps the administrator gate
 * on the Drive read, and still refetches after a company-profile update.
 *
 * They deliberately do not assert how many times a query runs across route
 * changes — that is the behavior the accepted change intentionally alters.
 */

const getCallerUserRoleMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const updateCompanyProfileMock = vi.fn();
const getDriveConnectionStatusMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCallerUserRole: getCallerUserRoleMock,
      getCompanyProfile: getCompanyProfileMock,
      updateCompanyProfile: updateCompanyProfileMock,
      getDriveConnectionStatus: getDriveConnectionStatusMock,
    },
    isFetching: false,
  }),
}));

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

function driveStatus(
  overrides: Partial<DriveConnectionStatus> = {},
): DriveConnectionStatus {
  return {
    connected: false,
    configuration: { configured: true, missingVariables: [] },
    ...overrides,
  };
}

/** Renders the role hook and exposes its resolved state as text. */
function RoleProbe() {
  const { role, isAdmin, isLoading } = useRole();
  return (
    <div>
      <span data-ocid="role.value">{role ?? "none"}</span>
      <span data-ocid="role.is_admin">{String(isAdmin)}</span>
      <span data-ocid="role.is_loading">{String(isLoading)}</span>
    </div>
  );
}

/** Renders the company profile hook and exposes its resolved value. */
function CompanyProbe() {
  const query = useCompanyProfile();
  return (
    <div>
      <span data-ocid="company.legal_name">
        {query.data?.legalName ?? "none"}
      </span>
      <span data-ocid="company.logo">{query.data?.logoUrl ?? "none"}</span>
      <span data-ocid="company.is_loading">{String(query.isLoading)}</span>
    </div>
  );
}

/** Renders the Drive connection hook and exposes its derived flags. */
function DriveProbe({ enabled }: { enabled: boolean }) {
  const drive = useDriveConnection(enabled);
  return (
    <div>
      <span data-ocid="drive.configured">
        {String(drive.isDriveConfigured)}
      </span>
      <span data-ocid="drive.is_loading">{String(drive.isLoading)}</span>
      <span data-ocid="drive.account_email">
        {drive.accountEmail ?? "none"}
      </span>
    </div>
  );
}

/** Saves the profile through the update mutation and reports the outcome. */
function CompanySaveProbe() {
  const query = useCompanyProfile();
  const save = useUpdateCompanyProfile();
  return (
    <div>
      <span data-ocid="save.legal_name">{query.data?.legalName ?? "none"}</span>
      <button
        type="button"
        data-ocid="save.button"
        onClick={() =>
          save.mutate(profile({ legalName: "Taller Nuevo S.A.S." }))
        }
      >
        Guardar
      </button>
    </div>
  );
}

describe("shared-data hooks (characterization)", () => {
  beforeEach(() => {
    getCallerUserRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    updateCompanyProfileMock.mockReset();
    getDriveConnectionStatusMock.mockReset();
    getCallerUserRoleMock.mockResolvedValue(UserRole.admin);
    getCompanyProfileMock.mockResolvedValue(profile());
    updateCompanyProfileMock.mockResolvedValue(profile());
    getDriveConnectionStatusMock.mockResolvedValue(driveStatus());
  });

  it("resolves the caller role and derives the administrator flag", async () => {
    renderWithProviders(<RoleProbe />);

    await waitFor(() =>
      expect(screen.getByTestId("role.value")).toHaveTextContent("admin"),
    );
    expect(screen.getByTestId("role.is_admin")).toHaveTextContent("true");
    expect(screen.getByTestId("role.is_loading")).toHaveTextContent("false");
  });

  it("reports a mechanic as not an administrator", async () => {
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    renderWithProviders(<RoleProbe />);

    await waitFor(() =>
      expect(screen.getByTestId("role.value")).toHaveTextContent("user"),
    );
    expect(screen.getByTestId("role.is_admin")).toHaveTextContent("false");
  });

  it("resolves the company profile with its persisted logo", async () => {
    getCompanyProfileMock.mockResolvedValue(
      profile({ logoUrl: "https://gateway.example.com/logo-hash.png" }),
    );
    renderWithProviders(<CompanyProbe />);

    await waitFor(() =>
      expect(screen.getByTestId("company.legal_name")).toHaveTextContent(
        "HR SOLUCIONES INTEGRALES S.A.S.",
      ),
    );
    expect(screen.getByTestId("company.logo")).toHaveTextContent(
      "https://gateway.example.com/logo-hash.png",
    );
    expect(screen.getByTestId("company.is_loading")).toHaveTextContent("false");
  });

  it("refetches the company profile after a successful save", async () => {
    renderWithProviders(<CompanySaveProbe />);

    await waitFor(() =>
      expect(screen.getByTestId("save.legal_name")).toHaveTextContent(
        "HR SOLUCIONES INTEGRALES S.A.S.",
      ),
    );
    const callsBeforeSave = getCompanyProfileMock.mock.calls.length;

    // The save invalidates the profile query, so the page must read it again
    // and render the persisted value rather than the stale one.
    getCompanyProfileMock.mockResolvedValue(
      profile({ legalName: "Taller Nuevo S.A.S." }),
    );
    await userEvent.click(screen.getByTestId("save.button"));

    await waitFor(() =>
      expect(getCompanyProfileMock.mock.calls.length).toBeGreaterThan(
        callsBeforeSave,
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("save.legal_name")).toHaveTextContent(
        "Taller Nuevo S.A.S.",
      ),
    );
  });

  it("resolves the Drive connection status for an administrator", async () => {
    getDriveConnectionStatusMock.mockResolvedValue(
      driveStatus({ connected: true, accountEmail: "dueno@example.com" }),
    );
    renderWithProviders(<DriveProbe enabled={true} />);

    await waitFor(() =>
      expect(screen.getByTestId("drive.configured")).toHaveTextContent("true"),
    );
    expect(screen.getByTestId("drive.account_email")).toHaveTextContent(
      "dueno@example.com",
    );
    expect(screen.getByTestId("drive.is_loading")).toHaveTextContent("false");
  });

  it("does not read the Drive status when the hook is disabled", async () => {
    renderWithProviders(<DriveProbe enabled={false} />);

    // A disabled hook never reaches the backend, so the administrator gate on
    // the Drive read survives the caching change.
    await waitFor(() =>
      expect(screen.getByTestId("drive.is_loading")).toHaveTextContent("false"),
    );
    expect(getDriveConnectionStatusMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("drive.configured")).toHaveTextContent("false");
  });
});
