import { s as reactExports, j as jsxRuntimeExports, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, v as Input, $ as DialogFooter, B as Button, ah as LoaderCircle, ar as ue, ai as useParams, T as TriangleAlert, L as Link, E as UserRound, y as formatDate, F as FileText, G as Bike, n as formatNumber, C as ClipboardList, x as formatMoney } from "./index-CzQEXdHP.js";
import { C as ContactDocumentPreview } from "./ContactDocumentPreview-B3EvaQyu.js";
import { C as CustomerFormDialog } from "./CustomerFormDialog-CNcRZ4AG.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { d as useCreateMotorcycle, e as useUpdateMotorcycle, f as useCustomerDetail } from "./use-customers-Dk1G98vS.js";
import { O as OrderStatusBadge } from "./OrderStatusBadge-CxgFlEFQ.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { c as customerContactDocument, m as motorcycleRow } from "./use-whatsapp-hGj8iSf3.js";
import { A as ArrowLeft } from "./arrow-left-DLNUnNNY.js";
import { P as Pencil } from "./pencil-Vues_1SE.js";
import { P as Phone } from "./phone-B-73ly9n.js";
import { M as Mail } from "./mail-BsdNiCp8.js";
import { P as Plus } from "./plus-BM-BDOEL.js";
import "./DocumentPreview-CccqIWmY.js";
import "./printer-D9qf1U3g.js";
import "./download-6xWfJWG2.js";
import "./ban-DaWQDtIv.js";
import "./pdf-CwHQGLGj.js";
import "./download-DPgaDAHv.js";
const EMPTY_FORM = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  mileage: ""
};
function toFormState(motorcycle) {
  if (!motorcycle) return EMPTY_FORM;
  return {
    plate: motorcycle.plate,
    brand: motorcycle.brand,
    model: motorcycle.model,
    year: motorcycle.year.toString(),
    mileage: motorcycle.mileage.toString()
  };
}
function MotorcycleFormDialog({
  open,
  onOpenChange,
  customerId,
  motorcycle
}) {
  const [form, setForm] = reactExports.useState(EMPTY_FORM);
  const [error, setError] = reactExports.useState(null);
  const createMotorcycle = useCreateMotorcycle();
  const updateMotorcycle = useUpdateMotorcycle();
  const isEditing = motorcycle !== null;
  const isPending = createMotorcycle.isPending || updateMotorcycle.isPending;
  reactExports.useEffect(() => {
    if (open) {
      setForm(toFormState(motorcycle));
      setError(null);
    }
  }, [open, motorcycle]);
  const handleSubmit = (event) => {
    event.preventDefault();
    const plate = form.plate.trim().toUpperCase();
    const brand = form.brand.trim();
    const model = form.model.trim();
    const year = Number.parseInt(form.year, 10);
    const mileage = Number.parseInt(form.mileage, 10);
    if (plate === "" || brand === "" || model === "") {
      setError("La placa, la marca y el modelo son obligatorios.");
      return;
    }
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      setError("Indica un año válido de 4 dígitos.");
      return;
    }
    if (!Number.isFinite(mileage) || mileage < 0) {
      setError("El kilometraje debe ser un número mayor o igual a cero.");
      return;
    }
    setError(null);
    const input = {
      customerId,
      plate,
      brand,
      model,
      year: BigInt(year),
      mileage: BigInt(mileage)
    };
    if (isEditing && motorcycle) {
      updateMotorcycle.mutate(
        { id: motorcycle.id, input },
        {
          onSuccess: () => {
            ue.success("Moto actualizada");
            onOpenChange(false);
          },
          onError: () => setError("No se pudo guardar la moto.")
        }
      );
      return;
    }
    createMotorcycle.mutate(input, {
      onSuccess: () => {
        ue.success("Moto registrada");
        onOpenChange(false);
      },
      onError: () => setError("No se pudo guardar la moto.")
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { "data-ocid": "motorcycle.dialog", className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: isEditing ? "Editar moto" : "Nueva moto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: isEditing ? "Actualiza los datos de la motocicleta." : "Registra una motocicleta para este cliente." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "motorcycle-plate", children: "Placa" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "motorcycle-plate",
              value: form.plate,
              onChange: (event) => setForm((current) => ({
                ...current,
                plate: event.target.value
              })),
              placeholder: "ABC-123-A",
              className: "data-rail uppercase",
              "data-ocid": "motorcycle.plate_input"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "motorcycle-year", children: "Año" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "motorcycle-year",
              value: form.year,
              onChange: (event) => setForm((current) => ({
                ...current,
                year: event.target.value
              })),
              placeholder: "2021",
              inputMode: "numeric",
              className: "data-rail",
              "data-ocid": "motorcycle.year_input"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "motorcycle-brand", children: "Marca" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "motorcycle-brand",
              value: form.brand,
              onChange: (event) => setForm((current) => ({
                ...current,
                brand: event.target.value
              })),
              placeholder: "Italika",
              "data-ocid": "motorcycle.brand_input"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "motorcycle-model", children: "Modelo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "motorcycle-model",
              value: form.model,
              onChange: (event) => setForm((current) => ({
                ...current,
                model: event.target.value
              })),
              placeholder: "FT150",
              "data-ocid": "motorcycle.model_input"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "motorcycle-mileage", children: "Kilometraje" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "motorcycle-mileage",
            value: form.mileage,
            onChange: (event) => setForm((current) => ({
              ...current,
              mileage: event.target.value
            })),
            placeholder: "18450",
            inputMode: "numeric",
            className: "data-rail",
            "data-ocid": "motorcycle.mileage_input"
          }
        )
      ] }),
      error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          "data-ocid": "motorcycle.form.error_state",
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
            "data-ocid": "motorcycle.cancel_button",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "submit",
            disabled: isPending,
            "data-ocid": "motorcycle.submit_button",
            children: [
              isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
              isEditing ? "Guardar cambios" : "Registrar moto"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `detail-skeleton-${i}`
);
function DetailSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "customer_detail.loading_state", className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-40 w-full" }),
    SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id))
  ] });
}
function ContactRow({
  icon: Icon,
  label,
  value,
  mono
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Icon,
      {
        className: "mt-0.5 size-4 shrink-0 text-muted-foreground",
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "p",
        {
          className: mono ? "data-rail truncate text-sm text-foreground" : "truncate text-sm text-foreground",
          children: value
        }
      )
    ] })
  ] });
}
const MotorcycleRow = reactExports.memo(function MotorcycleRow2({
  motorcycle,
  index,
  onEdit
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { "data-ocid": `motorcycle.row.${index + 1}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail rounded border border-border bg-muted px-2 py-0.5 text-xs font-medium", children: motorcycle.plate }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: motorcycle.brand }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: motorcycle.model }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: motorcycle.year.toString() }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "data-rail text-right", children: [
      formatNumber(motorcycle.mileage),
      " km"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "icon",
        "aria-label": `Editar moto ${motorcycle.plate}`,
        onClick: () => onEdit(motorcycle),
        "data-ocid": `motorcycle.edit_button.${index + 1}`,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-4", "aria-hidden": "true" })
      }
    ) })
  ] });
});
function CustomerDetailPage() {
  const params = useParams({ from: "/clientes/$id" });
  const customerId = (() => {
    try {
      return BigInt(params.id);
    } catch {
      return null;
    }
  })();
  const { data, isLoading, isError, refetch, isFetching } = useCustomerDetail(customerId);
  const [customerDialogOpen, setCustomerDialogOpen] = reactExports.useState(false);
  const [motorcycleDialogOpen, setMotorcycleDialogOpen] = reactExports.useState(false);
  const [editingMotorcycle, setEditingMotorcycle] = reactExports.useState(
    null
  );
  const contactDocument = reactExports.useMemo(
    () => data ? customerContactDocument(
      data.customer,
      data.motorcycles.map(motorcycleRow)
    ) : null,
    [data]
  );
  const openCreateMotorcycle = reactExports.useCallback(() => {
    setEditingMotorcycle(null);
    setMotorcycleDialogOpen(true);
  }, []);
  const openEditMotorcycle = reactExports.useCallback((motorcycle) => {
    setEditingMotorcycle(motorcycle);
    setMotorcycleDialogOpen(true);
  }, []);
  const retryDetail = reactExports.useCallback(() => {
    void refetch();
  }, [refetch]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DetailSkeleton, {}) });
  }
  if (isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "customer_detail.error_state",
        className: "mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-12 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "size-6 text-destructive",
              "aria-hidden": "true"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "No se pudo cargar el cliente" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Revisa tu conexión e inténtalo de nuevo." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: retryDetail,
                disabled: isFetching,
                "data-ocid": "customer_detail.retry_button",
                className: "gap-2",
                children: [
                  isFetching ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin", "aria-hidden": "true" }) : null,
                  isFetching ? "Reintentando…" : "Reintentar"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                asChild: true,
                variant: "ghost",
                "data-ocid": "customer_detail.back_button",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/clientes", children: "Volver al directorio" })
              }
            )
          ] })
        ]
      }
    );
  }
  if (!data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "customer_detail.empty_state",
        className: "mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-12 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            UserRound,
            {
              className: "size-6 text-muted-foreground",
              "aria-hidden": "true"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "Cliente no encontrado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "El cliente que buscas no existe o fue eliminado del directorio." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              asChild: true,
              variant: "outline",
              "data-ocid": "customer_detail.back_button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/clientes", children: "Volver al directorio" })
            }
          )
        ]
      }
    );
  }
  const { customer, motorcycles, orders } = data;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "customer_detail.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/clientes",
            "data-ocid": "customer_detail.back_link",
            className: "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-3.5", "aria-hidden": "true" }),
              "Directorio de clientes"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4 border-b border-border bg-muted/30 px-5 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-5 text-primary", "aria-hidden": "true" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: "Ficha de cliente" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate font-display text-2xl font-semibold tracking-tight", children: customer.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                  "Cliente desde ",
                  formatDate(customer.createdAt)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              contactDocument ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                ContactDocumentPreview,
                {
                  document: contactDocument,
                  ocid: "customer_detail.preview_button",
                  label: "Ver ficha"
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setCustomerDialogOpen(true),
                  "data-ocid": "customer_detail.edit_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "size-4", "aria-hidden": "true" }),
                    "Editar datos"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ContactRow,
              {
                icon: Phone,
                label: "Teléfono",
                value: customer.phone,
                mono: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ContactRow,
              {
                icon: Mail,
                label: "Correo",
                value: customer.email ?? "—"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ContactRow,
              {
                icon: FileText,
                label: "Documento",
                value: customer.document ?? "—",
                mono: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ContactRow,
              {
                icon: Bike,
                label: "Motos registradas",
                value: formatNumber(motorcycles.length),
                mono: true
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bike, { className: "size-4 text-primary", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Motocicletas" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                size: "sm",
                onClick: openCreateMotorcycle,
                "data-ocid": "motorcycle.open_modal_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4", "aria-hidden": "true" }),
                  "Agregar moto"
                ]
              }
            )
          ] }),
          motorcycles.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "motorcycle.empty_state",
              className: "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Bike,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin motos registradas" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Agrega la primera motocicleta de este cliente para abrir órdenes de taller." })
                ] })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "motorcycle.table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-4", children: "Placa" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Marca" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Modelo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Año" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Kilometraje" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-16 px-4 text-right", children: "Acciones" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: motorcycles.map((motorcycle, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              MotorcycleRow,
              {
                motorcycle,
                index,
                onEdit: openEditMotorcycle
              },
              motorcycle.id.toString()
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "size-4 text-primary", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Historial de órdenes" })
          ] }),
          orders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "customer_orders.empty_state",
              className: "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ClipboardList,
                  {
                    className: "size-5 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "Sin órdenes de taller" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Este cliente todavía no tiene órdenes registradas." })
                ] })
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { "data-ocid": "customer_orders.table", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "px-4", children: "Número" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Estado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { children: "Placa" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right", children: "Fecha" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: orders.map((order, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TableRow,
              {
                "data-ocid": `customer_orders.row.${index + 1}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Link,
                    {
                      to: "/ordenes/$id",
                      params: { id: order.orderId.toString() },
                      "data-ocid": `customer_orders.link.${index + 1}`,
                      className: "data-rail font-medium text-foreground underline-offset-4 hover:text-primary hover:underline",
                      children: order.orderNumber
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(OrderStatusBadge, { status: order.status }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-xs text-muted-foreground", children: order.motorcyclePlate }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-medium", children: formatMoney(order.total) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatDate(order.createdAt) })
                ]
              },
              order.orderId.toString()
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CustomerFormDialog,
          {
            open: customerDialogOpen,
            onOpenChange: setCustomerDialogOpen,
            customer
          }
        ),
        customerId !== null ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          MotorcycleFormDialog,
          {
            open: motorcycleDialogOpen,
            onOpenChange: setMotorcycleDialogOpen,
            customerId,
            motorcycle: editingMotorcycle
          }
        ) : null
      ]
    }
  );
}
export {
  CustomerDetailPage
};
