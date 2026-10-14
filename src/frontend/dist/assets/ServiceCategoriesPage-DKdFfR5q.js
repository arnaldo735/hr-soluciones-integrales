import { y as useNavigate, z as useSearch, r as reactExports, j as jsxRuntimeExports } from "./index-CGU00UGU.js";
import { S as ServiceCategoryDialog } from "./ServiceCategoryDialog-C1TKHMiL.js";
import "./skeleton-CFVvrB7j.js";
import "./textarea-DsfSgmp0.js";
import "./check-D7OXHYR_.js";
import "./plus-CPedN7BF.js";
import "./pencil-D17_67q5.js";
import "./trash-2-D0SVHflY.js";
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
