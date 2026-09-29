import type {
  RestoreError,
  RestorePreview,
  RestorePreviewOutcome,
  RestoreSectionInfo,
  RestoreSectionOutcome,
  RestoreSectionResult,
} from "@/backend";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useMutation } from "@tanstack/react-query";

/** Nombre legible en español de cada sección de la copia local. */
export const RESTORE_SECTION_LABELS: Record<string, string> = {
  parts: "Repuestos",
  lots: "Lotes",
  movements: "Movimientos de inventario",
  customers: "Clientes",
  motorcycles: "Motos",
  orders: "Órdenes de taller",
  suppliers: "Proveedores",
  purchases: "Compras",
  payments: "Pagos a proveedores",
  invoices: "Facturas",
  businessSettings: "Datos del negocio",
  userProfiles: "Perfiles de usuario",
  quotes: "Cotizaciones",
  services: "Servicios",
  serviceCategories: "Categorías de servicios",
  technicians: "Técnicos",
  appointments: "Citas",
  expenses: "Gastos",
  expenseCategories: "Categorías de gastos",
  posSales: "Ventas POS",
  receivablePayments: "Abonos de cartera",
  supplierOrders: "Pedidos a proveedores",
  company: "Perfil de la empresa",
};

/** Etiqueta en español de una sección, con respaldo en su clave técnica. */
export function restoreSectionLabel(key: string): string {
  return RESTORE_SECTION_LABELS[key] ?? key;
}

/** Traduce un `RestoreError` del backend a un mensaje claro en español. */
export function describeRestoreError(error: RestoreError): string {
  switch (error.__kind__) {
    case "invalidFormat":
      return error.invalidFormat
        ? `El archivo no tiene el formato esperado: ${error.invalidFormat}`
        : "El archivo no tiene el formato esperado.";
    case "incompatibleVersion":
      return `La versión del archivo (${Number(
        error.incompatibleVersion,
      )}) no es compatible con esta aplicación.`;
    case "noKnownSections":
      return "El archivo no contiene ninguna sección reconocida de la copia.";
    case "unknownSection":
      return `La sección «${error.unknownSection}» no existe en el archivo.`;
    case "invalidSection":
      return `La sección «${error.invalidSection}» tiene un contenido inválido.`;
    case "notAuthorized":
      return "Solo el administrador puede restaurar una copia.";
    default:
      return "No se pudo procesar el archivo de copia.";
  }
}

/** Traduce cualquier fallo de restauración a un mensaje en español. */
export function restoreErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo completar la restauración.";
}

/** Estado final de una sección tras intentar restaurarla. */
export type RestoreSectionState = "restored" | "skipped" | "error";

/** Resultado por sección que se muestra al terminar la restauración. */
export interface RestoreSectionOutcomeView {
  key: string;
  index: bigint;
  status: RestoreSectionState;
  /** Registros restaurados cuando la sección se aplicó. */
  restored: bigint;
  /** Motivo del fallo cuando la sección quedó en error. */
  message?: string;
}

/** Resumen final de una restauración por secciones. */
export interface RestoreSummary {
  sections: RestoreSectionOutcomeView[];
  restoredSections: bigint;
  skippedSections: bigint;
  failedSections: bigint;
  totalRecords: bigint;
}

/** Convierte el estado tipado del backend a la vista de la interfaz. */
function toSectionState(status: RestoreSectionResult["status"]): {
  state: RestoreSectionState;
  message?: string;
} {
  switch (status.__kind__) {
    case "restored":
      return { state: "restored" };
    case "skipped":
      return { state: "skipped" };
    case "error":
      return { state: "error", message: status.error };
    default:
      return { state: "error" };
  }
}

/**
 * Lee el archivo JSON elegido por el usuario y devuelve su contenido como
 * texto. Rechaza con un mensaje en español cuando el archivo no se puede leer.
 */
export async function readRestoreFile(file: File): Promise<string> {
  try {
    return await file.text();
  } catch {
    throw new Error(
      "No se pudo leer el archivo seleccionado. Verifica que sea un JSON válido.",
    );
  }
}

/**
 * Valida un archivo de copia local y devuelve su vista previa (fecha de
 * generación y secciones incluidas) sin alterar ningún dato. Un archivo
 * inválido, de versión incompatible o sin secciones conocidas se rechaza con
 * un mensaje claro.
 */
export function useValidateRestoreFile() {
  const { actor } = useBackend();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (json: string): Promise<RestorePreview> => {
      if (!actor) throw new Error("Backend no disponible");
      const outcome: RestorePreviewOutcome = await actor.validateRestoreFile(
        token,
        json,
      );
      if (outcome.__kind__ === "err") {
        throw new Error(describeRestoreError(outcome.err));
      }
      return outcome.ok;
    },
  });
}

/**
 * Restaura las secciones seleccionadas llamando a `restoreSection` una vez por
 * sección, en el orden del archivo. Acumula el resultado por sección
 * (restaurada / omitida / error) y el total de registros restaurados, de modo
 * que ninguna llamada procese el archivo completo.
 */
export function useRestoreBackup() {
  const { actor } = useBackend();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      json: string;
      sections: RestoreSectionInfo[];
      selectedKeys: string[];
    }): Promise<RestoreSummary> => {
      if (!actor) throw new Error("Backend no disponible");
      const selected = new Set(input.selectedKeys);
      const results: RestoreSectionOutcomeView[] = [];
      let restoredSections = 0n;
      let skippedSections = 0n;
      let failedSections = 0n;
      let totalRecords = 0n;

      for (const section of input.sections) {
        if (!selected.has(section.key)) {
          results.push({
            key: section.key,
            index: section.index,
            status: "skipped",
            restored: 0n,
          });
          skippedSections += 1n;
          continue;
        }

        const outcome: RestoreSectionOutcome = await actor.restoreSection(
          token,
          input.json,
          section.index,
        );

        if (outcome.__kind__ === "err") {
          results.push({
            key: section.key,
            index: section.index,
            status: "error",
            restored: 0n,
            message: describeRestoreError(outcome.err),
          });
          failedSections += 1n;
          continue;
        }

        const { state, message } = toSectionState(outcome.ok.status);
        results.push({
          key: section.key,
          index: section.index,
          status: state,
          restored: outcome.ok.restored,
          message,
        });

        if (state === "restored") {
          restoredSections += 1n;
          totalRecords += outcome.ok.restored;
        } else if (state === "skipped") {
          skippedSections += 1n;
        } else {
          failedSections += 1n;
        }
      }

      return {
        sections: results,
        restoredSections,
        skippedSections,
        failedSections,
        totalRecords,
      };
    },
  });
}

export type {
  RestoreError,
  RestorePreview,
  RestorePreviewOutcome,
  RestoreSectionInfo,
  RestoreSectionOutcome,
  RestoreSectionResult,
};
