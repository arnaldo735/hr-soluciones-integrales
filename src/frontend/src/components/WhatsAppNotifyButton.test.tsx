import {
  WhatsAppNotifyButton,
  buildWhatsAppUrl,
} from "@/components/WhatsAppNotifyButton";
import type { WhatsAppMessageResult } from "@/lib/types";
import { WhatsAppContactKind, WhatsAppContext } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization coverage for the shared "Enviar por WhatsApp" button.
 *
 * The accepted change adds this action beside the existing email notification
 * on orders, quotes, invoices, services, POS, appointments, receivables and
 * suppliers. These tests protect the behavior the button already has: it asks
 * the backend for the contact's normalized phone and suggested message, shows
 * an editable draft, opens WhatsApp with the prefilled text on confirm, and
 * blocks the send with a clear notice when the contact has no phone. They never
 * assert the absence of the button, because adding it is the accepted change.
 */

const prepareWhatsAppMessageMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { prepareWhatsAppMessage: prepareWhatsAppMessageMock },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function prepared(
  overrides: Partial<WhatsAppMessageResult> = {},
): WhatsAppMessageResult {
  return {
    contactKind: WhatsAppContactKind.customer,
    contactId: 7n,
    contactName: "Ana Pérez",
    hasPhone: true,
    phone: "+57 300 111 2222",
    message: "Hola Ana, tu orden OT-0007 está lista para recoger.",
    ...overrides,
  };
}

function renderButton() {
  return renderWithProviders(
    <WhatsAppNotifyButton
      contactKind={WhatsAppContactKind.customer}
      contactId={7n}
      context={WhatsAppContext.order}
      referenceId={42n}
      contactName="Ana Pérez"
      ocid="test.whatsapp_button"
    />,
  );
}

describe("WhatsAppNotifyButton", () => {
  beforeEach(() => {
    prepareWhatsAppMessageMock.mockReset();
  });

  it("builds a wa.me link with the digits of the phone and the encoded message", () => {
    expect(buildWhatsAppUrl("+57 300 111 2222", "Hola Ana")).toBe(
      "https://wa.me/573001112222?text=Hola%20Ana",
    );
  });

  it("asks the backend for the contact's phone and message on open", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    renderButton();

    await userEvent.click(screen.getByTestId("test.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    await waitFor(() =>
      expect(prepareWhatsAppMessageMock).toHaveBeenCalledTimes(1),
    );
    expect(prepareWhatsAppMessageMock.mock.calls[0][0]).toMatchObject({
      contactKind: WhatsAppContactKind.customer,
      contactId: 7n,
      context: WhatsAppContext.order,
      referenceId: 42n,
    });
    // The normalized phone and the suggested draft are shown to the user.
    expect(
      within(dialog).getByTestId("whatsapp.phone_value"),
    ).toHaveTextContent("+57 300 111 2222");
    expect(within(dialog).getByTestId("whatsapp.message_textarea")).toHaveValue(
      "Hola Ana, tu orden OT-0007 está lista para recoger.",
    );
  });

  it("opens WhatsApp with the edited message prefilled", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderButton();
      await userEvent.click(screen.getByTestId("test.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      const textarea = within(dialog).getByTestId("whatsapp.message_textarea");
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Hola Ana, ¿confirmas la entrega?");

      await userEvent.click(within(dialog).getByTestId("whatsapp.send_button"));

      await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
      expect(openSpy.mock.calls[0][0]).toBe(
        "https://wa.me/573001112222?text=Hola%20Ana%2C%20%C2%BFconfirmas%20la%20entrega%3F",
      );
    } finally {
      openSpy.mockRestore();
    }
  });

  it("blocks the send and explains when the contact has no phone", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(
      prepared({ hasPhone: false, phone: undefined }),
    );
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderButton();
      await userEvent.click(screen.getByTestId("test.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      expect(
        await within(dialog).findByTestId("whatsapp.no_phone_state"),
      ).toHaveTextContent("no tiene un teléfono registrado");
      expect(within(dialog).getByTestId("whatsapp.send_button")).toBeDisabled();
      expect(openSpy).not.toHaveBeenCalled();
    } finally {
      openSpy.mockRestore();
    }
  });

  it("shows a clear error when the backend cannot prepare the message", async () => {
    prepareWhatsAppMessageMock.mockRejectedValue(new Error("boom"));
    renderButton();

    await userEvent.click(screen.getByTestId("test.whatsapp_button"));

    const dialog = await screen.findByTestId("whatsapp.dialog");
    expect(
      await within(dialog).findByTestId("whatsapp.form.error_state"),
    ).toHaveTextContent("No se pudo preparar el mensaje de WhatsApp");
  });

  it("disables the send action when the message is emptied", async () => {
    prepareWhatsAppMessageMock.mockResolvedValue(prepared());
    const openSpy = vi.spyOn(window, "open").mockReturnValue(null);
    try {
      renderButton();
      await userEvent.click(screen.getByTestId("test.whatsapp_button"));

      const dialog = await screen.findByTestId("whatsapp.dialog");
      const send = within(dialog).getByTestId("whatsapp.send_button");
      // The prefilled draft is sendable.
      await waitFor(() => expect(send).toBeEnabled());

      await userEvent.clear(
        within(dialog).getByTestId("whatsapp.message_textarea"),
      );

      // An empty message cannot be sent, so WhatsApp is never opened.
      expect(send).toBeDisabled();
      expect(openSpy).not.toHaveBeenCalled();
    } finally {
      openSpy.mockRestore();
    }
  });
});
