import type {
  AccountingReport,
  BusinessSettings,
  CompanyProfile,
} from "@/lib/types";
import {
  DocumentType,
  ExtractionStatus,
  FiscalRegime,
  InvoiceFileKind,
  LedgerEntryKind,
  PurchaseInvoiceStatus,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the default route and the admin route guard.
 *
 * The app must render its dashboard at `/` instead of a blank screen, and the
 * `/contabilidad` route must stay behind the administrator guard. These tests
 * exercise the real router and route tree, so they protect the wiring between
 * the shell, the route guard and the page rather than the page alone.
 */

const getCallerUserRoleMock = vi.fn();
const getAccountingReportMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCallerUserProfileMock = vi.fn();
const listUsersMock = vi.fn();
const completeDriveAuthorizationMock = vi.fn();
const listSuppliersMock = vi.fn();
const listPayablesMock = vi.fn();
const listPurchaseInvoicesMock = vi.fn();
const getPurchaseInvoiceMock = vi.fn();
// The operation panel aggregates live counters from these list reads.
const listOrdersMock = vi.fn();
const listAppointmentsMock = vi.fn();
const listTechniciansMock = vi.fn();
const listPartsMock = vi.fn();
const listServicesMock = vi.fn();
const listCustomersMock = vi.fn();
const listQuotesMock = vi.fn();
const listInvoicesMock = vi.fn();
const listPosSalesMock = vi.fn();
const listReceivablesMock = vi.fn();
const listExpensesMock = vi.fn();
const listCommissionPaymentsMock = vi.fn();
const getAccountingSummaryMock = vi.fn();

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    isAuthenticated: true,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    clear: vi.fn(),
    identity: undefined,
  }),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCallerUserRole: getCallerUserRoleMock,
      getAccountingReport: getAccountingReportMock,
      getCompanyProfile: getCompanyProfileMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCallerUserProfile: getCallerUserProfileMock,
      listUsers: listUsersMock,
      completeDriveAuthorization: completeDriveAuthorizationMock,
      listSuppliers: listSuppliersMock,
      listPayables: listPayablesMock,
      listPurchaseInvoices: listPurchaseInvoicesMock,
      getPurchaseInvoice: getPurchaseInvoiceMock,
      listOrders: listOrdersMock,
      listAppointments: listAppointmentsMock,
      listTechnicians: listTechniciansMock,
      listParts: listPartsMock,
      listServices: listServicesMock,
      listCustomers: listCustomersMock,
      listQuotes: listQuotesMock,
      listInvoices: listInvoicesMock,
      listPosSales: listPosSalesMock,
      listReceivables: listReceivablesMock,
      listExpenses: listExpensesMock,
      listCommissionPayments: listCommissionPaymentsMock,
      getAccountingSummary: getAccountingSummaryMock,
    },
    isFetching: false,
  }),
}));

function page<T>(items: T[], total = BigInt(items.length)) {
  return { items, total, offset: 0n, limit: 50n };
}

function accountingReport(): AccountingReport {
  return {
    summary: {
      expenseCount: 0n,
      invoiceCount: 0n,
      totalIncome: 0n,
      totalExpenses: 0n,
      profit: 0n,
    },
    entries: [
      {
        id: 1n,
        concept: "Factura F-001",
        date: 1_700_000_000_000_000_000n,
        kind: LedgerEntryKind.income,
        category: "income",
        amount: 500000n,
      },
    ],
    byExpenseCategory: [],
    byPaymentMethod: [],
    profit: {
      parts: {
        cost: 0n,
        income: 0n,
        commission: 0n,
        margin: 0n,
        marginBps: 0n,
      },
      services: {
        cost: 0n,
        income: 0n,
        commission: 0n,
        margin: 0n,
        marginBps: 0n,
      },
      total: {
        cost: 0n,
        income: 0n,
        commission: 0n,
        margin: 0n,
        marginBps: 0n,
      },
      serviceLines: [],
    },
  };
}

