import { LocalBackupCard } from "@/components/LocalBackupCard";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: the administrator's local backup download.
 *
 * The card offers "Descargar copia local" next to the Google Drive backup. On
 * click it calls the backend `downloadLocalBackup`, downloads the returned JSON
 * under the backend's own file name (which carries the generation date and
 * time), shows a loading state with the button disabled while the mutation is
 * pending, and confirms success or shows a Spanish error message.
 */

const downloadLocalBackupMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      downloadLocalBackup: downloadLocalBackupMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function localBackup(overrides: Record<string, unknown> = {}) {
  return {
    fileName: "copia-local-hr-2026-09-22-1530.json",
    generatedAt: 1_700_000_000_000_000_000n,
    json: JSON.stringify({
      generatedAt: 1_700_000_000_000_000_000,
      customers: [{ id: 1, name: "Ada Lovelace" }],
      orders: [],
      parts: [],
      businessSettings: { name: "HR SOLUCIONES INTEGRALES" },
    }),
    ...overrides,
  };
}

/** Reads a jsdom `Blob` back to text through `FileReader`. */
function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/**
 * jsdom does not implement the object-URL API the download path uses, so the
 * blob URL and the anchor click are stubbed. Returns the captured blob so a
 * test can assert the downloaded bytes.
 */
function stubDownload() {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:copia-local");
  const revokeObjectURL = vi.fn();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});

  return {
    createObjectURL,
    revokeObjectURL,
    clickSpy,
    restore() {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    },
  };
}

describe("LocalBackupCard", () => {
  beforeEach(() => {
    downloadLocalBackupMock.mockReset();
  });

  it("offers the local download action", async () => {
    renderWithProviders(<LocalBackupCard />);

    expect(
      await screen.findByTestId("settings.local_backup.download_button"),
    ).toHaveTextContent("Descargar copia local");
    expect(screen.getByText("Copia de seguridad local")).toBeInTheDocument();
  });

  it("calls the backend and downloads the JSON under the backend file name", async () => {
    downloadLocalBackupMock.mockResolvedValue(localBackup());
    const download = stubDownload();

    try {
      renderWithProviders(<LocalBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.local_backup.download_button"),
      );

      await waitFor(() =>
        expect(downloadLocalBackupMock).toHaveBeenCalledTimes(1),
      );
      await waitFor(() =>
        expect(download.createObjectURL).toHaveBeenCalledTimes(1),
      );

      // The downloaded blob is the backend JSON, typed as JSON. jsdom's Blob
      // has no `text()`, so the bytes are read through FileReader.
      const blob = download.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe("application/json");
      expect(await readBlobText(blob)).toContain("Ada Lovelace");

      // The anchor is clicked once and the object URL is released.
      expect(download.clickSpy).toHaveBeenCalledTimes(1);
      expect(download.revokeObjectURL).toHaveBeenCalledWith("blob:copia-local");
    } finally {
      download.restore();
    }
  });

  it("uses the backend file name, which carries the generation date and time", async () => {
    downloadLocalBackupMock.mockResolvedValue(localBackup());
    const download = stubDownload();
    let downloadedName = "";
    download.clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      downloadedName = this.download;
    });

    try {
      renderWithProviders(<LocalBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.local_backup.download_button"),
      );

      await waitFor(() => expect(download.clickSpy).toHaveBeenCalledTimes(1));
      // The name comes from the backend and includes the date and time.
      expect(downloadedName).toBe("copia-local-hr-2026-09-22-1530.json");
      expect(downloadedName).toMatch(/\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    } finally {
      download.restore();
    }
  });

  it("shows a loading state and disables the button while the copy is generated", async () => {
    // A promise that never settles keeps the mutation pending.
    downloadLocalBackupMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LocalBackupCard />);

    const button = await screen.findByTestId(
      "settings.local_backup.download_button",
    );
    await userEvent.click(button);

    await waitFor(() =>
      expect(downloadLocalBackupMock).toHaveBeenCalledTimes(1),
    );
    // The button is disabled and relabelled so a duplicate download is blocked.
    await waitFor(() =>
      expect(
        screen.getByTestId("settings.local_backup.download_button"),
      ).toBeDisabled(),
    );
    expect(
      screen.getByTestId("settings.local_backup.loading_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.local_backup.download_button"),
    ).toHaveTextContent("Generando copia…");
  });

  it("confirms the download with the file name and generation time", async () => {
    downloadLocalBackupMock.mockResolvedValue(localBackup());
    const download = stubDownload();

    try {
      renderWithProviders(<LocalBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.local_backup.download_button"),
      );

      expect(
        await screen.findByTestId("settings.local_backup.success_state"),
      ).toBeInTheDocument();
      expect(screen.getByText("Copia local descargada")).toBeInTheDocument();
      expect(
        screen.getByText("copia-local-hr-2026-09-22-1530.json"),
      ).toBeInTheDocument();
    } finally {
      download.restore();
    }
  });

  it("shows a Spanish error message and a retry when the download fails", async () => {
    downloadLocalBackupMock.mockRejectedValue(
      new Error("No se pudo generar la copia local."),
    );
    renderWithProviders(<LocalBackupCard />);

    await userEvent.click(
      await screen.findByTestId("settings.local_backup.download_button"),
    );

    expect(
      await screen.findByTestId("settings.local_backup.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo generar la copia local."),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.local_backup.retry_button"),
    ).toBeInTheDocument();
    // No success confirmation is shown on the error path.
    expect(
      screen.queryByTestId("settings.local_backup.success_state"),
    ).not.toBeInTheDocument();
  });

  it("falls back to a Spanish message when the failure carries no message", async () => {
    downloadLocalBackupMock.mockRejectedValue({});
    renderWithProviders(<LocalBackupCard />);

    await userEvent.click(
      await screen.findByTestId("settings.local_backup.download_button"),
    );

    expect(
      await screen.findByTestId("settings.local_backup.error_state"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo completar la operación con Google Drive."),
    ).toBeInTheDocument();
  });
});
