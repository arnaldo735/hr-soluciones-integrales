import { SERVICE_TERMS_DEFAULT_TEXT } from "@/hooks/use-service-terms";
import { WARRANTY_TERMS_DEFAULT_TEXT } from "@/hooks/use-warranty-terms";
import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  Invoice,
  Motorcycle,
  OrderView,
  PartView,
  PosSale,
  PosSalePage,
  QuoteView,
  Service,
  ServicePage,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  HopeMode,
  InvoiceLineKind,
  InvoiceOrigin,
  OrderStatus,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  QuoteStatus,
  TaxResponsibility,
} from "@/lib/types";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { PosHistoryPage } from "@/pages/PosHistoryPage";
import { PosPage } from "@/pages/PosPage";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the "Términos y condiciones del Servicio"
 * footer seam across the printable documents.
 *
 * The accepted change keeps that footer only on the work order (OT) and removes
 * it from quotes, POS receipts, POS history receipts and invoices. These tests
 * protect the behavior that must survive the removal:
 *
 * - the OT document still renders the service-terms footer, both the default
 *   reception text and the admin-saved text;
 * - the warranty document's own "Términos y Condiciones de Garantía" block is a
 *   distinct field and is unaffected by the service-terms footer;
 * - the quote, POS receipt, POS history receipt and invoice documents still
 *   render their header, line items and totals once the footer is gone.
 *
 * They deliberately do NOT assert that the footer is present on the quote, POS
 * or invoice documents, because removing it there is exactly the accepted
 * change. The backend is mocked at the actor seam, so a passing run says nothing
 * about the real canister reads.
 */

const {
  useOrderMock,
  updateStatusMock,
  removePartMock,
  removeLaborMock,
  useServicesMock,
  getQuoteMock,
  getBusinessSettingsMock,
  getCompanyProfileMock,
  listCustomersMock,
  listMotorcyclesMock,
  listPartsMock,
  listPosSalesMock,
  getPosSaleMock,
  createPosSaleMock,
  findPartByCodeMock,
  getInvoiceMock,
  getDailyHopeMessageMock,
  serviceTermsQueryMock,
  warrantyTermsQueryMock,
} = vi.hoisted(() => ({
  useOrderMock: vi.fn(),
  updateStatusMock: vi.fn(),
  removePartMock: vi.fn(),
  removeLaborMock: vi.fn(),
  useServicesMock: vi.fn(),
  getQuoteMock: vi.fn(),
  getBusinessSettingsMock: vi.fn(),
  getCompanyProfileMock: vi.fn(),
  listCustomersMock: vi.fn(),
  listMotorcyclesMock: vi.fn(),
  listPartsMock: vi.fn(),
  listPosSalesMock: vi.fn(),
  getPosSaleMock: vi.fn(),
  createPosSaleMock: vi.fn(),
  findPartByCodeMock: vi.fn(),
  getInvoiceMock: vi.fn(),
  getDailyHopeMessageMock: vi.fn(),
  serviceTermsQueryMock: vi.fn(),
  warrantyTermsQueryMock: vi.fn(),
}));

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

vi.mock("@/hooks/use-services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-services")>();
  return {
    ...actual,
    useServices: (params: unknown) => useServicesMock(params),
  };
});

// The service-terms and warranty-terms reads are stubbed at their hook seam so
// each test can hand the page a saved text (or none) without a canister.
vi.mock("@/hooks/use-service-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-service-terms")>();
  return { ...actual, useServiceTermsSettings: () => serviceTermsQueryMock() };
});

vi.mock("@/hooks/use-warranty-terms", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-warranty-terms")>();
  return {
    ...actual,
    useWarrantyTermsSettings: () => warrantyTermsQueryMock(),
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
      listMotorcycles: listMotorcyclesMock,
      listTechnicians: vi.fn().mockResolvedValue([]),
      getCompanyProfile: getCompanyProfileMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
      getQuote: getQuoteMock,
      getBusinessSettings: getBusinessSettingsMock,
      listCustomers: listCustomersMock,
      listParts: listPartsMock,
      listPosSales: listPosSalesMock,
      getPosSale: getPosSaleMock,
      createPosSale: createPosSaleMock,
      findPartByCode: findPartByCodeMock,
      getInvoice: getInvoiceMock,
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
  // The order, quote and invoice pages all read `params.id`; the actor mocks
  // ignore the id and return their fixture, so one value serves every page.
  useParams: () => ({ id: "42" }),
  useSearch: () => ({}),
}));

vi.mock("@/components/order/AddPartDialog", () => ({
  AddPartDialog: () => null,
}));
vi.mock("@/components/order/AddLaborDialog", () => ({
  AddLaborDialog: () => null,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function loadedQuery<T>(data: T) {
  return { data, isLoading: false, isError: false, refetch: vi.fn() };
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

function business(): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
  };
}

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
      parts: [],
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
      partsSubtotal: 0n,
      laborSubtotal: 30000n,
      subtotal: 30000n,
      taxRate: 0n,
      tax: 0n,
      total: 30000n,
      paidAmount: 0n,
      balance: 30000n,
    },
  };
}

