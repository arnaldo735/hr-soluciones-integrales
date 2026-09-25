import { useBackend } from "@/hooks/use-backend";
import type {
  CreateInvoiceInput,
  Id,
  InvoiceApplyResult,
  InvoiceFilter,
  InvoiceReviewInput,
  InvoiceSort,
  PurchaseInvoice,
  PurchaseInvoicePage,
  Supplier,
  SupplierInput,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Query key root shared by every purchase-invoice query. */
const INVOICE_KEY = "purchase-invoices";

/** Query keys invalidated whenever an invoice changes inventory or its state. */
function invalidateInvoiceData(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  void queryClient.invalidateQueries({ queryKey: [INVOICE_KEY] });
  // Confirming an invoice creates or updates parts, lots and movements, so the
  // inventory surfaces must refetch instead of serving cached snapshots.
  void queryClient.invalidateQueries({ queryKey: ["parts"] });
  void queryClient.invalidateQueries({ queryKey: ["part"] });
  void queryClient.invalidateQueries({ queryKey: ["low-stock"] });
  void queryClient.invalidateQueries({ queryKey: ["movements"] });
  void queryClient.invalidateQueries({ queryKey: ["inventory-valuation"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
}

export interface PurchaseInvoiceListParams {
  /** Optional status filter; `null` lists every status. */
  status: InvoiceFilter["status"] | null;
  /** Optional supplier filter; `null` lists every supplier. */
  supplierId: Id | null;
  /** Free-text search over supplier, number and file name. */
  search: string;
  /** Sort field; defaults to the most recently created invoice. */
  sort: InvoiceSort;
  /** Zero-based offset of the first row to return. */
  offset: number;
  /** Maximum number of rows to return. */
  limit: number;
}

/** Página de facturas de compra con filtros, orden y paginación. */
export function usePurchaseInvoices(params: PurchaseInvoiceListParams) {
  const { actor, isFetching } = useBackend();
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      INVOICE_KEY,
      "list",
      params.status ?? "all",
      params.supplierId?.toString() ?? "all",
      search,
      params.sort,
      params.offset,
      params.limit,
    ],
    queryFn: async (): Promise<PurchaseInvoicePage> => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter: InvoiceFilter = {
        status: params.status ?? undefined,
        supplierId: params.supplierId ?? undefined,
        search: search.length > 0 ? search : undefined,
      };
      return actor.listPurchaseInvoices(
        filter,
        params.sort,
        BigInt(params.offset),
        BigInt(params.limit),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

/** Detalle de una factura de compra procesada. */
export function usePurchaseInvoice(invoiceId: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: [INVOICE_KEY, "detail", invoiceId?.toString() ?? "none"],
    queryFn: async (): Promise<PurchaseInvoice | null> => {
      if (!actor || invoiceId === null) return null;
      return actor.getPurchaseInvoice(invoiceId);
    },
    enabled: !!actor && !isFetching && invoiceId !== null,
  });
}

/** Registra el archivo subido y crea el borrador de factura de compra. */
export function useCreatePurchaseInvoiceDraft() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput): Promise<PurchaseInvoice> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPurchaseInvoiceDraft(input);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    },
  });
}

/** Ejecuta la extracción de datos sobre una factura cargada. */
export function useRunPurchaseInvoiceExtraction() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: Id): Promise<PurchaseInvoice> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.runPurchaseInvoiceExtraction(invoiceId);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    },
  });
}

/** Guarda la revisión manual del encabezado y las líneas extraídas. */
export function useUpdatePurchaseInvoiceReview() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      invoiceId: Id;
      input: InvoiceReviewInput;
    }): Promise<PurchaseInvoice> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updatePurchaseInvoiceReview(
        variables.invoiceId,
        variables.input,
      );
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    },
  });
}

/** Confirma la factura y aplica sus líneas al inventario. */
export function useConfirmPurchaseInvoice() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: Id): Promise<InvoiceApplyResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.confirmPurchaseInvoice(invoiceId);
    },
    onSuccess: () => {
      invalidateInvoiceData(queryClient);
    },
  });
}

/**
 * Crea un proveedor durante la revisión de una factura de compra. El proveedor
 * entra al directorio y queda disponible para el filtro del historial.
 */
export function useCreateSupplier() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SupplierInput): Promise<Supplier> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createSupplier(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
    },
  });
}
