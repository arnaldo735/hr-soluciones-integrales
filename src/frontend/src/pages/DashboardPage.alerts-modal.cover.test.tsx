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
 * Cover for the accepted change: every alert card on the operation panel opens
 * its records in a modal inside the panel frame instead of navigating to the
 * module route, and each record opens a nested detail modal.
 *
 * These tests pin the observable contract:
 *   - clicking a card opens the alert modal and the URL does not change route;
 *   - the modal shows the alert title, the section count and the record list;
 *   - clicking a record opens the nested detail modal inside the panel;
 *   - closing the detail returns to the alert list without leaving the panel;
 *   - the close button, Escape and an outside click close the modal and return
 *     focus to the alert card;
 *   - an alert with no records shows the Spanish empty state;
 *   - a section the role cannot access is neither shown nor opened.
 *
 * The backend is mocked here, so this file proves rendered frontend behavior
 * only; it says nothing about the real `getDashboardAlerts` aggregation.
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

function roleState(isAdmin: boolean, modules: string[] | null = null) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    modules,
    refetch: vi.fn(),
  };
}

/**
 * A summary whose unapproved-orders section carries two records and whose
 * low-stock section carries one, so the modal list and the nested detail can be
 * exercised with real item data.
 */
function summary(
  overrides: Partial<DashboardAlertsSummary> = {},
): DashboardAlertsSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    unapprovedOrders: {
      count: 2n,
      items: [
        {
          id: 4n,
          orderNumber: "OT-0001",
          customerName: "Ana Pérez",
          plate: "ABC12D",
        },
        {
          id: 5n,
          orderNumber: "OT-0002",
          customerName: "Carlos Ruiz",
          plate: "XYZ98A",
        },
      ],
    },
    lowStockParts: {
      count: 1n,
      items: [
        {
          id: 7n,
          sku: "FIL-001",
          name: "Filtro de aceite",
          totalStock: 1n,
          lowStockThreshold: 5n,
        },
      ],
    },
    ...overrides,
  };
}

