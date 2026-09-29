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
 * Cover for the POS counter customer-search change.
 *
 * The accepted change makes the counter POS customer search return matching
 * customers as the user types, ignoring case and accents, and show a clear
 * no-results message when nothing matches. The accent/case folding itself is
 * backend-owned (`src/backend/lib/search.mo`, applied by `listCustomers`), so
 * this file covers the frontend seam the change touched:
 *
 *   - the term is forwarded to `listCustomers` verbatim (case and accents
 *     intact), so the backend can normalize and nothing is mangled;
 *   - while the debounce has not caught up, or the query is refetching, the
 *     picker shows its loading state instead of the previous term's results or
 *     a premature "sin clientes que coincidan" message;
 *   - clearing the field resolves immediately, without waiting for the
 *     debounce, and returns to the unfiltered directory;
 *   - a term with no matches shows the no-results message with the typed term.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend search. The characterization file
 * (`PosPage.customer-search.characterize.test.tsx`) protects the pre-existing
 * forwarding/rendering/clearing/no-results behavior; this file adds the pending
 * branch and the verbatim-forwarding contract the change introduced.
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

/** A promise whose resolution the test controls, for the pending-state branch. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("PosPage customer search (cover)", () => {
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
    listCustomersMock.mockResolvedValue([customer()]);
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  // --- Accepted behavior: the term reaches the backend unmodified -----------
  //
  // The backend owns case/accent folding, so the frontend must forward the term
  // exactly as typed. A frontend that lowercased or stripped accents would hide
  // a backend regression and could not match a phone, document or plate that
  // carries meaningful case.

  it("forwards the typed term verbatim so the backend can fold case and accents", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Pérez",
    );

    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, "Pérez"),
      { timeout: 2000 },
    );
  });

  // --- Accepted behavior: the pending branch --------------------------------
  //
  // While the user is still typing, the debounced term has not reached the
  // query yet. The picker must show its loading state rather than the previous
  // term's results or a premature "sin clientes que coincidan" message.

  it("shows the loading state while the debounced term is still catching up", async () => {
    const pending = deferred<Customer[]>();
    listCustomersMock.mockReturnValue(pending.promise);
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Ana",
    );

    // The query is in flight, so the loading state is shown and no empty-state
    // message is rendered before the backend answers.
    expect(
      await screen.findByTestId("pos.customer_search_loading_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("pos.customer_search_empty_state"),
    ).not.toBeInTheDocument();

    pending.resolve([customer()]);
    await waitFor(() =>
      expect(
        screen.queryByTestId("pos.customer_search_loading_state"),
      ).not.toBeInTheDocument(),
    );
  });

  it("does not show a stale no-results message for the previous term while the new one loads", async () => {
    renderWithProviders(<PosPage />);

    // First term resolves with no matches and renders the empty state.
    listCustomersMock.mockResolvedValue([]);
    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Zzz",
    );
    await screen.findByTestId("pos.customer_search_empty_state");

    // The next term's query is held open; the picker must not keep showing the
    // previous term's "sin resultados" message as if it matched the new term.
    const pending = deferred<Customer[]>();
    listCustomersMock.mockReturnValue(pending.promise);
    await userEvent.type(
      screen.getByTestId("pos.customer_search_input"),
      "Ana",
    );

    expect(
      await screen.findByTestId("pos.customer_search_loading_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("pos.customer_search_empty_state"),
    ).not.toBeInTheDocument();

    pending.resolve([customer()]);
    await waitFor(() =>
      expect(
        screen.queryByTestId("pos.customer_search_empty_state"),
      ).not.toBeInTheDocument(),
    );
  });

  // --- Accepted behavior: clearing resolves immediately ---------------------
  //
  // Clearing the field must return to the unfiltered directory without waiting
  // for the debounce, and must not leave the loading or empty state behind.

  it("clears the loading and empty states immediately when the field is emptied", async () => {
    listCustomersMock.mockResolvedValue([]);
    renderWithProviders(<PosPage />);

    const input = await screen.findByTestId("pos.customer_search_input");
    await userEvent.type(input, "Zzz");
    await screen.findByTestId("pos.customer_search_empty_state");

    await userEvent.clear(input);

    // The empty state disappears at once, without waiting for the debounce.
    await waitFor(() =>
      expect(
        screen.queryByTestId("pos.customer_search_empty_state"),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByTestId("pos.customer_search_loading_state"),
    ).not.toBeInTheDocument();

    // The backend is asked for the unfiltered directory again.
    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, null),
      { timeout: 2000 },
    );
  });

  // --- Accepted behavior: the no-results message ----------------------------

  it("shows the no-results message with the typed term when nothing matches", async () => {
    listCustomersMock.mockResolvedValue([]);
    renderWithProviders(<PosPage />);

    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Zzz",
    );

    const empty = await screen.findByTestId("pos.customer_search_empty_state");
    expect(empty).toHaveTextContent("Sin clientes que coincidan");
    expect(empty).toHaveTextContent("Zzz");
  });

  // --- Accepted behavior: selecting a search result assigns the customer ----
  //
  // The accepted requirement is that selecting a customer from the search
  // results assigns it to the order in progress. This is the end-to-end journey
  // the change enables: type a term, the backend returns the match, the picker
  // offers it, and choosing it carries the customer id in the sale payload.

  it("assigns the customer chosen from the search results to the sale", async () => {
    createPosSaleMock.mockResolvedValue({
      id: 1n,
      saleNumber: "POS-0001",
      lines: [
        {
          partId: 1n,
          description: "Balata de freno",
          quantity: 1n,
          unitPrice: 25000n,
          amount: 25000n,
          discount: 0n,
        },
      ],
      subtotal: 25000n,
      discount: 0n,
      taxRate: 16n,
      tax: 4000n,
      total: 29000n,
      amountReceived: 30000n,
      change: 1000n,
      paymentMethod: "cash",
      paymentCondition: "cash",
      soldAt: 1_700_000_000_000_000_000n,
      soldBy: undefined as never,
      invoiceId: 1n,
    });
    renderWithProviders(<PosPage />);

    // Search by a term the backend resolves to the customer, then pick it from
    // the results the search returned.
    await userEvent.type(
      await screen.findByTestId("pos.customer_search_input"),
      "Ana",
    );
    await waitFor(
      () => expect(listCustomersMock).toHaveBeenLastCalledWith(null, "Ana"),
      { timeout: 2000 },
    );
    await userEvent.click(screen.getByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );

    // Add a product and charge so the selected customer reaches the payload.
    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "300",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    // The actor call is (token, input); the chosen customer id is carried.
    expect(createPosSaleMock.mock.calls[0][1]).toMatchObject({
      customerId: 7n,
    });
  });

  // --- Accepted behavior: the product search still works --------------------
  //
  // The change touches the same page as the product picker, so the product
  // search must keep returning matches and showing its own no-results message.

  it("keeps the product search returning matches and its no-results message", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.type(screen.getByTestId("pos.search_input"), "balata");
    const list = await screen.findByTestId("pos.product_list");
    expect(within(list).getByText("Balata de freno")).toBeInTheDocument();

    listPartsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 50n,
    });
    await userEvent.clear(screen.getByTestId("pos.search_input"));
    await userEvent.type(screen.getByTestId("pos.search_input"), "zzz");

    const empty = await screen.findByTestId("pos.empty_state");
    expect(empty).toHaveTextContent("Sin resultados");
    expect(empty).toHaveTextContent("zzz");
  });
});
