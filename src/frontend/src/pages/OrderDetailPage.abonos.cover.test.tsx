import type {
  CompanyProfile,
  OrderAdvanceReceipt,
  OrderPayment,
  OrderView,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  HopeMode,
  OrderStatus,
  PaymentMethod,
  TaxResponsibility,
} from "@/lib/types";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted "abonos + recibo de anticipo" change on the workshop
 * order detail.
 *
 * The accepted behavior: an OT with an advance exposes a printable advance
 * receipt (company header, receipt/OT numbers, customer/moto identification,
 * advance method and amount, order total and pending balance, A4 / 80 mm
 * selector, print and PDF download); a "Registrar abono" action opens a dialog
 * with an integer COP amount, a payment method (efectivo / transferencia /
 * tarjeta) and an optional note; an abono must be greater than zero and cannot
 * exceed the pending balance, and an invalid one is rejected without reaching
 * the backend; registered abonos are listed with amount, method, note, date and
 * who registered them; the pending balance is total − anticipo − abonos and is
 * shown in the Anticipo panel and the totals; and abonos are locked with a clear
 * message when the order is cancelled, delivered or already invoiced.
 *
 * The page is exercised against typed local hook mocks; the real canister is
 * not exercised here. The backend's own rules (the Caja/Bancos income movement,
 * the balance arithmetic) are outside this file's reach.
 */

const useOrderMock = vi.fn();
const setOrderAdvanceMock = vi.fn();
const addOrderPaymentMock = vi.fn();
const useOrderPaymentsMock = vi.fn();
const useOrderAdvanceReceiptMock = vi.fn();
const updateStatusMock = vi.fn();
const removePartMock = vi.fn();
const removeLaborMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();
const getDailyHopeMessageMock = vi.fn();
const listInvoicesMock = vi.fn();
const downloadReceiptPdfMock = vi.fn();

vi.mock("@/hooks/use-orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-orders")>();
  return {
    ...actual,
    useOrder: () => useOrderMock(),
    useSetOrderAdvance: () => setOrderAdvanceMock(),
    useAddOrderPayment: () => addOrderPaymentMock(),
    useOrderPayments: () => useOrderPaymentsMock(),
    useOrderAdvanceReceipt: () => useOrderAdvanceReceiptMock(),
    useUpdateOrderStatus: () => updateStatusMock(),
    useRemoveOrderPart: () => removePartMock(),
    useRemoveLabor: () => removeLaborMock(),
  };
});

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getCustomer: vi.fn().mockResolvedValue({
        id: 1n,
        name: "Ada Lovelace",
        phone: "+52",
        createdAt: 0n,
      }),
      listMotorcycles: vi.fn().mockResolvedValue([
        {
          id: 7n,
          customerId: 1n,
          plate: "ABC-123",
          brand: "Honda",
          model: "CB190R",
          year: 2022n,
          mileage: 15000n,
          createdAt: 0n,
        },
      ]),
      getCompanyProfile: getCompanyProfileMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
      getDailyHopeMessage: getDailyHopeMessageMock,
      listInvoices: listInvoicesMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/lib/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdf")>();
  return {
    ...actual,
    downloadOrderAdvanceReceiptPdf: (...args: unknown[]) =>
      downloadReceiptPdfMock(...args),
  };
});

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a href="/" {...props}>
      {children}
    </a>
  ),
  useParams: () => ({ id: "42" }),
  useSearch: () => ({}),
}));

vi.mock("@/components/order/AddPartDialog", () => ({
  AddPartDialog: () => null,
}));
vi.mock("@/components/order/AddLaborDialog", () => ({
  AddLaborDialog: () => null,
}));

const TS = 1_700_000_000_000_000_000n;
const PRINCIPAL = Principal.fromText("aaaaa-aa");

