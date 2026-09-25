import { useBackend } from "@/hooks/use-backend";
import type {
  Customer,
  CustomerDetail,
  CustomerExportRow,
  CustomerFilter,
  CustomerInput,
  CustomerListItem,
  CustomerPage,
  Id,
  Motorcycle,
  MotorcycleFilter,
  MotorcycleInput,
  MotorcycleListItem,
  MotorcyclePage,
} from "@/lib/types";
import type { CustomerSort, MotorcycleSort } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Rows requested per page by the paginated customer directory. */
export const CUSTOMERS_PAGE_SIZE = 50;

/** Sort direction accepted by the directory's URL state. */
export type CustomerSortDir = "asc" | "desc";

/**
 * Customer directory, optionally filtered by name, phone or plate.
 *
 * Kept for the pickers that need a lightweight lookup list (nueva orden, POS,
 * cotizaciones, citas y servicios). The `/clientes` directory itself uses
 * `useCustomersPage`, which paginates in the backend.
 */
export function useCustomers(search: string) {
  const { actor, isFetching } = useBackend();
  const trimmed = search.trim();

  return useQuery({
    queryKey: ["customers", trimmed],
    queryFn: async (): Promise<Array<Customer>> => {
      if (!actor) return [];
      return actor.listCustomers(trimmed === "" ? null : trimmed);
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * Stable cache key for one page of the customer directory.
 *
 * The key is a single string encoding every input that changes the page
 * (search, sort, direction and page number), so it keeps the same identity
 * across renders even though the filter object is rebuilt on every render. A
 * key built from a freshly-built array would change identity each render and
 * make React Query refetch in a loop.
 */
export function customersPageKey(
  search: string,
  sort: CustomerSort,
  dir: CustomerSortDir,
  page: number,
): string {
  return `${search.trim()}|${sort}|${dir}|${page}`;
}

/**
 * One page of the customer directory, resolved entirely in the backend.
 *
 * `listCustomersPageDir` returns the page items with each customer's motorcycle
 * count already included, so the directory never fans out a per-customer read
 * for the count column. The sort direction is resolved in the backend through
 * the `descending` flag, so descending returns the true top-N of the whole
 * directory rather than a reversed slice of the ascending page. The query key
 * is a stable string (see `customersPageKey`), and the query is disabled until
 * the actor is ready.
 */
export function useCustomersPage(
  search: string,
  sort: CustomerSort,
  dir: CustomerSortDir,
  page: number,
) {
  const { actor, isFetching } = useBackend();
  const trimmed = search.trim();
  const key = customersPageKey(trimmed, sort, dir, page);

  return useQuery({
    queryKey: ["customers-page", key],
    queryFn: async (): Promise<CustomerPage> => {
      if (!actor) throw new Error("El backend no está disponible");
      const filter: CustomerFilter = {
        search: trimmed === "" ? undefined : trimmed,
      };
      const offset = BigInt((page - 1) * CUSTOMERS_PAGE_SIZE);
      return actor.listCustomersPageDir(
        filter,
        sort,
        dir === "desc",
        offset,
        BigInt(CUSTOMERS_PAGE_SIZE),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

/**
 * The complete directory with each customer's motorcycles, in one backend call.
 *
 * `exportCustomersAggregated` builds the motorcycle index in a single pass, so
 * the Excel export no longer fans out one `listMotorcycles` call per customer.
 * Exposed as a mutation so the export runs only when the user asks for it.
 */
export function useExportCustomersAggregated() {
  const { actor } = useBackend();

  return useMutation({
    mutationFn: async (): Promise<Array<CustomerExportRow>> => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.exportCustomersAggregated();
    },
  });
}

/** Full customer record with motorcycles and workshop order history. */
export function useCustomerDetail(id: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["customer-detail", id?.toString() ?? "none"],
    queryFn: async (): Promise<CustomerDetail | null> => {
      if (!actor || id === null) return null;
      return actor.getCustomerDetail(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateCustomer() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CustomerInput): Promise<Customer> => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.createCustomer(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: CustomerInput;
    }): Promise<Customer> => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.updateCustomer(id, input);
    },
    onSuccess: (_customer, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
      void queryClient.invalidateQueries({
        queryKey: ["customer-detail", variables.id.toString()],
      });
    },
  });
}

export function useCreateMotorcycle() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MotorcycleInput): Promise<Motorcycle> => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.createMotorcycle(input);
    },
    onSuccess: (_motorcycle, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
      void queryClient.invalidateQueries({
        queryKey: ["customer-detail", variables.customerId.toString()],
      });
    },
  });
}

