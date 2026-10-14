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
 * Characterization coverage for the operation panel's loading, refresh and
 * error behavior.
 *
 * The accepted change replaces the flow shortcuts with an alert grid. These
 * tests protect the adjacent behavior that must survive it: the panel still
 * shows its skeleton while the *first* read is in flight and replaces it with
 * real content once the data arrives, the explicit "Actualizar" action still
 * refetches the panel's reads, and a failed read still surfaces the error state
 * with a working retry.
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

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    // `null` = sin restricción por módulo (administrador por Internet
    // Identity). El fixture debe declararlo: `canAccess` llama a
    // `modules.includes` y un `undefined` rompe el render.
    modules: null,
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

describe("DashboardPage loading and refresh (characterization)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDashboardAlertsMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDashboardAlertsMock.mockResolvedValue(summary());
  });

  it("shows the loading skeleton while the first read is in flight, then the content", async () => {
    // The first alerts read never settles until the test releases it, so the
    // panel is observed in its genuine loading state.
    let resolveAlerts: ((value: DashboardAlertsSummary) => void) | undefined;
    getDashboardAlertsMock.mockImplementation(
      () =>
        new Promise<DashboardAlertsSummary>((resolve) => {
          resolveAlerts = resolve;
        }),
    );

    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByTestId("dashboard.company_header.loading"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.alerts.loading")).toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.company_header"),
    ).not.toBeInTheDocument();

    resolveAlerts?.(summary());

    // Once the read resolves the skeleton is replaced by the real nameplate.
    expect(
      await screen.findByTestId("dashboard.company_header"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.company_header.loading"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.alerts.loading"),
    ).not.toBeInTheDocument();
  });

  it("refetches the panel reads when the refresh action is used", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.company_header");
    const profileCalls = getCompanyProfileMock.mock.calls.length;
    const alertsCalls = getDashboardAlertsMock.mock.calls.length;

    await userEvent.click(screen.getByTestId("dashboard.refresh_button"));

    // The explicit refresh must still reach the backend for both the profile
    // and the aggregated alerts, even though the panel now caches them.
    await waitFor(() =>
      expect(getCompanyProfileMock.mock.calls.length).toBeGreaterThan(
        profileCalls,
      ),
    );
    await waitFor(() =>
      expect(getDashboardAlertsMock.mock.calls.length).toBeGreaterThan(
        alertsCalls,
      ),
    );
  });

  it("shows the error state with a retry when a panel read fails", async () => {
    // The panel's error state is driven by the aggregated alerts read, so the
    // failing read must be that one (the profile query has its own empty state
    // and does not flip the panel into its error view).
    getDashboardAlertsMock.mockRejectedValue(new Error("backend caído"));
    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByTestId("dashboard.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.retry_button")).toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.company_header"),
    ).not.toBeInTheDocument();
  });
});
