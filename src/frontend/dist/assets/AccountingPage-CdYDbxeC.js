import { Y as createLucideIcon, j as jsxRuntimeExports, Z as cn, k as useBackend, l as useAuth, m as useQuery, t as reactExports, aK as colombiaEndOfDay, aL as colombiaStartOfDay, b9 as LedgerEntryKind, r as useNavigate, s as useSearch, aj as formatDateTime, y as formatMoney, o as formatNumber, B as Button, K as Label, w as Input, T as TriangleAlert, e as Wallet, z as formatDate, d as Boxes, P as Package, v as Search, b8 as toColombiaParts, aY as colombiaDateInput } from "./index-EqGEeyjs.js";
import { b as companyContactLine, a as companyFiscalLines, c as companyHeaderFromProfile } from "./company-header-Ds_ApIKF.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { S as StatusBadge } from "./StatusBadge-DoLeoyAw.js";
import { C as Card, c as CardContent } from "./card-YKA4f36t.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { u as useCompanyProfile } from "./use-company-B0ILLjch.js";
import { d as downloadXlsx } from "./xlsx-DZNJ8zzC.js";
import { D as Download } from "./download-C8tLpeh6.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import { A as ArrowUpRight } from "./arrow-up-right-D2nMGIMz.js";
import { P as Printer } from "./printer-CZZ39YEy.js";
import { C as ChevronUp, a as ChevronDown } from "./chevron-up-VeGPxiez.js";
import "./download-DPgaDAHv.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  ["path", { d: "m7 7 10 10", key: "1fmybs" }],
  ["path", { d: "M17 7v10H7", key: "6fjiku" }]
];
const ArrowDownRight = createLucideIcon("arrow-down-right", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "m21 16-4 4-4-4", key: "f6ql7i" }],
  ["path", { d: "M17 20V4", key: "1ejh1v" }],
  ["path", { d: "m3 8 4-4 4 4", key: "11wl7u" }],
  ["path", { d: "M7 4v16", key: "1glfcx" }]
];
const ArrowUpDown = createLucideIcon("arrow-up-down", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "7g6ntu" }],
  ["path", { d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z", key: "ijws7r" }],
  ["path", { d: "M7 21h10", key: "1b0cd5" }],
  ["path", { d: "M12 3v18", key: "108xh3" }],
  ["path", { d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2", key: "3gwbw2" }]
];
const Scale = createLucideIcon("scale", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M16 7h6v6", key: "box55l" }],
  ["path", { d: "m22 7-8.5 8.5-5-5L2 17", key: "1t1m79" }]
];
const TrendingUp = createLucideIcon("trending-up", __iconNode);
function CompanyHeader({
  header,
  ocid,
  variant = "document",
  className
}) {
  if (!header) return null;
  const contact = companyContactLine(header);
  const fiscal = companyFiscalLines(header);
  const displayName = header.tradeName ?? header.legalName;
  const showTradeName = header.tradeName !== void 0 && header.tradeName !== header.legalName;
  if (variant === "panel") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { "data-ocid": ocid, className: cn("company-header", className), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "company-header-logo", "aria-hidden": "true", children: header.logoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: header.logoUrl,
          alt: "",
          "data-ocid": `${ocid}.logo`,
          className: "size-full rounded-md object-cover"
        }
      ) : displayName.slice(0, 2).toUpperCase() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "company-header-name", children: displayName }),
      showTradeName ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "company-header-legal", children: header.legalName }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "company-header-rail", children: [
        header.taxId ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "company-header-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "sr-only", children: "NIT" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "NIT: " }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: header.taxId })
          ] })
        ] }) : null,
        header.fiscalRegime ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "company-header-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "sr-only", children: "Régimen" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Régimen: " }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: header.fiscalRegime })
          ] })
        ] }) : null,
        header.taxResponsibility ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "company-header-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "sr-only", children: "Responsabilidad" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Responsabilidad: " }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: header.taxResponsibility })
          ] })
        ] }) : null,
        header.phone ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "company-header-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "sr-only", children: "Teléfono" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Tel: " }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: header.phone })
          ] })
        ] }) : null,
        header.email ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "company-header-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "sr-only", children: "Correo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Correo: " }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: header.email })
          ] })
        ] }) : null,
        header.website ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "company-header-field", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "sr-only", children: "Sitio web" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Web: " }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: header.website })
          ] })
        ] }) : null
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": ocid, className: cn("company-doc-header", className), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
    header.logoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src: header.logoUrl,
        alt: "",
        "data-ocid": `${ocid}.logo`,
        className: "size-12 shrink-0 object-contain"
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-title font-display text-lg font-bold tracking-tight", children: header.legalName }),
      showTradeName ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: header.tradeName }) : null,
      contact ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { "data-ocid": `${ocid}.contact`, className: "doc-meta text-xs", children: contact }) : null,
      fiscal.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          "data-ocid": `${ocid}.fiscal_block`,
          className: "mt-1 space-y-0.5",
          children: fiscal.map((line) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: line }, line))
        }
      ) : null
    ] })
  ] }) });
}
const PROFIT_BLOCK_LABELS = {
  parts: "Repuestos",
  services: "Servicios",
  total: "Total consolidado"
};
function toProfitBlockView(key, block) {
  return {
    key,
    label: PROFIT_BLOCK_LABELS[key],
    income: block.income,
    cost: block.cost,
    commission: block.commission,
    margin: block.margin,
    marginBps: block.marginBps
  };
}
function toProfitBreakdownView(profit) {
  return {
    parts: toProfitBlockView("parts", profit.parts),
    services: toProfitBlockView("services", profit.services),
    total: toProfitBlockView("total", profit.total),
    totalCommission: profit.totalCommission,
    netProfit: profit.netProfit,
    serviceLines: profit.serviceLines.map(
      (line, index) => ({
        key: `${line.invoiceId.toString()}-${index}`,
        invoiceId: line.invoiceId,
        invoiceNumber: line.invoiceNumber,
        orderId: line.orderId ?? null,
        description: line.description,
        serviceId: line.serviceId ?? null,
        technicianId: line.technicianId ?? null,
        technicianName: line.technicianName,
        charged: line.charged,
        commission: line.commission,
        profit: line.profit
      })
    )
  };
}
function useAccountingReport(period) {
  var _a, _b;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "accounting-report",
      ((_a = period.from) == null ? void 0 : _a.toString()) ?? "none",
      ((_b = period.to) == null ? void 0 : _b.toString()) ?? "none"
    ],
    queryFn: async () => {
      if (!actor) return null;
      const report = await actor.getAccountingReport(token, period);
      return {
        ...report,
        profit: toProfitBreakdownView(report.profit)
      };
    },
    enabled: !!actor && !isFetching
  });
}
function useInventoryValuation() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["inventory-valuation"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getInventoryValuation(token);
    },
    enabled: !!actor && !isFetching
  });
}
const PAYMENT_METHOD_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mixed: "Mixto"
};
function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
function categoryLabel(category) {
  return category;
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
      return {
        from: parts ? `${parts.year}-01-01` : "",
        to: ""
      };
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
function BreakdownPanel({
  title,
  caption,
  rows,
  total,
  ocid
}) {
  const max = rows.reduce(
    (acc, row) => row.total > acc ? row.total : acc,
    0n
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": ocid,
      className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: caption })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail shrink-0 text-sm font-semibold", children: formatMoney(total) })
        ] }),
        rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": `${ocid}.empty_state`,
            className: "px-4 py-10 text-center text-sm text-muted-foreground",
            children: "Sin movimientos en el periodo seleccionado."
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: rows.map((row, index) => {
          const share = total > 0n ? Number(row.total * 1000n / total) / 10 : 0;
          const width = max > 0n ? Math.max(4, Number(row.total * 100n / max)) : 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              "data-ocid": `${ocid}.item.${index + 1}`,
              className: "space-y-1.5 px-4 py-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: row.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 text-sm", children: formatMoney(row.total) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 flex-1 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "h-full rounded-full bg-primary",
                      style: { width: `${width}%` }
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail w-12 shrink-0 text-right text-[11px] text-muted-foreground", children: [
                    share.toFixed(1),
                    "%"
                  ] })
                ] })
              ]
            },
            row.label
          );
        }) })
      ]
    }
  );
}
function ProfitBlockCard({
  block,
  ocid
}) {
  const isTotal = block.key === "total";
  const isServices = block.key === "services";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": ocid,
      className: cn(
        "space-y-3 rounded-lg border p-4",
        isTotal ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: block.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: isTotal ? "Consolidado" : "Periodo" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "space-y-1.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: isServices ? "Valor cobrado" : "Ingreso" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail", children: formatMoney(block.income) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-muted-foreground", children: isServices ? "Comisión del técnico" : "Costo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail", children: formatMoney(block.cost) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-3 border-t border-border pt-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-medium", children: isServices ? "Utilidad del servicio" : "Margen" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "dd",
              {
                className: cn("data-rail font-semibold", marginTone(block.margin)),
                children: formatMoney(block.margin)
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
          isServices ? "Utilidad" : "Margen",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("data-rail", marginTone(block.margin)), children: formatBps(block.marginBps) })
        ] })
      ]
    }
  );
}
function ProfitBreakdownPanel({
  profit,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": ocid,
      className: "space-y-3 rounded-lg border border-border bg-card p-4 shadow-subtle",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Utilidad por repuestos y servicios" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Ingreso, costo y margen del rango de fechas seleccionado, con el total consolidado. La utilidad por servicio es el valor cobrado menos la comisión del técnico." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ProfitBlockCard, { block: profit.parts, ocid: `${ocid}.parts` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ProfitBlockCard, { block: profit.services, ocid: `${ocid}.services` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ProfitBlockCard, { block: profit.total, ocid: `${ocid}.total` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "dl",
          {
            "data-ocid": `${ocid}.net_summary`,
            className: "grid gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 sm:grid-cols-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-sm text-muted-foreground", children: "Comisiones de técnicos del periodo" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("dd", { className: "data-rail text-sm font-semibold text-destructive", children: [
                  "−",
                  formatMoney(profit.totalCommission)
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-sm font-medium", children: "Utilidad neta después de comisiones" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "dd",
                  {
                    className: cn(
                      "data-rail text-sm font-semibold",
                      marginTone(profit.netProfit)
                    ),
                    children: formatMoney(profit.netProfit)
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ServiceProfitLinesPanel,
          {
            lines: profit.serviceLines,
            ocid: `${ocid}.service_lines`
          }
        )
      ]
    }
  );
}
function ServiceProfitLinesPanel({
  lines,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": ocid,
      className: "overflow-hidden rounded-lg border border-border",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Detalle por servicio" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: "Valor cobrado, comisión del técnico y utilidad de cada línea de servicio facturada en el periodo" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
            formatNumber(lines.length),
            " servicio",
            lines.length === 1 ? "" : "s"
          ] })
        ] }),
        lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": `${ocid}.empty_state`,
            className: "px-4 py-10 text-center text-sm text-muted-foreground",
            children: "Sin servicios facturados en el periodo seleccionado."
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full caption-bottom text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                scope: "col",
                className: "h-10 whitespace-nowrap px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
                children: "Factura"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                scope: "col",
                className: "h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
                children: "Descripción"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                scope: "col",
                className: "h-10 whitespace-nowrap px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
                children: "Técnico"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                scope: "col",
                className: "h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
                children: "Valor cobrado"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                scope: "col",
                className: "h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
                children: "Comisión"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "th",
              {
                scope: "col",
                className: "h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
                children: "Utilidad"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "tr",
            {
              "data-ocid": `${ocid}.row.${index + 1}`,
              className: cn(
                "border-b border-border transition-colors hover:bg-muted/40",
                index % 2 === 1 && "bg-muted/20"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-muted-foreground", children: line.invoiceNumber }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-[320px] px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: line.description }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-2.5 text-muted-foreground", children: line.technicianName || "Sin técnico" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-right", children: formatMoney(line.charged) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground", children: formatMoney(line.commission) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "td",
                  {
                    className: cn(
                      "data-rail whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                      marginTone(line.profit)
                    ),
                    children: formatMoney(line.profit)
                  }
                )
              ]
            },
            line.key
          )) })
        ] }) })
      ]
    }
  );
}
function LedgerKindBadge({ kind }) {
  if (kind === LedgerEntryKind.commission) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      StatusBadge,
      {
        label: "Comisión técnico",
        tone: "pending",
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "size-3", "aria-hidden": "true" })
      }
    );
  }
  const isIncome = kind === LedgerEntryKind.income;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    StatusBadge,
    {
      label: isIncome ? "Ingreso" : "Egreso",
      tone: isIncome ? "accepted" : "rejected",
      icon: isIncome ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "size-3", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "size-3", "aria-hidden": "true" })
    }
  );
}
function isLedgerIncome(kind) {
  return kind === LedgerEntryKind.income;
}
function formatBps(bps) {
  if (bps === void 0 || bps === null) return "—";
  const percent = Number(bps) / 100;
  return `${percent.toFixed(1).replace(".", ",")} %`;
}
function averageUnitCost(row) {
  if (row.units <= 0n) return 0n;
  return row.costValue / row.units;
}
function resolveValuationSearch(raw) {
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    categoria: typeof raw.categoria === "string" ? raw.categoria : ""
  };
}
function marginTone(value) {
  if (value < 0n) return "text-destructive";
  if (value > 0n) return "text-success";
  return "text-foreground";
}
function ValuationKpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  ocid
}) {
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
function ReportHeader({ header, cutoff }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        CompanyHeader,
        {
          header,
          ocid: "accounting.valuation.document.company",
          variant: "document",
          className: "min-w-0 flex-1"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold uppercase tracking-wider", children: "Informe de valoración de inventario" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "report-muted text-xs", children: "Inventario en bodega · sin filtro de fechas" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "report-rule" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "report-muted", children: "Fecha de corte" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "data-rail text-right", children: cutoff })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "report-muted", children: "Alcance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-right", children: "Inventario actual en bodega (foto del momento)" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "report-rule" })
  ] });
}
const SIGNATURE_ROLES = ["Elaboró", "Revisó", "Aprobó"];
function ReportSignatureBlock() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "accounting.valuation.document.signature",
      className: "space-y-4 pt-6",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] report-muted", children: "Firmas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-8 sm:grid-cols-3", children: SIGNATURE_ROLES.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "report-signature-line h-10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold", children: role }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "report-muted text-[11px]", children: "Nombre:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "report-muted text-[11px]", children: "Cédula:" })
        ] }, role)) })
      ]
    }
  );
}
function ValuationCategoryPanel({
  categories,
  totalSaleValue
}) {
  const sorted = reactExports.useMemo(
    () => [...categories].sort(
      (a, b) => a.saleValue === b.saleValue ? 0 : a.saleValue > b.saleValue ? -1 : 1
    ),
    [categories]
  );
  const max = sorted.reduce(
    (acc, row) => row.saleValue > acc ? row.saleValue : acc,
    0n
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "accounting.valuation.category_breakdown",
      className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Desglose por categoría" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: "Costo, venta y margen agregados del inventario en bodega" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail shrink-0 text-sm font-semibold", children: formatMoney(totalSaleValue) })
        ] }),
        sorted.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "accounting.valuation.category_breakdown.empty_state",
            className: "px-4 py-10 text-center text-sm text-muted-foreground",
            children: "Sin categorías valoradas."
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: sorted.map((row, index) => {
          const share = totalSaleValue > 0n ? Number(row.saleValue * 1000n / totalSaleValue) / 10 : 0;
          const width = max > 0n ? Math.max(4, Number(row.saleValue * 100n / max)) : 0;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              "data-ocid": `accounting.valuation.category_breakdown.item.${index + 1}`,
              className: "space-y-2 px-4 py-3",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: row.category }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 text-sm", children: formatMoney(row.saleValue) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 flex-1 overflow-hidden rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: "h-full rounded-full bg-primary",
                      style: { width: `${width}%` }
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail w-12 shrink-0 text-right text-[11px] text-muted-foreground", children: [
                    share.toFixed(1),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Costo",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-foreground", children: formatMoney(row.costValue) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    "Margen",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("data-rail", marginTone(row.margin)), children: formatMoney(row.margin) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    formatNumber(row.partCount),
                    " rep. ·",
                    " ",
                    formatNumber(row.units),
                    " und."
                  ] })
                ] })
              ]
            },
            row.category
          );
        }) })
      ]
    }
  );
}
function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  numeric,
  ocid
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ChevronUp : ChevronDown;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "th",
    {
      scope: "col",
      "aria-sort": active ? sort.direction === "asc" ? "ascending" : "descending" : "none",
      className: cn(
        "h-10 whitespace-nowrap px-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
        numeric ? "text-right" : "text-left"
      ),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => onSort(sortKey),
          "data-ocid": ocid,
          className: cn(
            "inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            numeric && "flex-row-reverse",
            active && "text-foreground"
          ),
          children: [
            label,
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-3", "aria-hidden": "true" })
          ]
        }
      )
    }
  );
}
function ValuationTable({
  rows,
  sort,
  onSort,
  hasFilters,
  onClearFilters
}) {
  if (rows.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "accounting.valuation.table.empty_state",
        className: "flex flex-col items-center gap-3 px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Package,
            {
              className: "size-5 text-muted-foreground",
              "aria-hidden": "true"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin repuestos que coincidan" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Ajusta la búsqueda o el filtro de categoría para ver otros repuestos valorados. El costo de cada repuesto se toma de su precio de costo por la existencia actual." })
          ] }),
          hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: onClearFilters,
              "data-ocid": "accounting.valuation.table.empty_clear_button",
              children: "Limpiar filtros"
            }
          ) : null
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full caption-bottom text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHead,
        {
          label: "SKU",
          sortKey: "sku",
          sort,
          onSort,
          ocid: "accounting.valuation.sort.sku"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHead,
        {
          label: "Nombre",
          sortKey: "name",
          sort,
          onSort,
          ocid: "accounting.valuation.sort.name"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "th",
        {
          scope: "col",
          className: "h-10 whitespace-nowrap px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
          children: "Categoría"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHead,
        {
          label: "Existencia",
          sortKey: "units",
          sort,
          onSort,
          numeric: true,
          ocid: "accounting.valuation.sort.units"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "th",
        {
          scope: "col",
          className: "h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
          children: "Costo unitario (precio de costo)"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHead,
        {
          label: "Valor de costo",
          sortKey: "costValue",
          sort,
          onSort,
          numeric: true,
          ocid: "accounting.valuation.sort.cost_value"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHead,
        {
          label: "Valor de venta",
          sortKey: "saleValue",
          sort,
          onSort,
          numeric: true,
          ocid: "accounting.valuation.sort.sale_value"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SortableHead,
        {
          label: "Margen $",
          sortKey: "margin",
          sort,
          onSort,
          numeric: true,
          ocid: "accounting.valuation.sort.margin"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "th",
        {
          scope: "col",
          className: "h-10 whitespace-nowrap px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
          children: "Margen %"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: rows.map((row, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "tr",
      {
        "data-ocid": `accounting.valuation.row.${index + 1}`,
        className: cn(
          "border-b border-border transition-colors hover:bg-muted/40",
          index % 2 === 1 && "bg-muted/20"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-muted-foreground", children: row.sku }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "max-w-[280px] px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: row.name }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-2.5 text-muted-foreground", children: row.category }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-right", children: formatNumber(row.units) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground", children: formatMoney(averageUnitCost(row)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-right", children: formatMoney(row.costValue) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "data-rail whitespace-nowrap px-4 py-2.5 text-right", children: formatMoney(row.saleValue) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "td",
            {
              className: cn(
                "data-rail whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                marginTone(row.margin)
              ),
              children: formatMoney(row.margin)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "td",
            {
              className: cn(
                "data-rail whitespace-nowrap px-4 py-2.5 text-right",
                marginTone(row.margin)
              ),
              children: formatBps(row.marginBps)
            }
          )
        ]
      },
      row.partId.toString()
    )) })
  ] }) });
}
function AccountingPage() {
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [activePreset, setActivePreset] = reactExports.useState(null);
  const period = reactExports.useMemo(
    () => ({
      from: colombiaStartOfDay(from) ?? void 0,
      to: colombiaEndOfDay(to) ?? void 0
    }),
    [from, to]
  );
  const reportQuery = useAccountingReport(period);
  const report = reportQuery.data ?? null;
  const summary = (report == null ? void 0 : report.summary) ?? null;
  const entries = (report == null ? void 0 : report.entries) ?? [];
  const profitView = reactExports.useMemo(
    () => (report == null ? void 0 : report.profit) ?? null,
    [report]
  );
  const applyPreset = reactExports.useCallback((preset) => {
    const range = preset.range();
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset.id);
  }, []);
  const clearFilters = reactExports.useCallback(() => {
    setFrom("");
    setTo("");
    setActivePreset(null);
  }, []);
  const hasFilters = from !== "" || to !== "";
  const sortedEntries = reactExports.useMemo(
    () => [...entries].sort(
      (a, b) => a.date === b.date ? 0 : a.date > b.date ? -1 : 1
    ),
    [entries]
  );
  const ledgerTotals = reactExports.useMemo(() => {
    let income = 0n;
    let expenses = 0n;
    let commissions = 0n;
    for (const entry of entries) {
      if (entry.kind === LedgerEntryKind.income) {
        income += entry.amount;
      } else if (entry.kind === LedgerEntryKind.commission) {
        commissions += entry.amount;
      } else {
        expenses += entry.amount;
      }
    }
    return {
      income,
      expenses,
      commissions,
      net: income - expenses - commissions
    };
  }, [entries]);
  const categoryRows = reactExports.useMemo(
    () => [...(report == null ? void 0 : report.byExpenseCategory) ?? []].sort((a, b) => a.total === b.total ? 0 : a.total > b.total ? -1 : 1).map((row) => ({
      label: categoryLabel(row.category),
      total: row.total
    })),
    [report == null ? void 0 : report.byExpenseCategory]
  );
  const methodRows = reactExports.useMemo(
    () => [...(report == null ? void 0 : report.byPaymentMethod) ?? []].sort((a, b) => a.total === b.total ? 0 : a.total > b.total ? -1 : 1).map((row) => ({
      label: paymentMethodLabel(row.method),
      total: row.total
    })),
    [report == null ? void 0 : report.byPaymentMethod]
  );
  const exportSummary = reactExports.useCallback(() => {
    if (!summary) return;
    const rows = [
      {
        Concepto: "Ingresos",
        Monto: (Number(summary.totalIncome) / 100).toFixed(2)
      },
      {
        Concepto: "Gastos",
        Monto: (Number(summary.totalExpenses) / 100).toFixed(2)
      },
      {
        Concepto: "Utilidad",
        Monto: (Number(summary.profit) / 100).toFixed(2)
      },
      {
        Concepto: "Facturas pagadas",
        Monto: summary.invoiceCount.toString()
      },
      {
        Concepto: "Gastos registrados",
        Monto: summary.expenseCount.toString()
      },
      { Concepto: "Periodo desde", Monto: from || "inicio" },
      { Concepto: "Periodo hasta", Monto: to || "hoy" },
      {
        Concepto: "Comisiones de técnicos",
        Monto: (Number(summary.totalCommissions) / 100).toFixed(2)
      },
      {
        Concepto: "Utilidad neta",
        Monto: (Number(summary.netProfit) / 100).toFixed(2)
      }
    ];
    if (profitView) {
      for (const block of [
        profitView.parts,
        profitView.services,
        profitView.total
      ]) {
        rows.push(
          {
            Concepto: `${block.label} · Ingreso`,
            Monto: (Number(block.income) / 100).toFixed(2)
          },
          {
            Concepto: `${block.label} · Costo`,
            Monto: (Number(block.cost) / 100).toFixed(2)
          },
          {
            Concepto: `${block.label} · Comisión del técnico`,
            Monto: (Number(block.commission) / 100).toFixed(2)
          },
          {
            Concepto: `${block.label} · Margen`,
            Monto: (Number(block.margin) / 100).toFixed(2)
          },
          {
            Concepto: `${block.label} · Margen %`,
            Monto: formatBps(block.marginBps)
          }
        );
      }
    }
    void downloadXlsx(
      `contabilidad-resumen-${from || "inicio"}-${to || "hoy"}`,
      "Resumen",
      ["Concepto", "Monto"],
      rows
    );
  }, [summary, profitView, from, to]);
  const [valuationSort, setValuationSort] = reactExports.useState({
    key: "saleValue",
    direction: "desc"
  });
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const valuationSearchParams = reactExports.useMemo(
    () => resolveValuationSearch(rawSearch),
    [rawSearch]
  );
  const valuationSearch = valuationSearchParams.q;
  const valuationCategory = valuationSearchParams.categoria;
  const [valuationTerm, setValuationTerm] = reactExports.useState(valuationSearch);
  reactExports.useEffect(() => {
    setValuationTerm(valuationSearch);
  }, [valuationSearch]);
  const applyValuationSearch = reactExports.useCallback(
    (patch) => {
      void navigate({
        to: "/contabilidad",
        search: (prev) => {
          const next = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === void 0 || value === false) {
              delete next[key];
            }
          }
          return next;
        },
        replace: true
      });
    },
    [navigate]
  );
  reactExports.useEffect(() => {
    if (valuationTerm === valuationSearch) return;
    const handle = window.setTimeout(() => {
      applyValuationSearch({ q: valuationTerm });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [valuationTerm, valuationSearch, applyValuationSearch]);
  const valuationQuery = useInventoryValuation();
  const valuation = valuationQuery.data ?? null;
  const valuationRows = reactExports.useMemo(() => (valuation == null ? void 0 : valuation.rows) ?? [], [valuation == null ? void 0 : valuation.rows]);
  const valuationTotals = (valuation == null ? void 0 : valuation.totals) ?? null;
  const companyQuery = useCompanyProfile();
  const company = companyQuery.data ?? null;
  const companyHeader = reactExports.useMemo(
    () => companyHeaderFromProfile(company),
    [company]
  );
  const [cutoffAt] = reactExports.useState(() => /* @__PURE__ */ new Date());
  const cutoffLabel = formatDateTime(BigInt(cutoffAt.getTime()) * 1000000n);
  const printValuation = reactExports.useCallback(() => {
    window.print();
  }, []);
  const valuationCategories = reactExports.useMemo(
    () => [...(valuation == null ? void 0 : valuation.byCategory) ?? []].sort(
      (a, b) => a.category.localeCompare(b.category, "es")
    ),
    [valuation == null ? void 0 : valuation.byCategory]
  );
  const filteredValuationRows = reactExports.useMemo(() => {
    const term = valuationSearch.trim().toLowerCase();
    return valuationRows.filter((row) => {
      const matchesTerm = term === "" || row.name.toLowerCase().includes(term) || row.sku.toLowerCase().includes(term);
      const matchesCategory = valuationCategory === "" || row.category === valuationCategory;
      return matchesTerm && matchesCategory;
    });
  }, [valuationRows, valuationSearch, valuationCategory]);
  const sortedValuationRows = reactExports.useMemo(() => {
    const factor = valuationSort.direction === "asc" ? 1 : -1;
    return [...filteredValuationRows].sort((a, b) => {
      switch (valuationSort.key) {
        case "sku":
          return factor * a.sku.localeCompare(b.sku, "es");
        case "name":
          return factor * a.name.localeCompare(b.name, "es");
        case "units":
          return factor * (a.units === b.units ? 0 : a.units > b.units ? 1 : -1);
        case "costValue":
          return factor * (a.costValue === b.costValue ? 0 : a.costValue > b.costValue ? 1 : -1);
        case "saleValue":
          return factor * (a.saleValue === b.saleValue ? 0 : a.saleValue > b.saleValue ? 1 : -1);
        case "margin":
          return factor * (a.margin === b.margin ? 0 : a.margin > b.margin ? 1 : -1);
        default:
          return 0;
      }
    });
  }, [filteredValuationRows, valuationSort]);
  const toggleValuationSort = reactExports.useCallback((key) => {
    setValuationSort(
      (current) => current.key === key ? {
        key,
        direction: current.direction === "asc" ? "desc" : "asc"
      } : { key, direction: key === "sku" || key === "name" ? "asc" : "desc" }
    );
  }, []);
  const clearValuationFilters = reactExports.useCallback(() => {
    setValuationTerm("");
    applyValuationSearch({ q: "", categoria: "" });
  }, [applyValuationSearch]);
  const hasValuationFilters = valuationSearch.trim() !== "" || valuationCategory !== "";
  const exportValuation = reactExports.useCallback(() => {
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
      "Margen %"
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
      "Margen %": formatBps(row.marginBps)
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
      "Margen %": formatBps(valuationTotals.marginBps)
    });
    void downloadXlsx("valoracion-inventario", "Valoración", headers, rows);
  }, [valuation, valuationTotals]);
  const valuationIsEmpty = !valuationQuery.isLoading && !valuationQuery.isError && valuationRows.length === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "accounting.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Contabilidad",
            description: "Ingresos, gastos y utilidad del taller por periodo, con libro de movimientos y desgloses.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: exportSummary,
                disabled: !summary,
                "data-ocid": "accounting.export_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
                  "Exportar resumen Excel"
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "section",
          {
            "data-ocid": "accounting.filters",
            className: "rounded-lg border border-border bg-card p-3 shadow-subtle",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-1.5", children: PERIOD_PRESETS.map((preset) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  size: "sm",
                  variant: activePreset === preset.id ? "default" : "outline",
                  onClick: () => applyPreset(preset),
                  "data-ocid": `accounting.period.${preset.id}`,
                  children: preset.label
                },
                preset.id
              )) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "accounting-from",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Desde"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "accounting-from",
                    type: "date",
                    value: from,
                    onChange: (event) => {
                      setFrom(event.target.value);
                      setActivePreset(null);
                    },
                    className: "data-rail w-[160px]",
                    "data-ocid": "accounting.date_from_input"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Label,
                  {
                    htmlFor: "accounting-to",
                    className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                    children: "Hasta"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "accounting-to",
                    type: "date",
                    value: to,
                    onChange: (event) => {
                      setTo(event.target.value);
                      setActivePreset(null);
                    },
                    className: "data-rail w-[160px]",
                    "data-ocid": "accounting.date_to_input"
                  }
                )
              ] }),
              hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "ghost",
                  onClick: clearFilters,
                  "data-ocid": "accounting.clear_filters_button",
                  className: "gap-2 text-muted-foreground",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                    "Limpiar"
                  ]
                }
              ) : null
            ] })
          }
        ),
        reportQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "accounting.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-6 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el reporte contable." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => void reportQuery.refetch(),
                  "data-ocid": "accounting.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "section",
            {
              "data-ocid": "accounting.kpis",
              className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
              children: reportQuery.isLoading || !summary ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: "accounting.kpi.income" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: "accounting.kpi.expenses" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: "accounting.kpi.profit" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: "accounting.kpi.commissions" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: "accounting.kpi.net_profit" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: "accounting.kpi.counts" })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  KpiCard,
                  {
                    ocid: "accounting.kpi.income",
                    label: "Ingresos",
                    value: formatMoney(summary.totalIncome),
                    hint: "Facturas pagadas en el periodo",
                    icon: TrendingUp,
                    tone: "primary"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  KpiCard,
                  {
                    ocid: "accounting.kpi.expenses",
                    label: "Gastos",
                    value: formatMoney(summary.totalExpenses),
                    hint: "Egresos registrados en el periodo",
                    icon: Wallet,
                    tone: "warning"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  KpiCard,
                  {
                    ocid: "accounting.kpi.profit",
                    label: "Utilidad",
                    value: formatMoney(summary.profit),
                    hint: "Ingresos menos gastos",
                    icon: Scale,
                    tone: "info"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  KpiCard,
                  {
                    ocid: "accounting.kpi.commissions",
                    label: "Comisiones técnicos",
                    value: formatMoney(summary.totalCommissions),
                    hint: "Comisiones del periodo que reducen la utilidad",
                    icon: ArrowDownRight,
                    tone: "warning"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  KpiCard,
                  {
                    ocid: "accounting.kpi.net_profit",
                    label: "Utilidad neta",
                    value: formatMoney(summary.netProfit),
                    hint: "Utilidad después de comisiones de técnicos",
                    icon: Scale,
                    tone: "primary"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  KpiCard,
                  {
                    ocid: "accounting.kpi.counts",
                    label: "Movimientos",
                    value: formatNumber(
                      summary.invoiceCount + summary.expenseCount
                    ),
                    hint: `${formatNumber(summary.invoiceCount)} facturas · ${formatNumber(summary.expenseCount)} gastos`,
                    icon: ArrowUpRight,
                    tone: "primary"
                  }
                )
              ] })
            }
          ),
          reportQuery.isLoading || !profitView ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "section",
            {
              "data-ocid": "accounting.profit.loading_state",
              className: "space-y-3 rounded-lg border border-border bg-card p-4 shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-56" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-3", children: Array.from(
                  { length: 3 },
                  (_, index) => `profit-block-${index}`
                ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-40 w-full" }, id)) })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            ProfitBreakdownPanel,
            {
              profit: profitView,
              ocid: "accounting.profit"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              BreakdownPanel,
              {
                ocid: "accounting.category_breakdown",
                title: "Gastos por categoría",
                caption: "Distribución de egresos del periodo",
                rows: categoryRows,
                total: (summary == null ? void 0 : summary.totalExpenses) ?? 0n
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              BreakdownPanel,
              {
                ocid: "accounting.method_breakdown",
                title: "Ingresos por método de pago",
                caption: "Cobros agrupados por forma de pago",
                rows: methodRows,
                total: (summary == null ? void 0 : summary.totalIncome) ?? 0n
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "section",
            {
              "data-ocid": "accounting.ledger",
              className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Libro de movimientos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: "Facturas pagadas y gastos registrados consolidados" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: reportQuery.isLoading ? "Cargando…" : `${formatNumber(sortedEntries.length)} movimiento${sortedEntries.length === 1 ? "" : "s"}` })
                ] }),
                reportQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    "data-ocid": "accounting.ledger.loading_state",
                    className: "space-y-2 p-4",
                    children: Array.from({ length: 6 }, (_, index) => `ledger-${index}`).map(
                      (id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id)
                    )
                  }
                ) : sortedEntries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "accounting.ledger.empty_state",
                    className: "flex flex-col items-center gap-3 px-6 py-16 text-center",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Scale,
                        {
                          className: "size-5 text-muted-foreground",
                          "aria-hidden": "true"
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin movimientos en el periodo" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Ajusta el rango de fechas o registra facturas y gastos para verlos consolidados aquí." })
                      ] }),
                      hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          onClick: clearFilters,
                          "data-ocid": "accounting.ledger.empty_clear_button",
                          children: "Limpiar filtros"
                        }
                      ) : null
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full caption-bottom text-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Fecha" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Concepto" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Categoría" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "h-10 px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Tipo" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "h-10 px-4 text-right font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground", children: "Monto" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: sortedEntries.map((entry, index) => {
                    const isIncome = isLedgerIncome(entry.kind);
                    const isCommission = entry.kind === LedgerEntryKind.commission;
                    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "tr",
                      {
                        "data-ocid": `accounting.ledger.row.${index + 1}`,
                        className: "border-b border-border transition-colors hover:bg-muted/40",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-2.5 text-muted-foreground", children: formatDate(entry.date) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "max-w-[320px] px-4 py-2.5", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: entry.concept }),
                            isCommission && entry.referenceType ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "block truncate font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: [
                              entry.referenceType,
                              entry.referenceId !== void 0 ? ` #${entry.referenceId.toString()}` : ""
                            ] }) : null
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 text-muted-foreground", children: categoryLabel(entry.category) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LedgerKindBadge, { kind: entry.kind }) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "td",
                            {
                              className: cn(
                                "data-rail whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                                isIncome ? "text-success" : "text-destructive"
                              ),
                              children: [
                                isIncome ? "+" : "−",
                                formatMoney(entry.amount)
                              ]
                            }
                          )
                        ]
                      },
                      entry.id.toString()
                    );
                  }) })
                ] }) }),
                !reportQuery.isLoading && sortedEntries.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border px-4 py-2.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                    "Ingresos",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-success", children: formatMoney(ledgerTotals.income) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                    "Egresos",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-destructive", children: formatMoney(ledgerTotals.expenses) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                    "Comisiones",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-destructive", children: formatMoney(ledgerTotals.commissions) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                    "Utilidad neta",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: cn(
                          "data-rail font-semibold",
                          marginTone(ledgerTotals.net)
                        ),
                        children: formatMoney(ledgerTotals.net)
                      }
                    )
                  ] })
                ] }) : null
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "accounting.valuation.section",
            className: "space-y-4 border-t border-border pt-5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Inventario" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: "Valoración de inventario" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Documento formal del inventario actual en bodega, sin filtro de fechas: el valor de costo es el precio de costo de cada repuesto por su existencia, el valor de venta es el precio de venta por la existencia y el margen de utilidad se calcula sobre el valor de venta." })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: printValuation,
                      disabled: !valuation || valuationRows.length === 0,
                      "data-ocid": "accounting.valuation.print_button",
                      className: "gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "size-4", "aria-hidden": "true" }),
                        "Imprimir / Guardar PDF"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: exportValuation,
                      disabled: !valuation || valuationRows.length === 0,
                      "data-ocid": "accounting.valuation.export_button",
                      className: "gap-2",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
                        "Exportar valoración Excel"
                      ]
                    }
                  )
                ] })
              ] }),
              valuationQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "accounting.valuation.error_state",
                  className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      TriangleAlert,
                      {
                        className: "size-6 text-destructive",
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar la valoración del inventario." }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        onClick: () => void valuationQuery.refetch(),
                        "data-ocid": "accounting.valuation.retry_button",
                        children: "Reintentar"
                      }
                    )
                  ]
                }
              ) : valuationQuery.isLoading || !valuationTotals ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "accounting.valuation.loading_state",
                  className: "space-y-4",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4", children: Array.from(
                      { length: 4 },
                      (_, index) => `valuation-kpi-${index}`
                    ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(KpiSkeleton, { ocid: `accounting.valuation.kpi.${id}` }, id)) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 rounded-lg border border-border bg-card p-4 shadow-subtle", children: Array.from(
                      { length: 6 },
                      (_, index) => `valuation-row-${index}`
                    ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, id)) })
                  ]
                }
              ) : valuationIsEmpty ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "accounting.valuation.empty_state",
                  className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Boxes,
                      {
                        className: "size-5 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin inventario valorado" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Registra repuestos con su precio de costo y su precio de venta para ver aquí el valor de costo, el valor de venta y el margen de utilidad del inventario en bodega." })
                    ] })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  "data-ocid": "accounting.valuation.document",
                  className: "scroll-slim overflow-x-auto py-2",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "report-sheet invoice-sheet space-y-5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ReportHeader, { header: companyHeader, cutoff: cutoffLabel }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        "data-ocid": "accounting.valuation.kpis",
                        className: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            ValuationKpi,
                            {
                              ocid: "accounting.valuation.kpi.cost_value",
                              label: "Valor de costo",
                              value: formatMoney(valuationTotals.totalCostValue),
                              hint: "Precio de costo del repuesto × existencia",
                              icon: Wallet,
                              tone: "primary"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            ValuationKpi,
                            {
                              ocid: "accounting.valuation.kpi.sale_value",
                              label: "Valor de venta",
                              value: formatMoney(valuationTotals.totalSaleValue),
                              hint: "Precio de venta × existencia actual",
                              icon: TrendingUp,
                              tone: "primary"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            ValuationKpi,
                            {
                              ocid: "accounting.valuation.kpi.margin",
                              label: "Margen de utilidad",
                              value: formatMoney(valuationTotals.totalMargin),
                              hint: `${formatBps(valuationTotals.marginBps)} sobre el valor de venta`,
                              icon: Scale,
                              tone: "info"
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            ValuationKpi,
                            {
                              ocid: "accounting.valuation.kpi.parts",
                              label: "Repuestos valorados",
                              value: formatNumber(valuationTotals.partCount),
                              hint: `${formatNumber(valuationTotals.totalUnits)} unidades en bodega`,
                              icon: Package,
                              tone: "warning"
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      ValuationCategoryPanel,
                      {
                        categories: valuationCategories,
                        totalSaleValue: valuationTotals.totalSaleValue
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "section",
                      {
                        "data-ocid": "accounting.valuation.table_panel",
                        className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-print flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Repuestos valorados" }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "truncate text-xs text-muted-foreground", children: [
                                formatNumber(sortedValuationRows.length),
                                " de",
                                " ",
                                formatNumber(valuationRows.length),
                                " repuestos"
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Search,
                                  {
                                    className: "pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                                    "aria-hidden": "true"
                                  }
                                ),
                                /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  Input,
                                  {
                                    type: "search",
                                    value: valuationTerm,
                                    onChange: (event) => setValuationTerm(event.target.value),
                                    placeholder: "Buscar por nombre o SKU",
                                    "aria-label": "Buscar repuesto por nombre o SKU",
                                    className: "w-[220px] pl-8",
                                    "data-ocid": "accounting.valuation.search_input"
                                  }
                                )
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                "select",
                                {
                                  value: valuationCategory,
                                  onChange: (event) => applyValuationSearch({ categoria: event.target.value }),
                                  "aria-label": "Filtrar por categoría",
                                  "data-ocid": "accounting.valuation.category_select",
                                  className: "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Todas las categorías" }),
                                    valuationCategories.map((category) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                                      "option",
                                      {
                                        value: category.category,
                                        children: category.category
                                      },
                                      category.category
                                    ))
                                  ]
                                }
                              ),
                              hasValuationFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                Button,
                                {
                                  type: "button",
                                  variant: "ghost",
                                  onClick: clearValuationFilters,
                                  "data-ocid": "accounting.valuation.clear_filters_button",
                                  className: "gap-2 text-muted-foreground",
                                  children: [
                                    /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                                    "Limpiar"
                                  ]
                                }
                              ) : null
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            ValuationTable,
                            {
                              rows: sortedValuationRows,
                              sort: valuationSort,
                              onSort: toggleValuationSort,
                              hasFilters: hasValuationFilters,
                              onClearFilters: clearValuationFilters
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border px-4 py-2.5", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                              "Costo",
                              " ",
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-foreground", children: formatMoney(valuationTotals.totalCostValue) })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                              "Venta",
                              " ",
                              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-foreground", children: formatMoney(valuationTotals.totalSaleValue) })
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                              "Margen",
                              " ",
                              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                                "span",
                                {
                                  className: cn(
                                    "data-rail font-semibold",
                                    marginTone(valuationTotals.totalMargin)
                                  ),
                                  children: [
                                    formatMoney(valuationTotals.totalMargin),
                                    " ·",
                                    " ",
                                    formatBps(valuationTotals.marginBps)
                                  ]
                                }
                              )
                            ] })
                          ] })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ReportSignatureBlock, {})
                  ] })
                }
              )
            ]
          }
        )
      ]
    }
  );
}
export {
  AccountingPage,
  AccountingPage as default
};
