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
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted "anticipo button visibility" change on the workshop
 * order detail.
 *
 * The accepted behavior: the "Registrar / Editar anticipo" action is shown when
 * the order is editable (not cancelled, not delivered) and is not invoiced. The
 * invoice check is an auxiliary query over `listInvoices`; it must be fail-open,
 * so while that query is loading or has failed the button stays visible and the
 * backend remains the final authority. The action is hidden, with a clear
 * message, when the order is cancelled, delivered or confirmed invoiced.
 *
 * The page is exercised against typed local hook mocks; the real canister is not
 * exercised here. The backend's own rejection of a second advance on an invoiced
 * order is outside this file's reach.
 */

const useOrderMock = vi.fn();
const setOrderAdvanceMock = vi.fn();
const addOrderPaymentMock = vi.fn();
const useOrderPaymentsMock = vi.fn();
const useOrderAdvanceReceiptMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const listInvoicesMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useOrder: () => useOrderMock(),
    useSetOrderAdvance: () => setOrderAdvanceMock(),
    useAddOrderPayment: () => addOrderPaymentMock(),
    useOrderPayments: () => useOrderPaymentsMock(),
    useOrderAdvanceReceipt: () => useOrderAdvanceReceiptMock(),
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
      listInvoices: listInvoicesMock,
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

function invoicePage(orderIds: bigint[]) {
  return {
    items: orderIds.map((orderId, index) => ({
      id: BigInt(index + 1),
      orderId,
    })),
    total: BigInt(orderIds.length),
    offset: 0n,
    limit: 1000n,
  };
}

function editableOrder(overrides: Partial<OrderView["order"]> = {}) {
  return {
    data: orderView(overrides),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("OrderDetailPage anticipo button visibility (cover)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    setOrderAdvanceMock.mockReset();
    addOrderPaymentMock.mockReset();
    useOrderPaymentsMock.mockReset();
    useOrderAdvanceReceiptMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    getCompanyProfileMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    listInvoicesMock.mockReset();

    setOrderAdvanceMock.mockReturnValue(idleMutation());
    addOrderPaymentMock.mockReturnValue(idleMutation());
    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    useOrderPaymentsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    useOrderAdvanceReceiptMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: HopeMode.auto,
      text: "",
      citation: "",
      referenceDate: "26/09/2026",
    });
    listInvoicesMock.mockResolvedValue(invoicePage([]));
  });

  it("shows the register action on an editable order with no invoice", async () => {
    useOrderMock.mockReturnValue(editableOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.edit_button"),
    ).toHaveTextContent("Registrar");
    expect(
      within(panel).queryByTestId("order_detail.advance.locked_state"),
    ).not.toBeInTheDocument();
  });

  it("shows the edit action on an editable order that already has an advance", async () => {
    useOrderMock.mockReturnValue(
      editableOrder({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.edit_button"),
    ).toHaveTextContent("Editar");
  });

  it("hides the action and explains the lock on a cancelled order", async () => {
    useOrderMock.mockReturnValue(
      editableOrder({ status: OrderStatus.cancelled }),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).queryByTestId("order_detail.advance.edit_button"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByTestId("order_detail.advance.locked_state"),
    ).toHaveTextContent("cancelada");
  });

  it("hides the action and explains the lock on a delivered order", async () => {
    useOrderMock.mockReturnValue(
      editableOrder({ status: OrderStatus.delivered }),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).queryByTestId("order_detail.advance.edit_button"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByTestId("order_detail.advance.locked_state"),
    ).toHaveTextContent("entregada");
  });

  it("hides the action and explains the lock once the order is invoiced", async () => {
    listInvoicesMock.mockResolvedValue(invoicePage([42n]));
    useOrderMock.mockReturnValue(editableOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    await waitFor(() =>
      expect(
        within(panel).getByTestId("order_detail.advance.locked_state"),
      ).toHaveTextContent("facturada"),
    );
    expect(
      within(panel).queryByTestId("order_detail.advance.edit_button"),
    ).not.toBeInTheDocument();
  });

  it("keeps the action visible while the invoice query is still loading (fail-open)", async () => {
    // A never-settling promise keeps the auxiliary invoice query pending.
    listInvoicesMock.mockReturnValue(new Promise(() => {}));
    useOrderMock.mockReturnValue(editableOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.edit_button"),
    ).toBeInTheDocument();
    expect(
      within(panel).queryByTestId("order_detail.advance.locked_state"),
    ).not.toBeInTheDocument();
  });

  it("keeps the action visible when the invoice query fails (fail-open)", async () => {
    listInvoicesMock.mockRejectedValue(new Error("backend no disponible"));
    useOrderMock.mockReturnValue(editableOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    await waitFor(() =>
      expect(
        within(panel).getByTestId("order_detail.advance.edit_button"),
      ).toBeInTheDocument(),
    );
    expect(
      within(panel).queryByTestId("order_detail.advance.locked_state"),
    ).not.toBeInTheDocument();
  });

  it("does not treat another order's invoice as this order's invoice", async () => {
    // The invoice list contains a different order, so this editable order is
    // still not invoiced and the action stays visible.
    listInvoicesMock.mockResolvedValue(invoicePage([99n]));
    useOrderMock.mockReturnValue(editableOrder());

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    await waitFor(() =>
      expect(
        within(panel).getByTestId("order_detail.advance.edit_button"),
      ).toBeInTheDocument(),
    );
    expect(
      within(panel).queryByTestId("order_detail.advance.locked_state"),
    ).not.toBeInTheDocument();
  });
});
