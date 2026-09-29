import { useDailyHopeMessage } from "@/hooks/use-hope";
import { colombiaDayKey } from "@/lib/format";
import type { HopeMessage } from "@/lib/types";
import { HopeMode } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the daily rotation of the Biblical-hope
 * message, the behavior the accepted change must preserve intact.
 *
 * The promise rotates by Colombia calendar day (UTC-5, no DST): the hook keys
 * its query by `colombiaDayKey` and schedules a refresh at the next Colombia
 * midnight, so a long-lived tab shows a different promise after the day flips.
 * These tests protect that contract without freezing the promise repertoire:
 *
 * - the hook reads the current promise from the backend and exposes it;
 * - the query key carries the Colombia day, which is what makes the promise
 *   rotate when the day flips rather than staying cached forever;
 * - the Colombia day boundary is 05:00 UTC, so an instant just before it still
 *   belongs to the previous day.
 */

const getDailyHopeMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { getDailyHopeMessage: getDailyHopeMessageMock },
    isFetching: false,
  }),
}));

function hopeMessage(overrides: Partial<HopeMessage> = {}): HopeMessage {
  return {
    enabled: true,
    mode: HopeMode.auto,
    text: "El Señor es mi pastor; nada me faltará.",
    citation: "Salmos 23:1",
    referenceDate: "26/09/2026",
    ...overrides,
  };
}

/** Renders the daily-hope hook and exposes its resolved promise as text. */
function DailyHopeProbe() {
  const query = useDailyHopeMessage();
  return (
    <div>
      <span data-ocid="hope.text">{query.data?.text ?? "none"}</span>
      <span data-ocid="hope.citation">{query.data?.citation ?? "none"}</span>
      <span data-ocid="hope.is_loading">{String(query.isLoading)}</span>
    </div>
  );
}

describe("daily hope rotation (characterization)", () => {
  beforeEach(() => {
    getDailyHopeMessageMock.mockReset();
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the current promise from the backend and exposes it", async () => {
    renderWithProviders(<DailyHopeProbe />);

    await waitFor(() =>
      expect(screen.getByTestId("hope.text")).toHaveTextContent(
        "El Señor es mi pastor; nada me faltará.",
      ),
    );
    expect(screen.getByTestId("hope.citation")).toHaveTextContent(
      "Salmos 23:1",
    );
    expect(getDailyHopeMessageMock).toHaveBeenCalledTimes(1);
  });

  it("keys the promise query by the Colombia calendar day", () => {
    // 2026-09-27T04:30:00Z is still 2026-09-26 in Colombia (UTC-5).
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-27T04:30:00.000Z"));

    const { queryClient } = renderWithProviders(<DailyHopeProbe />);

    // The query key carries the Colombia day, which is what makes the promise
    // rotate when the day flips rather than staying cached forever.
    const keys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);
    expect(keys).toContainEqual(["daily-hope", "2026-09-26"]);
  });

  it("flips the Colombia day at the 05:00 UTC boundary", () => {
    // 2026-09-27T04:59:00Z is still 2026-09-26 in Colombia (UTC-5).
    const beforeMidnight = new Date("2026-09-27T04:59:00.000Z");
    // 2026-09-27T05:00:00Z is the start of 2026-09-27 in Colombia.
    const afterMidnight = new Date("2026-09-27T05:00:00.000Z");

    expect(colombiaDayKey(beforeMidnight)).toBe("2026-09-26");
    expect(colombiaDayKey(afterMidnight)).toBe("2026-09-27");
  });
});
