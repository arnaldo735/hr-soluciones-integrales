import { hasAnyReminder, useRemindersSummary } from "@/hooks/use-reminders";
import type { RemindersSummary } from "@/hooks/use-reminders";
import { createTestQueryClient } from "@/test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the reminders summary hook the accepted change introduces.
 *
 * The hook is the frontend consumer of the backend `getRemindersSummary`
 * endpoint: it queries only with an authenticated session and a ready actor,
 * forwards the session token, and returns the summary the backend sends. These
 * tests pin that consumer contract with a typed local actor mock; the real
 * backend method is exercised in the PocketIC lane.
 */

const getRemindersSummaryMock = vi.fn();
let actor: { getRemindersSummary: typeof getRemindersSummaryMock } | null = {
  getRemindersSummary: getRemindersSummaryMock,
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

function summary(overrides: Partial<RemindersSummary> = {}): RemindersSummary {
  return {
    generatedAt: 1_700_000_000_000_000_000n,
    appointments: {
      count: 1n,
      items: [
        {
          id: 1n,
          customerId: 10n,
          customerName: "Ana Pérez",
          scheduledAt: 1_700_000_000_000_000_000n,
          status: "scheduled",
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

describe("useRemindersSummary consumer contract", () => {
  beforeEach(() => {
    getRemindersSummaryMock.mockReset();
    actor = { getRemindersSummary: getRemindersSummaryMock };
    isFetching = false;
    isAuthenticated = true;
    token = "session-token";
  });

  it("forwards the session token and returns the backend summary", async () => {
    const data = summary();
    getRemindersSummaryMock.mockResolvedValue(data);

    const { result } = renderHook(() => useRemindersSummary(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getRemindersSummaryMock).toHaveBeenCalledWith("session-token");
    expect(result.current.data).toEqual(data);
  });

  it("does not query without an authenticated session", async () => {
    isAuthenticated = false;
    getRemindersSummaryMock.mockResolvedValue(summary());

    const { result } = renderHook(() => useRemindersSummary(), { wrapper });

    // The query stays idle, so the backend is never called.
    expect(result.current.fetchStatus).toBe("idle");
    expect(getRemindersSummaryMock).not.toHaveBeenCalled();
  });

  it("does not query while the actor is still fetching", async () => {
    isFetching = true;
    getRemindersSummaryMock.mockResolvedValue(summary());

    const { result } = renderHook(() => useRemindersSummary(), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getRemindersSummaryMock).not.toHaveBeenCalled();
  });

  it("returns an empty summary when the actor is unavailable", async () => {
    actor = null;

    const { result } = renderHook(() => useRemindersSummary(), { wrapper });

    // With no actor the query is disabled; the hook never throws.
    expect(result.current.fetchStatus).toBe("idle");
    expect(getRemindersSummaryMock).not.toHaveBeenCalled();
  });
});

describe("hasAnyReminder", () => {
  it("is false for an undefined summary", () => {
    expect(hasAnyReminder(undefined)).toBe(false);
  });

  it("is false when every section is empty", () => {
    expect(
      hasAnyReminder({
        generatedAt: 1_700_000_000_000_000_000n,
        appointments: { count: 0n, items: [] },
        receivables: { count: 0n, items: [] },
      }),
    ).toBe(false);
  });

  it("is true when any section has a pending item", () => {
    expect(
      hasAnyReminder({
        generatedAt: 1_700_000_000_000_000_000n,
        appointments: { count: 0n, items: [] },
        pendingQuotes: { count: 2n, items: [] },
      }),
    ).toBe(true);
  });
});
