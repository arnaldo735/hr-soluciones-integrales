import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useRole } from "@/hooks/use-role";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPrincipal,
} from "@/lib/format";
import type {
  AdjustmentInput,
  Lot,
  Movement,
  PartInput,
  PartView,
} from "@/lib/types";
import { AdjustmentDirection, MovementKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Barcode,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Layers,
  PackageMinus,
  PackagePlus,
  Pencil,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MOVEMENT_LABELS: Record<MovementKind, string> = {
  [MovementKind.purchase]: "Compra",
  [MovementKind.sale]: "Venta",
  [MovementKind.adjustment]: "Ajuste",
};

const MOVEMENT_STYLES: Record<MovementKind, string> = {
  [MovementKind.purchase]: "border-success/50 bg-success/15 text-success",
  [MovementKind.sale]: "border-info/50 bg-info/15 text-info",
  [MovementKind.adjustment]: "border-accent/50 bg-accent/15 text-accent",
};

function MovementBadge({ kind }: { kind: MovementKind }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-[10px] uppercase tracking-wider",
        MOVEMENT_STYLES[kind],
      )}
    >
      {MOVEMENT_LABELS[kind]}
    </Badge>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "primary";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-subtle">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "data-rail mt-1.5 text-lg font-semibold",
          tone === "warning" && "text-warning",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function AdjustmentDialog({
  open,
  onOpenChange,
  part,
  lots,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartView;
  lots: Lot[];
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [direction, setDirection] = useState<AdjustmentDirection>(
    AdjustmentDirection.in,
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [lotId, setLotId] = useState("none");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: AdjustmentInput) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.adjustStock(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["part", part.id.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["lots", part.id.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["movements", part.id.toString()],
      });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      toast.success("Ajuste registrado");
      setQuantity("");
      setReason("");
      setLotId("none");
      setError(null);
      onOpenChange(false);
    },
    onError: () => {
      setError("No se pudo registrar el ajuste. Intenta de nuevo.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
      lotId: lotId === "none" ? undefined : BigInt(lotId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="part_detail.adjust_dialog"
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Ajuste manual de inventario
          </DialogTitle>
          <DialogDescription>
            Registra una entrada o salida de existencia para{" "}
            <span className="data-rail text-foreground">{part.sku}</span>. El
            movimiento queda registrado con tu usuario y la fecha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adjust-direction">Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={
                  direction === AdjustmentDirection.in ? "default" : "outline"
                }
                onClick={() => setDirection(AdjustmentDirection.in)}
                aria-pressed={direction === AdjustmentDirection.in}
                data-ocid="part_detail.direction_in_button"
                className="gap-2"
              >
                <PackagePlus className="size-4" aria-hidden="true" />
                Entrada
              </Button>
              <Button
                type="button"
                variant={
                  direction === AdjustmentDirection.out ? "default" : "outline"
                }
                onClick={() => setDirection(AdjustmentDirection.out)}
                aria-pressed={direction === AdjustmentDirection.out}
                data-ocid="part_detail.direction_out_button"
                className="gap-2"
              >
                <PackageMinus className="size-4" aria-hidden="true" />
                Salida
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="adjust-quantity">Cantidad</Label>
              <Input
                id="adjust-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="0"
                className="data-rail"
                data-ocid="part_detail.quantity_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adjust-lot">Lote / serie (opcional)</Label>
              <Select value={lotId} onValueChange={setLotId}>
                <SelectTrigger
                  id="adjust-lot"
                  aria-label="Lote o serie"
                  data-ocid="part_detail.lot_select"
                >
                  <SelectValue placeholder="Sin lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin lote específico</SelectItem>
                  {lots.map((lot) => (
                    <SelectItem
                      key={lot.id.toString()}
                      value={lot.id.toString()}
                    >
                      {lot.lotNumber} · {formatNumber(lot.quantity)} disp.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-reason">Motivo</Label>
            <Textarea
              id="adjust-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Merma por daño en almacén, conteo físico, devolución…"
              data-ocid="part_detail.reason_input"
              required
            />
          </div>

          {error ? (
            <p
              data-ocid="part_detail.adjust_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="part_detail.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              data-ocid="part_detail.submit_button"
            >
              {mutation.isPending ? "Registrando…" : "Registrar ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LotsTable({ lots }: { lots: Lot[] }) {
  if (lots.length === 0) {
    return (
      <div
        data-ocid="part_detail.lots_empty_state"
        className="flex flex-col items-center gap-2 px-6 py-10 text-center"
      >
        <Layers className="size-5 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Este repuesto no tiene lotes registrados.
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Los lotes se crean automáticamente al registrar compras a proveedores.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Lote / serie
          </TableHead>
          <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Cantidad
          </TableHead>
          <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Costo unitario
          </TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Proveedor
          </TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Fecha
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot, index) => (
          <TableRow
            key={lot.id.toString()}
            data-ocid={`part_detail.lot.${index + 1}`}
          >
            <TableCell className="data-rail text-sm font-medium">
              {lot.lotNumber}
            </TableCell>
            <TableCell className="data-rail text-right">
              {formatNumber(lot.quantity)}
            </TableCell>
            <TableCell className="data-rail text-right text-muted-foreground">
              {formatMoney(lot.unitCost)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {lot.supplierId === undefined
                ? "—"
                : `Proveedor #${lot.supplierId.toString()}`}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(lot.receivedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MovementsTable({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <div
        data-ocid="part_detail.movements_empty_state"
        className="flex flex-col items-center gap-2 px-6 py-10 text-center"
      >
        <ArrowRightLeft
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          Sin movimientos registrados todavía.
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Aquí aparecerán las ventas, compras y ajustes que afecten la
          existencia.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Tipo
          </TableHead>
          <TableHead className="text-right font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Cantidad
          </TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Motivo
          </TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Usuario
          </TableHead>
          <TableHead className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Fecha
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement, index) => {
          const isOut = movement.kind === MovementKind.sale;
          return (
            <TableRow
              key={movement.id.toString()}
              data-ocid={`part_detail.movement.${index + 1}`}
            >
              <TableCell>
                <MovementBadge kind={movement.kind} />
              </TableCell>
              <TableCell
                className={cn(
                  "data-rail text-right font-medium",
                  isOut ? "text-destructive" : "text-success",
                )}
              >
                {isOut ? "−" : "+"}
                {formatNumber(movement.quantity)}
              </TableCell>
              <TableCell className="max-w-[280px] text-muted-foreground">
                <span className="block truncate">{movement.reason || "—"}</span>
              </TableCell>
              <TableCell className="data-rail text-xs text-muted-foreground">
                {formatPrincipal(movement.performedBy.toString())}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(movement.at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

interface PartEditFormState {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  salePrice: string;
  costPrice: string;
  lowStockThreshold: string;
}

/** Backend money is integer cents; the form edits decimal amounts. */
function toCents(value: string): bigint {
  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(Math.round(parsed * 100));
}

function fromCents(value: bigint | undefined): string {
  if (value === undefined) return "";
  return (Number(value) / 100).toFixed(2);
}

function toWhole(value: string): bigint {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}

function formFromPart(part: PartView): PartEditFormState {
  return {
    sku: part.sku,
    barcode: part.barcode,
    name: part.name,
    category: part.category,
    brand: part.brand,
    unit: part.unit,
    salePrice: fromCents(part.salePrice),
    costPrice: fromCents(part.costPrice),
    lowStockThreshold: part.lowStockThreshold.toString(),
  };
}

/**
 * Edits the catalog data of a part, including its barcode. The barcode is
 * saved through the same `updatePart` call as the SKU, so both stay searchable.
 */
function EditPartDialog({
  open,
  onOpenChange,
  part,
  isAdmin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: PartView;
  isAdmin: boolean;
}) {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PartEditFormState>(() => formFromPart(part));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(formFromPart(part));
  }, [open, part]);

  const mutation = useMutation({
    mutationFn: async (input: PartInput) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updatePart(token, part.id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["part"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      toast.success("Repuesto actualizado");
      onOpenChange(false);
    },
    onError: () => {
      setError("No se pudo guardar el repuesto. Intenta de nuevo.");
    },
  });

  const update = (field: keyof PartEditFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("El SKU y el nombre son obligatorios.");
      return;
    }
    setError(null);
    mutation.mutate({
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      unit: form.unit.trim() || "pza",
      salePrice: toCents(form.salePrice),
      costPrice: toCents(form.costPrice),
      lowStockThreshold: toWhole(form.lowStockThreshold),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="part_detail.edit_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Editar repuesto</DialogTitle>
          <DialogDescription>
            Actualiza los datos del catálogo, incluido el código de barras. Los
            cambios aplican de inmediato.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-sku">SKU / Código</Label>
              <Input
                id="edit-part-sku"
                value={form.sku}
                onChange={(event) => update("sku", event.target.value)}
                placeholder="REP-0001"
                className="data-rail"
                data-ocid="part_detail.sku_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-barcode">Código de barras</Label>
              <Input
                id="edit-part-barcode"
                value={form.barcode}
                onChange={(event) => update("barcode", event.target.value)}
                placeholder="7701234567890"
                className="data-rail"
                data-ocid="part_detail.barcode_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-name">Nombre</Label>
              <Input
                id="edit-part-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Balata de freno delantera"
                data-ocid="part_detail.name_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-category">Categoría</Label>
              <Input
                id="edit-part-category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                placeholder="Frenos"
                data-ocid="part_detail.category_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-brand">Marca</Label>
              <Input
                id="edit-part-brand"
                value={form.brand}
                onChange={(event) => update("brand", event.target.value)}
                placeholder="Brembo"
                data-ocid="part_detail.brand_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-unit">Unidad</Label>
              <Input
                id="edit-part-unit"
                value={form.unit}
                onChange={(event) => update("unit", event.target.value)}
                placeholder="pza"
                data-ocid="part_detail.unit_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-threshold">Umbral de stock bajo</Label>
              <Input
                id="edit-part-threshold"
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={(event) =>
                  update("lowStockThreshold", event.target.value)
                }
                className="data-rail"
                data-ocid="part_detail.threshold_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-sale">Precio de venta (COP)</Label>
              <Input
                id="edit-part-sale"
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(event) => update("salePrice", event.target.value)}
                placeholder="0.00"
                className="data-rail"
                data-ocid="part_detail.sale_price_input"
              />
            </div>
            {isAdmin ? (
              <div className="space-y-1.5">
                <Label htmlFor="edit-part-cost">Precio de costo (COP)</Label>
                <Input
                  id="edit-part-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) => update("costPrice", event.target.value)}
                  placeholder="0.00"
                  className="data-rail"
                  data-ocid="part_detail.cost_price_input"
                />
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              data-ocid="part_detail.edit_error"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="part_detail.edit_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              data-ocid="part_detail.edit_submit_button"
            >
              {mutation.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PartDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const { isAdmin } = useRole();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [movementPage, setMovementPage] = useState(1);

  const partId = BigInt(id);

  const partQuery = useQuery({
    queryKey: ["part", id, token],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.getPart(token, partId);
    },
    enabled: !!actor && !isFetching,
  });

  const lotsQuery = useQuery({
    queryKey: ["lots", id, token],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listLots(token, partId);
    },
    enabled: !!actor && !isFetching,
  });

  const movementsQuery = useQuery({
    queryKey: ["movements", id, token],
    queryFn: async () => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.listMovements(token, partId);
    },
    enabled: !!actor && !isFetching,
  });

  const part = partQuery.data ?? null;
  const lots = lotsQuery.data ?? [];
  const movements = movementsQuery.data ?? [];

  const MOVEMENTS_PER_PAGE = 10;
  const movementPages = Math.max(
    1,
    Math.ceil(movements.length / MOVEMENTS_PER_PAGE),
  );
  const safeMovementPage = Math.min(movementPage, movementPages);
  const visibleMovements = movements.slice(
    (safeMovementPage - 1) * MOVEMENTS_PER_PAGE,
    safeMovementPage * MOVEMENTS_PER_PAGE,
  );

  if (partQuery.isLoading) {
    return (
      <div
        data-ocid="part_detail.loading_state"
        className="mx-auto w-full max-w-6xl space-y-4"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (partQuery.isError || !part) {
    // A failed read is retryable; a missing record is not. Both keep the way
    // back to the catalog, and the failed read also offers a real retry that
    // re-reads the part, its lots and its movements.
    const retry = () => {
      void partQuery.refetch({ cancelRefetch: true });
      void lotsQuery.refetch({ cancelRefetch: true });
      void movementsQuery.refetch({ cancelRefetch: true });
    };

    return (
      <div
        data-ocid="part_detail.error_state"
        className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center"
      >
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        <p className="font-display text-sm font-semibold">
          {partQuery.isError
            ? "No se pudo cargar el repuesto"
            : "Repuesto no encontrado"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {partQuery.isError
            ? "Ocurrió un error al consultar el repuesto. Intenta de nuevo."
            : "El repuesto solicitado no existe o fue eliminado del catálogo."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {partQuery.isError ? (
            <Button
              type="button"
              variant="outline"
              onClick={retry}
              data-ocid="part_detail.retry_button"
            >
              Reintentar
            </Button>
          ) : null}
          <Button type="button" variant="outline" asChild>
            <Link to="/inventario" data-ocid="part_detail.back_button">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver al inventario
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="part_detail.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link
            to="/inventario"
            data-ocid="part_detail.back_link"
            className="gap-1"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Inventario
          </Link>
        </Button>
      </div>

      <header className="rounded-lg border border-border bg-card p-5 shadow-subtle">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="data-rail rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                {part.sku}
              </span>
              {part.barcode ? (
                <span
                  data-ocid="part_detail.barcode_badge"
                  className="data-rail inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  <Barcode className="size-3" aria-hidden="true" />
                  {part.barcode}
                </span>
              ) : null}
              {part.lowStock ? (
                <Badge
                  variant="outline"
                  data-ocid="part_detail.low_stock_badge"
                  className="gap-1 border-warning/50 bg-warning/15 font-mono text-[10px] uppercase tracking-wider text-warning"
                >
                  <AlertTriangle className="size-3" aria-hidden="true" />
                  Stock bajo
                </Badge>
              ) : null}
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {part.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {[part.category, part.brand].filter(Boolean).join(" · ") ||
                "Sin categoría"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(true)}
              data-ocid="part_detail.edit_button"
              className="gap-2"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Editar repuesto
            </Button>
            <Button
              type="button"
              onClick={() => setAdjustOpen(true)}
              data-ocid="part_detail.adjust_button"
              className="gap-2"
            >
              <ArrowRightLeft className="size-4" aria-hidden="true" />
              Ajustar existencia
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Existencia total"
            value={`${formatNumber(part.totalStock)} ${part.unit}`}
            hint={`Umbral de alerta: ${formatNumber(part.lowStockThreshold)}`}
            tone={part.lowStock ? "warning" : "primary"}
          />
          <StatTile
            label="Precio de venta"
            value={formatMoney(part.salePrice)}
          />
          {isAdmin ? (
            <StatTile
              label="Precio de costo"
              value={formatMoney(part.costPrice)}
            />
          ) : null}
          <StatTile
            label="Lotes registrados"
            value={formatNumber(lots.length)}
            hint={`Alta: ${formatDate(part.createdAt)}`}
          />
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold">
            Lotes y números de serie
          </h2>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {formatNumber(lots.length)}
          </span>
        </div>
        {lotsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }, (_, index) => `lot-${index}`).map(
              (key) => (
                <Skeleton key={key} className="h-9 w-full" />
              ),
            )}
          </div>
        ) : (
          <LotsTable lots={lots} />
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-display text-sm font-semibold">
            Historial de movimientos
          </h2>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {formatNumber(movements.length)}
          </span>
        </div>
        {movementsQuery.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }, (_, index) => `mv-${index}`).map(
              (key) => (
                <Skeleton key={key} className="h-9 w-full" />
              ),
            )}
          </div>
        ) : (
          <>
            <MovementsTable movements={visibleMovements} />
            {movements.length > MOVEMENTS_PER_PAGE ? (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Página {safeMovementPage} de {movementPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeMovementPage <= 1}
                    onClick={() => setMovementPage(safeMovementPage - 1)}
                    data-ocid="part_detail.movements_prev"
                    className="gap-1"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeMovementPage >= movementPages}
                    onClick={() => setMovementPage(safeMovementPage + 1)}
                    data-ocid="part_detail.movements_next"
                    className="gap-1"
                  >
                    Siguiente
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <AdjustmentDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        part={part}
        lots={lots}
      />

      <EditPartDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        part={part}
        isAdmin={isAdmin}
      />
    </div>
  );
}
