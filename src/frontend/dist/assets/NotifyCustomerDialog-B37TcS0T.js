import { K as createLucideIcon, k as useBackend, al as useMutation, s as reactExports, j as jsxRuntimeExports, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, v as Input, T as TriangleAlert, $ as DialogFooter, B as Button, ah as LoaderCircle, ar as ue } from "./index-CzQEXdHP.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { T as Textarea } from "./textarea-C9U8oXYV.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8", key: "12jkf8" }],
  ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }],
  ["path", { d: "m16 19 2 2 4-4", key: "1b14m6" }]
];
const MailCheck = createLucideIcon("mail-check", __iconNode);
function useNotifyCustomer() {
  const { actor } = useBackend();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.notifyCustomer(input);
    }
  });
}
function NotifyCustomerDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerEmail,
  source,
  referenceId,
  defaultSubject,
  defaultMessage
}) {
  const [subject, setSubject] = reactExports.useState(defaultSubject);
  const [message, setMessage] = reactExports.useState(defaultMessage);
  const [error, setError] = reactExports.useState(null);
  const [sentTo, setSentTo] = reactExports.useState(null);
  const notifyCustomer = useNotifyCustomer();
  const hasEmail = customerEmail !== null && customerEmail.trim() !== "";
  reactExports.useEffect(() => {
    if (open) {
      setSubject(defaultSubject);
      setMessage(defaultMessage);
      setError(null);
      setSentTo(null);
    }
  }, [open, defaultSubject, defaultMessage]);
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!hasEmail) return;
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (trimmedSubject === "" || trimmedMessage === "") {
      setError("El asunto y el mensaje son obligatorios.");
      return;
    }
    setError(null);
    const input = {
      customerId,
      source,
      referenceId,
      subject: trimmedSubject,
      message: trimmedMessage
    };
    notifyCustomer.mutate(input, {
      onSuccess: (result) => {
        if (!result.sent) {
          setSentTo(null);
          setError("No se pudo enviar la notificación.");
          return;
        }
        setError(null);
        setSentTo(result.email);
        ue.success(`Notificación enviada a ${result.email}`);
      },
      onError: () => {
        setSentTo(null);
        setError("No se pudo enviar la notificación.");
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "notify.dialog", className: "sm:max-w-lg", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Notificar al cliente" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
        "Envía el estado del servicio a ",
        customerName,
        " por correo."
      ] })
    ] }),
    hasEmail ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "notify-recipient", children: "Destinatario" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          id: "notify-recipient",
          value: customerEmail ?? "",
          readOnly: true,
          className: "data-rail",
          "data-ocid": "notify.recipient_input"
        }
      )
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "notify.no_email_state",
        className: "flex items-start gap-2.5 rounded-md border border-status-overdue/40 bg-status-overdue/10 px-3 py-2.5 text-xs text-status-overdue",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "mt-0.5 size-4 shrink-0",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            customerName,
            " no tiene un correo registrado. Registra el correo del cliente antes de enviar la notificación."
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "notify-subject", children: "Asunto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "notify-subject",
            value: subject,
            onChange: (event) => setSubject(event.target.value),
            disabled: !hasEmail,
            "data-ocid": "notify.subject_input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "notify-message", children: "Mensaje" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Textarea,
          {
            id: "notify-message",
            value: message,
            onChange: (event) => setMessage(event.target.value),
            rows: 6,
            disabled: !hasEmail,
            "data-ocid": "notify.message_textarea"
          }
        )
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "notify.form.error_state",
          className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
          children: error
        }
      ) : null,
      sentTo ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "p",
        {
          "data-ocid": "notify.success_state",
          className: "flex items-center gap-2 rounded-md border border-status-settled/40 bg-status-settled/10 px-3 py-2 text-xs text-status-settled",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MailCheck, { className: "size-4 shrink-0", "aria-hidden": "true" }),
            "Notificación enviada a ",
            sentTo,
            "."
          ]
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            "data-ocid": "notify.cancel_button",
            children: "Cerrar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "submit",
            disabled: !hasEmail || notifyCustomer.isPending,
            "data-ocid": "notify.submit_button",
            children: [
              notifyCustomer.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
              "Enviar notificación"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
export {
  NotifyCustomerDialog as N
};
