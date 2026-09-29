import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  Customer,
  CustomerInput,
  Id,
  ImportPreviewResult,
  ImportPreviewRow,
  Supplier,
  SupplierInput,
} from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Which contact directory an import targets. */
export type ContactImportKind = "customer" | "supplier";

/** Column order shared by the customer export, template and import. */
export const CUSTOMER_CSV_HEADERS = [
  "nombre",
  "telefono",
  "documento",
  "direccion",
  "correo",
  "motos",
];

/** Column order shared by the supplier export, template and import. */
export const SUPPLIER_CSV_HEADERS = [
  "nombre",
  "documento",
  "telefono",
  "correo",
  "direccion",
];

/** A parsed contact row normalized for the preview and the backend call. */
export interface ContactImportRow {
  /** 1-based position in the source file, including the header row. */
  rowNumber: number;
  /** Stable key used for list rendering and result matching. */
  key: string;
  /** Contact display name. */
  name: string;
  /** Phone number (customers) or contact phone (suppliers). */
  phone: string;
  /** Documento / NIT. */
  document: string;
  /** Correo electrónico. */
  email: string;
  /** Dirección. */
  address: string;
  /** Persona de contacto (suppliers only). */
  contactName: string;
  /** Motos asociadas, as free text (customers only). */
  motorcycles: string;
  /** Existing record matched by documento+nombre / teléfono+nombre. */
  matchedId: Id | null;
  /** Spanish reason shown when the row cannot be imported. */
  error?: string;
}

/** Normalizes a value for case- and accent-insensitive matching. */
function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Builds the match key: documento+nombre for suppliers, teléfono+nombre for customers. */
function matchKey(kind: ContactImportKind, row: ContactImportRow): string {
  const name = normalizeKey(row.name);
  if (kind === "supplier") return `${normalizeKey(row.document)}|${name}`;
  return `${normalizeKey(row.phone)}|${name}`;
}

/** Narrows the contact union to a supplier record. */
function isSupplierRecord(contact: Customer | Supplier): contact is Supplier {
  return "taxId" in contact;
}

/**
 * Parses raw spreadsheet rows into normalized contact rows, matching each one
 * against the existing directory so the preview can flag updates versus
 * creations and reject rows missing their required fields.
 */
export function buildContactImportRows(
  kind: ContactImportKind,
  rawRows: Array<Record<string, string>>,
  existing: Array<Customer | Supplier>,
): ContactImportRow[] {
  const byKey = new Map<string, Id>();
  for (const contact of existing) {
    const supplier = isSupplierRecord(contact);
    const row: ContactImportRow = {
      rowNumber: 0,
      key: "",
      name: contact.name,
      phone: contact.phone,
      document: supplier ? (contact.taxId ?? "") : (contact.document ?? ""),
      email: contact.email ?? "",
      address: contact.address ?? "",
      contactName: supplier ? (contact.contactName ?? "") : "",
      motorcycles: "",
      matchedId: null,
    };
    byKey.set(matchKey(kind, row), contact.id);
  }

  return rawRows.map((raw, index) => {
    const row: ContactImportRow = {
      rowNumber: index + 1,
      key: `contact-row-${index + 1}`,
      name: (raw.nombre ?? "").trim(),
      phone: (raw.telefono ?? "").trim(),
      document: (raw.documento ?? "").trim(),
      email: (raw.correo ?? "").trim(),
      address: (raw.direccion ?? "").trim(),
      contactName: (raw.contacto ?? "").trim(),
      motorcycles: (raw.motos ?? "").trim(),
      matchedId: null,
    };

    if (row.name === "") {
      row.error = "Falta el nombre";
      return row;
    }
    if (kind === "customer" && row.phone === "") {
      row.error = "Falta el teléfono";
      return row;
    }
    if (kind === "supplier" && row.phone === "") {
      row.error = "Falta el teléfono";
      return row;
    }
    if (kind === "supplier" && row.document === "") {
      row.error = "Falta el documento o NIT";
      return row;
    }

    row.matchedId = byKey.get(matchKey(kind, row)) ?? null;
    return row;
  });
}

