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
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the reworked operation panel.
 *
 * The accepted change replaces the flow-shortcut bands with a grid of clickable
 * alert cards. These tests pin the accepted behavior: the company data is shown
 * at the top, the low-stock list and indicator are gone, each alert card links
 * to its module, and a mechanic does not see the administration, purchasing or
 * payables alerts.
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
    // Identity). Un mecánico sí trae su lista de módulos: el fixture debe
    // declararla porque `canAccess` llama a `modules.includes` y un
    // `undefined` rompe el render.
    modules: isAdmin ? null : ["workshop", "appointments", "technicians"],
    refetch: vi.fn(),
  };
}

/** A summary with every section present, each carrying a distinct count. */
function fullSummary(): DashboardAlertsSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    unapprovedOrders: { count: 4n, items: [] },
    appointments: { count: 3n, items: [] },
    finishedOrders: { count: 1n, items: [] },
    pendingQuotes: { count: 2n, items: [] },
    lowStockParts: { count: 12n, items: [] },
    receivables: { count: 5n, items: [] },
    payables: { count: 6n, items: [] },
    supplierOrders: { count: 7n, items: [] },
    overdueInstallments: { count: 8n, items: [] },
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDashboardAlertsMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDashboardAlertsMock.mockResolvedValue(fullSummary());
  });

  it("shows the company nameplate at the top with its legal data", async () => {
    renderWithProviders(<DashboardPage />);

    const header = await screen.findByTestId("dashboard.company_header");
    expect(header).toHaveTextContent("Taller HR Motos");
    expect(header).toHaveTextContent("HR SOLUCIONES INTEGRALES S.A.S.");
    expect(header).toHaveTextContent("900123456-8");
    expect(header).toHaveTextContent("+57 300 000 0000");
    expect(header).toHaveTextContent("contacto@hrsolucionesintegrales.com");
    expect(header).toHaveTextContent("Calle 45 #12-30, Bogotá");
  });

  it("no longer shows the low-stock list or its indicator", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.company_header");
    expect(screen.queryByTestId("dashboard.low_stock.empty_state")).toBeNull();
    expect(screen.queryByText(/bajo stock/i)).toBeNull();
  });

  it("shows the alert grid with each module's live count", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alerts.section");
    // The inventory alert carries the live low-stock count (12).
    const inventory = screen.getByTestId("dashboard.alert.5");
    expect(inventory).toHaveTextContent("Inventario por agotarse");
    expect(within(inventory).getByText("12")).toBeInTheDocument();
  });

  it("opens the alert's records in a modal instead of navigating to the module", async () => {
    // The accepted change replaces the card's module link with an in-panel
    // modal. The card is now a button that opens the alert list dialog and the
    // route does not change.
    const initialUrl = window.location.href;
    renderWithProviders(<DashboardPage />);

    const inventory = await screen.findByTestId("dashboard.alert.5");
    expect(inventory).not.toHaveAttribute("href");
    await userEvent.click(inventory);

    expect(
      await screen.findByTestId("dashboard.alert_list.dialog"),
    ).toBeInTheDocument();
    expect(window.location.href).toBe(initialUrl);
  });

  it("hides the administration, purchasing and payables alerts from a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    // The backend withholds the sections a mechanic's role cannot access.
    getDashboardAlertsMock.mockResolvedValue({
      generatedAt: 1_700_000_000_000_000_000n,
      unapprovedOrders: { count: 4n, items: [] },
      appointments: { count: 3n, items: [] },
      pendingQuotes: { count: 2n, items: [] },
    });
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");
    // The mechanic still sees the workshop alerts...
    expect(screen.getByText("OT sin aprobar")).toBeInTheDocument();
    // ...but not the administration, purchasing or payables alerts.
    expect(screen.queryByText("Cuentas por cobrar")).toBeNull();
    expect(screen.queryByText("Cuentas por pagar")).toBeNull();
    expect(screen.queryByText("Pedidos a proveedor")).toBeNull();
    expect(screen.queryByText("Cuotas vencidas")).toBeNull();
    expect(
      screen.getByTestId("dashboard.admin_only_notice"),
    ).toBeInTheDocument();
  });

  it("shows the empty company state when no profile is configured", async () => {
    getCompanyProfileMock.mockResolvedValue(null);
    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByTestId("dashboard.company_header.empty_state"),
    ).toBeInTheDocument();
  });

  // --- Characterization: the nameplate's logo and flow order ----------------
  //
  // The accepted change reworks the panel's contents but keeps the centered
  // nameplate and the flow grouping. These tests protect the parts of that
  // contract the accepted behavior does not alter: the configured logo renders
  // in the header (with the initials fallback when there is none), and the flow
  // groups keep their fixed operational order.

  it("renders the configured logo in the company header", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ logoUrl: "https://cdn.example.com/logo.png" }),
    );
    renderWithProviders(<DashboardPage />);

    const header = await screen.findByTestId("dashboard.company_header");
    const logo = header.querySelector("img");
    expect(logo).not.toBeNull();
    expect(logo).toHaveAttribute("src", "https://cdn.example.com/logo.png");
  });

  it("falls back to the company initials when there is no logo", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ logoUrl: undefined }),
    );
    renderWithProviders(<DashboardPage />);

    const header = await screen.findByTestId("dashboard.company_header");
    expect(header.querySelector("img")).toBeNull();
    // "Taller HR Motos" -> "TH".
    expect(header).toHaveTextContent("TH");
  });

  it("keeps the alert cards in their fixed operational order", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");
    const section = screen.getByTestId("dashboard.alerts.section");
    const cards = Array.from(
      section.querySelectorAll<HTMLElement>("[data-ocid^='dashboard.alert.']"),
    ).map((node) => node.getAttribute("data-ocid"));

    expect(cards).toEqual([
      "dashboard.alert.1",
      "dashboard.alert.2",
      "dashboard.alert.3",
      "dashboard.alert.4",
      "dashboard.alert.5",
      "dashboard.alert.6",
      "dashboard.alert.7",
      "dashboard.alert.8",
      "dashboard.alert.9",
    ]);
  });
});
