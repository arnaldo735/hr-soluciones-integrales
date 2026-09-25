import { k as useBackend, l as useQuery, al as useMutation, ak as useQueryClient } from "./index-CzQEXdHP.js";
const CUSTOMERS_PAGE_SIZE = 50;
function useCustomers(search) {
  const { actor, isFetching } = useBackend();
  const trimmed = search.trim();
  return useQuery({
    queryKey: ["customers", trimmed],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCustomers(trimmed === "" ? null : trimmed);
    },
    enabled: !!actor && !isFetching
  });
}
function customersPageKey(search, sort, dir, page) {
  return `${search.trim()}|${sort}|${dir}|${page}`;
}
function useCustomersPage(search, sort, dir, page) {
  const { actor, isFetching } = useBackend();
  const trimmed = search.trim();
  const key = customersPageKey(trimmed, sort, dir, page);
  return useQuery({
    queryKey: ["customers-page", key],
    queryFn: async () => {
      if (!actor) throw new Error("El backend no está disponible");
      const filter = {
        search: trimmed === "" ? void 0 : trimmed
      };
      const offset = BigInt((page - 1) * CUSTOMERS_PAGE_SIZE);
      return actor.listCustomersPageDir(
        filter,
        sort,
        dir === "desc",
        offset,
        BigInt(CUSTOMERS_PAGE_SIZE)
      );
    },
    enabled: !!actor && !isFetching
  });
}
function useExportCustomersAggregated() {
  const { actor } = useBackend();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.exportCustomersAggregated();
    }
  });
}
function useCustomerDetail(id) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["customer-detail", (id == null ? void 0 : id.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getCustomerDetail(id);
    },
    enabled: !!actor && !isFetching && id !== null
  });
}
function useCreateCustomer() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.createCustomer(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
    }
  });
}
function useUpdateCustomer() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.updateCustomer(id, input);
    },
    onSuccess: (_customer, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
      void queryClient.invalidateQueries({
        queryKey: ["customer-detail", variables.id.toString()]
      });
    }
  });
}
function useCreateMotorcycle() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.createMotorcycle(input);
    },
    onSuccess: (_motorcycle, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
      void queryClient.invalidateQueries({
        queryKey: ["customer-detail", variables.customerId.toString()]
      });
    }
  });
}
function useUpdateMotorcycle() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.updateMotorcycle(id, input);
    },
    onSuccess: (_motorcycle, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
      void queryClient.invalidateQueries({
        queryKey: ["customer-detail", variables.input.customerId.toString()]
      });
    }
  });
}
function motorcyclesPageKey(filter, sort, dir, offset, limit) {
  var _a, _b;
  const search = ((_a = filter.search) == null ? void 0 : _a.trim()) ?? "";
  const brand = ((_b = filter.brand) == null ? void 0 : _b.trim()) ?? "";
  return `${search}|${brand}|${sort}|${dir}|${offset}|${limit}`;
}
async function fetchMotorcyclesPage(actor, filter, sort, dir, offset, limit) {
  return actor.listMotorcyclesPageDir(
    filter,
    sort,
    dir === "desc",
    BigInt(offset),
    BigInt(limit)
  );
}
function useMotorcyclesPage(filter, sort, dir, offset, limit) {
  const { actor, isFetching } = useBackend();
  const key = motorcyclesPageKey(filter, sort, dir, offset, limit);
  return useQuery({
    queryKey: ["motorcycles-page", key],
    queryFn: async () => {
      if (!actor) {
        return {
          total: 0n,
          offset: BigInt(offset),
          limit: BigInt(limit),
          items: []
        };
      }
      return fetchMotorcyclesPage(actor, filter, sort, dir, offset, limit);
    },
    enabled: !!actor && !isFetching
  });
}
export {
  CUSTOMERS_PAGE_SIZE as C,
  useExportCustomersAggregated as a,
  useCustomersPage as b,
  useMotorcyclesPage as c,
  useCreateMotorcycle as d,
  useUpdateMotorcycle as e,
  useCustomerDetail as f,
  useCreateCustomer as g,
  useUpdateCustomer as h,
  useCustomers as u
};
