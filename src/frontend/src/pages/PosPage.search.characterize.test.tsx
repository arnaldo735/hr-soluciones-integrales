import type { BusinessSettings, CompanyProfile, PartView } from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { PosPage } from "@/pages/PosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS product-search seam.
 *
 * The accepted change makes the POS search return the products whose name, SKU
 * or barcode match the typed term, ignoring case and accents, and show a clear
 * no-results message when nothing matches. That matching behavior is
 * intentionally changing, so this file never asserts that a matching term
 * returns results (the current broken behavior) nor the exact matching rules.
 *
 * It protects the surrounding working contract that must survive the fix:
 *   - an empty term shows the prompt and never queries the backend;
 *   - a typed term is debounced and forwarded to `listParts` as the trimmed
 *     `search` filter, with the broad picker page size;
 *   - the loading, error and empty states render for the corresponding query
 *     outcomes, and the retry button refetches;
 *   - a returned page renders its products and selecting one adds it to the
 *     cart.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend search.
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

/** A `PartPage` carrying the given items, matching the picker's broad page. */
function page(items: PartView[]) {
  return { items, total: BigInt(items.length), offset: 0n, limit: 1000n };
}

describe("PosPage product search (characterization)", () => {
  beforeEach(() => {
    listPartsMock.mockReset();
    listCustomersMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createPosSaleMock.mockReset();
    findPartByCodeMock.mockReset();
    listPartsMock.mockResolvedValue(page([part()]));
    listCustomersMock.mockResolvedValue([]);
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("shows the prompt and never queries the backend while the term is empty", async () => {
    renderWithProviders(<PosPage />);

    expect(
      await screen.findByTestId("pos.search_prompt_state"),
    ).toBeInTheDocument();
    // The picker is type-to-narrow: an empty term must not list the catalog.
    expect(listPartsMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("pos.product_list")).not.toBeInTheDocument();
  });

  it("forwards the typed term to listParts as the trimmed search filter", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");

    // The debounced query reaches the backend with the typed term and the broad
    // picker page size, so every match for the term is returned.
    await waitFor(() => expect(listPartsMock).toHaveBeenCalled(), {
      timeout: 2000,
    });
    const call = listPartsMock.mock.calls.at(-1);
    expect(call?.[0]).toBeNull();
    expect(call?.[1]).toMatchObject({ search: "balata" });
    expect(call?.[4]).toBe(1000n);
  });

  it("trims surrounding whitespace before querying the backend", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "  balata  ");

    await waitFor(() => expect(listPartsMock).toHaveBeenCalled(), {
      timeout: 2000,
    });
    const call = listPartsMock.mock.calls.at(-1);
    expect(call?.[1]).toMatchObject({ search: "balata" });
  });

  it("renders the products a returned page carries", async () => {
    listPartsMock.mockResolvedValue(
      page([
        part({
          id: 1n,
          name: "Balata de freno",
          sku: "REP-0001",
          brand: "Brembo",
        }),
        part({
          id: 2n,
          name: "Filtro de aire",
          sku: "REP-0002",
          brand: "Mann",
          totalStock: 0n,
        }),
      ]),
    );
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "rep");

    const list = await screen.findByTestId("pos.product_list");
    expect(within(list).getByText("Balata de freno")).toBeInTheDocument();
    expect(within(list).getByText("Filtro de aire")).toBeInTheDocument();
    // Each row carries its SKU and brand, and an out-of-stock row is disabled.
    expect(within(list).getByText(/REP-0001 · Brembo/)).toBeInTheDocument();
    expect(screen.getByTestId("pos.product_item.2")).toBeDisabled();
  });

  it("adds a selected product from the results to the cart", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    const cart = screen.getByTestId("pos.cart_list");
    expect(within(cart).getByText("Balata de freno")).toBeInTheDocument();
  });

  it("shows the no-results message with the typed term when the page is empty", async () => {
    listPartsMock.mockResolvedValue(page([]));
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "zzz");

    const empty = await screen.findByTestId("pos.empty_state");
    expect(empty).toHaveTextContent("Sin resultados");
    expect(empty).toHaveTextContent("zzz");
    expect(screen.queryByTestId("pos.product_list")).not.toBeInTheDocument();
  });

  it("shows the error state and refetches when the retry button is pressed", async () => {
    listPartsMock.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");

    const error = await screen.findByTestId("pos.error_state");
    expect(error).toHaveTextContent("No se pudo cargar el catálogo");

    // The retry re-issues the query; the second attempt succeeds and renders.
    listPartsMock.mockResolvedValue(page([part()]));
    await userEvent.click(screen.getByTestId("pos.retry_button"));

    expect(await screen.findByTestId("pos.product_list")).toBeInTheDocument();
  });
});
