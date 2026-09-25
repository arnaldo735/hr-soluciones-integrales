import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type {
  CommissionLine,
  CommissionLineBreakdown,
  CommissionPayment,
  CommissionReport,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download, FileText } from "lucide-react";

/** Motorcycle label for a commission line: `Marca Modelo · PLACA`. */
export function motorcycleLabel(line: CommissionLine): string {
  const model = `${line.motorcycleBrand} ${line.motorcycleModel}`.trim();
  const plate = line.motorcyclePlate.trim();
  if (model === "" && plate === "") return "—";
  if (plate === "") return model;
  if (model === "") return plate;
  return `${model} · ${plate}`;
}

/** Flattens a commission line into the service/motorcycle breakdown shape. */
export function toCommissionBreakdown(
  line: CommissionLine,
): CommissionLineBreakdown {
  return {
    key: line.laborId.toString(),
    orderNumber: line.orderNumber,
    serviceName: line.serviceName,
    description: line.description,
    motorcycleBrand: line.motorcycleBrand,
    motorcycleModel: line.motorcycleModel,
    motorcyclePlate: line.motorcyclePlate,
    serviceDate: line.serviceDate,
    baseAmount: line.baseAmount,
    commissionRate: line.commissionRate,
    commissionAmount: line.commissionAmount,
  };
}

/** Company identity rendered at the top of the document. */
export interface CommissionCompany {
  name: string;
  /** Permanent URL of the company logo, rendered in the document header. */
  logo?: string;
  contact?: string;
  /** Fiscal lines: NIT with dígito de verificación, régimen, responsabilidad. */
  fiscal?: string[];
}

/** Formats a commission rate (whole percentage points) as `12%`. */
function rateLabel(rate: bigint): string {
  return `${Math.round(Number(rate))}%`;
}

/** Human label for a commission period. */
function periodLabel(from?: bigint, to?: bigint): string {
  if (from === undefined && to === undefined) return "Todo el historial";
  const start = from === undefined ? "Inicio" : formatDate(from);
  const end = to === undefined ? "Hoy" : formatDate(to);
  return `${start} — ${end}`;
}

interface ReceiptProps {
  kind: "receipt";
  payment: CommissionPayment;
  lines: CommissionLine[];
  company: CommissionCompany;
  onDownload: () => void;
  isDownloading?: boolean;
  /** ocid prefix for deterministic markers. */
  ocid?: string;
}

interface ReportProps {
  kind: "report";
  report: CommissionReport;
  company: CommissionCompany;
  onDownload: () => void;
  isDownloading?: boolean;
  /** ocid prefix for deterministic markers. */
  ocid?: string;
}

type CommissionDocumentProps = ReceiptProps | ReportProps;

/**
 * On-screen preview of a commission document. Renders the same content that
 * `lib/pdf.ts` writes into the downloadable PDF: the per-technician payment
 * receipt (with loan deductions) or the general commission report.
 */
