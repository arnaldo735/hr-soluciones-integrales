import { downloadFile } from "@/lib/download";
import type { CsvRow } from "@/lib/types";
import type ExcelJS from "exceljs";

/**
 * Loads the heavy ExcelJS library only when a spreadsheet is actually read or
 * written, so it never ships in the app's startup bundle.
 */
async function loadExcelJs(): Promise<typeof ExcelJS> {
  const module = await import("exceljs");
  return module.default;
}

/** A cell value written to a worksheet: real numbers stay numbers. */
export type SheetCell = string | number;

/** One row of a worksheet, keyed by its column header. */
export type SheetRow = Record<string, SheetCell>;

/**
 * A numeric-looking cell is written as a real number so Excel/LibreOffice can
 * sum and format it; everything else stays text. Blank cells stay blank.
 */
function toCellValue(value: SheetCell | undefined): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  // Only plain decimal/integer forms become numbers; identifiers such as
  // "REP-0001" or "1.234,56" must stay text. A string with a thousands
  // separator (e.g. es-CO "1.234") is ambiguous with a decimal, so it stays
  // text rather than being silently misread as 1.234.
  if (
    /^-?\d+(\.\d+)?$/.test(trimmed) &&
    !/^-?\d{1,3}(\.\d{3})+$/.test(trimmed)
  ) {
    return Number(trimmed);
  }
  return value;
}

/**
 * Builds a real `.xlsx` workbook from header-keyed rows and triggers a browser
 * download. Values are written as typed cells (numbers as numbers, text as
 * text) rather than one column of text.
 */
export async function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: SheetRow[],
): Promise<void> {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(headers.map((header) => toCellValue(row[header])));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  await downloadFile({
    filename: `${filename}.xlsx`,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    data: buffer,
  });
}

/**
 * Downloads an empty `.xlsx` template carrying only the expected column
 * headers, so the user can fill it in and re-import it. An optional sample row
 * documents the expected value format without becoming product data.
 */
export async function downloadXlsxTemplate(
  filename: string,
  sheetName: string,
  headers: string[],
  sampleRow?: SheetRow,
): Promise<void> {
  const rows: SheetRow[] = sampleRow ? [sampleRow] : [];
  await downloadXlsx(filename, sheetName, headers, rows);
}

/** True when the file name carries the `.xlsx` extension. */
export function isXlsxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xlsx");
}

/** Reads the first worksheet of an `.xlsx` file into header-keyed rows. */
async function readXlsxRows(file: File): Promise<CsvRow[]> {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  const data = await file.arrayBuffer();
  await workbook.xlsx.load(data);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers: string[] = [];
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cellText(cell.value);
  });

  const rows: CsvRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const parsed: CsvRow = {};
    let hasValue = false;
    headers.forEach((header, index) => {
      if (!header) return;
      const value = cellText(row.getCell(index + 1).value);
      if (value !== "") hasValue = true;
      parsed[header] = value;
    });
    if (hasValue) rows.push(parsed);
  });
  return rows;
}

/** Flattens any ExcelJS cell value into its plain text form. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

/**
 * Reads a spreadsheet chosen by the user into header-keyed rows. `.xlsx` files
 * are read from their first sheet; `.csv` files are parsed as text for
 * compatibility. Throws a Spanish error when the file is empty, corrupt or has
 * no recognizable header row.
 */
export async function readSpreadsheet(
  file: File,
  parseCsv: (text: string) => CsvRow[],
): Promise<CsvRow[]> {
  if (isXlsxFile(file)) {
    let rows: CsvRow[];
    try {
      rows = await readXlsxRows(file);
    } catch {
      throw new Error(
        "No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido.",
      );
    }
    if (rows.length === 0) {
      throw new Error(
        "El archivo no contiene filas con encabezados reconocibles.",
      );
    }
    return rows;
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error(
      "El archivo no contiene filas con encabezados reconocibles.",
    );
  }
  return rows;
}