function quoteView(): QuoteView {
  return {
    quote: {
      id: 7n,
      status: QuoteStatus.draft,
      serviceLines: [],
      createdAt: 1_700_000_000_000_000_000n,
      quoteNumber: "COT-0007",
      updatedAt: 1_700_000_000_000_000_000n,
      notes: undefined,
      discount: 0n,
      motorcycleId: 2n,
      customerId: 1n,
      partLines: [
        {
          id: 1n,
          description: "Balata de freno",
          quantity: 2n,
          unitPrice: 25000n,
          partId: 1n,
        },
      ],
      taxRate: 16n,
    },
    totals: {
      tax: 8000n,
      total: 58000n,
      taxableBase: 50000n,
      servicesSubtotal: 0n,
      partsSubtotal: 50000n,
      discount: 0n,
      taxRate: 16n,
      subtotal: 50000n,
    },
  };
}

function customer(): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 111 1111",
    email: undefined,
    document: undefined,
    address: undefined,
    createdAt: 1_700_000_000_000_000_000n,
  };
}

function motorcycle(): Motorcycle {
  return {
    id: 7n,
    customerId: 1n,
    plate: "ABC12D",
    brand: "Yamaha",
    model: "FZ25",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
  };
}

function part(): PartView {
  return {
    id: 1n,
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
    totalStock: 12n,
    barcode: "",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
  };
}

function sale(): PosSale {
  return {
    id: 1n,
    saleNumber: "POS-0001",
    lines: [
      {
        partId: 1n,
        description: "Balata de freno",
        quantity: 2n,
        unitPrice: 25000n,
        amount: 50000n,
        discount: 0n,
      },
    ],
    subtotal: 50000n,
    discount: 0n,
    taxRate: 16n,
    tax: 8000n,
    total: 58000n,
    amountReceived: 60000n,
    change: 2000n,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
  };
}

function salePage(items: PosSale[]): PosSalePage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 20n };
}

function invoice(): Invoice {
  return {
    id: 1n,
    number: "FAC-0001",
    orderId: 42n,
    customerId: 1n,
    customerName: "Ada Lovelace",
    customerTaxId: "LOAA1815",
    customerAddress: "Av. Reforma 100",
    lines: [
      {
        kind: InvoiceLineKind.part,
        description: "Balata de freno",
        quantity: 2n,
        unitPrice: 25000n,
        amount: 50000n,
        unitCost: 15000n,
      },
    ],
    subtotal: 50000n,
    taxRate: 16n,
    tax: 8000n,
    total: 58000n,
    discount: 0n,
    origin: InvoiceOrigin.workshopOrder,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    paymentStatus: PaymentStatus.pending,
    issuedAt: 1_700_000_000_000_000_000n,
  };
}

function servicePage(items: Service[]): ServicePage {
  return { total: BigInt(items.length), offset: 0n, limit: 200n, items };
}

function catalogService(overrides: Partial<Service> = {}): Service {
  return {
    id: 9n,
    active: true,
    code: "SRV-006",
    name: "Reparación de motor",
    createdAt: 1_700_000_000_000_000_000n,
    description: "Reparación completa del motor",
    category: "Motor",
    laborRate: 250000n,
    estimatedMinutes: 480n,
    ...overrides,
  };
}

