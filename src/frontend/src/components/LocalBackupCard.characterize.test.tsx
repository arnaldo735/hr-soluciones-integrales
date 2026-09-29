import { LocalBackupCard } from "@/components/LocalBackupCard";
import { renderWithProviders } from "@/test/helpers";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization: the observable outcome of "Descargar copia local".
 *
 * The accepted change replaces the single `downloadLocalBackup` query with a
 * frontend that assembles the JSON from several smaller backend calls. The
 * observable outcome must not change: clicking the button saves one JSON file
 * on the user's device whose bytes are the complete company data, under the
 * backend's own file name, with the JSON MIME type, and the card reports
 * success or a Spanish error with a retry.
 *
 * These tests deliberately assert only that outcome. They never assert how many
 * backend calls are made or which method supplies the JSON, so the single-call
 * implementation detail is not frozen as a baseline.
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

/** The complete company payload the requirement promises in the file. */
const COMPANY_SECTIONS: Record<string, unknown> = {
  customers: [{ id: 1, name: "Juan Pérez" }],
  motorcycles: [{ id: 1, plate: "ABC-123" }],
  orders: [{ id: 1, status: "received" }],
  parts: [{ id: 1, sku: "REP-0001" }],
  suppliers: [{ id: 1, name: "Distribuidora Central" }],
  purchases: [],
  payments: [],
  invoices: [],
  quotes: [],
  services: [],
  technicians: [{ id: 1, name: "Técnico Uno" }],
  appointments: [],
  expenses: [],
  posSales: [],
  receivablePayments: [],
  supplierOrders: [],
  userProfiles: [{ name: "Dueño" }],
  businessSettings: { name: "HR SOLUCIONES INTEGRALES" },
  company: { legalName: "HR SOLUCIONES INTEGRALES S.A.S." },
};

const SECTION_KEYS = Object.keys(COMPANY_SECTIONS);

function manifest(overrides: Record<string, unknown> = {}) {
  return {
    fileName: FILE_NAME,
    generatedAt: GENERATED_AT,
    sections: SECTION_KEYS,
    totalSections: BigInt(SECTION_KEYS.length),
    maxPageSize: 200n,
    ...overrides,
  };
}

/** Wires the two backend methods to the complete company payload. */
function mockCompanyBackup() {
  getLocalBackupManifestMock.mockResolvedValue(manifest());
  getBackupSectionMock.mockImplementation(async (index: bigint) => {
    const key = SECTION_KEYS[Number(index)];
    return {
      key,
      index,
      json: JSON.stringify(COMPANY_SECTIONS[key]),
      offset: 0n,
      limit: 200n,
      total: 0n,
      done: true,
    };
  });
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
 * blob URL and the anchor click are stubbed. Returns the captured blob and the
 * anchor's `download` attribute so a test can assert the saved file.
 */
function stubDownload() {
  const createObjectURL = vi.fn((_blob: Blob) => "blob:copia-local");
  const revokeObjectURL = vi.fn();
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  let downloadedName = "";
  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      downloadedName = this.download;
    });

  return {
    createObjectURL,
    revokeObjectURL,
    clickSpy,
    getDownloadedName: () => downloadedName,
    restore() {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    },
  };
}

describe("LocalBackupCard (characterization)", () => {
  beforeEach(() => {
    getLocalBackupManifestMock.mockReset();
    getBackupSectionMock.mockReset();
  });

  it("saves one JSON file whose bytes are the complete company data", async () => {
    mockCompanyBackup();
    const download = stubDownload();

    try {
      renderWithProviders(<LocalBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.local_backup.download_button"),
      );

      await waitFor(() =>
        expect(download.createObjectURL).toHaveBeenCalledTimes(1),
      );

      // Exactly one file is saved, typed as JSON.
      const blob = download.createObjectURL.mock.calls[0][0];
      expect(blob.type).toBe("application/json");

      // The bytes parse as JSON and carry the company collections the
      // requirement names, not an opaque or truncated string.
      const parsed = JSON.parse(await readBlobText(blob)) as Record<
        string,
        unknown
      >;
      expect(parsed).toBeTypeOf("object");
      for (const key of [
        "customers",
        "motorcycles",
        "orders",
        "parts",
        "suppliers",
        "technicians",
        "userProfiles",
      ]) {
        expect(Array.isArray(parsed[key])).toBe(true);
      }
      expect(parsed.businessSettings).toBeTypeOf("object");
      expect(parsed.company).toBeTypeOf("object");
      expect(
        (parsed.customers as Array<{ name?: string }>).some(
          (customer) => customer.name === "Juan Pérez",
        ),
      ).toBe(true);
    } finally {
      download.restore();
    }
  });

  it("saves the file under the backend file name with the JSON extension", async () => {
    mockCompanyBackup();
    const download = stubDownload();

    try {
      renderWithProviders(<LocalBackupCard />);
      await userEvent.click(
        await screen.findByTestId("settings.local_backup.download_button"),
      );

      await waitFor(() => expect(download.clickSpy).toHaveBeenCalledTimes(1));
      expect(download.getDownloadedName()).toBe(
        "copia-local-hr-2026-09-22-1530.json",
      );
      expect(download.getDownloadedName()).toMatch(
        /\d{4}-\d{2}-\d{2}-\d{4}\.json$/,
      );
    } finally {
      download.restore();
    }
  });

  it("confirms the saved file with its name and generation time", async () => {
    mockCompanyBackup();
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

  it("shows a Spanish error and a retry when the copy cannot be produced", async () => {
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

  it("retries the download from the error state", async () => {
    getLocalBackupManifestMock.mockRejectedValueOnce(new Error("falló"));
    getLocalBackupManifestMock.mockResolvedValueOnce(manifest());
    getBackupSectionMock.mockImplementation(async (index: bigint) => ({
      key: SECTION_KEYS[Number(index)],
      index,
      json: JSON.stringify(COMPANY_SECTIONS[SECTION_KEYS[Number(index)]]),
      offset: 0n,
      limit: 200n,
      total: 0n,
      done: true,
    }));
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

  it("disables the button and shows a loading state while the copy is generated", async () => {
    // A promise that never settles keeps the operation pending.
    getLocalBackupManifestMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LocalBackupCard />);

    await userEvent.click(
      await screen.findByTestId("settings.local_backup.download_button"),
    );

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
});
