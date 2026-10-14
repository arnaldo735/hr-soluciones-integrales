import { PageHeader } from "@/components/PageHeader";
import { CashBalancesPanel } from "@/components/cash/CashBalancesPanel";
import { CashMovementDialog } from "@/components/cash/CashMovementDialog";
import { CashMovementsTable } from "@/components/cash/CashMovementsTable";
import { CloseShiftDialog } from "@/components/cash/CloseShiftDialog";
import { OpenShiftDialog } from "@/components/cash/OpenShiftDialog";
import { ShiftHistoryTable } from "@/components/cash/ShiftHistoryTable";
import { ShiftReportDialog } from "@/components/cash/ShiftReportDialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import {
  useCashRegisters,
  useOpenShifts,
  useSetShiftResponsible,
} from "@/hooks/use-cash";
import { formatMoney } from "@/lib/format";
import type { Id, Shift } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  LockOpen,
  Printer,
  UserCog,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ResponsibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  registerName: string;
}

/** Changes the responsible of an open shift, by system user or free name. */
function ResponsibleDialog({
  open,
  onOpenChange,
  shift,
  registerName,
}: ResponsibleDialogProps) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setResponsible = useSetShiftResponsible();
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  const usersQuery = useQuery({
    queryKey: ["users-page", "", 1],
    queryFn: async () => {
      if (!actor) return { items: [], total: 0n, offset: 0n, limit: 0n };
      return actor.listUsersPage(token, null, 0n, 100n);
    },
    enabled: !!actor && !isFetching,
  });
  const users = useMemo(
    () => (usersQuery.data?.items ?? []).filter((user) => user.active),
    [usersQuery.data],
  );

  useEffect(() => {
    if (open && shift) {
      setName(shift.responsibleName);
      setUserId(shift.responsibleUserId?.toString() ?? "");
      setError(null);
    }
  }, [open, shift]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shift) return;
    const trimmed = name.trim();
    if (trimmed === "") {
      setError("Asigna un responsable del turno.");
      return;
    }
    setError(null);
    setResponsible.mutate(
      {
        shiftId: shift.id,
        responsibleName: trimmed,
        responsibleUserId: userId === "" ? null : BigInt(userId),
      },
      {
        onSuccess: () => {
          toast.success("Responsable actualizado");
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setError(
            mutationError.message ||
              "No se pudo cambiar el responsable del turno.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="caja.responsible.dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Cambiar responsable
          </DialogTitle>
          <DialogDescription>
            {registerName} · Turno #{shift?.id.toString() ?? ""}. Elige un
            usuario del sistema o escribe un nombre libre.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="responsible-user">Usuario del sistema</Label>
            <Select
              value={userId}
              onValueChange={(value) => {
                if (value === "__free__") {
                  setUserId("");
                  return;
                }
                const user = users.find(
                  (candidate) => candidate.id.toString() === value,
                );
                setUserId(value);
                if (user) setName(user.name);
              }}
            >
              <SelectTrigger
                id="responsible-user"
                aria-label="Usuario del sistema"
                data-ocid="caja.responsible.user_select"
              >
                <SelectValue placeholder="Elige un usuario o escribe un nombre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__free__">
                  Escribir un nombre libre
                </SelectItem>
                {users.map((user) => (
                  <SelectItem
                    key={user.id.toString()}
                    value={user.id.toString()}
                  >
                    {user.name} · {user.roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="responsible-name">Nombre del responsable</Label>
            <Input
              id="responsible-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del responsable"
              data-ocid="caja.responsible.name_input"
              required
            />
          </div>

          {error ? (
            <p
              data-ocid="caja.responsible.error_state"
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
              data-ocid="caja.responsible.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={setResponsible.isPending}
              data-ocid="caja.responsible.submit_button"
            >
              {setResponsible.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Caja y Bancos: turnos por caja/banco, movimientos por medio de pago e
 * informe diario.
 *
 * The page is organized in two tabs. "Turno actual" shows every open shift
 * grouped by caja/banco with its responsible and balances, the actions to open
 * a shift, close a specific one, register a movement against a chosen shift and
 * change its responsible, plus the movement ledger. "Historial" lists shifts
 * with caja/banco and responsible filters and opens each one's printable daily
 * report.
 */
export function CajaBancosPage() {
  const openShiftsQuery = useOpenShifts();
  const openShifts = useMemo(
    () => openShiftsQuery.data ?? [],
    [openShiftsQuery.data],
  );

  const registersQuery = useCashRegisters({
    kind: null,
    active: null,
    search: "",
    offset: 0,
    limit: 100,
  });
  const registerNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const register of registersQuery.data?.items ?? []) {
      map.set(register.id.toString(), register.name);
    }
    return map;
  }, [registersQuery.data]);

  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [closeShiftId, setCloseShiftId] = useState<Id | null>(null);
  const [movementDialog, setMovementDialog] = useState(false);
  const [movementShiftId, setMovementShiftId] = useState<string | null>(null);
  const [responsibleShiftId, setResponsibleShiftId] = useState<Id | null>(null);
  const [reportShiftId, setReportShiftId] = useState<Id | null>(null);

  const closeShift = useMemo(
    () => openShifts.find((shift) => shift.id === closeShiftId) ?? null,
    [openShifts, closeShiftId],
  );
  const responsibleShift = useMemo(
    () => openShifts.find((shift) => shift.id === responsibleShiftId) ?? null,
    [openShifts, responsibleShiftId],
  );

  const openReport = useCallback((shiftId: Id) => {
    setReportShiftId(shiftId);
  }, []);

  const closeReport = useCallback(() => {
    setReportShiftId(null);
  }, []);

  const openMovementFor = useCallback((shiftId: Id | null) => {
    setMovementShiftId(shiftId?.toString() ?? null);
    setMovementDialog(true);
  }, []);

  const hasOpenShifts = openShifts.length > 0;

  return (
    <div
      data-ocid="caja.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Caja y bancos"
        description="Turnos por caja o banco, movimientos por medio de pago e informe diario. Puedes tener varios turnos abiertos a la vez, uno por caja o banco."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {hasOpenShifts ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openMovementFor(null)}
                  data-ocid="caja.register_movement_button"
                  className="gap-1.5"
                >
                  <ArrowUpCircle className="size-4" aria-hidden="true" />
                  Registrar movimiento
                </Button>
                <Button
                  type="button"
                  onClick={() => setOpenShiftDialog(true)}
                  data-ocid="caja.open_shift_button"
                  className="gap-1.5"
                >
                  <LockOpen className="size-4" aria-hidden="true" />
                  Abrir turno
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setOpenShiftDialog(true)}
                disabled={openShiftsQuery.isLoading}
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
        shifts={openShifts}
        registerNames={registerNames}
        isLoading={openShiftsQuery.isLoading}
        isError={openShiftsQuery.isError}
      />

      {hasOpenShifts ? (
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
            onClick={() => openMovementFor(null)}
            data-ocid="caja.register_movement_inline_button"
            className="gap-1.5"
          >
            <ArrowUpCircle className="size-4" aria-hidden="true" />
            Registrar movimiento
          </Button>
        </div>
      ) : null}

      {hasOpenShifts ? (
        <section
          data-ocid="caja.open_shifts.list"
          aria-label="Turnos abiertos"
          className="space-y-3"
        >
          <h2 className="font-display text-sm font-semibold">
            Turnos abiertos
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {openShifts.map((shift, index) => (
              <div
                key={shift.id.toString()}
                data-ocid={`caja.open_shifts.item.${index + 1}`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">
                      {registerNames.get(shift.registerId.toString()) ??
                        `Caja #${shift.registerId.toString()}`}
                    </p>
                    <p className="data-rail text-[11px] text-muted-foreground">
                      Turno #{shift.id.toString()} · Responsable{" "}
                      {shift.responsibleName || "—"}
                    </p>
                  </div>
                  <span className="data-rail text-sm font-semibold">
                    {formatMoney(
                      shift.computedClosingCash + shift.computedClosingBank,
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openMovementFor(shift.id)}
                    data-ocid={`caja.open_shifts.movement_button.${index + 1}`}
                    className="gap-1.5"
                  >
                    <ArrowUpCircle className="size-4" aria-hidden="true" />
                    Movimiento
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResponsibleShiftId(shift.id)}
                    data-ocid={`caja.open_shifts.responsible_button.${index + 1}`}
                    className="gap-1.5"
                  >
                    <UserCog className="size-4" aria-hidden="true" />
                    Responsable
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReportShiftId(shift.id)}
                    data-ocid={`caja.open_shifts.report_button.${index + 1}`}
                    className="gap-1.5"
                  >
                    <Printer className="size-4" aria-hidden="true" />
                    Informe
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCloseShiftId(shift.id)}
                    data-ocid={`caja.open_shifts.close_button.${index + 1}`}
                    className="gap-1.5"
                  >
                    <Lock className="size-4" aria-hidden="true" />
                    Cerrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
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
            shiftId={null}
            ocid="caja.movements"
            caption="Movimientos de caja y bancos"
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

      {closeShift ? (
        <CloseShiftDialog
          open={closeShiftId !== null}
          onOpenChange={(open) => {
            if (!open) setCloseShiftId(null);
          }}
          shift={closeShift}
          registerName={
            registerNames.get(closeShift.registerId.toString()) ??
            `Caja #${closeShift.registerId.toString()}`
          }
        />
      ) : null}

      <CashMovementDialog
        open={movementDialog}
        onOpenChange={setMovementDialog}
        initialShiftId={movementShiftId}
      />

      <ResponsibleDialog
        open={responsibleShiftId !== null}
        onOpenChange={(open) => {
          if (!open) setResponsibleShiftId(null);
        }}
        shift={responsibleShift}
        registerName={
          responsibleShift
            ? (registerNames.get(responsibleShift.registerId.toString()) ??
              `Caja #${responsibleShift.registerId.toString()}`)
            : ""
        }
      />

      <ShiftReportDialog shiftId={reportShiftId} onClose={closeReport} />
    </div>
  );
}

export default CajaBancosPage;
