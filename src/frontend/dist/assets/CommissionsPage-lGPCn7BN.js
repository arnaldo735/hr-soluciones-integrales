import { j as jsxRuntimeExports, F as FileText, B as Button, z as formatDate, aj as formatDateTime, y as formatMoney, Z as cn, k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation, t as reactExports, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, o as formatNumber, T as TriangleAlert, a3 as DialogFooter, az as CircleCheck, ak as LoaderCircle, av as ue, aK as colombiaEndOfDay, aL as colombiaStartOfDay, K as Label, w as Input, U as Users, b8 as toColombiaParts, e as Wallet, g as Banknote, H as HandCoins, aY as colombiaDateInput } from "./index-EqGEeyjs.js";
import { D as Download } from "./download-C8tLpeh6.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { b as downloadCommissionPaymentPdf, p as pdfCompanyFromProfile, c as downloadCommissionReportPdf } from "./pdf-BjjrMDP3.js";
import { D as DataTable } from "./DataTable-BGUSfdBQ.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { S as StatusBadge } from "./StatusBadge-DoLeoyAw.js";
import { C as Card, c as CardContent } from "./card-YKA4f36t.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { u as useCompanyProfile } from "./use-company-B0ILLjch.js";
import { u as useTechnicians } from "./use-technicians-BvNsJs-Y.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import "./download-DPgaDAHv.js";
import "./warranty-BU5LnZHy.js";
import "./alert-dialog-qVL9cwOA.js";
import "./table-Dz_wGPQA.js";
import "./trash-2-HQabmlQI.js";
import "./check-LdjEv5O-.js";
import "./pencil-BajrtuU3.js";
function motorcycleLabel(line) {
  const model = `${line.motorcycleBrand} ${line.motorcycleModel}`.trim();
  const plate = line.motorcyclePlate.trim();
  if (model === "" && plate === "") return "—";
  if (plate === "") return model;
  if (model === "") return plate;
  return `${model} · ${plate}`;
}
function rateLabel(rate) {
  return `${Math.round(Number(rate))}%`;
}
function periodLabel(from, to) {
  if (from === void 0 && to === void 0) return "Todo el historial";
  const start = from === void 0 ? "Inicio" : formatDate(from);
  const end = to === void 0 ? "Hoy" : formatDate(to);
  return `${start} — ${end}`;
}
function CommissionDocument(props) {
  const { company, onDownload, isDownloading } = props;
  const ocid = props.ocid ?? "commissions.document";
  const title = props.kind === "receipt" ? "Comprobante de comisión" : "Reporte de comisiones";
  const subtitle = props.kind === "receipt" ? `Comprobante ${props.payment.id.toString()} · ${periodLabel(
    props.payment.period.from,
    props.payment.period.to
  )}` : `Reporte general · ${periodLabel(
    props.report.period.from,
    props.report.period.to
  )}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": ocid, className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-print flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-3.5", "aria-hidden": "true" }),
        "Documento PDF"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          size: "sm",
          onClick: onDownload,
          disabled: isDownloading,
          "data-ocid": `${ocid}.download_button`,
          className: "gap-1.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
            isDownloading ? "Generando…" : "Descargar PDF"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "doc-preview doc-preview-a4 invoice-sheet", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
          company.logo ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: company.logo,
              alt: "",
              "data-ocid": `${ocid}.logo`,
              className: "size-12 shrink-0 object-contain"
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-title font-display text-lg font-bold tracking-tight", children: company.name }),
            company.contact ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: company.contact }) : null,
            company.fiscal && company.fiscal.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 space-y-0.5", children: company.fiscal.filter((line) => line.trim() !== "").map((line) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: line }, line)) }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold uppercase tracking-wider", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs", children: subtitle })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
      props.kind === "receipt" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ReceiptBody, { payment: props.payment, lines: props.lines }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ReportBody, { report: props.report }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-center text-[10px]", children: "Solo la mano de obra vinculada a un servicio del catálogo de taller genera comisión. Cada línea se paga una sola vez. Los préstamos pendientes se deducen completos al pagar la comisión." })
    ] }) })
  ] });
}
function ReceiptBody({
  payment,
  lines
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid grid-cols-2 gap-x-4 gap-y-1 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetaRow,
        {
          label: "Técnico",
          value: `${payment.technicianName} (${payment.technicianCode})`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MetaRow, { label: "Pagado el", value: formatDateTime(payment.paidAt) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetaRow,
        {
          label: "Periodo",
          value: periodLabel(payment.period.from, payment.period.to)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        MetaRow,
        {
          label: "Líneas de mano de obra",
          value: payment.lineCount.toString()
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-xs font-semibold", children: "Desglose por servicio y moto" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "mt-1 w-full text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Fecha" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Orden" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Servicio" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Moto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Base" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Comisión" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: lines.map((line) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail py-0.5 pr-2", children: formatDate(line.serviceDate) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail py-0.5 pr-2", children: line.orderNumber }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 pr-2", children: line.serviceName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 pr-2", children: motorcycleLabel(line) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular", children: formatMoney(line.baseAmount) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-0.5 text-right tabular", children: [
          rateLabel(line.commissionRate),
          " ·",
          " ",
          formatMoney(line.commissionAmount)
        ] })
      ] }, line.laborId.toString())) })
    ] }) }),
    payment.loans.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-xs font-semibold", children: "Préstamos deducidos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "mt-1 w-full text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Fecha" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Nota" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Importe" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: payment.loans.map((loan) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail py-0.5 pr-2", children: formatDate(loan.date) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 pr-2", children: loan.note ?? "Préstamo a técnico" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular", children: formatMoney(loan.amount) })
        ] }, loan.loanId.toString())) })
      ] }) })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "ml-auto w-full max-w-[240px] space-y-1 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Base de mano de obra",
          value: formatMoney(payment.baseAmount)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Comisión generada",
          value: formatMoney(payment.commissionAmount)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Préstamos deducidos",
          value: `- ${formatMoney(payment.loansDeducted)}`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Neto pagado",
          value: formatMoney(payment.netPaid),
          emphasis: true
        }
      )
    ] })
  ] });
}
function ReportBody({ report }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: "Solo la mano de obra vinculada a un servicio del catálogo de taller genera comisión. Las líneas libres y los repuestos no comisionan." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "mt-2 w-full text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Código" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Técnico" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Base" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Comisión" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Préstamos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Neto" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: report.technicians.map((summary) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail py-0.5 pr-2", children: summary.technicianCode }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 pr-2", children: summary.technicianName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular", children: formatMoney(summary.baseAmount) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-0.5 text-right tabular", children: [
          rateLabel(summary.commissionRate),
          " ·",
          " ",
          formatMoney(summary.commissionAmount)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular", children: formatMoney(summary.pendingLoansAmount) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular font-semibold", children: formatMoney(summary.netPayable) })
      ] }, summary.technicianId.toString())) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "ml-auto w-full max-w-[260px] space-y-1 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Base total de mano de obra",
          value: formatMoney(report.totalBase)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Comisión total",
          value: formatMoney(report.totalCommission)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Préstamos pendientes",
          value: formatMoney(report.totalPendingLoans)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        TotalRow,
        {
          label: "Total neto a pagar",
          value: formatMoney(report.totalNetPayable),
          emphasis: true
        }
      )
    ] })
  ] });
}
function MetaRow({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "doc-meta", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-right", children: value })
  ] });
}
function TotalRow({
  label,
  value,
  emphasis
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "flex justify-between gap-3",
        emphasis && "font-display text-sm font-bold"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: cn(!emphasis && "doc-meta"), children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-right tabular", children: value })
      ]
    }
  );
}
function periodKey(period) {
  var _a, _b;
  return [((_a = period.from) == null ? void 0 : _a.toString()) ?? "none", ((_b = period.to) == null ? void 0 : _b.toString()) ?? "none"];
}
function useCommissionLines(technicianId, period) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const [from, to] = periodKey(period);
  return useQuery({
    queryKey: ["commission-lines", (technicianId == null ? void 0 : technicianId.toString()) ?? "all", from, to],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCommissionLines(token, technicianId, period);
    },
    enabled: !!actor && !isFetching
  });
}
function useTechnicianCommissionSummary(technicianId, period) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const [from, to] = periodKey(period);
  return useQuery({
    queryKey: [
      "technician-commission-summary",
      (technicianId == null ? void 0 : technicianId.toString()) ?? "none",
      from,
      to
    ],
    queryFn: async () => {
      if (!actor || technicianId === null) return null;
      return actor.getTechnicianCommissionSummary(token, technicianId, period);
    },
    enabled: !!actor && !isFetching && technicianId !== null
  });
}
function useCommissionReport(period) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const [from, to] = periodKey(period);
  return useQuery({
    queryKey: ["commission-report", from, to],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCommissionReport(token, period);
    },
    enabled: !!actor && !isFetching
  });
}
function useTechnicianLoans(technicianId, pendingOnly = false) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "technician-loans",
      (technicianId == null ? void 0 : technicianId.toString()) ?? "all",
      pendingOnly
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTechnicianLoans(token, {
        technicianId: technicianId ?? void 0,
        pendingOnly: pendingOnly ? true : void 0
      });
    },
    enabled: !!actor && !isFetching
  });
}
function useCreateTechnicianLoan() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createTechnicianLoan(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technician-loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-commission-summary"]
      });
      void queryClient.invalidateQueries({ queryKey: ["commission-report"] });
    }
  });
}
function useDeleteTechnicianLoan() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteTechnicianLoan(token, id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["technician-loans"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-commission-summary"]
      });
      void queryClient.invalidateQueries({ queryKey: ["commission-report"] });
    }
  });
}
function usePayTechnicianCommission() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.payTechnicianCommission(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["commission-lines"] });
      void queryClient.invalidateQueries({
        queryKey: ["technician-commission-summary"]
      });
      void queryClient.invalidateQueries({ queryKey: ["commission-report"] });
      void queryClient.invalidateQueries({ queryKey: ["technician-loans"] });
      void queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
    }
  });
}
function useCommissionPayments(technicianId, period, allPeriods = false) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const [from, to] = periodKey(period);
  return useQuery({
    queryKey: [
      "commission-payments",
      (technicianId == null ? void 0 : technicianId.toString()) ?? "all",
      allPeriods ? "all" : from,
      allPeriods ? "all" : to
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCommissionPayments(token, {
        technicianId: technicianId ?? void 0,
        from: allPeriods ? void 0 : period.from,
        to: allPeriods ? void 0 : period.to
      });
    },
    enabled: !!actor && !isFetching
  });
}
function paymentErrorMessage(error) {
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.toLowerCase();
  if (message.includes("no hay comisiones pendientes") || message.includes("nothing") || message.includes("no pending")) {
    return "Este técnico no tiene comisiones pendientes en el periodo seleccionado.";
  }
  if (message.includes("amount") || message.includes("invalid")) {
    return "El monto de la comisión no es válido. Revisa las líneas del periodo.";
  }
  if (message.includes("deduct")) {
    return "Uno de los préstamos ya fue deducido en otro pago.";
  }
  if (message.includes("técnico no encontrado") || message.includes("technician no encontrado") || message.includes("not found") || message.includes("technician")) {
    return "No se encontró el técnico seleccionado.";
  }
  return "No se pudo registrar el pago de comisiones. Intenta de nuevo.";
}
function CommissionPaymentDialog({
  open,
  onOpenChange,
  summary,
  period,
  company
}) {
  const [receipt, setReceipt] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const payCommission = usePayTechnicianCommission();
  const linesQuery = useCommissionLines((summary == null ? void 0 : summary.technicianId) ?? null, period);
  const lines = linesQuery.data ?? [];
  reactExports.useEffect(() => {
    if (open) {
      setReceipt(null);
      setError(null);
    }
  }, [open]);
  const handlePay = () => {
    if (!summary) return;
    setError(null);
    payCommission.mutate(
      { technicianId: summary.technicianId, period },
      {
        onSuccess: (payment) => {
          setReceipt(payment);
          ue.success("Pago de comisiones registrado");
        },
        onError: (mutationError) => {
          setError(paymentErrorMessage(mutationError));
        }
      }
    );
  };
  const hasPending = summary !== null && summary.lineCount > 0n;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "commission_payment.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: receipt ? "Comprobante de pago" : "Pagar comisiones" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: receipt ? "El pago quedó registrado. Descarga el comprobante en PDF." : "Se consolidan las comisiones pendientes y se descuentan los préstamos completos." })
        ] }),
        receipt ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          CommissionDocument,
          {
            kind: "receipt",
            payment: receipt,
            lines,
            company,
            onDownload: () => void downloadCommissionPaymentPdf(receipt, company),
            ocid: "commission_payment.receipt"
          }
        ) : summary ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-muted/30 p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: summary.technicianName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-xs text-muted-foreground", children: [
              summary.technicianCode,
              " · comisión",
              " ",
              formatNumber(summary.commissionRate),
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "divide-y divide-border rounded-lg border border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-sm text-muted-foreground", children: "Líneas de mano de obra" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail text-sm", children: formatNumber(summary.lineCount) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-sm text-muted-foreground", children: "Base de mano de obra" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail text-sm", children: formatMoney(summary.baseAmount) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-sm text-muted-foreground", children: "Comisión generada" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail text-sm", children: formatMoney(summary.commissionAmount) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("dt", { className: "text-sm text-muted-foreground", children: [
                "Préstamos deducidos (",
                formatNumber(summary.pendingLoanCount),
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { className: "data-rail text-sm text-destructive", children: [
                "− ",
                formatMoney(summary.pendingLoansAmount)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 bg-muted/40 px-4 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-display text-sm font-semibold", children: "Neto a pagar" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail text-base font-semibold", children: formatMoney(summary.netPayable) })
            ] })
          ] }),
          !hasPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "commission_payment.empty_state",
              className: "rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
              children: "Este técnico no tiene comisiones pendientes en el periodo seleccionado."
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "section",
            {
              "data-ocid": "commission_payment.breakdown",
              className: "space-y-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Desglose por servicio y moto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Solo la mano de obra vinculada a un servicio del catálogo de taller genera comisión. Cada línea se paga una sola vez." })
                ] }),
                linesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    "data-ocid": "commission_payment.breakdown.loading_state",
                    className: "space-y-2",
                    children: Array.from(
                      { length: 3 },
                      (_, index) => `payment-line-${index}`
                    ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id))
                  }
                ) : lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "commission_payment.breakdown.empty_state",
                    className: "rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground",
                    children: "Sin líneas de comisión pendientes en el periodo seleccionado."
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto rounded-lg border border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Fecha" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Orden" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Servicio" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Moto" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Comisión" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "tr",
                    {
                      "data-ocid": `commission_payment.breakdown.row.${index + 1}`,
                      className: "border-t border-border",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-3 py-2 text-muted-foreground", children: formatDate(line.serviceDate) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-3 py-2", children: line.orderNumber }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[200px] truncate", children: line.serviceName }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[180px] truncate", children: motorcycleLabel(line) }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-3 py-2 text-right font-medium", children: formatMoney(line.commissionAmount) })
                      ]
                    },
                    line.laborId.toString()
                  )) })
                ] }) })
              ]
            }
          ),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "p",
            {
              "data-ocid": "commission_payment.error_state",
              className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "mt-0.5 size-3.5 shrink-0",
                    "aria-hidden": "true"
                  }
                ),
                error
              ]
            }
          ) : null
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Selecciona un técnico para pagar sus comisiones." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: receipt ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            onClick: () => onOpenChange(false),
            "data-ocid": "commission_payment.close_button",
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-4", "aria-hidden": "true" }),
              "Listo"
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => onOpenChange(false),
              "data-ocid": "commission_payment.cancel_button",
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              onClick: handlePay,
              disabled: payCommission.isPending || !hasPending,
              "data-ocid": "commission_payment.confirm_button",
              className: "gap-1.5",
              children: [
                payCommission.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
                "Pagar comisiones"
              ]
            }
          )
        ] }) })
      ]
    }
  ) });
}
function colombiaMonthStart(monthOffset) {
  const parts = toColombiaParts(/* @__PURE__ */ new Date());
  if (!parts) return "";
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + monthOffset, 1));
  return colombiaDateInput(BigInt(date.getTime()) * 1000000n);
}
const PERIOD_PRESETS = [
  {
    id: "month",
    label: "Este mes",
    range: () => ({ from: colombiaMonthStart(0), to: "" })
  },
  {
    id: "quarter",
    label: "Trimestre",
    range: () => ({ from: colombiaMonthStart(-2), to: "" })
  },
  {
    id: "year",
    label: "Este año",
    range: () => {
      const parts = toColombiaParts(/* @__PURE__ */ new Date());
      return { from: parts ? `${parts.year}-01-01` : "", to: "" };
    }
  },
  {
    id: "all",
    label: "Todo",
    range: () => ({ from: "", to: "" })
  }
];
const KPI_TONE = {
  primary: "bg-primary",
  warning: "bg-warning",
  info: "bg-info"
};
function KpiCard({ label, value, hint, icon: Icon, tone, ocid }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": ocid,
      className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            "aria-hidden": "true",
            className: cn("absolute inset-y-0 left-0 w-0.5", KPI_TONE[tone])
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "flex items-start justify-between gap-4 px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none tracking-tight", children: value }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: hint })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4 text-muted-foreground", "aria-hidden": "true" }) })
        ] })
      ]
    }
  );
}
function KpiSkeleton({ ocid }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Card,
    {
      "data-ocid": ocid,
      className: "gap-0 rounded-lg py-0 shadow-none",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 px-5 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-24" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-7 w-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-32" })
      ] })
    }
  );
}
function emptyLoanForm() {
  return {
    amount: "",
    date: colombiaDateInput(BigInt(Date.now()) * 1000000n),
    note: ""
  };
}
function LoanDialog({ open, onOpenChange, technician }) {
  const [form, setForm] = reactExports.useState(emptyLoanForm);
  const [error, setError] = reactExports.useState(null);
  const createLoan = useCreateTechnicianLoan();
  const handleSubmit = (event) => {
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
        note: note === "" ? void 0 : note
      },
      {
        onSuccess: () => {
          ue.success("Préstamo registrado");
          setForm(emptyLoanForm());
          onOpenChange(false);
        },
        onError: () => setError("No se pudo registrar el préstamo.")
      }
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "commission_loan.dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Nuevo préstamo a técnico" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: technician ? `Registra un anticipo para ${technician.name}. Se descontará completo al pagar sus comisiones.` : "Selecciona un técnico para registrar el préstamo." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "loan-amount", children: "Monto (COP)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "loan-amount",
            inputMode: "numeric",
            value: form.amount,
            onChange: (event) => setForm((current) => ({
              ...current,
              amount: event.target.value
            })),
            placeholder: "Ej. 150000",
            className: "data-rail",
            "data-ocid": "commission_loan.amount_input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "loan-date", children: "Fecha" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "loan-date",
            type: "date",
            value: form.date,
            onChange: (event) => setForm((current) => ({ ...current, date: event.target.value })),
            className: "data-rail",
            "data-ocid": "commission_loan.date_input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "loan-note", children: "Nota" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "loan-note",
            value: form.note,
            onChange: (event) => setForm((current) => ({ ...current, note: event.target.value })),
            placeholder: "Motivo del anticipo",
            rows: 3,
            "data-ocid": "commission_loan.note_input"
          }
        )
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "commission_loan.error_state",
          className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
          children: error
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            "data-ocid": "commission_loan.cancel_button",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "submit",
            disabled: createLoan.isPending || !technician,
            "data-ocid": "commission_loan.submit_button",
            className: "gap-1.5",
            children: [
              createLoan.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
              "Registrar préstamo"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function LoansPanel({
  technician,
  loans,
  isLoading,
  onRegister
}) {
  const deleteLoan = useDeleteTechnicianLoan();
  const columns = [
    {
      key: "date",
      header: "Fecha",
      render: (loan) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "whitespace-nowrap text-muted-foreground", children: formatDate(loan.date) })
    },
    {
      key: "amount",
      header: "Monto",
      numeric: true,
      render: (loan) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium", children: formatMoney(loan.amount) })
    },
    {
      key: "note",
      header: "Nota",
      render: (loan) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[240px] truncate text-muted-foreground", children: loan.note && loan.note.trim() !== "" ? loan.note : "—" })
    },
    {
      key: "status",
      header: "Estado",
      render: (loan) => loan.deducted ? /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: "Deducido", tone: "accepted" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: "Pendiente", tone: "pending" })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": `commissions.loans.${technician.code}`,
      className: "space-y-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display text-sm font-semibold", children: [
              "Préstamos de ",
              technician.name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Los préstamos pendientes se descuentan completos al pagar comisiones." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: onRegister,
              "data-ocid": `commissions.loans.${technician.code}.register_button`,
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                "Registrar préstamo"
              ]
            }
          )
        ] }),
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": `commissions.loans.${technician.code}.loading_state`,
            className: "space-y-2",
            children: Array.from({ length: 3 }, (_, index) => `loan-${index}`).map(
              (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)
            )
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          DataTable,
          {
            ocid: `commissions.loans.${technician.code}`,
            columns,
            rows: loans,
            rowKey: (loan) => loan.id.toString(),
            emptyMessage: "Sin préstamos registrados para este técnico.",
            actions: [
              {
                kind: "delete",
                label: "Eliminar préstamo pendiente",
                hidden: (loan) => loan.deducted,
                onClick: (loan) => {
                  deleteLoan.mutate(loan.id, {
                    onSuccess: () => ue.success("Préstamo eliminado"),
                    onError: () => ue.error(
                      "No se pudo eliminar: el préstamo ya fue deducido."
                    )
                  });
                }
              }
            ]
          }
        )
      ]
    }
  );
}
function TechnicianDetail({
  technician,
  period,
  onPay
}) {
  const summaryQuery = useTechnicianCommissionSummary(technician.id, period);
  const linesQuery = useCommissionLines(technician.id, period);
  const allPaymentsQuery = useCommissionPayments(technician.id, period, true);
  const loansQuery = useTechnicianLoans(technician.id);
  const [loanDialogOpen, setLoanDialogOpen] = reactExports.useState(false);
  const summary = summaryQuery.data ?? null;
  const lines = linesQuery.data ?? [];
  const loans = loansQuery.data ?? [];
  const paidLineKeys = reactExports.useMemo(() => {
    const keys = /* @__PURE__ */ new Set();
    for (const payment of allPaymentsQuery.data ?? []) {
      for (const line of payment.lines) {
        keys.add(`${line.orderId.toString()}:${line.laborId.toString()}`);
      }
    }
    return keys;
  }, [allPaymentsQuery.data]);
  const pendingLines = reactExports.useMemo(
    () => lines.filter(
      (line) => !paidLineKeys.has(
        `${line.orderId.toString()}:${line.laborId.toString()}`
      )
    ),
    [lines, paidLineKeys]
  );
  const paidLines = reactExports.useMemo(
    () => lines.filter(
      (line) => paidLineKeys.has(
        `${line.orderId.toString()}:${line.laborId.toString()}`
      )
    ),
    [lines, paidLineKeys]
  );
  const lineColumns = [
    {
      key: "serviceDate",
      header: "Fecha servicio",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "whitespace-nowrap text-muted-foreground", children: formatDate(line.serviceDate) })
    },
    {
      key: "order",
      header: "Orden",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: line.orderNumber })
    },
    {
      key: "service",
      header: "Servicio",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "block max-w-[220px] truncate font-medium", children: line.serviceName }),
        line.description.trim() !== "" && line.description.trim() !== line.serviceName.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "block max-w-[220px] truncate text-xs text-muted-foreground", children: line.description }) : null
      ] })
    },
    {
      key: "motorcycle",
      header: "Moto",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "block max-w-[200px] truncate", children: `${line.motorcycleBrand} ${line.motorcycleModel}`.trim() || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: line.motorcyclePlate.trim() !== "" ? line.motorcyclePlate : "—" })
      ] })
    },
    {
      key: "rate",
      header: "%",
      numeric: true,
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail", children: [
        formatNumber(line.commissionRate),
        "%"
      ] })
    },
    {
      key: "base",
      header: "Base",
      numeric: true,
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(line.baseAmount) })
    },
    {
      key: "commission",
      header: "Comisión",
      numeric: true,
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium", children: formatMoney(line.commissionAmount) })
    }
  ];
  const paidLineColumns = [
    ...lineColumns,
    {
      key: "status",
      header: "Estado",
      render: () => /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: "Pagada", tone: "accepted" })
    }
  ];
  const isLoading = summaryQuery.isLoading || linesQuery.isLoading || allPaymentsQuery.isLoading;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: isLoading || !summary ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: `commissions.${technician.code}.kpi.base` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiSkeleton,
        {
          ocid: `commissions.${technician.code}.kpi.commission`
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: `commissions.${technician.code}.kpi.loans` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: `commissions.${technician.code}.kpi.net` })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          ocid: `commissions.${technician.code}.kpi.base`,
          label: "Base de mano de obra",
          value: formatMoney(summary.baseAmount),
          hint: `${formatNumber(summary.lineCount)} línea(s) pendientes en el periodo`,
          icon: Wallet,
          tone: "info"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          ocid: `commissions.${technician.code}.kpi.commission`,
          label: "Comisión pendiente",
          value: formatMoney(summary.commissionAmount),
          hint: `Tasa ${formatNumber(summary.commissionRate)}% sobre mano de obra`,
          icon: Banknote,
          tone: "primary"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          ocid: `commissions.${technician.code}.kpi.loans`,
          label: "Préstamos pendientes",
          value: formatMoney(summary.pendingLoansAmount),
          hint: `${formatNumber(summary.pendingLoanCount)} préstamo(s) por deducir`,
          icon: HandCoins,
          tone: "warning"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        KpiCard,
        {
          ocid: `commissions.${technician.code}.kpi.net`,
          label: "Neto a pagar",
          value: formatMoney(summary.netPayable),
          hint: "Comisión menos préstamos pendientes",
          icon: Banknote,
          tone: "primary"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Comisiones por servicio y moto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Solo la mano de obra vinculada a un servicio del catálogo de taller genera comisión. Las líneas libres y los repuestos no comisionan." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          onClick: () => {
            if (summary) onPay(summary);
          },
          disabled: !summary || summary.lineCount === 0n,
          "data-ocid": `commissions.${technician.code}.pay_button`,
          className: "gap-1.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "size-4", "aria-hidden": "true" }),
            "Pagar comisiones"
          ]
        }
      )
    ] }),
    linesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": `commissions.${technician.code}.error_state`,
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "size-5 text-destructive",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar las líneas de comisión." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => void linesQuery.refetch(),
              "data-ocid": `commissions.${technician.code}.retry_button`,
              children: "Reintentar"
            }
          )
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "section",
        {
          "data-ocid": `commissions.${technician.code}.pending`,
          className: "space-y-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-display text-sm font-semibold", children: "Pendientes de pago" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                formatNumber(pendingLines.length),
                " línea(s)"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                ocid: `commissions.${technician.code}.lines`,
                columns: lineColumns,
                rows: pendingLines,
                rowKey: (line) => line.laborId.toString(),
                emptyMessage: "Sin comisiones pendientes en el periodo seleccionado."
              }
            )
          ]
        }
      ),
      paidLines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "section",
        {
          "data-ocid": `commissions.${technician.code}.paid`,
          className: "space-y-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-display text-sm font-semibold", children: "Ya pagadas" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Cada línea se paga una sola vez: estas comisiones ya no aparecen como pendientes ni se pueden volver a pagar." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                formatNumber(paidLines.length),
                " línea(s)"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                ocid: `commissions.${technician.code}.paid_lines`,
                columns: paidLineColumns,
                rows: paidLines,
                rowKey: (line) => line.laborId.toString(),
                emptyMessage: "Sin comisiones pagadas en el periodo seleccionado."
              }
            )
          ]
        }
      ) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LoansPanel,
      {
        technician,
        loans,
        isLoading: loansQuery.isLoading,
        onRegister: () => setLoanDialogOpen(true)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LoanDialog,
      {
        open: loanDialogOpen,
        onOpenChange: setLoanDialogOpen,
        technician
      }
    )
  ] });
}
function CommissionsPage() {
  var _a;
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [activePreset, setActivePreset] = reactExports.useState(null);
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [paymentTarget, setPaymentTarget] = reactExports.useState(null);
  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly: true
  });
  const companyQuery = useCompanyProfile();
  const period = reactExports.useMemo(
    () => ({
      from: from === "" ? void 0 : colombiaStartOfDay(from) ?? void 0,
      to: to === "" ? void 0 : colombiaEndOfDay(to) ?? void 0
    }),
    [from, to]
  );
  const reportQuery = useCommissionReport(period);
  const reportLinesQuery = useCommissionLines(null, period);
  const technicians = techniciansQuery.data ?? [];
  const report = reportQuery.data ?? null;
  const reportLines = reportLinesQuery.data ?? [];
  const selected = technicians.find((tech) => tech.id === selectedId) ?? technicians[0] ?? null;
  const company = pdfCompanyFromProfile(companyQuery.data);
  const documentCompany = {
    name: company.name,
    logo: ((_a = companyQuery.data) == null ? void 0 : _a.logoUrl) ?? void 0,
    contact: [
      company.taxId,
      company.address,
      company.city,
      company.phone,
      company.email
    ].filter((value) => !!value && value.trim() !== "").join("  ·  "),
    fiscal: [company.fiscalRegime, company.taxResponsibility].filter(
      (value) => !!value && value.trim() !== ""
    )
  };
  const applyPreset = (preset) => {
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
  const reportColumns = [
    {
      key: "technician",
      header: "Técnico",
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: row.technicianName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: row.technicianCode })
      ] })
    },
    {
      key: "rate",
      header: "%",
      numeric: true,
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail", children: [
        formatNumber(row.commissionRate),
        "%"
      ] })
    },
    {
      key: "lines",
      header: "Líneas",
      numeric: true,
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatNumber(row.lineCount) })
    },
    {
      key: "base",
      header: "Base",
      numeric: true,
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(row.baseAmount) })
    },
    {
      key: "commission",
      header: "Comisión",
      numeric: true,
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(row.commissionAmount) })
    },
    {
      key: "loans",
      header: "Préstamos",
      numeric: true,
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-destructive", children: [
        "− ",
        formatMoney(row.pendingLoansAmount)
      ] })
    },
    {
      key: "net",
      header: "Neto a pagar",
      numeric: true,
      render: (row) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold", children: formatMoney(row.netPayable) })
    }
  ];
  const breakdownColumns = [
    {
      key: "serviceDate",
      header: "Fecha servicio",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "whitespace-nowrap text-muted-foreground", children: formatDate(line.serviceDate) })
    },
    {
      key: "technician",
      header: "Técnico",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: line.technicianName }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: line.technicianCode })
      ] })
    },
    {
      key: "order",
      header: "Orden",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: line.orderNumber })
    },
    {
      key: "service",
      header: "Servicio",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block max-w-[220px] truncate", children: line.serviceName })
    },
    {
      key: "motorcycle",
      header: "Moto (marca / modelo / placa)",
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "block max-w-[200px] truncate", children: `${line.motorcycleBrand} ${line.motorcycleModel}`.trim() || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: line.motorcyclePlate.trim() !== "" ? line.motorcyclePlate : "—" })
      ] })
    },
    {
      key: "base",
      header: "Base",
      numeric: true,
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(line.baseAmount) })
    },
    {
      key: "commission",
      header: "Comisión",
      numeric: true,
      render: (line) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium", children: formatMoney(line.commissionAmount) })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "commissions.page", className: "space-y-6", children: [
    " ",
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        eyebrow: "Administración",
        title: "Comisiones de técnicos",
        description: "Comisiones por mano de obra, préstamos deducidos y pagos por técnico.",
        actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => {
              if (report) {
                void downloadCommissionReportPdf(report, company, reportLines);
              }
            },
            disabled: !report || report.technicians.length === 0,
            "data-ocid": "commissions.report.download_button",
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
              "Descargar reporte PDF"
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        "data-ocid": "commissions.period",
        className: "flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: PERIOD_PRESETS.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              size: "sm",
              variant: activePreset === preset.id ? "default" : "outline",
              onClick: () => applyPreset(preset),
              "data-ocid": `commissions.period.${preset.id}`,
              children: preset.label
            },
            preset.id
          )) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "commissions-from",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Desde"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "commissions-from",
                type: "date",
                value: from,
                onChange: (event) => {
                  setFrom(event.target.value);
                  setActivePreset(null);
                },
                className: "data-rail w-[160px]",
                "data-ocid": "commissions.date_from_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "commissions-to",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Hasta"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "commissions-to",
                type: "date",
                value: to,
                onChange: (event) => {
                  setTo(event.target.value);
                  setActivePreset(null);
                },
                className: "data-rail w-[160px]",
                "data-ocid": "commissions.date_to_input"
              }
            )
          ] }),
          hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "ghost",
              onClick: clearFilters,
              "data-ocid": "commissions.clear_filters_button",
              className: "gap-2 text-muted-foreground",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                "Limpiar"
              ]
            }
          ) : null
        ]
      }
    ),
    techniciansQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "commissions.error_state",
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "size-6 text-destructive",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar la información de comisiones." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => void techniciansQuery.refetch(),
              "data-ocid": "commissions.retry_button",
              children: "Reintentar"
            }
          )
        ]
      }
    ) : techniciansQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "commissions.loading_state", className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 w-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 w-full" })
    ] }) : technicians.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "commissions.empty_state",
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Users,
            {
              className: "size-5 text-muted-foreground",
              "aria-hidden": "true"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin técnicos activos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Registra técnicos y asígnales mano de obra en las órdenes para calcular sus comisiones." })
          ] })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "section",
        {
          "data-ocid": "commissions.technicians",
          className: "flex flex-wrap gap-2",
          children: technicians.map((tech) => {
            const isActive = (selected == null ? void 0 : selected.id) === tech.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSelectedId(tech.id),
                "data-active": isActive ? "true" : "false",
                "data-ocid": `commissions.technician.${tech.code}`,
                className: cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                  isActive ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                ),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: tech.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-xs text-muted-foreground", children: [
                    formatNumber(tech.commissionRate),
                    "%"
                  ] })
                ]
              },
              tech.id.toString()
            );
          })
        }
      ),
      selected ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        TechnicianDetail,
        {
          technician: selected,
          period,
          onPay: setPaymentTarget
        },
        selected.id.toString()
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "data-ocid": "commissions.report", className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center justify-between gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Reporte general de comisiones" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Totales por técnico y total general del periodo." })
        ] }) }),
        reportQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "commissions.report.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-10 text-center shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-5 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el reporte general." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => void reportQuery.refetch(),
                  "data-ocid": "commissions.report.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : reportQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "commissions.report.loading_state",
            className: "space-y-2",
            children: Array.from({ length: 4 }, (_, index) => `report-${index}`).map(
              (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)
            )
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DataTable,
            {
              ocid: "commissions.report",
              columns: reportColumns,
              rows: (report == null ? void 0 : report.technicians) ?? [],
              rowKey: (row) => row.technicianId.toString(),
              emptyMessage: "Sin comisiones registradas en el periodo seleccionado."
            }
          ),
          report && report.technicians.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-end gap-x-6 gap-y-1 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Base",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-foreground", children: formatMoney(report.totalBase) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Comisión",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-foreground", children: formatMoney(report.totalCommission) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Préstamos",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-destructive", children: [
                "− ",
                formatMoney(report.totalPendingLoans)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
              "Total general",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-semibold text-foreground", children: formatMoney(report.totalNetPayable) })
            ] })
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Desglose por servicio, moto y fecha" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Cada línea de mano de obra del periodo con su servicio, moto (marca, modelo y placa) y fecha del servicio." })
            ] }),
            reportLinesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                "data-ocid": "commissions.report.breakdown.loading_state",
                className: "space-y-2",
                children: Array.from(
                  { length: 4 },
                  (_, index) => `report-line-${index}`
                ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id))
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                ocid: "commissions.report.breakdown",
                columns: breakdownColumns,
                rows: reportLines,
                rowKey: (line) => line.laborId.toString(),
                emptyMessage: "Sin líneas de comisión en el periodo seleccionado."
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      CommissionPaymentDialog,
      {
        open: paymentTarget !== null,
        onOpenChange: (open) => {
          if (!open) setPaymentTarget(null);
        },
        summary: paymentTarget,
        period,
        company: documentCompany
      }
    )
  ] });
}
export {
  CommissionsPage,
  CommissionsPage as default
};
