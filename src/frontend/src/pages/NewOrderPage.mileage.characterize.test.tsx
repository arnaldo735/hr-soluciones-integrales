import type { Customer, Motorcycle, OrderView } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { NewOrderPage } from "@/pages/NewOrderPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the intake form's odometer field, ahead of the
 * accepted change that adds an optional "Kilometraje anterior" and a computed
 * "Próximo cambio de aceite".
 *
 * These tests protect the working behavior around the existing "Kilometraje de
 * ingreso" field that must survive the change: only a whole, non-negative
 * number is accepted, the submit stays disabled until the form is complete,
 * and the created order carries the typed mileage as a bigint. They never
 * assert the new fields, which do not exist yet.
 *
 * The backend actor is mocked with the real token-first call signature
 * (`listCustomers(token, term)`, `listMotorcycles(token, customerId)`,
 * `createOrder(token, input)`); the real canister is not exercised here.
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

function orderView(): OrderView {
  return {
    order: {
      id: 42n,
      orderNumber: "OT-0001",
      status: OrderStatus.received,
      customerId: 7n,
      motorcycleId: 3n,
      intakeMileage: 24500n,
      problem: "Frenos ruidosos",
      parts: [],
      labor: [],
      technicianIds: [],
      statusHistory: [],
      createdAt: TS,
      updatedAt: TS,
      photos: [],
      payments: [],
    },
    totals: {
      partsSubtotal: 0n,
      laborSubtotal: 0n,
      subtotal: 0n,
      taxRate: 0n,
      tax: 0n,
      total: 0n,
      paidAmount: 0n,
      balance: 0n,
    },
  };
}

/** Fills the form up to (but not including) the mileage field. */
async function chooseCustomerAndMotorcycle() {
  await userEvent.type(
    screen.getByTestId("new_order.customer_search_input"),
    "Ana",
  );
  await userEvent.click(
    await screen.findByTestId("new_order.customer_search.item.1"),
  );
  await waitFor(() =>
    expect(listMotorcyclesMock).toHaveBeenCalledWith(null, 7n),
  );
  await userEvent.click(
    await screen.findByTestId("new_order.motorcycle_select"),
  );
  await userEvent.click(
    await screen.findByRole("option", { name: "Yamaha FZ25 · ABC12D" }),
  );
}

describe("NewOrderPage intake mileage (characterization)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    createOrderMock.mockReset();
    navigateMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("keeps the submit disabled for a negative mileage", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await chooseCustomerAndMotorcycle();
    await userEvent.type(screen.getByTestId("new_order.mileage_input"), "-5");
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "Frenos ruidosos",
    );

    expect(screen.getByTestId("new_order.submit_button")).toBeDisabled();
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("keeps the submit disabled for a fractional mileage", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await chooseCustomerAndMotorcycle();
    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500.5",
    );
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "Frenos ruidosos",
    );

    expect(screen.getByTestId("new_order.submit_button")).toBeDisabled();
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("previews the typed mileage in kilometres once it is a whole number", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );

    // es-CO groups thousands with a dot.
    expect(await screen.findByText("24.500 km")).toBeInTheDocument();
  });

  it("creates the order with the typed mileage as a bigint", async () => {
    createOrderMock.mockResolvedValue(orderView());
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await chooseCustomerAndMotorcycle();
    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "Frenos ruidosos",
    );

    await userEvent.click(screen.getByTestId("new_order.submit_button"));

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1));
    // The actor is called as createOrder(token, input).
    expect(createOrderMock.mock.calls[0][0]).toBeNull();
    expect(createOrderMock.mock.calls[0][1]).toMatchObject({
      customerId: 7n,
      motorcycleId: 3n,
      intakeMileage: 24500n,
      problem: "Frenos ruidosos",
      technicianIds: [],
    });
  });
});
