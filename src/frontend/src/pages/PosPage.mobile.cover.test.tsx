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
 * Cover for the mobile-responsiveness fix of the POS counter.
 *
 * The accepted change makes the POS fit a phone screen without horizontal
 * overflow: the root grid collapses to a single column below `lg`, the two
 * counter panels carry `min-w-0` so they can shrink, cart rows wrap, the total
 * drops to a smaller size on phones, and the installment table and the document
 * previews are contained in internal horizontal-scroll wrappers.
 *
 * jsdom does not lay out CSS, so this file cannot measure real overflow. It
 * asserts the structural contract the fix introduced (the classes that make the
 * layout collapse and contain) and re-checks the phone-width functional
 * journeys that must survive the rework. The functional contract is also
 * protected by `PosPage.mobile.characterize.test.tsx`; this file adds the
 * layout assertions and the document-preview containment that the
 * characterization file intentionally left out.
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

/** The grid container that holds the product and cart panels. */
function posGrid(): HTMLElement {
  const productPanel = screen.getByTestId("pos.product_panel");
  const grid = productPanel.parentElement;
  if (!grid) throw new Error("pos.product_panel has no parent grid");
  return grid;
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

describe("PosPage mobile responsiveness (cover)", () => {
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

  // --- Accepted layout: the root grid collapses to one column below lg ------

  it("stacks the product and cart panels in a single column below lg", async () => {
    renderWithProviders(<PosPage />);

    await screen.findByTestId("pos.product_panel");
    const grid = posGrid();

    // One column at the base breakpoint; the two-column layout is gated behind
    // `lg`, so a phone width never gets the side-by-side grid.
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("lg:grid-cols-");
    // The product panel and the cart panel are siblings in that grid.
    expect(grid).toContainElement(screen.getByTestId("pos.cart_panel"));
  });

  it("lets both counter panels shrink with min-w-0", async () => {
    renderWithProviders(<PosPage />);

    const productPanel = await screen.findByTestId("pos.product_panel");
    const cartPanel = screen.getByTestId("pos.cart_panel");

    // Without `min-w-0` a grid/flex child refuses to shrink below its content
    // width, which is what produced the horizontal overflow.
    expect(productPanel.className).toContain("min-w-0");
    expect(cartPanel.className).toContain("min-w-0");
  });

  it("wraps the cart row controls instead of forcing a single line", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    const row = screen.getByTestId("pos.cart_item.1");
    // The quantity stepper, the discount field and the line amount live in a
    // wrapping flex row so they reflow on a narrow screen.
    const controls = row.querySelector(".flex-wrap");
    expect(controls).not.toBeNull();
    expect(controls).toContainElement(
      screen.getByTestId("pos.quantity_input.1"),
    );
    expect(controls).toContainElement(
      screen.getByTestId("pos.discount_input.1"),
    );
  });

  it("uses a smaller total on phones and a larger one from sm up", async () => {
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));

    const total = screen.getByTestId("pos.total_value");
    expect(total.className).toContain("text-2xl");
    expect(total.className).toContain("sm:text-3xl");
  });

  // --- Accepted layout: the installment table is contained ------------------

  it("contains the installment table in an internal horizontal-scroll wrapper", async () => {
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

    const preview = screen.getByTestId("pos.installment_preview");
    // The wrapper scrolls internally rather than pushing the page wide.
    expect(preview.className).toContain("overflow-x-auto");
    const table = within(preview).getByRole("table");
    expect(table.className).toContain("installment-table");
    // The table keeps a minimum width and scrolls inside the wrapper.
    expect(table.className).toContain("min-w-[320px]");
  });

  // --- Accepted layout: the document previews are contained -----------------

  it("contains the A4 and 80mm receipt previews in horizontal-scroll wrappers", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await searchProducts();
    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "300",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    const a4 = await screen.findByTestId("pos.receipt_a4");
    const receipt80 = screen.getByTestId("pos.receipt_80mm");

    // Each preview wraps its paper sheet in an `overflow-x-auto` container so
    // the fixed-width sheet scrolls internally on a phone.
    for (const preview of [a4, receipt80]) {
      const scroller = preview.querySelector(".overflow-x-auto");
      expect(scroller).not.toBeNull();
      expect(scroller).toContainElement(
        preview.querySelector(".doc-preview") as HTMLElement,
      );
    }
    // The A4 sheet carries the phone-only zoom class that scales it to fit.
    expect(a4.querySelector(".doc-preview-a4")).not.toBeNull();
    expect(receipt80.querySelector(".doc-preview-80mm")).not.toBeNull();
  });

  // --- Accepted behavior: the phone-width functional contract ---------------

  it("charges a cash sale at a phone width with the (token, payload) call", async () => {
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

  it("sends a credit sale with customer and installments at a phone width", async () => {
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
