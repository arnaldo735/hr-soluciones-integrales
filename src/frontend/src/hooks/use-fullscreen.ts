import { useCallback, useEffect, useState } from "react";

/** Vendor-prefixed Fullscreen API surface used by iOS Safari. */
interface WebkitFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

interface WebkitFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

/** True when the browser exposes any Fullscreen API entry point. */
function detectSupport(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as WebkitFullscreenDocument;
  const element = document.documentElement as WebkitFullscreenElement;
  return (
    typeof doc.exitFullscreen === "function" ||
    typeof doc.webkitExitFullscreen === "function" ||
    typeof element.requestFullscreen === "function" ||
    typeof element.webkitRequestFullscreen === "function"
  );
}

/** The element currently in fullscreen, across standard and prefixed APIs. */
function currentFullscreenElement(): Element | null {
  const doc = document as WebkitFullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * Fullscreen toggle backed by the Fullscreen API, with the `webkit`-prefixed
 * variants as a fallback for iOS Safari. The state reflects reality: it
 * subscribes to `fullscreenchange` (and `webkitfullscreenchange`) so leaving
 * fullscreen with Escape or the system gesture updates the control.
 *
 * When the browser does not support the API at all, `isSupported` is false and
 * the caller should not render the toggle. No preference is persisted.
 */
export function useFullscreen() {
  const [isSupported] = useState(detectSupport);
  const [isFullscreen, setIsFullscreen] = useState(
    () =>
      typeof document !== "undefined" && currentFullscreenElement() !== null,
  );

  useEffect(() => {
    if (!isSupported) return;
    const sync = () => setIsFullscreen(currentFullscreenElement() !== null);
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [isSupported]);

  const toggle = useCallback(async () => {
    if (!isSupported) return;
    const doc = document as WebkitFullscreenDocument;
    const element = document.documentElement as WebkitFullscreenElement;
    try {
      if (currentFullscreenElement() !== null) {
        if (typeof doc.exitFullscreen === "function") {
          await doc.exitFullscreen();
        } else {
          await doc.webkitExitFullscreen?.();
        }
      } else if (typeof element.requestFullscreen === "function") {
        await element.requestFullscreen();
      } else {
        await element.webkitRequestFullscreen?.();
      }
    } catch {
      // A rejected request (permissions, gesture requirements) leaves the app
      // in its normal state; the change listener keeps the button accurate.
    }
  }, [isSupported]);

  return { isSupported, isFullscreen, toggle };
}
