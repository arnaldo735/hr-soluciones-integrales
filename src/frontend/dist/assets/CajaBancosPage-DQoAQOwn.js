import { c as createLucideIcon, j as jsxRuntimeExports, aD as Wallet, s as formatMoney, o as Banknote, bC as Landmark, Y as cn, r as reactExports, af as PaymentMethod, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogDescription, K as Label, bD as CashMovementKind, I as Input, bE as CashAccount, f as DialogFooter, B as Button, bF as CashMovementSource, ag as ue, aI as colombiaStartOfDay, aH as colombiaEndOfDay, v as formatDateTime, g as formatNumber, p as TriangleAlert, R as Receipt, h as ChevronRight, u as useBackend, i as useAuth, k as useQuery, bG as ShiftStatus, F as FileText, as as UserCog } from "./index-CGU00UGU.js";
import { P as PageHeader } from "./PageHeader-CxkpEYhr.js";
import { S as StatusBadge } from "./StatusBadge-DYrsc8Lu.js";
import { C as Card, c as CardContent } from "./card-CgkL2s6g.js";
import { S as Skeleton } from "./skeleton-CFVvrB7j.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BiDX8q3v.js";
import { T as Textarea } from "./textarea-DsfSgmp0.js";
import { u as useRegisterCashMovement, a as useOpenShifts, b as useCashRegisters, c as useCashMovements, d as useCloseShift, e as useOpenShiftMutation, f as useShifts, g as useDailyShiftReport, h as useSetShiftResponsible } from "./use-cash-DSqK78YD.js";
import { a as accountForPaymentMethod, m as movementKindLabel, P as PAYMENT_METHOD_OPTIONS, b as PAYMENT_METHOD_LABELS, c as accountLabel, p as parseAmount, d as paymentMethodLabel, e as movementSourceLabel, f as centsToInput, g as cashRegisterKindLabel } from "./cash-labels-CiSIpFY4.js";
import { D as DataTable } from "./DataTable--FR5L5JM.js";
import { R as RotateCcw } from "./rotate-ccw-CJSSmG56.js";
import { C as ChevronLeft } from "./chevron-left-Coib6isK.js";
import { H as History } from "./history-DoEa7-NG.js";
import { D as DocumentPreview } from "./DocumentPreview-C649Rq7f.js";
import { u as useCompanyProfile } from "./use-company-5EPbuX7J.js";
import { u as useDailyHopeMessage } from "./use-hope-CwB0ZtwO.js";
import { d as downloadFile } from "./download-DPgaDAHv.js";
import { h as hopeMessageContent, p as pdfCompanyFromProfile, l as loadPdfLibs, b as drawHopeMessage } from "./pdf-BD7aJTXW.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-CIy9poln.js";
import { P as Printer } from "./printer-eU4pYBq-.js";
import { L as Lock } from "./lock-FzGaRwQn.js";
import "./index-ddFCuYd6.js";
import "./index-wj725hjP.js";
import "./chevron-up-Dje9nq9I.js";
import "./check-D7OXHYR_.js";
import "./alert-dialog-DAMKlNv-.js";
import "./table-B6hoRRgq.js";
import "./trash-2-D0SVHflY.js";
import "./pencil-D17_67q5.js";
import "./download-7j9WzMf6.js";
import "./warranty-HTI4GveV.js";
import "./index-DEubsQ9U.js";
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
function RegisterBalances({
  shift,
  registerName,
  index
}) {
  const total = shift.computedClosingCash + shift.computedClosingBank;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      "data-ocid": `caja.balances.register.${index + 1}`,
      className: "gap-0 overflow-hidden rounded-lg py-0 shadow-none",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-display text-sm font-semibold", children: registerName }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-[11px] text-muted-foreground", children: [
              "Turno #",
              shift.id.toString(),
              " · ",
              shift.responsibleName || "—"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { label: "Turno abierto", tone: "accepted" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid gap-4 px-5 py-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            BalanceTile,
            {
              ocid: `caja.balances.register.${index + 1}.cash`,
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
              ocid: `caja.balances.register.${index + 1}.bank`,
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
              ocid: `caja.balances.register.${index + 1}.total`,
              label: "Total disponible",
              value: formatMoney(total),
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
function CashBalancesPanel({
  shifts,
  registerNames,
  isLoading,
  isError
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "section",
      {
        "data-ocid": "caja.balances.loading_state",
        "aria-label": "Saldos de caja y bancos",
        className: "space-y-4",
        children: Array.from(
          { length: 2 },
          (_, index) => `balance-skeleton-${index}`
        ).map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[180px] w-full rounded-lg" }, id))
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
  if (shifts.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "section",
      {
        "data-ocid": "caja.balances.closed_state",
        "aria-label": "Saldos de caja y bancos",
        className: "flex flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-6 py-8 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-11 items-center justify-center rounded-md border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "size-5 text-muted-foreground", "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: "No hay turnos abiertos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-xs text-muted-foreground", children: "Abre un turno en una caja o banco con su saldo inicial para empezar a registrar movimientos del día." })
        ]
      }
    );
  }
  const grandTotal = shifts.reduce(
    (sum, shift) => sum + shift.computedClosingCash + shift.computedClosingBank,
    0n
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      "data-ocid": "caja.balances.section",
      "aria-label": "Saldos de caja y bancos",
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
            shifts.length,
            " turno",
            shifts.length === 1 ? "" : "s",
            " abierto",
            shifts.length === 1 ? "" : "s",
            " · Total disponible",
            " ",
            formatMoney(grandTotal)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground", children: [
            shifts.length,
            " turno",
            shifts.length === 1 ? "" : "s",
            " · Saldos calculados en vivo"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: shifts.map((shift, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          RegisterBalances,
          {
            shift,
            registerName: registerNames.get(shift.registerId.toString()) ?? `Caja #${shift.registerId.toString()}`,
            index
          },
          shift.id.toString()
        )) })
      ]
    }
  );
}
function emptyForm$1(shiftId) {
  return {
    shiftId,
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
  onOpenChange,
  initialShiftId = null
}) {
  const [form, setForm] = reactExports.useState(
    () => emptyForm$1(initialShiftId ?? "")
  );
  const [error, setError] = reactExports.useState(null);
  const registerMovement = useRegisterCashMovement();
  const openShiftsQuery = useOpenShifts();
  const registersQuery = useCashRegisters({
    kind: null,
    active: null,
    search: "",
    offset: 0,
    limit: 100
  });
  const openShifts = reactExports.useMemo(
    () => openShiftsQuery.data ?? [],
    [openShiftsQuery.data]
  );
  const registerNames = reactExports.useMemo(() => {
    var _a;
    const map = /* @__PURE__ */ new Map();
    for (const register of ((_a = registersQuery.data) == null ? void 0 : _a.items) ?? []) {
      map.set(register.id.toString(), register.name);
    }
    return map;
  }, [registersQuery.data]);
  reactExports.useEffect(() => {
    if (open) {
      setForm(emptyForm$1(initialShiftId ?? ""));
      setError(null);
    }
  }, [open, initialShiftId]);
  reactExports.useEffect(() => {
    if (!open) return;
    setForm(
      (current) => current.shiftId === "" && openShifts.length > 0 ? { ...current, shiftId: openShifts[0].id.toString() } : current
    );
  }, [open, openShifts]);
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
    if (form.shiftId === "") {
      setError("Elige el turno abierto al que pertenece el movimiento.");
      return;
    }
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
      source: CashMovementSource.manual,
      shiftId: BigInt(form.shiftId)
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
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Elige el turno abierto (caja o banco) y clasifica el movimiento por medio de pago. El efectivo afecta Caja; la transferencia y la tarjeta afectan Bancos." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "movement-shift", children: "Turno / caja o banco" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: form.shiftId,
                onValueChange: (value) => update("shiftId", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "movement-shift",
                      "aria-label": "Turno abierto",
                      "data-ocid": "caja.movement.shift_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Elige un turno abierto" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: openShifts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none__", disabled: true, children: "No hay turnos abiertos" }) : openShifts.map((shift) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    SelectItem,
                    {
                      value: shift.id.toString(),
                      children: [
                        registerNames.get(shift.registerId.toString()) ?? `Caja #${shift.registerId.toString()}`,
                        " ",
                        "· Turno #",
                        shift.id.toString(),
                        " · ",
                        shift.responsibleName
                      ]
                    },
                    shift.id.toString()
                  )) })
                ]
              }
            )
          ] }),
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
  var _a, _b, _c;
  const [kind, setKind] = reactExports.useState("all");
  const [account, setAccount] = reactExports.useState("all");
  const [paymentMethod, setPaymentMethod] = reactExports.useState(
    "all"
  );
  const [registerId, setRegisterId] = reactExports.useState("all");
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const registersQuery = useCashRegisters({
    kind: null,
    active: null,
    search: "",
    offset: 0,
    limit: 100
  });
  const registers = ((_a = registersQuery.data) == null ? void 0 : _a.items) ?? [];
  const fromTimestamp = reactExports.useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = reactExports.useMemo(() => colombiaEndOfDay(to), [to]);
  const movementsQuery = useCashMovements({
    shiftId,
    registerId: registerId === "all" ? null : BigInt(registerId),
    kind: kind === "all" ? null : kind,
    account: account === "all" ? null : account,
    paymentMethod: paymentMethod === "all" ? null : paymentMethod,
    from: fromTimestamp,
    to: toTimestamp,
    offset: (page - 1) * PAGE_SIZE$1,
    limit: PAGE_SIZE$1
  });
  const items = ((_b = movementsQuery.data) == null ? void 0 : _b.items) ?? [];
  const total = Number(((_c = movementsQuery.data) == null ? void 0 : _c.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE$1));
  const hasFilters = kind !== "all" || account !== "all" || paymentMethod !== "all" || registerId !== "all" || from !== "" || to !== "";
  function clearFilters() {
    setKind("all");
    setAccount("all");
    setPaymentMethod("all");
    setRegisterId("all");
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
                htmlFor: `${ocid}-register`,
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Caja o banco"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: registerId,
                onValueChange: (value) => {
                  setRegisterId(value);
                  setPage(1);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: `${ocid}-register`,
                      "aria-label": "Filtrar por caja o banco",
                      "data-ocid": `${ocid}.register_filter`,
                      className: "w-[180px]",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas" }),
                    registers.map((register) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectItem,
                      {
                        value: register.id.toString(),
                        children: register.name
                      },
                      register.id.toString()
                    ))
                  ] })
                ]
              }
            )
          ] }),
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
  shift,
  registerName
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
            registerName ? `${registerName} · ` : "",
            "Turno #",
            shift.id.toString(),
            " · Responsable ",
            shift.responsibleName,
            ". Declara el saldo final contado en caja y en bancos; la diferencia se calcula contra el saldo que el sistema registró en este turno."
          ] })
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
  return {
    registerId: "",
    responsibleName: "",
    responsibleUserId: "",
    openingCash: "",
    openingBank: "",
    notes: ""
  };
}
function OpenShiftDialog({ open, onOpenChange }) {
  const [form, setForm] = reactExports.useState(emptyForm);
  const [error, setError] = reactExports.useState(null);
  const openShift = useOpenShiftMutation();
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const registersQuery = useCashRegisters({
    kind: null,
    active: true,
    search: "",
    offset: 0,
    limit: 100
  });
  const usersQuery = useQuery({
    queryKey: ["users-page", "", 1],
    queryFn: async () => {
      if (!actor) return { items: [], total: 0n, offset: 0n, limit: 0n };
      return actor.listUsersPage(token, null, 0n, 100n);
    },
    enabled: !!actor && !isFetching
  });
  const registers = reactExports.useMemo(
    () => {
      var _a;
      return ((_a = registersQuery.data) == null ? void 0 : _a.items) ?? [];
    },
    [registersQuery.data]
  );
  const users = reactExports.useMemo(
    () => {
      var _a;
      return (((_a = usersQuery.data) == null ? void 0 : _a.items) ?? []).filter((user) => user.active);
    },
    [usersQuery.data]
  );
  reactExports.useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  const selectedRegister = registers.find(
    (register) => register.id.toString() === form.registerId
  );
  const registerKind = (selectedRegister == null ? void 0 : selectedRegister.kind) ?? null;
  function handleSubmit(event) {
    event.preventDefault();
    if (form.registerId === "") {
      setError("Elige la caja o banco donde abrirás el turno.");
      return;
    }
    const responsibleName = form.responsibleName.trim();
    if (responsibleName === "") {
      setError("Asigna un responsable del turno.");
      return;
    }
    const cashApplies = registerKind !== "bank";
    const bankApplies = registerKind !== "cash";
    const openingCash = cashApplies ? parseAmount(form.openingCash) : 0n;
    const openingBank = bankApplies ? parseAmount(form.openingBank) : 0n;
    if (cashApplies && openingCash === null) {
      setError("Captura el saldo inicial de caja (puede ser 0).");
      return;
    }
    if (bankApplies && openingBank === null) {
      setError("Captura el saldo inicial de bancos (puede ser 0).");
      return;
    }
    const input = {
      registerId: BigInt(form.registerId),
      responsibleName,
      responsibleUserId: form.responsibleUserId === "" ? void 0 : BigInt(form.responsibleUserId),
      openingCash: openingCash ?? 0n,
      openingBank: openingBank ?? 0n,
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
          mutationError.message || "No se pudo abrir el turno. Verifica que la caja o banco no tenga ya un turno abierto."
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
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Elige la caja o banco, asigna el responsable y declara el saldo inicial. Puedes tener varios turnos abiertos, uno por caja o banco." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "open-register", children: "Caja o banco" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: form.registerId,
                onValueChange: (value) => update("registerId", value),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "open-register",
                      "aria-label": "Caja o banco",
                      "data-ocid": "caja.open_shift.register_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Elige una caja o banco" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: registers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__none__", disabled: true, children: "No hay cajas o bancos activos" }) : registers.map((register) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    SelectItem,
                    {
                      value: register.id.toString(),
                      children: [
                        register.name,
                        " · ",
                        cashRegisterKindLabel(register.kind)
                      ]
                    },
                    register.id.toString()
                  )) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "open-responsible", children: "Responsable del turno" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: form.responsibleUserId,
                onValueChange: (value) => {
                  if (value === "__free__") {
                    update("responsibleUserId", "");
                    return;
                  }
                  const user = users.find(
                    (candidate) => candidate.id.toString() === value
                  );
                  setForm((current) => ({
                    ...current,
                    responsibleUserId: value,
                    responsibleName: (user == null ? void 0 : user.name) ?? current.responsibleName
                  }));
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "open-responsible",
                      "aria-label": "Responsable del turno",
                      "data-ocid": "caja.open_shift.responsible_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Elige un usuario o escribe un nombre" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__free__", children: "Escribir un nombre libre" }),
                    users.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      SelectItem,
                      {
                        value: user.id.toString(),
                        children: [
                          user.name,
                          " · ",
                          user.roleName
                        ]
                      },
                      user.id.toString()
                    ))
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "open-responsible-name",
                value: form.responsibleName,
                onChange: (event) => update("responsibleName", event.target.value),
                placeholder: "Nombre del responsable",
                "data-ocid": "caja.open_shift.responsible_input",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "open-cash", children: [
                "Saldo inicial en caja (COP)",
                registerKind === "bank" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-xs font-normal text-muted-foreground", children: "(no aplica)" }) : null
              ] }),
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
                  required: registerKind !== "bank",
                  disabled: registerKind === "bank"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: "open-bank", children: [
                "Saldo inicial en bancos (COP)",
                registerKind === "cash" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 text-xs font-normal text-muted-foreground", children: "(no aplica)" }) : null
              ] }),
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
                  required: registerKind !== "cash",
                  disabled: registerKind === "cash"
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
  var _a, _b, _c;
  const [status, setStatus] = reactExports.useState(ShiftStatus.closed);
  const [registerId, setRegisterId] = reactExports.useState("all");
  const [responsible, setResponsible] = reactExports.useState("");
  const [from, setFrom] = reactExports.useState("");
  const [to, setTo] = reactExports.useState("");
  const [page, setPage] = reactExports.useState(1);
  const registersQuery = useCashRegisters({
    kind: null,
    active: null,
    search: "",
    offset: 0,
    limit: 100
  });
  const registers = ((_a = registersQuery.data) == null ? void 0 : _a.items) ?? [];
  const registerNames = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const register of registers) {
      map.set(register.id.toString(), register.name);
    }
    return map;
  }, [registers]);
  const fromTimestamp = reactExports.useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = reactExports.useMemo(() => colombiaEndOfDay(to), [to]);
  const shiftsQuery = useShifts({
    registerId: registerId === "all" ? null : BigInt(registerId),
    responsible,
    status: status === "all" ? null : status,
    from: fromTimestamp,
    to: toTimestamp,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE
  });
  const items = ((_b = shiftsQuery.data) == null ? void 0 : _b.items) ?? [];
  const total = Number(((_c = shiftsQuery.data) == null ? void 0 : _c.total) ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== ShiftStatus.closed || registerId !== "all" || responsible.trim() !== "" || from !== "" || to !== "";
  function clearFilters() {
    setStatus(ShiftStatus.closed);
    setRegisterId("all");
    setResponsible("");
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
        key: "register",
        header: "Caja o banco",
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: registerNames.get(shift.registerId.toString()) ?? `Caja #${shift.registerId.toString()}` })
      },
      {
        key: "responsible",
        header: "Responsable",
        render: (shift) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: shift.responsibleName || "—" })
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
    [registerNames]
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
                htmlFor: "history-register",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Caja o banco"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: registerId,
                onValueChange: (value) => {
                  setRegisterId(value);
                  setPage(1);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "history-register",
                      "aria-label": "Filtrar por caja o banco",
                      "data-ocid": "caja.history.register_filter",
                      className: "w-[180px]",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {})
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas" }),
                    registers.map((register) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                      SelectItem,
                      {
                        value: register.id.toString(),
                        children: register.name
                      },
                      register.id.toString()
                    ))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Label,
              {
                htmlFor: "history-responsible",
                className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
                children: "Responsable"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "history-responsible",
                value: responsible,
                onChange: (event) => {
                  setResponsible(event.target.value);
                  setPage(1);
                },
                placeholder: "Nombre del responsable",
                className: "w-[180px]",
                "data-ocid": "caja.history.responsible_input"
              }
            )
          ] }),
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
  const lines = report.movements.map((movement) => {
    const amountInPesos = Number(movement.amount) / 100;
    return {
      description: `${movementKindLabel(movement.kind)} · ${movement.description}${movement.reference ? ` (${movement.reference})` : ""}`,
      quantity: 1,
      unitPrice: amountInPesos,
      amount: amountInPesos
    };
  });
  const meta = [
    { label: "Turno", value: `#${shift.id.toString()}`, rail: true },
    { label: "Caja o banco", value: report.registerName || "—" },
    { label: "Responsable", value: report.responsibleName || "—" },
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
              /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
                report ? `${report.registerName || "Caja o banco"} · Responsable ${report.responsibleName || "—"}. ` : "",
                "Todos los movimientos del turno, totales por medio de pago y saldos finales. Imprimible en hoja A4 o tirilla de 80 mm."
              ] })
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
function ResponsibleDialog({
  open,
  onOpenChange,
  shift,
  registerName
}) {
  const [name, setName] = reactExports.useState("");
  const [userId, setUserId] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const setResponsible = useSetShiftResponsible();
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const usersQuery = useQuery({
    queryKey: ["users-page", "", 1],
    queryFn: async () => {
      if (!actor) return { items: [], total: 0n, offset: 0n, limit: 0n };
      return actor.listUsersPage(token, null, 0n, 100n);
    },
    enabled: !!actor && !isFetching
  });
  const users = reactExports.useMemo(
    () => {
      var _a;
      return (((_a = usersQuery.data) == null ? void 0 : _a.items) ?? []).filter((user) => user.active);
    },
    [usersQuery.data]
  );
  reactExports.useEffect(() => {
    var _a;
    if (open && shift) {
      setName(shift.responsibleName);
      setUserId(((_a = shift.responsibleUserId) == null ? void 0 : _a.toString()) ?? "");
      setError(null);
    }
  }, [open, shift]);
  function handleSubmit(event) {
    event.preventDefault();
    if (!shift) return;
    const trimmed = name.trim();
    if (trimmed === "") {
      setError("Asigna un responsable del turno.");
      return;
    }
    setError(null);
    setResponsible.mutate(
      {
        shiftId: shift.id,
        responsibleName: trimmed,
        responsibleUserId: userId === "" ? null : BigInt(userId)
      },
      {
        onSuccess: () => {
          ue.success("Responsable actualizado");
          onOpenChange(false);
        },
        onError: (mutationError) => {
          setError(
            mutationError.message || "No se pudo cambiar el responsable del turno."
          );
        }
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "caja.responsible.dialog",
      className: "sm:max-w-md",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Cambiar responsable" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
            registerName,
            " · Turno #",
            (shift == null ? void 0 : shift.id.toString()) ?? "",
            ". Elige un usuario del sistema o escribe un nombre libre."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "responsible-user", children: "Usuario del sistema" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: userId,
                onValueChange: (value) => {
                  if (value === "__free__") {
                    setUserId("");
                    return;
                  }
                  const user = users.find(
                    (candidate) => candidate.id.toString() === value
                  );
                  setUserId(value);
                  if (user) setName(user.name);
                },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    SelectTrigger,
                    {
                      id: "responsible-user",
                      "aria-label": "Usuario del sistema",
                      "data-ocid": "caja.responsible.user_select",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Elige un usuario o escribe un nombre" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "__free__", children: "Escribir un nombre libre" }),
                    users.map((user) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      SelectItem,
                      {
                        value: user.id.toString(),
                        children: [
                          user.name,
                          " · ",
                          user.roleName
                        ]
                      },
                      user.id.toString()
                    ))
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "responsible-name", children: "Nombre del responsable" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "responsible-name",
                value: name,
                onChange: (event) => setName(event.target.value),
                placeholder: "Nombre del responsable",
                "data-ocid": "caja.responsible.name_input",
                required: true
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "caja.responsible.error_state",
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
                "data-ocid": "caja.responsible.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: setResponsible.isPending,
                "data-ocid": "caja.responsible.submit_button",
                children: setResponsible.isPending ? "Guardando…" : "Guardar"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function CajaBancosPage() {
  const openShiftsQuery = useOpenShifts();
  const openShifts = reactExports.useMemo(
    () => openShiftsQuery.data ?? [],
    [openShiftsQuery.data]
  );
  const registersQuery = useCashRegisters({
    kind: null,
    active: null,
    search: "",
    offset: 0,
    limit: 100
  });
  const registerNames = reactExports.useMemo(() => {
    var _a;
    const map = /* @__PURE__ */ new Map();
    for (const register of ((_a = registersQuery.data) == null ? void 0 : _a.items) ?? []) {
      map.set(register.id.toString(), register.name);
    }
    return map;
  }, [registersQuery.data]);
  const [openShiftDialog, setOpenShiftDialog] = reactExports.useState(false);
  const [closeShiftId, setCloseShiftId] = reactExports.useState(null);
  const [movementDialog, setMovementDialog] = reactExports.useState(false);
  const [movementShiftId, setMovementShiftId] = reactExports.useState(null);
  const [responsibleShiftId, setResponsibleShiftId] = reactExports.useState(null);
  const [reportShiftId, setReportShiftId] = reactExports.useState(null);
  const closeShift = reactExports.useMemo(
    () => openShifts.find((shift) => shift.id === closeShiftId) ?? null,
    [openShifts, closeShiftId]
  );
  const responsibleShift = reactExports.useMemo(
    () => openShifts.find((shift) => shift.id === responsibleShiftId) ?? null,
    [openShifts, responsibleShiftId]
  );
  const openReport = reactExports.useCallback((shiftId) => {
    setReportShiftId(shiftId);
  }, []);
  const closeReport = reactExports.useCallback(() => {
    setReportShiftId(null);
  }, []);
  const openMovementFor = reactExports.useCallback((shiftId) => {
    setMovementShiftId((shiftId == null ? void 0 : shiftId.toString()) ?? null);
    setMovementDialog(true);
  }, []);
  const hasOpenShifts = openShifts.length > 0;
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
            description: "Turnos por caja o banco, movimientos por medio de pago e informe diario. Puedes tener varios turnos abiertos a la vez, uno por caja o banco.",
            actions: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center gap-2", children: hasOpenShifts ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => openMovementFor(null),
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
                  onClick: () => setOpenShiftDialog(true),
                  "data-ocid": "caja.open_shift_button",
                  className: "gap-1.5",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LockOpen, { className: "size-4", "aria-hidden": "true" }),
                    "Abrir turno"
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: () => setOpenShiftDialog(true),
                disabled: openShiftsQuery.isLoading,
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
            shifts: openShifts,
            registerNames,
            isLoading: openShiftsQuery.isLoading,
            isError: openShiftsQuery.isError
          }
        ),
        hasOpenShifts ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
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
                  onClick: () => openMovementFor(null),
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
        hasOpenShifts ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "section",
          {
            "data-ocid": "caja.open_shifts.list",
            "aria-label": "Turnos abiertos",
            className: "space-y-3",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Turnos abiertos" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: openShifts.map((shift, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  "data-ocid": `caja.open_shifts.item.${index + 1}`,
                  className: "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-subtle",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-display text-sm font-semibold", children: registerNames.get(shift.registerId.toString()) ?? `Caja #${shift.registerId.toString()}` }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "data-rail text-[11px] text-muted-foreground", children: [
                          "Turno #",
                          shift.id.toString(),
                          " · Responsable",
                          " ",
                          shift.responsibleName || "—"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-sm font-semibold", children: formatMoney(
                        shift.computedClosingCash + shift.computedClosingBank
                      ) })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          onClick: () => openMovementFor(shift.id),
                          "data-ocid": `caja.open_shifts.movement_button.${index + 1}`,
                          className: "gap-1.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleArrowUp, { className: "size-4", "aria-hidden": "true" }),
                            "Movimiento"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          onClick: () => setResponsibleShiftId(shift.id),
                          "data-ocid": `caja.open_shifts.responsible_button.${index + 1}`,
                          className: "gap-1.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(UserCog, { className: "size-4", "aria-hidden": "true" }),
                            "Responsable"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          onClick: () => setReportShiftId(shift.id),
                          "data-ocid": `caja.open_shifts.report_button.${index + 1}`,
                          className: "gap-1.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { className: "size-4", "aria-hidden": "true" }),
                            "Informe"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        Button,
                        {
                          type: "button",
                          size: "sm",
                          onClick: () => setCloseShiftId(shift.id),
                          "data-ocid": `caja.open_shifts.close_button.${index + 1}`,
                          className: "gap-1.5",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "size-4", "aria-hidden": "true" }),
                            "Cerrar"
                          ]
                        }
                      )
                    ] })
                  ]
                },
                shift.id.toString()
              )) })
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
              shiftId: null,
              ocid: "caja.movements",
              caption: "Movimientos de caja y bancos"
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
        closeShift ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          CloseShiftDialog,
          {
            open: closeShiftId !== null,
            onOpenChange: (open) => {
              if (!open) setCloseShiftId(null);
            },
            shift: closeShift,
            registerName: registerNames.get(closeShift.registerId.toString()) ?? `Caja #${closeShift.registerId.toString()}`
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CashMovementDialog,
          {
            open: movementDialog,
            onOpenChange: setMovementDialog,
            initialShiftId: movementShiftId
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ResponsibleDialog,
          {
            open: responsibleShiftId !== null,
            onOpenChange: (open) => {
              if (!open) setResponsibleShiftId(null);
            },
            shift: responsibleShift,
            registerName: responsibleShift ? registerNames.get(responsibleShift.registerId.toString()) ?? `Caja #${responsibleShift.registerId.toString()}` : ""
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