function businessSettings(): BusinessSettings {
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

describe("App default route", () => {
  beforeEach(() => {
    getCallerUserRoleMock.mockReset();
    getAccountingReportMock.mockReset();
    getCompanyProfileMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCallerUserProfileMock.mockReset();
    listUsersMock.mockReset();
    completeDriveAuthorizationMock.mockReset();
    listSuppliersMock.mockReset();
    listPayablesMock.mockReset();
    listPurchaseInvoicesMock.mockReset();
    getPurchaseInvoiceMock.mockReset();
    listOrdersMock.mockReset();
    listAppointmentsMock.mockReset();
    listTechniciansMock.mockReset();
    listPartsMock.mockReset();
    listServicesMock.mockReset();
    listCustomersMock.mockReset();
    listQuotesMock.mockReset();
    listInvoicesMock.mockReset();
    listPosSalesMock.mockReset();
    listReceivablesMock.mockReset();
    listExpensesMock.mockReset();
    listCommissionPaymentsMock.mockReset();
    getAccountingSummaryMock.mockReset();
    getCallerUserRoleMock.mockResolvedValue(UserRole.admin);
    getAccountingReportMock.mockResolvedValue(accountingReport());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getBusinessSettingsMock.mockResolvedValue(businessSettings());
    getCallerUserProfileMock.mockResolvedValue({
      name: "Dueño",
      role: UserRole.admin,
      createdAt: 0n,
    });
    listUsersMock.mockResolvedValue([]);
    listSuppliersMock.mockResolvedValue([]);
    listPayablesMock.mockResolvedValue([]);
    listPurchaseInvoicesMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 20n,
    });
    getPurchaseInvoiceMock.mockResolvedValue(null);
    listOrdersMock.mockResolvedValue(page([]));
    listAppointmentsMock.mockResolvedValue([]);
    listTechniciansMock.mockResolvedValue([]);
    listPartsMock.mockResolvedValue(page([]));
    listServicesMock.mockResolvedValue(page([]));
    listCustomersMock.mockResolvedValue([]);
    listQuotesMock.mockResolvedValue(page([]));
    listInvoicesMock.mockResolvedValue(page([]));
    listPosSalesMock.mockResolvedValue(page([]));
    listReceivablesMock.mockResolvedValue([]);
    listExpensesMock.mockResolvedValue(page([]));
    listCommissionPaymentsMock.mockResolvedValue([]);
    getAccountingSummaryMock.mockResolvedValue({
      to: [],
      from: [],
      expenseCount: 0n,
      invoiceCount: 0n,
      totalIncome: 0n,
      totalExpenses: 0n,
      profit: 0n,
    });
    window.history.pushState({}, "", "/");
  });

  it("renders the dashboard at the default route instead of a blank screen", async () => {
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    // The shell renders and the dashboard route resolves to real content.
    expect(await screen.findByTestId("header.home_link")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard.page")).toBeInTheDocument();
    expect(
      await screen.findByTestId("dashboard.company_header"),
    ).toBeInTheDocument();
  });

  it("renders the accounting page at /contabilidad for an administrator", async () => {
    window.history.pushState({}, "", "/contabilidad");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(await screen.findByTestId("accounting.page")).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
  });

  it("blocks a mechanic from /contabilidad with the access-denied view", async () => {
    window.history.pushState({}, "", "/contabilidad");
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("accounting.page")).not.toBeInTheDocument();
    expect(getAccountingReportMock).not.toHaveBeenCalled();
  });

  // --- Characterization: the /empresa route stays administrator-only --------
  //
  // The accepted change reworks the company form's save gating, not who may
  // reach the page. These tests protect the route wiring: an administrator
  // reaches the real company page, and a non-administrator is stopped by the
  // guard before the page (and its profile read) ever renders.

  it("renders the company page at /empresa for an administrator", async () => {
    window.history.pushState({}, "", "/empresa");
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(await screen.findByTestId("company.page")).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
  });

  it("blocks a mechanic from /empresa before the company page renders", async () => {
    window.history.pushState({}, "", "/empresa");
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("company.page")).not.toBeInTheDocument();
    expect(getCompanyProfileMock).not.toHaveBeenCalled();
  });

  // --- Characterization: the /configuracion route stays administrator-only --
  //
  // The accepted change adds a Google Drive backup card to the settings page.
  // These tests protect the route wiring around it: an administrator reaches
  // the real settings page, and a non-administrator is stopped by the guard
  // before the page (and its settings reads) ever render.

  it("renders the settings page at /configuracion for an administrator", async () => {
    window.history.pushState({}, "", "/configuracion");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(await screen.findByTestId("settings.page")).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
    // The existing business settings section still loads on the page.
    expect(
      await screen.findByTestId("settings.business.form"),
    ).toBeInTheDocument();
  });

  it("blocks a mechanic from /configuracion before the settings page renders", async () => {
    window.history.pushState({}, "", "/configuracion");
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("settings.page")).not.toBeInTheDocument();
    expect(getBusinessSettingsMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the /connect/drive OAuth callback -----------------
  //
  // The accepted change adds the Google Drive OAuth callback at /connect/drive,
  // restricted to administrators. An administrator reaching it with a code and
  // state completes the authorization; a non-administrator is stopped by the
  // guard before the callback runs.

  it("completes the Drive authorization at /connect/drive for an administrator", async () => {
    window.history.pushState(
      {},
      "",
      "/connect/drive?code=oauth-code&state=oauth-state",
    );
    completeDriveAuthorizationMock.mockResolvedValue({
      connected: true,
      accountEmail: "dueno@example.com",
    });
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("drive_callback.page"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(completeDriveAuthorizationMock).toHaveBeenCalledWith(
        "oauth-code",
        "oauth-state",
      ),
    );
    expect(
      await screen.findByText("Google Drive conectado"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
  });

  it("blocks a mechanic from /connect/drive before the callback runs", async () => {
    window.history.pushState(
      {},
      "",
      "/connect/drive?code=oauth-code&state=oauth-state",
    );
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("drive_callback.page")).not.toBeInTheDocument();
    expect(completeDriveAuthorizationMock).not.toHaveBeenCalled();
  });

  // --- Characterization: the existing Compras destination stays reachable ---
  //
  // The accepted change adds a "Facturas de compra" section to the Compras
  // flow. These tests protect the route wiring around it: the flow's existing
  // destination (/proveedores) still resolves to the real supplier page for an
  // administrator, and a non-administrator is stopped by the guard before the
  // page (and its supplier read) ever renders.

  it("renders the suppliers page at /proveedores for an administrator", async () => {
    window.history.pushState({}, "", "/proveedores");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(await screen.findByTestId("suppliers.page")).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
  });

  it("blocks a mechanic from /proveedores before the supplier page renders", async () => {
    window.history.pushState({}, "", "/proveedores");
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("suppliers.page")).not.toBeInTheDocument();
    expect(listSuppliersMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the new purchase-invoice routes -------------------
  //
  // The accepted change adds the "Facturas de compra" section to the Compras
  // flow at /facturas-compra and its detail at /facturas-compra/$id, both
  // administrator-only. These tests exercise the real router and route tree, so
  // they protect the wiring between the shell, the guard and the pages: an
  // administrator reaches each page, and a non-administrator is stopped by the
  // guard before the page (and its invoice reads) ever render.

  it("renders the purchase-invoices page at /facturas-compra for an administrator", async () => {
    window.history.pushState({}, "", "/facturas-compra");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("purchase_invoices.page"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
  });

  it("blocks a mechanic from /facturas-compra before the page renders", async () => {
    window.history.pushState({}, "", "/facturas-compra");
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("purchase_invoices.page"),
    ).not.toBeInTheDocument();
    expect(listPurchaseInvoicesMock).not.toHaveBeenCalled();
  });

  it("renders the purchase-invoice detail at /facturas-compra/$id for an administrator", async () => {
    window.history.pushState({}, "", "/facturas-compra/10");
    getPurchaseInvoiceMock.mockResolvedValue({
      id: 10n,
      status: PurchaseInvoiceStatus.confirmed,
      extractionStatus: ExtractionStatus.extracted,
      extractionError: undefined,
      supplierId: 1n,
      supplierName: "Repuestos El Motor",
      invoiceNumber: "FE-10245",
      invoiceDate: 1_700_000_000_000_000_000n,
      file: {
        objectId: "!caf!sha256:abc",
        fileName: "factura.pdf",
        mimeType: "application/pdf",
        sizeBytes: 12345n,
        kind: InvoiceFileKind.pdf,
        uploadedAt: 1_700_000_000_000_000_000n,
      },
      lines: [],
      createdAt: 1_700_000_000_000_000_000n,
      updatedAt: 1_700_000_000_000_000_000n,
      confirmedAt: 1_700_000_000_000_000_000n,
      confirmedBy: undefined,
    });
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("purchase_invoice_detail.page"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(getPurchaseInvoiceMock).toHaveBeenCalledWith(10n),
    );
  });

  it("blocks a mechanic from /facturas-compra/$id before the detail renders", async () => {
    window.history.pushState({}, "", "/facturas-compra/10");
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("purchase_invoice_detail.page"),
    ).not.toBeInTheDocument();
    expect(getPurchaseInvoiceMock).not.toHaveBeenCalled();
  });
});
