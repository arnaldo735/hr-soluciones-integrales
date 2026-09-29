import { LocalBackupCard } from "@/components/LocalBackupCard";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Accepted behavior: the administrator's local backup download.
 *
 * The card offers "Descargar copia local" next to the Google Drive backup. On
 * click it asks the backend for the manifest and then for each section in
 * bounded pages, assembles the root JSON object, and downloads it under the
 * backend's own file name (which carries the generation date and time). It
 * shows a loading state with the button disabled while the copy is being
 * generated, and confirms success or shows a Spanish error message.
 *
 * The accepted change replaces the single `downloadLocalBackup` call with the
 * chunked `getLocalBackupManifest` + `getBackupSection` pair. These tests mock
 * those two methods, so they pin the frontend's assembly contract: the root
 * keys and `generatedAt` come from the manifest, collection sections are
 * concatenated page by page, and single-record sections are taken whole.
 */

const getLocalBackupManifestMock = vi.fn();
const getBackupSectionMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      getLocalBackupManifest: getLocalBackupManifestMock,
      getBackupSection: getBackupSectionMock,
    },
    isFetching: false,
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const GENERATED_AT = 1_700_000_000_000_000_000n;
const FILE_NAME = "copia-local-hr-2026-09-22-1530.json";

/** The root keys the manifest advertises, in the order the backend emits them. */
const SECTION_KEYS = [
  "customers",
  "orders",
  "parts",
  "businessSettings",
] as const;

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    fileName: FILE_NAME,
    generatedAt: GENERATED_AT,
    sections: [...SECTION_KEYS],
    totalSections: BigInt(SECTION_KEYS.length),
    maxPageSize: 200n,
    ...overrides,
  };
}

/** One `BackupSectionChunk` as the generated bindings shape it. */
function chunk(
  index: number,
  json: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    key: SECTION_KEYS[index],
    index: BigInt(index),
    json,
    offset: 0n,
    limit: 200n,
    total: 0n,
    done: true,
    ...overrides,
  };
}

/**
 * Wires the two backend methods to a fixed set of section values. Collection
 * values are serialized as JSON arrays and single-record values as objects.
 */
