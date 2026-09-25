import type {
  BusinessSettings,
  CompanyProfile,
  PosSale,
  PosSalePage,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  PaymentCondition,
  PaymentMethod,
  TaxResponsibility,
} from "@/lib/types";
import { PosHistoryPage } from "@/pages/PosHistoryPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the POS sales history and its reprintable receipt.
 *
 * The accepted change makes the company's fiscal regime decide whether the
 * receipt shows an IVA line. These tests protect the surrounding history
 * contract (the row, the reprint action and the receipt document) and pin the
 * regime rule at the receipt seam: a responsable company shows the tax line, a
 * non-responsable one does not.
 */

const listPosSalesMock = vi.fn();
const getPosSaleMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listPosSales: listPosSalesMock,
      getPosSale: getPosSaleMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
}));

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

function page(items: PosSale[], total = items.length): PosSalePage {
  return { items, total: BigInt(total), offset: 0n, limit: 20n };
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

describe("PosHistoryPage", () => {
  beforeEach(() => {
    listPosSalesMock.mockReset();
    getPosSaleMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    listPosSalesMock.mockResolvedValue(page([sale()]));
    getPosSaleMock.mockResolvedValue(sale());
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("lists sales and opens the reprintable receipt", async () => {
    renderWithProviders(<PosHistoryPage />);

    expect(await screen.findByText("POS-0001")).toBeInTheDocument();
    expect(screen.getByText("$ 580")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("pos_history.edit_button.1"));

    expect(
      await screen.findByTestId("pos_history.receipt_dialog"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pos_history.receipt_a4")).toBeInTheDocument();
    expect(screen.getByTestId("pos_history.receipt_80mm")).toBeInTheDocument();
  });

  it("shows the tax line on the receipt for a responsable company", async () => {
    renderWithProviders(<PosHistoryPage />);

    await screen.findByText("POS-0001");
    await userEvent.click(screen.getByTestId("pos_history.edit_button.1"));

    await screen.findByTestId("pos_history.receipt_dialog");
    // The receipt is rendered twice (A4 sheet and 80 mm roll).
    expect(screen.getAllByText(/Impuesto/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$ 80").length).toBeGreaterThanOrEqual(1);
  });

  it("hides the tax line on the receipt for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ fiscalRegime: FiscalRegime.noResponsableIva }),
    );
    getPosSaleMock.mockResolvedValue(
      sale({ taxRate: 0n, tax: 0n, total: 50000n }),
    );
    renderWithProviders(<PosHistoryPage />);

    await screen.findByText("POS-0001");
    await userEvent.click(screen.getByTestId("pos_history.edit_button.1"));

    await screen.findByTestId("pos_history.receipt_dialog");
    await waitFor(() =>
      expect(screen.queryByText(/Impuesto/)).not.toBeInTheDocument(),
    );
    // The receipt still renders the subtotal and the total.
    expect(screen.getAllByText("Subtotal").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Total").length).toBeGreaterThanOrEqual(1);
  });
});
