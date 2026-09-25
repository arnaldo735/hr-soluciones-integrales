import { cn } from "@/lib/utils";

/** Every status family the design system defines a badge variant for. */
export type StatusTone =
  | "draft"
  | "sent"
  | "accepted"
  | "pending"
  | "rejected"
  | "expired"
  | "cancelled"
  | "scheduled"
  | "confirmed"
  | "attended"
  | "noshow"
  | "neutral";

const TONE_CLASS: Record<StatusTone, string> = {
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
  neutral: "bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  /** Visible Spanish label. */
  label: string;
  /** Design-token tone family. */
  tone: StatusTone;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Status pill backed by the design system's `status-*` token families.
 * Used by quotes, appointments, expenses and POS views.
 */
export function StatusBadge({
  label,
  tone,
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span
      data-tone={tone}
      className={cn("badge-status", TONE_CLASS[tone], className)}
    >
      {icon}
      {label}
    </span>
  );
}
