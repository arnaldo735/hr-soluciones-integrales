import type { OrderView, Technician } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the order's line management, which is adjacent
 * to the labor/service change and must keep working.
 *
 * The labor dialog is intentionally changing from a free-text form to a
 * service-catalog picker, so this file never asserts the dialog's internals.
 * It protects the surrounding working behavior instead: removing a part line,
 * removing a labor line, reassigning the responsible technician on an existing
 * labor line, and the empty states for both tables.
 */

const useOrderMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
const listTechniciansMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useOrder: () => useOrderMock(),
    useUpdateOrderStatus: () => updateStatusMock(),
    useRemoveOrderPart: () => removePartMock(),
    useRemoveLabor: () => removeLaborMock(),
  };
});

vi.mock("@/hooks/use-technicians", () => ({
  useTechnicians: () => ({
    data: listTechniciansMock(),
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCustomer: vi.fn().mockResolvedValue({
        id: 1n,
        name: "Ada Lovelace",
        phone: "+52",
        createdAt: 0n,
      }),
      listMotorcycles: vi.fn().mockResolvedValue([
        {
          id: 7n,
          customerId: 1n,
          plate: "ABC-123",
          brand: "Honda",
          model: "CB190R",
          year: 2022n,
          mileage: 15000n,
          createdAt: 0n,
        },
      ]),
      assignTechnician: vi.fn(),
      unassignTechnician: vi.fn(),
      updateLaborTechnician: vi.fn(),
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ id: "42" }),
}));

vi.mock("@/components/order/AddPartDialog", () => ({
  AddPartDialog: () => null,
}));
vi.mock("@/components/order/AddLaborDialog", () => ({
  AddLaborDialog: () => null,
}));

function technician(overrides: Partial<Technician> = {}): Technician {
  return {
    id: 5n,
    code: "TEC-005",
    name: "Marco Ríos",
    phone: "81 8123 4567",
    email: "marco@taller.co",
    specialty: "Motores",
    hourlyRate: 18000n,
    commissionRate: 10n,
    active: true,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function orderView(overrides: Partial<OrderView["order"]> = {}): OrderView {
  return {
    order: {
      id: 42n,
      orderNumber: "OT-0001",
      status: OrderStatus.received,
      customerId: 1n,
      motorcycleId: 7n,
      intakeMileage: 15000n,
      problem: "Frenos ruidosos",
      parts: [
        {
          id: 1n,
          partId: 10n,
          description: "Balata de freno",
          quantity: 2n,
          unitPrice: 25000n,
          unitCost: 12000n,
          lotId: 3n,
        },
      ],
      labor: [{ id: 1n, description: "Ajuste de frenos", price: 30000n }],
      technicianIds: [],
      statusHistory: [
        {
          to: OrderStatus.received,
          at: 1_700_000_000_000_000_000n,
          performedBy: undefined as never,
        },
      ],
      createdAt: 1_700_000_000_000_000_000n,
      updatedAt: 1_700_000_000_000_000_000n,
      photos: [],
      ...overrides,
    },
    totals: {
      partsSubtotal: 50000n,
      laborSubtotal: 30000n,
      subtotal: 80000n,
      taxRate: 16n,
      tax: 12800n,
      total: 92800n,
    },
  };
}

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function loadedOrder(view: OrderView = orderView()) {
  return {
    data: view,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("OrderDetailPage line management", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    listTechniciansMock.mockReset();
    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    listTechniciansMock.mockReturnValue([]);
  });

  it("removes a part line through the backend", async () => {
    const mutate = vi.fn();
    removePartMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.parts.remove_button.1"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({ id: 42n, orderPartId: 1n });
  });

  it("removes a labor line through the backend", async () => {
    const mutate = vi.fn();
    removeLaborMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.labor.remove_button.1"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({ id: 42n, laborId: 1n });
  });

  it("shows the responsible technician on a labor line", async () => {
    listTechniciansMock.mockReturnValue([technician()]);
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Ajuste de frenos",
              price: 30000n,
              technicianId: 5n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const row = within(screen.getByTestId("order_detail.labor.row.1"));
    expect(row.getByText("TEC-005 · Marco Ríos")).toBeInTheDocument();
  });

  it("labels a labor line with no responsible technician", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const row = within(screen.getByTestId("order_detail.labor.row.1"));
    expect(row.getByText("Sin técnico responsable")).toBeInTheDocument();
  });

  it("renders empty states for parts and labor when the order has none", async () => {
    useOrderMock.mockReturnValue(
      loadedOrder(orderView({ parts: [], labor: [] })),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.getByTestId("order_detail.parts.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("order_detail.labor.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin repuestos")).toBeInTheDocument();
    expect(screen.getByText("Sin mano de obra")).toBeInTheDocument();
  });

  it("shows the assigned-technicians empty state when none are assigned", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.getByTestId("order_detail.technicians.empty_state"),
    ).toBeInTheDocument();
  });

  // --- Characterization: the parts row the stock change must keep -----------
  //
  // The accepted change stops adding/removing a part line from deducting stock
  // and creating an outbound movement. These tests protect the parts table's
  // presentation contract instead: the row still shows the description, the
  // quantity, the unit price and the line amount (quantity × unit price), and
  // it still labels the lot reference. They never assert the stock-deduction
  // copy, because that is exactly what is changing.

  it("renders a part row with quantity, unit price and the line amount", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const row = within(screen.getByTestId("order_detail.parts.row.1"));
    expect(row.getByText("Balata de freno")).toBeInTheDocument();
    // 2 × $ 250.00 = $ 500.00
    expect(row.getByText("2")).toBeInTheDocument();
    expect(row.getByText("$ 250")).toBeInTheDocument();
    expect(row.getByText("$ 500")).toBeInTheDocument();
  });

  it("labels a part row with its lot reference", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const row = within(screen.getByTestId("order_detail.parts.row.1"));
    expect(row.getByText("Lote #3")).toBeInTheDocument();
  });

  it("labels a part row with no lot as unassigned", async () => {
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          parts: [
            {
              id: 1n,
              partId: 10n,
              description: "Balata de freno",
              quantity: 2n,
              unitPrice: 25000n,
              unitCost: 12000n,
              lotId: undefined,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const row = within(screen.getByTestId("order_detail.parts.row.1"));
    expect(row.getByText("Sin lote asignado")).toBeInTheDocument();
  });
});