describe("DashboardPage alert modals (cover)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDashboardAlertsMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDashboardAlertsMock.mockResolvedValue(summary());
  });

  it("opens the alert modal inside the panel without changing the route", async () => {
    const initialUrl = window.location.href;
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.1");
    await userEvent.click(card);

    const dialog = await screen.findByTestId("dashboard.alert_list.dialog");
    expect(dialog).toBeInTheDocument();
    // The panel frame is still mounted behind the modal.
    expect(screen.getByTestId("dashboard.page")).toBeInTheDocument();
    // Opening the modal must not navigate away from the panel route.
    expect(window.location.href).toBe(initialUrl);
  });

  it("shows the alert title, the section count and the record list", async () => {
    renderWithProviders(<DashboardPage />);

    await userEvent.click(await screen.findByTestId("dashboard.alert.1"));

    const dialog = await screen.findByTestId("dashboard.alert_list.dialog");
    expect(within(dialog).getByText("OT sin aprobar")).toBeInTheDocument();
    // The count comes from the section's `count` field (2), not items.length.
    expect(within(dialog).getByText(/Tiene 2 pendientes/)).toBeInTheDocument();

    const list = within(dialog).getByTestId("dashboard.alert_list.list");
    expect(within(list).getByText("OT-0001 · Ana Pérez")).toBeInTheDocument();
    expect(within(list).getByText("OT-0002 · Carlos Ruiz")).toBeInTheDocument();
  });

  it("opens a nested detail modal when a record is clicked", async () => {
    renderWithProviders(<DashboardPage />);

    await userEvent.click(await screen.findByTestId("dashboard.alert.1"));
    const list = await screen.findByTestId("dashboard.alert_list.list");
    await userEvent.click(
      within(list).getByTestId("dashboard.alert_list.item.1"),
    );

    const detail = await screen.findByTestId("dashboard.record_detail.dialog");
    expect(detail).toBeInTheDocument();
    expect(within(detail).getByText("OT-0001 · Ana Pérez")).toBeInTheDocument();
    // The detail renders the record's labelled fields.
    const fields = within(detail).getByTestId("dashboard.record_detail.fields");
    expect(within(fields).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(fields).getByText("ABC12D")).toBeInTheDocument();
    // The panel frame is still mounted behind both modals.
    expect(screen.getByTestId("dashboard.page")).toBeInTheDocument();
  });

  it("returns to the alert list when the detail is closed, without leaving the panel", async () => {
    renderWithProviders(<DashboardPage />);

    await userEvent.click(await screen.findByTestId("dashboard.alert.1"));
    const list = await screen.findByTestId("dashboard.alert_list.list");
    await userEvent.click(
      within(list).getByTestId("dashboard.alert_list.item.1"),
    );
    await screen.findByTestId("dashboard.record_detail.dialog");

    await userEvent.click(
      screen.getByTestId("dashboard.record_detail.back_button"),
    );

    await waitFor(() =>
      expect(
        screen.queryByTestId("dashboard.record_detail.dialog"),
      ).not.toBeInTheDocument(),
    );
    // The alert list modal is still open and the panel is still mounted.
    expect(
      screen.getByTestId("dashboard.alert_list.dialog"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.page")).toBeInTheDocument();
  });

  it("closes the modal from the close button and returns focus to the card", async () => {
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.1");
    await userEvent.click(card);
    await screen.findByTestId("dashboard.alert_list.dialog");

    await userEvent.click(
      screen.getByTestId("dashboard.alert_list.close_button"),
    );

    await waitFor(() =>
      expect(
        screen.queryByTestId("dashboard.alert_list.dialog"),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(card).toHaveFocus());
  });

  it("closes the modal with the Escape key and returns focus to the card", async () => {
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.1");
    await userEvent.click(card);
    await screen.findByTestId("dashboard.alert_list.dialog");

    await userEvent.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByTestId("dashboard.alert_list.dialog"),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(card).toHaveFocus());
  });

  it("closes the modal on an outside click and returns focus to the card", async () => {
    renderWithProviders(<DashboardPage />);

    const card = await screen.findByTestId("dashboard.alert.1");
    await userEvent.click(card);
    await screen.findByTestId("dashboard.alert_list.dialog");

    // Radix renders the overlay as a sibling of the content; clicking it is an
    // outside click that dismisses the dialog.
    const overlay = document.querySelector<HTMLElement>(
      "[data-slot='dialog-overlay']",
    );
    expect(overlay).not.toBeNull();
    await userEvent.click(overlay as HTMLElement);

    await waitFor(() =>
      expect(
        screen.queryByTestId("dashboard.alert_list.dialog"),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(card).toHaveFocus());
  });

  it("shows the Spanish empty state for an alert with no records", async () => {
    getDashboardAlertsMock.mockResolvedValue(
      summary({ unapprovedOrders: { count: 0n, items: [] } }),
    );
    renderWithProviders(<DashboardPage />);

    await userEvent.click(await screen.findByTestId("dashboard.alert.1"));

    const dialog = await screen.findByTestId("dashboard.alert_list.dialog");
    const empty = within(dialog).getByTestId(
      "dashboard.alert_list.empty_state",
    );
    expect(empty).toHaveTextContent("Sin registros por ahora");
    expect(empty).toHaveTextContent(
      "Esta alerta no tiene registros pendientes.",
    );
    expect(
      within(dialog).queryByTestId("dashboard.alert_list.list"),
    ).not.toBeInTheDocument();
  });

  it("shows the loading skeleton while the panel summary is in flight", async () => {
    let resolveAlerts: ((value: DashboardAlertsSummary) => void) | undefined;
    getDashboardAlertsMock.mockImplementation(
      () =>
        new Promise<DashboardAlertsSummary>((resolve) => {
          resolveAlerts = resolve;
        }),
    );
    renderWithProviders(<DashboardPage />);

    // The panel is in its genuine loading state; the alert grid skeleton is
    // shown and no card is clickable yet.
    expect(
      await screen.findByTestId("dashboard.alerts.loading"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard.alert.1")).not.toBeInTheDocument();

    resolveAlerts?.(summary());
    expect(await screen.findByTestId("dashboard.alert.1")).toBeInTheDocument();
  });

  it("does not show or open a section the role cannot access", async () => {
    // A non-admin role whose backend summary omits the admin-only sections.
    useRoleMock.mockReturnValue(
      roleState(false, ["workshop", "appointments", "quotes", "inventory"]),
    );
    getDashboardAlertsMock.mockResolvedValue({
      generatedAt: 1_700_000_000_000_000_000n,
      unapprovedOrders: {
        count: 2n,
        items: [
          {
            id: 4n,
            orderNumber: "OT-0001",
            customerName: "Ana Pérez",
            plate: "ABC12D",
          },
        ],
      },
    });
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.alert.1");
    // The admin-only sections are not rendered at all.
    expect(screen.queryByText("Cuentas por cobrar")).toBeNull();
    expect(screen.queryByText("Cuotas vencidas")).toBeNull();

    // Opening the only visible card shows only its own records.
    await userEvent.click(screen.getByTestId("dashboard.alert.1"));
    const dialog = await screen.findByTestId("dashboard.alert_list.dialog");
    expect(within(dialog).getByText("OT sin aprobar")).toBeInTheDocument();
    expect(within(dialog).queryByText("Cuentas por cobrar")).toBeNull();
  });
});
