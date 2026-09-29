import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classifyAuthError, useAuth } from "@/hooks/use-auth";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Ban,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { useState } from "react";

/**
 * Pantalla de ingreso con usuario y contraseña. Es la puerta principal del
 * taller; la vía de Internet Identity queda disponible como entrada
 * alternativa del administrador.
 */
export function LoginScreen() {
  const { login } = useAuth();
  const { login: loginWithIdentity, isLoggingIn } = useInternetIdentity();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorKind, setErrorKind] = useState<
    "invalidCredentials" | "inactiveAccount" | "unknown" | null
  >(null);

  const canSubmit = username.trim() !== "" && password !== "" && !isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setErrorKind(null);
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (error) {
      setErrorKind(classifyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      data-ocid="auth.login_state"
      className="auth-backdrop flex min-h-screen items-center justify-center px-4 py-10"
    >
      <div className="auth-card animate-auth-card-in">
        <div className="auth-card-mark">
          <Wrench className="size-7" aria-hidden="true" />
        </div>
        <h1 className="auth-card-title">Iniciar sesión</h1>
        <p className="auth-card-subtitle">
          Ingrese con su usuario y contraseña
        </p>

        <form
          onSubmit={handleSubmit}
          className="auth-card-form"
          data-ocid="auth.login_form"
        >
          <div className="field space-y-2">
            <Label htmlFor="login-username" className="field-label">
              Usuario de acceso
            </Label>
            <Input
              id="login-username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              className="data-rail"
              placeholder="usuario"
              data-ocid="auth.username_input"
            />
          </div>

          <div className="field space-y-2">
            <Label htmlFor="login-password" className="field-label">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="pr-10"
                placeholder="••••••••"
                data-ocid="auth.password_input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                data-ocid="auth.toggle_password_button"
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {errorKind === "invalidCredentials" ? (
            <div
              role="alert"
              data-tone="error"
              data-ocid="auth.error_state"
              className="auth-alert"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>Usuario o contraseña incorrectos.</span>
            </div>
          ) : null}

          {errorKind === "inactiveAccount" ? (
            <div
              role="alert"
              data-tone="warning"
              data-ocid="auth.inactive_state"
              className="auth-alert"
            >
              <Ban className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Su cuenta está desactivada. Contacte al administrador.
              </span>
            </div>
          ) : null}

          {errorKind === "unknown" ? (
            <div
              role="alert"
              data-tone="error"
              data-ocid="auth.error_state"
              className="auth-alert"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                No se pudo iniciar sesión. Verifique su conexión e inténtelo de
                nuevo.
              </span>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={!canSubmit}
            data-ocid="auth.submit_button"
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogIn className="size-4" aria-hidden="true" />
            )}
            {isSubmitting ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>

        <div className="auth-card-footer">
          <button
            type="button"
            onClick={() => loginWithIdentity()}
            disabled={isLoggingIn}
            data-ocid="auth.identity_login_button"
            className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 transition-smooth hover:underline disabled:opacity-60"
          >
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {isLoggingIn
              ? "Conectando…"
              : "Ingresar como administrador con Internet Identity"}
          </button>
        </div>
      </div>
    </div>
  );
}
