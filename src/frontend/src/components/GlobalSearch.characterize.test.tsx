import { GlobalSearch } from "@/components/GlobalSearch";
import type {
  PartView,
  Service,
  ServiceCategoryUsage,
  Supplier,
  Technician,
} from "@/lib/types";
import { PartSort, ServiceSort, UserRole } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the global search's accepted behavior and its adjacent contract.
 *
 * The accepted change makes the searchers accent-insensitive and stops them
 * truncating results: the global search now queries from the first character
 * and asks the paginated catalogs for a page large enough to cover the whole
 * catalog instead of a five-result cap. Accent folding itself is resolved in
 * the backend, so it is exercised in the PocketIC lane, not here. This file
 * protects the frontend seam the change touches: the single-character query,
 * the exact call shape forwarded to each catalog (including the large page
 * limit), the admin-only catalogs, and the grouped navigation to a selected
 * record.
 */

const navigateMock = vi.fn();
const useRoleMock = vi.fn();
const listCustomersMock = vi.fn();
const listSuppliersMock = vi.fn();
const listServicesMock = vi.fn();
const listPartsMock = vi.fn();
const listTechniciansMock = vi.fn();
const listServiceCategoriesMock = vi.fn();

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
      listCustomers: listCustomersMock,
      listSuppliers: listSuppliersMock,
      listServices: listServicesMock,
      listParts: listPartsMock,
      listTechnicians: listTechniciansMock,
      listServiceCategories: listServiceCategoriesMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    modules: null,
    roleName: isAdmin ? "Administrador" : "Mecánico",
    refetch: vi.fn(),
  };
}

function emptyPage() {
  return { items: [], total: 0n, offset: 0n, limit: 0n };
}

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 9n,
    sku: "BAL-001",
    lowStockThreshold: 1n,
    name: "Balata delantera",
    createdAt: 0n,
    unit: "unidad",
    totalStock: 4n,
    barcode: "",
    category: "Frenos",
    salePrice: 32000n,
    brand: "Genérico",
    costPrice: 20000n,
    lowStock: false,
    ...overrides,
  };
}

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 3n,
    active: true,
    code: "SRV-01",
    name: "Cambio de aceite",
    createdAt: 0n,
    description: "",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 30n,
    ...overrides,
  };
}

function supplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 5n,
    name: "Repuestos del Norte",
    phone: "+57 300 000 0000",
    createdAt: 0n,
    ...overrides,
  };
}

function technician(overrides: Partial<Technician> = {}): Technician {
  return {
    id: 7n,
    active: true,
    code: "TEC-01",
    name: "Carlos Pérez",
    createdAt: 0n,
    hourlyRate: 20000n,
    specialty: "Motor",
    commissionRate: 10n,
    phone: "+57 300 111 1111",
    ...overrides,
  };
}

function categoryUsage(
  overrides: Partial<ServiceCategoryUsage> = {},
): ServiceCategoryUsage {
  return {
    serviceCount: 2n,
    activeServiceCount: 2n,
    category: {
      id: 11n,
      name: "Mantenimiento",
      createdAt: 0n,
      description: "",
    },
    ...overrides,
  };
}