describe("Service-terms footer seam (characterization)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    useServicesMock.mockReset();
    getQuoteMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPartsMock.mockReset();
    listPosSalesMock.mockReset();
    getPosSaleMock.mockReset();
    createPosSaleMock.mockReset();
    findPartByCodeMock.mockReset();
    getInvoiceMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    serviceTermsQueryMock.mockReset();
    warrantyTermsQueryMock.mockReset();

    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getBusinessSettingsMock.mockResolvedValue(business());
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: HopeMode.auto,
      text: "",
      citation: "",
      referenceDate: "26/09/2026",
    });
    // No saved service-terms text: the pages fall back to the default reception
    // text, which is the footer the OT must keep.
    serviceTermsQueryMock.mockReturnValue(loadedQuery(null));
    warrantyTermsQueryMock.mockReturnValue(loadedQuery(null));
    useServicesMock.mockReturnValue(loadedQuery(servicePage([])));
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    listPosSalesMock.mockResolvedValue(salePage([sale()]));
    getPosSaleMock.mockResolvedValue(sale());
    getQuoteMock.mockResolvedValue(quoteView());
    getInvoiceMock.mockResolvedValue(invoice());
  });

  // --- The OT keeps the service-terms footer --------------------------------

  it("keeps the default service-terms footer on the work order document", async () => {
    useOrderMock.mockReturnValue(loadedQuery(orderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));

    const document = await screen.findByTestId("order_detail.document");
    expect(
      within(document).getByText(SERVICE_TERMS_DEFAULT_TEXT),
    ).toBeInTheDocument();
  });

  it("keeps the admin-saved service-terms footer on the work order document", async () => {
    serviceTermsQueryMock.mockReturnValue(
      loadedQuery({
        text: "Pie de página configurado por el administrador.",
        updatedAt: 1_700_000_000_000_000_000n,
      }),
    );
    useOrderMock.mockReturnValue(loadedQuery(orderView()));

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));

    const document = await screen.findByTestId("order_detail.document");
    expect(
      within(document).getByText(
        "Pie de página configurado por el administrador.",
      ),
    ).toBeInTheDocument();
  });

  // --- The warranty terms field is distinct and unchanged -------------------

  it("renders the warranty terms block independently of the service-terms footer", async () => {
    // A saved service-terms footer must not leak into the warranty document,
    // whose own terms field is a different setting.
    serviceTermsQueryMock.mockReturnValue(
      loadedQuery({
        text: "Pie de servicio que NO debe aparecer en la garantía.",
        updatedAt: 1_700_000_000_000_000_000n,
      }),
    );
    warrantyTermsQueryMock.mockReturnValue(
      loadedQuery({
        text: "Términos de garantía configurados por el administrador.",
        updatedAt: 1_700_000_000_000_000_000n,
      }),
    );
    useServicesMock.mockReturnValue(
      loadedQuery(servicePage([catalogService()])),
    );
    useOrderMock.mockReturnValue(
      loadedQuery(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );

    const document = await screen.findByTestId(
      "order_detail.warranty_document",
    );
    const terms = within(document).getByTestId(
      "order_detail.warranty_document.terms_text",
    );
    expect(terms).toHaveTextContent(
      "Términos de garantía configurados por el administrador.",
    );
    expect(terms).not.toHaveTextContent(
      "Pie de servicio que NO debe aparecer en la garantía.",
    );
  });

  it("falls back to the default warranty terms when nothing is saved", async () => {
    useServicesMock.mockReturnValue(
      loadedQuery(servicePage([catalogService()])),
    );
    useOrderMock.mockReturnValue(
      loadedQuery(
        orderView({
          labor: [
            {
              id: 1n,
              description: "Reparación de motor",
              price: 250000n,
              serviceId: 9n,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      await screen.findByTestId("order_detail.warranty_button"),
    );

    const document = await screen.findByTestId(
      "order_detail.warranty_document",
    );
    const terms = within(document).getByTestId(
      "order_detail.warranty_document.terms_text",
    );
    // The default terms are a single block whose exact text is the shared
    // constant; `textContent` preserves the newlines `toHaveTextContent`
    // would collapse.
    expect(terms.textContent).toBe(WARRANTY_TERMS_DEFAULT_TEXT);
  });

  // --- The other documents keep their header, lines and totals --------------

  it("keeps the quote document header, lines and totals", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    const document = screen.getByTestId("quote_detail.document");
    expect(within(document).getByText("Cotización")).toBeInTheDocument();
    expect(within(document).getByText("COT-0007")).toBeInTheDocument();
    expect(within(document).getByText("Balata de freno")).toBeInTheDocument();
    expect(within(document).getByText("Total")).toBeInTheDocument();
  });

  it("keeps the POS receipt header, lines and totals", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    expect(await screen.findByTestId("pos.success_state")).toBeInTheDocument();
    const receipt = screen.getByTestId("pos.receipt_a4");
    expect(within(receipt).getByText("Comprobante")).toBeInTheDocument();
    expect(within(receipt).getByText("POS-0001")).toBeInTheDocument();
    expect(within(receipt).getByText("Balata de freno")).toBeInTheDocument();
    expect(within(receipt).getByText("Total")).toBeInTheDocument();
  });

  it("keeps the POS history receipt header, lines and totals", async () => {
    renderWithProviders(<PosHistoryPage />);

    await screen.findByText("POS-0001");
    await userEvent.click(screen.getByTestId("pos_history.edit_button.1"));

    await screen.findByTestId("pos_history.receipt_dialog");
    const receipt = screen.getByTestId("pos_history.receipt_a4");
    expect(within(receipt).getByText("Comprobante")).toBeInTheDocument();
    expect(within(receipt).getByText("POS-0001")).toBeInTheDocument();
    expect(within(receipt).getByText("Balata de freno")).toBeInTheDocument();
    expect(within(receipt).getByText("Total")).toBeInTheDocument();
  });

  it("keeps the invoice document header, lines and totals", async () => {
    renderWithProviders(<InvoiceDetailPage />);

    const document = await screen.findByTestId("invoice_detail.document");
    expect(within(document).getByText("Factura")).toBeInTheDocument();
    expect(within(document).getByText("FAC-0001")).toBeInTheDocument();
    expect(within(document).getByText("Ada Lovelace")).toBeInTheDocument();
    expect(within(document).getByText("Balata de freno")).toBeInTheDocument();
    expect(within(document).getByText("Total")).toBeInTheDocument();
  });
});
