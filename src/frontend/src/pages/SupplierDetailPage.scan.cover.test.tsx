import type { PartView, Payable, Supplier } from "@/lib/types";
import { PayableStatus } from "@/lib/types";
import { SupplierDetailPage } from "@/pages/SupplierDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the proveedores scan-to-assign journey after the accepted change
 * that unified the barcode lookup into `findPartByCode` (barcode or SKU).
 *
 * The scan lives inside the "Registrar compra" dialog: a resolved code fills the
 * partida's part with the resolved product, and an unknown code shows the shared
 * scanner's Spanish "producto no encontrado" notice without selecting anything.
 *
 * The scanner resolves through `useBackend().actor.findPartByCode`, so the actor
 * is mocked with a stable object (a fresh actor per render would restart the
 * camera and is a harness artifact, not product behavior).
 */

const getSupplierMock = vi.fn();
const getPayableMock = vi.fn();
const listPurchasesMock = vi.fn();
const listPaymentsMock = vi.fn();
const listSupplierOrdersMock = vi.fn();
const listPartsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const findPartByCodeMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getSupplier: getSupplierMock,
      getPayable: getPayableMock,
      listPurchases: listPurchasesMock,
      listPayments: listPaymentsMock,
      listSupplierOrders: listSupplierOrdersMock,
      listParts: listPartsMock,
      getCompanyProfile: getCompanyProfileMock,
      findPartByCode: findPartByCodeMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ id: "1" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TS = 1_700_000_000_000_000_000n;

function supplier(overrides: Partial<Supplier> = {}): Supplier {
  return {
    id: 1n,
    name: "Refacciones del Norte",
    contactName: "Laura Medina",
    phone: "81 8345 2210",
    email: "ventas@refacciones.mx",
    taxId: "RDN980412H73",
    address: "Av. Constitución 1450",
    createdAt: TS,
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
    dueDate: TS,
    ...overrides,
  };
}

function part(overrides: Partial<PartView> = {}): PartView {
  return {
    id: 12n,
    sku: "REP-0012",
    name: "Balata de freno",
    category: "Frenos",
    brand: "Brembo",
    unit: "pza",
    salePrice: 25000n,
    costPrice: 12000n,
    lowStockThreshold: 5n,
    totalStock: 12n,
    barcode: "",
    lowStock: false,
    createdAt: TS,
    ...overrides,
  };
}

async function openPurchaseDialog() {
  await userEvent.click(
    await screen.findByTestId("supplier_detail.open_purchase_button"),
  );
  return screen.findByTestId("supplier_detail.purchase_dialog");
}

async function openScannerAndSubmit(code: string) {
  await userEvent.click(
    screen.getByTestId("supplier_detail.scan_part_button.1"),
  );
  await screen.findByTestId("supplier_detail.scan_part_dialog");
  await userEvent.type(
    screen.getByTestId("supplier_detail.scan_part.input"),
    code,
  );
  await userEvent.click(
    screen.getByTestId("supplier_detail.scan_part.submit_button"),
  );
}

describe("SupplierDetailPage scan-to-assign (cover)", () => {
  beforeEach(() => {
    getSupplierMock.mockReset();
    getPayableMock.mockReset();
    listPurchasesMock.mockReset();
    listPaymentsMock.mockReset();
    listSupplierOrdersMock.mockReset();
    listPartsMock.mockReset();
    getCompanyProfileMock.mockReset();
    findPartByCodeMock.mockReset();
    getSupplierMock.mockResolvedValue(supplier());
    getPayableMock.mockResolvedValue(payable());
    listPurchasesMock.mockResolvedValue([]);
    listPaymentsMock.mockResolvedValue([]);
    listSupplierOrdersMock.mockResolvedValue([]);
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 50n,
    });
    getCompanyProfileMock.mockResolvedValue(null);
  });

  it("assigns the resolved part to the partida", async () => {
    const scanned = part({
      id: 99n,
      sku: "REP-9999",
      name: "Cadena de transmisión",
      costPrice: 80000n,
    });
    findPartByCodeMock.mockResolvedValue({ __kind__: "found", found: scanned });
    renderWithProviders(<SupplierDetailPage />);
    const dialog = await openPurchaseDialog();

    await openScannerAndSubmit("REP-9999");

    // The resolved part replaces the picker with its name and SKU.
    expect(
      await within(dialog).findByText("Cadena de transmisión"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/REP-9999/)).toBeInTheDocument();
    // The scan queried the backend with the scanned code. The token is null
    // because the test renders without an auth session.
    expect(findPartByCodeMock).toHaveBeenCalledWith(null, "REP-9999");
  });

  it("shows the Spanish not-found notice and selects nothing for an unknown code", async () => {
    findPartByCodeMock.mockResolvedValue({ __kind__: "notFound" });
    renderWithProviders(<SupplierDetailPage />);
    const dialog = await openPurchaseDialog();

    await openScannerAndSubmit("NO-EXISTE");

    const notice = await screen.findByTestId(
      "supplier_detail.scan_part.not_found_state",
    );
    expect(notice).toHaveTextContent("Producto no encontrado");
    expect(notice).toHaveTextContent("NO-EXISTE");
    // No part was selected, so the picker's search input is still shown.
    expect(
      within(dialog).getByTestId("supplier_detail.part_search_input.1"),
    ).toBeInTheDocument();
  });
});
