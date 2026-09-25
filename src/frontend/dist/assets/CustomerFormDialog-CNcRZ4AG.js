import { s as reactExports, j as jsxRuntimeExports, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, v as Input, $ as DialogFooter, B as Button, ah as LoaderCircle, ar as ue } from "./index-CzQEXdHP.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { g as useCreateCustomer, h as useUpdateCustomer } from "./use-customers-Dk1G98vS.js";
const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  document: "",
  address: ""
};
function toFormState(customer) {
  if (!customer) return EMPTY_FORM;
  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? "",
    document: customer.document ?? "",
    address: customer.address ?? ""
  };
}
function CustomerFormDialog({
  open,
  onOpenChange,
  customer
}) {
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const isEditing = customer !== null;
  const isPending = createCustomer.isPending || updateCustomer.isPending;
  reactExports.useEffect(() => {
    if (open) {
      setForm(toFormState(customer));
      setError(null);
    }
  }, [open, customer]);
  const handleSubmit = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (name === "" || phone === "") {
      setError("El nombre y el teléfono son obligatorios.");
      return;
    }
    setError(null);
    const input = {
      name,
      phone,
      email: form.email.trim() === "" ? void 0 : form.email.trim(),
      document: form.document.trim() === "" ? void 0 : form.document.trim(),
      address: form.address.trim() === "" ? void 0 : form.address.trim()
    };
    if (isEditing && customer) {
      updateCustomer.mutate(
        { id: customer.id, input },
        {
          onSuccess: () => {
            ue.success("Cliente actualizado");
            onOpenChange(false);
          },
          onError: () => setError("No se pudo guardar el cliente.")
        }
      );
      return;
    }
    createCustomer.mutate(input, {
      onSuccess: () => {
        ue.success("Cliente registrado");
        onOpenChange(false);
      },
      onError: () => setError("No se pudo guardar el cliente.")
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "customer.dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: isEditing ? "Editar cliente" : "Nuevo cliente" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: isEditing ? "Actualiza los datos de contacto del cliente." : "Registra los datos de contacto para vincular motos y órdenes." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "customer-name", children: "Nombre completo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "customer-name",
            value: form.name,
            onChange: (event) => setForm((current) => ({ ...current, name: event.target.value })),
            placeholder: "Ej. Marco Antonio Ruiz",
            autoComplete: "name",
            "data-ocid": "customer.name_input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "customer-phone", children: "Teléfono" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "customer-phone",
              value: form.phone,
              onChange: (event) => setForm((current) => ({
                ...current,
                phone: event.target.value
              })),
              placeholder: "55 1234 5678",
              inputMode: "tel",
              autoComplete: "tel",
              className: "data-rail",
              "data-ocid": "customer.phone_input"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "customer-document", children: "Documento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "customer-document",
              value: form.document,
              onChange: (event) => setForm((current) => ({
                ...current,
                document: event.target.value
              })),
              placeholder: "INE / RFC",
              className: "data-rail",
              "data-ocid": "customer.document_input"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "customer-address", children: "Dirección fiscal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "customer-address",
            value: form.address,
            onChange: (event) => setForm((current) => ({
              ...current,
              address: event.target.value
            })),
            placeholder: "Calle 45 #12-30, Bogotá",
            autoComplete: "street-address",
            "data-ocid": "customer.address_input"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "customer-email", children: "Correo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "customer-email",
            type: "email",
            value: form.email,
            onChange: (event) => setForm((current) => ({
              ...current,
              email: event.target.value
            })),
            placeholder: "cliente@correo.com",
            autoComplete: "email",
            "data-ocid": "customer.email_input"
          }
        )
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "customer.form.error_state",
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
            onClick: () => onOpenChange(false),
            "data-ocid": "customer.cancel_button",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "submit",
            disabled: isPending,
            "data-ocid": "customer.submit_button",
            children: [
              isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
              isEditing ? "Guardar cambios" : "Registrar cliente"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
export {
  CustomerFormDialog as C
};
