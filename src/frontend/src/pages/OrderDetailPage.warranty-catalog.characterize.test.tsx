import type { OrderView, Service, ServicePage } from "@/lib/types";
import { HopeMode, OrderStatus } from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the seam that decides whether the automatic
 * "Términos y Condiciones de Garantía" document applies to a work order.
 *
 * The accepted change adds the catalog services "Reparación de motor" and
 * "Reparación de cabeza de fuerza" and lets a labor line activate the warranty
 * by name even when it is not linked to the catalog. That is exactly the
 * behavior this file must NOT freeze. It protects the working resolution seam
 * the change builds on instead:
 *
 * - the page loads the whole catalog (no search term, inactive included) so it
 *   can resolve any linked `serviceId` to its name;
 * - a labor line linked to a catalog service that is not a warranty service
 *   keeps the warranty action hidden;
 * - a labor line whose `serviceId` is not present in the loaded catalog cannot
 *   be resolved, so the warranty action stays hidden rather than guessing.
 *
 * The backend and the PDF builder are mocked at their seams, so a passing run
 * says nothing about the real canister reads or the bytes jsPDF produces.
 */

const {
  useOrderMock,
  updateStatusMock,
  removePartMock,
  removeLaborMock,
  useServicesMock,
  serviceTermsQueryMock,
  warrantyTermsQueryMock,
  getCompanyProfileMock,
  getDailyHopeMessageMock,
} = vi.hoisted(() => ({
  useOrderMock: vi.fn(),
  updateStatusMock: vi.fn(),
  removePartMock: vi.fn(),
  removeLaborMock: vi.fn(),
  useServicesMock: vi.fn(),
  serviceTermsQueryMock: vi.fn(),
  warrantyTermsQueryMock: vi.fn(),
  getCompanyProfileMock: vi.fn(),
  getDailyHopeMessageMock: vi.fn(),
}));

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
  return {
    ...actual,
    useServices: (params: unknown) => useServicesMock(params),
  };
});

vi.mock("@/hooks/use-service-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-service-terms")>();
  return { ...actual, useServiceTermsSettings: () => serviceTermsQueryMock() };
});

vi.mock("@/hooks/use-warranty-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-warranty-terms")>();
  return {
    ...actual,
    useWarrantyTermsSettings: () => warrantyTermsQueryMock(),
  };
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
      listTechnicians: vi.fn().mockResolvedValue([]),
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
  useSearch: () => ({}),
}));

vi.mock("@/components/order/AddPartDialog", () => ({
  AddPartDialog: () => null,
}));
vi.mock("@/components/order/AddLaborDialog", () => ({
  AddLaborDialog: () => null,
}));

function catalogService(overrides: Partial<Service> = {}): Service {
  return {
    id: 5n,
    active: true,
    code: "SRV-001",
    name: "Cambio de aceite",
    createdAt: 1_700_000_000_000_000_000n,
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 30n,
    ...overrides,
  };
}

function servicePage(items: Service[]): ServicePage {
  return { total: BigInt(items.length), offset: 0n, limit: 200n, items };
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
      labor: [{ id: 1n, description: "Cambio de aceite", price: 45000n }],
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
      partsSubtotal: 0n,
      laborSubtotal: 45000n,
      subtotal: 45000n,
      taxRate: 0n,
      tax: 0n,
      total: 45000n,
      paidAmount: 0n,
      balance: 45000n,
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

describe("OrderDetailPage warranty catalog resolution (characterization)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    useServicesMock.mockReset();
    serviceTermsQueryMock.mockReset();
    warrantyTermsQueryMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDailyHopeMessageMock.mockReset();

    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    getCompanyProfileMock.mockResolvedValue(null);
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: HopeMode.auto,
      text: "",
      citation: "",
      referenceDate: "26/09/2026",
    });
    serviceTermsQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    warrantyTermsQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useServicesMock.mockReturnValue({
      data: servicePage([]),
      isLoading: false,
      isError: false,
    });
  });

  it("loads the whole catalog so any linked service id can be resolved", async () => {
    useOrderMock.mockReturnValue(loadedOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // The page asks for the full catalog (no search term, inactive included)
    // rather than a filtered page, so a linked id is never missed.
    expect(useServicesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "",
        category: null,
        activeOnly: false,
      }),
    );
  });

  it("keeps the warranty action hidden for a linked non-warranty service", async () => {
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService({ id: 5n, name: "Cambio de aceite" })]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Cambio de aceite",
              price: 45000n,
              serviceId: 5n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.queryByTestId("order_detail.warranty_button"),
    ).not.toBeInTheDocument();
  });

  it("keeps the warranty action hidden when the linked service id is not in the catalog", async () => {
    // The catalog does not contain the id the labor line points at, so the
    // name cannot be resolved and the warranty must not be guessed.
    useServicesMock.mockReturnValue({
      data: servicePage([catalogService({ id: 5n })]),
      isLoading: false,
      isError: false,
    });
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Servicio desconocido",
              price: 100000n,
              serviceId: 999n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.queryByTestId("order_detail.warranty_button"),
    ).not.toBeInTheDocument();
  });
});
