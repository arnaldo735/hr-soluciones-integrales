import { useBackend } from "@/hooks/use-backend";
import type {
  Customer,
  Id,
  LaborInput,
  Lot,
  Motorcycle,
  OrderFilter,
  OrderPage,
  OrderPartInput,
  OrderPhotoInput,
  OrderStatus,
  OrderView,
  PartPage,
  PartView,
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
 * repuesto dialog, POS). A small page keeps each search cheap; the user narrows
 * the term instead of scrolling the whole catalog.
 */
export const PICKER_PAGE_SIZE = 50n;

export interface OrderListParams {
  status: OrderStatus | null;
  search: string;
  page: number;
  pageSize: number;
}

export function useOrders(params: OrderListParams) {
  const { actor, isFetching } = useBackend();
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
      return actor.listOrders(filter, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrder(id: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["order", id?.toString() ?? "none"],
    queryFn: async (): Promise<OrderView | null> => {
      if (!actor || id === null) return null;
      return actor.getOrder(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCustomers(search: string) {
  const { actor, isFetching } = useBackend();
  const term = search.trim();

  return useQuery({
    queryKey: ["customers", term],
    queryFn: async (): Promise<Customer[]> => {
      if (!actor) return [];
      return actor.listCustomers(term.length > 0 ? term : null);
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
            actor.getCustomer(BigInt(id)),
            actor.listMotorcycles(BigInt(id)),
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

  return useQuery({
    queryKey: ["motorcycles", customerId?.toString() ?? "none"],
    queryFn: async (): Promise<Motorcycle[]> => {
      if (!actor || customerId === null) return [];
      return actor.listMotorcycles(customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null,
  });
}

/**
 * Picker search over the parts catalog. The picker is a type-to-narrow control,
 * so a single small page is enough: the user refines the term instead of
 * scrolling a huge result set. Requesting a small page keeps each keystroke
 * cheap for the backend.
 */
export function useParts(search: string) {
  const { actor, isFetching } = useBackend();
  const term = search.trim();

  return useQuery({
    queryKey: ["parts", "picker", term],
    queryFn: async (): Promise<PartPage> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listParts(
        { search: term.length > 0 ? term : undefined },
        PartSort.name,
        0n,
        PICKER_PAGE_SIZE,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Resolves a single part by its exact SKU against the full catalog. The POS
 * barcode scanner cannot rely on the small picker page, so it queries the
 * backend directly with the scanned code and matches the SKU case-insensitively.
 */
export async function findPartBySku(
  actor: NonNullable<ReturnType<typeof useBackend>["actor"]>,
  sku: string,
): Promise<PartView | null> {
  const code = sku.trim();
  if (code === "") return null;
  const page = await actor.listParts(
    { search: code },
    PartSort.name,
    0n,
    PICKER_PAGE_SIZE,
  );
  const target = code.toLowerCase();
  return page.items.find((part) => part.sku.toLowerCase() === target) ?? null;
}

export function useLots(partId: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["lots", partId?.toString() ?? "none"],
    queryFn: async (): Promise<Lot[]> => {
      if (!actor || partId === null) return [];
      return actor.listLots(partId);
    },
    enabled: !!actor && !isFetching && partId !== null,
  });
}

export function useCreateOrder() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      customerId: Id;
      motorcycleId: Id;
      intakeMileage: bigint;
      technicianIds: Id[];
      problem: string;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createOrder(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      status: OrderStatus;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateOrderStatus(input.id, input.status);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      part: OrderPartInput;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addOrderPart(input.id, input.part);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      orderPartId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeOrderPart(input.id, input.orderPartId);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      labor: LaborInput;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addLabor(input.id, input.labor);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      laborId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeLabor(input.id, input.laborId);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      reason: string;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.cancelOrder(input.id, input.reason);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteOrder(id);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      photo: OrderPhotoInput;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addOrderPhoto(input.id, input.photo);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: Id;
      photoId: Id;
    }): Promise<OrderView> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeOrderPhoto(input.id, input.photoId);
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
