import type {
  BusinessSettings,
  CompanyProfile,
  Invoice,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  InvoiceLineKind,
  InvoiceOrigin,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  TaxResponsibility,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getInvoiceMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const markInvoicePaidMock = vi.fn();
const registerInstallmentPaymentMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();
const { toastSuccessMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
}));

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getInvoice: getInvoiceMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      markInvoicePaid: markInvoicePaidMock,
      registerInstallmentPayment: registerInstallmentPaymentMock,
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
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

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: vi.fn() },
}));

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 1n,
    number: "FAC-0001",
    orderId: 42n,
    customerId: 1n,
    customerName: "Ada Lovelace",
    customerTaxId: "LOAA1815",
    customerAddress: "Av. Reforma 100",
    lines: [
      {
        kind: InvoiceLineKind.part,
        description: "Balata de freno",
        quantity: 2n,
        unitPrice: 25000n,
        amount: 50000n,
        unitCost: 15000n,
      },
    ],
    subtotal: 50000n,
    taxRate: 16n,
    tax: 8000n,
    total: 58000n,
    discount: 0n,
    origin: InvoiceOrigin.workshopOrder,
    paymentMethod: PaymentMethod.cash,
    paymentCondition: PaymentCondition.cash,
    paymentStatus: PaymentStatus.pending,
    issuedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

/**
 * A credit invoice with a three-installment plan: the first installment is
 * already settled, the other two are pending. Amounts are in cents, so the
 * $ 600 total is split into three $ 200 installments.
 */
function creditInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const dueDate = 1_800_000_000_000_000_000n;
  return invoice({
    paymentCondition: PaymentCondition.credit,
    total: 60000n,
    subtotal: 60000n,
    tax: 0n,
    taxRate: 0n,
    installments: {
      firstDueDate: dueDate,
      installmentCount: 3n,
      installments: [
        {
          number: 1n,
          amount: 20000n,
          dueDate,
          paid: true,
          paidAt: dueDate,
        },
        { number: 2n, amount: 20000n, dueDate, paid: false },
        { number: 3n, amount: 20000n, dueDate, paid: false },
      ],
    },
    ...overrides,
  });
}

