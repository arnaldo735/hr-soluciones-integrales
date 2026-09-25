import { Button } from "@/components/ui/button";
import type { CsvRow } from "@/lib/types";
import { downloadXlsx, readSpreadsheet } from "@/lib/xlsx";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/** Serializes rows to CSV text, quoting values that need escaping. */
export function toCsv(headers: string[], rows: CsvRow[]): string {
  const escapeCell = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  const head = headers.map(escapeCell).join(",");
  const body = rows.map((row) =>
    headers.map((header) => escapeCell(row[header] ?? "")).join(","),
  );
  return [head, ...body].join("\n");
}

/** Parses CSV text into header-keyed rows, honoring quoted fields. */
export function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
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
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });
}

interface CsvTransferProps {
  /** Column headers, in export order. */
  headers: string[];
  /** Rows to export. */
  rows: CsvRow[];
  /** Called with parsed rows after a successful import. */
  onImport: (rows: CsvRow[]) => void;
  /** Base filename without extension. */
  filename: string;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /** Disable both controls while a bulk operation is in flight. */
  disabled?: boolean;
  /**
   * Optional export override. When provided, the export button calls this
   * instead of serializing `rows`, so a caller can fetch the complete data set
   * from the backend rather than exporting only the loaded page.
   */
  onExport?: () => void | Promise<void>;
  /** True while an overridden export is in flight. */
  isExporting?: boolean;
  /** Worksheet name used inside the exported workbook. */
  sheetName?: string;
}

/**
 * Spreadsheet import/export control pair shared by the catalog modules. Export
 * writes a real `.xlsx` workbook download; import reads a local `.xlsx` or
 * `.csv` file and hands parsed rows back to the caller for a bulk backend call.
 */
export function CsvTransfer({
  headers,
  rows,
  onImport,
  filename,
  ocid,
  disabled,
  onExport,
  isExporting,
  sheetName,
}: CsvTransferProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);

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

  const handleFile = async (file: File) => {
    setIsReading(true);
    try {
      const parsed = await readSpreadsheet(file, parseCsv);
      onImport(parsed);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo. Verifica el formato e intenta de nuevo.",
      );
    } finally {
      setIsReading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="sr-only"
        data-ocid={`${ocid}.file_input`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isReading}
        onClick={() => inputRef.current?.click()}
        data-ocid={`${ocid}.import_button`}
        className="gap-1.5"
      >
        <Upload className="size-4" aria-hidden="true" />
        {isReading ? "Leyendo…" : "Importar Excel"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isExporting || (!onExport && rows.length === 0)}
        onClick={handleExport}
        data-ocid={`${ocid}.export_button`}
        className="gap-1.5"
      >
        <Download className="size-4" aria-hidden="true" />
        {isExporting ? "Exportando…" : "Exportar Excel"}
      </Button>
    </div>
  );
}
