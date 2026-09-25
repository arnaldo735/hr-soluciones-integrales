import { useFullscreen } from "@/hooks/use-fullscreen";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted fullscreen toggle.
 *
 * The accepted change adds a fullscreen control to the header, backed by this
 * hook. These tests pin the observable contract: support detection across the
 * standard and `webkit`-prefixed APIs, entering and leaving fullscreen, and the
 * state staying accurate when the user leaves fullscreen with Escape (the
 * `fullscreenchange` event). No preference is persisted, so nothing is stored.
 */

/** Installs a fake Fullscreen API on the document and its root element. */
function installFullscreenApi() {
  const requestFullscreen = vi.fn().mockResolvedValue(undefined);
  const exitFullscreen = vi.fn().mockResolvedValue(undefined);
  const root = document.documentElement as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
  };
  const doc = document as Document & {
    exitFullscreen?: () => Promise<void>;
    fullscreenElement?: Element | null;
  };
  root.requestFullscreen = requestFullscreen;
  doc.exitFullscreen = exitFullscreen;
  doc.fullscreenElement = null;
  return {
    requestFullscreen,
    exitFullscreen,
    setFullscreenElement: (element: Element | null) => {
      doc.fullscreenElement = element;
    },
    restore: () => {
      (root as { requestFullscreen?: unknown }).requestFullscreen = undefined;
      (doc as { exitFullscreen?: unknown }).exitFullscreen = undefined;
      (doc as { fullscreenElement?: unknown }).fullscreenElement = undefined;
    },
  };
}

describe("useFullscreen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports the API as unsupported when no entry point exists", () => {
    const { result } = renderHook(() => useFullscreen());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isFullscreen).toBe(false);
  });

  it("reports support and enters fullscreen through the standard API", async () => {
    const api = installFullscreenApi();
    try {
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isFullscreen).toBe(false);

      await act(async () => {
        await result.current.toggle();
      });

      expect(api.requestFullscreen).toHaveBeenCalledTimes(1);
    } finally {
      api.restore();
    }
  });

  it("leaves fullscreen through the standard API when already active", async () => {
    const api = installFullscreenApi();
    try {
      api.setFullscreenElement(document.documentElement);
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.isFullscreen).toBe(true);

      await act(async () => {
        await result.current.toggle();
      });

      expect(api.exitFullscreen).toHaveBeenCalledTimes(1);
    } finally {
      api.restore();
    }
  });

  it("keeps the state accurate when the user leaves fullscreen with Escape", () => {
    const api = installFullscreenApi();
    try {
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.isFullscreen).toBe(false);

      // Entering fullscreen fires `fullscreenchange` with the element set.
      act(() => {
        api.setFullscreenElement(document.documentElement);
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      expect(result.current.isFullscreen).toBe(true);

      // Escape clears the element and fires the same event.
      act(() => {
        api.setFullscreenElement(null);
        document.dispatchEvent(new Event("fullscreenchange"));
      });
      expect(result.current.isFullscreen).toBe(false);
    } finally {
      api.restore();
    }
  });

  it("falls back to the webkit-prefixed API when the standard one is absent", async () => {
    const webkitRequestFullscreen = vi.fn().mockResolvedValue(undefined);
    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element | null;
    };
    root.webkitRequestFullscreen = webkitRequestFullscreen;
    doc.webkitExitFullscreen = vi.fn().mockResolvedValue(undefined);
    doc.webkitFullscreenElement = null;

    try {
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.isSupported).toBe(true);

      await act(async () => {
        await result.current.toggle();
      });

      expect(webkitRequestFullscreen).toHaveBeenCalledTimes(1);
    } finally {
      (root as { webkitRequestFullscreen?: unknown }).webkitRequestFullscreen =
        undefined;
      (doc as { webkitExitFullscreen?: unknown }).webkitExitFullscreen =
        undefined;
      (doc as { webkitFullscreenElement?: unknown }).webkitFullscreenElement =
        undefined;
    }
  });

  it("does not throw when the browser rejects the fullscreen request", async () => {
    const api = installFullscreenApi();
    api.requestFullscreen.mockRejectedValue(new Error("gesture required"));
    try {
      const { result } = renderHook(() => useFullscreen());

      await act(async () => {
        await expect(result.current.toggle()).resolves.toBeUndefined();
      });

      expect(result.current.isFullscreen).toBe(false);
    } finally {
      api.restore();
    }
  });
});
