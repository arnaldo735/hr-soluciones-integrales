import type { CustomerListItem, CustomerPage } from "@/lib/types";
import { CustomerSort } from "@/lib/types";
import { CustomersPage } from "@/pages/CustomersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the `/clientes` directory's listing controls.
 *
 * The accepted change removes the "Enviar por WhatsApp" action from each row of
 * this listing. Everything else about the directory must keep working: the
 * backend-resolved pagination, the sort controls, the row's link to the customer
 * detail, and the edit action. These tests pin that adjacent behavior and
 * deliberately never assert the row's WhatsApp button, whose removal is the
 * accepted change.
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

/** Reads the search patch the last `navigate` call would apply. */
function lastSearchPatch(): Record<string, unknown> {
  const call = navigateMock.mock.calls.at(-1)?.[0] as {
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
  };
  return call.search({});
}

describe("CustomersPage listing controls (characterization)", () => {
  beforeEach(() => {
    listCustomersPageDirMock.mockReset();
    navigateMock.mockReset();
    searchState = {};
  });

  it("shows the page indicator and disables previous on the first page", async () => {
    // 120 customers at 50 per page is three pages; the first page cannot go back.
    listCustomersPageDirMock.mockResolvedValue(page([customer()], 120));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByTestId("customers.pagination_prev")).toBeDisabled();
    expect(screen.getByTestId("customers.pagination_next")).toBeEnabled();
  });

  it("requests the next page through the URL when Siguiente is clicked", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()], 120));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.pagination_next"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    expect(lastSearchPatch()).toMatchObject({ pagina: 2 });
  });

  it("requests the previous page through the URL when Anterior is clicked", async () => {
    searchState = { pagina: 2 };
    listCustomersPageDirMock.mockResolvedValue(page([customer()], 120));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("customers.pagination_prev"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    expect(lastSearchPatch()).toMatchObject({ pagina: 1 });
  });

  it("sorts by a column header and resets to the first page", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    // Clicking the "Motos" header switches the backend sort field.
    await userEvent.click(screen.getByTestId("customers.sort.motorcycleCount"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    expect(lastSearchPatch()).toMatchObject({
      orden: CustomerSort.motorcycleCount,
      dir: "asc",
      pagina: 1,
    });
  });

  it("toggles the direction when the active sort header is clicked again", async () => {
    searchState = { orden: CustomerSort.name, dir: "asc" };
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    await userEvent.click(screen.getByTestId("customers.sort.name"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    expect(lastSearchPatch()).toMatchObject({ dir: "desc", pagina: 1 });
  });

  it("links each row to that customer's detail page", async () => {
    listCustomersPageDirMock.mockResolvedValue(
      page([
        customer({ id: 1n, name: "Ada Lovelace" }),
        customer({ id: 2n, name: "Grace Hopper", phone: "+52 555 0200" }),
      ]),
    );

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    // The name link and the open action both point at the row's own id.
    const nameLink = screen.getByTestId("customers.link.2");
    expect(nameLink).toHaveAttribute("href", "/clientes/$id");
    expect(nameLink).toHaveAttribute(
      "data-params",
      JSON.stringify({ id: "2" }),
    );

    const openLink = screen.getByTestId("customers.open_button.2");
    expect(openLink).toHaveAttribute("href", "/clientes/$id");
    expect(openLink).toHaveAttribute(
      "data-params",
      JSON.stringify({ id: "2" }),
    );
  });

  it("keeps the edit action on each row", async () => {
    listCustomersPageDirMock.mockResolvedValue(page([customer()]));

    renderWithProviders(<CustomersPage />);
    await screen.findByText("Ada Lovelace");

    expect(screen.getByTestId("customers.edit_button.1")).toBeInTheDocument();
  });
});
