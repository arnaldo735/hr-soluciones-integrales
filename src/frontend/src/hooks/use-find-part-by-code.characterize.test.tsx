import { useFindPartByCode as useInvoicesFindPartByCode } from "@/hooks/use-invoices";
import { useFindPartByCode as useOrdersFindPartByCode } from "@/hooks/use-orders";
import { useFindPartByCode as usePosFindPartByCode } from "@/hooks/use-pos";
import { useFindPartByCode as usePurchaseInvoicesFindPartByCode } from "@/hooks/use-purchase-invoices";
import { useFindPartByCode as useQuotesFindPartByCode } from "@/hooks/use-quotes";
import type { PartView } from "@/lib/types";
import { createTestQueryClient } from "@/test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the shared code-to-product resolver the
 * barcode flows depend on.
 *
 * The accepted change reworks the camera and adds a non-native detection
 * fallback, but every flow — POS, OT, cotizaciones, compras and facturas —
 * must keep resolving a scanned or typed code through the backend
 * `findPartByCode` (which matches both the barcode and the SKU) and keep
 * mapping the typed result to a product or a "not found" outcome. These tests
 * pin that consumer contract for each flow's hook so the scanner rework cannot
 * silently change what a scan means.
 *
 * The actor is a typed local mock; no network is involved.
 */

const findPartByCodeMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { findPartByCode: findPartByCodeMock },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "session-token" }),
}));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 7n,
    sku: "REP-0007",
    name: "Bujía de encendido",
    category: "Motor",
    brand: "NGK",
    unit: "unidad",
    salePrice: 18_000n,
    costPrice: 9_000n,
    lowStockThreshold: 2n,
    totalStock: 20n,
    barcode: "7709876543210",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useFindPartByCode consumer contract (characterization)", () => {
  beforeEach(() => {
    findPartByCodeMock.mockReset();
  });

  it("POS resolves a found code to the product through findPartByCode", async () => {
    const resolved = part();
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: resolved,
    });

    const { result } = renderHook(() => usePosFindPartByCode(), { wrapper });

    await expect(result.current.mutateAsync("7709876543210")).resolves.toEqual(
      resolved,
    );
    expect(findPartByCodeMock).toHaveBeenCalledWith(
      "session-token",
      "7709876543210",
    );
  });

  it("POS maps a not-found code to null", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "notFound",
      notFound: null,
    });

    const { result } = renderHook(() => usePosFindPartByCode(), { wrapper });

    await expect(result.current.mutateAsync("NO-EXISTE")).resolves.toBeNull();
  });

  it("cotizaciones resolves a found code to the product", async () => {
    const resolved = part({ id: 8n, sku: "REP-0008" });
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: resolved,
    });

    const { result } = renderHook(() => useQuotesFindPartByCode(), { wrapper });

    await expect(result.current.mutateAsync("REP-0008")).resolves.toEqual(
      resolved,
    );
    expect(findPartByCodeMock).toHaveBeenCalledWith(
      "session-token",
      "REP-0008",
    );
  });

  it("cotizaciones maps a not-found code to null", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "notFound",
      notFound: null,
    });

    const { result } = renderHook(() => useQuotesFindPartByCode(), { wrapper });

    await expect(result.current.mutateAsync("NO-EXISTE")).resolves.toBeNull();
  });

  it("compras resolves a found code to the product", async () => {
    const resolved = part({ id: 9n, sku: "REP-0009" });
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: resolved,
    });

    const { result } = renderHook(() => usePurchaseInvoicesFindPartByCode(), {
      wrapper,
    });

    await expect(result.current.mutateAsync("REP-0009")).resolves.toEqual(
      resolved,
    );
    expect(findPartByCodeMock).toHaveBeenCalledWith(
      "session-token",
      "REP-0009",
    );
  });

  it("compras maps a not-found code to null", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "notFound",
      notFound: null,
    });

    const { result } = renderHook(() => usePurchaseInvoicesFindPartByCode(), {
      wrapper,
    });

    await expect(result.current.mutateAsync("NO-EXISTE")).resolves.toBeNull();
  });

  it("OT resolves a found code to the product and trims the code", async () => {
    const resolved = part({ id: 10n, sku: "REP-0010" });
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: resolved,
    });

    const { result } = renderHook(() => useOrdersFindPartByCode(), { wrapper });

    await expect(result.current.mutateAsync("  REP-0010  ")).resolves.toEqual(
      resolved,
    );
    expect(findPartByCodeMock).toHaveBeenCalledWith(
      "session-token",
      "REP-0010",
    );
  });

  it("OT maps a not-found code to null", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "notFound",
      notFound: null,
    });

    const { result } = renderHook(() => useOrdersFindPartByCode(), { wrapper });

    await expect(result.current.mutateAsync("NO-EXISTE")).resolves.toBeNull();
  });

  it("OT does not query the backend for an empty code", async () => {
    const { result } = renderHook(() => useOrdersFindPartByCode(), { wrapper });

    await expect(result.current.mutateAsync("   ")).resolves.toBeNull();
    expect(findPartByCodeMock).not.toHaveBeenCalled();
  });

  it("facturas exposes the typed found/notFound result unchanged", async () => {
    const resolved = part({ id: 11n, sku: "REP-0011" });
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: resolved,
    });

    const { result } = renderHook(() => useInvoicesFindPartByCode(), {
      wrapper,
    });

    await expect(result.current.mutateAsync("REP-0011")).resolves.toEqual({
      __kind__: "found",
      found: resolved,
    });
    expect(findPartByCodeMock).toHaveBeenCalledWith(
      "session-token",
      "REP-0011",
    );
  });

  it("facturas surfaces the notFound result for an unknown code", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "notFound",
      notFound: null,
    });

    const { result } = renderHook(() => useInvoicesFindPartByCode(), {
      wrapper,
    });

    await expect(result.current.mutateAsync("NO-EXISTE")).resolves.toEqual({
      __kind__: "notFound",
      notFound: null,
    });
  });
});
