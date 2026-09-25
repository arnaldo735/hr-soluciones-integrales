import { UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the route tree's screen resolution.
 *
 * The accepted change makes each screen load only when it is visited instead of
 * importing every page at app startup. The observable contract that must
 * survive that rework is that visiting a route still resolves to the real
 * screen rather than a blank page or a stuck loading shell.
 *
 * These tests exercise the real router and route tree, so a lazy route whose
 * import never resolves, or a route that loses its component, fails here. They
 * assert only each page's container marker, so they stay valid while the pages'
 * internal contents change.
 *
 * The routes already covered by `App.test.tsx` (the dashboard, the admin guard
 * and the Compras/Drive destinations) are not repeated here; this file closes
 * the remaining main destinations the lazy-loading change touches.
 */

const getCallerUserRoleMock = vi.fn();
const listPartsDirMock = vi.fn();
const listPartFacetsMock = vi.fn();
const listCustomersPageDirMock = vi.fn();
const listMotorcyclesPageDirMock = vi.fn();
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
      listPartsDir: listPartsDirMock,
      listPartFacets: listPartFacetsMock,
      listCustomersPageDir: listCustomersPageDirMock,
      listMotorcyclesPageDir: listMotorcyclesPageDirMock,
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

describe("App route tree (characterization)", () => {
  beforeEach(() => {
    getCallerUserRoleMock.mockReset();
    listPartsDirMock.mockReset();
    listPartFacetsMock.mockReset();
    listCustomersPageDirMock.mockReset();
    listMotorcyclesPageDirMock.mockReset();
    listOrdersMock.mockReset();
    listQuotesMock.mockReset();
    listServicesMock.mockReset();
    listServiceCategoriesMock.mockReset();
    listAppointmentsMock.mockReset();
    listTechniciansMock.mockReset();
    getCompanyProfileMock.mockReset();
    getBusinessSettingsMock.mockReset();

    getCallerUserRoleMock.mockResolvedValue(UserRole.admin);
    listPartsDirMock.mockResolvedValue(page([]));
    listPartFacetsMock.mockResolvedValue({ categories: [], brands: [] });
    listCustomersPageDirMock.mockResolvedValue(page([]));
    listMotorcyclesPageDirMock.mockResolvedValue(page([]));
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

  /** Renders the real app at `path` and asserts the page container appears. */
  async function expectRouteRenders(path: string, containerTestId: string) {
    window.history.pushState({}, "", path);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(await screen.findByTestId(containerTestId)).toBeInTheDocument();
  }

  it("resolves /inventario to the inventory screen", async () => {
    await expectRouteRenders("/inventario", "inventory.page");
  });

  it("resolves /clientes to the customer directory", async () => {
    await expectRouteRenders("/clientes", "customers.page");
  });

  it("resolves /motos to the motorcycles listing", async () => {
    await expectRouteRenders("/motos", "motorcycles.page");
  });

  it("resolves /ordenes to the workshop orders screen", async () => {
    await expectRouteRenders("/ordenes", "orders.page");
  });

  it("resolves /pos to the point-of-sale screen", async () => {
    await expectRouteRenders("/pos", "pos.page");
  });

  it("resolves /cotizaciones to the quotes screen", async () => {
    await expectRouteRenders("/cotizaciones", "quotes.page");
  });

  it("resolves /servicios to the services screen", async () => {
    await expectRouteRenders("/servicios", "services.page");
  });

  it("resolves /citas to the appointments screen", async () => {
    await expectRouteRenders("/citas", "appointments.page");
  });

  it("resolves /tecnicos to the technicians screen", async () => {
    await expectRouteRenders("/tecnicos", "technicians.page");
  });
});
