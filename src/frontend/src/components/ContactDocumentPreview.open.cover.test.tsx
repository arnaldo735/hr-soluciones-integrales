import { ContactDocumentPreview } from "@/components/ContactDocumentPreview";
import type { ContactDocument } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted change: «Ver ficha» must respond on the first click
 * without delaying the page that renders it.
 *
 * The accepted change mounts the heavy preview body (the company-profile read
 * and the section flattening) only once the dialog is actually open, so merely
 * rendering the button must not query the backend. This test pins that
 * observable contract: no profile read on mount, one read when the dialog
 * opens, and no PDF generated until the user asks for it.
 *
 * The backend actor is mocked; the real profile is not exercised here.
 */

const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { getCompanyProfile: getCompanyProfileMock },
    isFetching: false,
  }),
}));

const downloadContactDocumentPdfMock = vi.fn();
vi.mock("@/lib/pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pdf")>();
  return {
    ...actual,
    downloadContactDocumentPdf: (...args: unknown[]) =>
      downloadContactDocumentPdfMock(...args),
  };
});

function customerDocument(): ContactDocument {
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: "CLI-1",
    name: "Ada Lovelace",
    meta: [{ label: "Documento", value: "LOAA1815", rail: true }],
    sections: [
      {
        key: "motorcycles",
        title: "Motos registradas",
        columns: ["Marca", "Modelo", "Placa", "Año", "Kilometraje"],
        rows: [["Yamaha", "FZ 2.0", "ABC12D", "2021", "12000 km"]],
      },
    ],
    footer: "Ficha de cliente generada para Ada Lovelace.",
  };
}

describe("ContactDocumentPreview open (cover)", () => {
  beforeEach(() => {
    getCompanyProfileMock.mockReset();
    downloadContactDocumentPdfMock.mockReset();
    getCompanyProfileMock.mockResolvedValue(null);
    downloadContactDocumentPdfMock.mockResolvedValue(undefined);
  });

  it("does not read the company profile until the dialog opens", async () => {
    renderWithProviders(
      <ContactDocumentPreview
        document={customerDocument()}
        ocid="contact.preview_button"
      />,
    );

    // Rendering the button alone must not touch the backend.
    expect(getCompanyProfileMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("contact.preview_button"));

    const dialog = await screen.findByTestId("contact.preview_button.dialog");
    expect(
      within(dialog).getAllByText("Ficha de cliente").length,
    ).toBeGreaterThan(0);

    // The profile is read only as part of the open, and no PDF is generated.
    await waitFor(() => expect(getCompanyProfileMock).toHaveBeenCalled());
    expect(downloadContactDocumentPdfMock).not.toHaveBeenCalled();
  });

  it("generates the PDF only when the user asks for it", async () => {
    renderWithProviders(
      <ContactDocumentPreview
        document={customerDocument()}
        ocid="contact.preview_button"
      />,
    );

    await userEvent.click(screen.getByTestId("contact.preview_button"));
    await screen.findByTestId("contact.preview_button.dialog");

    expect(downloadContactDocumentPdfMock).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByTestId("contact.preview_button.preview.download_button"),
    );

    await waitFor(() =>
      expect(downloadContactDocumentPdfMock).toHaveBeenCalledTimes(1),
    );
  });
});
