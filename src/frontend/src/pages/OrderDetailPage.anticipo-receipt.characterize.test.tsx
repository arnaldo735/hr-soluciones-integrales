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
 * "abonos + recibo de anticipo" change must keep working.
 *
 * The accepted change adds a printable advance receipt, a "Registrar abono"
 * action, an abonos list, and a pending balance of total − anticipo − abonos.
 * These tests protect the surrounding contract the change builds on and must
 * not break:
 *
 * - the OT document (print dialog) still carries the anticipo line and the
 *   pending balance, and still downloads as `Orden-<número>.pdf`;
 * - the Anticipo panel's pending balance agrees with the header total minus the
 *   advance when no abonos exist (the new formula reduces to this);
 * - the advance stays locked for a cancelled or already-invoiced order.
 *
 * They never assert the new receipt, the abono dialog, or the abonos list,
 * because those are exactly what is being added. The page is exercised against
 * typed local hook mocks; the real canister is not exercised here.
 */

const useOrderMock = vi.fn();
const setOrderAdvanceMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const listInvoicesMock = vi.fn();
const downloadFileMock = vi.fn();

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
      listInvoices: listInvoicesMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/lib/download", () => ({
  downloadFile: (...args: unknown[]) => downloadFileMock(...args),
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

describe("OrderDetailPage anticipo/receipt seam (characterization)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    setOrderAdvanceMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    getCompanyProfileMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    listInvoicesMock.mockReset();
    downloadFileMock.mockReset();

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
    listInvoicesMock.mockResolvedValue(invoicePage([]));
    downloadFileMock.mockResolvedValue(undefined);
  });

  it("keeps the anticipo line and pending balance in the OT document", async () => {
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

    await userEvent.click(screen.getByTestId("order_detail.print_button"));
    const document = await screen.findByTestId("order_detail.document");

    // The document totals still show the advance as a deduction and the
    // pending balance (total − anticipo) as the emphasized closing line.
    expect(within(document).getByText("Anticipo")).toBeInTheDocument();
    expect(within(document).getByText("- $ 500")).toBeInTheDocument();
    expect(within(document).getByText("Saldo pendiente")).toBeInTheDocument();
    expect(within(document).getByText("$ 428")).toBeInTheDocument();
  });

  it("keeps the OT document free of anticipo lines when there is no advance", async () => {
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

    expect(within(document).queryByText("Anticipo")).not.toBeInTheDocument();
    expect(
      within(document).queryByText("Saldo pendiente"),
    ).not.toBeInTheDocument();
    // The document still closes on the order total.
    expect(within(document).getByText("Total")).toBeInTheDocument();
  });

  it("keeps the Anticipo panel balance equal to the header total minus the advance", async () => {
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

    // Header total is $ 928; the panel's pending balance is $ 628.
    const headerTotal = screen.getByText("Total de la orden").parentElement;
    expect(headerTotal).toHaveTextContent("$ 928");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.pending_balance"),
    ).toHaveTextContent("$ 628");
  });

  it("keeps the advance locked on a cancelled order", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        status: OrderStatus.cancelled,
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
    ).toHaveTextContent("cancelada");
  });

  it("keeps the advance locked once the order has an invoice", async () => {
    listInvoicesMock.mockResolvedValue(invoicePage([42n]));
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
    await waitFor(() =>
      expect(
        within(panel).getByTestId("order_detail.advance.locked_state"),
      ).toHaveTextContent("facturada"),
    );
    expect(
      within(panel).queryByTestId("order_detail.advance.edit_button"),
    ).not.toBeInTheDocument();
  });

  it("keeps the OT document download filename as Orden-<número>.pdf", async () => {
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
    await userEvent.click(
      within(document).getByTestId("order_detail.document.download_button"),
    );

    await waitFor(() => expect(downloadFileMock).toHaveBeenCalledTimes(1));
    expect(downloadFileMock.mock.calls[0][0]).toMatchObject({
      filename: "Orden-OT-0001.pdf",
      mimeType: "application/pdf",
    });
  });
});
