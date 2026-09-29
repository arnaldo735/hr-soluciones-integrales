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
 * Characterization coverage for the observable result semantics of the
 * new-quote pickers, which the upcoming search rework must not change.
 *
 * The accepted change alters *how* the pickers search (they debounce and
 * request fewer rows) but not *what* they show: the picker lists exactly the
 * records the backend returns for the typed term, and shows the Spanish
 * no-matches message when the backend returns none. These tests never assert
 * the number of rows requested or the debounce timing.
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

describe("QuoteDetailPage picker result semantics", () => {
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

  it("lists every customer the backend returns for the term", async () => {
    listCustomersMock.mockResolvedValue([
      customer({ id: 1n, name: "Ada Lovelace" }),
      customer({ id: 2n, name: "Ada Byron", phone: "+57 300 222 2222" }),
    ]);
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "Ada",
    );

    const list = within(
      await screen.findByTestId("quote_detail.customer_search.list"),
    );
    expect(list.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(list.getByText("Ada Byron")).toBeInTheDocument();
  });

  it("shows the no-matches message when no customer matches the term", async () => {
    listCustomersMock.mockResolvedValue([]);
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "zzz",
    );

    expect(
      await screen.findByTestId("quote_detail.customer_search.empty_state"),
    ).toHaveTextContent("Sin clientes que coincidan con “zzz”.");
  });

  it("lists every part the backend returns for the term", async () => {
    listPartsMock.mockResolvedValue({
      items: [
        part({ id: 10n, sku: "BAL-001", name: "Balata de freno" }),
        part({ id: 11n, sku: "BAL-002", name: "Balata trasera" }),
      ],
      total: 2n,
      offset: 0n,
      limit: 50n,
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.part_search_input"),
      "balata",
    );

    const list = within(
      await screen.findByTestId("quote_detail.part_search.list"),
    );
    expect(list.getByText("BAL-001")).toBeInTheDocument();
    expect(list.getByText("BAL-002")).toBeInTheDocument();
  });

  it("shows the no-matches message when no part matches the term", async () => {
    listPartsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 50n,
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.part_search_input"),
      "zzz",
    );

    expect(
      await screen.findByTestId("quote_detail.part_search.empty_state"),
    ).toHaveTextContent("Sin repuestos que coincidan con “zzz”.");
  });

  it("shows the no-matches message when no service matches the term", async () => {
    listServicesMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 100n,
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.service_search_input"),
      "zzz",
    );

    expect(
      await screen.findByTestId("quote_detail.service_search.empty_state"),
    ).toHaveTextContent("Sin servicios que coincidan con “zzz”.");
  });

  it("shows the write-a-term prompt before anything is typed", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    // The catalogs are only searched on demand, so the empty state is a prompt
    // rather than a list of every record.
    expect(
      screen.getByTestId("quote_detail.part_search.prompt_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("quote_detail.service_search.prompt_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("quote_detail.customer_search.prompt_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("quote_detail.part_search.list"),
    ).not.toBeInTheDocument();
  });

  it("forwards the part term with the name sort the picker relies on", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.part_search_input"),
      "balata",
    );

    await waitFor(() =>
      expect(listPartsMock).toHaveBeenLastCalledWith(
        null,
        { search: "balata" },
        PartSort.name,
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("forwards the service term with the active-only filter the picker relies on", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.service_search_input"),
      "aceite",
    );

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ search: "aceite", activeOnly: true }),
        ServiceSort.name,
        expect.anything(),
        expect.anything(),
      ),
    );
  });
});
