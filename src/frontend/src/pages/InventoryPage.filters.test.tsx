import type { PartPage, PartView } from "@/lib/types";
import { PartSort, UserRole } from "@/lib/types";
import { InventoryPage } from "@/pages/InventoryPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the inventory catalog's search and filter
 * semantics, which the upcoming search rework must not change.
 *
 * The accepted change alters *how* the catalog is searched (the backend stops
 * doing full linear scans with per-record lowercasing and full sorts, and the
 * pickers debounce and request fewer rows). It must not change *what* the
 * filters mean: a category, a brand and "solo stock bajo" still narrow the
 * catalog to the same records, and the list still renders exactly the rows the
 * backend returns for the requested filter.
 *
 * These tests never assert the number of rows requested, the debounce timing or
 * the internal call count, all of which are intentionally changing. They pin
 * the filter object the page forwards to `listParts` and the observable rows
 * and empty state that result from it.
 */

const useRoleMock = vi.fn();
const listPartsDirMock = vi.fn();
const listPartFacetsMock = vi.fn();
const navigateMock = vi.fn();

/** The URL search state `useSearch` reports; tests set it before rendering. */
let searchState: Record<string, unknown> = {};

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listPartsDir: listPartsDirMock,
      listPartFacets: listPartFacetsMock,
      exportInventoryCsv: vi.fn(),
      importInventoryCsv: vi.fn(),
      zeroInventory: vi.fn(),
      getInventoryValuation: vi.fn(),
      getAccountingReport: vi.fn(),
      getCompanyProfile: vi.fn(),
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => (
    <a href={to} data-params={JSON.stringify(params)} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useSearch: () => searchState,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 1n,
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
    totalStock: 12n,
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function page(items: PartView[], total = items.length): PartPage {
  return { items, total: BigInt(total), offset: 0n, limit: 20n };
}

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

/**
 * Every filter object the page forwarded to `listParts`. The page passes the
 * filter first, then the sort, offset and limit. The page also issues a broad
 * unfiltered facets query, so tests look for the call that carries the filter
 * under test rather than assuming the last call is the filtered one.
 */
function forwardedFilters(): Array<Record<string, unknown>> {
  return listPartsDirMock.mock.calls.map(
    (call) => (call[0] ?? {}) as Record<string, unknown>,
  );
}

/** The filter object the page forwarded to `listParts` on its most recent call. */
function lastFilter(): Record<string, unknown> {
  return forwardedFilters().at(-1) ?? {};
}

/**
 * Runs the `search` updater the page handed to `navigate` and returns the
 * resulting URL search object. This is the observable filter request the page
 * makes when a filter control is used.
 */
function appliedSearch(): Record<string, unknown> {
  const call = navigateMock.mock.calls.at(-1)?.[0] as {
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
  };
  return call.search({});
}

describe("InventoryPage catalog filters", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    listPartsDirMock.mockReset();
    listPartFacetsMock.mockReset();
    navigateMock.mockReset();
    searchState = {};
    useRoleMock.mockReturnValue(roleState(true));
    listPartsDirMock.mockResolvedValue(page([part()]));
    listPartFacetsMock.mockResolvedValue({
      categories: ["Frenos", "Motor"],
      brands: ["Brembo", "Mann"],
    });
  });

  it("requests the catalog with no filter when nothing is selected", async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    expect(lastFilter()).toEqual({});
  });

  it("narrows the catalog by the selected category", async () => {
    listPartsDirMock.mockResolvedValue(
      page([
        part({ id: 1n, sku: "REP-0001", category: "Frenos" }),
        part({ id: 2n, sku: "REP-0002", category: "Motor" }),
      ]),
    );
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.category_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Frenos" }),
    );

    // The category is carried into the URL search, which drives the query.
    expect(appliedSearch()).toMatchObject({ categoria: "Frenos", pagina: 1 });
  });

  it("narrows the catalog by the selected brand", async () => {
    listPartsDirMock.mockResolvedValue(
      page([
        part({ id: 1n, sku: "REP-0001", brand: "Brembo" }),
        part({ id: 2n, sku: "REP-0002", brand: "Mann" }),
      ]),
    );
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.brand_select"));
    await userEvent.click(await screen.findByRole("option", { name: "Mann" }));

    expect(appliedSearch()).toMatchObject({ marca: "Mann", pagina: 1 });
  });

  it("narrows the catalog to low-stock parts only", async () => {
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.low_stock_toggle"));

    expect(appliedSearch()).toMatchObject({ bajo: true, pagina: 1 });
  });

  it("combines the category, brand and low-stock filters in one request", async () => {
    // The page reads the resolved filter state from the URL, so render it with
    // all three filters already applied and assert the exact filter object the
    // backend receives.
    searchState = {
      categoria: "Frenos",
      marca: "Brembo",
      bajo: true,
      orden: PartSort.name,
      pagina: 1,
    };
    listPartsDirMock.mockResolvedValue(
      page([part({ totalStock: 2n, lowStock: true })]),
    );

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    expect(forwardedFilters()).toContainEqual({
      category: "Frenos",
      brand: "Brembo",
      lowStockOnly: true,
    });
  });

  it("renders exactly the parts the backend returns for the active filter", async () => {
    searchState = { categoria: "Frenos", pagina: 1 };
    listPartsDirMock.mockResolvedValue(
      page([
        part({ id: 1n, sku: "REP-0001", name: "Balata de freno" }),
        part({ id: 2n, sku: "REP-0002", name: "Pastilla trasera" }),
      ]),
    );

    renderWithProviders(<InventoryPage />);

    expect(await screen.findByText("REP-0001")).toBeInTheDocument();
    expect(screen.getByText("REP-0002")).toBeInTheDocument();
    // The count reflects the filtered total the backend reported.
    expect(screen.getByText("2 repuestos")).toBeInTheDocument();
  });

  it("shows the empty state when the active filter matches no part", async () => {
    searchState = { categoria: "Inexistente", pagina: 1 };
    listPartsDirMock.mockResolvedValue(page([]));

    renderWithProviders(<InventoryPage />);

    expect(
      await screen.findByTestId("inventory.empty_state"),
    ).toBeInTheDocument();
    // The filtered empty state offers to clear the filters.
    expect(
      screen.getByTestId("inventory.empty_clear_button"),
    ).toBeInTheDocument();
  });

  it("keeps the cost price hidden from a non-admin under an active filter", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    searchState = { categoria: "Frenos", pagina: 1 };
    listPartsDirMock.mockResolvedValue(page([part()]));

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    expect(screen.queryByText("P. costo")).not.toBeInTheDocument();
    expect(screen.queryByText("$ 120")).not.toBeInTheDocument();
    // The sale price remains visible to a mechanic.
    expect(screen.getByText("$ 250")).toBeInTheDocument();
  });

  it("shows the cost price to an administrator under an active filter", async () => {
    searchState = { categoria: "Frenos", pagina: 1 };
    listPartsDirMock.mockResolvedValue(page([part()]));

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    expect(screen.getByText("P. costo")).toBeInTheDocument();
    expect(screen.getByText("$ 120")).toBeInTheDocument();
  });

  it("clears every filter back to the unfiltered catalog", async () => {
    searchState = { categoria: "Frenos", marca: "Brembo", bajo: true };
    listPartsDirMock.mockResolvedValue(page([part()]));

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.clear_filters_button"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    const call = navigateMock.mock.calls.at(-1)?.[0] as {
      to: string;
      search: Record<string, unknown>;
    };
    expect(call.to).toBe("/inventario");
    expect(call.search).toEqual({});
  });

  it("keeps the low-stock badge on a part the backend flags as low", async () => {
    searchState = { bajo: true, pagina: 1 };
    listPartsDirMock.mockResolvedValue(
      page([part({ totalStock: 2n, lowStock: true })]),
    );

    renderWithProviders(<InventoryPage />);

    expect(
      await screen.findByTestId("inventory.low_stock_badge"),
    ).toBeInTheDocument();
  });

  it("renders the filtered rows in the order the backend returns them", async () => {
    searchState = { orden: PartSort.name, pagina: 1 };
    listPartsDirMock.mockResolvedValue(
      page([
        part({ id: 1n, sku: "REP-0001", name: "Aceite" }),
        part({ id: 2n, sku: "REP-0002", name: "Balata" }),
        part({ id: 3n, sku: "REP-0003", name: "Cadena" }),
      ]),
    );

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    const rows = within(screen.getByTestId("inventory.page")).getAllByTestId(
      /inventory\.row\.\d+/,
    );
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Aceite"),
      expect.stringContaining("Balata"),
      expect.stringContaining("Cadena"),
    ]);
  });
});