describe("GlobalSearch", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    useRoleMock.mockReset();
    listCustomersMock.mockReset();
    listSuppliersMock.mockReset();
    listServicesMock.mockReset();
    listPartsMock.mockReset();
    listTechniciansMock.mockReset();
    listServiceCategoriesMock.mockReset();

    listCustomersMock.mockResolvedValue([]);
    listSuppliersMock.mockResolvedValue([]);
    listServicesMock.mockResolvedValue(emptyPage());
    listPartsMock.mockResolvedValue(emptyPage());
    listTechniciansMock.mockResolvedValue([]);
    listServiceCategoriesMock.mockResolvedValue([]);
    useRoleMock.mockReturnValue(roleState(true));
  });

  it("queries every catalog from the first character", async () => {
    // Accepted behavior: the global search no longer waits for a second
    // character, so a one-character term must reach the catalogs.
    renderWithProviders(<GlobalSearch />);

    await userEvent.type(screen.getByTestId("global_search.search_input"), "a");

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());
    expect(listCustomersMock).toHaveBeenCalledWith(null, "a");
    expect(listPartsMock).toHaveBeenCalledWith(
      null,
      { search: "a" },
      PartSort.name,
      0n,
      1000n,
    );
    expect(listServicesMock).toHaveBeenCalledWith(
      null,
      { search: "a" },
      ServiceSort.name,
      0n,
      1000n,
    );
    expect(listTechniciansMock).toHaveBeenCalledWith(null, { search: "a" });
  });

  it("shows the matches a single-character term returns", async () => {
    // Acceptance criterion: a one-character term in the global search shows
    // matches instead of being gated out.
    listCustomersMock.mockResolvedValue([
      {
        id: 1n,
        name: "José Álvarez",
        phone: "+57 300 222 2222",
        createdAt: 0n,
      },
    ]);

    renderWithProviders(<GlobalSearch />);

    await userEvent.type(screen.getByTestId("global_search.search_input"), "j");

    expect(
      await screen.findByTestId("global_search.group.clientes"),
    ).toBeInTheDocument();
    expect(screen.getByText("José Álvarez")).toBeInTheDocument();
  });

  it("forwards the trimmed term to each catalog with its resolved call shape", async () => {
    // The accent change alters how the backend matches, but the frontend
    // contract stays: the trimmed term reaches every catalog through the same
    // argument shape, and the paginated catalogs keep their sort and a page
    // large enough to cover the whole catalog (no truncation).
    renderWithProviders(<GlobalSearch />);

    await userEvent.type(
      screen.getByTestId("global_search.search_input"),
      "  balata  ",
    );

    await waitFor(() => expect(listPartsMock).toHaveBeenCalled());

    expect(listCustomersMock).toHaveBeenCalledWith(null, "balata");
    expect(listSuppliersMock).toHaveBeenCalledWith(null, "balata");
    expect(listTechniciansMock).toHaveBeenCalledWith(null, {
      search: "balata",
    });
    expect(listServiceCategoriesMock).toHaveBeenCalledWith(null, {
      search: "balata",
    });
    expect(listServicesMock).toHaveBeenCalledWith(
      null,
      { search: "balata" },
      ServiceSort.name,
      0n,
      1000n,
    );
    expect(listPartsMock).toHaveBeenCalledWith(
      null,
      { search: "balata" },
      PartSort.name,
      0n,
      1000n,
    );
  });

  it("groups matches by record type and navigates to the selected record", async () => {
    listCustomersMock.mockResolvedValue([
      { id: 1n, name: "Ada Lovelace", phone: "+52 555 0100", createdAt: 0n },
    ]);
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 5n,
    });
    listServicesMock.mockResolvedValue({
      items: [service()],
      total: 1n,
      offset: 0n,
      limit: 5n,
    });
    listTechniciansMock.mockResolvedValue([technician()]);
    listSuppliersMock.mockResolvedValue([supplier()]);
    listServiceCategoriesMock.mockResolvedValue([categoryUsage()]);

    renderWithProviders(<GlobalSearch />);

    await userEvent.type(
      screen.getByTestId("global_search.search_input"),
      "balata",
    );

    // Every catalog that returned a match contributes its own Spanish group.
    expect(
      await screen.findByTestId("global_search.group.clientes"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("global_search.group.inventario"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("global_search.group.servicios"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("global_search.group.tecnicos"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("global_search.group.proveedores"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("global_search.group.categorias"),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByTestId("global_search.result.clientes.1"),
    );

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({
        to: "/clientes/$id",
        params: { id: "1" },
      }),
    );
  });

  it("does not query the admin-only catalogs for a non-admin", async () => {
    // Suppliers and service categories are gated on the administrator role;
    // a mechanic's search must not reach them.
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<GlobalSearch />);

    await userEvent.type(
      screen.getByTestId("global_search.search_input"),
      "balata",
    );

    await waitFor(() => expect(listPartsMock).toHaveBeenCalled());

    expect(listSuppliersMock).not.toHaveBeenCalled();
    expect(listServiceCategoriesMock).not.toHaveBeenCalled();
    // The non-admin catalogs are still queried.
    expect(listCustomersMock).toHaveBeenCalled();
    expect(listTechniciansMock).toHaveBeenCalled();
  });

  it("shows the empty state when no catalog matches", async () => {
    renderWithProviders(<GlobalSearch />);

    await userEvent.type(
      screen.getByTestId("global_search.search_input"),
      "zzz",
    );

    expect(
      await screen.findByTestId("global_search.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se encontraron coincidencias"),
    ).toBeInTheDocument();
  });
});
