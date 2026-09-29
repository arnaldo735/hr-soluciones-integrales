import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BARCODE_FORMATS,
  BARCODE_FORMAT_LABELS,
  useBarcodeScanner,
} from "@/hooks/use-barcode-scanner";
import type { PartView } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  ScanLine,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  /**
   * Called with the resolved product when a scanned or typed code matches a
   * catalog part. The caller adds the part to the active line.
   */
  onDetected: (part: PartView, code: string) => void;
  /**
   * Called when a code does not match any product, so the caller can react to
   * the "producto no encontrado" case. The scanner also shows the notice.
   */
  onNotFound?: (code: string) => void;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /** Optional title shown above the scanner. */
  title?: string;
  /** Optional helper text shown under the title. */
  hint?: string;
  /** Extra classes for the outer element. */
  className?: string;
}

/** Short confirmation beep played when a code resolves to a product. */
function playSuccessTone() {
  if (typeof window === "undefined") return;
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return;
  try {
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 1180;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
    oscillator.onended = () => {
      void context.close().catch(() => {
        // El contexto se cierra solo; un fallo no afecta el escaneo.
      });
    };
  } catch {
    // El audio es una mejora; nunca debe bloquear el escaneo.
  }
}

/**
 * Reusable barcode scanner. Opens the device camera and reads EAN, UPC,
 * Code128 and QR codes through the native `BarcodeDetector` API, with manual
 * code entry as the fallback when the camera or the API is unavailable.
 *
 * On a successful read it plays a short confirmation tone and flashes a green
 * confirmation; an unknown code shows a clear "producto no encontrado" notice
 * and adds nothing.
 */
export function BarcodeScanner({
  onDetected,
  onNotFound,
  ocid,
  title = "Escanear código de barras",
  hint = "Apunta la cámara al código del producto o ingrésalo manualmente.",
  className,
}: BarcodeScannerProps) {
  const [manualCode, setManualCode] = useState("");
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number | null>(null);

  const scanner = useBarcodeScanner({
    onDetected: (part, code) => {
      playSuccessTone();
      setFlash(true);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 900);
      onDetected(part, code);
    },
    onNotFound,
  });

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const submitManual = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (code === "") return;
    setManualCode("");
    void scanner.submitManualCode(code);
  };

  const formatsLabel = BARCODE_FORMATS.map(
    (format) => BARCODE_FORMAT_LABELS[format] ?? format,
  ).join(" · ");

  return (
    <section
      data-ocid={ocid}
      className={cn("barcode-scanner", className)}
      aria-label={title}
    >
      <header className="barcode-scanner-head">
        <div className="flex items-center gap-2">
          <ScanLine className="size-4 text-primary" aria-hidden="true" />
          <h3 className="font-display text-sm font-semibold tracking-tight">
            {title}
          </h3>
        </div>
        <p className="barcode-scanner-hint">{hint}</p>
      </header>

      <div
        data-ocid={`${ocid}.viewport`}
        data-state={
          scanner.isScanning ? "scanning" : scanner.error ? "error" : "idle"
        }
        data-flash={flash}
        className="barcode-scanner-viewport"
      >
        <video
          ref={scanner.videoRef}
          data-ocid={`${ocid}.video`}
          className="barcode-scanner-video"
          autoPlay
          muted
          playsInline
        />
        <div className="barcode-scanner-reticle" aria-hidden="true" />
        {flash ? (
          <div
            data-ocid={`${ocid}.success_state`}
            className="barcode-scanner-flash"
          >
            <Check className="size-6" aria-hidden="true" />
            <span>Producto agregado</span>
          </div>
        ) : null}
        {!scanner.isScanning && !scanner.error ? (
          <div className="barcode-scanner-placeholder">
            {scanner.isStarting ? (
              <span data-ocid={`${ocid}.loading_state`}>Iniciando cámara…</span>
            ) : (
              <>
                <CameraOff className="size-6" aria-hidden="true" />
                <span>Cámara detenida</span>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="barcode-scanner-actions">
        {scanner.isScanning ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={scanner.stop}
            data-ocid={`${ocid}.stop_button`}
            className="gap-1.5"
          >
            <CameraOff className="size-4" aria-hidden="true" />
            Detener cámara
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void scanner.start()}
            disabled={scanner.isStarting || !scanner.canStart}
            data-ocid={`${ocid}.start_button`}
            className="gap-1.5"
          >
            <Camera className="size-4" aria-hidden="true" />
            {scanner.isStarting ? "Iniciando…" : "Abrir cámara"}
          </Button>
        )}
        <span className="barcode-scanner-formats">{formatsLabel}</span>
      </div>

      {!scanner.canStart ? (
        <p
          data-ocid={`${ocid}.camera_unavailable_state`}
          className="barcode-scanner-note"
        >
          La cámara no está disponible en este dispositivo o contexto. Ingresa
          el código manualmente.
        </p>
      ) : null}

      {!scanner.isSupported ? (
        <p
          data-ocid={`${ocid}.unsupported_state`}
          className="barcode-scanner-note"
        >
          Este navegador no trae la lectura nativa; se usa el lector integrado.
          Si la cámara no está disponible, ingresa el código manualmente.
        </p>
      ) : null}

      {scanner.error ? (
        <p
          data-ocid={`${ocid}.error_state`}
          className="barcode-scanner-error"
          role="alert"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {scanner.error}
        </p>
      ) : null}

      {scanner.notFoundCode ? (
        <p
          data-ocid={`${ocid}.not_found_state`}
          className="barcode-scanner-error"
          role="alert"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          Producto no encontrado para el código{" "}
          <span className="data-rail">{scanner.notFoundCode}</span>.
        </p>
      ) : null}

      <form onSubmit={submitManual} className="barcode-scanner-manual">
        <Label htmlFor={`${ocid}-manual`} className="field-label">
          Código manual
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={`${ocid}-manual`}
            data-ocid={`${ocid}.input`}
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Escribe o pega el código"
            autoComplete="off"
            inputMode="text"
            className="counter-scan"
          />
          <Button
            type="submit"
            size="sm"
            disabled={manualCode.trim() === "" || scanner.isResolving}
            data-ocid={`${ocid}.submit_button`}
          >
            {scanner.isResolving ? "Buscando…" : "Buscar"}
          </Button>
        </div>
      </form>
    </section>
  );
}
