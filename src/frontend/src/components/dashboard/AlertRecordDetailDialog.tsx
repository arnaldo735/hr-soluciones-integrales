import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

/**
 * Tipos de registro que puede mostrar el detalle anidado. Cada alerta del panel
 * mapea a uno de estos tipos y cada tipo conoce sus propios campos.
 */
export type AlertRecordKind =
  | "order"
  | "appointment"
  | "quote"
  | "part"
  | "receivable"
  | "payable"
  | "supplierOrder"
  | "overdueInstallment";

/** Registro normalizado que el detalle sabe renderizar. */
export interface AlertRecord {
  kind: AlertRecordKind;
  /** Identidad estable del registro dentro de su sección. */
  key: string;
  /** Título principal del registro. */
  title: string;
  /** Línea secundaria breve (placa, estado, etc.). */
  subtitle?: string;
  /** Campos etiquetados que se muestran en la ficha. */
  fields: Array<{ label: string; value: string }>;
}

interface AlertRecordDetailDialogProps {
  /** Registro seleccionado; `null` mantiene el diálogo cerrado. */
  record: AlertRecord | null;
  /** Ruta del módulo completo para profundizar. */
  moduleTo: string;
  /** Etiqueta del módulo destino. */
  moduleLabel: string;
  onOpenChange: (open: boolean) => void;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

/**
 * Detalle de un registro de alerta. Se abre anidado sobre la lista del modal
 * de alerta, dentro del mismo marco del panel, y ofrece un enlace al módulo
 * completo para profundizar. No incluye acciones rápidas.
 */
export function AlertRecordDetailDialog({
  record,
  moduleTo,
  moduleLabel,
  onOpenChange,
}: AlertRecordDetailDialogProps) {
  return (
    <Dialog open={record !== null} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="dashboard.record_detail.dialog"
        className="max-h-[85vh] overflow-y-auto sm:max-w-md"
      >
        {record ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{record.title}</DialogTitle>
              <DialogDescription>
                {record.subtitle ?? "Detalle del registro"}
              </DialogDescription>
            </DialogHeader>

            <dl
              data-ocid="dashboard.record_detail.fields"
              className="rounded-md border border-border bg-card px-3 py-1"
            >
              {record.fields.map((field) => (
                <FieldRow
                  key={field.label}
                  label={field.label}
                  value={field.value}
                />
              ))}
            </dl>

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-ocid="dashboard.record_detail.back_button"
              >
                Volver a la lista
              </Button>
              <Button asChild data-ocid="dashboard.record_detail.module_link">
                <Link to={moduleTo}>
                  Ir a {moduleLabel}
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Utilidad de render para etiquetas de estado en español. */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    scheduled: "Programada",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
    inProgress: "En proceso",
    draft: "Borrador",
    sent: "Enviada",
    accepted: "Aceptada",
    paid: "Pagada",
    overdue: "Vencida",
    open: "Abierta",
    partial: "Abono parcial",
  };
  return labels[status] ?? status;
}
