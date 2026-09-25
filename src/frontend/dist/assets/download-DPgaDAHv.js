class DownloadError extends Error {
  constructor(message) {
    super(message);
    this.name = "DownloadError";
  }
}
function supportsFilePicker() {
  return typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
}
function supportsMsSaveBlob() {
  return typeof navigator !== "undefined" && typeof navigator.msSaveBlob === "function";
}
function toBlob(data, mimeType) {
  if (data instanceof Blob) return data;
  if (typeof data === "string") return new Blob([data], { type: mimeType });
  if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return new Blob([copy], { type: mimeType });
  }
  return new Blob([data], { type: mimeType });
}
function isUserCancel(error) {
  return error instanceof DOMException && (error.name === "AbortError" || error.name === "NotAllowedError");
}
async function saveWithFilePicker(blob, filename) {
  if (!supportsFilePicker()) return false;
  const picker = window.showSaveFilePicker;
  const extension = filename.includes(".") ? `.${filename.split(".").pop() ?? ""}` : "";
  const mimeType = blob.type || "application/octet-stream";
  const handle = await picker({
    suggestedName: filename,
    types: extension ? [
      {
        description: "Archivo",
        accept: { [mimeType]: [extension] }
      }
    ] : void 0
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}
function saveWithAnchor(blob, filename) {
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
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
function saveWithNewTab(blob) {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    return false;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 6e4);
  return true;
}
async function downloadFile({
  filename,
  mimeType = "application/octet-stream",
  data
}) {
  const blob = toBlob(data, mimeType);
  if (supportsFilePicker()) {
    try {
      const saved = await saveWithFilePicker(blob, filename);
      if (saved) return;
    } catch (error) {
      if (isUserCancel(error)) return;
    }
  }
  if (supportsMsSaveBlob()) {
    navigator.msSaveBlob(blob, filename);
    return;
  }
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function" && typeof document !== "undefined") {
    saveWithAnchor(blob, filename);
    return;
  }
  if (typeof window !== "undefined" && typeof window.open === "function") {
    if (saveWithNewTab(blob)) return;
  }
  throw new DownloadError(
    "No se pudo guardar el archivo en este dispositivo. Intenta de nuevo."
  );
}
export {
  downloadFile as d
};
