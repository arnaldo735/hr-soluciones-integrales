import { Y as createLucideIcon, k as useBackend, l as useAuth, t as reactExports, a_ as __vitePreload, j as jsxRuntimeExports, B as Button, T as TriangleAlert, K as Label, w as Input, Z as cn } from "./index-EqGEeyjs.js";
import { C as Check } from "./check-LdjEv5O-.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["line", { x1: "2", x2: "22", y1: "2", y2: "22", key: "a6p6uj" }],
  ["path", { d: "M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16", key: "qmtpty" }],
  ["path", { d: "M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5", key: "1ufyfc" }],
  ["path", { d: "M14.121 15.121A3 3 0 1 1 9.88 10.88", key: "11zox6" }]
];
const CameraOff = createLucideIcon("camera-off", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
      key: "1tc9qg"
    }
  ],
  ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
];
const Camera = createLucideIcon("camera", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "aa7l1z" }],
  ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "4qcy5o" }],
  ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "6vwrx8" }],
  ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "ioqczr" }],
  ["path", { d: "M7 12h10", key: "b7w52i" }]
];
const ScanLine = createLucideIcon("scan-line", __iconNode);
const BARCODE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "qr_code"
];
const BARCODE_FORMAT_LABELS = {
  ean_13: "EAN-13",
  ean_8: "EAN-8",
  upc_a: "UPC-A",
  upc_e: "UPC-E",
  code_128: "Code 128",
  code_39: "Code 39",
  qr_code: "QR"
};
function isBarcodeDetectorSupported() {
  if (typeof window === "undefined") return false;
  return "BarcodeDetector" in window;
}
function getBarcodeDetector() {
  if (typeof window === "undefined") return null;
  const candidate = window.BarcodeDetector;
  return typeof candidate === "function" ? candidate : null;
}
async function ensureBarcodeDetector() {
  const native = getBarcodeDetector();
  if (native) return native;
  if (typeof window === "undefined") return null;
  try {
    await __vitePreload(() => import("./polyfill-D-chnguu.js"), true ? [] : void 0);
  } catch {
    return null;
  }
  return getBarcodeDetector();
}
function hasCameraSupport() {
  var _a;
  if (typeof window === "undefined") return false;
  if (window.isSecureContext === false) return false;
  return typeof ((_a = navigator.mediaDevices) == null ? void 0 : _a.getUserMedia) === "function";
}
function useBarcodeScanner(options = {}) {
  const { onDetected, onNotFound, enabled = true } = options;
  const { actor } = useBackend();
  const { token } = useAuth();
  const videoRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const frameRef = reactExports.useRef(null);
  const detectorRef = reactExports.useRef(null);
  const lastCodeRef = reactExports.useRef(null);
  const cooldownRef = reactExports.useRef(0);
  const startingRef = reactExports.useRef(false);
  const scanningRef = reactExports.useRef(false);
  const onDetectedRef = reactExports.useRef(onDetected);
  const onNotFoundRef = reactExports.useRef(onNotFound);
  reactExports.useEffect(() => {
    onDetectedRef.current = onDetected;
    onNotFoundRef.current = onNotFound;
  }, [onDetected, onNotFound]);
  const [isSupported] = reactExports.useState(() => isBarcodeDetectorSupported());
  const [canStart] = reactExports.useState(() => hasCameraSupport());
  const [isStarting, setIsStarting] = reactExports.useState(false);
  const [isScanning, setIsScanning] = reactExports.useState(false);
  const [isResolving, setIsResolving] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [notFoundCode, setNotFoundCode] = reactExports.useState(null);
  const [lastPart, setLastPart] = reactExports.useState(null);
  const stop = reactExports.useCallback(() => {
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
  const resolveCode = reactExports.useCallback(
    async (rawCode) => {
      var _a, _b;
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
          (_a = onDetectedRef.current) == null ? void 0 : _a.call(onDetectedRef, result.found, code);
        } else {
          setLastPart(null);
          setNotFoundCode(code);
          (_b = onNotFoundRef.current) == null ? void 0 : _b.call(onNotFoundRef, code);
        }
      } catch {
        setError("No se pudo consultar el código. Inténtalo de nuevo.");
      } finally {
        setIsResolving(false);
      }
    },
    [actor, token]
  );
  const start = reactExports.useCallback(async () => {
    if (scanningRef.current || startingRef.current) return;
    if (!hasCameraSupport()) {
      setError(
        "La cámara requiere una conexión segura (HTTPS). Ingresa el código manualmente."
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
          "Este dispositivo no admite la lectura automática. Ingresa el código manualmente."
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {
        });
      }
      detectorRef.current = new Detector({ formats: [...BARCODE_FORMATS] });
      scanningRef.current = true;
      setIsScanning(true);
      const tick = async () => {
        var _a, _b;
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
          const value = (_b = (_a = codes[0]) == null ? void 0 : _a.rawValue) == null ? void 0 : _b.trim();
          const now = Date.now();
          if (value && (value !== lastCodeRef.current || now > cooldownRef.current)) {
            lastCodeRef.current = value;
            cooldownRef.current = now + 2500;
            void resolveCode(value);
          }
        } catch {
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
        "No se pudo acceder a la cámara. Revisa los permisos o ingresa el código manualmente."
      );
      stop();
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }, [resolveCode, stop]);
  const submitManualCode = reactExports.useCallback(
    async (code) => {
      await resolveCode(code);
    },
    [resolveCode]
  );
  const clearNotFound = reactExports.useCallback(() => setNotFoundCode(null), []);
  reactExports.useEffect(() => {
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
    clearNotFound
  };
}
function playSuccessTone() {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextCtor) return;
  try {
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 1180;
    gain.gain.setValueAtTime(1e-4, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(1e-4, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.onended = () => {
      void context.close().catch(() => {
      });
    };
  } catch {
  }
}
function BarcodeScanner({
  onDetected,
  onNotFound,
  ocid,
  title = "Escanear código de barras",
  hint = "Apunta la cámara al código del producto o ingrésalo manualmente.",
  className
}) {
  const [manualCode, setManualCode] = reactExports.useState("");
  const [flash, setFlash] = reactExports.useState(false);
  const flashTimer = reactExports.useRef(null);
  const scanner = useBarcodeScanner({
    onDetected: (part, code) => {
      playSuccessTone();
      setFlash(true);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 900);
      onDetected(part, code);
    },
    onNotFound
  });
  reactExports.useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);
  const submitManual = (event) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (code === "") return;
    setManualCode("");
    void scanner.submitManualCode(code);
  };
  const formatsLabel = BARCODE_FORMATS.map(
    (format) => BARCODE_FORMAT_LABELS[format] ?? format
  ).join(" · ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": ocid,
      className: cn("barcode-scanner", className),
      "aria-label": title,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "barcode-scanner-head", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-4 text-primary", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold tracking-tight", children: title })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "barcode-scanner-hint", children: hint })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": `${ocid}.viewport`,
            "data-state": scanner.isScanning ? "scanning" : scanner.error ? "error" : "idle",
            "data-flash": flash,
            className: "barcode-scanner-viewport",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "video",
                {
                  ref: scanner.videoRef,
                  "data-ocid": `${ocid}.video`,
                  className: "barcode-scanner-video",
                  autoPlay: true,
                  muted: true,
                  playsInline: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "barcode-scanner-reticle", "aria-hidden": "true" }),
              flash ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": `${ocid}.success_state`,
                  className: "barcode-scanner-flash",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-6", "aria-hidden": "true" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Producto agregado" })
                  ]
                }
              ) : null,
              !scanner.isScanning && !scanner.error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "barcode-scanner-placeholder", children: scanner.isStarting ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "data-ocid": `${ocid}.loading_state`, children: "Iniciando cámara…" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CameraOff, { className: "size-6", "aria-hidden": "true" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Cámara detenida" })
              ] }) }) : null
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "barcode-scanner-actions", children: [
          scanner.isScanning ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: scanner.stop,
              "data-ocid": `${ocid}.stop_button`,
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CameraOff, { className: "size-4", "aria-hidden": "true" }),
                "Detener cámara"
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => void scanner.start(),
              disabled: scanner.isStarting || !scanner.canStart,
              "data-ocid": `${ocid}.start_button`,
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "size-4", "aria-hidden": "true" }),
                scanner.isStarting ? "Iniciando…" : "Abrir cámara"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "barcode-scanner-formats", children: formatsLabel })
        ] }),
        !scanner.canStart ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": `${ocid}.camera_unavailable_state`,
            className: "barcode-scanner-note",
            children: "La cámara no está disponible en este dispositivo o contexto. Ingresa el código manualmente."
          }
        ) : null,
        !scanner.isSupported ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": `${ocid}.unsupported_state`,
            className: "barcode-scanner-note",
            children: "Este navegador no trae la lectura nativa; se usa el lector integrado. Si la cámara no está disponible, ingresa el código manualmente."
          }
        ) : null,
        scanner.error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": `${ocid}.error_state`,
            className: "barcode-scanner-error",
            role: "alert",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4 shrink-0", "aria-hidden": "true" }),
              scanner.error
            ]
          }
        ) : null,
        scanner.notFoundCode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": `${ocid}.not_found_state`,
            className: "barcode-scanner-error",
            role: "alert",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4 shrink-0", "aria-hidden": "true" }),
              "Producto no encontrado para el código",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: scanner.notFoundCode }),
              "."
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submitManual, className: "barcode-scanner-manual", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: `${ocid}-manual`, className: "field-label", children: "Código manual" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: `${ocid}-manual`,
                "data-ocid": `${ocid}.input`,
                value: manualCode,
                onChange: (event) => setManualCode(event.target.value),
                placeholder: "Escribe o pega el código",
                autoComplete: "off",
                inputMode: "text",
                className: "counter-scan"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                size: "sm",
                disabled: manualCode.trim() === "" || scanner.isResolving,
                "data-ocid": `${ocid}.submit_button`,
                children: scanner.isResolving ? "Buscando…" : "Buscar"
              }
            )
          ] })
        ] })
      ]
    }
  );
}
export {
  BarcodeScanner as B,
  Camera as C,
  ScanLine as S
};
