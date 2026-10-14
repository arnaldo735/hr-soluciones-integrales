import type { OrderView, Technician } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the workshop-order line list that surrounds the
 * accepted change.
 *
 * The accepted change makes a newly appended part/labor line appear first in
 * the document list (and lets the user choose the quantity before appending).
 * Both of those are intentionally changing, so this file never asserts the
 * current "appended last" order and never asserts the dialog internals.
 *
 * It protects the adjacent working contract that must survive the change:
 *   - every part line the order carries is rendered, with its description,
 *     quantity, unit price and line amount (quantity × unit price);
 *   - every labor line is rendered with its description and price;
 *   - parts and labor stay in their own tables and never leak into each other;
 *   - the line count matches the order, so a reordering cannot silently drop a
 *     line.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend order.
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
  // The page reads the "add item" query params on mount; with no params it
  // renders the order as loaded and appends nothing.
  useSearch: () => ({}),
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
        {
          id: 2n,
          partId: 11n,
          description: "Aceite 10W40",
          quantity: 3n,
          unitPrice: 18000n,
          unitCost: 9000n,
          lotId: undefined,
        },
      ],
      labor: [
        { id: 1n, description: "Ajuste de frenos", price: 30000n },
        { id: 2n, description: "Cambio de aceite", price: 45000n },
      ],
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
      payments: [],
      ...overrides,
    },
    totals: {
      partsSubtotal: 104000n,
      laborSubtotal: 75000n,
      subtotal: 179000n,
      taxRate: 16n,
      tax: 28640n,
      total: 207640n,
      paidAmount: 0n,
      balance: 207640n,
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

describe("OrderDetailPage line list (characterization)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    listTechniciansMock.mockReset();
    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    listTechniciansMock.mockReturnValue([technician()]);
  });

  it("renders every part line with its quantity, unit price and amount", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // Both part lines are present, regardless of the order they render in.
    const balata = within(screen.getByTestId("order_detail.parts.row.1"));
    expect(balata.getByText("Balata de freno")).toBeInTheDocument();
    expect(balata.getByText("2")).toBeInTheDocument();
    expect(balata.getByText("$ 250")).toBeInTheDocument();
    // 2 × $ 250.00 = $ 500.00
    expect(balata.getByText("$ 500")).toBeInTheDocument();

    const aceite = within(screen.getByTestId("order_detail.parts.row.2"));
    expect(aceite.getByText("Aceite 10W40")).toBeInTheDocument();
    expect(aceite.getByText("3")).toBeInTheDocument();
    expect(aceite.getByText("$ 180")).toBeInTheDocument();
    // 3 × $ 180.00 = $ 540.00
    expect(aceite.getByText("$ 540")).toBeInTheDocument();
  });

  it("renders every labor line with its description and price", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const ajuste = within(screen.getByTestId("order_detail.labor.row.1"));
    expect(ajuste.getByText("Ajuste de frenos")).toBeInTheDocument();
    expect(ajuste.getByText("$ 300")).toBeInTheDocument();

    const cambio = within(screen.getByTestId("order_detail.labor.row.2"));
    expect(cambio.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(cambio.getByText("$ 450")).toBeInTheDocument();
  });

  it("keeps parts and labor in their own tables", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const partsTable = within(screen.getByTestId("order_detail.parts.table"));
    expect(partsTable.getByText("Balata de freno")).toBeInTheDocument();
    expect(partsTable.queryByText("Ajuste de frenos")).not.toBeInTheDocument();

    const laborTable = within(screen.getByTestId("order_detail.labor.table"));
    expect(laborTable.getByText("Ajuste de frenos")).toBeInTheDocument();
    expect(laborTable.queryByText("Balata de freno")).not.toBeInTheDocument();
  });

  it("renders one row per line the order carries", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // Two parts and two labor lines, so a reordering cannot drop a line.
    expect(screen.getByTestId("order_detail.parts.row.1")).toBeInTheDocument();
    expect(screen.getByTestId("order_detail.parts.row.2")).toBeInTheDocument();
    expect(
      screen.queryByTestId("order_detail.parts.row.3"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("order_detail.labor.row.1")).toBeInTheDocument();
    expect(screen.getByTestId("order_detail.labor.row.2")).toBeInTheDocument();
    expect(
      screen.queryByTestId("order_detail.labor.row.3"),
    ).not.toBeInTheDocument();
  });
});
