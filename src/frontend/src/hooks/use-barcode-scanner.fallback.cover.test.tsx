import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted non-native detection fallback.
 *
 * The accepted change makes the camera path work on browsers without the
 * native `BarcodeDetector` API (iOS Safari, Firefox) by loading the
 * ZXing-backed polyfill. This test exercises the real hook with a stubbed
 * `getUserMedia` and a mocked polyfill module that registers
 * `window.BarcodeDetector` as a side effect, so it observes the fallback
 * actually being loaded and the camera starting without the native API.
 *
 * The polyfill module is mocked because the real one is browser-oriented and
 * heavy; the mock preserves the one behavior the hook depends on — registering
 * `window.BarcodeDetector` on import. No camera or network is involved.
 */

const findPartByCodeMock = vi.fn();
const stableActor = { findPartByCode: findPartByCodeMock };

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({ actor: stableActor, isFetching: false }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "session-token" }),
}));

// Records that the fallback module was loaded and registers the detector the
// hook then picks up through `getBarcodeDetector()`.
const polyfillLoadMock = vi.fn();
vi.mock("barcode-detector/polyfill", () => {
  polyfillLoadMock();
  class PolyfillBarcodeDetector {
    detect(): Promise<Array<{ rawValue: string }>> {
      return Promise.resolve([]);
    }
  }
  (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector =
    PolyfillBarcodeDetector;
  return {};
});

describe("useBarcodeScanner non-native fallback (cover)", () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findPartByCodeMock.mockReset();
    polyfillLoadMock.mockClear();
    getUserMediaMock = vi.fn(async () => ({
      getTracks: () => [{ stop: vi.fn() }],
    }));

    // A camera exists, but the native detection API does not: the hook must
    // load the polyfill instead of giving up.
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: getUserMediaMock },
    });
    (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector =
      undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  it("loads the polyfill and starts the camera without the native API", async () => {
    const { result } = renderHook(() => useBarcodeScanner({}));

    await waitFor(() => expect(getUserMediaMock).toHaveBeenCalledTimes(1));

    // The fallback module was loaded and the camera is live.
    expect(polyfillLoadMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isScanning).toBe(true));
    expect(result.current.error).toBeNull();
  });
});
