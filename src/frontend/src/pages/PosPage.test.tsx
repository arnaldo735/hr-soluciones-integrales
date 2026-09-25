import type {
  BusinessSettings,
  CompanyProfile,
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
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS counter-sale flow.
 *
 * The money format, the currency label and the default tax rate are
 * intentionally changing, so this file never asserts the exact rendered
 * currency string or the 16% default. It protects the surrounding working
 * behavior instead: the cart math, the stock guard, the cash guard, the
 * payload sent to the backend, and the receipt document.
 */

const listPartsMock = vi.fn();
const listCustomersMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const createPosSaleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listParts: listPartsMock,
      listCustomers: listCustomersMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      createPosSale: createPosSaleMock,
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

function sale(overrides: Partial<PosSale> = {}): PosSale {
  return {
    id: 1n,
    saleNumber: "POS-0001",
    lines: [
      {
        partId: 1n,
        description: "Balata de freno",
        quantity: 2n,
        unitPrice: 25000n,
        amount: 50000n,
        discount: 0n,
      },
    ],
    subtotal: 50000n,
    discount: 0n,
    taxRate: 16n,
    tax: 8000n,
    total: 58000n,
    amountReceived: 60000n,
    change: 2000n,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
    ...overrides,
  };
}

describe("PosPage", () => {
  beforeEach(() => {
    listPartsMock.mockReset();
    listCustomersMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    createPosSaleMock.mockReset();
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    listCustomersMock.mockResolvedValue([]);
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("adds a product to the cart and computes the taxed total", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    const cart = screen.getByTestId("pos.cart_list");
    expect(within(cart).getByText("Balata de freno")).toBeInTheDocument();
    // 1 × 250.00 = 250.00 subtotal, 16% tax = 40.00, total 290.00.
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("290");
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("$");
  });

  it("blocks charging when the cart is empty", async () => {
    renderWithProviders(<PosPage />);

    await screen.findByTestId("pos.product_item.1");
    expect(screen.getByTestId("pos.charge_button")).toBeDisabled();
    expect(screen.getByTestId("pos.cart_empty_state")).toBeInTheDocument();
  });

  it("warns and blocks charging when the cart exceeds available stock", async () => {
    listPartsMock.mockResolvedValue({
      items: [part({ totalStock: 1n })],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.click(screen.getByTestId("pos.quantity_increase.1"));

    expect(screen.getByTestId("pos.stock_warning")).toBeInTheDocument();
    expect(screen.getByTestId("pos.charge_button")).toBeDisabled();
  });

  it("warns and blocks charging when cash received does not cover the total", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(screen.getByTestId("pos.amount_received_input"), "1");

    expect(screen.getByTestId("pos.payment_warning")).toBeInTheDocument();
    expect(screen.getByTestId("pos.charge_button")).toBeDisabled();
  });

  it("sends the cart lines, method and received cash to the backend", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    expect(createPosSaleMock.mock.calls[0][0]).toEqual({
      lines: [{ partId: 1n, quantity: 1n, discount: 0n }],
      paymentMethod: PaymentMethod.cash,
      paymentCondition: PaymentCondition.cash,
      amountReceived: 60000n,
      customerId: undefined,
      creditPlan: undefined,
    });
  });

  it("shows the receipt document after a successful charge", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    expect(await screen.findByTestId("pos.success_state")).toBeInTheDocument();
    expect(screen.getByTestId("pos.receipt_a4")).toBeInTheDocument();
    expect(screen.getByTestId("pos.receipt_80mm")).toBeInTheDocument();
    // The receipt is rendered twice (A4 sheet and 80 mm roll).
    expect(screen.getAllByText("POS-0001").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Balata de freno").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("surfaces a stock rejection from the backend without clearing the cart", async () => {
    createPosSaleMock.mockRejectedValue(new Error("insufficientStock"));
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("pos.success_state")).not.toBeInTheDocument();
    expect(screen.getByTestId("pos.cart_list")).toBeInTheDocument();
  });

  // --- Characterization: the cart math the IVA change must keep -------------
  //
  // The accepted change makes the company's fiscal regime decide the effective
  // IVA rate and hides the tax line for a non-responsable. These tests protect
  // the surrounding cart contract instead: a line discount reduces the taxable
  // base before tax, the total is the discounted base plus tax, and the payload
  // carries the line discount. They never assert the applied rate.

  it("applies a line discount to the taxable base before tax", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    // 1 × 250.00 = 250.00 gross; a 50.00 discount leaves a 200.00 base.
    await userEvent.clear(screen.getByTestId("pos.discount_input.1"));
    await userEvent.type(screen.getByTestId("pos.discount_input.1"), "50");

    // The total is the discounted base plus the tax on that base, so it is
    // strictly below the undiscounted total of 290.00.
    const total = screen.getByTestId("pos.total_value");
    expect(total).toHaveTextContent("$");
    expect(total).not.toHaveTextContent("290");
  });

  it("sends the line discount to the backend with the cart lines", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.clear(screen.getByTestId("pos.discount_input.1"));
    await userEvent.type(screen.getByTestId("pos.discount_input.1"), "50");
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    // The discount is carried in cents, matching the backend's money unit.
    expect(createPosSaleMock.mock.calls[0][0]).toMatchObject({
      lines: [{ partId: 1n, quantity: 1n, discount: 5000n }],
      paymentMethod: PaymentMethod.cash,
    });
  });

  // --- Accepted change: the fiscal regime decides IVA -----------------------
  //
  // A non-responsable company must not charge IVA: the cart hides the tax line
  // and the total equals the discounted base. The stored rate is preserved on
  // the profile but never applied.

  it("hides the tax line and charges no IVA for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({
        fiscalRegime: FiscalRegime.noResponsableIva,
        taxRate: 16n,
      }),
    );
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    // 1 × 250.00 with no tax: the total is the plain subtotal.
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("$ 250");
    expect(screen.queryByText(/Impuesto/)).not.toBeInTheDocument();
  });

  it("keeps the discounted base as the total for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ fiscalRegime: FiscalRegime.noResponsableIva }),
    );
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.clear(screen.getByTestId("pos.discount_input.1"));
    await userEvent.type(screen.getByTestId("pos.discount_input.1"), "50");

    // 250.00 - 50.00 = 200.00, with no tax added on top.
    expect(screen.getByTestId("pos.total_value")).toHaveTextContent("$ 200");
    expect(screen.queryByText(/Impuesto/)).not.toBeInTheDocument();
  });

  // --- Accepted change: the barcode scan resolves outside the picker page ---
  //
  // The picker page intentionally shrank to 50 rows, so a scanned SKU that is
  // not in that first page must still resolve. The scan path queries the
  // backend directly with the scanned code and matches the SKU exactly, so the
  // cart gains the scanned product even though the picker never listed it.

  it("adds a scanned SKU that is not in the first picker page to the cart", async () => {
    // The picker page (a plain listParts call) returns an unrelated product;
    // the scanned code only resolves through the barcode lookup.
    const scanned = part({
      id: 99n,
      sku: "REP-9999",
      name: "Cadena de transmisión",
      salePrice: 80000n,
      totalStock: 4n,
    });
    listPartsMock.mockImplementation(
      (filter: { search?: string } | undefined) =>
        Promise.resolve(
          filter?.search === "REP-9999"
            ? { items: [scanned], total: 1n, offset: 0n, limit: 50n }
            : { items: [part()], total: 1n, offset: 0n, limit: 50n },
        ),
    );
    renderWithProviders(<PosPage />);

    // The picker only ever shows the unrelated first-page product.
    await screen.findByTestId("pos.product_item.1");
    expect(screen.queryByTestId("pos.product_item.99")).not.toBeInTheDocument();

    await userEvent.type(screen.getByTestId("pos.barcode_input"), "REP-9999");
    await userEvent.keyboard("{Enter}");

    const cart = await screen.findByTestId("pos.cart_list");
    expect(within(cart).getByText("Cadena de transmisión")).toBeInTheDocument();
    // The scan queried the backend with the scanned code, not the picker term.
    expect(listPartsMock).toHaveBeenCalledWith(
      { search: "REP-9999" },
      expect.anything(),
      0n,
      50n,
    );
  });

  it("matches the scanned SKU case-insensitively", async () => {
    const scanned = part({
      id: 77n,
      sku: "REP-7777",
      name: "Kit de arrastre",
      totalStock: 3n,
    });
    listPartsMock.mockImplementation(
      (filter: { search?: string } | undefined) =>
        Promise.resolve(
          filter?.search === "rep-7777"
            ? { items: [scanned], total: 1n, offset: 0n, limit: 50n }
            : { items: [part()], total: 1n, offset: 0n, limit: 50n },
        ),
    );
    renderWithProviders(<PosPage />);

    await screen.findByTestId("pos.product_item.1");
    await userEvent.type(screen.getByTestId("pos.barcode_input"), "rep-7777");
    await userEvent.keyboard("{Enter}");

    const cart = await screen.findByTestId("pos.cart_list");
    expect(within(cart).getByText("Kit de arrastre")).toBeInTheDocument();
  });

  it("reports an unknown scanned code without adding a cart line", async () => {
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    renderWithProviders(<PosPage />);

    await screen.findByTestId("pos.product_item.1");
    await userEvent.type(screen.getByTestId("pos.barcode_input"), "NO-EXISTE");
    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByTestId("pos.cart_empty_state")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("pos.cart_list")).not.toBeInTheDocument();
  });

  it("omits the tax line from the receipt for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ fiscalRegime: FiscalRegime.noResponsableIva }),
    );
    createPosSaleMock.mockResolvedValue(
      sale({ taxRate: 0n, tax: 0n, total: 50000n }),
    );
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    expect(await screen.findByTestId("pos.success_state")).toBeInTheDocument();
    expect(screen.queryByText(/Impuesto/)).not.toBeInTheDocument();
    // The receipt still renders the subtotal and the total.
    expect(screen.getAllByText("Subtotal").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(1);
  });
});
