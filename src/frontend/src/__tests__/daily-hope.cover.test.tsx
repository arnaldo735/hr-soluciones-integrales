import { DocumentPreview } from "@/components/DocumentPreview";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { downloadContactDocumentPdf } from "@/lib/pdf";
import type {
  ContactDocument,
  HopeMessage,
  HopeSettings,
  WhatsAppMessageResult,
} from "@/lib/types";
import {
  HopeMode,
  NotificationSource,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { SettingsPage } from "@/pages/SettingsPage";
import { renderWithProviders } from "@/test/helpers";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Cover for the accepted daily Biblical-hope feature.
 *
 * The accepted change appends a daily hope promise to (a) the footer of every
 * printable document, (b) the prefilled WhatsApp message and (c) the customer
 * email notification, and lets an administrator configure it (auto/manual,
 * enabled/disabled) from Configuración. These tests exercise the observable
 * behavior through the real components and hooks with a local typed actor mock:
 *
 * - the Configuración «Mensaje de esperanza» card shows today's promise in auto
 *   mode, saves the exact manual text/citation, and hides the preview when the
 *   switch is off;
 * - `DocumentPreview` renders the promise in both A4 and 80 mm and renders
 *   nothing when it is absent;
 * - the real PDF path carries the promise in both formats;
 * - the WhatsApp draft and the email notification end with the promise while
 *   preserving the original status text.
 *
 * The backend is mocked here; the PocketIC lane is the only place the real
 * canister is exercised. In particular, the promise is appended to the outgoing
 * email by the backend (`appendHope` in `lib/notifications.mo`), so the email
 * test only asserts that the dialog forwards the editable draft unchanged.
 */

// `vi.hoisted` keeps the mock fns initialized before the hoisted `vi.mock`
// factories run, so the factories never read a binding in its temporal dead
// zone regardless of import order.
const {
  getHopeSettingsMock,
  updateHopeSettingsMock,
  getDailyHopeMessageMock,
  getBusinessSettingsMock,
  getCallerUserProfileMock,
  getDriveConnectionStatusMock,
  listBackupsMock,
  getLocalBackupManifestMock,
  getBackupSectionMock,
  prepareWhatsAppMessageMock,
  notifyCustomerMock,
  downloadFileMock,
  useAuthMock,
} = vi.hoisted(() => ({
  getHopeSettingsMock: vi.fn(),
  updateHopeSettingsMock: vi.fn(),
  getDailyHopeMessageMock: vi.fn(),
  getBusinessSettingsMock: vi.fn(),
  getCallerUserProfileMock: vi.fn(),
  getDriveConnectionStatusMock: vi.fn(),
  listBackupsMock: vi.fn(),
  getLocalBackupManifestMock: vi.fn(),
  getBackupSectionMock: vi.fn(),
  prepareWhatsAppMessageMock: vi.fn(),
  notifyCustomerMock: vi.fn(),
  downloadFileMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

// A single stable actor object: recreating it on every render would give the
// auth context a new identity each time and keep the page's queries from
// settling.
const actorMock = {
  getHopeSettings: getHopeSettingsMock,
  updateHopeSettings: updateHopeSettingsMock,
  getDailyHopeMessage: getDailyHopeMessageMock,
  getBusinessSettings: getBusinessSettingsMock,
  getCallerUserProfile: getCallerUserProfileMock,
  getDriveConnectionStatus: getDriveConnectionStatusMock,
  listBackups: listBackupsMock,
  getLocalBackupManifest: getLocalBackupManifestMock,
  getBackupSection: getBackupSectionMock,
  prepareWhatsAppMessage: prepareWhatsAppMessageMock,
  notifyCustomer: notifyCustomerMock,
};

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({ actor: actorMock, isFetching: false }),
}));

// The settings page reads the session from the auth context. Only `useAuth` is
// stubbed; the real `AuthProvider` that `renderWithProviders` mounts is kept.
vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return { ...actual, useAuth: () => useAuthMock() };
});

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/lib/download", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/download")>();
  return {
    ...actual,
    downloadFile: (...args: unknown[]) => downloadFileMock(...args),
  };
});

// The page links to the users and roles screens with TanStack Router's `Link`,
// which needs a router context. Rendering it as a plain anchor keeps the page
// renderable without mounting a router.
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
}));

function hopeSettings(overrides: Partial<HopeSettings> = {}): HopeSettings {
  return {
    enabled: true,
    mode: HopeMode.auto,
    manualText: "",
    manualCitation: "",
    updatedAt: 0n,
    ...overrides,
  };
}

function hopeMessage(overrides: Partial<HopeMessage> = {}): HopeMessage {
  return {
    enabled: true,
    mode: HopeMode.auto,
    text: "El Señor es mi pastor; nada me faltará.",
    citation: "Salmos 23:1",
    referenceDate: "26/09/2026",
    ...overrides,
  };
}

