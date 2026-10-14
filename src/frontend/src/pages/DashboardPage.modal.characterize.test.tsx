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
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the operation panel's alert grid, ahead of the
 * accepted change that opens each alert's records in a modal inside the panel
 * instead of navigating to the module route.
 *
 * The card's destination is intentionally changing, so this file does NOT pin
 * the card's tag or its `href`. It protects the adjacent behavior the modal
 * rework must not break:
 *
 *   - the count shown on a card comes from the section's `count` field, not
 *     from `items.length` (the backend may return fewer items than the count,
 *     and the modal will render the item list separately);
 *   - each card keeps a single accessible interactive control whose accessible
 *     name carries the alert title and its Spanish message, so the trigger
 *     stays usable by assistive technology after it stops being a link;
 *   - the panel still renders exactly the sections the backend returns, in the
 *     fixed operational order, and still hides admin-only sections from a
 *     non-admin.
 *
 * The backend is mocked here, so this file proves rendered behavior only.
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

function fullSummary(
  overrides: Partial<DashboardAlertsSummary> = {},
): DashboardAlertsSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    unapprovedOrders: { count: 2n, items: [] },
    appointments: { count: 3n, items: [] },
    finishedOrders: { count: 1n, items: [] },
    pendingQuotes: { count: 4n, items: [] },
    lowStockParts: { count: 5n, items: [] },
    receivables: { count: 6n, items: [] },
    payables: { count: 7n, items: [] },
    supplierOrders: { count: 8n, items: [] },
    overdueInstallments: { count: 9n, items: [] },
    ...overrides,
  };
}

describe("DashboardPage alert grid (characterization)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDashboardAlertsMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true, null));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDashboardAlertsMock.mockResolvedValue(fullSummary());
  });

  it("shows the section count even when the returned item list is shorter", async () => {
    // The backend may report a count larger than the items it returns (the
    // reminders dialog slices its list). The card must reflect the section's
    // `count`, not the length of `items`, or the panel would under-report.
    getDashboardAlertsMock.mockResolvedValue(
      fullSummary({
        lowStockParts: {
          count: 12n,
          items: [
            {
              id: 1n,
              sku: "FIL-001",
              name: "Filtro de aceite",
              totalStock: 1n,
              lowStockThreshold: 5n,
            },
          ],
        },
      }),
    );
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.5");
    expect(within(card).getByText("12")).toBeInTheDocument();
    expect(within(card).queryByText("1")).toBeNull();
  });

  it("keeps a single accessible control per card naming the alert and its message", async () => {
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.1");
    // The card is one interactive control (a link today, a modal trigger after
    // the accepted change) whose accessible name carries the title and message.
    expect(card).toHaveAccessibleName(
      /^OT sin aprobar: Tiene 2 pendientes, haga clic aquí para verlos\.$/,
    );
  });

  it("renders exactly the sections the backend returns, in fixed order", async () => {
    // Only three sections are returned, so only three cards render.
    getDashboardAlertsMock.mockResolvedValue({
      generatedAt: 1_700_000_000_000_000_000n,
      unapprovedOrders: { count: 2n, items: [] },
      appointments: { count: 3n, items: [] },
      pendingQuotes: { count: 4n, items: [] },
    });
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
    ]);
    expect(screen.getByText("OT sin aprobar")).toBeInTheDocument();
    expect(screen.getByText("Citas pendientes")).toBeInTheDocument();
    expect(screen.getByText("Cotizaciones pendientes")).toBeInTheDocument();
    expect(screen.queryByText("Inventario por agotarse")).toBeNull();
  });

  it("hides admin-only sections from a non-admin even when the backend returns them", async () => {
    useRoleMock.mockReturnValue(
      roleState(false, ["workshop", "appointments", "quotes", "inventory"]),
    );
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");
    expect(screen.getByText("OT sin aprobar")).toBeInTheDocument();
    expect(screen.queryByText("Cuentas por cobrar")).toBeNull();
    expect(screen.queryByText("Cuentas por pagar")).toBeNull();
    expect(screen.queryByText("Pedidos a proveedor")).toBeNull();
    expect(screen.queryByText("Cuotas vencidas")).toBeNull();
  });
});
