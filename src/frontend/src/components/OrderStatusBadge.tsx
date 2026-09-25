import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  CircleDot,
  PackageCheck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  className: string;
}

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  [OrderStatus.received]: {
    label: "Recibida",
    icon: CircleDot,
    className: "border-info/40 bg-info/10 text-info",
  },
  [OrderStatus.inRepair]: {
    label: "En reparación",
    icon: Wrench,
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  [OrderStatus.ready]: {
    label: "Lista",
    icon: PackageCheck,
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  [OrderStatus.delivered]: {
    label: "Entregada",
    icon: CheckCircle2,
    className: "border-success/40 bg-success/10 text-success",
  },
  [OrderStatus.cancelled]: {
    label: "Cancelada",
    icon: Ban,
    className:
      "border-status-cancelled/40 bg-status-cancelled/10 text-status-cancelled",
  },
};

/** Resolves a backend order status string to its display metadata. */
export function orderStatusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status as OrderStatus] ?? {
      label: status,
      icon: CircleDot,
      className: "border-border bg-muted text-muted-foreground",
    }
  );
}

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

/** Compact status pill for workshop orders, shared across list and detail views. */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const meta = orderStatusMeta(status);
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", meta.className, className)}
    >
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
