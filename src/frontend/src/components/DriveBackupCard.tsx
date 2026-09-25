import type { BackupFile, BackupResult } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  backupErrorMessage,
  describeBackupError,
  useCreateBackup,
  useDisconnectDrive,
  useDriveConnection,
  useListBackups,
  useStartDriveAuthorization,
} from "@/hooks/use-backup";
import { formatDateTime, formatNumber } from "@/lib/format";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Copy,
  ExternalLink,
  HardDriveDownload,
  Loader2,
  Plug,
  RefreshCw,
  Unplug,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const REDIRECT_URI = `${window.location.origin}/connect/drive`;

/** Human-readable size for a Drive file, e.g. `12,4 KB`. */
function formatFileSize(bytes: bigint): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 1024) return `${formatNumber(bytes)} B`;
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1).replace(".", ",")} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function CopyField({
  label,
  value,
  ocid,
}: {
  label: string;
  value: string;
  ocid: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar. Selecciona el texto manualmente.");
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code
          data-ocid={`${ocid}.value`}
          className="min-w-0 flex-1 truncate rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground"
        >
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopy()}
          data-ocid={`${ocid}.copy_button`}
          className="shrink-0 gap-1.5"
        >
          {copied ? (
            <CheckCircle2
              className="size-3.5 text-success"
              aria-hidden="true"
            />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

function GoogleCloudSetupPanel({
  missingVariables,
}: {
  missingVariables: string[];
}) {
  return (
    <div
      data-ocid="settings.drive.setup_panel"
      className="rounded-md border border-border bg-secondary/40 p-4"
    >
      <div className="mb-3 flex items-start gap-2">
        <Plug
          className="mt-0.5 size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="font-display text-sm font-medium">
            Configuración de Google Cloud (solo una vez)
          </p>
          <p className="text-xs text-muted-foreground">
            El respaldo usa la cuenta de Google del administrador. Antes de
            conectar, crea un cliente OAuth 2.0 de tipo{" "}
            <span className="font-medium text-foreground">Aplicación web</span>{" "}
            en Google Cloud Console y registra el URI de redirección exacto.
          </p>
        </div>
      </div>

      {missingVariables.length > 0 ? (
        <div
          data-ocid="settings.drive.missing_variables_state"
          className="mb-3 flex items-start gap-2.5 rounded-md border border-status-overdue/40 bg-status-overdue/10 px-3 py-2.5 text-xs text-status-overdue"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-medium">
              Faltan credenciales de Google OAuth en el canister
            </p>
            <p>
              Configura{" "}
              {missingVariables.length === 1
                ? "esta variable"
                : "estas variables"}{" "}
              de entorno antes de conectar:
            </p>
            <ul className="space-y-0.5">
              {missingVariables.map((name) => (
                <li key={name} className="font-mono">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <CopyField
          label="URI de redirección autorizado"
          value={REDIRECT_URI}
          ocid="settings.drive.redirect_uri"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Client ID
            </p>
            <p className="text-xs text-muted-foreground">
              Cópialo desde Google Cloud Console y guárdalo en la configuración
              del canister (variable{" "}
              <code className="font-mono">GOOGLE_OAUTH_CLIENT_ID</code>).
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Client Secret
            </p>
            <p className="text-xs text-muted-foreground">
              Guárdalo como variable secreta del canister (
              <code className="font-mono">GOOGLE_OAUTH_CLIENT_SECRET</code>).
              Nunca lo compartas ni lo subas al repositorio.
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            URI de redirección
          </p>
          <p className="text-xs text-muted-foreground">
            Guarda el mismo URI de arriba en la configuración del canister
            (variable{" "}
            <code className="font-mono">GOOGLE_OAUTH_REDIRECT_URI</code>). Debe
            coincidir exactamente con el registrado en Google Cloud Console.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Alcance solicitado: <code className="font-mono">drive.file</code> — la
          app solo puede ver y administrar los archivos que ella misma crea.
        </p>
      </div>
    </div>
  );
}

function BackupHistory() {
  const backupsQuery = useListBackups();
  const outcome = backupsQuery.data;
  const backups: BackupFile[] = outcome?.__kind__ === "ok" ? outcome.ok : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HardDriveDownload
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="font-display text-sm font-medium">
            Historial de respaldos
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void backupsQuery.refetch()}
          disabled={backupsQuery.isFetching}
          data-ocid="settings.drive.history_refresh_button"
          className="gap-1.5"
        >
          <RefreshCw
            className={`size-3.5 ${backupsQuery.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Actualizar
        </Button>
      </div>

      {backupsQuery.isLoading ? (
        <div
          data-ocid="settings.drive.history.loading_state"
          className="space-y-2"
        >
          {Array.from({ length: 3 }, (_, i) => `backup-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-12 w-full" />
            ),
          )}
        </div>
      ) : backupsQuery.isError ? (
        <div
          data-ocid="settings.drive.history.error_state"
          className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3"
        >
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No se pudo leer el historial desde Google Drive.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void backupsQuery.refetch()}
            data-ocid="settings.drive.history.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : outcome?.__kind__ === "err" ? (
        <div
          data-ocid="settings.drive.history.error_state"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          {describeBackupError(outcome.err)}
        </div>
      ) : backups.length === 0 ? (
        <div
          data-ocid="settings.drive.history.empty_state"
          className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-8 text-center"
        >
          <HardDriveDownload
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="font-display text-sm font-medium">
            Aún no hay respaldos
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Cuando generes el primer respaldo aparecerá aquí con su fecha,
            tamaño y enlace a Google Drive.
          </p>
        </div>
      ) : (
        <ul
          data-ocid="settings.drive.history.list"
          className="divide-y divide-border overflow-hidden rounded-md border border-border"
        >
          {backups.map((backup, index) => (
            <li
              key={backup.fileId}
              data-ocid={`settings.drive.history.item.${index + 1}`}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-mono text-xs text-foreground">
                  {backup.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(backup.createdAt)} ·{" "}
                  <span className="tabular">{formatFileSize(backup.size)}</span>
                </p>
              </div>
              <a
                href={backup.webViewLink}
                target="_blank"
                rel="noreferrer"
                data-ocid={`settings.drive.history.link.${index + 1}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Abrir en Drive
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DriveBackupCard() {
  const connection = useDriveConnection();
  const startAuthorization = useStartDriveAuthorization();
  const disconnect = useDisconnectDrive();
  const createBackup = useCreateBackup();

  const [lastBackup, setLastBackup] = useState<BackupResult | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  function handleConnect() {
    startAuthorization.mutate(undefined, {
      onSuccess: (result) => {
        window.location.assign(result.authorizationUrl);
      },
      onError: (error) => {
        toast.error("No se pudo iniciar la conexión con Google Drive", {
          description: backupErrorMessage(error),
        });
      },
    });
  }

  function handleDisconnect() {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setLastBackup(null);
        setBackupError(null);
        toast.success("Google Drive desconectado");
      },
      onError: (error) => {
        toast.error("No se pudo desconectar Google Drive", {
          description: backupErrorMessage(error),
        });
      },
    });
  }

  function handleBackup() {
    setBackupError(null);
    createBackup.mutate(undefined, {
      onSuccess: (outcome) => {
        if (outcome.__kind__ === "ok") {
          setLastBackup(outcome.ok);
          toast.success("Respaldo completado");
        } else {
          setLastBackup(null);
          setBackupError(describeBackupError(outcome.err));
        }
      },
      onError: (error) => {
        setLastBackup(null);
        setBackupError(backupErrorMessage(error));
      },
    });
  }

  const isConnected = connection.isDriveConfigured;
  const isBusy = createBackup.isPending;
  const missingVariables = connection.configuration.missingVariables;
  const isConfigured = connection.configuration.configured;

  return (
    <Card data-ocid="settings.drive.card" className="rounded-lg shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
            <CloudUpload className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-display text-base tracking-tight">
                Respaldo en Google Drive
              </CardTitle>
              {connection.isLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : isConnected ? (
                <Badge
                  variant="outline"
                  data-ocid="settings.drive.status_badge"
                  className="border-success/40 bg-success/10 text-success"
                >
                  Conectado
                </Badge>
              ) : !isConfigured ? (
                <Badge
                  variant="outline"
                  data-ocid="settings.drive.status_badge"
                  className="border-status-overdue/40 bg-status-overdue/10 text-status-overdue"
                >
                  No configurado
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  data-ocid="settings.drive.status_badge"
                  className="border-border bg-muted text-muted-foreground"
                >
                  Desconectado
                </Badge>
              )}
            </div>
            <CardDescription>
              Genera un archivo JSON con los datos del taller y guárdalo en la
              carpeta «HR SOLUCIONES INTEGRALES — Respaldos» de tu Google Drive.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        {connection.isError ? (
          <div
            data-ocid="settings.drive.connection.error_state"
            className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3"
          >
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              No se pudo consultar el estado de la conexión con Google Drive.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={connection.refetch}
              data-ocid="settings.drive.connection.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : connection.isLoading ? (
          <div
            data-ocid="settings.drive.connection.loading_state"
            className="space-y-2"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-56" />
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Cuenta conectada
                </p>
                <p
                  data-ocid="settings.drive.account_email"
                  className="truncate text-sm font-medium text-foreground"
                >
                  {connection.accountEmail ?? "Cuenta de Google autorizada"}
                </p>
                {connection.connectedAt !== undefined ? (
                  <p className="text-xs text-muted-foreground">
                    Conectada el {formatDateTime(connection.connectedAt)}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
                data-ocid="settings.drive.disconnect_button"
                className="shrink-0 gap-1.5"
              >
                {disconnect.isPending ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Unplug className="size-3.5" aria-hidden="true" />
                )}
                {disconnect.isPending ? "Desconectando…" : "Desconectar"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleBackup}
                disabled={isBusy}
                data-ocid="settings.drive.backup_button"
                className="gap-2"
              >
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CloudUpload className="size-4" aria-hidden="true" />
                )}
                {isBusy ? "Generando y subiendo…" : "Respaldar ahora"}
              </Button>
              {isBusy ? (
                <p
                  data-ocid="settings.drive.backup.loading_state"
                  className="text-xs text-muted-foreground"
                >
                  Estamos generando el archivo JSON y subiéndolo a tu Drive. No
                  cierres esta ventana.
                </p>
              ) : null}
            </div>

            {lastBackup ? (
              <div
                data-ocid="settings.drive.backup.success_state"
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/40 bg-success/5 px-3 py-3"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      Respaldo completado
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {lastBackup.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(lastBackup.createdAt)} ·{" "}
                      <span className="tabular">
                        {formatFileSize(lastBackup.size)}
                      </span>
                    </p>
                  </div>
                </div>
                <a
                  href={lastBackup.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  data-ocid="settings.drive.backup.open_link"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  Abrir en Google Drive
                </a>
              </div>
            ) : null}

            {backupError ? (
              <div
                data-ocid="settings.drive.backup.error_state"
                className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3"
              >
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{backupError}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBackup}
                  disabled={isBusy}
                  data-ocid="settings.drive.backup.retry_button"
                  className="gap-1.5"
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                  Reintentar respaldo
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2.5">
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Estado de la conexión
                </p>
                <p className="text-sm text-foreground">
                  {isConfigured
                    ? "Google Drive no está conectado. Conecta la cuenta del administrador para poder respaldar."
                    : "Google Drive no está configurado. Faltan credenciales OAuth en el canister; revisa la configuración de Google Cloud más abajo."}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={startAuthorization.isPending || !isConfigured}
                aria-describedby={
                  !isConfigured ? "drive-connect-help" : undefined
                }
                data-ocid="settings.drive.connect_button"
                className="shrink-0 gap-2"
              >
                {startAuthorization.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plug className="size-4" aria-hidden="true" />
                )}
                {startAuthorization.isPending
                  ? "Abriendo Google…"
                  : "Conectar con Google Drive"}
              </Button>
            </div>
            <p
              id="drive-connect-help"
              className="text-xs text-muted-foreground"
            >
              {isConfigured
                ? "Se abrirá la pantalla de autorización de Google. Al terminar volverás automáticamente a Configuración."
                : "Configura las variables de entorno indicadas abajo y vuelve a intentarlo."}
            </p>
          </div>
        )}

        <Separator />

        <GoogleCloudSetupPanel missingVariables={missingVariables} />

        {isConnected ? (
          <>
            <Separator />
            <BackupHistory />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
