import type { CustomerDetail, Motorcycle } from "@/lib/types";
import { CustomerDetailPage } from "@/pages/CustomerDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the customer detail page — the destination of
 * every `/clientes` row link.
 *
 * The accepted change replaces the per-customer `listMotorcycles` fan-out that
 * froze `/clientes` with a stable query key and a single bulk fetch. The detail
 * page reads its motorcycles from `getCustomerDetail` instead, so it is adjacent
 * working behavior the freeze fix must not break: opening a customer still shows
 * that customer's own motorcycles and order history, the empty and error states
 * still render, and the customer/motorcycle dialogs still open seeded with the
 * right record.
 *
 * These tests never assert how the directory fetches motorcycles, nor the shape
 * of any query key — that is the behavior the accepted change intentionally
 * alters. They also never assert how long a dialog takes to open.
 */

const getCustomerDetailMock = vi.fn();
const updateCustomerMock = vi.fn();
const updateMotorcycleMock = vi.fn();
const createMotorcycleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCustomerDetail: getCustomerDetailMock,
      updateCustomer: updateCustomerMock,
      updateMotorcycle: updateMotorcycleMock,
      createMotorcycle: createMotorcycleMock,
    },
    isFetching: false,
  }),
}));

// The page reads the route param; the test drives it directly rather than
// mounting the whole router.
const useParamsMock = vi.fn();
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
  useParams: () => useParamsMock(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 7n,
    customerId: 1n,
    brand: "Yamaha",
    model: "FZ 2.0",
    plate: "ABC-123",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function detail(overrides: Partial<CustomerDetail> = {}): CustomerDetail {
  return {
    customer: {
      id: 1n,
      name: "Ada Lovelace",
      phone: "+52 555 0100",
      email: "ada@example.com",
      document: "LOAA1815",
      address: "Calle 1 #2-3",
      createdAt: 1_700_000_000_000_000_000n,
    },
    motorcycles: [],
    orders: [],
    ...overrides,
  };
}

describe("CustomerDetailPage (characterization)", () => {
  beforeEach(() => {
    getCustomerDetailMock.mockReset();
    updateCustomerMock.mockReset();
    updateMotorcycleMock.mockReset();
    createMotorcycleMock.mockReset();
    useParamsMock.mockReset();
    useParamsMock.mockReturnValue({ id: "1" });
  });

  it("shows the customer's own motorcycles and order history", async () => {
    getCustomerDetailMock.mockResolvedValue(
      detail({
        motorcycles: [
          motorcycle({ id: 7n, plate: "ABC-123", brand: "Yamaha" }),
          motorcycle({ id: 8n, plate: "XYZ-789", brand: "Honda" }),
        ],
        orders: [
          {
            orderId: 42n,
            orderNumber: "OT-000042",
            status: "delivered",
            motorcyclePlate: "ABC-123",
            total: 140000n,
            createdAt: 1_700_000_000_000_000_000n,
          },
        ],
      }),
    );

    renderWithProviders(<CustomerDetailPage />);

    expect(
      await screen.findByTestId("customer_detail.page"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();

    // Both motorcycles render in the moto table, keyed by their own plate.
    const motoTable = screen.getByTestId("motorcycle.table");
    expect(within(motoTable).getByText("ABC-123")).toBeInTheDocument();
    expect(within(motoTable).getByText("XYZ-789")).toBeInTheDocument();

    // The order history renders the order the backend returned.
    const ordersTable = screen.getByTestId("customer_orders.table");
    expect(within(ordersTable).getByText("OT-000042")).toBeInTheDocument();
    expect(within(ordersTable).getByText("ABC-123")).toBeInTheDocument();
  });

  it("reads the detail for the id in the route", async () => {
    useParamsMock.mockReturnValue({ id: "9" });
    getCustomerDetailMock.mockResolvedValue(detail());

    renderWithProviders(<CustomerDetailPage />);

    await waitFor(() => expect(getCustomerDetailMock).toHaveBeenCalledWith(9n));
  });

  it("shows the empty states when the customer has no motorcycles or orders", async () => {
    getCustomerDetailMock.mockResolvedValue(detail());

    renderWithProviders(<CustomerDetailPage />);

    expect(
      await screen.findByTestId("motorcycle.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin motos registradas")).toBeInTheDocument();
    expect(
      screen.getByTestId("customer_orders.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin órdenes de taller")).toBeInTheDocument();
  });

  it("shows the not-found state when the backend returns no customer", async () => {
    getCustomerDetailMock.mockResolvedValue(null);

    renderWithProviders(<CustomerDetailPage />);

    expect(
      await screen.findByTestId("customer_detail.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cliente no encontrado")).toBeInTheDocument();
  });

  it("shows an error state with a retry when the detail fails to load", async () => {
    getCustomerDetailMock.mockRejectedValue(new Error("boom"));

    renderWithProviders(<CustomerDetailPage />);

    expect(
      await screen.findByTestId("customer_detail.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar el cliente"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("customer_detail.retry_button"),
    ).toBeInTheDocument();
  });

  it("opens the customer edit dialog seeded with this customer's data", async () => {
    getCustomerDetailMock.mockResolvedValue(detail());

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("customer_detail.page");

    await userEvent.click(screen.getByTestId("customer_detail.edit_button"));

    const dialog = await screen.findByTestId("customer.dialog");
    expect(within(dialog).getByText("Editar cliente")).toBeInTheDocument();
    expect(screen.getByTestId("customer.name_input")).toHaveValue(
      "Ada Lovelace",
    );
    expect(screen.getByTestId("customer.phone_input")).toHaveValue(
      "+52 555 0100",
    );
    expect(screen.getByTestId("customer.email_input")).toHaveValue(
      "ada@example.com",
    );
  });

  it("opens the motorcycle edit dialog seeded with the clicked bike's data", async () => {
    // Two bikes with distinct plates: a dialog seeded from the wrong row, or
    // from a shared draft, would fail here.
    getCustomerDetailMock.mockResolvedValue(
      detail({
        motorcycles: [
          motorcycle({
            id: 7n,
            plate: "ABC-123",
            brand: "Yamaha",
            model: "FZ 2.0",
          }),
          motorcycle({
            id: 8n,
            plate: "XYZ-789",
            brand: "Honda",
            model: "CB 190",
            year: 2019n,
            mileage: 45000n,
          }),
        ],
      }),
    );

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("motorcycle.table");

    await userEvent.click(screen.getByTestId("motorcycle.edit_button.2"));

    const dialog = await screen.findByTestId("motorcycle.dialog");
    expect(within(dialog).getByText("Editar moto")).toBeInTheDocument();
    expect(screen.getByTestId("motorcycle.plate_input")).toHaveValue("XYZ-789");
    expect(screen.getByTestId("motorcycle.brand_input")).toHaveValue("Honda");
    expect(screen.getByTestId("motorcycle.model_input")).toHaveValue("CB 190");
    expect(screen.getByTestId("motorcycle.year_input")).toHaveValue("2019");
    expect(screen.getByTestId("motorcycle.mileage_input")).toHaveValue("45000");
  });

  it("opens a blank motorcycle create dialog from the add-moto action", async () => {
    getCustomerDetailMock.mockResolvedValue(detail());

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("customer_detail.page");

    await userEvent.click(screen.getByTestId("motorcycle.open_modal_button"));

    const dialog = await screen.findByTestId("motorcycle.dialog");
    expect(within(dialog).getByText("Nueva moto")).toBeInTheDocument();
    expect(screen.getByTestId("motorcycle.plate_input")).toHaveValue("");
    expect(screen.getByTestId("motorcycle.brand_input")).toHaveValue("");
  });

  it("keeps the motorcycle dialog interactive while it is open", async () => {
    // The reported freeze is the behavior the accepted change fixes; this test
    // only pins the adjacent contract that the open dialog still responds to
    // user input and keeps the draft the user typed.
    getCustomerDetailMock.mockResolvedValue(
      detail({ motorcycles: [motorcycle()] }),
    );

    renderWithProviders(<CustomerDetailPage />);
    await screen.findByTestId("motorcycle.table");

    await userEvent.click(screen.getByTestId("motorcycle.edit_button.1"));
    await screen.findByTestId("motorcycle.dialog");

    const plate = screen.getByTestId("motorcycle.plate_input");
    await userEvent.clear(plate);
    await userEvent.type(plate, "NEW-999");
    expect(plate).toHaveValue("NEW-999");

    expect(screen.getByTestId("motorcycle.dialog")).toBeInTheDocument();
    expect(screen.getByTestId("motorcycle.brand_input")).toHaveValue("Yamaha");
  });
});
