import type { Supplier } from "@/lib/types";
import { SuppliersPage } from "@/pages/SuppliersPage";
import { readXlsxBlob, renderWithProviders, xlsxFile } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted Excel import/export of the supplier directory.
 *
 * The accepted change replaces the CSV-only transfer with a real `.xlsx`
 * workbook: "Exportar" downloads the complete directory with the shared
 * headers, and "Importar" reads a workbook into a per-row preview that flags
 * creations, updates and invalid rows before the backend call, then shows the
 * creados/actualizados/con error summary. These tests pin that observable
 * behavior; they never assert the exact workbook styling.
 */

const listSuppliersMock = vi.fn();
const listPayablesMock = vi.fn();
const createSupplierMock = vi.fn();
const updateSupplierMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listSuppliers: listSuppliersMock,
      listPayables: listPayablesMock,
      createSupplier: createSupplierMock,
      updateSupplier: updateSupplierMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => (
    <a href={to} data-params={JSON.stringify(params)} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function supplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 1n,
    name: "Refacciones del Norte",
    contactName: "Laura Medina",
    phone: "81 8345 2210",
    email: "ventas@refacciones.mx",
    taxId: "RDN980412H73",
    address: "Av. Constitución 1450",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

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

async function uploadWorkbook(file: File) {
  const input = screen.getByTestId(
    "suppliers.import_file_input",
  ) as HTMLInputElement;
  await userEvent.upload(input, file);
}

describe("SuppliersPage Excel export", () => {
  beforeEach(() => {
    listSuppliersMock.mockReset();
    listPayablesMock.mockReset();
    createSupplierMock.mockReset();
    updateSupplierMock.mockReset();
    listPayablesMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads the complete directory as an .xlsx with the shared headers", async () => {
    listSuppliersMock.mockImplementation(async (search: string | null) =>
      search === null
        ? [supplier(), supplier({ id: 2n, name: "Repuestos Andinos" })]
        : [supplier()],
    );

    const capture = captureDownload();
    try {
      renderWithProviders(<SuppliersPage />);
      await screen.findByText("Refacciones del Norte");

      await userEvent.click(screen.getByTestId("suppliers.export_button"));

      await waitFor(() => expect(capture.clickSpy).toHaveBeenCalledTimes(1));
      expect(capture.getDownloadName()).toBe("proveedores.xlsx");

      const blob = capture.createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toEqual([
        "nombre",
        "documento",
        "telefono",
        "correo",
        "direccion",
      ]);
      expect(sheet.rows).toHaveLength(2);
      expect(sheet.rows[0]).toEqual([
        "Refacciones del Norte",
        "RDN980412H73",
        "81 8345 2210",
        "ventas@refacciones.mx",
        "Av. Constitución 1450",
      ]);
      expect(sheet.rows[1][0]).toBe("Repuestos Andinos");
    } finally {
      capture.restore();
    }
  });
});

describe("SuppliersPage Excel import", () => {
  beforeEach(() => {
    listSuppliersMock.mockReset();
    listPayablesMock.mockReset();
    createSupplierMock.mockReset();
    updateSupplierMock.mockReset();
    listPayablesMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("previews each row as create, update or invalid before confirming", async () => {
    // The existing supplier is matched by documento+nombre, so its row is an
    // update; the second is new; the third is missing its NIT and is rejected.
    listSuppliersMock.mockResolvedValue([supplier()]);
    const file = await xlsxFile(
      ["nombre", "documento", "telefono", "correo", "direccion"],
      [
        ["Refacciones del Norte", "RDN980412H73", "81 8345 2210", "", ""],
        ["Repuestos Andinos", "900123456", "604 444 8890", "", ""],
        ["Sin Documento", "", "604 111 2222", "", ""],
      ],
    );

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    await uploadWorkbook(file);

    const dialog = await screen.findByTestId("contacts.import_dialog.supplier");
    expect(
      within(dialog).getByTestId("contacts.import_row.supplier.1"),
    ).toHaveTextContent("Actualizar");
    expect(
      within(dialog).getByTestId("contacts.import_row.supplier.2"),
    ).toHaveTextContent("Crear");
    const invalid = within(dialog).getByTestId(
      "contacts.import_row.supplier.3",
    );
    expect(invalid).toHaveTextContent("Con error");
    expect(invalid).toHaveTextContent("Falta el documento o NIT");
    expect(
      within(dialog).getByTestId("contacts.import_confirm_button.supplier"),
    ).toHaveTextContent("Importar 2 filas");
  });

  it("creates and updates suppliers and shows the result summary", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    createSupplierMock.mockResolvedValue(
      supplier({ id: 2n, name: "Repuestos Andinos" }),
    );
    updateSupplierMock.mockResolvedValue(supplier());
    const file = await xlsxFile(
      ["nombre", "documento", "telefono", "correo", "direccion"],
      [
        ["Refacciones del Norte", "RDN980412H73", "81 8345 2210", "", ""],
        ["Repuestos Andinos", "900123456", "604 444 8890", "", ""],
      ],
    );

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");
    await uploadWorkbook(file);

    const dialog = await screen.findByTestId("contacts.import_dialog.supplier");
    await userEvent.click(
      within(dialog).getByTestId("contacts.import_confirm_button.supplier"),
    );

    await waitFor(() => expect(createSupplierMock).toHaveBeenCalledTimes(1));
    expect(updateSupplierMock).toHaveBeenCalledTimes(1);
    expect(createSupplierMock.mock.calls[0][0]).toMatchObject({
      name: "Repuestos Andinos",
      taxId: "900123456",
    });
    expect(updateSupplierMock.mock.calls[0][0]).toBe(1n);

    const summary = await screen.findByTestId(
      "contacts.import_summary.supplier",
    );
    expect(summary).toHaveTextContent("1 creados");
    expect(summary).toHaveTextContent("1 actualizados");
    expect(summary).toHaveTextContent("0 con error");
  });

  it("reports a failed row in the summary when the backend rejects it", async () => {
    listSuppliersMock.mockResolvedValue([]);
    createSupplierMock
      .mockResolvedValueOnce(supplier({ id: 2n, name: "Repuestos Andinos" }))
      .mockRejectedValueOnce(new Error("NIT duplicado"));
    const file = await xlsxFile(
      ["nombre", "documento", "telefono", "correo", "direccion"],
      [
        ["Repuestos Andinos", "900123456", "604 444 8890", "", ""],
        ["Refacciones del Sur", "900999888", "604 111 2222", "", ""],
      ],
    );

    renderWithProviders(<SuppliersPage />);
    await screen.findByTestId("suppliers.empty_state");
    await uploadWorkbook(file);

    const dialog = await screen.findByTestId("contacts.import_dialog.supplier");
    await userEvent.click(
      within(dialog).getByTestId("contacts.import_confirm_button.supplier"),
    );

    const summary = await screen.findByTestId(
      "contacts.import_summary.supplier",
    );
    expect(summary).toHaveTextContent("1 creados");
    expect(summary).toHaveTextContent("1 con error");
    expect(
      within(dialog).getByTestId("contacts.import_row.supplier.2"),
    ).toHaveTextContent("NIT duplicado");
  });
});
