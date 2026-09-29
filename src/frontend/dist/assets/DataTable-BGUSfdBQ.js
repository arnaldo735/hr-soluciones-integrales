import { t as reactExports, j as jsxRuntimeExports, Z as cn, X } from "./index-EqGEeyjs.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-qVL9cwOA.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
import { C as Check } from "./check-LdjEv5O-.js";
import { P as Pencil } from "./pencil-BajrtuU3.js";
const ACTION_ICON = {
  edit: Pencil,
  save: Check,
  cancel: X,
  delete: Trash2
};
function DataTable({
  columns,
  rows,
  rowKey,
  actions,
  rowExtraActions,
  onRowClick,
  ocid,
  emptyMessage = "Sin registros todavía.",
  caption
}) {
  const [pendingDelete, setPendingDelete] = reactExports.useState(null);
  const hasActions = !!actions && actions.length > 0 || !!rowExtraActions;
  const runAction = (row, action) => {
    if (action.kind === "delete") {
      setPendingDelete({ row, action });
      return;
    }
    action.onClick(row);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": `${ocid}.table`,
      className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle",
      children: [
        caption ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: caption }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
            columns.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              TableHead,
              {
                className: cn(
                  "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground",
                  column.numeric && "text-right"
                ),
                children: column.header
              },
              column.key
            )),
            hasActions ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-px text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Acciones" }) : null
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { className: "hover:bg-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            TableCell,
            {
              colSpan: columns.length + (hasActions ? 1 : 0),
              "data-ocid": `${ocid}.empty_state`,
              className: "py-12 text-center text-sm text-muted-foreground",
              children: emptyMessage
            }
          ) }) : rows.map((row, index) => {
            const key = rowKey(row);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TableRow,
              {
                "data-ocid": `${ocid}.row.${index + 1}`,
                onClick: onRowClick ? () => onRowClick(row) : void 0,
                className: cn(onRowClick && "cursor-pointer"),
                children: [
                  columns.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TableCell,
                    {
                      className: cn(column.numeric && "text-right tabular"),
                      children: column.render(row)
                    },
                    column.key
                  )),
                  hasActions ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "row-actions", "data-pinned": "false", children: [
                    actions == null ? void 0 : actions.filter((action) => {
                      var _a;
                      return !((_a = action.hidden) == null ? void 0 : _a.call(action, row));
                    }).map((action) => {
                      var _a;
                      const Icon = ACTION_ICON[action.kind];
                      const disabled = ((_a = action.disabled) == null ? void 0 : _a.call(action, row)) ?? false;
                      return /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          title: action.label,
                          "aria-label": action.label,
                          disabled,
                          "data-variant": action.kind === "delete" ? "destructive" : action.kind === "save" ? "confirm" : void 0,
                          "data-ocid": `${ocid}.${action.kind}_button.${index + 1}`,
                          onClick: (event) => {
                            event.stopPropagation();
                            runAction(row, action);
                          },
                          className: "row-action disabled:pointer-events-none disabled:opacity-40",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Icon,
                            {
                              className: "size-3.5",
                              "aria-hidden": "true"
                            }
                          )
                        },
                        action.kind
                      );
                    }),
                    rowExtraActions == null ? void 0 : rowExtraActions(row, index)
                  ] }) }) : null
                ]
              },
              key
            );
          }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialog,
          {
            open: pendingDelete !== null,
            onOpenChange: (open) => {
              if (!open) setPendingDelete(null);
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { "data-ocid": `${ocid}.delete_dialog`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "¿Eliminar este registro?" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: "Esta acción no se puede deshacer. El registro se quitará de forma permanente del taller." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { "data-ocid": `${ocid}.cancel_button`, children: "Cancelar" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AlertDialogAction,
                  {
                    "data-ocid": `${ocid}.confirm_button`,
                    onClick: () => {
                      if (pendingDelete)
                        pendingDelete.action.onClick(pendingDelete.row);
                      setPendingDelete(null);
                    },
                    className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    children: "Eliminar"
                  }
                )
              ] })
            ] })
          }
        )
      ]
    }
  );
}
export {
  DataTable as D
};
