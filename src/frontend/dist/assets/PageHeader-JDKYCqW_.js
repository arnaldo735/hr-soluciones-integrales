import { j as jsxRuntimeExports, ae as cn } from "./index-CzQEXdHP.js";
function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  toolbar,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: cn("space-y-4", className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
        eyebrow ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: eyebrow }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: title }),
        description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: description }) : null
      ] }),
      actions ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex shrink-0 flex-wrap items-center gap-2", children: actions }) : null
    ] }),
    toolbar ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: toolbar }) : null
  ] });
}
export {
  PageHeader as P
};
