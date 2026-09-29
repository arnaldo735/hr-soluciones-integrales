import { Y as createLucideIcon, t as reactExports, z as formatDate, j as jsxRuntimeExports, B as Button, Z as cn, K as Label, J as UserRound, q as ServiceSort, y as formatMoney, X, v as Search, w as Input, x as Badge, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, W as Wrench, a2 as DialogDescription, T as TriangleAlert, a3 as DialogFooter, o as formatNumber, a4 as useControllableState, a5 as useId, a6 as useComposedRefs, a7 as Primitive, a8 as composeEventHandlers, a9 as Presence, aa as Portal$1, ab as hideOthers, ac as ReactRemoveScroll, ad as createContextScope, ae as createSlot, af as useFocusGuards, ag as FocusScope, ah as DismissableLayer, ai as ExternalBlob, aj as formatDateTime, ak as LoaderCircle, al as useParams, r as useNavigate, O as OrderStatus, P as Package, L as Link, am as formatTaxRate, A as WhatsAppContext, D as WhatsAppContactKind, an as ShieldCheck, E as Ban, M as Bike, N as NotificationSource, k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation, F as FileText } from "./index-EqGEeyjs.js";
import { D as DocumentPreview } from "./DocumentPreview-C4gHQdTZ.js";
import { N as NotifyCustomerDialog } from "./NotifyCustomerDialog-DUFQVTg_.js";
import { W as WARRANTY_DOCUMENT_TITLE, a as WARRANTY_CLAUSES, b as WARRANTY_IMPORTANT_TEXT, w as warrantyAppliesToOrder } from "./warranty-BU5LnZHy.js";
import { P as Printer } from "./printer-CZZ39YEy.js";
import { D as Download } from "./download-C8tLpeh6.js";
import { W as WhatsAppNotifyButton, M as MessageCircle, b as buildWhatsAppUrl } from "./WhatsAppNotifyButton-D_CTyEEs.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem, R as Root2$1, A as Anchor, e as createPopperScope, C as Content, f as Arrow } from "./select-BKwq6Kpv.js";
import { u as useTechnicians } from "./use-technicians-BvNsJs-Y.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { u as useServices, a as useService } from "./use-services-DD92YJ18.js";
import { h as useAddLabor, g as errorMessage, i as useParts, j as useLots, k as useAddOrderPart, l as useAddOrderPhoto, m as useRemoveOrderPhoto, O as ORDER_STATUS_FLOW, b as ORDER_STATUS_LABELS, n as useFindPartByCode, o as useOrder, p as useUpdateOrderStatus, q as useRemoveOrderPart, r as useRemoveLabor, s as nextStatus, c as ORDER_STATUS_BADGE } from "./use-orders-BVudDwaF.js";
import { S as ScanLine, B as BarcodeScanner, C as Camera } from "./BarcodeScanner-DxFj0yM1.js";
import { P as PackagePlus } from "./package-plus-DDYRgHvR.js";
import { C as CancelOrderDialog, D as DeleteOrderDialog } from "./DeleteOrderDialog-CmKHuh1g.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-YKA4f36t.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { I as ImagePlus } from "./image-plus-BPPowfP9.js";
import { C as Check } from "./check-LdjEv5O-.js";
import { S as Separator } from "./separator-B6xouacW.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { a as useIvaSettings, b as useBusinessSettings, u as useCompanyProfile } from "./use-company-B0ILLjch.js";
import { u as useDailyHopeMessage } from "./use-hope-35eM4bcJ.js";
import { u as useServiceTermsSettings, S as SERVICE_TERMS_DEFAULT_TEXT } from "./use-service-terms-DA5dJHUn.js";
import { u as useWarrantyTermsSettings, W as WARRANTY_TERMS_DEFAULT_TEXT } from "./use-warranty-terms-BDnUd14y.js";
import { u as usePrepareWhatsAppMessage } from "./use-whatsapp-DIGqY6EY.js";
import { c as companyHeaderFromProfile, a as companyFiscalLines, b as companyContactLine } from "./company-header-Ds_ApIKF.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { h as hopeMessageContent, p as pdfCompanyFromProfile, d as downloadWarrantyPdf, l as loadPdfLibs, a as drawHopeMessage } from "./pdf-BjjrMDP3.js";
import { A as ArrowLeft } from "./arrow-left-DSEilCsK.js";
import { M as Mail } from "./mail-B11strfl.js";
import { A as ArrowRight } from "./arrow-right-Chrmeonu.js";
import { P as Plus } from "./plus-BblUTOs8.js";
import { U as UserRoundPlus } from "./user-round-plus-QlSApeWF.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
];
const Clock = createLucideIcon("clock", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
      key: "vktsd0"
    }
  ],
  ["circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor", key: "kqv944" }]
];
const Tag = createLucideIcon("tag", __iconNode);
const ORDER_PHOTO_LIMIT = 6;
const FORMATS = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" }
];
function WarrantyDocument({
  data,
  companyName,
  companyLogoUrl,
  companyContact,
  companyFiscal,
  format,
  termsText,
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
  if (!data) return null;
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
  const isNarrow = activeFormat === "receipt80";
  const savedTerms = (termsText == null ? void 0 : termsText.trim()) ?? "";
  const identity = [
    { label: "Cliente", value: data.customerName },
    {
      label: "Documento",
      value: data.customerDocument.trim() !== "" ? data.customerDocument : "—"
    },
    {
      label: "Motocicleta",
      value: `${data.motorcycleBrand} ${data.motorcycleModel}`.trim() || "—"
    },
    { label: "Año", value: data.motorcycleYear.toString() },
    { label: "Placa", value: data.motorcyclePlate.trim() || "—" },
    { label: "Fecha del servicio", value: formatDate(data.serviceDate) },
    {
      label: "Técnico",
      value: data.technicianName.trim() !== "" ? `${data.technicianCode} · ${data.technicianName}` : "—"
    }
  ];
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "header",
            {
              className: cn(
                "doc-header flex gap-4",
                isNarrow ? "flex-col items-center gap-3 text-center" : "items-start justify-between"
              ),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: cn(
                      "doc-header-identity flex min-w-0 gap-3",
                      isNarrow ? "w-full flex-col items-center gap-2 text-center" : "items-start"
                    ),
                    children: [
                      companyLogoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "img",
                        {
                          src: companyLogoUrl,
                          alt: "",
                          "data-ocid": `${ocid}.logo`,
                          className: "size-12 shrink-0 object-contain"
                        }
                      ) : null,
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "div",
                        {
                          className: cn(
                            "min-w-0",
                            isNarrow ? "w-full space-y-1" : void 0
                          ),
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-title font-display text-lg font-bold tracking-tight", children: companyName }),
                            companyContact ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: companyContact }) : null,
                            fiscalLines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "div",
                              {
                                "data-ocid": `${ocid}.fiscal_block`,
                                className: cn("space-y-0.5", isNarrow ? "mt-0" : "mt-1"),
                                children: fiscalLines.map((line) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-meta text-xs", children: line }, line))
                              }
                            ) : null
                          ]
                        }
                      )
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: cn(
                      "doc-header-title",
                      isNarrow ? "w-full text-center" : "text-right"
                    ),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold uppercase tracking-wider", children: WARRANTY_DOCUMENT_TITLE }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs", children: data.orderNumber })
                    ]
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "section",
            {
              "data-ocid": `${ocid}.identity`,
              "aria-label": "Identificación del servicio",
              className: "doc-warranty-identity",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "grid grid-cols-2 gap-x-4 gap-y-1 text-xs", children: identity.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "doc-meta", children: entry.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "text-right", children: entry.value })
              ] }, entry.label)) })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "doc-rule my-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "section",
            {
              "data-ocid": `${ocid}.clauses`,
              "aria-label": "Cláusulas de garantía",
              className: "doc-warranty-clauses",
              children: savedTerms !== "" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "p",
                {
                  "data-ocid": `${ocid}.terms_text`,
                  className: "doc-warranty-clause-body whitespace-pre-line",
                  children: savedTerms
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: WARRANTY_CLAUSES.map((clause) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "article",
                {
                  "data-ocid": `${ocid}.clause.${clause.number}`,
                  className: "doc-warranty-clause",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "doc-warranty-clause-title", children: [
                      clause.number,
                      ". ",
                      clause.title
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-warranty-clause-body", children: clause.body })
                  ]
                },
                clause.number
              )) })
            }
          ),
          savedTerms === "" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": `${ocid}.important`,
              className: "doc-warranty-important",
              role: "note",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-warranty-important-title", children: "IMPORTANTE" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "doc-warranty-important-body", children: WARRANTY_IMPORTANT_TEXT })
              ]
            }
          ) : null
        ]
      }
    ) })
  ] });
}
const NO_TECHNICIAN = "__none__";
function LaborTechnicianSelect({
  value,
  onChange,
  id,
  ocid,
  disabled = false,
  showLabel = true,
  activeOnly = false
}) {
  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly
  });
  const technicians = techniciansQuery.data ?? [];
  const selected = technicians.find((entry) => entry.id === value) ?? null;
  function handleChange(next) {
    onChange(next === NO_TECHNICIAN ? null : BigInt(next));
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    showLabel ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: id, className: "flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        UserRound,
        {
          className: "size-3.5 text-muted-foreground",
          "aria-hidden": "true"
        }
      ),
      "Técnico responsable"
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Select,
      {
        value: value === null ? NO_TECHNICIAN : value.toString(),
        onValueChange: handleChange,
        disabled: disabled || techniciansQuery.isLoading,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SelectTrigger,
            {
              id,
              "data-ocid": ocid,
              "aria-label": "Técnico responsable de la mano de obra",
              className: "w-full",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona un técnico…", children: selected ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: selected.code }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: selected.name })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Sin asignar" }) })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: NO_TECHNICIAN, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Sin asignar" }) }),
            technicians.map((technician) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectItem,
              {
                value: technician.id.toString(),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: technician.code }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: technician.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-xs text-muted-foreground", children: technician.specialty })
                ] })
              },
              technician.id.toString()
            ))
          ] })
        ]
      }
    ),
    !techniciansQuery.isLoading && technicians.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: activeOnly ? "No hay técnicos activos registrados. Registra uno para asignar la mano de obra." : "No hay técnicos registrados todavía." }) : null
  ] });
}
const SERVICE_PICKER_PAGE_SIZE = 1e3;
function ServicePicker({
  value,
  onChange,
  id,
  ocid,
  disabled = false
}) {
  var _a;
  const [search, setSearch] = reactExports.useState("");
  const [debounced, setDebounced] = reactExports.useState("");
  reactExports.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const term = debounced.trim();
  const servicesQuery = useServices({
    search: debounced,
    category: null,
    activeOnly: true,
    sort: ServiceSort.name,
    page: 1,
    pageSize: SERVICE_PICKER_PAGE_SIZE,
    enabled: term.length > 0
  });
  const services = term.length > 0 ? ((_a = servicesQuery.data) == null ? void 0 : _a.items) ?? [] : [];
  if (value) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: id, className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "size-3.5 text-muted-foreground", "aria-hidden": "true" }),
        "Servicio del catálogo"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": `${ocid}.selected`,
          className: "flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: value.code }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: value.name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail truncate text-xs text-muted-foreground", children: [
                value.category,
                " · Tarifa ",
                formatMoney(value.laborRate)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                onClick: () => {
                  setSearch("");
                  setDebounced("");
                  onChange(null);
                },
                disabled,
                "aria-label": `Quitar el servicio ${value.name}`,
                "data-ocid": `${ocid}.clear_button`,
                className: "shrink-0 text-muted-foreground hover:text-destructive",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4", "aria-hidden": "true" })
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "La línea conserva la referencia al servicio. Puedes editar la descripción y el precio libremente." })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: id, className: "flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "size-3.5 text-muted-foreground", "aria-hidden": "true" }),
      "Servicio del catálogo (opcional)"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Search,
        {
          className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          id,
          value: search,
          onChange: (event) => setSearch(event.target.value),
          placeholder: "Busca por código o nombre…",
          autoComplete: "off",
          disabled,
          "data-ocid": `${ocid}.search_input`,
          className: "pl-9"
        }
      )
    ] }),
    term.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        "data-ocid": `${ocid}.prompt_state`,
        className: "rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground",
        children: "Escribe el código o el nombre del servicio para ver coincidencias."
      }
    ) : servicesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": `${ocid}.loading_state`, className: "space-y-1.5", children: Array.from(
      { length: 3 },
      (_, index) => `service-skeleton-${index}`
    ).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, key)) }) : servicesQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        "data-ocid": `${ocid}.error_state`,
        className: "text-xs text-destructive",
        children: "No se pudo cargar el catálogo de servicios. Inténtalo de nuevo."
      }
    ) : services.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        "data-ocid": `${ocid}.empty_state`,
        className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
        children: `Sin servicios activos que coincidan con “${term}”. Puedes escribir la descripción libremente.`
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "ul",
      {
        "data-ocid": `${ocid}.list`,
        className: "max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1",
        children: services.map((service, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setSearch("");
              setDebounced("");
              onChange(service);
            },
            disabled,
            "data-ocid": `${ocid}.item.${index + 1}`,
            className: "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: service.code }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: service.name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block truncate text-xs text-muted-foreground", children: service.category })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: "outline",
                  className: "data-rail shrink-0 border-border text-xs font-medium",
                  children: formatMoney(service.laborRate)
                }
              )
            ]
          }
        ) }, service.id.toString()))
      }
    )
  ] });
}
function centsToInput(cents) {
  return (Number(cents) / 100).toFixed(2);
}
function AddLaborDialog({
  orderId,
  open,
  onOpenChange
}) {
  const [description, setDescription] = reactExports.useState("");
  const [price, setPrice] = reactExports.useState("");
  const [technicianId, setTechnicianId] = reactExports.useState(null);
  const [service, setService] = reactExports.useState(null);
  const [formError, setFormError] = reactExports.useState(null);
  const addLabor = useAddLabor();
  reactExports.useEffect(() => {
    if (open) {
      setDescription("");
      setPrice("");
      setTechnicianId(null);
      setService(null);
      setFormError(null);
    }
  }, [open]);
  const priceValue = Number(price);
  const priceValid = price.trim() !== "" && Number.isFinite(priceValue) && priceValue >= 0;
  const descriptionValid = description.trim().length > 0;
  function reset() {
    setDescription("");
    setPrice("");
    setTechnicianId(null);
    setService(null);
    setFormError(null);
  }
  function handleOpenChange(next) {
    if (!next) reset();
    onOpenChange(next);
  }
  function handleServiceChange(next) {
    setService(next);
    setFormError(null);
    if (next) {
      setDescription(`${next.code} · ${next.name}`);
      setPrice(centsToInput(next.laborRate));
    }
  }
  function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (!descriptionValid) {
      setFormError("Describe el servicio o la mano de obra realizada.");
      return;
    }
    if (!priceValid) {
      setFormError("Captura un precio válido (mayor o igual a cero).");
      return;
    }
    addLabor.mutate(
      {
        id: orderId,
        labor: {
          description: description.trim(),
          price: BigInt(Math.round(priceValue * 100)),
          technicianId: technicianId ?? void 0,
          serviceId: (service == null ? void 0 : service.id) ?? void 0
        }
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => setFormError(errorMessage(error))
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "order_detail.add_labor.modal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 font-display", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-4 text-primary", "aria-hidden": "true" }),
        "Agregar mano de obra"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Elige un servicio del catálogo para autocompletar la descripción y la tarifa, o escribe una línea libre. El precio siempre queda editable." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, noValidate: true, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ServicePicker,
        {
          id: "add-labor-service",
          ocid: "order_detail.add_labor.service",
          value: service,
          onChange: handleServiceChange,
          disabled: addLabor.isPending
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "add-labor-description", children: "Descripción" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "add-labor-description",
            value: description,
            onChange: (event) => {
              setDescription(event.target.value);
              setFormError(null);
            },
            placeholder: "Ej. Cambio de aceite y filtro",
            "data-ocid": "order_detail.add_labor.description_input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "add-labor-price", children: "Precio (COP)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "add-labor-price",
            type: "number",
            inputMode: "decimal",
            min: 0,
            step: "0.01",
            value: price,
            onChange: (event) => {
              setPrice(event.target.value);
              setFormError(null);
            },
            placeholder: "0.00",
            "data-ocid": "order_detail.add_labor.price_input",
            className: "data-rail"
          }
        ),
        priceValid ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: formatMoney(BigInt(Math.round(priceValue * 100))) }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        LaborTechnicianSelect,
        {
          id: "add-labor-technician",
          ocid: "order_detail.add_labor.technician_select",
          value: technicianId,
          onChange: (next) => {
            setTechnicianId(next);
            setFormError(null);
          },
          activeOnly: true,
          disabled: addLabor.isPending
        }
      ),
      formError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "order_detail.add_labor.error_state",
          className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "mt-0.5 size-4 shrink-0 text-destructive",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: formError })
          ]
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => handleOpenChange(false),
            "data-ocid": "order_detail.add_labor.cancel_button",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            disabled: addLabor.isPending,
            "data-ocid": "order_detail.add_labor.submit_button",
            children: addLabor.isPending ? "Agregando…" : "Agregar servicio"
          }
        )
      ] })
    ] })
  ] }) });
}
function AddPartDialog({
  orderId,
  open,
  onOpenChange
}) {
  var _a;
  const [partId, setPartId] = reactExports.useState(null);
  const [lotId, setLotId] = reactExports.useState(null);
  const [quantity, setQuantity] = reactExports.useState("1");
  const [formError, setFormError] = reactExports.useState(null);
  const [search, setSearch] = reactExports.useState("");
  const [debouncedSearch, setDebouncedSearch] = reactExports.useState("");
  const [isScanOpen, setIsScanOpen] = reactExports.useState(false);
  const [scanError, setScanError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  const partsQuery = useParts(debouncedSearch);
  const lotsQuery = useLots(partId);
  const addPart = useAddOrderPart();
  const parts = ((_a = partsQuery.data) == null ? void 0 : _a.items) ?? [];
  const lots = (lotsQuery.data ?? []).filter((lot) => lot.quantity > 0n);
  const selectedPart = parts.find((part) => part.id === partId) ?? null;
  const selectedLot = lots.find((lot) => lot.id === lotId) ?? null;
  const term = debouncedSearch.trim();
  const quantityValue = Number(quantity);
  const quantityValid = quantity.trim() !== "" && Number.isInteger(quantityValue) && quantityValue > 0;
  const availableStock = selectedLot ? selectedLot.quantity : (selectedPart == null ? void 0 : selectedPart.totalStock) ?? 0n;
  const stockSufficient = quantityValid && availableStock >= BigInt(quantityValue);
  function reset() {
    setPartId(null);
    setLotId(null);
    setQuantity("1");
    setFormError(null);
    setSearch("");
    setDebouncedSearch("");
    setIsScanOpen(false);
    setScanError(null);
  }
  function handleOpenChange(next) {
    if (!next) reset();
    onOpenChange(next);
  }
  function handleScanned(part) {
    setPartId(part.id);
    setLotId(null);
    setFormError(null);
    setScanError(null);
    setIsScanOpen(false);
  }
  function handleScanNotFound(code) {
    setScanError(`Producto no encontrado para el código ${code}.`);
  }
  function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (partId === null) {
      setFormError("Selecciona el repuesto a consumir.");
      return;
    }
    if (!quantityValid) {
      setFormError("Captura una cantidad válida (entero mayor a cero).");
      return;
    }
    if (!stockSufficient) {
      setFormError(
        `Stock insuficiente: disponible ${formatNumber(availableStock)}, solicitado ${formatNumber(quantityValue)}.`
      );
      return;
    }
    addPart.mutate(
      {
        id: orderId,
        part: {
          partId,
          lotId: lotId ?? void 0,
          quantity: BigInt(quantityValue)
        }
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => setFormError(errorMessage(error))
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "order_detail.add_part.modal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 font-display", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PackagePlus, { className: "size-4 text-primary", "aria-hidden": "true" }),
        "Agregar repuesto"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "La línea guarda el costo unitario de referencia para calcular el margen de la orden; no descuenta stock del inventario." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, noValidate: true, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "add-part-search", children: "Repuesto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => {
                setScanError(null);
                setIsScanOpen((current) => !current);
              },
              "aria-expanded": isScanOpen,
              "data-ocid": "order_detail.add_part.scan_button",
              className: "gap-1.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-4", "aria-hidden": "true" }),
                isScanOpen ? "Cerrar escáner" : "Escanear"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Search,
            {
              className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "add-part-search",
              type: "search",
              value: search,
              onChange: (event) => {
                setSearch(event.target.value);
                setFormError(null);
              },
              placeholder: "Busca por SKU o nombre…",
              autoComplete: "off",
              "data-ocid": "order_detail.add_part.search_input",
              className: "pl-9"
            }
          )
        ] }),
        isScanOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          BarcodeScanner,
          {
            ocid: "order_detail.add_part.scanner",
            title: "Escanear repuesto",
            hint: "Apunta la cámara al código del repuesto o ingrésalo manualmente.",
            onDetected: (part) => handleScanned(part),
            onNotFound: handleScanNotFound
          }
        ) : null,
        scanError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": "order_detail.add_part.scan_not_found_state",
            className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "mt-0.5 size-4 shrink-0",
                  "aria-hidden": "true"
                }
              ),
              scanError
            ]
          }
        ) : null,
        term.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "order_detail.add_part.prompt_state",
            className: "rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground",
            children: "Escribe el SKU o el nombre del repuesto para ver coincidencias."
          }
        ) : partsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "order_detail.add_part.loading_state",
            className: "space-y-1.5",
            children: Array.from(
              { length: 3 },
              (_, index) => `add-part-skeleton-${index}`
            ).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }, key))
          }
        ) : partsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "order_detail.add_part.error_state",
            className: "text-xs text-destructive",
            children: "No se pudo cargar el catálogo de repuestos. Inténtalo de nuevo."
          }
        ) : parts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "order_detail.add_part.empty_state",
            className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
            children: `Sin repuestos que coincidan con “${term}”.`
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "ul",
          {
            "data-ocid": "order_detail.add_part.list",
            className: "max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1",
            children: parts.map((part, index) => {
              const isSelected = part.id === partId;
              return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setPartId(part.id);
                    setLotId(null);
                    setFormError(null);
                  },
                  "aria-pressed": isSelected,
                  "data-ocid": `order_detail.add_part.item.${index + 1}`,
                  className: isSelected ? "flex w-full items-center justify-between gap-3 rounded-sm border border-primary/40 bg-primary/5 px-2.5 py-2 text-left transition-colors focus-visible:outline-none" : "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: part.sku }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate text-sm font-medium", children: part.name })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail mt-0.5 block truncate text-xs text-muted-foreground", children: [
                        formatNumber(part.totalStock),
                        " ",
                        part.unit,
                        " ·",
                        " ",
                        formatMoney(part.salePrice)
                      ] })
                    ] }),
                    isSelected ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      X,
                      {
                        className: "size-4 shrink-0 text-primary",
                        "aria-hidden": "true"
                      }
                    ) : null
                  ]
                }
              ) }, part.id.toString());
            })
          }
        ),
        selectedPart ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-xs text-muted-foreground", children: [
          "Precio unitario ",
          formatMoney(selectedPart.salePrice),
          " · Existencia ",
          formatNumber(selectedPart.totalStock),
          " ",
          selectedPart.unit
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "add-part-lot", children: "Lote / serie (opcional)" }),
        partId === null ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "flex h-9 items-center rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground", children: "Selecciona un repuesto para ver sus lotes" }) : lotsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }) : lots.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sin lotes registrados para este repuesto." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Select,
          {
            value: (lotId == null ? void 0 : lotId.toString()) ?? "auto",
            onValueChange: (value) => {
              setLotId(value === "auto" ? null : BigInt(value));
              setFormError(null);
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SelectTrigger,
                {
                  id: "add-part-lot",
                  "data-ocid": "order_detail.add_part.lot_select",
                  className: "w-full",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Descuento automático" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Sin lote específico" }),
                lots.map((lot) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SelectItem,
                  {
                    value: lot.id.toString(),
                    children: `${lot.lotNumber} · ${formatNumber(lot.quantity)} disp.`
                  },
                  lot.id.toString()
                ))
              ] })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "add-part-quantity", children: "Cantidad" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "add-part-quantity",
            type: "number",
            inputMode: "numeric",
            min: 1,
            step: 1,
            value: quantity,
            onChange: (event) => {
              setQuantity(event.target.value);
              setFormError(null);
            },
            "data-ocid": "order_detail.add_part.quantity_input",
            className: "data-rail"
          }
        ),
        quantityValid ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            className: stockSufficient ? "data-rail text-xs text-muted-foreground" : "data-rail text-xs text-warning",
            children: [
              "Referencia: ",
              formatNumber(quantityValue),
              " · existencia",
              " ",
              formatNumber(availableStock)
            ]
          }
        ) : null
      ] }),
      formError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "order_detail.add_part.error_state",
          className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "mt-0.5 size-4 shrink-0 text-destructive",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: formError })
          ]
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => handleOpenChange(false),
            "data-ocid": "order_detail.add_part.cancel_button",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            disabled: addPart.isPending || partId === null,
            "data-ocid": "order_detail.add_part.submit_button",
            children: addPart.isPending ? "Agregando…" : "Agregar repuesto"
          }
        )
      ] })
    ] })
  ] }) });
}
var POPOVER_NAME = "Popover";
var [createPopoverContext] = createContextScope(POPOVER_NAME, [
  createPopperScope
]);
var usePopperScope = createPopperScope();
var [PopoverProvider, usePopoverContext] = createPopoverContext(POPOVER_NAME);
var Popover$1 = (props) => {
  const {
    __scopePopover,
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    modal = false
  } = props;
  const popperScope = usePopperScope(__scopePopover);
  const triggerRef = reactExports.useRef(null);
  const [hasCustomAnchor, setHasCustomAnchor] = reactExports.useState(false);
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
    caller: POPOVER_NAME
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root2$1, { ...popperScope, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    PopoverProvider,
    {
      scope: __scopePopover,
      contentId: useId(),
      triggerRef,
      open,
      onOpenChange: setOpen,
      onOpenToggle: reactExports.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen]),
      hasCustomAnchor,
      onCustomAnchorAdd: reactExports.useCallback(() => setHasCustomAnchor(true), []),
      onCustomAnchorRemove: reactExports.useCallback(() => setHasCustomAnchor(false), []),
      modal,
      children
    }
  ) });
};
Popover$1.displayName = POPOVER_NAME;
var ANCHOR_NAME = "PopoverAnchor";
var PopoverAnchor = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopePopover, ...anchorProps } = props;
    const context = usePopoverContext(ANCHOR_NAME, __scopePopover);
    const popperScope = usePopperScope(__scopePopover);
    const { onCustomAnchorAdd, onCustomAnchorRemove } = context;
    reactExports.useEffect(() => {
      onCustomAnchorAdd();
      return () => onCustomAnchorRemove();
    }, [onCustomAnchorAdd, onCustomAnchorRemove]);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Anchor, { ...popperScope, ...anchorProps, ref: forwardedRef });
  }
);
PopoverAnchor.displayName = ANCHOR_NAME;
var TRIGGER_NAME = "PopoverTrigger";
var PopoverTrigger$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopePopover, ...triggerProps } = props;
    const context = usePopoverContext(TRIGGER_NAME, __scopePopover);
    const popperScope = usePopperScope(__scopePopover);
    const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
    const trigger = /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": context.open,
        "aria-controls": context.contentId,
        "data-state": getState(context.open),
        ...triggerProps,
        ref: composedTriggerRef,
        onClick: composeEventHandlers(props.onClick, context.onOpenToggle)
      }
    );
    return context.hasCustomAnchor ? trigger : /* @__PURE__ */ jsxRuntimeExports.jsx(Anchor, { asChild: true, ...popperScope, children: trigger });
  }
);
PopoverTrigger$1.displayName = TRIGGER_NAME;
var PORTAL_NAME = "PopoverPortal";
var [PortalProvider, usePortalContext] = createPopoverContext(PORTAL_NAME, {
  forceMount: void 0
});
var PopoverPortal = (props) => {
  const { __scopePopover, forceMount, children, container } = props;
  const context = usePopoverContext(PORTAL_NAME, __scopePopover);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PortalProvider, { scope: __scopePopover, forceMount, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Portal$1, { asChild: true, container, children }) }) });
};
PopoverPortal.displayName = PORTAL_NAME;
var CONTENT_NAME = "PopoverContent";
var PopoverContent$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const portalContext = usePortalContext(CONTENT_NAME, props.__scopePopover);
    const { forceMount = portalContext.forceMount, ...contentProps } = props;
    const context = usePopoverContext(CONTENT_NAME, props.__scopePopover);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Presence, { present: forceMount || context.open, children: context.modal ? /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContentModal, { ...contentProps, ref: forwardedRef }) : /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverContentNonModal, { ...contentProps, ref: forwardedRef }) });
  }
);
PopoverContent$1.displayName = CONTENT_NAME;
var Slot = createSlot("PopoverContent.RemoveScroll");
var PopoverContentModal = reactExports.forwardRef(
  (props, forwardedRef) => {
    const context = usePopoverContext(CONTENT_NAME, props.__scopePopover);
    const contentRef = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, contentRef);
    const isRightClickOutsideRef = reactExports.useRef(false);
    reactExports.useEffect(() => {
      const content = contentRef.current;
      if (content) return hideOthers(content);
    }, []);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ReactRemoveScroll, { as: Slot, allowPinchZoom: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      PopoverContentImpl,
      {
        ...props,
        ref: composedRefs,
        trapFocus: context.open,
        disableOutsidePointerEvents: true,
        onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
          var _a;
          event.preventDefault();
          if (!isRightClickOutsideRef.current) (_a = context.triggerRef.current) == null ? void 0 : _a.focus();
        }),
        onPointerDownOutside: composeEventHandlers(
          props.onPointerDownOutside,
          (event) => {
            const originalEvent = event.detail.originalEvent;
            const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
            const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
            isRightClickOutsideRef.current = isRightClick;
          },
          { checkForDefaultPrevented: false }
        ),
        onFocusOutside: composeEventHandlers(
          props.onFocusOutside,
          (event) => event.preventDefault(),
          { checkForDefaultPrevented: false }
        )
      }
    ) });
  }
);
var PopoverContentNonModal = reactExports.forwardRef(
  (props, forwardedRef) => {
    const context = usePopoverContext(CONTENT_NAME, props.__scopePopover);
    const hasInteractedOutsideRef = reactExports.useRef(false);
    const hasPointerDownOutsideRef = reactExports.useRef(false);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      PopoverContentImpl,
      {
        ...props,
        ref: forwardedRef,
        trapFocus: false,
        disableOutsidePointerEvents: false,
        onCloseAutoFocus: (event) => {
          var _a, _b;
          (_a = props.onCloseAutoFocus) == null ? void 0 : _a.call(props, event);
          if (!event.defaultPrevented) {
            if (!hasInteractedOutsideRef.current) (_b = context.triggerRef.current) == null ? void 0 : _b.focus();
            event.preventDefault();
          }
          hasInteractedOutsideRef.current = false;
          hasPointerDownOutsideRef.current = false;
        },
        onInteractOutside: (event) => {
          var _a, _b;
          (_a = props.onInteractOutside) == null ? void 0 : _a.call(props, event);
          if (!event.defaultPrevented) {
            hasInteractedOutsideRef.current = true;
            if (event.detail.originalEvent.type === "pointerdown") {
              hasPointerDownOutsideRef.current = true;
            }
          }
          const target = event.target;
          const targetIsTrigger = (_b = context.triggerRef.current) == null ? void 0 : _b.contains(target);
          if (targetIsTrigger) event.preventDefault();
          if (event.detail.originalEvent.type === "focusin" && hasPointerDownOutsideRef.current) {
            event.preventDefault();
          }
        }
      }
    );
  }
);
var PopoverContentImpl = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopePopover,
      trapFocus,
      onOpenAutoFocus,
      onCloseAutoFocus,
      disableOutsidePointerEvents,
      onEscapeKeyDown,
      onPointerDownOutside,
      onFocusOutside,
      onInteractOutside,
      ...contentProps
    } = props;
    const context = usePopoverContext(CONTENT_NAME, __scopePopover);
    const popperScope = usePopperScope(__scopePopover);
    useFocusGuards();
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      FocusScope,
      {
        asChild: true,
        loop: true,
        trapped: trapFocus,
        onMountAutoFocus: onOpenAutoFocus,
        onUnmountAutoFocus: onCloseAutoFocus,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          DismissableLayer,
          {
            asChild: true,
            disableOutsidePointerEvents,
            onInteractOutside,
            onEscapeKeyDown,
            onPointerDownOutside,
            onFocusOutside,
            onDismiss: () => context.onOpenChange(false),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Content,
              {
                "data-state": getState(context.open),
                role: "dialog",
                id: context.contentId,
                ...popperScope,
                ...contentProps,
                ref: forwardedRef,
                style: {
                  ...contentProps.style,
                  // re-namespace exposed content custom properties
                  ...{
                    "--radix-popover-content-transform-origin": "var(--radix-popper-transform-origin)",
                    "--radix-popover-content-available-width": "var(--radix-popper-available-width)",
                    "--radix-popover-content-available-height": "var(--radix-popper-available-height)",
                    "--radix-popover-trigger-width": "var(--radix-popper-anchor-width)",
                    "--radix-popover-trigger-height": "var(--radix-popper-anchor-height)"
                  }
                }
              }
            )
          }
        )
      }
    );
  }
);
var CLOSE_NAME = "PopoverClose";
var PopoverClose = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopePopover, ...closeProps } = props;
    const context = usePopoverContext(CLOSE_NAME, __scopePopover);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.button,
      {
        type: "button",
        ...closeProps,
        ref: forwardedRef,
        onClick: composeEventHandlers(props.onClick, () => context.onOpenChange(false))
      }
    );
  }
);
PopoverClose.displayName = CLOSE_NAME;
var ARROW_NAME = "PopoverArrow";
var PopoverArrow = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopePopover, ...arrowProps } = props;
    const popperScope = usePopperScope(__scopePopover);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Arrow, { ...popperScope, ...arrowProps, ref: forwardedRef });
  }
);
PopoverArrow.displayName = ARROW_NAME;
function getState(open) {
  return open ? "open" : "closed";
}
var Root2 = Popover$1;
var Trigger = PopoverTrigger$1;
var Portal = PopoverPortal;
var Content2 = PopoverContent$1;
function Popover({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Root2, { "data-slot": "popover", ...props });
}
function PopoverTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Trigger, { "data-slot": "popover-trigger", ...props });
}
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    Content2,
    {
      "data-slot": "popover-content",
      align,
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
        className
      ),
      ...props
    }
  ) });
}
function LaborServiceLink({
  item,
  ocid,
  disabled = false,
  onChange
}) {
  const [open, setOpen] = reactExports.useState(false);
  const serviceQuery = useService(item.serviceId ?? null);
  const service = serviceQuery.data ?? null;
  if (item.serviceId === void 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: setOpen, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          disabled,
          "data-ocid": `${ocid}.link_button`,
          className: "-ml-2 h-6 gap-1 px-2 text-xs text-muted-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "size-3", "aria-hidden": "true" }),
            "Vincular servicio"
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        PopoverContent,
        {
          align: "start",
          "data-ocid": `${ocid}.popover`,
          className: "w-80 space-y-3",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Elige un servicio del catálogo para vincular esta línea. La descripción y el precio no cambian." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ServicePicker,
              {
                id: `${ocid}-picker`,
                ocid: `${ocid}.picker`,
                value: null,
                disabled,
                onChange: (next) => {
                  if (next) {
                    onChange(next);
                    setOpen(false);
                  }
                }
              }
            )
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        disabled,
        "data-ocid": `${ocid}.badge`,
        className: "data-rail inline-flex max-w-full items-center gap-1.5 rounded border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "size-3 shrink-0", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: service ? `${service.code} · ${service.name}` : "Servicio vinculado" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      PopoverContent,
      {
        align: "start",
        "data-ocid": `${ocid}.popover`,
        className: "w-80 space-y-3",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Servicio vinculado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: service ? service.name : "Servicio del catálogo" }),
            service ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-xs text-muted-foreground", children: [
              service.code,
              " · ",
              service.category
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border-t border-border pt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Cambia el servicio vinculado o quítalo para dejar la línea como texto libre. La descripción y el precio se conservan." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ServicePicker,
              {
                id: `${ocid}-picker`,
                ocid: `${ocid}.picker`,
                value: null,
                disabled,
                onChange: (next) => {
                  if (next) {
                    onChange(next);
                    setOpen(false);
                  }
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                disabled,
                onClick: () => {
                  onChange(null);
                  setOpen(false);
                },
                "data-ocid": `${ocid}.clear_button`,
                className: "w-full gap-1.5 text-muted-foreground hover:text-destructive",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "size-3.5", "aria-hidden": "true" }),
                  "Quitar vínculo"
                ]
              }
            )
          ] })
        ]
      }
    )
  ] });
}
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
function uploadErrorMessage(error) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "No se pudo cargar la foto. Inténtalo de nuevo.";
}
function useOrderPhotoUpload() {
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [progress, setProgress] = reactExports.useState(0);
  const [error, setError] = reactExports.useState(null);
  const clearError = reactExports.useCallback(() => setError(null), []);
  const upload = reactExports.useCallback(async (file) => {
    if (!file.type.startsWith("image/")) {
      const message = "Selecciona un archivo de imagen (JPG, PNG o WEBP).";
      setError(message);
      throw new Error(message);
    }
    if (file.size > MAX_PHOTO_BYTES) {
      const message = "La foto supera el límite de 10 MB.";
      setError(message);
      throw new Error(message);
    }
    setError(null);
    setIsUploading(true);
    setProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name
      ).withUploadProgress((percentage) => setProgress(percentage));
      return {
        blob,
        filename: file.name,
        mimeType: file.type
      };
    } catch (uploadError) {
      const message = uploadErrorMessage(uploadError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsUploading(false);
    }
  }, []);
  return { upload, isUploading, progress, error, clearError };
}
function OrderPhotosSection({
  orderId,
  photos
}) {
  const cameraInputRef = reactExports.useRef(null);
  const fileInputRef = reactExports.useRef(null);
  const [actionError, setActionError] = reactExports.useState(null);
  const { upload, isUploading, progress, error, clearError } = useOrderPhotoUpload();
  const addPhoto = useAddOrderPhoto();
  const removePhoto = useRemoveOrderPhoto();
  const count = photos.length;
  const remaining = Math.max(0, ORDER_PHOTO_LIMIT - count);
  const isFull = count >= ORDER_PHOTO_LIMIT;
  const isBusy = isUploading || addPhoto.isPending || removePhoto.isPending;
  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    setActionError(null);
    clearError();
    const available = ORDER_PHOTO_LIMIT - count;
    const selected = Array.from(files).slice(0, Math.max(0, available));
    for (const file of selected) {
      try {
        const photo = await upload(file);
        await addPhoto.mutateAsync({ id: orderId, photo });
      } catch (uploadError) {
        setActionError(errorMessage(uploadError));
        break;
      }
    }
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  function handleRemove(photoId) {
    setActionError(null);
    removePhoto.mutate(
      { id: orderId, photoId },
      { onError: (removeError) => setActionError(errorMessage(removeError)) }
    );
  }
  const visibleError = actionError ?? error;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": "order_detail.photos.panel",
      className: "gap-0 rounded-lg py-0 shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between border-b border-border px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "size-4 text-primary", "aria-hidden": "true" }),
            "Evidencia fotográfica"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              "data-ocid": "order_detail.photos.counter",
              className: "data-rail text-xs text-muted-foreground",
              children: [
                count,
                " de ",
                ORDER_PHOTO_LIMIT,
                " fotos"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 px-5 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Adjunta hasta ",
            ORDER_PHOTO_LIMIT,
            " fotos del proceso: ingreso, avance y entrega de la moto."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "order_detail.photos.grid", className: "photo-grid", children: [
            photos.map((photo, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "figure",
              {
                "data-ocid": `order_detail.photos.item.${index + 1}`,
                className: "photo-tile",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: photo.blob.getDirectURL(),
                      alt: `Evidencia ${index + 1}: ${photo.filename}`,
                      loading: "lazy"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "photo-tile-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleRemove(photo.id),
                      disabled: removePhoto.isPending,
                      "aria-label": `Eliminar la foto ${photo.filename}`,
                      "data-ocid": `order_detail.photos.remove_button.${index + 1}`,
                      "data-variant": "destructive",
                      className: "photo-tile-action",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-3.5", "aria-hidden": "true" })
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("figcaption", { className: "photo-tile-caption", children: formatDateTime(photo.uploadedAt) })
                ]
              },
              photo.id.toString()
            )),
            !isFull ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  var _a;
                  return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                },
                disabled: isBusy,
                "data-ocid": "order_detail.photos.upload_button",
                className: "photo-add-tile",
                children: isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    LoaderCircle,
                    {
                      className: "size-5 animate-spin text-primary",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-xs", children: [
                    "Subiendo… ",
                    Math.round(progress),
                    "%"
                  ] })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "size-5", "aria-hidden": "true" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium", children: "Agregar foto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-[10px]", children: [
                    remaining,
                    " ",
                    remaining === 1 ? "espacio" : "espacios"
                  ] })
                ] })
              }
            ) : null
          ] }),
          isUploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              "data-ocid": "order_detail.photos.progress",
              className: "photo-progress relative h-1 overflow-hidden rounded-full",
              role: "progressbar",
              tabIndex: -1,
              "aria-valuenow": Math.round(progress),
              "aria-valuemin": 0,
              "aria-valuemax": 100,
              "aria-label": "Progreso de carga de la foto",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "photo-progress-bar",
                  style: { width: `${Math.round(progress)}%` }
                }
              )
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => {
                  var _a;
                  return (_a = cameraInputRef.current) == null ? void 0 : _a.click();
                },
                disabled: isFull || isBusy,
                "data-ocid": "order_detail.photos.camera_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "size-4", "aria-hidden": "true" }),
                  "Tomar foto"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => {
                  var _a;
                  return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                },
                disabled: isFull || isBusy,
                "data-ocid": "order_detail.photos.file_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "size-4", "aria-hidden": "true" }),
                  "Elegir archivo"
                ]
              }
            ),
            isFull ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "order_detail.photos.limit_state",
                className: "text-xs text-muted-foreground",
                children: "Límite alcanzado: elimina una foto para cargar otra."
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: cameraInputRef,
              type: "file",
              accept: "image/*",
              capture: "environment",
              className: "sr-only",
              tabIndex: -1,
              "aria-hidden": "true",
              onChange: (event) => void handleFiles(event.target.files)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: fileInputRef,
              type: "file",
              accept: "image/*",
              multiple: true,
              className: "sr-only",
              tabIndex: -1,
              "aria-hidden": "true",
              onChange: (event) => void handleFiles(event.target.files)
            }
          ),
          visibleError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              "data-ocid": "order_detail.photos.error_state",
              className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: visibleError })
            }
          ) : null
        ] })
      ]
    }
  );
}
function OrderStatusStepper({ status }) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "ol",
    {
      "data-ocid": "order_detail.status_stepper",
      className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0",
      children: ORDER_STATUS_FLOW.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "li",
          {
            "data-ocid": `order_detail.status_step.${index + 1}`,
            "aria-current": isCurrent ? "step" : void 0,
            className: "flex flex-1 items-center gap-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-smooth",
                      isComplete && "border-primary bg-primary text-primary-foreground",
                      isCurrent && "border-primary bg-primary/15 text-primary ring-2 ring-primary/30",
                      !isComplete && !isCurrent && "border-border bg-muted/40 text-muted-foreground"
                    ),
                    children: isComplete ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3.5", "aria-hidden": "true" }) : index + 1
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: cn(
                      "whitespace-nowrap text-xs font-medium",
                      isCurrent ? "text-foreground" : isComplete ? "text-muted-foreground" : "text-muted-foreground/70"
                    ),
                    children: ORDER_STATUS_LABELS[step]
                  }
                )
              ] }),
              index < ORDER_STATUS_FLOW.length - 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  "aria-hidden": "true",
                  className: cn(
                    "mx-3 hidden h-px flex-1 sm:block",
                    index < currentIndex ? "bg-primary" : "bg-border"
                  )
                }
              ) : null
            ]
          },
          step
        );
      })
    }
  );
}
function ScanPartDialog({
  orderId,
  open,
  onOpenChange
}) {
  const [part, setPart] = reactExports.useState(null);
  const [lotId, setLotId] = reactExports.useState(null);
  const [quantity, setQuantity] = reactExports.useState("1");
  const [manualCode, setManualCode] = reactExports.useState("");
  const [formError, setFormError] = reactExports.useState(null);
  const [notFoundCode, setNotFoundCode] = reactExports.useState(null);
  const findPartByCode = useFindPartByCode();
  const lotsQuery = useLots((part == null ? void 0 : part.id) ?? null);
  const addPart = useAddOrderPart();
  const lots = (lotsQuery.data ?? []).filter((lot) => lot.quantity > 0n);
  const selectedLot = lots.find((lot) => lot.id === lotId) ?? null;
  const quantityValue = Number(quantity);
  const quantityValid = quantity.trim() !== "" && Number.isInteger(quantityValue) && quantityValue > 0;
  const availableStock = selectedLot ? selectedLot.quantity : (part == null ? void 0 : part.totalStock) ?? 0n;
  const stockSufficient = quantityValid && availableStock >= BigInt(quantityValue);
  function reset() {
    setPart(null);
    setLotId(null);
    setQuantity("1");
    setManualCode("");
    setFormError(null);
    setNotFoundCode(null);
  }
  function handleOpenChange(next) {
    if (!next) reset();
    onOpenChange(next);
  }
  async function handleDetected(scanned) {
    setNotFoundCode(null);
    setFormError(null);
    setLotId(null);
    setQuantity("1");
    setPart(scanned);
  }
  async function handleManualCode(event) {
    event.preventDefault();
    const code = manualCode.trim();
    if (code === "") return;
    setManualCode("");
    setFormError(null);
    try {
      const found = await findPartByCode.mutateAsync(code);
      if (!found) {
        setPart(null);
        setNotFoundCode(code);
        return;
      }
      await handleDetected(found);
    } catch {
      setFormError("No se pudo consultar el código. Inténtalo de nuevo.");
    }
  }
  function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (!part) {
      setFormError("Escanea o ingresa el código del repuesto.");
      return;
    }
    if (!quantityValid) {
      setFormError("Captura una cantidad válida (entero mayor a cero).");
      return;
    }
    if (!stockSufficient) {
      setFormError(
        `Stock insuficiente: disponible ${formatNumber(availableStock)}, solicitado ${formatNumber(quantityValue)}.`
      );
      return;
    }
    addPart.mutate(
      {
        id: orderId,
        part: {
          partId: part.id,
          lotId: lotId ?? void 0,
          quantity: BigInt(quantityValue)
        }
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => setFormError(errorMessage(error))
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "order_detail.scan_part.modal",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 font-display", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-4 text-primary", "aria-hidden": "true" }),
            "Escanear repuesto"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Lee el código de barras del repuesto o ingrésalo manualmente para agregarlo a la orden." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          BarcodeScanner,
          {
            ocid: "order_detail.scan_part.scanner",
            title: "Lector de códigos",
            hint: "Apunta la cámara al código del repuesto o ingrésalo manualmente.",
            onDetected: (scanned) => void handleDetected(scanned),
            onNotFound: (code) => {
              setPart(null);
              setNotFoundCode(code);
            }
          }
        ),
        notFoundCode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "p",
          {
            "data-ocid": "order_detail.scan_part.not_found_state",
            className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "mt-0.5 size-4 shrink-0",
                  "aria-hidden": "true"
                }
              ),
              "Producto no encontrado para el código",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: notFoundCode }),
              "."
            ]
          }
        ) : null,
        part ? /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, noValidate: true, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: part.sku }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: part.name })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-xs text-muted-foreground", children: [
              "Precio unitario ",
              formatMoney(part.salePrice),
              " · Existencia",
              " ",
              formatNumber(part.totalStock),
              " ",
              part.unit
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "scan-part-lot", children: "Lote / serie (opcional)" }),
            lotsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }) : lots.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sin lotes registrados para este repuesto." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: (lotId == null ? void 0 : lotId.toString()) ?? "auto",
                onValueChange: (value) => {
                  setLotId(value === "auto" ? null : BigInt(value));
                  setFormError(null);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "scan-part-lot",
                      "data-ocid": "order_detail.scan_part.lot_select",
                      className: "w-full",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Descuento automático" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "auto", children: "Sin lote específico" }),
                    lots.map((lot) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectItem,
                      {
                        value: lot.id.toString(),
                        children: `${lot.lotNumber} · ${formatNumber(lot.quantity)} disp.`
                      },
                      lot.id.toString()
                    ))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "scan-part-quantity", children: "Cantidad" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "scan-part-quantity",
                type: "number",
                inputMode: "numeric",
                min: 1,
                step: 1,
                value: quantity,
                onChange: (event) => {
                  setQuantity(event.target.value);
                  setFormError(null);
                },
                "data-ocid": "order_detail.scan_part.quantity_input",
                className: "data-rail"
              }
            ),
            quantityValid ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                className: stockSufficient ? "data-rail text-xs text-muted-foreground" : "data-rail text-xs text-warning",
                children: [
                  "Referencia: ",
                  formatNumber(quantityValue),
                  " · existencia",
                  " ",
                  formatNumber(availableStock)
                ]
              }
            ) : null
          ] }),
          formError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "order_detail.scan_part.error_state",
              className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  TriangleAlert,
                  {
                    className: "mt-0.5 size-4 shrink-0 text-destructive",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: formError })
              ]
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => handleOpenChange(false),
                "data-ocid": "order_detail.scan_part.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: addPart.isPending,
                "data-ocid": "order_detail.scan_part.submit_button",
                children: addPart.isPending ? "Agregando…" : "Agregar repuesto"
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "scan-part-manual", children: "Código manual" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "form",
            {
              onSubmit: (event) => void handleManualCode(event),
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "scan-part-manual",
                    "data-ocid": "order_detail.scan_part.manual_input",
                    value: manualCode,
                    onChange: (event) => {
                      setManualCode(event.target.value);
                      setFormError(null);
                    },
                    placeholder: "Escribe o pega el código",
                    autoComplete: "off",
                    className: "data-rail"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "submit",
                    size: "sm",
                    disabled: manualCode.trim() === "",
                    "data-ocid": "order_detail.scan_part.manual_submit_button",
                    children: "Buscar"
                  }
                )
              ]
            }
          )
        ] })
      ]
    }
  ) });
}
const WARRANTY_FORMATS = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" }
];
function useOrderContext(customerId, motorcycleId) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      "order-context",
      (customerId == null ? void 0 : customerId.toString()) ?? "none",
      (motorcycleId == null ? void 0 : motorcycleId.toString()) ?? "none"
    ],
    queryFn: async () => {
      var _a, _b;
      if (!actor || customerId === null) {
        return {
          customerName: null,
          customerDocument: null,
          customerEmail: null,
          motorcycle: null
        };
      }
      const [customer, motos] = await Promise.all([
        actor.getCustomer(token, customerId),
        actor.listMotorcycles(token, customerId)
      ]);
      const motorcycle = motos.find((moto) => moto.id === motorcycleId) ?? null;
      const email = ((_a = customer == null ? void 0 : customer.email) == null ? void 0 : _a.trim()) ?? "";
      const document = ((_b = customer == null ? void 0 : customer.document) == null ? void 0 : _b.trim()) ?? "";
      return {
        customerName: (customer == null ? void 0 : customer.name) ?? null,
        customerDocument: document === "" ? null : document,
        customerEmail: email === "" ? null : email,
        motorcycle
      };
    },
    enabled: !!actor && !isFetching && customerId !== null
  });
}
function useAssignTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.assignTechnician(token, input.id, input.technicianId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"]
      });
    }
  });
}
function useUnassignTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.unassignTechnician(token, input.id, input.technicianId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
      void queryClient.invalidateQueries({
        queryKey: ["technician-workloads"]
      });
    }
  });
}
function useUpdateLaborTechnician() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateLaborTechnician(
        token,
        input.id,
        input.laborId,
        input.technicianId
      );
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useReplaceLaborService() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      var _a;
      if (!actor) throw new Error("Backend no disponible");
      await actor.removeLabor(token, input.id, input.item.id);
      return actor.addLabor(token, input.id, {
        description: input.item.description,
        price: input.item.price,
        technicianId: input.item.technicianId,
        serviceId: (_a = input.service) == null ? void 0 : _a.id
      });
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
async function buildOrderPdf(format, number, company, meta, lines, totals, footer, hope) {
  var _a, _b, _c;
  const { jsPDF, autoTable } = await loadPdfLibs();
  const narrow = format === "receipt80";
  const margin = narrow ? 3 : 14;
  const right = narrow ? 77 : 196;
  const doc = new jsPDF({
    unit: "mm",
    format: narrow ? [80, 297] : "a4"
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 10 : 15);
  doc.setTextColor(30, 41, 59);
  doc.text(company.name, margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 8.5);
  doc.setTextColor(100, 116, 139);
  const contact = [company.taxId, company.address, company.phone].filter((value) => !!value && value.trim() !== "").join(narrow ? " · " : "  ·  ");
  let cursor = 18.5;
  if (contact !== "") {
    const contactLines = doc.splitTextToSize(contact, right - margin);
    doc.text(contactLines, margin, cursor);
    cursor += contactLines.length * (narrow ? 3 : 4);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 8.5 : 11);
  doc.setTextColor(30, 41, 59);
  doc.text("ORDEN DE TALLER", right, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 9);
  doc.setTextColor(100, 116, 139);
  doc.text(number, right, 18.5, { align: "right" });
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor + 1, right, cursor + 1);
  cursor += 5;
  if (narrow) {
    for (const entry of meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(entry.label, margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const value = doc.splitTextToSize(entry.value, right - margin);
      doc.text(value, margin, cursor + 3);
      cursor += 3 + value.length * 3 + 1.5;
    }
  } else {
    autoTable(doc, {
      startY: cursor,
      body: meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 40, textColor: [100, 116, 139] },
        1: { fontStyle: "bold", textColor: [30, 41, 59] }
      },
      margin: { left: margin, right: margin }
    });
    cursor = (((_a = doc.lastAutoTable) == null ? void 0 : _a.finalY) ?? cursor) + 4;
  }
  autoTable(doc, {
    startY: cursor,
    head: [["Concepto", "Cant.", "P. unit.", "Importe"]],
    body: lines.map((line) => [
      line.description,
      formatNumber(line.quantity),
      formatMoney(BigInt(Math.round(line.unitPrice * 100))),
      formatMoney(BigInt(Math.round(line.amount * 100)))
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 6.5 : 8.5,
      cellPadding: narrow ? 1.2 : 2,
      overflow: "linebreak"
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" }
    },
    margin: { left: margin, right: margin }
  });
  const afterLines = ((_b = doc.lastAutoTable) == null ? void 0 : _b.finalY) ?? cursor;
  autoTable(doc, {
    startY: afterLines + 4,
    body: totals.map((entry) => [entry.label, entry.value]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 7 : 9,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] }
    },
    margin: { left: narrow ? margin : right - 90, right: margin }
  });
  const afterTotals = ((_c = doc.lastAutoTable) == null ? void 0 : _c.finalY) ?? afterLines + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  const footerY = afterTotals + (narrow ? 6 : 10);
  const footerLines = doc.splitTextToSize(footer, right - margin);
  doc.text(footerLines, margin, footerY);
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: footerY + footerLines.length * (narrow ? 2.6 : 3.4) + 1.5,
    narrow
  });
  return doc;
}
function WarrantyWhatsAppDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  orderId,
  warranty,
  company,
  hope,
  termsText
}) {
  const [message, setMessage] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState(null);
  const [hasPhone, setHasPhone] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [format, setFormat] = reactExports.useState("a4");
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const prepare = usePrepareWhatsAppMessage();
  const { mutate: prepareMessage } = prepare;
  reactExports.useEffect(() => {
    if (!open) return;
    setError(null);
    setHasPhone(null);
    setPhone(null);
    setMessage("");
    prepareMessage(
      {
        contactKind: WhatsAppContactKind.customer,
        contactId: customerId,
        context: WhatsAppContext.order,
        referenceId: orderId
      },
      {
        onSuccess: (result) => {
          setHasPhone(result.hasPhone);
          setPhone(result.phone ?? null);
          setMessage(result.message);
        },
        onError: () => {
          setHasPhone(false);
          setError(
            "No se pudo preparar el mensaje de WhatsApp. Inténtalo de nuevo."
          );
        }
      }
    );
  }, [open, customerId, orderId, prepareMessage]);
  async function handleSend() {
    const trimmed = message.trim();
    if (trimmed === "") {
      setError("El mensaje no puede estar vacío.");
      return;
    }
    if (!phone) {
      setError("El contacto no tiene un teléfono registrado.");
      return;
    }
    setIsGenerating(true);
    try {
      await downloadWarrantyPdf(warranty, company, format, hope, termsText);
    } catch {
      setError("No se pudo generar el PDF de la garantía. Inténtalo de nuevo.");
      setIsGenerating(false);
      return;
    }
    setIsGenerating(false);
    window.open(
      buildWhatsAppUrl(phone, trimmed),
      "_blank",
      "noopener,noreferrer"
    );
    onOpenChange(false);
  }
  const isPreparing = prepare.isPending || hasPhone === null;
  const canSend = hasPhone === true && message.trim() !== "" && !isGenerating;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "order_detail.warranty_whatsapp_dialog",
      className: "sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Enviar garantía por WhatsApp" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
            "Revisa y edita el mensaje antes de abrir WhatsApp con ",
            customerName,
            ". El PDF de la garantía se descargará en el formato elegido para que lo adjuntes en la conversación."
          ] })
        ] }),
        isPreparing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "order_detail.warranty_whatsapp.loading_state",
            className: "flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }),
              "Preparando el mensaje…"
            ]
          }
        ) : hasPhone === false ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "order_detail.warranty_whatsapp.no_phone_state",
            className: "flex items-start gap-2.5 rounded-md border border-status-overdue/40 bg-status-overdue/10 px-3 py-2.5 text-xs text-status-overdue",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "mt-0.5 size-4 shrink-0",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                customerName,
                " no tiene un teléfono registrado. Registra el teléfono del cliente antes de enviar la garantía por WhatsApp."
              ] })
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "warranty-whatsapp-phone", children: "Teléfono" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                id: "warranty-whatsapp-phone",
                "data-ocid": "order_detail.warranty_whatsapp.phone_value",
                className: "data-rail rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground",
                children: phone ?? "—"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Documento adjunto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "order_detail.warranty_whatsapp.attachment_panel",
                className: "rounded-md border border-border bg-muted/30 px-3 py-2.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-xs text-foreground", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      FileText,
                      {
                        className: "size-4 shrink-0 text-primary",
                        "aria-hidden": "true"
                      }
                    ),
                    "Términos y Condiciones de Garantía · ",
                    warranty.orderNumber
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "fieldset",
                    {
                      "aria-label": "Formato del documento adjunto",
                      "data-ocid": "order_detail.warranty_whatsapp.format_toggle",
                      className: "doc-format-toggle mt-2",
                      children: WARRANTY_FORMATS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          "data-active": format === option.value,
                          "aria-pressed": format === option.value,
                          onClick: () => setFormat(option.value),
                          "data-ocid": `order_detail.warranty_whatsapp.format_${option.value}`,
                          children: option.label
                        },
                        option.value
                      ))
                    }
                  )
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "warranty-whatsapp-message", children: "Mensaje" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "warranty-whatsapp-message",
                value: message,
                onChange: (event) => setMessage(event.target.value),
                rows: 7,
                "data-ocid": "order_detail.warranty_whatsapp.message_textarea"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Puedes editar el texto. Se abrirá WhatsApp con este mensaje prellenado." })
          ] })
        ] }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            "data-ocid": "order_detail.warranty_whatsapp.error_state",
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
              "data-ocid": "order_detail.warranty_whatsapp.cancel_button",
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              onClick: handleSend,
              disabled: !canSend,
              "data-ocid": "order_detail.warranty_whatsapp.send_button",
              className: "gap-2",
              children: [
                isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "size-4", "aria-hidden": "true" }),
                isGenerating ? "Generando PDF…" : "Abrir WhatsApp"
              ]
            }
          )
        ] })
      ]
    }
  ) });
}
function DetailSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "order_detail.loading_state", className: "space-y-4", "aria-busy": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-20 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-48 w-full" })
  ] });
}
function OrderDetailPage() {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const { id } = useParams({ from: "/ordenes/$id" });
  const navigate = useNavigate();
  const orderId = BigInt(id);
  const [isAddPartOpen, setIsAddPartOpen] = reactExports.useState(false);
  const [isScanPartOpen, setIsScanPartOpen] = reactExports.useState(false);
  const [isAddLaborOpen, setIsAddLaborOpen] = reactExports.useState(false);
  const [isCancelOpen, setIsCancelOpen] = reactExports.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = reactExports.useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = reactExports.useState(false);
  const [isPrintOpen, setIsPrintOpen] = reactExports.useState(false);
  const [isWarrantyOpen, setIsWarrantyOpen] = reactExports.useState(false);
  const [isWarrantyWhatsAppOpen, setIsWarrantyWhatsAppOpen] = reactExports.useState(false);
  const [actionError, setActionError] = reactExports.useState(null);
  const [printFormat, setPrintFormat] = reactExports.useState("a4");
  const [warrantyFormat, setWarrantyFormat] = reactExports.useState("a4");
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [isWarrantyDownloading, setIsWarrantyDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const [warrantyDownloadError, setWarrantyDownloadError] = reactExports.useState(null);
  const orderQuery = useOrder(orderId);
  const view = orderQuery.data ?? null;
  const order = (view == null ? void 0 : view.order) ?? null;
  const { isIvaResponsible } = useIvaSettings();
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const business = businessQuery.data ?? null;
  const companyHeader = companyHeaderFromProfile(companyQuery.data);
  const companyLogoUrl = (companyHeader == null ? void 0 : companyHeader.logoUrl) ?? ((_a = companyQuery.data) == null ? void 0 : _a.logoUrl) ?? void 0;
  const serviceTermsQuery = useServiceTermsSettings();
  const serviceTermsFooter = ((_c = (_b = serviceTermsQuery.data) == null ? void 0 : _b.text) == null ? void 0 : _c.trim()) || SERVICE_TERMS_DEFAULT_TEXT;
  const warrantyTermsQuery = useWarrantyTermsSettings();
  const warrantyTermsText = ((_e = (_d = warrantyTermsQuery.data) == null ? void 0 : _d.text) == null ? void 0 : _e.trim()) || WARRANTY_TERMS_DEFAULT_TEXT;
  const servicesQuery = useServices({
    search: "",
    category: null,
    activeOnly: false,
    sort: ServiceSort.name,
    page: 1,
    pageSize: 200
  });
  const services = ((_f = servicesQuery.data) == null ? void 0 : _f.items) ?? [];
  const serviceNameById = new Map(
    services.map((service) => [service.id.toString(), service.name])
  );
  const serviceNameFor = (serviceId) => serviceNameById.get(serviceId.toString()) ?? null;
  const contextQuery = useOrderContext(
    (order == null ? void 0 : order.customerId) ?? null,
    (order == null ? void 0 : order.motorcycleId) ?? null
  );
  const updateStatus = useUpdateOrderStatus();
  const removePart = useRemoveOrderPart();
  const removeLabor = useRemoveLabor();
  const assignTechnician = useAssignTechnician();
  const unassignTechnician = useUnassignTechnician();
  const updateLaborTechnician = useUpdateLaborTechnician();
  const replaceLaborService = useReplaceLaborService();
  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly: false
  });
  const technicians = techniciansQuery.data ?? [];
  const technicianById = new Map(
    technicians.map((technician) => [technician.id.toString(), technician])
  );
  const assignedIds = (order == null ? void 0 : order.technicianIds) ?? [];
  const assignedTechnicians = technicians.filter(
    (technician) => assignedIds.some((id2) => id2 === technician.id)
  );
  const availableTechnicians = technicians.filter(
    (technician) => !assignedIds.some((id2) => id2 === technician.id)
  );
  const isAssigning = assignTechnician.isPending || unassignTechnician.isPending;
  const upcoming = order ? nextStatus(order.status) : null;
  const isCancelled = (order == null ? void 0 : order.status) === OrderStatus.cancelled;
  function handleAssign(technicianId) {
    if (!order) return;
    setActionError(null);
    assignTechnician.mutate(
      { id: order.id, technicianId },
      { onError: (error) => setActionError(errorMessage(error)) }
    );
  }
  function handleUnassign(technicianId) {
    if (!order) return;
    setActionError(null);
    unassignTechnician.mutate(
      { id: order.id, technicianId },
      { onError: (error) => setActionError(errorMessage(error)) }
    );
  }
  function handleAdvance() {
    if (!order || !upcoming) return;
    setActionError(null);
    updateStatus.mutate(
      { id: order.id, status: upcoming },
      { onError: (error) => setActionError(errorMessage(error)) }
    );
  }
  function handleRemovePart(orderPartId) {
    if (!order) return;
    setActionError(null);
    removePart.mutate(
      { id: order.id, orderPartId },
      { onError: (error) => setActionError(errorMessage(error)) }
    );
  }
  function handleRemoveLabor(laborId) {
    if (!order) return;
    setActionError(null);
    removeLabor.mutate(
      { id: order.id, laborId },
      { onError: (error) => setActionError(errorMessage(error)) }
    );
  }
  function handleLaborTechnician(laborId, technicianId) {
    if (!order) return;
    setActionError(null);
    updateLaborTechnician.mutate(
      { id: order.id, laborId, technicianId },
      { onError: (error) => setActionError(errorMessage(error)) }
    );
  }
  function handleLaborService(item, service) {
    if (!order) return;
    setActionError(null);
    replaceLaborService.mutate(
      { id: order.id, item, service },
      { onError: (error) => setActionError(errorMessage(error)) }
    );
  }
  if (orderQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-full max-w-6xl animate-fade-in", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DetailSkeleton, {}) });
  }
  if (orderQuery.isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "order_detail.error_state",
        className: "mx-auto flex w-full max-w-md flex-col items-center gap-4 py-20 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-6 text-destructive", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "No se pudo cargar la orden" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => void orderQuery.refetch(),
              "data-ocid": "order_detail.retry_button",
              children: "Reintentar"
            }
          )
        ]
      }
    );
  }
  if (!view || !order) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "order_detail.not_found_state",
        className: "mx-auto flex w-full max-w-md flex-col items-center gap-4 py-20 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "size-6 text-muted-foreground", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "Orden no encontrada" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "La orden solicitada no existe o fue eliminada." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", "data-ocid": "order_detail.back_button", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/ordenes", children: "Volver a órdenes" }) })
        ]
      }
    );
  }
  const { totals } = view;
  const motorcycle = ((_g = contextQuery.data) == null ? void 0 : _g.motorcycle) ?? null;
  const customerName = ((_h = contextQuery.data) == null ? void 0 : _h.customerName) ?? null;
  const customerEmail = ((_i = contextQuery.data) == null ? void 0 : _i.customerEmail) ?? null;
  const documentLines = [
    ...order.parts.map((part) => ({
      description: part.description,
      quantity: Number(part.quantity),
      unitPrice: Number(part.unitPrice) / 100,
      amount: Number(part.quantity) * Number(part.unitPrice) / 100
    })),
    ...order.labor.map((item) => ({
      description: item.description,
      quantity: 1,
      unitPrice: Number(item.price) / 100,
      amount: Number(item.price) / 100
    }))
  ];
  const documentMeta = [
    {
      label: "Cliente",
      value: customerName ?? `Cliente #${order.customerId.toString()}`
    },
    {
      label: "Motocicleta",
      value: motorcycle ? `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}` : `Moto #${order.motorcycleId.toString()}`
    },
    {
      label: "Placa",
      value: (motorcycle == null ? void 0 : motorcycle.plate) ?? "—",
      rail: true
    },
    {
      label: "Kilometraje",
      value: `${formatNumber(order.intakeMileage)} km`,
      rail: true
    },
    {
      label: "Estado",
      value: ORDER_STATUS_LABELS[order.status]
    },
    {
      label: "Ingreso",
      value: formatDateTime(order.createdAt)
    }
  ];
  const documentTotals = [
    { label: "Repuestos", value: formatMoney(totals.partsSubtotal) },
    { label: "Mano de obra", value: formatMoney(totals.laborSubtotal) },
    { label: "Subtotal", value: formatMoney(totals.subtotal) },
    ...isIvaResponsible ? [
      {
        label: `Impuesto (${formatTaxRate(totals.taxRate)})`,
        value: formatMoney(totals.tax)
      }
    ] : [],
    { label: "Total", value: formatMoney(totals.total), emphasis: true }
  ];
  const orderFooter = serviceTermsFooter;
  const orderNumber = order.orderNumber;
  const warrantyApplies = warrantyAppliesToOrder(order.labor, serviceNameFor);
  const responsibleTechnician = order.labor.map(
    (item) => item.technicianId === void 0 ? null : technicianById.get(item.technicianId.toString()) ?? null
  ).find((technician) => technician !== null) ?? assignedTechnicians[0] ?? null;
  const warrantyData = warrantyApplies ? {
    orderNumber,
    customerName: customerName ?? `Cliente #${order.customerId.toString()}`,
    customerDocument: ((_j = contextQuery.data) == null ? void 0 : _j.customerDocument) ?? "",
    motorcycleBrand: (motorcycle == null ? void 0 : motorcycle.brand) ?? "",
    motorcycleModel: (motorcycle == null ? void 0 : motorcycle.model) ?? "",
    motorcycleYear: (motorcycle == null ? void 0 : motorcycle.year) ?? 0n,
    motorcyclePlate: (motorcycle == null ? void 0 : motorcycle.plate) ?? "",
    serviceDate: order.createdAt,
    technicianCode: (responsibleTechnician == null ? void 0 : responsibleTechnician.code) ?? "",
    technicianName: (responsibleTechnician == null ? void 0 : responsibleTechnician.name) ?? ""
  } : null;
  const warrantyCompany = pdfCompanyFromProfile(companyQuery.data);
  async function handleDownloadPdf(nextFormat) {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildOrderPdf(
        nextFormat,
        orderNumber,
        pdfCompanyFromProfile(companyQuery.data),
        documentMeta,
        documentLines,
        documentTotals,
        orderFooter,
        hopeMessage
      );
      await downloadFile({
        filename: `Orden-${orderNumber}.pdf`,
        mimeType: "application/pdf",
        data: doc.output("blob")
      });
    } catch {
      setDownloadError(
        "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo."
      );
    } finally {
      setIsDownloading(false);
    }
  }
  async function handleDownloadWarrantyPdf(nextFormat) {
    if (!warrantyData) return;
    setWarrantyDownloadError(null);
    setIsWarrantyDownloading(true);
    try {
      await downloadWarrantyPdf(
        warrantyData,
        warrantyCompany,
        nextFormat,
        hopeMessage,
        warrantyTermsText
      );
    } catch {
      setWarrantyDownloadError(
        "No se pudo guardar el PDF de la garantía en este dispositivo. Intenta de nuevo."
      );
    } finally {
      setIsWarrantyDownloading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "order_detail.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              asChild: true,
              variant: "ghost",
              size: "sm",
              className: "-ml-2 gap-1.5 text-muted-foreground",
              "data-ocid": "order_detail.back_button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/ordenes", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Volver a órdenes"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: "outline",
                "data-ocid": "order_detail.status_badge",
                className: ORDER_STATUS_BADGE[order.status],
                children: ORDER_STATUS_LABELS[order.status]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setIsPrintOpen(true),
                "data-ocid": "order_detail.print_button",
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
                variant: "outline",
                size: "sm",
                onClick: () => setIsNotifyOpen(true),
                "data-ocid": "order_detail.notify_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "size-4", "aria-hidden": "true" }),
                  "Notificar al cliente"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              WhatsAppNotifyButton,
              {
                contactKind: WhatsAppContactKind.customer,
                contactId: order.customerId,
                context: WhatsAppContext.order,
                referenceId: order.id,
                contactName: customerName ?? `Cliente #${order.customerId.toString()}`,
                variant: "outline",
                size: "sm",
                ocid: "order_detail.whatsapp_button"
              }
            ),
            warrantyApplies ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setIsWarrantyOpen(true),
                "data-ocid": "order_detail.warranty_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "size-4", "aria-hidden": "true" }),
                  "Términos y Condiciones de Garantía"
                ]
              }
            ) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setIsCancelOpen(true),
                disabled: isCancelled,
                "data-ocid": "order_detail.cancel_order_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "size-4", "aria-hidden": "true" }),
                  "Cancelar orden"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: () => setIsDeleteOpen(true),
                "data-ocid": "order_detail.delete_order_button",
                className: "gap-1.5 text-destructive hover:text-destructive",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" }),
                  "Eliminar"
                ]
              }
            )
          ] })
        ] }),
        isCancelled ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "order_detail.cancelled_banner",
            className: "flex items-start gap-3 rounded-md border border-status-cancelled/40 bg-status-cancelled/10 px-4 py-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Ban,
                {
                  className: "mt-0.5 size-4 shrink-0 text-status-cancelled",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-status-cancelled", children: "Orden cancelada" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  order.cancelReason ? `Motivo: ${order.cancelReason}` : "Sin motivo registrado.",
                  order.cancelledAt ? ` · ${formatDateTime(order.cancelledAt)}` : ""
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "La orden ya no es facturable y no participa en los flujos activos del taller." })
              ] })
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 px-5 py-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-start justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Orden de taller" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "h1",
              {
                "data-ocid": "order_detail.order_number",
                className: "data-rail text-2xl font-semibold tracking-tight",
                children: order.orderNumber
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Ingreso ",
              formatDateTime(order.createdAt),
              " · Actualizada",
              " ",
              formatDateTime(order.updatedAt)
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-3", "aria-hidden": "true" }),
                "Cliente"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: customerName ?? `Cliente #${order.customerId.toString()}` })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "size-3", "aria-hidden": "true" }),
                "Motocicleta"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: motorcycle ? `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}` : `Moto #${order.motorcycleId.toString()}` }),
              motorcycle ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: motorcycle.plate }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Kilometraje de ingreso" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-sm font-medium", children: [
                formatNumber(order.intakeMileage),
                " km"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Total de la orden" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-sm font-semibold text-primary", children: formatMoney(totals.total) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 rounded-md border border-border bg-muted/30 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Falla reportada" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap text-sm", children: order.problem })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm font-semibold tracking-tight", children: "Estado de la reparación" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 px-5 py-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(OrderStatusStepper, { status: order.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: upcoming ? `Siguiente paso: ${ORDER_STATUS_LABELS[upcoming]}` : "La orden fue entregada al cliente." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: handleAdvance,
                  disabled: !upcoming || updateStatus.isPending,
                  "data-ocid": "order_detail.advance_status_button",
                  className: "gap-2",
                  children: [
                    updateStatus.isPending ? "Actualizando…" : "Avanzar estado",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "size-4", "aria-hidden": "true" })
                  ]
                }
              )
            ] }),
            actionError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "order_detail.action_error_state",
                className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "mt-0.5 size-4 shrink-0 text-destructive",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: actionError })
                ]
              }
            ) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 lg:grid-cols-[1fr_20rem]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between border-b border-border px-5 py-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "size-4 text-primary", "aria-hidden": "true" }),
                  "Repuestos"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "outline",
                    onClick: () => setIsScanPartOpen(true),
                    "data-ocid": "order_detail.scan_part_button",
                    className: "gap-1.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ScanLine, { className: "size-4", "aria-hidden": "true" }),
                      "Escanear"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "outline",
                    onClick: () => setIsAddPartOpen(true),
                    "data-ocid": "order_detail.add_part_button",
                    className: "gap-1.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                      "Agregar"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-0", children: order.parts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "order_detail.parts.empty_state",
                  className: "flex flex-col items-center gap-2 px-6 py-10 text-center",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Package,
                      {
                        className: "size-5 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Sin repuestos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs text-xs text-muted-foreground", children: "Agrega los repuestos usados en la reparación; el costo unitario de referencia alimenta el margen de la orden." })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "order_detail.parts.table", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-muted/50 hover:bg-muted/50", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-5 font-mono text-[11px] uppercase tracking-[0.14em]", children: "Repuesto" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: "Cant." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: "P. unitario" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: "Importe" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-5 text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: order.parts.map((part, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  TableRow,
                  {
                    "data-ocid": `order_detail.parts.row.${index + 1}`,
                    className: "odd:bg-muted/20",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "max-w-[18rem] pl-5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: part.description }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-xs text-muted-foreground", children: part.lotId ? `Lote #${part.lotId.toString()}` : "Sin lote asignado" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-sm", children: formatNumber(part.quantity) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-sm text-muted-foreground", children: formatMoney(part.unitPrice) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-sm font-semibold", children: formatMoney(part.quantity * part.unitPrice) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-5 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "icon",
                          onClick: () => handleRemovePart(part.id),
                          disabled: removePart.isPending,
                          "aria-label": `Quitar ${part.description}`,
                          "data-ocid": `order_detail.parts.remove_button.${index + 1}`,
                          className: "text-muted-foreground hover:text-destructive",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                        }
                      ) })
                    ]
                  },
                  part.id.toString()
                )) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "flex-row items-center justify-between border-b border-border px-5 py-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "size-4 text-primary", "aria-hidden": "true" }),
                  "Mano de obra y servicios"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    size: "sm",
                    variant: "outline",
                    onClick: () => setIsAddLaborOpen(true),
                    "data-ocid": "order_detail.add_labor_button",
                    className: "gap-1.5",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                      "Agregar"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-0", children: order.labor.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "order_detail.labor.empty_state",
                  className: "flex flex-col items-center gap-2 px-6 py-10 text-center",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Wrench,
                      {
                        className: "size-5 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "Sin mano de obra" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-xs text-xs text-muted-foreground", children: "Registra los servicios realizados con su precio." })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "order_detail.labor.table", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "bg-muted/50 hover:bg-muted/50", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-5 font-mono text-[11px] uppercase tracking-[0.14em]", children: "Servicio" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.14em]", children: "Técnico responsable" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: "Precio" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pr-5 text-right font-mono text-[11px] uppercase tracking-[0.14em]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Acciones" }) })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: order.labor.map((item, index) => {
                  const responsible = item.technicianId === void 0 ? null : technicianById.get(item.technicianId.toString()) ?? null;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    TableRow,
                    {
                      "data-ocid": `order_detail.labor.row.${index + 1}`,
                      className: "odd:bg-muted/20",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "max-w-[18rem] pl-5", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm", children: item.description }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              LaborServiceLink,
                              {
                                item,
                                ocid: `order_detail.labor.service.${index + 1}`,
                                disabled: replaceLaborService.isPending,
                                onChange: (service) => handleLaborService(item, service)
                              }
                            ),
                            responsible ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail truncate text-xs text-muted-foreground", children: [
                              responsible.code,
                              " · ",
                              responsible.name
                            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sin técnico responsable" })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "w-[15rem]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          LaborTechnicianSelect,
                          {
                            id: `order-labor-technician-${item.id.toString()}`,
                            ocid: `order_detail.labor.technician_select.${index + 1}`,
                            value: item.technicianId ?? null,
                            onChange: (technicianId) => handleLaborTechnician(item.id, technicianId),
                            showLabel: false,
                            disabled: updateLaborTechnician.isPending
                          }
                        ) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-sm font-semibold", children: formatMoney(item.price) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-5 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "button",
                            variant: "ghost",
                            size: "icon",
                            onClick: () => handleRemoveLabor(item.id),
                            disabled: removeLabor.isPending,
                            "aria-label": `Quitar ${item.description}`,
                            "data-ocid": `order_detail.labor.remove_button.${index + 1}`,
                            className: "text-muted-foreground hover:text-destructive",
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                          }
                        ) })
                      ]
                    },
                    item.id.toString()
                  );
                }) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(OrderPhotosSection, { orderId: order.id, photos: order.photos })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                "data-ocid": "order_detail.technicians.panel",
                className: "gap-0 rounded-lg py-0 shadow-none",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      UserRoundPlus,
                      {
                        className: "size-4 text-primary",
                        "aria-hidden": "true"
                      }
                    ),
                    "Técnicos asignados"
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4 px-5 py-5", children: [
                    assignedTechnicians.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "p",
                      {
                        "data-ocid": "order_detail.technicians.empty_state",
                        className: "text-xs text-muted-foreground",
                        children: "Sin técnicos asignados. Selecciona uno para asignarlo a esta orden."
                      }
                    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "ul",
                      {
                        "data-ocid": "order_detail.technicians.list",
                        className: "space-y-2",
                        children: assignedTechnicians.map((technician, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "li",
                          {
                            "data-ocid": `order_detail.technicians.item.${index + 1}`,
                            className: "flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2",
                            children: [
                              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground", children: technician.code }),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: technician.name })
                                ] }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-muted-foreground", children: technician.specialty })
                              ] }),
                              /* @__PURE__ */ jsxRuntimeExports.jsx(
                                Button,
                                {
                                  type: "button",
                                  variant: "ghost",
                                  size: "icon",
                                  onClick: () => handleUnassign(technician.id),
                                  disabled: isAssigning,
                                  "aria-label": `Quitar a ${technician.name}`,
                                  "data-ocid": `order_detail.technicians.remove_button.${index + 1}`,
                                  className: "text-muted-foreground hover:text-destructive",
                                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" })
                                }
                              )
                            ]
                          },
                          technician.id.toString()
                        ))
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 border-t border-border pt-4", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "label",
                        {
                          htmlFor: "order-detail-technician-picker",
                          className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
                          children: "Asignar técnico"
                        }
                      ),
                      techniciansQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }) : availableTechnicians.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No hay más técnicos activos disponibles." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "select",
                        {
                          id: "order-detail-technician-picker",
                          "data-ocid": "order_detail.technicians.select",
                          value: "",
                          disabled: isAssigning,
                          onChange: (event) => {
                            const value = event.target.value;
                            if (value.length > 0) handleAssign(BigInt(value));
                          },
                          className: "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Selecciona un técnico…" }),
                            availableTechnicians.map((technician) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "option",
                              {
                                value: technician.id.toString(),
                                children: [
                                  technician.code,
                                  " · ",
                                  technician.name,
                                  " ·",
                                  " ",
                                  technician.specialty
                                ]
                              },
                              technician.id.toString()
                            ))
                          ]
                        }
                      )
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                "data-ocid": "order_detail.totals.panel",
                className: "gap-0 rounded-lg py-0 shadow-none",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-sm font-semibold tracking-tight", children: "Totales" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 px-5 py-5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Repuestos" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(totals.partsSubtotal) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Mano de obra" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(totals.laborSubtotal) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(totals.subtotal) })
                    ] }),
                    isIvaResponsible ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                        "Impuesto (",
                        formatTaxRate(totals.taxRate),
                        ")"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail", children: formatMoney(totals.tax) })
                    ] }) : null,
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Separator, {}),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: "Total" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          "data-ocid": "order_detail.totals.total",
                          className: "data-rail text-lg font-semibold text-primary",
                          children: formatMoney(totals.total)
                        }
                      )
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                "data-ocid": "order_detail.history.panel",
                className: "gap-0 rounded-lg py-0 shadow-none",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Clock,
                      {
                        className: "size-4 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ),
                    "Historial de estados"
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-5 py-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "ol",
                    {
                      "data-ocid": "order_detail.history.timeline",
                      className: "relative space-y-4 border-l border-border pl-5",
                      children: order.statusHistory.map((change, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "li",
                        {
                          "data-ocid": `order_detail.history.item.${index + 1}`,
                          className: "relative",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "span",
                              {
                                "aria-hidden": "true",
                                className: "absolute -left-[1.4375rem] top-1 size-2.5 rounded-full border-2 border-background bg-primary"
                              }
                            ),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: ORDER_STATUS_LABELS[change.to] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                              change.from ? `Desde ${ORDER_STATUS_LABELS[change.from]} · ` : "Orden creada · ",
                              formatDateTime(change.at)
                            ] })
                          ]
                        },
                        `${change.at.toString()}-${change.to}`
                      ))
                    }
                  ) })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isPrintOpen, onOpenChange: setIsPrintOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          DialogContent,
          {
            "data-ocid": "order_detail.print_dialog",
            className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Imprimir orden de taller" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
                  "Imprime la orden ",
                  order.orderNumber,
                  " en hoja A4 o en tirilla de 80 mm, o descárgala como PDF."
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DocumentPreview,
                {
                  title: "Orden de taller",
                  number: order.orderNumber,
                  companyName: (companyHeader == null ? void 0 : companyHeader.legalName) ?? (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES",
                  companyLogoUrl,
                  companyContact: companyHeader ? companyContactLine(companyHeader) : business ? [business.address, business.phone].filter((part) => part.trim() !== "").join(" · ") : void 0,
                  companyFiscal: companyHeader ? companyFiscalLines(companyHeader) : void 0,
                  meta: documentMeta,
                  lines: documentLines,
                  totals: documentTotals,
                  footer: orderFooter,
                  hopeMessage,
                  format: printFormat,
                  ocid: "order_detail.document",
                  onFormatChange: setPrintFormat,
                  onDownloadPdf: handleDownloadPdf,
                  isDownloading
                }
              ),
              downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "order_detail.download_error",
                  className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2 text-xs text-destructive", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        TriangleAlert,
                        {
                          className: "mt-0.5 size-3.5 shrink-0",
                          "aria-hidden": "true"
                        }
                      ),
                      downloadError
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        onClick: () => void handleDownloadPdf(printFormat),
                        "data-ocid": "order_detail.download_retry_button",
                        children: "Reintentar"
                      }
                    )
                  ]
                }
              ) : null
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isWarrantyOpen, onOpenChange: setIsWarrantyOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          DialogContent,
          {
            "data-ocid": "order_detail.warranty_dialog",
            className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Términos y Condiciones de Garantía" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
                  "Documento de garantía de la orden ",
                  order.orderNumber,
                  ". Previsualiza en hoja A4 o tirilla de 80 mm, imprime, descarga el PDF o envíalo por WhatsApp al cliente."
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                WarrantyDocument,
                {
                  data: warrantyData,
                  companyName: (companyHeader == null ? void 0 : companyHeader.legalName) ?? (business == null ? void 0 : business.name) ?? "HR SOLUCIONES INTEGRALES",
                  companyLogoUrl,
                  companyContact: companyHeader ? companyContactLine(companyHeader) : business ? [business.address, business.phone].filter((part) => part.trim() !== "").join(" · ") : void 0,
                  companyFiscal: companyHeader ? companyFiscalLines(companyHeader) : void 0,
                  format: warrantyFormat,
                  termsText: warrantyTermsText,
                  ocid: "order_detail.warranty_document",
                  onFormatChange: setWarrantyFormat,
                  onDownloadPdf: handleDownloadWarrantyPdf,
                  isDownloading: isWarrantyDownloading
                }
              ),
              warrantyDownloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "order_detail.warranty_download_error",
                  className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2 text-xs text-destructive", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        TriangleAlert,
                        {
                          className: "mt-0.5 size-3.5 shrink-0",
                          "aria-hidden": "true"
                        }
                      ),
                      warrantyDownloadError
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        onClick: () => void handleDownloadWarrantyPdf(warrantyFormat),
                        "data-ocid": "order_detail.warranty_download_retry_button",
                        children: "Reintentar"
                      }
                    )
                  ]
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "no-print flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setIsWarrantyWhatsAppOpen(true),
                  "data-ocid": "order_detail.warranty_whatsapp_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "size-4", "aria-hidden": "true" }),
                    "Enviar por WhatsApp"
                  ]
                }
              ) })
            ]
          }
        ) }),
        warrantyData ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          WarrantyWhatsAppDialog,
          {
            open: isWarrantyWhatsAppOpen,
            onOpenChange: setIsWarrantyWhatsAppOpen,
            customerId: order.customerId,
            customerName: customerName ?? `Cliente #${order.customerId.toString()}`,
            orderId: order.id,
            warranty: warrantyData,
            company: warrantyCompany,
            hope: hopeMessage,
            termsText: warrantyTermsText
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AddPartDialog,
          {
            orderId: order.id,
            open: isAddPartOpen,
            onOpenChange: setIsAddPartOpen
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ScanPartDialog,
          {
            orderId: order.id,
            open: isScanPartOpen,
            onOpenChange: setIsScanPartOpen
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AddLaborDialog,
          {
            orderId: order.id,
            open: isAddLaborOpen,
            onOpenChange: setIsAddLaborOpen
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CancelOrderDialog,
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            open: isCancelOpen,
            onOpenChange: setIsCancelOpen
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          DeleteOrderDialog,
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            open: isDeleteOpen,
            onOpenChange: setIsDeleteOpen,
            onDeleted: () => void navigate({ to: "/ordenes" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          NotifyCustomerDialog,
          {
            open: isNotifyOpen,
            onOpenChange: setIsNotifyOpen,
            customerId: order.customerId,
            customerName: customerName ?? `Cliente #${order.customerId.toString()}`,
            customerEmail,
            source: NotificationSource.order,
            referenceId: order.id,
            defaultSubject: `Estado de tu orden ${order.orderNumber}`,
            defaultMessage: `Hola ${customerName ?? "cliente"}, te informamos el estado actual de tu orden ${order.orderNumber}: ${ORDER_STATUS_LABELS[order.status]}. Si necesitas más detalles sobre la reparación, respóndenos a este correo y con gusto te atendemos.`
          }
        )
      ]
    }
  );
}
export {
  OrderDetailPage
};
