import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { invalidateCashData } from "@/hooks/use-cash";
import type {
  Customer,
  Id,
  LaborInput,
  Lot,
  Money,
  Motorcycle,
  OrderAdvanceReceipt,
  OrderFilter,
  OrderPage,
  OrderPartInput,
  OrderPayment,
  OrderPaymentInput,
  OrderPhotoInput,
  OrderStatus,
  OrderView,
  PartPage,
  PartView,
  PaymentMethod,
} from "@/lib/types";
import { OrderStatus as OrderStatusEnum, PartSort } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Spanish labels for every workshop order status. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatusEnum.received]: "Recibida",
  [OrderStatusEnum.inRepair]: "En reparación",
  [OrderStatusEnum.ready]: "Lista",
  [OrderStatusEnum.delivered]: "Entregada",
  [OrderStatusEnum.cancelled]: "Cancelada",
};

/** The four workshop stages in their fixed operational order. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatusEnum.received,
  OrderStatusEnum.inRepair,
  OrderStatusEnum.ready,
  OrderStatusEnum.delivered,
];

/** The single valid next status, or `null` when the order is delivered. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[index + 1];
}

/** Badge classes per status, following the design brief's status palette. */
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  [OrderStatusEnum.received]: "border-info/40 bg-info/10 text-info",
  [OrderStatusEnum.inRepair]: "border-warning/40 bg-warning/10 text-warning",
  [OrderStatusEnum.ready]: "border-primary/40 bg-primary/10 text-primary",
  [OrderStatusEnum.delivered]: "border-success/40 bg-success/10 text-success",
  [OrderStatusEnum.cancelled]:
    "border-status-cancelled/40 bg-status-cancelled/10 text-status-cancelled",
};

/** Human-readable message from a backend rejection or a generic failure. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

/**
 * Page size for the type-to-narrow part pickers (quote lines, workshop-order
 * repuesto dialog, POS). The pickers no longer truncate: they request a page
 * large enough to cover the whole catalog and render every match in a
 * scrollable panel, so no valid option is silently dropped.
 */
export const PICKER_PAGE_SIZE = 1000n;

export interface OrderListParams {
  status: OrderStatus | null;
  search: string;
  page: number;
  pageSize: number;
}

