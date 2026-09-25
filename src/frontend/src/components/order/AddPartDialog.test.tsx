import { AddPartDialog } from "@/components/order/AddPartDialog";
import type { Lot, PartView } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the workshop-order "Agregar repuesto" dialog, whose parts picker
 * is now a live search box instead of a static catalog select.
 *
 * The accepted change replaces the select with a search input that filters the
 * catalog while typing. These tests pin the new search behavior (the typed term
 * is debounced and forwarded to `useParts`, and the results the backend returns
 * for that term are listed and selectable) and protect the surrounding working
 * behavior: choosing a part shows its price and stock reference, its lots load
 * and are filtered to those with stock, the quantity and stock-sufficiency
 * validation in Spanish still blocks an invalid save, and the payload sent to
 * the backend keeps its stable shape.
 */

const addPartMock = vi.fn();
const listPartsMock = vi.fn();
const listLotsMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useParts: (search: string) => listPartsMock(search),
    useLots: (partId: bigint | null) => listLotsMock(partId),
    useAddOrderPart: () => addPartMock(),
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 10n,
    sku: "BAL-001",
    lowStockThreshold: 2n,
    name: "Balata de freno",
    createdAt: 1_700_000_000_000_000_000n,
    unit: "pza",
    totalStock: 8n,
    category: "Frenos",
    salePrice: 25000n,
    brand: "Genérico",
    costPrice: 12000n,
    lowStock: false,
    ...overrides,
  };
}

function lot(overrides: Partial<Lot> = {}): Lot {
  return {
    id: 3n,
    lotNumber: "L-2024-03",
    receivedAt: 1_700_000_000_000_000_000n,
    quantity: 5n,
    purchaseId: undefined,
    supplierId: undefined,
    partId: 10n,
    unitCost: 12000n,
    ...overrides,
  };
}

function partPage(items: PartView[]) {
  return { items, total: BigInt(items.length), offset: 0n, limit: 50n };
}

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function loadedParts(items: PartView[] = [part()]) {
  return { data: partPage(items), isLoading: false, isError: false };
}

function loadedLots(items: Lot[] = []) {
  return { data: items, isLoading: false, isError: false };
}

/**
 * Picks the catalog part whose visible label matches `name` from the live
 * search results. The search box is typed into first so the debounced term
 * reaches `useParts`, then the matching result button is clicked.
 */
async function selectPart(name: string) {
  await userEvent.type(
    screen.getByTestId("order_detail.add_part.search_input"),
    name,
  );
  const matches = await screen.findAllByText(name);
  await userEvent.click(matches[matches.length - 1]);
}

/** Opens the lot select and picks the option whose label matches `name`. */
async function selectLot(name: string) {
  await userEvent.click(screen.getByTestId("order_detail.add_part.lot_select"));
  const matches = await screen.findAllByText(name);
  await userEvent.click(matches[matches.length - 1]);
}

