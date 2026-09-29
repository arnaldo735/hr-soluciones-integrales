import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useServices } from "@/hooks/use-services";
import { formatMoney } from "@/lib/format";
import type { Service } from "@/lib/types";
import { ServiceSort } from "@/lib/types";
import { Search, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * The picker shows every match in a scrollable panel instead of a small fixed
 * page, so a valid service is never cut off. The page is large enough to cover
 * the whole active catalog.
 */
const SERVICE_PICKER_PAGE_SIZE = 1000;

interface ServicePickerProps {
  /** Currently linked catalog service, or `null` for a free-text line. */
  value: Service | null;
  /** Called with the chosen service, or `null` when the link is cleared. */
  onChange: (service: Service | null) => void;
  /** Field id, so the visible label points at the search input. */
  id: string;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /** Disable the control while a mutation is in flight. */
  disabled?: boolean;
}

/**
 * Live search over the active service catalog by código or nombre. Results
 * show code, name, category and tarifa so the operator can pick the right
 * service before the dialog autocompletes the line. Selecting a service keeps
 * the catalog reference; clearing it returns the line to free text.
 */
export function ServicePicker({
  value,
  onChange,
  id,
  ocid,
  disabled = false,
}: ServicePickerProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const term = debounced.trim();
  const servicesQuery = useServices({
    search: debounced,
    category: null,
    activeOnly: true,
    sort: ServiceSort.name,
    page: 1,
    pageSize: SERVICE_PICKER_PAGE_SIZE,
    enabled: term.length > 0,
  });

  const services = term.length > 0 ? (servicesQuery.data?.items ?? []) : [];

  if (value) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="flex items-center gap-1.5">
          <Tag className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Servicio del catálogo
        </Label>
        <div
          data-ocid={`${ocid}.selected`}
          className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2"
        >
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="data-rail shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {value.code}
              </span>
              <p className="truncate text-sm font-medium">{value.name}</p>
            </div>
            <p className="data-rail truncate text-xs text-muted-foreground">
              {value.category} · Tarifa {formatMoney(value.laborRate)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearch("");
              setDebounced("");
              onChange(null);
            }}
            disabled={disabled}
            aria-label={`Quitar el servicio ${value.name}`}
            data-ocid={`${ocid}.clear_button`}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          La línea conserva la referencia al servicio. Puedes editar la
          descripción y el precio libremente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        <Tag className="size-3.5 text-muted-foreground" aria-hidden="true" />
        Servicio del catálogo (opcional)
      </Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Busca por código o nombre…"
          autoComplete="off"
          disabled={disabled}
          data-ocid={`${ocid}.search_input`}
          className="pl-9"
        />
      </div>

      {term.length === 0 ? (
        <p
          data-ocid={`${ocid}.prompt_state`}
          className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground"
        >
          Escribe el código o el nombre del servicio para ver coincidencias.
        </p>
      ) : servicesQuery.isLoading ? (
        <div data-ocid={`${ocid}.loading_state`} className="space-y-1.5">
          {Array.from(
            { length: 3 },
            (_, index) => `service-skeleton-${index}`,
          ).map((key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ))}
        </div>
      ) : servicesQuery.isError ? (
        <p
          data-ocid={`${ocid}.error_state`}
          className="text-xs text-destructive"
        >
          No se pudo cargar el catálogo de servicios. Inténtalo de nuevo.
        </p>
      ) : services.length === 0 ? (
        <p
          data-ocid={`${ocid}.empty_state`}
          className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
        >
          {`Sin servicios activos que coincidan con “${term}”. Puedes escribir la descripción libremente.`}
        </p>
      ) : (
        <ul
          data-ocid={`${ocid}.list`}
          className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1"
        >
          {services.map((service, index) => (
            <li key={service.id.toString()}>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDebounced("");
                  onChange(service);
                }}
                disabled={disabled}
                data-ocid={`${ocid}.item.${index + 1}`}
                className="flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      {service.code}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {service.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {service.category}
                  </span>
                </span>
                <Badge
                  variant="outline"
                  className="data-rail shrink-0 border-border text-xs font-medium"
                >
                  {formatMoney(service.laborRate)}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { Service };
