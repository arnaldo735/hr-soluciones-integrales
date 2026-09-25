import { downloadContactDocumentPdf } from "@/lib/pdf";
import type { ContactDocument } from "@/lib/types";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the real PDF generation path.
 *
 * The accepted change makes the heavy document libraries (jsPDF and
 * jspdf-autotable) load only when a document is generated instead of at app
 * startup. The observable contract that must survive that rework is that
 * generating a document still produces a real, non-empty PDF and hands it to
 * the shared download helper under the expected file name.
 *
 * This test exercises the real `@/lib/pdf` module — not a mock — so a lazy
 * import that never resolves, or a broken dynamic import of the PDF libraries,
 * fails here. Only the download seam is stubbed, because jsdom cannot save a
 * file; the PDF bytes themselves are produced by the real libraries.
 */

const downloadFileMock = vi.fn();

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return {
    ...actual,
    downloadFile: (...args: unknown[]) => downloadFileMock(...args),
  };
});

function contactDocument(
  overrides: Partial<ContactDocument> = {},
): ContactDocument {
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: "CLI-1",
    name: "Ada Lovelace",
    meta: [
      { label: "Teléfono", value: "+52 555 0100" },
      { label: "Documento", value: "LOAA1815" },
    ],
    sections: [
      {
        key: "motorcycles",
        title: "Motos registradas",
        columns: ["Marca", "Modelo", "Placa"],
        rows: [["Yamaha", "FZ 2.0", "ABC12D"]],
      },
    ],
    ...overrides,
  };
}

/** The blob handed to the download helper on the most recent call. */
function lastDownloadedBlob(): Blob {
  const call = downloadFileMock.mock.calls.at(-1)?.[0] as
    | { data: Blob }
    | undefined;
  if (!call) throw new Error("downloadFile was not called");
  return call.data;
}

describe("contact document PDF generation (characterization)", () => {
  afterEach(() => {
    downloadFileMock.mockReset();
  });

  it("generates a real non-empty PDF and saves it under the ficha file name", async () => {
    downloadFileMock.mockResolvedValue(undefined);

    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos" },
      "a4",
    );

    expect(downloadFileMock).toHaveBeenCalledTimes(1);
    const options = downloadFileMock.mock.calls[0][0] as {
      filename: string;
      mimeType: string;
      data: Blob;
    };
    expect(options.filename).toBe("ficha-cliente-CLI-1.pdf");
    expect(options.mimeType).toBe("application/pdf");

    // The real jsPDF output is a non-empty PDF blob, not an empty placeholder.
    const blob = lastDownloadedBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe("application/pdf");
  });

  it("generates the 80mm tirilla variant for a receipt format", async () => {
    downloadFileMock.mockResolvedValue(undefined);

    await downloadContactDocumentPdf(
      contactDocument({ kind: "supplier", number: "PROV-9" }),
      { name: "Taller HR Motos" },
      "receipt80",
    );

    const options = downloadFileMock.mock.calls[0][0] as {
      filename: string;
      data: Blob;
    };
    expect(options.filename).toBe("ficha-proveedor-PROV-9.pdf");
    expect(options.data.size).toBeGreaterThan(0);
  });
});
