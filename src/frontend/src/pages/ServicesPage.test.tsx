import type {
  Customer,
  CustomerNotificationResult,
  Service,
  ServiceCategoryUsage,
  ServicePage,
} from "@/lib/types";
import { NotificationSource, ServiceSort, UserRole } from "@/lib/types";
import { ServicesPage } from "@/pages/ServicesPage";
import {
  corruptXlsxFile,
  readXlsxBlob,
  renderWithProviders,
  xlsxFile,
} from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listServicesMock = vi.fn();
const createServiceMock = vi.fn();
const updateServiceMock = vi.fn();
const deleteServiceMock = vi.fn();
const bulkCreateServicesMock = vi.fn();
const listCategoriesMock = vi.fn();
const zeroServicesMock = vi.fn();
const listCustomersMock = vi.fn();
const notifyCustomerMock = vi.fn();
const useRoleMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listServices: listServicesMock,
      createService: createServiceMock,
      updateService: updateServiceMock,
      deleteService: deleteServiceMock,
      bulkCreateServices: bulkCreateServicesMock,
      listServiceCategories: listCategoriesMock,
      zeroServices: zeroServicesMock,
      listCustomers: listCustomersMock,
      notifyCustomer: notifyCustomerMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function service(overrides: Partial<Service> = {}): Service {
  return {
    id: 1n,
    code: "SRV-0001",
    name: "Cambio de aceite",
    description: "Incluye filtro",
    category: "Mantenimiento",
    laborRate: 45000n,
    estimatedMinutes: 60n,
    active: true,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function page(items: Service[], total = items.length): ServicePage {
  return { items, total: BigInt(total), offset: 0n, limit: 20n };
}

function categoryUsage(
  overrides: Partial<ServiceCategoryUsage> = {},
): ServiceCategoryUsage {
  return {
    category: {
      id: 1n,
      name: "Mantenimiento",
      description: "",
      createdAt: 1_700_000_000_000_000_000n,
    },
    serviceCount: 4n,
    activeServiceCount: 3n,
    ...overrides,
  };
}

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 000 0000",
    email: "ada@example.com",
    document: "LOAA1815",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function notificationResult(
  overrides: Partial<CustomerNotificationResult> = {},
): CustomerNotificationResult {
  return {
    sent: true,
    email: "ada@example.com",
    customerId: 1n,
    ...overrides,
  };
}

/**
 * jsdom's `File` does not implement `Blob.text()`, which `CsvTransfer` awaits.
 * Build a real `File` and attach the reader so the component's own parse path
 * runs unchanged.
 */
function csvFile(contents: string, name = "servicios.csv"): File {
  const file = new File([contents], name, { type: "text/csv" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(contents),
  });
  return file;
}

function roleState(isAdmin: boolean) {
  return {
    role: isAdmin ? UserRole.admin : UserRole.user,
    isAdmin,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  };
}

describe("ServicesPage", () => {
  beforeEach(() => {
    listServicesMock.mockReset();
    createServiceMock.mockReset();
    updateServiceMock.mockReset();
    deleteServiceMock.mockReset();
    bulkCreateServicesMock.mockReset();
    listCategoriesMock.mockReset();
    zeroServicesMock.mockReset();
    listCustomersMock.mockReset();
    notifyCustomerMock.mockReset();
    useRoleMock.mockReset();
    listServicesMock.mockResolvedValue(page([]));
    listCategoriesMock.mockResolvedValue([]);
    listCustomersMock.mockResolvedValue([]);
    useRoleMock.mockReturnValue(roleState(true));
  });

  it("lists services with code, category, rate and duration", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    renderWithProviders(<ServicesPage />);

    expect(await screen.findByText("SRV-0001")).toBeInTheDocument();
    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
    expect(screen.getByText("Mantenimiento")).toBeInTheDocument();
    expect(screen.getByText("$ 450")).toBeInTheDocument();
    expect(screen.getByText("60 min")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders an empty state when no services exist", async () => {
    listServicesMock.mockResolvedValue(page([]));
    renderWithProviders(<ServicesPage />);

    expect(
      await screen.findByTestId("services.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aún no hay servicios registrados"),
    ).toBeInTheDocument();
  });

  it("renders an error state when the catalog fails to load", async () => {
    listServicesMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<ServicesPage />);

    expect(
      await screen.findByTestId("services.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar el catálogo de servicios."),
    ).toBeInTheDocument();
  });

  it("passes the trimmed search term and sort to the backend", async () => {
    renderWithProviders(<ServicesPage />);
    await waitFor(() => expect(listServicesMock).toHaveBeenCalled());

    await userEvent.type(
      screen.getByTestId("services.search_input"),
      "  aceite  ",
    );

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenCalledWith(
        expect.objectContaining({ search: "aceite" }),
        ServiceSort.code,
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("toggles the active-only filter through to the backend", async () => {
    renderWithProviders(<ServicesPage />);
    await waitFor(() => expect(listServicesMock).toHaveBeenCalled());

    await userEvent.click(screen.getByTestId("services.active_toggle"));

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenCalledWith(
        expect.objectContaining({ activeOnly: true }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("offers the catalog categories in the service form dropdown", async () => {
    listCategoriesMock.mockResolvedValue([categoryUsage()]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    await userEvent.click(screen.getByTestId("services.new_service_button"));
    // The filter and the form share the `services.category_select` ocid, so
    // target the form trigger by its accessible name.
    await userEvent.click(screen.getByLabelText("Categoría del servicio"));

    // The option carries the category name and its service count.
    expect(
      await screen.findByRole("option", { name: "Mantenimiento · 4" }),
    ).toBeInTheDocument();
  });

  it("filters services by a catalog category", async () => {
    listCategoriesMock.mockResolvedValue([categoryUsage()]);
    renderWithProviders(<ServicesPage />);
    await waitFor(() => expect(listServicesMock).toHaveBeenCalled());

    await userEvent.click(screen.getByLabelText("Filtrar por categoría"));
    await userEvent.click(
      await screen.findByRole("option", { name: "Mantenimiento · 4" }),
    );

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Mantenimiento" }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      ),
    );
  });

  it("creates a service from the form dialog", async () => {
    createServiceMock.mockResolvedValue(service());
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    await userEvent.click(screen.getByTestId("services.new_service_button"));
    await userEvent.type(screen.getByTestId("services.code_input"), "SRV-0002");
    await userEvent.type(
      screen.getByTestId("services.name_input"),
      "Alineación",
    );
    await userEvent.type(
      screen.getByTestId("services.labor_rate_input"),
      "30000",
    );
    await userEvent.click(screen.getByTestId("services.submit_button"));

    await waitFor(() => expect(createServiceMock).toHaveBeenCalledTimes(1));
    expect(createServiceMock.mock.calls[0][0]).toMatchObject({
      code: "SRV-0002",
      name: "Alineación",
      laborRate: 3000000n,
    });
  });

  it("does not save a service while the required fields are empty", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    await userEvent.click(screen.getByTestId("services.new_service_button"));
    await userEvent.click(screen.getByTestId("services.submit_button"));

    // The form's native `required` validation keeps the dialog open and no
    // backend call is made.
    expect(screen.getByTestId("services.form_dialog")).toBeInTheDocument();
    expect(createServiceMock).not.toHaveBeenCalled();
  });

  it("edits an existing service with its current values", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    updateServiceMock.mockResolvedValue(service());
    renderWithProviders(<ServicesPage />);
    await screen.findByText("SRV-0001");

    await userEvent.click(screen.getByTestId("services.edit_button.1"));
    expect(screen.getByTestId("services.code_input")).toHaveValue("SRV-0001");
    expect(screen.getByTestId("services.name_input")).toHaveValue(
      "Cambio de aceite",
    );

    await userEvent.clear(screen.getByTestId("services.name_input"));
    await userEvent.type(
      screen.getByTestId("services.name_input"),
      "Cambio de aceite premium",
    );
    await userEvent.click(screen.getByTestId("services.submit_button"));

    await waitFor(() => expect(updateServiceMock).toHaveBeenCalledTimes(1));
    expect(updateServiceMock.mock.calls[0][0]).toBe(1n);
    expect(updateServiceMock.mock.calls[0][1]).toMatchObject({
      name: "Cambio de aceite premium",
    });
  });

  it("deletes a service only after confirming", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    deleteServiceMock.mockResolvedValue(true);
    renderWithProviders(<ServicesPage />);
    await screen.findByText("SRV-0001");

    await userEvent.click(screen.getByTestId("services.delete_button.1"));
    expect(deleteServiceMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("services.confirm_button"));
    await waitFor(() => expect(deleteServiceMock).toHaveBeenCalledWith(1n));
  });

  it("previews imported CSV rows and reports invalid ones", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0100,Frenos,,Frenos,50000,45,1",
      "SRV-0101,,,Frenos,10000,30,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    expect(within(dialog).getByText("1 listas")).toBeInTheDocument();
    expect(within(dialog).getByText("1 con errores")).toBeInTheDocument();
    // The code is rendered in a locked input, so assert its value rather than
    // its text content.
    expect(within(dialog).getByTestId("services.import_code.1")).toHaveValue(
      "SRV-0100",
    );
    // The row missing a name is flagged as invalid (destructive background).
    expect(within(dialog).getByTestId("services.import_row.2")).toHaveClass(
      "bg-destructive/[0.06]",
    );
  });

  it("imports only the valid rows and shows a summary", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-0100" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0100,Frenos,,Frenos,50000,45,1",
      "SRV-0101,,,Frenos,10000,30,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0].code).toBe("SRV-0100");

    const summary = await screen.findByTestId("services.import_summary");
    expect(summary).toHaveTextContent("1 importado");
    expect(summary).toHaveTextContent("1 omitido");
  });

  // --- Characterization: the service export contract the format work must keep
  //
  // The accepted change turns the export into a real Excel workbook. These tests
  // pin the parts that must not change with it: the seven Spanish column names
  // in their documented order and the value each catalog field maps to.

  it("exports the service catalog with the documented Spanish headers and row values", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    const createObjectURL = vi.fn((_blob: Blob) => "blob:servicios");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<ServicesPage />);
      await screen.findByText("SRV-0001");

      await userEvent.click(screen.getByTestId("services.csv.export_button"));

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:servicios");

      const blob = createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      expect(sheet.headers).toEqual([
        "codigo",
        "nombre",
        "descripcion",
        "categoria",
        "tarifa",
        "duracion_min",
        "activo",
      ]);
      const cells = sheet.rows[0];
      expect(cells[0]).toBe("SRV-0001");
      expect(cells[1]).toBe("Cambio de aceite");
      expect(cells[2]).toBe("Incluye filtro");
      expect(cells[3]).toBe("Mantenimiento");
      // Money is exported as a decimal amount, not raw cents.
      expect(cells[4]).toBe(450);
      expect(cells[5]).toBe(60);
      // The active flag is exported as 1/0.
      expect(cells[6]).toBe(1);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("downloads the service catalog as servicios.xlsx with the Excel MIME type", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    const createObjectURL = vi.fn((_blob: Blob) => "blob:servicios");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    // Capture the anchor's `download` attribute at click time: the accepted
    // change is that the export is a real `.xlsx` file, not a `.csv`.
    let downloadName: string | undefined;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });

    try {
      renderWithProviders(<ServicesPage />);
      await screen.findByText("SRV-0001");

      await userEvent.click(screen.getByTestId("services.csv.export_button"));
      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));

      expect(downloadName).toBe("servicios.xlsx");
      expect(createObjectURL.mock.calls[0][0].type).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("exports an inactive service with a zero active flag", async () => {
    listServicesMock.mockResolvedValue(
      page([service({ code: "SRV-0009", active: false })]),
    );
    const createObjectURL = vi.fn((_blob: Blob) => "blob:servicios");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      renderWithProviders(<ServicesPage />);
      await screen.findByText("SRV-0009");

      await userEvent.click(screen.getByTestId("services.csv.export_button"));

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
      const blob = createObjectURL.mock.calls[0][0];
      const sheet = await readXlsxBlob(blob);
      const cells = sheet.rows[0];
      expect(cells[0]).toBe("SRV-0009");
      expect(cells[6]).toBe(0);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("paginates when more services exist than fit on a page", async () => {
    // The page size is 100, so 250 services span three pages.
    listServicesMock.mockResolvedValue(page([service()], 250));
    renderWithProviders(<ServicesPage />);
    await screen.findByText("SRV-0001");

    expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("services.pagination_next"));

    await waitFor(() =>
      expect(listServicesMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        100n,
        expect.anything(),
      ),
    );
  });

  // --- Accepted behavior: importing a real Excel workbook ------------------
  //
  // The accepted change adds `.xlsx` to the import alongside `.csv`. These
  // tests pin the observable contract: the first sheet's first row is the
  // header, the preview and summary behave as with CSV, and a corrupt workbook
  // shows a Spanish error without opening the dialog.

  it("previews rows read from the first sheet of an .xlsx file", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const file = await xlsxFile(
      [
        "codigo",
        "nombre",
        "descripcion",
        "categoria",
        "tarifa",
        "duracion_min",
        "activo",
      ],
      [
        ["SRV-0100", "Frenos", "", "Frenos", 50000, 45, 1],
        ["SRV-0101", "", "", "Frenos", 10000, 30, 1],
      ],
    );
    await userEvent.upload(screen.getByTestId("services.csv.file_input"), file);

    const dialog = await screen.findByTestId("services.import_dialog");
    expect(within(dialog).getByText("1 listas")).toBeInTheDocument();
    expect(within(dialog).getByText("1 con errores")).toBeInTheDocument();
    expect(within(dialog).getByTestId("services.import_code.1")).toHaveValue(
      "SRV-0100",
    );
    // The row missing a name is flagged as invalid (destructive background).
    expect(within(dialog).getByTestId("services.import_row.2")).toHaveClass(
      "bg-destructive/[0.06]",
    );
  });

  it("imports only the valid .xlsx rows and shows the summary", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-0100" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const file = await xlsxFile(
      [
        "codigo",
        "nombre",
        "descripcion",
        "categoria",
        "tarifa",
        "duracion_min",
        "activo",
      ],
      [
        ["SRV-0100", "Frenos", "", "Frenos", 50000, 45, 1],
        ["SRV-0101", "", "", "Frenos", 10000, 30, 1],
      ],
    );
    await userEvent.upload(screen.getByTestId("services.csv.file_input"), file);

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      laborRate: bigint;
      estimatedMinutes: bigint;
      active: boolean;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toMatchObject({
      code: "SRV-0100",
      laborRate: 5000000n,
      estimatedMinutes: 45n,
      active: true,
    });

    const summary = await screen.findByTestId("services.import_summary");
    expect(summary).toHaveTextContent("1 importado");
    expect(summary).toHaveTextContent("1 omitido");
  });

  it("shows a Spanish error and does not open the dialog for a corrupt .xlsx", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      corruptXlsxFile(),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo leer el archivo Excel. Verifica que sea un .xlsx válido.",
      ),
    );
    expect(
      screen.queryByTestId("services.import_dialog"),
    ).not.toBeInTheDocument();
  });

  // --- Accepted behavior: the import preview locks the code and edits the rest
  //
  // The accepted change locks the `codigo` field in the import preview while
  // every other field stays editable. These tests pin the observable contract:
  // the code input is read-only with a visible Spanish hint, the other fields
  // accept edits, and confirming sends the file's code plus the edited values.

  it("renders the parsed values of every import row in the preview", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0200,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    const row = within(dialog).getByTestId("services.import_row.1");
    expect(within(dialog).getByTestId("services.import_code.1")).toHaveValue(
      "SRV-0200",
    );
    expect(within(dialog).getByTestId("services.import_nombre.1")).toHaveValue(
      "Cambio de aceite",
    );
    expect(
      within(dialog).getByTestId("services.import_descripcion.1"),
    ).toHaveValue("Incluye filtro");
    expect(
      within(dialog).getByTestId("services.import_categoria.1"),
    ).toHaveValue("Mantenimiento");
    expect(within(dialog).getByTestId("services.import_tarifa.1")).toHaveValue(
      45000,
    );
    expect(
      within(dialog).getByTestId("services.import_duracion_min.1"),
    ).toHaveValue(60);
    expect(row).toHaveTextContent("Activo");
  });

  it("locks the code field and keeps every other import field editable", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0210,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    const code = within(dialog).getByTestId("services.import_code.1");
    expect(code).toHaveAttribute("readonly");
    expect(code).toHaveAttribute("aria-readonly", "true");

    // Every other field is a normal editable input.
    for (const field of [
      "nombre",
      "descripcion",
      "categoria",
      "tarifa",
      "duracion_min",
    ]) {
      expect(
        within(dialog).getByTestId(`services.import_${field}.1`),
      ).not.toHaveAttribute("readonly");
    }
  });

  it("shows a visible Spanish hint that the code cannot be modified", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0220,Frenos,,Frenos,50000,45,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    expect(
      within(dialog).getByText(
        /El código no se puede modificar; se conserva tal como viene en el archivo\./,
      ),
    ).toBeInTheDocument();
    // The locked input is described by that hint for assistive technology.
    expect(
      within(dialog).getByTestId("services.import_code.1"),
    ).toHaveAccessibleDescription(
      /El código no se puede modificar; se conserva tal como viene en el archivo\./,
    );
  });

  it("does not change the code when the user types into the locked field", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0230,Frenos,,Frenos,50000,45,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    const code = within(dialog).getByTestId("services.import_code.1");
    await userEvent.type(code, "XXX");

    expect(code).toHaveValue("SRV-0230");
  });

  it("disables the confirm button when no import row is valid", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    // Both rows lack a name, so neither is importable.
    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0300,,,Frenos,50000,45,1",
      "SRV-0301,,,Frenos,10000,30,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    expect(within(dialog).getByText("2 con errores")).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("services.import_confirm_button"),
    ).toBeDisabled();
    expect(bulkCreateServicesMock).not.toHaveBeenCalled();
  });

  it("maps each confirmed row to a ServiceInput with the file's code and the row's other values", async () => {
    bulkCreateServicesMock.mockResolvedValue([
      service({ code: "SRV-0400" }),
      service({ code: "SRV-0401" }),
    ]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0400,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
      "SRV-0401,Alineación,,Suspensión,30000,30,0",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
      description: string;
      category: string;
      laborRate: bigint;
      estimatedMinutes: bigint;
      active: boolean;
    }>;
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toEqual({
      code: "SRV-0400",
      name: "Cambio de aceite",
      description: "Incluye filtro",
      category: "Mantenimiento",
      laborRate: 4500000n,
      estimatedMinutes: 60n,
      active: true,
    });
    expect(inputs[1]).toEqual({
      code: "SRV-0401",
      name: "Alineación",
      description: "",
      category: "Suspensión",
      laborRate: 3000000n,
      estimatedMinutes: 30n,
      active: false,
    });
  });

  it("sends the file's code with the user's edited values on confirm", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-0450" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0450,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");

    // Edit every editable field; the code stays locked.
    const name = within(dialog).getByTestId("services.import_nombre.1");
    await userEvent.clear(name);
    await userEvent.type(name, "Cambio de aceite premium");

    const description = within(dialog).getByTestId(
      "services.import_descripcion.1",
    );
    await userEvent.clear(description);
    await userEvent.type(description, "Incluye filtro premium");

    const category = within(dialog).getByTestId("services.import_categoria.1");
    await userEvent.clear(category);
    await userEvent.type(category, "Premium");

    const rate = within(dialog).getByTestId("services.import_tarifa.1");
    await userEvent.clear(rate);
    await userEvent.type(rate, "99000");

    const duration = within(dialog).getByTestId(
      "services.import_duracion_min.1",
    );
    await userEvent.clear(duration);
    await userEvent.type(duration, "120");

    // Flip the active flag to Inactivo.
    await userEvent.click(
      within(dialog).getByTestId("services.import_activo.1"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Inactivo" }),
    );

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
      description: string;
      category: string;
      laborRate: bigint;
      estimatedMinutes: bigint;
      active: boolean;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toEqual({
      // The code is preserved exactly as it came in the file.
      code: "SRV-0450",
      name: "Cambio de aceite premium",
      description: "Incluye filtro premium",
      category: "Premium",
      laborRate: 9900000n,
      estimatedMinutes: 120n,
      active: false,
    });
  });

  it("refreshes the visible catalog after a successful import", async () => {
    // The catalog starts empty; after the import the backend returns the new
    // service, and the page must re-query without a reload.
    listServicesMock
      .mockResolvedValueOnce(page([]))
      .mockResolvedValue(page([service({ code: "SRV-0460" })]));
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-0460" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0460,Frenos,,Frenos,50000,45,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    // The catalog re-queries and shows the imported service without a reload.
    expect(await screen.findByText("SRV-0460")).toBeInTheDocument();
    expect(
      screen.queryByTestId("services.empty_state"),
    ).not.toBeInTheDocument();
  });

  it("keeps the import dialog open and reports an error when the bulk call fails", async () => {
    bulkCreateServicesMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0500,Frenos,,Frenos,50000,45,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo completar la importación.",
      ),
    );
    const summary = await screen.findByTestId("services.import_summary");
    expect(summary).toHaveTextContent("0 importados");
    expect(summary).toHaveTextContent(
      "No se pudo completar la importación. Intenta de nuevo.",
    );
  });

  // --- Characterization: the import summary and value mapping the code-lock
  // change keeps ------------------------------------------------------------
  //
  // The accepted change locks the `codigo` field in the preview while the other
  // fields stay editable. These tests protect the parts of the confirm path
  // that must not change with it: the summary counts what the backend actually
  // created (a duplicate code is silently omitted by `bulkCreateServices`), and
  // the row's other values are mapped to their typed `ServiceInput` fields.

  it("reports the backend's created count when a duplicate code is omitted", async () => {
    // The backend silently omits a row whose code already exists, so it returns
    // fewer services than the valid rows sent. The summary must reflect what was
    // really created, not the number of rows in the file.
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-0601" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0600,Duplicado,,Frenos,50000,45,1",
      "SRV-0601,Nuevo,,Frenos,10000,30,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    // Both valid rows were sent, even though only one was created.
    expect(bulkCreateServicesMock.mock.calls[0][0]).toHaveLength(2);

    const summary = await screen.findByTestId("services.import_summary");
    expect(summary).toHaveTextContent("1 importado");
    // No row was skipped by the frontend validation, so the omitted count is 0.
    expect(summary).toHaveTextContent("0 omitidos");
  });

  it("maps the row's inactive flag and numeric fields to their typed values", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-0700" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    // "inactivo" is one of the values `parseActive` treats as false; the rate is
    // a decimal amount and the duration an integer, both mapped to bigint.
    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-0700,Servicio inactivo,,Varios,1234.56,90,inactivo",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      laborRate: bigint;
      estimatedMinutes: bigint;
      active: boolean;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toMatchObject({
      code: "SRV-0700",
      // 1234.56 COP -> 123456 cents.
      laborRate: 123456n,
      estimatedMinutes: 90n,
      active: false,
    });
  });

  it("trims the code and name of each confirmed row", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-0800" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "  SRV-0800  ,  Cambio de aceite  ,  Incluye filtro  ,  Mantenimiento  ,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    await screen.findByTestId("services.import_dialog");
    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
      description: string;
      category: string;
    }>;
    expect(inputs[0]).toEqual({
      code: "SRV-0800",
      name: "Cambio de aceite",
      description: "Incluye filtro",
      category: "Mantenimiento",
      laborRate: 4500000n,
      estimatedMinutes: 60n,
      active: true,
    });
  });

  // --- Characterization: the import preview's non-category editing contract
  //
  // The accepted change is scoped to how the `categoria` cell of a preview row
  // is edited. These tests protect the behavior around it that must not change:
  // every other editable field still replaces its parsed value and is sent on
  // confirm, the locked code is preserved, and an edit stays on its own row.

  it("replaces the parsed value of every non-category editable field on confirm", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-1000" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-1000,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");

    const name = within(dialog).getByTestId("services.import_nombre.1");
    await userEvent.clear(name);
    await userEvent.type(name, "Cambio de aceite premium");

    const description = within(dialog).getByTestId(
      "services.import_descripcion.1",
    );
    await userEvent.clear(description);
    await userEvent.type(description, "Incluye filtro premium");

    const rate = within(dialog).getByTestId("services.import_tarifa.1");
    await userEvent.clear(rate);
    await userEvent.type(rate, "99000");

    const duration = within(dialog).getByTestId(
      "services.import_duracion_min.1",
    );
    await userEvent.clear(duration);
    await userEvent.type(duration, "120");

    await userEvent.click(
      within(dialog).getByTestId("services.import_activo.1"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Inactivo" }),
    );

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
      description: string;
      category: string;
      laborRate: bigint;
      estimatedMinutes: bigint;
      active: boolean;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toEqual({
      // The code is untouched by the other edits.
      code: "SRV-1000",
      name: "Cambio de aceite premium",
      description: "Incluye filtro premium",
      // The category is left as parsed; this test does not edit it.
      category: "Mantenimiento",
      laborRate: 9900000n,
      estimatedMinutes: 120n,
      active: false,
    });
  });

  it("keeps the locked code when the other fields of the row are edited", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-1010" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-1010,Frenos,,Frenos,50000,45,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    const code = within(dialog).getByTestId("services.import_code.1");
    const name = within(dialog).getByTestId("services.import_nombre.1");
    await userEvent.clear(name);
    await userEvent.type(name, "Frenos premium");

    // The code input stays locked and keeps the file's value.
    expect(code).toHaveValue("SRV-1010");
    expect(code).toHaveAttribute("readonly");

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));
    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
    }>;
    expect(inputs[0].code).toBe("SRV-1010");
    expect(inputs[0].name).toBe("Frenos premium");
  });

  it("keeps each row's edits scoped to that row on confirm", async () => {
    bulkCreateServicesMock.mockResolvedValue([
      service({ code: "SRV-1020" }),
      service({ code: "SRV-1021" }),
    ]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-1020,Frenos,,Frenos,50000,45,1",
      "SRV-1021,Alineación,,Suspensión,30000,30,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    const name2 = within(dialog).getByTestId("services.import_nombre.1");
    await userEvent.clear(name2);
    await userEvent.type(name2, "Frenos premium");

    // The first row's edit does not leak into the second row.
    expect(within(dialog).getByTestId("services.import_nombre.2")).toHaveValue(
      "Alineación",
    );

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));
    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
    }>;
    expect(inputs[0]).toMatchObject({
      code: "SRV-1020",
      name: "Frenos premium",
    });
    expect(inputs[1]).toMatchObject({
      code: "SRV-1021",
      name: "Alineación",
    });
  });

  // --- Accepted behavior: editing the category replaces the parsed value and
  // survives edits to other fields ------------------------------------------
  //
  // The accepted change makes the `categoria` cell of a preview row behave like
  // every other editable field: the new value replaces the parsed one and is
  // sent to `bulkCreateServices` on confirm. Because the row keeps a stable
  // identity while the user types, editing the category and then another field
  // (or the reverse) must preserve both edits instead of remounting the row and
  // dropping the first one.

  it("replaces the parsed category with the edited value on confirm", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-1100" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-1100,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    const category = within(dialog).getByTestId("services.import_categoria.1");
    await userEvent.clear(category);
    await userEvent.type(category, "Premium");

    // The new value replaces the parsed one in the preview itself.
    expect(category).toHaveValue("Premium");

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      category: string;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0].code).toBe("SRV-1100");
    expect(inputs[0].category).toBe("Premium");
  });

  it("keeps the edited category when another field is edited afterwards", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-1110" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-1110,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");

    // Edit the category first...
    const category = within(dialog).getByTestId("services.import_categoria.1");
    await userEvent.clear(category);
    await userEvent.type(category, "Premium");

    // ...then edit the name. The category edit must not be discarded.
    const name = within(dialog).getByTestId("services.import_nombre.1");
    await userEvent.clear(name);
    await userEvent.type(name, "Cambio de aceite premium");

    expect(category).toHaveValue("Premium");
    expect(name).toHaveValue("Cambio de aceite premium");

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
      category: string;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toEqual(
      expect.objectContaining({
        code: "SRV-1110",
        name: "Cambio de aceite premium",
        category: "Premium",
      }),
    );
  });

  it("keeps the edited category when another field was edited first", async () => {
    bulkCreateServicesMock.mockResolvedValue([service({ code: "SRV-1120" })]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-1120,Cambio de aceite,Incluye filtro,Mantenimiento,45000,60,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");

    // Edit the name first...
    const name = within(dialog).getByTestId("services.import_nombre.1");
    await userEvent.clear(name);
    await userEvent.type(name, "Cambio de aceite premium");

    // ...then edit the category. The name edit must not be discarded.
    const category = within(dialog).getByTestId("services.import_categoria.1");
    await userEvent.clear(category);
    await userEvent.type(category, "Premium");

    expect(name).toHaveValue("Cambio de aceite premium");
    expect(category).toHaveValue("Premium");

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      name: string;
      category: string;
    }>;
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toEqual(
      expect.objectContaining({
        code: "SRV-1120",
        name: "Cambio de aceite premium",
        category: "Premium",
      }),
    );
  });

  it("keeps each row's edited category scoped to that row on confirm", async () => {
    bulkCreateServicesMock.mockResolvedValue([
      service({ code: "SRV-1130" }),
      service({ code: "SRV-1131" }),
    ]);
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    const csv = [
      "codigo,nombre,descripcion,categoria,tarifa,duracion_min,activo",
      "SRV-1130,Frenos,,Frenos,50000,45,1",
      "SRV-1131,Alineación,,Suspensión,30000,30,1",
    ].join("\n");
    await userEvent.upload(
      screen.getByTestId("services.csv.file_input"),
      csvFile(csv),
    );

    const dialog = await screen.findByTestId("services.import_dialog");
    const category1 = within(dialog).getByTestId("services.import_categoria.1");
    await userEvent.clear(category1);
    await userEvent.type(category1, "Premium");

    // The first row's category edit does not leak into the second row.
    expect(
      within(dialog).getByTestId("services.import_categoria.2"),
    ).toHaveValue("Suspensión");

    await userEvent.click(screen.getByTestId("services.import_confirm_button"));

    await waitFor(() =>
      expect(bulkCreateServicesMock).toHaveBeenCalledTimes(1),
    );
    const inputs = bulkCreateServicesMock.mock.calls[0][0] as Array<{
      code: string;
      category: string;
    }>;
    expect(inputs[0]).toMatchObject({
      code: "SRV-1130",
      category: "Premium",
    });
    expect(inputs[1]).toMatchObject({
      code: "SRV-1131",
      category: "Suspensión",
    });
  });

  // --- Characterization: the catalog header and full list -------------------
  //
  // The accepted change adds an administrator-only "Poner servicios en cero"
  // action to the header and shows the whole catalog instead of one page. These
  // tests protect the adjacent behavior: the existing header actions still work
  // and every service the backend returns is rendered.

  it("opens the category management dialog from the header", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    await userEvent.click(
      screen.getByTestId("services.manage_categories_button"),
    );

    expect(
      await screen.findByTestId("service_categories.dialog"),
    ).toBeInTheDocument();
  });

  it("renders every service the backend returns in the list", async () => {
    listServicesMock.mockResolvedValue(
      page([
        service({ id: 1n, code: "SRV-0001", name: "Cambio de aceite" }),
        service({ id: 2n, code: "SRV-0002", name: "Alineación" }),
        service({ id: 3n, code: "SRV-0003", name: "Frenos" }),
      ]),
    );
    renderWithProviders(<ServicesPage />);

    expect(await screen.findByText("SRV-0001")).toBeInTheDocument();
    expect(screen.getByText("SRV-0002")).toBeInTheDocument();
    expect(screen.getByText("SRV-0003")).toBeInTheDocument();
  });

  // --- Accepted behavior: putting the workshop services in zeros ------------
  //
  // The accepted change adds an administrator-only "Poner servicios en cero"
  // action. These tests pin the observable contract: only an administrator sees
  // the button, confirming calls the backend and reports the deleted count, and
  // a failure keeps the dialog open with a Spanish error.

  it("shows the zero-services button to an administrator", async () => {
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    expect(screen.getByTestId("services.zero_button")).toBeInTheDocument();
  });

  it("hides the zero-services button from a non-administrator", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    expect(
      screen.queryByTestId("services.zero_button"),
    ).not.toBeInTheDocument();
  });

  it("zeroes the catalog only after confirming and reports the deleted count", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    zeroServicesMock.mockResolvedValue({ deleted: 4n });
    renderWithProviders(<ServicesPage />);
    await screen.findByText("SRV-0001");

    await userEvent.click(screen.getByTestId("services.zero_button"));
    await screen.findByTestId("services.zero_dialog");
    // Nothing is deleted until the destructive action is confirmed.
    expect(zeroServicesMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("services.zero_confirm_button"));

    await waitFor(() => expect(zeroServicesMock).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByTestId("services.zero_success"),
    ).toHaveTextContent("Se eliminaron 4 servicios del catálogo.");
    expect(toast.success).toHaveBeenCalledWith(
      "Se eliminaron 4 servicios del catálogo.",
    );
  });

  it("keeps the dialog open and shows a Spanish error when zeroing fails", async () => {
    zeroServicesMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<ServicesPage />);
    await screen.findByTestId("services.empty_state");

    await userEvent.click(screen.getByTestId("services.zero_button"));
    await screen.findByTestId("services.zero_dialog");
    await userEvent.click(screen.getByTestId("services.zero_confirm_button"));

    expect(await screen.findByTestId("services.zero_error")).toHaveTextContent(
      "No se pudieron poner los servicios en cero",
    );
    expect(screen.getByTestId("services.zero_dialog")).toBeInTheDocument();
    expect(
      screen.queryByTestId("services.zero_success"),
    ).not.toBeInTheDocument();
  });

  // --- Characterization: the existing email notify journey ------------------
  //
  // The accepted change adds a WhatsApp action beside the email action on this
  // page. This test protects the email wiring around it: the row action opens
  // the dialog for the first registered customer, the recipient is that
  // customer's registered email, and the send carries the service source.

  it("opens the notify dialog for the registered customer and sends to their email", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    listCustomersMock.mockResolvedValue([customer()]);
    notifyCustomerMock.mockResolvedValue(notificationResult());
    renderWithProviders(<ServicesPage />);

    await screen.findByText("SRV-0001");
    await userEvent.click(screen.getByTestId("services.save_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(within(dialog).getByTestId("notify.recipient_input")).toHaveValue(
      "ada@example.com",
    );

    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(notifyCustomerMock.mock.calls[0][0]).toMatchObject({
      customerId: 1n,
      source: NotificationSource.service,
    });
    expect(
      await within(dialog).findByTestId("notify.success_state"),
    ).toHaveTextContent("ada@example.com");
  });

  it("blocks the notify send when the registered customer has no email", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    listCustomersMock.mockResolvedValue([customer({ email: undefined })]);
    renderWithProviders(<ServicesPage />);

    await screen.findByText("SRV-0001");
    await userEvent.click(screen.getByTestId("services.save_button.1"));

    const dialog = await screen.findByTestId("notify.dialog");
    expect(
      within(dialog).getByTestId("notify.no_email_state"),
    ).toBeInTheDocument();
    expect(within(dialog).getByTestId("notify.submit_button")).toBeDisabled();
    expect(notifyCustomerMock).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the WhatsApp action is gone from the service list --
  //
  // The accepted change removes the per-row "Enviar por WhatsApp" control from
  // this page. The shared WhatsAppNotifyButton component is unchanged and still
  // covered by its own tests; here we only pin that this page no longer renders
  // the control, while the standard row actions and the email notify journey
  // above keep working.

  it("does not render a WhatsApp row action", async () => {
    listServicesMock.mockResolvedValue(page([service()]));
    listCustomersMock.mockResolvedValue([customer()]);
    renderWithProviders(<ServicesPage />);

    await screen.findByText("SRV-0001");

    expect(
      screen.queryByTestId("services.whatsapp_button.1"),
    ).not.toBeInTheDocument();
    // The standard row actions are unaffected by the removal.
    expect(screen.getByTestId("services.edit_button.1")).toBeInTheDocument();
    expect(screen.getByTestId("services.save_button.1")).toBeInTheDocument();
    expect(screen.getByTestId("services.delete_button.1")).toBeInTheDocument();
  });
});
