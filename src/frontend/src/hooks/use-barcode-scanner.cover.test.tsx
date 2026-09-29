import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import type { PartView } from "@/lib/types";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted barcode-scanner camera lifecycle.
 *
 * The accepted change fixes the camera restart loop: the mount effect depends
 * on `start`, and `start` used to change identity whenever the caller passed
 * inline `onDetected`/`onNotFound` callbacks, so every render tore the stream
 * down and acquired it again. The fix reads the latest callbacks through refs
 * so `start`/`stop` keep a stable identity and the camera is acquired once.
 *
 * These tests exercise the real hook with a stubbed `getUserMedia` and a fake
 * `BarcodeDetector`, so they observe the camera lifecycle directly: the stream
 * is requested once across re-renders, the latest callback is still invoked,
 * and the camera is released on unmount. No real camera or network is used.
 */

const findPartByCodeMock = vi.fn();

// The real `useBackend` returns a stable actor for the lifetime of the app, so
// the mock must too: a fresh actor object per render would change `resolveCode`
// (and therefore `start`) identity and restart the camera, which is a harness
// artifact rather than the behavior under test.
const stableActor = { findPartByCode: findPartByCodeMock };

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: stableActor,
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "session-token" }),
}));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 42n,
    sku: "REP-0042",
    name: "Filtro de aceite",
    category: "Motor",
    brand: "Genérico",
    unit: "unidad",
    salePrice: 25_000n,
    costPrice: 15_000n,
    lowStockThreshold: 2n,
    totalStock: 10n,
    barcode: "7701234567890",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/** A `MediaStream`-shaped stub whose tracks record their `stop` calls. */
function fakeStream() {
  const stop = vi.fn();
  return {
    stream: { getTracks: () => [{ stop }] } as unknown as MediaStream,
    stop,
  };
}

/** A `BarcodeDetector` stub that never reports a code. */
class FakeBarcodeDetector {
  static instances = 0;
  constructor(_options?: { formats?: string[] }) {
    FakeBarcodeDetector.instances += 1;
  }
  detect(): Promise<Array<{ rawValue: string }>> {
    return Promise.resolve([]);
  }
}

describe("useBarcodeScanner camera lifecycle (cover)", () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;
  let streams: Array<{ stream: MediaStream; stop: ReturnType<typeof vi.fn> }>;

  beforeEach(() => {
    findPartByCodeMock.mockReset();
    FakeBarcodeDetector.instances = 0;
    streams = [];
    getUserMediaMock = vi.fn(async () => {
      const created = fakeStream();
      streams.push(created);
      return created.stream;
    });

    // jsdom has no camera and no native detector: provide both so the camera
    // path is exercised instead of the manual fallback.
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: getUserMediaMock },
    });
    (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector =
      FakeBarcodeDetector;
    // The frame loop uses requestAnimationFrame; a no-op keeps it from
    // scheduling real frames while the test only observes acquisition.
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector =
      undefined;
  });

  it("acquires the camera once and does not restart it when callbacks change identity", async () => {
    const { rerender } = renderHook(
      ({ label }: { label: string }) =>
        useBarcodeScanner({
          // Inline callbacks: a new function identity on every render, which is
          // exactly what used to re-run the mount effect and restart the camera.
          onDetected: () => {
            void label;
          },
          onNotFound: () => {
            void label;
          },
        }),
      { initialProps: { label: "first" } },
    );

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledTimes(1));

    // Several re-renders with fresh inline callbacks must not re-acquire the
    // stream nor stop the live one.
    rerender({ label: "second" });
    rerender({ label: "third" });
    rerender({ label: "fourth" });

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledTimes(1));
    expect(streams).toHaveLength(1);
    expect(streams[0].stop).not.toHaveBeenCalled();
  });

  it("releases the camera stream on unmount", async () => {
    const { unmount } = renderHook(() =>
      useBarcodeScanner({ onDetected: vi.fn() }),
    );

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledTimes(1));
    expect(streams[0].stop).not.toHaveBeenCalled();

    unmount();

    expect(streams[0].stop).toHaveBeenCalledTimes(1);
  });

  it("invokes the latest onDetected callback after a re-render", async () => {
    findPartByCodeMock.mockResolvedValue({
      __kind__: "found",
      found: part(),
    });
    const first = vi.fn();
    const second = vi.fn();

    const { result, rerender } = renderHook(
      ({ onDetected }: { onDetected: (p: PartView, c: string) => void }) =>
        useBarcodeScanner({ onDetected }),
      { initialProps: { onDetected: first } },
    );

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledTimes(1));

    // Swap the callback, then resolve a code through manual entry.
    rerender({ onDetected: second });
    await act(async () => {
      await result.current.submitManualCode("REP-0042");
    });

    await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
    expect(second).toHaveBeenCalledWith(part(), "REP-0042");
    expect(first).not.toHaveBeenCalled();
  });

  it("reports canStart false and disables the camera when getUserMedia is absent", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useBarcodeScanner({}));

    expect(result.current.canStart).toBe(false);
    // The mount effect must not attempt to acquire a camera it cannot use.
    expect(getUserMediaMock).not.toHaveBeenCalled();
  });
});
