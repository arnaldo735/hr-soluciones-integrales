import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAccountingReport,
  useInventoryValuation,
} from "@/hooks/use-accounting";
import { useCompanyProfile } from "@/hooks/use-company";
import {
  colombiaDateInput,
  colombiaEndOfDay,
  colombiaStartOfDay,
  fiscalRegimeLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNit,
  formatNumber,
  taxResponsibilityLabel,
  toColombiaParts,
} from "@/lib/format";
import type {
  AccountingPeriod,
  CategoryBreakdown,
  InventoryValuationCategory,
  InventoryValuationRow,
  LedgerEntry,
  PaymentMethodBreakdown,
  ProfitBlockView,
  ProfitBreakdownView,
  ServiceProfitLineView,
} from "@/lib/types";
import { LedgerEntryKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Boxes,
  ChevronDown,
  ChevronUp,
  Download,
  Package,
  Printer,
  RotateCcw,
  Scale,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mixed: "Mixto",
};

function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

function categoryLabel(category: string): string {
  return category;
}

interface PeriodPreset {
  id: string;
  label: string;
  range: () => { from: string; to: string };
}

/** `YYYY-MM-DD` for the first day of a Colombia month offset from today. */
function colombiaMonthStart(monthOffset: number): string {
  const parts = toColombiaParts(new Date());
  if (!parts) return "";
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + monthOffset, 1));
  return colombiaDateInput(BigInt(date.getTime()) * 1_000_000n);
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
      return {
        from: parts ? `${parts.year}-01-01` : "",
        to: "",
      };
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

interface BreakdownRow {
  label: string;
  total: bigint;
}

