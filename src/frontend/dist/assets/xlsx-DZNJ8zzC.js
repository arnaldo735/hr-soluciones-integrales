const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/exceljs.min-B_3Oli1a.js","assets/index-EqGEeyjs.js","assets/index-DgxGT68j.css"])))=>i.map(i=>d[i]);
import { a_ as __vitePreload } from "./index-EqGEeyjs.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
async function loadExcelJs() {
  const module = await __vitePreload(() => import("./exceljs.min-B_3Oli1a.js").then((n) => n.e), true ? __vite__mapDeps([0,1,2]) : void 0);
  return module.default;
}
function toCellValue(value) {
  if (value === void 0 || value === null) return null;
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed) && !/^-?\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return value;
}
async function downloadXlsx(filename, sheetName, headers, rows) {
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
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    data: buffer
  });
}
async function downloadXlsxTemplate(filename, sheetName, headers, sampleRow) {
  const rows = sampleRow ? [sampleRow] : [];
  await downloadXlsx(filename, sheetName, headers, rows);
}
function isXlsxFile(file) {
  return file.name.toLowerCase().endsWith(".xlsx");
}
async function readXlsxRows(file) {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  const data = await file.arrayBuffer();
  await workbook.xlsx.load(data);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const headers = [];
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cellText(cell.value);
  });
  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const parsed = {};
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
function cellText(value) {
  if (value === null || value === void 0) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
    if ("result" in value) return cellText(value.result);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }
  }
  return String(value).trim();
}
async function readSpreadsheet(file, parseCsv) {
  if (isXlsxFile(file)) {
    let rows2;
    try {
      rows2 = await readXlsxRows(file);
    } catch {
      throw new Error(
        "No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido."
      );
    }
    if (rows2.length === 0) {
      throw new Error(
        "El archivo no contiene filas con encabezados reconocibles."
      );
    }
    return rows2;
  }
  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error(
      "El archivo no contiene filas con encabezados reconocibles."
    );
  }
  return rows;
}
export {
  downloadXlsxTemplate as a,
  downloadXlsx as d,
  readSpreadsheet as r
};
