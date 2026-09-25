import { j as jsxRuntimeExports, B as Button, L as Link, n as formatNumber, y as formatDate, ag as formatDateTime, x as formatMoney, F as FileText, aw as CircleCheck, T as TriangleAlert, d as Boxes, ae as cn, ai as useParams } from "./index-CzQEXdHP.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
import { f as usePurchaseInvoice, I as InvoiceStatusBadge, E as EXTRACTION_STATUS_LABELS, F as FILE_KIND_LABELS, g as formatFileSize, L as LINE_APPLY_TONES, h as LINE_APPLY_LABELS, i as LINE_MATCH_LABELS } from "./use-purchase-invoices-Ny1gl9qq.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { A as ArrowLeft } from "./arrow-left-DLNUnNNY.js";
import { P as PackagePlus } from "./package-plus-BhkMeGFW.js";
import { R as RefreshCw } from "./refresh-cw-DNkHwTxf.js";
import { A as ArrowUpRight } from "./arrow-up-right-BKdBrREM.js";
function linesTotal(invoice) {
  return invoice.lines.reduce(
    (sum, line) => sum + line.unitCost * line.quantity,
    0n
  );
}
function errorCount(invoice) {
  return invoice.lines.filter((line) => line.applyStatus === "error").length;
}
function MetaField({
  label,
  value,
  rail
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: cn("text-sm font-medium", rail && "data-rail"), children: value })
  ] });
}
function MovementLink({
  line,
  index
}) {
  if (line.matchedPartId === void 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "sm", asChild: true, className: "gap-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Link,
    {
      to: "/inventario/$id",
      params: { id: line.matchedPartId.toString() },
      "data-ocid": `purchase_invoice_detail.movement_link.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { className: "size-3.5", "aria-hidden": "true" }),
        "Ver movimientos"
      ]
    }
  ) });
}
function LineRow({
  line,
  index
}) {
  const amount = line.unitCost * line.quantity;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { "data-ocid": `purchase_invoice_detail.line.${index + 1}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-xs text-muted-foreground", children: formatNumber(line.lineNumber) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "max-w-[280px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate font-medium", children: line.description }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail block text-xs text-muted-foreground", children: line.code })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right", children: formatNumber(line.quantity) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(line.unitCost) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-medium", children: formatMoney(amount) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      StatusBadge,
      {
        label: LINE_APPLY_LABELS[line.applyStatus],
        tone: LINE_APPLY_TONES[line.applyStatus],
        className: "font-mono text-[10px] uppercase tracking-wider"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: LINE_MATCH_LABELS[line.matchStatus] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[240px]", children: line.applyError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        "data-ocid": `purchase_invoice_detail.line_error.${index + 1}`,
        className: "flex items-start gap-1 text-xs text-destructive",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "mt-0.5 size-3.5 shrink-0",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "min-w-0 break-words", children: line.applyError })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MovementLink, { line, index }) })
  ] });
}
function DetailSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoice_detail.loading_state",
      className: "mx-auto w-full max-w-6xl space-y-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-56" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 w-full" })
      ]
    }
  );
}
function DetailError() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoice_detail.error_state",
      className: "mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-6 text-destructive", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Factura no encontrada" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "La factura de compra solicitada no existe o fue eliminada del registro." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/facturas-compra",
            "data-ocid": "purchase_invoice_detail.back_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
              "Volver al historial"
            ]
          }
        ) })
      ]
    }
  );
}
function PurchaseInvoiceDetail({
  invoiceId
}) {
  var _a, _b, _c, _d;
  const invoiceQuery = usePurchaseInvoice(invoiceId);
  if (invoiceQuery.isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(DetailSkeleton, {});
  const invoice = invoiceQuery.data ?? null;
  if (invoiceQuery.isError || !invoice) return /* @__PURE__ */ jsxRuntimeExports.jsx(DetailError, {});
  const total = linesTotal(invoice);
  const failures = errorCount(invoice);
  const isConfirmed = invoice.status === "confirmed";
  const appliedLines = invoice.lines.filter(
    (line) => line.matchedPartId !== void 0
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "purchase_invoice_detail.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Link,
            {
              to: "/facturas-compra",
              "data-ocid": "purchase_invoice_detail.back_link",
              className: "gap-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Historial de facturas"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(InvoiceStatusBadge, { status: invoice.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Compras · Factura procesada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "data-rail text-2xl font-semibold tracking-tight", children: ((_a = invoice.invoiceNumber) == null ? void 0 : _a.trim()) || `Factura #${invoice.id.toString()}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            ((_b = invoice.supplierName) == null ? void 0 : _b.trim()) || "Proveedor sin identificar",
            " ·",
            " ",
            formatNumber(invoice.lines.length),
            " ítem",
            invoice.lines.length === 1 ? "" : "s",
            " extraído",
            invoice.lines.length === 1 ? "" : "s"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "purchase_invoice_detail.header_panel",
            className: "rounded-lg border border-border bg-card p-5 shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Proveedor",
                    value: ((_c = invoice.supplierName) == null ? void 0 : _c.trim()) || "Sin identificar"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Número de factura",
                    value: ((_d = invoice.invoiceNumber) == null ? void 0 : _d.trim()) || "—",
                    rail: true
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Fecha de factura",
                    value: formatDate(invoice.invoiceDate)
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Cargada el",
                    value: formatDateTime(invoice.createdAt)
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Extracción",
                    value: EXTRACTION_STATUS_LABELS[invoice.extractionStatus]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Archivo",
                    value: `${FILE_KIND_LABELS[invoice.file.kind] ?? invoice.file.kind} · ${formatFileSize(invoice.file.sizeBytes)}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetaField,
                  {
                    label: "Confirmada el",
                    value: invoice.confirmedAt ? formatDateTime(invoice.confirmedAt) : "—"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(MetaField, { label: "Total de líneas", value: formatMoney(total), rail: true })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs text-muted-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-3.5", "aria-hidden": "true" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: invoice.file.fileName })
                ] }),
                isConfirmed ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  StatusBadge,
                  {
                    label: `${formatNumber(invoice.lines.length - failures)} aplicadas`,
                    tone: "accepted",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "size-3", "aria-hidden": "true" }),
                    className: "font-mono text-[10px] uppercase tracking-wider"
                  }
                ) : null,
                failures > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  StatusBadge,
                  {
                    label: `${formatNumber(failures)} con error`,
                    tone: "rejected",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3", "aria-hidden": "true" }),
                    className: "font-mono text-[10px] uppercase tracking-wider"
                  }
                ) : null
              ] }),
              invoice.extractionError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  "data-ocid": "purchase_invoice_detail.extraction_error",
                  className: "mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
                  children: invoice.extractionError
                }
              ) : null
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: "Ítems extraídos y resultado de aplicación" }),
            isConfirmed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "inline-flex items-center gap-1.5 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PackagePlus, { className: "size-3.5", "aria-hidden": "true" }),
              "Cada línea aplicada generó un movimiento de inventario."
            ] }) : null
          ] }),
          invoice.lines.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "purchase_invoice_detail.lines_empty_state",
              className: "flex flex-col items-center gap-2 px-6 py-14 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  RefreshCw,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin ítems extraídos" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "La extracción no devolvió líneas para esta factura. Revisa el archivo cargado o vuelve a ejecutar la extracción." })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "#" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Descripción" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Cant." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Costo unit." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Aplicación" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Coincidencia" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Detalle" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Inventario" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: invoice.lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(LineRow, { line, index }, line.id.toString())) })
          ] }) }),
          invoice.lines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center justify-end gap-x-6 gap-y-1 border-t border-border px-4 py-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "Total de la factura",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "data-rail text-foreground", children: formatMoney(total) })
          ] }) }) : null
        ] }),
        appliedLines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "purchase_invoice_detail.movements_panel",
            className: "rounded-lg border border-border bg-card p-5 shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-3 flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Boxes,
                  {
                    className: "size-4 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Movimientos de inventario generados" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "Abre el repuesto afectado para ver sus lotes, movimientos y ajustes de existencias." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: appliedLines.map((line, index) => {
                var _a2;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "li",
                  {
                    className: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: line.description }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail block text-xs text-muted-foreground", children: [
                          line.code,
                          " · ",
                          formatNumber(line.quantity),
                          " ×",
                          " ",
                          formatMoney(line.unitCost)
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          asChild: true,
                          className: "gap-1",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            Link,
                            {
                              to: "/inventario/$id",
                              params: { id: ((_a2 = line.matchedPartId) == null ? void 0 : _a2.toString()) ?? "" },
                              "data-ocid": `purchase_invoice_detail.part_link.${index + 1}`,
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "size-3.5", "aria-hidden": "true" }),
                                "Ver repuesto"
                              ]
                            }
                          )
                        }
                      )
                    ]
                  },
                  line.id.toString()
                );
              }) })
            ]
          }
        ) : null
      ]
    }
  );
}
function PurchaseInvoiceDetailPage() {
  const params = useParams({ strict: false });
  const rawId = params.id ?? "";
  if (!/^\d+$/.test(rawId)) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "purchase_invoice_detail.error_state",
        className: "mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Factura no encontrada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "El identificador de la factura no es válido." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PurchaseInvoiceDetail, { invoiceId: BigInt(rawId) });
}
export {
  PurchaseInvoiceDetailPage
};
