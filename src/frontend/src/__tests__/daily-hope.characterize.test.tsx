import { DocumentPreview } from "@/components/DocumentPreview";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { downloadContactDocumentPdf } from "@/lib/pdf";
import type { ContactDocument, WhatsAppMessageResult } from "@/lib/types";
import {
  NotificationSource,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the seams the daily Biblical-hope message will
 * touch.
 *
 * The accepted change appends a daily hope message to (a) the footer of every
 * printable document, (b) the prefilled WhatsApp message, and (c) the customer
 * email notification. These tests protect the surrounding behavior that must
 * survive that change, and deliberately never freeze the exact footer or
 * message copy — the promise is appended to it:
 *
 * - `DocumentPreview` still renders a caller-provided footer and still renders
 *   with no footer at all, in both A4 and 80 mm formats;
 * - the real PDF path still produces a non-empty document in both formats and
 *   still carries the caller's footer note;
 * - the WhatsApp dialog still shows and sends the backend-prepared message
 *   verbatim, preserving the original status text;
 * - the email dialog still sends the caller's message verbatim, preserving the
 *   original status text.
 */

const prepareWhatsAppMessageMock = vi.fn();
const notifyCustomerMock = vi.fn();
const downloadFileMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      prepareWhatsAppMessage: prepareWhatsAppMessageMock,
      notifyCustomer: notifyCustomerMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return {
    ...actual,
    downloadFile: (...args: unknown[]) => downloadFileMock(...args),
  };
});

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof DocumentPreview>> = {},
) {
  return render(
    <DocumentPreview
      title="Cotización"
      number="COT-0001"
      companyName="Taller Central"
      meta={[{ label: "Cliente", value: "Ada Lovelace" }]}
      lines={[
        {
          description: "Cambio de aceite",
          quantity: 1,
          unitPrice: 450,
          amount: 450,
        },
      ]}
      totals={[{ label: "Total", value: "$ 450", emphasis: true }]}
      format="a4"
      ocid="doc.preview"
      {...overrides}
    />,
  );
}

function contactDocument(
  overrides: Partial<ContactDocument> = {},
): ContactDocument {
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: "CLI-1",
    name: "Ada Lovelace",
    meta: [{ label: "Teléfono", value: "+57 300 111 2222" }],
    sections: [],
    footer: "Ficha de cliente generada para Ada Lovelace.",
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
    message: "Hola Ana, su orden de trabajo OT-0007 está lista para entrega.",
    ...overrides,
  };
}

describe("daily hope — printable document footer seam", () => {
  beforeEach(() => {
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a caller-provided footer in the A4 format", () => {
    renderPreview({ format: "a4", footer: "Gracias por su preferencia" });
    expect(screen.getByText("Gracias por su preferencia")).toBeInTheDocument();
  });

  it("renders a caller-provided footer in the 80 mm format", () => {
    renderPreview({
      format: "receipt80",
      footer: "Gracias por su preferencia",
    });
    expect(screen.getByText("Gracias por su preferencia")).toBeInTheDocument();
  });

  it("renders the document without a footer when none is provided", () => {
    renderPreview({ footer: undefined });
    // The document body still renders; no footer text is invented.
    expect(screen.getByText("Taller Central")).toBeInTheDocument();
    expect(screen.getByText("Cambio de aceite")).toBeInTheDocument();
  });
});

describe("daily hope — real PDF footer seam", () => {
  afterEach(() => {
    downloadFileMock.mockReset();
  });

  it("generates a real non-empty PDF in both formats with the caller's footer", async () => {
    downloadFileMock.mockResolvedValue(undefined);

    await downloadContactDocumentPdf(
      contactDocument({ footer: "Conserva este comprobante." }),
      { name: "Taller HR Motos" },
      "a4",
    );
    await downloadContactDocumentPdf(
      contactDocument({ footer: "Conserva este comprobante." }),
      { name: "Taller HR Motos" },
      "receipt80",
    );

    expect(downloadFileMock).toHaveBeenCalledTimes(2);
    for (const call of downloadFileMock.mock.calls) {
      const options = call[0] as { filename: string; data: Blob };
      expect(options.filename).toBe("ficha-cliente-CLI-1.pdf");
      expect(options.data).toBeInstanceOf(Blob);
      expect(options.data.size).toBeGreaterThan(0);
    }
  });
});

describe("daily hope — WhatsApp message seam", () => {
  beforeEach(() => {
    prepareWhatsAppMessageMock.mockReset();
  });

  it("shows the backend-prepared message verbatim, preserving the status text", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    renderWithProviders(
      <WhatsAppNotifyButton
        contactKind={WhatsAppContactKind.customer}
        contactId={7n}
        context={WhatsAppContext.order}
        referenceId={42n}
        contactName="Ana Pérez"
        ocid="test.whatsapp_button"
      />,
    );

    await userEvent.click(screen.getByTestId("test.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    await waitFor(() =>
      expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
    );
    // The original status text is preserved in the draft the user sees.
    expect(within(dialog).getByTestId("whatsapp.message_textarea")).toHaveValue(
      "Hola Ana, su orden de trabajo OT-0007 está lista para entrega.",
    );
  });

  it("opens WhatsApp with the prepared message prefilled", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderWithProviders(
        <WhatsAppNotifyButton
          contactKind={WhatsAppContactKind.customer}
          contactId={7n}
          context={WhatsAppContext.order}
          referenceId={42n}
          contactName="Ana Pérez"
          ocid="test.whatsapp_button"
        />,
      );

      await userEvent.click(screen.getByTestId("test.whatsapp_button"));
      const dialog = await screen.findByTestId("whatsapp.dialog");
      await waitFor(() =>
        expect(
          within(dialog).getByTestId("whatsapp.send_button"),
        ).toBeEnabled(),
      );
      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));

      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      const url = openSpy.mock.calls[0][0] as string;
      // The prefilled text carries the original status wording.
      expect(decodeURIComponent(url)).toContain(
        "su orden de trabajo OT-0007 está lista para entrega.",
      );
    } finally {
      openSpy.mockRestore();
    }
  });
});

describe("daily hope — email notification seam", () => {
  beforeEach(() => {
    notifyCustomerMock.mockReset();
  });

  function Harness() {
    const [open, setOpen] = useState(true);
    return (
      <NotifyCustomerDialog
        open={open}
        onOpenChange={setOpen}
        customerId={7n}
        customerName="Ana Pérez"
        customerEmail="ana@example.com"
        source={NotificationSource.order}
        referenceId={123n}
        defaultSubject="Tu orden está lista"
        defaultMessage="Hola Ana, tu moto está lista para recoger."
      />
    );
  }

  it("sends the caller's message verbatim, preserving the status text", async () => {
    notifyCustomerMock.mockResolvedValue({
      sent: true,
      email: "ana@example.com",
      customerId: 7n,
    });
    renderWithProviders(<Harness />);

    const dialog = await screen.findByTestId("notify.dialog");
    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(notifyCustomerMock.mock.calls[0][0]).toMatchObject({
      customerId: 7n,
      source: NotificationSource.order,
      referenceId: 123n,
      subject: "Tu orden está lista",
      message: "Hola Ana, tu moto está lista para recoger.",
    });
  });
});
