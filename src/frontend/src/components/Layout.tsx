import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Outlet } from "@tanstack/react-router";
import { LogIn, Wrench } from "lucide-react";
import { useState } from "react";

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

function LoginGate() {
  const { login, isLoggingIn } = useInternetIdentity();
  return (
    <div
      data-ocid="auth.login_state"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-lg border border-border bg-card shadow-elevated">
        <Wrench className="size-7 text-primary" aria-hidden="true" />
      </div>
      <div className="max-w-sm space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          HR SOLUCIONES INTEGRALES
        </h1>
        <p className="text-sm text-muted-foreground">
          Control de inventario, órdenes de taller y facturación para tu taller
          de motocicletas. Inicia sesión para continuar.
        </p>
      </div>
      <Button
        type="button"
        size="lg"
        onClick={() => login()}
        disabled={isLoggingIn}
        data-ocid="auth.login_button"
        className="gap-2"
      >
        <LogIn className="size-4" aria-hidden="true" />
        {isLoggingIn ? "Conectando…" : "Iniciar sesión"}
      </Button>
    </div>
  );
}

export function Layout() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isInitializing) {
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
        <LoginGate />
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
      <Toaster />
    </div>
  );
}
