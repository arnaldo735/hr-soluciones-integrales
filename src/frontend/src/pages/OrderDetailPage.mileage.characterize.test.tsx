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
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for an existing order's odometer display, ahead of
 * the accepted change that adds "Kilometraje anterior", "Kilómetros
 * recorridos" and "Próximo cambio de aceite" to the detail page.
 *
 * These tests protect the working behavior the change must not disturb: an
 * order created before the change still opens, still shows its recorded
 * "Kilometraje de ingreso", and keeps its parts, labor, totals and status
 * intact. They never assert the new fields, which do not exist yet.
 *
 * The backend actor and the order query are mocked; the real canister is not
 * exercised here.
 */

const useOrderMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
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

describe("OrderDetailPage existing order (characterization)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
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

  it("shows the recorded intake mileage of an existing order", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(screen.getByText("Kilometraje de ingreso")).toBeInTheDocument();
    // es-CO groups thousands with a dot.
    expect(screen.getByText("15.000 km")).toBeInTheDocument();
  });

  it("keeps the parts, labor, totals and status of an existing order", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(screen.getByText("Balata de freno")).toBeInTheDocument();
    expect(screen.getByText("Ajuste de frenos")).toBeInTheDocument();

    const totals = within(screen.getByTestId("order_detail.totals.panel"));
    expect(totals.getByText("$ 500")).toBeInTheDocument();
    expect(totals.getByText("$ 300")).toBeInTheDocument();
    expect(totals.getByText("$ 800")).toBeInTheDocument();
    expect(await totals.findByText("$ 128")).toBeInTheDocument();
    expect(screen.getByTestId("order_detail.totals.total")).toHaveTextContent(
      "$ 928",
    );

    // The order is still in its recorded status and can advance.
    expect(
      screen.getByTestId("order_detail.advance_status_button"),
    ).toBeEnabled();
  });

  it("renders the intake mileage in the printable document metadata", async () => {
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
    expect(within(document).getByText("Kilometraje")).toBeInTheDocument();
    expect(within(document).getByText("15.000 km")).toBeInTheDocument();
  });
});
