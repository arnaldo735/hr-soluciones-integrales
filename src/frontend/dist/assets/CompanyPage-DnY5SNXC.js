import { af as ExternalBlob, aP as loadConfig, aQ as HttpAgent, aR as StorageClient, j as jsxRuntimeExports, u as useRole, s as reactExports, aW as TaxResponsibility, aX as FiscalRegime, aY as DocumentType, aZ as nitCheckDigit, a_ as onlyDigits, T as TriangleAlert, B as Button, f as Building2, v as Input, a$ as formatNitBase, ah as LoaderCircle, y as formatDate, J as Save, aF as formatNit, b0 as fiscalRegimeLabel, b1 as taxResponsibilityLabel, b2 as isIvaResponsible, x as formatMoney, aj as formatTaxRate, ar as ue } from "./index-CzQEXdHP.js";
import { D as DocumentPreview } from "./DocumentPreview-CccqIWmY.js";
import { P as PageHeader } from "./PageHeader-JDKYCqW_.js";
import { C as Card, a as CardHeader, b as CardTitle, d as CardDescription, c as CardContent } from "./card-D8aqbagN.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { u as useCompanyProfile, c as useUpdateCompanyProfile } from "./use-company-Db6O1TYw.js";
import { I as ImagePlus } from "./image-plus-mgNAj2UQ.js";
import { T as Trash2 } from "./trash-2-M_celBpV.js";
import "./printer-D9qf1U3g.js";
import "./download-6xWfJWG2.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
let handlePromise = null;
const CONFIG_TIMEOUT_MS = 3e3;
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(
        new Error(
          "No se pudo preparar el almacenamiento de archivos. Verifica tu conexión e inténtalo de nuevo."
        )
      ),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