function BreakdownPanel({
  title,
  caption,
  rows,
  total,
  ocid,
}: {
  title: string;
  caption: string;
  rows: BreakdownRow[];
  total: bigint;
  ocid: string;
}) {
  const max = rows.reduce(
    (acc, row) => (row.total > acc ? row.total : acc),
    0n,
  );

  return (
    <section
      data-ocid={ocid}
      className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{caption}</p>
        </div>
        <p className="data-rail shrink-0 text-sm font-semibold">
          {formatMoney(total)}
        </p>
      </div>

      {rows.length === 0 ? (
        <p
          data-ocid={`${ocid}.empty_state`}
          className="px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Sin movimientos en el periodo seleccionado.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row, index) => {
            const share =
              total > 0n ? Number((row.total * 1000n) / total) / 10 : 0;
            const width =
              max > 0n ? Math.max(4, Number((row.total * 100n) / max)) : 0;
            return (
              <li
                key={row.label}
                data-ocid={`${ocid}.item.${index + 1}`}
                className="space-y-1.5 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {row.label}
                  </span>
                  <span className="data-rail shrink-0 text-sm">
                    {formatMoney(row.total)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="data-rail w-12 shrink-0 text-right text-[11px] text-muted-foreground">
                    {share.toFixed(1)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** One profit block (repuestos, servicios o total) with income, cost, margin. */
function ProfitBlockCard({
  block,
  ocid,
}: {
  block: ProfitBlockView;
  ocid: string;
}) {
  const isTotal = block.key === "total";
  const isServices = block.key === "services";
  return (
    <div
      data-ocid={ocid}
      className={cn(
        "space-y-3 rounded-lg border p-4",
        isTotal ? "border-primary/40 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold">{block.label}</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {isTotal ? "Consolidado" : "Periodo"}
        </span>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">
            {isServices ? "Valor cobrado" : "Ingreso"}
          </dt>
          <dd className="data-rail">{formatMoney(block.income)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">
            {isServices ? "Comisión del técnico" : "Costo"}
          </dt>
          <dd className="data-rail">{formatMoney(block.cost)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-1.5">
          <dt className="font-medium">
            {isServices ? "Utilidad del servicio" : "Margen"}
          </dt>
          <dd
            className={cn("data-rail font-semibold", marginTone(block.margin))}
          >
            {formatMoney(block.margin)}
          </dd>
        </div>
      </dl>

      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {isServices ? "Utilidad" : "Margen"}{" "}
        <span className={cn("data-rail", marginTone(block.margin))}>
          {formatBps(block.marginBps)}
        </span>
      </p>
    </div>
  );
}

/** Utilidad del periodo separada en repuestos, servicios y total. */
function ProfitBreakdownPanel({
  profit,
  ocid,
}: {
  profit: ProfitBreakdownView;
  ocid: string;
}) {
  return (
    <section
      data-ocid={ocid}
      className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-subtle"
    >
      <div className="min-w-0">
        <h2 className="font-display text-sm font-semibold">
          Utilidad por repuestos y servicios
        </h2>
        <p className="text-xs text-muted-foreground">
          Ingreso, costo y margen del rango de fechas seleccionado, con el total
          consolidado. La utilidad por servicio es el valor cobrado menos la
          comisión del técnico.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ProfitBlockCard block={profit.parts} ocid={`${ocid}.parts`} />
        <ProfitBlockCard block={profit.services} ocid={`${ocid}.services`} />
        <ProfitBlockCard block={profit.total} ocid={`${ocid}.total`} />
      </div>

      <ServiceProfitLinesPanel
        lines={profit.serviceLines}
        ocid={`${ocid}.service_lines`}
      />
    </section>
  );
}

/** Detalle por servicio: valor cobrado, comisión del técnico y utilidad. */
function ServiceProfitLinesPanel({
  lines,
  ocid,
}: {
  lines: ServiceProfitLineView[];
  ocid: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className="overflow-hidden rounded-lg border border-border"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold">
            Detalle por servicio
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            Valor cobrado, comisión del técnico y utilidad de cada línea de
            servicio facturada en el periodo
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {formatNumber(lines.length)} servicio
          {lines.length === 1 ? "" : "s"}
        </p>
      </div>

      {lines.length === 0 ? (
        <p
          data-ocid={`${ocid}.empty_state`}
          className="px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Sin servicios facturados en el periodo seleccionado.
        </p>
      ) : (
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="h-10 whitespace-nowrap px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Factura
                </th>
                <th
                  scope="col"
                  className="h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Descripción
                </th>
                <th
                  scope="col"
                  className="h-10 whitespace-nowrap px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Técnico
                </th>
                <th
                  scope="col"
                  className="h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Valor cobrado
                </th>
                <th
                  scope="col"
                  className="h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Comisión
                </th>
                <th
                  scope="col"
                  className="h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Utilidad
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr
                  key={line.key}
                  data-ocid={`${ocid}.row.${index + 1}`}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted/40",
                    index % 2 === 1 && "bg-muted/20",
                  )}
                >
                  <td className="data-rail whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {line.invoiceNumber}
                  </td>
                  <td className="max-w-[320px] px-4 py-2.5">
                    <span className="block truncate font-medium">
                      {line.description}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {line.technicianName || "Sin técnico"}
                  </td>
                  <td className="data-rail whitespace-nowrap px-4 py-2.5 text-right">
                    {formatMoney(line.charged)}
                  </td>
                  <td className="data-rail whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                    {formatMoney(line.commission)}
                  </td>
                  <td
                    className={cn(
                      "data-rail whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                      marginTone(line.profit),
                    )}
                  >
                    {formatMoney(line.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LedgerKindBadge({ kind }: { kind: LedgerEntryKind }) {
  const isIncome = kind === LedgerEntryKind.income;
  return (
    <StatusBadge
      label={isIncome ? "Ingreso" : "Egreso"}
      tone={isIncome ? "accepted" : "rejected"}
      icon={
        isIncome ? (
          <ArrowUpRight className="size-3" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="size-3" aria-hidden="true" />
        )
      }
    />
  );
}

// --- Valoración de inventario -------------------------------------------

/** Basis points (10000 = 100%) as a Spanish percentage with one decimal. */
function formatBps(bps: bigint | undefined | null): string {
  if (bps === undefined || bps === null) return "—";
  const percent = Number(bps) / 100;
  return `${percent.toFixed(1).replace(".", ",")} %`;
}

/** Average unit cost in cents: cost value over units, zero when there is none. */
function averageUnitCost(row: InventoryValuationRow): bigint {
  if (row.units <= 0n) return 0n;
  return row.costValue / row.units;
}

type ValuationSortKey =
  | "sku"
  | "name"
  | "units"
  | "costValue"
  | "saleValue"
  | "margin";

type SortDirection = "asc" | "desc";

interface ValuationSort {
  key: ValuationSortKey;
  direction: SortDirection;
}

interface ValuationSearch {
  q?: string;
  categoria?: string;
}

/** Normalizes the raw URL search params into the valuation filter state. */
function resolveValuationSearch(
  raw: Record<string, unknown>,
): Required<ValuationSearch> {
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    categoria: typeof raw.categoria === "string" ? raw.categoria : "",
  };
}

/** Signed margin tone: green when positive, red when negative. */
function marginTone(value: bigint): string {
  if (value < 0n) return "text-destructive";
  if (value > 0n) return "text-success";
  return "text-foreground";
}

interface ValuationKpiProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "primary" | "warning" | "info";
  ocid: string;
}

function ValuationKpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  ocid,
}: ValuationKpiProps) {
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

interface ReportHeaderProps {
  companyName: string;
  companyContact: string;
  companyLogoUrl?: string;
  fiscalLines: string[];
  cutoff: string;
}

/** Formal document header: company identity, report title and cutoff date. */
function ReportHeader({
  companyName,
  companyContact,
  companyLogoUrl,
  fiscalLines,
  cutoff,
}: ReportHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt=""
              data-ocid="accounting.valuation.document.logo"
              className="size-12 shrink-0 object-contain"
            />
          ) : null}
          <div className="min-w-0 space-y-1">
            <p className="font-display text-lg font-bold tracking-tight">
              {companyName}
            </p>
            {companyContact ? (
              <p className="report-muted text-xs">{companyContact}</p>
            ) : null}
            {fiscalLines.length > 0 ? (
              <div
                data-ocid="accounting.valuation.document.fiscal_block"
                className="space-y-0.5"
              >
                {fiscalLines.map((line) => (
                  <p key={line} className="report-muted text-xs">
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-semibold uppercase tracking-wider">
            Informe de valoración de inventario
          </p>
          <p className="report-muted text-xs">
            Inventario en bodega · sin filtro de fechas
          </p>
        </div>
      </div>

      <div className="report-rule" />

      <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <div className="flex justify-between gap-2">
          <dt className="report-muted">Fecha de corte</dt>
          <dd className="data-rail text-right">{cutoff}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="report-muted">Alcance</dt>
          <dd className="text-right">
            Inventario actual en bodega (foto del momento)
          </dd>
        </div>
      </dl>

      <div className="report-rule" />
    </header>
  );
}

const SIGNATURE_ROLES = ["Elaboró", "Revisó", "Aprobó"] as const;

/** Signature block: one line per role with room for nombre and cédula. */
function ReportSignatureBlock() {
  return (
    <section
      data-ocid="accounting.valuation.document.signature"
      className="space-y-4 pt-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] report-muted">
        Firmas
      </p>
      <div className="grid gap-8 sm:grid-cols-3">
        {SIGNATURE_ROLES.map((role) => (
          <div key={role} className="space-y-1">
            <div className="report-signature-line h-10" />
            <p className="text-xs font-semibold">{role}</p>
            <p className="report-muted text-[11px]">Nombre:</p>
            <p className="report-muted text-[11px]">Cédula:</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ValuationCategoryPanel({
  categories,
  totalSaleValue,
}: {
  categories: InventoryValuationCategory[];
  totalSaleValue: bigint;
}) {
  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a.saleValue === b.saleValue ? 0 : a.saleValue > b.saleValue ? -1 : 1,
      ),
    [categories],
  );

  const max = sorted.reduce(
    (acc, row) => (row.saleValue > acc ? row.saleValue : acc),
    0n,
  );

  return (
    <section
      data-ocid="accounting.valuation.category_breakdown"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold">
            Desglose por categoría
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            Costo, venta y margen agregados del inventario en bodega
          </p>
        </div>
        <p className="data-rail shrink-0 text-sm font-semibold">
          {formatMoney(totalSaleValue)}
        </p>
      </div>

      {sorted.length === 0 ? (
        <p
          data-ocid="accounting.valuation.category_breakdown.empty_state"
          className="px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Sin categorías valoradas.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((row, index) => {
            const share =
              totalSaleValue > 0n
                ? Number((row.saleValue * 1000n) / totalSaleValue) / 10
                : 0;
            const width =
              max > 0n ? Math.max(4, Number((row.saleValue * 100n) / max)) : 0;
            return (
              <li
                key={row.category}
                data-ocid={`accounting.valuation.category_breakdown.item.${index + 1}`}
                className="space-y-2 px-4 py-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {row.category}
                  </span>
                  <span className="data-rail shrink-0 text-sm">
                    {formatMoney(row.saleValue)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="data-rail w-12 shrink-0 text-right text-[11px] text-muted-foreground">
                    {share.toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <span>
                    Costo{" "}
                    <span className="data-rail text-foreground">
                      {formatMoney(row.costValue)}
                    </span>
                  </span>
                  <span>
                    Margen{" "}
                    <span className={cn("data-rail", marginTone(row.margin))}>
                      {formatMoney(row.margin)}
                    </span>
                  </span>
                  <span>
                    {formatNumber(row.partCount)} rep. ·{" "}
                    {formatNumber(row.units)} und.
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

interface SortableHeadProps {
  label: string;
  sortKey: ValuationSortKey;
  sort: ValuationSort;
  onSort: (key: ValuationSortKey) => void;
  numeric?: boolean;
  ocid: string;
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  numeric,
  ocid,
}: SortableHeadProps) {
  const active = sort.key === sortKey;
  const Icon = !active
    ? ArrowUpDown
    : sort.direction === "asc"
      ? ChevronUp
      : ChevronDown;

  return (
    <th
      scope="col"
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={cn(
        "h-10 whitespace-nowrap px-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        numeric ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        data-ocid={ocid}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          numeric && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3" aria-hidden="true" />
      </button>
    </th>
  );
}

function ValuationTable({
  rows,
  sort,
  onSort,
  hasFilters,
  onClearFilters,
}: {
  rows: InventoryValuationRow[];
  sort: ValuationSort;
  onSort: (key: ValuationSortKey) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  if (rows.length === 0) {
    return (
      <div
        data-ocid="accounting.valuation.table.empty_state"
        className="flex flex-col items-center gap-3 px-6 py-16 text-center"
      >
        <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
          <Package
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold">
            Sin repuestos que coincidan
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Ajusta la búsqueda o el filtro de categoría para ver otros repuestos
            valorados. El costo de cada repuesto se toma de su precio de costo
            por la existencia actual.
          </p>
        </div>
        {hasFilters ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
            data-ocid="accounting.valuation.table.empty_clear_button"
          >
            Limpiar filtros
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="scroll-slim overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            <SortableHead
              label="SKU"
              sortKey="sku"
              sort={sort}
              onSort={onSort}
              ocid="accounting.valuation.sort.sku"
            />
            <SortableHead
              label="Nombre"
              sortKey="name"
              sort={sort}
              onSort={onSort}
              ocid="accounting.valuation.sort.name"
            />
            <th
              scope="col"
              className="h-10 whitespace-nowrap px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              Categoría
            </th>
            <SortableHead
              label="Existencia"
              sortKey="units"
              sort={sort}
              onSort={onSort}
              numeric
              ocid="accounting.valuation.sort.units"
            />
            <th
              scope="col"
              className="h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              Costo unitario (precio de costo)
            </th>
            <SortableHead
              label="Valor de costo"
              sortKey="costValue"
              sort={sort}
              onSort={onSort}
              numeric
              ocid="accounting.valuation.sort.cost_value"
            />
            <SortableHead
              label="Valor de venta"
              sortKey="saleValue"
              sort={sort}
              onSort={onSort}
              numeric
              ocid="accounting.valuation.sort.sale_value"
            />
            <SortableHead
              label="Margen $"
              sortKey="margin"
              sort={sort}
              onSort={onSort}
              numeric
              ocid="accounting.valuation.sort.margin"
            />
            <th
              scope="col"
              className="h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              Margen %
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.partId.toString()}
              data-ocid={`accounting.valuation.row.${index + 1}`}
              className={cn(
                "border-b border-border transition-colors hover:bg-muted/40",
                index % 2 === 1 && "bg-muted/20",
              )}
            >
              <td className="data-rail whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                {row.sku}
              </td>
              <td className="max-w-[280px] px-4 py-2.5">
                <span className="block truncate font-medium">{row.name}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                {row.category}
              </td>
              <td className="data-rail whitespace-nowrap px-4 py-2.5 text-right">
                {formatNumber(row.units)}
              </td>
              <td className="data-rail whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground">
                {formatMoney(averageUnitCost(row))}
              </td>
              <td className="data-rail whitespace-nowrap px-4 py-2.5 text-right">
                {formatMoney(row.costValue)}
              </td>
              <td className="data-rail whitespace-nowrap px-4 py-2.5 text-right">
                {formatMoney(row.saleValue)}
              </td>
              <td
                className={cn(
                  "data-rail whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                  marginTone(row.margin),
                )}
              >
                {formatMoney(row.margin)}
              </td>
              <td
                className={cn(
                  "data-rail whitespace-nowrap px-4 py-2.5 text-right",
                  marginTone(row.margin),
                )}
              >
                {formatBps(row.marginBps)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AccountingPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const period = useMemo<AccountingPeriod>(
    () => ({
      from: colombiaStartOfDay(from) ?? undefined,
      to: colombiaEndOfDay(to) ?? undefined,
    }),
    [from, to],
  );

  const reportQuery = useAccountingReport(period);
  const report = reportQuery.data ?? null;
  const summary = report?.summary ?? null;
  const entries = report?.entries ?? [];

  const profitView = useMemo<ProfitBreakdownView | null>(
    () => report?.profit ?? null,
    [report],
  );

  const applyPreset = useCallback((preset: PeriodPreset) => {
    const range = preset.range();
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset.id);
  }, []);

  const clearFilters = useCallback(() => {
    setFrom("");
    setTo("");
    setActivePreset(null);
  }, []);

  const hasFilters = from !== "" || to !== "";

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) =>
        a.date === b.date ? 0 : a.date > b.date ? -1 : 1,
      ),
    [entries],
  );

  const categoryRows = useMemo<BreakdownRow[]>(
    () =>
      [...(report?.byExpenseCategory ?? [])]
        .sort((a, b) => (a.total === b.total ? 0 : a.total > b.total ? -1 : 1))
        .map((row: CategoryBreakdown) => ({
          label: categoryLabel(row.category),
          total: row.total,
        })),
    [report?.byExpenseCategory],
  );

  const methodRows = useMemo<BreakdownRow[]>(
    () =>
      [...(report?.byPaymentMethod ?? [])]
        .sort((a, b) => (a.total === b.total ? 0 : a.total > b.total ? -1 : 1))
        .map((row: PaymentMethodBreakdown) => ({
          label: paymentMethodLabel(row.method),
          total: row.total,
        })),
    [report?.byPaymentMethod],
  );

  const exportSummary = useCallback(() => {
    if (!summary) return;
    const rows = [
      {
        Concepto: "Ingresos",
        Monto: (Number(summary.totalIncome) / 100).toFixed(2),
      },
      {
        Concepto: "Gastos",
        Monto: (Number(summary.totalExpenses) / 100).toFixed(2),
      },
      {
        Concepto: "Utilidad",
        Monto: (Number(summary.profit) / 100).toFixed(2),
      },
      {
        Concepto: "Facturas pagadas",
        Monto: summary.invoiceCount.toString(),
      },
      {
        Concepto: "Gastos registrados",
        Monto: summary.expenseCount.toString(),
      },
      { Concepto: "Periodo desde", Monto: from || "inicio" },
      { Concepto: "Periodo hasta", Monto: to || "hoy" },
    ];

    if (profitView) {
      for (const block of [
        profitView.parts,
        profitView.services,
        profitView.total,
      ]) {
        rows.push(
          {
            Concepto: `${block.label} · Ingreso`,
            Monto: (Number(block.income) / 100).toFixed(2),
          },
          {
            Concepto: `${block.label} · Costo`,
            Monto: (Number(block.cost) / 100).toFixed(2),
          },
          {
            Concepto: `${block.label} · Comisión del técnico`,
            Monto: (Number(block.commission) / 100).toFixed(2),
          },
          {
            Concepto: `${block.label} · Margen`,
            Monto: (Number(block.margin) / 100).toFixed(2),
          },
          {
            Concepto: `${block.label} · Margen %`,
            Monto: formatBps(block.marginBps),
          },
        );
      }
    }

    void downloadXlsx(
      `contabilidad-resumen-${from || "inicio"}-${to || "hoy"}`,
      "Resumen",
      ["Concepto", "Monto"],
      rows,
    );
  }, [summary, profitView, from, to]);

  const profitTone =
    summary && summary.profit < 0n ? "text-destructive" : "text-foreground";

  // --- Valoración de inventario (foto del inventario actual) --------------

  const [valuationSort, setValuationSort] = useState<ValuationSort>({
    key: "saleValue",
    direction: "desc",
  });

  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const valuationSearchParams = useMemo(
    () => resolveValuationSearch(rawSearch),
    [rawSearch],
  );
  const valuationSearch = valuationSearchParams.q;
  const valuationCategory = valuationSearchParams.categoria;

  // Keep the input in sync when the URL changes from outside (back/forward).
  const [valuationTerm, setValuationTerm] = useState(valuationSearch);
  useEffect(() => {
    setValuationTerm(valuationSearch);
  }, [valuationSearch]);

  const applyValuationSearch = useCallback(
    (patch: Partial<ValuationSearch>) => {
      void navigate({
        to: "/contabilidad",
        search: (prev: Record<string, unknown>) => {
          const next: Record<string, unknown> = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === undefined || value === false) {
              delete next[key];
            }
          }
          return next;
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (valuationTerm === valuationSearch) return;
    const handle = window.setTimeout(() => {
      applyValuationSearch({ q: valuationTerm });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [valuationTerm, valuationSearch, applyValuationSearch]);

  const valuationQuery = useInventoryValuation();
  const valuation = valuationQuery.data ?? null;
  const valuationRows = useMemo(() => valuation?.rows ?? [], [valuation?.rows]);
  const valuationTotals = valuation?.totals ?? null;

  // --- Documento formal del informe ---------------------------------------

  const companyQuery = useCompanyProfile();
  const company = companyQuery.data ?? null;

  const companyName = company?.legalName || "HR SOLUCIONES INTEGRALES";
  const companyContact = [
    company?.address,
    company?.city,
    company?.phone,
    company?.email,
  ]
    .filter((part): part is string => !!part && part.trim() !== "")
    .join(" · ");
  const companyFiscalLines = company
    ? [
        formatNit(company.taxId, company.checkDigit),
        fiscalRegimeLabel(company.fiscalRegime),
        taxResponsibilityLabel(company.taxResponsibility),
      ]
    : [];

  // Cutoff is the moment the report is generated, in Colombia time.
  const [cutoffAt] = useState(() => new Date());
  const cutoffLabel = formatDateTime(BigInt(cutoffAt.getTime()) * 1_000_000n);

  const printValuation = useCallback(() => {
    window.print();
  }, []);

  const valuationCategories = useMemo(
    () =>
      [...(valuation?.byCategory ?? [])].sort((a, b) =>
        a.category.localeCompare(b.category, "es"),
      ),
    [valuation?.byCategory],
  );

  const filteredValuationRows = useMemo(() => {
    const term = valuationSearch.trim().toLowerCase();
    return valuationRows.filter((row) => {
      const matchesTerm =
        term === "" ||
        row.name.toLowerCase().includes(term) ||
        row.sku.toLowerCase().includes(term);
      const matchesCategory =
        valuationCategory === "" || row.category === valuationCategory;
      return matchesTerm && matchesCategory;
    });
  }, [valuationRows, valuationSearch, valuationCategory]);

  const sortedValuationRows = useMemo(() => {
    const factor = valuationSort.direction === "asc" ? 1 : -1;
    return [...filteredValuationRows].sort((a, b) => {
      switch (valuationSort.key) {
        case "sku":
          return factor * a.sku.localeCompare(b.sku, "es");
        case "name":
          return factor * a.name.localeCompare(b.name, "es");
        case "units":
          return (
            factor * (a.units === b.units ? 0 : a.units > b.units ? 1 : -1)
          );
        case "costValue":
          return (
            factor *
            (a.costValue === b.costValue
              ? 0
              : a.costValue > b.costValue
                ? 1
                : -1)
          );
        case "saleValue":
          return (
            factor *
            (a.saleValue === b.saleValue
              ? 0
              : a.saleValue > b.saleValue
                ? 1
                : -1)
          );
        case "margin":
          return (
            factor * (a.margin === b.margin ? 0 : a.margin > b.margin ? 1 : -1)
          );
        default:
          return 0;
      }
    });
  }, [filteredValuationRows, valuationSort]);

  const toggleValuationSort = useCallback((key: ValuationSortKey) => {
    setValuationSort((current) =>
      current.key === key
        ? {
            key,
            direction: current.direction === "asc" ? "desc" : "asc",
          }
        : { key, direction: key === "sku" || key === "name" ? "asc" : "desc" },
    );
  }, []);

  const clearValuationFilters = useCallback(() => {
    setValuationTerm("");
    applyValuationSearch({ q: "", categoria: "" });
  }, [applyValuationSearch]);

  const hasValuationFilters =
    valuationSearch.trim() !== "" || valuationCategory !== "";

  const exportValuation = useCallback(() => {
    if (!valuation || !valuationTotals) return;
    const headers = [
      "SKU",
      "Nombre",
      "Categoría",
      "Existencia",
      "Costo unitario promedio",
      "Valor de costo",
      "Valor de venta",
      "Margen $",
      "Margen %",
    ];
    const rows = valuation.rows.map((row) => ({
      SKU: row.sku,
      Nombre: row.name,
      Categoría: row.category,
      Existencia: row.units.toString(),
      "Costo unitario promedio": formatMoney(averageUnitCost(row)),
      "Valor de costo": formatMoney(row.costValue),
      "Valor de venta": formatMoney(row.saleValue),
      "Margen $": formatMoney(row.margin),
      "Margen %": formatBps(row.marginBps),
    }));
    rows.push({
      SKU: "TOTAL",
      Nombre: `${formatNumber(valuationTotals.partCount)} repuestos valorados`,
      Categoría: "",
      Existencia: valuationTotals.totalUnits.toString(),
      "Costo unitario promedio": "",
      "Valor de costo": formatMoney(valuationTotals.totalCostValue),
      "Valor de venta": formatMoney(valuationTotals.totalSaleValue),
      "Margen $": formatMoney(valuationTotals.totalMargin),
      "Margen %": formatBps(valuationTotals.marginBps),
    });
    void downloadXlsx("valoracion-inventario", "Valoración", headers, rows);
  }, [valuation, valuationTotals]);

  const valuationIsEmpty =
    !valuationQuery.isLoading &&
    !valuationQuery.isError &&
    valuationRows.length === 0;

  return (
    <div
      data-ocid="accounting.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Contabilidad"
        description="Ingresos, gastos y utilidad del taller por periodo, con libro de movimientos y desgloses."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={exportSummary}
            disabled={!summary}
            data-ocid="accounting.export_button"
            className="gap-2"
          >
            <Download className="size-4" aria-hidden="true" />
            Exportar resumen Excel
          </Button>
        }
      />

      <section
        data-ocid="accounting.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {PERIOD_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={activePreset === preset.id ? "default" : "outline"}
                onClick={() => applyPreset(preset)}
                data-ocid={`accounting.period.${preset.id}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="accounting-from"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Desde
            </Label>
            <Input
              id="accounting-from"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setActivePreset(null);
              }}
              className="data-rail w-[160px]"
              data-ocid="accounting.date_from_input"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="accounting-to"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Hasta
            </Label>
            <Input
              id="accounting-to"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setActivePreset(null);
              }}
              className="data-rail w-[160px]"
              data-ocid="accounting.date_to_input"
            />
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="accounting.clear_filters_button"
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      {reportQuery.isError ? (
        <div
          data-ocid="accounting.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No se pudo cargar el reporte contable.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void reportQuery.refetch()}
            data-ocid="accounting.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <section
            data-ocid="accounting.kpis"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {reportQuery.isLoading || !summary ? (
              <>
                <KpiSkeleton ocid="accounting.kpi.income" />
                <KpiSkeleton ocid="accounting.kpi.expenses" />
                <KpiSkeleton ocid="accounting.kpi.profit" />
                <KpiSkeleton ocid="accounting.kpi.counts" />
              </>
            ) : (
              <>
                <KpiCard
                  ocid="accounting.kpi.income"
                  label="Ingresos"
                  value={formatMoney(summary.totalIncome)}
                  hint="Facturas pagadas en el periodo"
                  icon={TrendingUp}
                  tone="primary"
                />
                <KpiCard
                  ocid="accounting.kpi.expenses"
                  label="Gastos"
                  value={formatMoney(summary.totalExpenses)}
                  hint="Egresos registrados en el periodo"
                  icon={Wallet}
                  tone="warning"
                />
                <KpiCard
                  ocid="accounting.kpi.profit"
                  label="Utilidad"
                  value={formatMoney(summary.profit)}
                  hint="Ingresos menos gastos"
                  icon={Scale}
                  tone="info"
                />
                <KpiCard
                  ocid="accounting.kpi.counts"
                  label="Movimientos"
                  value={formatNumber(
                    summary.invoiceCount + summary.expenseCount,
                  )}
                  hint={`${formatNumber(summary.invoiceCount)} facturas · ${formatNumber(summary.expenseCount)} gastos`}
                  icon={ArrowUpRight}
                  tone="primary"
                />
              </>
            )}
          </section>

          {reportQuery.isLoading || !profitView ? (
            <section
              data-ocid="accounting.profit.loading_state"
              className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-subtle"
            >
              <Skeleton className="h-4 w-56" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from(
                  { length: 3 },
                  (_, index) => `profit-block-${index}`,
                ).map((id) => (
                  <Skeleton key={id} className="h-40 w-full" />
                ))}
              </div>
            </section>
          ) : (
            <ProfitBreakdownPanel
              profit={profitView}
              ocid="accounting.profit"
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownPanel
              ocid="accounting.category_breakdown"
              title="Gastos por categoría"
              caption="Distribución de egresos del periodo"
              rows={categoryRows}
              total={summary?.totalExpenses ?? 0n}
            />
            <BreakdownPanel
              ocid="accounting.method_breakdown"
              title="Ingresos por método de pago"
              caption="Cobros agrupados por forma de pago"
              rows={methodRows}
              total={summary?.totalIncome ?? 0n}
            />
          </div>
          <section
            data-ocid="accounting.ledger"
            className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold">
                  Libro de movimientos
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  Facturas pagadas y gastos registrados consolidados
                </p>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {reportQuery.isLoading
                  ? "Cargando…"
                  : `${formatNumber(sortedEntries.length)} movimiento${sortedEntries.length === 1 ? "" : "s"}`}
              </p>
            </div>

            {reportQuery.isLoading ? (
              <div
                data-ocid="accounting.ledger.loading_state"
                className="space-y-2 p-4"
              >
                {Array.from({ length: 6 }, (_, index) => `ledger-${index}`).map(
                  (id) => (
                    <Skeleton key={id} className="h-9 w-full" />
                  ),
                )}
              </div>
            ) : sortedEntries.length === 0 ? (
              <div
                data-ocid="accounting.ledger.empty_state"
                className="flex flex-col items-center gap-3 px-6 py-16 text-center"
              >
                <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
                  <Scale
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-display text-sm font-semibold">
                    Sin movimientos en el periodo
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Ajusta el rango de fechas o registra facturas y gastos para
                    verlos consolidados aquí.
                  </p>
                </div>
                {hasFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    data-ocid="accounting.ledger.empty_clear_button"
                  >
                    Limpiar filtros
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="scroll-slim overflow-x-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border">
                      <th className="h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Fecha
                      </th>
                      <th className="h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Concepto
                      </th>
                      <th className="h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Categoría
                      </th>
                      <th className="h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Tipo
                      </th>
                      <th className="h-10 px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry: LedgerEntry, index) => {
                      const isIncome = entry.kind === LedgerEntryKind.income;
                      return (
                        <tr
                          key={entry.id.toString()}
                          data-ocid={`accounting.ledger.row.${index + 1}`}
                          className="border-b border-border transition-colors hover:bg-muted/40"
                        >
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                            {formatDate(entry.date)}
                          </td>
                          <td className="max-w-[320px] px-4 py-2.5">
                            <span className="block truncate font-medium">
                              {entry.concept}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {categoryLabel(entry.category)}
                          </td>
                          <td className="px-4 py-2.5">
                            <LedgerKindBadge kind={entry.kind} />
                          </td>
                          <td
                            className={cn(
                              "data-rail whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                              isIncome ? "text-success" : "text-destructive",
                            )}
                          >
                            {isIncome ? "+" : "−"}
                            {formatMoney(entry.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!reportQuery.isLoading && sortedEntries.length > 0 ? (
              <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border px-4 py-2.5">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Ingresos{" "}
                  <span className="data-rail text-success">
                    {formatMoney(summary?.totalIncome ?? 0n)}
                  </span>
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Egresos{" "}
                  <span className="data-rail text-destructive">
                    {formatMoney(summary?.totalExpenses ?? 0n)}
                  </span>
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Utilidad{" "}
                  <span className={cn("data-rail font-semibold", profitTone)}>
                    {formatMoney(summary?.profit ?? 0n)}
                  </span>
                </p>
              </div>
            ) : null}
          </section>
        </>
      )}

      <section
        data-ocid="accounting.valuation.section"
        className="space-y-4 border-t border-border pt-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Inventario
            </p>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Valoración de inventario
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Documento formal del inventario actual en bodega, sin filtro de
              fechas: el valor de costo es el precio de costo de cada repuesto
              por su existencia, el valor de venta es el precio de venta por la
              existencia y el margen de utilidad se calcula sobre el valor de
              venta.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={printValuation}
              disabled={!valuation || valuationRows.length === 0}
              data-ocid="accounting.valuation.print_button"
              className="gap-2"
            >
              <Printer className="size-4" aria-hidden="true" />
              Imprimir / Guardar PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={exportValuation}
              disabled={!valuation || valuationRows.length === 0}
              data-ocid="accounting.valuation.export_button"
              className="gap-2"
            >
              <Download className="size-4" aria-hidden="true" />
              Exportar valoración Excel
            </Button>
          </div>
        </div>

        {valuationQuery.isError ? (
          <div
            data-ocid="accounting.valuation.error_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
          >
            <AlertTriangle
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No se pudo cargar la valoración del inventario.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void valuationQuery.refetch()}
              data-ocid="accounting.valuation.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : valuationQuery.isLoading || !valuationTotals ? (
          <div
            data-ocid="accounting.valuation.loading_state"
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from(
                { length: 4 },
                (_, index) => `valuation-kpi-${index}`,
              ).map((id) => (
                <KpiSkeleton key={id} ocid={`accounting.valuation.kpi.${id}`} />
              ))}
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-card p-4 shadow-subtle">
              {Array.from(
                { length: 6 },
                (_, index) => `valuation-row-${index}`,
              ).map((id) => (
                <Skeleton key={id} className="h-9 w-full" />
              ))}
            </div>
          </div>
        ) : valuationIsEmpty ? (
          <div
            data-ocid="accounting.valuation.empty_state"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <Boxes
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                Sin inventario valorado
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Registra repuestos con su precio de costo y su precio de venta
                para ver aquí el valor de costo, el valor de venta y el margen
                de utilidad del inventario en bodega.
              </p>
            </div>
          </div>
        ) : (
          <div
            data-ocid="accounting.valuation.document"
            className="scroll-slim overflow-x-auto py-2"
          >
            <div className="report-sheet invoice-sheet space-y-5">
              <ReportHeader
                companyName={companyName}
                companyContact={companyContact}
                companyLogoUrl={company?.logoUrl ?? undefined}
                fiscalLines={companyFiscalLines}
                cutoff={cutoffLabel}
              />

              <div
                data-ocid="accounting.valuation.kpis"
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              >
                <ValuationKpi
                  ocid="accounting.valuation.kpi.cost_value"
                  label="Valor de costo"
                  value={formatMoney(valuationTotals.totalCostValue)}
                  hint="Precio de costo del repuesto × existencia"
                  icon={Wallet}
                  tone="primary"
                />
                <ValuationKpi
                  ocid="accounting.valuation.kpi.sale_value"
                  label="Valor de venta"
                  value={formatMoney(valuationTotals.totalSaleValue)}
                  hint="Precio de venta × existencia actual"
                  icon={TrendingUp}
                  tone="primary"
                />
                <ValuationKpi
                  ocid="accounting.valuation.kpi.margin"
                  label="Margen de utilidad"
                  value={formatMoney(valuationTotals.totalMargin)}
                  hint={`${formatBps(valuationTotals.marginBps)} sobre el valor de venta`}
                  icon={Scale}
                  tone="info"
                />
                <ValuationKpi
                  ocid="accounting.valuation.kpi.parts"
                  label="Repuestos valorados"
                  value={formatNumber(valuationTotals.partCount)}
                  hint={`${formatNumber(valuationTotals.totalUnits)} unidades en bodega`}
                  icon={Package}
                  tone="warning"
                />
              </div>

              <ValuationCategoryPanel
                categories={valuationCategories}
                totalSaleValue={valuationTotals.totalSaleValue}
              />

              <section
                data-ocid="accounting.valuation.table_panel"
                className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
              >
                <div className="no-print flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold">
                      Repuestos valorados
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatNumber(sortedValuationRows.length)} de{" "}
                      {formatNumber(valuationRows.length)} repuestos
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        type="search"
                        value={valuationTerm}
                        onChange={(event) =>
                          setValuationTerm(event.target.value)
                        }
                        placeholder="Buscar por nombre o SKU"
                        aria-label="Buscar repuesto por nombre o SKU"
                        className="w-[220px] pl-8"
                        data-ocid="accounting.valuation.search_input"
                      />
                    </div>
                    <select
                      value={valuationCategory}
                      onChange={(event) =>
                        applyValuationSearch({ categoria: event.target.value })
                      }
                      aria-label="Filtrar por categoría"
                      data-ocid="accounting.valuation.category_select"
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Todas las categorías</option>
                      {valuationCategories.map((category) => (
                        <option
                          key={category.category}
                          value={category.category}
                        >
                          {category.category}
                        </option>
                      ))}
                    </select>
                    {hasValuationFilters ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={clearValuationFilters}
                        data-ocid="accounting.valuation.clear_filters_button"
                        className="gap-2 text-muted-foreground"
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Limpiar
                      </Button>
                    ) : null}
                  </div>
                </div>

                <ValuationTable
                  rows={sortedValuationRows}
                  sort={valuationSort}
                  onSort={toggleValuationSort}
                  hasFilters={hasValuationFilters}
                  onClearFilters={clearValuationFilters}
                />

                <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border px-4 py-2.5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Costo{" "}
                    <span className="data-rail text-foreground">
                      {formatMoney(valuationTotals.totalCostValue)}
                    </span>
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Venta{" "}
                    <span className="data-rail text-foreground">
                      {formatMoney(valuationTotals.totalSaleValue)}
                    </span>
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Margen{" "}
                    <span
                      className={cn(
                        "data-rail font-semibold",
                        marginTone(valuationTotals.totalMargin),
                      )}
                    >
                      {formatMoney(valuationTotals.totalMargin)} ·{" "}
                      {formatBps(valuationTotals.marginBps)}
                    </span>
                  </p>
                </div>
              </section>

              <ReportSignatureBlock />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AccountingPage;
