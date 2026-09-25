import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Page title, rendered in the display face. */
  title: string;
  /** One-line description of the module. */
  description?: string;
  /** Optional eyebrow label above the title (flow name). */
  eyebrow?: string;
  /** Primary and secondary actions rendered on the right. */
  actions?: ReactNode;
  /** Optional filter/search row rendered below the title. */
  toolbar?: ReactNode;
  className?: string;
}

/**
 * Shared page header for every module view: eyebrow, title, description,
 * right-aligned actions and an optional toolbar row.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  toolbar,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
      ) : null}
    </header>
  );
}
