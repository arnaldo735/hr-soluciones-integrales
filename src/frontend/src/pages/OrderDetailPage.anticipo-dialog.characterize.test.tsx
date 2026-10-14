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
 * Characterization coverage for the workshop-order detail behavior that the
 * "register an anticipo" change must keep working.
 *
 * The accepted change touches how an advance is registered from the order
 * detail. These tests deliberately do NOT assert the backend's acceptance or
 * rejection of an advance (for example the open-shift requirement), because
 * that is exactly what is changing. They protect the surrounding dialog
 * contract the change builds on and must not break:
 *
 * - opening the dialog on an order that already has an advance pre-fills the
 *   amount (converted from integer cents to whole pesos) and the stored method,
 *   and titles the dialog "Editar anticipo";
 * - opening the dialog on an order with no advance starts empty, defaults to
 *   Efectivo and titles the dialog "Registrar anticipo";
 * - cancelling the dialog closes it without calling the mutation;
 * - the dialog shows the order total as the ceiling in its description.
 *
 * The page is exercised against typed local hook mocks; the real canister is
 * not exercised here.
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

describe("OrderDetailPage anticipo dialog seam (characterization)", () => {
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

  it("pre-fills the amount and method when editing an existing advance", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.transfer,
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
      screen.getByTestId("order_detail.advance.edit_button"),
    );
    const dialog = await screen.findByTestId("order_detail.advance_dialog");

    // The stored amount is shown in whole pesos, not integer cents.
    expect(
      within(dialog).getByTestId("order_detail.advance_dialog.amount_input"),
    ).toHaveValue(500);
    // The stored method is selected.
    expect(
      within(dialog).getByTestId("order_detail.advance_dialog.method_select"),
    ).toHaveTextContent("Transferencia");
    // The dialog is titled as an edit.
    expect(within(dialog).getByText("Editar anticipo")).toBeInTheDocument();
  });

  it("starts empty and defaults to Efectivo when there is no advance", async () => {
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

    expect(
      within(dialog).getByTestId("order_detail.advance_dialog.amount_input"),
    ).toHaveValue(null);
    expect(
      within(dialog).getByTestId("order_detail.advance_dialog.method_select"),
    ).toHaveTextContent("Efectivo");
    expect(within(dialog).getByText("Registrar anticipo")).toBeInTheDocument();
  });

  it("shows the order total as the ceiling in the dialog description", async () => {
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

    // The order total is $ 928.
    expect(dialog).toHaveTextContent("$ 928");
  });

  it("closes the dialog on cancel without calling the mutation", async () => {
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
      within(dialog).getByTestId("order_detail.advance_dialog.cancel_button"),
    );

    await waitFor(() =>
      expect(
        screen.queryByTestId("order_detail.advance_dialog"),
      ).not.toBeInTheDocument(),
    );
    expect(mutate).not.toHaveBeenCalled();
  });
});
