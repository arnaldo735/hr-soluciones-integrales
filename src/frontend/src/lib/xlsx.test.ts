import type { CsvRow } from "@/lib/types";
import { downloadXlsx, isXlsxFile, readSpreadsheet } from "@/lib/xlsx";
import { corruptXlsxFile, readXlsxBlob, xlsxFile } from "@/test/helpers";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the shared Excel helper module.
 *
 * `downloadXlsx` is the single export path every catalog uses, and
 * `readSpreadsheet` is the single import path. These tests pin the observable
 * contract the pages rely on: real typed cells (numbers as numbers, text as
 * text), the `.xlsx` extension check, first-sheet/first-row-as-header reading,
 * and the Spanish errors for a corrupt or empty workbook.
 */

/** Captures the blob handed to `URL.createObjectURL` and the anchor download. */
function captureDownload() {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:xlsx");
  const revokeObjectURL = vi.fn();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  let downloadName: string | undefined;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });
  return {
    createObjectURL,
    revokeObjectURL,
    clickSpy,
    getDownloadName: () => downloadName,
    restore: () => {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    },
  };
}

describe("xlsx helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects the .xlsx extension case-insensitively", () => {
    expect(isXlsxFile(new File([], "inventario.xlsx"))).toBe(true);
    expect(isXlsxFile(new File([], "INVENTARIO.XLSX"))).toBe(true);
    expect(isXlsxFile(new File([], "inventario.csv"))).toBe(false);
    expect(isXlsxFile(new File([], "inventario"))).toBe(false);
  });

  it("writes a real .xlsx workbook with the given headers and rows", async () => {
    const capture = captureDownload();
    try {
      await downloadXlsx(
        "inventario",
        "Inventario",
        ["sku", "nombre"],
        [{ sku: "REP-0001", nombre: "Balata de freno" }],
      );

      expect(capture.clickSpy).toHaveBeenCalledTimes(1);
      expect(capture.getDownloadName()).toBe("inventario.xlsx");
      // The accepted mobile-safe download helper revokes the object URL on the
      // next tick so the click has time to start the download, so the
      // revocation is awaited rather than asserted synchronously.
      await vi.waitFor(() =>
        expect(capture.revokeObjectURL).toHaveBeenCalledWith("blob:xlsx"),
      );

      const blob = capture.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toEqual(["sku", "nombre"]);
      expect(sheet.rows).toEqual([["REP-0001", "Balata de freno"]]);
    } finally {
      capture.restore();
    }
  });

  it("writes numeric-looking values as real numbers and identifiers as text", async () => {
    const capture = captureDownload();
    try {
      await downloadXlsx(
        "datos",
        "Datos",
        ["sku", "cantidad", "precio"],
        [
          { sku: "REP-0001", cantidad: "12", precio: "25000" },
          { sku: "REP-0002", cantidad: "0", precio: "0" },
        ],
      );

      const blob = capture.createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      // The numeric cells are numbers, not strings, so Excel can sum them.
      expect(sheet.rows[0]).toEqual(["REP-0001", 12, 25000]);
      expect(sheet.rows[1]).toEqual(["REP-0002", 0, 0]);
      expect(typeof sheet.rows[0][1]).toBe("number");
      expect(typeof sheet.rows[0][0]).toBe("string");
    } finally {
      capture.restore();
    }
  });

  it("keeps a grouped-thousands string as text instead of misreading it as a decimal", async () => {
    const capture = captureDownload();
    try {
      // "1.234" is ambiguous: es-CO thousands grouping or a decimal. It must
      // stay text rather than silently becoming 1.234.
      await downloadXlsx("datos", "Datos", ["valor"], [{ valor: "1.234" }]);

      const blob = capture.createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.rows[0][0]).toBe("1.234");
      expect(typeof sheet.rows[0][0]).toBe("string");
    } finally {
      capture.restore();
    }
  });

  it("writes a blank cell as blank rather than the string 'null'", async () => {
    const capture = captureDownload();
    try {
      await downloadXlsx(
        "datos",
        "Datos",
        ["sku", "marca"],
        [{ sku: "REP-0001", marca: "" }],
      );

      const blob = capture.createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.rows[0][0]).toBe("REP-0001");
      expect(sheet.rows[0][1]).toBeNull();
    } finally {
      capture.restore();
    }
  });

  it("reads the first sheet of an .xlsx file with the first row as headers", async () => {
    const file = await xlsxFile(
      ["sku", "nombre", "existencia"],
      [
        ["REP-0100", "Filtro de aire", 4],
        ["REP-0101", "Balata de freno", 2],
      ],
    );

    const rows = await readSpreadsheet(file, () => {
      throw new Error("CSV parser must not run for an .xlsx file");
    });

    expect(rows).toEqual<CsvRow[]>([
      { sku: "REP-0100", nombre: "Filtro de aire", existencia: "4" },
      { sku: "REP-0101", nombre: "Balata de freno", existencia: "2" },
    ]);
  });

  it("parses a .csv file through the injected CSV parser", async () => {
    const contents = "sku,nombre\nREP-0100,Filtro de aire";
    const file = new File([contents], "inventario.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(contents),
    });
    const parseCsv = vi.fn(() => [
      { sku: "REP-0100", nombre: "Filtro de aire" },
    ]);

    const rows = await readSpreadsheet(file, parseCsv);

    expect(parseCsv).toHaveBeenCalledWith(contents);
    expect(rows).toEqual([{ sku: "REP-0100", nombre: "Filtro de aire" }]);
  });

  it("throws a Spanish error for a corrupt .xlsx file", async () => {
    await expect(readSpreadsheet(corruptXlsxFile(), () => [])).rejects.toThrow(
      "No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido.",
    );
  });

  it("throws a Spanish error for an .xlsx file with no data rows", async () => {
    const file = await xlsxFile(["sku", "nombre"], []);
    await expect(readSpreadsheet(file, () => [])).rejects.toThrow(
      "El archivo no contiene filas con encabezados reconocibles.",
    );
  });

  it("throws a Spanish error when the CSV parser finds no rows", async () => {
    const contents = "sku,nombre";
    const file = new File([contents], "inventario.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(contents),
    });

    await expect(readSpreadsheet(file, () => [])).rejects.toThrow(
      "El archivo no contiene filas con encabezados reconocibles.",
    );
  });
});
