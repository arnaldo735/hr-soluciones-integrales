import { y as formatDate, k as useBackend, al as useMutation, ak as useQueryClient, s as reactExports } from "./index-CzQEXdHP.js";
import { p as pdfCompanyFromProfile, b as downloadContactDocumentPdf } from "./pdf-CwHQGLGj.js";
function usePrepareWhatsAppMessage() {
  const { actor } = useBackend();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.prepareWhatsAppMessage(input);
    }
  });
}
function customerContactDocument(customer, motorcycles = []) {
  var _a, _b, _c;
  const meta = [
    { label: "Documento", value: ((_a = customer.document) == null ? void 0 : _a.trim()) || "—", rail: true },
    { label: "Teléfono", value: customer.phone || "—", rail: true },
    { label: "Correo", value: ((_b = customer.email) == null ? void 0 : _b.trim()) || "—" },
    { label: "Dirección", value: ((_c = customer.address) == null ? void 0 : _c.trim()) || "—" },
    { label: "Cliente desde", value: formatDate(customer.createdAt) }
  ];
  const sections = [
    {
      key: "motorcycles",
      title: "Motos registradas",
      columns: ["Marca", "Modelo", "Placa", "Año", "Kilometraje"],
      rows: motorcycles,
      emptyNote: "Sin motos registradas."
    }
  ];
  return {
    kind: "customer",
    title: "Ficha de cliente",
    number: `CLI-${customer.id.toString()}`,
    name: customer.name,
    meta,
    sections,
    footer: `Ficha de cliente generada para ${customer.name}.`
  };
}
function supplierContactDocument(supplier) {
  var _a, _b, _c, _d;
  const meta = [
    {
      label: "NIT / Documento",
      value: ((_a = supplier.taxId) == null ? void 0 : _a.trim()) || "—",
      rail: true
    },
    { label: "Contacto", value: ((_b = supplier.contactName) == null ? void 0 : _b.trim()) || "—" },
    { label: "Teléfono", value: supplier.phone || "—", rail: true },
    { label: "Correo", value: ((_c = supplier.email) == null ? void 0 : _c.trim()) || "—" },
    { label: "Dirección", value: ((_d = supplier.address) == null ? void 0 : _d.trim()) || "—" },
    { label: "Proveedor desde", value: formatDate(supplier.createdAt) }
  ];
  return {
    kind: "supplier",
    title: "Ficha de proveedor",
    number: `PRV-${supplier.id.toString()}`,
    name: supplier.name,
    meta,
    sections: [],
    footer: `Ficha de proveedor generada para ${supplier.name}.`
  };
}
function motorcycleRow(motorcycle) {
  return [
    motorcycle.brand || "—",
    motorcycle.model || "—",
    motorcycle.plate || "—",
    motorcycle.year.toString(),
    `${motorcycle.mileage.toString()} km`
  ];
}
function useContactDocumentPdf() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const download = reactExports.useCallback(
    async (document, format) => {
      const profile = await queryClient.fetchQuery({
        queryKey: ["company-profile"],
        queryFn: async () => {
          if (!actor) return null;
          return actor.getCompanyProfile();
        },
        staleTime: Number.POSITIVE_INFINITY
      });
      const company = pdfCompanyFromProfile(profile);
      await downloadContactDocumentPdf(document, company, format);
      const slug = document.kind === "customer" ? "cliente" : "proveedor";
      return `ficha-${slug}-${document.number}.pdf`;
    },
    [actor, queryClient]
  );
  return { download, isCompanyLoading: isFetching };
}
export {
  usePrepareWhatsAppMessage as a,
  customerContactDocument as c,
  motorcycleRow as m,
  supplierContactDocument as s,
  useContactDocumentPdf as u
};
