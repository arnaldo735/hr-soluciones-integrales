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
 * "register an advance on a zero-total order" change must keep working around
 * the removal of parts and labor.
 *
 * The accepted change removes the upper bound on an advance when the order total
 * is 0. It does NOT touch the consistency invariant that removing a part or a
 * labor line may not drop the order total below the advance already registered
 * (backend `ensureAdvanceWithinTotal`, invoked from `removeOrderPart` and
 * `removeLabor`). These tests deliberately do NOT assert the zero-total advance
 * rejection, because that is exactly what is changing. They protect the
 * surrounding removal contract the change builds on and must not break:
 *
 * - the "Quitar" action on a part forwards `{ id, orderPartId }` to the removal
 *   mutation, so the backend can enforce the invariant;
 * - the "Quitar" action on a labor line forwards `{ id, laborId }`;
 * - when the backend rejects a removal because it would leave the total below
 *   the advance, the rejection is surfaced as an error and the page keeps
 *   rendering the order (it is not blanked).
 *
 * The page is exercised against typed local hook mocks; the real canister is not
 * exercised here. The backend's own `ensureAdvanceWithinTotal` trap is outside
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

/** An order with one part and one labor line and a stored advance. */
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
          id: 11n,
          partId: 10n,
          description: "Balata de freno",
          quantity: 2n,
          unitPrice: 25000n,
          unitCost: 12000n,
          lotId: 3n,
        },
      ],
      labor: [{ id: 21n, description: "Ajuste de frenos", price: 30000n }],
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
      balance: 42800n,
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

describe("OrderDetailPage anticipo removal consistency (characterization)", () => {
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

  it("forwards the part removal with the order and line ids", async () => {
    const mutate = vi.fn();
    removePartMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(orderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.parts.remove_button.1"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    // The backend is the authority on the advance invariant; the page must hand
    // it the order id and the exact line id so it can enforce it.
    expect(mutate.mock.calls[0][0]).toEqual({ id: 42n, orderPartId: 11n });
  });

  it("forwards the labor removal with the order and line ids", async () => {
    const mutate = vi.fn();
    removeLaborMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(orderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.labor.remove_button.1"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({ id: 42n, laborId: 21n });
  });

  it("surfaces a removal rejected for dropping the total below the advance", async () => {
    // The backend rejects the removal because the remaining total would fall
    // below the stored advance. The page must show the rejection and keep
    // rendering the order rather than blanking it.
    const mutate = vi.fn(
      (
        _input: unknown,
        options?: { onError?: (error: unknown) => void },
      ): void => {
        options?.onError?.(
          new Error(
            "El anticipo y los abonos no pueden superar el total de la orden",
          ),
        );
      },
    );
    removePartMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue(loadedOrder(orderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.parts.remove_button.1"),
    );

    expect(
      await screen.findByTestId("order_detail.action_error_state"),
    ).toHaveTextContent(
      "El anticipo y los abonos no pueden superar el total de la orden",
    );
    // The order is still rendered: the rejection did not blank the page.
    expect(screen.getByTestId("order_detail.order_number")).toHaveTextContent(
      "OT-0001",
    );
    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.amount"),
    ).toHaveTextContent("$ 500");
  });
});
