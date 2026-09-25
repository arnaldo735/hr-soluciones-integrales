import type {
  BusinessSettings,
  CompanyProfile,
  DashboardSummary,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the operation panel's route-level contract.
 *
 * The accepted change reworks the panel's contents (company data and flow
 * shortcuts instead of the low-stock list). This test protects the invariant
 * that survives that rework: the main route resolves to the real panel instead
 * of a blank screen. It asserts only the page container, so it stays valid
 * while the panel's internal sections change.
 */

const getDashboardSummaryMock = vi.fn();
const getCallerUserRoleMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCallerUserProfileMock = vi.fn();

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
      getDashboardSummary: getDashboardSummaryMock,
      getCallerUserRole: getCallerUserRoleMock,
      getCompanyProfile: getCompanyProfileMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCallerUserProfile: getCallerUserProfileMock,
    },
    isFetching: false,
  }),
}));

function summary(): DashboardSummary {
  return {
    lowStock: [],
    activeOrders: [],
    pendingPayablesCount: 0n,
    pendingPayablesTotal: 0n,
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

describe("DashboardPage route (characterization)", () => {
  beforeEach(() => {
    getDashboardSummaryMock.mockReset();
    getCallerUserRoleMock.mockReset();
    getCompanyProfileMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCallerUserProfileMock.mockReset();
    getDashboardSummaryMock.mockResolvedValue(summary());
    getCallerUserRoleMock.mockResolvedValue(UserRole.admin);
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getBusinessSettingsMock.mockResolvedValue(businessSettings());
    getCallerUserProfileMock.mockResolvedValue({
      name: "Dueño",
      role: UserRole.admin,
      createdAt: 0n,
    });
    window.history.pushState({}, "", "/");
  });

  it("renders the operation panel at the main route instead of a blank screen", async () => {
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    // The shell renders and the main route resolves to the real panel.
    expect(await screen.findByTestId("header.home_link")).toBeInTheDocument();
    expect(await screen.findByTestId("dashboard.page")).toBeInTheDocument();
  });
});
