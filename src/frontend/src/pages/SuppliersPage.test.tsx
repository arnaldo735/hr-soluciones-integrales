import type { Payable, Supplier } from "@/lib/types";
import { PayableStatus } from "@/lib/types";
import { SuppliersPage } from "@/pages/SuppliersPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listSuppliersMock = vi.fn();
const listPayablesMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listSuppliers: listSuppliersMock,
      listPayables: listPayablesMock,
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

describe("SuppliersPage", () => {
  beforeEach(() => {
    listSuppliersMock.mockReset();
    listPayablesMock.mockReset();
    listPayablesMock.mockResolvedValue([]);
  });

  it("lists suppliers with contact and fiscal data", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    renderWithProviders(<SuppliersPage />);

    expect(
      await screen.findByText("Refacciones del Norte"),
    ).toBeInTheDocument();
    expect(screen.getByText("Laura Medina")).toBeInTheDocument();
    expect(screen.getByText("81 8345 2210")).toBeInTheDocument();
    expect(screen.getByText("RDN980412H73")).toBeInTheDocument();
  });

  it("shows the pending payable balance and status for a supplier", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    listPayablesMock.mockResolvedValue([payable()]);
    renderWithProviders(<SuppliersPage />);

    await screen.findByText("Refacciones del Norte");
    // The balance appears in both the KPI tile and the supplier row.
    expect(screen.getAllByText("$ 3.000")).toHaveLength(2);
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("marks a supplier with no purchases as having no payable", async () => {
    listSuppliersMock.mockResolvedValue([supplier()]);
    listPayablesMock.mockResolvedValue([]);
    renderWithProviders(<SuppliersPage />);

    await screen.findByText("Refacciones del Norte");
    expect(screen.getByText("Sin compras")).toBeInTheDocument();
  });

  it("renders an empty state when there are no suppliers", async () => {
    listSuppliersMock.mockResolvedValue([]);
    renderWithProviders(<SuppliersPage />);

    expect(
      await screen.findByTestId("suppliers.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay proveedores")).toBeInTheDocument();
  });

  it("passes the trimmed search term to the backend", async () => {
    listSuppliersMock.mockResolvedValue([]);
    renderWithProviders(<SuppliersPage />);

    await waitFor(() => expect(listSuppliersMock).toHaveBeenCalled());
    expect(listSuppliersMock).toHaveBeenLastCalledWith(null);

    await userEvent.type(
      screen.getByTestId("suppliers.search_input"),
      "  Norte  ",
    );

    await waitFor(() =>
      expect(listSuppliersMock).toHaveBeenLastCalledWith("Norte"),
    );
  });

  it("renders an error state when the supplier list fails", async () => {
    listSuppliersMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<SuppliersPage />);

    expect(
      await screen.findByTestId("suppliers.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudieron cargar los proveedores"),
    ).toBeInTheDocument();
  });

  // --- Accepted behavior: the WhatsApp action removed from the supplier list -
  //
  // The accepted change removes the "Enviar por WhatsApp" action from each row
  // of the supplier list. The row keeps its other actions (Compra, Editar), but
  // no WhatsApp button is rendered for any supplier.

  it("does not render a WhatsApp action on any row but keeps Compra and Editar", async () => {
    listSuppliersMock.mockResolvedValue([
      supplier({ id: 1n, name: "Refacciones del Norte" }),
      supplier({ id: 2n, name: "Repuestos Andinos" }),
    ]);
    renderWithProviders(<SuppliersPage />);

    await screen.findByText("Refacciones del Norte");

    expect(screen.queryByTestId("suppliers.whatsapp_button.1")).toBeNull();
    expect(screen.queryByTestId("suppliers.whatsapp_button.2")).toBeNull();
    // The adjacent row actions are untouched by the removal.
    expect(
      screen.getByTestId("suppliers.purchase_button.1"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("suppliers.edit_button.1")).toBeInTheDocument();
  });
});
