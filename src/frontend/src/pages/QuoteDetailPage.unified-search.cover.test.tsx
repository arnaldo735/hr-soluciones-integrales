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
 * Cover for the accepted unified one-step item search on the new-quote form.
 *
 * The accepted change replaces the old two-step part/service pickers (activate
 * a line, then pick a result) with a single search box that queries the parts
 * and services catalogs at once. Each result is labelled with its type
 * (Repuesto / Servicio), its code/SKU and its catalog price; tapping a result
 * adds it immediately with quantity 1 and its catalog price, then clears the
 * term and returns the focus to the box. A term with no matches shows a clear
 * Spanish message.
 *
 * The actor is mocked with the current call shape (session token first), so
 * these tests fail if the search regresses to the old two-step flow or drops
 * the type/code/price labels.
 */

const listCustomersMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const listPartsMock = vi.fn();
const listServicesMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomers: listCustomersMock,
      listMotorcycles: listMotorcyclesMock,
      listParts: listPartsMock,
      listServices: listServicesMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
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
  useSearch: () => ({}),
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

describe("QuoteDetailPage unified item search (cover)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 1000n,
    });
    listServicesMock.mockResolvedValue({
      items: [service()],
      total: 1n,
      offset: 0n,
      limit: 1000n,
    });
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("shows a prompt before a term is typed and no results list", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    expect(
      screen.getByTestId("quote_detail.item_search.prompt_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("quote_detail.item_search.list"),
    ).not.toBeInTheDocument();
  });

  it("queries both catalogs and labels each result with its type, code and price", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "balata",
    );

    // The single box queries both catalogs with the current call shape.
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

    const list = within(
      await screen.findByTestId("quote_detail.item_search.list"),
    );
    // The part result carries its type label, SKU and catalog price.
    expect(list.getByText("Repuesto")).toBeInTheDocument();
    expect(list.getByText("BAL-001")).toBeInTheDocument();
    expect(list.getByText("Balata de freno")).toBeInTheDocument();
    expect(list.getByText("$ 250")).toBeInTheDocument();
    // The service result carries its own type label, code and rate.
    expect(list.getByText("Servicio")).toBeInTheDocument();
    expect(list.getByText("SRV-001")).toBeInTheDocument();
    expect(list.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(list.getByText("$ 300")).toBeInTheDocument();
  });

  it("adds a part with quantity 1 and its catalog price in one tap", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.item_search.item.1"),
    );

    const line = within(await screen.findByTestId("quote_detail.part_line.1"));
    expect(line.getByTestId("quote_detail.part_selected.1")).toHaveTextContent(
      "Balata de freno",
    );
    expect(line.getByTestId("quote_detail.part_quantity_input.1")).toHaveValue(
      1,
    );
    // 25000 cents = $ 250.00.
    expect(line.getByTestId("quote_detail.part_price_input.1")).toHaveValue(
      250,
    );
  });

  it("adds a service with quantity 1 and its catalog rate in one tap", async () => {
    // Only the service catalog matches, so the first result is the service.
    listPartsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 1000n,
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "aceite",
    );
    // Wait for the service result to render before selecting it, so the click
    // cannot land on a stale part result from a previous term.
    await screen.findByText("Cambio de aceite");
    await userEvent.click(
      screen.getByTestId("quote_detail.item_search.item.1"),
    );

    const line = within(
      await screen.findByTestId("quote_detail.service_line.1"),
    );
    expect(
      line.getByTestId("quote_detail.service_selected.1"),
    ).toHaveTextContent("Cambio de aceite");
    expect(
      line.getByTestId("quote_detail.service_quantity_input.1"),
    ).toHaveValue(1);
    // 30000 cents = $ 300.00.
    expect(line.getByTestId("quote_detail.service_price_input.1")).toHaveValue(
      300,
    );
  });

  it("clears the results and returns the focus to the box after selecting", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    const input = screen.getByTestId("quote_detail.item_search_input");
    await userEvent.type(input, "balata");
    await userEvent.click(
      await screen.findByTestId("quote_detail.item_search.item.1"),
    );

    // The term is cleared, so the list empties and the prompt returns.
    await waitFor(() => expect(input).toHaveValue(""));
    expect(
      screen.queryByTestId("quote_detail.item_search.list"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("quote_detail.item_search.prompt_state"),
    ).toBeInTheDocument();
    // The focus is back on the box so the next item can be typed right away.
    expect(input).toHaveFocus();
  });

  it("shows a clear Spanish message when nothing matches", async () => {
    listPartsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 1000n,
    });
    listServicesMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 1000n,
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "zzz",
    );

    // The message names the debounced term, which settles shortly after typing.
    await waitFor(() =>
      expect(
        screen.getByTestId("quote_detail.item_search.empty_state"),
      ).toHaveTextContent(
        "Sin repuestos ni servicios que coincidan con “zzz”.",
      ),
    );
  });

  it("recalculates the totals live when a line quantity changes", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.item_search.item.1"),
    );

    // 1 × $ 250.00 + 16% IVA = $ 290.00.
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 290",
    );

    const quantity = screen.getByTestId("quote_detail.part_quantity_input.1");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "3");

    // 3 × $ 250.00 = $ 750.00 + 16% IVA = $ 870.00.
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 870",
    );
  });

  it("recalculates the totals live when a line unit price changes", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.item_search.item.1"),
    );

    // 1 × $ 250.00 + 16% IVA = $ 290.00.
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 290",
    );

    const price = screen.getByTestId("quote_detail.part_price_input.1");
    await userEvent.clear(price);
    await userEvent.type(price, "400");

    // The line amount follows the edited price: 1 × $ 400.00 = $ 400.00.
    expect(screen.getByTestId("quote_detail.part_amount.1")).toHaveTextContent(
      "$ 400",
    );
    // 1 × $ 400.00 = $ 400.00 + 16% IVA = $ 464.00.
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 464",
    );
  });

  it("removes a line and updates the totals", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.item_search.item.1"),
    );

    await userEvent.click(
      screen.getByTestId("quote_detail.remove_part_button.1"),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("quote_detail.parts.empty_state"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 0",
    );
  });
});
