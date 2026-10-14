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
 * Coverage for the new-quote unified search seam.
 *
 * The accepted change replaces the two separate part/service pickers with one
 * box that queries both catalogs. These tests pin the consumer contract the
 * unified search relies on: the term typed into the box is debounced and
 * forwarded to both `listParts` and `listServices` with the resolved call shape
 * (session token first, whole-catalog page size), and the combined list still
 * lets a result be selected in one step.
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

describe("QuoteDetailPage new-quote unified search", () => {
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

  it("forwards the typed term to both the part and service catalogs", async () => {
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
        // The search no longer truncates: it asks for a page large enough to
        // cover the whole catalog.
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

  it("still lists and selects a part after searching", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.item_search_input"),
      "balata",
    );
    await userEvent.click(
      await screen.findByTestId("quote_detail.item_search.item.1"),
    );

    expect(
      screen.getByTestId("quote_detail.part_selected.1"),
    ).toHaveTextContent("Balata de freno");
  });

  it("still lists and selects a service after searching", async () => {
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

    expect(
      screen.getByTestId("quote_detail.service_selected.1"),
    ).toHaveTextContent("Cambio de aceite");
  });
});
