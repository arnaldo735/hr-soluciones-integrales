import type { CustomerListItem, CustomerPage } from "@/lib/types";
import { CustomerSort } from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the customer directory's search seam.
 *
 * The accepted change makes the directory search accent-insensitive, so this
 * file never asserts accent folding. It protects the adjacent contract instead:
 * the trimmed term reaches `listCustomersPageDir` in the resolved filter, the
 * page window and sort are forwarded unchanged, and the search-specific empty
 * state appears when a term matches nothing.
 */

const listCustomersPageDirMock = vi.fn();
const navigateMock = vi.fn();

/** The URL search state `useSearch` reports; tests set it before rendering. */
let searchState: Record<string, unknown> = {};

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomersPageDir: listCustomersPageDirMock,
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

function page(items: CustomerListItem[], total = items.length): CustomerPage {
  return { items, total: BigInt(total), offset: 0n, limit: 50n };
}

describe("CustomersPage search seam", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    navigateMock.mockReset();
    searchState = {};
  });

  it("forwards the trimmed term in the resolved filter with the page window", async () => {
    // The URL carries the raw term the user typed; the hook trims it before it
    // reaches the backend filter, so the backend never sees the padding. The
    // sort, direction and page window travel unchanged alongside it.
    searchState = { q: "  Ada  " };
    listCustomersPageDirMock.mockResolvedValue(page([]));

    renderWithProviders(<CustomersPage />);

    await waitFor(() =>
      expect(listCustomersPageDirMock).toHaveBeenCalledWith(
        null,
        { search: "Ada" },
        CustomerSort.name,
        false,
        0n,
        50n,
      ),
    );
  });

  it("sends an empty filter when there is no search term", async () => {
    // With no term the filter carries no `search` key, so the backend returns
    // the whole directory rather than filtering on an empty string.
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);

    await screen.findByText("Ada Lovelace");
    expect(listCustomersPageDirMock).toHaveBeenCalledWith(
      null,
      {},
      CustomerSort.name,
      false,
      0n,
      50n,
    );
  });

  it("shows the search-specific empty state when a term matches nothing", async () => {
    searchState = { q: "zzz" };
    listCustomersPageDirMock.mockResolvedValue(page([]));

    renderWithProviders(<CustomersPage />);

    expect(await screen.findByText("Sin resultados")).toBeInTheDocument();
  });

  it("debounces the typed term into the URL and resets to the first page", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([]));
    renderWithProviders(<CustomersPage />);

    await waitFor(() => expect(listCustomersPageDirMock).toHaveBeenCalled());

    await userEvent.type(screen.getByTestId("customers.search_input"), "Ada");

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    const call = navigateMock.mock.calls.at(-1)?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(call.search({})).toMatchObject({ q: "Ada", pagina: 1 });
  });
});
