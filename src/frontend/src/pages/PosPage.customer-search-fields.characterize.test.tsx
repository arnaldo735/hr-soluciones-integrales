import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  PartView,
} from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { PosPage } from "@/pages/PosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS counter customer search by the fields
 * the acceptance criteria name beyond the name: phone, document and motorcycle
 * plate.
 *
 * The accepted requirement is that the counter POS customer search finds a
 * customer by name, phone, document and plate, ignoring case and accents, and
 * shows a clear message when nothing matches. The matching itself is
 * backend-owned (`src/backend/lib/customers.mo` via `src/backend/lib/search.mo`),
 * and the frontend suite mocks the actor, so this file does not assert the
 * matching rules. It protects the working frontend seam the change must keep:
 *
 *   - the term is forwarded to `listCustomers` verbatim as the second argument
 *     (the actor call is `(token, search)`), so a phone, document or plate term
 *     reaches the backend unmangled and the backend can fold case and accents;
 *   - the customers the backend returns for such a term render in the picker;
 *   - a term with no matches shows the clear no-results message.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend search. The accent/case folding is
 * backend-owned and is only observable against the real canister.
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
  customer({ id: 7n, name: "Ana Pérez", phone: "+57 300 111 2222" }),
  customer({
    id: 8n,
    name: "Carlos Ruiz",
    phone: "+57 300 333 4444",
    document: "SRCH-DOC-9988",
  }),
];

describe("PosPage customer search by phone, document and plate (characterization)", () => {
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
    // The backend filters by the term it receives across name, phone and
    // document; an empty term returns the whole directory.
    listCustomersMock.mockImplementation(
      (_token: string | null, search: string | null) =>
        Promise.resolve(
          search === null
            ? DIRECTORY
            : DIRECTORY.filter((entry) =>
                [entry.name, entry.phone, entry.document ?? ""].some((field) =>
                  field.toLowerCase().includes(search.toLowerCase()),
                ),
              ),
        ),
    );
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("forwards a phone term verbatim so the backend can match it", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "300 333 4444",
    );

    // The actor call is (token, search); the phone term reaches the backend
    // with its spaces intact so the backend can compare it character by
    // character.
    await waitFor(
      () =>
        expect(listCustomersMock).toHaveBeenLastCalledWith(
          null,
          "300 333 4444",
        ),
      { timeout: 2000 },
    );
  });

  it("forwards a document term verbatim so the backend can match it", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "SRCH-DOC-9988",
    );

    // The document term reaches the backend with its dashes and casing intact.
    await waitFor(
      () =>
        expect(listCustomersMock).toHaveBeenLastCalledWith(
          null,
          "SRCH-DOC-9988",
        ),
      { timeout: 2000 },
    );
  });

  it("forwards a plate term verbatim so the backend can match it", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "ABC-123",
    );

    // The plate term reaches the backend with its dash intact.
    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, "ABC-123"),
      { timeout: 2000 },
    );
  });

  it("renders the customer the backend returns for a document term", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "SRCH-DOC-9988",
    );

    await waitFor(
      () =>
        expect(listCustomersMock).toHaveBeenLastCalledWith(
          null,
          "SRCH-DOC-9988",
        ),
      { timeout: 2000 },
    );

    await userEvent.click(screen.getByTestId("pos.customer_select"));

    // The matching customer is offered in the picker.
    expect(
      await screen.findByRole("option", { name: "Carlos Ruiz" }),
    ).toBeInTheDocument();
  });

  it("shows the no-results message for a term that matches no customer", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "ZZZ-999",
    );

    const empty = await screen.findByTestId("pos.customer_search_empty_state");
    expect(empty).toHaveTextContent("Sin clientes que coincidan");
    expect(empty).toHaveTextContent("ZZZ-999");
  });
});
