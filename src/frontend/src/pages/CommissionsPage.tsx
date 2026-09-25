import type { CommissionCompany } from "@/components/CommissionDocument";
import { CommissionPaymentDialog } from "@/components/CommissionPaymentDialog";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCommissionLines,
  useCommissionPayments,
  useCommissionReport,
  useCreateTechnicianLoan,
  useDeleteTechnicianLoan,
  useTechnicianCommissionSummary,
  useTechnicianLoans,
} from "@/hooks/use-commissions";
import { useCompanyProfile } from "@/hooks/use-company";
import { useTechnicians } from "@/hooks/use-technicians";
import {
  colombiaDateInput,
  colombiaEndOfDay,
  colombiaStartOfDay,
  formatDate,
  formatMoney,
  formatNumber,
  toColombiaParts,
} from "@/lib/format";
import { downloadCommissionReportPdf, pdfCompanyFromProfile } from "@/lib/pdf";
import type {
  CommissionLine,
  CommissionPeriod,
  DataColumn,
  Id,
  Technician,
  TechnicianCommissionSummary,
  TechnicianLoan,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Banknote,
  Download,
  HandCoins,
  Loader2,
  Plus,
  RotateCcw,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

/** `YYYY-MM-DD` for the first day of a Colombia month offset from today. */
function colombiaMonthStart(monthOffset: number): string {
  const parts = toColombiaParts(new Date());
  if (!parts) return "";
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + monthOffset, 1));
  return colombiaDateInput(BigInt(date.getTime()) * 1_000_000n);
}

interface PeriodPreset {
  id: string;
  label: string;
  range: () => { from: string; to: string };
}

const PERIOD_PRESETS: PeriodPreset[] = [
  {
    id: "month",
    label: "Este mes",
    range: () => ({ from: colombiaMonthStart(0), to: "" }),
  },
  {
    id: "quarter",
    label: "Trimestre",
    range: () => ({ from: colombiaMonthStart(-2), to: "" }),
  },
  {
    id: "year",
    label: "Este año",
    range: () => {
      const parts = toColombiaParts(new Date());
      return { from: parts ? `${parts.year}-01-01` : "", to: "" };
    },
  },
  {
    id: "all",
    label: "Todo",
    range: () => ({ from: "", to: "" }),
  },
];

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "primary" | "warning" | "info";
  ocid: string;
}

const KPI_TONE: Record<KpiCardProps["tone"], string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  info: "bg-info",
};

