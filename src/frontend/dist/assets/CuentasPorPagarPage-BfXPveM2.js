import { r as useNavigate, s as useSearch, aG as PayableStatus, t as reactExports, j as jsxRuntimeExports, B as Button, y as formatMoney, o as formatNumber, v as Search, w as Input, T as TriangleAlert, H as HandCoins, z as formatDate, e as Wallet, k as useBackend, l as useAuth, m as useQuery, aH as PaymentMethod, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, a3 as DialogFooter, ao as useQueryClient, ap as useMutation, av as ue } from "./index-EqGEeyjs.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-Dz_wGPQA.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
import "./check-LdjEv5O-.js";
const PAYABLES_QUERY_KEY = ["payables"];
const PURCHASES_QUERY_KEY = ["purchases"];
const FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: PayableStatus.pending, label: "Pendientes" },
  { value: PayableStatus.overdue, label: "Vencidas" },
  { value: PayableStatus.paid, label: "Pagadas" }
];
const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto"
};
const PAYMENT_METHOD_OPTIONS = [
  PaymentMethod.cash,
  PaymentMethod.card,
  PaymentMethod.transfer,
  PaymentMethod.mixed
];
const STATUS_LABELS = {
  [PayableStatus.pending]: "Pendiente",
  [PayableStatus.overdue]: "Vencida",
  [PayableStatus.paid]: "Pagada"
};
const STATUS_BADGE_CLASS = {
  [PayableStatus.pending]: "badge-open",
  [PayableStatus.overdue]: "badge-overdue",
  [PayableStatus.paid]: "badge-settled"
};
function usePayables() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: PAYABLES_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPayables(token);
    },
    enabled: !!actor && !isFetching
  });
}
function usePurchases() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: PURCHASES_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPurchases(token, null);
    },
    enabled: !!actor && !isFetching
  });
}
function useRegisterPayment() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerPayment(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier"] });
    }
  });
}
function parseAmountToCents(value) {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return BigInt(Math.round(amount * 100));
}
function overdueDays(dueDate) {
  const due = new Date(Number(dueDate / 1000000n));
  if (Number.isNaN(due.getTime())) return 0;
  const diff = Date.now() - due.getTime();
  return Math.max(0, Math.floor(diff / 864e5));
}
function purchaseReference(purchases, supplierId) {
  const pending = purchases.filter(
    (purchase) => purchase.supplierId === supplierId && purchase.paidAmount < purchase.total
  ).sort((a, b) => Number(a.createdAt - b.createdAt));
  const oldest = pending[0];
  return oldest ? `#${oldest.id.toString()}` : null;
}
function PaymentDialog({
  open,
  onOpenChange,
  payable,
  reference
}) {
  const [amount, setAmount] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState(PaymentMethod.cash);
  const [error, setError] = reactExports.useState(null);
  const registerPayment = useRegisterPayment();
  const balance = (payable == null ? void 0 : payable.balance) ?? 0n;
  function handleOpenChange(next) {
    if (next) {
      setAmount(balance > 0n ? (Number(balance) / 100).toFixed(2) : "");
      setMethod(PaymentMethod.cash);
      setError(null);
    }
    onOpenChange(next);
  }
  function handleSubmit(event) {
    event.preventDefault();
    if (!payable) return;
    const cents = parseAmountToCents(amount);
    if (cents === null) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    if (cents > payable.balance) {
      setError(
        `El monto no puede superar el saldo pendiente de ${formatMoney(payable.balance)}.`
      );
      return;
    }
    setError(null);
    registerPayment.mutate(
      {
        supplierId: payable.supplierId,
        amount: cents,
        method
      },
      {
        onSuccess: () => {
          ue.success("Pago registrado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            mutationError.message || "No se pudo registrar el pago. Revisa el monto e inténtalo de nuevo."
          );
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "payables.payment_dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Registrar pago" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: payable ? `Aplica un pago total o parcial a la cuenta de ${payable.supplierName}.` : "Aplica un pago total o parcial al saldo pendiente del proveedor." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payable-payment-amount", children: "Monto (COP)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "payable-payment-amount",
                value: amount,
                onChange: (event) => setAmount(event.target.value),
                inputMode: "decimal",
                placeholder: "1500.00",
                "data-ocid": "payables.payment_amount_input",
                className: "data-rail",
                required: true
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Saldo pendiente actual: ",
              formatMoney(balance),
              reference ? ` · Compra ${reference}` : ""
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "payable-payment-method", children: "Método de pago" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: method,
                onValueChange: (value) => setMethod(value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "payable-payment-method",
                      "data-ocid": "payables.payment_method_select",
                      className: "w-full",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecciona un método" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: option, children: PAYMENT_METHOD_LABELS[option] }, option)) })
                ]
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "payables.payment_error",
              className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
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
                "data-ocid": "payables.payment_cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: registerPayment.isPending,
                "data-ocid": "payables.payment_submit_button",
                children: registerPayment.isPending ? "Registrando…" : "Registrar pago"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function TableSkeleton() {
  const rows = Array.from(
    { length: 6 },
    (_, index) => `payables-skeleton-${index}`
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "payables.loading_state", className: "space-y-2 p-4", "aria-busy": true, children: rows.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)) });
}
function CuentasPorPagarPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false });
  const statusFilter = rawSearch.status === PayableStatus.pending || rawSearch.status === PayableStatus.overdue || rawSearch.status === PayableStatus.paid ? rawSearch.status : "all";
  const search = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const [searchInput, setSearchInput] = reactExports.useState(search);
  const [paymentTarget, setPaymentTarget] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (searchInput === search) return;
    const handle = window.setTimeout(() => {
      void navigate({
        to: "/cuentas-por-pagar",
        search: (previous) => ({
          ...previous,
          q: searchInput.trim().length > 0 ? searchInput : void 0
        }),
        replace: true
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchInput, search, navigate]);
  const payablesQuery = usePayables();
  const purchasesQuery = usePurchases();
  const payables = payablesQuery.data ?? [];
  const purchases = purchasesQuery.data ?? [];
  const isLoading = payablesQuery.isLoading || purchasesQuery.isLoading;
  const isError = payablesQuery.isError || purchasesQuery.isError;
  function refetchAll() {
    void payablesQuery.refetch({ cancelRefetch: true });
    void purchasesQuery.refetch({ cancelRefetch: true });
  }
  const term = search.trim().toLowerCase();
  const filtered = payables.filter((payable) => {
    if (statusFilter !== "all" && payable.status !== statusFilter) return false;
    if (term === "") return true;
    const reference = purchaseReference(purchases, payable.supplierId) ?? "";
    return payable.supplierName.toLowerCase().includes(term) || reference.toLowerCase().includes(term);
  });
  const totalOutstanding = payables.filter((payable) => payable.status !== PayableStatus.paid).reduce((sum, payable) => sum + payable.balance, 0n);
  const totalOverdue = payables.filter((payable) => payable.status === PayableStatus.overdue).reduce((sum, payable) => sum + payable.balance, 0n);
  const openCount = payables.filter(
    (payable) => payable.status !== PayableStatus.paid
  ).length;
  function countFor(filter) {
    if (filter === "all") return payables.length;
    return payables.filter((payable) => payable.status === filter).length;
  }
  function setStatusFilter(next) {
    void navigate({
      to: "/cuentas-por-pagar",
      search: (previous) => ({
        ...previous,
        status: next === "all" ? void 0 : next
      }),
      replace: true
    });
  }
  const hasQuery = search.length > 0 || statusFilter !== "all";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "payables.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Cuentas por pagar",
            description: "Saldos pendientes con proveedores, vencimientos y registro de pagos.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                size: "sm",
                onClick: refetchAll,
                disabled: isLoading,
                "data-ocid": "payables.refresh_button",
                children: "Actualizar"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "payables.summary",
            "aria-label": "Resumen de cuentas por pagar",
            className: "accounts-summary",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "accounts-card", "data-emphasis": "primary", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-label", children: "Total por pagar" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-value", children: formatMoney(totalOutstanding) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-meta", children: "Saldo pendiente con proveedores" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "accounts-card", "data-emphasis": "overdue", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-label", children: "Total vencido" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-value", children: formatMoney(totalOverdue) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-meta", children: "Cuentas con vencimiento superado" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "accounts-card", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-label", children: "Cuentas abiertas" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-value", children: formatNumber(openCount) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "accounts-card-meta", children: "Pendientes y vencidas por liquidar" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "fieldset",
            {
              "data-ocid": "payables.filter.chips",
              className: "filter-chips",
              "aria-label": "Filtrar por estado",
              children: FILTER_OPTIONS.map((option) => {
                const isActive = statusFilter === option.value;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setStatusFilter(option.value),
                    "data-active": isActive,
                    "data-ocid": `payables.filter.${option.value}`,
                    "aria-pressed": isActive,
                    className: "filter-chip",
                    children: [
                      option.label,
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "filter-chip-count", children: formatNumber(countFor(option.value)) })
                    ]
                  },
                  option.value
                );
              })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full lg:max-w-xs", children: [
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
                value: searchInput,
                onChange: (event) => setSearchInput(event.target.value),
                placeholder: "Buscar proveedor o referencia",
                "aria-label": "Buscar por proveedor o referencia de compra",
                "data-ocid": "payables.search_input",
                className: "pl-9"
              }
            )
          ] })
        ] }),
        isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "payables.error_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TriangleAlert,
                {
                  className: "size-5 text-destructive",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "No se pudieron cargar las cuentas por pagar" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Verifica la conexión con el backend e inténtalo de nuevo." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: refetchAll,
                  "data-ocid": "payables.retry_button",
                  children: "Reintentar"
                }
              )
            ]
          }
        ) : isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "payables.empty_state",
            className: "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                HandCoins,
                {
                  className: "size-5 text-muted-foreground",
                  "aria-hidden": "true"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasQuery ? "Sin cuentas que coincidan" : "Sin cuentas por pagar" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasQuery ? "Ajusta el filtro o la búsqueda para ver otras cuentas." : "Registra compras a proveedor para generar saldos pendientes." })
              ] }),
              hasQuery ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  size: "sm",
                  onClick: () => {
                    setSearchInput("");
                    void navigate({
                      to: "/cuentas-por-pagar",
                      search: {},
                      replace: true
                    });
                  },
                  "data-ocid": "payables.clear_filters_button",
                  children: "Limpiar filtros"
                }
              ) : null
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            "data-ocid": "payables.table",
            className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "scroll-slim overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { className: "sticky top-0 z-10 bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "pl-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Proveedor" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Referencia" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Monto total" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Saldo pendiente" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Vencimiento" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Estado" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "w-px pr-4 text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Acciones" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: filtered.map((payable, index) => {
                const reference = purchaseReference(
                  purchases,
                  payable.supplierId
                );
                const isOverdue = payable.status === PayableStatus.overdue;
                const isPaid = payable.status === PayableStatus.paid;
                const days = isOverdue ? overdueDays(payable.dueDate) : 0;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  TableRow,
                  {
                    "data-ocid": `payables.row.${index + 1}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pl-4 font-medium", children: payable.supplierName }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-muted-foreground", children: reference ?? "—" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right", children: formatMoney(payable.totalPurchased) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right font-semibold", children: formatMoney(payable.balance) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isOverdue ? "due-overdue" : "", children: formatDate(payable.dueDate) }),
                        isOverdue && days > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "due-overdue-days", children: `+${formatNumber(days)} d` }) : null
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: `badge-status ${STATUS_BADGE_CLASS[payable.status]}`,
                          "data-ocid": `payables.status_badge.${index + 1}`,
                          children: STATUS_LABELS[payable.status]
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "pr-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "row-actions", "data-pinned": "false", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          title: "Registrar pago",
                          "aria-label": `Registrar pago a ${payable.supplierName}`,
                          disabled: isPaid || payable.balance <= 0n,
                          "data-ocid": `payables.pay_button.${index + 1}`,
                          onClick: () => setPaymentTarget(payable),
                          className: "row-action disabled:pointer-events-none disabled:opacity-40",
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "size-3.5", "aria-hidden": "true" })
                        }
                      ) }) })
                    ]
                  },
                  payable.supplierId.toString()
                );
              }) })
            ] }) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PaymentDialog,
          {
            open: paymentTarget !== null,
            onOpenChange: (open) => {
              if (!open) setPaymentTarget(null);
            },
            payable: paymentTarget,
            reference: paymentTarget ? purchaseReference(purchases, paymentTarget.supplierId) : null
          }
        )
      ]
    }
  );
}
export {
  CuentasPorPagarPage
};
