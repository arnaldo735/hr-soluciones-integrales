import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  PartView,
} from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { PosPage } from "@/pages/PosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS counter customer search.
 *
 * The accepted requirement is that typing a term in the counter POS customer
 * search returns matching customers. This file protects the working behavior
 * that must survive the change:
 *
 *   - the typed term is forwarded to the backend lookup as the search argument
 *     (the actor call is `(token, search)`), so the backend can filter;
 *   - the customers the backend returns for that term render in the picker;
 *   - clearing the field returns to the unfiltered directory;
 *   - a term with no matches shows the clear no-results message.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend search. The accent/case folding itself is
 * backend-owned (`src/backend/lib/search.mo`).
 */

const listPartsMock = vi.fn();
const listCustomersMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const createPosSaleMock = vi.fn();
const findPartByCodeMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listParts: listPartsMock,
      listCustomers: listCustomersMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      createPosSale: createPosSaleMock,
      findPartByCode: findPartByCodeMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
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
    ...overrides,
  };
}

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 7n,
    name: "Ana Pérez",
    phone: "+57 300 111 2222",
    email: "ana@example.com",
    address: "Calle 1 #2-3",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function business(overrides: Partial<BusinessSettings> = {}): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
    ...overrides,
  };
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

/** The customer directory the backend holds before any search term is typed. */
const DIRECTORY: Customer[] = [
  customer({ id: 7n, name: "Ana Pérez" }),
  customer({ id: 8n, name: "Carlos Ruiz", phone: "+57 300 333 4444" }),
];

describe("PosPage customer search (characterization)", () => {
  beforeEach(() => {
    listPartsMock.mockReset();
    listCustomersMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createPosSaleMock.mockReset();
    findPartByCodeMock.mockReset();
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    // The backend filters by the term it receives; an empty term returns the
    // whole directory.
    listCustomersMock.mockImplementation(
      (_token: string | null, search: string | null) =>
        Promise.resolve(
          search === null
            ? DIRECTORY
            : DIRECTORY.filter((entry) =>
                entry.name.toLowerCase().includes(search.toLowerCase()),
              ),
        ),
    );
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("forwards the typed term to the backend customer lookup", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Ana",
    );

    // The actor call is (token, search); the term reaches the backend so it can
    // filter the directory.
    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, "Ana"),
      { timeout: 2000 },
    );
  });

  it("renders the customers the backend returns for the typed term", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Carlos",
    );

    // Wait for the debounced term to reach the backend before opening the
    // picker, so the options reflect the filtered result rather than the
    // unfiltered directory.
    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, "Carlos"),
      { timeout: 2000 },
    );

    await userEvent.click(screen.getByTestId("pos.customer_select"));

    // The matching customer is offered.
    expect(
      await screen.findByRole("option", { name: "Carlos Ruiz" }),
    ).toBeInTheDocument();
  });

  it("returns to the full directory when the search term is cleared", async () => {
    renderWithProviders(<PosPage />);

    const input = await screen.findByTestId("pos.customer_search_input");
    await userEvent.type(input, "Carlos");
    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, "Carlos"),
      { timeout: 2000 },
    );

    await userEvent.clear(input);

    // Clearing the field asks the backend for the unfiltered directory again.
    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, null),
      { timeout: 2000 },
    );

    await userEvent.click(screen.getByTestId("pos.customer_select"));
    expect(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Carlos Ruiz" }),
    ).toBeInTheDocument();
  });

  it("shows the no-results message when the term matches no customer", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Zzz",
    );

    const empty = await screen.findByTestId("pos.customer_search_empty_state");
    expect(empty).toHaveTextContent("Sin clientes que coincidan");
    expect(empty).toHaveTextContent("Zzz");
  });
});