function orderView(overrides: Partial<OrderView["order"]> = {}): OrderView {
  return {
    order: {
      id: 42n,
      orderNumber: "OT-0001",
      status: OrderStatus.received,
      customerId: 1n,
      motorcycleId: 7n,
      intakeMileage: 15000n,
      problem: "Frenos ruidosos",
      parts: [
        {
          id: 1n,
          partId: 10n,
          description: "Balata de freno",
          quantity: 2n,
          unitPrice: 25000n,
          unitCost: 12000n,
          lotId: 3n,
        },
      ],
      labor: [{ id: 1n, description: "Ajuste de frenos", price: 30000n }],
      technicianIds: [],
      statusHistory: [
        {
          to: OrderStatus.received,
          at: TS,
          performedBy: undefined as never,
        },
      ],
      createdAt: TS,
      updatedAt: TS,
      photos: [],
      payments: [],
      ...overrides,
    },
    totals: {
      partsSubtotal: 50000n,
      laborSubtotal: 30000n,
      subtotal: 80000n,
      taxRate: 16n,
      tax: 12800n,
      total: 92800n,
      paidAmount: 0n,
      balance: 92800n,
    },
  };
}

function payment(overrides: Partial<OrderPayment> = {}): OrderPayment {
  return {
    id: 1n,
    amount: 20000n,
    method: PaymentMethod.cash,
    note: undefined,
    registeredAt: TS,
    registeredBy: PRINCIPAL,
    ...overrides,
  };
}

function advanceReceipt(
  overrides: Partial<OrderAdvanceReceipt> = {},
): OrderAdvanceReceipt {
  return {
    orderId: 42n,
    orderNumber: "OT-0001",
    customerName: "Ada Lovelace",
    customerDocument: "LOAA1815",
    motorcycleBrand: "Honda",
    motorcycleModel: "CB190R",
    motorcyclePlate: "ABC-123",
    advance: {
      method: PaymentMethod.cash,
      amount: 50000n,
      registeredAt: TS,
      registeredBy: PRINCIPAL,
    },
    total: 92800n,
    paidAmount: 50000n,
    balance: 42800n,
    payments: [],
    issuedAt: TS,
    ...overrides,
  };
}

function idleMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function companyProfile(
  overrides: Partial<CompanyProfile> = {},
): CompanyProfile {
  return {
    legalName: "HR SOLUCIONES INTEGRALES S.A.S.",
    tradeName: "Taller HR Motos",
    documentType: DocumentType.nit,
    taxId: "900123456",
    checkDigit: 8n,
    fiscalRegime: FiscalRegime.responsableIva,
    taxResponsibility: TaxResponsibility.noAplica,
    address: "Calle 45 #12-30, Bogotá",
    city: "Bogotá D.C., Cundinamarca",
    phone: "+57 300 000 0000",
    email: "contacto@hrsolucionesintegrales.com",
    website: "https://hrsolucionesintegrales.com",
    logoUrl: undefined,
    taxRate: 16n,
    updatedAt: TS,
    ...overrides,
  };
}

function invoicePage(orderIds: bigint[]) {
  return {
    items: orderIds.map((orderId, index) => ({
      id: BigInt(index + 1),
      orderId,
    })),
    total: BigInt(orderIds.length),
    offset: 0n,
    limit: 1000n,
  };
}

