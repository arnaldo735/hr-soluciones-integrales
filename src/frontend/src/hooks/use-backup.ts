import type {
  BackupFile,
  BackupListOutcome,
  BackupOutcome,
  BackupResult,
  DriveAuthResult,
  DriveAuthStart,
  DriveConfigStatus,
  DriveConnectionStatus,
  LocalBackupManifest,
} from "@/backend";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const DRIVE_STATUS_QUERY_KEY = ["drive-connection-status"] as const;
export const BACKUPS_QUERY_KEY = ["drive-backups"] as const;

/**
 * Copia de seguridad local lista para descargar: el nombre sugerido del
 * archivo, el momento de generación y el JSON completo de la empresa.
 *
 * El backend ya no expone este tipo como un único método; el frontend lo arma
 * a partir del manifiesto y de las secciones paginadas.
 */
export interface LocalBackup {
  fileName: string;
  generatedAt: bigint;
  json: string;
}

/** Traduce un fallo de respaldo del backend a un mensaje en español. */
export function backupErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo completar la operación con Google Drive.";
}

/** Traduce un `BackupError` del backend a un mensaje en español. */
export function describeBackupError(error: {
  __kind__: string;
  driveFailed?: string;
}): string {
  switch (error.__kind__) {
    case "notAuthorized":
      return "Solo el administrador puede gestionar los respaldos.";
    case "notConnected":
      return "Google Drive no está conectado. Conéctalo desde Configuración.";
    case "driveFailed":
      return error.driveFailed
        ? `Google Drive rechazó la operación: ${error.driveFailed}`
        : "Google Drive rechazó la operación.";
    default:
      return "No se pudo completar la operación con Google Drive.";
  }
}

export interface DriveConnection {
  /** True cuando el administrador ya autorizó su cuenta de Google Drive. */
  isDriveConfigured: boolean;
  /** True mientras se consulta el estado de la conexión. */
  isLoading: boolean;
  /** True cuando la consulta de estado falló. */
  isError: boolean;
  /** Correo de la cuenta conectada, si el backend lo expone. */
  accountEmail?: string;
  /** Momento de la conexión, si el backend lo expone. */
  connectedAt?: bigint;
  /** Estado de las credenciales OAuth del canister. */
  configuration: DriveConfigStatus;
  refetch: () => void;
}

/** Estado por defecto cuando el backend aún no responde. */
const UNKNOWN_CONFIGURATION: DriveConfigStatus = {
  configured: false,
  missingVariables: [],
};

/**
 * Estado de la conexión con Google Drive del administrador. Es la fuente de
 * verdad para decidir si el respaldo puede ejecutarse.
 */
export function useDriveConnection(enabled = true): DriveConnection {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  const query = useQuery({
    queryKey: DRIVE_STATUS_QUERY_KEY,
    queryFn: async (): Promise<DriveConnectionStatus> => {
      if (!actor) {
        return { connected: false, configuration: UNKNOWN_CONFIGURATION };
      }
      return actor.getDriveConnectionStatus(token);
    },
    enabled: enabled && !!actor && !isFetching,
    // The header reads this on every page, so it is resolved once per session
    // and refreshed only by the connect/disconnect mutations.
    staleTime: Number.POSITIVE_INFINITY,
  });

  return {
    isDriveConfigured: query.data?.connected ?? false,
    isLoading:
      enabled && (query.isLoading || isFetching || (!actor && !query.isError)),
    isError: query.isError,
    accountEmail: query.data?.accountEmail,
    connectedAt: query.data?.connectedAt,
    configuration: query.data?.configuration ?? UNKNOWN_CONFIGURATION,
    refetch: () => {
      void query.refetch();
    },
  };
}

/** Inicia la autorización OAuth (PKCE) de la cuenta propia del administrador. */
export function useStartDriveAuthorization() {
  const { actor } = useBackend();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<DriveAuthStart> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.startDriveAuthorization(token);
    },
  });
}

/** Completa la autorización OAuth con el código devuelto por Google. */
export function useCompleteDriveAuthorization() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      code: string;
      state: string;
    }): Promise<DriveAuthResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.completeDriveAuthorization(token, input.code, input.state);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DRIVE_STATUS_QUERY_KEY });
    },
  });
}

