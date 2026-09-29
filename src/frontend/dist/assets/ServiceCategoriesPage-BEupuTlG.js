import { r as useNavigate, s as useSearch, t as reactExports, j as jsxRuntimeExports } from "./index-EqGEeyjs.js";
import { S as ServiceCategoryDialog } from "./ServiceCategoryDialog-BKKGQs9a.js";
import "./skeleton-mWxw7Afe.js";
import "./textarea-B0CUuiY-.js";
import "./check-LdjEv5O-.js";
import "./plus-BblUTOs8.js";
import "./pencil-BajrtuU3.js";
import "./trash-2-HQabmlQI.js";
function ServiceCategoriesPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const [term, setTerm] = reactExports.useState(urlTerm);
  reactExports.useEffect(() => {
    setTerm(urlTerm);
  }, [urlTerm]);
  const applySearch = reactExports.useCallback(
    (value) => {
      void navigate({
        to: "/servicios/categorias",
        search: (prev) => {
          const { q: _previous, ...rest } = prev;
          return value === "" ? rest : { ...rest, q: value };
        },
        replace: true
      });
    },
    [navigate]
  );
  reactExports.useEffect(() => {
    if (term === urlTerm) return;
    const handle = window.setTimeout(() => applySearch(term), 300);
    return () => window.clearTimeout(handle);
  }, [term, urlTerm, applySearch]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "service_categories.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Catálogo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Categorías de servicios" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Administra las categorías del catálogo de servicios y su uso por servicio. Una categoría con servicios activos no se puede eliminar." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ServiceCategoryDialog,
          {
            open: true,
            embedded: true,
            search: term,
            onSearchChange: setTerm,
            onOpenChange: () => {
            }
          }
        )
      ]
    }
  );
}
export {
  ServiceCategoriesPage,
  ServiceCategoriesPage as default
};
