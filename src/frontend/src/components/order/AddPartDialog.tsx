import { BarcodeScanner } from "@/components/BarcodeScanner";
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
  errorMessage,
  useAddOrderPart,
  useLots,
  useParts,
} from "@/hooks/use-orders";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Id, PartView } from "@/lib/types";
import { AlertTriangle, PackagePlus, ScanLine, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AddPartDialogProps {
  orderId: Id;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPartDialog({
  orderId,
  open,
  onOpenChange,
}: AddPartDialogProps) {
  const [partId, setPartId] = useState<Id | null>(null);
  const [lotId, setLotId] = useState<Id | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const partsQuery = useParts(debouncedSearch);
  const lotsQuery = useLots(partId);
  const addPart = useAddOrderPart();

  const parts = partsQuery.data?.items ?? [];
  const lots = (lotsQuery.data ?? []).filter((lot) => lot.quantity > 0n);
  const selectedPart = parts.find((part) => part.id === partId) ?? null;
  const selectedLot = lots.find((lot) => lot.id === lotId) ?? null;
  const term = debouncedSearch.trim();

  const quantityValue = Number(quantity);
  const quantityValid =
    quantity.trim() !== "" &&
    Number.isInteger(quantityValue) &&
    quantityValue > 0;

  const availableStock = selectedLot
    ? selectedLot.quantity
    : (selectedPart?.totalStock ?? 0n);
  const stockSufficient =
    quantityValid && availableStock >= BigInt(quantityValue);

  function reset() {
    setPartId(null);
    setLotId(null);
    setQuantity("1");
    setFormError(null);
    setSearch("");
    setDebouncedSearch("");
    setIsScanOpen(false);
    setScanError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  /**
   * Adds a scanned part to the line. The scanner already resolved the code
   * through `findPartByCode`, so the part is selected directly and the user
   * confirms lot and quantity before saving.
   */
  function handleScanned(part: PartView) {
    setPartId(part.id);
    setLotId(null);
    setFormError(null);
    setScanError(null);
    setIsScanOpen(false);
  }

  function handleScanNotFound(code: string) {
    setScanError(`Producto no encontrado para el código ${code}.`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (partId === null) {
      setFormError("Selecciona el repuesto a consumir.");
      return;
    }
    if (!quantityValid) {
      setFormError("Captura una cantidad válida (entero mayor a cero).");
      return;
    }
    if (!stockSufficient) {
      setFormError(
        `Stock insuficiente: disponible ${formatNumber(availableStock)}, solicitado ${formatNumber(quantityValue)}.`,
      );
      return;
    }

    addPart.mutate(
      {
        id: orderId,
        part: {
          partId,
          lotId: lotId ?? undefined,
          quantity: BigInt(quantityValue),
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (error) => setFormError(errorMessage(error)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-ocid="order_detail.add_part.modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <PackagePlus className="size-4 text-primary" aria-hidden="true" />
            Agregar repuesto
          </DialogTitle>
          <DialogDescription>
            La línea guarda el costo unitario de referencia para calcular el
            margen de la orden; no descuenta stock del inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="add-part-search">Repuesto</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setScanError(null);
                  setIsScanOpen((current) => !current);
                }}
                aria-expanded={isScanOpen}
                data-ocid="order_detail.add_part.scan_button"
                className="gap-1.5"
              >
                <ScanLine className="size-4" aria-hidden="true" />
                {isScanOpen ? "Cerrar escáner" : "Escanear"}
              </Button>
            </div>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="add-part-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setFormError(null);
                }}
                placeholder="Busca por SKU o nombre…"
                autoComplete="off"
                data-ocid="order_detail.add_part.search_input"
                className="pl-9"
              />
            </div>

            {isScanOpen ? (
              <BarcodeScanner
                ocid="order_detail.add_part.scanner"
                title="Escanear repuesto"
                hint="Apunta la cámara al código del repuesto o ingrésalo manualmente."
                onDetected={(part) => handleScanned(part)}
                onNotFound={handleScanNotFound}
              />
            ) : null}
            {scanError ? (
              <p
                data-ocid="order_detail.add_part.scan_not_found_state"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
              >
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                {scanError}
              </p>
            ) : null}

            {term.length === 0 ? (
              <p
                data-ocid="order_detail.add_part.prompt_state"
                className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground"
              >
                Escribe el SKU o el nombre del repuesto para ver coincidencias.
              </p>
            ) : partsQuery.isLoading ? (
              <div
                data-ocid="order_detail.add_part.loading_state"
                className="space-y-1.5"
              >
                {Array.from(
                  { length: 3 },
                  (_, index) => `add-part-skeleton-${index}`,
                ).map((key) => (
                  <Skeleton key={key} className="h-12 w-full" />
                ))}
              </div>
            ) : partsQuery.isError ? (
              <p
                data-ocid="order_detail.add_part.error_state"
                className="text-xs text-destructive"
              >
                No se pudo cargar el catálogo de repuestos. Inténtalo de nuevo.
              </p>
            ) : parts.length === 0 ? (
              <p
                data-ocid="order_detail.add_part.empty_state"
                className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
              >
                {`Sin repuestos que coincidan con “${term}”.`}
              </p>
            ) : (
              <ul
                data-ocid="order_detail.add_part.list"
                className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1"
              >
                {parts.map((part, index) => {
                  const isSelected = part.id === partId;
                  return (
                    <li key={part.id.toString()}>
                      <button
                        type="button"
                        onClick={() => {
                          setPartId(part.id);
                          setLotId(null);
                          setFormError(null);
                        }}
                        aria-pressed={isSelected}
                        data-ocid={`order_detail.add_part.item.${index + 1}`}
                        className={
                          isSelected
                            ? "flex w-full items-center justify-between gap-3 rounded-sm border border-primary/40 bg-primary/5 px-2.5 py-2 text-left transition-colors focus-visible:outline-none"
                            : "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                        }
                      >
                        <span className="min-w-0">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                              {part.sku}
                            </span>
                            <span className="truncate text-sm font-medium">
                              {part.name}
                            </span>
                          </span>
                          <span className="data-rail mt-0.5 block truncate text-xs text-muted-foreground">
                            {formatNumber(part.totalStock)} {part.unit} ·{" "}
                            {formatMoney(part.salePrice)}
                          </span>
                        </span>
                        {isSelected ? (
                          <X
                            className="size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {selectedPart ? (
              <p className="data-rail text-xs text-muted-foreground">
                Precio unitario {formatMoney(selectedPart.salePrice)} ·
                Existencia {formatNumber(selectedPart.totalStock)}{" "}
                {selectedPart.unit}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-part-lot">Lote / serie (opcional)</Label>
            {partId === null ? (
              <p className="flex h-9 items-center rounded-md border border-dashed border-border px-3 text-xs text-muted-foreground">
                Selecciona un repuesto para ver sus lotes
              </p>
            ) : lotsQuery.isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : lots.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin lotes registrados para este repuesto.
              </p>
            ) : (
              <Select
                value={lotId?.toString() ?? "auto"}
                onValueChange={(value) => {
                  setLotId(value === "auto" ? null : BigInt(value));
                  setFormError(null);
                }}
              >
                <SelectTrigger
                  id="add-part-lot"
                  data-ocid="order_detail.add_part.lot_select"
                  className="w-full"
                >
                  <SelectValue placeholder="Descuento automático" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Sin lote específico</SelectItem>
                  {lots.map((lot) => (
                    <SelectItem
                      key={lot.id.toString()}
                      value={lot.id.toString()}
                    >
                      {`${lot.lotNumber} · ${formatNumber(lot.quantity)} disp.`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-part-quantity">Cantidad</Label>
            <Input
              id="add-part-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setFormError(null);
              }}
              data-ocid="order_detail.add_part.quantity_input"
              className="data-rail"
            />
            {quantityValid ? (
              <p
                className={
                  stockSufficient
                    ? "data-rail text-xs text-muted-foreground"
                    : "data-rail text-xs text-warning"
                }
              >
                Referencia: {formatNumber(quantityValue)} · existencia{" "}
                {formatNumber(availableStock)}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div
              data-ocid="order_detail.add_part.error_state"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-xs text-destructive">{formError}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-ocid="order_detail.add_part.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addPart.isPending || partId === null}
              data-ocid="order_detail.add_part.submit_button"
            >
              {addPart.isPending ? "Agregando…" : "Agregar repuesto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
