import { DataTable } from "@/components/DataTable";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBackend } from "@/hooks/use-backend";
import { useOrders } from "@/hooks/use-orders";
import {
  useCreateTechnician,
  useDeleteTechnician,
  useTechnicianWorkloads,
  useTechnicians,
  useUpdateTechnician,
} from "@/hooks/use-technicians";
import { formatMoney, formatTaxRate } from "@/lib/format";
import type {
  DataColumn,
  Id,
  OrderView,
  RowAction,
  Technician,
  TechnicianInput,
  TechnicianWorkload,
} from "@/lib/types";
import { OrderStatus } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardList,
  Gauge,
  Pencil,
  Plus,
  Search,
  UserCog,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const ALL_SPECIALTY = "__all__";

const SKELETON_IDS = Array.from(
  { length: 5 },
  (_, index) => `technician-skeleton-${index}`,
);

/** Active workshop stages — an order in one of these still occupies a bay. */
const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.received,
  OrderStatus.inRepair,
  OrderStatus.ready,
];

interface TechnicianFormState {
  code: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  hourlyRate: string;
  commissionRate: string;
  active: boolean;
}

const EMPTY_FORM: TechnicianFormState = {
  code: "",
  name: "",
  phone: "",
  email: "",
  specialty: "",
  hourlyRate: "",
  commissionRate: "",
  active: true,
};

function toFormState(technician: Technician): TechnicianFormState {
  return {
    code: technician.code,
    name: technician.name,
    phone: technician.phone,
    email: technician.email ?? "",
    specialty: technician.specialty,
    hourlyRate: (Number(technician.hourlyRate) / 100).toFixed(2),
    commissionRate: technician.commissionRate.toString(),
    active: technician.active,
  };
}

/** Parses a decimal peso amount into backend integer cents. */
function parseRateToCents(value: string): bigint | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return BigInt(Math.round(amount * 100));
}

/** Parses a whole-percentage commission into the backend's 0–100 bigint. */
function parseCommission(value: string): bigint | null {
  const normalized = value.trim().replace(",", ".");
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100) return null;
  return BigInt(Math.round(amount));
}

function toTechnicianInput(form: TechnicianFormState): TechnicianInput | null {
  const code = form.code.trim();
  const name = form.name.trim();
  const phone = form.phone.trim();
  const specialty = form.specialty.trim();
  const email = form.email.trim();
  const hourlyRate = parseRateToCents(form.hourlyRate);
  const commissionRate = parseCommission(form.commissionRate);
  if (
    code === "" ||
    name === "" ||
    phone === "" ||
    specialty === "" ||
    hourlyRate === null ||
    commissionRate === null
  ) {
    return null;
  }
  return {
    code,
    name,
    phone,
    specialty,
    hourlyRate,
    commissionRate,
    active: form.active,
    email: email === "" ? undefined : email,
  };
}

/** Spanish message for a duplicate technician code rejected by the backend. */
function duplicateCodeMessage(error: Error, code: string): string | null {
  const message = error.message ?? "";
  if (!/c[oó]digo/i.test(message)) return null;
  return `Ya existe un técnico con el código ${code}. Usa un código distinto.`;
}

/** Distinct specialties present in the current technician list. */
function specialtyOptions(technicians: Technician[]): string[] {
  const values = new Set<string>();
  for (const technician of technicians) {
    const specialty = technician.specialty.trim();
    if (specialty !== "") values.add(specialty);
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b, "es"));
}

