import { j as jsxRuntimeExports, Y as cn } from "./index-CGU00UGU.js";
const TONE_CLASS = {
  draft: "badge-draft",
  sent: "badge-sent",
  accepted: "badge-accepted",
  pending: "badge-pending",
  rejected: "badge-rejected",
  expired: "badge-expired",
  cancelled: "badge-cancelled",
  scheduled: "badge-scheduled",
  confirmed: "badge-confirmed",
  attended: "badge-attended",
  noshow: "badge-noshow",
  neutral: "bg-muted text-muted-foreground"
};
function StatusBadge({
  label,
  tone,
  icon,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "span",
    {
      "data-tone": tone,
      className: cn("badge-status", TONE_CLASS[tone], className),
      children: [
        icon,
        label
      ]
    }
  );
}
export {
  StatusBadge as S
};
