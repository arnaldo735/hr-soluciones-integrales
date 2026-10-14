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
 * Characterization coverage for the abono upper-bound seam on the workshop order
 * detail, ahead of a change to the abono registration path.
 *
 * The accepted requirements are "register an abono when the amount does not
 * exceed the pending balance" and "reject an abono that exceeds it". The
 * existing cover suite exercises clearly-under and clearly-over amounts; these
 * tests pin the exact boundary the change must preserve:
 *
 * - an abono exactly equal to the pending balance is accepted and forwarded to
 *   the mutation (the comparison is strictly greater-than, not greater-or-equal);
 * - one cent over the pending balance is rejected with the clear message and the
 *   mutation is never called;
 * - the pending balance used for the comparison is `total − anticipo − abonos`,
 *   so a stored abono lowers the ceiling.
 *
 * The page is exercised against typed local hook mocks; the real canister is not
 * exercised here. The backend's own `input.amount > totals.balance` boundary is
 * outside this file's reach.
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

/**
 * An order whose total is $ 928.00 with a $ 500.00 advance, leaving a pending
 * balance of $ 428.00 (42800 cents) before any abono.
 */
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
      advance: {
        method: PaymentMethod.cash,
        amount: 50000n,
        registeredAt: TS,
        registeredBy: PRINCIPAL,
      },
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

function loadedOrder(view: OrderView) {
  return {
    data: view,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("OrderDetailPage abono upper-bound seam (characterization)", () => {
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

  it("accepts an abono exactly equal to the pending balance", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(orderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    // Pending balance is $ 428; an abono of exactly $ 428 must be accepted.
    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "428",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      payment: {
        amount: 42800n,
        method: PaymentMethod.cash,
        note: undefined,
      },
    });
    expect(
      within(dialog).queryByTestId("order_detail.payment_dialog.error_state"),
    ).not.toBeInTheDocument();
  });

  it("rejects an abono one cent above the pending balance", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    // An advance of $ 500.01 leaves a pending balance of $ 427.99 (42799 cents),
    // so the whole-peso amount $ 428 is exactly one cent over the ceiling.
    useOrderMock.mockReturnValue(
      loadedOrder(
        orderView({
          advance: {
            method: PaymentMethod.cash,
            amount: 50001n,
            registeredAt: TS,
            registeredBy: PRINCIPAL,
          },
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    // $ 428.00 is one cent over the $ 427.99 pending balance and must be
    // rejected before reaching the backend.
    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "428",
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

  it("lowers the ceiling by the abonos already registered", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(orderView()));
    // A stored abono of $ 300 leaves a pending balance of $ 128.
    useOrderPaymentsMock.mockReturnValue({
      data: [
        {
          id: 1n,
          amount: 30000n,
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

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    // $ 200 exceeds the recalculated pending balance of $ 128.
    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "200",
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
});
