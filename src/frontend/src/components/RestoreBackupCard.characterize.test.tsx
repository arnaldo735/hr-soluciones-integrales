import { RestoreBackupCard } from "@/components/RestoreBackupCard";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization: the observable outcome of "Restaurar copia local".
 *
 * The accepted requirement lets the administrator pick a local JSON backup,
 * see a preview of its sections, choose which sections to restore, and restore
 * only those. These tests pin the behavior that must survive the change:
 *
 *  - the card offers the upload action and explains that restoration replaces
 *    the current data of the selected sections;
 *  - a valid file produces a preview listing each section with its record
 *    count, all selected by default;
 *  - the confirmation checkbox and at least one selected section are required
 *    before the destructive action is enabled;
 *  - restoring calls `restoreSection` once per selected section, in the file's
 *    order, and reports the per-section result and totals;
 *  - an invalid file shows a Spanish error with a retry and never calls the
 *    backend to restore.
 *
 * They assert the user-visible contract, not the internal step machine, so the
 * implementation can change without rewriting the baseline.
 */

const validateRestoreFileMock = vi.fn();
const restoreSectionMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      validateRestoreFile: validateRestoreFileMock,
      restoreSection: restoreSectionMock,
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

describe("RestoreBackupCard (characterization)", () => {
  beforeEach(() => {
    validateRestoreFileMock.mockReset();
    restoreSectionMock.mockReset();
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

  it("offers the upload action and warns that restoration replaces data", async () => {
    renderWithProviders(<RestoreBackupCard />);

    expect(
      await screen.findByTestId("settings.restore.card"),
    ).toBeInTheDocument();
    expect(screen.getByText("Restaurar copia local")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings.restore.upload_button"),
    ).toHaveTextContent("Restaurar copia");
    // No preview or destructive action before a file is chosen.
    expect(
      screen.queryByTestId("settings.restore.preview"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings.restore.confirm_button"),
    ).not.toBeInTheDocument();
  });

  it("shows a preview of the file's sections with their record counts", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "ok",
      ok: preview(),
    });
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ customers: [], motorcycles: [], orders: [] }));

    const previewPanel = await screen.findByTestId("settings.restore.preview");
    expect(previewPanel).toBeInTheDocument();
    // The file name and the section count are shown.
    expect(
      screen.getByText("copia-local-hr-2026-09-22-1530.json"),
    ).toBeInTheDocument();
    expect(previewPanel).toHaveTextContent("3 secciones");

    // Each section is listed with its Spanish label and record count.
    const list = screen.getByTestId("settings.restore.section_list");
    expect(within(list).getByText("Clientes")).toBeInTheDocument();
    expect(within(list).getByText("Motos")).toBeInTheDocument();
    expect(within(list).getByText("Órdenes de taller")).toBeInTheDocument();
    expect(within(list).getByText("3 registros")).toBeInTheDocument();
    expect(within(list).getByText("2 registros")).toBeInTheDocument();
    expect(within(list).getByText("5 registros")).toBeInTheDocument();
  });

  it("selects every section by default and lets the user clear and reselect", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "ok",
      ok: preview(),
    });
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ customers: [], motorcycles: [], orders: [] }));
    await screen.findByTestId("settings.restore.preview");

    // All three checkboxes start checked.
    for (const position of [1, 2, 3]) {
      expect(
        screen.getByTestId(`settings.restore.section_checkbox.${position}`),
      ).toBeChecked();
    }

    await userEvent.click(
      screen.getByTestId("settings.restore.clear_all_button"),
    );
    for (const position of [1, 2, 3]) {
      expect(
        screen.getByTestId(`settings.restore.section_checkbox.${position}`),
      ).not.toBeChecked();
    }

    await userEvent.click(
      screen.getByTestId("settings.restore.select_all_button"),
    );
    for (const position of [1, 2, 3]) {
      expect(
        screen.getByTestId(`settings.restore.section_checkbox.${position}`),
      ).toBeChecked();
    }
  });

  it("requires the confirmation checkbox and a selected section before restoring", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "ok",
      ok: preview(),
    });
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ customers: [], motorcycles: [], orders: [] }));
    await screen.findByTestId("settings.restore.preview");

    const confirmButton = screen.getByTestId("settings.restore.confirm_button");
    // Sections are selected but the confirmation is not yet given.
    expect(confirmButton).toBeDisabled();

    await userEvent.click(
      screen.getByTestId("settings.restore.confirm_checkbox"),
    );
    expect(confirmButton).toBeEnabled();

    // Clearing every section disables the action again even when confirmed.
    await userEvent.click(
      screen.getByTestId("settings.restore.clear_all_button"),
    );
    expect(confirmButton).toBeDisabled();
    expect(restoreSectionMock).not.toHaveBeenCalled();
  });

  it("restores only the selected sections, one call per section in file order", async () => {
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
    // The selected sections are restored in the file's order, by index.
    expect(restoreSectionMock.mock.calls.map((call) => call[2])).toEqual([
      0n,
      2n,
    ]);
    // The session token is forwarded to the backend.
    expect(restoreSectionMock.mock.calls[0][0]).toBe("session-token");

    // The summary reports the restored sections and the total records.
    const success = await screen.findByTestId("settings.restore.success_state");
    expect(success).toHaveTextContent("Restauración completada");
    expect(success).toHaveTextContent("8 registros restaurados en 2 secciones");
    expect(success).toHaveTextContent("1 omitidas");
  });

  it("reports a section that the backend could not restore", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "ok",
      ok: preview(),
    });
    restoreSectionMock.mockImplementation(
      async (_token, _json, index: bigint) => {
        if (index === 1n) {
          return {
            __kind__: "ok",
            ok: {
              key: "motorcycles",
              index,
              status: { __kind__: "error", error: "Contenido inválido" },
              restored: 0n,
            },
          };
        }
        return restored(index, SECTIONS[Number(index)].count);
      },
    );
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ customers: [], motorcycles: [], orders: [] }));
    await screen.findByTestId("settings.restore.preview");
    await userEvent.click(
      screen.getByTestId("settings.restore.confirm_checkbox"),
    );
    await userEvent.click(
      screen.getByTestId("settings.restore.confirm_button"),
    );

    const success = await screen.findByTestId("settings.restore.success_state");
    expect(success).toHaveTextContent("Restauración completada con errores");
    expect(success).toHaveTextContent("1 con error");
    // The failing section's message is shown in the result list.
    expect(screen.getByText("Contenido inválido")).toBeInTheDocument();
  });

  it("shows a Spanish error and a retry when the file is rejected", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "noKnownSections", noKnownSections: null },
    });
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({ desconocido: [] }));

    const errorState = await screen.findByTestId(
      "settings.restore.error_state",
    );
    expect(errorState).toHaveTextContent(
      "El archivo no contiene ninguna sección reconocida de la copia.",
    );
    expect(
      screen.getByTestId("settings.restore.retry_button"),
    ).toBeInTheDocument();
    // A rejected file never reaches the destructive restore call.
    expect(restoreSectionMock).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("settings.restore.preview"),
    ).not.toBeInTheDocument();
  });

  it("returns to the upload state when the user chooses another file", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "err",
      err: { __kind: "invalidFormat", invalidFormat: "raíz no es un objeto" },
    });
    renderWithProviders(<RestoreBackupCard />);

    await uploadFile(jsonFile({}));
    await screen.findByTestId("settings.restore.error_state");

    await userEvent.click(screen.getByTestId("settings.restore.retry_button"));

    expect(
      screen.queryByTestId("settings.restore.error_state"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("settings.restore.upload_button"),
    ).toBeInTheDocument();
  });
});
