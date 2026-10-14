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
  PartSort,
  ServiceSort,
  TaxResponsibility,
} from "@/lib/types";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the new-quote line editing that surrounds the
 * accepted change.
 *
 * The accepted change lets the user choose a quantity before appending a
 * searched item and makes the appended line appear first in the document. Both
 * of those are intentionally changing, so this file never asserts the current
 * "quantity 1 appended last" behavior.
 *
 * It protects the adjacent working contract that must survive the change:
 *   - a searched part/service is still listed and selectable in one step;
 *   - the line amount is quantity × unit price and updates when the quantity or
 *     the unit price is edited after the line exists;
 *   - a line can be removed;
 *   - the payload sent to the backend keeps its stable shape (partId, quantity,
 *     unitPrice in cents), and a non-positive quantity still blocks the save.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend quote.
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
  // The page reads the "add item" query params on mount; with no params it
  // renders the new-quote draft and appends nothing.
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

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
    barcode: "",
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

/** Types a term into the unified search and clicks the first result. */
async function searchAndSelect(term: string) {
  await userEvent.type(
    screen.getByTestId("quote_detail.item_search_input"),
    term,
  );
  await userEvent.click(
    await screen.findByTestId("quote_detail.item_search.item.1"),
  );
}

/** Selects the seeded customer through the type-to-narrow picker. */
async function selectCustomer() {
  await userEvent.type(
    screen.getByTestId("quote_detail.customer_search_input"),
    "Ada",
  );
  await userEvent.click(
    await screen.findByTestId("quote_detail.customer_search.item.1"),
  );
}

describe("QuoteDetailPage add-line editing (characterization)", () => {
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
      limit: 1000n,
    });
    listServicesMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 1000n,
    });
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    createQuoteMock.mockResolvedValue({
      quote: {
        id: 99n,
        quoteNumber: "COT-0099",
        customerId: 1n,
        motorcycleId: 2n,
        status: "draft",
        notes: undefined,
        discount: 0n,
        taxRate: 16n,
        partLines: [],
        serviceLines: [],
        createdAt: 1_700_000_000_000_000_000n,
        updatedAt: 1_700_000_000_000_000_000n,
      },
      totals: {
        partsSubtotal: 0n,
        servicesSubtotal: 0n,
        subtotal: 0n,
        discount: 0n,
        taxableBase: 0n,
        taxRate: 16n,
        tax: 0n,
        total: 0n,
      },
    });
  });

  it("lists and selects a searched part in one step", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await searchAndSelect("balata");

    expect(
      screen.getByTestId("quote_detail.part_selected.1"),
    ).toHaveTextContent("Balata de freno");
  });

  it("computes the line amount as quantity × unit price and updates it on edit", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await searchAndSelect("balata");

    // The catalog price is 25000 cents = $ 250.00. Whatever the initial
    // quantity is, editing it to 3 must make the amount 3 × $ 250 = $ 750.
    const quantity = screen.getByTestId("quote_detail.part_quantity_input.1");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "3");

    expect(screen.getByTestId("quote_detail.part_amount.1")).toHaveTextContent(
      "$ 750",
    );

    // Editing the unit price recomputes the amount too: 3 × $ 100 = $ 300.
    const price = screen.getByTestId("quote_detail.part_price_input.1");
    await userEvent.clear(price);
    await userEvent.type(price, "100");

    expect(screen.getByTestId("quote_detail.part_amount.1")).toHaveTextContent(
      "$ 300",
    );
  });

  it("removes a part line from the quote", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await searchAndSelect("balata");
    expect(screen.getByTestId("quote_detail.part_line.1")).toBeInTheDocument();

    await userEvent.click(
      screen.getByTestId("quote_detail.remove_part_button.1"),
    );

    expect(
      screen.queryByTestId("quote_detail.part_line.1"),
    ).not.toBeInTheDocument();
  });

  it("sends the part, quantity and unit price in cents to the backend", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomer();
    await searchAndSelect("balata");

    const quantity = screen.getByTestId("quote_detail.part_quantity_input.1");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "4");

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    // The session token is the leading argument; the input is the second.
    const [token, input] = createQuoteMock.mock.calls[0];
    expect(token).toBeNull();
    expect(input.customerId).toBe(1n);
    expect(input.partLines).toEqual([
      { partId: 10n, quantity: 4n, unitPrice: 25000n },
    ]);
  });

  it("blocks the save with a Spanish error when a line quantity is zero", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomer();
    await searchAndSelect("balata");

    const quantity = screen.getByTestId("quote_detail.part_quantity_input.1");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "0");

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    expect(
      await screen.findByText(
        "Cada repuesto necesita una cantidad mayor a cero.",
      ),
    ).toBeInTheDocument();
    expect(createQuoteMock).not.toHaveBeenCalled();
  });

  it("still lists and selects a searched service in one step", async () => {
    listPartsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 1000n,
    });
    listServicesMock.mockResolvedValue({
      items: [service()],
      total: 1n,
      offset: 0n,
      limit: 1000n,
    });

    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "aceite",
    );
    await screen.findByText("Cambio de aceite");
    await userEvent.click(
      screen.getByTestId("quote_detail.item_search.item.1"),
    );

    expect(
      screen.getByTestId("quote_detail.service_selected.1"),
    ).toHaveTextContent("Cambio de aceite");
  });

  it("forwards the typed term to both catalogs with the whole-catalog page", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "balata",
    );

    await waitFor(() =>
      expect(listPartsMock).toHaveBeenLastCalledWith(
        null,
        { search: "balata" },
        PartSort.name,
        0n,
        1000n,
      ),
    );
    await waitFor(() =>
      expect(listServicesMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ search: "balata", activeOnly: true }),
        ServiceSort.name,
        0n,
        1000n,
      ),
    );
  });

  it("renders the selected part's catalog price on the line", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await searchAndSelect("balata");

    // 25000 cents = $ 250.00, shown as the editable unit price.
    expect(screen.getByTestId("quote_detail.part_price_input.1")).toHaveValue(
      250,
    );
    const line = within(screen.getByTestId("quote_detail.part_line.1"));
    expect(line.getByText("Balata de freno")).toBeInTheDocument();
  });
});
