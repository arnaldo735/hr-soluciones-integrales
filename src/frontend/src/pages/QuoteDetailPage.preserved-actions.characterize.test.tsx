import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  Motorcycle,
  QuoteView,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  PaymentMethod,
  QuoteStatus,
  TaxResponsibility,
} from "@/lib/types";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the quote detail actions that the accepted
 * search rework must not change.
 *
 * The accepted change replaces the two-step part/service picker flow with a
 * unified one-step search and clears/refocuses the box after a selection. These
 * tests deliberately do NOT assert that picker flow. They protect the adjacent
 * working behavior the acceptance criteria name explicitly: the new-quote route
 * renders without a blank screen, and an existing quote still supports status
 * changes, print-format selection, conversion to order/invoice, editing and
 * deletion.
 *
 * The actor is mocked with the current call shape (session token first), so a
 * regression to the token-less contract fails here.
 */

const getQuoteMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const listCustomersMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const updateQuoteStatusMock = vi.fn();
const updateQuoteMock = vi.fn();
const deleteQuoteMock = vi.fn();
const convertQuoteToOrderMock = vi.fn();
const convertQuoteToInvoiceMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getQuote: getQuoteMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      listCustomers: listCustomersMock,
      listMotorcycles: listMotorcyclesMock,
      updateQuoteStatus: updateQuoteStatusMock,
      updateQuote: updateQuoteMock,
      deleteQuote: deleteQuoteMock,
      convertQuoteToOrder: convertQuoteToOrderMock,
      convertQuoteToInvoice: convertQuoteToInvoiceMock,
    },
    isFetching: false,
  }),
}));

const navigateMock = vi.fn();

// The route params are read through a mutable holder so one file can exercise
// both the edit route (`{ id: "7" }`) and the new-quote route (`{}`).
let routeParams: { id?: string } = { id: "7" };

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
  useParams: () => routeParams,
  useNavigate: () => navigateMock,
  useSearch: () => ({}),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function customer(): Customer {
  return {
    id: 1n,
    name: "Ada Lovelace",
    phone: "+57 300 111 1111",
    email: undefined,
    document: undefined,
    address: undefined,
    createdAt: 1_700_000_000_000_000_000n,
  };
}

function motorcycle(): Motorcycle {
  return {
    id: 2n,
    customerId: 1n,
    plate: "ABC12D",
    brand: "Yamaha",
    model: "FZ25",
    year: 2021n,
    mileage: 12000n,
    createdAt: 1_700_000_000_000_000_000n,
  };
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

function companyProfile(): CompanyProfile {
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
  };
}

/** A draft quote with one part line, used as the loaded record. */
function quoteView(overrides: Partial<QuoteView> = {}): QuoteView {
  return {
    quote: {
      id: 7n,
      status: QuoteStatus.draft,
      serviceLines: [],
      createdAt: 1_700_000_000_000_000_000n,
      quoteNumber: "COT-0007",
      updatedAt: 1_700_000_000_000_000_000n,
      notes: undefined,
      discount: 0n,
      motorcycleId: 2n,
      customerId: 1n,
      partLines: [
        {
          id: 1n,
          description: "Balata de freno",
          quantity: 2n,
          unitPrice: 25000n,
          partId: 1n,
        },
      ],
      taxRate: 16n,
    },
    totals: {
      tax: 8000n,
      total: 58000n,
      taxableBase: 50000n,
      servicesSubtotal: 0n,
      partsSubtotal: 50000n,
      discount: 0n,
      taxRate: 16n,
      subtotal: 50000n,
    },
    ...overrides,
  };
}

