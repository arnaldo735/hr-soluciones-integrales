import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { LoginScreen } from "@/components/LoginScreen";
import { RemindersDialog } from "@/components/RemindersDialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/use-auth";
import { hasAnyReminder, useRemindersSummary } from "@/hooks/use-reminders";
import { Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/** Marca de sesión: el diálogo de recordatorios ya se cerró en esta sesión. */
const REMINDERS_DISMISSED_KEY = "hr-reminders-dismissed";

function readRemindersDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(REMINDERS_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeRemindersDismissed() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(REMINDERS_DISMISSED_KEY, "1");
  } catch {
    // La persistencia es best-effort; el diálogo igual se cierra en memoria.
  }
}

function AttributionFooter() {
  return (
    <footer className="border-t border-border bg-card px-4 py-3">
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}

export function Layout() {
  const { isAuthenticated, isRestoring } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isRemindersDismissed, setIsRemindersDismissed] = useState(
    readRemindersDismissed,
  );
  const reminders = useRemindersSummary();

  // Muestra el diálogo al iniciar sesión y cada vez que la pestaña vuelve a
  // estar visible, salvo que el usuario ya lo haya cerrado en esta sesión.
  useEffect(() => {
    if (!isAuthenticated || isRemindersDismissed) return;
    if (!hasAnyReminder(reminders.data)) return;

    setIsRemindersOpen(true);

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        setIsRemindersOpen(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, isRemindersDismissed, reminders.data]);

  function handleRemindersOpenChange(next: boolean) {
    setIsRemindersOpen(next);
    if (!next) {
      writeRemindersDismissed();
      setIsRemindersDismissed(true);
    }
  }

  if (isRestoring) {
    return (
      <div
        data-ocid="app.loading_state"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="font-mono text-xs uppercase tracking-[0.16em]">
            Cargando
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar />
        </div>
      </aside>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent
          side="left"
          className="w-64 border-sidebar-border bg-sidebar p-0"
        >
          <SheetTitle className="sr-only">Navegación principal</SheetTitle>
          <AppSidebar onNavigate={() => setIsSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 bg-background px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
        <AttributionFooter />
      </div>
      <RemindersDialog
        open={isRemindersOpen}
        onOpenChange={handleRemindersOpenChange}
      />
      <Toaster />
    </div>
  );
}
