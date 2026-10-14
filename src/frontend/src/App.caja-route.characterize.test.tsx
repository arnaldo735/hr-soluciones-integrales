import type { CompanyProfile, Shift, ShiftPage } from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  ShiftStatus,
  TaxResponsibility,
  UserRole,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the `/caja` route wiring.
 *
 * The accepted change adds a new administrable catalog of cajas y bancos and
 * reworks the shift model. The route itself must keep resolving to the real
 * Caja y Bancos screen for an administrator instead of a blank page, and must
 * stay behind the administrator guard. These tests exercise the real router and
 * route tree, so they protect the wiring between the shell, the guard and the
 * page rather than the page's internal contents, which the change may rework.
 */

const getCallerUserRoleMock = vi.fn();
const listOpenShiftsMock = vi.fn();
const listCashRegistersMock = vi.fn();
const listShiftsMock = vi.fn();
const listCashMovementsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const listUsersPageMock = vi.fn();

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
      listOpenShifts: listOpenShiftsMock,
      listCashRegisters: listCashRegistersMock,
      listShifts: listShiftsMock,
      listCashMovements: listCashMovementsMock,
      getCompanyProfile: getCompanyProfileMock,
      getBusinessSettings: getBusinessSettingsMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
      listUsersPage: listUsersPageMock,
    },
    isFetching: false,
  }),
}));

function shiftPage(items: Shift[]): ShiftPage {
  return { items, total: BigInt(items.length), offset: 0n, limit: 15n };
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

describe("App /caja route (characterization)", () => {
  beforeEach(() => {
    getCallerUserRoleMock.mockReset();
    listOpenShiftsMock.mockReset();
    listCashRegistersMock.mockReset();
    listShiftsMock.mockReset();
    listCashMovementsMock.mockReset();
    getCompanyProfileMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    listUsersPageMock.mockReset();

    getCallerUserRoleMock.mockResolvedValue(UserRole.admin);
    listOpenShiftsMock.mockResolvedValue([]);
    listCashRegistersMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 100n,
    });
    listShiftsMock.mockResolvedValue(shiftPage([]));
    listCashMovementsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 20n,
    });
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getBusinessSettingsMock.mockResolvedValue({
      name: "Taller HR Motos",
      taxId: "900.123.456-7",
      address: "Calle 45 #12-30, Bogotá",
      phone: "+57 300 000 0000",
      taxRate: 16n,
    });
    getDailyHopeMessageMock.mockResolvedValue(null);
    listUsersPageMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: 100n,
    });
    window.history.pushState({}, "", "/caja");
  });

  it("resolves /caja to the Caja y Bancos screen for an administrator", async () => {
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(await screen.findByTestId("caja.page")).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
    // The page reads the open shifts on mount, so the route reached the real
    // screen rather than a loading shell.
    expect(listOpenShiftsMock).toHaveBeenCalled();
  });

  it("blocks a mechanic from /caja before the page renders", async () => {
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("caja.page")).not.toBeInTheDocument();
    expect(listOpenShiftsMock).not.toHaveBeenCalled();
  });

  it("resolves /caja/registros to the cajas y bancos catalog for an administrator", async () => {
    window.history.pushState({}, "", "/caja/registros");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("caja.registers.page"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("access.denied_state")).not.toBeInTheDocument();
    // The catalog reads the registers on mount, so the route reached the real
    // screen rather than a loading shell.
    expect(listCashRegistersMock).toHaveBeenCalled();
  });

  it("blocks a mechanic from /caja/registros before the catalog renders", async () => {
    getCallerUserRoleMock.mockResolvedValue(UserRole.user);
    window.history.pushState({}, "", "/caja/registros");
    const { default: App } = await import("@/App");

    renderWithProviders(<App />);

    expect(
      await screen.findByTestId("access.denied_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("caja.registers.page")).not.toBeInTheDocument();
    expect(listCashRegistersMock).not.toHaveBeenCalled();
  });
});
