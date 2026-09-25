import { DriveBackupCard } from "@/components/DriveBackupCard";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: the administrator's Google Drive backup card.
 *
 * The card shows the connection state, offers "Conectar con Google Drive" when
 * the administrator has not authorized their account, uploads a JSON backup on
 * "Respaldar ahora" and shows a confirmation with a Drive link, lists the
 * recent backups read from Drive (with an empty state before the first one),
 * and offers "Desconectar".
 */

const getDriveConnectionStatusMock = vi.fn();
const startDriveAuthorizationMock = vi.fn();
const disconnectDriveMock = vi.fn();
const createBackupMock = vi.fn();
const listBackupsMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getDriveConnectionStatus: getDriveConnectionStatusMock,
      startDriveAuthorization: startDriveAuthorizationMock,
      disconnectDrive: disconnectDriveMock,
      createBackup: createBackupMock,
      listBackups: listBackupsMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function backupFile(overrides: Record<string, unknown> = {}) {
  return {
    fileId: "file-1",
    name: "respaldo-hr-2026-09-22-1530.json",
    size: 2048n,
    createdAt: 1_700_000_000_000_000_000n,
    webViewLink: "https://drive.google.com/file/d/file-1/view",
    ...overrides,
  };
}

describe("DriveBackupCard", () => {
  beforeEach(() => {
    getDriveConnectionStatusMock.mockReset();
    startDriveAuthorizationMock.mockReset();
    disconnectDriveMock.mockReset();
    createBackupMock.mockReset();
    listBackupsMock.mockReset();
    listBackupsMock.mockResolvedValue({ __kind__: "ok", ok: [] });
  });

  it("offers to connect when the administrator has not authorized Drive", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: false,
      configuration: { configured: true, missingVariables: [] },
    });
    renderWithProviders(<DriveBackupCard />);

    expect(
      await screen.findByTestId("settings.drive.connect_button"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.drive.status_badge")).toHaveTextContent(
      "Desconectado",
    );
    // No backup action is offered before the account is connected.
    expect(
      screen.queryByTestId("settings.drive.backup_button"),
    ).not.toBeInTheDocument();
  });

  it("names the missing OAuth variables and disables connect when unconfigured", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: false,
      configuration: {
        configured: false,
        missingVariables: [
          "GOOGLE_OAUTH_CLIENT_ID",
          "GOOGLE_OAUTH_CLIENT_SECRET",
        ],
      },
    });
    renderWithProviders(<DriveBackupCard />);

    expect(
      await screen.findByTestId("settings.drive.missing_variables_state"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings.drive.status_badge")).toHaveTextContent(
      "No configurado",
    );
    expect(
      screen.getAllByText("GOOGLE_OAUTH_CLIENT_ID").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("GOOGLE_OAUTH_CLIENT_SECRET").length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("settings.drive.connect_button")).toBeDisabled();
  });

  it("names all three Google OAuth environment variables in the setup panel", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: false,
      configuration: { configured: true, missingVariables: [] },
    });
    renderWithProviders(<DriveBackupCard />);

    const panel = await screen.findByTestId("settings.drive.setup_panel");
    // The panel must name exactly the variables the backend reads, so the
    // administrator can configure the canister without guessing.
    expect(
      within(panel).getByText("GOOGLE_OAUTH_CLIENT_ID"),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText("GOOGLE_OAUTH_CLIENT_SECRET"),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText("GOOGLE_OAUTH_REDIRECT_URI"),
    ).toBeInTheDocument();
  });

  it("starts the OAuth authorization and redirects to Google", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: false,
      configuration: { configured: true, missingVariables: [] },
    });
    startDriveAuthorizationMock.mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?x=1",
      state: "state-1",
    });
    const assign = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign },
    });

    try {
      renderWithProviders(<DriveBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.drive.connect_button"),
      );

      await waitFor(() =>
        expect(startDriveAuthorizationMock).toHaveBeenCalledTimes(1),
      );
      await waitFor(() =>
        expect(assign).toHaveBeenCalledWith(
          "https://accounts.google.com/o/oauth2/v2/auth?x=1",
        ),
      );
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it("shows the empty history state before the first backup", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: true,
      configuration: { configured: true, missingVariables: [] },
    });
    listBackupsMock.mockResolvedValue({ __kind__: "ok", ok: [] });
    renderWithProviders(<DriveBackupCard />);

    expect(
      await screen.findByTestId("settings.drive.history.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Aún no hay respaldos")).toBeInTheDocument();
  });

  it("uploads a backup and shows the confirmation with a Drive link", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: true,
      configuration: { configured: true, missingVariables: [] },
    });
    createBackupMock.mockResolvedValue({
      __kind__: "ok",
      ok: backupFile(),
    });
    renderWithProviders(<DriveBackupCard />);

    await userEvent.click(
      await screen.findByTestId("settings.drive.backup_button"),
    );

    expect(
      await screen.findByTestId("settings.drive.backup.success_state"),
    ).toBeInTheDocument();
    expect(createBackupMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("respaldo-hr-2026-09-22-1530.json"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.drive.backup.open_link"),
    ).toHaveAttribute("href", "https://drive.google.com/file/d/file-1/view");
  });

  it("lists the backups read from Drive with their date and link", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: true,
      configuration: { configured: true, missingVariables: [] },
    });
    listBackupsMock.mockResolvedValue({
      __kind__: "ok",
      ok: [
        backupFile(),
        backupFile({
          fileId: "file-2",
          name: "respaldo-hr-2026-09-21-0900.json",
          webViewLink: "https://drive.google.com/file/d/file-2/view",
        }),
      ],
    });
    renderWithProviders(<DriveBackupCard />);

    expect(
      await screen.findByTestId("settings.drive.history.list"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.drive.history.item.1"),
    ).toHaveTextContent("respaldo-hr-2026-09-22-1530.json");
    expect(screen.getByTestId("settings.drive.history.link.1")).toHaveAttribute(
      "href",
      "https://drive.google.com/file/d/file-1/view",
    );
    expect(screen.getByTestId("settings.drive.history.link.2")).toHaveAttribute(
      "href",
      "https://drive.google.com/file/d/file-2/view",
    );
  });

  it("shows the error and offers a retry when the backup fails", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: true,
      configuration: { configured: true, missingVariables: [] },
    });
    createBackupMock.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "driveFailed", driveFailed: "cuota excedida" },
    });
    renderWithProviders(<DriveBackupCard />);

    await userEvent.click(
      await screen.findByTestId("settings.drive.backup_button"),
    );

    expect(
      await screen.findByTestId("settings.drive.backup.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Drive rechazó la operación: cuota excedida/),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.drive.backup.retry_button"),
    ).toBeInTheDocument();
  });

  it("disconnects the administrator's Drive account", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: true,
      configuration: { configured: true, missingVariables: [] },
    });
    disconnectDriveMock.mockResolvedValue(undefined);
    renderWithProviders(<DriveBackupCard />);

    await userEvent.click(
      await screen.findByTestId("settings.drive.disconnect_button"),
    );

    await waitFor(() => expect(disconnectDriveMock).toHaveBeenCalledTimes(1));
  });

  // --- Characterization: the Drive backup card's existing states ------------
  //
  // The accepted change adds a separate "Descargar copia local" action next to
  // the Drive backup. These tests protect the Drive card's own behavior that
  // must survive it: the connection state resolves through a loading state, the
  // Drive backup action is offered only once the account is connected, and a
  // backup in flight disables the button and shows a loading notice so a second
  // upload cannot be triggered.

  it("shows a loading state while the Drive connection resolves", async () => {
    // A promise that never settles keeps the query in its loading state.
    getDriveConnectionStatusMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DriveBackupCard />);

    expect(
      await screen.findByTestId("settings.drive.connection.loading_state"),
    ).toBeInTheDocument();
    // Neither the connect nor the backup action is offered while loading.
    expect(
      screen.queryByTestId("settings.drive.connect_button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings.drive.backup_button"),
    ).not.toBeInTheDocument();
  });

  it("disables the Drive backup button and shows a loading notice while it runs", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: true,
      configuration: { configured: true, missingVariables: [] },
    });
    // A promise that never settles keeps the mutation pending.
    createBackupMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DriveBackupCard />);

    const button = await screen.findByTestId("settings.drive.backup_button");
    await userEvent.click(button);

    await waitFor(() => expect(createBackupMock).toHaveBeenCalledTimes(1));
    // The button is disabled and relabelled so a duplicate upload is blocked.
    await waitFor(() =>
      expect(screen.getByTestId("settings.drive.backup_button")).toBeDisabled(),
    );
    expect(
      screen.getByTestId("settings.drive.backup.loading_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.drive.backup_button"),
    ).toHaveTextContent("Generando y subiendo…");
  });

  it("keeps the Drive backup action hidden until the account is connected", async () => {
    getDriveConnectionStatusMock.mockResolvedValue({
      connected: false,
      configuration: { configured: true, missingVariables: [] },
    });
    renderWithProviders(<DriveBackupCard />);

    // The connect action is offered, but no backup action is available yet.
    expect(
      await screen.findByTestId("settings.drive.connect_button"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("settings.drive.backup_button"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings.drive.history.list"),
    ).not.toBeInTheDocument();
  });
});
