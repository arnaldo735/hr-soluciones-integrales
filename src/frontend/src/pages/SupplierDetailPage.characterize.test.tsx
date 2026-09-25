import type { Payable, Supplier } from "@/lib/types";
import { PayableStatus } from "@/lib/types";
import { SupplierDetailPage } from "@/pages/SupplierDetailPage";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the supplier detail page (/proveedores/$id).
 *
 * The accepted change removes the "Enviar por WhatsApp" action from this page's
 * header. These tests protect the behavior that must survive that change: the
 * supplier's own data (name, contact, phone, email, tax id, address, created
 * date), the payable summary, the purchases/payments/supplier-orders listings,
 * and the printable "Ver ficha" preview built from the supplier record.
 *
 * They deliberately do NOT assert the presence of the WhatsApp button, because
 * removing it is the accepted change. The shared WhatsAppNotifyButton keeps its
 * own dedicated coverage in components/WhatsAppNotifyButton.test.tsx.
 */

const getSupplierMock = vi.fn();
const getPayableMock = vi.fn();
const listPurchasesMock = vi.fn();
const listPaymentsMock = vi.fn();
const listSupplierOrdersMock = vi.fn();
const getCompanyProfileMock = vi.fn();

// The "Ver ficha" preview generates a PDF on demand; the generator is mocked so
// the test observes the flow, not the PDF bytes.
const downloadContactDocumentPdfMock = vi.fn();

vi.mock("@/lib/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdf")>();
  return {
    ...actual,
    downloadContactDocumentPdf: (...args: unknown[]) =>
      downloadContactDocumentPdfMock(...args),
  };
});

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getSupplier: getSupplierMock,
      getPayable: getPayableMock,
      listPurchases: listPurchasesMock,
      listPayments: listPaymentsMock,
      listSupplierOrders: listSupplierOrdersMock,
      getCompanyProfile: getCompanyProfileMock,
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

describe("SupplierDetailPage (characterization)", () => {
  beforeEach(() => {
    getSupplierMock.mockReset();
    getPayableMock.mockReset();
    listPurchasesMock.mockReset();
    listPaymentsMock.mockReset();
    listSupplierOrdersMock.mockReset();
    getCompanyProfileMock.mockReset();
    downloadContactDocumentPdfMock.mockReset();

    getCompanyProfileMock.mockResolvedValue(null);
    downloadContactDocumentPdfMock.mockResolvedValue(undefined);
    getSupplierMock.mockResolvedValue(supplier());
    getPayableMock.mockResolvedValue(payable());
    listPurchasesMock.mockResolvedValue([]);
    listPaymentsMock.mockResolvedValue([]);
    listSupplierOrdersMock.mockResolvedValue([]);
  });

  it("shows the supplier's own data in the header card", async () => {
    renderWithProviders(<SupplierDetailPage />);

    const header = await screen.findByTestId("supplier_detail.header.card");
    expect(
      within(header).getByText("Refacciones del Norte"),
    ).toBeInTheDocument();
    expect(within(header).getByText("Laura Medina")).toBeInTheDocument();
    expect(within(header).getByText("81 8345 2210")).toBeInTheDocument();
    expect(
      within(header).getByText("ventas@refacciones.mx"),
    ).toBeInTheDocument();
    expect(within(header).getByText("RDN980412H73")).toBeInTheDocument();
    expect(
      within(header).getByText("Av. Constitución 1450"),
    ).toBeInTheDocument();
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

  it("shows the empty states for purchases, payments and supplier orders", async () => {
    renderWithProviders(<SupplierDetailPage />);

    expect(
      await screen.findByTestId("supplier_detail.purchases.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("supplier_detail.payments.empty_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("supplier_detail.supplier_orders.empty_state"),
    ).toBeInTheDocument();
  });

  it("shows the not-found state when the supplier does not exist", async () => {
    getSupplierMock.mockResolvedValue(null);
    renderWithProviders(<SupplierDetailPage />);

    expect(
      await screen.findByTestId("supplier_detail.not_found_state"),
    ).toBeInTheDocument();
  });

  it("shows the error state when the supplier read fails", async () => {
    getSupplierMock.mockRejectedValue(new Error("boom"));
    renderWithProviders(<SupplierDetailPage />);

    expect(
      await screen.findByTestId("supplier_detail.error_state"),
    ).toBeInTheDocument();
  });

  // --- Printable "Ver ficha" (ContactDocumentPreview) ----------------------
  //
  // The accepted change keeps the printable supplier ficha on the page. These
  // tests pin that the button opens a preview carrying the supplier's data and
  // that the PDF is generated only when the user asks for it.

  it("opens the printable supplier ficha with the supplier's data", async () => {
    renderWithProviders(<SupplierDetailPage />);
    await screen.findByTestId("supplier_detail.payable.section");

    await userEvent.click(screen.getByTestId("supplier_detail.preview_button"));

    const dialog = await screen.findByTestId(
      "supplier_detail.preview_button.dialog",
    );
    // The ficha title and its document number are rendered on the sheet.
    expect(
      within(dialog).getAllByText("Ficha de proveedor").length,
    ).toBeGreaterThan(0);
    expect(within(dialog).getByText("PRV-1")).toBeInTheDocument();
    // The supplier's own fields are carried into the ficha meta.
    expect(within(dialog).getByText("RDN980412H73")).toBeInTheDocument();
    expect(within(dialog).getByText("81 8345 2210")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Ficha de proveedor generada para Refacciones del Norte.",
      ),
    ).toBeInTheDocument();
  });

  it("does not generate the ficha PDF until the user asks for it", async () => {
    renderWithProviders(<SupplierDetailPage />);
    await screen.findByTestId("supplier_detail.payable.section");

    await userEvent.click(screen.getByTestId("supplier_detail.preview_button"));
    await screen.findByTestId("supplier_detail.preview_button.dialog");

    expect(downloadContactDocumentPdfMock).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByTestId(
        "supplier_detail.preview_button.preview.download_button",
      ),
    );

    await waitFor(() =>
      expect(downloadContactDocumentPdfMock).toHaveBeenCalledTimes(1),
    );
    const [document, , format] = downloadContactDocumentPdfMock.mock.calls[0];
    expect(document).toMatchObject({ kind: "supplier", number: "PRV-1" });
    expect(format).toBe("a4");
  });
});
