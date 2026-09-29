import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type { Id, PartLookupResult } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Resuelve un código de barras o SKU a un repuesto del catálogo usando
 * `findPartByCode` del backend. Devuelve el resultado tipado
 * (`found` / `notFound`) para que el llamador decida si agrega el repuesto a
 * la línea o muestra el aviso de "producto no encontrado".
 *
 * Se expone como mutación porque la resolución es una acción puntual disparada
 * por el escaneo o la entrada manual, no un dato que deba cachearse.
 */
export function useFindPartByCode() {
  const { actor } = useBackend();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (code: string): Promise<PartLookupResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.findPartByCode(token, code);
    },
  });
}

/**
 * Elimina una factura pendiente de pago y sin abonos registrados. El backend
 * rechaza la operación cuando la factura ya tiene pagos; el mensaje de error
 * se propaga tal cual para mostrarlo en la interfaz.
 */
export function useDeleteInvoice() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: Id): Promise<boolean> => {
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
    },
  });
}
