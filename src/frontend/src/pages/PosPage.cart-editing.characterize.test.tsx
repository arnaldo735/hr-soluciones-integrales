import type { BusinessSettings, CompanyProfile, PartView } from "@/lib/types";
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
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS cart editing that surrounds the
 * accepted change.
 *
 * The accepted change lets the user choose a quantity before appending a
 * searched product and makes the appended line appear first in the cart. Both
 * of those are intentionally changing, so this file never asserts the current
 * "quantity 1 appended last" behavior.
 *
 * It protects the adjacent working contract that must survive the change:
 *   - a searched product is still listed and selectable in one step;
 *   - the cart line's quantity controls (increase/decrease/typed) update the
 *     line and the taxed total;
 *   - the quantity is clamped to at least 1;
 *   - a line can be removed;
 *   - the payload sent to the backend carries the edited quantity.
 *
 * The backend is mocked, so this is component/integration coverage of the
 * frontend seam, not a real backend sale.
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

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
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

function page(items: PartView[]) {
  return { items, total: BigInt(items.length), offset: 0n, limit: 1000n };
}

/** Types a term into the POS search and waits for the first result. */
async function searchProducts(term = "balata") {
  await userEvent.type(screen.getByTestId("pos.search_input"), term);
  await screen.findByTestId("pos.product_item.1");
}

describe("PosPage cart editing (characterization)", () => {
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

  it("lists and adds a searched product to the cart in one step", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    const cart = screen.getByTestId("pos.cart_list");
    expect(within(cart).getByText("Balata de freno")).toBeInTheDocument();
  });

  it("increases the line quantity and recomputes the taxed total", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    // 1 × $ 250.00 + 16% = $ 290.00.
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("290");

    await userEvent.click(screen.getByTestId("pos.quantity_increase.1"));

    // 2 × $ 250.00 = $ 500.00 base, + 16% = $ 580.00.
    expect(screen.getByTestId("pos.quantity_input.1")).toHaveValue(2);
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("580");
  });

  it("decreases the line quantity but never below one", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    await userEvent.click(screen.getByTestId("pos.quantity_decrease.1"));

    // The line is clamped to a minimum of 1 rather than removed or zeroed.
    expect(screen.getByTestId("pos.quantity_input.1")).toHaveValue(1);
    expect(screen.getByTestId("pos.cart_list")).toBeInTheDocument();
  });

  it("accepts a typed quantity and reflects it in the total", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    // The controlled input clamps an empty value back to 1, so select the
    // current value and replace it rather than clearing it.
    const quantity = screen.getByTestId("pos.quantity_input.1");
    await userEvent.tripleClick(quantity);
    await userEvent.keyboard("3");

    // 3 × $ 250.00 = $ 750.00 base, + 16% = $ 870.00.
    expect(screen.getByTestId("pos.quantity_input.1")).toHaveValue(3);
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("870");
  });

  it("removes a line from the cart", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    expect(screen.getByTestId("pos.cart_list")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("pos.remove_button.1"));

    expect(screen.queryByTestId("pos.cart_list")).not.toBeInTheDocument();
    expect(screen.getByTestId("pos.cart_empty_state")).toBeInTheDocument();
  });

  it("sends the edited quantity to the backend with the cart line", async () => {
    createPosSaleMock.mockResolvedValue({
      id: 1n,
      saleNumber: "POS-0001",
      lines: [],
      subtotal: 0n,
      discount: 0n,
      taxRate: 16n,
      tax: 0n,
      total: 0n,
      amountReceived: 0n,
      change: 0n,
      paymentMethod: PaymentMethod.cash,
      paymentCondition: PaymentCondition.cash,
      soldAt: 1_700_000_000_000_000_000n,
      soldBy: undefined as never,
      invoiceId: 1n,
    });
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    const quantity = screen.getByTestId("pos.quantity_input.1");
    await userEvent.tripleClick(quantity);
    await userEvent.keyboard("4");

    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "2000",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    // The backend call is (token, input); the token is null without a session.
    expect(createPosSaleMock.mock.calls[0][0]).toBeNull();
    expect(createPosSaleMock.mock.calls[0][1]).toMatchObject({
      lines: [{ partId: 1n, quantity: 4n, discount: 0n }],
      paymentMethod: PaymentMethod.cash,
    });
  });

  it("blocks charging while the cart is empty", async () => {
    renderWithProviders(<PosPage />);

    await screen.findByTestId("pos.search_prompt_state");

    expect(screen.getByTestId("pos.charge_button")).toBeDisabled();
    expect(screen.getByTestId("pos.cart_empty_state")).toBeInTheDocument();
  });
});
