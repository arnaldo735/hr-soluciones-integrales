import { K as createLucideIcon, ai as useParams, k as useBackend, u as useRole, s as reactExports, l as useQuery, j as jsxRuntimeExports, T as TriangleAlert, B as Button, L as Link, w as Badge, n as formatNumber, x as formatMoney, y as formatDate, d as Boxes, D as ChevronRight, ae as cn, ax as MovementKind, ay as formatPrincipal, ag as formatDateTime, ak as useQueryClient, az as AdjustmentDirection, al as useMutation, M as Dialog, V as DialogContent, Y as DialogHeader, Z as DialogTitle, _ as DialogDescription, v as Input, $ as DialogFooter, ar as ue } from "./index-CzQEXdHP.js";
import { L as Label } from "./label-Bo6gHS3t.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dnf2ttab.js";
import { S as Skeleton } from "./skeleton-C0qSaeaU.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CKrT3zG1.js";
import { T as Textarea } from "./textarea-C9U8oXYV.js";
import { A as ArrowLeft } from "./arrow-left-DLNUnNNY.js";
import { C as ChevronLeft } from "./chevron-left-CY0scwou.js";
import { P as PackagePlus } from "./package-plus-BhkMeGFW.js";
import "./chevron-up-B1sEs4Rc.js";
import "./check-DrBSQP0y.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  ["path", { d: "m16 3 4 4-4 4", key: "1x1c3m" }],
  ["path", { d: "M20 7H4", key: "zbl0bi" }],
  ["path", { d: "m8 21-4-4 4-4", key: "h9nckh" }],
  ["path", { d: "M4 17h16", key: "g4d7ey" }]
];
const ArrowRightLeft = createLucideIcon("arrow-right-left", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
      key: "zw3jo"
    }
  ],
  [
    "path",
    {
      d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
      key: "1wduqc"
    }
  ],
  [
    "path",
    {
      d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
      key: "kqbvx6"
    }
  ]
];
const Layers = createLucideIcon("layers", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M16 16h6", key: "100bgy" }],
  [
    "path",
    {
      d: "M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14",
      key: "e7tb2h"
    }
  ],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
  ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
  ["line", { x1: "12", x2: "12", y1: "22", y2: "12", key: "a4e8g8" }]
];
const PackageMinus = createLucideIcon("package-minus", __iconNode);
const MOVEMENT_LABELS = {
  [MovementKind.purchase]: "Compra",
  [MovementKind.sale]: "Venta",
  [MovementKind.adjustment]: "Ajuste"
};
const MOVEMENT_STYLES = {
  [MovementKind.purchase]: "border-success/50 bg-success/15 text-success",
  [MovementKind.sale]: "border-info/50 bg-info/15 text-info",
  [MovementKind.adjustment]: "border-accent/50 bg-accent/15 text-accent"
};
function MovementBadge({ kind }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Badge,
    {
      variant: "outline",
      className: cn(
        "font-mono text-[10px] uppercase tracking-wider",
        MOVEMENT_STYLES[kind]
      ),
      children: MOVEMENT_LABELS[kind]
    }
  );
}
function StatTile({
  label,
  value,
  hint,
  tone = "default"
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card px-4 py-3 shadow-subtle", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "p",
      {
        className: cn(
          "data-rail mt-1.5 text-lg font-semibold",
          tone === "warning" && "text-warning",
          tone === "primary" && "text-primary"
        ),
        children: value
      }
    ),
    hint ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: hint }) : null
  ] });
}
function AdjustmentDialog({
  open,
  onOpenChange,
  part,
  lots
}) {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  const [direction, setDirection] = reactExports.useState(
    AdjustmentDirection.in
  );
  const [quantity, setQuantity] = reactExports.useState("");
  const [reason, setReason] = reactExports.useState("");
  const [lotId, setLotId] = reactExports.useState("none");
  const [error, setError] = reactExports.useState(null);
  const mutation = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.adjustStock(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["part", part.id.toString()]
      });
      void queryClient.invalidateQueries({
        queryKey: ["lots", part.id.toString()]
      });
      void queryClient.invalidateQueries({
        queryKey: ["movements", part.id.toString()]
      });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      ue.success("Ajuste registrado");
      setQuantity("");
      setReason("");
      setLotId("none");
      setError(null);
      onOpenChange(false);
    },
    onError: () => {
      setError("No se pudo registrar el ajuste. Intenta de nuevo.");
    }
  });
  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("La cantidad debe ser mayor a cero.");
      return;
    }
    if (!reason.trim()) {
      setError("El motivo del ajuste es obligatorio.");
      return;
    }
    setError(null);
    mutation.mutate({
      partId: part.id,
      direction,
      quantity: BigInt(parsed),
      reason: reason.trim(),
      lotId: lotId === "none" ? void 0 : BigInt(lotId)
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      "data-ocid": "part_detail.adjust_dialog",
      className: "sm:max-w-lg",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-display", children: "Ajuste manual de inventario" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { children: [
            "Registra una entrada o salida de existencia para",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail text-foreground", children: part.sku }),
            ". El movimiento queda registrado con tu usuario y la fecha."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "adjust-direction", children: "Tipo de movimiento" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: direction === AdjustmentDirection.in ? "default" : "outline",
                  onClick: () => setDirection(AdjustmentDirection.in),
                  "aria-pressed": direction === AdjustmentDirection.in,
                  "data-ocid": "part_detail.direction_in_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(PackagePlus, { className: "size-4", "aria-hidden": "true" }),
                    "Entrada"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Button,
                {
                  type: "button",
                  variant: direction === AdjustmentDirection.out ? "default" : "outline",
                  onClick: () => setDirection(AdjustmentDirection.out),
                  "aria-pressed": direction === AdjustmentDirection.out,
                  "data-ocid": "part_detail.direction_out_button",
                  className: "gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(PackageMinus, { className: "size-4", "aria-hidden": "true" }),
                    "Salida"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "adjust-quantity", children: "Cantidad" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "adjust-quantity",
                  type: "number",
                  min: "1",
                  step: "1",
                  value: quantity,
                  onChange: (event) => setQuantity(event.target.value),
                  placeholder: "0",
                  className: "data-rail",
                  "data-ocid": "part_detail.quantity_input",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "adjust-lot", children: "Lote / serie (opcional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: lotId, onValueChange: setLotId, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SelectTrigger,
                  {
                    id: "adjust-lot",
                    "aria-label": "Lote o serie",
                    "data-ocid": "part_detail.lot_select",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Sin lote" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Sin lote específico" }),
                  lots.map((lot) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    SelectItem,
                    {
                      value: lot.id.toString(),
                      children: [
                        lot.lotNumber,
                        " · ",
                        formatNumber(lot.quantity),
                        " disp."
                      ]
                    },
                    lot.id.toString()
                  ))
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "adjust-reason", children: "Motivo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "adjust-reason",
                value: reason,
                onChange: (event) => setReason(event.target.value),
                placeholder: "Merma por daño en almacén, conteo físico, devolución…",
                "data-ocid": "part_detail.reason_input",
                required: true
              }
            )
          ] }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              "data-ocid": "part_detail.adjust_error",
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
                "data-ocid": "part_detail.cancel_button",
                children: "Cancelar"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "submit",
                disabled: mutation.isPending,
                "data-ocid": "part_detail.submit_button",
                children: mutation.isPending ? "Registrando…" : "Registrar ajuste"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function LotsTable({ lots }) {
  if (lots.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "part_detail.lots_empty_state",
        className: "flex flex-col items-center gap-2 px-6 py-10 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-5 text-muted-foreground", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Este repuesto no tiene lotes registrados." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Los lotes se crean automáticamente al registrar compras a proveedores." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Lote / serie" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Cantidad" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Costo unitario" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Proveedor" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fecha" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: lots.map((lot, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      TableRow,
      {
        "data-ocid": `part_detail.lot.${index + 1}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-sm font-medium", children: lot.lotNumber }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right", children: formatNumber(lot.quantity) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-right text-muted-foreground", children: formatMoney(lot.unitCost) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: lot.supplierId === void 0 ? "—" : `Proveedor #${lot.supplierId.toString()}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: formatDate(lot.receivedAt) })
        ]
      },
      lot.id.toString()
    )) })
  ] });
}
function MovementsTable({ movements }) {
  if (movements.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "part_detail.movements_empty_state",
        className: "flex flex-col items-center gap-2 px-6 py-10 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ArrowRightLeft,
            {
              className: "size-5 text-muted-foreground",
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Sin movimientos registrados todavía." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: "Aquí aparecerán las ventas, compras y ajustes que afecten la existencia." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { className: "hover:bg-transparent", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Tipo" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Cantidad" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Motivo" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Usuario" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground", children: "Fecha" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TableBody, { children: movements.map((movement, index) => {
      const isOut = movement.kind === MovementKind.sale;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        TableRow,
        {
          "data-ocid": `part_detail.movement.${index + 1}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MovementBadge, { kind: movement.kind }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              TableCell,
              {
                className: cn(
                  "data-rail text-right font-medium",
                  isOut ? "text-destructive" : "text-success"
                ),
                children: [
                  isOut ? "−" : "+",
                  formatNumber(movement.quantity)
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "max-w-[280px] text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block truncate", children: movement.reason || "—" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "data-rail text-xs text-muted-foreground", children: formatPrincipal(movement.performedBy.toString()) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-muted-foreground", children: formatDateTime(movement.at) })
          ]
        },
        movement.id.toString()
      );
    }) })
  ] });
}
function PartDetailPage() {
  const { id } = useParams({ strict: false });
  const { actor, isFetching } = useBackend();
  const { isAdmin } = useRole();
  const [adjustOpen, setAdjustOpen] = reactExports.useState(false);
  const [movementPage, setMovementPage] = reactExports.useState(1);
  const partId = BigInt(id);
  const partQuery = useQuery({
    queryKey: ["part", id],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getPart(partId);
    },
    enabled: !!actor && !isFetching
  });
  const lotsQuery = useQuery({
    queryKey: ["lots", id],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listLots(partId);
    },
    enabled: !!actor && !isFetching
  });
  const movementsQuery = useQuery({
    queryKey: ["movements", id],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listMovements(partId);
    },
    enabled: !!actor && !isFetching
  });
  const part = partQuery.data ?? null;
  const lots = lotsQuery.data ?? [];
  const movements = movementsQuery.data ?? [];
  const MOVEMENTS_PER_PAGE = 10;
  const movementPages = Math.max(
    1,
    Math.ceil(movements.length / MOVEMENTS_PER_PAGE)
  );
  const safeMovementPage = Math.min(movementPage, movementPages);
  const visibleMovements = movements.slice(
    (safeMovementPage - 1) * MOVEMENTS_PER_PAGE,
    safeMovementPage * MOVEMENTS_PER_PAGE
  );
  if (partQuery.isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "part_detail.loading_state",
        className: "mx-auto w-full max-w-6xl space-y-4",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-48" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-28 w-full" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-56 w-full" })
        ]
      }
    );
  }
  if (partQuery.isError || !part) {
    const retry = () => {
      void partQuery.refetch({ cancelRefetch: true });
      void lotsQuery.refetch({ cancelRefetch: true });
      void movementsQuery.refetch({ cancelRefetch: true });
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "part_detail.error_state",
        className: "mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-6 text-destructive", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-sm font-semibold", children: partQuery.isError ? "No se pudo cargar el repuesto" : "Repuesto no encontrado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-xs text-muted-foreground", children: partQuery.isError ? "Ocurrió un error al consultar el repuesto. Intenta de nuevo." : "El repuesto solicitado no existe o fue eliminado del catálogo." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-center gap-2", children: [
            partQuery.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "button",
                variant: "outline",
                onClick: retry,
                "data-ocid": "part_detail.retry_button",
                children: "Reintentar"
              }
            ) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/inventario", "data-ocid": "part_detail.back_button", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
              "Volver al inventario"
            ] }) })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": "part_detail.page",
      className: "mx-auto w-full max-w-6xl animate-fade-in space-y-5",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "sm", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/inventario",
            "data-ocid": "part_detail.back_link",
            className: "gap-1",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4", "aria-hidden": "true" }),
              "Inventario"
            ]
          }
        ) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "rounded-lg border border-border bg-card p-5 shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "data-rail rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium", children: part.sku }),
                part.lowStock ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Badge,
                  {
                    variant: "outline",
                    "data-ocid": "part_detail.low_stock_badge",
                    className: "gap-1 border-warning/50 bg-warning/15 font-mono text-[10px] uppercase tracking-wider text-warning",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-3", "aria-hidden": "true" }),
                      "Stock bajo"
                    ]
                  }
                ) : null
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: part.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: [part.category, part.brand].filter(Boolean).join(" · ") || "Sin categoría" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                onClick: () => setAdjustOpen(true),
                "data-ocid": "part_detail.adjust_button",
                className: "gap-2",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { className: "size-4", "aria-hidden": "true" }),
                  "Ajustar existencia"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StatTile,
              {
                label: "Existencia total",
                value: `${formatNumber(part.totalStock)} ${part.unit}`,
                hint: `Umbral de alerta: ${formatNumber(part.lowStockThreshold)}`,
                tone: part.lowStock ? "warning" : "primary"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StatTile,
              {
                label: "Precio de venta",
                value: formatMoney(part.salePrice)
              }
            ),
            isAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              StatTile,
              {
                label: "Precio de costo",
                value: formatMoney(part.costPrice)
              }
            ) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              StatTile,
              {
                label: "Lotes registrados",
                value: formatNumber(lots.length),
                hint: `Alta: ${formatDate(part.createdAt)}`
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-4 text-muted-foreground", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Lotes y números de serie" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: formatNumber(lots.length) })
          ] }),
          lotsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 p-4", children: Array.from({ length: 3 }, (_, index) => `lot-${index}`).map(
            (key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, key)
          ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(LotsTable, { lots })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-lg border border-border bg-card shadow-subtle", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border-b border-border px-4 py-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { className: "size-4 text-muted-foreground", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-sm font-semibold", children: "Historial de movimientos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: formatNumber(movements.length) })
          ] }),
          movementsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 p-4", children: Array.from({ length: 4 }, (_, index) => `mv-${index}`).map(
            (key) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" }, key)
          ) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MovementsTable, { movements: visibleMovements }),
            movements.length > MOVEMENTS_PER_PAGE ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-border px-4 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground", children: [
                "Página ",
                safeMovementPage,
                " de ",
                movementPages
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    disabled: safeMovementPage <= 1,
                    onClick: () => setMovementPage(safeMovementPage - 1),
                    "data-ocid": "part_detail.movements_prev",
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
                    disabled: safeMovementPage >= movementPages,
                    onClick: () => setMovementPage(safeMovementPage + 1),
                    "data-ocid": "part_detail.movements_next",
                    className: "gap-1",
                    children: [
                      "Siguiente",
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4", "aria-hidden": "true" })
                    ]
                  }
                )
              ] })
            ] }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AdjustmentDialog,
          {
            open: adjustOpen,
            onOpenChange: setAdjustOpen,
            part,
            lots
          }
        )
      ]
    }
  );
}
export {
  PartDetailPage
};