function business(): BusinessSettings {
  return {
    name: "HR SOLUCIONES INTEGRALES",
    taxId: "900.123.456-7",
    address: "Calle 45 #12-30, Bogotá",
    phone: "+57 300 000 0000",
    taxRate: 16n,
  };
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
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function preparedWhatsApp(
  overrides: Partial<WhatsAppMessageResult> = {},
): WhatsAppMessageResult {
  return {
    contactKind: WhatsAppContactKind.customer,
    contactId: 1n,
    contactName: "Ada Lovelace",
    hasPhone: true,
    phone: "+57 300 000 0000",
    message: "Hola Ada, te compartimos la factura FAC-0001.",
    ...overrides,
  };
}

describe("InvoiceDetailPage", () => {
  beforeEach(() => {
    getInvoiceMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    markInvoicePaidMock.mockReset();
    registerInstallmentPaymentMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    toastSuccessMock.mockReset();
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
  });

  it("renders the fiscal document with lines, totals and business data", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    renderWithProviders(<InvoiceDetailPage />);

    expect(
      await screen.findByTestId("invoice_detail.document"),
    ).toBeInTheDocument();
    expect(screen.getByText("FAC-0001")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Balata de freno")).toBeInTheDocument();
    // $ 500 is both the line amount and the subtotal.
    expect(screen.getAllByText("$ 500")).toHaveLength(2);
    expect(screen.getByText("$ 80")).toBeInTheDocument();
    expect(screen.getByText("$ 580")).toBeInTheDocument();
    expect(screen.getByText("HR SOLUCIONES INTEGRALES")).toBeInTheDocument();
    expect(screen.getByText("NIT/RUC: 900.123.456-7")).toBeInTheDocument();
    expect(screen.getByTestId("invoice_detail.status_badge")).toHaveTextContent(
      "Pendiente de pago",
    );
  });

  it("falls back to the new brand name when no business profile is set", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    getBusinessSettingsMock.mockResolvedValue(null);
    renderWithProviders(<InvoiceDetailPage />);

    expect(
      await screen.findByTestId("invoice_detail.document"),
    ).toBeInTheDocument();
    expect(screen.getByText("HR SOLUCIONES INTEGRALES")).toBeInTheDocument();
    expect(screen.queryByText(/Taller N[o]?r?cturno/)).not.toBeInTheDocument();
  });

  it("shows the mark-paid action for a pending invoice", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    renderWithProviders(<InvoiceDetailPage />);

    expect(
      await screen.findByTestId("invoice_detail.mark_paid_button"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("invoice_detail.paid_badge"),
    ).not.toBeInTheDocument();
  });

  it("shows the paid badge and hides the mark-paid action when paid", async () => {
    getInvoiceMock.mockResolvedValue(
      invoice({ paymentStatus: PaymentStatus.paid }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    expect(
      await screen.findByTestId("invoice_detail.paid_badge"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("invoice_detail.mark_paid_button"),
    ).not.toBeInTheDocument();
  });

  it("marks a pending invoice as paid through the backend", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    markInvoicePaidMock.mockResolvedValue(
      invoice({ paymentStatus: PaymentStatus.paid }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    await userEvent.click(
      await screen.findByTestId("invoice_detail.mark_paid_button"),
    );
    expect(
      await screen.findByTestId("invoice_detail.paid_dialog"),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByTestId("invoice_detail.paid_submit_button"),
    );

    await waitFor(() =>
      expect(markInvoicePaidMock).toHaveBeenCalledWith(1n, PaymentMethod.cash),
    );
    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "Factura FAC-0001 marcada como pagada",
      ),
    );
  });

  it("surfaces an error when marking as paid fails", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    markInvoicePaidMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InvoiceDetailPage />);

    await userEvent.click(
      await screen.findByTestId("invoice_detail.mark_paid_button"),
    );
    await userEvent.click(
      await screen.findByTestId("invoice_detail.paid_submit_button"),
    );

    expect(
      await screen.findByTestId("invoice_detail.paid_error"),
    ).toHaveTextContent("No se pudo registrar el pago. Intenta de nuevo.");
  });

  it("renders the not-found state when the invoice cannot be loaded", async () => {
    getInvoiceMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InvoiceDetailPage />);

    expect(
      await screen.findByTestId("invoice_detail.error_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Factura no encontrada")).toBeInTheDocument();
  });

  // --- Characterization: the invoice totals the IVA change must keep --------
  //
  // The accepted change makes the company's fiscal regime decide the effective
  // IVA rate and hides the tax line for a non-responsable. These tests protect
  // the surrounding document contract instead: the line amounts sum to the
  // subtotal, and the total is the subtotal minus the discount plus the tax the
  // backend applied. They never assert whether the tax row is present.

  it("keeps the document totals reconciled with the lines and the discount", async () => {
    getInvoiceMock.mockResolvedValue(
      invoice({
        lines: [
          {
            kind: InvoiceLineKind.part,
            description: "Balata de freno",
            quantity: 2n,
            unitPrice: 25000n,
            amount: 50000n,
            unitCost: 15000n,
          },
          {
            kind: InvoiceLineKind.service,
            description: "Ajuste de frenos",
            quantity: 1n,
            unitPrice: 30000n,
            amount: 30000n,
            unitCost: 0n,
          },
        ],
        subtotal: 80000n,
        discount: 10000n,
        taxRate: 16n,
        tax: 11200n,
        total: 81200n,
      }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");

    // The fixture's subtotal is the sum of its line amounts.
    const view = invoice({
      lines: [
        {
          kind: InvoiceLineKind.part,
          description: "Balata de freno",
          quantity: 2n,
          unitPrice: 25000n,
          amount: 50000n,
          unitCost: 15000n,
        },
        {
          kind: InvoiceLineKind.service,
          description: "Ajuste de frenos",
          quantity: 1n,
          unitPrice: 30000n,
          amount: 30000n,
          unitCost: 0n,
        },
      ],
      subtotal: 80000n,
      discount: 10000n,
      taxRate: 16n,
      tax: 11200n,
      total: 81200n,
    });
    const lineSum = view.lines.reduce((sum, line) => sum + line.amount, 0n);
    expect(view.subtotal).toBe(lineSum);
    // The total is the discounted base plus the tax the backend applied.
    expect(view.total).toBe(view.subtotal - view.discount + view.tax);

    // The rendered document shows the subtotal and the total it was given.
    expect(screen.getByText("$ 800")).toBeInTheDocument();
    expect(screen.getByText("$ 812")).toBeInTheDocument();
  });

  // --- Accepted change: the fiscal regime decides IVA -----------------------

  it("hides the tax row for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ fiscalRegime: FiscalRegime.noResponsableIva }),
    );
    getInvoiceMock.mockResolvedValue(
      invoice({ taxRate: 0n, tax: 0n, total: 50000n }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.queryByText(/Impuesto/)).not.toBeInTheDocument();
    // The total is the plain subtotal, with no tax added: the line amount, the
    // subtotal and the total all read $ 500.
    expect(screen.getAllByText("$ 500")).toHaveLength(3);
  });

  // --- Characterization: the credit installment plan ------------------------
  //
  // The accepted change lets a credit invoice be settled installment by
  // installment. These tests protect the surrounding working behavior: a credit
  // invoice renders one row per installment with its due date and amount, the
  // progress badge and the pending balance reconcile with the rows, a paid row
  // offers no action, and registering a payment calls the backend with the
  // installment number and refreshes the invoice.

  it("renders one row per installment with its due date and amount", async () => {
    getInvoiceMock.mockResolvedValue(creditInvoice());
    renderWithProviders(<InvoiceDetailPage />);

    const panel = await screen.findByTestId(
      "invoice_detail.installments_panel",
    );
    expect(panel).toHaveTextContent("3 cuotas");
    expect(
      screen.getByTestId("invoice_detail.installments_progress"),
    ).toHaveTextContent("1 / 3 pagadas");

    const first = screen.getByTestId("invoice_detail.installment_row.1");
    expect(first).toHaveTextContent("1 / 3");
    expect(first).toHaveTextContent("$ 200");
    expect(first).toHaveTextContent("Pagada");

    const second = screen.getByTestId("invoice_detail.installment_row.2");
    expect(second).toHaveTextContent("2 / 3");
    expect(second).toHaveTextContent("$ 200");
    expect(second).toHaveTextContent("Pendiente");
    expect(
      screen.getByTestId("invoice_detail.installment_row.3"),
    ).toBeInTheDocument();
  });

  it("reconciles the progress badge and pending balance with the rows", async () => {
    getInvoiceMock.mockResolvedValue(creditInvoice());
    renderWithProviders(<InvoiceDetailPage />);

    const panel = await screen.findByTestId(
      "invoice_detail.installments_panel",
    );
    // One of the three installments is already paid.
    expect(
      screen.getByTestId("invoice_detail.installments_progress"),
    ).toHaveTextContent("1 / 3 pagadas");
    // Total financed $ 600, paid $ 200, pending $ 400.
    expect(panel).toHaveTextContent("$ 600");
    expect(panel).toHaveTextContent("$ 400");
  });

  it("offers no payment action on an already paid installment", async () => {
    getInvoiceMock.mockResolvedValue(creditInvoice());
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.installments_panel");
    expect(
      screen.queryByTestId("invoice_detail.pay_installment_button.1"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("invoice_detail.pay_installment_button.2"),
    ).toBeInTheDocument();
  });

  it("registers an installment payment through the backend", async () => {
    getInvoiceMock.mockResolvedValue(creditInvoice());
    registerInstallmentPaymentMock.mockResolvedValue(
      creditInvoice({ paymentStatus: PaymentStatus.pending }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.installments_panel");
    await userEvent.click(
      screen.getByTestId("invoice_detail.pay_installment_button.2"),
    );

    await waitFor(() =>
      expect(registerInstallmentPaymentMock).toHaveBeenCalledTimes(1),
    );
    expect(registerInstallmentPaymentMock.mock.calls[0][0]).toBe(1n);
    expect(registerInstallmentPaymentMock.mock.calls[0][1]).toBe(2n);
    await waitFor(() =>
      expect(toastSuccessMock).toHaveBeenCalledWith("Cuota 2 registrada"),
    );
  });

  it("surfaces a backend rejection when registering an installment", async () => {
    getInvoiceMock.mockResolvedValue(creditInvoice());
    registerInstallmentPaymentMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.installments_panel");
    await userEvent.click(
      screen.getByTestId("invoice_detail.pay_installment_button.2"),
    );

    expect(
      await screen.findByTestId("invoice_detail.installment_error"),
    ).toHaveTextContent("No se pudo registrar el pago de la cuota");
  });

  it("does not render the installment panel for a cash invoice", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");
    expect(
      screen.queryByTestId("invoice_detail.installments_panel"),
    ).not.toBeInTheDocument();
  });

  // --- Accepted behavior: the WhatsApp action on the invoice detail ---------
  //
  // The accepted change adds an "Enviar por WhatsApp" action to the detail
  // view. This test protects the page wiring: the action asks the backend for
  // the invoice's customer with the invoice context and reference, and opens
  // WhatsApp with the draft.

  it("opens WhatsApp for the invoice's customer with the invoice context", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<InvoiceDetailPage />);

      await screen.findByTestId("invoice_detail.document");
      await userEvent.click(
        screen.getByTestId("invoice_detail.whatsapp_button"),
      );

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 1n,
        context: WhatsAppContext.invoice,
        referenceId: 1n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573000000000");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the invoice's customer has no phone registered", async () => {
    getInvoiceMock.mockResolvedValue(invoice());
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<InvoiceDetailPage />);

    await screen.findByTestId("invoice_detail.document");
    await userEvent.click(screen.getByTestId("invoice_detail.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
