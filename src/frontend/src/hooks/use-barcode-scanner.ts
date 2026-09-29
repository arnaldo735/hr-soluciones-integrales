import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type { PartView } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The subset of the native `BarcodeDetector` API this hook relies on. The API
 * is not in the TypeScript DOM lib yet, so it is declared locally instead of
 * pulling a dependency.
 */
interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

/** Barcode formats the scanner asks the detector for. */
export const BARCODE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "qr_code",
] as const;

/** Spanish label for each supported format, shown in the scanner UI. */
export const BARCODE_FORMAT_LABELS: Record<string, string> = {
  ean_13: "EAN-13",
  ean_8: "EAN-8",
  upc_a: "UPC-A",
  upc_e: "UPC-E",
  code_128: "Code 128",
  code_39: "Code 39",
  qr_code: "QR",
};

/**
 * True when the browser exposes the native `BarcodeDetector` API. The scanner
 * also works without it through the ZXing polyfill, so this only reports the
 * native capability and never gates the camera.
 */
export function isBarcodeDetectorSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "BarcodeDetector" in window;
}

/** Resolves the `BarcodeDetector` constructor, or `null` when absent. */
function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as unknown as { BarcodeDetector?: unknown })
    .BarcodeDetector;
  return typeof candidate === "function"
    ? (candidate as BarcodeDetectorConstructor)
    : null;
}

/**
 * Loads the ZXing-backed `BarcodeDetector` polyfill on browsers that lack the
 * native API (iOS Safari, Firefox). The module registers `window.BarcodeDetector`
 * as a side effect, so the scanner can run on virtually every device. A failed
 * load leaves the native path untouched and the component falls back to manual
 * entry.
 */
async function ensureBarcodeDetector(): Promise<BarcodeDetectorConstructor | null> {
  const native = getBarcodeDetector();
  if (native) return native;
  if (typeof window === "undefined") return null;
  try {
    await import("barcode-detector/polyfill");
  } catch {
    return null;
  }
  return getBarcodeDetector();
}

/** True when the page runs in a secure context where `getUserMedia` exists. */
function hasCameraSupport(): boolean {
  if (typeof window === "undefined") return false;
  if (window.isSecureContext === false) return false;
  return typeof navigator.mediaDevices?.getUserMedia === "function";
}

/** Outcome of resolving a scanned code against the parts catalog. */
export type BarcodeResolution =
  | { status: "found"; part: PartView }
  | { status: "notFound"; code: string };

export interface UseBarcodeScannerOptions {
  /**
   * Called with the resolved product when a scanned or typed code matches a
   * catalog part. The caller adds the part to the active line.
   */
  onDetected?: (part: PartView, code: string) => void;
  /**
   * Called when a code does not match any product, so the caller can show the
   * "producto no encontrado" notice. The hook also exposes `notFoundCode`.
   */
  onNotFound?: (code: string) => void;
  /** When false the camera is not started. Defaults to true. */
  enabled?: boolean;
}

export interface UseBarcodeScannerResult {
  /** True when the native `BarcodeDetector` API is available. */
  isSupported: boolean;
  /** True when the device can open a camera stream in this context. */
  canStart: boolean;
  /** True while the camera stream is being acquired. */
  isStarting: boolean;
  /** True once the camera stream is live and being scanned. */
  isScanning: boolean;
  /** Spanish error message when the camera cannot be used, else `null`. */
  error: string | null;
  /** The last code that did not match any product, else `null`. */
  notFoundCode: string | null;
  /** The last product resolved from a code, else `null`. */
  lastPart: PartView | null;
  /** True while a code is being resolved against the backend. */
  isResolving: boolean;
  /** Attach to the `<video>` element that shows the camera feed. */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Starts the camera and begins scanning. */
  start: () => Promise<void>;
  /** Stops the camera and releases the stream. */
  stop: () => void;
  /** Resolves a manually typed code against the catalog. */
  submitManualCode: (code: string) => Promise<void>;
  /** Clears the "producto no encontrado" notice. */
  clearNotFound: () => void;
}

/**
 * Encapsulates camera access, the scan lifecycle and code-to-product
 * resolution for the shared `BarcodeScanner` component.
 *
 * Uses the native `BarcodeDetector` API when available and transparently loads
 * the ZXing-backed polyfill otherwise, so the camera path works on browsers
 * without the native API. Resolution goes through the backend `findPartByCode`,
 * which matches both the barcode and the SKU.
 */
