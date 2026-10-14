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
 * "register an advance on a zero-total order" change must keep working.
 *
 * The accepted change removes the upper bound on an advance when the order total
 * is 0, so an advance with a positive amount is accepted on an order with no
 * parts and no labor. These tests deliberately do NOT assert the current
 * zero-total rejection (the `El anticipo no puede superar el total de la orden`
 * message when the total is 0), because that is exactly what is changing. They
 * protect the surrounding contract the change builds on and must not break:
 *
 * - a zero-total order still renders the Anticipo panel with its empty state and
 *   the "Registrar" action, so the change cannot blank the panel;
 * - the advance dialog still opens on a zero-total order with its amount input
 *   and method select, so the change cannot make the dialog unreachable;
 * - the upper bound is still enforced when the order total is greater than 0:
 *   an amount above the total is rejected with the existing message and the
 *   mutation is not called;
 * - a valid amount within a positive total is still accepted and forwarded to
 *   the mutation with the entered amount and method.
 *
 * The page is exercised against typed local hook mocks; the real canister is not
 * exercised here. The backend's own acceptance of a zero-total advance is
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

/** An order with a positive total, for the preserved upper-bound checks. */
function positiveTotalOrderView(
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

function loadedOrder(view: OrderView) {
  return {
    data: view,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("OrderDetailPage anticipo on a zero-total order (characterization)", () => {
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

  it("renders the Anticipo panel with its empty state on a zero-total order", async () => {
    useOrderMock.mockReturnValue(loadedOrder(zeroTotalOrderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // The panel is not blanked by the zero total: the empty state and the
    // register action are both present.
    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.empty_state"),
    ).toHaveTextContent("Sin anticipo registrado.");
    expect(
      within(panel).getByTestId("order_detail.advance.edit_button"),
    ).toHaveTextContent("Registrar");
    // The pending balance is the zero total.
    expect(
      within(panel).getByTestId("order_detail.advance.pending_balance"),
    ).toHaveTextContent("$ 0");
  });

  it("opens the advance dialog on a zero-total order with its inputs", async () => {
    useOrderMock.mockReturnValue(loadedOrder(zeroTotalOrderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.edit_button"),
    );
    const dialog = await screen.findByTestId("order_detail.advance_dialog");

    // The dialog is reachable and its controls are usable. The ceiling copy is
    // intentionally not asserted: the change alters it for a zero total.
    expect(within(dialog).getByText("Registrar anticipo")).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("order_detail.advance_dialog.amount_input"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("order_detail.advance_dialog.method_select"),
    ).toHaveTextContent("Efectivo");
  });

  it("still rejects an advance above a positive order total", async () => {
    const mutate = vi.fn();
    setOrderAdvanceMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(positiveTotalOrderView()));

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

  it("still accepts an advance within a positive order total", async () => {
    const mutate = vi.fn();
    setOrderAdvanceMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(positiveTotalOrderView()));

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

  it("shows a stored advance and its balance on a zero-total order", async () => {
    // A zero-total order that already carries an advance: the panel must render
    // the stored amount and method, and the balance must not go negative.
    useOrderMock.mockReturnValue(
      loadedOrder(
        zeroTotalOrderView({
          advance: {
            method: PaymentMethod.cash,
            amount: 50000n,
            registeredAt: TS,
            registeredBy: PRINCIPAL,
          },
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.amount"),
    ).toHaveTextContent("$ 500");
    expect(
      within(panel).getByTestId("order_detail.advance.method"),
    ).toHaveTextContent("Efectivo");
    // total 0 − anticipo 500 = −500, shown as the pending balance.
    expect(
      within(panel).getByTestId("order_detail.advance.pending_balance"),
    ).toHaveTextContent("-$ 500");
  });
});