/** Revoca la conexión con Google Drive del administrador. */
export function useDisconnectDrive() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.disconnectDrive(token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DRIVE_STATUS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
    },
  });
}

/**
 * Genera el respaldo y lo sube al Drive del administrador. Devuelve el
 * `BackupOutcome` completo para que el llamador pueda distinguir el éxito del
 * error controlado sin depender de excepciones.
 */
export function useCreateBackup() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<BackupOutcome> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createBackup(token);
    },
    onSuccess: (outcome) => {
      if (outcome.__kind__ === "ok") {
        void queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
      }
    },
  });
}

/** Tamaño de página solicitado cuando el manifiesto no expone uno válido. */
const DEFAULT_BACKUP_PAGE_SIZE = 200n;

/**
 * Reúne la copia de seguridad local completa llamando al backend por secciones.
 *
 * El backend limita cada respuesta a `maxPageSize`, así que el avance se hace
 * siempre con el `limit` efectivo devuelto por el fragmento, nunca con el
 * solicitado. Las secciones de colección llegan como arreglos JSON que se
 * concatenan página a página; las de un único registro llegan completas con
 * `done` verdadero. Se detiene cuando `done` es verdadero o cuando el fragmento
 * deja de avanzar, para no entrar en un ciclo infinito.
 */
async function collectLocalBackup(
  actor: NonNullable<ReturnType<typeof useBackend>["actor"]>,
  token: string | null,
): Promise<LocalBackup> {
  const manifest: LocalBackupManifest =
    await actor.getLocalBackupManifest(token);

  const pageSize =
    manifest.maxPageSize > 0n ? manifest.maxPageSize : DEFAULT_BACKUP_PAGE_SIZE;
  const root: Record<string, unknown> = {
    generatedAt: Number(manifest.generatedAt),
  };

  for (let index = 0; index < manifest.sections.length; index += 1) {
    const sectionKey = manifest.sections[index];
    let offset = 0n;
    let done = false;
    let items: unknown[] = [];
    let single: unknown = null;
    let isCollection = false;

    while (!done) {
      const chunk = await actor.getBackupSection(
        token,
        BigInt(index),
        offset,
        pageSize,
      );

      const parsed = JSON.parse(chunk.json) as unknown;
      if (Array.isArray(parsed)) {
        isCollection = true;
        items = [...items, ...parsed];
      } else {
        single = parsed;
      }

      if (chunk.done) {
        done = true;
        break;
      }

      // El backend puede recortar el límite solicitado; avanzar con el
      // efectivo evita releer el mismo fragmento para siempre.
      if (chunk.limit <= 0n) {
        throw new Error(
          "El servidor devolvió un fragmento vacío al generar la copia local.",
        );
      }

      const nextOffset = chunk.offset + chunk.limit;
      if (nextOffset <= offset) {
        throw new Error(
          "El servidor no pudo avanzar al generar la copia local.",
        );
      }
      offset = nextOffset;
    }

    root[sectionKey] = isCollection ? items : single;
  }

  return {
    fileName: manifest.fileName,
    generatedAt: manifest.generatedAt,
    json: JSON.stringify(root),
  };
}

/**
 * Genera la copia de seguridad local y devuelve el JSON completo de la empresa
 * junto con el nombre de archivo sugerido. El llamador se encarga de
 * descargarlo en el equipo del usuario.
 */
export function useDownloadLocalBackup() {
  const { actor } = useBackend();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<LocalBackup> => {
      if (!actor) throw new Error("Backend no disponible");
      return collectLocalBackup(actor, token);
    },
  });
}

/** Lista los respaldos recientes desde el Drive del administrador. */
export function useListBackups() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: BACKUPS_QUERY_KEY,
    queryFn: async (): Promise<BackupListOutcome> => {
      if (!actor) return { __kind__: "ok", ok: [] };
      return actor.listBackups(token);
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

export type {
  BackupFile,
  BackupListOutcome,
  BackupOutcome,
  BackupResult,
  DriveAuthResult,
  DriveAuthStart,
  DriveConfigStatus,
  DriveConnectionStatus,
  LocalBackupManifest,
};
