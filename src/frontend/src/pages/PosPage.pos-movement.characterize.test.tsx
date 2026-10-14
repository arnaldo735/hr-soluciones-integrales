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
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the POS payment-method seam that the accepted
 * "a POS sale must land in the Caja/Bancos shift" change depends on.
 *
 * The accepted change makes `createPosSale` record a cash movement whose
 * account is derived from the sale's payment method (efectivo -> Caja,
 * transferencia -> Bancos). These tests deliberately do NOT assert that a
 * movement is created — that is the behavior the change adds. They protect the
 * input the backend derives the account from: the POS page must forward the
 * operator's selected method (and the matching condition) to `createPosSale`,
 * and a transfer sale must still complete and render its receipt.
 *
 * They exercise the real page against a typed local actor mock, so they pin the
 * observable wiring rather than the page's internal state.
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
    amountReceived: 29000n,
    change: 0n,
    paymentMethod: PaymentMethod.transfer,
    paymentCondition: PaymentCondition.cash,
    soldAt: 1_700_000_000_000_000_000n,
    soldBy: undefined as never,
    invoiceId: 1n,
    ...overrides,
  };
}

/** Types a term into the POS product search and picks the first result. */
async function addFirstProduct() {
  await userEvent.type(screen.getByTestId("pos.search_input"), "balata");
  await userEvent.click(await screen.findByTestId("pos.product_item.1"));
}

describe("PosPage payment-method seam (characterization)", () => {
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
    listCustomersMock.mockResolvedValue([]);
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("forwards a transfer payment method to createPosSale", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await addFirstProduct();
    // Switch the method to transferencia; the backend derives Bancos from it.
    await userEvent.click(screen.getByTestId("pos.payment_method_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Transferencia" }),
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    // The backend call is (token, input); the token is null without a session.
    expect(createPosSaleMock.mock.calls[0][0]).toBeNull();
    expect(createPosSaleMock.mock.calls[0][1]).toMatchObject({
      paymentMethod: PaymentMethod.transfer,
      paymentCondition: PaymentCondition.cash,
    });
  });

  it("forwards a cash payment method to createPosSale", async () => {
    createPosSaleMock.mockResolvedValue(
      sale({ paymentMethod: PaymentMethod.cash }),
    );
    renderWithProviders(<PosPage />);

    await addFirstProduct();
    // Efectivo is the default; the backend derives Caja from it.
    await userEvent.type(
      screen.getByTestId("pos.amount_received_input"),
      "600",
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    await waitFor(() => expect(createPosSaleMock).toHaveBeenCalledTimes(1));
    expect(createPosSaleMock.mock.calls[0][1]).toMatchObject({
      paymentMethod: PaymentMethod.cash,
      paymentCondition: PaymentCondition.cash,
    });
  });

  it("completes a transfer sale and renders its receipt", async () => {
    createPosSaleMock.mockResolvedValue(sale());
    renderWithProviders(<PosPage />);

    await addFirstProduct();
    await userEvent.click(screen.getByTestId("pos.payment_method_select"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Transferencia" }),
    );
    await userEvent.click(screen.getByTestId("pos.charge_button"));

    expect(await screen.findByTestId("pos.success_state")).toBeInTheDocument();
    expect(screen.getByTestId("pos.receipt_a4")).toBeInTheDocument();
    expect(screen.getAllByText("POS-0001").length).toBeGreaterThanOrEqual(1);
  });
});
