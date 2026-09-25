import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/hooks/use-orders";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OrderStatusStepperProps {
  status: OrderStatus;
}

/**
 * Four-step horizontal stepper (Recibida → En Reparación → Lista → Entregada).
 * Completed steps are filled lime, the current step is ringed, and future
 * steps stay muted.
 */
export function OrderStatusStepper({ status }: OrderStatusStepperProps) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <ol
      data-ocid="order_detail.status_stepper"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0"
    >
      {ORDER_STATUS_FLOW.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li
            key={step}
            data-ocid={`order_detail.status_step.${index + 1}`}
            aria-current={isCurrent ? "step" : undefined}
            className="flex flex-1 items-center gap-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold transition-smooth",
                  isComplete &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary bg-primary/15 text-primary ring-2 ring-primary/30",
                  !isComplete &&
                    !isCurrent &&
                    "border-border bg-muted/40 text-muted-foreground",
                )}
              >
                {isComplete ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium",
                  isCurrent
                    ? "text-foreground"
                    : isComplete
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70",
                )}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
            {index < ORDER_STATUS_FLOW.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-3 hidden h-px flex-1 sm:block",
                  index < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
