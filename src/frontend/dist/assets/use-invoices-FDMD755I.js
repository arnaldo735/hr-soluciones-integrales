import { u as useBackend, i as useAuth, aj as useQueryClient, ak as useMutation } from "./index-CGU00UGU.js";
function useDeleteInvoice() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteInvoice(token, invoiceId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
      void queryClient.invalidateQueries({ queryKey: ["invoice"] });
      void queryClient.invalidateQueries({ queryKey: ["receivables"] });
      void queryClient.invalidateQueries({ queryKey: ["receivable-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["accounting-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["accounting-report"] });
      void queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });
}
export {
  useDeleteInvoice as u
};