function KpiCard({ label, value, hint, icon: Icon, tone, ocid }: KpiCardProps) {
  return (
    <Card
      data-ocid={ocid}
      className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none"
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-0.5", KPI_TONE[tone])}
      />
      <CardContent className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="data-rail text-2xl font-semibold leading-none tracking-tight">
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton({ ocid }: { ocid: string }) {
  return (
    <Card
      data-ocid={ocid}
      className="gap-0 rounded-lg py-0 shadow-none"
      aria-hidden="true"
    >
      <CardContent className="space-y-3 px-5 py-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

interface LoanFormState {
  amount: string;
  date: string;
  note: string;
}

function emptyLoanForm(): LoanFormState {
  return {
    amount: "",
    date: colombiaDateInput(BigInt(Date.now()) * 1_000_000n),
    note: "",
  };
}

interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician: Technician | null;
}

/** Registers a loan/advance for a technician with amount, date and note. */
function LoanDialog({ open, onOpenChange, technician }: LoanDialogProps) {
  const [form, setForm] = useState<LoanFormState>(emptyLoanForm);
  const [error, setError] = useState<string | null>(null);
  const createLoan = useCreateTechnicianLoan();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!technician) return;

    const amount = Number(form.amount.replace(/[^\d]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Ingresa un monto válido mayor que cero.");
      return;
    }
    const date = colombiaStartOfDay(form.date);
    if (!date) {
      setError("Selecciona una fecha válida.");
      return;
    }
    setError(null);

    const note = form.note.trim();
    createLoan.mutate(
      {
        technicianId: technician.id,
        amount: BigInt(Math.round(amount)) * 100n,
        date,
        note: note === "" ? undefined : note,
      },
      {
        onSuccess: () => {
          toast.success("Préstamo registrado");
          setForm(emptyLoanForm());
          onOpenChange(false);
        },
        onError: () => setError("No se pudo registrar el préstamo."),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="commission_loan.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            Nuevo préstamo a técnico
          </DialogTitle>
          <DialogDescription>
            {technician
              ? `Registra un anticipo para ${technician.name}. Se descontará completo al pagar sus comisiones.`
              : "Selecciona un técnico para registrar el préstamo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loan-amount">Monto (COP)</Label>
            <Input
              id="loan-amount"
              inputMode="numeric"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
              placeholder="Ej. 150000"
              className="data-rail"
              data-ocid="commission_loan.amount_input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-date">Fecha</Label>
            <Input
              id="loan-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              className="data-rail"
              data-ocid="commission_loan.date_input"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-note">Nota</Label>
            <Textarea
              id="loan-note"
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({ ...current, note: event.target.value }))
              }
              placeholder="Motivo del anticipo"
              rows={3}
              data-ocid="commission_loan.note_input"
            />
          </div>

          {error ? (
            <p
              data-ocid="commission_loan.error_state"
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
              data-ocid="commission_loan.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createLoan.isPending || !technician}
              data-ocid="commission_loan.submit_button"
              className="gap-1.5"
            >
              {createLoan.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Registrar préstamo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface LoansPanelProps {
  technician: Technician;
  loans: TechnicianLoan[];
  isLoading: boolean;
  onRegister: () => void;
}

/** Pending and deducted loans for one technician. */
function LoansPanel({
  technician,
  loans,
  isLoading,
  onRegister,
}: LoansPanelProps) {
  const deleteLoan = useDeleteTechnicianLoan();

  const columns: Array<DataColumn<TechnicianLoan>> = [
    {
      key: "date",
      header: "Fecha",
      render: (loan) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(loan.date)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Monto",
      numeric: true,
      render: (loan) => (
        <span className="data-rail font-medium">
          {formatMoney(loan.amount)}
        </span>
      ),
    },
    {
      key: "note",
      header: "Nota",
      render: (loan) => (
        <span className="block max-w-[240px] truncate text-muted-foreground">
          {loan.note && loan.note.trim() !== "" ? loan.note : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (loan) =>
        loan.deducted ? (
          <StatusBadge label="Deducido" tone="accepted" />
        ) : (
          <StatusBadge label="Pendiente" tone="pending" />
        ),
    },
  ];

  return (
    <section
      data-ocid={`commissions.loans.${technician.code}`}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold">
            Préstamos de {technician.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            Los préstamos pendientes se descuentan completos al pagar
            comisiones.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRegister}
          data-ocid={`commissions.loans.${technician.code}.register_button`}
          className="gap-1.5"
        >
          <Plus className="size-4" aria-hidden="true" />
          Registrar préstamo
        </Button>
      </div>

      {isLoading ? (
        <div
          data-ocid={`commissions.loans.${technician.code}.loading_state`}
          className="space-y-2"
        >
          {Array.from({ length: 3 }, (_, index) => `loan-${index}`).map(
            (id) => (
              <Skeleton key={id} className="h-10 w-full" />
            ),
          )}
        </div>
      ) : (
        <DataTable
          ocid={`commissions.loans.${technician.code}`}
          columns={columns}
          rows={loans}
          rowKey={(loan) => loan.id.toString()}
          emptyMessage="Sin préstamos registrados para este técnico."
          actions={[
            {
              kind: "delete",
              label: "Eliminar préstamo pendiente",
              hidden: (loan) => loan.deducted,
              onClick: (loan) => {
                deleteLoan.mutate(loan.id, {
                  onSuccess: () => toast.success("Préstamo eliminado"),
                  onError: () =>
                    toast.error(
                      "No se pudo eliminar: el préstamo ya fue deducido.",
                    ),
                });
              },
            },
          ]}
        />
      )}
    </section>
  );
}

interface TechnicianDetailProps {
  technician: Technician;
  period: CommissionPeriod;
  onPay: (summary: TechnicianCommissionSummary) => void;
}

/** Period commission view for one technician: lines, totals and loans. */
function TechnicianDetail({
  technician,
  period,
  onPay,
}: TechnicianDetailProps) {
  const summaryQuery = useTechnicianCommissionSummary(technician.id, period);
  const linesQuery = useCommissionLines(technician.id, period);
  // The backend settles a labor line once, globally. Fetching every payment for
  // the technician (not just the selected period) keeps a line paid in an
  // earlier period from reappearing as pending here.
  const allPaymentsQuery = useCommissionPayments(technician.id, period, true);
  const loansQuery = useTechnicianLoans(technician.id);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);

  const summary = summaryQuery.data ?? null;
  const lines = linesQuery.data ?? [];
  const loans = loansQuery.data ?? [];

  // Every labor line already settled in a payment for this technician. The
  // backend never pays a line twice; this set makes that guarantee visible in
  // the UI.
  const paidLineKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const payment of allPaymentsQuery.data ?? []) {
      for (const line of payment.lines) {
        keys.add(`${line.orderId.toString()}:${line.laborId.toString()}`);
      }
    }
    return keys;
  }, [allPaymentsQuery.data]);

  const pendingLines = useMemo(
    () =>
      lines.filter(
        (line) =>
          !paidLineKeys.has(
            `${line.orderId.toString()}:${line.laborId.toString()}`,
          ),
      ),
    [lines, paidLineKeys],
  );

  const paidLines = useMemo(
    () =>
      lines.filter((line) =>
        paidLineKeys.has(
          `${line.orderId.toString()}:${line.laborId.toString()}`,
        ),
      ),
    [lines, paidLineKeys],
  );

  const lineColumns: Array<DataColumn<CommissionLine>> = [
    {
      key: "serviceDate",
      header: "Fecha servicio",
      render: (line) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(line.serviceDate)}
        </span>
      ),
    },
    {
      key: "order",
      header: "Orden",
      render: (line) => <span className="data-rail">{line.orderNumber}</span>,
    },
    {
      key: "service",
      header: "Servicio",
      render: (line) => (
        <div className="min-w-0">
          <p className="block max-w-[220px] truncate font-medium">
            {line.serviceName}
          </p>
          {line.description.trim() !== "" &&
          line.description.trim() !== line.serviceName.trim() ? (
            <p className="block max-w-[220px] truncate text-xs text-muted-foreground">
              {line.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "motorcycle",
      header: "Moto",
      render: (line) => (
        <div className="min-w-0">
          <p className="block max-w-[200px] truncate">
            {`${line.motorcycleBrand} ${line.motorcycleModel}`.trim() || "—"}
          </p>
          <p className="data-rail text-xs text-muted-foreground">
            {line.motorcyclePlate.trim() !== "" ? line.motorcyclePlate : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "rate",
      header: "%",
      numeric: true,
      render: (line) => (
        <span className="data-rail">{formatNumber(line.commissionRate)}%</span>
      ),
    },
    {
      key: "base",
      header: "Base",
      numeric: true,
      render: (line) => (
        <span className="data-rail">{formatMoney(line.baseAmount)}</span>
      ),
    },
    {
      key: "commission",
      header: "Comisión",
      numeric: true,
      render: (line) => (
        <span className="data-rail font-medium">
          {formatMoney(line.commissionAmount)}
        </span>
      ),
    },
  ];

  const paidLineColumns: Array<DataColumn<CommissionLine>> = [
    ...lineColumns,
    {
      key: "status",
      header: "Estado",
      render: () => <StatusBadge label="Pagada" tone="accepted" />,
    },
  ];

  const isLoading =
    summaryQuery.isLoading ||
    linesQuery.isLoading ||
    allPaymentsQuery.isLoading;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !summary ? (
          <>
            <KpiSkeleton ocid={`commissions.${technician.code}.kpi.base`} />
            <KpiSkeleton
              ocid={`commissions.${technician.code}.kpi.commission`}
            />
            <KpiSkeleton ocid={`commissions.${technician.code}.kpi.loans`} />
            <KpiSkeleton ocid={`commissions.${technician.code}.kpi.net`} />
          </>
        ) : (
          <>
            <KpiCard
              ocid={`commissions.${technician.code}.kpi.base`}
              label="Base de mano de obra"
              value={formatMoney(summary.baseAmount)}
              hint={`${formatNumber(summary.lineCount)} línea(s) pendientes en el periodo`}
              icon={Wallet}
              tone="info"
            />
            <KpiCard
              ocid={`commissions.${technician.code}.kpi.commission`}
              label="Comisión pendiente"
              value={formatMoney(summary.commissionAmount)}
              hint={`Tasa ${formatNumber(summary.commissionRate)}% sobre mano de obra`}
              icon={Banknote}
              tone="primary"
            />
            <KpiCard
              ocid={`commissions.${technician.code}.kpi.loans`}
              label="Préstamos pendientes"
              value={formatMoney(summary.pendingLoansAmount)}
              hint={`${formatNumber(summary.pendingLoanCount)} préstamo(s) por deducir`}
              icon={HandCoins}
              tone="warning"
            />
            <KpiCard
              ocid={`commissions.${technician.code}.kpi.net`}
              label="Neto a pagar"
              value={formatMoney(summary.netPayable)}
              hint="Comisión menos préstamos pendientes"
              icon={Banknote}
              tone="primary"
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold">
            Comisiones por servicio y moto
          </h3>
          <p className="text-xs text-muted-foreground">
            Solo la mano de obra vinculada a un servicio del catálogo de taller
            genera comisión. Las líneas libres y los repuestos no comisionan.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (summary) onPay(summary);
          }}
          disabled={!summary || summary.lineCount === 0n}
          data-ocid={`commissions.${technician.code}.pay_button`}
          className="gap-1.5"
        >
          <Banknote className="size-4" aria-hidden="true" />
          Pagar comisiones
        </Button>
      </div>

      {linesQuery.isError ? (
        <div
          data-ocid={`commissions.${technician.code}.error_state`}
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center shadow-subtle"
        >
          <AlertTriangle
            className="size-5 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar las líneas de comisión.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void linesQuery.refetch()}
            data-ocid={`commissions.${technician.code}.retry_button`}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <section
            data-ocid={`commissions.${technician.code}.pending`}
            className="space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-display text-sm font-semibold">
                Pendientes de pago
              </h4>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {formatNumber(pendingLines.length)} línea(s)
              </span>
            </div>
            <DataTable
              ocid={`commissions.${technician.code}.lines`}
              columns={lineColumns}
              rows={pendingLines}
              rowKey={(line) => line.laborId.toString()}
              emptyMessage="Sin comisiones pendientes en el periodo seleccionado."
            />
          </section>

          {paidLines.length > 0 ? (
            <section
              data-ocid={`commissions.${technician.code}.paid`}
              className="space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-display text-sm font-semibold">
                    Ya pagadas
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Cada línea se paga una sola vez: estas comisiones ya no
                    aparecen como pendientes ni se pueden volver a pagar.
                  </p>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {formatNumber(paidLines.length)} línea(s)
                </span>
              </div>
              <DataTable
                ocid={`commissions.${technician.code}.paid_lines`}
                columns={paidLineColumns}
                rows={paidLines}
                rowKey={(line) => line.laborId.toString()}
                emptyMessage="Sin comisiones pagadas en el periodo seleccionado."
              />
            </section>
          ) : null}
        </div>
      )}

      <LoansPanel
        technician={technician}
        loans={loans}
        isLoading={loansQuery.isLoading}
        onRegister={() => setLoanDialogOpen(true)}
      />

      <LoanDialog
        open={loanDialogOpen}
        onOpenChange={setLoanDialogOpen}
        technician={technician}
      />
    </div>
  );
}

/** Commissions module: period view, loans, payout and general report. */
export function CommissionsPage() {
  // El periodo por defecto no restringe fechas: la página abre mostrando todas
  // las comisiones guardadas, sin ocultar registros anteriores. El usuario
  // puede acotar el rango con los presets o con las fechas Desde/Hasta.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<Id | null>(null);
  const [paymentTarget, setPaymentTarget] =
    useState<TechnicianCommissionSummary | null>(null);

  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly: true,
  });
  const companyQuery = useCompanyProfile();

  const period = useMemo<CommissionPeriod>(
    () => ({
      from: from === "" ? undefined : (colombiaStartOfDay(from) ?? undefined),
      to: to === "" ? undefined : (colombiaEndOfDay(to) ?? undefined),
    }),
    [from, to],
  );

  const reportQuery = useCommissionReport(period);
  // Every commission line in the period, across technicians, for the report's
  // per-service / per-motorcycle / per-date breakdown.
  const reportLinesQuery = useCommissionLines(null, period);
  const technicians = techniciansQuery.data ?? [];
  const report = reportQuery.data ?? null;
  const reportLines = reportLinesQuery.data ?? [];

  const selected =
    technicians.find((tech) => tech.id === selectedId) ??
    technicians[0] ??
    null;

  const company = pdfCompanyFromProfile(companyQuery.data);
  const documentCompany: CommissionCompany = {
    name: company.name,
    logo: companyQuery.data?.logoUrl ?? undefined,
    contact: [
      company.taxId,
      company.address,
      company.city,
      company.phone,
      company.email,
    ]
      .filter((value): value is string => !!value && value.trim() !== "")
      .join("  ·  "),
    fiscal: [company.fiscalRegime, company.taxResponsibility].filter(
      (value): value is string => !!value && value.trim() !== "",
    ),
  };

  const applyPreset = (preset: PeriodPreset) => {
    const range = preset.range();
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset.id);
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setActivePreset(null);
  };

  const hasFilters = from !== "" || to !== "";

  const reportColumns: Array<DataColumn<TechnicianCommissionSummary>> = [
    {
      key: "technician",
      header: "Técnico",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.technicianName}</p>
          <p className="data-rail text-xs text-muted-foreground">
            {row.technicianCode}
          </p>
        </div>
      ),
    },
    {
      key: "rate",
      header: "%",
      numeric: true,
      render: (row) => (
        <span className="data-rail">{formatNumber(row.commissionRate)}%</span>
      ),
    },
    {
      key: "lines",
      header: "Líneas",
      numeric: true,
      render: (row) => (
        <span className="data-rail">{formatNumber(row.lineCount)}</span>
      ),
    },
    {
      key: "base",
      header: "Base",
      numeric: true,
      render: (row) => (
        <span className="data-rail">{formatMoney(row.baseAmount)}</span>
      ),
    },
    {
      key: "commission",
      header: "Comisión",
      numeric: true,
      render: (row) => (
        <span className="data-rail">{formatMoney(row.commissionAmount)}</span>
      ),
    },
    {
      key: "loans",
      header: "Préstamos",
      numeric: true,
      render: (row) => (
        <span className="data-rail text-destructive">
          − {formatMoney(row.pendingLoansAmount)}
        </span>
      ),
    },
    {
      key: "net",
      header: "Neto a pagar",
      numeric: true,
      render: (row) => (
        <span className="data-rail font-semibold">
          {formatMoney(row.netPayable)}
        </span>
      ),
    },
  ];

  const breakdownColumns: Array<DataColumn<CommissionLine>> = [
    {
      key: "serviceDate",
      header: "Fecha servicio",
      render: (line) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(line.serviceDate)}
        </span>
      ),
    },
    {
      key: "technician",
      header: "Técnico",
      render: (line) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{line.technicianName}</p>
          <p className="data-rail text-xs text-muted-foreground">
            {line.technicianCode}
          </p>
        </div>
      ),
    },
    {
      key: "order",
      header: "Orden",
      render: (line) => <span className="data-rail">{line.orderNumber}</span>,
    },
    {
      key: "service",
      header: "Servicio",
      render: (line) => (
        <span className="block max-w-[220px] truncate">{line.serviceName}</span>
      ),
    },
    {
      key: "motorcycle",
      header: "Moto (marca / modelo / placa)",
      render: (line) => (
        <div className="min-w-0">
          <p className="block max-w-[200px] truncate">
            {`${line.motorcycleBrand} ${line.motorcycleModel}`.trim() || "—"}
          </p>
          <p className="data-rail text-xs text-muted-foreground">
            {line.motorcyclePlate.trim() !== "" ? line.motorcyclePlate : "—"}
          </p>
        </div>
      ),
    },
    {
      key: "base",
      header: "Base",
      numeric: true,
      render: (line) => (
        <span className="data-rail">{formatMoney(line.baseAmount)}</span>
      ),
    },
    {
      key: "commission",
      header: "Comisión",
      numeric: true,
      render: (line) => (
        <span className="data-rail font-medium">
          {formatMoney(line.commissionAmount)}
        </span>
      ),
    },
  ];

  return (
    <div data-ocid="commissions.page" className="space-y-6">
      {" "}
      <PageHeader
        eyebrow="Administración"
        title="Comisiones de técnicos"
        description="Comisiones por mano de obra, préstamos deducidos y pagos por técnico."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (report) {
                void downloadCommissionReportPdf(report, company, reportLines);
              }
            }}
            disabled={!report || report.technicians.length === 0}
            data-ocid="commissions.report.download_button"
            className="gap-1.5"
          >
            <Download className="size-4" aria-hidden="true" />
            Descargar reporte PDF
          </Button>
        }
      />
      <section
        data-ocid="commissions.period"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle"
      >
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={activePreset === preset.id ? "default" : "outline"}
              onClick={() => applyPreset(preset)}
              data-ocid={`commissions.period.${preset.id}`}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="commissions-from"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
          >
            Desde
          </Label>
          <Input
            id="commissions-from"
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setActivePreset(null);
            }}
            className="data-rail w-[160px]"
            data-ocid="commissions.date_from_input"
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="commissions-to"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
          >
            Hasta
          </Label>
          <Input
            id="commissions-to"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setActivePreset(null);
            }}
            className="data-rail w-[160px]"
            data-ocid="commissions.date_to_input"
          />
        </div>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            onClick={clearFilters}
            data-ocid="commissions.clear_filters_button"
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Limpiar
          </Button>
        ) : null}
      </section>
      {techniciansQuery.isError ? (
        <div
          data-ocid="commissions.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No se pudo cargar la información de comisiones.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void techniciansQuery.refetch()}
            data-ocid="commissions.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : techniciansQuery.isLoading ? (
        <div data-ocid="commissions.loading_state" className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : technicians.length === 0 ? (
        <div
          data-ocid="commissions.empty_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
            <Users
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold">
              Sin técnicos activos
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Registra técnicos y asígnales mano de obra en las órdenes para
              calcular sus comisiones.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section
            data-ocid="commissions.technicians"
            className="flex flex-wrap gap-2"
          >
            {technicians.map((tech) => {
              const isActive = selected?.id === tech.id;
              return (
                <button
                  key={tech.id.toString()}
                  type="button"
                  onClick={() => setSelectedId(tech.id)}
                  data-active={isActive ? "true" : "false"}
                  data-ocid={`commissions.technician.${tech.code}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                    isActive
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <span className="font-medium">{tech.name}</span>
                  <span className="data-rail text-xs text-muted-foreground">
                    {formatNumber(tech.commissionRate)}%
                  </span>
                </button>
              );
            })}
          </section>

          {selected ? (
            <TechnicianDetail
              key={selected.id.toString()}
              technician={selected}
              period={period}
              onPay={setPaymentTarget}
            />
          ) : null}

          <section data-ocid="commissions.report" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold">
                  Reporte general de comisiones
                </h2>
                <p className="text-xs text-muted-foreground">
                  Totales por técnico y total general del periodo.
                </p>
              </div>
            </div>

            {reportQuery.isError ? (
              <div
                data-ocid="commissions.report.error_state"
                className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center shadow-subtle"
              >
                <AlertTriangle
                  className="size-5 text-destructive"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  No se pudo cargar el reporte general.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void reportQuery.refetch()}
                  data-ocid="commissions.report.retry_button"
                >
                  Reintentar
                </Button>
              </div>
            ) : reportQuery.isLoading ? (
              <div
                data-ocid="commissions.report.loading_state"
                className="space-y-2"
              >
                {Array.from({ length: 4 }, (_, index) => `report-${index}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-10 w-full" />
                  ),
                )}
              </div>
            ) : (
              <>
                <DataTable
                  ocid="commissions.report"
                  columns={reportColumns}
                  rows={report?.technicians ?? []}
                  rowKey={(row) => row.technicianId.toString()}
                  emptyMessage="Sin comisiones registradas en el periodo seleccionado."
                />
                {report && report.technicians.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Base{" "}
                      <span className="data-rail text-foreground">
                        {formatMoney(report.totalBase)}
                      </span>
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Comisión{" "}
                      <span className="data-rail text-foreground">
                        {formatMoney(report.totalCommission)}
                      </span>
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Préstamos{" "}
                      <span className="data-rail text-destructive">
                        − {formatMoney(report.totalPendingLoans)}
                      </span>
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Total general{" "}
                      <span className="data-rail font-semibold text-foreground">
                        {formatMoney(report.totalNetPayable)}
                      </span>
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2 pt-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold">
                      Desglose por servicio, moto y fecha
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Cada línea de mano de obra del periodo con su servicio,
                      moto (marca, modelo y placa) y fecha del servicio.
                    </p>
                  </div>

                  {reportLinesQuery.isLoading ? (
                    <div
                      data-ocid="commissions.report.breakdown.loading_state"
                      className="space-y-2"
                    >
                      {Array.from(
                        { length: 4 },
                        (_, index) => `report-line-${index}`,
                      ).map((id) => (
                        <Skeleton key={id} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <DataTable
                      ocid="commissions.report.breakdown"
                      columns={breakdownColumns}
                      rows={reportLines}
                      rowKey={(line) => line.laborId.toString()}
                      emptyMessage="Sin líneas de comisión en el periodo seleccionado."
                    />
                  )}
                </div>
              </>
            )}
          </section>
        </>
      )}
      <CommissionPaymentDialog
        open={paymentTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPaymentTarget(null);
        }}
        summary={paymentTarget}
        period={period}
        company={documentCompany}
      />
    </div>
  );
}

export default CommissionsPage;