/** Maps a normalized contact row onto the shared preview shape. */
export function toPreviewRows(rows: ContactImportRow[]): ImportPreviewRow[] {
  return rows.map((row) => ({
    rowNumber: row.rowNumber,
    key: row.key,
    status: row.error ? "invalid" : "valid",
    error: row.error,
    label: row.name || "Sin nombre",
    detail: row.document || row.phone || "—",
  }));
}

function toCustomerInput(row: ContactImportRow): CustomerInput {
  return {
    name: row.name,
    phone: row.phone,
    email: row.email === "" ? undefined : row.email,
    document: row.document === "" ? undefined : row.document,
    address: row.address === "" ? undefined : row.address,
  };
}

function toSupplierInput(row: ContactImportRow): SupplierInput {
  return {
    name: row.name,
    phone: row.phone,
    contactName: row.contactName === "" ? undefined : row.contactName,
    email: row.email === "" ? undefined : row.email,
    taxId: row.document === "" ? undefined : row.document,
    address: row.address === "" ? undefined : row.address,
  };
}

/**
 * Runs a contact import: rows matched to an existing record are updated in one
 * bulk call, the rest are created in another, and both results are merged into
 * a single per-row summary. Invalid rows never reach the backend.
 */
export function useContactImport(kind: ContactImportKind) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      rows: ContactImportRow[],
    ): Promise<ImportPreviewResult> => {
      if (!actor) throw new Error("Backend no disponible");

      const importable = rows.filter((row) => !row.error);
      const updates = importable.filter((row) => row.matchedId !== null);
      const creations = importable.filter((row) => row.matchedId === null);

      let created = 0n;
      let updated = 0n;
      let failed = 0n;
      const outcomes = new Map<
        string,
        { status: "valid" | "invalid"; error?: string }
      >();

      if (kind === "customer") {
        if (creations.length > 0) {
          const result = await actor.bulkCreateCustomers(
            token,
            creations.map(toCustomerInput),
          );
          created += result.created;
          failed += result.failed;
          creations.forEach((row, index) => {
            const entry = result.rows.find(
              (candidate) => candidate.index === BigInt(index),
            );
            outcomes.set(row.key, {
              status: entry?.ok === false ? "invalid" : "valid",
              error: entry?.error ?? undefined,
            });
          });
        }
        if (updates.length > 0) {
          const result = await actor.bulkUpdateCustomers(
            token,
            updates.map(
              (row) => [row.matchedId as Id, toCustomerInput(row)] as const,
            ),
          );
          updated += result.updated;
          failed += result.failed;
          updates.forEach((row, index) => {
            const entry = result.rows.find(
              (candidate) => candidate.index === BigInt(index),
            );
            outcomes.set(row.key, {
              status: entry?.ok === false ? "invalid" : "valid",
              error: entry?.error ?? undefined,
            });
          });
        }
      } else {
        for (const row of creations) {
          try {
            await actor.createSupplier(token, toSupplierInput(row));
            created += 1n;
            outcomes.set(row.key, { status: "valid" });
          } catch (error) {
            failed += 1n;
            outcomes.set(row.key, {
              status: "invalid",
              error:
                error instanceof Error
                  ? error.message
                  : "No se pudo crear el proveedor",
            });
          }
        }
        for (const row of updates) {
          try {
            await actor.updateSupplier(
              token,
              row.matchedId as Id,
              toSupplierInput(row),
            );
            updated += 1n;
            outcomes.set(row.key, { status: "valid" });
          } catch (error) {
            failed += 1n;
            outcomes.set(row.key, {
              status: "invalid",
              error:
                error instanceof Error
                  ? error.message
                  : "No se pudo actualizar el proveedor",
            });
          }
        }
      }

      for (const row of rows) {
        if (row.error) {
          failed += 1n;
          outcomes.set(row.key, { status: "invalid", error: row.error });
        }
      }

      return {
        created,
        updated,
        failed,
        rows: rows.map((row) => ({
          key: row.key,
          status: outcomes.get(row.key)?.status ?? "valid",
          error: outcomes.get(row.key)?.error,
        })),
      };
    },
    onSuccess: () => {
      if (kind === "customer") {
        void queryClient.invalidateQueries({ queryKey: ["customers"] });
        void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
        void queryClient.invalidateQueries({ queryKey: ["customer-detail"] });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
        void queryClient.invalidateQueries({ queryKey: ["payables"] });
      }
    },
  });
}
