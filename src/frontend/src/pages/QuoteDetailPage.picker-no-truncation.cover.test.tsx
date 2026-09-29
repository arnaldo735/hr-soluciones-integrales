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
 * Cover for the accepted no-truncation behavior of the new-quote pickers.
 *
 * The accepted change stops the type-to-narrow selectors from truncating: the
 * part picker asks the backend for a page large enough to cover the whole
 * catalog (1000 rows, not the old 50) and the service picker does the same
 * (1000, not the old 100), and each renders every row the backend returns. The
 * accent folding itself is resolved in the backend, so it is exercised in the
 * PocketIC lane, not here; this file pins the frontend seam the change touches.
 *
 * The actor is mocked with the current call shape (session token first), so
 * these tests fail if the picker regresses to a small page or drops rows.
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

function part(index: number): PartView {
  return {
    id: BigInt(100 + index),
    sku: `BAL-${String(index).padStart(3, "0")}`,
    lowStockThreshold: 2n,
    name: `Balata de freno ${index}`,
    createdAt: 1_700_000_000_000_000_000n,
    unit: "pza",
    totalStock: 8n,
    barcode: "",
    category: "Frenos",
    salePrice: 25000n,
    brand: "Genérico",
    costPrice: 12000n,
    lowStock: false,
  };
}

function service(index: number): Service {
  return {
    id: BigInt(200 + index),
    active: true,
    code: `SRV-${String(index).padStart(3, "0")}`,
    name: `Servicio de prueba ${index}`,
    createdAt: 1_700_000_000_000_000_000n,
    description: "",
    category: "Mantenimiento",
    laborRate: 30000n,
    estimatedMinutes: 45n,
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

describe("QuoteDetailPage picker no-truncation (cover)", () => {
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
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("requests a whole-catalog page for the part picker and lists every returned row", async () => {
    // More than the old 50-row cap, so a regression to a small page would drop
    // rows and fail the count assertion below.
    const parts = Array.from({ length: 60 }, (_, index) => part(index + 1));
    listPartsMock.mockResolvedValue({
      items: parts,
      total: 60n,
      offset: 0n,
      limit: 1000n,
    });

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

    const list = within(
      await screen.findByTestId("quote_detail.part_search.list"),
    );
    // Every one of the 60 rows is rendered, not a truncated first page.
    expect(list.getAllByRole("button")).toHaveLength(60);
    expect(list.getByText("BAL-001")).toBeInTheDocument();
    expect(list.getByText("BAL-060")).toBeInTheDocument();
  });

  it("requests a whole-catalog page for the service picker and lists every returned row", async () => {
    const services = Array.from({ length: 60 }, (_, index) =>
      service(index + 1),
    );
    listServicesMock.mockResolvedValue({
      items: services,
      total: 60n,
      offset: 0n,
      limit: 1000n,
    });

    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.service_search_input"),
      "servicio",
    );

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenLastCalledWith(
        null,
        expect.objectContaining({ search: "servicio", activeOnly: true }),
        ServiceSort.name,
        0n,
        1000n,
      ),
    );

    const list = within(
      await screen.findByTestId("quote_detail.service_search.list"),
    );
    expect(list.getAllByRole("button")).toHaveLength(60);
    expect(list.getByText("SRV-001")).toBeInTheDocument();
    expect(list.getByText("SRV-060")).toBeInTheDocument();
  });
});
