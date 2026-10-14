import { LocalBackupCard } from "@/components/LocalBackupCard";
import { RestoreBackupCard } from "@/components/RestoreBackupCard";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: restoring a local backup file, section by section.
 *
 * The accepted change lets the administrator pick a local JSON backup, preview
 * its sections, choose which ones to restore, and restore only those. These
 * tests pin the accepted contract of the corrected flow:
 *
 *  - a valid file shows a preview with the generation date and each section
 *    with its record count;
 *  - the destructive confirm button stays disabled until the confirmation
 *    checkbox is ticked and at least one section is selected;
 *  - confirming calls `restoreSection` once per selected section, in file
 *    order, with the session token first, and shows the restored / skipped /
 *    error summary;
 *  - choosing the SAME file again after an error re-runs validation (the file
 *    input is reset);
 *  - an empty or non-JSON file shows a Spanish error and never calls the
 *    backend to restore;
 *  - the JSON produced by the local backup download carries `formatVersion`.
 *
 * The backend is fully mocked here; these are component/integration tests, not
 * deployed-browser or real-canister coverage.
 */

const validateRestoreFileMock = vi.fn();
const restoreSectionMock = vi.fn();
const getLocalBackupManifestMock = vi.fn();
const getBackupSectionMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      validateRestoreFile: validateRestoreFileMock,
      restoreSection: restoreSectionMock,
      getLocalBackupManifest: getLocalBackupManifestMock,
      getBackupSection: getBackupSectionMock,
    },
    isFetching: false,
  }),
}));

// The restore hooks read the session token from the auth context. Only
// `useAuth` is stubbed; the real `AuthProvider` that `renderWithProviders`
// mounts is preserved.
vi.mock("@/hooks/use-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-auth")>();
  return { ...actual, useAuth: () => useAuthMock() };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

const GENERATED_AT = 1_700_000_000_000_000_000n;
const FORMAT_VERSION = 1n;

/** The sections the backend reports for a valid file, in file order. */
const SECTIONS = [
  { key: "customers", index: 0n, count: 3n },
  { key: "motorcycles", index: 1n, count: 2n },
  { key: "orders", index: 2n, count: 5n },
] as const;

function preview() {
  return {
    generatedAt: GENERATED_AT,
    formatVersion: FORMAT_VERSION,
    sections: SECTIONS.map((section) => ({ ...section })),
    totalSections: BigInt(SECTIONS.length),
  };
}

/**
 * A `File` whose bytes are the given JSON text. jsdom's `File` has no
 * `text()`, which `readRestoreFile` calls, so it is attached directly.
 */
function jsonFile(
  content: unknown,
  name = "copia-local-hr-2026-09-22-1530.json",
): File {
  const text = JSON.stringify(content);
  const file = new File([text], name, { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(text),
  });
  return file;
}

/** A `File` whose bytes are the given raw text, for the invalid-file paths. */
function rawFile(text: string, name = "copia-local.json"): File {
  const file = new File([text], name, { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(text),
  });
  return file;
}

/** Uploads a file through the card's hidden file input. */
async function uploadFile(file: File) {
  const input = screen.getByTestId(
    "settings.restore.file_input",
  ) as HTMLInputElement;
  await userEvent.upload(input, file);
}

