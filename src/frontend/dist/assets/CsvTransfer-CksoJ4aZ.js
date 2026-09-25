import { s as reactExports, j as jsxRuntimeExports, B as Button, ar as ue } from "./index-CzQEXdHP.js";
import { r as readSpreadsheet, d as downloadXlsx } from "./xlsx-CMU5GsD8.js";
import { U as Upload } from "./upload-DSxuh5Zf.js";
import { D as Download } from "./download-6xWfJWG2.js";
function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length < 2) return [];
  const splitLine = (line) => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (quoted) {
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          current += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  };
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}
function CsvTransfer({
  headers,
  rows,
  onImport,
  filename,
  ocid,
  disabled,
  onExport,
  isExporting,
  sheetName
}) {
  const inputRef = reactExports.useRef(null);
  const [isReading, setIsReading] = reactExports.useState(false);
  const exportXlsx = async () => {
    await downloadXlsx(filename, sheetName ?? filename, headers, rows);
  };
  const handleExport = () => {
    if (onExport) {
      void onExport();
      return;
    }
    void exportXlsx();
  };
  const handleFile = async (file) => {
    setIsReading(true);
    try {
      const parsed = await readSpreadsheet(file, parseCsv);
      onImport(parsed);
    } catch (error) {
      ue.error(
        error instanceof Error ? error.message : "No se pudo leer el archivo. Verifica el formato e intenta de nuevo."
      );
    } finally {
      setIsReading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept: ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
        className: "sr-only",
        "data-ocid": `${ocid}.file_input`,
        onChange: (event) => {
          var _a;
          const file = (_a = event.target.files) == null ? void 0 : _a[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "sm",
        disabled: disabled || isReading,
        onClick: () => {
          var _a;
          return (_a = inputRef.current) == null ? void 0 : _a.click();
        },
        "data-ocid": `${ocid}.import_button`,
        className: "gap-1.5",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-4", "aria-hidden": "true" }),
          isReading ? "Leyendo…" : "Importar Excel"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "sm",
        disabled: disabled || isExporting || !onExport && rows.length === 0,
        onClick: handleExport,
        "data-ocid": `${ocid}.export_button`,
        className: "gap-1.5",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
          isExporting ? "Exportando…" : "Exportar Excel"
        ]
      }
    )
  ] });
}
export {
  CsvTransfer as C,
  parseCsv as p
};