describe("OrderDetailPage abonos y recibo de anticipo (cover)", () => {
  beforeEach(() => {
    useOrderMock.mockReset();
    setOrderAdvanceMock.mockReset();
    addOrderPaymentMock.mockReset();
    useOrderPaymentsMock.mockReset();
    useOrderAdvanceReceiptMock.mockReset();
    updateStatusMock.mockReset();
    removePartMock.mockReset();
    removeLaborMock.mockReset();
    getCompanyProfileMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    listInvoicesMock.mockReset();
    downloadReceiptPdfMock.mockReset();

    setOrderAdvanceMock.mockReturnValue(idleMutation());
    addOrderPaymentMock.mockReturnValue(idleMutation());
    updateStatusMock.mockReturnValue(idleMutation());
    removePartMock.mockReturnValue(idleMutation());
    removeLaborMock.mockReturnValue(idleMutation());
    useOrderPaymentsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    useOrderAdvanceReceiptMock.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    getDailyHopeMessageMock.mockResolvedValue({
      enabled: false,
      mode: HopeMode.auto,
      text: "",
      citation: "",
      referenceDate: "26/09/2026",
    });
    listInvoicesMock.mockResolvedValue(invoicePage([]));
    downloadReceiptPdfMock.mockResolvedValue(undefined);
  });

  // --- Accepted behavior: the printable advance receipt ---------------------

  it("shows the receipt action only when the order has an advance", async () => {
    useOrderMock.mockReturnValue({
      data: orderView(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    expect(
      screen.queryByTestId("order_detail.advance.receipt_button"),
    ).not.toBeInTheDocument();
  });

  it("opens the receipt preview with the company header, numbers and identification", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOrderAdvanceReceiptMock.mockReturnValue({
      data: advanceReceipt(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.receipt_button"),
    );
    const dialog = await screen.findByTestId(
      "order_detail.advance_receipt_dialog",
    );
    const receipt = await within(dialog).findByTestId(
      "order_detail.advance_receipt",
    );

    // Company header and the receipt / OT numbers.
    expect(receipt).toHaveTextContent("HR SOLUCIONES INTEGRALES S.A.S.");
    expect(receipt).toHaveTextContent("Recibo de anticipo");
    expect(receipt).toHaveTextContent("OT-0001");
    // Customer, document, motorcycle and plate.
    expect(receipt).toHaveTextContent("Ada Lovelace");
    expect(receipt).toHaveTextContent("LOAA1815");
    expect(receipt).toHaveTextContent("Honda CB190R");
    expect(receipt).toHaveTextContent("ABC-123");
    // Advance method and amount.
    expect(receipt).toHaveTextContent("Efectivo");
    expect(receipt).toHaveTextContent("$ 500");
    // Order total, total paid and pending balance.
    expect(receipt).toHaveTextContent("Total de la orden");
    expect(receipt).toHaveTextContent("$ 928");
    expect(receipt).toHaveTextContent("Total abonado");
    expect(receipt).toHaveTextContent("Saldo pendiente");
    expect(receipt).toHaveTextContent("$ 428");
  });

  it("switches the receipt between A4 and Tirilla 80 mm", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOrderAdvanceReceiptMock.mockReturnValue({
      data: advanceReceipt(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.receipt_button"),
    );
    const dialog = await screen.findByTestId(
      "order_detail.advance_receipt_dialog",
    );

    const a4 = within(dialog).getByTestId(
      "order_detail.advance_receipt.format_a4",
    );
    const tirilla = within(dialog).getByTestId(
      "order_detail.advance_receipt.format_receipt80",
    );
    expect(a4).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(tirilla);
    expect(tirilla).toHaveAttribute("aria-pressed", "true");
    expect(a4).toHaveAttribute("aria-pressed", "false");
  });

  it("invokes the browser print dialog from the receipt", async () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    try {
      useOrderMock.mockReturnValue({
        data: orderView({
          advance: {
            method: PaymentMethod.cash,
            amount: 50000n,
            registeredAt: TS,
            registeredBy: PRINCIPAL,
          },
        }),
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      });
      useOrderAdvanceReceiptMock.mockReturnValue({
        data: advanceReceipt(),
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<OrderDetailPage />);
      await screen.findByText("OT-0001");

      await userEvent.click(
        screen.getByTestId("order_detail.advance.receipt_button"),
      );
      const dialog = await screen.findByTestId(
        "order_detail.advance_receipt_dialog",
      );
      await userEvent.click(
        within(dialog).getByTestId("order_detail.advance_receipt.print_button"),
      );

      expect(printSpy).toHaveBeenCalledTimes(1);
    } finally {
      printSpy.mockRestore();
    }
  });

  it("downloads the receipt PDF in the selected format", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOrderAdvanceReceiptMock.mockReturnValue({
      data: advanceReceipt(),
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.receipt_button"),
    );
    const dialog = await screen.findByTestId(
      "order_detail.advance_receipt_dialog",
    );

    await userEvent.click(
      within(dialog).getByTestId(
        "order_detail.advance_receipt.format_receipt80",
      ),
    );
    await userEvent.click(
      within(dialog).getByTestId(
        "order_detail.advance_receipt.download_button",
      ),
    );

    await waitFor(() =>
      expect(downloadReceiptPdfMock).toHaveBeenCalledTimes(1),
    );
    // The receipt snapshot and the selected format are handed to the PDF
    // builder, so the downloaded file matches the preview.
    expect(downloadReceiptPdfMock.mock.calls[0][0]).toMatchObject({
      orderNumber: "OT-0001",
      balance: 42800n,
    });
    expect(downloadReceiptPdfMock.mock.calls[0][2]).toBe("receipt80");
  });

  // --- Accepted behavior: registering an abono ------------------------------

  it("registers a valid abono with amount, method and note", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "200",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.method_select"),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Tarjeta" }),
    );
    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.note_textarea"),
      "Abono parcial",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    // The amount is sent as integer cents COP; the note is trimmed.
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      payment: {
        amount: 20000n,
        method: PaymentMethod.card,
        note: "Abono parcial",
      },
    });
  });

  it("omits the note when it is left empty", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");
    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "100",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 42n,
      payment: {
        amount: 10000n,
        method: PaymentMethod.cash,
        note: undefined,
      },
    });
  });

  it("rejects an abono above the pending balance without calling the backend", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    // The pending balance is $ 428; 500 exceeds it.
    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "500",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    expect(
      await within(dialog).findByTestId(
        "order_detail.payment_dialog.error_state",
      ),
    ).toHaveTextContent("El abono no puede superar el saldo pendiente");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("rejects a zero abono without calling the backend", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "0",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    expect(
      await within(dialog).findByTestId(
        "order_detail.payment_dialog.error_state",
      ),
    ).toHaveTextContent("mayor que cero");
    expect(mutate).not.toHaveBeenCalled();
  });

  // --- Accepted behavior: the abonos list and the recalculated balance ------

  it("lists the registered abonos with amount, method, note and date", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOrderPaymentsMock.mockReturnValue({
      data: [
        payment({
          id: 1n,
          amount: 20000n,
          method: PaymentMethod.transfer,
          note: "Transferencia Bancolombia",
        }),
        payment({ id: 2n, amount: 10000n, method: PaymentMethod.cash }),
      ],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    const list = within(panel).getByTestId(
      "order_detail.advance.payments.list",
    );
    const first = within(list).getByTestId(
      "order_detail.advance.payments.item.1",
    );
    expect(first).toHaveTextContent("$ 200");
    expect(first).toHaveTextContent("Transferencia");
    expect(first).toHaveTextContent("Transferencia Bancolombia");

    const second = within(list).getByTestId(
      "order_detail.advance.payments.item.2",
    );
    expect(second).toHaveTextContent("$ 100");
    expect(second).toHaveTextContent("Efectivo");
  });

  it("shows the empty abonos state when none are registered", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.payments.empty_state"),
    ).toHaveTextContent("Sin abonos registrados.");
  });

  it("recalculates the pending balance as total − anticipo − abonos", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOrderPaymentsMock.mockReturnValue({
      data: [
        payment({ id: 1n, amount: 20000n }),
        payment({ id: 2n, amount: 10000n }),
      ],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    // Total $ 928 − anticipo $ 500 − abonos $ 300 = $ 128.
    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.paid_amount"),
    ).toHaveTextContent("$ 800");
    expect(
      within(panel).getByTestId("order_detail.advance.pending_balance"),
    ).toHaveTextContent("$ 128");

    // The totals panel shows the same abonos deduction and balance.
    const totals = screen.getByTestId("order_detail.totals.panel");
    expect(
      within(totals).getByTestId("order_detail.totals.payments"),
    ).toHaveTextContent("- $ 300");
    expect(
      within(totals).getByTestId("order_detail.totals.balance"),
    ).toHaveTextContent("$ 128");
  });

  it("clamps the pending balance to 0 when the abonos already cover the total", async () => {
    // The backend computes `balance = if (charged >= total) { 0 } else { total - charged }`,
    // so an order whose advance + abonos already cover the total has a real
    // pending balance of 0, never a negative one. The frontend must show the
    // same clamped value so the displayed balance matches the backend's.
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    // Advance $ 500 + abonos $ 500 = $ 1000, which exceeds the $ 928 total.
    useOrderPaymentsMock.mockReturnValue({
      data: [
        payment({ id: 1n, amount: 30000n }),
        payment({ id: 2n, amount: 20000n }),
      ],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).getByTestId("order_detail.advance.pending_balance"),
    ).toHaveTextContent("$ 0");
    // The totals panel shows the same clamped balance, not a negative value.
    const totals = screen.getByTestId("order_detail.totals.panel");
    expect(
      within(totals).getByTestId("order_detail.totals.balance"),
    ).toHaveTextContent("$ 0");
  });

  it("still rejects a positive abono once the order is fully paid", async () => {
    const mutate = vi.fn();
    addOrderPaymentMock.mockReturnValue({ mutate, isPending: false });
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    // Advance $ 500 + abonos $ 500 = $ 1000 > $ 928 total, so the real pending
    // balance is 0 and any positive abono must be rejected.
    useOrderPaymentsMock.mockReturnValue({
      data: [
        payment({ id: 1n, amount: 30000n }),
        payment({ id: 2n, amount: 20000n }),
      ],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(
      screen.getByTestId("order_detail.advance.add_payment_button"),
    );
    const dialog = await screen.findByTestId("order_detail.payment_dialog");

    await userEvent.type(
      within(dialog).getByTestId("order_detail.payment_dialog.amount_input"),
      "100",
    );
    await userEvent.click(
      within(dialog).getByTestId("order_detail.payment_dialog.save_button"),
    );

    expect(
      await within(dialog).findByTestId(
        "order_detail.payment_dialog.error_state",
      ),
    ).toHaveTextContent("El abono no puede superar el saldo pendiente");
    expect(mutate).not.toHaveBeenCalled();
  });

  it("includes the abonos and updated balance in the OT document", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    useOrderPaymentsMock.mockReturnValue({
      data: [payment({ id: 1n, amount: 20000n })],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    await userEvent.click(screen.getByTestId("order_detail.print_button"));
    const document = await screen.findByTestId("order_detail.document");

    expect(within(document).getByText("Abonos")).toBeInTheDocument();
    expect(within(document).getByText("- $ 200")).toBeInTheDocument();
    // Total $ 928 − anticipo $ 500 − abono $ 200 = $ 228.
    expect(within(document).getByText("Saldo pendiente")).toBeInTheDocument();
    expect(within(document).getByText("$ 228")).toBeInTheDocument();
  });

  // --- Accepted behavior: abonos are locked by order state ------------------

  it("locks abonos on a cancelled order with a clear message", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        status: OrderStatus.cancelled,
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).queryByTestId("order_detail.advance.add_payment_button"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByTestId("order_detail.advance.payment_locked_state"),
    ).toHaveTextContent("cancelada");
  });

  it("locks abonos on a delivered order with a clear message", async () => {
    useOrderMock.mockReturnValue({
      data: orderView({
        status: OrderStatus.delivered,
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    expect(
      within(panel).queryByTestId("order_detail.advance.add_payment_button"),
    ).not.toBeInTheDocument();
    expect(
      within(panel).getByTestId("order_detail.advance.payment_locked_state"),
    ).toHaveTextContent("entregada");
  });

  it("locks abonos once the order has an invoice", async () => {
    listInvoicesMock.mockResolvedValue(invoicePage([42n]));
    useOrderMock.mockReturnValue({
      data: orderView({
        advance: {
          method: PaymentMethod.cash,
          amount: 50000n,
          registeredAt: TS,
          registeredBy: PRINCIPAL,
        },
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders(<OrderDetailPage />);
    await screen.findByText("OT-0001");

    const panel = screen.getByTestId("order_detail.advance.panel");
    await waitFor(() =>
      expect(
        within(panel).getByTestId("order_detail.advance.payment_locked_state"),
      ).toHaveTextContent("facturada"),
    );
    expect(
      within(panel).queryByTestId("order_detail.advance.add_payment_button"),
    ).not.toBeInTheDocument();
  });
});