function TechnicianDialog({
  open,
  onOpenChange,
  technician,
  specialties,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: Technician | null;
  specialties: string[];
}) {
  const [form, setForm] = useState<TechnicianFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const createTechnician = useCreateTechnician();
  const updateTechnician = useUpdateTechnician();

  const isEditing = technician !== null;
  const isPending = createTechnician.isPending || updateTechnician.isPending;

  // Populate the form from the controlled `open` prop and the technician being
  // edited. Radix does not call onOpenChange when the controlled `open` prop
  // flips, so the population must be driven by the prop itself.
  useEffect(() => {
    if (!open) return;
    setForm(technician ? toFormState(technician) : EMPTY_FORM);
    setError(null);
  }, [open, technician]);

  function update<K extends keyof TechnicianFormState>(
    key: K,
    value: TechnicianFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = toTechnicianInput(form);
    if (input === null) {
      setError(
        "Completa el código, el nombre, el teléfono, la especialidad, una tarifa por hora válida y una comisión entre 0 y 100.",
      );
      return;
    }
    setError(null);
    const onSuccess = () => {
      toast.success(
        isEditing ? "Técnico actualizado" : "Técnico registrado en el taller",
      );
      onOpenChange(false);
    };
    const onError = (mutationError: Error) => {
      setError(
        duplicateCodeMessage(mutationError, input.code) ??
          mutationError.message ??
          "No se pudo guardar el técnico. Inténtalo de nuevo.",
      );
    };
    if (technician) {
      updateTechnician.mutate(
        { id: technician.id, input },
        { onSuccess, onError },
      );
      return;
    }
    createTechnician.mutate(input, { onSuccess, onError });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="technicians.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar técnico" : "Nuevo técnico"}
          </DialogTitle>
          <DialogDescription>
            Código de identificación, datos de contacto, especialidad, tarifa
            por hora y comisión sobre la mano de obra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="technician-code">Código de identificación</Label>
              <Input
                id="technician-code"
                value={form.code}
                onChange={(event) => update("code", event.target.value)}
                placeholder="TEC-001"
                autoComplete="off"
                data-ocid="technicians.code_input"
                className="data-rail uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">
                Único por técnico; se muestra junto a su nombre en las órdenes.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technician-name">Nombre completo</Label>
              <Input
                id="technician-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Marco Antonio Ríos"
                data-ocid="technicians.name_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technician-phone">Teléfono</Label>
              <Input
                id="technician-phone"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="81 8123 4567"
                data-ocid="technicians.phone_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technician-email">Correo</Label>
              <Input
                id="technician-email"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="marco.rios@taller.co"
                data-ocid="technicians.email_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technician-specialty">Especialidad</Label>
              <Input
                id="technician-specialty"
                value={form.specialty}
                onChange={(event) => update("specialty", event.target.value)}
                placeholder="Motores y transmisión"
                list="technician-specialty-options"
                data-ocid="technicians.specialty_input"
                required
              />
              <datalist id="technician-specialty-options">
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technician-rate">Tarifa por hora (COP)</Label>
              <Input
                id="technician-rate"
                inputMode="decimal"
                value={form.hourlyRate}
                onChange={(event) => update("hourlyRate", event.target.value)}
                placeholder="180.00"
                data-ocid="technicians.rate_input"
                className="data-rail"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="technician-commission">
                Comisión sobre mano de obra (%)
              </Label>
              <Input
                id="technician-commission"
                inputMode="numeric"
                min={0}
                max={100}
                value={form.commissionRate}
                onChange={(event) =>
                  update("commissionRate", event.target.value)
                }
                placeholder="10"
                data-ocid="technicians.commission_input"
                className="data-rail"
                required
              />
              <p className="text-xs text-muted-foreground">
                Porcentaje que se paga al técnico sobre la mano de obra que
                realiza.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 sm:col-span-2">
              <div className="space-y-0.5">
                <Label htmlFor="technician-active">Técnico activo</Label>
                <p className="text-xs text-muted-foreground">
                  Los técnicos inactivos no reciben nuevas órdenes de taller.
                </p>
              </div>
              <Switch
                id="technician-active"
                checked={form.active}
                onCheckedChange={(checked) => update("active", checked)}
                data-ocid="technicians.active_switch"
              />
            </div>
          </div>

          {error ? (
            <p
              data-ocid="technicians.form_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="technicians.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="technicians.submit_button"
            >
              {isPending
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Registrar técnico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TableSkeleton() {
  return (
    <div data-ocid="technicians.loading_state" className="space-y-2 p-4">
      {SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-11 w-full" />
      ))}
    </div>
  );
}

function WorkloadSkeleton() {
  return (
    <div
      data-ocid="technicians.workload.loading_state"
      className="space-y-2 p-4"
    >
      {SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-20 w-full" />
      ))}
    </div>
  );
}

