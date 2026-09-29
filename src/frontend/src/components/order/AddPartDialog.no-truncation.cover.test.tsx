import { AddPartDialog } from "@/components/order/AddPartDialog";
import { PICKER_PAGE_SIZE } from "@/hooks/use-orders";
import type { PartView } from "@/lib/types";
import { PartSort } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted no-truncation behavior of the workshop-order part
 * picker ("Agregar repuesto").
 *
 * The accepted change stops the type-to-narrow selectors from truncating: the
 * order's part picker asks the backend for a page large enough to cover the
 * whole catalog (1000 rows, not the old 50) and renders every row the backend
 * returns. Unlike `AddPartDialog.test.tsx`, which mocks `useParts` to pin the
 * dialog's own behavior, this file lets the real `useParts` hook run against a
 * typed actor mock, so it fails if the picker regresses to a small page or
 * drops rows. Accent folding itself is resolved in the backend and is covered
 * by the PocketIC lane, not here.
 */

const listPartsMock = vi.fn();
const listLotsMock = vi.fn();
const addPartMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      listParts: listPartsMock,
      listLots: listLotsMock,
      addOrderPart: addPartMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return {
    ...actual,
    useAuth: () => ({ token: "session-token" }),
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(index: number): PartView {
  return {
    id: BigInt(100 + index),
    sku: `BAL-${String(index).padStart(3, "0")}`,
    lowStockThreshold: 2n,
    name: `Balata de freno ${index}`,
    createdAt: 1_700_000_000_000_000_000n,
    unit: "pza",
    totalStock: 8n,
    barcode: "",
    category: "Frenos",
    salePrice: 25000n,
    brand: "Genérico",
    costPrice: 12000n,
    lowStock: false,
  };
}

describe("AddPartDialog part picker no-truncation (cover)", () => {
  beforeEach(() => {
    listPartsMock.mockReset();
    listLotsMock.mockReset();
    addPartMock.mockReset();
    listPartsMock.mockResolvedValue({
      items: [],
      total: 0n,
      offset: 0n,
      limit: PICKER_PAGE_SIZE,
    });
    listLotsMock.mockResolvedValue([]);
    addPartMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it("requests a whole-catalog page for the order part picker once a term is typed", async () => {
    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    // The picker no longer lists the catalog by default; it queries only after
    // the user types a term.
    await screen.findByTestId("order_detail.add_part.prompt_state");
    expect(listPartsMock).not.toHaveBeenCalled();

    await userEvent.type(
      screen.getByTestId("order_detail.add_part.search_input"),
      "balata",
    );

    await waitFor(() => expect(listPartsMock).toHaveBeenCalled());

    // The session token leads, the term is forwarded, and the page is large
    // enough to cover the whole catalog instead of the old 50-row cap.
    expect(listPartsMock).toHaveBeenLastCalledWith(
      "session-token",
      { search: "balata" },
      PartSort.name,
      0n,
      PICKER_PAGE_SIZE,
    );
    expect(PICKER_PAGE_SIZE).toBe(1000n);
  });

  it("lists every match when a term matches more than 50 parts", async () => {
    // More than the old 50-row cap, so a regression to a small page would drop
    // rows and fail the count assertion below.
    const parts = Array.from({ length: 60 }, (_, index) => part(index + 1));
    listPartsMock.mockResolvedValue({
      items: parts,
      total: 60n,
      offset: 0n,
      limit: PICKER_PAGE_SIZE,
    });

    renderWithProviders(
      <AddPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
    );

    await userEvent.type(
      screen.getByTestId("order_detail.add_part.search_input"),
      "balata",
    );

    await waitFor(() =>
      expect(listPartsMock).toHaveBeenLastCalledWith(
        "session-token",
        { search: "balata" },
        PartSort.name,
        0n,
        PICKER_PAGE_SIZE,
      ),
    );

    const list = within(
      await screen.findByTestId("order_detail.add_part.list"),
    );
    // Every one of the 60 rows is rendered, not a truncated first page.
    expect(list.getAllByRole("button")).toHaveLength(60);
    expect(list.getByText("BAL-001")).toBeInTheDocument();
    expect(list.getByText("BAL-060")).toBeInTheDocument();
  });
});
