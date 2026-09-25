import { DocumentPreview } from "@/components/DocumentPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackend } from "@/hooks/use-backend";
import { useContactDocumentPdf } from "@/hooks/use-whatsapp";
import { formatNit } from "@/lib/format";
import type {
  CompanyProfile,
  ContactDocument,
  DocumentFormat,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";

interface ContactDocumentPreviewProps {
  /** Ficha imprimible del cliente o del proveedor. */
  document: ContactDocument;
  /** Identificador determinista del botón que abre la vista previa. */
  ocid: string;
  /** Etiqueta del botón; por defecto «Ver ficha». */
  label?: string;
  /** Variante visual del botón. */
  variant?: "default" | "outline" | "ghost";
  /** Tamaño del botón. */
  size?: "default" | "sm" | "icon";
  /** Clases adicionales para el botón. */
  className?: string;
}

/**
 * Botón + diálogo de vista previa de una ficha de contacto (cliente o
 * proveedor). Reutiliza `DocumentPreview` para mostrar la ficha en hoja A4 o
 * tirilla de 80 mm, con las acciones «Imprimir» y «Descargar PDF» generadas
 * por `downloadContactDocumentPdf` en el formato elegido, de modo que el
 * archivo descargado coincide exactamente con lo que se ve en pantalla.
 *
 * El contenido pesado (perfil de empresa y aplanado de secciones) se monta
 * solo cuando el diálogo está realmente abierto, para que pulsar el botón sea
 * instantáneo y no bloquee el render de la página que lo contiene.
 */
export function ContactDocumentPreview({
  document,
  ocid,
  label = "Ver ficha",
  variant = "outline",
  size = "sm",
  className,
}: ContactDocumentPreviewProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<DocumentFormat>("a4");
  const [isDownloading, setIsDownloading] = useState(false);

  const { download } = useContactDocumentPdf();

  function handleOpenChange(next: boolean) {
    if (next) setFormat("a4");
    setOpen(next);
  }

  async function handleDownloadPdf(nextFormat: DocumentFormat) {
    setIsDownloading(true);
    try {
      await download(document, nextFormat);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => handleOpenChange(true)}
        aria-label={`${label} de ${document.name}`}
        data-ocid={ocid}
        className={className}
      >
        <FileText className="size-4" aria-hidden="true" />
        {size === "icon" ? null : label}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          data-ocid={`${ocid}.dialog`}
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">{document.title}</DialogTitle>
            <DialogDescription>
              Vista previa fiel al tamaño de impresión. Elige hoja A4 o tirilla
              de 80 mm antes de imprimir o descargar.
            </DialogDescription>
          </DialogHeader>

          {open ? (
            <ContactDocumentPreviewBody
              document={document}
              format={format}
              ocid={ocid}
              isDownloading={isDownloading}
              onFormatChange={setFormat}
              onDownloadPdf={handleDownloadPdf}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ContactDocumentPreviewBodyProps {
  document: ContactDocument;
  format: DocumentFormat;
  ocid: string;
  isDownloading: boolean;
  onFormatChange: (format: DocumentFormat) => void;
  onDownloadPdf: (format: DocumentFormat) => void | Promise<void>;
}

/**
 * Cuerpo del diálogo. Se monta únicamente con el diálogo abierto, de modo que
 * la consulta del perfil de empresa y el aplanado de las secciones de la ficha
 * no se ejecutan durante el render de la página.
 */
function ContactDocumentPreviewBody({
  document,
  format,
  ocid,
  isDownloading,
  onFormatChange,
  onDownloadPdf,
}: ContactDocumentPreviewBodyProps) {
  const { actor, isFetching } = useBackend();

  const companyQuery = useQuery({
    queryKey: ["company-profile"],
    queryFn: async (): Promise<CompanyProfile | null> => {
      if (!actor) return null;
      return actor.getCompanyProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const profile = companyQuery.data;
  const companyName = profile?.legalName || "HR SOLUCIONES INTEGRALES";
  const companyContact = [
    profile?.address,
    profile?.city,
    profile?.phone,
    profile?.email,
  ]
    .filter((part): part is string => !!part && part.trim() !== "")
    .join(" · ");
  const companyFiscal = profile
    ? [
        formatNit(profile.taxId, profile.checkDigit),
        profile.fiscalRegime,
        profile.taxResponsibility,
      ].filter((line): line is string => !!line && line.trim() !== "")
    : [];

  const lines = useMemo(
    () =>
      document.sections.flatMap((section) =>
        section.rows.map((row) => ({
          description: row.join(" · "),
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        })),
      ),
    [document],
  );

  if (companyQuery.isLoading) {
    return (
      <div
        data-ocid={`${ocid}.loading_state`}
        className="space-y-3 py-2"
        aria-busy="true"
      >
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <DocumentPreview
      title={document.title}
      number={document.number}
      companyName={companyName}
      companyLogoUrl={profile?.logoUrl}
      companyContact={companyContact || undefined}
      companyFiscal={companyFiscal}
      meta={document.meta}
      lines={lines}
      totals={[]}
      footer={document.footer}
      format={format}
      ocid={`${ocid}.preview`}
      onFormatChange={onFormatChange}
      onDownloadPdf={onDownloadPdf}
      isDownloading={isDownloading}
    />
  );
}
