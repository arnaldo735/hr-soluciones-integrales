import { ServicePicker } from "@/components/order/ServicePicker";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useService } from "@/hooks/use-services";
import type { Id, LaborItem, Service } from "@/lib/types";
import { Tag } from "lucide-react";
import { useState } from "react";

interface LaborServiceLinkProps {
  /** The labor line whose catalog link is being shown or edited. */
  item: LaborItem;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /** Disable the control while a mutation is in flight. */
  disabled?: boolean;
  /**
   * Replaces the line's catalog link. The backend exposes no dedicated
   * "update labor service" method, so the caller removes the line and re-adds
   * it with the new `serviceId`, preserving description, price and technician.
   */
  onChange: (service: Service | null) => void;
}

/**
 * Shows which catalog service a labor line is linked to and lets the operator
 * change or clear that link. The description stays editable independently, so
 * clearing the service never removes the line's text.
 */
export function LaborServiceLink({
  item,
  ocid,
  disabled = false,
  onChange,
}: LaborServiceLinkProps) {
  const [open, setOpen] = useState(false);
  const serviceQuery = useService(item.serviceId ?? null);
  const service = serviceQuery.data ?? null;

  if (item.serviceId === undefined) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            data-ocid={`${ocid}.link_button`}
            className="-ml-2 h-6 gap-1 px-2 text-xs text-muted-foreground"
          >
            <Tag className="size-3" aria-hidden="true" />
            Vincular servicio
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          data-ocid={`${ocid}.popover`}
          className="w-80 space-y-3"
        >
          <p className="text-xs text-muted-foreground">
            Elige un servicio del catálogo para vincular esta línea. La
            descripción y el precio no cambian.
          </p>
          <ServicePicker
            id={`${ocid}-picker`}
            ocid={`${ocid}.picker`}
            value={null}
            disabled={disabled}
            onChange={(next) => {
              if (next) {
                onChange(next);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-ocid={`${ocid}.badge`}
          className="data-rail inline-flex max-w-full items-center gap-1.5 rounded border border-primary/40 bg-primary/5 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Tag className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {service
              ? `${service.code} · ${service.name}`
              : "Servicio vinculado"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-ocid={`${ocid}.popover`}
        className="w-80 space-y-3"
      >
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Servicio vinculado
          </p>
          <p className="text-sm font-medium">
            {service ? service.name : "Servicio del catálogo"}
          </p>
          {service ? (
            <p className="data-rail text-xs text-muted-foreground">
              {service.code} · {service.category}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Cambia el servicio vinculado o quítalo para dejar la línea como
            texto libre. La descripción y el precio se conservan.
          </p>
          <ServicePicker
            id={`${ocid}-picker`}
            ocid={`${ocid}.picker`}
            value={null}
            disabled={disabled}
            onChange={(next) => {
              if (next) {
                onChange(next);
                setOpen(false);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            data-ocid={`${ocid}.clear_button`}
            className="w-full gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Tag className="size-3.5" aria-hidden="true" />
            Quitar vínculo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type { Id };
