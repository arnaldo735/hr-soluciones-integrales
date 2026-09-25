import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTechnicians } from "@/hooks/use-technicians";
import type { Id, Technician } from "@/lib/types";
import { UserRound } from "lucide-react";

/** Sentinel for "no responsible technician" — Radix Select forbids `""`. */
export const NO_TECHNICIAN = "__none__";

interface LaborTechnicianSelectProps {
  /** Currently selected technician id, or `null` for unassigned. */
  value: Id | null;
  onChange: (technicianId: Id | null) => void;
  /** Field id, so the visible label points at the trigger. */
  id: string;
  /** ocid prefix for deterministic markers. */
  ocid: string;
  /** Disable the control while a mutation is in flight. */
  disabled?: boolean;
  /** Render the label above the trigger. */
  showLabel?: boolean;
  /** Restrict the list to active technicians (used when adding a new line). */
  activeOnly?: boolean;
}

/**
 * Technician picker for a labor line. Shows the identification code next to
 * the technician name so the responsible technician is unambiguous, and
 * resolves the selected id against the loaded roster so the trigger can render
 * the code even when the technician is no longer active.
 */
export function LaborTechnicianSelect({
  value,
  onChange,
  id,
  ocid,
  disabled = false,
  showLabel = true,
  activeOnly = false,
}: LaborTechnicianSelectProps) {
  const techniciansQuery = useTechnicians({
    search: "",
    specialty: null,
    activeOnly,
  });
  const technicians = techniciansQuery.data ?? [];
  const selected = technicians.find((entry) => entry.id === value) ?? null;

  function handleChange(next: string) {
    onChange(next === NO_TECHNICIAN ? null : BigInt(next));
  }

  return (
    <div className="space-y-2">
      {showLabel ? (
        <Label htmlFor={id} className="flex items-center gap-1.5">
          <UserRound
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          Técnico responsable
        </Label>
      ) : null}
      <Select
        value={value === null ? NO_TECHNICIAN : value.toString()}
        onValueChange={handleChange}
        disabled={disabled || techniciansQuery.isLoading}
      >
        <SelectTrigger
          id={id}
          data-ocid={ocid}
          aria-label="Técnico responsable de la mano de obra"
          className="w-full"
        >
          <SelectValue placeholder="Selecciona un técnico…">
            {selected ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  {selected.code}
                </span>
                <span className="truncate">{selected.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Sin asignar</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_TECHNICIAN}>
            <span className="text-muted-foreground">Sin asignar</span>
          </SelectItem>
          {technicians.map((technician: Technician) => (
            <SelectItem
              key={technician.id.toString()}
              value={technician.id.toString()}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  {technician.code}
                </span>
                <span className="truncate">{technician.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {technician.specialty}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!techniciansQuery.isLoading && technicians.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {activeOnly
            ? "No hay técnicos activos registrados. Registra uno para asignar la mano de obra."
            : "No hay técnicos registrados todavía."}
        </p>
      ) : null}
    </div>
  );
}
