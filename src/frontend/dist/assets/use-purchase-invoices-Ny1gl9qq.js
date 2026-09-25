import { aV as ExtractionStatus, aM as PurchaseInvoiceStatus, aN as LineApplyStatus, aO as LineMatchStatus, j as jsxRuntimeExports, ae as cn, k as useBackend, ak as useQueryClient, al as useMutation, l as useQuery } from "./index-CzQEXdHP.js";
import { S as StatusBadge } from "./StatusBadge-jkc1GroD.js";
const INVOICE_STATUS_LABELS = {
  [PurchaseInvoiceStatus.pending]: "Pendiente",
  [PurchaseInvoiceStatus.confirmed]: "Confirmada",
  [PurchaseInvoiceStatus.withErrors]: "Con errores"
};
const INVOICE_STATUS_TONES = {
  [PurchaseInvoiceStatus.pending]: "pending",
  [PurchaseInvoiceStatus.confirmed]: "confirmed",
  [PurchaseInvoiceStatus.withErrors]: "rejected"
};
const EXTRACTION_STATUS_LABELS = {
  [ExtractionStatus.pending]: "Sin extraer",
  [ExtractionStatus.extracting]: "Extrayendo",
  [ExtractionStatus.extracted]: "Extraída",
  [ExtractionStatus.failed]: "Falló la extracción"
};
const LINE_APPLY_LABELS = {
  [LineApplyStatus.pending]: "Sin aplicar",
  [LineApplyStatus.created]: "Creado",
  [LineApplyStatus.updated]: "Actualizado",
  [LineApplyStatus.error]: "Error"
};
const LINE_APPLY_TONES = {
  [LineApplyStatus.pending]: "neutral",
  [LineApplyStatus.created]: "accepted",
  [LineApplyStatus.updated]: "sent",
  [LineApplyStatus.error]: "rejected"
};
const LINE_MATCH_LABELS = {
  [LineMatchStatus.new]: "Repuesto nuevo",
  [LineMatchStatus.existing]: "Repuesto existente"
};
const FILE_KIND_LABELS = {
  pdf: "PDF",
  image: "Imagen"
};
function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / 1024)} KB`;
  }
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / (1024 * 1024))} MB`;
}
function InvoiceStatusBadge({
  status,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    StatusBadge,
    {
      label: INVOICE_STATUS_LABELS[status],
      tone: INVOICE_STATUS_TONES[status],
      className: cn(
        "font-mono text-[10px] uppercase tracking-wider",
        className
      )
    }
  );
}
const INVOICE_KEY = "purchase-invoices";
function invalidateInvoiceData(queryClient) {
  void queryClient.invalidateQueries({ queryKey: [INVOICE_KEY] });
  void queryClient.invalidateQueries({ queryKey: ["parts"] });
  void queryClient.invalidateQueries({ queryKey: ["part"] });
  void queryClient.invalidateQueries({ queryKey: ["low-stock"] });
  void queryClient.invalidateQueries({ queryKey: ["movements"] });
  void queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
}
function usePurchaseInvoices(params) {
  var _a;
  const { actor, isFetching } = useBackend();
  const search = params.search.trim();
  return useQuery({
    queryKey: [
      INVOICE_KEY,
      "list",
      params.status ?? "all",
      ((_a = params.supplierId) == null ? void 0 : _a.toString()) ?? "all",
      search,
      params.sort,
      params.offset,
      params.limit
    ],
    queryFn: async () => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter = {
        status: params.status ?? void 0,
        supplierId: params.supplierId ?? void 0,
        search: search.length > 0 ? search : void 0
      };
      return actor.listPurchaseInvoices(
        filter,
        params.sort,
        BigInt(params.offset),
        BigInt(params.limit)
      );
    },
    enabled: !!actor && !isFetching
  });
}
function usePurchaseInvoice(invoiceId) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: [INVOICE_KEY, "detail", (invoiceId == null ? void 0 : invoiceId.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || invoiceId === null) return null;
      return actor.getPurchaseInvoice(invoiceId);
    },
    enabled: !!actor && !isFetching && invoiceId !== null
  });
}
function useCreatePurchaseInvoiceDraft() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPurchaseInvoiceDraft(input);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    }
  });
}
function useRunPurchaseInvoiceExtraction() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.runPurchaseInvoiceExtraction(invoiceId);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    }
  });
}
function useUpdatePurchaseInvoiceReview() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updatePurchaseInvoiceReview(
        variables.invoiceId,
        variables.input
      );
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    }
  });
}
function useConfirmPurchaseInvoice() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.confirmPurchaseInvoice(invoiceId);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    }
  });
}
function useCreateSupplier() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createSupplier(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
    }
  });
}
export {
  EXTRACTION_STATUS_LABELS as E,
  FILE_KIND_LABELS as F,
  InvoiceStatusBadge as I,
  LINE_APPLY_TONES as L,
  useCreatePurchaseInvoiceDraft as a,
  useRunPurchaseInvoiceExtraction as b,
  useUpdatePurchaseInvoiceReview as c,
  useConfirmPurchaseInvoice as d,
  useCreateSupplier as e,
  usePurchaseInvoice as f,
  formatFileSize as g,
  LINE_APPLY_LABELS as h,
  LINE_MATCH_LABELS as i,
  usePurchaseInvoices as u
};
