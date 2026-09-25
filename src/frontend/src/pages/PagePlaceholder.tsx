import { Construction } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  ocid: string;
}

/**
 * Minimal shell for a route whose page body is owned by a later task.
 * Keeps the router compiling and the shell navigable without implementing
 * page behavior here.
 */
export function PagePlaceholder({
  title,
  description,
  ocid,
}: PagePlaceholderProps) {
  return (
    <div
      data-ocid={ocid}
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>

      <div
        data-ocid={`${ocid}.empty_state`}
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center"
      >
        <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
          <Construction
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold">
            Módulo en construcción
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Esta sección se habilitará en la siguiente entrega del taller.
          </p>
        </div>
      </div>
    </div>
  );
}
