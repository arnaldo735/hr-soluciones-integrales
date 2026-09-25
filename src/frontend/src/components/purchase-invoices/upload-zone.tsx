import { cn } from "@/lib/utils";
import { FileText, ImageIcon, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";

/**
 * Maximum accepted size for a single invoice file: 1 MB. The backend fetches
 * the stored document in a single outcall, and the platform clamps an outcall
 * response to 1 MB, so a larger file would upload but never be readable.
 */
export const MAX_INVOICE_BYTES = 1_000_000;

/** Human-readable size limit used in copy and validation messages. */
export const MAX_INVOICE_SIZE_LABEL = "1 MB";

/** MIME types accepted by the invoice intake. */
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

/** `accept` attribute for the hidden file input. */
export const INVOICE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

/** Human-readable list of accepted formats, used in copy and errors. */
export const ACCEPTED_FORMATS_LABEL = "PDF, JPG, PNG o WEBP";

/** True when the file is a PDF or a supported image. */
export function isAcceptedInvoiceFile(file: File): boolean {
  return ACCEPTED_MIME_TYPES.includes(file.type);
}

/** Spanish validation message for a rejected file, or `null` when it is valid. */
export function validateInvoiceFile(file: File): string | null {
  if (!isAcceptedInvoiceFile(file)) {
    return `"${file.name}" no es un formato válido. Sube un archivo ${ACCEPTED_FORMATS_LABEL}.`;
  }
  if (file.size > MAX_INVOICE_BYTES) {
    return `"${file.name}" supera el tamaño máximo de ${MAX_INVOICE_SIZE_LABEL}.`;
  }
  if (file.size === 0) {
    return `"${file.name}" está vacío. Verifica el archivo e inténtalo de nuevo.`;
  }
  return null;
}

/** Longest edge, in pixels, an uploaded invoice image is downscaled to. */
const MAX_IMAGE_EDGE = 2000;

/** JPEG quality used when re-encoding a downscaled invoice image. */
const IMAGE_JPEG_QUALITY = 0.82;

/** Loads an image file into an `HTMLImageElement` for canvas re-encoding. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

/** Renders an image to a canvas and returns the encoded bytes. */
function encodeImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  mimeType: string,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, IMAGE_JPEG_QUALITY);
  });
}

/**
 * Downscales an image invoice so it fits under `MAX_INVOICE_BYTES`. Ordinary
 * phone photos are several megabytes, so they are re-encoded to JPEG at a
 * reduced resolution while staying legible for text extraction. Returns the
 * original file when it already fits or when the image cannot be processed.
 */
export async function downscaleInvoiceImage(file: File): Promise<File> {
  if (file.size <= MAX_INVOICE_BYTES) return file;
  if (file.type === "application/pdf") return file;

  try {
    const image = await loadImage(file);
    const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale =
      longestEdge > MAX_IMAGE_EDGE ? MAX_IMAGE_EDGE / longestEdge : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    // Re-encode to JPEG: it compresses photos far better than PNG/WEBP and the
    // backend only needs the pixels, not the original container.
    const blob = await encodeImage(image, width, height, "image/jpeg");
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    // A corrupt or unsupported image falls through to the size validation.
    return file;
  }
}

/**
 * Prepares a dropped or picked file for upload: images over the limit are
 * downscaled first, then the result is validated. Returns the file to upload
 * or a Spanish error message.
 */
export async function prepareInvoiceFile(
  file: File,
): Promise<{ file: File } | { error: string }> {
  const problem = validateInvoiceFile(file);
  if (problem === null) return { file };

  // Only a size problem on an image can be repaired by downscaling.
  if (isAcceptedInvoiceFile(file) && file.type !== "application/pdf") {
    const downscaled = await downscaleInvoiceImage(file);
    const remaining = validateInvoiceFile(downscaled);
    if (remaining === null) return { file: downscaled };
    return { error: remaining };
  }

  return { error: problem };
}

interface UploadZoneProps {
  /** Receives the files the user dropped or picked. */
  onFiles: (files: File[]) => void;
  /** Disables the zone while a batch is being processed. */
  disabled?: boolean;
}

/**
 * Drag-and-drop plus file-picker zone for purchase invoices. Accepts PDF and
 * JPG/PNG/WEBP files and hands the raw `File` list to the caller, which owns
 * validation feedback and the upload queue.
 */
export function UploadZone({ onFiles, disabled = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [disabled, onFiles],
  );

  return (
    <div
      data-ocid="purchase_invoices.dropzone"
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={cn(
        "surface-grid relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-smooth",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/20 hover:border-primary/50",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-md border transition-smooth",
          isDragging
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground",
        )}
      >
        <UploadCloud className="size-6" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <p className="font-display text-sm font-semibold">
          Arrastra las facturas aquí
        </p>
        <p className="text-xs text-muted-foreground">
          o selecciona los archivos desde tu equipo · {ACCEPTED_FORMATS_LABEL} ·
          máx. {MAX_INVOICE_SIZE_LABEL}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <FileText className="size-3.5" aria-hidden="true" />
          PDF
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ImageIcon className="size-3.5" aria-hidden="true" />
          Foto de la factura
        </span>
      </div>

      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        data-ocid="purchase_invoices.upload_button"
        className="mt-1 inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-4 text-sm font-medium shadow-subtle transition-smooth hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <UploadCloud className="size-4" aria-hidden="true" />
        Seleccionar archivos
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={INVOICE_ACCEPT}
        className="sr-only"
        aria-label="Seleccionar facturas de compra"
        data-ocid="purchase_invoices.file_input"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          // Allow re-selecting the same file after a failed attempt.
          event.target.value = "";
        }}
      />
    </div>
  );
}
