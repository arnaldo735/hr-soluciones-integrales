import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DataColumn, RowAction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Pencil, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

const ACTION_ICON: Record<RowAction<unknown>["kind"], LucideIcon> = {
  edit: Pencil,
  save: Check,
  cancel: X,
  delete: Trash2,
};

interface DataTableProps<T> {
  columns: Array<DataColumn<T>>;
  rows: T[];
  /** Stable identity for each row, used as the React key. */
  rowKey: (row: T) => string;
  /** Row actions rendered in the trailing actions column. */
  actions?: Array<RowAction<T>>;
  /**
   * Extra per-row controls rendered inside the actions cluster, after the
   * standard actions. Used for controls that are not simple icon actions,
   * such as the WhatsApp notification button.
   */
  rowExtraActions?: (row: T, index: number) => React.ReactNode;
  /** Called when a row body is activated (keyboard or click). */
  onRowClick?: (row: T) => void;
  /** ocid prefix for deterministic markers, e.g. `services`. */
  ocid: string;
  /** Message shown when there are no rows. */
  emptyMessage?: string;
  /** Optional caption rendered above the table. */
  caption?: string;
}

/**
 * Shared data table with sticky headers, right-aligned numeric columns and a
 * trailing row-action cluster (editar, guardar, cancelar, eliminar). Delete
 * actions always require an explicit confirmation.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  rowExtraActions,
  onRowClick,
  ocid,
  emptyMessage = "Sin registros todavía.",
  caption,
}: DataTableProps<T>) {
  const [pendingDelete, setPendingDelete] = useState<{
    row: T;
    action: RowAction<T>;
  } | null>(null);

  const hasActions = (!!actions && actions.length > 0) || !!rowExtraActions;

  const runAction = (row: T, action: RowAction<T>) => {
    if (action.kind === "delete") {
      setPendingDelete({ row, action });
      return;
    }
    action.onClick(row);
  };

  return (
    <div
      data-ocid={`${ocid}.table`}
      className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
    >
      {caption ? (
        <p className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {caption}
        </p>
      ) : null}

      <div className="scroll-slim overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
                    column.numeric && "text-right",
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
              {hasActions ? (
                <TableHead className="w-px text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Acciones
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  data-ocid={`${ocid}.empty_state`}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const key = rowKey(row);
                return (
                  <TableRow
                    key={key}
                    data-ocid={`${ocid}.row.${index + 1}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(onRowClick && "cursor-pointer")}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(column.numeric && "text-right tabular")}
                      >
                        {column.render(row)}
                      </TableCell>
                    ))}
                    {hasActions ? (
                      <TableCell className="text-right">
                        <div className="row-actions" data-pinned="false">
                          {actions
                            ?.filter((action) => !action.hidden?.(row))
                            .map((action) => {
                              const Icon = ACTION_ICON[action.kind];
                              const disabled = action.disabled?.(row) ?? false;
                              return (
                                <button
                                  key={action.kind}
                                  type="button"
                                  title={action.label}
                                  aria-label={action.label}
                                  disabled={disabled}
                                  data-variant={
                                    action.kind === "delete"
                                      ? "destructive"
                                      : action.kind === "save"
                                        ? "confirm"
                                        : undefined
                                  }
                                  data-ocid={`${ocid}.${action.kind}_button.${index + 1}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    runAction(row, action);
                                  }}
                                  className="row-action disabled:pointer-events-none disabled:opacity-40"
                                >
                                  <Icon
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                </button>
                              );
                            })}
                          {rowExtraActions?.(row, index)}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent data-ocid={`${ocid}.delete_dialog`}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro se quitará de forma
              permanente del taller.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid={`${ocid}.cancel_button`}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid={`${ocid}.confirm_button`}
              onClick={() => {
                if (pendingDelete)
                  pendingDelete.action.onClick(pendingDelete.row);
                setPendingDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
