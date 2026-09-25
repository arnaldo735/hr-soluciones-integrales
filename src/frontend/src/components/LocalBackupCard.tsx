import type { LocalBackup } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { backupErrorMessage, useDownloadLocalBackup } from "@/hooks/use-backup";
import { downloadFile } from "@/lib/download";
import { formatDateTime } from "@/lib/format";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  HardDriveDownload,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Triggers a browser download for the JSON returned by the backend through the
 * shared mobile-safe helper, so the file is saved on phone and tablet too.
 */
async function downloadJsonFile(fileName: string, json: string): Promise<void> {
  await downloadFile({
    filename: fileName,
    mimeType: "application/json",
    data: json,
  });
}

export function LocalBackupCard() {
  const downloadBackup = useDownloadLocalBackup();

  const [lastBackup, setLastBackup] = useState<LocalBackup | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  function handleDownload() {
    setDownloadError(null);
    downloadBackup.mutate(undefined, {
      onSuccess: (backup) => {
        void downloadJsonFile(backup.fileName, backup.json)
          .then(() => {
            setLastBackup(backup);
            toast.success("Copia local descargada");
          })
          .catch((error: unknown) => {
            setLastBackup(null);
            setDownloadError(backupErrorMessage(error));
          });
      },
      onError: (error) => {
        setLastBackup(null);
        setDownloadError(backupErrorMessage(error));
      },
    });
  }

  const isBusy = downloadBackup.isPending;

  return (
    <Card
      data-ocid="settings.local_backup.card"
      className="rounded-lg shadow-none"
    >
      <CardHeader className="border-b border-border">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
            <HardDriveDownload className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="font-display text-base tracking-tight">
              Copia de seguridad local
            </CardTitle>
            <CardDescription>
              Descarga en tu equipo un archivo JSON con toda la información del
              taller: clientes, motos, pedidos, ventas, inventario, compras,
              proveedores, facturas, pagos, presupuestos, servicios, técnicos,
              citas, gastos, cuentas por cobrar, configuración del negocio y
              perfiles de usuario.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isBusy}
            data-ocid="settings.local_backup.download_button"
            className="gap-2"
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            {isBusy ? "Generando copia…" : "Descargar copia local"}
          </Button>
          {isBusy ? (
            <p
              data-ocid="settings.local_backup.loading_state"
              className="text-xs text-muted-foreground"
            >
              Estamos generando el archivo JSON. No cierres esta ventana.
            </p>
          ) : null}
        </div>

        {lastBackup ? (
          <div
            data-ocid="settings.local_backup.success_state"
            className="flex items-start gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-3"
          >
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Copia local descargada
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {lastBackup.fileName}
              </p>
              <p className="text-xs text-muted-foreground">
                Generada el {formatDateTime(lastBackup.generatedAt)}
              </p>
            </div>
          </div>
        ) : null}

        {downloadError ? (
          <div
            data-ocid="settings.local_backup.error_state"
            className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3"
          >
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>{downloadError}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isBusy}
              data-ocid="settings.local_backup.retry_button"
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Reintentar descarga
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
