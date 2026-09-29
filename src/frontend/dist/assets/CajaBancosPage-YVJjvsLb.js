import { Y as createLucideIcon, j as jsxRuntimeExports, e as Wallet, aj as formatDateTime, g as Banknote, y as formatMoney, bD as Landmark, Z as cn, k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation, aH as PaymentMethod, bE as CashMovementKind, bF as CashAccount, bG as CashMovementSource, t as reactExports, _ as Dialog, $ as DialogContent, a0 as DialogHeader, a1 as DialogTitle, a2 as DialogDescription, K as Label, w as Input, a3 as DialogFooter, B as Button, av as ue, aL as colombiaStartOfDay, aK as colombiaEndOfDay, o as formatNumber, T as TriangleAlert, R as Receipt, G as ChevronRight, bH as ShiftStatus, F as FileText } from "./index-EqGEeyjs.js";
import { P as PageHeader } from "./PageHeader-hVM7WgXk.js";
import { S as StatusBadge } from "./StatusBadge-DoLeoyAw.js";
import { C as Card, c as CardContent } from "./card-YKA4f36t.js";
import { S as Skeleton } from "./skeleton-mWxw7Afe.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BKwq6Kpv.js";
import { T as Textarea } from "./textarea-B0CUuiY-.js";
import { D as DataTable } from "./DataTable-BGUSfdBQ.js";
import { R as RotateCcw } from "./rotate-ccw-DHzTN9NH.js";
import { C as ChevronLeft } from "./chevron-left-C2006Y0h.js";
import { H as History } from "./history-Nsgyxjng.js";
import { D as DocumentPreview } from "./DocumentPreview-C4gHQdTZ.js";
import { u as useCompanyProfile } from "./use-company-B0ILLjch.js";
import { u as useDailyHopeMessage } from "./use-hope-35eM4bcJ.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { h as hopeMessageContent, p as pdfCompanyFromProfile, l as loadPdfLibs, a as drawHopeMessage } from "./pdf-BjjrMDP3.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BzrDtpRR.js";
import { P as Printer } from "./printer-CZZ39YEy.js";
import { L as Lock } from "./lock-BMYeStMW.js";
import "./index-Bg9EgBy1.js";
import "./index-DDy-lNY6.js";
import "./chevron-up-VeGPxiez.js";
import "./check-LdjEv5O-.js";
import "./alert-dialog-qVL9cwOA.js";
import "./table-Dz_wGPQA.js";
import "./trash-2-HQabmlQI.js";
import "./pencil-BajrtuU3.js";
import "./download-C8tLpeh6.js";
import "./warranty-BU5LnZHy.js";
import "./index-B1QqcSkg.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 8v8", key: "napkw2" }],
  ["path", { d: "m8 12 4 4 4-4", key: "k98ssh" }]
];
const CircleArrowDown = createLucideIcon("circle-arrow-down", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m16 12-4-4-4 4", key: "177agl" }],
  ["path", { d: "M12 16V8", key: "1sbj14" }]
];
const CircleArrowUp = createLucideIcon("circle-arrow-up", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 9.9-1", key: "1mm8w8" }]
];
const LockOpen = createLucideIcon("lock-open", __iconNode);
function BalanceTile({
  label,
  value,
  hint,
  icon,
  accentClass,
  ocid
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": ocid,
      className: "relative gap-0 overflow-hidden rounded-lg py-0 shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            "aria-hidden": "true",
            className: cn("absolute inset-y-0 left-0 w-0.5", accentClass)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-1 px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", "aria-hidden": "true", children: icon })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "data-rail text-2xl font-semibold leading-none", children: value }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: hint })
        ] })
      ]
    }
  );
}
function CashBalancesPanel({
  shift,
  isLoading,
  isError
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "section",
      {
        "data-ocid": "caja.balances.loading_state",
        "aria-label": "Saldos de caja y bancos",
        className: "grid gap-4 sm:grid-cols-3",
        children: Array.from(
          { length: 3 },
          (_, index) => `balance-skeleton-${index}`
        ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[104px] w-full rounded-lg" }, id))
      }
    );
  }
  if (isError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "section",
      {
        "data-ocid": "caja.balances.error_state",
        "aria-label": "Saldos de caja y bancos",
        className: "rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        children: "No se pudieron cargar los saldos de caja y bancos."
      }
    );
  }
  if (!shift) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        "data-ocid": "caja.balances.closed_state",
        "aria-label": "Saldos de caja y bancos",
        className: "flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-6 py-8 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "size-5 text-muted-foreground", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "La caja está cerrada" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-xs text-muted-foreground", children: "Abre un turno con el saldo inicial de caja y bancos para empezar a registrar movimientos del día." })
        ]
      }
    );
  }
  const isOpen = shift.status === "open";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "caja.balances.section",
      "aria-label": "Saldos de caja y bancos",
      className: "space-y-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
            "Turno #",
            shift.id.toString(),
            " · abierto",
            " ",
            formatDateTime(shift.openedAt)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            StatusBadge,
            {
              label: isOpen ? "Turno abierto" : "Turno cerrado",
              tone: isOpen ? "accepted" : "neutral"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            BalanceTile,
            {
              ocid: "caja.balances.cash",
              label: "Caja (efectivo)",
              value: formatMoney(shift.computedClosingCash),
              hint: `Saldo inicial ${formatMoney(shift.openingCash)}`,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Banknote, { className: "size-4" }),
              accentClass: "bg-primary"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            BalanceTile,
            {
              ocid: "caja.balances.bank",
              label: "Bancos",
              value: formatMoney(shift.computedClosingBank),
              hint: `Saldo inicial ${formatMoney(shift.openingBank)}`,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "size-4" }),
              accentClass: "bg-info"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            BalanceTile,
            {
              ocid: "caja.balances.total",
              label: "Total disponible",
              value: formatMoney(
                shift.computedClosingCash + shift.computedClosingBank
              ),
              hint: "Caja más bancos del turno",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "size-4" }),
              accentClass: "bg-accent"
            }
          )
        ] })
      ]
    }
  );
}
const CASH_KEY = "cash";
function invalidateCashData(queryClient) {
  void queryClient.invalidateQueries({ queryKey: [CASH_KEY] });
  void queryClient.invalidateQueries({ queryKey: ["accounting-summary"] });
  void queryClient.invalidateQueries({ queryKey: ["accounting-report"] });
  void queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
}
function useShifts(params) {
  var _a, _b;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      CASH_KEY,
      "shifts",
      params.status ?? "all",
      ((_a = params.from) == null ? void 0 : _a.toString()) ?? "none",
      ((_b = params.to) == null ? void 0 : _b.toString()) ?? "none",
      params.offset,
      params.limit
    ],
    queryFn: async () => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter = {
        status: params.status ?? void 0,
        from: params.from ?? void 0,
        to: params.to ?? void 0
      };
      return actor.listShifts(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit)
      );
    },
    enabled: !!actor && !isFetching
  });
}
function useOpenShift() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [CASH_KEY, "open-shift"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOpenShift(token);
    },
    enabled: !!actor && !isFetching
  });
}
function useOpenShiftMutation() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.openShift(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useCloseShift() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.closeShift(token, variables.shiftId, variables.input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useCashMovements(params) {
  var _a, _b, _c;
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [
      CASH_KEY,
      "movements",
      ((_a = params.shiftId) == null ? void 0 : _a.toString()) ?? "all",
      params.kind ?? "all",
      params.account ?? "all",
      params.paymentMethod ?? "all",
      ((_b = params.from) == null ? void 0 : _b.toString()) ?? "none",
      ((_c = params.to) == null ? void 0 : _c.toString()) ?? "none",
      params.offset,
      params.limit
    ],
    queryFn: async () => {
      if (!actor) {
        return { items: [], total: 0n, offset: 0n, limit: 0n };
      }
      const filter = {
        shiftId: params.shiftId ?? void 0,
        kind: params.kind ?? void 0,
        account: params.account ?? void 0,
        paymentMethod: params.paymentMethod ?? void 0,
        from: params.from ?? void 0,
        to: params.to ?? void 0
      };
      return actor.listCashMovements(
        token,
        filter,
        BigInt(params.offset),
        BigInt(params.limit)
      );
    },
    enabled: !!actor && !isFetching
  });
}
function useRegisterCashMovement() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerCashMovement(token, input);
    },
    onSuccess: () => {
      invalidateCashData(queryClient);
    }
  });
}
function useDailyShiftReport(shiftId) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: [CASH_KEY, "daily-report", (shiftId == null ? void 0 : shiftId.toString()) ?? "none"],
    queryFn: async () => {
      if (!actor || shiftId === null) return null;
      return actor.getDailyShiftReport(token, shiftId);
    },
    enabled: !!actor && !isFetching && shiftId !== null
  });
}
const PAYMENT_METHOD_LABELS = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.mixed]: "Mixto"
};
const PAYMENT_METHOD_OPTIONS = [
  PaymentMethod.cash,
  PaymentMethod.transfer,
  PaymentMethod.card,
  PaymentMethod.mixed
];
function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
function movementKindLabel(kind) {
  return kind === CashMovementKind.income ? "Ingreso" : "Egreso";
}
function accountLabel(account) {
  return account === CashAccount.cash ? "Caja" : "Bancos";
}
function movementSourceLabel(source) {
  switch (source) {
    case CashMovementSource.manual:
      return "Manual";
    case CashMovementSource.pos:
      return "POS";
    case CashMovementSource.invoice:
      return "Factura";
    case CashMovementSource.expense:
      return "Gasto";
    case CashMovementSource.purchase:
      return "Compra";
    case CashMovementSource.commission:
      return "Comisión";
    case CashMovementSource.receivable:
      return "Cartera";
    default:
      return "Otro";
  }
}
function accountForPaymentMethod(method) {
  if (method === PaymentMethod.cash) return CashAccount.cash;
  if (method === PaymentMethod.transfer || method === PaymentMethod.card) {
    return CashAccount.bank;
  }
  return null;
}
function parseAmount(value) {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (normalized === "") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}
function centsToInput(cents) {
  return (Number(cents) / 100).toFixed(2);
}
function emptyForm$1() {
  return {
    kind: CashMovementKind.income,
    paymentMethod: PaymentMethod.cash,
    account: CashAccount.cash,
    amount: "",
    description: "",
    reference: ""
  };
}
function CashMovementDialog({
  open,
  onOpenChange
}) {
  const [form, setForm] = reactExports.useState(emptyForm$1);
  const [error, setError] = reactExports.useState(null);
  const registerMovement = useRegisterCashMovement();
  reactExports.useEffect(() => {
    if (open) {
      setForm(emptyForm$1());
      setError(null);
    }
  }, [open]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function selectPaymentMethod(method) {
    const derived = accountForPaymentMethod(method);
    setForm((current) => ({
      ...current,
      paymentMethod: method,
      account: derived ?? current.account
    }));
  }
  const derivedAccount = accountForPaymentMethod(form.paymentMethod);
  const isMixed = form.paymentMethod === PaymentMethod.mixed;
  function handleSubmit(event) {
    event.preventDefault();
    const description = form.description.trim();
    if (description === "") {
      setError("Describe el movimiento para poder identificarlo.");
      return;
    }
    const amount = parseAmount(form.amount);
    if (amount === null || amount === 0n) {
      setError("Captura un monto válido mayor a cero.");
      return;
    }
    const input = {
      kind: form.kind,
      paymentMethod: form.paymentMethod,
      account: form.account,
      amount,
      description,
      reference: form.reference.trim() === "" ? void 0 : form.reference.trim(),
      source: CashMovementSource.manual
    };
    setError(null);
    registerMovement.mutate(input, {
      onSuccess: () => {
        ue.success(
          form.kind === CashMovementKind.income ? "Ingreso registrado" : "Egreso registrado"
        );
        onOpenChange(false);
      },
      onError: (mutationError) => {
        setError(
          mutationError.message || "No se pudo registrar el movimiento. Inténtalo de nuevo."
        );
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "caja.movement.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Registrar movimiento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Clasifica el movimiento por medio de pago. El efectivo afecta Caja; la transferencia y la tarjeta afectan Bancos." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "text-sm font-medium", children: "Tipo de movimiento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: [CashMovementKind.income, CashMovementKind.expense].map(
              (kind) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  "aria-pressed": form.kind === kind,
                  onClick: () => update("kind", kind),
                  "data-ocid": `caja.movement.kind_${kind}`,
                  className: cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-smooth",
                    form.kind === kind ? kind === CashMovementKind.income ? "border-success/50 bg-success/10 text-success" : "border-destructive/50 bg-destructive/10 text-destructive" : "border-input bg-card text-muted-foreground hover:bg-muted/50"
                  ),
                  children: movementKindLabel(kind)
                },
                kind
              )
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "movement-method", children: "Medio de pago" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: form.paymentMethod,
                  onValueChange: (value) => selectPaymentMethod(value),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectTrigger,
                      {
                        id: "movement-method",
                        "aria-label": "Medio de pago",
                        "data-ocid": "caja.movement.method_select",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: PAYMENT_METHOD_OPTIONS.map((method) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: method, children: PAYMENT_METHOD_LABELS[method] }, method)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "movement-amount", children: "Monto (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "movement-amount",
                  inputMode: "decimal",
                  value: form.amount,
                  onChange: (event) => update("amount", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "caja.movement.amount_input",
                  required: true
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "movement-account", children: "Cuenta afectada" }),
            isMixed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: form.account,
                onValueChange: (value) => update("account", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "movement-account",
                      "aria-label": "Cuenta afectada",
                      "data-ocid": "caja.movement.account_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: CashAccount.cash, children: "Caja" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: CashAccount.bank, children: "Bancos" })
                  ] })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "caja.movement.account_hint",
                className: "flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 text-sm",
                children: [
                  form.account === CashAccount.cash ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Banknote,
                    {
                      className: "size-4 text-primary",
                      "aria-hidden": "true"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Landmark, { className: "size-4 text-info", "aria-hidden": "true" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: accountLabel(form.account) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: derivedAccount === CashAccount.cash ? "El efectivo afecta Caja" : "La transferencia y la tarjeta afectan Bancos" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "movement-description", children: "Descripción" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "movement-description",
                value: form.description,
                onChange: (event) => update("description", event.target.value),
                placeholder: "Venta de repuestos, pago de domicilio, consignación…",
                rows: 2,
                "data-ocid": "caja.movement.description_input",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "movement-reference", children: "Referencia (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "movement-reference",
                value: form.reference,
                onChange: (event) => update("reference", event.target.value),
                placeholder: "Número de comprobante o soporte",
                className: "data-rail",
                "data-ocid": "caja.movement.reference_input"
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "caja.movement.error_state",
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
                "data-ocid": "caja.movement.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: registerMovement.isPending,
                "data-ocid": "caja.movement.submit_button",
                children: registerMovement.isPending ? "Registrando…" : "Registrar"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
const PAGE_SIZE$1 = 20;
function CashMovementsTable({
  shiftId,
  ocid,
  caption
}) {
  var _a, _b;
  const [kind, setKind] = reactExports.useState("all");
  const [account, setAccount] = reactExports.useState("all");
  const [paymentMethod, setPaymentMethod] = reactExports.useState(
    "all"
  );
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const fromTimestamp = reactExports.useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = reactExports.useMemo(() => colombiaEndOfDay(to), [to]);
  const movementsQuery = useCashMovements({
    shiftId,
    kind: kind === "all" ? null : kind,
    account: account === "all" ? null : account,
    paymentMethod: paymentMethod === "all" ? null : paymentMethod,
    from: fromTimestamp,
    to: toTimestamp,
    offset: (page - 1) * PAGE_SIZE$1,
    limit: PAGE_SIZE$1
  });
  const items = ((_a = movementsQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = movementsQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE$1));
  const hasFilters = kind !== "all" || account !== "all" || paymentMethod !== "all" || from !== "" || to !== "";
  function clearFilters() {
    setKind("all");
    setAccount("all");
    setPaymentMethod("all");
    setFrom("");
    setTo("");
    setPage(1);
  }
  const columns = reactExports.useMemo(
    () => [
      {
        key: "timestamp",
        header: "Fecha",
        render: (movement) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: formatDateTime(movement.timestamp) })
      },
      {
        key: "kind",
        header: "Tipo",
        render: (movement) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusBadge,
          {
            label: movementKindLabel(movement.kind),
            tone: movement.kind === CashMovementKind.income ? "accepted" : "rejected"
          }
        )
      },
      {
        key: "description",
        header: "Descripción",
        render: (movement) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 max-w-[280px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-medium", children: movement.description }),
          movement.reference ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail truncate text-xs text-muted-foreground", children: [
            "Ref. ",
            movement.reference
          ] }) : null
        ] })
      },
      {
        key: "paymentMethod",
        header: "Medio",
        render: (movement) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: paymentMethodLabel(movement.paymentMethod) })
      },
      {
        key: "account",
        header: "Cuenta",
        render: (movement) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusBadge,
          {
            label: accountLabel(movement.account),
            tone: movement.account === CashAccount.cash ? "neutral" : "sent"
          }
        )
      },
      {
        key: "source",
        header: "Origen",
        render: (movement) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: movementSourceLabel(movement.source) })
      },
      {
        key: "amount",
        header: "Importe",
        numeric: true,
        render: (movement) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: movement.kind === CashMovementKind.income ? "data-rail font-semibold text-success" : "data-rail font-semibold text-destructive",
            children: [
              movement.kind === CashMovementKind.income ? "+" : "−",
              formatMoney(movement.amount)
            ]
          }
        )
      }
    ],
    []
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "min-w-0 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": `${ocid}.filters`,
        className: "rounded-lg border border-border bg-card p-3 shadow-subtle",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: `${ocid}-kind`,
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Tipo"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: kind,
                onValueChange: (value) => {
                  setKind(value);
                  setPage(1);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: `${ocid}-kind`,
                      "aria-label": "Filtrar por tipo de movimiento",
                      "data-ocid": `${ocid}.kind_filter`,
                      className: "w-[150px]",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: CashMovementKind.income, children: "Ingresos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: CashMovementKind.expense, children: "Egresos" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: `${ocid}-account`,
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Cuenta"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: account,
                onValueChange: (value) => {
                  setAccount(value);
                  setPage(1);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: `${ocid}-account`,
                      "aria-label": "Filtrar por cuenta",
                      "data-ocid": `${ocid}.account_filter`,
                      className: "w-[150px]",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: CashAccount.cash, children: "Caja" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: CashAccount.bank, children: "Bancos" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: `${ocid}-method`,
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Medio"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: paymentMethod,
                onValueChange: (value) => {
                  setPaymentMethod(value);
                  setPage(1);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: `${ocid}-method`,
                      "aria-label": "Filtrar por medio de pago",
                      "data-ocid": `${ocid}.method_filter`,
                      className: "w-[160px]",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos" }),
                    PAYMENT_METHOD_OPTIONS.map((method) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: method, children: PAYMENT_METHOD_LABELS[method] }, method))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: `${ocid}-from`,
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Desde"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: `${ocid}-from`,
                type: "date",
                value: from,
                onChange: (event) => {
                  setFrom(event.target.value);
                  setPage(1);
                },
                className: "data-rail w-[160px]",
                "data-ocid": `${ocid}.date_from_input`
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: `${ocid}-to`,
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Hasta"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: `${ocid}-to`,
                type: "date",
                value: to,
                onChange: (event) => {
                  setTo(event.target.value);
                  setPage(1);
                },
                className: "data-rail w-[160px]",
                "data-ocid": `${ocid}.date_to_input`
              }
            )
          ] }),
          hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "ghost",
              onClick: clearFilters,
              "data-ocid": `${ocid}.clear_filters_button`,
              className: "gap-2 text-muted-foreground",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                "Limpiar"
              ]
            }
          ) : null
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: movementsQuery.isLoading ? "Cargando…" : `${formatNumber(total)} movimiento${total === 1 ? "" : "s"}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: "Más recientes primero" })
    ] }),
    movementsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": `${ocid}.error_state`,
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "size-6 text-destructive",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudieron cargar los movimientos." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => void movementsQuery.refetch({ cancelRefetch: true }),
              "data-ocid": `${ocid}.retry_button`,
              children: "Reintentar"
            }
          )
        ]
      }
    ) : movementsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": `${ocid}.loading_state`, className: "space-y-2 p-4", children: Array.from(
      { length: 6 },
      (_, index) => `movement-skeleton-${index}`
    ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)) }) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": `${ocid}.empty_state`,
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Receipt,
            {
              className: "size-5 text-muted-foreground",
              "aria-hidden": "true"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay movimientos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta los filtros para encontrar movimientos del turno." : "Registra el primer ingreso o egreso del turno para verlo aquí." })
          ] }),
          hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: clearFilters,
              "data-ocid": `${ocid}.empty_clear_button`,
              children: "Limpiar filtros"
            }
          ) : null
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      DataTable,
      {
        columns,
        rows: items,
        rowKey: (movement) => movement.id.toString(),
        ocid,
        caption
      }
    ),
    !movementsQuery.isLoading && !movementsQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
        "Página ",
        page,
        " de ",
        totalPages
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            disabled: page <= 1,
            onClick: () => setPage((current) => Math.max(1, current - 1)),
            "data-ocid": `${ocid}.pagination_prev`,
            className: "gap-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4", "aria-hidden": "true" }),
              "Anterior"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            disabled: page >= totalPages,
            onClick: () => setPage((current) => Math.min(totalPages, current + 1)),
            "data-ocid": `${ocid}.pagination_next`,
            className: "gap-1",
            children: [
              "Siguiente",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
            ]
          }
        )
      ] })
    ] }) : null
  ] });
}
function initialForm(shift) {
  return {
    declaredClosingCash: centsToInput(shift.computedClosingCash),
    declaredClosingBank: centsToInput(shift.computedClosingBank),
    notes: ""
  };
}
function DifferenceRow({
  label,
  computed,
  declared,
  difference,
  ocid
}) {
  const tone = difference === null || difference === 0n ? "text-muted-foreground" : difference > 0n ? "text-success" : "text-destructive";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": ocid,
      className: "flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-xs text-muted-foreground", children: [
            "Sistema ",
            formatMoney(computed)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-sm font-medium", children: declared === null ? "—" : formatMoney(declared) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("data-rail w-24 text-sm font-semibold", tone), children: difference === null ? "—" : `${difference > 0n ? "+" : ""}${formatMoney(difference)}` })
        ] })
      ]
    }
  );
}
function CloseShiftDialog({
  open,
  onOpenChange,
  shift
}) {
  const [form, setForm] = reactExports.useState(
    () => initialForm(shift)
  );
  const [error, setError] = reactExports.useState(null);
  const closeShift = useCloseShift();
  reactExports.useEffect(() => {
    if (open) {
      setForm(initialForm(shift));
      setError(null);
    }
  }, [open, shift]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  const declaredCash = parseAmount(form.declaredClosingCash);
  const declaredBank = parseAmount(form.declaredClosingBank);
  const differenceCash = declaredCash === null ? null : declaredCash - shift.computedClosingCash;
  const differenceBank = declaredBank === null ? null : declaredBank - shift.computedClosingBank;
  function handleSubmit(event) {
    event.preventDefault();
    if (declaredCash === null) {
      setError("Captura el saldo final declarado de caja.");
      return;
    }
    if (declaredBank === null) {
      setError("Captura el saldo final declarado de bancos.");
      return;
    }
    const input = {
      declaredClosingCash: declaredCash,
      declaredClosingBank: declaredBank,
      notes: form.notes.trim() === "" ? void 0 : form.notes.trim()
    };
    setError(null);
    closeShift.mutate(
      { shiftId: shift.id, input },
      {
        onSuccess: () => {
          ue.success("Turno cerrado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            mutationError.message || "No se pudo cerrar el turno. Inténtalo de nuevo."
          );
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "caja.close_shift.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-xl",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Cerrar turno de caja" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Declara el saldo final contado en caja y en bancos. La diferencia se calcula contra el saldo que el sistema registró en el turno." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "close-cash", children: "Saldo final declarado en caja (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "close-cash",
                  inputMode: "decimal",
                  value: form.declaredClosingCash,
                  onChange: (event) => update("declaredClosingCash", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "caja.close_shift.cash_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "close-bank", children: "Saldo final declarado en bancos (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "close-bank",
                  inputMode: "decimal",
                  value: form.declaredClosingBank,
                  onChange: (event) => update("declaredClosingBank", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "caja.close_shift.bank_input",
                  required: true
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "caja.close_shift.differences",
              className: "rounded-lg border border-border bg-muted/30 px-4 py-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 pb-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: "Cuenta" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sistema" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Declarado" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-24 text-right", children: "Diferencia" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DifferenceRow,
                  {
                    ocid: "caja.close_shift.difference_cash",
                    label: "Caja (efectivo)",
                    computed: shift.computedClosingCash,
                    declared: declaredCash,
                    difference: differenceCash
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  DifferenceRow,
                  {
                    ocid: "caja.close_shift.difference_bank",
                    label: "Bancos",
                    computed: shift.computedClosingBank,
                    declared: declaredBank,
                    difference: differenceBank
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "close-notes", children: "Notas (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "close-notes",
                value: form.notes,
                onChange: (event) => update("notes", event.target.value),
                placeholder: "Explica cualquier diferencia detectada al cerrar",
                rows: 2,
                "data-ocid": "caja.close_shift.notes_input"
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "caja.close_shift.error_state",
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
                "data-ocid": "caja.close_shift.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: closeShift.isPending,
                "data-ocid": "caja.close_shift.submit_button",
                children: closeShift.isPending ? "Cerrando…" : "Cerrar turno"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function emptyForm() {
  return { openingCash: "", openingBank: "", notes: "" };
}
function OpenShiftDialog({ open, onOpenChange }) {
  const [form, setForm] = reactExports.useState(emptyForm);
  const [error, setError] = reactExports.useState(null);
  const openShift = useOpenShiftMutation();
  reactExports.useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function handleSubmit(event) {
    event.preventDefault();
    const openingCash = parseAmount(form.openingCash);
    const openingBank = parseAmount(form.openingBank);
    if (openingCash === null) {
      setError("Captura el saldo inicial de caja (puede ser 0).");
      return;
    }
    if (openingBank === null) {
      setError("Captura el saldo inicial de bancos (puede ser 0).");
      return;
    }
    const input = {
      openingCash,
      openingBank,
      notes: form.notes.trim() === "" ? void 0 : form.notes.trim()
    };
    setError(null);
    openShift.mutate(input, {
      onSuccess: () => {
        ue.success("Turno abierto");
        onOpenChange(false);
      },
      onError: (mutationError) => {
        setError(
          mutationError.message || "No se pudo abrir el turno. Verifica que no haya otro turno abierto."
        );
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "caja.open_shift.dialog",
      className: "max-h-[90vh] overflow-y-auto sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Abrir turno de caja" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Declara el saldo inicial de efectivo en caja y de dinero en bancos. Estos saldos son la base para calcular el cierre del turno." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "open-cash", children: "Saldo inicial en caja (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "open-cash",
                  inputMode: "decimal",
                  value: form.openingCash,
                  onChange: (event) => update("openingCash", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "caja.open_shift.cash_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "open-bank", children: "Saldo inicial en bancos (COP)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "open-bank",
                  inputMode: "decimal",
                  value: form.openingBank,
                  onChange: (event) => update("openingBank", event.target.value),
                  placeholder: "0.00",
                  className: "data-rail",
                  "data-ocid": "caja.open_shift.bank_input",
                  required: true
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "open-notes", children: "Notas (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "open-notes",
                value: form.notes,
                onChange: (event) => update("notes", event.target.value),
                placeholder: "Observaciones de la apertura del turno",
                rows: 2,
                "data-ocid": "caja.open_shift.notes_input"
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "caja.open_shift.error_state",
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
                "data-ocid": "caja.open_shift.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: openShift.isPending,
                "data-ocid": "caja.open_shift.submit_button",
                children: openShift.isPending ? "Abriendo…" : "Abrir turno"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
const PAGE_SIZE = 15;
function ShiftHistoryTable({ onOpenReport }) {
  var _a, _b;
  const [status, setStatus] = reactExports.useState(ShiftStatus.closed);
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const fromTimestamp = reactExports.useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = reactExports.useMemo(() => colombiaEndOfDay(to), [to]);
  const shiftsQuery = useShifts({
    status: status === "all" ? null : status,
    from: fromTimestamp,
    to: toTimestamp,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE
  });
  const items = ((_a = shiftsQuery.data) == null ? void 0 : _a.items) ?? [];
  const total = Number(((_b = shiftsQuery.data) == null ? void 0 : _b.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== ShiftStatus.closed || from !== "" || to !== "";
  function clearFilters() {
    setStatus(ShiftStatus.closed);
    setFrom("");
    setTo("");
    setPage(1);
  }
  const columns = reactExports.useMemo(
    () => [
      {
        key: "id",
        header: "Turno",
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-sm font-medium", children: [
          "#",
          shift.id.toString()
        ] })
      },
      {
        key: "status",
        header: "Estado",
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          StatusBadge,
          {
            label: shift.status === ShiftStatus.open ? "Abierto" : "Cerrado",
            tone: shift.status === ShiftStatus.open ? "accepted" : "neutral"
          }
        )
      },
      {
        key: "openedAt",
        header: "Apertura",
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: formatDateTime(shift.openedAt) })
      },
      {
        key: "closedAt",
        header: "Cierre",
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: shift.closedAt ? formatDateTime(shift.closedAt) : "—" })
      },
      {
        key: "openingCash",
        header: "Inicial caja",
        numeric: true,
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-muted-foreground", children: formatMoney(shift.openingCash) })
      },
      {
        key: "computedClosingCash",
        header: "Final caja",
        numeric: true,
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium", children: formatMoney(shift.computedClosingCash) })
      },
      {
        key: "computedClosingBank",
        header: "Final bancos",
        numeric: true,
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail font-medium", children: formatMoney(shift.computedClosingBank) })
      },
      {
        key: "difference",
        header: "Diferencia",
        numeric: true,
        render: (shift) => {
          const difference = shift.differenceCash + shift.differenceBank;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: difference === 0n ? "data-rail text-muted-foreground" : difference > 0n ? "data-rail font-semibold text-success" : "data-rail font-semibold text-destructive",
              children: [
                difference > 0n ? "+" : "",
                formatMoney(difference)
              ]
            }
          );
        }
      }
    ],
    []
  );
  const actions = reactExports.useMemo(
    () => [
      {
        kind: "edit",
        label: "Ver informe del turno",
        onClick: (shift) => onOpenReport(shift.id)
      }
    ],
    [onOpenReport]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "min-w-0 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        "data-ocid": "caja.history.filters",
        className: "rounded-lg border border-border bg-card p-3 shadow-subtle",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "history-status",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Estado"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: status,
                onValueChange: (value) => {
                  setStatus(value);
                  setPage(1);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "history-status",
                      "aria-label": "Filtrar por estado del turno",
                      "data-ocid": "caja.history.status_filter",
                      className: "w-[160px]",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ShiftStatus.closed, children: "Cerrados" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: ShiftStatus.open, children: "Abiertos" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "history-from",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Desde"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "history-from",
                type: "date",
                value: from,
                onChange: (event) => {
                  setFrom(event.target.value);
                  setPage(1);
                },
                className: "data-rail w-[160px]",
                "data-ocid": "caja.history.date_from_input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "history-to",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Hasta"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "history-to",
                type: "date",
                value: to,
                onChange: (event) => {
                  setTo(event.target.value);
                  setPage(1);
                },
                className: "data-rail w-[160px]",
                "data-ocid": "caja.history.date_to_input"
              }
            )
          ] }),
          hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              type: "button",
              variant: "ghost",
              onClick: clearFilters,
              "data-ocid": "caja.history.clear_filters_button",
              className: "gap-2 text-muted-foreground",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-4", "aria-hidden": "true" }),
                "Limpiar"
              ]
            }
          ) : null
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: shiftsQuery.isLoading ? "Cargando…" : `${formatNumber(total)} turno${total === 1 ? "" : "s"}` }) }),
    shiftsQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "caja.history.error_state",
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            TriangleAlert,
            {
              className: "size-6 text-destructive",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el historial de turnos." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => void shiftsQuery.refetch({ cancelRefetch: true }),
              "data-ocid": "caja.history.retry_button",
              children: "Reintentar"
            }
          )
        ]
      }
    ) : shiftsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "caja.history.loading_state", className: "space-y-2 p-4", children: Array.from(
      { length: 5 },
      (_, index) => `shift-skeleton-${index}`
    ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-full" }, id)) }) }) : items.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "caja.history.empty_state",
        className: "flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            History,
            {
              className: "size-5 text-muted-foreground",
              "aria-hidden": "true"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: hasFilters ? "Sin resultados" : "Aún no hay turnos cerrados" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: hasFilters ? "Ajusta los filtros para encontrar turnos en el historial." : "Cuando cierres un turno aparecerá aquí con su informe diario." })
          ] }),
          hasFilters ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: clearFilters,
              "data-ocid": "caja.history.empty_clear_button",
              children: "Limpiar filtros"
            }
          ) : null
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      DataTable,
      {
        columns,
        rows: items,
        rowKey: (shift) => shift.id.toString(),
        actions,
        ocid: "caja.history",
        caption: "Historial de turnos"
      }
    ),
    !shiftsQuery.isLoading && !shiftsQuery.isError && total > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
        "Página ",
        page,
        " de ",
        totalPages
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            disabled: page <= 1,
            onClick: () => setPage((current) => Math.max(1, current - 1)),
            "data-ocid": "caja.history.pagination_prev",
            className: "gap-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "size-4", "aria-hidden": "true" }),
              "Anterior"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            disabled: page >= totalPages,
            onClick: () => setPage((current) => Math.min(totalPages, current + 1)),
            "data-ocid": "caja.history.pagination_next",
            className: "gap-1",
            children: [
              "Siguiente",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
            ]
          }
        )
      ] })
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "size-3.5", "aria-hidden": "true" }),
      "Usa el botón de cada turno para abrir su informe diario imprimible."
    ] })
  ] });
}
function reportDocument(report) {
  const shift = report.shift;
  const lines = report.movements.map((movement) => ({
    description: `${movementKindLabel(movement.kind)} · ${movement.description}${movement.reference ? ` (${movement.reference})` : ""}`,
    quantity: 1,
    unitPrice: Number(movement.amount),
    amount: Number(movement.amount)
  }));
  const meta = [
    { label: "Turno", value: `#${shift.id.toString()}`, rail: true },
    { label: "Apertura", value: formatDateTime(shift.openedAt) },
    {
      label: "Cierre",
      value: shift.closedAt ? formatDateTime(shift.closedAt) : "Turno abierto"
    },
    { label: "Saldo inicial caja", value: formatMoney(shift.openingCash) },
    { label: "Saldo inicial bancos", value: formatMoney(shift.openingBank) },
    {
      label: "Movimientos",
      value: formatNumber(BigInt(report.movements.length))
    }
  ];
  const totals = [
    { label: "Ingresos en efectivo", value: formatMoney(report.cashIncome) },
    { label: "Ingresos por bancos", value: formatMoney(report.bankIncome) },
    { label: "Total ingresos", value: formatMoney(report.totalIncome) },
    { label: "Egresos en efectivo", value: formatMoney(report.cashExpense) },
    { label: "Egresos por bancos", value: formatMoney(report.bankExpense) },
    { label: "Total egresos", value: formatMoney(report.totalExpense) },
    {
      label: "Saldo final caja",
      value: formatMoney(shift.computedClosingCash)
    },
    {
      label: "Saldo final bancos",
      value: formatMoney(shift.computedClosingBank)
    },
    {
      label: "Total disponible",
      value: formatMoney(shift.computedClosingCash + shift.computedClosingBank),
      emphasis: true
    }
  ];
  return {
    number: `Turno #${shift.id.toString()}`,
    meta,
    lines,
    totals,
    footer: "Informe diario del turno generado por el sistema de taller. Conserva este comprobante."
  };
}
async function buildReportPdf(format, report, company, document, hope) {
  var _a, _b, _c, _d;
  const { jsPDF, autoTable } = await loadPdfLibs();
  const narrow = format === "receipt80";
  const margin = narrow ? 3 : 14;
  const right = narrow ? 77 : 196;
  const doc = new jsPDF({ unit: "mm", format: narrow ? [80, 297] : "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 10 : 15);
  doc.setTextColor(30, 41, 59);
  doc.text(company.name, margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 8.5);
  doc.setTextColor(100, 116, 139);
  const contact = [company.taxId, company.address, company.phone].filter((value) => !!value && value.trim() !== "").join(narrow ? " · " : "  ·  ");
  let cursor = 18.5;
  if (contact !== "") {
    const contactLines = doc.splitTextToSize(contact, right - margin);
    doc.text(contactLines, margin, cursor);
    cursor += contactLines.length * (narrow ? 3 : 4);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 8.5 : 11);
  doc.setTextColor(30, 41, 59);
  doc.text("INFORME DIARIO DE TURNO", right, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 9);
  doc.setTextColor(100, 116, 139);
  doc.text(document.number, right, 18.5, { align: "right" });
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor + 1, right, cursor + 1);
  cursor += 5;
  if (narrow) {
    for (const entry of document.meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(entry.label, margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const value = doc.splitTextToSize(entry.value, right - margin);
      doc.text(value, margin, cursor + 3);
      cursor += 3 + value.length * 3 + 1.5;
    }
  } else {
    autoTable(doc, {
      startY: cursor,
      body: document.meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 45, textColor: [100, 116, 139] },
        1: { fontStyle: "bold", textColor: [30, 41, 59] }
      },
      margin: { left: margin, right: margin }
    });
    cursor = (((_a = doc.lastAutoTable) == null ? void 0 : _a.finalY) ?? cursor) + 4;
  }
  autoTable(doc, {
    startY: cursor,
    head: [["Movimiento", "Medio", "Cuenta", "Importe"]],
    body: report.movements.map((movement) => [
      `${movementKindLabel(movement.kind)} · ${movement.description}`,
      paymentMethodLabel(movement.paymentMethod),
      accountLabel(movement.account),
      formatMoney(movement.amount)
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 6.5 : 8.5,
      cellPadding: narrow ? 1.2 : 2,
      overflow: "linebreak"
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: { 3: { halign: "right" } },
    margin: { left: margin, right: margin }
  });
  const afterLines = ((_b = doc.lastAutoTable) == null ? void 0 : _b.finalY) ?? cursor;
  autoTable(doc, {
    startY: afterLines + 4,
    head: [["Medio de pago", "Ingresos", "Egresos"]],
    body: report.byPaymentMethod.map((entry) => [
      paymentMethodLabel(entry.method),
      formatMoney(entry.income),
      formatMoney(entry.expense)
    ]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: narrow ? 6.5 : 8.5, cellPadding: 2 },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    margin: { left: margin, right: margin }
  });
  const afterMethods = ((_c = doc.lastAutoTable) == null ? void 0 : _c.finalY) ?? afterLines + 4;
  autoTable(doc, {
    startY: afterMethods + 4,
    body: document.totals.map((entry) => [entry.label, entry.value]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 7 : 9,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] }
    },
    margin: { left: narrow ? margin : right - 90, right: margin }
  });
  const afterTotals = ((_d = doc.lastAutoTable) == null ? void 0 : _d.finalY) ?? afterMethods + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  const footerY = afterTotals + (narrow ? 6 : 10);
  const footerLines = doc.splitTextToSize(document.footer, right - margin);
  doc.text(footerLines, margin, footerY);
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: footerY + footerLines.length * (narrow ? 2.6 : 3.4) + 1.5,
    narrow
  });
  return doc;
}
function ShiftReportDialog({
  shiftId,
  onClose
}) {
  var _a, _b;
  const reportQuery = useDailyShiftReport(shiftId);
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const [isDownloading, setIsDownloading] = reactExports.useState(false);
  const [downloadError, setDownloadError] = reactExports.useState(null);
  const report = reportQuery.data ?? null;
  const document = report ? reportDocument(report) : null;
  const companyName = ((_a = companyQuery.data) == null ? void 0 : _a.legalName) ?? "Taller de motos";
  const companyLogoUrl = ((_b = companyQuery.data) == null ? void 0 : _b.logoUrl) ?? void 0;
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  async function handleDownloadPdf(format) {
    if (!report || !document) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildReportPdf(
        format,
        report,
        pdfCompanyFromProfile(companyQuery.data),
        document,
        hopeMessage
      );
      await downloadFile({
        filename: `informe-turno-${report.shift.id.toString()}.pdf`,
        mimeType: "application/pdf",
        data: doc.output("blob")
      });
    } catch {
      setDownloadError(
        "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo."
      );
    } finally {
      setIsDownloading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Dialog,
    {
      open: shiftId !== null,
      onOpenChange: (open) => {
        if (!open) onClose();
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        DialogContent,
        {
          "data-ocid": "caja.report.dialog",
          className: "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Informe diario del turno" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Todos los movimientos del turno, totales por medio de pago y saldos finales. Imprimible en hoja A4 o tirilla de 80 mm." })
            ] }),
            reportQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "caja.report.loading_state", className: "space-y-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[420px] w-full" })
            ] }) : reportQuery.isError || !report || !document ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                "data-ocid": "caja.report.error_state",
                className: "flex flex-col items-center gap-3 py-10 text-center",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TriangleAlert,
                    {
                      className: "size-5 text-destructive",
                      "aria-hidden": "true"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No se pudo cargar el informe del turno." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "button",
                      variant: "outline",
                      onClick: () => void reportQuery.refetch({ cancelRefetch: true }),
                      "data-ocid": "caja.report.retry_button",
                      children: "Reintentar"
                    }
                  )
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "caja.report.payment_methods",
                  className: "rounded-lg border border-border bg-card p-4",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-sm font-semibold", children: "Totales por medio de pago" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-2", children: report.byPaymentMethod.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sin movimientos registrados en este turno." }) : report.byPaymentMethod.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "div",
                      {
                        "data-ocid": `caja.report.method.${entry.method}`,
                        className: "flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-b-0 last:pb-0",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: paymentMethodLabel(entry.method) }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-xs text-success", children: [
                              "+",
                              formatMoney(entry.income)
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "data-rail text-xs text-destructive", children: [
                              "−",
                              formatMoney(entry.expense)
                            ] })
                          ] })
                        ]
                      },
                      entry.method
                    )) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DocumentPreview,
                {
                  title: "Informe diario de turno",
                  number: document.number,
                  companyName,
                  companyLogoUrl,
                  meta: document.meta,
                  lines: document.lines,
                  totals: document.totals,
                  footer: document.footer,
                  hopeMessage,
                  format: "a4",
                  ocid: "caja.report.a4",
                  onDownloadPdf: handleDownloadPdf,
                  isDownloading
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                DocumentPreview,
                {
                  title: "Informe diario de turno",
                  number: document.number,
                  companyName,
                  companyLogoUrl,
                  meta: document.meta,
                  lines: document.lines,
                  totals: document.totals,
                  footer: document.footer,
                  hopeMessage,
                  format: "receipt80",
                  ocid: "caja.report.80mm",
                  onDownloadPdf: handleDownloadPdf,
                  isDownloading
                }
              ),
              downloadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": "caja.report.download_error",
                  className: "flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2 text-xs text-destructive", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        TriangleAlert,
                        {
                          className: "mt-0.5 size-3.5 shrink-0",
                          "aria-hidden": "true"
                        }
                      ),
                      downloadError
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        size: "sm",
                        onClick: () => void handleDownloadPdf("a4"),
                        "data-ocid": "caja.report.download_retry_button",
                        children: "Reintentar"
                      }
                    )
                  ]
                }
              ) : null
            ] })
          ]
        }
      )
    }
  );
}
function CajaBancosPage() {
  const openShiftQuery = useOpenShift();
  const shift = openShiftQuery.data ?? null;
  const [openShiftDialog, setOpenShiftDialog] = reactExports.useState(false);
  const [closeShiftDialog, setCloseShiftDialog] = reactExports.useState(false);
  const [movementDialog, setMovementDialog] = reactExports.useState(false);
  const [reportShiftId, setReportShiftId] = reactExports.useState(null);
  const openReport = reactExports.useCallback((shiftId) => {
    setReportShiftId(shiftId);
  }, []);
  const closeReport = reactExports.useCallback(() => {
    setReportShiftId(null);
  }, []);
  const isShiftOpen = shift !== null && shift.status === "open";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "caja.page",
      className: "mx-auto w-full max-w-7xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PageHeader,
          {
            eyebrow: "Administración",
            title: "Caja y bancos",
            description: "Turnos de caja, movimientos por medio de pago e informe diario del turno. El efectivo afecta Caja; la transferencia y la tarjeta afectan Bancos.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: isShiftOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setMovementDialog(true),
                  "data-ocid": "caja.register_movement_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleArrowUp, { className: "size-4", "aria-hidden": "true" }),
                    "Registrar movimiento"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => setReportShiftId(shift.id),
                  "data-ocid": "caja.view_report_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "size-4", "aria-hidden": "true" }),
                    "Informe del turno"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  onClick: () => setCloseShiftDialog(true),
                  "data-ocid": "caja.close_shift_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "size-4", "aria-hidden": "true" }),
                    "Cerrar turno"
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: () => setOpenShiftDialog(true),
                disabled: openShiftQuery.isLoading,
                "data-ocid": "caja.open_shift_button",
                className: "gap-1.5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { className: "size-4", "aria-hidden": "true" }),
                  "Abrir turno"
                ]
              }
            ) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CashBalancesPanel,
          {
            shift,
            isLoading: openShiftQuery.isLoading,
            isError: openShiftQuery.isError
          }
        ),
        isShiftOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "caja.open_shift.notice",
            className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CircleArrowDown,
                  {
                    className: "size-4 text-success",
                    "aria-hidden": "true"
                  }
                ),
                "Los ingresos por transferencia suman a Bancos; los pagos por transferencia se descuentan de Bancos."
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  size: "sm",
                  onClick: () => setMovementDialog(true),
                  "data-ocid": "caja.register_movement_inline_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleArrowUp, { className: "size-4", "aria-hidden": "true" }),
                    "Registrar movimiento"
                  ]
                }
              )
            ]
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "current", "data-ocid": "caja.tabs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "current", "data-ocid": "caja.tab.current", children: "Turno actual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "history", "data-ocid": "caja.tab.history", children: "Historial de turnos" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "current", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            CashMovementsTable,
            {
              shiftId: (shift == null ? void 0 : shift.id) ?? null,
              ocid: "caja.movements",
              caption: isShiftOpen ? `Movimientos del turno #${shift.id.toString()}` : "Movimientos de caja y bancos"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "history", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShiftHistoryTable, { onOpenReport: openReport }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          OpenShiftDialog,
          {
            open: openShiftDialog,
            onOpenChange: setOpenShiftDialog
          }
        ),
        shift ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          CloseShiftDialog,
          {
            open: closeShiftDialog,
            onOpenChange: setCloseShiftDialog,
            shift
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CashMovementDialog,
          {
            open: movementDialog,
            onOpenChange: setMovementDialog
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShiftReportDialog, { shiftId: reportShiftId, onClose: closeReport })
      ]
    }
  );
}
export {
  CajaBancosPage,
  CajaBancosPage as default
};
