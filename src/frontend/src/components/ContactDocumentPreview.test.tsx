import { ContactDocumentPreview } from "@/components/ContactDocumentPreview";
import type { ContactDocument } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted printable contact ficha (cliente y proveedor).
 *
 * The accepted change requires every generated document to be printable in
 * both A4 and 80 mm receipt formats. This component is the shared entry point
 * for the customer and supplier fichas: it opens a preview, lets the user pick
 * the paper format, and downloads a real PDF in the chosen format. These tests
 * pin that observable behavior; they never assert the exact PDF bytes.
 */

const downloadContactDocumentPdfMock = vi.fn();

vi.mock("@/lib/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdf")>();
  return {
    ...actual,
    downloadContactDocumentPdf: (...args: unknown[]) =>
      downloadContactDocumentPdfMock(...args),
  };
});

const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { getCompanyProfile: getCompanyProfileMock },
    isFetching: false,
  }),
}));

function customerDocument(
  overrides: Partial<ContactDocument> = {},
): ContactDocument {
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: "CLI-1",
    name: "Ada Lovelace",
    meta: [
      { label: "Documento", value: "LOAA1815", rail: true },
      { label: "Teléfono", value: "+52 555 0100", rail: true },
    ],
    sections: [
      {
        key: "motorcycles",
        title: "Motos registradas",
        columns: ["Marca", "Modelo", "Placa", "Año", "Kilometraje"],
        rows: [["Yamaha", "FZ 2.0", "ABC12D", "2021", "12000 km"]],
      },
    ],
    footer: "Ficha de cliente generada para Ada Lovelace.",
    ...overrides,
  };
}

function supplierDocument(
  overrides: Partial<ContactDocument> = {},
): ContactDocument {
  return {
    kind: "supplier",
    title: "Ficha de proveedor",
    number: "PRV-1",
    name: "Refacciones del Norte",
    meta: [
      { label: "NIT / Documento", value: "RDN980412H73", rail: true },
      { label: "Teléfono", value: "81 8345 2210", rail: true },
    ],
    sections: [],
    footer: "Ficha de proveedor generada para Refacciones del Norte.",
    ...overrides,
  };
}

function renderPreview(document: ContactDocument) {
  return renderWithProviders(
    <ContactDocumentPreview
      document={document}
      ocid="contact.preview_button"
    />,
  );
}

/** The paper element carrying the format-specific class. */
function paper(): HTMLElement {
  const sheet = document.querySelector(".doc-preview");
  if (!(sheet instanceof HTMLElement)) {
    throw new Error("document paper element not found");
  }
  return sheet;
}

describe("ContactDocumentPreview", () => {
  beforeEach(() => {
    downloadContactDocumentPdfMock.mockReset();
    getCompanyProfileMock.mockReset();
    getCompanyProfileMock.mockResolvedValue(null);
  });

  it("opens the customer ficha preview with its data", async () => {
    renderPreview(customerDocument());

    await userEvent.click(screen.getByTestId("contact.preview_button"));

    const dialog = await screen.findByTestId("contact.preview_button.dialog");
    // The title appears in the dialog header and on the document itself.
    expect(
      within(dialog).getAllByText("Ficha de cliente").length,
    ).toBeGreaterThan(0);
    expect(within(dialog).getByText("CLI-1")).toBeInTheDocument();
    expect(within(dialog).getByText("LOAA1815")).toBeInTheDocument();
    // The customer name is carried in the document footer.
    expect(
      within(dialog).getByText("Ficha de cliente generada para Ada Lovelace."),
    ).toBeInTheDocument();
  });

  it("switches the preview between A4 and 80 mm", async () => {
    renderPreview(customerDocument());
    await userEvent.click(screen.getByTestId("contact.preview_button"));
    await screen.findByTestId("contact.preview_button.dialog");

    // A4 is the default.
    expect(paper().className).toContain("doc-preview-a4");

    await userEvent.click(
      screen.getByTestId("contact.preview_button.preview.format_receipt80"),
    );

    expect(paper().className).toContain("doc-preview-80mm");
    expect(paper().className).not.toContain("doc-preview-a4");
  });

  it("downloads the customer ficha as a PDF in the selected format", async () => {
    renderPreview(customerDocument());
    await userEvent.click(screen.getByTestId("contact.preview_button"));
    await screen.findByTestId("contact.preview_button.dialog");

    await userEvent.click(
      screen.getByTestId("contact.preview_button.preview.format_receipt80"),
    );
    await userEvent.click(
      screen.getByTestId("contact.preview_button.preview.download_button"),
    );

    await waitFor(() =>
      expect(downloadContactDocumentPdfMock).toHaveBeenCalledTimes(1),
    );
    const [document, , format] = downloadContactDocumentPdfMock.mock.calls[0];
    expect(document).toMatchObject({ kind: "customer", number: "CLI-1" });
    expect(format).toBe("receipt80");
  });

  it("downloads the supplier ficha as an A4 PDF by default", async () => {
    renderPreview(supplierDocument());
    await userEvent.click(screen.getByTestId("contact.preview_button"));
    await screen.findByTestId("contact.preview_button.dialog");

    await userEvent.click(
      screen.getByTestId("contact.preview_button.preview.download_button"),
    );

    await waitFor(() =>
      expect(downloadContactDocumentPdfMock).toHaveBeenCalledTimes(1),
    );
    const [document, , format] = downloadContactDocumentPdfMock.mock.calls[0];
    expect(document).toMatchObject({ kind: "supplier", number: "PRV-1" });
    expect(format).toBe("a4");
  });
});
