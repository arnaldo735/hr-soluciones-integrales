import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusTone } from "@/components/StatusBadge";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  APPOINTMENT_STATUS_BADGE,
  APPOINTMENT_STATUS_LABELS,
  useAppointments,
  useConvertAppointmentToOrder,
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments";
import { useBackend } from "@/hooks/use-backend";
import { useCustomers } from "@/hooks/use-customers";
import { useTechnicians } from "@/hooks/use-technicians";
import {
  colombiaDayKey,
  colombiaLocalToDate,
  colombiaTimeLabel,
  colombiaTimestamp,
  formatDate,
  formatDateTime,
  timestampToDate,
} from "@/lib/format";
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  Customer,
  DataColumn,
  Id,
  Motorcycle,
  RowAction,
  Technician,
} from "@/lib/types";
import {
  AppointmentStatus as AppointmentStatusEnum,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  List,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_TONE: Record<AppointmentStatus, StatusTone> = {
  [AppointmentStatusEnum.scheduled]: "scheduled",
  [AppointmentStatusEnum.confirmed]: "confirmed",
  [AppointmentStatusEnum.attended]: "attended",
  [AppointmentStatusEnum.noShow]: "noshow",
  [AppointmentStatusEnum.cancelled]: "cancelled",
};

const STATUS_ORDER: AppointmentStatus[] = [
  AppointmentStatusEnum.scheduled,
  AppointmentStatusEnum.confirmed,
  AppointmentStatusEnum.attended,
  AppointmentStatusEnum.noShow,
  AppointmentStatusEnum.cancelled,
];

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Build the 42-cell (6 week) grid for a month, starting on Monday. */
function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(start);
    cell.setDate(start.getDate() + index);
    return cell;
  });
}

interface FormState {
  customerId: string;
  motorcycleId: string;
  technicianId: string;
  date: string;
  time: string;
  duration: string;
  reason: string;
}

const EMPTY_FORM: FormState = {
  customerId: "",
  motorcycleId: "",
  technicianId: "",
  date: "",
  time: "09:00",
  duration: "60",
  reason: "",
};

function toFormState(appointment: Appointment | null): FormState {
  if (!appointment) return EMPTY_FORM;
  const date = timestampToDate(appointment.scheduledAt);
  return {
    customerId: appointment.customerId.toString(),
    motorcycleId: appointment.motorcycleId.toString(),
    technicianId: appointment.technicianId?.toString() ?? "",
    date: date ? colombiaDayKey(date) : "",
    time: date ? colombiaTimeLabel(date) : "09:00",
    duration: appointment.durationMinutes.toString(),
    reason: appointment.reason,
  };
}

/** Delays a fast-changing value so the customer search hits the backend calmly. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Search box used by the appointment customer picker. The directory is only
 * queried once the user types, so the box doubles as the picker's empty state.
 */
function CustomerSearch({
  value,
  onChange,
  ocid,
}: {
  value: string;
  onChange: (value: string) => void;
  ocid: string;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por nombre, teléfono o placa…"
        aria-label="Buscar cliente por nombre, teléfono o placa"
        data-ocid={ocid}
        className="h-9 pl-8 text-sm"
      />
    </div>
  );
}

/**
 * Prompt shown by the customer picker before the user types. The directory is
 * only searched on demand, so nothing is listed until there is a term.
 */
function CustomerPrompt({
  ocid,
  children,
}: { ocid: string; children: string }) {
  return (
    <p
      data-ocid={ocid}
      className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground"
    >
      {children}
    </p>
  );
}

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  technicians: Technician[];
}

