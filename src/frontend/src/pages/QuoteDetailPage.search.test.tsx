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
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the new-quote pickers' search seam.
 *
 * The accepted change makes the pickers stop truncating: the part and service
 * pickers request a page large enough to cover the whole catalog (1000 rows)
 * instead of the old 50/100 caps, and the actor call carries the session token
 * as its leading argument. These tests pin the consumer contract the pickers
 * rely on: the term typed into each search box is debounced and forwarded to
 * the matching backend method with the resolved call shape, and the picker
 * still lists and selects the options the backend returns for that term.
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

describe("QuoteDetailPage new-quote picker search", () => {
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

  it("forwards the typed customer term to the backend", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await waitFor(() => expect(listCustomersMock).toHaveBeenCalled());
    // The session token is the leading argument; with no term the search is
    // absent, so the backend returns the whole directory.
    expect(listCustomersMock).toHaveBeenLastCalledWith(null, null);

    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "Ada",
    );

    await waitFor(() =>
      expect(listCustomersMock).toHaveBeenLastCalledWith(null, "Ada"),
    );
  });

  it("forwards the typed part term to the backend", async () => {
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
        0n,
        // The picker no longer truncates: it asks for a page large enough to
        // cover the whole catalog.
        1000n,
      ),
    );
  });

  it("forwards the typed service term to the backend", async () => {
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
        0n,
        // The picker no longer truncates: it asks for a whole-catalog page.
        1000n,
      ),
    );
  });

  it("still lists and selects a part after searching", async () => {
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
        0n,
        1000n,
      ),
    );

    await userEvent.click(screen.getByTestId("quote_detail.add_part_button"));
    // The line must be activated before a search result can fill it.
    await userEvent.click(
      screen.getByTestId("quote_detail.part_pick_button.1"),
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.part_search.item.1"),
    );

    expect(
      screen.getByTestId("quote_detail.part_selected.1"),
    ).toHaveTextContent("Balata de freno");
  });

  it("still lists and selects a service after searching", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.service_search_input"),
      "aceite",
    );
    await waitFor(() =>
      expect(listServicesMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ search: "aceite" }),
        ServiceSort.name,
        0n,
        1000n,
      ),
    );

    await userEvent.click(
      screen.getByTestId("quote_detail.add_service_button"),
    );
    await userEvent.click(
      screen.getByTestId("quote_detail.service_pick_button.1"),
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.service_search.item.1"),
    );

    expect(
      screen.getByTestId("quote_detail.service_selected.1"),
    ).toHaveTextContent("Cambio de aceite");
  });
});
