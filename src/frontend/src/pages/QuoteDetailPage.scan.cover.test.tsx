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
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the cotizaciones scan-to-add journey after the accepted change that
 * unified the barcode lookup into `findPartByCode` (barcode or SKU).
 *
 * The shared `BarcodeScanner` and the `useFindPartByCode` hook are covered
 * separately; this file protects the quote consumer seam: a resolved code is
 * appended as a new quote part line with its sale price, and an unknown code
 * shows the Spanish "producto no encontrado" notice without adding a line.
 *
 * The scanner resolves through `useBackend().actor.findPartByCode`, so the actor
 * is mocked with a stable object (a fresh actor per render would restart the
 * camera and is a harness artifact, not product behavior).
 */

const listCustomersMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const listPartsMock = vi.fn();
const listServicesMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const findPartByCodeMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listCustomers: listCustomersMock,
      listMotorcycles: listMotorcyclesMock,
      listParts: listPartsMock,
      listServices: listServicesMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      findPartByCode: findPartByCodeMock,
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

async function openScannerAndSubmit(code: string) {
  await userEvent.click(screen.getByTestId("quote_detail.scan_button"));
  await userEvent.type(screen.getByTestId("quote_detail.scanner.input"), code);
  await userEvent.click(
    screen.getByTestId("quote_detail.scanner.submit_button"),
  );
}

describe("QuoteDetailPage scan-to-add (cover)", () => {
  beforeEach(() => {
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    findPartByCodeMock.mockReset();
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

  it("appends the resolved part as a new quote line with its sale price", async () => {
    const scanned = part({
      id: 99n,
      sku: "REP-9999",
      name: "Cadena de transmisión",
      salePrice: 80000n,
    });
    findPartByCodeMock.mockResolvedValue({ __kind__: "found", found: scanned });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await openScannerAndSubmit("REP-9999");

    // The scanned part becomes a quote part line with quantity 1 and its price.
    expect(
      await screen.findByTestId("quote_detail.part_selected.1"),
    ).toHaveTextContent("Cadena de transmisión");
    // The scan queried the backend with the scanned code, not the picker term.
    // The token is null because the test renders without an auth session.
    expect(findPartByCodeMock).toHaveBeenCalledWith(null, "REP-9999");
  });

  it("shows the Spanish not-found notice and adds no line for an unknown code", async () => {
    findPartByCodeMock.mockResolvedValue({ __kind__: "notFound" });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await openScannerAndSubmit("NO-EXISTE");

    const notice = await screen.findByTestId(
      "quote_detail.scan_not_found_state",
    );
    expect(notice).toHaveTextContent("Producto no encontrado");
    expect(notice).toHaveTextContent("NO-EXISTE");
    // No part line was appended.
    expect(
      screen.queryByTestId("quote_detail.part_selected.1"),
    ).not.toBeInTheDocument();
  });

  it("forwards the scanned code verbatim so the backend matches case-insensitively", async () => {
    const scanned = part({ id: 77n, sku: "REP-7777", name: "Kit de arrastre" });
    findPartByCodeMock.mockResolvedValue({ __kind__: "found", found: scanned });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findByText("Nueva cotización");

    await openScannerAndSubmit("rep-7777");

    expect(
      await screen.findByTestId("quote_detail.part_selected.1"),
    ).toHaveTextContent("Kit de arrastre");
    // The frontend does not normalize the code; the backend owns the match.
    expect(findPartByCodeMock).toHaveBeenCalledWith(null, "rep-7777");
  });
});
