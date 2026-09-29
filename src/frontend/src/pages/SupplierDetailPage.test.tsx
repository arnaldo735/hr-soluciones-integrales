import type {
  PartView,
  Payable,
  Payment,
  Purchase,
  Supplier,
  SupplierOrder,
} from "@/lib/types";
import { PayableStatus, PaymentMethod } from "@/lib/types";
import { SupplierDetailPage } from "@/pages/SupplierDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the supplier payable detail.
 *
 * The accepted change adds a part search by ID/SKU to the purchase modal and a
 * supplier-order modal, and introduces dedicated "Cuentas por pagar" views.
 * These tests protect the surrounding working behavior that must survive that
 * change: the payable summary (total comprado / pagado / saldo / estado), the
 * purchase dialog's validation and the cents-denominated payload it sends, and
 * the payment dialog reducing the pending balance. They never assert the new
 * search or order-modal behavior.
 */

const getSupplierMock = vi.fn();
const getPayableMock = vi.fn();
const listPurchasesMock = vi.fn();
const listPaymentsMock = vi.fn();
const createPurchaseMock = vi.fn();
const registerPaymentMock = vi.fn();
const listPartsMock = vi.fn();
const listSupplierOrdersMock = vi.fn();
const createSupplierOrderMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const deletePurchaseMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getSupplier: getSupplierMock,
      getPayable: getPayableMock,
      listPurchases: listPurchasesMock,
      listPayments: listPaymentsMock,
      createPurchase: createPurchaseMock,
      registerPayment: registerPaymentMock,
      listParts: listPartsMock,
      listSupplierOrders: listSupplierOrdersMock,
      createSupplierOrder: createSupplierOrderMock,
      getCompanyProfile: getCompanyProfileMock,
      deletePurchase: deletePurchaseMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: { children: React.ReactNode; to: string }) => (
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

function supplierOrder(overrides: Partial<SupplierOrder> = {}): SupplierOrder {
  return {
    id: 31n,
    supplierId: 1n,
    quantity: 10n,
    sku: "FIL-ACE-10W40",
    description: "Filtro de aceite para motos 150cc",
    createdAt: TS,
    createdBy: undefined as never,
    ...overrides,
  };
}

function purchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 11n,
    supplierId: 1n,
    total: 500000n,
    paidAmount: 200000n,
    createdAt: TS,
    items: [
      {
        id: 1n,
        partId: 12n,
        lotNumber: "L-2026-041",
        quantity: 10n,
        unitCost: 50000n,
      },
    ],
    accepted: true,
    ...overrides,
  };
}

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 21n,
    supplierId: 1n,
    amount: 200000n,
    method: PaymentMethod.cash,
    at: TS,
    performedBy: undefined as never,
    ...overrides,
  };
}

