import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import type { ContactDocument, WhatsAppMessageResult } from "@/lib/types";
import { WhatsAppContactKind, WhatsAppContext } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the accepted WhatsApp + PDF attachment flow.
 *
 * The accepted change lets the WhatsApp action attach the contact's printable
 * ficha: the dialog shows a format selector (A4 / Tirilla 80 mm) and, on
 * confirm, generates and downloads the PDF in the chosen format before opening
 * WhatsApp with the prefilled message. These tests pin that observable
 * behavior; they never assert the exact PDF bytes.
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

const prepareWhatsAppMessageMock = vi.fn();
const getCompanyProfileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
      getCompanyProfile: getCompanyProfileMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function attachment(overrides: Partial<ContactDocument> = {}): ContactDocument {
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: "CLI-7",
    name: "Ana Pérez",
    meta: [{ label: "Teléfono", value: "+57 300 111 2222", rail: true }],
    sections: [],
    footer: "Ficha de cliente generada para Ana Pérez.",
    ...overrides,
  };
}

function prepared(
  overrides: Partial<WhatsAppMessageResult> = {},
): WhatsAppMessageResult {
  return {
    contactKind: WhatsAppContactKind.customer,
    contactId: 7n,
    contactName: "Ana Pérez",
    hasPhone: true,
    phone: "+57 300 111 2222",
    message: "Hola Ana, te comparto la ficha de tu moto.",
    ...overrides,
  };
}

function renderButton(document: ContactDocument) {
  return renderWithProviders(
    <WhatsAppNotifyButton
      contactKind={WhatsAppContactKind.customer}
      contactId={7n}
      context={WhatsAppContext.service}
      contactName="Ana Pérez"
      attachment={document}
      ocid="test.whatsapp_button"
    />,
  );
}

describe("WhatsAppNotifyButton attachment", () => {
  beforeEach(() => {
    downloadContactDocumentPdfMock.mockReset();
    prepareWhatsAppMessageMock.mockReset();
    getCompanyProfileMock.mockReset();
    getCompanyProfileMock.mockResolvedValue(null);
  });

  it("shows the attachment panel with the A4 and 80 mm formats", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    renderButton(attachment());

    await userEvent.click(screen.getByTestId("test.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    const panel = await within(dialog).findByTestId(
      "whatsapp.attachment_panel",
    );
    expect(panel).toHaveTextContent("Ficha de cliente · CLI-7");
    expect(within(panel).getByTestId("whatsapp.format_a4")).toBeInTheDocument();
    expect(
      within(panel).getByTestId("whatsapp.format_receipt80"),
    ).toBeInTheDocument();
  });

  it("downloads the PDF in the chosen format and opens WhatsApp with the message", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderButton(attachment());
      await userEvent.click(screen.getByTestId("test.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await within(dialog).findByTestId("whatsapp.attachment_panel");

      // Pick the 80 mm roll before sending.
      await userEvent.click(
        within(dialog).getByTestId("whatsapp.format_receipt80"),
      );
      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));

      await waitFor(() =>
        expect(downloadContactDocumentPdfMock).toHaveBeenCalledTimes(1),
      );
      const [document, , format] = downloadContactDocumentPdfMock.mock.calls[0];
      expect(document).toMatchObject({ kind: "customer", number: "CLI-7" });
      expect(format).toBe("receipt80");

      // WhatsApp opens with the prefilled message after the PDF is generated.
      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toContain("https://wa.me/573001112222");
      expect(openSpy.mock.calls[0][0]).toContain(
        encodeURIComponent("Hola Ana, te comparto la ficha de tu moto."),
      );
    } finally {
      openSpy.mockRestore();
    }
  });

  it("does not open WhatsApp when the PDF cannot be generated", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    downloadContactDocumentPdfMock.mockImplementation(() => {
      throw new Error("pdf boom");
    });
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderButton(attachment());
      await userEvent.click(screen.getByTestId("test.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      await within(dialog).findByTestId("whatsapp.attachment_panel");
      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));

      expect(
        await within(dialog).findByTestId("whatsapp.form.error_state"),
      ).toHaveTextContent("No se pudo generar el PDF del documento");
      expect(openSpy).not.toHaveBeenCalled();
    } finally {
      openSpy.mockRestore();
    }
  });
});
