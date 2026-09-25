import { k as useBackend, l as useQuery, ak as useQueryClient, al as useMutation, aG as QuoteStatus } from "./index-CzQEXdHP.js";
const QUOTE_STATUS_LABELS = {
  [QuoteStatus.draft]: "Borrador",
  [QuoteStatus.sent]: "Enviada",
  [QuoteStatus.accepted]: "Aceptada",
  [QuoteStatus.rejected]: "Rechazada",
  [QuoteStatus.expired]: "Vencida"
};
({
  [QuoteStatus.draft]: "badge-draft",
  [QuoteStatus.sent]: "badge-sent",
  [QuoteStatus.accepted]: "badge-accepted",
  [QuoteStatus.rejected]: "badge-rejected",
  [QuoteStatus.expired]: "badge-expired"
});
function useQuotes(params) {
  const { actor, isFetching } = useBackend();
  const offset = BigInt((params.page - 1) * params.pageSize);
  const limit = BigInt(params.pageSize);
  const search = params.search.trim();
  return useQuery({
    queryKey: [
      "quotes",
      params.status ?? "all",
      search,
      params.sort,
      params.page,
      params.pageSize
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      const filter = {
        status: params.status ?? void 0,
        search: search.length > 0 ? search : void 0
      };
      return actor.listQuotes(filter, params.sort, offset, limit);
    },
    enabled: !!actor && !isFetching
  });
}
function useQuoteLookups(customerIds, motorcycleIds) {
  const { actor, isFetching } = useBackend();
  const customerKey = customerIds.map((id) => id.toString()).sort().join(",");
  const motorcycleKey = motorcycleIds.map((id) => id.toString()).sort().join(",");
  return useQuery({
    queryKey: ["quote-lookups", customerKey, motorcycleKey],
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
function useQuote(id) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["quote", (id == null ? void 0 : id.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getQuote(id);
    },
    enabled: !!actor && !isFetching && id !== null
  });
}
function useCreateQuote() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createQuote(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
    }
  });
}
function useUpdateQuote() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateQuote(id, input);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({
        queryKey: ["quote", view.quote.id.toString()]
      });
    }
  });
}
function useUpdateQuoteStatus() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateQuoteStatus(id, status);
    },
    onSuccess: (view) => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({
        queryKey: ["quote", view.quote.id.toString()]
      });
    }
  });
}
function useDeleteQuote() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteQuote(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
    }
  });
}
function useConvertQuoteToInvoice() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      paymentMethod
    }) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.convertQuoteToInvoice(id, paymentMethod);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }
  });
}
function useConvertQuoteToOrder() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.convertQuoteToOrder(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quotes"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });
}
export {
  QUOTE_STATUS_LABELS as Q,
  useDeleteQuote as a,
  useQuoteLookups as b,
  useQuote as c,
  useCreateQuote as d,
  useUpdateQuote as e,
  useUpdateQuoteStatus as f,
  useConvertQuoteToOrder as g,
  useConvertQuoteToInvoice as h,
  useQuotes as u
};
