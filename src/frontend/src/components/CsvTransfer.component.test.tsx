import { CsvTransfer } from "@/components/CsvTransfer";
import type { CsvRow } from "@/lib/types";
import {
  corruptXlsxFile,
  readXlsxBlob,
  renderWithProviders,
  xlsxFile,
} from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the shared `CsvTransfer` control pair.
 *
 * The accepted change adds Excel import/export with a preview and summary to
 * the Clientes and Proveedores modules, which reuse this component. These tests
 * protect the behavior the component already has and that the new modules will
 * depend on: export writes a real `.xlsx` workbook download with the given
 * headers and rows, an `onExport` override replaces the local serialization,
 * import reads a local `.xlsx` or `.csv` file and hands the parsed rows to the
 * caller, a corrupt file surfaces a Spanish error without calling the caller,
 * and `disabled` blocks both controls. They never assert the absence of the
 * component on any page, because adding it there is the accepted change.
 */

const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

/** Captures the blob handed to `URL.createObjectURL` and the anchor download. */
function captureDownload() {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:csv-transfer");
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

/**
 * jsdom's `File` does not implement `Blob.text()`, which `CsvTransfer` awaits
 * for a `.csv` file. Attach the reader so the component's own parse path runs.
 */
function csvFile(contents: string, name = "clientes.csv"): File {
  const file = new File([contents], name, { type: "text/csv" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(contents),
  });
  return file;
}

const HEADERS = ["nombre", "telefono", "correo"];
const ROWS: CsvRow[] = [
  { nombre: "Ada Lovelace", telefono: "3001112222", correo: "ada@example.com" },
];

function renderTransfer(
  overrides: Partial<React.ComponentProps<typeof CsvTransfer>> = {},
) {
  const onImport = vi.fn();
  const utils = renderWithProviders(
    <CsvTransfer
      headers={HEADERS}
      rows={ROWS}
      onImport={onImport}
      filename="clientes"
      sheetName="Clientes"
      ocid="test.csv"
      {...overrides}
    />,
  );
  return { onImport, ...utils };
}

describe("CsvTransfer", () => {
  beforeEach(() => {
    toastErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports a real .xlsx workbook with the given headers and rows", async () => {
    const capture = captureDownload();
    try {
      renderTransfer();

      await userEvent.click(screen.getByTestId("test.csv.export_button"));

      await waitFor(() =>
        expect(capture.createObjectURL).toHaveBeenCalledTimes(1),
      );
      expect(capture.clickSpy).toHaveBeenCalledTimes(1);
      expect(capture.getDownloadName()).toBe("clientes.xlsx");
      expect(capture.revokeObjectURL).toHaveBeenCalledWith("blob:csv-transfer");

      const blob = capture.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toEqual(HEADERS);
      // A numeric-looking cell is written as a real number so Excel can sum it;
      // text stays text. This is the typed-cell contract the export relies on.
      expect(sheet.rows).toEqual([
        ["Ada Lovelace", 3001112222, "ada@example.com"],
      ]);
    } finally {
      capture.restore();
    }
  });

  it("disables the export button when there are no rows and no override", () => {
    renderTransfer({ rows: [] });
    expect(screen.getByTestId("test.csv.export_button")).toBeDisabled();
  });

  it("calls the onExport override instead of serializing the loaded rows", async () => {
    const capture = captureDownload();
    const onExport = vi.fn();
    try {
      renderTransfer({ onExport });

      await userEvent.click(screen.getByTestId("test.csv.export_button"));

      expect(onExport).toHaveBeenCalledTimes(1);
      // The override owns the download, so the component writes no workbook.
      expect(capture.createObjectURL).not.toHaveBeenCalled();
    } finally {
      capture.restore();
    }
  });

  it("keeps the export button enabled with an override even when no rows are loaded", () => {
    renderTransfer({ rows: [], onExport: vi.fn() });
    expect(screen.getByTestId("test.csv.export_button")).toBeEnabled();
  });

  it("reads a .csv file and hands the parsed rows to onImport", async () => {
    const { onImport } = renderTransfer();
    const file = csvFile(
      [
        "nombre,telefono,correo",
        "Ada Lovelace,3001112222,ada@example.com",
      ].join("\n"),
    );

    await userEvent.upload(screen.getByTestId("test.csv.file_input"), file);

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith<[CsvRow[]]>([
      {
        nombre: "Ada Lovelace",
        telefono: "3001112222",
        correo: "ada@example.com",
      },
    ]);
  });

  it("reads an .xlsx file and hands the parsed rows to onImport", async () => {
    const { onImport } = renderTransfer();
    const file = await xlsxFile(
      HEADERS,
      [["Ada Lovelace", "3001112222", "ada@example.com"]],
      "clientes.xlsx",
    );

    await userEvent.upload(screen.getByTestId("test.csv.file_input"), file);

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith<[CsvRow[]]>([
      {
        nombre: "Ada Lovelace",
        telefono: "3001112222",
        correo: "ada@example.com",
      },
    ]);
  });

  it("surfaces a Spanish error and does not call onImport for a corrupt file", async () => {
    const { onImport } = renderTransfer();

    await userEvent.upload(
      screen.getByTestId("test.csv.file_input"),
      corruptXlsxFile("clientes.xlsx"),
    );

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledTimes(1));
    expect(toastErrorMock.mock.calls[0][0]).toBe(
      "No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido.",
    );
    expect(onImport).not.toHaveBeenCalled();
  });

  it("disables both controls while a bulk operation is in flight", () => {
    renderTransfer({ disabled: true });
    expect(screen.getByTestId("test.csv.import_button")).toBeDisabled();
    expect(screen.getByTestId("test.csv.export_button")).toBeDisabled();
  });
});