function mockSections(values: Record<string, unknown>) {
  getLocalBackupManifestMock.mockResolvedValue(manifest());
  getBackupSectionMock.mockImplementation(
    async (index: bigint, _offset: bigint, _limit: bigint) => {
      const key = SECTION_KEYS[Number(index)];
      return chunk(Number(index), JSON.stringify(values[key]));
    },
  );
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
    getLocalBackupManifestMock.mockReset();
    getBackupSectionMock.mockReset();
  });

  it("offers the local download action", async () => {
    renderWithProviders(<LocalBackupCard />);

    expect(
      await screen.findByTestId("settings.local_backup.download_button"),
    ).toHaveTextContent("Descargar copia local");
    expect(screen.getByText("Copia de seguridad local")).toBeInTheDocument();
  });

  it("downloads the assembled JSON under the backend file name", async () => {
    mockSections({
      customers: [{ id: 1, name: "Ada Lovelace" }],
      orders: [],
      parts: [],
      businessSettings: { name: "HR SOLUCIONES INTEGRALES" },
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

      // The downloaded blob is the assembled JSON, typed as JSON. jsdom's Blob
      // has no `text()`, so the bytes are read through FileReader.
      const blob = download.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe("application/json");
      const parsed = JSON.parse(await readBlobText(blob)) as Record<
        string,
        unknown
      >;
      expect(parsed.customers).toEqual([{ id: 1, name: "Ada Lovelace" }]);
      expect(parsed.businessSettings).toEqual({
        name: "HR SOLUCIONES INTEGRALES",
      });

      // The anchor is clicked once and the object URL is released.
      expect(download.clickSpy).toHaveBeenCalledTimes(1);
      expect(download.revokeObjectURL).toHaveBeenCalledWith("blob:copia-local");
    } finally {
      download.restore();
    }
  });

  it("keeps the manifest's root keys and generatedAt in the downloaded JSON", async () => {
    mockSections({
      customers: [],
      orders: [],
      parts: [],
      businessSettings: { name: "Taller" },
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
      // The root object carries exactly the manifest's sections plus the
      // generation timestamp, so the file keeps the shape `serializeBackup`
      // produced.
      expect(Object.keys(parsed).sort()).toEqual(
        [...SECTION_KEYS, "generatedAt"].sort(),
      );
      expect(parsed.generatedAt).toBe(Number(GENERATED_AT));
    } finally {
      download.restore();
    }
  });

  it("concatenates a paginated collection section page by page", async () => {
    getLocalBackupManifestMock.mockResolvedValue(manifest());
    // The customers section arrives in two pages; the rest are single pages.
    getBackupSectionMock.mockImplementation(
      async (index: bigint, offset: bigint, _limit: bigint) => {
        const key = SECTION_KEYS[Number(index)];
        if (key === "customers") {
          if (offset === 0n) {
            return chunk(
              Number(index),
              JSON.stringify([{ id: 1 }, { id: 2 }]),
              {
                offset: 0n,
                limit: 2n,
                total: 3n,
                done: false,
              },
            );
          }
          return chunk(Number(index), JSON.stringify([{ id: 3 }]), {
            offset: 2n,
            limit: 2n,
            total: 3n,
            done: true,
          });
        }
        return chunk(Number(index), JSON.stringify([]));
      },
    );
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
      // Both pages are concatenated into one array, in order.
      expect(parsed.customers).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);

      // The second page was requested at the offset the first page reported.
      const customerCalls = getBackupSectionMock.mock.calls.filter(
        (call) => call[0] === 0n,
      );
      expect(customerCalls).toHaveLength(2);
      expect(customerCalls[1][1]).toBe(2n);
    } finally {
      download.restore();
    }
  });

  it("uses the backend file name, which carries the generation date and time", async () => {
    mockSections({
      customers: [],
      orders: [],
      parts: [],
      businessSettings: {},
    });
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
      // The name comes from the manifest and includes the date and time.
      expect(downloadedName).toBe(FILE_NAME);
      expect(downloadedName).toMatch(/\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    } finally {
      download.restore();
    }
  });

  it("shows a loading state and disables the button while the copy is generated", async () => {
    // A promise that never settles keeps the mutation pending.
    getLocalBackupManifestMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LocalBackupCard />);

    const button = await screen.findByTestId(
      "settings.local_backup.download_button",
    );
    await userEvent.click(button);

    await waitFor(() =>
      expect(getLocalBackupManifestMock).toHaveBeenCalledTimes(1),
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
    mockSections({
      customers: [],
      orders: [],
      parts: [],
      businessSettings: {},
    });
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
      expect(screen.getByText(FILE_NAME)).toBeInTheDocument();
    } finally {
      download.restore();
    }
  });

  it("shows a Spanish error message and a retry when the download fails", async () => {
    getLocalBackupManifestMock.mockRejectedValue(
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
    getLocalBackupManifestMock.mockRejectedValue({});
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

  it("retries the download from the error state", async () => {
    getLocalBackupManifestMock.mockRejectedValueOnce(new Error("falló"));
    getLocalBackupManifestMock.mockResolvedValueOnce(manifest());
    getBackupSectionMock.mockImplementation(async (index: bigint) =>
      chunk(Number(index), JSON.stringify([])),
    );
    const download = stubDownload();

    try {
      renderWithProviders(<LocalBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.local_backup.download_button"),
      );
      await screen.findByTestId("settings.local_backup.error_state");

      await userEvent.click(
        screen.getByTestId("settings.local_backup.retry_button"),
      );

      expect(
        await screen.findByTestId("settings.local_backup.success_state"),
      ).toBeInTheDocument();
      expect(download.createObjectURL).toHaveBeenCalledTimes(1);
    } finally {
      download.restore();
    }
  });
});
