import type { CompanyProfile, OrderView } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  HopeMode,
  OrderStatus,
  PaymentMethod,
  TaxResponsibility,
} from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted "anticipo" change on the workshop-order detail.
 *
 * The accepted behavior: an OT can carry a single advance payment (anticipo)
 * with an amount and a method (efectivo or transferencia); the detail shows the
 * amount and method, lets the user register/edit/delete it while the OT is not
 * invoiced, rejects an amount above the order total with a clear message, and
 * shows an empty state when there is no advance.
 *
 * The page is exercised against typed local hook mocks; the real canister is
 * not exercised here. The backend's own rules (movement creation in Caja/Bancos,
 * the invoice discount) are outside this file's reach.
 */

const useOrderMock = vi.fn();
const setOrderAdvanceMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useOrder: () => useOrderMock(),
    useSetOrderAdvance: () => setOrderAdvanceMock(),
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
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
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

const TS = 1_700_000_000_000_000_000n;
const PRINCIPAL = Principal.fromText("aaaaa-aa");

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
          at: TS,
          performedBy: undefined as never,
        },
      ],
      createdAt: TS,
      updatedAt: TS,
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
    updatedAt: TS,
    ...overrides,
  };
}

describe("OrderDetailPage anticipo (cover)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    setOrderAdvanceMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    getCompanyProfileMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getDailyHopeMessageMock.mockReset();

    setOrderAdvanceMock.mockReturnValue(idleMutation());
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

  it("shows a cash advance with its amount and method", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.amount"),
    ).toHaveTextContent("$ 500");
    expect(
      within(panel).getByTestId("order_detail.advance.method"),
    ).toHaveTextContent("Efectivo");
    // The pending balance is the order total minus the advance.
    expect(
      within(panel).getByTestId("order_detail.advance.pending_balance"),
    ).toHaveTextContent("$ 428");
  });

  it("shows a transfer advance with its amount and method", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.transfer,
          amount: 30000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.amount"),
    ).toHaveTextContent("$ 300");
    expect(
      within(panel).getByTestId("order_detail.advance.method"),
    ).toHaveTextContent("Transferencia");
  });

  it("shows the empty state when the order has no advance", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.empty_state"),
    ).toHaveTextContent("Sin anticipo registrado.");
    expect(
      within(panel).queryByTestId("order_detail.advance.amount"),
    ).not.toBeInTheDocument();
  });

  it("registers a cash advance with the entered amount and method", async () => {
    const mutate = vi.fn();
    setOrderAdvanceMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.edit_button"),
    );
    const dialog = await screen.findByTestId("order_detail.advance_dialog");

    await userEvent.type(
      within(dialog).getByTestId("order_detail.advance_dialog.amount_input"),
      "500",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.advance_dialog.save_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      amount: 50000n,
      method: PaymentMethod.cash,
    });
  });

  it("registers a transfer advance when the method is switched", async () => {
    const mutate = vi.fn();
    setOrderAdvanceMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.edit_button"),
    );
    const dialog = await screen.findByTestId("order_detail.advance_dialog");

    await userEvent.type(
      within(dialog).getByTestId("order_detail.advance_dialog.amount_input"),
      "300",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.advance_dialog.method_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Transferencia" }),
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.advance_dialog.save_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      amount: 30000n,
      method: PaymentMethod.transfer,
    });
  });

  it("rejects an advance above the order total with a clear message", async () => {
    const mutate = vi.fn();
    setOrderAdvanceMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.edit_button"),
    );
    const dialog = await screen.findByTestId("order_detail.advance_dialog");

    // The order total is $ 928; 1000 exceeds it.
    await userEvent.type(
      within(dialog).getByTestId("order_detail.advance_dialog.amount_input"),
      "1000",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.advance_dialog.save_button"),
    );

    expect(
      await within(dialog).findByTestId(
        "order_detail.advance_dialog.error_state",
      ),
    ).toHaveTextContent("El anticipo no puede superar el total de la orden");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("deletes the advance by clearing amount and method", async () => {
    const mutate = vi.fn();
    setOrderAdvanceMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.delete_button"),
    );
    const dialog = await screen.findByTestId(
      "order_detail.advance_delete_dialog",
    );
    await userEvent.click(
      within(dialog).getByTestId(
        "order_detail.advance_delete_dialog.confirm_button",
      ),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      amount: null,
      method: null,
    });
  });

  it("locks the advance once the order is invoiced", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        status: OrderStatus.delivered,
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).queryByTestId("order_detail.advance.edit_button"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).queryByTestId("order_detail.advance.delete_button"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByTestId("order_detail.advance.locked_state"),
    ).toHaveTextContent("no se puede editar");
  });
});
