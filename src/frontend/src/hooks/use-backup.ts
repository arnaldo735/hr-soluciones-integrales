import type {
  BackupFile,
  BackupListOutcome,
  BackupOutcome,
  BackupResult,
  DriveAuthResult,
  DriveAuthStart,
  DriveConfigStatus,
  DriveConnectionStatus,
  LocalBackup,
} from "@/backend";
import { useBackend } from "@/hooks/use-backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const DRIVE_STATUS_QUERY_KEY = ["drive-connection-status"] as const;
export const BACKUPS_QUERY_KEY = ["drive-backups"] as const;

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

  const query = useQuery({
    queryKey: DRIVE_STATUS_QUERY_KEY,
    queryFn: async (): Promise<DriveConnectionStatus> => {
      if (!actor) {
        return { connected: false, configuration: UNKNOWN_CONFIGURATION };
      }
      return actor.getDriveConnectionStatus();
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

  return useMutation({
    mutationFn: async (): Promise<DriveAuthStart> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.startDriveAuthorization();
    },
  });
}

/** Completa la autorización OAuth con el código devuelto por Google. */
export function useCompleteDriveAuthorization() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      code: string;
      state: string;
    }): Promise<DriveAuthResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.completeDriveAuthorization(input.code, input.state);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DRIVE_STATUS_QUERY_KEY });
    },
  });
}

/** Revoca la conexión con Google Drive del administrador. */
export function useDisconnectDrive() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.disconnectDrive();
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<BackupOutcome> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createBackup();
    },
    onSuccess: (outcome) => {
      if (outcome.__kind__ === "ok") {
        void queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
      }
    },
  });
}

/**
 * Genera la copia de seguridad local y devuelve el JSON completo de la empresa
 * junto con el nombre de archivo sugerido. El llamador se encarga de
 * descargarlo en el equipo del usuario.
 */
export function useDownloadLocalBackup() {
  const { actor } = useBackend();

  return useMutation({
    mutationFn: async (): Promise<LocalBackup> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.downloadLocalBackup();
    },
  });
}

/** Lista los respaldos recientes desde el Drive del administrador. */
export function useListBackups() {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: BACKUPS_QUERY_KEY,
    queryFn: async (): Promise<BackupListOutcome> => {
      if (!actor) return { __kind__: "ok", ok: [] };
      return actor.listBackups();
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
  LocalBackup,
};