describe("SupplierDetailPage", () => {
  beforeEach(() => {
    getSupplierMock.mockReset();
    getPayableMock.mockReset();
    listPurchasesMock.mockReset();
    listPaymentsMock.mockReset();
    createPurchaseMock.mockReset();
    registerPaymentMock.mockReset();
    listPartsMock.mockReset();
    listSupplierOrdersMock.mockReset();
    createSupplierOrderMock.mockReset();
    getCompanyProfileMock.mockReset();
    deletePurchaseMock.mockReset();

    getCompanyProfileMock.mockResolvedValue(null);
    getSupplierMock.mockResolvedValue(supplier());
    getPayableMock.mockResolvedValue(payable());
    listPurchasesMock.mockResolvedValue([purchase()]);
    listPaymentsMock.mockResolvedValue([payment()]);
    listPartsMock.mockResolvedValue({
      items: [part()],
      total: 1n,
      offset: 0n,
      limit: 20n,
    });
    listSupplierOrdersMock.mockResolvedValue([]);
  });

  it("shows the payable summary with purchased, paid, balance and status", async () => {
    renderWithProviders(<SupplierDetailPage />);

    const summary = await screen.findByTestId(
      "supplier_detail.payable.section",
    );
    expect(within(summary).getByText("Total comprado")).toBeInTheDocument();
    expect(within(summary).getByText("$ 5.000")).toBeInTheDocument();
    expect(within(summary).getByText("Total pagado")).toBeInTheDocument();
    expect(within(summary).getByText("$ 2.000")).toBeInTheDocument();
    expect(within(summary).getByText("Saldo pendiente")).toBeInTheDocument();
    expect(within(summary).getByText("$ 3.000")).toBeInTheDocument();
    expect(within(summary).getByText("Pendiente")).toBeInTheDocument();
  });

  it("lists the registered purchases with their lots and totals", async () => {
    renderWithProviders(<SupplierDetailPage />);

    const table = await screen.findByTestId("supplier_detail.purchases.table");
    const row = within(table).getByTestId("supplier_detail.purchase_row.1");
    expect(row).toHaveTextContent("#11");
    expect(row).toHaveTextContent("L-2026-041");
    expect(row).toHaveTextContent("×10");
    expect(row).toHaveTextContent("$ 5.000");
    expect(row).toHaveTextContent("$ 2.000");
  });

  it("lists the registered payments with method and amount", async () => {
    renderWithProviders(<SupplierDetailPage />);

    const table = await screen.findByTestId("supplier_detail.payments.table");
    const row = within(table).getByTestId("supplier_detail.payment_row.1");
    expect(row).toHaveTextContent("Efectivo");
    expect(row).toHaveTextContent("$ 2.000");
  });

  it("registers a purchase with the lot, quantity and unit cost in cents", async () => {
    createPurchaseMock.mockResolvedValue(purchase());
    renderWithProviders(<SupplierDetailPage />);

    await userEvent.click(
      await screen.findByTestId("supplier_detail.open_purchase_button"),
    );

    const dialog = await screen.findByTestId("supplier_detail.purchase_dialog");
    // The accepted change replaces the raw ID field with a catalog search: the
    // repuesto is chosen from the filtered results.
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.part_search_input.1"),
      "REP-0012",
    );
    await userEvent.click(
      await within(dialog).findByTestId("supplier_detail.part_option.1.1"),
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.lot_input.1"),
      "L-2026-042",
    );
    await userEvent.clear(
      within(dialog).getByTestId("supplier_detail.quantity_input.1"),
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.quantity_input.1"),
      "5",
    );
    await userEvent.clear(
      within(dialog).getByTestId("supplier_detail.unit_cost_input.1"),
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.unit_cost_input.1"),
      "450.50",
    );
    await userEvent.click(
      within(dialog).getByTestId("supplier_detail.purchase_submit_button"),
    );

    await waitFor(() => expect(createPurchaseMock).toHaveBeenCalledTimes(1));
    expect(createPurchaseMock.mock.calls[0][0]).toEqual({
      supplierId: 1n,
      items: [
        {
          partId: 12n,
          lotNumber: "L-2026-042",
          quantity: 5n,
          unitCost: 45050n,
        },
      ],
    });
  });

  it("blocks a purchase with a missing lot number and does not call the backend", async () => {
    renderWithProviders(<SupplierDetailPage />);

    await userEvent.click(
      await screen.findByTestId("supplier_detail.open_purchase_button"),
    );
    const dialog = await screen.findByTestId("supplier_detail.purchase_dialog");
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.part_search_input.1"),
      "REP-0012",
    );
    await userEvent.click(
      await within(dialog).findByTestId("supplier_detail.part_option.1.1"),
    );
    await userEvent.clear(
      within(dialog).getByTestId("supplier_detail.quantity_input.1"),
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.quantity_input.1"),
      "5",
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.unit_cost_input.1"),
      "450",
    );
    // The lot field is left empty. Its native `required` validation keeps the
    // dialog open and no backend call is made.
    await userEvent.click(
      within(dialog).getByTestId("supplier_detail.purchase_submit_button"),
    );

    expect(
      within(dialog).getByTestId("supplier_detail.lot_input.1"),
    ).toBeInvalid();
    expect(createPurchaseMock).not.toHaveBeenCalled();
  });

  it("registers a payment in cents and reduces the pending balance", async () => {
    registerPaymentMock.mockResolvedValue(payment());
    // The first payable read is the pending balance; after the payment the
    // refetch returns the reduced balance and the paid status.
    getPayableMock.mockResolvedValueOnce(payable()).mockResolvedValue(
      payable({
        status: PayableStatus.paid,
        totalPaid: 500000n,
        balance: 0n,
      }),
    );
    renderWithProviders(<SupplierDetailPage />);

    await userEvent.click(
      await screen.findByTestId("supplier_detail.open_payment_button"),
    );

    const dialog = await screen.findByTestId("supplier_detail.payment_dialog");
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.payment_amount_input"),
      "3000",
    );
    await userEvent.click(
      within(dialog).getByTestId("supplier_detail.payment_submit_button"),
    );

    await waitFor(() => expect(registerPaymentMock).toHaveBeenCalledTimes(1));
    expect(registerPaymentMock.mock.calls[0][0]).toMatchObject({
      supplierId: 1n,
      amount: 300000n,
      method: PaymentMethod.cash,
    });

    // The payable is refetched and the summary reflects the settled balance.
    const summary = await screen.findByTestId(
      "supplier_detail.payable.section",
    );
    await waitFor(() =>
      expect(within(summary).getByText("$ 0")).toBeInTheDocument(),
    );
    expect(within(summary).getByText("Pagada")).toBeInTheDocument();
  });

  it("blocks a payment with a zero amount and does not call the backend", async () => {
    renderWithProviders(<SupplierDetailPage />);

    await userEvent.click(
      await screen.findByTestId("supplier_detail.open_payment_button"),
    );
    const dialog = await screen.findByTestId("supplier_detail.payment_dialog");
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.payment_amount_input"),
      "0",
    );
    await userEvent.click(
      within(dialog).getByTestId("supplier_detail.payment_submit_button"),
    );

    expect(
      await within(dialog).findByTestId("supplier_detail.payment_error"),
    ).toHaveTextContent("monto");
    expect(registerPaymentMock).not.toHaveBeenCalled();
  });

  it("disables the payment action once the payable is settled", async () => {
    getPayableMock.mockResolvedValue(
      payable({ status: PayableStatus.paid, balance: 0n, totalPaid: 500000n }),
    );
    renderWithProviders(<SupplierDetailPage />);

    const button = await screen.findByTestId(
      "supplier_detail.open_payment_button",
    );
    expect(button).toBeDisabled();
  });

  // --- Accepted behavior: the purchase modal's catalog search --------------
  //
  // The accepted change replaces the raw part-ID field with a live search over
  // the parts catalog by ID/SKU. These tests assert the search seam and the
  // selection it enables.

  it("searches the parts catalog by ID/SKU and selects a repuesto", async () => {
    listPartsMock.mockResolvedValue({
      items: [
        part({ id: 12n, sku: "REP-0012", name: "Balata de freno" }),
        part({ id: 13n, sku: "FIL-0007", name: "Filtro de aceite" }),
      ],
      total: 2n,
      offset: 0n,
      limit: 20n,
    });
    renderWithProviders(<SupplierDetailPage />);

    await userEvent.click(
      await screen.findByTestId("supplier_detail.open_purchase_button"),
    );
    const dialog = await screen.findByTestId("supplier_detail.purchase_dialog");
    await userEvent.type(
      within(dialog).getByTestId("supplier_detail.part_search_input.1"),
      "FIL-0007",
    );

    // The typed term reaches the backend catalog search.
    await waitFor(() =>
      expect(listPartsMock).toHaveBeenLastCalledWith(
        { search: "FIL-0007" },
        expect.anything(),
        0n,
        20n,
      ),
    );

    // Selecting a result replaces the search field with the chosen repuesto.
    await userEvent.click(
      await within(dialog).findByTestId("supplier_detail.part_option.1.2"),
    );
    expect(within(dialog).getByText("Filtro de aceite")).toBeInTheDocument();
    expect(
      within(dialog).queryByTestId("supplier_detail.part_search_input.1"),
    ).not.toBeInTheDocument();
  });

  // --- Accepted behavior: the supplier-order modal -------------------------
  //
  // The accepted change adds a "Pedido a proveedor" modal with only quantity,
  // SKU and description, and the saved order appears in the supplier detail.

  it("shows only quantity, SKU and description in the supplier-order modal", async () => {
    renderWithProviders(<SupplierDetailPage />);

    await userEvent.click(
      await screen.findByTestId("supplier_detail.open_supplier_order_button"),
    );

    const dialog = await screen.findByTestId("supplier_order.dialog");
    expect(
      within(dialog).getByTestId("supplier_order.quantity_input"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("supplier_order.sku_input"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("supplier_order.description_input"),
    ).toBeInTheDocument();
    // No cost, lot or part-picker fields leak into this modal.
    expect(
      within(dialog).queryByTestId("supplier_detail.unit_cost_input.1"),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByTestId("supplier_detail.lot_input.1"),
    ).not.toBeInTheDocument();
  });

  it("saves a supplier order with quantity, SKU and description", async () => {
    createSupplierOrderMock.mockResolvedValue(supplierOrder());
    renderWithProviders(<SupplierDetailPage />);

    await userEvent.click(
      await screen.findByTestId("supplier_detail.open_supplier_order_button"),
    );
    const dialog = await screen.findByTestId("supplier_order.dialog");
    await userEvent.clear(
      within(dialog).getByTestId("supplier_order.quantity_input"),
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_order.quantity_input"),
      "10",
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_order.sku_input"),
      "FIL-ACE-10W40",
    );
    await userEvent.type(
      within(dialog).getByTestId("supplier_order.description_input"),
      "Filtro de aceite para motos 150cc",
    );
    await userEvent.click(
      within(dialog).getByTestId("supplier_order.submit_button"),
    );

    await waitFor(() =>
      expect(createSupplierOrderMock).toHaveBeenCalledTimes(1),
    );
    expect(createSupplierOrderMock.mock.calls[0][0]).toEqual({
      supplierId: 1n,
      quantity: 10n,
      sku: "FIL-ACE-10W40",
      description: "Filtro de aceite para motos 150cc",
    });
  });

  it("lists a saved supplier order in the supplier detail", async () => {
    listSupplierOrdersMock.mockResolvedValue([supplierOrder()]);
    renderWithProviders(<SupplierDetailPage />);

    const table = await screen.findByTestId(
      "supplier_detail.supplier_orders.table",
    );
    const row = within(table).getByTestId(
      "supplier_detail.supplier_order_row.1",
    );
    expect(row).toHaveTextContent("10");
    expect(row).toHaveTextContent("FIL-ACE-10W40");
    expect(row).toHaveTextContent("Filtro de aceite para motos 150cc");
  });

  // --- Accepted change: the WhatsApp action was removed from this page ------
  //
  // The accepted change removes the "Enviar por WhatsApp" action from the
  // supplier detail. This pins the removal: the page no longer renders the
  // button, and the rest of the page (data, payable summary, listings and the
  // printable "Ver ficha") keeps working. The shared WhatsAppNotifyButton keeps
  // its own coverage in components/WhatsAppNotifyButton.test.tsx.

  it("no longer renders the WhatsApp send button", async () => {
    renderWithProviders(<SupplierDetailPage />);
    await screen.findByTestId("supplier_detail.payable.section");

    expect(
      screen.queryByTestId("supplier_detail.whatsapp_button"),
    ).not.toBeInTheDocument();
    // The printable "Ver ficha" action that must survive the removal is still
    // present beside the remaining header actions.
    expect(
      screen.getByTestId("supplier_detail.preview_button"),
    ).toBeInTheDocument();
  });

  // --- Accepted behavior: deleting a non-accepted purchase ------------------
  //
  // The accepted change lets a purchase that has not been accepted be deleted,
  // reverting its lots and inventory movements. The page mirrors the backend
  // guard: the delete action is offered only while the purchase is not accepted,
  // and the backend's Spanish rejection is surfaced inside the dialog.

  it("deletes a non-accepted purchase through the backend", async () => {
    listPurchasesMock.mockResolvedValue([purchase({ accepted: false })]);
    deletePurchaseMock.mockResolvedValue(true);
    renderWithProviders(<SupplierDetailPage />);

    await screen.findByTestId("supplier_detail.purchases.table");
    await userEvent.click(
      screen.getByTestId("supplier_detail.delete_purchase_button.1"),
    );

    const dialog = await screen.findByTestId(
      "supplier_detail.delete_purchase_dialog",
    );
    await userEvent.click(
      within(dialog).getByTestId(
        "supplier_detail.delete_purchase_confirm_button",
      ),
    );

    await waitFor(() => expect(deletePurchaseMock).toHaveBeenCalledTimes(1));
    expect(deletePurchaseMock).toHaveBeenCalledWith(null, 11n);
  });

  it("hides the delete action for an accepted purchase", async () => {
    listPurchasesMock.mockResolvedValue([purchase({ accepted: true })]);
    renderWithProviders(<SupplierDetailPage />);

    await screen.findByTestId("supplier_detail.purchases.table");
    expect(
      screen.queryByTestId("supplier_detail.delete_purchase_button.1"),
    ).not.toBeInTheDocument();
    // The accepted purchase shows its badge instead.
    expect(
      screen.getByTestId("supplier_detail.purchase_accepted_badge.1"),
    ).toBeInTheDocument();
  });

  it("surfaces the backend rejection when the purchase deletion fails", async () => {
    listPurchasesMock.mockResolvedValue([purchase({ accepted: false })]);
    deletePurchaseMock.mockRejectedValue(
      new Error("No se puede eliminar una compra ya aceptada"),
    );
    renderWithProviders(<SupplierDetailPage />);

    await screen.findByTestId("supplier_detail.purchases.table");
    await userEvent.click(
      screen.getByTestId("supplier_detail.delete_purchase_button.1"),
    );
    const dialog = await screen.findByTestId(
      "supplier_detail.delete_purchase_dialog",
    );
    await userEvent.click(
      within(dialog).getByTestId(
        "supplier_detail.delete_purchase_confirm_button",
      ),
    );

    expect(
      await within(dialog).findByTestId(
        "supplier_detail.delete_purchase_error",
      ),
    ).toHaveTextContent("No se puede eliminar una compra ya aceptada");
  });
});
