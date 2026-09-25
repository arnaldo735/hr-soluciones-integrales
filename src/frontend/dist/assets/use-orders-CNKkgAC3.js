import { O as OrderStatus, k as useBackend, l as useQuery, ak as useQueryClient, al as useMutation, o as PartSort } from "./index-CzQEXdHP.js";
const ORDER_STATUS_LABELS = {
  [OrderStatus.received]: "Recibida",
  [OrderStatus.inRepair]: "En reparación",
  [OrderStatus.ready]: "Lista",
  [OrderStatus.delivered]: "Entregada",
  [OrderStatus.cancelled]: "Cancelada"
};
const ORDER_STATUS_FLOW = [
  OrderStatus.received,
  OrderStatus.inRepair,
  OrderStatus.ready,
  OrderStatus.delivered
];
function nextStatus(status) {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[index + 1];
}
const ORDER_STATUS_BADGE = {
  [OrderStatus.received]: "border-info/40 bg-info/10 text-info",
  [OrderStatus.inRepair]: "border-warning/40 bg-warning/10 text-warning",
  [OrderStatus.ready]: "border-primary/40 bg-primary/10 text-primary",
  [OrderStatus.delivered]: "border-success/40 bg-success/10 text-success",
  [OrderStatus.cancelled]: "border-status-cancelled/40 bg-status-cancelled/10 text-status-cancelled"
};
function errorMessage(error) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
const PICKER_PAGE_SIZE = 50n;
function useOrders(params) {
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
      params.pageSize
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      const filter = {
        status: params.status ?? void 0,
        search: search.length > 0 ? search : void 0
      };
      return actor.listOrders(filter, offset, limit);
    },
    enabled: !!actor && !isFetching
  });
}
function useOrder(id) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["order", (id == null ? void 0 : id.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getOrder(id);
    },
    enabled: !!actor && !isFetching && id !== null
  });
}
function useCustomers(search) {
  const { actor, isFetching } = useBackend();
  const term = search.trim();
  return useQuery({
    queryKey: ["customers", term],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCustomers(term.length > 0 ? term : null);
    },
    enabled: !!actor && !isFetching
  });
}
function useOrderLookups(customerIds, motorcycleIds) {
  const { actor, isFetching } = useBackend();
  const customerKey = customerIds.map((id) => id.toString()).sort().join(",");
  const motorcycleKey = motorcycleIds.map((id) => id.toString()).sort().join(",");
  return useQuery({
    queryKey: ["order-lookups", customerKey, motorcycleKey],
    queryFn: async () => {
      const customers = /* @__PURE__ */ new Map();
      const motorcycles = /* @__PURE__ */ new Map();
      if (!actor) return { customers, motorcycles };
      const uniqueCustomers = Array.from(
        new Set(customerIds.map((id) => id.toString()))
      );
      const results = await Promise.all(
        uniqueCustomers.map(async (id) => {
          const [customer, motos] = await Promise.all([
            actor.getCustomer(BigInt(id)),
            actor.listMotorcycles(BigInt(id))
          ]);
          return { id, name: (customer == null ? void 0 : customer.name) ?? null, motos };
        })
      );
      for (const entry of results) {
        if (entry.name) customers.set(entry.id, entry.name);
        for (const moto of entry.motos) {
          motorcycles.set(moto.id.toString(), moto.plate);
        }
      }
      return { customers, motorcycles };
    },
    enabled: !!actor && !isFetching
  });
}
function useMotorcycles(customerId) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["motorcycles", (customerId == null ? void 0 : customerId.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || customerId === null) return [];
      return actor.listMotorcycles(customerId);
    },
    enabled: !!actor && !isFetching && customerId !== null
  });
}
function useParts(search) {
  const { actor, isFetching } = useBackend();
  const term = search.trim();
  return useQuery({
    queryKey: ["parts", "picker", term],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listParts(
        { search: term.length > 0 ? term : void 0 },
        PartSort.name,
        0n,
        PICKER_PAGE_SIZE
      );
    },
    enabled: !!actor && !isFetching
  });
}
async function findPartBySku(actor, sku) {
  const code = sku.trim();
  if (code === "") return null;
  const page = await actor.listParts(
    { search: code },
    PartSort.name,
    0n,
    PICKER_PAGE_SIZE
  );
  const target = code.toLowerCase();
  return page.items.find((part) => part.sku.toLowerCase() === target) ?? null;
}
function useLots(partId) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["lots", (partId == null ? void 0 : partId.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || partId === null) return [];
      return actor.listLots(partId);
    },
    enabled: !!actor && !isFetching && partId !== null
  });
}
function useCreateOrder() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createOrder(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}
function useUpdateOrderStatus() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateOrderStatus(input.id, input.status);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useAddOrderPart() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addOrderPart(input.id, input.part);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useRemoveOrderPart() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeOrderPart(input.id, input.orderPartId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useAddLabor() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addLabor(input.id, input.labor);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useRemoveLabor() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeLabor(input.id, input.laborId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useCancelOrder() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.cancelOrder(input.id, input.reason);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useDeleteOrder() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteOrder(id);
    },
    onSuccess: (_deleted, id) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", id.toString()]
      });
    }
  });
}
function useAddOrderPhoto() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.addOrderPhoto(input.id, input.photo);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
function useRemoveOrderPhoto() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.removeOrderPhoto(input.id, input.photoId);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", view.order.id.toString()]
      });
    }
  });
}
export {
  ORDER_STATUS_FLOW as O,
  useOrderLookups as a,
  ORDER_STATUS_LABELS as b,
  ORDER_STATUS_BADGE as c,
  useCustomers as d,
  useMotorcycles as e,
  useCreateOrder as f,
  errorMessage as g,
  useAddLabor as h,
  useParts as i,
  useLots as j,
  useAddOrderPart as k,
  useAddOrderPhoto as l,
  useRemoveOrderPhoto as m,
  useOrder as n,
  useUpdateOrderStatus as o,
  useRemoveOrderPart as p,
  useRemoveLabor as q,
  nextStatus as r,
  useCancelOrder as s,
  useDeleteOrder as t,
  useOrders as u,
  findPartBySku as v
};