describe("AddPartDialog", () => {
  beforeEach(() => {
    addPartMock.mockReset();
    listPartsMock.mockReset();
    listLotsMock.mockReset();
    addPartMock.mockReturnValue(idleMutation());
    listPartsMock.mockReturnValue(loadedParts());
    listLotsMock.mockReturnValue(loadedLots());
  });

  it("forwards the typed term to the parts search", async () => {
    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_part.search_input"),
      "balata",
    );

    await waitFor(() =>
      expect(listPartsMock).toHaveBeenLastCalledWith("balata"),
    );
  });

  it("lists the catalog parts the backend returns for the search", async () => {
    listPartsMock.mockReturnValue(
      loadedParts([
        part(),
        part({ id: 11n, sku: "ACE-002", name: "Aceite 10W40" }),
      ]),
    );

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    const list = within(
      await screen.findByTestId("order_detail.add_part.list"),
    );
    expect(list.getByText("BAL-001")).toBeInTheDocument();
    expect(list.getByText("Balata de freno")).toBeInTheDocument();
    expect(list.getByText("ACE-002")).toBeInTheDocument();
    expect(list.getByText("Aceite 10W40")).toBeInTheDocument();
  });

  it("shows the selected part's price and stock reference", async () => {
    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await selectPart("Balata de freno");

    // 25000 cents = $ 250.00, and the catalog stock is 8 pza.
    expect(
      await screen.findByText(/Precio unitario \$ 250/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Existencia 8 pza/)).toBeInTheDocument();
  });

  it("loads the selected part's lots and hides lots with no stock", async () => {
    listLotsMock.mockReturnValue(
      loadedLots([
        lot(),
        lot({ id: 4n, lotNumber: "L-2024-04", quantity: 0n }),
      ]),
    );

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await selectPart("Balata de freno");

    await waitFor(() => expect(listLotsMock).toHaveBeenCalledWith(10n));

    await userEvent.click(
      screen.getByTestId("order_detail.add_part.lot_select"),
    );
    expect(
      (await screen.findAllByText("L-2024-03 · 5 disp.")).length,
    ).toBeGreaterThan(0);
    // The zero-stock lot is filtered out of the options.
    expect(screen.queryByText("L-2024-04 · 0 disp.")).not.toBeInTheDocument();
  });

  it("rejects a non-positive quantity with a Spanish error and does not save", async () => {
    const mutation = idleMutation();
    addPartMock.mockReturnValue(mutation);

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await selectPart("Balata de freno");

    const quantity = screen.getByTestId("order_detail.add_part.quantity_input");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "0");

    await userEvent.click(
      screen.getByTestId("order_detail.add_part.submit_button"),
    );

    expect(
      await screen.findByTestId("order_detail.add_part.error_state"),
    ).toHaveTextContent("Captura una cantidad válida (entero mayor a cero).");
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("rejects a quantity above the available stock and does not save", async () => {
    const mutation = idleMutation();
    addPartMock.mockReturnValue(mutation);

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await selectPart("Balata de freno");

    const quantity = screen.getByTestId("order_detail.add_part.quantity_input");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "9");

    await userEvent.click(
      screen.getByTestId("order_detail.add_part.submit_button"),
    );

    expect(
      await screen.findByTestId("order_detail.add_part.error_state"),
    ).toHaveTextContent(/Stock insuficiente/);
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it("sends the part, quantity and chosen lot to the backend", async () => {
    const mutate = vi.fn();
    addPartMock.mockReturnValue({ mutate, isPending: false });
    listLotsMock.mockReturnValue(loadedLots([lot()]));

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await selectPart("Balata de freno");
    await selectLot("L-2024-03 · 5 disp.");

    const quantity = screen.getByTestId("order_detail.add_part.quantity_input");
    await userEvent.clear(quantity);
    await userEvent.type(quantity, "2");

    await userEvent.click(
      screen.getByTestId("order_detail.add_part.submit_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      part: { partId: 10n, lotId: 3n, quantity: 2n },
    });
  });

  it("sends no lot when the automatic discount is kept", async () => {
    const mutate = vi.fn();
    addPartMock.mockReturnValue({ mutate, isPending: false });
    listLotsMock.mockReturnValue(loadedLots([lot()]));

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await selectPart("Balata de freno");

    await userEvent.click(
      screen.getByTestId("order_detail.add_part.submit_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      part: { partId: 10n, lotId: undefined, quantity: 1n },
    });
  });

  it("shows the empty catalog state when no parts exist", async () => {
    listPartsMock.mockReturnValue(loadedParts([]));

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    expect(
      await screen.findByText(
        "No hay repuestos con existencia disponible en el inventario.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("order_detail.add_part.submit_button"),
    ).toBeDisabled();
  });

  it("shows a no-matches empty state for a term with no results", async () => {
    listPartsMock.mockReturnValue(loadedParts([]));

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_part.search_input"),
      "zzz",
    );

    expect(
      await screen.findByText("Sin repuestos que coincidan con “zzz”."),
    ).toBeInTheDocument();
  });

  it("closes the dialog after a successful save", async () => {
    const onOpenChange = vi.fn();
    const mutate = vi.fn(
      (_input: unknown, options?: { onSuccess?: () => void }): void => {
        options?.onSuccess?.();
      },
    );
    addPartMock.mockReturnValue({ mutate, isPending: false });

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={onOpenChange} />,
    );

    await selectPart("Balata de freno");
    await userEvent.click(
      screen.getByTestId("order_detail.add_part.submit_button"),
    );

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("keeps the dialog open and surfaces the backend error on failure", async () => {
    const onOpenChange = vi.fn();
    const mutate = vi.fn(
      (
        _input: unknown,
        options?: { onError?: (error: unknown) => void },
      ): void => {
        options?.onError?.(new Error("Sin existencia"));
      },
    );
    addPartMock.mockReturnValue({ mutate, isPending: false });

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={onOpenChange} />,
    );

    await selectPart("Balata de freno");
    await userEvent.click(
      screen.getByTestId("order_detail.add_part.submit_button"),
    );

    expect(
      await screen.findByTestId("order_detail.add_part.error_state"),
    ).toHaveTextContent("Sin existencia");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("renders the dialog title and description", async () => {
    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    const dialog = within(
      await screen.findByTestId("order_detail.add_part.modal"),
    );
    expect(
      dialog.getByRole("heading", { name: "Agregar repuesto" }),
    ).toBeInTheDocument();
    expect(
      dialog.getByText(/no descuenta stock del inventario/),
    ).toBeInTheDocument();
  });
});
