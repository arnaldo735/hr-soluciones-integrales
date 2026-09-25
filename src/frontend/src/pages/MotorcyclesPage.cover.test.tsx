import type { MotorcycleListItem, MotorcyclePage } from "@/lib/types";
import { MotorcycleSort } from "@/lib/types";
import { MotorcyclesPage } from "@/pages/MotorcyclesPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: the new `/motos` listing resolves pagination,
 * filtering and sorting in the backend through `listMotorcyclesPageDir`, and
 * each row carries its owner's name and phone in the same response.
 *
 * These tests pin the observable contract of that listing: the rows and their
 * owner data, the count badge, the empty and error states, the filter/sort/page
 * state forwarded to the backend, and the pagination control. They never assert
 * the internal query key or a per-motorcycle fan-out.
 */

const listMotorcyclesPageDirMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listMotorcyclesPageDir: listMotorcyclesPageDirMock,
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

function motorcycle(
  overrides: Partial<MotorcycleListItem> = {},
): MotorcycleListItem {
  return {
    id: 7n,
    customerId: 1n,
    customerName: "Ada Lovelace",
    customerPhone: "+52 555 0100",
    brand: "Yamaha",
    model: "FZ 2.0",
    plate: "ABC12D",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function page(
  items: MotorcycleListItem[],
  total = items.length,
): MotorcyclePage {
  return { items, total: BigInt(total), offset: 0n, limit: 50n };
}

describe("MotorcyclesPage (cover)", () => {
  beforeEach(() => {
    listMotorcyclesPageDirMock.mockReset();
    navigateMock.mockReset();
    searchState = {};
  });

  it("lists motorcycles with their owner's name and phone", async () => {
    listMotorcyclesPageDirMock.mockResolvedValue(page([motorcycle()]));

    renderWithProviders(<MotorcyclesPage />);

    expect(await screen.findByText("ABC12D")).toBeInTheDocument();
    expect(screen.getByText("Yamaha")).toBeInTheDocument();
    expect(screen.getByText("FZ 2.0")).toBeInTheDocument();
    expect(screen.getByText("2021")).toBeInTheDocument();
    expect(screen.getByText("12.000 km")).toBeInTheDocument();
    // The owner data arrives in the same page response, not a per-row read.
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("+52 555 0100")).toBeInTheDocument();
    expect(screen.getByText("1 motos")).toBeInTheDocument();
  });

  it("reads one page in a single backend call with the resolved state", async () => {
    listMotorcyclesPageDirMock.mockResolvedValue(page([motorcycle()]));

    renderWithProviders(<MotorcyclesPage />);
    await screen.findByText("ABC12D");

    await waitFor(() =>
      expect(listMotorcyclesPageDirMock).toHaveBeenCalledTimes(1),
    );
    // The default state is the first page, ascending by plate, no filters.
    expect(listMotorcyclesPageDirMock).toHaveBeenCalledWith(
      {},
      MotorcycleSort.plate,
      false,
      0n,
      50n,
    );
  });

  it("forwards the search term and brand filter to the backend", async () => {
    searchState = { q: "Yamaha", marca: "Yamaha", pagina: 1 };
    listMotorcyclesPageDirMock.mockResolvedValue(page([motorcycle()]));

    renderWithProviders(<MotorcyclesPage />);
    await screen.findByText("ABC12D");

    await waitFor(() =>
      expect(listMotorcyclesPageDirMock).toHaveBeenLastCalledWith(
        { search: "Yamaha", brand: "Yamaha" },
        MotorcycleSort.plate,
        false,
        0n,
        50n,
      ),
    );
  });

  it("renders an empty state when the listing has no motorcycles", async () => {
    listMotorcyclesPageDirMock.mockResolvedValue(page([]));

    renderWithProviders(<MotorcyclesPage />);

    expect(
      await screen.findByTestId("motorcycles.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay motos registradas"),
    ).toBeInTheDocument();
  });

  it("renders an error state with a retry when the listing fails", async () => {
    listMotorcyclesPageDirMock.mockRejectedValue(new Error("boom"));

    renderWithProviders(<MotorcyclesPage />);

    expect(
      await screen.findByTestId("motorcycles.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar el listado de motos"),
    ).toBeInTheDocument();
  });

  it("requests the next page when the pagination control is used", async () => {
    listMotorcyclesPageDirMock.mockResolvedValue(page([motorcycle()], 120));

    renderWithProviders(<MotorcyclesPage />);
    await screen.findByText("ABC12D");

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("motorcycles.pagination_next"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    const call = navigateMock.mock.calls.at(-1)?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(call.search({})).toMatchObject({ pagina: 2 });
  });

  it("sorts through the backend when a column header is clicked", async () => {
    listMotorcyclesPageDirMock.mockResolvedValue(page([motorcycle()]));

    renderWithProviders(<MotorcyclesPage />);
    await screen.findByText("ABC12D");

    await userEvent.click(screen.getByTestId("motorcycles.sort.brand"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalled());
    const call = navigateMock.mock.calls.at(-1)?.[0] as {
      search: (prev: Record<string, unknown>) => Record<string, unknown>;
    };
    expect(call.search({})).toMatchObject({
      orden: MotorcycleSort.brand,
      dir: "asc",
      pagina: 1,
    });
  });

  it("renders the rows in the order the backend returns them", async () => {
    listMotorcyclesPageDirMock.mockResolvedValue(
      page([
        motorcycle({ id: 1n, plate: "AAA111", brand: "Honda" }),
        motorcycle({ id: 2n, plate: "BBB222", brand: "Yamaha" }),
        motorcycle({ id: 3n, plate: "CCC333", brand: "Suzuki" }),
      ]),
    );

    renderWithProviders(<MotorcyclesPage />);
    await screen.findByText("AAA111");

    const rows = within(screen.getByTestId("motorcycles.page")).getAllByTestId(
      /motorcycles\.row\.\d+/,
    );
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("AAA111"),
      expect.stringContaining("BBB222"),
      expect.stringContaining("CCC333"),
    ]);
  });
});
