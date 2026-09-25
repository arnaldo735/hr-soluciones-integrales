import { DocumentPreview } from "@/components/DocumentPreview";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
} from "@/hooks/use-company";
import { useRole } from "@/hooks/use-role";
import {
  documentTypeLabel,
  fiscalRegimeLabel,
  formatDate,
  formatMoney,
  formatNit,
  formatNitBase,
  formatTaxRate,
  isIvaResponsible,
  nitCheckDigit,
  onlyDigits,
  taxResponsibilityLabel,
} from "@/lib/format";
import type { CompanyProfileInput } from "@/lib/types";
import { DocumentType, FiscalRegime, TaxResponsibility } from "@/lib/types";
import { uploadImage } from "@/lib/upload-image";
import {
  AlertTriangle,
  Building2,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: DocumentType.nit, label: "NIT" },
  { value: DocumentType.cedulaCiudadania, label: "Cédula de ciudadanía" },
  { value: DocumentType.cedulaExtranjeria, label: "Cédula de extranjería" },
];

const FISCAL_REGIME_OPTIONS: Array<{ value: FiscalRegime; label: string }> = [
  { value: FiscalRegime.responsableIva, label: "Responsable de IVA" },
  { value: FiscalRegime.noResponsableIva, label: "No responsable de IVA" },
];

/**
 * Normalizes a regime coming from the backend or the select to one of the
 * selectable options. Any valid variant is preserved as-is; an unrecognized,
 * empty or missing value falls back to `noResponsableIva`, the regime this
 * company declares. The select therefore never renders empty and a save never
 * sends an empty regime, which Candid would reject as an invalid variant.
 */
function normalizeFiscalRegime(value: unknown): FiscalRegime {
  switch (value) {
    case FiscalRegime.responsableIva:
    case FiscalRegime.noResponsableIva:
      return value;
    default:
      return FiscalRegime.noResponsableIva;
  }
}

/**
 * Reads a regime emitted by the select. Radix fires `onValueChange("")` while
 * the controlled value has no matching item yet (initial mount and option
 * remounts), which is not a user selection. Returning `null` for anything that
 * is not a real variant lets the caller ignore those events instead of
 * overwriting a valid loaded regime with the fallback.
 */
function selectedFiscalRegime(value: unknown): FiscalRegime | null {
  switch (value) {
    case FiscalRegime.responsableIva:
    case FiscalRegime.noResponsableIva:
      return value;
    default:
      return null;
  }
}

/** Keeps a document type valid; an unknown value falls back to `nit`. */
function normalizeDocumentType(value: unknown): DocumentType {
  return value === DocumentType.cedulaCiudadania ||
    value === DocumentType.cedulaExtranjeria
    ? value
    : DocumentType.nit;
}

