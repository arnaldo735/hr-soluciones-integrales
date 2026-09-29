import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  PartView,
  PosSale,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  PaymentCondition,
  PaymentMethod,
  TaxResponsibility,
} from "@/lib/types";
import { PosPage } from "@/pages/PosPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS counter at a phone-width viewport.
 *
 * The accepted change makes the POS page fit a phone screen without horizontal
 * overflow. That layout is intentionally changing, so this file never asserts
 * the current grid classes, fixed column widths, or the presence of overflow.
 * It protects the functional contract that must survive the responsive rework:
 * at a phone width the page still renders its product and cart regions, and the
 * cash, credit and customer journeys still reach the backend with the same
 * payloads.
 *
 * The viewport is simulated by setting `window.innerWidth` and dispatching a
 * resize event, which is what `useIsMobile` listens to. jsdom does not lay out
 * CSS, so this is component/integration coverage of the narrow-viewport
 * behavior, not a real browser overflow measurement.
 */

const PHONE_WIDTH = 390;

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

function sale(overrides: Partial<PosSale> = {}): PosSale {
  return {
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
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
    ...overrides,
  };
}

/** Puts the jsdom viewport at a phone width and notifies resize listeners. */
function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

/**
 * Types a term into the POS product search so the picker queries the catalog
 * and renders its results. The picker no longer lists the catalog by default,
 * so every product-selection journey starts by typing.
 */
async function searchProducts(term = "balata") {
  await userEvent.type(screen.getByTestId("pos.search_input"), term);
  await screen.findByTestId("pos.product_item.1");
}

describe("PosPage at a phone-width viewport (characterization)", () => {
  const originalWidth = window.innerWidth;

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
    setViewportWidth(PHONE_WIDTH);
  });

  afterEach(() => {
    setViewportWidth(originalWidth);
  });

  it("renders the product and cart regions with their primary controls", async () => {
    renderWithProviders(<PosPage />);

    // Both counter panels and the controls a cashier needs are present at a
    // phone width; the responsive rework must not drop any of them.
    expect(await screen.findByTestId("pos.product_panel")).toBeInTheDocument();
    expect(screen.getByTestId("pos.cart_panel")).toBeInTheDocument();
    expect(screen.getByTestId("pos.barcode_input")).toBeInTheDocument();
    expect(screen.getByTestId("pos.search_input")).toBeInTheDocument();
    expect(screen.getByTestId("pos.customer_select")).toBeInTheDocument();
    expect(screen.getByTestId("pos.charge_button")).toBeInTheDocument();
    expect(screen.getByTestId("pos.cart_empty_state")).toBeInTheDocument();
  });

  it("adds a product and computes the total at a phone width", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    const cart = screen.getByTestId("pos.cart_list");
    expect(within(cart).getByText("Balata de freno")).toBeInTheDocument();
    // 1 × 250.00 subtotal + 16% tax = 290.00 total.
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("290");
  });

  it("charges a cash sale at a phone width with the same payload", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "300",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    // The backend call is (token, input); the token is null without a session.
    expect(createPosSaleMock.mock.calls[0][0]).toBeNull();
    expect(createPosSaleMock.mock.calls[0][1]).toMatchObject({
      lines: [{ partId: 1n, quantity: 1n, discount: 0n }],
      paymentMethod: PaymentMethod.cash,
      paymentCondition: PaymentCondition.cash,
      amountReceived: 30000n,
    });
    expect(await screen.findByTestId("pos.success_state")).toBeInTheDocument();
  });

  it("builds a credit plan at a phone width and sends it to the backend", async () => {
    createPosSaleMock.mockResolvedValue(
      sale({ paymentCondition: PaymentCondition.credit }),
    );
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.click(screen.getByTestId("pos.condition_credit_button"));
    await userEvent.clear(screen.getByTestId("pos.installment_count_input"));
    await userEvent.type(
      screen.getByTestId("pos.installment_count_input"),
      "3",
    );
    await userEvent.type(
      screen.getByTestId("pos.first_due_date_input"),
      "2026-01-15",
    );

    // The installment preview is reachable and complete at a phone width.
    const preview = screen.getByTestId("pos.installment_preview");
    expect(within(preview).getAllByRole("row")).toHaveLength(4);

    await userEvent.click(screen.getByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    const payload = createPosSaleMock.mock.calls[0][1];
    expect(payload).toMatchObject({
      paymentCondition: PaymentCondition.credit,
      customerId: 7n,
    });
    expect(payload.creditPlan.installmentCount).toBe(3n);
  });

  it("keeps the credit customer guard at a phone width", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.click(screen.getByTestId("pos.condition_credit_button"));

    expect(
      screen.getByTestId("pos.credit_customer_warning"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pos.charge_button")).toBeDisabled();
  });
});
