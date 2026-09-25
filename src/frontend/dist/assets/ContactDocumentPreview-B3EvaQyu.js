import { s as reactExports, j as jsxRuntimeExports, B as Button, F as FileText, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, k as useBackend, l as useQuery, aF as formatNit } from "./index-CzQEXdHP.js";
import { D as DocumentPreview } from "./DocumentPreview-CccqIWmY.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { u as useContactDocumentPdf } from "./use-whatsapp-hGj8iSf3.js";
function ContactDocumentPreview({
  document,
  ocid,
  label = "Ver ficha",
  variant = "outline",
  size = "sm",
  className
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [format, setFormat] = reactExports.useState("a4");
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const { download } = useContactDocumentPdf();
  function handleOpenChange(next) {
    if (next) setFormat("a4");
    setOpen(next);
  }
  async function handleDownloadPdf(nextFormat) {
    setIsDownloading(true);
    try {
      await download(document, nextFormat);
    } finally {
      setIsDownloading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant,
        size,
        onClick: () => handleOpenChange(true),
        "aria-label": `${label} de ${document.name}`,
        "data-ocid": ocid,
        className,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-4", "aria-hidden": "true" }),
          size === "icon" ? null : label
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      DialogContent,
      {
        "data-ocid": `${ocid}.dialog`,
        className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: document.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Vista previa fiel al tamaño de impresión. Elige hoja A4 o tirilla de 80 mm antes de imprimir o descargar." })
          ] }),
          open ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            ContactDocumentPreviewBody,
            {
              document,
              format,
              ocid,
              isDownloading,
              onFormatChange: setFormat,
              onDownloadPdf: handleDownloadPdf
            }
          ) : null
        ]
      }
    ) })
  ] });
}
function ContactDocumentPreviewBody({
  document,
  format,
  ocid,
  isDownloading,
  onFormatChange,
  onDownloadPdf
}) {
  const { actor, isFetching } = useBackend();
  const companyQuery = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCompanyProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY
  });
  const profile = companyQuery.data;
  const companyName = (profile == null ? void 0 : profile.legalName) || "HR SOLUCIONES INTEGRALES";
  const companyContact = [
    profile == null ? void 0 : profile.address,
    profile == null ? void 0 : profile.city,
    profile == null ? void 0 : profile.phone,
    profile == null ? void 0 : profile.email
  ].filter((part) => !!part && part.trim() !== "").join(" · ");
  const companyFiscal = profile ? [
    formatNit(profile.taxId, profile.checkDigit),
    profile.fiscalRegime,
    profile.taxResponsibility
  ].filter((line) => !!line && line.trim() !== "") : [];
  const lines = reactExports.useMemo(
    () => document.sections.flatMap(
      (section) => section.rows.map((row) => ({
        description: row.join(" · "),
        quantity: 1,
        unitPrice: 0,
        amount: 0
      }))
    ),
    [document]
  );
  if (companyQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": `${ocid}.loading_state`,
        className: "space-y-3 py-2",
        "aria-busy": "true",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-2/3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-40 w-full" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    DocumentPreview,
    {
      title: document.title,
      number: document.number,
      companyName,
      companyLogoUrl: profile == null ? void 0 : profile.logoUrl,
      companyContact: companyContact || void 0,
      companyFiscal,
      meta: document.meta,
      lines,
      totals: [],
      footer: document.footer,
      format,
      ocid: `${ocid}.preview`,
      onFormatChange,
      onDownloadPdf,
      isDownloading
    }
  );
}
export {
  ContactDocumentPreview as C
};
