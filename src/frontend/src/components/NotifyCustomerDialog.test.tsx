import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import type { CustomerNotificationResult } from "@/lib/types";
import { NotificationSource } from "@/lib/types";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the shared "Notificar al cliente" dialog.
 *
 * The dialog prefills an editable subject and message, sends them to the
 * backend with the customer and source, and blocks sending when the customer
 * has no registered email. These tests assert the observable behavior: the
 * prefilled draft, the payload sent, the success state, and the no-email block.
 */

const notifyCustomerMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { notifyCustomer: notifyCustomerMock },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function result(
  overrides: Partial<CustomerNotificationResult> = {},
): CustomerNotificationResult {
  return {
    sent: true,
    email: "ana@example.com",
    customerId: 7n,
    ...overrides,
  };
}

/** Renders the controlled dialog with a real open/close state. */
function Harness({
  customerEmail,
  onClose,
}: {
  customerEmail: string | null;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <NotifyCustomerDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onClose?.();
      }}
      customerId={7n}
      customerName="Ana Pérez"
      customerEmail={customerEmail}
      source={NotificationSource.order}
      referenceId={123n}
      defaultSubject="Tu orden está lista"
      defaultMessage="Hola Ana, tu moto está lista para recoger."
    />
  );
}

describe("NotifyCustomerDialog", () => {
  beforeEach(() => {
    notifyCustomerMock.mockReset();
  });

  it("prefills the recipient, subject and message", async () => {
    renderWithProviders(<Harness customerEmail="ana@example.com" />);

    const dialog = await screen.findByTestId("notify.dialog");
    expect(within(dialog).getByTestId("notify.recipient_input")).toHaveValue(
      "ana@example.com",
    );
    expect(within(dialog).getByTestId("notify.subject_input")).toHaveValue(
      "Tu orden está lista",
    );
    expect(within(dialog).getByTestId("notify.message_textarea")).toHaveValue(
      "Hola Ana, tu moto está lista para recoger.",
    );
  });

  it("sends the notification with the customer, source and edited draft", async () => {
    notifyCustomerMock.mockResolvedValue(result());
    renderWithProviders(<Harness customerEmail="ana@example.com" />);

    const dialog = await screen.findByTestId("notify.dialog");
    const subject = within(dialog).getByTestId("notify.subject_input");
    await userEvent.clear(subject);
    await userEvent.type(subject, "Tu moto está lista");
    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(notifyCustomerMock.mock.calls[0][0]).toMatchObject({
      customerId: 7n,
      source: NotificationSource.order,
      referenceId: 123n,
      subject: "Tu moto está lista",
      message: "Hola Ana, tu moto está lista para recoger.",
    });

    expect(
      await within(dialog).findByTestId("notify.success_state"),
    ).toHaveTextContent("ana@example.com");
  });

  it("blocks sending when the customer has no email", async () => {
    renderWithProviders(<Harness customerEmail={null} />);

    const dialog = await screen.findByTestId("notify.dialog");
    expect(
      within(dialog).getByTestId("notify.no_email_state"),
    ).toHaveTextContent("no tiene un correo registrado");
    expect(within(dialog).getByTestId("notify.subject_input")).toBeDisabled();
    expect(
      within(dialog).getByTestId("notify.message_textarea"),
    ).toBeDisabled();
    expect(within(dialog).getByTestId("notify.submit_button")).toBeDisabled();
    expect(notifyCustomerMock).not.toHaveBeenCalled();
  });

  it("shows a clear error when the backend reports the send failed", async () => {
    // The backend no longer traps on a send failure: it resolves with
    // `sent = false`. The dialog must surface that as an error rather than a
    // success, and must not claim the notification was delivered.
    notifyCustomerMock.mockResolvedValue(result({ sent: false, email: "" }));
    renderWithProviders(<Harness customerEmail="ana@example.com" />);

    const dialog = await screen.findByTestId("notify.dialog");
    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    expect(
      await within(dialog).findByTestId("notify.form.error_state"),
    ).toHaveTextContent("No se pudo enviar la notificación.");
    expect(
      within(dialog).queryByTestId("notify.success_state"),
    ).not.toBeInTheDocument();
  });

  it("shows a clear error when the send rejects", async () => {
    notifyCustomerMock.mockRejectedValue(new Error("gateway unreachable"));
    renderWithProviders(<Harness customerEmail="ana@example.com" />);

    const dialog = await screen.findByTestId("notify.dialog");
    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    expect(
      await within(dialog).findByTestId("notify.form.error_state"),
    ).toHaveTextContent("No se pudo enviar la notificación.");
    expect(
      within(dialog).queryByTestId("notify.success_state"),
    ).not.toBeInTheDocument();
  });

  it("blocks an empty subject or message", async () => {
    renderWithProviders(<Harness customerEmail="ana@example.com" />);

    const dialog = await screen.findByTestId("notify.dialog");
    await userEvent.clear(within(dialog).getByTestId("notify.subject_input"));
    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    expect(
      await within(dialog).findByTestId("notify.form.error_state"),
    ).toHaveTextContent("obligatorios");
    expect(notifyCustomerMock).not.toHaveBeenCalled();
  });
});
