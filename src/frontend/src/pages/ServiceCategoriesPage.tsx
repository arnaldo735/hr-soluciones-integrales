import { ServiceCategoryDialog } from "@/components/ServiceCategoryDialog";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

/**
 * Route shell for the service-category management surface. The CRUD lives in
 * `ServiceCategoryDialog`, which is reused here in an always-open, embedded
 * mode so the sidebar destination is a real management page rather than a
 * placeholder. The dialog's own close button is hidden because the page itself
 * is the destination.
 *
 * The search term is owned by this page and persisted in the URL so it
 * survives navigating into a category's services and back.
 */
export function ServiceCategoriesPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";

  const [term, setTerm] = useState(urlTerm);

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(urlTerm);
  }, [urlTerm]);

  const applySearch = useCallback(
    (value: string) => {
      void navigate({
        to: "/servicios/categorias",
        search: (prev: Record<string, unknown>) => {
          const { q: _previous, ...rest } = prev;
          return value === "" ? rest : { ...rest, q: value };
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (term === urlTerm) return;
    const handle = window.setTimeout(() => applySearch(term), 300);
    return () => window.clearTimeout(handle);
  }, [term, urlTerm, applySearch]);

  return (
    <div
      data-ocid="service_categories.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <header className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Catálogo
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Categorías de servicios
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Administra las categorías del catálogo de servicios y su uso por
          servicio. Una categoría con servicios activos no se puede eliminar.
        </p>
      </header>

      <ServiceCategoryDialog
        open
        embedded
        search={term}
        onSearchChange={setTerm}
        onOpenChange={() => {
          // The page is the destination; there is nothing to dismiss.
        }}
      />
    </div>
  );
}

export default ServiceCategoriesPage;
