import type { DashboardAlertsSummary } from "@/backend";
import type { CompanyProfile } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { DashboardPage } from "@/pages/DashboardPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the operation panel's adjacent contract.
 *
 * The accepted change replaces the flow-shortcut cards with a grid of
 * clickable alert cards. This file protects the behavior around that rework
 * that must survive it, without pinning the shortcut-card layout that is
 * intentionally replaced:
 *
 *   - the "Actualizar" action stays present and labeled in Spanish;
 *   - "Reintentar" actually re-queries the failed reads, not just renders;
 *   - a role with a restricted module list only sees the modules it can
 *     access (the alert cards must respect the active role's modules);
 *   - the company nameplate stays at the top of the panel, above the content.
 *
 * It asserts only observable behavior and the panel's stable `data-ocid`
 * hooks, so it stays valid while the panel's internal cards change.
 */

const useRoleMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getDashboardAlertsMock = vi.fn();

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCompanyProfile: getCompanyProfileMock,
      getDashboardAlerts: getDashboardAlertsMock,
    },
    isFetching: false,
  }),
}));

// The alert query only runs with an authenticated session; the default setup
// mock reports no session, so this file overrides `useAuth` while keeping the
// real `AuthProvider` that `renderWithProviders` mounts.
vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return {
    ...actual,
    useAuth: () => ({ token: "session-token", isAuthenticated: true }),
  };
});

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

function companyProfile(
  overrides: Partial<CompanyProfile> = {},
): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.responsableIva,
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30",
    city: "Bogotá",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function roleState(isAdmin: boolean, modules: string[] | null) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    modules,
    refetch: vi.fn(),
  };
}

function summary(): DashboardAlertsSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    unapprovedOrders: { count: 4n, items: [] },
    appointments: { count: 3n, items: [] },
    pendingQuotes: { count: 2n, items: [] },
    lowStockParts: { count: 12n, items: [] },
    receivables: { count: 5n, items: [] },
    payables: { count: 6n, items: [] },
    supplierOrders: { count: 7n, items: [] },
    overdueInstallments: { count: 8n, items: [] },
  };
}

describe("DashboardPage alert redesign (characterization)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDashboardAlertsMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true, null));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDashboardAlertsMock.mockResolvedValue(summary());
  });

  it("keeps the 'Actualizar' action present and labeled in Spanish", async () => {
    renderWithProviders(<DashboardPage />);

    const refresh = await screen.findByTestId("dashboard.refresh_button");
    expect(refresh).toHaveTextContent("Actualizar");
  });

  it("re-queries the failed reads when 'Reintentar' is used", async () => {
    // The first alerts read fails, so the panel shows its error state.
    getDashboardAlertsMock.mockRejectedValueOnce(new Error("backend caído"));
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.error_state");
    const retry = screen.getByTestId("dashboard.retry_button");
    expect(retry).toHaveTextContent("Reintentar");

    // The retry must actually reach the backend again, not just re-render.
    const alertsCalls = getDashboardAlertsMock.mock.calls.length;
    await userEvent.click(retry);

    await waitFor(() =>
      expect(getDashboardAlertsMock.mock.calls.length).toBeGreaterThan(
        alertsCalls,
      ),
    );
  });

  it("only shows modules the active role can access", async () => {
    // A restricted role that only enables the workshop module. The backend
    // withholds the sections the role cannot access, so the fixture mirrors
    // that by returning only the workshop alerts.
    useRoleMock.mockReturnValue(roleState(false, ["workshop"]));
    getDashboardAlertsMock.mockResolvedValue({
      generatedAt: 1_700_000_000_000_000_000n,
      unapprovedOrders: { count: 4n, items: [] },
      appointments: { count: 3n, items: [] },
    });
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");
    // The accessible module is shown...
    expect(screen.getByText("OT sin aprobar")).toBeInTheDocument();
    // ...and the modules outside the role's list are not.
    expect(screen.queryByText("Inventario por agotarse")).toBeNull();
    expect(screen.queryByText("Cuotas vencidas")).toBeNull();
    expect(screen.queryByText("Cuentas por cobrar")).toBeNull();
  });

  it("keeps the company nameplate above the panel content", async () => {
    renderWithProviders(<DashboardPage />);

    const header = await screen.findByTestId("dashboard.company_header");
    const content = screen.getByTestId("dashboard.alerts.section");

    // The nameplate precedes the content in document order.
    expect(
      header.compareDocumentPosition(content) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
