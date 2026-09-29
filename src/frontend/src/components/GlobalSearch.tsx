import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useRole } from "@/hooks/use-role";
import { formatMoney } from "@/lib/format";
import type { PartView } from "@/lib/types";
import { PartSort, ServiceSort } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  Building2,
  FolderTree,
  Loader2,
  Search,
  UserCog,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Upper bound requested from the paginated catalogs. The global search shows
 * every match per group in a scrollable panel, so it asks for a page large
 * enough to cover the whole catalog instead of a small fixed cap.
 */
const SEARCH_PAGE_LIMIT = 1000n;

interface GlobalSearchResult {
  key: string;
  label: string;
  meta: string;
  to: string;
  params?: Record<string, string>;
}

interface GlobalSearchGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  results: GlobalSearchResult[];
}

/**
 * Global search reachable from every screen. Queries the six catalogs in
 * parallel, groups the matches by record type and navigates to the selected
 * record. Admin-only destinations are hidden from non-admin users.
 */
export function GlobalSearch() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedTerm(term.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [term]);

  const enabled = !!actor && !isFetching && debouncedTerm.length > 0;

  const customersQuery = useQuery({
    queryKey: ["global-search", "customers", debouncedTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listCustomers(token, debouncedTerm);
    },
    enabled,
    staleTime: 30_000,
  });

  const suppliersQuery = useQuery({
    queryKey: ["global-search", "suppliers", debouncedTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listSuppliers(token, debouncedTerm);
    },
    enabled: enabled && isAdmin,
    staleTime: 30_000,
  });

  const servicesQuery = useQuery({
    queryKey: ["global-search", "services", debouncedTerm],
    queryFn: async () => {
      if (!actor) return { items: [], total: 0n, offset: 0n, limit: 0n };
      return actor.listServices(
        token,
        { search: debouncedTerm },
        ServiceSort.name,
        0n,
        SEARCH_PAGE_LIMIT,
      );
    },
    enabled,
    staleTime: 30_000,
  });

  const partsQuery = useQuery({
    queryKey: ["global-search", "parts", debouncedTerm],
    queryFn: async () => {
      if (!actor) return { items: [], total: 0n, offset: 0n, limit: 0n };
      return actor.listParts(
        token,
        { search: debouncedTerm },
        PartSort.name,
        0n,
        SEARCH_PAGE_LIMIT,
      );
    },
    enabled,
    staleTime: 30_000,
  });

  const techniciansQuery = useQuery({
    queryKey: ["global-search", "technicians", debouncedTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTechnicians(token, { search: debouncedTerm });
    },
    enabled,
    staleTime: 30_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["global-search", "categories", debouncedTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listServiceCategories(token, { search: debouncedTerm });
    },
    enabled: enabled && isAdmin,
    staleTime: 30_000,
  });

  const isLoading =
    customersQuery.isLoading ||
    servicesQuery.isLoading ||
    partsQuery.isLoading ||
    techniciansQuery.isLoading ||
    (isAdmin && (suppliersQuery.isLoading || categoriesQuery.isLoading));

  const groups = useMemo<GlobalSearchGroup[]>(() => {
    const next: GlobalSearchGroup[] = [];

    const customers = customersQuery.data ?? [];
    if (customers.length > 0) {
      next.push({
        id: "clientes",
        label: "Clientes",
        icon: Users,
        results: customers.map((customer) => ({
          key: `cliente-${customer.id.toString()}`,
          label: customer.name,
          meta: customer.phone,
          to: "/clientes/$id",
          params: { id: customer.id.toString() },
        })),
      });
    }

    const suppliers = suppliersQuery.data ?? [];
    if (suppliers.length > 0) {
      next.push({
        id: "proveedores",
        label: "Proveedores",
        icon: Building2,
        results: suppliers.map((supplier) => ({
          key: `proveedor-${supplier.id.toString()}`,
          label: supplier.name,
          meta: supplier.taxId ?? supplier.phone,
          to: "/proveedores/$id",
          params: { id: supplier.id.toString() },
        })),
      });
    }

    const services = servicesQuery.data?.items ?? [];
    if (services.length > 0) {
      next.push({
        id: "servicios",
        label: "Servicios",
        icon: Wrench,
        results: services.map((service) => ({
          key: `servicio-${service.id.toString()}`,
          label: service.name,
          meta: `${service.code} · ${formatMoney(service.laborRate)}`,
          to: "/servicios",
        })),
      });
    }

    const parts = partsQuery.data?.items ?? [];
    if (parts.length > 0) {
      next.push({
        id: "inventario",
        label: "Inventario",
        icon: Boxes,
        results: parts.map((part: PartView) => ({
          key: `repuesto-${part.id.toString()}`,
          label: part.name,
          meta: `${part.sku}${part.brand ? ` · ${part.brand}` : ""}`,
          to: "/inventario/$id",
          params: { id: part.id.toString() },
        })),
      });
    }

    const technicians = techniciansQuery.data ?? [];
    if (technicians.length > 0) {
      next.push({
        id: "tecnicos",
        label: "Técnicos",
        icon: UserCog,
        results: technicians.map((technician) => ({
          key: `tecnico-${technician.id.toString()}`,
          label: technician.name,
          meta: `${technician.code} · ${technician.specialty}`,
          to: "/tecnicos",
        })),
      });
    }

    const categories = categoriesQuery.data ?? [];
    if (categories.length > 0) {
      next.push({
        id: "categorias",
        label: "Categorías de servicio",
        icon: FolderTree,
        results: categories.map((usage) => ({
          key: `categoria-${usage.category.id.toString()}`,
          label: usage.category.name,
          meta: `${usage.serviceCount.toString()} servicios`,
          to: "/servicios/categorias",
        })),
      });
    }

    return next;
  }, [
    customersQuery.data,
    suppliersQuery.data,
    servicesQuery.data,
    partsQuery.data,
    techniciansQuery.data,
    categoriesQuery.data,
  ]);

  const hasResults = groups.length > 0;
  const showPanel = open && debouncedTerm.length > 0;

  // Close the panel when the user clicks outside the search surface.
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setTerm("");
    setDebouncedTerm("");
  };

  const handleSelect = (result: GlobalSearchResult) => {
    close();
    if (result.params) {
      void navigate({ to: result.to, params: result.params });
    } else {
      void navigate({ to: result.to });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  return (
    <div
      ref={containerRef}
      data-ocid="global_search.panel"
      className="relative ml-1 hidden min-w-0 flex-1 md:block"
    >
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar clientes, repuestos, servicios…"
          aria-label="Búsqueda global"
          data-ocid="global_search.search_input"
          className="h-9 w-full max-w-md pl-9 pr-8"
        />
        {term !== "" ? (
          <button
            type="button"
            onClick={close}
            aria-label="Limpiar búsqueda global"
            data-ocid="global_search.clear_button"
            className="absolute right-2 flex size-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          data-ocid="global_search.results"
          className="absolute left-0 top-11 z-40 max-h-[70vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-card shadow-elevated"
        >
          {isLoading ? (
            <div
              data-ocid="global_search.loading_state"
              className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Buscando…
            </div>
          ) : !hasResults ? (
            <div
              data-ocid="global_search.empty_state"
              className="flex flex-col items-center gap-2 px-6 py-8 text-center"
            >
              <div className="flex size-10 items-center justify-center rounded-md border border-border bg-muted">
                <Search
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="font-display text-sm font-semibold">
                No se encontraron coincidencias
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Ningún registro coincide con «{debouncedTerm}». Prueba con otro
                nombre, código o documento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {groups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <section
                    key={group.id}
                    data-ocid={`global_search.group.${group.id}`}
                    className="py-1.5"
                  >
                    <p className="flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <GroupIcon className="size-3" aria-hidden="true" />
                      {group.label}
                    </p>
                    <ul>
                      {group.results.map((result, index) => (
                        <li key={result.key}>
                          <button
                            type="button"
                            onClick={() => handleSelect(result)}
                            data-ocid={`global_search.result.${group.id}.${index + 1}`}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {result.label}
                              </span>
                              <span className="data-rail block truncate text-xs text-muted-foreground">
                                {result.meta}
                              </span>
                            </span>
                            <Badge
                              variant="outline"
                              className="shrink-0 border-border bg-background text-muted-foreground"
                            >
                              Abrir
                            </Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default GlobalSearch;
