import {
  type CompanyHeaderData,
  companyContactLine,
  companyFiscalLines,
} from "@/lib/company-header";
import { cn } from "@/lib/utils";

interface CompanyHeaderProps {
  /** The complete company identity block, or `null` when unconfigured. */
  header: CompanyHeaderData | null;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /**
   * `document` renders the compact printable header used inside
   * `DocumentPreview`; `panel` renders the larger on-screen nameplate.
   */
  variant?: "document" | "panel";
  /** Extra classes for the outer element. */
  className?: string;
}

/**
 * The complete company header shared by every printable document and the
 * on-screen nameplate: logo, razón social, nombre comercial, NIT con dígito
 * de verificación, régimen fiscal, responsabilidad tributaria, dirección,
 * ciudad, teléfono, correo y sitio web.
 *
 * Every field is optional and omitted cleanly when the company has not
 * configured it, so the header never shows an orphan label or an empty gap.
 */
export function CompanyHeader({
  header,
  ocid,
  variant = "document",
  className,
}: CompanyHeaderProps) {
  if (!header) return null;

  const contact = companyContactLine(header);
  const fiscal = companyFiscalLines(header);
  const displayName = header.tradeName ?? header.legalName;
  const showTradeName =
    header.tradeName !== undefined && header.tradeName !== header.legalName;

  if (variant === "panel") {
    return (
      <header data-ocid={ocid} className={cn("company-header", className)}>
        <div className="company-header-logo" aria-hidden="true">
          {header.logoUrl ? (
            <img
              src={header.logoUrl}
              alt=""
              data-ocid={`${ocid}.logo`}
              className="size-full rounded-md object-cover"
            />
          ) : (
            displayName.slice(0, 2).toUpperCase()
          )}
        </div>
        <h2 className="company-header-name">{displayName}</h2>
        {showTradeName ? (
          <p className="company-header-legal">{header.legalName}</p>
        ) : null}
        <dl className="company-header-rail">
          {header.taxId ? (
            <div className="company-header-field">
              <dt className="sr-only">NIT</dt>
              <dd>
                <span className="text-muted-foreground">NIT: </span>
                <strong>{header.taxId}</strong>
              </dd>
            </div>
          ) : null}
          {header.fiscalRegime ? (
            <div className="company-header-field">
              <dt className="sr-only">Régimen</dt>
              <dd>
                <span className="text-muted-foreground">Régimen: </span>
                <strong>{header.fiscalRegime}</strong>
              </dd>
            </div>
          ) : null}
          {header.taxResponsibility ? (
            <div className="company-header-field">
              <dt className="sr-only">Responsabilidad</dt>
              <dd>
                <span className="text-muted-foreground">Responsabilidad: </span>
                <strong>{header.taxResponsibility}</strong>
              </dd>
            </div>
          ) : null}
          {header.phone ? (
            <div className="company-header-field">
              <dt className="sr-only">Teléfono</dt>
              <dd>
                <span className="text-muted-foreground">Tel: </span>
                <strong>{header.phone}</strong>
              </dd>
            </div>
          ) : null}
          {header.email ? (
            <div className="company-header-field">
              <dt className="sr-only">Correo</dt>
              <dd>
                <span className="text-muted-foreground">Correo: </span>
                <strong>{header.email}</strong>
              </dd>
            </div>
          ) : null}
          {header.website ? (
            <div className="company-header-field">
              <dt className="sr-only">Sitio web</dt>
              <dd>
                <span className="text-muted-foreground">Web: </span>
                <strong>{header.website}</strong>
              </dd>
            </div>
          ) : null}
        </dl>
      </header>
    );
  }

  return (
    <div data-ocid={ocid} className={cn("company-doc-header", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {header.logoUrl ? (
          <img
            src={header.logoUrl}
            alt=""
            data-ocid={`${ocid}.logo`}
            className="size-12 shrink-0 object-contain"
          />
        ) : null}
        <div className="min-w-0">
          <p className="doc-title font-display text-lg font-bold tracking-tight">
            {header.legalName}
          </p>
          {showTradeName ? (
            <p className="doc-meta text-xs">{header.tradeName}</p>
          ) : null}
          {contact ? (
            <p data-ocid={`${ocid}.contact`} className="doc-meta text-xs">
              {contact}
            </p>
          ) : null}
          {fiscal.length > 0 ? (
            <div
              data-ocid={`${ocid}.fiscal_block`}
              className="mt-1 space-y-0.5"
            >
              {fiscal.map((line) => (
                <p key={line} className="doc-meta text-xs">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
