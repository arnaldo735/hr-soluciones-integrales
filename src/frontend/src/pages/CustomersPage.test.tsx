import type { CustomerListItem, CustomerPage } from "@/lib/types";
import { CustomerSort } from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the paginated customer directory.
 *
 * The accepted change moves `/clientes` from a full unpaginated list to a
 * backend-resolved page: `listCustomersPageDir` returns the page items with each
 * customer's motorcycle count already included, so the directory never fans out
 * a per-customer read for the count column. These tests pin the observable
 * contract of that page: the rows and their contact data, the count column, the
 * empty and error states, the trimmed search term forwarded to the backend, and
 * the edit dialog seeded from the row.
 */

const listCustomersPageDirMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomersPageDir: listCustomersPageDirMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

/** The URL search state `useSearch` reports; tests set it before rendering. */
let searchState: Record<string, unknown> = {};

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

describe("CustomersPage", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    navigateMock.mockReset();
    searchState = {};
  });

  it("lists customers with contact data and motorcycle count", async () => {
    // The count column arrives in the same page response, so the mock answers
    // the single paginated call rather than a per-customer fan-out.
    listCustomersPageDirMock.mockResolvedValue(
      page([customer({ motorcycleCount: 2n })]),
    );

    renderWithProviders(<CustomersPage />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("+52 555 0100")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("LOAA1815")).toBeInTheDocument();
    expect(screen.getByText("1 clientes")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("reads the page and its motorcycle counts in a single backend call", async () => {
    // The accepted change replaces the per-customer `listMotorcycles` fan-out
    // with one paginated call whose items already carry the count, so opening
    // the directory no longer issues N+1 reads.
    listCustomersPageDirMock.mockResolvedValue(
      page([
        customer({ id: 1n, name: "Ada Lovelace", motorcycleCount: 2n }),
        customer({
          id: 2n,
          name: "Grace Hopper",
          phone: "+52 555 0200",
          motorcycleCount: 0n,
        }),
        customer({
          id: 3n,
          name: "Alan Turing",
          phone: "+52 555 0300",
          motorcycleCount: 1n,
        }),
      ]),
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await waitFor(() =>
      expect(listCustomersPageDirMock).toHaveBeenCalledTimes(1),
    );
    // The single call carries the resolved filter, sort, direction and page
    // window; the counts come back inside the same response.
    expect(listCustomersPageDirMock).toHaveBeenCalledWith(
      {},
      CustomerSort.name,
      false,
      0n,
      50n,
    );
  });

  it("renders an empty state when the directory has no customers", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([]));
    renderWithProviders(<CustomersPage />);

    expect(
      await screen.findByTestId("customers.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay clientes")).toBeInTheDocument();
  });

  it("passes the trimmed search term to the backend", async () => {
    // The URL carries the raw term the user typed; the hook trims it before it
    // reaches the backend filter, so the backend never sees the padding.
    searchState = { q: "  Ada  " };
    listCustomersPageDirMock.mockResolvedValue(page([]));
    renderWithProviders(<CustomersPage />);

    await waitFor(() =>
      expect(listCustomersPageDirMock).toHaveBeenLastCalledWith(
        { search: "Ada" },
        CustomerSort.name,
        false,
        0n,
        50n,
      ),
    );
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

  it("shows a search-specific empty state when a term matches nothing", async () => {
    searchState = { q: "zzz" };
    listCustomersPageDirMock.mockResolvedValue(page([]));
    renderWithProviders(<CustomersPage />);

    expect(await screen.findByText("Sin resultados")).toBeInTheDocument();
  });

  it("renders an error state with a retry when the directory fails", async () => {
    listCustomersPageDirMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<CustomersPage />);

    expect(
      await screen.findByTestId("customers.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar el directorio"),
    ).toBeInTheDocument();
  });

  it("opens the edit dialog seeded with the customer's data", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));
    renderWithProviders(<CustomersPage />);

    await screen.findByText("Ada Lovelace");
    await userEvent.click(screen.getByTestId("customers.edit_button.1"));

    // The dialog is seeded from the row, not left blank.
    expect(await screen.findByTestId("customer.dialog")).toBeInTheDocument();
    expect(screen.getByTestId("customer.name_input")).toHaveValue(
      "Ada Lovelace",
    );
    expect(screen.getByTestId("customer.phone_input")).toHaveValue(
      "+52 555 0100",
    );
  });
});
