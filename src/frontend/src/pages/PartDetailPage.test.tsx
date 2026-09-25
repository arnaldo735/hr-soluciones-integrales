import type { Lot, Movement, PartView } from "@/lib/types";
import { AdjustmentDirection, MovementKind, UserRole } from "@/lib/types";
import { PartDetailPage } from "@/pages/PartDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useRoleMock = vi.fn();
const getPartMock = vi.fn();
const listLotsMock = vi.fn();
const listMovementsMock = vi.fn();
const adjustStockMock = vi.fn();

vi.mock("@/hooks/use-role", () => ({
  useRole: () => useRoleMock(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getPart: getPartMock,
      listLots: listLotsMock,
      listMovements: listMovementsMock,
      adjustStock: adjustStockMock,
    },
    isFetching: false,
  }),
}));

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
  useParams: () => ({ id: "1" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 1n,
    sku: "REP-0001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
    totalStock: 12n,
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function lot(overrides: Partial<Lot> = {}): Lot {
  return {
    id: 10n,
    lotNumber: "L-001",
    receivedAt: 1_700_000_000_000_000_000n,
    quantity: 8n,
    purchaseId: undefined,
    supplierId: 3n,
    partId: 1n,
    unitCost: 12000n,
    ...overrides,
  };
}

function movement(overrides: Partial<Movement> = {}): Movement {
  return {
    at: 1_700_000_000_000_000_000n,
    id: 100n,
    kind: MovementKind.purchase,
    referenceId: undefined,
    lotId: undefined,
    performedBy: Principal.fromText("aaaaa-aa"),
    quantity: 8n,
    partId: 1n,
    unitCost: 12000n,
    reason: "Compra a proveedor",
    ...overrides,
  };
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

describe("PartDetailPage", () => {
  beforeEach(() => {
    useRoleMock.mockReset();
    getPartMock.mockReset();
    listLotsMock.mockReset();
    listMovementsMock.mockReset();
    adjustStockMock.mockReset();
    useRoleMock.mockReturnValue(roleState(true));
    getPartMock.mockResolvedValue(part());
    listLotsMock.mockResolvedValue([]);
    listMovementsMock.mockResolvedValue([]);
  });

  it("renders the part header with stock, sale price and threshold", async () => {
    renderWithProviders(<PartDetailPage />);

    expect(await screen.findByText("Balata de freno")).toBeInTheDocument();
    expect(screen.getByText("REP-0001")).toBeInTheDocument();
    expect(screen.getByText("Frenos · Brembo")).toBeInTheDocument();
    expect(screen.getByText("12 pza")).toBeInTheDocument();
    expect(screen.getByText("Umbral de alerta: 5")).toBeInTheDocument();
    expect(screen.getByText("$ 250")).toBeInTheDocument();
  });

  it("flags a part below its low-stock threshold", async () => {
    getPartMock.mockResolvedValue(part({ totalStock: 2n, lowStock: true }));
    renderWithProviders(<PartDetailPage />);

    expect(
      await screen.findByTestId("part_detail.low_stock_badge"),
    ).toBeInTheDocument();
  });

  it("shows the cost price tile to an administrator", async () => {
    renderWithProviders(<PartDetailPage />);

    await screen.findByText("Balata de freno");
    expect(screen.getByText("Precio de costo")).toBeInTheDocument();
    expect(screen.getByText("$ 120")).toBeInTheDocument();
  });

  it("hides the cost price tile from a mechanic", async () => {
    useRoleMock.mockReturnValue(roleState(false));
    renderWithProviders(<PartDetailPage />);

    await screen.findByText("Balata de freno");
    expect(screen.queryByText("Precio de costo")).not.toBeInTheDocument();
    expect(screen.queryByText("$ 120")).not.toBeInTheDocument();
    // The sale price remains visible to a mechanic.
    expect(screen.getByText("$ 250")).toBeInTheDocument();
  });

  it("renders the lots table with supplier and unit cost", async () => {
    listLotsMock.mockResolvedValue([lot()]);
    renderWithProviders(<PartDetailPage />);

    const row = await screen.findByTestId("part_detail.lot.1");
    expect(row).toHaveTextContent("L-001");
    expect(row).toHaveTextContent("8");
    expect(row).toHaveTextContent("$ 120");
    expect(row).toHaveTextContent("Proveedor #3");
  });

  it("renders an empty state when the part has no lots", async () => {
    renderWithProviders(<PartDetailPage />);

    expect(
      await screen.findByTestId("part_detail.lots_empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Este repuesto no tiene lotes registrados."),
    ).toBeInTheDocument();
  });

  it("renders the movements table with a signed quantity and reason", async () => {
    listMovementsMock.mockResolvedValue([
      movement({ kind: MovementKind.purchase, quantity: 8n }),
      movement({
        id: 101n,
        kind: MovementKind.sale,
        quantity: 3n,
        reason: "Venta en mostrador",
      }),
    ]);
    renderWithProviders(<PartDetailPage />);

    const incoming = await screen.findByTestId("part_detail.movement.1");
    expect(incoming).toHaveTextContent("Compra");
    expect(incoming).toHaveTextContent("+8");
    expect(incoming).toHaveTextContent("Compra a proveedor");

    const outgoing = screen.getByTestId("part_detail.movement.2");
    expect(outgoing).toHaveTextContent("Venta");
    expect(outgoing).toHaveTextContent("−3");
    expect(outgoing).toHaveTextContent("Venta en mostrador");
  });

  it("renders an empty state when the part has no movements", async () => {
    renderWithProviders(<PartDetailPage />);

    expect(
      await screen.findByTestId("part_detail.movements_empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sin movimientos registrados todavía."),
    ).toBeInTheDocument();
  });

  it("renders an error state when the part cannot be loaded", async () => {
    getPartMock.mockResolvedValue(null);
    renderWithProviders(<PartDetailPage />);

    expect(
      await screen.findByTestId("part_detail.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Repuesto no encontrado")).toBeInTheDocument();
  });

  it("submits an adjustment with the entered direction, quantity and reason", async () => {
    adjustStockMock.mockResolvedValue(movement());
    renderWithProviders(<PartDetailPage />);
    await screen.findByText("Balata de freno");

    await userEvent.click(screen.getByTestId("part_detail.adjust_button"));
    const dialog = await screen.findByTestId("part_detail.adjust_dialog");

    await userEvent.click(
      within(dialog).getByTestId("part_detail.direction_out_button"),
    );
    await userEvent.type(
      within(dialog).getByTestId("part_detail.quantity_input"),
      "4",
    );
    await userEvent.type(
      within(dialog).getByTestId("part_detail.reason_input"),
      "Merma por daño",
    );
    await userEvent.click(
      within(dialog).getByTestId("part_detail.submit_button"),
    );

    await waitFor(() => expect(adjustStockMock).toHaveBeenCalledTimes(1));
    expect(adjustStockMock).toHaveBeenCalledWith({
      partId: 1n,
      direction: AdjustmentDirection.out,
      quantity: 4n,
      reason: "Merma por daño",
      lotId: undefined,
    });
  });

  it("does not submit an adjustment with a zero quantity", async () => {
    renderWithProviders(<PartDetailPage />);
    await screen.findByText("Balata de freno");

    await userEvent.click(screen.getByTestId("part_detail.adjust_button"));
    const dialog = await screen.findByTestId("part_detail.adjust_dialog");

    // The quantity input enforces `min="1"`, so a zero quantity fails native
    // constraint validation and the form never reaches the backend.
    await userEvent.type(
      within(dialog).getByTestId("part_detail.quantity_input"),
      "0",
    );
    await userEvent.type(
      within(dialog).getByTestId("part_detail.reason_input"),
      "Conteo físico",
    );
    await userEvent.click(
      within(dialog).getByTestId("part_detail.submit_button"),
    );

    expect(adjustStockMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("part_detail.adjust_dialog")).toBeInTheDocument();
  });

  it("does not submit an adjustment without a reason", async () => {
    renderWithProviders(<PartDetailPage />);
    await screen.findByText("Balata de freno");

    await userEvent.click(screen.getByTestId("part_detail.adjust_button"));
    const dialog = await screen.findByTestId("part_detail.adjust_dialog");

    // The reason textarea is `required`, so an empty reason fails native
    // constraint validation and the form never reaches the backend.
    await userEvent.type(
      within(dialog).getByTestId("part_detail.quantity_input"),
      "3",
    );
    await userEvent.click(
      within(dialog).getByTestId("part_detail.submit_button"),
    );

    expect(adjustStockMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("part_detail.adjust_dialog")).toBeInTheDocument();
  });

  it("keeps the dialog open and reports an error when the adjustment fails", async () => {
    adjustStockMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<PartDetailPage />);
    await screen.findByText("Balata de freno");

    await userEvent.click(screen.getByTestId("part_detail.adjust_button"));
    const dialog = await screen.findByTestId("part_detail.adjust_dialog");

    await userEvent.type(
      within(dialog).getByTestId("part_detail.quantity_input"),
      "2",
    );
    await userEvent.type(
      within(dialog).getByTestId("part_detail.reason_input"),
      "Devolución",
    );
    await userEvent.click(
      within(dialog).getByTestId("part_detail.submit_button"),
    );

    expect(
      await within(dialog).findByTestId("part_detail.adjust_error"),
    ).toHaveTextContent("No se pudo registrar el ajuste. Intenta de nuevo.");
    expect(screen.getByTestId("part_detail.adjust_dialog")).toBeInTheDocument();
  });

  it("paginates the movement history when it exceeds one page", async () => {
    listMovementsMock.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) =>
        movement({
          id: BigInt(200 + index),
          reason: `Movimiento ${index + 1}`,
        }),
      ),
    );
    renderWithProviders(<PartDetailPage />);

    expect(await screen.findByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByTestId("part_detail.movement.1")).toHaveTextContent(
      "Movimiento 1",
    );
    expect(
      screen.queryByTestId("part_detail.movement.11"),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("part_detail.movements_next"));

    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getByTestId("part_detail.movement.1")).toHaveTextContent(
      "Movimiento 11",
    );
  });
});