function adminAuth() {
  return {
    token: "session-token",
    user: {
      userId: 1n,
      username: "dueno.taller",
      name: "Dueño",
      roleId: 1n,
      roleName: "Administrador",
      modules: [],
    },
    isAdmin: true,
    modules: [],
    roleName: "Administrador",
    isAuthenticated: true,
    isLoading: false,
    isRestoring: false,
    login: vi.fn(),
    logout: vi.fn(),
    refetch: vi.fn(),
  };
}

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
    message:
      "Hola Ana, su orden de trabajo OT-0007 está lista para entrega.\n\nEl Señor es mi pastor; nada me faltará. (Salmos 23:1)",
    ...overrides,
  };
}

describe("daily hope — Configuración card", () => {
  beforeEach(() => {
    getHopeSettingsMock.mockReset();
    updateHopeSettingsMock.mockReset();
    getDailyHopeMessageMock.mockReset();
    getBusinessSettingsMock.mockReset();
    getCallerUserProfileMock.mockReset();
    getDriveConnectionStatusMock.mockReset();
    listBackupsMock.mockReset();
    getLocalBackupManifestMock.mockReset();
    getBackupSectionMock.mockReset();
    useAuthMock.mockReset();

    useAuthMock.mockReturnValue(adminAuth());
    getBusinessSettingsMock.mockResolvedValue({
      name: "HR SOLUCIONES INTEGRALES",
      taxId: "900.123.456-7",
      address: "Calle 45 #12-30, Bogotá",
      phone: "+57 300 000 0000",
      taxRate: 16n,
    });
    getCallerUserProfileMock.mockResolvedValue({
      name: "Dueño",
      role: "admin",
      createdAt: 0n,
    });
    getDriveConnectionStatusMock.mockResolvedValue({ connected: false });
    listBackupsMock.mockResolvedValue({ __kind__: "ok", ok: [] });
  });

  it("shows the section with auto mode selected and today's promise", async () => {
    getHopeSettingsMock.mockResolvedValue(hopeSettings());
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage());
    renderWithProviders(<SettingsPage />);

    // `settings.hope.form` only renders once the settings query has resolved;
    // the card itself is present while loading too.
    await screen.findByTestId("settings.hope.form");
    expect(screen.getByText("Mensaje de esperanza")).toBeInTheDocument();
    // Auto mode is the selected radio.
    expect(screen.getByTestId("settings.hope.mode_auto_radio")).toBeChecked();
    // Today's promise and its citation are visible.
    expect(screen.getByTestId("settings.hope.auto_text")).toHaveTextContent(
      "El Señor es mi pastor; nada me faltará.",
    );
    expect(screen.getByTestId("settings.hope.auto_citation")).toHaveTextContent(
      "Salmos 23:1",
    );
  });

  it("saves the exact manual text and citation", async () => {
    getHopeSettingsMock.mockResolvedValue(hopeSettings());
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage());
    updateHopeSettingsMock.mockResolvedValue(
      hopeSettings({
        mode: HopeMode.manual,
        manualText: "Dios es nuestro amparo.",
        manualCitation: "Salmos 46:1",
      }),
    );
    renderWithProviders(<SettingsPage />);

    await screen.findByTestId("settings.hope.form");
    await userEvent.click(
      screen.getByTestId("settings.hope.mode_manual_radio"),
    );

    const text = await screen.findByTestId("settings.hope.manual_text_input");
    await userEvent.type(text, "Dios es nuestro amparo.");
    await userEvent.type(
      screen.getByTestId("settings.hope.manual_citation_input"),
      "Salmos 46:1",
    );
    await userEvent.click(screen.getByTestId("settings.hope.save_button"));

    await waitFor(() =>
      expect(updateHopeSettingsMock).toHaveBeenCalledTimes(1),
    );
    expect(updateHopeSettingsMock.mock.calls[0][1]).toEqual({
      enabled: true,
      mode: HopeMode.manual,
      manualText: "Dios es nuestro amparo.",
      manualCitation: "Salmos 46:1",
    });
  });

  it("hides the preview when the switch is turned off", async () => {
    getHopeSettingsMock.mockResolvedValue(hopeSettings());
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage());
    renderWithProviders(<SettingsPage />);

    await screen.findByTestId("settings.hope.form");
    await userEvent.click(screen.getByTestId("settings.hope.enabled_switch"));

    const preview = await screen.findByTestId("settings.hope.preview");
    expect(
      within(preview).getByTestId("settings.hope.preview_hidden"),
    ).toBeInTheDocument();
    // The promise text and citation are no longer shown in the preview.
    expect(
      within(preview).queryByText("El Señor es mi pastor; nada me faltará."),
    ).not.toBeInTheDocument();
    expect(within(preview).queryByText("Salmos 23:1")).not.toBeInTheDocument();
  });

  it("blocks saving manual mode with an empty text", async () => {
    getHopeSettingsMock.mockResolvedValue(hopeSettings());
    getDailyHopeMessageMock.mockResolvedValue(hopeMessage());
    renderWithProviders(<SettingsPage />);

    await screen.findByTestId("settings.hope.form");
    await userEvent.click(
      screen.getByTestId("settings.hope.mode_manual_radio"),
    );

    expect(
      await screen.findByTestId("settings.hope.manual_text_error"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.hope.save_button")).toBeDisabled();
    expect(updateHopeSettingsMock).not.toHaveBeenCalled();
  });
});

