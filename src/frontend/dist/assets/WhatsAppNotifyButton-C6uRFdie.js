import { K as createLucideIcon, s as reactExports, j as jsxRuntimeExports, B as Button, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, ah as LoaderCircle, T as TriangleAlert, F as FileText, $ as DialogFooter, ae as cn, ar as ue } from "./index-CzQEXdHP.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { T as Textarea } from "./textarea-C9U8oXYV.js";
import { a as usePrepareWhatsAppMessage, u as useContactDocumentPdf } from "./use-whatsapp-hGj8iSf3.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z", key: "vv11sd" }]
];
const MessageCircle = createLucideIcon("message-circle", __iconNode);
function buildWhatsAppUrl(phone, message) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
const FORMATS = [
  { value: "a4", label: "A4" },
  { value: "receipt80", label: "Tirilla 80 mm" }
];
function WhatsAppNotifyButton({
  contactKind,
  contactId,
  context,
  referenceId,
  contactName,
  label = "Enviar por WhatsApp",
  variant = "outline",
  size = "sm",
  className,
  ocid,
  attachment
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [message, setMessage] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState(null);
  const [hasPhone, setHasPhone] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [format, setFormat] = reactExports.useState("a4");
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const prepare = usePrepareWhatsAppMessage();
  const { mutate: prepareMessage } = prepare;
  const { download } = useContactDocumentPdf();
  reactExports.useEffect(() => {
    if (!open) return;
    setError(null);
    setHasPhone(null);
    setPhone(null);
    setMessage("");
    prepareMessage(
      { contactKind, contactId, context, referenceId },
      {
        onSuccess: (result) => {
          setHasPhone(result.hasPhone);
          setPhone(result.phone ?? null);
          setMessage(result.message);
        },
        onError: () => {
          setHasPhone(false);
          setError(
            "No se pudo preparar el mensaje de WhatsApp. Inténtalo de nuevo."
          );
        }
      }
    );
  }, [open, contactKind, contactId, context, referenceId, prepareMessage]);
  function handleOpen() {
    setOpen(true);
  }
  async function handleSend() {
    const trimmed = message.trim();
    if (trimmed === "") {
      setError("El mensaje no puede estar vacío.");
      return;
    }
    if (!phone) {
      setError("El contacto no tiene un teléfono registrado.");
      return;
    }
    if (attachment) {
      setIsGenerating(true);
      try {
        const fileName = await download(attachment, format);
        ue.success(`Documento ${fileName} descargado para adjuntar.`);
      } catch {
        setError(
          "No se pudo generar el PDF del documento. Inténtalo de nuevo."
        );
        setIsGenerating(false);
        return;
      }
      setIsGenerating(false);
    }
    window.open(
      buildWhatsAppUrl(phone, trimmed),
      "_blank",
      "noopener,noreferrer"
    );
    ue.success(`Abriendo WhatsApp para ${contactName}`);
    setOpen(false);
  }
  const isPreparing = prepare.isPending || hasPhone === null;
  const canSend = hasPhone === true && message.trim() !== "" && !isGenerating;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        type: "button",
        variant,
        size,
        onClick: handleOpen,
        "aria-label": `${label} a ${contactName}`,
        "data-ocid": ocid,
        className,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "size-4", "aria-hidden": "true" }),
          size === "icon" ? null : label
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "whatsapp.dialog", className: "sm:max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Enviar por WhatsApp" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
          "Revisa y edita el mensaje antes de abrir WhatsApp con",
          " ",
          contactName,
          "."
        ] })
      ] }),
      isPreparing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "whatsapp.loading_state",
          className: "flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }),
            "Preparando el mensaje…"
          ]
        }
      ) : hasPhone === false ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "whatsapp.no_phone_state",
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
              contactName,
              " no tiene un teléfono registrado. Registra el teléfono del contacto antes de enviar el mensaje por WhatsApp."
            ] })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "whatsapp-phone", children: "Teléfono" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "whatsapp-phone",
              "data-ocid": "whatsapp.phone_value",
              className: "data-rail rounded-md border border-border bg-muted px-2.5 py-1.5 font-mono text-xs text-foreground",
              children: phone ?? "—"
            }
          )
        ] }),
        attachment ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Documento adjunto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "whatsapp.attachment_panel",
              className: "rounded-md border border-border bg-muted/30 px-3 py-2.5",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-xs text-foreground", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    FileText,
                    {
                      className: "size-4 shrink-0 text-primary",
                      "aria-hidden": "true"
                    }
                  ),
                  attachment.title,
                  " · ",
                  attachment.number
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "fieldset",
                  {
                    "aria-label": "Formato del documento adjunto",
                    "data-ocid": "whatsapp.format_toggle",
                    className: "doc-format-toggle mt-2",
                    children: FORMATS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        "data-active": format === option.value,
                        "aria-pressed": format === option.value,
                        onClick: () => setFormat(option.value),
                        "data-ocid": `whatsapp.format_${option.value}`,
                        children: option.label
                      },
                      option.value
                    ))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-muted-foreground", children: "Al abrir WhatsApp se descargará el PDF en este formato para que lo adjuntes en la conversación." })
              ]
            }
          )
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "whatsapp-message", children: "Mensaje" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "whatsapp-message",
              value: message,
              onChange: (event) => setMessage(event.target.value),
              rows: 7,
              "data-ocid": "whatsapp.message_textarea"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Puedes editar el texto. Se abrirá WhatsApp con este mensaje prellenado." })
        ] })
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "whatsapp.form.error_state",
          className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive",
          children: error
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => setOpen(false),
            "data-ocid": "whatsapp.cancel_button",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            onClick: handleSend,
            disabled: !canSend,
            "data-ocid": "whatsapp.send_button",
            className: cn("gap-2"),
            children: [
              isGenerating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "size-4", "aria-hidden": "true" }),
              isGenerating ? "Generando PDF…" : "Abrir WhatsApp"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  WhatsAppNotifyButton as W
};
