import { q as useNavigate, s as reactExports, j as jsxRuntimeExports, B as Button, E as UserRound, X, t as Search, v as Input, G as Bike, n as formatNumber, T as TriangleAlert, J as Save } from "./index-CzQEXdHP.js";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent } from "./card-D8aqbagN.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Textarea } from "./textarea-C9U8oXYV.js";
import { d as useCustomers, e as useMotorcycles, f as useCreateOrder, g as errorMessage } from "./use-orders-CNKkgAC3.js";
import { A as ArrowLeft } from "./arrow-left-DLNUnNNY.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}
function NewOrderPage() {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = reactExports.useState(null);
  const [motorcycleId, setMotorcycleId] = reactExports.useState(null);
  const [mileage, setMileage] = reactExports.useState("");
  const [problem, setProblem] = reactExports.useState("");
  const [formError, setFormError] = reactExports.useState(null);
  const [customerSearch, setCustomerSearch] = reactExports.useState("");
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);
  const customersQuery = useCustomers(debouncedCustomerSearch);
  const motorcyclesQuery = useMotorcycles(customerId);
  const createOrder = useCreateOrder();
  const customerTerm = debouncedCustomerSearch.trim();
  const customerResults = customersQuery.data ?? [];
  const customers = customerTerm.length > 0 ? customerResults : [];
  const selectedCustomer = customerResults.find((item) => item.id === customerId) ?? null;
  const directoryEmpty = customerTerm.length === 0 && customerResults.length === 0;
  const motorcycles = motorcyclesQuery.data ?? [];
  const mileageValue = mileage.trim() === "" ? null : Number(mileage);
  const mileageValid = mileageValue !== null && Number.isFinite(mileageValue) && mileageValue >= 0 && Number.isInteger(mileageValue);
  const problemValid = problem.trim().length > 0;
  const canSubmit = customerId !== null && motorcycleId !== null && mileageValid && problemValid && !createOrder.isPending;
  function handleSelectCustomer(customer) {
    setCustomerId(customer.id);
    setMotorcycleId(null);
    setFormError(null);
  }
  function handleChangeCustomer() {
    setCustomerId(null);
    setMotorcycleId(null);
    setCustomerSearch("");
    setFormError(null);
  }
  function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    if (customerId === null) {
      setFormError("Selecciona el cliente de la moto.");
      return;
    }
    if (motorcycleId === null) {
      setFormError("Selecciona la motocicleta que ingresa al taller.");
      return;
    }
    if (!mileageValid || mileageValue === null) {
      setFormError("Captura un kilometraje de ingreso válido (número entero).");
      return;
    }
    if (!problemValid) {
      setFormError("Describe la falla o el servicio solicitado.");
      return;
    }
    createOrder.mutate(
      {
        customerId,
        motorcycleId,
        intakeMileage: BigInt(mileageValue),
        technicianIds: [],
        problem: problem.trim()
      },
      {
        onSuccess: (view) => {
          void navigate({
            to: "/ordenes/$id",
            params: { id: view.order.id.toString() }
          });
        },
        onError: (error) => {
          setFormError(errorMessage(error));
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "new_order.page",
      className: "mx-auto w-full max-w-3xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              className: "-ml-2 gap-1.5 text-muted-foreground",
              onClick: () => void navigate({ to: "/ordenes" }),
              "data-ocid": "new_order.back_button",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
                "Volver a órdenes"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Nueva orden de taller" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-2xl text-sm text-muted-foreground", children: "Registra el ingreso de una moto: cliente, motocicleta, kilometraje y falla reportada." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("form", { onSubmit: handleSubmit, noValidate: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "gap-0 rounded-lg py-0 shadow-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "border-b border-border px-5 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 font-display text-sm font-semibold tracking-tight", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserRound, { className: "size-4 text-primary", "aria-hidden": "true" }),
            "Datos de ingreso"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-5 px-5 py-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "order-customer-search", children: "Cliente" }),
                selectedCustomer ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    "data-ocid": "new_order.customer_selected",
                    className: "flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium", children: selectedCustomer.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail truncate text-xs text-muted-foreground", children: selectedCustomer.phone })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          variant: "ghost",
                          size: "sm",
                          onClick: handleChangeCustomer,
                          "data-ocid": "new_order.change_customer_button",
                          className: "shrink-0 gap-1.5 text-muted-foreground",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5", "aria-hidden": "true" }),
                            "Cambiar"
                          ]
                        }
                      )
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Search,
                      {
                        className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                        "aria-hidden": "true"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Input,
                      {
                        id: "order-customer-search",
                        type: "search",
                        value: customerSearch,
                        onChange: (event) => {
                          setCustomerSearch(event.target.value);
                          setFormError(null);
                        },
                        placeholder: "Buscar por nombre, teléfono o placa…",
                        "aria-label": "Buscar cliente por nombre, teléfono o placa",
                        "data-ocid": "new_order.customer_search_input",
                        className: "pl-9"
                      }
                    )
                  ] }),
                  customerTerm.length === 0 ? directoryEmpty ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      "data-ocid": "new_order.customer_directory_empty_state",
                      className: "text-xs text-muted-foreground",
                      children: "No hay clientes registrados. Crea un cliente antes de levantar una orden."
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      "data-ocid": "new_order.customer_search.prompt_state",
                      className: "rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground",
                      children: "Escribe el nombre, el teléfono o la placa para ver coincidencias."
                    }
                  ) : customersQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }) : customersQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      "data-ocid": "new_order.customer_search.error_state",
                      className: "text-xs text-destructive",
                      children: "No se pudo cargar el directorio de clientes. Inténtalo de nuevo."
                    }
                  ) : customers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      "data-ocid": "new_order.customer_search.empty_state",
                      className: "rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground",
                      children: `Sin clientes que coincidan con “${customerTerm}”.`
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "ul",
                    {
                      "data-ocid": "new_order.customer_search.list",
                      className: "max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1",
                      children: customers.map((customer, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleSelectCustomer(customer),
                          "data-ocid": `new_order.customer_search.item.${index + 1}`,
                          className: "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate text-sm font-medium", children: customer.name }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail mt-0.5 block truncate text-xs text-muted-foreground", children: customer.phone })
                          ] })
                        }
                      ) }, customer.id.toString()))
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "order-motorcycle", children: "Motocicleta" }),
                customerId === null ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "flex h-9 items-center rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground", children: "Selecciona primero un cliente" }) : motorcyclesQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }) : motorcycles.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Este cliente no tiene motos registradas." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Select,
                  {
                    value: (motorcycleId == null ? void 0 : motorcycleId.toString()) ?? "",
                    onValueChange: (value) => {
                      setMotorcycleId(BigInt(value));
                      setFormError(null);
                    },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectTrigger,
                        {
                          id: "order-motorcycle",
                          "data-ocid": "new_order.motorcycle_select",
                          className: "w-full",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona la moto" })
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: motorcycles.map((moto) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SelectItem,
                        {
                          value: moto.id.toString(),
                          children: `${moto.brand} ${moto.model} · ${moto.plate}`
                        },
                        moto.id.toString()
                      )) })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "order-mileage", children: "Kilometraje de ingreso" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Bike,
                  {
                    className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                    "aria-hidden": "true"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "order-mileage",
                    type: "number",
                    inputMode: "numeric",
                    min: 0,
                    step: 1,
                    value: mileage,
                    onChange: (event) => {
                      setMileage(event.target.value);
                      setFormError(null);
                    },
                    placeholder: "Ej. 24500",
                    "data-ocid": "new_order.mileage_input",
                    className: "data-rail pl-9"
                  }
                )
              ] }),
              mileageValid ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-xs text-muted-foreground", children: [
                formatNumber(mileageValue),
                " km"
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "order-problem", children: "Falla o servicio solicitado" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  id: "order-problem",
                  value: problem,
                  onChange: (event) => {
                    setProblem(event.target.value);
                    setFormError(null);
                  },
                  rows: 4,
                  placeholder: "Describe el síntoma reportado por el cliente, ruidos, fugas o el servicio a realizar…",
                  "data-ocid": "new_order.problem_textarea"
                }
              )
            ] }),
            formError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "new_order.error_state",
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
            ) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: () => void navigate({ to: "/ordenes" }),
                "data-ocid": "new_order.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "submit",
                disabled: !canSubmit,
                "data-ocid": "new_order.submit_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "size-4", "aria-hidden": "true" }),
                  createOrder.isPending ? "Creando orden…" : "Crear orden"
                ]
              }
            )
          ] })
        ] }) })
      ]
    }
  );
}
export {
  NewOrderPage
};
