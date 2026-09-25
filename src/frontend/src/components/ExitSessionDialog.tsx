import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { describeBackupError, useCreateBackup } from "@/hooks/use-backup";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CloudOff, Loader2, LogOut, Save } from "lucide-react";
import { useState } from "react";

interface ExitSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True cuando el administrador ya conectó su cuenta de Google Drive. */
  isDriveConfigured: boolean;
  /** True mientras se consulta el estado de la conexión. */
  isDriveLoading: boolean;
  /** Cierra la sesión de inmediato, sin respaldar. */
  onLogout: () => void;
}

/**
 * Confirmación de salida para administradores. Recuerda respaldar antes de
 * cerrar la sesión y ofrece respaldar y salir, salir sin respaldar o cancelar.
 * Si el respaldo falla, la sesión permanece abierta y se puede reintentar.
 */
export function ExitSessionDialog({
  open,
  onOpenChange,
  isDriveConfigured,
  isDriveLoading,
  onLogout,
}: ExitSessionDialogProps) {
  const createBackup = useCreateBackup();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBackingUp = createBackup.isPending;

  function handleOpenChange(next: boolean) {
    if (isBackingUp) return;
    if (!next) setErrorMessage(null);
    onOpenChange(next);
  }

  function handleBackupAndExit() {
    setErrorMessage(null);
    createBackup.mutate(undefined, {
      onSuccess: (outcome) => {
        if (outcome.__kind__ === "ok") {
          onLogout();
          return;
        }
        setErrorMessage(describeBackupError(outcome.err));
      },
      onError: (error) => {
        setErrorMessage(
          error instanceof Error && error.message
            ? error.message
            : "No se pudo generar el respaldo. Inténtalo de nuevo.",
        );
      },
    });
  }

  function handleExitWithoutBackup() {
    setErrorMessage(null);
    onLogout();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="exit_session.dialog"
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => {
          if (isBackingUp) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isBackingUp) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-display">Cerrar sesión</DialogTitle>
          <DialogDescription>
            Antes de salir, te recomendamos respaldar la información del taller
            en tu Google Drive. Así conservas una copia de seguridad reciente.
          </DialogDescription>
        </DialogHeader>

        {!isDriveLoading && !isDriveConfigured ? (
          <div
            data-ocid="exit_session.drive_warning"
            className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-3"
          >
            <CloudOff
              className="mt-0.5 size-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                Google Drive no está conectado
              </p>
              <p className="text-muted-foreground">
                Conecta tu cuenta desde Configuración para poder respaldar antes
                de salir.
              </p>
              <Link
                to="/configuracion"
                onClick={() => handleOpenChange(false)}
                data-ocid="exit_session.settings_link"
                className="inline-block font-medium text-primary underline-offset-4 hover:underline"
              >
                Ir a Configuración
              </Link>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            data-ocid="exit_session.error_state"
            className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">
                No se pudo respaldar
              </p>
              <p className="text-muted-foreground">{errorMessage}</p>
              <p className="text-muted-foreground">
                Tu sesión sigue abierta. Puedes reintentar o salir sin
                respaldar.
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isBackingUp}
            data-ocid="exit_session.cancel_button"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExitWithoutBackup}
            disabled={isBackingUp}
            data-ocid="exit_session.exit_without_backup_button"
            className="gap-1.5"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Salir sin respaldar
          </Button>
          <Button
            type="button"
            onClick={handleBackupAndExit}
            disabled={isBackingUp || isDriveLoading || !isDriveConfigured}
            data-ocid="exit_session.backup_and_exit_button"
            className="gap-1.5"
          >
            {isBackingUp ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {isBackingUp ? "Respaldando…" : "Respaldar y salir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
