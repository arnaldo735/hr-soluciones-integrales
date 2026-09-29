import { DriveBackupCard } from "@/components/DriveBackupCard";
import { LocalBackupCard } from "@/components/LocalBackupCard";
import { RestoreBackupCard } from "@/components/RestoreBackupCard";
import { ServiceTermsCard } from "@/components/ServiceTermsCard";
import { WarrantyTermsCard } from "@/components/WarrantyTermsCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import {
  useDailyHopeMessage,
  useHopeSettings,
  useUpdateHopeSettings,
} from "@/hooks/use-hope";
import { formatColombiaDateDDMMYYYY } from "@/lib/format";
import { HopeMode } from "@/lib/types";
import type { UserProfile } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Check,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b border-border">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
          {icon}
        </span>
        <div className="min-w-0 space-y-1">
          <CardTitle className="font-display text-base tracking-tight">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

function BusinessSettingsForm() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings(token);
    },
    enabled: !!actor && !isFetching,
  });

  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [taxRatePercent, setTaxRatePercent] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data || initialized) return;
    setName(data.name);
    setTaxId(data.taxId);
    setAddress(data.address);
    setPhone(data.phone);
    setTaxRatePercent(Number(data.taxRate).toString());
    setInitialized(true);
  }, [settingsQuery.data, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (settings: {
      name: string;
      taxId: string;
      address: string;
      phone: string;
      taxRate: bigint;
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateBusinessSettings(token, settings);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      toast.success("Datos del negocio guardados");
    },
    onError: (error) => {
      toast.error("No se pudieron guardar los datos", {
        description: errorMessage(error),
      });
    },
  });

  const taxRateNumber = Number(taxRatePercent.replace(",", "."));
  const taxRateValid =
    taxRatePercent.trim() !== "" &&
    Number.isFinite(taxRateNumber) &&
    taxRateNumber >= 0 &&
    taxRateNumber <= 100;
  const canSubmit =
    name.trim() !== "" && taxRateValid && !saveMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate({
      name: name.trim(),
      taxId: taxId.trim(),
      address: address.trim(),
      phone: phone.trim(),
      taxRate: BigInt(Math.round(taxRateNumber)),
    });
  }

  if (settingsQuery.isLoading) {
    return (
      <Card
        data-ocid="settings.business.card"
        className="rounded-lg shadow-none"
      >
        <SectionHeading
          icon={<Building2 className="size-4" aria-hidden="true" />}
          title="Datos del negocio y facturación"
          description="Información fiscal que aparece en las facturas emitidas."
        />
        <CardContent
          data-ocid="settings.business.loading_state"
          className="grid gap-4 pt-6 sm:grid-cols-2"
        >
          {Array.from({ length: 5 }, (_, i) => `business-skeleton-${i}`).map(
            (id) => (
              <div key={id} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    );
  }

  if (settingsQuery.isError) {
    return (
      <Card
        data-ocid="settings.business.card"
        className="rounded-lg shadow-none"
      >
        <SectionHeading
          icon={<Building2 className="size-4" aria-hidden="true" />}
          title="Datos del negocio y facturación"
          description="Información fiscal que aparece en las facturas emitidas."
        />
        <CardContent
          data-ocid="settings.business.error_state"
          className="flex flex-col items-start gap-3 pt-6"
        >
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No se pudieron cargar los datos del negocio.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void settingsQuery.refetch()}
            data-ocid="settings.business.retry_button"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-ocid="settings.business.card" className="rounded-lg shadow-none">
      <SectionHeading
        icon={<Building2 className="size-4" aria-hidden="true" />}
        title="Datos del negocio y facturación"
        description="Información fiscal que aparece en las facturas emitidas."
      />
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-2"
          data-ocid="settings.business.form"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="business-name">Nombre del negocio</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="HR SOLUCIONES INTEGRALES"
              autoComplete="organization"
              data-ocid="settings.business.name_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-tax-id">NIT / RUC</Label>
            <Input
              id="business-tax-id"
              value={taxId}
              onChange={(event) => setTaxId(event.target.value)}
              placeholder="900.123.456-7"
              className="data-rail"
              data-ocid="settings.business.tax_id_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-phone">Teléfono</Label>
            <Input
              id="business-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+57 300 000 0000"
              inputMode="tel"
              className="data-rail"
              data-ocid="settings.business.phone_input"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="business-address">Dirección</Label>
            <Input
              id="business-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Calle 45 #12-30, Bogotá"
              autoComplete="street-address"
              data-ocid="settings.business.address_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-tax-rate">Tasa de impuesto (%)</Label>
            <Input
              id="business-tax-rate"
              value={taxRatePercent}
              onChange={(event) => setTaxRatePercent(event.target.value)}
              placeholder="19"
              inputMode="decimal"
              aria-invalid={!taxRateValid}
              aria-describedby="business-tax-rate-help"
              className="data-rail"
              data-ocid="settings.business.tax_rate_input"
            />
            <p
              id="business-tax-rate-help"
              className="text-xs text-muted-foreground"
            >
              Se aplica al subtotal de cada factura. Ejemplo: 19 para 19%.
            </p>
            {!taxRateValid && (
              <p
                data-ocid="settings.business.tax_rate_error"
                className="text-xs text-destructive"
              >
                Ingresa un porcentaje entre 0 y 100.
              </p>
            )}
          </div>

          <div className="flex items-end justify-end sm:col-span-2">
            <Button
              type="submit"
              disabled={!canSubmit}
              data-ocid="settings.business.save_button"
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {saveMutation.isPending ? "Guardando…" : "Guardar datos"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CallerProfileCard() {
  const { actor, isFetching } = useBackend();
  const { user, roleName, token, refetch } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["caller-profile"],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const [displayName, setDisplayName] = useState("");
  const [initialized, setInitialized] = useState(false);

  const sessionName = user?.name ?? profileQuery.data?.name ?? "";
  const username = user?.username ?? "";
  const displayRole = user ? roleName : profileQuery.data ? roleName : "";

  useEffect(() => {
    if (initialized) return;
    if (user) {
      setDisplayName(user.name);
      setInitialized(true);
      return;
    }
    const data = profileQuery.data;
    if (!data) return;
    setDisplayName(data.name);
    setInitialized(true);
  }, [user, profileQuery.data, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!actor) throw new Error("Backend no disponible");
      // Con una sesión de usuario y contraseña, el nombre visible vive en la
      // credencial (el que aparece en el listado de usuarios); la vía de
      // Internet Identity sigue usando el perfil del llamador.
      if (token) {
        return actor.updateCallerName(token, value);
      }
      return actor.saveCallerUserProfile(value);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      void queryClient.invalidateQueries({ queryKey: ["users-page"] });
      refetch();
      toast.success("Nombre actualizado");
    },
    onError: (error) => {
      toast.error("No se pudo actualizar tu nombre", {
        description: errorMessage(error),
      });
    },
  });

  const canSubmit =
    displayName.trim() !== "" &&
    displayName.trim() !== sessionName &&
    !saveMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate(displayName.trim());
  }

  return (
    <Card data-ocid="settings.profile.card" className="rounded-lg shadow-none">
      <SectionHeading
        icon={<UserRound className="size-4" aria-hidden="true" />}
        title="Mi perfil"
        description="Tu nombre, usuario de acceso y rol en el taller."
      />
      <CardContent className="pt-6">
        {profileQuery.isLoading && !user ? (
          <div data-ocid="settings.profile.loading_state" className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full max-w-sm" />
          </div>
        ) : profileQuery.isError && !user ? (
          <div
            data-ocid="settings.profile.error_state"
            className="flex flex-col items-start gap-3"
          >
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              No se pudo cargar tu perfil.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void profileQuery.refetch()}
              data-ocid="settings.profile.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <dt className="field-label">Nombre</dt>
                <dd
                  data-ocid="settings.profile.name_value"
                  className="truncate text-sm font-medium"
                >
                  {sessionName || "Sin nombre"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="field-label">Usuario de acceso</dt>
                <dd
                  data-ocid="settings.profile.username_value"
                  className="users-username truncate"
                >
                  {username || "—"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="field-label">Rol</dt>
                <dd data-ocid="settings.profile.role_value" className="text-sm">
                  <span className="badge-role" data-role="custom">
                    {displayRole || "—"}
                  </span>
                </dd>
              </div>
            </dl>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-end"
              data-ocid="settings.profile.form"
            >
              <div className="w-full space-y-2 sm:max-w-sm">
                <Label htmlFor="profile-name">Nombre para mostrar</Label>
                <Input
                  id="profile-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  data-ocid="settings.profile.name_input"
                />
              </div>
              <Button
                type="submit"
                disabled={!canSubmit}
                data-ocid="settings.profile.save_button"
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                {saveMutation.isPending ? "Guardando…" : "Guardar nombre"}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChangePasswordCard() {
  const { actor } = useBackend();
  const { token } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const changeMutation = useMutation({
    mutationFn: async (input: {
      currentPassword: string;
      newPassword: string;
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      if (!token) {
        throw new Error(
          "Debes iniciar sesión con usuario y contraseña para cambiarla.",
        );
      }
      return actor.changeOwnPassword(
        token,
        input.currentPassword,
        input.newPassword,
      );
    },
    onSuccess: (changed) => {
      if (changed) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setFeedback({
          tone: "success",
          message: "Tu contraseña se actualizó correctamente.",
        });
        toast.success("Contraseña actualizada");
      } else {
        setFeedback({
          tone: "error",
          message:
            "La contraseña actual no es correcta. Verifícala e inténtalo de nuevo.",
        });
      }
    },
    onError: (error) => {
      setFeedback({ tone: "error", message: errorMessage(error) });
    },
  });

  const mismatch = confirmPassword !== "" && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword !== "" &&
    newPassword !== "" &&
    confirmPassword !== "" &&
    !mismatch &&
    !changeMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setFeedback(null);
    changeMutation.mutate({ currentPassword, newPassword });
  }

  return (
    <Card data-ocid="settings.password.card" className="rounded-lg shadow-none">
      <SectionHeading
        icon={<KeyRound className="size-4" aria-hidden="true" />}
        title="Cambiar contraseña"
        description="Actualiza la contraseña con la que ingresas a la aplicación."
      />
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          className="grid max-w-xl gap-4"
          data-ocid="settings.password.form"
        >
          <div className="space-y-2">
            <Label htmlFor="password-current">Contraseña actual</Label>
            <Input
              id="password-current"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              data-ocid="settings.password.current_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-new">Contraseña nueva</Label>
            <Input
              id="password-new"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              data-ocid="settings.password.new_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-confirm">Confirmar contraseña nueva</Label>
            <Input
              id="password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={mismatch}
              aria-describedby={mismatch ? "password-confirm-error" : undefined}
              data-ocid="settings.password.confirm_input"
            />
            {mismatch && (
              <p
                id="password-confirm-error"
                data-ocid="settings.password.confirm_error"
                className="text-xs text-destructive"
              >
                Las contraseñas nuevas no coinciden.
              </p>
            )}
          </div>

          {feedback && (
            <div
              data-ocid={
                feedback.tone === "success"
                  ? "settings.password.success_state"
                  : "settings.password.error_state"
              }
              className="auth-alert"
              data-tone={feedback.tone === "success" ? "info" : "error"}
            >
              {feedback.tone === "success" ? (
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!canSubmit}
              data-ocid="settings.password.submit_button"
              className="gap-2"
            >
              {changeMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="size-4" aria-hidden="true" />
              )}
              {changeMutation.isPending
                ? "Actualizando…"
                : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function HopeMessageCard() {
  const settingsQuery = useHopeSettings();
  const dailyQuery = useDailyHopeMessage();
  const saveMutation = useUpdateHopeSettings();

  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<HopeMode>(HopeMode.auto);
  const [manualText, setManualText] = useState("");
  const [manualCitation, setManualCitation] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data || initialized) return;
    setEnabled(data.enabled);
    setMode(data.mode);
    setManualText(data.manualText);
    setManualCitation(data.manualCitation);
    setInitialized(true);
  }, [settingsQuery.data, initialized]);

  const manualTextValid = manualText.trim() !== "";
  const manualCitationValid = manualCitation.trim() !== "";
  const manualValid = manualTextValid && manualCitationValid;
  const canSubmit =
    (mode === HopeMode.auto || manualValid) && !saveMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate(
      {
        enabled,
        mode,
        manualText: manualText.trim(),
        manualCitation: manualCitation.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Mensaje de esperanza guardado", {
            description:
              "Los documentos generados a partir de ahora usarán esta configuración.",
          });
        },
        onError: (error) => {
          toast.error("No se pudo guardar el mensaje de esperanza", {
            description: errorMessage(error),
          });
        },
      },
    );
  }

  const previewText =
    mode === HopeMode.manual
      ? manualText.trim()
      : (dailyQuery.data?.text ?? "");
  const previewCitation =
    mode === HopeMode.manual
      ? manualCitation.trim()
      : (dailyQuery.data?.citation ?? "");
  const previewDate =
    dailyQuery.data?.referenceDate ?? formatColombiaDateDDMMYYYY(new Date());

  if (settingsQuery.isLoading) {
    return (
      <Card data-ocid="settings.hope.card" className="rounded-lg shadow-none">
        <SectionHeading
          icon={<BookOpen className="size-4" aria-hidden="true" />}
          title="Mensaje de esperanza"
          description="Promesa bíblica que aparece en el pie de los documentos."
        />
        <CardContent
          data-ocid="settings.hope.loading_state"
          className="space-y-3 pt-6"
        >
          {Array.from({ length: 3 }, (_, i) => `hope-skeleton-${i}`).map(
            (id) => (
              <div key={id} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    );
  }

  if (settingsQuery.isError) {
    return (
      <Card data-ocid="settings.hope.card" className="rounded-lg shadow-none">
        <SectionHeading
          icon={<BookOpen className="size-4" aria-hidden="true" />}
          title="Mensaje de esperanza"
          description="Promesa bíblica que aparece en el pie de los documentos."
        />
        <CardContent
          data-ocid="settings.hope.error_state"
          className="flex flex-col items-start gap-3 pt-6"
        >
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No se pudo cargar la configuración del mensaje de esperanza.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void settingsQuery.refetch()}
            data-ocid="settings.hope.retry_button"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-ocid="settings.hope.card" className="rounded-lg shadow-none">
      <SectionHeading
        icon={<BookOpen className="size-4" aria-hidden="true" />}
        title="Mensaje de esperanza"
        description="Promesa bíblica que aparece en el pie de los documentos y mensajes."
      />
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]"
          data-ocid="settings.hope.form"
        >
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-secondary/40 px-3 py-3">
              <div className="min-w-0 space-y-1">
                <Label htmlFor="hope-enabled" className="text-sm font-medium">
                  Mostrar el mensaje en los formatos
                </Label>
                <p className="text-xs text-muted-foreground">
                  Actívalo para incluir la promesa en el pie de facturas,
                  cotizaciones y órdenes.
                </p>
              </div>
              <Switch
                id="hope-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                data-ocid="settings.hope.enabled_switch"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="field-label">Modo del mensaje</legend>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as HopeMode)}
                className="grid gap-3 sm:grid-cols-2"
                data-ocid="settings.hope.mode_radio"
              >
                <label
                  htmlFor="hope-mode-auto"
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:bg-secondary/40"
                >
                  <RadioGroupItem
                    id="hope-mode-auto"
                    value={HopeMode.auto}
                    className="mt-0.5"
                    data-ocid="settings.hope.mode_auto_radio"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="block text-sm font-medium">
                      Automático
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Rota una promesa distinta cada día.
                    </span>
                  </span>
                </label>
                <label
                  htmlFor="hope-mode-manual"
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:bg-secondary/40"
                >
                  <RadioGroupItem
                    id="hope-mode-manual"
                    value={HopeMode.manual}
                    className="mt-0.5"
                    data-ocid="settings.hope.mode_manual_radio"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="block text-sm font-medium">Manual</span>
                    <span className="block text-xs text-muted-foreground">
                      Usa siempre el texto y la cita que escribas.
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </fieldset>

            {mode === HopeMode.auto ? (
              <div
                data-ocid="settings.hope.auto_panel"
                className="space-y-2 rounded-md border border-border bg-secondary/30 px-3 py-3"
              >
                <p className="field-label">Promesa de hoy</p>
                {dailyQuery.isLoading ? (
                  <div
                    data-ocid="settings.hope.auto_loading_state"
                    className="space-y-2"
                  >
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : dailyQuery.isError ? (
                  <div
                    data-ocid="settings.hope.auto_error_state"
                    className="flex flex-col items-start gap-2"
                  >
                    <p className="text-sm text-destructive">
                      No se pudo cargar la promesa de hoy.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void dailyQuery.refetch()}
                      data-ocid="settings.hope.auto_retry_button"
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <blockquote className="space-y-1">
                    <p
                      data-ocid="settings.hope.auto_text"
                      className="text-sm italic text-foreground"
                    >
                      “{dailyQuery.data?.text ?? "—"}”
                    </p>
                    <footer
                      data-ocid="settings.hope.auto_citation"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {dailyQuery.data?.citation ?? "—"}
                    </footer>
                  </blockquote>
                )}
                <p className="text-xs text-muted-foreground">
                  La promesa cambia automáticamente cada día. No es editable en
                  este modo.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hope-manual-text">Texto del mensaje</Label>
                  <Textarea
                    id="hope-manual-text"
                    value={manualText}
                    onChange={(event) => setManualText(event.target.value)}
                    placeholder="Escribe la promesa que quieres mostrar…"
                    rows={3}
                    aria-invalid={!manualTextValid}
                    aria-describedby={
                      manualTextValid ? undefined : "hope-manual-text-error"
                    }
                    data-ocid="settings.hope.manual_text_input"
                  />
                  {!manualTextValid && (
                    <p
                      id="hope-manual-text-error"
                      data-ocid="settings.hope.manual_text_error"
                      className="text-xs text-destructive"
                    >
                      El texto del mensaje no puede estar vacío.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hope-manual-citation">Cita bíblica</Label>
                  <Input
                    id="hope-manual-citation"
                    value={manualCitation}
                    onChange={(event) => setManualCitation(event.target.value)}
                    placeholder="Juan 3:16"
                    aria-invalid={!manualCitationValid}
                    aria-describedby={
                      manualCitationValid
                        ? undefined
                        : "hope-manual-citation-error"
                    }
                    data-ocid="settings.hope.manual_citation_input"
                  />
                  {!manualCitationValid && (
                    <p
                      id="hope-manual-citation-error"
                      data-ocid="settings.hope.manual_citation_error"
                      className="text-xs text-destructive"
                    >
                      La cita bíblica no puede estar vacía.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!canSubmit}
                data-ocid="settings.hope.save_button"
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {saveMutation.isPending ? "Guardando…" : "Guardar mensaje"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="field-label">Vista previa en el pie del documento</p>
            <div
              data-ocid="settings.hope.preview"
              className="rounded-md border border-dashed border-border bg-card px-4 py-4"
            >
              {enabled ? (
                <div className="space-y-2 text-center">
                  <p className="text-sm italic text-foreground">
                    “{previewText || "—"}”
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {previewCitation || "—"}
                  </p>
                  <p className="border-t border-border pt-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {previewDate}
                  </p>
                </div>
              ) : (
                <p
                  data-ocid="settings.hope.preview_hidden"
                  className="text-center text-xs text-muted-foreground"
                >
                  El mensaje está oculto y no aparecerá en los documentos.
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Así se verá la promesa al final de cada documento generado.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UserManagementLinksCard() {
  return (
    <Card
      data-ocid="settings.user_management.card"
      className="rounded-lg shadow-none"
    >
      <SectionHeading
        icon={<Users className="size-4" aria-hidden="true" />}
        title="Usuarios y roles"
        description="La gestión de usuarios y roles ahora tiene sus propias pantallas."
      />
      <CardContent className="pt-6">
        <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">
            El primer usuario que inicia sesión queda como{" "}
            <span className="font-medium text-foreground">administrador</span>{" "}
            automáticamente. Los mecánicos pueden ver el inventario y crear
            órdenes, pero no acceden a costos, compras, cuentas por pagar ni
            configuración.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/configuracion/usuarios" data-ocid="settings.users.link">
              <Users className="size-4" aria-hidden="true" />
              Gestionar usuarios
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/configuracion/roles" data-ocid="settings.roles.link">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Gestionar roles
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div data-ocid="settings.page" className="mx-auto w-full max-w-5xl">
      <header className="mb-6 flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Administración
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos fiscales del negocio, impuestos, tu perfil y tu contraseña.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <BusinessSettingsForm />
        <HopeMessageCard />
        <ServiceTermsCard />
        <WarrantyTermsCard />
        <DriveBackupCard />
        <LocalBackupCard />
        <RestoreBackupCard />
        <CallerProfileCard />
        <ChangePasswordCard />
        <UserManagementLinksCard />
      </div>
    </div>
  );
}
