import type { OrderView, Service } from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the seams the automatic warranty document will
 * read, and for the order document footer it will sit beside.
 *
 * The accepted change activates a warranty document when an order carries a
 * labor line linked to the catalog services "Reparación de motor" or
 * "Reparación de cabeza de fuerza", and replaces the order's hardcoded footer
 * with an admin-editable service-terms footer. These tests protect the working
 * behavior those changes build on, and deliberately never freeze the hardcoded
 * footer copy or the absence of a warranty document — both are exactly what the
 * change alters:
 *
 * - a labor line linked to a catalog service still renders its linked service
 *   (code · name), which is the link the warranty trigger inspects;
 * - a labor line with no catalog link still offers "Vincular servicio";
 * - the order's print dialog still renders the shared document preview with a
 *   footer note region and the document body, so the editable footer has a
 *   place to land.
 */

const useOrderMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const useServiceMock = vi.fn();

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

vi.mock("@/hooks/use-services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-services")>();
  return { ...actual, useService: (id: unknown) => useServiceMock(id) };
});

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
      getCompanyProfile: getCompanyProfileMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
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

function catalogService(overrides: Partial<Service> = {}): Service {
  return {
    id: 9n,
    active: true,
    code: "SRV-006",
    name: "Reparación de motor",
    createdAt: 1_700_000_000_000_000_000n,
    description: "Reparación completa del motor",
    category: "Motor",
    laborRate: 250000n,
    estimatedMinutes: 480n,
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
      problem: "Motor con ruido",
      parts: [],
      labor: [{ id: 1n, description: "Reparación de motor", price: 250000n }],
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
      partsSubtotal: 0n,
      laborSubtotal: 250000n,
      subtotal: 250000n,
      taxRate: 0n,
      tax: 0n,
      total: 250000n,
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

describe("OrderDetailPage warranty seam (characterization)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    useServiceMock.mockReset();
    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    getCompanyProfileMock.mockResolvedValue(null);
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: "auto",
      text: "",
      citation: "",
      referenceDate: "26/09/2026",
    });
    useServiceMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
  });

  it("renders the linked catalog service on a labor line", async () => {
    useServiceMock.mockReturnValue({
      data: catalogService(),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // The link the warranty trigger inspects is observable on the row.
    const row = within(screen.getByTestId("order_detail.labor.row.1"));
    expect(row.getByText("SRV-006 · Reparación de motor")).toBeInTheDocument();
    expect(useServiceMock).toHaveBeenCalledWith(9n);
  });

  it("offers to link a catalog service on a labor line with none", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const row = within(screen.getByTestId("order_detail.labor.row.1"));
    expect(row.getByText("Vincular servicio")).toBeInTheDocument();
    // No service id means no catalog read for that line.
    expect(useServiceMock).toHaveBeenCalledWith(null);
  });

  it("renders the document preview with a footer note and the document body", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));

    const document = await screen.findByTestId("order_detail.document");
    // The document body still renders its line items and totals.
    expect(
      within(document).getByText("Reparación de motor"),
    ).toBeInTheDocument();
    expect(within(document).getByText("Total")).toBeInTheDocument();
    // A footer note region is present and non-empty; its exact copy is what the
    // admin-editable setting will supply, so it is not frozen here.
    const footer = document.querySelector(".doc-meta.text-center");
    expect(footer).not.toBeNull();
    expect((footer?.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("keeps the footer note region in the 80 mm receipt format too", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));
    const document = await screen.findByTestId("order_detail.document");

    await userEvent.click(
      within(document).getByTestId("order_detail.document.format_receipt80"),
    );

    // The paper switches to the 80 mm roll and the footer region survives.
    expect(document.querySelector(".doc-preview-80mm")).not.toBeNull();
    const footer = document.querySelector(".doc-meta.text-center");
    expect(footer).not.toBeNull();
    expect((footer?.textContent ?? "").trim().length).toBeGreaterThan(0);
  });
});
