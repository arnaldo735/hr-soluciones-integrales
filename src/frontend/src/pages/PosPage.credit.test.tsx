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
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS credit-sale flow.
 *
 * The accepted change adds a cash/credit condition to the counter sale: a
 * credit sale requires a registered customer and produces a pending invoice
 * with an installment plan, while a cash sale charges immediately. These tests
 * protect the surrounding working behavior that must survive that change:
 * the installment math, the customer guard, the credit-plan payload, and the
 * cash path. They never assert the exact rendered currency string.
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

/** Selects the credit condition and fills a valid installment plan. */
async function chooseCreditPlan(installments: string, firstDue: string) {
  await userEvent.click(screen.getByTestId("pos.condition_credit_button"));
  await userEvent.clear(screen.getByTestId("pos.installment_count_input"));
  await userEvent.type(
    screen.getByTestId("pos.installment_count_input"),
    installments,
  );
  await userEvent.type(
    screen.getByTestId("pos.first_due_date_input"),
    firstDue,
  );
}

describe("PosPage credit sale", () => {
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
    listCustomersMock.mockResolvedValue([customer()]);
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("blocks a credit sale until a registered customer is selected", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await chooseCreditPlan("3", "2026-01-15");

    // No customer chosen yet: the guard is visible and charging is blocked.
    expect(
      screen.getByTestId("pos.credit_customer_warning"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pos.charge_button")).toBeDisabled();
  });

  it("shows one installment row per requested installment", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await chooseCreditPlan("3", "2026-01-15");

    const preview = screen.getByTestId("pos.installment_preview");
    const rows = within(preview).getAllByRole("row");
    // One header row plus three installment rows.
    expect(rows).toHaveLength(4);
    expect(within(preview).getByText("1 / 3")).toBeInTheDocument();
    expect(within(preview).getByText("3 / 3")).toBeInTheDocument();
  });

  it("sends the credit condition, customer and installment plan to the backend", async () => {
    createPosSaleMock.mockResolvedValue(
      sale({ paymentCondition: PaymentCondition.credit }),
    );
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await chooseCreditPlan("3", "2026-01-15");
    await userEvent.click(screen.getByTestId("pos.customer_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Ana Pérez" }),
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    const payload = createPosSaleMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      lines: [{ partId: 1n, quantity: 1n, discount: 0n }],
      paymentCondition: PaymentCondition.credit,
      customerId: 7n,
    });
    expect(payload.creditPlan).toBeDefined();
    expect(payload.creditPlan.installmentCount).toBe(3n);
    // The first due date is carried as nanoseconds since the epoch.
    expect(payload.creditPlan.firstDueDate).toBe(
      BigInt(new Date("2026-01-15T00:00:00Z").getTime()) * 1_000_000n,
    );
  });

  it("charges a cash sale immediately without a credit plan", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    expect(createPosSaleMock.mock.calls[0][0]).toMatchObject({
      paymentCondition: PaymentCondition.cash,
      customerId: undefined,
      creditPlan: undefined,
    });
    expect(await screen.findByTestId("pos.success_state")).toBeInTheDocument();
  });

  it("rejects an out-of-range installment count", async () => {
    renderWithProviders(<PosPage />);

    await userEvent.click(await screen.findByTestId("pos.product_item.1"));
    await userEvent.click(screen.getByTestId("pos.condition_credit_button"));
    await userEvent.clear(screen.getByTestId("pos.installment_count_input"));
    await userEvent.type(
      screen.getByTestId("pos.installment_count_input"),
      "0",
    );

    expect(
      screen.getByTestId("pos.installment_count_error"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pos.charge_button")).toBeDisabled();
  });
});
