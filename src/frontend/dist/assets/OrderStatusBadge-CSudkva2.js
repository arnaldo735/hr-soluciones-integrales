import { Y as createLucideIcon, j as jsxRuntimeExports, x as Badge, Z as cn, E as Ban, az as CircleCheck, W as Wrench, O as OrderStatus } from "./index-EqGEeyjs.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }]
];
const CircleDot = createLucideIcon("circle-dot", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m16 16 2 2 4-4", key: "gfu2re" }],
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
const PackageCheck = createLucideIcon("package-check", __iconNode);
const STATUS_META = {
  [OrderStatus.received]: {
    label: "Recibida",
    icon: CircleDot,
    className: "border-info/40 bg-info/10 text-info"
  },
  [OrderStatus.inRepair]: {
    label: "En reparación",
    icon: Wrench,
    className: "border-warning/40 bg-warning/10 text-warning"
  },
  [OrderStatus.ready]: {
    label: "Lista",
    icon: PackageCheck,
    className: "border-primary/40 bg-primary/10 text-primary"
  },
  [OrderStatus.delivered]: {
    label: "Entregada",
    icon: CircleCheck,
    className: "border-success/40 bg-success/10 text-success"
  },
  [OrderStatus.cancelled]: {
    label: "Cancelada",
    icon: Ban,
    className: "border-status-cancelled/40 bg-status-cancelled/10 text-status-cancelled"
  }
};
function orderStatusMeta(status) {
  return STATUS_META[status] ?? {
    label: status,
    icon: CircleDot,
    className: "border-border bg-muted text-muted-foreground"
  };
}
function OrderStatusBadge({ status, className }) {
  const meta = orderStatusMeta(status);
  const Icon = meta.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Badge,
    {
      variant: "outline",
      className: cn("gap-1.5 font-medium", meta.className, className),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-3", "aria-hidden": "true" }),
        meta.label
      ]
    }
  );
}
export {
  OrderStatusBadge as O
};