export function CommissionDocument(props: CommissionDocumentProps) {
  const { company, onDownload, isDownloading } = props;
  const ocid = props.ocid ?? "commissions.document";
  const title =
    props.kind === "receipt"
      ? "Comprobante de comisión"
      : "Reporte de comisiones";
  const subtitle =
    props.kind === "receipt"
      ? `Comprobante ${props.payment.id.toString()} · ${periodLabel(
          props.payment.period.from,
          props.payment.period.to,
        )}`
      : `Reporte general · ${periodLabel(
          props.report.period.from,
          props.report.period.to,
        )}`;

  return (
    <div data-ocid={ocid} className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <FileText className="size-3.5" aria-hidden="true" />
          Documento PDF
        </span>
        <Button
          type="button"
          size="sm"
          onClick={onDownload}
          disabled={isDownloading}
          data-ocid={`${ocid}.download_button`}
          className="gap-1.5"
        >
          <Download className="size-4" aria-hidden="true" />
          {isDownloading ? "Generando…" : "Descargar PDF"}
        </Button>
      </div>

      <div className="scroll-slim overflow-x-auto py-2">
        <div className="doc-preview doc-preview-a4 invoice-sheet">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt=""
                  data-ocid={`${ocid}.logo`}
                  className="size-12 shrink-0 object-contain"
                />
              ) : null}
              <div className="min-w-0">
                <p className="doc-title font-display text-lg font-bold tracking-tight">
                  {company.name}
                </p>
                {company.contact ? (
                  <p className="doc-meta text-xs">{company.contact}</p>
                ) : null}
                {company.fiscal && company.fiscal.length > 0 ? (
                  <div className="mt-1 space-y-0.5">
                    {company.fiscal
                      .filter((line) => line.trim() !== "")
                      .map((line) => (
                        <p key={line} className="doc-meta text-xs">
                          {line}
                        </p>
                      ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-sm font-semibold uppercase tracking-wider">
                {title}
              </p>
              <p className="data-rail text-xs">{subtitle}</p>
            </div>
          </header>

          <div className="doc-rule my-3" />

          {props.kind === "receipt" ? (
            <ReceiptBody payment={props.payment} lines={props.lines} />
          ) : (
            <ReportBody report={props.report} />
          )}

          <div className="doc-rule my-3" />
          <p className="doc-meta text-center text-[10px]">
            Solo la mano de obra vinculada a un servicio del catálogo de taller
            genera comisión. Cada línea se paga una sola vez. Los préstamos
            pendientes se deducen completos al pagar la comisión.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReceiptBody({
  payment,
  lines,
}: {
  payment: CommissionPayment;
  lines: CommissionLine[];
}) {
  return (
    <>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <MetaRow
          label="Técnico"
          value={`${payment.technicianName} (${payment.technicianCode})`}
        />
        <MetaRow label="Pagado el" value={formatDateTime(payment.paidAt)} />
        <MetaRow
          label="Periodo"
          value={periodLabel(payment.period.from, payment.period.to)}
        />
        <MetaRow
          label="Líneas de mano de obra"
          value={payment.lineCount.toString()}
        />
      </dl>

      <div className="doc-rule my-3" />

      <p className="font-display text-xs font-semibold">
        Desglose por servicio y moto
      </p>
      <div className="scroll-slim overflow-x-auto">
        <table className="mt-1 w-full text-xs">
          <thead>
            <tr className="text-left">
              <th className="pb-1 font-medium">Fecha</th>
              <th className="pb-1 font-medium">Orden</th>
              <th className="pb-1 font-medium">Servicio</th>
              <th className="pb-1 font-medium">Moto</th>
              <th className="pb-1 text-right font-medium">Base</th>
              <th className="pb-1 text-right font-medium">Comisión</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.laborId.toString()}>
                <td className="data-rail py-0.5 pr-2">
                  {formatDate(line.serviceDate)}
                </td>
                <td className="data-rail py-0.5 pr-2">{line.orderNumber}</td>
                <td className="py-0.5 pr-2">{line.serviceName}</td>
                <td className="py-0.5 pr-2">{motorcycleLabel(line)}</td>
                <td className="py-0.5 text-right tabular">
                  {formatMoney(line.baseAmount)}
                </td>
                <td className="py-0.5 text-right tabular">
                  {rateLabel(line.commissionRate)} ·{" "}
                  {formatMoney(line.commissionAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payment.loans.length > 0 ? (
        <>
          <div className="doc-rule my-3" />
          <p className="font-display text-xs font-semibold">
            Préstamos deducidos
          </p>
          <div className="scroll-slim overflow-x-auto">
            <table className="mt-1 w-full text-xs">
              <thead>
                <tr className="text-left">
                  <th className="pb-1 font-medium">Fecha</th>
                  <th className="pb-1 font-medium">Nota</th>
                  <th className="pb-1 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {payment.loans.map((loan) => (
                  <tr key={loan.loanId.toString()}>
                    <td className="data-rail py-0.5 pr-2">
                      {formatDate(loan.date)}
                    </td>
                    <td className="py-0.5 pr-2">
                      {loan.note ?? "Préstamo a técnico"}
                    </td>
                    <td className="py-0.5 text-right tabular">
                      {formatMoney(loan.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <div className="doc-rule my-3" />

      <dl className="ml-auto w-full max-w-[240px] space-y-1 text-xs">
        <TotalRow
          label="Base de mano de obra"
          value={formatMoney(payment.baseAmount)}
        />
        <TotalRow
          label="Comisión generada"
          value={formatMoney(payment.commissionAmount)}
        />
        <TotalRow
          label="Préstamos deducidos"
          value={`- ${formatMoney(payment.loansDeducted)}`}
        />
        <TotalRow
          label="Neto pagado"
          value={formatMoney(payment.netPaid)}
          emphasis
        />
      </dl>
    </>
  );
}

function ReportBody({ report }: { report: CommissionReport }) {
  return (
    <>
      <p className="doc-meta text-xs">
        Solo la mano de obra vinculada a un servicio del catálogo de taller
        genera comisión. Las líneas libres y los repuestos no comisionan.
      </p>

      <div className="scroll-slim overflow-x-auto">
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left">
              <th className="pb-1 font-medium">Código</th>
              <th className="pb-1 font-medium">Técnico</th>
              <th className="pb-1 text-right font-medium">Base</th>
              <th className="pb-1 text-right font-medium">Comisión</th>
              <th className="pb-1 text-right font-medium">Préstamos</th>
              <th className="pb-1 text-right font-medium">Neto</th>
            </tr>
          </thead>
          <tbody>
            {report.technicians.map((summary) => (
              <tr key={summary.technicianId.toString()}>
                <td className="data-rail py-0.5 pr-2">
                  {summary.technicianCode}
                </td>
                <td className="py-0.5 pr-2">{summary.technicianName}</td>
                <td className="py-0.5 text-right tabular">
                  {formatMoney(summary.baseAmount)}
                </td>
                <td className="py-0.5 text-right tabular">
                  {rateLabel(summary.commissionRate)} ·{" "}
                  {formatMoney(summary.commissionAmount)}
                </td>
                <td className="py-0.5 text-right tabular">
                  {formatMoney(summary.pendingLoansAmount)}
                </td>
                <td className="py-0.5 text-right tabular font-semibold">
                  {formatMoney(summary.netPayable)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="doc-rule my-3" />

      <dl className="ml-auto w-full max-w-[260px] space-y-1 text-xs">
        <TotalRow
          label="Base total de mano de obra"
          value={formatMoney(report.totalBase)}
        />
        <TotalRow
          label="Comisión total"
          value={formatMoney(report.totalCommission)}
        />
        <TotalRow
          label="Préstamos pendientes"
          value={formatMoney(report.totalPendingLoans)}
        />
        <TotalRow
          label="Total neto a pagar"
          value={formatMoney(report.totalNetPayable)}
          emphasis
        />
      </dl>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="doc-meta">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-3",
        emphasis && "font-display text-sm font-bold",
      )}
    >
      <dt className={cn(!emphasis && "doc-meta")}>{label}</dt>
      <dd className="text-right tabular">{value}</dd>
    </div>
  );
}