export function useOrders(params: OrderListParams) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();

  return useQuery({
    queryKey: [
      "orders",
      params.status ?? "all",
      search,
      params.page,
      params.pageSize,
    ],
    queryFn: async (): Promise<OrderPage> => {
      if (!actor) throw new Error("Backend no disponible");
      const filter: OrderFilter = {
        status: params.status ?? undefined,
        search: search.length > 0 ? search : undefined,
      };
      return actor.listOrders(token, filter, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrder(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["order", id?.toString() ?? "none"],
    queryFn: async (): Promise<OrderView | null> => {
      if (!actor || id === null) return null;
      return actor.getOrder(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCustomers(search: string) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const term = search.trim();

  return useQuery({
    queryKey: ["customers", term],
    queryFn: async (): Promise<Customer[]> => {
      if (!actor) return [];
      return actor.listCustomers(token, term.length > 0 ? term : null);
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Resolves display names for the customers and motorcycles referenced by a
 * page of orders. `listOrders` returns only ids, so the list view needs a
 * lookup pass to render readable rows. Motorcycle plates are resolved through
 * each customer's motorcycle list because the backend exposes no direct
 * motorcycle-by-id lookup.
 */
export function useOrderLookups(customerIds: Id[], motorcycleIds: Id[]) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const customerKey = customerIds
    .map((id) => id.toString())
    .sort()
    .join(",");
  const motorcycleKey = motorcycleIds
    .map((id) => id.toString())
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["order-lookups", customerKey, motorcycleKey],
    queryFn: async (): Promise<{
      customers: Map<string, string>;
      motorcycles: Map<string, string>;
    }> => {
      const customers = new Map<string, string>();
      const motorcycles = new Map<string, string>();
      if (!actor) return { customers, motorcycles };

      const uniqueCustomers = Array.from(
        new Set(customerIds.map((id) => id.toString())),
      );

      const results = await Promise.all(
        uniqueCustomers.map(async (id) => {
          const [customer, motos] = await Promise.all([
            actor.getCustomer(token, BigInt(id)),
            actor.listMotorcycles(token, BigInt(id)),
          ]);
          return { id, name: customer?.name ?? null, motos };
        }),
      );

      for (const entry of results) {
        if (entry.name) customers.set(entry.id, entry.name);
        for (const moto of entry.motos) {
          motorcycles.set(moto.id.toString(), moto.plate);
        }
      }

      return { customers, motorcycles };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMotorcycles(customerId: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["motorcycles", customerId?.toString() ?? "none"],
    queryFn: async (): Promise<Motorcycle[]> => {
      if (!actor || customerId === null) return [];
      return actor.listMotorcycles(token, customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null,
  });
}

/**
 * Picker search over the parts catalog. The picker is a type-to-narrow control:
 * it only queries the backend once the user types a term, so the catalog is
 * never listed in full by default. The broad page size returns every match for
 * the typed term in a scrollable panel, so no valid option is dropped.
 */
export function useParts(search: string) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const term = search.trim();

  return useQuery({
    queryKey: ["parts", "picker", term],
    queryFn: async (): Promise<PartPage> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listParts(
        token,
        { search: term.length > 0 ? term : undefined },
        PartSort.name,
        0n,
        PICKER_PAGE_SIZE,
      );
    },
    enabled: !!actor && !isFetching && term.length > 0,
  });
}

/**
 * Loads a single catalog part by id. Used when an item chosen elsewhere (for
 * example the factura item search) is carried to a document as a query param
 * and must be resolved back to its full catalog record before appending.
 */
export function usePart(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["part", id?.toString() ?? "none"],
    queryFn: async (): Promise<PartView | null> => {
      if (!actor || id === null) return null;
      return actor.getPart(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/**
 * Resolves a scanned or manually typed code to a catalog part through the
 * backend `findPartByCode`, which matches both the barcode and the SKU. Used by
 * the workshop-order barcode flow so a scan adds the exact product to the line.
 *
 * Returns the resolved `PartView` when the code exists and `null` when it does
 * not, matching the other flows (POS, cotizaciones, compras, facturas).
 */
export function useFindPartByCode() {
  const { actor } = useBackend();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (code: string): Promise<PartView | null> => {
      const value = code.trim();
      if (value === "" || !actor) return null;
      const result = await actor.findPartByCode(token, value);
      return result.__kind__ === "found" ? result.found : null;
    },
  });
}

export function useLots(partId: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["lots", partId?.toString() ?? "none"],
    queryFn: async (): Promise<Lot[]> => {
      if (!actor || partId === null) return [];
      return actor.listLots(token, partId);
    },
    enabled: !!actor && !isFetching && partId !== null,
  });
}

export function useCreateOrder() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      customerId: Id;
      motorcycleId: Id;
      intakeMileage: bigint;
      technicianIds: Id[];
      problem: string;
      previousMileage?: bigint;
      oilChangeInterval?: bigint;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createOrder(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/**
 * Updates the oil-change interval (km) of a workshop order and recalculates the
 * next oil change from the recorded intake mileage. The order detail and the
 * order list are both refreshed so the new interval is reflected everywhere.
 */
export function useUpdateOilChangeInterval() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      oilChangeInterval: bigint;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateOilChangeInterval(token, input.id, {
        oilChangeInterval: input.oilChangeInterval,
      });
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

/**
 * Registers, updates or clears the advance payment (anticipo) of a workshop
 * order. Passing `null` in `amount` or `method` clears that field; passing both
 * as `null` removes the advance entirely. The order detail, the order list and
 * the Caja y Bancos ledger are refreshed because the advance is recorded as a
 * cash movement.
 */
export function useSetOrderAdvance() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      amount: Money | null;
      method: PaymentMethod | null;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.setOrderAdvance(token, input.id, {
        amount: input.amount ?? undefined,
        method: input.method ?? undefined,
      });
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
      // The advance is recorded as a cash movement, so the open shifts, the
      // balances and the accounting surfaces must refetch. `invalidateCashData`
      // invalidates the whole ["cash"] family (which includes useOpenShifts,
      // the source of the Caja y Bancos balance panel) plus accounting-summary,
      // accounting-report and ledger-entries.
      invalidateCashData(queryClient);
    },
  });
}

/**
 * Registers a partial payment (abono) on a workshop order. The backend records
 * it as an income movement in Caja/Bancos tied to the order, so the order
 * detail, the order list and the cash ledger are all refreshed.
 */
export function useAddOrderPayment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      payment: OrderPaymentInput;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addOrderPayment(token, input.id, input.payment);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["order-payments", view.order.id.toString()],
      });
      // The abono is recorded as a cash movement, so the open shifts, the
      // balances and the accounting surfaces must refetch. `invalidateCashData`
      // invalidates the whole ["cash"] family (which includes useOpenShifts,
      // the source of the Caja y Bancos balance panel) plus accounting-summary,
      // accounting-report and ledger-entries.
      invalidateCashData(queryClient);
    },
  });
}

