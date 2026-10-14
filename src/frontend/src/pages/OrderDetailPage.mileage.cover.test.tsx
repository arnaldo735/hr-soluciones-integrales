import type { CompanyProfile, OrderView } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  HopeMode,
  OrderStatus,
  TaxResponsibility,
} from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover coverage for the accepted odometer change on the order detail page:
 * "Kilometraje anterior", "Kilómetros recorridos" and "Próximo cambio de
 * aceite" are shown, the interval can be edited inline and the next oil change
 * is recalculated and persisted, and an order created without a previous
 * mileage shows "no registrado" without breaking the view.
 *
 * The order query and the interval mutation are mocked; the real canister is
 * not exercised here.
 */

const useOrderMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
const updateOilChangeIntervalMutateMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useOrder: () => useOrderMock(),
    useUpdateOrderStatus: () => updateStatusMock(),
    useRemoveOrderPart: () => removePartMock(),
    useRemoveLabor: () => removeLaborMock(),
    useUpdateOilChangeInterval: () => ({
      mutate: updateOilChangeIntervalMutateMock,
      isPending: false,
    }),
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

function orderView(overrides: Partial<OrderView["order"]> = {}): OrderView {
  return {
    order: {
      id: 42n,
      orderNumber: "OT-0001",
      status: OrderStatus.received,
      customerId: 1n,
      motorcycleId: 7n,
      intakeMileage: 24500n,
      previousMileage: 20000n,
      oilChangeInterval: 3000n,
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
      payments: [],
      ...overrides,
    },
    totals: {
      partsSubtotal: 50000n,
      laborSubtotal: 30000n,
      subtotal: 80000n,
      taxRate: 16n,
      tax: 12800n,
      total: 92800n,
      paidAmount: 0n,
      balance: 92800n,
    },
  };
}

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function companyProfile(
  overrides: Partial<CompanyProfile> = {},
): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.responsableIva,
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

describe("OrderDetailPage odometer fields (cover)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    updateOilChangeIntervalMutateMock.mockReset();
    getCompanyProfileMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: HopeMode.auto,
      text: "",
      citation: "",
      referenceDate: "26/09/2026",
    });
  });

  it("shows previous mileage, travelled km and next oil change", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.getByTestId("order_detail.previous_mileage_value"),
    ).toHaveTextContent("20.000 km");
    expect(
      screen.getByTestId("order_detail.travelled_km_value"),
    ).toHaveTextContent("4.500 km");
    expect(
      screen.getByTestId("order_detail.next_oil_change_value"),
    ).toHaveTextContent("27.500 km");
  });

  it("shows 'no registrado' for an order without previous mileage", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({ previousMileage: undefined }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.getByTestId("order_detail.previous_mileage_value"),
    ).toHaveTextContent("no registrado");
    expect(
      screen.getByTestId("order_detail.travelled_km_value"),
    ).toHaveTextContent("no registrado");
    // The rest of the order still renders.
    expect(screen.getByText("Balata de freno")).toBeInTheDocument();
    expect(screen.getByTestId("order_detail.totals.total")).toHaveTextContent(
      "$ 928",
    );
  });

  it("edits the interval and persists the new value", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const input = screen.getByTestId("order_detail.oil_change_interval_input");
    expect(input).toHaveValue(3000);

    await userEvent.clear(input);
    await userEvent.type(input, "5000");
    await userEvent.click(
      screen.getByTestId("order_detail.save_oil_change_interval_button"),
    );

    await waitFor(() =>
      expect(updateOilChangeIntervalMutateMock).toHaveBeenCalledTimes(1),
    );
    expect(updateOilChangeIntervalMutateMock.mock.calls[0][0]).toEqual({
      id: 42n,
      oilChangeInterval: 5000n,
    });
  });

  it("rejects a non-integer interval without persisting", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const input = screen.getByTestId("order_detail.oil_change_interval_input");
    await userEvent.clear(input);
    await userEvent.type(input, "3000.5");
    await userEvent.click(
      screen.getByTestId("order_detail.save_oil_change_interval_button"),
    );

    expect(
      screen.getByTestId("order_detail.oil_change_interval_error"),
    ).toHaveTextContent("El intervalo debe ser un número entero");
    expect(updateOilChangeIntervalMutateMock).not.toHaveBeenCalled();
  });

  it("keeps the printable document metadata for the odometer fields", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));

    const document = await screen.findByTestId("order_detail.document");
    expect(
      within(document).getByText("Kilometraje anterior"),
    ).toBeInTheDocument();
    expect(
      within(document).getByText("Kilómetros recorridos"),
    ).toBeInTheDocument();
    expect(
      within(document).getByText("Próximo cambio de aceite"),
    ).toBeInTheDocument();
    expect(within(document).getByText("4.500 km")).toBeInTheDocument();
    expect(within(document).getByText("27.500 km")).toBeInTheDocument();
  });
});
