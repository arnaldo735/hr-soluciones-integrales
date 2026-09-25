import { DownloadError, downloadFile } from "@/lib/download";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted mobile-safe download helper.
 *
 * The accepted change routes every document and export through this module so
 * the same file saves on phone, tablet and PC. These tests pin the observable
 * fallback chain the app depends on: the File System Access API when present,
 * a user cancel is not an error, the anchor + object-URL path otherwise with a
 * deferred revocation, the legacy `msSaveBlob` guard, and the data shapes the
 * helper accepts. They never assert real file bytes or touch the network.
 *
 * The iOS new-tab fallback is not exercised here: jsdom always provides
 * `document` and `URL.createObjectURL`, so the anchor path is always taken
 * before the new-tab branch. That branch is covered only by manual device use.
 */

/** Removes the File System Access API and legacy guard between tests. */
function clearBrowserDownloadApis() {
  (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker =
    undefined;
  (navigator as Navigator & { msSaveBlob?: unknown }).msSaveBlob = undefined;
}

/**
 * jsdom does not implement the object-URL API, so the helper's anchor path
 * needs it stubbed. This installs a working pair and returns a restore that
 * always leaves callable functions behind, so a deferred revocation scheduled
 * by an earlier test can never fire against `undefined`.
 */
function installObjectUrlApi() {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:download");
  const revokeObjectURL = vi.fn();
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  return {
    createObjectURL,
    revokeObjectURL,
    restore: () => {
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;
    },
  };
}

/** Captures the blob handed to `URL.createObjectURL` and the anchor click. */
function captureAnchorDownload() {
  const objectUrl = installObjectUrlApi();
  let downloadName: string | undefined;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });
  return {
    createObjectURL: objectUrl.createObjectURL,
    revokeObjectURL: objectUrl.revokeObjectURL,
    clickSpy,
    getDownloadName: () => downloadName,
    restore: () => {
      clickSpy.mockRestore();
      objectUrl.restore();
    },
  };
}

describe("downloadFile", () => {
  afterEach(async () => {
    // Let any deferred `revokeObjectURL` scheduled by the helper run while the
    // stubs are still installed, so it never fires against a torn-down URL.
    await new Promise((resolve) => setTimeout(resolve, 0));
    clearBrowserDownloadApis();
    vi.restoreAllMocks();
  });

  it("saves through the File System Access API when it is available", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const createWritable = vi.fn().mockResolvedValue({ write, close });
    const showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable });
    (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker =
      showSaveFilePicker;
    const anchor = captureAnchorDownload();

    try {
      await downloadFile({
        filename: "reporte.pdf",
        mimeType: "application/pdf",
        data: "contenido",
      });

      expect(showSaveFilePicker).toHaveBeenCalledTimes(1);
      expect(showSaveFilePicker.mock.calls[0][0]).toMatchObject({
        suggestedName: "reporte.pdf",
      });
      expect(write).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledTimes(1);
      // The picker path must not also trigger the anchor fallback.
      expect(anchor.clickSpy).not.toHaveBeenCalled();
    } finally {
      anchor.restore();
    }
  });

  it("treats a user cancel of the save dialog as a normal outcome", async () => {
    const cancel = new DOMException("cancelled", "AbortError");
    (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker =
      vi.fn().mockRejectedValue(cancel);
    const anchor = captureAnchorDownload();

    try {
      await expect(
        downloadFile({ filename: "reporte.pdf", data: "contenido" }),
      ).resolves.toBeUndefined();
      // A cancel must not fall through to another save path.
      expect(anchor.clickSpy).not.toHaveBeenCalled();
    } finally {
      anchor.restore();
    }
  });

  it("falls back to the anchor path when the picker fails for another reason", async () => {
    (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker =
      vi.fn().mockRejectedValue(new Error("picker unavailable"));
    const anchor = captureAnchorDownload();

    try {
      await downloadFile({
        filename: "inventario.xlsx",
        data: "contenido",
      });

      expect(anchor.clickSpy).toHaveBeenCalledTimes(1);
      expect(anchor.getDownloadName()).toBe("inventario.xlsx");
    } finally {
      anchor.restore();
    }
  });

  it("saves through an anchor with a download attribute and revokes the URL", async () => {
    const anchor = captureAnchorDownload();

    try {
      await downloadFile({
        filename: "cotizacion.pdf",
        mimeType: "application/pdf",
        data: "contenido",
      });

      expect(anchor.clickSpy).toHaveBeenCalledTimes(1);
      expect(anchor.getDownloadName()).toBe("cotizacion.pdf");
      const blob = anchor.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe("application/pdf");
      // The revocation is deferred to the next tick so the click can start.
      await vi.waitFor(() =>
        expect(anchor.revokeObjectURL).toHaveBeenCalledWith("blob:download"),
      );
    } finally {
      anchor.restore();
    }
  });

  it("uses the legacy msSaveBlob guard when it is present", async () => {
    const msSaveBlob = vi.fn();
    (navigator as Navigator & { msSaveBlob?: unknown }).msSaveBlob = msSaveBlob;
    const anchor = captureAnchorDownload();

    try {
      await downloadFile({ filename: "respaldo.json", data: "{}" });

      expect(msSaveBlob).toHaveBeenCalledTimes(1);
      expect(msSaveBlob.mock.calls[0][1]).toBe("respaldo.json");
      expect(anchor.clickSpy).not.toHaveBeenCalled();
    } finally {
      anchor.restore();
    }
  });

  it("rejects with a Spanish DownloadError when no save path exists", async () => {
    // No picker, no legacy guard, no object-URL anchor path and no popup: the
    // helper must surface a clear Spanish error instead of failing silently.
    const originalCreateObjectURL = URL.createObjectURL;
    const originalOpen = window.open;
    (URL as { createObjectURL?: unknown }).createObjectURL = undefined;
    (window as unknown as { open?: unknown }).open = undefined;

    try {
      await expect(
        downloadFile({ filename: "reporte.pdf", data: "contenido" }),
      ).rejects.toThrow(
        "No se pudo guardar el archivo en este dispositivo. Intenta de nuevo.",
      );
      await expect(
        downloadFile({ filename: "reporte.pdf", data: "contenido" }),
      ).rejects.toBeInstanceOf(DownloadError);
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      window.open = originalOpen;
    }
  });

  it("normalizes string, Uint8Array and Blob data into a Blob", async () => {
    const anchor = captureAnchorDownload();

    try {
      await downloadFile({
        filename: "texto.txt",
        mimeType: "text/plain",
        data: "hola",
      });
      expect(anchor.createObjectURL.mock.calls[0][0].type).toBe("text/plain");

      await downloadFile({
        filename: "binario.bin",
        mimeType: "application/octet-stream",
        data: new Uint8Array([1, 2, 3]),
      });
      expect(anchor.createObjectURL.mock.calls[1][0].type).toBe(
        "application/octet-stream",
      );

      const blob = new Blob(["x"], { type: "application/pdf" });
      await downloadFile({ filename: "doc.pdf", data: blob });
      // An existing Blob keeps its own type rather than the default.
      expect(anchor.createObjectURL.mock.calls[2][0]).toBe(blob);
    } finally {
      anchor.restore();
    }
  });
});