function ActiveOrderList({ orders }: { orders: OrderView[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Sin órdenes activas asignadas.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {orders.map((view) => (
        <li
          key={view.order.id.toString()}
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          <Link
            to="/ordenes/$id"
            params={{ id: view.order.id.toString() }}
            className="data-rail font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            {view.order.orderNumber}
          </Link>
          <OrderStatusBadge status={view.order.status} />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {view.order.problem}
          </span>
        </li>
      ))}
    </ul>
  );
}

function WorkloadCard({
  workload,
  orders,
  isLoadingOrders,
}: {
  workload: TechnicianWorkload;
  orders: OrderView[];
  isLoadingOrders: boolean;
}) {
  const { technician } = workload;
  const activeCount = Number(workload.activeOrders);
  return (
    <Card
      data-ocid={`technicians.workload.card.${technician.id.toString()}`}
      className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none"
    >
      <span
        aria-hidden="true"
        className={
          activeCount > 0
            ? "absolute inset-y-0 left-0 w-0.5 bg-primary"
            : "absolute inset-y-0 left-0 w-0.5 bg-border"
        }
      />
      <CardContent className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {technician.code}
              </span>
              <p className="truncate font-display text-sm font-semibold">
                {technician.name}
              </p>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {technician.specialty}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge
              label={technician.active ? "Activo" : "Inactivo"}
              tone={technician.active ? "accepted" : "neutral"}
            />
            <Badge
              variant="outline"
              className="data-rail border-border bg-background text-muted-foreground"
            >
              {activeCount} {activeCount === 1 ? "orden" : "órdenes"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="data-rail">{technician.phone}</span>
          <span className="data-rail">
            {formatMoney(technician.hourlyRate)} / hora
          </span>
          <span className="data-rail text-primary">
            Comisión {formatTaxRate(technician.commissionRate)}
          </span>
        </div>

        {isLoadingOrders ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <ActiveOrderList orders={orders} />
        )}
      </CardContent>
    </Card>
  );
}

export function TechniciansPage() {
  const { actor, isFetching } = useBackend();
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";

  const [search, setSearch] = useState(urlTerm);
  const [specialty, setSpecialty] = useState<string>(ALL_SPECIALTY);
  const [activeOnly, setActiveOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setSearch(urlTerm);
  }, [urlTerm]);

  const applySearch = useCallback(
    (value: string) => {
      void navigate({
        to: "/tecnicos",
        search: (prev: Record<string, unknown>) => {
          const { q: _previous, ...rest } = prev;
          return value === "" ? rest : { ...rest, q: value };
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (search === urlTerm) return;
    const handle = window.setTimeout(() => applySearch(search), 300);
    return () => window.clearTimeout(handle);
  }, [search, urlTerm, applySearch]);

  const techniciansQuery = useTechnicians({
    search,
    specialty: specialty === ALL_SPECIALTY ? null : specialty,
    activeOnly,
  });
  const workloadsQuery = useTechnicianWorkloads();
  const deleteTechnician = useDeleteTechnician();

  const technicians = techniciansQuery.data ?? [];
  const workloads = workloadsQuery.data ?? [];
  const specialties = specialtyOptions(technicians);
  const hasFilters =
    search.trim() !== "" || specialty !== ALL_SPECIALTY || activeOnly;

  const activeCount = technicians.filter((entry) => entry.active).length;
  const totalActiveOrders = workloads.reduce(
    (sum, entry) => sum + Number(entry.activeOrders),
    0,
  );

  // Active orders for every technician, resolved in one pass so the workload
  // view can render each technician's assigned orders without N queries.
  const activeOrdersQuery = useQuery({
    queryKey: ["technician-active-orders"],
    queryFn: async (): Promise<OrderView[]> => {
      if (!actor) return [];
      const pages = await Promise.all(
        ACTIVE_ORDER_STATUSES.map((status) =>
          actor.listOrders({ status }, 0n, 200n),
        ),
      );
      return pages.flatMap((page) => page.items);
    },
    enabled: !!actor && !isFetching,
    // Shared by the workload tab and the active-orders KPI; kept fresh for the
    // session and refreshed only by an explicit retry.
    staleTime: Number.POSITIVE_INFINITY,
  });

  const activeOrders = activeOrdersQuery.data ?? [];

  function ordersFor(technicianId: Id): OrderView[] {
    return activeOrders.filter((view) =>
      view.order.technicianIds.some((id) => id === technicianId),
    );
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(technician: Technician) {
    setEditing(technician);
    setDialogOpen(true);
  }

  function handleDelete(technician: Technician) {
    deleteTechnician.mutate(technician.id, {
      onSuccess: () => toast.success("Técnico eliminado del taller"),
      onError: (error: Error) =>
        toast.error(
          error.message ||
            "No se pudo eliminar el técnico. Inténtalo de nuevo.",
        ),
    });
  }

  function clearFilters() {
    setSearch("");
    setSpecialty(ALL_SPECIALTY);
    setActiveOnly(false);
    applySearch("");
  }

  const columns: Array<DataColumn<Technician>> = [
    {
      key: "name",
      header: "Técnico",
      render: (technician) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
            <UserCog
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {technician.code}
              </span>
              <p className="truncate font-medium">{technician.name}</p>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {technician.email ?? "Sin correo registrado"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "specialty",
      header: "Especialidad",
      render: (technician) => (
        <span className="text-muted-foreground">{technician.specialty}</span>
      ),
    },
    {
      key: "phone",
      header: "Contacto",
      render: (technician) => (
        <span className="data-rail text-muted-foreground">
          {technician.phone}
        </span>
      ),
    },
    {
      key: "hourlyRate",
      header: "Tarifa / hora",
      numeric: true,
      render: (technician) => (
        <span className="data-rail font-semibold">
          {formatMoney(technician.hourlyRate)}
        </span>
      ),
    },
    {
      key: "commissionRate",
      header: "Comisión",
      numeric: true,
      render: (technician) => (
        <span className="data-rail font-semibold text-primary">
          {formatTaxRate(technician.commissionRate)}
        </span>
      ),
    },
    {
      key: "activeOrders",
      header: "Órdenes activas",
      numeric: true,
      render: (technician) => {
        const workload = workloads.find(
          (entry) => entry.technician.id === technician.id,
        );
        return (
          <span className="data-rail text-muted-foreground">
            {workload ? Number(workload.activeOrders) : 0}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (technician) => (
        <StatusBadge
          label={technician.active ? "Activo" : "Inactivo"}
          tone={technician.active ? "accepted" : "neutral"}
        />
      ),
    },
  ];

  const actions: Array<RowAction<Technician>> = [
    {
      kind: "edit",
      label: "Editar técnico",
      onClick: openEdit,
    },
    {
      kind: "delete",
      label: "Eliminar técnico",
      onClick: handleDelete,
    },
  ];

  return (
    <div
      data-ocid="technicians.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Taller"
        title="Técnicos"
        description="Equipo de taller con código de identificación, especialidades, tarifas, comisión sobre mano de obra y carga de trabajo."
        actions={
          <Button
            type="button"
            onClick={openCreate}
            data-ocid="technicians.open_modal_button"
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo técnico
          </Button>
        }
      />

      <section
        data-ocid="technicians.kpi.section"
        aria-label="Resumen del equipo de taller"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-0.5 bg-primary"
          />
          <CardContent className="space-y-1 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Técnicos
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {techniciansQuery.isLoading ? "—" : technicians.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {techniciansQuery.isLoading
                ? "Cargando plantilla"
                : `${activeCount} activos en piso`}
            </p>
          </CardContent>
        </Card>
        <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-0.5 bg-info"
          />
          <CardContent className="space-y-1 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Especialidades
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {techniciansQuery.isLoading ? "—" : specialties.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Áreas cubiertas por el equipo
            </p>
          </CardContent>
        </Card>
        <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-0.5 bg-warning"
          />
          <CardContent className="space-y-1 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Órdenes activas
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {workloadsQuery.isLoading ? "—" : totalActiveOrders}
            </p>
            <p className="text-xs text-muted-foreground">
              Trabajo asignado en este momento
            </p>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="list" data-ocid="technicians.tabs">
        <TabsList>
          <TabsTrigger value="list" data-ocid="technicians.tab.list">
            <Users className="size-3.5" aria-hidden="true" />
            Listado
          </TabsTrigger>
          <TabsTrigger value="workload" data-ocid="technicians.tab.workload">
            <Gauge className="size-3.5" aria-hidden="true" />
            Carga de trabajo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por código, nombre, teléfono o especialidad…"
                aria-label="Buscar técnicos"
                data-ocid="technicians.search_input"
                className="h-9 pl-9"
              />
            </div>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger
                aria-label="Filtrar por especialidad"
                data-ocid="technicians.specialty_select"
                className="h-9 w-[13rem]"
              >
                <SelectValue placeholder="Especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SPECIALTY}>
                  Todas las especialidades
                </SelectItem>
                {specialties.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label
              htmlFor="technicians-active-only"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <Switch
                id="technicians-active-only"
                checked={activeOnly}
                onCheckedChange={setActiveOnly}
                data-ocid="technicians.active_only_switch"
              />
              Solo activos
            </label>
            <Badge
              variant="outline"
              data-ocid="technicians.count_badge"
              className="data-rail border-border bg-background text-muted-foreground"
            >
              {techniciansQuery.isLoading
                ? "…"
                : `${technicians.length} técnicos`}
            </Badge>
          </div>

          {techniciansQuery.isError ? (
            <div
              data-ocid="technicians.error_state"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10">
                <AlertTriangle
                  className="size-5 text-destructive"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">
                  No se pudo cargar la plantilla
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Verifica la conexión con el backend e inténtalo de nuevo.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void techniciansQuery.refetch()}
                data-ocid="technicians.retry_button"
              >
                Reintentar
              </Button>
            </div>
          ) : techniciansQuery.isLoading ? (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
              <TableSkeleton />
            </div>
          ) : technicians.length === 0 ? (
            <div
              data-ocid="technicians.empty_state"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
                <Users
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">
                  {hasFilters ? "Sin resultados" : "Aún no hay técnicos"}
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  {hasFilters
                    ? "Ningún técnico coincide con los filtros. Ajusta la búsqueda, la especialidad o el estado."
                    : "Registra a tu primer técnico para asignar órdenes de taller y controlar su carga de trabajo."}
                </p>
              </div>
              {hasFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  data-ocid="technicians.clear_filters_button"
                >
                  Limpiar filtros
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={openCreate}
                  data-ocid="technicians.empty_create_button"
                  className="gap-1.5"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Nuevo técnico
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              ocid="technicians"
              columns={columns}
              rows={technicians}
              rowKey={(technician) => technician.id.toString()}
              actions={actions}
            />
          )}
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          {workloadsQuery.isError ? (
            <div
              data-ocid="technicians.workload.error_state"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10">
                <AlertTriangle
                  className="size-5 text-destructive"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">
                  No se pudo cargar la carga de trabajo
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Verifica la conexión con el backend e inténtalo de nuevo.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void workloadsQuery.refetch()}
                data-ocid="technicians.workload.retry_button"
              >
                Reintentar
              </Button>
            </div>
          ) : workloadsQuery.isLoading ? (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
              <WorkloadSkeleton />
            </div>
          ) : workloads.length === 0 ? (
            <div
              data-ocid="technicians.workload.empty_state"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
                <ClipboardList
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">
                  Sin carga de trabajo registrada
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Registra técnicos y asígnalos a órdenes de taller para ver su
                  carga aquí.
                </p>
              </div>
            </div>
          ) : (
            <div
              data-ocid="technicians.workload.list"
              className="grid gap-4 lg:grid-cols-2"
            >
              {workloads.map((workload) => (
                <WorkloadCard
                  key={workload.technician.id.toString()}
                  workload={workload}
                  orders={ordersFor(workload.technician.id)}
                  isLoadingOrders={activeOrdersQuery.isLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Pencil className="size-3" aria-hidden="true" />
        Usa las acciones de cada fila para editar o eliminar un técnico. La
        eliminación siempre pide confirmación.
      </p>

      <TechnicianDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        technician={editing}
        specialties={specialties}
      />
    </div>
  );
}

export default TechniciansPage;
