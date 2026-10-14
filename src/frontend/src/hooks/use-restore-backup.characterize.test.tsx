import type {
  RestorePreviewOutcome,
  RestoreSectionInfo,
  RestoreSectionOutcome,
} from "@/backend";
import {
  describeRestoreError,
  readRestoreFile,
  restoreSectionLabel,
  useRestoreBackup,
  useValidateRestoreFile,
} from "@/hooks/use-restore-backup";
import { createTestQueryClient } from "@/test/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization: the restore consumer contract the memory work must keep.
 *
 * The accepted change makes restoration work on large backups without
 * overflowing the backend's memory. Whatever the backend does internally, the
 * frontend contract that must survive is:
 *
 *  - `validateRestoreFile` is called once with the session token and the file
 *    text, and its preview (generation date, format version, sections with
 *    their counts) is returned unchanged;
 *  - a rejected file surfaces the backend's typed error as a Spanish message;
 *  - `restoreSection` is called once per SELECTED section, in the file's order,
 *    with the session token first, and the per-section outcome is accumulated
 *    into restored / skipped / error totals;
 *  - the pure helpers keep mapping section keys and error variants to Spanish.
 *
 * These tests pin the observable contract, not the backend's parsing strategy,
 * so the memory fix can change the implementation without rewriting them. The
 * actor is a typed local mock; no network is involved.
 */

const validateRestoreFileMock = vi.fn();
const restoreSectionMock = vi.fn();

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: {
      validateRestoreFile: validateRestoreFileMock,
      restoreSection: restoreSectionMock,
    },
    isFetching: false,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ token: "session-token" }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const GENERATED_AT = 1_700_000_000_000_000_000n;

/** The sections the backend reports for a valid file, in file order. */
const SECTIONS: RestoreSectionInfo[] = [
  { key: "customers", index: 0n, count: 3n },
  { key: "motorcycles", index: 1n, count: 2n },
  { key: "orders", index: 2n, count: 5n },
];

function preview(): RestorePreviewOutcome {
  return {
    __kind__: "ok",
    ok: {
      generatedAt: GENERATED_AT,
      formatVersion: 1n,
      sections: SECTIONS.map((section) => ({ ...section })),
      totalSections: BigInt(SECTIONS.length),
    },
  };
}

