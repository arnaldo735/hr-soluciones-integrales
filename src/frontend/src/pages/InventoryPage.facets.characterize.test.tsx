import type { PartPage, PartView } from "@/lib/types";
import { UserRole } from "@/lib/types";
import { InventoryPage } from "@/pages/InventoryPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the inventory catalog's category and brand
 * filter options.
 *
 * The accepted change reworks how the catalog is read (the backend stops doing
 * full linear scans and the pickers request fewer rows), but the filter
 * dropdowns must keep offering exactly the distinct category and brand values
 * present in the catalog: no duplicates, no blank entries, and a stable
 * alphabetical order. These tests pin that observable contract.
 *
 * They deliberately do not assert the number of rows the facets query requests
 * or the shape of its query key — that is the behavior the accepted change
 * intentionally alters.
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
 * The catalog the facets query reads. The accepted change computes the distinct
 * category and brand values in one `listPartFacets` call, so the mock derives
 * the facets from the given catalog and answers the visible page from
 * `listParts`.
 */
function catalogWithFacets(items: PartView[]) {
  listPartsDirMock.mockResolvedValue(page(items));
  listPartFacetsMock.mockResolvedValue({
    categories: [...new Set(items.map((item) => item.category))],
    brands: [...new Set(items.map((item) => item.brand))],
  });
}

/**
 * Opens a Radix select, reads its option labels, then closes it so the next
 * select's trigger is interactive again (an open Radix select disables pointer
 * events on the rest of the page).
 */
async function openSelectOptions(testId: string): Promise<string[]> {
  await userEvent.click(screen.getByTestId(testId));
  const listbox = await screen.findByRole("listbox");
  const options = within(listbox)
    .getAllByRole("option")
    .map((option) => option.textContent?.trim() ?? "");
  await userEvent.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
  );
  return options;
}

describe("InventoryPage filter options (characterization)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    listPartsDirMock.mockReset();
    listPartFacetsMock.mockReset();
    navigateMock.mockReset();
    searchState = {};
    useRoleMock.mockReturnValue(roleState(true));
    listPartsDirMock.mockResolvedValue(page([part()]));
    listPartFacetsMock.mockResolvedValue({
      categories: ["Frenos"],
      brands: ["Brembo"],
    });
  });

  it("offers each distinct category once, in alphabetical order", async () => {
    catalogWithFacets([
      part({ id: 1n, sku: "REP-0001", category: "Frenos" }),
      part({ id: 2n, sku: "REP-0002", category: "Motor" }),
      part({ id: 3n, sku: "REP-0003", category: "Frenos" }),
      part({ id: 4n, sku: "REP-0004", category: "Eléctrico" }),
    ]);

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    const options = await openSelectOptions("inventory.category_select");
    // The "all" sentinel is always first; the catalog values follow, deduped
    // and sorted with the Spanish locale.
    expect(options).toEqual([
      "Todas las categorías",
      "Eléctrico",
      "Frenos",
      "Motor",
    ]);
  });

  it("offers each distinct brand once, in alphabetical order", async () => {
    catalogWithFacets([
      part({ id: 1n, sku: "REP-0001", brand: "Brembo" }),
      part({ id: 2n, sku: "REP-0002", brand: "Mann" }),
      part({ id: 3n, sku: "REP-0003", brand: "Brembo" }),
      part({ id: 4n, sku: "REP-0004", brand: "DID" }),
    ]);

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    const options = await openSelectOptions("inventory.brand_select");
    expect(options).toEqual(["Todas las marcas", "Brembo", "DID", "Mann"]);
  });

  it("omits blank category and brand values from the option lists", async () => {
    catalogWithFacets([
      part({ id: 1n, sku: "REP-0001", category: "Frenos", brand: "Brembo" }),
      part({ id: 2n, sku: "REP-0002", category: "", brand: "" }),
      part({ id: 3n, sku: "REP-0003", category: "Motor", brand: "Mann" }),
    ]);

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    const categories = await openSelectOptions("inventory.category_select");
    expect(categories).toEqual(["Todas las categorías", "Frenos", "Motor"]);

    const brands = await openSelectOptions("inventory.brand_select");
    expect(brands).toEqual(["Todas las marcas", "Brembo", "Mann"]);
  });

  it("keeps the selected category and brand visible in their triggers", async () => {
    searchState = { categoria: "Frenos", marca: "Brembo", pagina: 1 };
    catalogWithFacets([
      part({ id: 1n, sku: "REP-0001", category: "Frenos", brand: "Brembo" }),
      part({ id: 2n, sku: "REP-0002", category: "Motor", brand: "Mann" }),
    ]);

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    // The trigger reflects the active filter rather than resetting to the
    // placeholder, so the user can see which filter is applied.
    await waitFor(() =>
      expect(screen.getByTestId("inventory.category_select")).toHaveTextContent(
        "Frenos",
      ),
    );
    expect(screen.getByTestId("inventory.brand_select")).toHaveTextContent(
      "Brembo",
    );
  });

  it("reads the option lists from a single listPartFacets call", async () => {
    catalogWithFacets([
      part({ id: 1n, sku: "REP-0001", category: "Frenos", brand: "Brembo" }),
    ]);

    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    // The accepted change computes the distinct values in one backend call, so
    // the option lists no longer require reading a broad page of the catalog.
    await waitFor(() => expect(listPartFacetsMock).toHaveBeenCalledTimes(1));
    expect(listPartFacetsMock).toHaveBeenCalledWith();
  });
});
