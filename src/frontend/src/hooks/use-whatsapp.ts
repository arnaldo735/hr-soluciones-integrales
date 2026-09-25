import { useBackend } from "@/hooks/use-backend";
import { formatDate, formatMoney, formatNit } from "@/lib/format";
import { downloadContactDocumentPdf, pdfCompanyFromProfile } from "@/lib/pdf";
import type {
  ContactDocument,
  ContactDocumentSection,
  Customer,
  DocumentFormat,
  Id,
  Supplier,
  WhatsAppMessageInput,
  WhatsAppMessageResult,
} from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Prepara el mensaje de WhatsApp de un contacto. El backend resuelve el
 * teléfono normalizado y el texto sugerido según el tipo de contacto y el
 * contexto (cita, orden, cotización, factura, cobro o servicio).
 *
 * Es una consulta del backend expuesta como mutación para que el llamador
 * pueda dispararla bajo demanda al abrir el diálogo.
 */
export function usePrepareWhatsAppMessage() {
  const { actor } = useBackend();

  return useMutation({
    mutationFn: async (
      input: WhatsAppMessageInput,
    ): Promise<WhatsAppMessageResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.prepareWhatsAppMessage(input);
    },
  });
}

/** Builds the printable ficha for a customer from its backend record. */
export function customerContactDocument(
  customer: Customer,
  motorcycles: ContactDocumentSection["rows"] = [],
): ContactDocument {
  const meta = [
    { label: "Documento", value: customer.document?.trim() || "—", rail: true },
    { label: "Teléfono", value: customer.phone || "—", rail: true },
    { label: "Correo", value: customer.email?.trim() || "—" },
    { label: "Dirección", value: customer.address?.trim() || "—" },
    { label: "Cliente desde", value: formatDate(customer.createdAt) },
  ];

  const sections: ContactDocumentSection[] = [
    {
      key: "motorcycles",
      title: "Motos registradas",
      columns: ["Marca", "Modelo", "Placa", "Año", "Kilometraje"],
      rows: motorcycles,
      emptyNote: "Sin motos registradas.",
    },
  ];

  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: `CLI-${customer.id.toString()}`,
    name: customer.name,
    meta,
    sections,
    footer: `Ficha de cliente generada para ${customer.name}.`,
  };
}

/** Builds the printable ficha for a supplier from its backend record. */
export function supplierContactDocument(supplier: Supplier): ContactDocument {
  const meta = [
    {
      label: "NIT / Documento",
      value: supplier.taxId?.trim() || "—",
      rail: true,
    },
    { label: "Contacto", value: supplier.contactName?.trim() || "—" },
    { label: "Teléfono", value: supplier.phone || "—", rail: true },
    { label: "Correo", value: supplier.email?.trim() || "—" },
    { label: "Dirección", value: supplier.address?.trim() || "—" },
    { label: "Proveedor desde", value: formatDate(supplier.createdAt) },
  ];

  return {
    kind: "supplier",
    title: "Ficha de proveedor",
    number: `PRV-${supplier.id.toString()}`,
    name: supplier.name,
    meta,
    sections: [],
    footer: `Ficha de proveedor generada para ${supplier.name}.`,
  };
}

/** Formats a motorcycle row for the customer ficha section table. */
export function motorcycleRow(motorcycle: {
  brand: string;
  model: string;
  plate: string;
  year: bigint;
  mileage: bigint;
}): string[] {
  return [
    motorcycle.brand || "—",
    motorcycle.model || "—",
    motorcycle.plate || "—",
    motorcycle.year.toString(),
    `${motorcycle.mileage.toString()} km`,
  ];
}

/**
 * Genera y descarga el PDF de una ficha de contacto en el formato elegido,
 * reutilizando el encabezado y pie de empresa compartidos. Devuelve el nombre
 * del archivo descargado para que el llamador pueda mencionarlo en el mensaje.
 *
 * El perfil de empresa se resuelve bajo demanda con `queryClient.fetchQuery`
 * (misma clave que `useCompanyProfile`) en lugar de suscribirse durante el
 * render: así montar un botón de ficha o de WhatsApp no dispara la consulta
 * hasta que el usuario realmente genera el documento.
 */
export function useContactDocumentPdf() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();

  const download = useCallback(
    async (
      document: ContactDocument,
      format: DocumentFormat,
    ): Promise<string> => {
      const profile = await queryClient.fetchQuery({
        queryKey: ["company-profile"],
        queryFn: async () => {
          if (!actor) return null;
          return actor.getCompanyProfile();
        },
        staleTime: Number.POSITIVE_INFINITY,
      });
      const company = pdfCompanyFromProfile(profile);
      await downloadContactDocumentPdf(document, company, format);
      const slug = document.kind === "customer" ? "cliente" : "proveedor";
      return `ficha-${slug}-${document.number}.pdf`;
    },
    [actor, queryClient],
  );

  return { download, isCompanyLoading: isFetching };
}

/** Re-exported so callers can build a company header without importing pdf.ts. */
export { pdfCompanyFromProfile };

/** Convenience re-export used by the WhatsApp attachment flow. */
export type { ContactDocument, DocumentFormat, Id };

/** Formats a money value for a contact document section, in cents. */
export function contactMoney(cents: bigint | undefined | null): string {
  return formatMoney(cents);
}

/** Formats a NIT for a contact document, falling back to the raw value. */
export function contactTaxId(
  taxId: string | undefined,
  checkDigit?: bigint | null,
): string {
  if (!taxId || taxId.trim() === "") return "—";
  return formatNit(taxId, checkDigit);
}

export type { WhatsAppMessageInput, WhatsAppMessageResult };
