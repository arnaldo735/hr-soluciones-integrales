import { AuthProvider } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import ExcelJS from "exceljs";
import type { ReactElement, ReactNode } from "react";

/** A fresh QueryClient per render so tests never share cached data. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  queryClient: QueryClient = createTestQueryClient(),
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper }) };
}

/** One worksheet read back from an exported `.xlsx` blob. */
export interface ReadSheet {
  /** Header row, in column order. */
  headers: string[];
  /** Data rows as plain cell values, in column order. */
  rows: Array<Array<string | number | null>>;
}

/**
 * Reads an exported `.xlsx` blob back into its first worksheet. jsdom's `Blob`
 * has no `arrayBuffer()`, so the bytes are read through `FileReader` and handed
 * to ExcelJS, which is the same library the export path writes with.
 */
export async function readXlsxBlob(blob: Blob): Promise<ReadSheet> {
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [] };

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cellText(cell.value);
  });

  const rows: Array<Array<string | number | null>> = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    rows.push(
      headers.map((_, index) => {
        const value = row.getCell(index + 1).value;
        if (value === null || value === undefined) return null;
        if (typeof value === "number" || typeof value === "string") {
          return value;
        }
        return cellText(value);
      }),
    );
  });

  return { headers, rows };
}

/** Flattens any ExcelJS cell value into its plain text form. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
  }
  return String(value);
}

/**
 * Builds a real `.xlsx` `File` from header-keyed rows so the import path can be
 * exercised end to end. jsdom's `File` has no `arrayBuffer()`, so the workbook
 * bytes are attached directly.
 */
export async function xlsxFile(
  headers: string[],
  rows: Array<Array<string | number>>,
  name = "import.xlsx",
): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Hoja1");
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();

  const file = new File([buffer], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(buffer),
  });
  return file;
}

/** A `File` whose bytes are not a valid workbook, for the corrupt-file path. */
export function corruptXlsxFile(name = "roto.xlsx"): File {
  const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]).buffer;
  const file = new File([bytes], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(bytes),
  });
  return file;
}
