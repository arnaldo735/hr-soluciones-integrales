import { ExitSessionDialog } from "@/components/ExitSessionDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useDriveConnection } from "@/hooks/use-backup";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useRole } from "@/hooks/use-role";
import { Link } from "@tanstack/react-router";
import {
  LogIn,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  UserRound,
} from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
  onOpenSidebar: () => void;
}

export function AppHeader({ onOpenSidebar }: AppHeaderProps) {
  const { isAuthenticated, logout } = useAuth();
  const { isAdmin, isLoading, roleName } = useRole();
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  // The Drive status is shared by every page through this header, so it is
  // resolved once per session instead of on each module change.
  const drive = useDriveConnection(isAdmin);
  const fullscreen = useFullscreen();

  const roleLabel = isLoading ? "…" : roleName;

  function handleLogout() {
    if (isAdmin) {
      setIsExitDialogOpen(true);
      return;
    }
    logout();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-3 shadow-subtle sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir menú de navegación"
        onClick={onOpenSidebar}
        data-ocid="header.open_sidebar_button"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      <Link
        to="/"
        data-ocid="header.home_link"
        className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-gradient-primary font-display text-sm font-bold text-primary-foreground">
          HR
        </span>
        <span className="hidden font-display text-sm font-semibold tracking-tight sm:inline">
          HR SOLUCIONES INTEGRALES
        </span>
      </Link>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-2">
        {fullscreen.isSupported ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void fullscreen.toggle()}
            aria-label={
              fullscreen.isFullscreen
                ? "Salir de pantalla completa"
                : "Pantalla completa"
            }
            title={
              fullscreen.isFullscreen
                ? "Salir de pantalla completa"
                : "Pantalla completa"
            }
            aria-pressed={fullscreen.isFullscreen}
            data-ocid="header.fullscreen_button"
            className="size-10 shrink-0"
          >
            {fullscreen.isFullscreen ? (
              <Minimize className="size-5" aria-hidden="true" />
            ) : (
              <Maximize className="size-5" aria-hidden="true" />
            )}
          </Button>
        ) : null}
        {isAuthenticated ? (
          <>
            <Badge
              variant="outline"
              data-ocid="header.role_badge"
              className="hidden gap-1.5 border-primary/40 bg-primary/10 text-primary sm:inline-flex"
            >
              <UserRound className="size-3" aria-hidden="true" />
              {roleLabel}
            </Badge>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5"
              data-ocid="header.profile_link"
            >
              <Link to="/perfil">
                <UserRound className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Mi perfil</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-ocid="header.logout_button"
              className="gap-1.5"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => logout()}
            data-ocid="header.login_button"
            className="gap-1.5"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Iniciar sesión
          </Button>
        )}
      </div>

      <ExitSessionDialog
        open={isExitDialogOpen}
        onOpenChange={setIsExitDialogOpen}
        isDriveConfigured={drive.isDriveConfigured}
        isDriveLoading={drive.isLoading}
        onLogout={logout}
      />
    </header>
  );
}
