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
  QuoteStatus,
  TaxResponsibility,
} from "@/lib/types";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the new-quote form's validation and
 * customer-selection behavior that the accepted change does not touch.
 *
 * The accepted change makes the motorcycle optional: a quote may be created for
 * a customer with no registered motorcycles. These tests deliberately do NOT
 * assert the motorcycle requirement (neither the blocked-save path nor the
 * attached `motorcycleId`), because that is the behavior the change alters.
 *
 * They protect the surrounding working behavior instead: the form still refuses
 * to save without a customer and without any line; the clear customer action
 * resets the selection; and the customer search shows a clear empty state when
 * nothing matches. The save payload shape for the customer and the line items
 * is pinned too, so the change cannot silently drop them.
 *
 * The actor calls carry the session token as their leading argument, which is
 * the current consumer contract; the tests assert that shape rather than the
 * older token-less one.
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

function motorcycle(overrides: Partial<Motorcycle> = {}): Motorcycle {
  return {
    id: 2n,
    customerId: 1n,
    plate: "ABC12D",
    brand: "Yamaha",
    model: "FZ25",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
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

/** Selects the seeded customer through the search picker. */
async function selectCustomer() {
  await userEvent.type(
    screen.getByTestId("quote_detail.customer_search_input"),
    "Ada",
  );
  await userEvent.click(
    await screen.findByTestId("quote_detail.customer_search.item.1"),
  );
}

/** Adds a part line from the unified catalog search. */
async function addPartLine() {
  await userEvent.type(
    screen.getByTestId("quote_detail.item_search_input"),
    "balata",
  );
  await userEvent.click(
    await screen.findByTestId("quote_detail.item_search.item.1"),
  );
}

describe("QuoteDetailPage new-quote validation (characterization)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createQuoteMock.mockReset();
    listCustomersMock.mockResolvedValue([customer()]);
    // The customer has a motorcycle, so the motorcycle requirement is never the
    // reason a save is blocked in these tests.
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

  it("blocks the save when no line item has been added", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomer();
    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    expect(
      await screen.findByTestId("quote_detail.error_banner"),
    ).toHaveTextContent("Agrega al menos un repuesto o un servicio.");
    expect(createQuoteMock).not.toHaveBeenCalled();
  });

  it("clears the selected customer and its summary", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomer();
    expect(
      screen.getByTestId("quote_detail.customer_selected"),
    ).toHaveTextContent("Ada Lovelace");

    await userEvent.click(
      screen.getByTestId("quote_detail.clear_customer_button"),
    );

    await waitFor(() =>
      expect(screen.queryByTestId("quote_detail.customer_selected")).toBeNull(),
    );
  });

  it("still selects and summarizes a customer who has no motorcycles", async () => {
    // The accepted change makes the motorcycle optional. This test does NOT
    // assert the blocked-save path or the motorcycle-missing notice (both are
    // the behavior the change alters); it protects the adjacent working
    // behavior: the customer picker still lists and selects a customer with an
    // empty motorcycle list, and the selected-customer summary still renders.
    listMotorcyclesMock.mockResolvedValue([]);
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomer();

    expect(
      screen.getByTestId("quote_detail.customer_selected"),
    ).toHaveTextContent("Ada Lovelace");
    expect(listMotorcyclesMock).toHaveBeenCalledWith(null, 1n);
  });

  it("shows a clear empty state when no customer matches the term", async () => {
    listCustomersMock.mockResolvedValue([]);
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await userEvent.type(
      screen.getByTestId("quote_detail.customer_search_input"),
      "zzz",
    );

    expect(
      await screen.findByTestId("quote_detail.customer_search.empty_state"),
    ).toHaveTextContent("Sin clientes que coincidan");
  });

  it("sends the selected customer and line items in the save payload", async () => {
    createQuoteMock.mockResolvedValue({
      quote: {
        id: 99n,
        status: QuoteStatus.draft,
        serviceLines: [],
        createdAt: 1_700_000_000_000_000_000n,
        quoteNumber: "COT-0099",
        updatedAt: 1_700_000_000_000_000_000n,
        notes: undefined,
        discount: 0n,
        motorcycleId: 2n,
        customerId: 1n,
        partLines: [],
        taxRate: 16n,
      },
      totals: {
        tax: 0n,
        total: 0n,
        taxableBase: 0n,
        servicesSubtotal: 0n,
        partsSubtotal: 0n,
        discount: 0n,
        taxRate: 16n,
        subtotal: 0n,
      },
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomer();
    await addPartLine();

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    // The session token is the leading argument; the input is the second.
    const [token, input] = createQuoteMock.mock.calls[0];
    expect(token).toBeNull();
    expect(input.customerId).toBe(1n);
    expect(input.partLines).toEqual([
      { partId: 10n, quantity: 1n, unitPrice: 25000n },
    ]);
  });

  it("reflects a removed part line in the live totals", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await addPartLine();
    // Repuestos and Subtotal both read $ 250 for this single-line quote.
    expect(
      within(screen.getByTestId("quote_detail.totals.panel")).getAllByText(
        "$ 250",
      ).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 290",
    );

    await userEvent.click(
      screen.getByTestId("quote_detail.remove_part_button.1"),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("quote_detail.parts.empty_state"),
      ).toBeInTheDocument(),
    );
    expect(
      within(screen.getByTestId("quote_detail.totals.panel")).queryByText(
        "$ 250",
      ),
    ).toBeNull();
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 0",
    );
  });
});
