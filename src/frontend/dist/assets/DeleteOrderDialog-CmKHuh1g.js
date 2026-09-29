import { t as reactExports, j as jsxRuntimeExports, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, E as Ban, a2 as DialogDescription, K as Label, T as TriangleAlert, a3 as DialogFooter, B as Button } from "./index-EqGEeyjs.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { t as useCancelOrder, g as errorMessage, v as useDeleteOrder } from "./use-orders-BVudDwaF.js";
import { T as Trash2 } from "./trash-2-HQabmlQI.js";
function CancelOrderDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange
}) {
  const [reason, setReason] = reactExports.useState("");
  const [formError, setFormError] = reactExports.useState(null);
  const cancelOrder = useCancelOrder();
  const reasonValid = reason.trim().length > 0;
  function reset() {
    setReason("");
    setFormError(null);
  }
  function handleOpenChange(next) {
    if (!next) reset();
    onOpenChange(next);
  }
  function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (!reasonValid) {
      setFormError("Indica el motivo de la cancelación.");
      return;
    }
    cancelOrder.mutate(
      { id: orderId, reason: reason.trim() },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => setFormError(errorMessage(error))
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "order_detail.cancel_order.modal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 font-display", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { className: "size-4 text-destructive", "aria-hidden": "true" }),
        "Cancelar la orden ",
        orderNumber
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "La orden cancelada deja de ser facturable y sale de los flujos activos del taller. El motivo queda registrado en el historial." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, noValidate: true, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "cancel-order-reason", children: "Motivo de la cancelación" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "cancel-order-reason",
            value: reason,
            onChange: (event) => {
              setReason(event.target.value);
              setFormError(null);
            },
            rows: 3,
            placeholder: "Ej. El cliente desistió de la reparación.",
            "data-ocid": "order_detail.cancel_order.reason_textarea"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "El motivo es obligatorio." })
      ] }),
      formError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "order_detail.cancel_order.error_state",
          className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              TriangleAlert,
              {
                className: "mt-0.5 size-4 shrink-0 text-destructive",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: formError })
          ]
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => handleOpenChange(false),
            "data-ocid": "order_detail.cancel_order.dismiss_button",
            children: "Volver"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            variant: "destructive",
            disabled: !reasonValid || cancelOrder.isPending,
            "data-ocid": "order_detail.cancel_order.confirm_button",
            children: cancelOrder.isPending ? "Cancelando…" : "Cancelar orden"
          }
        )
      ] })
    ] })
  ] }) });
}
function DeleteOrderDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
  onDeleted
}) {
  const [formError, setFormError] = reactExports.useState(null);
  const deleteOrder = useDeleteOrder();
  function handleOpenChange(next) {
    if (!next) setFormError(null);
    onOpenChange(next);
  }
  function handleConfirm() {
    setFormError(null);
    deleteOrder.mutate(orderId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted == null ? void 0 : onDeleted();
      },
      onError: (error) => setFormError(errorMessage(error))
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "order_detail.delete_order.modal", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 font-display", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "size-4 text-destructive", "aria-hidden": "true" }),
        "Eliminar la orden ",
        orderNumber
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Esta acción es irreversible. La orden, sus repuestos, su mano de obra y su evidencia fotográfica se eliminan de forma permanente y la operación queda registrada en el historial." })
    ] }),
    formError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "order_detail.delete_order.error_state",
        className: "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "mt-0.5 size-4 shrink-0 text-destructive",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive", children: formError })
        ]
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => handleOpenChange(false),
          "data-ocid": "order_detail.delete_order.dismiss_button",
          children: "Conservar orden"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "button",
          variant: "destructive",
          onClick: handleConfirm,
          disabled: deleteOrder.isPending,
          "data-ocid": "order_detail.delete_order.confirm_button",
          children: deleteOrder.isPending ? "Eliminando…" : "Eliminar definitivamente"
        }
      )
    ] })
  ] }) });
}
export {
  CancelOrderDialog as C,
  DeleteOrderDialog as D
};
