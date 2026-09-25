import { ExitSessionDialog } from "@/components/ExitSessionDialog";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: the administrator's exit confirmation.
 *
 * The dialog reminds the administrator to back up before closing the session
 * and offers "Respaldar y salir", "Salir sin respaldar" and "Cancelar". A failed
 * backup keeps the session open and shows the error so the administrator can
 * retry or leave without backing up. When Drive is not connected the dialog
 * says so and points to Configuración.
 */

const createBackupMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: { createBackup: createBackupMock },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

function backupResult(overrides: Record<string, unknown> = {}) {
  return {
    fileId: "file-1",
    name: "respaldo-hr-2026-09-22-1530.json",
    size: 2048n,
    createdAt: 1_700_000_000_000_000_000n,
    webViewLink: "https://drive.google.com/file/d/file-1/view",
    ...overrides,
  };
}

function renderDialog(
  overrides: Partial<{
    isDriveConfigured: boolean;
    isDriveLoading: boolean;
    onLogout: () => void;
  }> = {},
) {
  const onLogout = overrides.onLogout ?? vi.fn();
  const onOpenChange = vi.fn();
  renderWithProviders(
    <ExitSessionDialog
      open
      onOpenChange={onOpenChange}
      isDriveConfigured={overrides.isDriveConfigured ?? true}
      isDriveLoading={overrides.isDriveLoading ?? false}
      onLogout={onLogout}
    />,
  );
  return { onLogout, onOpenChange };
}

describe("ExitSessionDialog", () => {
  beforeEach(() => {
    createBackupMock.mockReset();
  });

  it("offers the three exit options and reminds the administrator to back up", () => {
    renderDialog();

    expect(screen.getByTestId("exit_session.dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Respaldar y salir" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salir sin respaldar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/te recomendamos respaldar la información del taller/i),
    ).toBeInTheDocument();
  });

  it("keeps the session open when the administrator cancels", async () => {
    const { onLogout, onOpenChange } = renderDialog();

    await userEvent.click(screen.getByTestId("exit_session.cancel_button"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onLogout).not.toHaveBeenCalled();
    expect(createBackupMock).not.toHaveBeenCalled();
  });

  it("backs up and then closes the session on success", async () => {
    createBackupMock.mockResolvedValue({ __kind__: "ok", ok: backupResult() });
    const { onLogout } = renderDialog();

    await userEvent.click(
      screen.getByTestId("exit_session.backup_and_exit_button"),
    );

    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
    expect(createBackupMock).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId("exit_session.error_state"),
    ).not.toBeInTheDocument();
  });

  it("keeps the session open and shows the error when the backup fails", async () => {
    createBackupMock.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "driveFailed", driveFailed: "cuota excedida" },
    });
    const { onLogout } = renderDialog();

    await userEvent.click(
      screen.getByTestId("exit_session.backup_and_exit_button"),
    );

    expect(
      await screen.findByTestId("exit_session.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Drive rechazó la operación: cuota excedida/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tu sesión sigue abierta/i)).toBeInTheDocument();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("lets the administrator leave without backing up after a failure", async () => {
    createBackupMock.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "notConnected", notConnected: null },
    });
    const { onLogout } = renderDialog();

    await userEvent.click(
      screen.getByTestId("exit_session.backup_and_exit_button"),
    );
    await screen.findByTestId("exit_session.error_state");

    await userEvent.click(
      screen.getByTestId("exit_session.exit_without_backup_button"),
    );

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("leaves directly without backing up when the administrator chooses so", async () => {
    const { onLogout } = renderDialog();

    await userEvent.click(
      screen.getByTestId("exit_session.exit_without_backup_button"),
    );

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(createBackupMock).not.toHaveBeenCalled();
  });

  it("warns that Drive is not connected and links to Configuración", () => {
    renderDialog({ isDriveConfigured: false });

    expect(
      screen.getByTestId("exit_session.drive_warning"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Google Drive no está conectado"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("exit_session.settings_link")).toHaveAttribute(
      "href",
      "/configuracion",
    );
    // Backing up is not offered while Drive is disconnected.
    expect(
      screen.getByTestId("exit_session.backup_and_exit_button"),
    ).toBeDisabled();
  });
});