/** A successful `restoreSection` outcome for the given section index. */
function restored(index: bigint, restoredCount: bigint) {
  return {
    __kind__: "ok",
    ok: {
      key: SECTIONS[Number(index)].key,
      index,
      status: { __kind__: "restored", restored: null },
      restored: restoredCount,
    },
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

/** Stubs the object-URL download path so the exported blob can be inspected. */
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

describe("RestoreBackupCard (cover)", () => {
  beforeEach(() => {
    validateRestoreFileMock.mockReset();
    restoreSectionMock.mockReset();
    getLocalBackupManifestMock.mockReset();
    getBackupSectionMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      token: "session-token",
      user: null,
      isAdmin: true,
      modules: null,
      roleName: "Administrador",
      isAuthenticated: true,
      isLoading: false,
      isRestoring: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetch: vi.fn(),
    });
  });

  it("shows a preview with the generation date and each section's record count", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "ok",
      ok: preview(),
    });
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ customers: [], motorcycles: [], orders: [] }));

    const previewPanel = await screen.findByTestId("settings.restore.preview");
    // The generation date is rendered (locale-formatted) and the format
    // version is surfaced.
    expect(previewPanel).toHaveTextContent("Generada el");
    expect(previewPanel).toHaveTextContent("versión 1");
    expect(previewPanel).toHaveTextContent("3 secciones");

    // Every section is listed with its Spanish label and record count.
    const list = screen.getByTestId("settings.restore.section_list");
    expect(within(list).getByText("Clientes")).toBeInTheDocument();
    expect(within(list).getByText("Motos")).toBeInTheDocument();
    expect(within(list).getByText("Órdenes de taller")).toBeInTheDocument();
    expect(within(list).getByText("3 registros")).toBeInTheDocument();
    expect(within(list).getByText("2 registros")).toBeInTheDocument();
    expect(within(list).getByText("5 registros")).toBeInTheDocument();
  });

  it("keeps the confirm button disabled until confirmed and at least one section is selected", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "ok",
      ok: preview(),
    });
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ customers: [], motorcycles: [], orders: [] }));
    await screen.findByTestId("settings.restore.preview");

    const confirmButton = screen.getByTestId("settings.restore.confirm_button");
    // Sections are selected by default, but confirmation is missing.
    expect(confirmButton).toBeDisabled();

    // Confirming without any selected section still keeps it disabled.
    await userEvent.click(
      screen.getByTestId("settings.restore.clear_all_button"),
    );
    await userEvent.click(
      screen.getByTestId("settings.restore.confirm_checkbox"),
    );
    expect(confirmButton).toBeDisabled();

    // Selecting a section with the confirmation ticked enables it.
    await userEvent.click(
      screen.getByTestId("settings.restore.section_checkbox.1"),
    );
    expect(confirmButton).toBeEnabled();
    expect(restoreSectionMock).not.toHaveBeenCalled();
  });

  it("restores one call per selected section with the token first and shows the summary", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "ok",
      ok: preview(),
    });
    restoreSectionMock.mockImplementation(
      async (_token, _json, index: bigint) =>
        restored(index, SECTIONS[Number(index)].count),
    );
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ customers: [], motorcycles: [], orders: [] }));
    await screen.findByTestId("settings.restore.preview");

    // Deselect the middle section (motorcycles, index 1).
    await userEvent.click(
      screen.getByTestId("settings.restore.section_checkbox.2"),
    );
    await userEvent.click(
      screen.getByTestId("settings.restore.confirm_checkbox"),
    );
    await userEvent.click(
      screen.getByTestId("settings.restore.confirm_button"),
    );

    await waitFor(() => expect(restoreSectionMock).toHaveBeenCalledTimes(2));
    // Selected sections are restored in file order, by index.
    expect(restoreSectionMock.mock.calls.map((call) => call[2])).toEqual([
      0n,
      2n,
    ]);
    // The session token is the first argument of every call.
    for (const call of restoreSectionMock.mock.calls) {
      expect(call[0]).toBe("session-token");
    }

    // The summary reports restored, skipped and error counts.
    const success = await screen.findByTestId("settings.restore.success_state");
    expect(success).toHaveTextContent("Restauración completada");
    expect(success).toHaveTextContent("8 registros restaurados en 2 secciones");
    expect(success).toHaveTextContent("1 omitidas");
    expect(success).toHaveTextContent("0 con error");
  });

  it("re-runs validation when the same file is chosen again after an error", async () => {
    // First attempt: the backend rejects the file.
    validateRestoreFileMock.mockResolvedValueOnce({
      __kind__: "err",
      err: { __kind__: "invalidFormat", invalidFormat: "raíz no es un objeto" },
    });
    // Second attempt with the same file: the backend accepts it.
    validateRestoreFileMock.mockResolvedValueOnce({
      __kind__: "ok",
      ok: preview(),
    });
    renderWithProviders(<RestoreBackupCard />);

    const file = jsonFile({ customers: [], motorcycles: [], orders: [] });
    await uploadFile(file);
    await screen.findByTestId("settings.restore.error_state");
    expect(validateRestoreFileMock).toHaveBeenCalledTimes(1);

    // Choosing the SAME file again must fire onChange again, so validation
    // runs a second time and the preview appears.
    await uploadFile(file);

    await screen.findByTestId("settings.restore.preview");
    expect(validateRestoreFileMock).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByTestId("settings.restore.error_state"),
    ).not.toBeInTheDocument();
  });

  it("rejects an empty file with a Spanish error and never restores", async () => {
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(rawFile("   "));

    const errorState = await screen.findByTestId(
      "settings.restore.error_state",
    );
    expect(errorState).toHaveTextContent(
      "El archivo está vacío o no es un JSON válido.",
    );
    // The invalid file never reaches the backend.
    expect(validateRestoreFileMock).not.toHaveBeenCalled();
    expect(restoreSectionMock).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("settings.restore.preview"),
    ).not.toBeInTheDocument();
  });

  it("rejects a non-JSON file with a Spanish error and never restores", async () => {
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(rawFile("esto no es json"));

    const errorState = await screen.findByTestId(
      "settings.restore.error_state",
    );
    expect(errorState).toHaveTextContent(
      "El archivo está vacío o no es un JSON válido.",
    );
    expect(validateRestoreFileMock).not.toHaveBeenCalled();
    expect(restoreSectionMock).not.toHaveBeenCalled();
  });

  it("exports a local backup whose JSON carries formatVersion", async () => {
    getLocalBackupManifestMock.mockResolvedValue({
      fileName: "copia-local-hr-2026-09-22-1530.json",
      generatedAt: GENERATED_AT,
      sections: ["customers", "businessSettings"],
      totalSections: 2n,
      maxPageSize: 200n,
    });
    getBackupSectionMock.mockImplementation(async (index: bigint) => {
      const key = index === 0n ? "customers" : "businessSettings";
      const value = index === 0n ? [] : { name: "Taller" };
      return {
        key,
        index,
        json: JSON.stringify(value),
        offset: 0n,
        limit: 200n,
        total: 0n,
        done: true,
      };
    });
    const download = stubDownload();

    try {
      renderWithProviders(<LocalBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.local_backup.download_button"),
      );
      await waitFor(() =>
        expect(download.createObjectURL).toHaveBeenCalledTimes(1),
      );

      const parsed = JSON.parse(
        await readBlobText(download.createObjectURL.mock.calls[0][0]),
      ) as Record<string, unknown>;
      // The exported file declares its format version so it can be restored
      // without a validation error.
      expect(parsed.formatVersion).toBe(1);
      expect(parsed.generatedAt).toBe(Number(GENERATED_AT));
    } finally {
      download.restore();
    }
  });
});
