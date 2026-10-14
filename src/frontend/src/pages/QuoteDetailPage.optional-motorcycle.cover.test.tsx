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
 * Cover for the accepted optional-motorcycle behavior of the quote form.
 *
 * The accepted change makes the motorcycle optional: a quote can be saved for a
 * customer with no registered motorcycles, and the first bike is still attached
 * automatically when the customer has one. The actor is mocked with the current
 * call shape (session token first), so these tests fail if the form regresses
 * to blocking the save or to dropping the automatic first bike.
 *
 * The backend is fully mocked here; the PocketIC lane covers the real
 * createQuote/updateQuote contract, including the "Moto no encontrada" error
 * for an unknown motorcycleId and the migration of existing quotes.
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

function part(): PartView {
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
  };
}

function service(): Service {
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

function createdQuote(motorcycleId?: bigint) {
  return {
    quote: {
      id: 99n,
      status: QuoteStatus.draft,
      serviceLines: [],
      createdAt: 1_700_000_000_000_000_000n,
      quoteNumber: "COT-0099",
      updatedAt: 1_700_000_000_000_000_000n,
      notes: undefined,
      discount: 0n,
      motorcycleId,
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
  };
}

/** Selects the seeded customer and adds one catalog part line. */
async function selectCustomerAndPart() {
  await userEvent.type(
    screen.getByTestId("quote_detail.customer_search_input"),
    "Ada",
  );
  await userEvent.click(
    await screen.findByTestId("quote_detail.customer_search.item.1"),
  );

  await userEvent.type(
    screen.getByTestId("quote_detail.item_search_input"),
    "balata",
  );
  await userEvent.click(
    await screen.findByTestId("quote_detail.item_search.item.1"),
  );
}

describe("QuoteDetailPage optional motorcycle (cover)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createQuoteMock.mockReset();
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

  it("saves a quote for a customer with no motorcycles, without a blocking error", async () => {
    listMotorcyclesMock.mockResolvedValue([]);
    createQuoteMock.mockResolvedValue(createdQuote(undefined));

    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomerAndPart();

    // The form explains the quote can be saved without a motorcycle instead of
    // showing a blocking error.
    expect(
      await screen.findByTestId("quote_detail.motorcycle_missing_state"),
    ).toHaveTextContent("Puedes guardar la cotización sin moto");

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    // The session token is the leading argument; the input is the second.
    const [token, input] = createQuoteMock.mock.calls[0];
    expect(token).toBeNull();
    expect(input.customerId).toBe(1n);
    expect(input.motorcycleId).toBeUndefined();
    // No blocking error banner is shown for the missing motorcycle.
    expect(
      screen.queryByTestId("quote_detail.error_banner"),
    ).not.toBeInTheDocument();
  });

  it("attaches the customer's first motorcycle automatically when one exists", async () => {
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
    createQuoteMock.mockResolvedValue(createdQuote(2n));

    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomerAndPart();

    expect(
      await screen.findByTestId("quote_detail.motorcycle_summary"),
    ).toHaveTextContent("Yamaha FZ25 · ABC12D");

    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    await waitFor(() => expect(createQuoteMock).toHaveBeenCalledTimes(1));
    const [, input] = createQuoteMock.mock.calls[0];
    expect(input.motorcycleId).toBe(2n);
  });

  it("shows the backend error when the save fails", async () => {
    listMotorcyclesMock.mockResolvedValue([]);
    createQuoteMock.mockRejectedValue(new Error("Moto no encontrada"));

    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await selectCustomerAndPart();
    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    expect(
      await screen.findByTestId("quote_detail.error_banner"),
    ).toHaveTextContent("Moto no encontrada");
  });
});
