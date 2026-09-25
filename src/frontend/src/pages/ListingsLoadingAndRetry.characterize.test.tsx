import type {
  CustomerListItem,
  CustomerPage,
  PartPage,
  PartView,
} from "@/lib/types";
import { PartSort, UserRole } from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { renderWithProviders } from "@/test/helpers";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the loading, error/retry and no-polling
 * behavior of the Clientes and Inventario listings.
 *
 * The accepted change moves the customers and motorcycles listings from a full
 * unpaginated list to a paginated page response, and stops the customers Excel
 * export from fanning out one `listMotorcycles` call per customer. The
 * surrounding behavior that must keep working is what these tests pin:
 *
 *  - each listing shows a loading state while the page is in flight;
 *  - a failed page shows an error state whose retry button actually re-reads
 *    the backend;
 *  - neither listing polls or issues repeated automatic requests once the page
 *    has arrived.
 *
 * They deliberately do not assert how many rows a page requests, the page size,
 * the query key, or the number of `listMotorcycles` calls the export makes —
 * those are the behaviors the accepted change intentionally alters.
 */

const useRoleMock = vi.fn();
const listCustomersPageDirMock = vi.fn();
const listPartsDirMock = vi.fn();
const listPartFacetsMock = vi.fn();

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomersPageDir: listCustomersPageDirMock,
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

const navigateMock = vi.fn();

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
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function customer(overrides: Partial<CustomerListItem> = {}): CustomerListItem {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+52 555 0100",
    email: "ada@example.com",
    document: "LOAA1815",
    motorcycleCount: 0n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function customerPage(
  items: CustomerListItem[],
  total = items.length,
): CustomerPage {
  return { items, total: BigInt(total), offset: 0n, limit: 50n };
}

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
  return { items, total: BigInt(total), offset: 0n, limit: 50n };
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

/** A promise that never settles, so the query stays in its loading state. */
function pending<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

describe("Listings loading, retry and no-polling (characterization)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    listCustomersPageDirMock.mockReset();
    listPartsDirMock.mockReset();
    listPartFacetsMock.mockReset();
    navigateMock.mockReset();
    useRoleMock.mockReturnValue(roleState(true));
    listPartFacetsMock.mockResolvedValue({ categories: [], brands: [] });
  });

  it("shows the customers loading state while the page is in flight", async () => {
    listCustomersPageDirMock.mockReturnValue(pending<CustomerPage>());

    renderWithProviders(<CustomersPage />);

    expect(
      await screen.findByTestId("customers.loading_state"),
    ).toBeInTheDocument();
    // The table is not rendered until the page arrives.
    expect(screen.queryByTestId("customers.table")).not.toBeInTheDocument();
  });

  it("shows the inventory loading state while the page is in flight", async () => {
    listPartsDirMock.mockReturnValue(pending<PartPage>());

    renderWithProviders(<InventoryPage />);

    expect(
      await screen.findByTestId("inventory.loading_state"),
    ).toBeInTheDocument();
  });

  it("re-reads the customers page when the error retry is used", async () => {
    listCustomersPageDirMock.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<CustomersPage />);

    await screen.findByTestId("customers.error_state");
    const callsBeforeRetry = listCustomersPageDirMock.mock.calls.length;

    // The retry must actually reach the backend again, not merely re-render.
    listCustomersPageDirMock.mockResolvedValue(customerPage([customer()]));
    await userEvent.click(screen.getByTestId("customers.retry_button"));

    await waitFor(() =>
      expect(listCustomersPageDirMock.mock.calls.length).toBeGreaterThan(
        callsBeforeRetry,
      ),
    );
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("re-reads the inventory page when the error retry is used", async () => {
    listPartsDirMock.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<InventoryPage />);

    await screen.findByTestId("inventory.error_state");
    const callsBeforeRetry = listPartsDirMock.mock.calls.length;

    listPartsDirMock.mockResolvedValue(page([part()]));
    await userEvent.click(screen.getByTestId("inventory.retry_button"));

    await waitFor(() =>
      expect(listPartsDirMock.mock.calls.length).toBeGreaterThan(
        callsBeforeRetry,
      ),
    );
    expect(await screen.findByText("REP-0001")).toBeInTheDocument();
  });

  it("does not poll or repeat the customers read after the page arrives", async () => {
    listCustomersPageDirMock.mockResolvedValue(customerPage([customer()]));
    renderWithProviders(<CustomersPage />);

    await screen.findByText("Ada Lovelace");
    const callsAfterLoad = listCustomersPageDirMock.mock.calls.length;

    // Give any interval-driven refetch a chance to fire; a polling listing
    // would issue another read here.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    expect(listCustomersPageDirMock.mock.calls.length).toBe(callsAfterLoad);
  });

  it("does not poll or repeat the inventory read after the page arrives", async () => {
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);

    await screen.findByText("REP-0001");
    const callsAfterLoad = listPartsDirMock.mock.calls.length;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    expect(listPartsDirMock.mock.calls.length).toBe(callsAfterLoad);
  });

  it("keeps the inventory sort control driving the backend order", async () => {
    // Adjacent working behavior: the sort control still forwards the chosen
    // order to the backend rather than sorting only the loaded page.
    listPartsDirMock.mockResolvedValue(page([part()]));
    renderWithProviders(<InventoryPage />);
    await screen.findByText("REP-0001");

    await userEvent.click(screen.getByTestId("inventory.sort.name"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    const call = navigateMock.mock.calls.at(-1)?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(call.search({})).toMatchObject({
      orden: PartSort.name,
      dir: "asc",
      pagina: 1,
    });
  });
});
