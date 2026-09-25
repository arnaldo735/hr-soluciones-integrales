import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  Motorcycle,
  PartView,
  Service,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  QuoteStatus,
  TaxResponsibility,
} from "@/lib/types";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the new-quote form's behavior that the
 * accepted change does not touch.
 *
 * The accepted change reworks the customer/part/service pickers (click to
 * select, search-only results) and drops the motorcycle field. These tests
 * protect the surrounding working behavior that must survive it: clicking a
 * customer result marks that customer as selected, saving without a customer
 * still blocks with a clear message, and the live totals panel still reflects
 * the part and service lines as they are added.
 *
 * They deliberately do not assert the motorcycle field, the pre-typing catalog
 * list, or the save payload shape, all of which the accepted change alters.
 */

const listCustomersMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const listPartsMock = vi.fn();
const listServicesMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const createQuoteMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomers: listCustomersMock,
      listMotorcycles: listMotorcyclesMock,
      listParts: listPartsMock,
      listServices: listServicesMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      createQuote: createQuoteMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  // No id means the "nueva" (new quote) route.
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 111 1111",
    email: undefined,
    document: undefined,
    address: undefined,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 2n,
    customerId: 1n,
    plate: "ABC12D",
    brand: "Yamaha",
    model: "FZ25",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 10n,
    sku: "BAL-001",
    lowStockThreshold: 2n,
    name: "Balata de freno",
    createdAt: 1_700_000_000_000_000_000n,
    unit: "pza",
    totalStock: 8n,
    category: "Frenos",
    salePrice: 25000n,
    brand: "Genérico",
    costPrice: 12000n,
    lowStock: false,
    ...overrides,
  };
}

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 20n,
    active: true,
    code: "SRV-001",
    name: "Cambio de aceite",
    createdAt: 1_700_000_000_000_000_000n,
    description: "Cambio de aceite y filtro",
    category: "Mantenimiento",
    laborRate: 30000n,
    estimatedMinutes: 45n,
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

function companyProfile(): CompanyProfile {
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
  };
}

describe("QuoteDetailPage new-quote form (characterization)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createQuoteMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([]);
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    listServicesMock.mockResolvedValue({
      items: [service()],
      total: 1n,
      offset: 0n,
      limit: 100n,
    });
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("marks the clicked customer result as selected", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "Ada",
    );
    const item = await screen.findByTestId(
      "quote_detail.customer_search.item.1",
    );
    expect(item).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(item);

    await waitFor(() =>
      expect(
        screen.getByTestId("quote_detail.customer_search.item.1"),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    const selected = screen.getByTestId("quote_detail.customer_selected");
    expect(selected).toHaveTextContent("Cliente seleccionado");
    expect(selected).toHaveTextContent("Ada Lovelace");
  });

  it("blocks the save with a clear message when no customer is selected", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    expect(
      await screen.findByTestId("quote_detail.error_banner"),
    ).toHaveTextContent("Selecciona el cliente de la cotización.");
    expect(createQuoteMock).not.toHaveBeenCalled();
  });

  it("reflects the added part and service lines in the live totals", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    // A part line: 1 × $ 250.00 from the catalog's sale price.
    await userEvent.click(screen.getByTestId("quote_detail.add_part_button"));
    await userEvent.click(
      screen.getByTestId("quote_detail.part_pick_button.1"),
    );
    await userEvent.type(
      screen.getByTestId("quote_detail.part_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.part_search.item.1"),
    );

    // A service line: 1 × $ 300.00 from the catalog's labor rate.
    await userEvent.click(
      screen.getByTestId("quote_detail.add_service_button"),
    );
    await userEvent.click(
      screen.getByTestId("quote_detail.service_pick_button.1"),
    );
    await userEvent.type(
      screen.getByTestId("quote_detail.service_search_input"),
      "aceite",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.service_search.item.1"),
    );

    const totals = within(screen.getByTestId("quote_detail.totals.panel"));
    // Repuestos $ 250.00 + Servicios $ 300.00 = Subtotal $ 550.00.
    expect(totals.getByText("$ 250")).toBeInTheDocument();
    expect(totals.getByText("$ 300")).toBeInTheDocument();
    expect(totals.getByText("$ 550")).toBeInTheDocument();
    // A responsable company adds 16% IVA: $ 550.00 + $ 88.00 = $ 638.00.
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 638",
    );
  });

  it("applies the discount to the taxable base before IVA", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    // A single part line: 1 × $ 250.00.
    await userEvent.click(screen.getByTestId("quote_detail.add_part_button"));
    await userEvent.click(
      screen.getByTestId("quote_detail.part_pick_button.1"),
    );
    await userEvent.type(
      screen.getByTestId("quote_detail.part_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.part_search.item.1"),
    );

    // A $ 50.00 discount leaves a $ 200.00 taxable base.
    const discount = screen.getByTestId("quote_detail.discount_input");
    await userEvent.clear(discount);
    await userEvent.type(discount, "50");

    const totals = within(screen.getByTestId("quote_detail.totals.panel"));
    // Repuestos and Subtotal both read $ 250 for this single-line quote.
    expect(totals.getAllByText("$ 250").length).toBeGreaterThanOrEqual(1);
    // The discount row shows the $ 50.00 discount applied to the base.
    expect(totals.getByText("Descuento").parentElement).toHaveTextContent(
      "$ 50",
    );
    // 16% of $ 200.00 = $ 32.00, so the total is $ 232.00.
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 232",
    );
  });

  it("sends the notes and discount in cents with the saved quote", async () => {
    // The backend still requires a motorcycle, so the customer needs one for
    // the save to be allowed.
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
    createQuoteMock.mockResolvedValue({
      quote: {
        id: 99n,
        status: QuoteStatus.draft,
        serviceLines: [],
        createdAt: 1_700_000_000_000_000_000n,
        quoteNumber: "COT-0099",
        updatedAt: 1_700_000_000_000_000_000n,
        notes: "Vigencia 15 días",
        discount: 5000n,
        motorcycleId: 2n,
        customerId: 1n,
        partLines: [],
        taxRate: 16n,
      },
      totals: {
        tax: 0n,
        total: 0n,
        taxableBase: 0n,
        servicesSubtotal: 0n,
        partsSubtotal: 0n,
        discount: 0n,
        taxRate: 16n,
        subtotal: 0n,
      },
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "Ada",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.customer_search.item.1"),
    );

    await userEvent.click(screen.getByTestId("quote_detail.add_part_button"));
    await userEvent.click(
      screen.getByTestId("quote_detail.part_pick_button.1"),
    );
    await userEvent.type(
      screen.getByTestId("quote_detail.part_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.part_search.item.1"),
    );

    await userEvent.type(
      screen.getByTestId("quote_detail.notes_textarea"),
      "Vigencia 15 días",
    );
    const discount = screen.getByTestId("quote_detail.discount_input");
    await userEvent.clear(discount);
    await userEvent.type(discount, "50");

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    const input = createQuoteMock.mock.calls[0][0];
    expect(input.notes).toBe("Vigencia 15 días");
    // $ 50.00 is sent as 5000 integer cents.
    expect(input.discount).toBe(5000n);
  });
});
