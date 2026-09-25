import type { CompanyProfile } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { DashboardPage } from "@/pages/DashboardPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the reworked operation panel.
 *
 * The accepted change replaces the low-stock list with a centered company
 * nameplate and role-aware flow shortcuts that carry live metrics. These tests
 * pin the accepted behavior: the company data is shown at the top, the
 * low-stock list and indicator are gone, the shortcuts are grouped by flow and
 * navigate to their module, and a mechanic does not see the administration
 * shortcuts.
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

describe("DashboardPage", () => {
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

  it("shows the company nameplate at the top with its legal data", async () => {
    renderWithProviders(<DashboardPage />);

    const header = await screen.findByTestId("dashboard.company_header");
    expect(header).toHaveTextContent("Taller HR Motos");
    expect(header).toHaveTextContent("HR SOLUCIONES INTEGRALES S.A.S.");
    expect(header).toHaveTextContent("900123456-8");
    expect(header).toHaveTextContent("+57 300 000 0000");
    expect(header).toHaveTextContent("contacto@hrsolucionesintegrales.com");
    expect(header).toHaveTextContent("Calle 45 #12-30, Bogotá");
  });

  it("no longer shows the low-stock list or its indicator", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.company_header");
    expect(screen.queryByTestId("dashboard.low_stock.empty_state")).toBeNull();
    expect(screen.queryByText(/bajo stock/i)).toBeNull();
  });

  it("groups the shortcuts by flow and shows each module's live metric", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.flow.taller");
    expect(screen.getByTestId("dashboard.flow.catalogo")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.flow.ventas")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.flow.compras")).toBeInTheDocument();
    expect(
      screen.getByTestId("dashboard.flow.administracion"),
    ).toBeInTheDocument();

    // The Taller group's first shortcut carries the live order count (4).
    const taller = within(screen.getByTestId("dashboard.flow.taller"));
    expect(taller.getByText("Órdenes de taller")).toBeInTheDocument();
    expect(taller.getByText("4")).toBeInTheDocument();
  });

  it("links each shortcut to its module", async () => {
    renderWithProviders(<DashboardPage />);

    const inventory = await screen.findByText("Inventario");
    expect(inventory.closest("a")).toHaveAttribute("href", "/inventario");
  });

  it("hides the administration shortcuts from a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.flow.taller");
    // The mechanic still sees the workshop flow...
    expect(screen.getByText("Órdenes de taller")).toBeInTheDocument();
    // ...but not the administration-only modules.
    expect(screen.queryByText("Contabilidad")).toBeNull();
    expect(screen.queryByText("Configuración")).toBeNull();
    expect(screen.queryByText("Cuentas por cobrar")).toBeNull();
    expect(
      screen.getByTestId("dashboard.admin_only_notice"),
    ).toBeInTheDocument();
  });

  it("shows the empty company state when no profile is configured", async () => {
    getCompanyProfileMock.mockResolvedValue(null);
    renderWithProviders(<DashboardPage />);

    expect(
      await screen.findByTestId("dashboard.company_header.empty_state"),
    ).toBeInTheDocument();
  });

  // --- Characterization: the nameplate's logo and flow order ----------------
  //
  // The accepted change reworks the panel's contents but keeps the centered
  // nameplate and the flow grouping. These tests protect the parts of that
  // contract the accepted behavior does not alter: the configured logo renders
  // in the header (with the initials fallback when there is none), and the flow
  // groups keep their fixed operational order.

  it("renders the configured logo in the company header", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ logoUrl: "https://cdn.example.com/logo.png" }),
    );
    renderWithProviders(<DashboardPage />);

    const header = await screen.findByTestId("dashboard.company_header");
    const logo = header.querySelector("img");
    expect(logo).not.toBeNull();
    expect(logo).toHaveAttribute("src", "https://cdn.example.com/logo.png");
  });

  it("falls back to the company initials when there is no logo", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ logoUrl: undefined }),
    );
    renderWithProviders(<DashboardPage />);

    const header = await screen.findByTestId("dashboard.company_header");
    expect(header.querySelector("img")).toBeNull();
    // "Taller HR Motos" -> "TH".
    expect(header).toHaveTextContent("TH");
  });

  it("keeps the flow groups in their fixed operational order", async () => {
    renderWithProviders(<DashboardPage />);

    await screen.findByTestId("dashboard.flow.taller");
    const section = screen.getByTestId("dashboard.flows.section");
    const groups = Array.from(
      section.querySelectorAll<HTMLElement>("[data-ocid^='dashboard.flow.']"),
    ).map((node) => node.getAttribute("data-ocid"));

    expect(groups).toEqual([
      "dashboard.flow.taller",
      "dashboard.flow.catalogo",
      "dashboard.flow.ventas",
      "dashboard.flow.compras",
      "dashboard.flow.administracion",
    ]);
  });
});