async function getStorageHandle() {
  if (!handlePromise) {
    handlePromise = (async () => {
      var _a;
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if ((_a = config.backend_host) == null ? void 0 : _a.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {
        });
      }
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent
      );
      return { client, agent };
    })().catch((error) => {
      handlePromise = null;
      throw error;
    });
  }
  return handlePromise;
}
async function uploadImage(file, onProgress) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
  const handle = await withTimeout(getStorageHandle(), CONFIG_TIMEOUT_MS);
  const { hash } = await handle.client.putFile(
    await blob.getBytes(),
    onProgress,
    blob.contentType,
    blob.filename
  );
  return handle.client.getDirectURL(hash);
}
function errorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
const DOCUMENT_TYPE_OPTIONS = [
  { value: DocumentType.nit, label: "NIT" },
  { value: DocumentType.cedulaCiudadania, label: "Cédula de ciudadanía" },
  { value: DocumentType.cedulaExtranjeria, label: "Cédula de extranjería" }
];
const FISCAL_REGIME_OPTIONS = [
  { value: FiscalRegime.responsableIva, label: "Responsable de IVA" },
  { value: FiscalRegime.noResponsableIva, label: "No responsable de IVA" }
];
function normalizeFiscalRegime(value) {
  switch (value) {
    case FiscalRegime.responsableIva:
    case FiscalRegime.noResponsableIva:
      return value;
    default:
      return FiscalRegime.noResponsableIva;
  }
}
function selectedFiscalRegime(value) {
  switch (value) {
    case FiscalRegime.responsableIva:
    case FiscalRegime.noResponsableIva:
      return value;
    default:
      return null;
  }
}
function normalizeDocumentType(value) {
  return value === DocumentType.cedulaCiudadania || value === DocumentType.cedulaExtranjeria ? value : DocumentType.nit;
}
function normalizeTaxResponsibility(value) {
  switch (value) {
    case TaxResponsibility.granContribuyente:
    case TaxResponsibility.autorretenedor:
    case TaxResponsibility.agenteRetencionIva:
    case TaxResponsibility.regimenSimple:
      return value;
    default:
      return TaxResponsibility.noAplica;
  }
}
const TAX_RESPONSIBILITY_OPTIONS = [
  { value: TaxResponsibility.granContribuyente, label: "Gran contribuyente" },
  { value: TaxResponsibility.autorretenedor, label: "Autorretenedor" },
  {
    value: TaxResponsibility.agenteRetencionIva,
    label: "Agente de retención IVA"
  },
  { value: TaxResponsibility.regimenSimple, label: "Régimen simple" },
  { value: TaxResponsibility.noAplica, label: "No aplica" }
];
const EMPTY_DRAFT = {
  legalName: "",
  tradeName: "",
  documentType: DocumentType.nit,
  taxId: "",
  checkDigit: "",
  // Default regime for this company; a loaded profile overrides it.
  fiscalRegime: FiscalRegime.noResponsableIva,
  taxResponsibility: TaxResponsibility.noAplica,
  address: "",
  city: "",
  phone: "",
  email: "",
  website: "",
  logoUrl: "",
  taxRatePercent: "19"
};
function draftFromProfile(profile) {
  return {
    legalName: profile.legalName,
    tradeName: profile.tradeName ?? "",
    documentType: normalizeDocumentType(profile.documentType),
    taxId: profile.taxId,
    checkDigit: profile.checkDigit === void 0 ? "" : Number(profile.checkDigit).toString(),
    fiscalRegime: normalizeFiscalRegime(profile.fiscalRegime),
    taxResponsibility: normalizeTaxResponsibility(profile.taxResponsibility),
    address: profile.address,
    city: profile.city,
    phone: profile.phone,
    email: profile.email ?? "",
    website: profile.website ?? "",
    logoUrl: profile.logoUrl ?? "",
    taxRatePercent: Number(profile.taxRate).toString()
  };
}
function requiredErrors(draft) {
  const errors = {};
  if (draft.legalName.trim() === "") {
    errors.legalName = "Ingresa la razón social.";
  }
  if (draft.taxId.trim() === "") {
    errors.taxId = "Ingresa el número de documento.";
  }
  if (draft.address.trim() === "") {
    errors.address = "Ingresa la dirección.";
  }
  if (draft.city.trim() === "") {
    errors.city = "Ingresa la ciudad o departamento.";
  }
  if (draft.phone.trim() === "") {
    errors.phone = "Ingresa el teléfono.";
  }
  if (draft.email.trim() === "") {
    errors.email = "Ingresa el correo electrónico.";
  }
  return errors;
}
function CompanyForm() {
  const { isAdmin } = useRole();
  const profileQuery = useCompanyProfile();
  const saveMutation = useUpdateCompanyProfile();
  const [draft, setDraft] = reactExports.useState(EMPTY_DRAFT);
  const [initialized, setInitialized] = reactExports.useState(false);
  const [submitted, setSubmitted] = reactExports.useState(false);
  const [uploading, setUploading] = reactExports.useState(false);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const [uploadError, setUploadError] = reactExports.useState(null);
  const fileInputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const data = profileQuery.data;
    if (!data || initialized) return;
    setDraft(draftFromProfile(data));
    setInitialized(true);
  }, [profileQuery.data, initialized]);
  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function handleLogoChange(event) {
    var _a;
    const file = (_a = event.target.files) == null ? void 0 : _a[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Selecciona un archivo de imagen (PNG, JPG o SVG).");
      return;
    }
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadImage(
        file,
        (percentage) => setUploadProgress(percentage)
      );
      update("logoUrl", url);
      ue.success("Logo cargado", {
        description: "Guarda los cambios para aplicarlo a tus documentos."
      });
    } catch (error) {
      setUploadError(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }
  const taxRateRaw = draft.taxRatePercent.trim();
  const taxRateNumber = Number(taxRateRaw.replace(",", "."));
  const taxRateValid = taxRateRaw === "" || Number.isFinite(taxRateNumber) && taxRateNumber >= 0 && taxRateNumber <= 100;
  const isNit = draft.documentType === DocumentType.nit;
  const expectedCheckDigit = isNit ? nitCheckDigit(draft.taxId) : null;
  const enteredCheckDigit = onlyDigits(draft.checkDigit);
  const checkDigitValid = !isNit || enteredCheckDigit === "" || expectedCheckDigit !== null && Number(enteredCheckDigit) === expectedCheckDigit;
  const errors = requiredErrors(draft);
  const canSubmit = isAdmin && Object.keys(errors).length === 0 && taxRateValid && checkDigitValid && !saveMutation.isPending && !uploading;
  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    const input = {
      legalName: draft.legalName.trim(),
      tradeName: draft.tradeName.trim() || void 0,
      documentType: normalizeDocumentType(draft.documentType),
      taxId: draft.taxId.trim(),
      checkDigit: isNit ? BigInt(
        enteredCheckDigit === "" ? expectedCheckDigit ?? 0 : enteredCheckDigit
      ) : void 0,
      // Never send an empty or unknown regime: Candid rejects it as an invalid
      // variant before the backend can normalize it.
      fiscalRegime: normalizeFiscalRegime(draft.fiscalRegime),
      taxResponsibility: normalizeTaxResponsibility(draft.taxResponsibility),
      address: draft.address.trim(),
      city: draft.city.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim() || void 0,
      website: draft.website.trim() || void 0,
      // An empty logo is omitted so the backend stores null, never "".
      logoUrl: draft.logoUrl.trim() || void 0,
      taxRate: BigInt(Math.round(taxRateRaw === "" ? 19 : taxRateNumber))
    };
    saveMutation.mutate(input, {
      onSuccess: () => ue.success("Datos de la empresa guardados"),
      onError: (error) => ue.error("No se pudieron guardar los datos", {
        description: errorMessage(error)
      })
    });
  }
  if (profileQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "company.form.card", className: "rounded-lg shadow-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "border-b border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base tracking-tight", children: "Datos de la empresa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Información fiscal y de contacto que aparece en tus documentos." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        CardContent,
        {
          "data-ocid": "company.form.loading_state",
          className: "grid gap-4 pt-6 sm:grid-cols-2",
          children: Array.from({ length: 8 }, (_, i) => `company-skeleton-${i}`).map(
            (id) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-24" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" })
            ] }, id)
          )
        }
      )
    ] });
  }
  if (profileQuery.isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { "data-ocid": "company.form.card", className: "rounded-lg shadow-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      CardContent,
      {
        "data-ocid": "company.form.error_state",
        className: "flex flex-col items-start gap-3 pt-6",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4", "aria-hidden": "true" }),
            "No se pudieron cargar los datos de la empresa."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              onClick: () => void profileQuery.refetch(),
              "data-ocid": "company.form.retry_button",
              children: "Reintentar"
            }
          )
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "company.form.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "size-4", "aria-hidden": "true" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base tracking-tight", children: "Datos de la empresa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: isAdmin ? "Datos fiscales conforme a la norma colombiana y la resolución DIAN. Alimentan el encabezado de tus documentos." : "Solo un administrador puede editar estos datos." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "form",
      {
        onSubmit: handleSubmit,
        className: "grid gap-4 sm:grid-cols-2",
        "data-ocid": "company.form",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-legal-name", children: "Razón social" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-legal-name",
                value: draft.legalName,
                onChange: (event) => update("legalName", event.target.value),
                placeholder: "HR SOLUCIONES INTEGRALES S.A.S.",
                autoComplete: "organization",
                "aria-invalid": submitted && !!errors.legalName,
                disabled: !isAdmin,
                "data-ocid": "company.legal_name_input"
              }
            ),
            submitted && errors.legalName ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.legal_name_error",
                className: "text-xs text-destructive",
                children: errors.legalName
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-trade-name", children: "Nombre comercial" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-trade-name",
                value: draft.tradeName,
                onChange: (event) => update("tradeName", event.target.value),
                placeholder: "Taller HR Motos",
                disabled: !isAdmin,
                "data-ocid": "company.trade_name_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-document-type", children: "Tipo de documento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: draft.documentType,
                onValueChange: (value) => update("documentType", normalizeDocumentType(value)),
                disabled: !isAdmin,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "company-document-type",
                      "data-ocid": "company.document_type_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona el tipo" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: DOCUMENT_TYPE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-tax-id", children: "Número de documento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-tax-id",
                value: draft.taxId,
                onChange: (event) => update("taxId", event.target.value),
                placeholder: "900123456",
                inputMode: "numeric",
                className: "data-rail",
                "aria-invalid": submitted && !!errors.taxId,
                disabled: !isAdmin,
                "data-ocid": "company.tax_id_input"
              }
            ),
            submitted && errors.taxId ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.tax_id_error",
                className: "text-xs text-destructive",
                children: errors.taxId
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-check-digit", children: "Dígito de verificación" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-check-digit",
                value: draft.checkDigit,
                onChange: (event) => update("checkDigit", event.target.value),
                placeholder: "7",
                inputMode: "numeric",
                maxLength: 1,
                className: "data-rail",
                "aria-invalid": submitted && !checkDigitValid,
                "aria-describedby": "company-check-digit-help",
                disabled: !isAdmin || !isNit,
                "data-ocid": "company.check_digit_input"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                id: "company-check-digit-help",
                className: "text-xs text-muted-foreground",
                children: isNit ? "Dígito calculado con el algoritmo módulo 11 de la DIAN. Si lo dejas vacío se calcula automáticamente." : "Solo aplica al NIT."
              }
            ),
            submitted && !checkDigitValid ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.check_digit_error",
                className: "text-xs text-destructive",
                children: expectedCheckDigit === null ? "Ingresa el número de documento para validar el dígito de verificación." : `El dígito de verificación no coincide con el número de documento. Para ${formatNitBase(
                  draft.taxId
                )} debe ser ${expectedCheckDigit}.`
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-fiscal-regime", children: "Régimen fiscal" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: draft.fiscalRegime,
                onValueChange: (value) => {
                  const regime = selectedFiscalRegime(value);
                  if (regime) update("fiscalRegime", regime);
                },
                disabled: !isAdmin,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "company-fiscal-regime",
                      "data-ocid": "company.fiscal_regime_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona el régimen" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: FISCAL_REGIME_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-tax-responsibility", children: "Responsabilidad tributaria" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: draft.taxResponsibility,
                onValueChange: (value) => update("taxResponsibility", normalizeTaxResponsibility(value)),
                disabled: !isAdmin,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "company-tax-responsibility",
                      "data-ocid": "company.tax_responsibility_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona la responsabilidad" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: TAX_RESPONSIBILITY_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-address", children: "Dirección" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-address",
                value: draft.address,
                onChange: (event) => update("address", event.target.value),
                placeholder: "Calle 45 #12-30",
                autoComplete: "street-address",
                "aria-invalid": submitted && !!errors.address,
                disabled: !isAdmin,
                "data-ocid": "company.address_input"
              }
            ),
            submitted && errors.address ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.address_error",
                className: "text-xs text-destructive",
                children: errors.address
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-city", children: "Ciudad / Departamento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-city",
                value: draft.city,
                onChange: (event) => update("city", event.target.value),
                placeholder: "Bogotá D.C., Cundinamarca",
                autoComplete: "address-level2",
                "aria-invalid": submitted && !!errors.city,
                disabled: !isAdmin,
                "data-ocid": "company.city_input"
              }
            ),
            submitted && errors.city ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.city_error",
                className: "text-xs text-destructive",
                children: errors.city
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-phone", children: "Teléfono" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-phone",
                value: draft.phone,
                onChange: (event) => update("phone", event.target.value),
                placeholder: "+57 300 000 0000",
                inputMode: "tel",
                className: "data-rail",
                "aria-invalid": submitted && !!errors.phone,
                disabled: !isAdmin,
                "data-ocid": "company.phone_input"
              }
            ),
            submitted && errors.phone ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.phone_error",
                className: "text-xs text-destructive",
                children: errors.phone
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-email", children: "Correo electrónico" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-email",
                type: "email",
                value: draft.email,
                onChange: (event) => update("email", event.target.value),
                placeholder: "contacto@hrsolucionesintegrales.com",
                autoComplete: "email",
                "aria-invalid": submitted && !!errors.email,
                disabled: !isAdmin,
                "data-ocid": "company.email_input"
              }
            ),
            submitted && errors.email ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.email_error",
                className: "text-xs text-destructive",
                children: errors.email
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-website", children: "Sitio web" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-website",
                value: draft.website,
                onChange: (event) => update("website", event.target.value),
                placeholder: "https://hrsolucionesintegrales.com",
                autoComplete: "url",
                disabled: !isAdmin,
                "data-ocid": "company.website_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-tax-rate", children: "Tarifa de IVA (%)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "company-tax-rate",
                value: draft.taxRatePercent,
                onChange: (event) => update("taxRatePercent", event.target.value),
                placeholder: "19",
                inputMode: "decimal",
                "aria-invalid": !taxRateValid,
                "aria-describedby": "company-tax-rate-help",
                className: "data-rail",
                disabled: !isAdmin,
                "data-ocid": "company.tax_rate_input"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                id: "company-tax-rate-help",
                className: "text-xs text-muted-foreground",
                children: "Se aplica al subtotal de cada factura. Ejemplo: 19 para 19%. Si lo dejas vacío se usa 19%."
              }
            ),
            !taxRateValid ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                "data-ocid": "company.tax_rate_error",
                className: "text-xs text-destructive",
                children: "Ingresa un porcentaje entre 0 y 100."
              }
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "company-logo", children: "Logo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  "data-ocid": "company.logo.preview",
                  className: "flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary",
                  children: draft.logoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: draft.logoUrl,
                      alt: "Vista previa del logo de la empresa",
                      className: "size-full object-contain"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    ImagePlus,
                    {
                      className: "size-6 text-muted-foreground",
                      "aria-hidden": "true"
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    ref: fileInputRef,
                    id: "company-logo",
                    type: "file",
                    accept: "image/*",
                    className: "sr-only",
                    onChange: handleLogoChange,
                    disabled: !isAdmin || uploading,
                    "data-ocid": "company.logo.input"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      size: "sm",
                      disabled: !isAdmin || uploading,
                      onClick: () => {
                        var _a;
                        return (_a = fileInputRef.current) == null ? void 0 : _a.click();
                      },
                      "data-ocid": "company.logo.upload_button",
                      className: "gap-1.5",
                      children: [
                        uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          LoaderCircle,
                          {
                            className: "size-4 animate-spin",
                            "aria-hidden": "true"
                          }
                        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "size-4", "aria-hidden": "true" }),
                        uploading ? uploadProgress > 0 ? `Subiendo… ${uploadProgress}%` : "Subiendo…" : "Subir logo"
                      ]
                    }
                  ),
                  draft.logoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Button,
                    {
                      type: "button",
                      variant: "ghost",
                      size: "sm",
                      disabled: !isAdmin || uploading,
                      onClick: () => update("logoUrl", ""),
                      "data-ocid": "company.logo.remove_button",
                      className: "gap-1.5 text-muted-foreground",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4", "aria-hidden": "true" }),
                        "Quitar"
                      ]
                    }
                  ) : null
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "PNG, JPG o SVG. Se muestra en el encabezado de tus documentos." }),
                uploadError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "p",
                  {
                    "data-ocid": "company.logo.error_state",
                    className: "text-xs text-destructive",
                    children: uploadError
                  }
                ) : null
              ] })
            ] })
          ] }),
          isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-3 sm:col-span-2", children: [
            profileQuery.data ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mr-auto text-xs text-muted-foreground", children: [
              "Última actualización:",
              " ",
              formatDate(profileQuery.data.updatedAt)
            ] }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: !canSubmit,
                "data-ocid": "company.save_button",
                className: "gap-2",
                children: [
                  saveMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                  saveMutation.isPending ? "Guardando…" : "Guardar datos"
                ]
              }
            )
          ] }) : null
        ]
      }
    ) })
  ] });
}
function CompanyDocumentPreview() {
  const profileQuery = useCompanyProfile();
  const profile = profileQuery.data;
  const companyName = (profile == null ? void 0 : profile.legalName) || "HR SOLUCIONES INTEGRALES";
  const contactParts = [
    profile == null ? void 0 : profile.address,
    profile == null ? void 0 : profile.city,
    profile == null ? void 0 : profile.phone,
    profile == null ? void 0 : profile.email,
    profile == null ? void 0 : profile.website
  ].filter((part) => !!part && part.trim() !== "");
  const companyContact = contactParts.join(" · ");
  const fiscalLines = profile ? [
    formatNit(profile.taxId, profile.checkDigit),
    fiscalRegimeLabel(profile.fiscalRegime),
    taxResponsibilityLabel(profile.taxResponsibility)
  ] : [];
  const meta = [
    { label: "Cliente", value: "María Fernanda Ríos" },
    { label: "Documento", value: "FAC-000128", rail: true },
    { label: "Fecha", value: formatDate(profile == null ? void 0 : profile.updatedAt) },
    {
      label: "NIT",
      value: profile ? formatNit(profile.taxId, profile.checkDigit) : "—",
      rail: true
    }
  ];
  const lines = [
    {
      description: "Cambio de aceite y filtro",
      quantity: 1,
      unitPrice: 450,
      amount: 450
    },
    {
      description: "Pastillas de freno delanteras",
      quantity: 2,
      unitPrice: 320,
      amount: 640
    }
  ];
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const ivaResponsible = isIvaResponsible(profile == null ? void 0 : profile.fiscalRegime);
  const taxRate = ivaResponsible ? Number((profile == null ? void 0 : profile.taxRate) ?? 19n) : 0;
  const tax = subtotal * taxRate / 100;
  const total = subtotal + tax;
  const totals = [
    {
      label: "Subtotal",
      value: formatMoney(BigInt(Math.round(subtotal * 100)))
    },
    ...ivaResponsible ? [
      {
        label: `IVA (${formatTaxRate((profile == null ? void 0 : profile.taxRate) ?? 19n)})`,
        value: formatMoney(BigInt(Math.round(tax * 100)))
      }
    ] : [],
    {
      label: "Total",
      value: formatMoney(BigInt(Math.round(total * 100))),
      emphasis: true
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { "data-ocid": "company.preview.card", className: "rounded-lg shadow-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "border-b border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "font-display text-base tracking-tight", children: "Vista previa en documentos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Así aparecen los datos fiscales de la empresa en el encabezado y pie de tus facturas, cotizaciones y tirillas." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DocumentPreview,
      {
        title: "Factura",
        number: "FAC-000128",
        companyName,
        companyLogoUrl: profile == null ? void 0 : profile.logoUrl,
        companyContact: companyContact || void 0,
        companyFiscal: fiscalLines,
        meta,
        lines,
        totals,
        footer: `${companyName} · ${profile ? formatNit(profile.taxId, profile.checkDigit) : "NIT pendiente"}`,
        format: "a4",
        ocid: "company.preview"
      }
    ) })
  ] });
}
function CompanyPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "company.page", className: "mx-auto w-full max-w-5xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageHeader,
      {
        eyebrow: "Administración",
        title: "Empresa",
        description: "Datos fiscales y de contacto que aparecen en tus documentos."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-col gap-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyForm, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CompanyDocumentPreview, {})
    ] })
  ] });
}
export {
  CompanyPage,
  CompanyPage as default
};
