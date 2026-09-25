import type { CompanyProfile } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { DashboardPage } from "@/pages/DashboardPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the operation panel's loading, refresh and
 * error behavior.
 *
 * The accepted change stops already-consulted data from re-showing its loading
 * skeleton when the user switches modules. These tests protect the adjacent
 * behavior that must survive it: the panel still shows its skeleton while the
 * *first* read is in flight and replaces it with real content once the data
 * arrives, the explicit "Actualizar" action still refetches the panel's reads,
 * and a failed read still surfaces the error state with a working retry.
 *
 * They never assert that the skeleton is absent on a later visit — that is the
 * behavior the accepted change intentionally alters.
 */

const useRoleMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const listOrdersMock = vi.fn();
const listAppointmentsMock = vi.fn();
const listTechniciansMock = vi.fn();
const listPartsMock = vi.fn();
const listServicesMock = vi.fn();
const listCustomersMock = vi.fn();
const listQuotesMock = vi.fn();
const listInvoicesMock = vi.fn();
const listPosSalesMock = vi.fn();
const listPurchaseInvoicesMock = vi.fn();
const listReceivablesMock = vi.fn();
const listPayablesMock = vi.fn();
const listExpensesMock = vi.fn();
const listCommissionPaymentsMock = vi.fn();
const getAccountingSummaryMock = vi.fn();

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCompanyProfile: getCompanyProfileMock,
      listOrders: listOrdersMock,
      listAppointments: listAppointmentsMock,
      listTechnicians: listTechniciansMock,
      listParts: listPartsMock,
      listServices: listServicesMock,
      listCustomers: listCustomersMock,
      listQuotes: listQuotesMock,
      listInvoices: listInvoicesMock,
      listPosSales: listPosSalesMock,
      listPurchaseInvoices: listPurchaseInvoicesMock,
      listReceivables: listReceivablesMock,
      listPayables: listPayablesMock,
      listExpenses: listExpensesMock,
      listCommissionPayments: listCommissionPaymentsMock,
      getAccountingSummary: getAccountingSummaryMock,
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
}));

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
    address: "Calle 45 #12-30",
    city: "Bogotá",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

function page<T>(items: T[], total = BigInt(items.length)) {
  return { items, total, offset: 0n, limit: 50n };
}

describe("DashboardPage loading and refresh (characterization)", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    listOrdersMock.mockReset();
    listAppointmentsMock.mockReset();
    listTechniciansMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    listCustomersMock.mockReset();
    listQuotesMock.mockReset();
    listInvoicesMock.mockReset();
    listPosSalesMock.mockReset();
    listPurchaseInvoicesMock.mockReset();
    listReceivablesMock.mockReset();
    listPayablesMock.mockReset();
    listExpensesMock.mockReset();
    listCommissionPaymentsMock.mockReset();
    getAccountingSummaryMock.mockReset();

    useRoleMock.mockReturnValue(roleState(true));
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    listOrdersMock.mockResolvedValue(page([], 4n));
    listAppointmentsMock.mockResolvedValue([]);
    listTechniciansMock.mockResolvedValue([]);
    listPartsMock.mockResolvedValue(page([], 12n));
    listServicesMock.mockResolvedValue(page([], 7n));
    listCustomersMock.mockResolvedValue([]);
    listQuotesMock.mockResolvedValue(page([], 3n));
    listInvoicesMock.mockResolvedValue(page([], 5n));
    listPosSalesMock.mockResolvedValue(page([], 9n));
    listPurchaseInvoicesMock.mockResolvedValue(page([], 2n));
    listReceivablesMock.mockResolvedValue([]);
    listPayablesMock.mockResolvedValue([]);
    listExpensesMock.mockResolvedValue(page([], 1n));
    listCommissionPaymentsMock.mockResolvedValue([]);
    getAccountingSummaryMock.mockResolvedValue({
      to: [],
      from: [],
      expenseCount: 0n,
      invoiceCount: 6n,
      totalIncome: 0n,
      totalExpenses: 0n,
      profit: 0n,
    });
  });

  it("shows the loading skeleton while the first read is in flight, then the content", async () => {
    // The first profile read never settles until the test releases it, so the
    // panel is observed in its genuine loading state.
    let resolveProfile: ((value: CompanyProfile) => void) | undefined;
    getCompanyProfileMock.mockImplementation(
      () =>
        new Promise<CompanyProfile>((resolve) => {
          resolveProfile = resolve;
        }),
    );

    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByTestId("dashboard.company_header.loading"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.flows.loading")).toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.company_header"),
    ).not.toBeInTheDocument();

    resolveProfile?.(companyProfile());

    // Once the read resolves the skeleton is replaced by the real nameplate.
    expect(
      await screen.findByTestId("dashboard.company_header"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.company_header.loading"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.flows.loading"),
    ).not.toBeInTheDocument();
  });

  it("refetches the panel reads when the refresh action is used", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.company_header");
    const profileCalls = getCompanyProfileMock.mock.calls.length;
    const ordersCalls = listOrdersMock.mock.calls.length;

    await userEvent.click(screen.getByTestId("dashboard.refresh_button"));

    // The explicit refresh must still reach the backend for both the profile
    // and the aggregated metrics, even though the panel now caches them.
    await waitFor(() =>
      expect(getCompanyProfileMock.mock.calls.length).toBeGreaterThan(
        profileCalls,
      ),
    );
    await waitFor(() =>
      expect(listOrdersMock.mock.calls.length).toBeGreaterThan(ordersCalls),
    );
  });

  it("shows the error state with a retry when a panel read fails", async () => {
    getCompanyProfileMock.mockRejectedValue(new Error("backend caído"));
    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByTestId("dashboard.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.retry_button")).toBeInTheDocument();
    expect(
      screen.queryByTestId("dashboard.company_header"),
    ).not.toBeInTheDocument();
  });
});
