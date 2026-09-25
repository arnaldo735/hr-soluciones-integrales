import type {
  BusinessSettings,
  CompanyProfile,
  Customer,
  Motorcycle,
  QuoteView,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  DocumentType,
  FiscalRegime,
  QuoteStatus,
  TaxResponsibility,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { QuoteDetailPage } from "@/pages/QuoteDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the quote detail page and its printable document.
 *
 * The accepted change makes the company's fiscal regime decide whether IVA
 * applies. These tests protect the surrounding quote contract (the loaded
 * record, the live totals panel and the printable document) and pin the regime
 * rule at both seams: a responsable company shows the tax line, a
 * non-responsable one does not and its total is the discounted base.
 */

const getQuoteMock = vi.fn();
const getBusinessSettingsMock = vi.fn();
const getCompanyProfileMock = vi.fn();
const listCustomersMock = vi.fn();
const listMotorcyclesMock = vi.fn();
const prepareWhatsAppMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getQuote: getQuoteMock,
      getBusinessSettings: getBusinessSettingsMock,
      getCompanyProfile: getCompanyProfileMock,
      listCustomers: listCustomersMock,
      listMotorcycles: listMotorcyclesMock,
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
  useParams: () => ({ id: "7" }),
  useNavigate: () => vi.fn(),
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
    phone: "+57 300 111 1111",
    message: "Hola Ada, te compartimos la cotización COT-0007.",
    ...overrides,
  };
}

/**
 * A quote with one part line of 2 × $ 250.00 = $ 500.00 and no discount, so the
 * taxable base is $ 500.00. The stored tax fields mirror a responsable company
 * at 16%; the page recomputes the live totals from the regime, so a
 * non-responsable company must show no tax and a $ 500.00 total.
 */
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

describe("QuoteDetailPage", () => {
  beforeEach(() => {
    getQuoteMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCompanyProfileMock.mockReset();
    listCustomersMock.mockReset();
    listMotorcyclesMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getQuoteMock.mockResolvedValue(quoteView());
    getBusinessSettingsMock.mockResolvedValue(business());
    getCompanyProfileMock.mockResolvedValue(companyProfile());
    listCustomersMock.mockResolvedValue([customer()]);
    listMotorcyclesMock.mockResolvedValue([motorcycle()]);
  });

  it("renders the loaded quote with its live totals and printable document", async () => {
    renderWithProviders(<QuoteDetailPage />);

    // The number renders in the page header and in the printable document.
    expect((await screen.findAllByText("COT-0007")).length).toBeGreaterThan(0);

    const totals = within(screen.getByTestId("quote_detail.totals.panel"));
    expect(totals.getByText("Subtotal")).toBeInTheDocument();
    // Repuestos and Subtotal both read $ 500 for this single-line quote.
    expect(totals.getAllByText("$ 500").length).toBeGreaterThanOrEqual(1);
    expect(totals.getByText("Total")).toBeInTheDocument();
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 580",
    );

    // The printable document renders the same totals block.
    const document = screen.getByTestId("quote_detail.document");
    expect(within(document).getByText("Cotización")).toBeInTheDocument();
    expect(within(document).getByText("COT-0007")).toBeInTheDocument();
  });

  it("shows the tax line for a responsable company", async () => {
    renderWithProviders(<QuoteDetailPage />);

    await screen.findAllByText("COT-0007");

    const totals = within(screen.getByTestId("quote_detail.totals.panel"));
    expect(totals.getByText(/Impuesto/)).toBeInTheDocument();
    expect(totals.getByText("$ 80")).toBeInTheDocument();
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 580",
    );
  });

  it("hides the tax line and totals the discounted base for a non-responsable company", async () => {
    getCompanyProfileMock.mockResolvedValue(
      companyProfile({ fiscalRegime: FiscalRegime.noResponsableIva }),
    );
    renderWithProviders(<QuoteDetailPage />);

    await screen.findAllByText("COT-0007");

    const totals = within(screen.getByTestId("quote_detail.totals.panel"));
    expect(totals.getByText("Subtotal")).toBeInTheDocument();
    expect(totals.getByText("Total")).toBeInTheDocument();
    expect(totals.queryByText(/Impuesto/)).not.toBeInTheDocument();
    // The total is the plain subtotal, with no tax added.
    expect(screen.getByTestId("quote_detail.totals.total")).toHaveTextContent(
      "$ 500",
    );

    // The printable document omits the tax line too.
    const document = screen.getByTestId("quote_detail.document");
    await waitFor(() =>
      expect(within(document).queryByText(/Impuesto/)).not.toBeInTheDocument(),
    );
    expect(within(document).getByText("Total")).toBeInTheDocument();
  });

  // --- Accepted behavior: the WhatsApp action on the quote detail -----------
  //
  // The accepted change adds an "Enviar por WhatsApp" action to the quote
  // detail. It asks the backend for the customer's normalized phone and the
  // quote draft, and opens WhatsApp with the editable text; a customer with no
  // phone shows a clear notice instead.

  it("opens WhatsApp for the quote's customer with the quote context", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(preparedWhatsApp());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(<QuoteDetailPage />);
      await screen.findAllByText("COT-0007");

      await userEvent.click(screen.getByTestId("quote_detail.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
      );
      expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
        contactKind: WhatsAppContactKind.customer,
        contactId: 1n,
        context: WhatsAppContext.quote,
        referenceId: 7n,
      });

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));

      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573001111111");
    } finally {
      openSpy.mockRestore();
    }
  });

  it("explains when the quote's customer has no phone registered", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(
      preparedWhatsApp({ hasPhone: false, phone: undefined }),
    );
    renderWithProviders(<QuoteDetailPage />);
    await screen.findAllByText("COT-0007");

    await userEvent.click(screen.getByTestId("quote_detail.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.no_phone_state"),
    ).toHaveTextContent("no tiene un teléfono registrado");
    expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
  });
});
