import { ScanPartDialog } from "@/components/order/ScanPartDialog";
import type { PartView } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the workshop-order scan-to-add journey after the accepted change
 * that unified the barcode lookup into `findPartByCode` (barcode or SKU).
 *
 * The shared `BarcodeScanner` and the `useFindPartByCode` hook are covered
 * separately; this file protects the OT consumer seam: a resolved code selects
 * the part so the user can confirm lot and quantity, and an unknown code shows
 * the Spanish "producto no encontrado" notice without selecting anything.
 *
 * The scanner resolves through `useBackend().actor.findPartByCode`, so the
 * actor is mocked with a stable object (a fresh actor per render would restart
 * the camera and is a harness artifact, not product behavior).
 */

const findPartByCodeMock = vi.fn();
const addPartMutateMock = vi.fn();
const stableActor = { findPartByCode: findPartByCodeMock };

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({ actor: stableActor, isFetching: false }),
}));

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useLots: () => ({ data: [], isLoading: false }),
    useAddOrderPart: () => ({ mutate: addPartMutateMock, isPending: false }),
  };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 10n,
    sku: "BAL-001",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 2n,
    totalStock: 8n,
    barcode: "",
    lowStock: false,
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function renderDialog() {
  return renderWithProviders(
    <ScanPartDialog orderId={42n} open onOpenChange={vi.fn()} />,
  );
}

async function submitManualCode(code: string) {
  await userEvent.type(
    screen.getByTestId("order_detail.scan_part.scanner.input"),
    code,
  );
  await userEvent.click(
    screen.getByTestId("order_detail.scan_part.scanner.submit_button"),
  );
}

describe("ScanPartDialog scan-to-add (cover)", () => {
  beforeEach(() => {
    findPartByCodeMock.mockReset();
    addPartMutateMock.mockReset();
  });

  it("selects the resolved part so the user can confirm quantity", async () => {
    findPartByCodeMock.mockResolvedValue({ __kind__: "found", found: part() });
    renderDialog();

    await submitManualCode("BAL-001");

    // The resolved part is shown with its SKU and the quantity form appears.
    expect(await screen.findByText("Balata de freno")).toBeInTheDocument();
    expect(screen.getByText("BAL-001")).toBeInTheDocument();
    expect(
      screen.getByTestId("order_detail.scan_part.quantity_input"),
    ).toBeInTheDocument();
    expect(findPartByCodeMock).toHaveBeenCalledWith(null, "BAL-001");
  });

  it("shows the Spanish not-found notice and selects nothing for an unknown code", async () => {
    findPartByCodeMock.mockResolvedValue({ __kind__: "notFound" });
    renderDialog();

    await submitManualCode("NO-EXISTE");

    const notice = await screen.findByTestId(
      "order_detail.scan_part.not_found_state",
    );
    expect(notice).toHaveTextContent("Producto no encontrado");
    expect(notice).toHaveTextContent("NO-EXISTE");
    // No part was selected, so the confirm form never renders.
    expect(
      screen.queryByTestId("order_detail.scan_part.quantity_input"),
    ).not.toBeInTheDocument();
  });

  it("surfaces a backend lookup failure without selecting a part", async () => {
    findPartByCodeMock.mockRejectedValue(new Error("boom"));
    renderDialog();

    await submitManualCode("BAL-001");

    await waitFor(() =>
      expect(
        screen.getByTestId("order_detail.scan_part.scanner.error_state"),
      ).toHaveTextContent("No se pudo consultar el código"),
    );
    expect(
      screen.queryByTestId("order_detail.scan_part.quantity_input"),
    ).not.toBeInTheDocument();
  });
});