/** Keeps a tax responsibility valid; an unknown value falls back to `noAplica`. */
function normalizeTaxResponsibility(value: unknown): TaxResponsibility {
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

const TAX_RESPONSIBILITY_OPTIONS: Array<{
  value: TaxResponsibility;
  label: string;
}> = [
  { value: TaxResponsibility.granContribuyente, label: "Gran contribuyente" },
  { value: TaxResponsibility.autorretenedor, label: "Autorretenedor" },
  {
    value: TaxResponsibility.agenteRetencionIva,
    label: "Agente de retención IVA",
  },
  { value: TaxResponsibility.regimenSimple, label: "Régimen simple" },
  { value: TaxResponsibility.noAplica, label: "No aplica" },
];

interface Draft {
  legalName: string;
  tradeName: string;
  documentType: DocumentType;
  taxId: string;
  checkDigit: string;
  fiscalRegime: FiscalRegime;
  taxResponsibility: TaxResponsibility;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  taxRatePercent: string;
}

const EMPTY_DRAFT: Draft = {
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
  taxRatePercent: "19",
};

function draftFromProfile(profile: {
  legalName: string;
  tradeName?: string;
  documentType: DocumentType | string;
  taxId: string;
  checkDigit?: bigint;
  fiscalRegime: FiscalRegime | string;
  taxResponsibility: TaxResponsibility | string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  taxRate: bigint;
}): Draft {
  return {
    legalName: profile.legalName,
    tradeName: profile.tradeName ?? "",
    documentType: normalizeDocumentType(profile.documentType),
    taxId: profile.taxId,
    checkDigit:
      profile.checkDigit === undefined
        ? ""
        : Number(profile.checkDigit).toString(),
    fiscalRegime: normalizeFiscalRegime(profile.fiscalRegime),
    taxResponsibility: normalizeTaxResponsibility(profile.taxResponsibility),
    address: profile.address,
    city: profile.city,
    phone: profile.phone,
    email: profile.email ?? "",
    website: profile.website ?? "",
    logoUrl: profile.logoUrl ?? "",
    taxRatePercent: Number(profile.taxRate).toString(),
  };
}

/** Required-field validation in Spanish, keyed by draft field. */
function requiredErrors(draft: Draft): Partial<Record<keyof Draft, string>> {
  const errors: Partial<Record<keyof Draft, string>> = {};
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

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [initialized, setInitialized] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const data = profileQuery.data;
    if (!data || initialized) return;
    setDraft(draftFromProfile(data));
    setInitialized(true);
  }, [profileQuery.data, initialized]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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
      const url = await uploadImage(file, (percentage) =>
        setUploadProgress(percentage),
      );
      update("logoUrl", url);
      toast.success("Logo cargado", {
        description: "Guarda los cambios para aplicarlo a tus documentos.",
      });
    } catch (error) {
      setUploadError(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  const taxRateRaw = draft.taxRatePercent.trim();
  const taxRateNumber = Number(taxRateRaw.replace(",", "."));
  // An empty tax rate is allowed and falls back to the default 19%.
  const taxRateValid =
    taxRateRaw === "" ||
    (Number.isFinite(taxRateNumber) &&
      taxRateNumber >= 0 &&
      taxRateNumber <= 100);

  const isNit = draft.documentType === DocumentType.nit;
  const expectedCheckDigit = isNit ? nitCheckDigit(draft.taxId) : null;
  const enteredCheckDigit = onlyDigits(draft.checkDigit);
  // An empty check digit is allowed: the system computes it automatically.
  const checkDigitValid =
    !isNit ||
    enteredCheckDigit === "" ||
    (expectedCheckDigit !== null &&
      Number(enteredCheckDigit) === expectedCheckDigit);

  const errors = requiredErrors(draft);
  const canSubmit =
    isAdmin &&
    Object.keys(errors).length === 0 &&
    taxRateValid &&
    checkDigitValid &&
    !saveMutation.isPending &&
    !uploading;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    const input: CompanyProfileInput = {
      legalName: draft.legalName.trim(),
      tradeName: draft.tradeName.trim() || undefined,
      documentType: normalizeDocumentType(draft.documentType),
      taxId: draft.taxId.trim(),
      checkDigit: isNit
        ? BigInt(
            enteredCheckDigit === ""
              ? (expectedCheckDigit ?? 0)
              : enteredCheckDigit,
          )
        : undefined,
      // Never send an empty or unknown regime: Candid rejects it as an invalid
      // variant before the backend can normalize it.
      fiscalRegime: normalizeFiscalRegime(draft.fiscalRegime),
      taxResponsibility: normalizeTaxResponsibility(draft.taxResponsibility),
      address: draft.address.trim(),
      city: draft.city.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim() || undefined,
      website: draft.website.trim() || undefined,
      // An empty logo is omitted so the backend stores null, never "".
      logoUrl: draft.logoUrl.trim() || undefined,
      taxRate: BigInt(Math.round(taxRateRaw === "" ? 19 : taxRateNumber)),
    };
    saveMutation.mutate(input, {
      onSuccess: () => toast.success("Datos de la empresa guardados"),
      onError: (error) =>
        toast.error("No se pudieron guardar los datos", {
          description: errorMessage(error),
        }),
    });
  }

  if (profileQuery.isLoading) {
    return (
      <Card data-ocid="company.form.card" className="rounded-lg shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="font-display text-base tracking-tight">
            Datos de la empresa
          </CardTitle>
          <CardDescription>
            Información fiscal y de contacto que aparece en tus documentos.
          </CardDescription>
        </CardHeader>
        <CardContent
          data-ocid="company.form.loading_state"
          className="grid gap-4 pt-6 sm:grid-cols-2"
        >
          {Array.from({ length: 8 }, (_, i) => `company-skeleton-${i}`).map(
            (id) => (
              <div key={id} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ),
          )}
        </CardContent>
      </Card>
    );
  }

  if (profileQuery.isError) {
    return (
      <Card data-ocid="company.form.card" className="rounded-lg shadow-none">
        <CardContent
          data-ocid="company.form.error_state"
          className="flex flex-col items-start gap-3 pt-6"
        >
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No se pudieron cargar los datos de la empresa.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void profileQuery.refetch()}
            data-ocid="company.form.retry_button"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-ocid="company.form.card" className="rounded-lg shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <CardTitle className="font-display text-base tracking-tight">
              Datos de la empresa
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "Datos fiscales conforme a la norma colombiana y la resolución DIAN. Alimentan el encabezado de tus documentos."
                : "Solo un administrador puede editar estos datos."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-2"
          data-ocid="company.form"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-legal-name">Razón social</Label>
            <Input
              id="company-legal-name"
              value={draft.legalName}
              onChange={(event) => update("legalName", event.target.value)}
              placeholder="HR SOLUCIONES INTEGRALES S.A.S."
              autoComplete="organization"
              aria-invalid={submitted && !!errors.legalName}
              disabled={!isAdmin}
              data-ocid="company.legal_name_input"
            />
            {submitted && errors.legalName ? (
              <p
                data-ocid="company.legal_name_error"
                className="text-xs text-destructive"
              >
                {errors.legalName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-trade-name">Nombre comercial</Label>
            <Input
              id="company-trade-name"
              value={draft.tradeName}
              onChange={(event) => update("tradeName", event.target.value)}
              placeholder="Taller HR Motos"
              disabled={!isAdmin}
              data-ocid="company.trade_name_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-document-type">Tipo de documento</Label>
            <Select
              value={draft.documentType}
              onValueChange={(value) =>
                update("documentType", normalizeDocumentType(value))
              }
              disabled={!isAdmin}
            >
              <SelectTrigger
                id="company-document-type"
                data-ocid="company.document_type_select"
              >
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-tax-id">Número de documento</Label>
            <Input
              id="company-tax-id"
              value={draft.taxId}
              onChange={(event) => update("taxId", event.target.value)}
              placeholder="900123456"
              inputMode="numeric"
              className="data-rail"
              aria-invalid={submitted && !!errors.taxId}
              disabled={!isAdmin}
              data-ocid="company.tax_id_input"
            />
            {submitted && errors.taxId ? (
              <p
                data-ocid="company.tax_id_error"
                className="text-xs text-destructive"
              >
                {errors.taxId}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-check-digit">Dígito de verificación</Label>
            <Input
              id="company-check-digit"
              value={draft.checkDigit}
              onChange={(event) => update("checkDigit", event.target.value)}
              placeholder="7"
              inputMode="numeric"
              maxLength={1}
              className="data-rail"
              aria-invalid={submitted && !checkDigitValid}
              aria-describedby="company-check-digit-help"
              disabled={!isAdmin || !isNit}
              data-ocid="company.check_digit_input"
            />
            <p
              id="company-check-digit-help"
              className="text-xs text-muted-foreground"
            >
              {isNit
                ? "Dígito calculado con el algoritmo módulo 11 de la DIAN. Si lo dejas vacío se calcula automáticamente."
                : "Solo aplica al NIT."}
            </p>
            {submitted && !checkDigitValid ? (
              <p
                data-ocid="company.check_digit_error"
                className="text-xs text-destructive"
              >
                {expectedCheckDigit === null
                  ? "Ingresa el número de documento para validar el dígito de verificación."
                  : `El dígito de verificación no coincide con el número de documento. Para ${formatNitBase(
                      draft.taxId,
                    )} debe ser ${expectedCheckDigit}.`}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-fiscal-regime">Régimen fiscal</Label>
            <Select
              value={draft.fiscalRegime}
              onValueChange={(value) => {
                const regime = selectedFiscalRegime(value);
                if (regime) update("fiscalRegime", regime);
              }}
              disabled={!isAdmin}
            >
              <SelectTrigger
                id="company-fiscal-regime"
                data-ocid="company.fiscal_regime_select"
              >
                <SelectValue placeholder="Selecciona el régimen" />
              </SelectTrigger>
              <SelectContent>
                {FISCAL_REGIME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-tax-responsibility">
              Responsabilidad tributaria
            </Label>
            <Select
              value={draft.taxResponsibility}
              onValueChange={(value) =>
                update("taxResponsibility", normalizeTaxResponsibility(value))
              }
              disabled={!isAdmin}
            >
              <SelectTrigger
                id="company-tax-responsibility"
                data-ocid="company.tax_responsibility_select"
              >
                <SelectValue placeholder="Selecciona la responsabilidad" />
              </SelectTrigger>
              <SelectContent>
                {TAX_RESPONSIBILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-address">Dirección</Label>
            <Input
              id="company-address"
              value={draft.address}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Calle 45 #12-30"
              autoComplete="street-address"
              aria-invalid={submitted && !!errors.address}
              disabled={!isAdmin}
              data-ocid="company.address_input"
            />
            {submitted && errors.address ? (
              <p
                data-ocid="company.address_error"
                className="text-xs text-destructive"
              >
                {errors.address}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-city">Ciudad / Departamento</Label>
            <Input
              id="company-city"
              value={draft.city}
              onChange={(event) => update("city", event.target.value)}
              placeholder="Bogotá D.C., Cundinamarca"
              autoComplete="address-level2"
              aria-invalid={submitted && !!errors.city}
              disabled={!isAdmin}
              data-ocid="company.city_input"
            />
            {submitted && errors.city ? (
              <p
                data-ocid="company.city_error"
                className="text-xs text-destructive"
              >
                {errors.city}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-phone">Teléfono</Label>
            <Input
              id="company-phone"
              value={draft.phone}
              onChange={(event) => update("phone", event.target.value)}
              placeholder="+57 300 000 0000"
              inputMode="tel"
              className="data-rail"
              aria-invalid={submitted && !!errors.phone}
              disabled={!isAdmin}
              data-ocid="company.phone_input"
            />
            {submitted && errors.phone ? (
              <p
                data-ocid="company.phone_error"
                className="text-xs text-destructive"
              >
                {errors.phone}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-email">Correo electrónico</Label>
            <Input
              id="company-email"
              type="email"
              value={draft.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="contacto@hrsolucionesintegrales.com"
              autoComplete="email"
              aria-invalid={submitted && !!errors.email}
              disabled={!isAdmin}
              data-ocid="company.email_input"
            />
            {submitted && errors.email ? (
              <p
                data-ocid="company.email_error"
                className="text-xs text-destructive"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-website">Sitio web</Label>
            <Input
              id="company-website"
              value={draft.website}
              onChange={(event) => update("website", event.target.value)}
              placeholder="https://hrsolucionesintegrales.com"
              autoComplete="url"
              disabled={!isAdmin}
              data-ocid="company.website_input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-tax-rate">Tarifa de IVA (%)</Label>
            <Input
              id="company-tax-rate"
              value={draft.taxRatePercent}
              onChange={(event) => update("taxRatePercent", event.target.value)}
              placeholder="19"
              inputMode="decimal"
              aria-invalid={!taxRateValid}
              aria-describedby="company-tax-rate-help"
              className="data-rail"
              disabled={!isAdmin}
              data-ocid="company.tax_rate_input"
            />
            <p
              id="company-tax-rate-help"
              className="text-xs text-muted-foreground"
            >
              Se aplica al subtotal de cada factura. Ejemplo: 19 para 19%. Si lo
              dejas vacío se usa 19%.
            </p>
            {!taxRateValid ? (
              <p
                data-ocid="company.tax_rate_error"
                className="text-xs text-destructive"
              >
                Ingresa un porcentaje entre 0 y 100.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-logo">Logo</Label>
            <div className="flex flex-wrap items-center gap-4">
              <div
                data-ocid="company.logo.preview"
                className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary"
              >
                {draft.logoUrl ? (
                  <img
                    src={draft.logoUrl}
                    alt="Vista previa del logo de la empresa"
                    className="size-full object-contain"
                  />
                ) : (
                  <ImagePlus
                    className="size-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  id="company-logo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleLogoChange}
                  disabled={!isAdmin || uploading}
                  data-ocid="company.logo.input"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!isAdmin || uploading}
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="company.logo.upload_button"
                    className="gap-1.5"
                  >
                    {uploading ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ImagePlus className="size-4" aria-hidden="true" />
                    )}
                    {uploading
                      ? uploadProgress > 0
                        ? `Subiendo… ${uploadProgress}%`
                        : "Subiendo…"
                      : "Subir logo"}
                  </Button>
                  {draft.logoUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!isAdmin || uploading}
                      onClick={() => update("logoUrl", "")}
                      data-ocid="company.logo.remove_button"
                      className="gap-1.5 text-muted-foreground"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Quitar
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG o SVG. Se muestra en el encabezado de tus documentos.
                </p>
                {uploadError ? (
                  <p
                    data-ocid="company.logo.error_state"
                    className="text-xs text-destructive"
                  >
                    {uploadError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {isAdmin ? (
            <div className="flex items-center justify-end gap-3 sm:col-span-2">
              {profileQuery.data ? (
                <p className="mr-auto text-xs text-muted-foreground">
                  Última actualización:{" "}
                  {formatDate(profileQuery.data.updatedAt)}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={!canSubmit}
                data-ocid="company.save_button"
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {saveMutation.isPending ? "Guardando…" : "Guardar datos"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function CompanyDocumentPreview() {
  const profileQuery = useCompanyProfile();
  const profile = profileQuery.data;

  const companyName = profile?.legalName || "HR SOLUCIONES INTEGRALES";
  const contactParts = [
    profile?.address,
    profile?.city,
    profile?.phone,
    profile?.email,
    profile?.website,
  ].filter((part): part is string => !!part && part.trim() !== "");
  const companyContact = contactParts.join(" · ");

  const fiscalLines = profile
    ? [
        formatNit(profile.taxId, profile.checkDigit),
        fiscalRegimeLabel(profile.fiscalRegime),
        taxResponsibilityLabel(profile.taxResponsibility),
      ]
    : [];

  const meta = [
    { label: "Cliente", value: "María Fernanda Ríos" },
    { label: "Documento", value: "FAC-000128", rail: true },
    { label: "Fecha", value: formatDate(profile?.updatedAt) },
    {
      label: "NIT",
      value: profile ? formatNit(profile.taxId, profile.checkDigit) : "—",
      rail: true,
    },
  ];

  const lines = [
    {
      description: "Cambio de aceite y filtro",
      quantity: 1,
      unitPrice: 450,
      amount: 450,
    },
    {
      description: "Pastillas de freno delanteras",
      quantity: 2,
      unitPrice: 320,
      amount: 640,
    },
  ];

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const ivaResponsible = isIvaResponsible(profile?.fiscalRegime);
  const taxRate = ivaResponsible ? Number(profile?.taxRate ?? 19n) : 0;
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal + tax;

  const totals = [
    {
      label: "Subtotal",
      value: formatMoney(BigInt(Math.round(subtotal * 100))),
    },
    ...(ivaResponsible
      ? [
          {
            label: `IVA (${formatTaxRate(profile?.taxRate ?? 19n)})`,
            value: formatMoney(BigInt(Math.round(tax * 100))),
          },
        ]
      : []),
    {
      label: "Total",
      value: formatMoney(BigInt(Math.round(total * 100))),
      emphasis: true,
    },
  ];

  return (
    <Card data-ocid="company.preview.card" className="rounded-lg shadow-none">
      <CardHeader className="border-b border-border">
        <CardTitle className="font-display text-base tracking-tight">
          Vista previa en documentos
        </CardTitle>
        <CardDescription>
          Así aparecen los datos fiscales de la empresa en el encabezado y pie
          de tus facturas, cotizaciones y tirillas.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <DocumentPreview
          title="Factura"
          number="FAC-000128"
          companyName={companyName}
          companyLogoUrl={profile?.logoUrl}
          companyContact={companyContact || undefined}
          companyFiscal={fiscalLines}
          meta={meta}
          lines={lines}
          totals={totals}
          footer={`${companyName} · ${
            profile
              ? formatNit(profile.taxId, profile.checkDigit)
              : "NIT pendiente"
          }`}
          format="a4"
          ocid="company.preview"
        />
      </CardContent>
    </Card>
  );
}

export function CompanyPage() {
  return (
    <div data-ocid="company.page" className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow="Administración"
        title="Empresa"
        description="Datos fiscales y de contacto que aparecen en tus documentos."
      />

      <div className="mt-6 flex flex-col gap-5">
        <CompanyForm />
        <CompanyDocumentPreview />
      </div>
    </div>
  );
}

export default CompanyPage;
