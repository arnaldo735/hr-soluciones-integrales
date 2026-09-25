import type { Payable, Supplier } from "@/lib/types";
import { PayableStatus } from "@/lib/types";
import { SuppliersPage } from "@/pages/SuppliersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the `/proveedores` directory's row actions and
 * dialogs.
 *
 * The accepted change removes the "Enviar por WhatsApp" action from each row of
 * this listing. Everything else about the directory must keep working: the KPI
 * tiles, the link to the supplier detail, the "Compra" action opening the
 * purchase dialog, and the create/edit supplier dialog. These tests pin that
 * adjacent behavior and deliberately never assert the row's WhatsApp button,
 * whose removal is the accepted change.
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

function payable(overrides: Partial<Payable> = {}): Payable {
  return {
    supplierId: 1n,
    supplierName: "Refacciones del Norte",
    status: PayableStatus.pending,
    totalPurchased: 500000n,
    totalPaid: 200000n,
    balance: 300000n,
    dueDate: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

describe("SuppliersPage row actions and dialogs (characterization)", () => {
  beforeEach(() => {
    listSuppliersMock.mockReset();
    listPayablesMock.mockReset();
    createSupplierMock.mockReset();
    updateSupplierMock.mockReset();
    navigateMock.mockReset();
    listPayablesMock.mockResolvedValue([]);
  });

  it("shows the KPI tiles for the directory and its pending balances", async () => {
    listSuppliersMock.mockResolvedValue([
      supplier(),
      supplier({ id: 2n, name: "Repuestos Andinos" }),
    ]);
    listPayablesMock.mockResolvedValue([payable()]);

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    const kpis = screen.getByTestId("suppliers.kpi.section");
    // Two suppliers registered, one with a pending balance of $ 3.000.
    expect(within(kpis).getByText("2")).toBeInTheDocument();
    expect(within(kpis).getByText("1")).toBeInTheDocument();
    expect(within(kpis).getByText("$ 3.000")).toBeInTheDocument();
  });

  it("links each row to that supplier's detail page", async () => {
    listSuppliersMock.mockResolvedValue([
      supplier({ id: 1n, name: "Refacciones del Norte" }),
      supplier({ id: 2n, name: "Repuestos Andinos" }),
    ]);

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    const link = screen.getByTestId("suppliers.link.2");
    expect(link).toHaveAttribute("href", "/proveedores/$id");
    expect(link).toHaveAttribute("data-params", JSON.stringify({ id: "2" }));
  });

  it("opens the purchase dialog from the row's Compra action", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    await userEvent.click(screen.getByTestId("suppliers.purchase_button.1"));

    const dialog = await screen.findByTestId("suppliers.purchase_dialog");
    expect(
      within(dialog).getByText("Registrar compra de reposición"),
    ).toBeInTheDocument();
    // The dialog is scoped to the clicked supplier.
    expect(
      within(dialog).getByText(/Refacciones del Norte/),
    ).toBeInTheDocument();
  });

  it("opens a blank create dialog from the new-supplier button", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    await userEvent.click(screen.getByTestId("suppliers.create_button"));

    const dialog = await screen.findByTestId("suppliers.dialog");
    expect(within(dialog).getByText("Nuevo proveedor")).toBeInTheDocument();
    expect(screen.getByTestId("suppliers.name_input")).toHaveValue("");
    expect(screen.getByTestId("suppliers.phone_input")).toHaveValue("");
  });

  it("opens the edit dialog for the clicked supplier", async () => {
    listSuppliersMock.mockResolvedValue([
      supplier({ id: 1n, name: "Refacciones del Norte" }),
      supplier({
        id: 2n,
        name: "Repuestos Andinos",
        contactName: "Carlos Ríos",
        phone: "604 444 8890",
        taxId: "900123456",
      }),
    ]);

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    await userEvent.click(screen.getByTestId("suppliers.edit_button.2"));

    const dialog = await screen.findByTestId("suppliers.dialog");
    expect(within(dialog).getByText("Editar proveedor")).toBeInTheDocument();
    // The edit dialog's submit action is the update variant.
    expect(screen.getByTestId("suppliers.submit_button")).toHaveTextContent(
      "Guardar cambios",
    );
  });

  it("creates a supplier on submit and refreshes the directory", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    createSupplierMock.mockResolvedValue(
      supplier({ id: 2n, name: "Repuestos Andinos" }),
    );

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    await userEvent.click(screen.getByTestId("suppliers.create_button"));
    await screen.findByTestId("suppliers.dialog");

    await userEvent.type(
      screen.getByTestId("suppliers.name_input"),
      "Repuestos Andinos",
    );
    await userEvent.type(
      screen.getByTestId("suppliers.phone_input"),
      "604 444 8890",
    );

    // The write happens only on submit, with the typed values.
    expect(createSupplierMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("suppliers.submit_button"));

    await waitFor(() =>
      expect(createSupplierMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Repuestos Andinos",
          phone: "604 444 8890",
        }),
      ),
    );

    // The directory is invalidated and read again after the save.
    await waitFor(() =>
      expect(listSuppliersMock.mock.calls.length).toBeGreaterThan(1),
    );
  });

  it("updates a supplier on submit with the row's id", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    updateSupplierMock.mockResolvedValue(
      supplier({ name: "Refacciones del Sur" }),
    );

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    await userEvent.click(screen.getByTestId("suppliers.edit_button.1"));
    await screen.findByTestId("suppliers.dialog");

    // Fill the required fields, then submit the edit.
    await userEvent.type(
      screen.getByTestId("suppliers.name_input"),
      "Refacciones del Sur",
    );
    await userEvent.type(
      screen.getByTestId("suppliers.phone_input"),
      "81 8345 2210",
    );

    expect(updateSupplierMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("suppliers.submit_button"));

    await waitFor(() =>
      expect(updateSupplierMock).toHaveBeenCalledWith(
        1n,
        expect.objectContaining({ name: "Refacciones del Sur" }),
      ),
    );
  });

  it("blocks a supplier with no name and does not call the backend", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);

    renderWithProviders(<SuppliersPage />);
    await screen.findByText("Refacciones del Norte");

    await userEvent.click(screen.getByTestId("suppliers.create_button"));
    await screen.findByTestId("suppliers.dialog");

    // Only the phone is filled; the name is left empty. Its native `required`
    // validation keeps the dialog open and no backend call is made.
    await userEvent.type(
      screen.getByTestId("suppliers.phone_input"),
      "604 444 8890",
    );
    await userEvent.click(screen.getByTestId("suppliers.submit_button"));

    expect(screen.getByTestId("suppliers.name_input")).toBeInvalid();
    expect(createSupplierMock).not.toHaveBeenCalled();
  });
});
