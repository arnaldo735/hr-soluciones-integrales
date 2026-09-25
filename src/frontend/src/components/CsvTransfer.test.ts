import { parseCsv, toCsv } from "@/components/CsvTransfer";
import type { CsvRow } from "@/lib/types";
import { describe, expect, it } from "vitest";

/**
 * Characterization: the CSV text contract the service import flow depends on.
 *
 * `CsvTransfer` hands `parseCsv` to `readSpreadsheet`, so every `.csv` import
 * (services included) is parsed here. The accepted change locks the `codigo`
 * field in the import preview while the other fields stay editable; it does not
 * touch how the file is read. These tests pin the parsing and serialization
 * rules that must survive it: the first line is the header, quoted fields keep
 * their commas and embedded quotes, blank lines are ignored, and export quotes
 * only the cells that need it.
 */

describe("parseCsv", () => {
  it("keys each row by the header line", () => {
    const rows = parseCsv(
      [
        "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
        "SRV-0100,Frenos,,Frenos,50000,45,1",
      ].join("\n"),
    );

    expect(rows).toEqual<CsvRow[]>([
      {
        codigo: "SRV-0100",
        nombre: "Frenos",
        descripcion: "",
        categoria: "Frenos",
        tarifa: "50000",
        duracion_min: "45",
        activo: "1",
      },
    ]);
  });

  it("keeps a comma inside a quoted field", () => {
    const rows = parseCsv(
      ["codigo,nombre", 'SRV-0200,"Cambio de aceite, filtro y bujías"'].join(
        "\n",
      ),
    );

    expect(rows).toEqual<CsvRow[]>([
      { codigo: "SRV-0200", nombre: "Cambio de aceite, filtro y bujías" },
    ]);
  });

  it("unescapes a doubled quote inside a quoted field", () => {
    const rows = parseCsv(
      ["codigo,nombre", 'SRV-0300,"Servicio ""premium"""'].join("\n"),
    );

    expect(rows).toEqual<CsvRow[]>([
      { codigo: "SRV-0300", nombre: 'Servicio "premium"' },
    ]);
  });

  it("ignores blank lines and trailing newlines", () => {
    const rows = parseCsv(
      ["codigo,nombre", "", "SRV-0400,Frenos", "   ", ""].join("\n"),
    );

    expect(rows).toEqual<CsvRow[]>([{ codigo: "SRV-0400", nombre: "Frenos" }]);
  });

  it("returns no rows when only a header line is present", () => {
    expect(parseCsv("codigo,nombre")).toEqual([]);
  });

  it("fills a missing trailing cell with an empty string", () => {
    const rows = parseCsv(
      ["codigo,nombre,categoria", "SRV-0500,Frenos"].join("\n"),
    );

    expect(rows).toEqual<CsvRow[]>([
      { codigo: "SRV-0500", nombre: "Frenos", categoria: "" },
    ]);
  });
});

describe("toCsv", () => {
  it("serializes the header and each row in header order", () => {
    const text = toCsv(
      ["codigo", "nombre", "activo"],
      [{ codigo: "SRV-0100", nombre: "Frenos", activo: "1" }],
    );

    expect(text).toBe("codigo,nombre,activo\nSRV-0100,Frenos,1");
  });

  it("quotes only the cells that contain a comma, quote or newline", () => {
    const text = toCsv(
      ["codigo", "nombre"],
      [{ codigo: "SRV-0100", nombre: 'Cambio, "rápido"' }],
    );

    expect(text).toBe('codigo,nombre\nSRV-0100,"Cambio, ""rápido"""');
  });

  it("writes a missing cell as empty text", () => {
    const text = toCsv(["codigo", "nombre"], [{ codigo: "SRV-0100" }]);

    expect(text).toBe("codigo,nombre\nSRV-0100,");
  });
});
