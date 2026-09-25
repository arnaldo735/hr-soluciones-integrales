import type { Customer, Motorcycle } from "@/lib/types";
import { NewOrderPage } from "@/pages/NewOrderPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted type-to-search customer picker on the workshop
 * order intake form.
 *
 * The accepted change replaces the fixed customer dropdown with a search box
 * that filters the directory live as the user types. These tests pin the
 * observable behavior the change introduces: the pre-typing prompt, the
 * no-match empty state carrying the typed term, and changing the selected
 * customer clearing the chosen motorcycle and reloading the new customer's
 * motorcycles. The happy-path selection and the create payload are already
 * covered by `NewOrderPage.characterize.test.tsx`.
 *
 * The backend actor is mocked; the real directory is not exercised here.
 */

const listCustomersMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const createOrderMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomers: listCustomersMock,
      listMotorcycles: listMotorcyclesMock,
      createOrder: createOrderMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 7n,
    name: "Ana Pérez",
    phone: "+57 300 111 2222",
    email: "ana@example.com",
    document: "LOAA1815",
    createdAt: TS,
    ...overrides,
  };
}

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 3n,
    customerId: 7n,
    plate: "ABC12D",
    brand: "Yamaha",
    model: "FZ25",
    year: 2021n,
    mileage: 12000n,
    createdAt: TS,
    ...overrides,
  };
}

describe("NewOrderPage customer search", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    createOrderMock.mockReset();
    navigateMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("prompts for a term before the user types instead of listing the whole directory", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    expect(
      await screen.findByTestId("new_order.customer_search.prompt_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("new_order.customer_search.list"),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state carrying the typed term when nothing matches", async () => {
    listCustomersMock.mockResolvedValue([]);
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await userEvent.type(
      screen.getByTestId("new_order.customer_search_input"),
      "Zzz",
    );

    const empty = await screen.findByTestId(
      "new_order.customer_search.empty_state",
    );
    expect(empty).toHaveTextContent("Zzz");
    expect(
      screen.queryByTestId("new_order.customer_search.list"),
    ).not.toBeInTheDocument();
  });

  it("clears the chosen motorcycle and reloads the new customer's motorcycles when the customer changes", async () => {
    const other = customer({
      id: 9n,
      name: "Beto Gómez",
      phone: "+57 300 999 8888",
    });
    listCustomersMock.mockImplementation((term: string | null) =>
      Promise.resolve(term === "Beto" ? [other] : [customer()]),
    );
    listMotorcyclesMock.mockImplementation((customerId: bigint) =>
      Promise.resolve(
        customerId === 9n
          ? [
              motorcycle({
                id: 5n,
                customerId: 9n,
                plate: "XYZ99",
                brand: "Honda",
                model: "CB190R",
              }),
            ]
          : [motorcycle()],
      ),
    );
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    // Choose the first customer and its motorcycle.
    await userEvent.type(
      screen.getByTestId("new_order.customer_search_input"),
      "Ana",
    );
    await userEvent.click(
      await screen.findByTestId("new_order.customer_search.item.1"),
    );
    await waitFor(() => expect(listMotorcyclesMock).toHaveBeenCalledWith(7n));

    await userEvent.click(
      await screen.findByTestId("new_order.motorcycle_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Yamaha FZ25 · ABC12D" }),
    );

    // Change the customer.
    await userEvent.click(
      screen.getByTestId("new_order.change_customer_button"),
    );

    // The motorcycle field is cleared back to its gated placeholder, so the
    // previously chosen motorcycle is no longer selected.
    expect(
      await screen.findByText("Selecciona primero un cliente"),
    ).toBeInTheDocument();

    // Search and pick the second customer. The previous result stays cached
    // until the new term's query resolves, so wait for the Beto row itself.
    await userEvent.type(
      screen.getByTestId("new_order.customer_search_input"),
      "Beto",
    );
    await waitFor(() => expect(listCustomersMock).toHaveBeenCalledWith("Beto"));
    await userEvent.click(await screen.findByText("Beto Gómez"));

    // The new customer's motorcycles are loaded.
    await waitFor(() => expect(listMotorcyclesMock).toHaveBeenCalledWith(9n));
    await userEvent.click(
      await screen.findByTestId("new_order.motorcycle_select"),
    );
    expect(
      await screen.findByRole("option", { name: "Honda CB190R · XYZ99" }),
    ).toBeInTheDocument();
  });
});
