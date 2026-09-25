import { s as reactExports, j as jsxRuntimeExports, B as Button, ae as cn, x as formatMoney } from "./index-CzQEXdHP.js";
import { P as Printer } from "./printer-D9qf1U3g.js";
import { D as Download } from "./download-6xWfJWG2.js";
const FORMATS = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" }
];
function DocumentPreview({
  title,
  number,
  companyName,
  companyLogoUrl,
  companyContact,
  companyFiscal,
  meta,
  lines,
  totals,
  footer,
  format,
  ocid,
  onFormatChange,
  onDownloadPdf,
  isDownloading
}) {
  const sheetRef = reactExports.useRef(null);
  const [activeFormat, setActiveFormat] = reactExports.useState(format);
  reactExports.useEffect(() => {
    setActiveFormat(format);
  }, [format]);
  const selectFormat = (next) => {
    setActiveFormat(next);
    onFormatChange == null ? void 0 : onFormatChange(next);
  };
  const print = () => {
    window.print();
  };
  const downloadPdf = () => {
    if (onDownloadPdf) {
      void onDownloadPdf(activeFormat);
      return;
    }
    window.print();
  };
  const fiscalLines = (companyFiscal ?? []).filter(
    (line) => line.trim() !== ""
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": ocid, className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-print flex flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: onFormatChange ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "fieldset",
        {
          "aria-label": "Formato del documento",
          "data-ocid": `${ocid}.format_toggle`,
          className: "doc-format-toggle",
          children: FORMATS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "data-active": activeFormat === option.value,
              "aria-pressed": activeFormat === option.value,
              onClick: () => selectFormat(option.value),
              "data-ocid": `${ocid}.format_${option.value}`,
              children: option.label
            },
            option.value
          ))
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: activeFormat === "a4" ? "Hoja A4" : "Tirilla 80 mm" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: print,
            "data-ocid": `${ocid}.print_button`,
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "size-4", "aria-hidden": "true" }),
              "Imprimir"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            size: "sm",
            onClick: downloadPdf,
            disabled: isDownloading,
            "data-ocid": `${ocid}.download_button`,
            className: "gap-1.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "size-4", "aria-hidden": "true" }),
              isDownloading ? "Generando…" : "Descargar PDF"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        ref: sheetRef,
        className: cn(
          "doc-preview invoice-sheet",
          activeFormat === "a4" ? "doc-preview-a4" : "doc-preview-80mm"
        ),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
              companyLogoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: companyLogoUrl,
                  alt: "",
                  "data-ocid": `${ocid}.logo`,
                  className: "size-12 shrink-0 object-contain"
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-title font-display text-lg font-bold tracking-tight", children: companyName }),
                companyContact ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: companyContact }) : null,
                fiscalLines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    "data-ocid": `${ocid}.fiscal_block`,
                    className: "mt-1 space-y-0.5",
                    children: fiscalLines.map((line) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: line }, line))
                  }
                ) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold uppercase tracking-wider", children: title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs", children: number })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "grid grid-cols-2 gap-x-4 gap-y-1 text-xs", children: meta.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "doc-meta", children: entry.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: cn("text-right", entry.rail && "data-rail"), children: entry.value })
          ] }, entry.label)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-left", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 font-medium", children: "Concepto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Cant." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "P. unit." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-1 text-right font-medium", children: "Importe" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: lines.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 pr-2", children: line.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular", children: line.quantity }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular", children: formatMoney(BigInt(Math.round(line.unitPrice * 100))) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-0.5 text-right tabular", children: formatMoney(BigInt(Math.round(line.amount * 100))) })
            ] }, `${line.description}-${index}`)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "ml-auto w-full max-w-[220px] space-y-1 text-xs", children: totals.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: cn(
                "flex justify-between gap-3",
                entry.emphasis && "font-display text-sm font-bold"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: cn(!entry.emphasis && "doc-meta"), children: entry.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-right tabular", children: entry.value })
              ]
            },
            entry.label
          )) }),
          footer ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-center text-[10px]", children: footer })
          ] }) : null
        ]
      }
    ) })
  ] });
}
export {
  DocumentPreview as D
};