/** Lists the partial payments (abonos) registered on a workshop order. */
export function useOrderPayments(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["order-payments", id?.toString() ?? "none"],
    queryFn: async (): Promise<OrderPayment[]> => {
      if (!actor || id === null) return [];
      return actor.listOrderPayments(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/**
 * Loads the printable advance receipt of a workshop order. The receipt carries
 * the company-facing snapshot (cliente, moto, anticipo, abonos, total y saldo)
 * so the preview and the PDF never diverge from the backend state.
 */
export function useOrderAdvanceReceipt(id: Id | null) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();

  return useQuery({
    queryKey: ["order-advance-receipt", id?.toString() ?? "none"],
    queryFn: async (): Promise<OrderAdvanceReceipt | null> => {
      if (!actor || id === null) return null;
      return actor.getOrderAdvanceReceipt(token, id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      status: OrderStatus;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateOrderStatus(token, input.id, input.status);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

export function useAddOrderPart() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      part: OrderPartInput;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addOrderPart(token, input.id, input.part);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

export function useRemoveOrderPart() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      orderPartId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeOrderPart(token, input.id, input.orderPartId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

export function useAddLabor() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      labor: LaborInput;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addLabor(token, input.id, input.labor);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

export function useRemoveLabor() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      laborId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeLabor(token, input.id, input.laborId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

/**
 * Cancels a workshop order with a mandatory reason. The order stops being
 * billable and leaves the active flows, so the order list and the dashboard
 * summary are both refreshed.
 */
export function useCancelOrder() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      reason: string;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.cancelOrder(token, input.id, input.reason);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

/**
 * Permanently deletes a workshop order. The action is irreversible, so the
 * order list, the dashboard summary and the deleted order's own cache entry
 * are all invalidated.
 */
export function useDeleteOrder() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteOrder(token, id);
    },
    onSuccess: (_deleted, id) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", id.toString()],
      });
    },
  });
}

/**
 * Attaches a process-evidence photo to a workshop order. The caller passes an
 * `OrderPhotoInput` built by `useOrderPhotoUpload`, which already uploaded the
 * bytes to platform file storage.
 */
export function useAddOrderPhoto() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      photo: OrderPhotoInput;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addOrderPhoto(token, input.id, input.photo);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

/** Removes a process-evidence photo from a workshop order. */
export function useRemoveOrderPhoto() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      photoId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeOrderPhoto(token, input.id, input.photoId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()],
      });
    },
  });
}

export type { PartView };
