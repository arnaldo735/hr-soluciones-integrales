import { k as useBackend, l as useAuth, ao as useQueryClient, ap as useMutation, m as useQuery } from "./index-EqGEeyjs.js";
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
  const { token } = useAuth();
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
        token,
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
  const { token } = useAuth();
  return useQuery({
    queryKey: [INVOICE_KEY, "detail", (invoiceId == null ? void 0 : invoiceId.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || invoiceId === null) return null;
      return actor.getPurchaseInvoice(token, invoiceId);
    },
    enabled: !!actor && !isFetching && invoiceId !== null
  });
}
function useCreatePurchaseInvoiceDraft() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPurchaseInvoiceDraft(token, input);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    }
  });
}
function useRunPurchaseInvoiceExtraction() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.runPurchaseInvoiceExtraction(token, invoiceId);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    }
  });
}
function useUpdatePurchaseInvoiceReview() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updatePurchaseInvoiceReview(
        token,
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
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.confirmPurchaseInvoice(token, invoiceId);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    }
  });
}
function useDeletePurchase() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (purchaseId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deletePurchase(token, purchaseId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["purchases"] });
      void queryClient.invalidateQueries({ queryKey: ["purchase"] });
      void queryClient.invalidateQueries({ queryKey: [INVOICE_KEY] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      void queryClient.invalidateQueries({ queryKey: ["low-stock"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
      void queryClient.invalidateQueries({ queryKey: ["accounting-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["accounting-report"] });
      void queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });
}
function useCreateSupplier() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createSupplier(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
    }
  });
}
export {
  usePurchaseInvoices as a,
  useCreatePurchaseInvoiceDraft as b,
  useRunPurchaseInvoiceExtraction as c,
  useUpdatePurchaseInvoiceReview as d,
  useConfirmPurchaseInvoice as e,
  useCreateSupplier as f,
  usePurchaseInvoice as g,
  useDeletePurchase as u
};
