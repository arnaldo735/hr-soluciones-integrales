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
 * Cover for the accepted change that lets a positive abono be registered on a
 * workshop order whose total is 0 (no parts and no labor).
 *
 * The accepted behavior:
 * - on a zero-total OT the abono dialog no longer blocks a positive amount: the
 *   amount is forwarded to the mutation and no upper-bound error is shown;
 * - the dialog copy no longer states that the abono cannot exceed the pending
 *   balance when the total is 0;
 * - the upper bound is still enforced when the total is greater than 0.
 *
 * The page is exercised against typed local hook mocks; the real canister is not
 * exercised here. The backend's own acceptance of a zero-total abono is outside
 * this file's reach and is covered by the PocketIC lane when it runs.
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

/** An order with no parts and no labor, so its total is exactly 0. */
function zeroTotalOrderView(
  overrides: Partial<OrderView["order"]> = {},
): OrderView {
  return {
    order: {
      id: 42n,
      orderNumber: "OT-0001",
      status: OrderStatus.received,
      customerId: 1n,
      motorcycleId: 7n,
      intakeMileage: 15000n,
      problem: "Revisión general",
      parts: [],
      labor: [],
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
      partsSubtotal: 0n,
      laborSubtotal: 0n,
      subtotal: 0n,
      taxRate: 16n,
      tax: 0n,
      total: 0n,
      paidAmount: 0n,
      balance: 0n,
    },
  };
}

/** An order with a positive total, for the preserved upper-bound check. */
function positiveTotalOrderView(): OrderView {
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

function loadedOrder(view: OrderView) {
  return {
    data: view,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("OrderDetailPage abono on a zero-total order (cover)", () => {
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

  it("registers a positive abono on a zero-total order without an upper-bound error", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(zeroTotalOrderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "500",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    // The positive amount is accepted and forwarded with the entered value and
    // the default method; no upper-bound rejection is shown.
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      payment: {
        amount: 50000n,
        method: PaymentMethod.cash,
        note: undefined,
      },
    });
    expect(
      within(dialog).queryByTestId("order_detail.payment_dialog.error_state"),
    ).not.toBeInTheDocument();
  });

  it("does not show the upper-bound copy in the abono dialog when the total is 0", async () => {
    useOrderMock.mockReturnValue(loadedOrder(zeroTotalOrderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    // The zero-total dialog must not tell the user the abono is capped by the
    // pending balance. The positive-total copy is the one that names the ceiling.
    expect(
      within(dialog).queryByText(/No puede superar/i),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(/puedes registrar cualquier monto/i),
    ).toBeInTheDocument();
  });

  it("still rejects an abono above a positive order pending balance", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(positiveTotalOrderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    // The pending balance is $ 928; 1000 exceeds it.
    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "1000",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    expect(
      await within(dialog).findByTestId(
        "order_detail.payment_dialog.error_state",
      ),
    ).toHaveTextContent("El abono no puede superar el saldo pendiente");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows a stored abono and the recalculated balance on a zero-total order", async () => {
    // A zero-total order that already carries an abono: the panel must render
    // the stored amount and method, and the pending balance must reflect the
    // abono against the zero total.
    useOrderMock.mockReturnValue(loadedOrder(zeroTotalOrderView()));
    useOrderPaymentsMock.mockReturnValue({
      data: [
        {
          id: 1n,
          amount: 50000n,
          method: PaymentMethod.cash,
          note: undefined,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      ],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    const list = within(panel).getByTestId(
      "order_detail.advance.payments.list",
    );
    expect(
      within(list).getByTestId("order_detail.advance.payments.item.1"),
    ).toHaveTextContent("$ 500");
    // The backend clamps the pending balance to 0 when what is charged already
    // covers the total (`if (charged >= total) { 0 } else { total - charged }`),
    // so a zero-total order with a stored abono shows $ 0, never a negative
    // balance. The frontend mirrors that clamp so the shown/validated balance
    // matches the backend's.
    expect(
      within(panel).getByTestId("order_detail.advance.pending_balance"),
    ).toHaveTextContent("$ 0");
  });
});
