import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change that loads each screen only when its route is
 * visited instead of importing every page at app startup.
 *
 * The observable contract is that opening the app does not evaluate the page
 * modules the user has not visited: importing `@/App` and rendering the default
 * route must not run the factories of the other screens, and visiting a route
 * must load exactly that screen.
 *
 * Each page module is replaced with a factory that records whether it was
 * evaluated and then returns the real module, so the route still resolves to
 * the genuine screen while the factory's invocation is the observable proof
 * that the module was loaded.
 */

const dashboardFactory = vi.fn();
const inventoryFactory = vi.fn();
const customersFactory = vi.fn();
const ordersFactory = vi.fn();
const posFactory = vi.fn();
const quotesFactory = vi.fn();
const servicesFactory = vi.fn();
const appointmentsFactory = vi.fn();
const techniciansFactory = vi.fn();

vi.mock("@/pages/DashboardPage", async (importOriginal) => {
  dashboardFactory();
  return await importOriginal<typeof import("@/pages/DashboardPage")>();
});
vi.mock("@/pages/InventoryPage", async (importOriginal) => {
  inventoryFactory();
  return await importOriginal<typeof import("@/pages/InventoryPage")>();
});
vi.mock("@/pages/CustomersPage", async (importOriginal) => {
  customersFactory();
  return await importOriginal<typeof import("@/pages/CustomersPage")>();
});
vi.mock("@/pages/OrdersPage", async (importOriginal) => {
  ordersFactory();
  return await importOriginal<typeof import("@/pages/OrdersPage")>();
});
vi.mock("@/pages/PosPage", async (importOriginal) => {
  posFactory();
  return await importOriginal<typeof import("@/pages/PosPage")>();
});
vi.mock("@/pages/QuotesPage", async (importOriginal) => {
  quotesFactory();
  return await importOriginal<typeof import("@/pages/QuotesPage")>();
});
vi.mock("@/pages/ServicesPage", async (importOriginal) => {
  servicesFactory();
  return await importOriginal<typeof import("@/pages/ServicesPage")>();
});
vi.mock("@/pages/AppointmentsPage", async (importOriginal) => {
  appointmentsFactory();
  return await importOriginal<typeof import("@/pages/AppointmentsPage")>();
});
vi.mock("@/pages/TechniciansPage", async (importOriginal) => {
  techniciansFactory();
  return await importOriginal<typeof import("@/pages/TechniciansPage")>();
});

const getCallerUserRoleMock = vi.fn();
const listPartsMock = vi.fn();
const listPartFacetsMock = vi.fn();
const listCustomersMock = vi.fn();
const listMotorcycleCountsByCustomersMock = vi.fn();
const listOrdersMock = vi.fn();
const listQuotesMock = vi.fn();
const listServicesMock = vi.fn();
const listServiceCategoriesMock = vi.fn();
const listAppointmentsMock = vi.fn();
const listTechniciansMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getBusinessSettingsMock = vi.fn();

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
    identity: undefined,
  }),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCallerUserRole: getCallerUserRoleMock,
      listParts: listPartsMock,
      listPartFacets: listPartFacetsMock,
      listCustomers: listCustomersMock,
      listMotorcycleCountsByCustomers: listMotorcycleCountsByCustomersMock,
      listOrders: listOrdersMock,
      listQuotes: listQuotesMock,
      listServices: listServicesMock,
      listServiceCategories: listServiceCategoriesMock,
      listAppointments: listAppointmentsMock,
      listTechnicians: listTechniciansMock,
      getCompanyProfile: getCompanyProfileMock,
      getBusinessSettings: getBusinessSettingsMock,
    },
    isFetching: false,
  }),
}));

function page<T>(items: T[], total = BigInt(items.length)) {
  return { items, total, offset: 0n, limit: 50n };
}

/** The page factories that ran, by name. */
function loadedPages(): string[] {
  return [
    ["dashboard", dashboardFactory],
    ["inventory", inventoryFactory],
    ["customers", customersFactory],
    ["orders", ordersFactory],
    ["pos", posFactory],
    ["quotes", quotesFactory],
    ["services", servicesFactory],
    ["appointments", appointmentsFactory],
    ["technicians", techniciansFactory],
  ]
    .filter(
      ([, factory]) =>
        (factory as ReturnType<typeof vi.fn>).mock.calls.length > 0,
    )
    .map(([name]) => name as string);
}

describe("screens load on visit, not at startup", () => {
  beforeEach(() => {
    for (const factory of [
      dashboardFactory,
      inventoryFactory,
      customersFactory,
      ordersFactory,
      posFactory,
      quotesFactory,
      servicesFactory,
      appointmentsFactory,
      techniciansFactory,
    ]) {
      factory.mockClear();
    }
    getCallerUserRoleMock.mockReset();
    listPartsMock.mockReset();
    listPartFacetsMock.mockReset();
    listCustomersMock.mockReset();
    listMotorcycleCountsByCustomersMock.mockReset();
    listOrdersMock.mockReset();
    listQuotesMock.mockReset();
    listServicesMock.mockReset();
    listServiceCategoriesMock.mockReset();
    listAppointmentsMock.mockReset();
    listTechniciansMock.mockReset();
    getCompanyProfileMock.mockReset();
    getBusinessSettingsMock.mockReset();

    getCallerUserRoleMock.mockResolvedValue({ admin: null });
    listPartsMock.mockResolvedValue(page([]));
    listPartFacetsMock.mockResolvedValue({ categories: [], brands: [] });
    listCustomersMock.mockResolvedValue([]);
    listMotorcycleCountsByCustomersMock.mockResolvedValue([]);
    listOrdersMock.mockResolvedValue(page([]));
    listQuotesMock.mockResolvedValue(page([]));
    listServicesMock.mockResolvedValue(page([]));
    listServiceCategoriesMock.mockResolvedValue([]);
    listAppointmentsMock.mockResolvedValue([]);
    listTechniciansMock.mockResolvedValue([]);
    getCompanyProfileMock.mockResolvedValue(null);
    getBusinessSettingsMock.mockResolvedValue({
      name: "Taller HR Motos",
      taxId: "900.123.456-7",
      address: "Calle 45 #12-30, Bogotá",
      phone: "+57 300 000 0000",
      taxRate: 16n,
    });
  });

  it("does not load the other screens when the app opens at the dashboard", async () => {
    window.history.pushState({}, "", "/");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);
    await screen.findByTestId("dashboard.page");

    // Only the visited screen is loaded; every other page module stays out of
    // the startup graph.
    expect(loadedPages()).toEqual(["dashboard"]);
  });

  it("loads the inventory screen only when /inventario is visited", async () => {
    window.history.pushState({}, "", "/inventario");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);
    await screen.findByTestId("inventory.page");

    expect(loadedPages()).toContain("inventory");
    // Visiting one screen does not drag the others in.
    expect(loadedPages()).not.toContain("customers");
    expect(loadedPages()).not.toContain("pos");
  });

  it("loads the customers screen only when /clientes is visited", async () => {
    window.history.pushState({}, "", "/clientes");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);
    await screen.findByTestId("customers.page");

    expect(loadedPages()).toContain("customers");
    expect(loadedPages()).not.toContain("inventory");
  });
});