describe("QuoteDetailPage preserved quote actions (characterization)", () => {
  beforeEach(() => {
    getQuoteMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    updateQuoteStatusMock.mockReset();
    updateQuoteMock.mockReset();
    deleteQuoteMock.mockReset();
    convertQuoteToOrderMock.mockReset();
    convertQuoteToInvoiceMock.mockReset();
    navigateMock.mockReset();
    routeParams = { id: "7" };
    getQuoteMock.mockResolvedValue(quoteView());
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("renders the loaded quote without a blank screen", async () => {
    renderWithProviders(<QuoteDetailPage />);

    // The page container and the loaded record both render, so the route is
    // not stuck on the loading skeleton or the not-found state.
    expect(await screen.findByTestId("quote_detail.page")).toBeInTheDocument();
    expect((await screen.findAllByText("COT-0007")).length).toBeGreaterThan(0);
    expect(
      screen.queryByTestId("quote_detail.loading_state"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("quote_detail.error_state"),
    ).not.toBeInTheDocument();
  });

  it("renders the new-quote route without a blank screen", async () => {
    routeParams = {};
    renderWithProviders(<QuoteDetailPage />);

    // The new-quote form renders its header and the unified item search, so
    // the route is not blank and not stuck on an error state.
    expect(await screen.findByText("Nueva cotización")).toBeInTheDocument();
    expect(screen.getByTestId("quote_detail.page")).toBeInTheDocument();
    expect(
      screen.getByTestId("quote_detail.item_search_input"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("quote_detail.error_state"),
    ).not.toBeInTheDocument();
  });

  it("changes the quote status through the backend", async () => {
    updateQuoteStatusMock.mockResolvedValue(
      quoteView({
        quote: { ...quoteView().quote, status: QuoteStatus.sent },
      }),
    );
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    await userEvent.click(
      screen.getByTestId(`quote_detail.status_button.${QuoteStatus.sent}`),
    );

    await waitFor(() => expect(updateQuoteStatusMock).toHaveBeenCalledTimes(1));
    // The session token is the leading argument; id and status follow.
    expect(updateQuoteStatusMock).toHaveBeenCalledWith(
      null,
      7n,
      QuoteStatus.sent,
    );
  });

  it("switches the printable document between A4 and the 80 mm roll", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    const document = screen.getByTestId("quote_detail.document");
    // A4 is the default format.
    expect(
      within(document).getByTestId("quote_detail.document.format_a4"),
    ).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      within(document).getByTestId("quote_detail.document.format_receipt80"),
    );

    expect(
      within(document).getByTestId("quote_detail.document.format_receipt80"),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(document).getByTestId("quote_detail.document.format_a4"),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("converts an accepted quote into a workshop order", async () => {
    getQuoteMock.mockResolvedValue(
      quoteView({
        quote: { ...quoteView().quote, status: QuoteStatus.accepted },
      }),
    );
    convertQuoteToOrderMock.mockResolvedValue({
      order: { id: 55n, orderNumber: "OT-0055" },
    });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    await userEvent.click(screen.getByTestId("quote_detail.convert_button"));
    await userEvent.click(
      await screen.findByTestId("quote_detail.convert_order_button"),
    );

    await waitFor(() =>
      expect(convertQuoteToOrderMock).toHaveBeenCalledWith(null, 7n),
    );
  });

  it("converts an accepted quote into an invoice with the chosen payment method", async () => {
    getQuoteMock.mockResolvedValue(
      quoteView({
        quote: { ...quoteView().quote, status: QuoteStatus.accepted },
      }),
    );
    convertQuoteToInvoiceMock.mockResolvedValue({ id: 88n, number: "FV-0088" });
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    await userEvent.click(screen.getByTestId("quote_detail.convert_button"));
    await userEvent.click(
      await screen.findByTestId("quote_detail.convert_invoice_button"),
    );

    await waitFor(() =>
      expect(convertQuoteToInvoiceMock).toHaveBeenCalledWith(
        null,
        7n,
        PaymentMethod.cash,
      ),
    );
  });

  it("keeps the convert action disabled until the quote is accepted", async () => {
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    expect(screen.getByTestId("quote_detail.convert_button")).toBeDisabled();
  });

  it("edits the loaded quote and sends the updated input", async () => {
    updateQuoteMock.mockResolvedValue(quoteView());
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    // A loaded quote initializes straight into the editable form, so the notes
    // field is available without an extra "Editar" step.
    const notes = await screen.findByTestId("quote_detail.notes_textarea");
    await userEvent.type(notes, "Vigencia 15 días");
    await userEvent.click(screen.getByTestId("quote_detail.save_button"));

    await waitFor(() => expect(updateQuoteMock).toHaveBeenCalledTimes(1));
    const [token, id, input] = updateQuoteMock.mock.calls[0];
    expect(token).toBeNull();
    expect(id).toBe(7n);
    expect(input.notes).toBe("Vigencia 15 días");
    expect(input.customerId).toBe(1n);
  });

  it("deletes the quote only after the confirmation dialog", async () => {
    deleteQuoteMock.mockResolvedValue(true);
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    await userEvent.click(screen.getByTestId("quote_detail.delete_button"));
    // The dialog opens; nothing is deleted until the confirm action.
    expect(
      await screen.findByTestId("quote_detail.delete_dialog"),
    ).toBeInTheDocument();
    expect(deleteQuoteMock).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByTestId("quote_detail.delete_confirm_button"),
    );

    await waitFor(() => expect(deleteQuoteMock).toHaveBeenCalledWith(null, 7n));
  });
});
