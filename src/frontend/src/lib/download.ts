/**
 * Shared, mobile-safe file download helper.
 *
 * Desktop browsers accept a programmatic `<a download>` click on a `blob:` URL,
 * but mobile Safari ignores the `download` attribute and Android Chrome can
 * open a blank tab instead of saving. This module centralizes the fallback
 * chain so every document and export in the app saves the same way on phone,
 * tablet and PC:
 *
 * 1. File System Access API (`showSaveFilePicker`) when available — a real
 *    "save file" experience on Android Chrome and desktop.
 * 2. Anchor click with `download` + `URL.createObjectURL`, plus the legacy
 *    `navigator.msSaveBlob` guard when trivially present.
 * 3. iOS Safari, where neither exists, opens the blob in a new tab so the user
 *    can use the share sheet to save it — without leaving a blank tab behind
 *    when the popup is blocked.
 *
 * The helper is safe in jsdom: it never throws at import time and degrades to
 * the anchor path when the browser APIs are missing.
 */

/** Data accepted by {@link downloadFile}. */
export type DownloadData = Blob | Uint8Array | ArrayBuffer | string;

/** Options for {@link downloadFile}. */
export interface DownloadFileOptions {
  /** Suggested file name, including its extension. */
  filename: string;
  /** MIME type used when the data is not already a Blob. */
  mimeType?: string;
  /** The file contents. */
  data: DownloadData;
}

/** Error thrown when a download genuinely fails (not on user cancel). */
export class DownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DownloadError";
  }
}

/** True when the File System Access API is usable in this browser. */
function supportsFilePicker(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as Window & { showSaveFilePicker?: unknown })
      .showSaveFilePicker === "function"
  );
}

/** True when the legacy IE/Edge `msSaveBlob` guard is available. */
function supportsMsSaveBlob(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { msSaveBlob?: unknown }).msSaveBlob ===
      "function"
  );
}

/** Normalizes the accepted data shapes into a Blob. */
function toBlob(data: DownloadData, mimeType: string): Blob {
  if (data instanceof Blob) return data;
  if (typeof data === "string") return new Blob([data], { type: mimeType });
  if (data instanceof Uint8Array) {
    // Copy into a fresh ArrayBuffer so the Blob never aliases a larger buffer.
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return new Blob([copy], { type: mimeType });
  }
  return new Blob([data], { type: mimeType });
}

/** True when the error is the user dismissing the save dialog. */
function isUserCancel(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "NotAllowedError")
  );
}

/** Saves through the File System Access API. Returns false when unavailable. */
async function saveWithFilePicker(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  if (!supportsFilePicker()) return false;
  const picker = (
    window as unknown as {
      showSaveFilePicker: (options: {
        suggestedName: string;
        types?: Array<{
          description: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<{
        createWritable: () => Promise<{
          write: (data: Blob) => Promise<void>;
          close: () => Promise<void>;
        }>;
      }>;
    }
  ).showSaveFilePicker;

  const extension = filename.includes(".")
    ? `.${filename.split(".").pop() ?? ""}`
    : "";
  const mimeType = blob.type || "application/octet-stream";
  const handle = await picker({
    suggestedName: filename,
    types: extension
      ? [
          {
            description: "Archivo",
            accept: { [mimeType]: [extension] },
          },
        ]
      : undefined,
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

/** Saves through an anchor click, revoking the object URL afterwards. */
function saveWithAnchor(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // Revoke on the next tick so the click has time to start the download.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Opens the blob in a new tab so iOS Safari users can save it through the
 * share sheet. Returns false when the popup was blocked, so the caller can
 * surface a clear error instead of leaving a blank tab behind.
 */
function saveWithNewTab(blob: Blob): boolean {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    return false;
  }
  // The new tab owns the URL now; revoke it once the tab has had time to load.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

/**
 * Saves `data` to the user's device under `filename`.
 *
 * Resolves when the file was handed to the browser (or the user cancelled the
 * save dialog — a cancel is not an error). Rejects with a {@link DownloadError}
 * carrying a Spanish message when the download genuinely fails.
 */
export async function downloadFile({
  filename,
  mimeType = "application/octet-stream",
  data,
}: DownloadFileOptions): Promise<void> {
  const blob = toBlob(data, mimeType);

  // 1. File System Access API — the best experience where it exists.
  if (supportsFilePicker()) {
    try {
      const saved = await saveWithFilePicker(blob, filename);
      if (saved) return;
    } catch (error) {
      // A user cancel is a normal outcome, not a failure.
      if (isUserCancel(error)) return;
      // Any other picker failure falls through to the anchor path.
    }
  }

  // 2. Legacy IE/Edge guard, only when trivially available.
  if (supportsMsSaveBlob()) {
    (
      navigator as Navigator & {
        msSaveBlob: (blob: Blob, filename: string) => void;
      }
    ).msSaveBlob(blob, filename);
    return;
  }

  // 3. Anchor click with a download attribute.
  if (
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function" &&
    typeof document !== "undefined"
  ) {
    saveWithAnchor(blob, filename);
    return;
  }

  // 4. iOS Safari fallback: open the blob so the share sheet can save it.
  if (typeof window !== "undefined" && typeof window.open === "function") {
    if (saveWithNewTab(blob)) return;
  }

  throw new DownloadError(
    "No se pudo guardar el archivo en este dispositivo. Intenta de nuevo.",
  );
}