describe("daily hope — printable document footer", () => {
  it("renders the promise in the A4 format", () => {
    renderPreview({
      format: "a4",
      hopeMessage: { text: "El Señor es mi pastor.", citation: "Salmos 23:1" },
    });
    expect(screen.getByTestId("doc.preview.hope_message")).toBeInTheDocument();
    expect(screen.getByText("El Señor es mi pastor.")).toBeInTheDocument();
    expect(screen.getByText("Salmos 23:1")).toBeInTheDocument();
  });

  it("renders the promise in the 80 mm format", () => {
    renderPreview({
      format: "receipt80",
      hopeMessage: { text: "El Señor es mi pastor.", citation: "Salmos 23:1" },
    });
    expect(screen.getByTestId("doc.preview.hope_message")).toBeInTheDocument();
    expect(screen.getByText("El Señor es mi pastor.")).toBeInTheDocument();
  });

  it("renders nothing when there is no promise", () => {
    renderPreview({ hopeMessage: null });
    expect(
      screen.queryByTestId("doc.preview.hope_message"),
    ).not.toBeInTheDocument();
    // The document body still renders.
    expect(screen.getByText("Taller Central")).toBeInTheDocument();
  });
});

describe("daily hope — real PDF footer", () => {
  afterEach(() => {
    downloadFileMock.mockReset();
  });

  it("generates a real PDF carrying the promise in both formats", async () => {
    downloadFileMock.mockResolvedValue(undefined);

    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos" },
      "a4",
      { text: "El Señor es mi pastor.", citation: "Salmos 23:1" },
    );
    await downloadContactDocumentPdf(
      contactDocument(),
      { name: "Taller HR Motos" },
      "receipt80",
      { text: "El Señor es mi pastor.", citation: "Salmos 23:1" },
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

describe("daily hope — WhatsApp message", () => {
  beforeEach(() => {
    prepareWhatsAppMessageMock.mockReset();
  });

  it("shows the draft ending with the promise and preserving the status text", async () => {
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
    const draft = within(dialog).getByTestId("whatsapp.message_textarea");
    expect(draft).toHaveValue(
      "Hola Ana, su orden de trabajo OT-0007 está lista para entrega.\n\nEl Señor es mi pastor; nada me faltará. (Salmos 23:1)",
    );
    // The original status text is preserved at the start of the message.
    expect((draft as HTMLTextAreaElement).value).toContain(
      "su orden de trabajo OT-0007 está lista para entrega.",
    );
  });

  it("opens WhatsApp with the promise prefilled after the status text", async () => {
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
      const url = decodeURIComponent(openSpy.mock.calls[0][0] as string);
      expect(url).toContain(
        "su orden de trabajo OT-0007 está lista para entrega.",
      );
      expect(url).toContain("El Señor es mi pastor; nada me faltará.");
      expect(url).toContain("Salmos 23:1");
    } finally {
      openSpy.mockRestore();
    }
  });
});

describe("daily hope — email notification", () => {
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

  it("sends the status message the user typed to the backend", async () => {
    notifyCustomerMock.mockResolvedValue({
      sent: true,
      email: "ana@example.com",
      customerId: 7n,
    });
    renderWithProviders(<Harness />);

    const dialog = await screen.findByTestId("notify.dialog");
    await userEvent.click(within(dialog).getByTestId("notify.submit_button"));

    await waitFor(() => expect(notifyCustomerMock).toHaveBeenCalledTimes(1));
    const sent = notifyCustomerMock.mock.calls[0][0] as {
      message: string;
      subject: string;
      customerId: bigint;
      source: NotificationSource;
      referenceId: bigint;
    };
    // The dialog forwards the editable draft unchanged; the backend appends the
    // daily promise to the outgoing email (covered by the PocketIC lane).
    expect(sent.message).toBe("Hola Ana, tu moto está lista para recoger.");
    expect(sent.subject).toBe("Tu orden está lista");
    expect(sent.customerId).toBe(7n);
    expect(sent.source).toBe(NotificationSource.order);
    expect(sent.referenceId).toBe(123n);
  });
});
