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
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted operation-panel alert grid.
 *
 * The accepted change replaces the flow-shortcut bands with a grid of clickable
 * alert cards. Each card carries a colored header, an icon, a live count and a
 * Spanish message, and opens the alert's records in a modal inside the panel
 * instead of navigating to the module route. The backend decides which sections
 * a role may see; the panel renders exactly the sections it receives and hides
 * the admin-only destinations from a non-admin.
 *
 * The backend is mocked here, so this file proves the frontend consumer
 * contract and the rendered behavior only. The real `getDashboardAlerts`
 * aggregation is exercised in the PocketIC lane.
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

/** A summary with every section present, each carrying a distinct count. */
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

describe("DashboardPage alert grid (cover)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDashboardAlertsMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true, null));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDashboardAlertsMock.mockResolvedValue(fullSummary());
  });

  it("renders a clickable alert card with header, icon, count and Spanish message", async () => {
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.1");
    // The card is a button that opens the alert modal, not a module link.
    expect(card.tagName).toBe("BUTTON");
    expect(card).not.toHaveAttribute("href");
    // The colored header strip and the icon are present.
    expect(card.querySelector(".alert-card-strip")).not.toBeNull();
    expect(card.querySelector("svg")).not.toBeNull();
    // The count and the Spanish message are visible.
    expect(within(card).getByText("2")).toBeInTheDocument();
    expect(
      within(card).getByText(
        /Tiene 2 pendientes, haga clic aquí para verlos\./,
      ),
    ).toBeInTheDocument();
  });

  it("keeps the fixed card order and opens each card's modal without navigating", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");

    // The card order is fixed by the panel's alert definitions.
    const expected: Array<[number, string]> = [
      [1, "OT sin aprobar"],
      [2, "Citas pendientes"],
      [3, "Motos terminadas"],
      [4, "Cotizaciones pendientes"],
      [5, "Inventario por agotarse"],
      [6, "Cuentas por cobrar"],
      [7, "Cuentas por pagar"],
      [8, "Pedidos a proveedor"],
      [9, "Cuotas vencidas"],
    ];

    for (const [index, title] of expected) {
      const card = screen.getByTestId(`dashboard.alert.${index}`);
      expect(card).toHaveAccessibleName(new RegExp(`^${title}:`));
    }

    // Opening a card shows the alert modal in place; the route does not change.
    const initialUrl = window.location.href;
    await userEvent.click(screen.getByTestId("dashboard.alert.1"));
    expect(
      await screen.findByTestId("dashboard.alert_list.dialog"),
    ).toBeInTheDocument();
    expect(window.location.href).toBe(initialUrl);
  });

  it("reflects the backend counts for inventory, receivables, payables, appointments, orders and quotes", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");

    const countFor = (index: number): string => {
      const card = screen.getByTestId(`dashboard.alert.${index}`);
      return within(card).getByText(/^\d+$/).textContent ?? "";
    };

    // Order: unapprovedOrders, appointments, finishedOrders, pendingQuotes,
    // lowStockParts, receivables, payables, supplierOrders, overdueInstallments.
    expect(countFor(1)).toBe("2");
    expect(countFor(2)).toBe("3");
    expect(countFor(4)).toBe("4");
    expect(countFor(5)).toBe("5");
    expect(countFor(6)).toBe("6");
    expect(countFor(7)).toBe("7");
    expect(countFor(8)).toBe("8");
    expect(countFor(9)).toBe("9");
  });

  it("uses the overdue-installments message and opens its modal in place", async () => {
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.9");
    expect(
      within(card).getByText(
        /Tiene 9 cuotas vencidas, haga clic aquí para verlas\./,
      ),
    ).toBeInTheDocument();

    const initialUrl = window.location.href;
    await userEvent.click(card);
    const dialog = await screen.findByTestId("dashboard.alert_list.dialog");
    expect(within(dialog).getByText("Cuotas vencidas")).toBeInTheDocument();
    expect(window.location.href).toBe(initialUrl);
  });

  it("shows the singular overdue message for a single installment", async () => {
    getDashboardAlertsMock.mockResolvedValue(
      fullSummary({ overdueInstallments: { count: 1n, items: [] } }),
    );
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.9");
    expect(
      within(card).getByText(
        /Tiene 1 cuota vencida, haga clic aquí para verla\./,
      ),
    ).toBeInTheDocument();
  });

  it("hides administration, purchasing and payables alerts from a mechanic", async () => {
    // A mechanic's role enables only the workshop modules. The fixture still
    // includes the admin-only sections, so the panel itself must drop them
    // rather than relying on the backend to withhold them.
    useRoleMock.mockReturnValue(
      roleState(false, ["workshop", "appointments", "quotes", "inventory"]),
    );
    getDashboardAlertsMock.mockResolvedValue(
      fullSummary({
        receivables: { count: 6n, items: [] },
        payables: { count: 7n, items: [] },
        supplierOrders: { count: 8n, items: [] },
        overdueInstallments: { count: 9n, items: [] },
      }),
    );
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");

    // The mechanic sees the workshop alerts...
    expect(screen.getByText("OT sin aprobar")).toBeInTheDocument();
    expect(screen.getByText("Inventario por agotarse")).toBeInTheDocument();
    // ...but not administration, purchasing or payables.
    expect(screen.queryByText("Cuentas por cobrar")).toBeNull();
    expect(screen.queryByText("Cuentas por pagar")).toBeNull();
    expect(screen.queryByText("Pedidos a proveedor")).toBeNull();
    expect(screen.queryByText("Cuotas vencidas")).toBeNull();
    expect(
      screen.getByTestId("dashboard.admin_only_notice"),
    ).toBeInTheDocument();
  });

  it("re-queries every alert when 'Actualizar' is used", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");
    const calls = getDashboardAlertsMock.mock.calls.length;

    await userEvent.click(screen.getByTestId("dashboard.refresh_button"));

    await waitFor(() =>
      expect(getDashboardAlertsMock.mock.calls.length).toBeGreaterThan(calls),
    );
  });

  it("shows the empty state when the role has no alert sections", async () => {
    getDashboardAlertsMock.mockResolvedValue({
      generatedAt: 1_700_000_000_000_000_000n,
    });
    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByTestId("dashboard.alerts.empty_state"),
    ).toBeInTheDocument();
  });
});
