import type { Customer, Motorcycle, OrderView } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { NewOrderPage } from "@/pages/NewOrderPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover coverage for the accepted odometer change on the intake form:
 * "Kilometraje anterior" (optional), the live "Kilómetros recorridos" and
 * "Próximo cambio de aceite" (intake + editable interval, default 3000 km), and
 * the guard that blocks creating an order whose intake mileage is below the
 * previous one.
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

/** Fills the form up to (but not including) the mileage fields. */
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

describe("NewOrderPage odometer fields (cover)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    createOrderMock.mockReset();
    navigateMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("renders the new order form without a blank screen", async () => {
    renderWithProviders(<NewOrderPage />);

    expect(await screen.findByTestId("new_order.page")).toBeInTheDocument();
    expect(
      screen.getByTestId("new_order.previous_mileage_input"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("new_order.oil_change_interval_input"),
    ).toBeInTheDocument();
  });

  it("shows 4500 km travelled for previous 20000 and intake 24500", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await userEvent.type(
      screen.getByTestId("new_order.previous_mileage_input"),
      "20000",
    );
    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );

    expect(
      await screen.findByTestId("new_order.travelled_km_value"),
    ).toHaveTextContent("4.500 km");
  });

  it("shows the next oil change at 27500 km for intake 24500 and interval 3000", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    // The interval defaults to 3000 km.
    expect(
      screen.getByTestId("new_order.oil_change_interval_input"),
    ).toHaveValue(3000);

    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );

    expect(
      await screen.findByTestId("new_order.next_oil_change_value"),
    ).toHaveTextContent("27.500 km");
  });

  it("recalculates the next oil change to 29500 km when the interval becomes 5000", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );
    expect(
      await screen.findByTestId("new_order.next_oil_change_value"),
    ).toHaveTextContent("27.500 km");

    const interval = screen.getByTestId("new_order.oil_change_interval_input");
    await userEvent.clear(interval);
    await userEvent.type(interval, "5000");

    expect(
      screen.getByTestId("new_order.next_oil_change_value"),
    ).toHaveTextContent("29.500 km");
  });

  it("disables Crear orden and explains why when intake is below previous", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await chooseCustomerAndMotorcycle();
    await userEvent.type(
      screen.getByTestId("new_order.previous_mileage_input"),
      "20000",
    );
    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "15000",
    );
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "Frenos ruidosos",
    );

    expect(screen.getByTestId("new_order.submit_button")).toBeDisabled();
    expect(
      screen.getByTestId("new_order.mileage_validation_error"),
    ).toHaveTextContent(
      "El kilometraje actual no puede ser menor que el kilometraje anterior.",
    );
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("creates the order forwarding previous mileage and the interval", async () => {
    createOrderMock.mockResolvedValue(orderView());
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await chooseCustomerAndMotorcycle();
    await userEvent.type(
      screen.getByTestId("new_order.previous_mileage_input"),
      "20000",
    );
    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );
    const interval = screen.getByTestId("new_order.oil_change_interval_input");
    await userEvent.clear(interval);
    await userEvent.type(interval, "5000");
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "Frenos ruidosos",
    );

    await userEvent.click(screen.getByTestId("new_order.submit_button"));

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1));
    expect(createOrderMock.mock.calls[0][0]).toBeNull();
    expect(createOrderMock.mock.calls[0][1]).toMatchObject({
      customerId: 7n,
      motorcycleId: 3n,
      intakeMileage: 24500n,
      previousMileage: 20000n,
      oilChangeInterval: 5000n,
      problem: "Frenos ruidosos",
      technicianIds: [],
    });
  });

  it("omits previous mileage when it is left empty", async () => {
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
    const input = createOrderMock.mock.calls[0][1] as Record<string, unknown>;
    expect(input).not.toHaveProperty("previousMileage");
    expect(input).toMatchObject({
      intakeMileage: 24500n,
      oilChangeInterval: 3000n,
    });
  });
});