function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  technicians,
}: AppointmentFormDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);

  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const isEditing = appointment !== null;
  const isPending = createAppointment.isPending || updateAppointment.isPending;

  // Seed the draft once per open target, never from a refetch.
  const seedKey = open ? (appointment?.id.toString() ?? "new") : null;
  if (seedKey !== seededFor) {
    setSeededFor(seedKey);
    setForm(toFormState(appointment));
    setError(null);
    setCustomerSearch("");
  }

  const { actor, isFetching } = useBackend();
  const selectedCustomerId =
    form.customerId === "" ? null : BigInt(form.customerId);

  const customersQuery = useCustomers(debouncedCustomerSearch);
  const customerTerm = debouncedCustomerSearch.trim();
  const customerResults = customersQuery.data ?? [];
  const customers = customerTerm.length > 0 ? customerResults : [];
  const selectedCustomer =
    customerResults.find((customer) => customer.id === selectedCustomerId) ??
    null;

  const motorcyclesQuery = useQuery({
    queryKey: ["appointment-form-motorcycles", form.customerId],
    queryFn: async (): Promise<Motorcycle[]> => {
      if (!actor || selectedCustomerId === null) return [];
      return actor.listMotorcycles(selectedCustomerId);
    },
    enabled: open && !!actor && !isFetching && selectedCustomerId !== null,
    // A customer's motorcycles are stable, so the list is reused while the
    // dialog is reopened for the same customer.
    staleTime: Number.POSITIVE_INFINITY,
  });

  const motorcycles = motorcyclesQuery.data ?? [];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = form.reason.trim();
    const scheduledAt = colombiaTimestamp(form.date, form.time);

    if (form.customerId === "" || form.motorcycleId === "") {
      setError("Selecciona el cliente y la moto de la cita.");
      return;
    }
    if (scheduledAt === null) {
      setError("Indica una fecha y hora válidas para la cita.");
      return;
    }
    if (reason === "") {
      setError("Describe el motivo de la cita.");
      return;
    }
    setError(null);

    const input: AppointmentInput = {
      customerId: BigInt(form.customerId),
      motorcycleId: BigInt(form.motorcycleId),
      technicianId:
        form.technicianId === "" ? undefined : BigInt(form.technicianId),
      scheduledAt,
      durationMinutes: BigInt(form.duration),
      reason,
    };

    if (isEditing && appointment) {
      updateAppointment.mutate(
        { id: appointment.id, input },
        {
          onSuccess: () => {
            toast.success("Cita actualizada");
            onOpenChange(false);
          },
          onError: () => setError("No se pudo guardar la cita."),
        },
      );
      return;
    }

    createAppointment.mutate(input, {
      onSuccess: () => {
        toast.success("Cita agendada");
        onOpenChange(false);
      },
      onError: () => setError("No se pudo agendar la cita."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="appointments.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar cita" : "Nueva cita"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza el cliente, la moto, el horario o el técnico asignado."
              : "Agenda un servicio vinculando cliente, moto, horario y técnico."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appointment-customer-search">Cliente</Label>
            <CustomerSearch
              value={customerSearch}
              onChange={setCustomerSearch}
              ocid="appointments.customer_search_input"
            />
            {customerTerm.length === 0 ? (
              <CustomerPrompt ocid="appointments.customer_search.prompt_state">
                Escribe el nombre, el teléfono o la placa del cliente para ver
                coincidencias.
              </CustomerPrompt>
            ) : customersQuery.isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : customersQuery.isError ? (
              <p
                data-ocid="appointments.customer_search.error_state"
                className="text-xs text-destructive"
              >
                No se pudo cargar el directorio de clientes. Inténtalo de nuevo.
              </p>
            ) : customers.length === 0 ? (
              <p
                data-ocid="appointments.customer_search.empty_state"
                className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
              >
                {`Sin clientes que coincidan con “${customerTerm}”.`}
              </p>
            ) : (
              <ul
                data-ocid="appointments.customer_search.list"
                className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1"
              >
                {customers.map((customer, index) => {
                  const isSelected = customer.id === selectedCustomerId;
                  return (
                    <li key={customer.id.toString()}>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            customerId: customer.id.toString(),
                            motorcycleId: "",
                          }));
                          setError(null);
                        }}
                        aria-pressed={isSelected}
                        data-ocid={`appointments.customer_search.item.${index + 1}`}
                        className={
                          isSelected
                            ? "flex w-full items-center justify-between gap-3 rounded-sm border border-primary/40 bg-primary/5 px-2.5 py-2 text-left transition-colors focus-visible:outline-none"
                            : "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                        }
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {customer.name}
                          </span>
                          <span className="data-rail mt-0.5 block truncate text-xs text-muted-foreground">
                            {customer.phone}
                          </span>
                        </span>
                        {isSelected ? (
                          <Check
                            className="size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {selectedCustomer ? (
              <div
                data-ocid="appointments.customer_selected"
                className="flex items-start justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Cliente seleccionado
                  </p>
                  <p className="truncate text-sm font-medium">
                    {selectedCustomer.name}
                  </p>
                  <p className="data-rail truncate text-xs text-muted-foreground">
                    {selectedCustomer.phone}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      customerId: "",
                      motorcycleId: "",
                    }));
                    setError(null);
                  }}
                  aria-label="Cambiar el cliente seleccionado"
                  data-ocid="appointments.clear_customer_button"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-motorcycle">Moto</Label>
            <Select
              value={form.motorcycleId === "" ? undefined : form.motorcycleId}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, motorcycleId: value }))
              }
              disabled={form.customerId === "" || motorcycles.length === 0}
            >
              <SelectTrigger
                id="appointment-motorcycle"
                data-ocid="appointments.motorcycle_select"
                className="w-full"
              >
                <SelectValue
                  placeholder={
                    form.customerId === ""
                      ? "Elige primero un cliente"
                      : motorcyclesQuery.isLoading
                        ? "Cargando motos…"
                        : motorcycles.length === 0
                          ? "El cliente no tiene motos registradas"
                          : "Selecciona una moto"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {motorcycles.map((motorcycle) => (
                  <SelectItem
                    key={motorcycle.id.toString()}
                    value={motorcycle.id.toString()}
                  >
                    {motorcycle.brand} {motorcycle.model} · {motorcycle.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="appointment-date">Fecha</Label>
              <Input
                id="appointment-date"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
                className="data-rail"
                data-ocid="appointments.date_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appointment-time">Hora</Label>
              <Input
                id="appointment-time"
                type="time"
                value={form.time}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }
                className="data-rail"
                data-ocid="appointments.time_input"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="appointment-duration">Duración</Label>
              <Select
                value={form.duration}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, duration: value }))
                }
              >
                <SelectTrigger
                  id="appointment-duration"
                  data-ocid="appointments.duration_select"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((minutes) => (
                    <SelectItem key={minutes} value={minutes.toString()}>
                      {minutes} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appointment-technician">Técnico asignado</Label>
              <Select
                value={form.technicianId === "" ? "none" : form.technicianId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    technicianId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger
                  id="appointment-technician"
                  data-ocid="appointments.technician_select"
                  className="w-full"
                >
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem
                      key={technician.id.toString()}
                      value={technician.id.toString()}
                    >
                      {technician.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointment-reason">Motivo</Label>
            <Textarea
              id="appointment-reason"
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Ej. Servicio de afinación y cambio de aceite"
              rows={3}
              data-ocid="appointments.reason_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="appointments.form.error_state"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="appointments.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-ocid="appointments.submit_button"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isEditing ? "Guardar cambios" : "Agendar cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ListSkeleton() {
  const rows = Array.from(
    { length: 6 },
    (_, i) => `appointments-skeleton-${i}`,
  );
  return (
    <div
      data-ocid="appointments.loading_state"
      className="space-y-2 p-4"
      aria-busy
    >
      {rows.map((id) => (
        <Skeleton key={id} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [cursor, setCursor] = useState(() => new Date());

  const fromTimestamp = useMemo(() => {
    if (fromDate === "") return null;
    const parsed = colombiaLocalToDate(`${fromDate}T00:00`);
    return parsed ? BigInt(parsed.getTime()) * 1_000_000n : null;
  }, [fromDate]);

  const toTimestampValue = useMemo(() => {
    if (toDate === "") return null;
    const parsed = colombiaLocalToDate(`${toDate}T23:59`);
    return parsed ? BigInt(parsed.getTime() + 59_000) * 1_000_000n : null;
  }, [toDate]);

  const { data, isLoading, isError, refetch } = useAppointments({
    status: statusFilter === "all" ? null : statusFilter,
    technicianId: technicianFilter === "all" ? null : BigInt(technicianFilter),
    from: fromTimestamp,
    to: toTimestampValue,
  });

  const appointments = data ?? [];

  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly: false,
  });
  const technicians = techniciansQuery.data ?? [];

  // The agenda lists appointments across the whole directory, so it resolves
  // customer names from the unfiltered directory rather than a search term.
  const customersQuery = useCustomers("");
  const customers = customersQuery.data ?? [];

  const customerNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const customer of customers) {
      map.set(customer.id.toString(), customer.name);
    }
    return map;
  }, [customers]);

  const technicianNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const technician of technicians) {
      map.set(technician.id.toString(), technician.name);
    }
    return map;
  }, [technicians]);

  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const convertToOrder = useConvertAppointmentToOrder();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (appointment: Appointment) => {
    setEditing(appointment);
    setDialogOpen(true);
  };

  const changeStatus = (
    appointment: Appointment,
    status: AppointmentStatus,
  ) => {
    updateStatus.mutate(
      { id: appointment.id, status },
      {
        onSuccess: () =>
          toast.success(
            `Cita marcada como ${APPOINTMENT_STATUS_LABELS[status]}`,
          ),
        onError: () =>
          toast.error("No se pudo actualizar el estado de la cita."),
      },
    );
  };

  const handleDelete = (appointment: Appointment) => {
    deleteAppointment.mutate(appointment.id, {
      onSuccess: () => toast.success("Cita eliminada"),
      onError: () => toast.error("No se pudo eliminar la cita."),
    });
  };

  const handleConvert = (appointment: Appointment) => {
    convertToOrder.mutate(appointment.id, {
      onSuccess: (order) =>
        toast.success(`Orden ${order.order.orderNumber} creada desde la cita`),
      onError: () => toast.error("No se pudo convertir la cita en orden."),
    });
  };

  const columns: Array<DataColumn<Appointment>> = [
    {
      key: "scheduledAt",
      header: "Fecha y hora",
      render: (appointment) => (
        <div className="space-y-0.5">
          <p className="data-rail text-sm font-medium">
            {formatDateTime(appointment.scheduledAt)}
          </p>
          <p className="data-rail text-xs text-muted-foreground">
            {appointment.durationMinutes.toString()} min
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      render: (appointment) => (
        <span className="text-sm">
          {customerNames.get(appointment.customerId.toString()) ??
            `Cliente #${appointment.customerId.toString()}`}
        </span>
      ),
    },
    {
      key: "technician",
      header: "Técnico",
      render: (appointment) => (
        <span className="text-sm text-muted-foreground">
          {appointment.technicianId
            ? (technicianNames.get(appointment.technicianId.toString()) ??
              `Técnico #${appointment.technicianId.toString()}`)
            : "Sin asignar"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Motivo",
      render: (appointment) => (
        <span className="block max-w-[18rem] truncate text-sm text-muted-foreground">
          {appointment.reason}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (appointment) => (
        <StatusBadge
          label={APPOINTMENT_STATUS_LABELS[appointment.status]}
          tone={STATUS_TONE[appointment.status]}
        />
      ),
    },
  ];

  const actions: Array<RowAction<Appointment>> = [
    {
      kind: "edit",
      label: "Editar cita",
      onClick: openEdit,
    },
    {
      kind: "save",
      label: "Confirmar cita",
      onClick: (appointment) =>
        changeStatus(appointment, AppointmentStatusEnum.confirmed),
      hidden: (appointment) =>
        appointment.status !== AppointmentStatusEnum.scheduled,
    },
    {
      kind: "save",
      label: "Marcar como atendida",
      onClick: (appointment) =>
        changeStatus(appointment, AppointmentStatusEnum.attended),
      hidden: (appointment) =>
        appointment.status !== AppointmentStatusEnum.confirmed,
    },
    {
      kind: "cancel",
      label: "Cancelar cita",
      onClick: (appointment) =>
        changeStatus(appointment, AppointmentStatusEnum.cancelled),
      hidden: (appointment) =>
        appointment.status === AppointmentStatusEnum.cancelled ||
        appointment.status === AppointmentStatusEnum.attended,
    },
    {
      kind: "delete",
      label: "Eliminar cita",
      onClick: handleDelete,
    },
  ];

  const monthGrid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of appointments) {
      const date = timestampToDate(appointment.scheduledAt);
      if (!date) continue;
      const key = colombiaDayKey(date);
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(appointment);
      } else {
        map.set(key, [appointment]);
      }
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => Number(a.scheduledAt - b.scheduledAt));
    }
    return map;
  }, [appointments]);

  const todayKey = colombiaDayKey(new Date());
  const monthLabel = `${MONTH_LABELS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const shiftMonth = (delta: number) => {
    setCursor(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  };

  const hasFilters =
    statusFilter !== "all" ||
    technicianFilter !== "all" ||
    fromDate !== "" ||
    toDate !== "";

  return (
    <div
      data-ocid="appointments.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Taller"
        title="Citas"
        description="Agenda de servicios por técnico, día y motocicleta. Confirma, atiende o convierte una cita en orden de taller."
        actions={
          <Button
            type="button"
            onClick={openCreate}
            data-ocid="appointments.open_modal_button"
            className="gap-2"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Nueva cita
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              data-ocid="appointments.view.tabs"
              className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5"
            >
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                data-ocid="appointments.view.list_tab"
                className={
                  view === "list"
                    ? "inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth"
                    : "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
                }
              >
                <List className="size-3.5" aria-hidden="true" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setView("calendar")}
                aria-pressed={view === "calendar"}
                data-ocid="appointments.view.calendar_tab"
                className={
                  view === "calendar"
                    ? "inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-smooth"
                    : "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-smooth hover:text-foreground"
                }
              >
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Calendario
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as AppointmentStatus | "all")
                }
              >
                <SelectTrigger
                  data-ocid="appointments.status_select"
                  className="h-9 w-[11rem]"
                  aria-label="Filtrar por estado"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {STATUS_ORDER.map((status) => (
                    <SelectItem key={status} value={status}>
                      {APPOINTMENT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={technicianFilter}
                onValueChange={setTechnicianFilter}
              >
                <SelectTrigger
                  data-ocid="appointments.technician_filter_select"
                  className="h-9 w-[11rem]"
                  aria-label="Filtrar por técnico"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los técnicos</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem
                      key={technician.id.toString()}
                      value={technician.id.toString()}
                    >
                      {technician.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label
                htmlFor="appointments-from"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Desde
              </Label>
              <Input
                id="appointments-from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="data-rail h-9 w-[10.5rem]"
                data-ocid="appointments.from_input"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="appointments-to"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Hasta
              </Label>
              <Input
                id="appointments-to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="data-rail h-9 w-[10.5rem]"
                data-ocid="appointments.to_input"
              />
            </div>
            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setTechnicianFilter("all");
                  setFromDate("");
                  setToDate("");
                }}
                data-ocid="appointments.clear_filters_button"
                className="gap-1.5 text-muted-foreground"
              >
                <X className="size-3.5" aria-hidden="true" />
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        </div>

        {isError ? (
          <div
            data-ocid="appointments.error_state"
            className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          >
            <AlertTriangle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                No se pudieron cargar las citas
              </p>
              <p className="text-xs text-muted-foreground">
                Verifica la conexión con el backend e inténtalo de nuevo.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch({ cancelRefetch: true })}
              data-ocid="appointments.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <ListSkeleton />
        ) : view === "list" ? (
          appointments.length === 0 ? (
            <div
              data-ocid="appointments.empty_state"
              className="flex flex-col items-center gap-3 px-6 py-16 text-center"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted/40">
                <CalendarDays
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">
                  {hasFilters ? "Sin resultados" : "Aún no hay citas"}
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  {hasFilters
                    ? "Ajusta el rango de fechas, el estado o el técnico para encontrar la cita."
                    : "Agenda la primera cita para organizar el trabajo del taller por día y técnico."}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openCreate}
                data-ocid="appointments.empty_state.new_appointment_button"
              >
                Nueva cita
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={appointments}
              rowKey={(appointment) => appointment.id.toString()}
              actions={actions}
              rowExtraActions={(appointment, index) => (
                <WhatsAppNotifyButton
                  contactKind={WhatsAppContactKind.customer}
                  contactId={appointment.customerId}
                  context={WhatsAppContext.appointment}
                  referenceId={appointment.id}
                  contactName={
                    customerNames.get(appointment.customerId.toString()) ??
                    `Cliente #${appointment.customerId.toString()}`
                  }
                  ocid={`appointments.whatsapp_button.${index + 1}`}
                />
              )}
              ocid="appointments"
              caption={`${appointments.length} citas`}
            />
          )
        ) : (
          <div data-ocid="appointments.calendar" className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => shiftMonth(-1)}
                aria-label="Mes anterior"
                data-ocid="appointments.calendar_prev"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <p className="font-display text-sm font-semibold capitalize">
                {monthLabel}
              </p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => shiftMonth(1)}
                aria-label="Mes siguiente"
                data-ocid="appointments.calendar_next"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="overflow-hidden rounded-md border border-border">
              <div className="calendar-grid border-b border-border bg-muted/40">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="calendar-grid">
                {monthGrid.map((day) => {
                  const key = colombiaDayKey(day);
                  const inMonth = day.getMonth() === cursor.getMonth();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const dayAppointments = appointmentsByDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      data-weekend={isWeekend}
                      data-today={key === todayKey}
                      className={
                        inMonth ? "calendar-cell" : "calendar-cell opacity-45"
                      }
                    >
                      <span className="calendar-daynum">{day.getDate()}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayAppointments.slice(0, 3).map((appointment) => (
                          <button
                            key={appointment.id.toString()}
                            type="button"
                            onClick={() => openEdit(appointment)}
                            title={`${colombiaTimeLabel(
                              timestampToDate(appointment.scheduledAt) ??
                                new Date(),
                            )} · ${appointment.reason}`}
                            className={`calendar-event ${APPOINTMENT_STATUS_BADGE[appointment.status]}`}
                          >
                            {colombiaTimeLabel(
                              timestampToDate(appointment.scheduledAt) ??
                                new Date(),
                            )}{" "}
                            {appointment.reason}
                          </button>
                        ))}
                        {dayAppointments.length > 3 ? (
                          <p className="px-1.5 text-[10px] text-muted-foreground">
                            +{dayAppointments.length - 3} más
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {appointments.length === 0 ? (
              <p
                data-ocid="appointments.calendar.empty_state"
                className="mt-3 text-center text-xs text-muted-foreground"
              >
                No hay citas en el rango seleccionado. Ajusta los filtros o
                agenda una nueva cita.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {appointments.some(
        (appointment) => appointment.status === AppointmentStatusEnum.attended,
      ) ? (
        <div className="rounded-lg border border-border bg-card p-4 shadow-subtle">
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-display text-sm font-semibold">
              Citas atendidas listas para orden de taller
            </h2>
          </div>
          <ul className="space-y-2">
            {appointments
              .filter(
                (appointment) =>
                  appointment.status === AppointmentStatusEnum.attended,
              )
              .map((appointment, index) => (
                <li
                  key={appointment.id.toString()}
                  data-ocid={`appointments.convert.item.${index + 1}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-medium">
                      {customerNames.get(appointment.customerId.toString()) ??
                        `Cliente #${appointment.customerId.toString()}`}
                    </p>
                    <p className="data-rail text-xs text-muted-foreground">
                      {formatDate(appointment.scheduledAt)} ·{" "}
                      {appointment.reason}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleConvert(appointment)}
                    disabled={convertToOrder.isPending}
                    data-ocid={`appointments.convert_button.${index + 1}`}
                    className="gap-1.5"
                  >
                    {convertToOrder.isPending ? (
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ClipboardList className="size-3.5" aria-hidden="true" />
                    )}
                    Convertir en orden
                  </Button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editing}
        technicians={technicians}
      />
    </div>
  );
}

export default AppointmentsPage;
