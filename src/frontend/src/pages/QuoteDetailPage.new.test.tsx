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
 * Coverage for the new-quote form's pickers, which now use live search boxes
 * that only query once a term is typed.
 *
 * These tests pin the accepted search behavior (the customer, part and service
 * pickers list the options the backend returns for the typed term and let one
 * be selected) and protect the surrounding working behavior: selecting a part
 * autocompletes the line's description and unit price from the catalog,
 * selecting a service autocompletes its description and rate, and choosing a
 * customer drives the motorcycle list.
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

function motorcycle(): Motorcycle {
  return {
    id: 2n,
    customerId: 1n,
    plate: "ABC12D",
    brand: "Yamaha",
    model: "FZ25",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
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

describe("QuoteDetailPage new-quote pickers", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createQuoteMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
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

  it("lists the customers the backend returns for the typed term", async () => {
    renderWithProviders(<QuoteDetailPage />);

    await screen.findByText("Nueva cotización");

    // Nothing is listed before a term is typed.
    expect(
      screen.queryByTestId("quote_detail.customer_search.list"),
    ).toBeNull();

    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "Ada",
    );

    const list = within(
      await screen.findByTestId("quote_detail.customer_search.list"),
    );
    expect(list.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(list.getByText("+57 300 111 1111")).toBeInTheDocument();
  });

  it("drives the motorcycle list from the selected customer", async () => {
    renderWithProviders(<QuoteDetailPage />);

    await screen.findByText("Nueva cotización");
    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "Ada",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.customer_search.item.1"),
    );

    await waitFor(() => expect(listMotorcyclesMock).toHaveBeenCalledWith(1n));
    // The form no longer asks for a motorcycle: the customer's first bike is
    // shown as a read-only summary.
    expect(
      await screen.findByTestId("quote_detail.motorcycle_summary"),
    ).toHaveTextContent("Yamaha FZ25 · ABC12D");
  });

  it("autocompletes a part line's price from the catalog", async () => {
    renderWithProviders(<QuoteDetailPage />);

    await screen.findByText("Nueva cotización");
    await userEvent.click(screen.getByTestId("quote_detail.add_part_button"));

    // The line must be activated before a search result can fill it.
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

    const line = within(screen.getByTestId("quote_detail.part_line.1"));
    // The chosen catalog part is reflected in the selected block and its sale
    // price (25000 cents = $ 250.00) fills the line's unit price.
    expect(line.getByTestId("quote_detail.part_selected.1")).toHaveTextContent(
      "Balata de freno",
    );
    expect(line.getByTestId("quote_detail.part_price_input.1")).toHaveValue(
      250,
    );
  });

  it("autocompletes a service line's rate from the catalog", async () => {
    renderWithProviders(<QuoteDetailPage />);

    await screen.findByText("Nueva cotización");
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

    const line = within(screen.getByTestId("quote_detail.service_line.1"));
    // The chosen catalog service is reflected in the selected block and its
    // labor rate (30000 cents = $ 300.00) fills the line's rate.
    expect(
      line.getByTestId("quote_detail.service_selected.1"),
    ).toHaveTextContent("Cambio de aceite");
    expect(line.getByTestId("quote_detail.service_price_input.1")).toHaveValue(
      300,
    );
  });

  it("saves a quote with the selected customer, part and service", async () => {
    createQuoteMock.mockResolvedValue({
      quote: {
        id: 99n,
        status: QuoteStatus.draft,
        serviceLines: [],
        createdAt: 1_700_000_000_000_000_000n,
        quoteNumber: "COT-0099",
        updatedAt: 1_700_000_000_000_000_000n,
        notes: undefined,
        discount: 0n,
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

    // Select the customer.
    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "Ada",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.customer_search.item.1"),
    );

    // Add a part line from the catalog.
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

    // Add a service line from the catalog.
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

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    const input = createQuoteMock.mock.calls[0][0];
    expect(input.customerId).toBe(1n);
    expect(input.partLines).toEqual([
      { partId: 10n, quantity: 1n, unitPrice: 25000n },
    ]);
    expect(input.serviceLines).toEqual([
      {
        serviceId: 20n,
        description: "Cambio de aceite",
        quantity: 1n,
        unitPrice: 30000n,
      },
    ]);
    // The form no longer carries a motorcycle field; the customer's first bike
    // is attached automatically.
    expect(input.motorcycleId).toBe(2n);
  });
});
