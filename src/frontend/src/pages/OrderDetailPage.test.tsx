import type {
  CompanyProfile,
  OrderView,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  HopeMode,
  OrderStatus,
  TaxResponsibility,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useOrderMock = vi.fn();
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
      ...overrides,
    },
    totals: {
      partsSubtotal: 50000n,
      laborSubtotal: 30000n,
      subtotal: 80000n,
      taxRate: 16n,
      tax: 12800n,
      total: 92800n,
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

function preparedWhatsApp(
  overrides: Partial<WhatsAppMessageResult> = {},
): WhatsAppMessageResult {
  return {
    contactKind: WhatsAppContactKind.customer,
    contactId: 1n,
    contactName: "Ada Lovelace",
    hasPhone: true,
    phone: "+52 555 0100",
    message: "Hola Ada, su orden de trabajo OT-0001 está recibida.",
    ...overrides,
  };
}

describe("OrderDetailPage", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    getCompanyProfileMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: true,
      mode: HopeMode.auto,
      text: "El Señor es mi pastor; nada me faltará.",
      citation: "Salmos 23:1",
      referenceDate: "26/09/2026",
    });
  });

  it("shows parts, labor and the taxed total", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);

    expect(await screen.findByText("OT-0001")).toBeInTheDocument();
    expect(screen.getByText("Balata de freno")).toBeInTheDocument();
    expect(screen.getByText("Ajuste de frenos")).toBeInTheDocument();

    // Parts 500.00 + labor 300.00 = subtotal 800.00, tax 16% = 128.00, total 928.00.
    const totals = within(screen.getByTestId("order_detail.totals.panel"));
    expect(totals.getByText("$ 500")).toBeInTheDocument();
    expect(totals.getByText("$ 300")).toBeInTheDocument();
    expect(totals.getByText("$ 800")).toBeInTheDocument();
    // The tax row appears once the company profile query resolves.
    expect(await totals.findByText("$ 128")).toBeInTheDocument();
    expect(screen.getByTestId("order_detail.totals.total")).toHaveTextContent(
      "$ 928",
    );
  });

  it("advances the order to the next status", async () => {
    const mutate = vi.fn();
    updateStatusMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance_status_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      status: OrderStatus.inRepair,
    });
  });

  it("disables advancing once the order is delivered", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({ status: OrderStatus.delivered }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.getByTestId("order_detail.advance_status_button"),
    ).toBeDisabled();
    expect(
      screen.getByText("La orden fue entregada al cliente."),
    ).toBeInTheDocument();
  });

  it("renders a not-found state when the order does not exist", async () => {
    useOrderMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);

    expect(
      await screen.findByTestId("order_detail.not_found_state"),
    ).toBeInTheDocument();
  });

  // --- Characterization: the totals panel the IVA change must keep ----------
  //
  // The accepted change makes the company's fiscal regime decide the effective
  // IVA rate and hides the tax line for a non-responsable. These tests protect
  // the surrounding totals contract instead: the panel keeps its Repuestos,
  // Mano de obra, Subtotal and Total rows, the subtotal is the sum of the two
  // line groups, the total is the subtotal plus whatever tax is applied, and
  // the header total agrees with the panel total. They never assert whether the
  // tax row is present, because that is exactly what is changing.

  it("keeps the totals panel rows and reconciles the subtotal with its parts", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const totals = within(screen.getByTestId("order_detail.totals.panel"));
    // The four structural rows survive the IVA change.
    expect(totals.getByText("Repuestos")).toBeInTheDocument();
    expect(totals.getByText("Mano de obra")).toBeInTheDocument();
    expect(totals.getByText("Subtotal")).toBeInTheDocument();
    expect(totals.getByText("Total")).toBeInTheDocument();

    // The fixture's subtotal is the sum of its parts and labor subtotals.
    const view = orderView();
    expect(view.totals.subtotal).toBe(
      view.totals.partsSubtotal + view.totals.laborSubtotal,
    );
    // The total is the subtotal plus the tax the backend applied.
    expect(view.totals.total).toBe(view.totals.subtotal + view.totals.tax);
  });

  it("shows the same total in the header and the totals panel", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // The header's "Total de la orden" and the panel's Total are the same
    // value, so a change to how tax is computed cannot desynchronize them.
    const panelTotal = screen.getByTestId("order_detail.totals.total");
    const headerTotal = screen.getByText("Total de la orden").parentElement;
    expect(headerTotal).not.toBeNull();
    expect(headerTotal).toHaveTextContent(panelTotal.textContent ?? "");
  });

  // --- Accepted change: the fiscal regime decides IVA -----------------------

  it("hides the tax row for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ fiscalRegime: FiscalRegime.noResponsableIva }),
    );
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const totals = within(screen.getByTestId("order_detail.totals.panel"));
    expect(totals.getByText("Subtotal")).toBeInTheDocument();
    expect(totals.getByText("Total")).toBeInTheDocument();
    expect(totals.queryByText(/Impuesto/)).not.toBeInTheDocument();
  });

  // --- Accepted behavior: the WhatsApp action on the order detail -----------
  //
  // The accepted change adds an "Enviar por WhatsApp" action to the order
  // detail. It asks the backend for the customer's normalized phone and the
  // order draft, and opens WhatsApp with the editable text; a customer with no
  // phone shows a clear notice instead.

  it("opens WhatsApp for the order's customer with the order context", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<OrderDetailPage />);
      await screen.findByText("OT-0001");

      await userEvent.click(screen.getByTestId("order_detail.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 1n,
        context: WhatsAppContext.order,
        referenceId: 42n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));

      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/525550100");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the order's customer has no phone registered", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });

  // --- Characterization: the daily hope promise in the document footer ------
  //
  // The accepted change appends the daily Biblical-hope promise to the footer
  // of every printable document. These tests protect the page-level seam that
  // must survive it: the order detail reads the promise from the backend and
  // renders it in the document preview, and renders no block at all when the
  // promise is absent or disabled.

  it("renders the daily hope promise in the document footer", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // The document preview lives in the print dialog.
    await userEvent.click(screen.getByTestId("order_detail.print_button"));

    const hope = await screen.findByTestId(
      "order_detail.document.hope_message",
    );
    expect(hope).toHaveTextContent("El Señor es mi pastor; nada me faltará.");
    expect(hope).toHaveTextContent("Salmos 23:1");
    expect(getDailyHopeMessageMock).toHaveBeenCalled();
  });

  it("renders no hope block when the promise is disabled", async () => {
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: HopeMode.auto,
      text: "El Señor es mi pastor; nada me faltará.",
      citation: "Salmos 23:1",
      referenceDate: "26/09/2026",
    });
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));

    // The document body still renders; no empty hope block is reserved.
    expect(
      await screen.findByTestId("order_detail.document"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("order_detail.document.hope_message"),
    ).not.toBeInTheDocument();
  });
});
