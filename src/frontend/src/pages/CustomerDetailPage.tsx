import { ContactDocumentPreview } from "@/components/ContactDocumentPreview";
import { CustomerFormDialog } from "@/components/CustomerFormDialog";
import { MotorcycleFormDialog } from "@/components/MotorcycleFormDialog";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomerDetail } from "@/hooks/use-customers";
import { customerContactDocument, motorcycleRow } from "@/hooks/use-whatsapp";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { Id, Motorcycle } from "@/lib/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  ClipboardList,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `detail-skeleton-${i}`,
);

function DetailSkeleton() {
  return (
    <div data-ocid="customer_detail.loading_state" className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
      {SKELETON_IDS.map((id) => (
        <Skeleton key={id} className="h-10 w-full" />
      ))}
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p
          className={
            mono
              ? "data-rail truncate text-sm text-foreground"
              : "truncate text-sm text-foreground"
          }
        >
          {value}
        </p>
      </div>
    </div>
  );
}

interface MotorcycleRowProps {
  motorcycle: Motorcycle;
  index: number;
  onEdit: (motorcycle: Motorcycle) => void;
}

/** Fila memoizada de la tabla de motos para evitar re-renders masivos. */
const MotorcycleRow = memo(function MotorcycleRow({
  motorcycle,
  index,
  onEdit,
}: MotorcycleRowProps) {
  return (
    <TableRow data-ocid={`motorcycle.row.${index + 1}`}>
      <TableCell className="px-4">
        <span className="data-rail rounded border border-border bg-muted px-2 py-0.5 text-xs font-medium">
          {motorcycle.plate}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {motorcycle.brand}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {motorcycle.model}
      </TableCell>
      <TableCell className="data-rail text-right text-muted-foreground">
        {motorcycle.year.toString()}
      </TableCell>
      <TableCell className="data-rail text-right">
        {formatNumber(motorcycle.mileage)} km
      </TableCell>
      <TableCell className="px-4 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Editar moto ${motorcycle.plate}`}
          onClick={() => onEdit(motorcycle)}
          data-ocid={`motorcycle.edit_button.${index + 1}`}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

export function CustomerDetailPage() {
  const params = useParams({ from: "/clientes/$id" });
  const customerId: Id | null = (() => {
    try {
      return BigInt(params.id);
    } catch {
      return null;
    }
  })();

  const { data, isLoading, isError, refetch, isFetching } =
    useCustomerDetail(customerId);

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [motorcycleDialogOpen, setMotorcycleDialogOpen] = useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = useState<Motorcycle | null>(
    null,
  );

  // La ficha imprimible se arma una sola vez por cliente/motos cargados, no en
  // cada render de la página.
  const contactDocument = useMemo(
    () =>
      data
        ? customerContactDocument(
            data.customer,
            data.motorcycles.map(motorcycleRow),
          )
        : null,
    [data],
  );

  const openCreateMotorcycle = useCallback(() => {
    setEditingMotorcycle(null);
    setMotorcycleDialogOpen(true);
  }, []);

  const openEditMotorcycle = useCallback((motorcycle: Motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setMotorcycleDialogOpen(true);
  }, []);

  const retryDetail = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl animate-fade-in space-y-5">
        <DetailSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="customer_detail.error_state"
        className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10">
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">
            No se pudo cargar el cliente
          </h2>
          <p className="text-sm text-muted-foreground">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={retryDetail}
            disabled={isFetching}
            data-ocid="customer_detail.retry_button"
            className="gap-2"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isFetching ? "Reintentando…" : "Reintentar"}
          </Button>
          <Button
            asChild
            variant="ghost"
            data-ocid="customer_detail.back_button"
          >
            <Link to="/clientes">Volver al directorio</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        data-ocid="customer_detail.empty_state"
        className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-md border border-border bg-muted">
          <UserRound
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">
            Cliente no encontrado
          </h2>
          <p className="text-sm text-muted-foreground">
            El cliente que buscas no existe o fue eliminado del directorio.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          data-ocid="customer_detail.back_button"
        >
          <Link to="/clientes">Volver al directorio</Link>
        </Button>
      </div>
    );
  }

  const { customer, motorcycles, orders } = data;

  return (
    <div
      data-ocid="customer_detail.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <Link
        to="/clientes"
        data-ocid="customer_detail.back_link"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Directorio de clientes
      </Link>

      <header className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10">
              <UserRound className="size-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Ficha de cliente
              </p>
              <h1 className="truncate font-display text-2xl font-semibold tracking-tight">
                {customer.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                Cliente desde {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contactDocument ? (
              <ContactDocumentPreview
                document={contactDocument}
                ocid="customer_detail.preview_button"
                label="Ver ficha"
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomerDialogOpen(true)}
              data-ocid="customer_detail.edit_button"
              className="gap-2"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Editar datos
            </Button>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <ContactRow
            icon={Phone}
            label="Teléfono"
            value={customer.phone}
            mono
          />
          <ContactRow
            icon={Mail}
            label="Correo"
            value={customer.email ?? "—"}
          />
          <ContactRow
            icon={FileText}
            label="Documento"
            value={customer.document ?? "—"}
            mono
          />
          <ContactRow
            icon={Bike}
            label="Motos registradas"
            value={formatNumber(motorcycles.length)}
            mono
          />
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bike className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-display text-sm font-semibold">Motocicletas</h2>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={openCreateMotorcycle}
            data-ocid="motorcycle.open_modal_button"
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Agregar moto
          </Button>
        </div>

        {motorcycles.length === 0 ? (
          <div
            data-ocid="motorcycle.empty_state"
            className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <Bike
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                Sin motos registradas
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Agrega la primera motocicleta de este cliente para abrir órdenes
                de taller.
              </p>
            </div>
          </div>
        ) : (
          <Table data-ocid="motorcycle.table">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Placa</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Año</TableHead>
                <TableHead className="text-right">Kilometraje</TableHead>
                <TableHead className="w-16 px-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motorcycles.map((motorcycle, index) => (
                <MotorcycleRow
                  key={motorcycle.id.toString()}
                  motorcycle={motorcycle}
                  index={index}
                  onEdit={openEditMotorcycle}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
          <ClipboardList className="size-4 text-primary" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold">
            Historial de órdenes
          </h2>
        </div>

        {orders.length === 0 ? (
          <div
            data-ocid="customer_orders.empty_state"
            className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <ClipboardList
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                Sin órdenes de taller
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Este cliente todavía no tiene órdenes registradas.
              </p>
            </div>
          </div>
        ) : (
          <Table data-ocid="customer_orders.table">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4">Número</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order, index) => (
                <TableRow
                  key={order.orderId.toString()}
                  data-ocid={`customer_orders.row.${index + 1}`}
                >
                  <TableCell className="px-4">
                    <Link
                      to="/ordenes/$id"
                      params={{ id: order.orderId.toString() }}
                      data-ocid={`customer_orders.link.${index + 1}`}
                      className="data-rail font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <span className="data-rail text-xs text-muted-foreground">
                      {order.motorcyclePlate}
                    </span>
                  </TableCell>
                  <TableCell className="data-rail text-right font-medium">
                    {formatMoney(order.total)}
                  </TableCell>
                  <TableCell className="data-rail text-right text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <CustomerFormDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={customer}
      />

      {customerId !== null ? (
        <MotorcycleFormDialog
          open={motorcycleDialogOpen}
          onOpenChange={setMotorcycleDialogOpen}
          customerId={customerId}
          motorcycle={editingMotorcycle}
        />
      ) : null}
    </div>
  );
}