export function useBarcodeScanner(
  options: UseBarcodeScannerOptions = {},
): UseBarcodeScannerResult {
  const { onDetected, onNotFound, enabled = true } = options;
  const { actor } = useBackend();
  const { token } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastCodeRef = useRef<string | null>(null);
  const cooldownRef = useRef<number>(0);
  // Guards against overlapping start() calls (mount effect + user click) so the
  // camera is never acquired twice and never enters a start/stop loop.
  const startingRef = useRef(false);
  // Mirrors `isScanning` for the callbacks, so `start`/`stop` keep a stable
  // identity and the mount effect never re-runs on a scan-state change.
  const scanningRef = useRef(false);
  // Latest callbacks, read through refs so `resolveCode` (and therefore
  // `start`) keeps a stable identity even when callers pass inline functions.
  // Without this the mount effect would re-run on every render and restart the
  // camera in a loop.
  const onDetectedRef = useRef(onDetected);
  const onNotFoundRef = useRef(onNotFound);
  useEffect(() => {
    onDetectedRef.current = onDetected;
    onNotFoundRef.current = onNotFound;
  }, [onDetected, onNotFound]);

  const [isSupported] = useState(() => isBarcodeDetectorSupported());
  const [canStart] = useState(() => hasCameraSupport());
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [lastPart, setLastPart] = useState<PartView | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    scanningRef.current = false;
    setIsScanning(false);
  }, []);

  const resolveCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (code === "") return;
      if (!actor) {
        setError("El sistema aún no está listo. Inténtalo de nuevo.");
        return;
      }
      setIsResolving(true);
      setError(null);
      try {
        const result = await actor.findPartByCode(token, code);
        if (result.__kind__ === "found") {
          setNotFoundCode(null);
          setLastPart(result.found);
          onDetectedRef.current?.(result.found, code);
        } else {
          setLastPart(null);
          setNotFoundCode(code);
          onNotFoundRef.current?.(code);
        }
      } catch {
        setError("No se pudo consultar el código. Inténtalo de nuevo.");
      } finally {
        setIsResolving(false);
      }
    },
    [actor, token],
  );

  const start = useCallback(async () => {
    if (scanningRef.current || startingRef.current) return;
    if (!hasCameraSupport()) {
      setError(
        "La cámara requiere una conexión segura (HTTPS). Ingresa el código manualmente.",
      );
      return;
    }
    startingRef.current = true;
    setIsStarting(true);
    setError(null);
    try {
      const Detector = await ensureBarcodeDetector();
      if (!Detector) {
        setError(
          "Este dispositivo no admite la lectura automática. Ingresa el código manualmente.",
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {
          // Autoplay may be blocked; the frame loop still reads the stream.
        });
      }
      detectorRef.current = new Detector({ formats: [...BARCODE_FORMATS] });
      scanningRef.current = true;
      setIsScanning(true);

      const tick = async () => {
        const activeVideo = videoRef.current;
        const detector = detectorRef.current;
        if (!activeVideo || !detector || activeVideo.readyState < 2) {
          frameRef.current = requestAnimationFrame(() => {
            void tick();
          });
          return;
        }
        try {
          const codes = await detector.detect(activeVideo);
          const value = codes[0]?.rawValue?.trim();
          const now = Date.now();
          if (
            value &&
            (value !== lastCodeRef.current || now > cooldownRef.current)
          ) {
            lastCodeRef.current = value;
            cooldownRef.current = now + 2500;
            void resolveCode(value);
          }
        } catch {
          // A transient detect failure must not stop the scan loop.
        }
        frameRef.current = requestAnimationFrame(() => {
          void tick();
        });
      };
      frameRef.current = requestAnimationFrame(() => {
        void tick();
      });
    } catch {
      setError(
        "No se pudo acceder a la cámara. Revisa los permisos o ingresa el código manualmente.",
      );
      stop();
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }, [resolveCode, stop]);

  const submitManualCode = useCallback(
    async (code: string) => {
      await resolveCode(code);
    },
    [resolveCode],
  );

  const clearNotFound = useCallback(() => setNotFoundCode(null), []);

  // Start on mount when enabled; always release the camera on unmount so the
  // device indicator never stays on. `start` and `stop` are stable, so this
  // effect runs once per `enabled` change and never restarts the camera.
  useEffect(() => {
    if (enabled) {
      void start();
    }
    return () => stop();
  }, [enabled, start, stop]);

  return {
    isSupported,
    canStart,
    isStarting,
    isScanning,
    error,
    notFoundCode,
    lastPart,
    isResolving,
    videoRef,
    start,
    stop,
    submitManualCode,
    clearNotFound,
  };
}