/** A successful `restoreSection` outcome for the given section index. */
function restored(index: bigint, restoredCount: bigint): RestoreSectionOutcome {
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

/** A `File` whose bytes are the given raw text. */
function rawFile(text: string, name = "copia-local.json"): File {
  const file = new File([text], name, { type: "application/json" });
  Object.defineProperty(file, "text", {
    value: () => Promise.resolve(text),
  });
  return file;
}

describe("use-restore-backup consumer contract (characterization)", () => {
  beforeEach(() => {
    validateRestoreFileMock.mockReset();
    restoreSectionMock.mockReset();
  });

  it("validates the file with the token and returns the preview unchanged", async () => {
    validateRestoreFileMock.mockResolvedValue(preview());

    const { result } = renderHook(() => useValidateRestoreFile(), { wrapper });
    const outcome = await result.current.mutateAsync('{"customers":[]}');

    // The token is the first argument and the file text the second.
    expect(validateRestoreFileMock).toHaveBeenCalledWith(
      "session-token",
      '{"customers":[]}',
    );
    // The preview is passed through with its sections and counts intact.
    expect(outcome.sections).toEqual(SECTIONS);
    expect(outcome.totalSections).toBe(3n);
    expect(outcome.generatedAt).toBe(GENERATED_AT);
    expect(outcome.formatVersion).toBe(1n);
  });

  it("surfaces a rejected file as a Spanish message", async () => {
    validateRestoreFileMock.mockResolvedValue({
      __kind__: "err",
      err: { __kind__: "noKnownSections", noKnownSections: null },
    });

    const { result } = renderHook(() => useValidateRestoreFile(), { wrapper });

    await expect(result.current.mutateAsync("{}")).rejects.toThrow(
      "El archivo no contiene ninguna sección reconocida de la copia.",
    );
  });

  it("restores one call per selected section, in file order, with the token first", async () => {
    restoreSectionMock.mockImplementation(
      async (_token: string | null, _json: string, index: bigint) =>
        restored(index, SECTIONS[Number(index)].count),
    );

    const { result } = renderHook(() => useRestoreBackup(), { wrapper });
    const summary = await result.current.mutateAsync({
      json: '{"customers":[],"motorcycles":[],"orders":[]}',
      sections: SECTIONS,
      // The middle section is deliberately not selected.
      selectedKeys: ["customers", "orders"],
    });

    // Exactly the selected sections were applied, in the file's order.
    expect(restoreSectionMock).toHaveBeenCalledTimes(2);
    expect(restoreSectionMock.mock.calls.map((call) => call[2])).toEqual([
      0n,
      2n,
    ]);
    for (const call of restoreSectionMock.mock.calls) {
      expect(call[0]).toBe("session-token");
    }

    // The unselected section is reported as skipped, not called.
    const skipped = summary.sections.find(
      (section) => section.key === "motorcycles",
    );
    expect(skipped).toMatchObject({ status: "skipped", restored: 0n });
    expect(summary.restoredSections).toBe(2n);
    expect(summary.skippedSections).toBe(1n);
    expect(summary.failedSections).toBe(0n);
    // 3 customers + 5 orders.
    expect(summary.totalRecords).toBe(8n);
  });

  it("accumulates a per-section error without aborting the remaining sections", async () => {
    restoreSectionMock.mockImplementation(
      async (_token: string | null, _json: string, index: bigint) => {
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

    const { result } = renderHook(() => useRestoreBackup(), { wrapper });
    const summary = await result.current.mutateAsync({
      json: '{"customers":[],"motorcycles":[],"orders":[]}',
      sections: SECTIONS,
      selectedKeys: ["customers", "motorcycles", "orders"],
    });

    // Every selected section was attempted, including the one after the error.
    expect(restoreSectionMock).toHaveBeenCalledTimes(3);
    expect(summary.restoredSections).toBe(2n);
    expect(summary.failedSections).toBe(1n);
    const failed = summary.sections.find(
      (section) => section.key === "motorcycles",
    );
    expect(failed).toMatchObject({
      status: "error",
      message: "Contenido inválido",
    });
  });

  it("maps a typed backend error to a Spanish message", () => {
    expect(
      describeRestoreError({
        __kind__: "incompatibleVersion",
        incompatibleVersion: 2n,
      }),
    ).toBe("La versión del archivo (2) no es compatible con esta aplicación.");
    expect(
      describeRestoreError({
        __kind__: "unknownSection",
        unknownSection: "desconocida",
      }),
    ).toBe("La sección «desconocida» no existe en el archivo.");
    expect(
      describeRestoreError({
        __kind__: "notAuthorized",
        notAuthorized: null,
      }),
    ).toBe("Solo el administrador puede restaurar una copia.");
  });

  it("labels known sections in Spanish and falls back to the key", () => {
    expect(restoreSectionLabel("customers")).toBe("Clientes");
    expect(restoreSectionLabel("orders")).toBe("Órdenes de taller");
    expect(restoreSectionLabel("seccionDesconocida")).toBe(
      "seccionDesconocida",
    );
  });

  it("rejects an empty or non-JSON file before reaching the backend", async () => {
    await expect(readRestoreFile(rawFile("   "))).rejects.toThrow(
      "El archivo está vacío o no es un JSON válido.",
    );
    await expect(readRestoreFile(rawFile("esto no es json"))).rejects.toThrow(
      "El archivo está vacío o no es un JSON válido.",
    );
    await expect(readRestoreFile(rawFile('{"customers":[]}'))).resolves.toBe(
      '{"customers":[]}',
    );
  });
});
