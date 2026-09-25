import { DriveBackupCard } from "@/components/DriveBackupCard";
import { LocalBackupCard } from "@/components/LocalBackupCard";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBackend } from "@/hooks/use-backend";
import { formatDate, formatPrincipal } from "@/lib/format";
import type { BusinessSettings, UserProfile, UserView } from "@/lib/types";
import { UserRole } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Check,
  Loader2,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.admin]: "Administrador",
  [UserRole.user]: "Mecánico",
  [UserRole.guest]: "Invitado",
};

const ROLE_ORDER: UserRole[] = [UserRole.admin, UserRole.user, UserRole.guest];

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case UserRole.admin:
      return "border-primary/40 bg-primary/10 text-primary";
    case UserRole.user:
      return "border-info/40 bg-info/10 text-info";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

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
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["business-settings"],
    queryFn: async (): Promise<BusinessSettings> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getBusinessSettings();
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
    mutationFn: async (settings: BusinessSettings) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateBusinessSettings(settings);
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

function CallerProfileCard() {
  const { actor, isFetching } = useBackend();
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

  useEffect(() => {
    const data = profileQuery.data;
    if (!data || initialized) return;
    setDisplayName(data.name);
    setInitialized(true);
  }, [profileQuery.data, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.saveCallerUserProfile(value);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Nombre actualizado");
    },
    onError: (error) => {
      toast.error("No se pudo actualizar tu nombre", {
        description: errorMessage(error),
      });
    },
  });

  const canSubmit = displayName.trim() !== "" && !saveMutation.isPending;

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
        description="El nombre con el que apareces en las órdenes y movimientos."
      />
      <CardContent className="pt-6">
        {profileQuery.isLoading ? (
          <div data-ocid="settings.profile.loading_state" className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full max-w-sm" />
          </div>
        ) : profileQuery.isError ? (
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
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
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
        )}
      </CardContent>
    </Card>
  );
}

function UsersTable() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UserView[]> => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });

  const roleMutation = useMutation({
    mutationFn: async (input: {
      principal: UserView["principal"];
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setUserRole(input.principal, input.role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["caller-role"] });
      toast.success("Rol actualizado");
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el rol", {
        description: errorMessage(error),
      });
    },
  });

  const users = usersQuery.data ?? [];

  return (
    <Card data-ocid="settings.users.card" className="rounded-lg shadow-none">
      <SectionHeading
        icon={<Users className="size-4" aria-hidden="true" />}
        title="Usuarios y roles"
        description="Asigna el rol de cada persona registrada en el taller."
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

        {usersQuery.isLoading ? (
          <div data-ocid="settings.users.loading_state" className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => `users-skeleton-${i}`).map(
              (id) => (
                <Skeleton key={id} className="h-11 w-full" />
              ),
            )}
          </div>
        ) : usersQuery.isError ? (
          <div
            data-ocid="settings.users.error_state"
            className="flex flex-col items-start gap-3"
          >
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              No se pudo cargar la lista de usuarios.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void usersQuery.refetch()}
              data-ocid="settings.users.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div
            data-ocid="settings.users.empty_state"
            className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-6 py-10 text-center"
          >
            <Users
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-display text-sm font-medium">
              Aún no hay usuarios registrados
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Cuando alguien inicie sesión por primera vez aparecerá aquí para
              que le asignes un rol.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <Table data-ocid="settings.users.table">
              <TableHeader className="bg-secondary/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider">
                    Usuario
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Principal
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Rol
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">
                    Registro
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">
                    Asignar rol
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow
                    key={user.principal.toString()}
                    data-ocid={`settings.users.row.${index + 1}`}
                  >
                    <TableCell className="font-medium">
                      {user.name || "Sin nombre"}
                    </TableCell>
                    <TableCell className="data-rail text-xs text-muted-foreground">
                      {formatPrincipal(user.principal.toString())}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={roleBadgeClass(user.role)}
                      >
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular text-xs text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          roleMutation.mutate({
                            principal: user.principal,
                            role: value as UserRole,
                          })
                        }
                        disabled={roleMutation.isPending}
                      >
                        <SelectTrigger
                          size="sm"
                          className="ml-auto w-[150px]"
                          aria-label={`Rol de ${user.name || "usuario"}`}
                          data-ocid={`settings.users.role_select.${index + 1}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_ORDER.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
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
          Datos fiscales del negocio, impuestos y gestión de usuarios y roles.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <BusinessSettingsForm />
        <DriveBackupCard />
        <LocalBackupCard />
        <CallerProfileCard />
        <UsersTable />
      </div>
    </div>
  );
}
