import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";
import { Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Route guard for owner/administrator-only sections. Mechanics and guests see
 * a clear access-denied view with a path back to the panel.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { isAdmin, isLoading, isError, refetch } = useRole();

  if (isLoading) {
    return (
      <div
        data-ocid="access.loading_state"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <Loader2
          className="size-6 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-sm">Verificando permisos…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="access.error_state"
        className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10">
          <ShieldAlert className="size-6 text-destructive" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">
            No se pudo verificar tu rol
          </h2>
          <p className="text-sm text-muted-foreground">
            Revisa tu conexión e inténtalo de nuevo para acceder a esta sección.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={refetch}
          data-ocid="access.retry_button"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        data-ocid="access.denied_state"
        className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-md border border-warning/40 bg-warning/10">
          <ShieldAlert className="size-6 text-warning" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">
            Acceso restringido
          </h2>
          <p className="text-sm text-muted-foreground">
            Esta sección es exclusiva del dueño o administrador del taller. Pide
            a un administrador que actualice tu rol si necesitas entrar.
          </p>
        </div>
        <Button asChild variant="outline" data-ocid="access.back_button">
          <Link to="/">Volver al panel</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
