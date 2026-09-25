import type { Customer, Motorcycle, OrderView } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { NewOrderPage } from "@/pages/NewOrderPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the workshop-order intake form.
 *
 * The accepted change turns the customer field into a type-to-search picker.
 * These tests protect the surrounding working behavior that must survive it:
 * the empty-directory message, the motorcycle field gated on a chosen customer,
 * the mileage and problem validation, and the payload sent when a valid order
 * is created. They never assert the shape of the customer control itself, which
 * is exactly what is changing.
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
    },
    totals: {
      partsSubtotal: 0n,
      laborSubtotal: 0n,
      subtotal: 0n,
      taxRate: 0n,
      tax: 0n,
      total: 0n,
    },
  };
}

describe("NewOrderPage intake form (characterization)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    createOrderMock.mockReset();
    navigateMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("tells the user to create a customer when the directory is empty", async () => {
    listCustomersMock.mockResolvedValue([]);
    renderWithProviders(<NewOrderPage />);

    expect(
      await screen.findByText(
        "No hay clientes registrados. Crea un cliente antes de levantar una orden.",
      ),
    ).toBeInTheDocument();
  });

  it("asks for a customer before offering the motorcycle field", async () => {
    renderWithProviders(<NewOrderPage />);

    expect(
      await screen.findByText("Selecciona primero un cliente"),
    ).toBeInTheDocument();
    // The motorcycle list is not requested until a customer is chosen.
    expect(listMotorcyclesMock).not.toHaveBeenCalled();
  });

  it("blocks the submit and explains when the mileage is not a whole number", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await userEvent.type(screen.getByTestId("new_order.mileage_input"), "12.5");
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "Frenos ruidosos",
    );

    // The submit stays disabled while the mileage is invalid, so no order is
    // created.
    expect(screen.getByTestId("new_order.submit_button")).toBeDisabled();
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("blocks the submit until the reported problem is described", async () => {
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );

    expect(screen.getByTestId("new_order.submit_button")).toBeDisabled();
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it("creates the order with the chosen customer, motorcycle, mileage and problem", async () => {
    createOrderMock.mockResolvedValue(orderView());
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    // Choose the customer through the type-to-search picker the page now
    // renders. The assertion below is about the payload, not this control's
    // shape.
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

    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "  Frenos ruidosos  ",
    );

    await userEvent.click(screen.getByTestId("new_order.submit_button"));

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1));
    expect(createOrderMock.mock.calls[0][0]).toMatchObject({
      customerId: 7n,
      motorcycleId: 3n,
      intakeMileage: 24500n,
      problem: "Frenos ruidosos",
      technicianIds: [],
    });
  });

  it("shows the backend error and keeps the form when the create fails", async () => {
    createOrderMock.mockRejectedValue(new Error("No se pudo crear la orden."));
    renderWithProviders(<NewOrderPage />);
    await screen.findByTestId("new_order.page");

    await userEvent.type(
      screen.getByTestId("new_order.customer_search_input"),
      "Ana",
    );
    await userEvent.click(
      await screen.findByTestId("new_order.customer_search.item.1"),
    );
    await userEvent.click(
      await screen.findByTestId("new_order.motorcycle_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Yamaha FZ25 · ABC12D" }),
    );
    await userEvent.type(
      screen.getByTestId("new_order.mileage_input"),
      "24500",
    );
    await userEvent.type(
      screen.getByTestId("new_order.problem_textarea"),
      "Frenos ruidosos",
    );
    await userEvent.click(screen.getByTestId("new_order.submit_button"));

    expect(
      await screen.findByTestId("new_order.error_state"),
    ).toHaveTextContent("No se pudo crear la orden.");
    // The failure does not navigate away from the form.
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