export function useUpdateMotorcycle() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: MotorcycleInput;
    }): Promise<Motorcycle> => {
      if (!actor) throw new Error("El backend no está disponible");
      return actor.updateMotorcycle(id, input);
    },
    onSuccess: (_motorcycle, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      void queryClient.invalidateQueries({ queryKey: ["customers-page"] });
      void queryClient.invalidateQueries({
        queryKey: ["customer-detail", variables.input.customerId.toString()],
      });
    },
  });
}

/** Re-exported so pages can build a `CustomerListItem`-shaped row type. */
export type { CustomerListItem };

/* ---------------------------------------------------------------------------
 * Paginated motorcycles listing.
 *
 * The listing surface (a motorcycles directory) resolves pagination, filtering
 * and sorting in the backend through `listMotorcyclesPageDir`, so the frontend
 * never fans out one call per motorcycle. The query key is a single stable
 * string encoding filter, sort, direction and page, so it keeps the same
 * identity across renders and React Query caches each page independently.
 * ------------------------------------------------------------------------- */

/** Sort direction accepted by the motorcycles listing's URL state. */
export type MotorcycleSortDir = "asc" | "desc";

/** The actor surface the paginated motorcycles helpers depend on. */
interface MotorcyclesPageActor {
  listMotorcyclesPageDir: (
    filter: MotorcycleFilter,
    sort: MotorcycleSort,
    descending: boolean,
    offset: bigint,
    limit: bigint,
  ) => Promise<MotorcyclePage>;
}

/**
 * Stable cache key for one page of the motorcycles listing.
 *
 * Every input is folded into one string so the key identity never changes
 * across renders even though `filter` is rebuilt on each render. A key built
 * from the object itself would change identity every render and make React
 * Query refetch in a loop. The sort direction is part of the key so ascending
 * and descending pages are cached independently.
 */
export function motorcyclesPageKey(
  filter: MotorcycleFilter,
  sort: MotorcycleSort,
  dir: MotorcycleSortDir,
  offset: number,
  limit: number,
): string {
  const search = filter.search?.trim() ?? "";
  const brand = filter.brand?.trim() ?? "";
  return `${search}|${brand}|${sort}|${dir}|${offset}|${limit}`;
}

/**
 * Reads one page of motorcycles in a single backend call.
 *
 * The sort direction is resolved in the backend through the `descending` flag,
 * so descending returns the true top-N of the whole listing rather than a
 * reversed slice of the ascending page. Exposed for on-demand use (exports,
 * prefetching the next page) so callers reuse the exact same query key and
 * never issue a per-motorcycle fan-out.
 */
export async function fetchMotorcyclesPage(
  actor: MotorcyclesPageActor,
  filter: MotorcycleFilter,
  sort: MotorcycleSort,
  dir: MotorcycleSortDir,
  offset: number,
  limit: number,
): Promise<MotorcyclePage> {
  return actor.listMotorcyclesPageDir(
    filter,
    sort,
    dir === "desc",
    BigInt(offset),
    BigInt(limit),
  );
}

/**
 * One page of the motorcycles listing, with pagination, filtering and sorting
 * resolved in the backend.
 *
 * The query key is a stable string (see `motorcyclesPageKey`) and the page
 * arrives in a single `listMotorcyclesPageDir` call, so opening the listing
 * never fans out one request per motorcycle nor refetches indefinitely. The
 * direction is part of the key, so switching direction issues exactly one new
 * request and the rows arrive already ordered by the backend.
 */
export function useMotorcyclesPage(
  filter: MotorcycleFilter,
  sort: MotorcycleSort,
  dir: MotorcycleSortDir,
  offset: number,
  limit: number,
) {
  const { actor, isFetching } = useBackend();
  const key = motorcyclesPageKey(filter, sort, dir, offset, limit);

  return useQuery({
    queryKey: ["motorcycles-page", key],
    queryFn: async (): Promise<MotorcyclePage> => {
      if (!actor) {
        return {
          total: 0n,
          offset: BigInt(offset),
          limit: BigInt(limit),
          items: [],
        };
      }
      return fetchMotorcyclesPage(actor, filter, sort, dir, offset, limit);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Re-exported so listing pages can type their rows without extra imports. */
export type { MotorcycleListItem, MotorcyclePage };
