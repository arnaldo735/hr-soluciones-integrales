import { PageHeader } from "@/components/PageHeader";
import { CashBalancesPanel } from "@/components/cash/CashBalancesPanel";
import { CashMovementDialog } from "@/components/cash/CashMovementDialog";
import { CashMovementsTable } from "@/components/cash/CashMovementsTable";
import { CloseShiftDialog } from "@/components/cash/CloseShiftDialog";
import { OpenShiftDialog } from "@/components/cash/OpenShiftDialog";
import { ShiftHistoryTable } from "@/components/cash/ShiftHistoryTable";
import { ShiftReportDialog } from "@/components/cash/ShiftReportDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpenShift } from "@/hooks/use-cash";
import type { Id } from "@/lib/types";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  LockOpen,
  Printer,
} from "lucide-react";
import { useCallback, useState } from "react";

/**
 * Caja y Bancos: turnos, movimientos por medio de pago e informe diario.
 *
 * The page is organized in two tabs. "Turno actual" shows the live balances of
 * the open shift, the actions to open/close it and register movements, and the
 * shift's movement ledger. "Historial" lists closed shifts and opens each
 * one's printable daily report.
 */
export function CajaBancosPage() {
  const openShiftQuery = useOpenShift();
  const shift = openShiftQuery.data ?? null;

  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = useState(false);
  const [movementDialog, setMovementDialog] = useState(false);
  const [reportShiftId, setReportShiftId] = useState<Id | null>(null);

  const openReport = useCallback((shiftId: Id) => {
    setReportShiftId(shiftId);
  }, []);

  const closeReport = useCallback(() => {
    setReportShiftId(null);
  }, []);

  const isShiftOpen = shift !== null && shift.status === "open";

  return (
    <div
      data-ocid="caja.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Caja y bancos"
        description="Turnos de caja, movimientos por medio de pago e informe diario del turno. El efectivo afecta Caja; la transferencia y la tarjeta afectan Bancos."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isShiftOpen ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMovementDialog(true)}
                  data-ocid="caja.register_movement_button"
                  className="gap-1.5"
                >
                  <ArrowUpCircle className="size-4" aria-hidden="true" />
                  Registrar movimiento
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReportShiftId(shift.id)}
                  data-ocid="caja.view_report_button"
                  className="gap-1.5"
                >
                  <Printer className="size-4" aria-hidden="true" />
                  Informe del turno
                </Button>
                <Button
                  type="button"
                  onClick={() => setCloseShiftDialog(true)}
                  data-ocid="caja.close_shift_button"
                  className="gap-1.5"
                >
                  <Lock className="size-4" aria-hidden="true" />
                  Cerrar turno
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setOpenShiftDialog(true)}
                disabled={openShiftQuery.isLoading}
                data-ocid="caja.open_shift_button"
                className="gap-1.5"
              >
                <LockOpen className="size-4" aria-hidden="true" />
                Abrir turno
              </Button>
            )}
          </div>
        }
      />

      <CashBalancesPanel
        shift={shift}
        isLoading={openShiftQuery.isLoading}
        isError={openShiftQuery.isError}
      />

      {isShiftOpen ? (
        <div
          data-ocid="caja.open_shift.notice"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle"
        >
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDownCircle
              className="size-4 text-success"
              aria-hidden="true"
            />
            Los ingresos por transferencia suman a Bancos; los pagos por
            transferencia se descuentan de Bancos.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setMovementDialog(true)}
            data-ocid="caja.register_movement_inline_button"
            className="gap-1.5"
          >
            <ArrowUpCircle className="size-4" aria-hidden="true" />
            Registrar movimiento
          </Button>
        </div>
      ) : null}

      <Tabs defaultValue="current" data-ocid="caja.tabs">
        <TabsList>
          <TabsTrigger value="current" data-ocid="caja.tab.current">
            Turno actual
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="caja.tab.history">
            Historial de turnos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <CashMovementsTable
            shiftId={shift?.id ?? null}
            ocid="caja.movements"
            caption={
              isShiftOpen
                ? `Movimientos del turno #${shift.id.toString()}`
                : "Movimientos de caja y bancos"
            }
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ShiftHistoryTable onOpenReport={openReport} />
        </TabsContent>
      </Tabs>

      <OpenShiftDialog
        open={openShiftDialog}
        onOpenChange={setOpenShiftDialog}
      />

      {shift ? (
        <CloseShiftDialog
          open={closeShiftDialog}
          onOpenChange={setCloseShiftDialog}
          shift={shift}
        />
      ) : null}

      <CashMovementDialog
        open={movementDialog}
        onOpenChange={setMovementDialog}
      />

      <ShiftReportDialog shiftId={reportShiftId} onClose={closeReport} />
    </div>
  );
}

export default CajaBancosPage;
