import {
  DASHBOARD_ALERTS_QUERY_KEY,
  useDashboardAlerts,
} from "@/hooks/use-dashboard-alerts";
import type { DashboardAlertsSummary } from "@/hooks/use-dashboard-alerts";
import { createTestQueryClient } from "@/test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the operation panel's alert data source.
 *
 * The accepted change opens each alert's records in a modal inside the panel
 * instead of navigating to the module route. The modal reads the section's
 * `items` from this hook, so the hook's consumer contract must survive the
 * rework: it queries only with an authenticated session and a ready actor,
 * forwards the session token, and returns the summary — including the item
 * lists — exactly as the backend sends it.
 *
 * The backend is mocked here, so this file proves the frontend consumer
 * contract only. The real `getDashboardAlerts` aggregation is exercised in the
 * PocketIC lane.
 */

const getDashboardAlertsMock = vi.fn();
let actor: { getDashboardAlerts: typeof getDashboardAlertsMock } | null = {
  getDashboardAlerts: getDashboardAlertsMock,
};
let isFetching = false;
let isAuthenticated = true;
let token: string | null = "session-token";

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({ actor, isFetching }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token, isAuthenticated }),
}));

function summary(
  overrides: Partial<DashboardAlertsSummary> = {},
): DashboardAlertsSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    unapprovedOrders: {
      count: 2n,
      items: [
        {
          id: 4n,
          orderNumber: "OT-0001",
          customerName: "Ana Pérez",
          plate: "ABC12D",
        },
      ],
    },
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

describe("useDashboardAlerts consumer contract", () => {
  beforeEach(() => {
    getDashboardAlertsMock.mockReset();
    actor = { getDashboardAlerts: getDashboardAlertsMock };
    isFetching = false;
    isAuthenticated = true;
    token = "session-token";
  });

  it("forwards the session token and returns the summary with its item lists", async () => {
    const data = summary();
    getDashboardAlertsMock.mockResolvedValue(data);

    const { result } = renderHook(() => useDashboardAlerts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getDashboardAlertsMock).toHaveBeenCalledWith("session-token");
    expect(result.current.data).toEqual(data);
    // The modal's record list depends on the section items surviving the
    // query layer, not just the counts.
    expect(result.current.data?.unapprovedOrders?.items).toHaveLength(1);
  });

  it("uses the stable dashboard-alerts query key", () => {
    expect(DASHBOARD_ALERTS_QUERY_KEY).toEqual(["dashboard-alerts"]);
  });

  it("does not query without an authenticated session", async () => {
    isAuthenticated = false;
    getDashboardAlertsMock.mockResolvedValue(summary());

    const { result } = renderHook(() => useDashboardAlerts(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getDashboardAlertsMock).not.toHaveBeenCalled();
  });

  it("does not query while the actor is still fetching", async () => {
    isFetching = true;
    getDashboardAlertsMock.mockResolvedValue(summary());

    const { result } = renderHook(() => useDashboardAlerts(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getDashboardAlertsMock).not.toHaveBeenCalled();
  });

  it("does not query when the actor is unavailable", async () => {
    actor = null;

    const { result } = renderHook(() => useDashboardAlerts(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getDashboardAlertsMock).not.toHaveBeenCalled();
  });
});
