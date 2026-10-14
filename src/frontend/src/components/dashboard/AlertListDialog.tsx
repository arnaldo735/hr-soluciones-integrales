import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { CheckCircle2, ChevronRight, Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  type AlertRecord,
  AlertRecordDetailDialog,
} from "./AlertRecordDetailDialog";

interface AlertListDialogProps {
  /** Título de la alerta; `null` mantiene el diálogo cerrado. */
  title: string | null;
  /** Mensaje en español del conteo de la alerta. */
  message: string;
  /** Conteo total de la sección (puede superar los ítems devueltos). */
  count: bigint;
  /** Ícono de la alerta. */
  icon: LucideIcon;
  /** Registros ya cargados por el panel; no dispara consultas nuevas. */
  records: AlertRecord[];
  /** Ruta del módulo completo para profundizar. */
  moduleTo: string;
  /** Etiqueta del módulo destino. */
  moduleLabel: string;
  /** `true` mientras el resumen del panel se está cargando. */
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Restaura el foco al cerrar el diálogo. El panel abre este diálogo por
   * estado controlado (sin `DialogTrigger`), así que Radix no tiene un
   * disparador al cual devolver el foco; el panel lo restaura a la tarjeta.
   */
  onCloseAutoFocus?: (event: Event) => void;
}

function RecordRow({
  record,
  index,
  onSelect,
}: {
  record: AlertRecord;
  index: number;
  onSelect: (record: AlertRecord) => void;
}) {
  return (
    <li>
      <button
        type="button"
        data-ocid={`dashboard.alert_list.item.${index + 1}`}
        onClick={() => onSelect(record)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {record.title}
          </span>
          {record.subtitle ? (
            <span className="block truncate text-xs text-muted-foreground">
              {record.subtitle}
            </span>
          ) : null}
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

function ListSkeleton() {
  const rows = Array.from({ length: 4 }, (_, i) => `alert-list-skeleton-${i}`);
  return (
    <div
      data-ocid="dashboard.alert_list.loading_state"
      className="space-y-2"
      aria-busy="true"
      aria-hidden="true"
    >
      {rows.map((rowId) => (
        <div
          key={rowId}
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-3"
        >
          <span className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </span>
          <Skeleton className="size-4 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

/**
 * Lista de registros de una alerta del panel. Se abre dentro del mismo marco
 * del panel (sin cambiar de ruta) y reutiliza los datos ya cargados por
 * `useDashboardAlerts`. Cada fila abre un detalle anidado. No incluye filtros
 * ni búsqueda.
 */
export function AlertListDialog({
  title,
  message,
  count,
  icon: Icon,
  records,
  moduleTo,
  moduleLabel,
  isLoading,
  onOpenChange,
  onCloseAutoFocus,
}: AlertListDialogProps) {
  const [selected, setSelected] = useState<AlertRecord | null>(null);
  const open = title !== null;
  const hasRecords = records.length > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected(null);
    onOpenChange(next);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          data-ocid="dashboard.alert_list.dialog"
          className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
          onCloseAutoFocus={onCloseAutoFocus}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              {Icon ? (
                <Icon className="size-5 text-primary" aria-hidden="true" />
              ) : null}
              {title}
            </DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <ListSkeleton />
          ) : hasRecords ? (
            <ul
              data-ocid="dashboard.alert_list.list"
              className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card"
            >
              {records.map((record, index) => (
                <RecordRow
                  key={record.key}
                  record={record}
                  index={index}
                  onSelect={setSelected}
                />
              ))}
            </ul>
          ) : (
            <div
              data-ocid="dashboard.alert_list.empty_state"
              className="flex flex-col items-center gap-2 rounded-md border border-border bg-card px-6 py-10 text-center"
            >
              <Inbox
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Sin registros por ahora</p>
              <p className="text-xs text-muted-foreground">
                Esta alerta no tiene registros pendientes.
              </p>
            </div>
          )}

          {!isLoading && hasRecords && count > BigInt(records.length) ? (
            <p
              data-ocid="dashboard.alert_list.more_notice"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
              Se muestran {formatNumber(BigInt(records.length))} de{" "}
              {formatNumber(count)} registros. Abre el módulo para verlos todos.
            </p>
          ) : null}

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-ocid="dashboard.alert_list.close_button"
            >
              Cerrar
            </Button>
            <Button asChild data-ocid="dashboard.alert_list.module_link">
              <a href={moduleTo}>Ver módulo completo</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertRecordDetailDialog
        record={selected}
        moduleTo={moduleTo}
        moduleLabel={moduleLabel}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
      />
    </>
  );
}
