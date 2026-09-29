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
  useFindPartByCode,
  useLots,
} from "@/hooks/use-orders";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Id, PartView } from "@/lib/types";
import { AlertTriangle, ScanLine } from "lucide-react";
import { useState } from "react";

interface ScanPartDialogProps {
  orderId: Id;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Scan-to-add flow for workshop-order repuestos. Opens the shared
 * `BarcodeScanner`, resolves the read code through the backend
 * `findPartByCode` (barcode or SKU) and, when it matches, selects the part so
 * the user confirms lot and quantity before saving. An unknown code shows the
 * "producto no encontrado" notice and adds nothing.
 */
export function ScanPartDialog({
  orderId,
  open,
  onOpenChange,
}: ScanPartDialogProps) {
  const [part, setPart] = useState<PartView | null>(null);
  const [lotId, setLotId] = useState<Id | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [manualCode, setManualCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);

  const findPartByCode = useFindPartByCode();
  const lotsQuery = useLots(part?.id ?? null);
  const addPart = useAddOrderPart();

  const lots = (lotsQuery.data ?? []).filter((lot) => lot.quantity > 0n);
  const selectedLot = lots.find((lot) => lot.id === lotId) ?? null;

  const quantityValue = Number(quantity);
  const quantityValid =
    quantity.trim() !== "" &&
    Number.isInteger(quantityValue) &&
    quantityValue > 0;

  const availableStock = selectedLot
    ? selectedLot.quantity
    : (part?.totalStock ?? 0n);
  const stockSufficient =
    quantityValid && availableStock >= BigInt(quantityValue);

  function reset() {
    setPart(null);
    setLotId(null);
    setQuantity("1");
    setManualCode("");
    setFormError(null);
    setNotFoundCode(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleDetected(scanned: PartView) {
    setNotFoundCode(null);
    setFormError(null);
    setLotId(null);
    setQuantity("1");
    setPart(scanned);
  }

  async function handleManualCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = manualCode.trim();
    if (code === "") return;
    setManualCode("");
    setFormError(null);
    try {
      const found = await findPartByCode.mutateAsync(code);
      if (!found) {
        setPart(null);
        setNotFoundCode(code);
        return;
      }
      await handleDetected(found);
    } catch {
      setFormError("No se pudo consultar el código. Inténtalo de nuevo.");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!part) {
      setFormError("Escanea o ingresa el código del repuesto.");
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
          partId: part.id,
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
      <DialogContent
        data-ocid="order_detail.scan_part.modal"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ScanLine className="size-4 text-primary" aria-hidden="true" />
            Escanear repuesto
          </DialogTitle>
          <DialogDescription>
            Lee el código de barras del repuesto o ingrésalo manualmente para
            agregarlo a la orden.
          </DialogDescription>
        </DialogHeader>

        <BarcodeScanner
          ocid="order_detail.scan_part.scanner"
          title="Lector de códigos"
          hint="Apunta la cámara al código del repuesto o ingrésalo manualmente."
          onDetected={(scanned) => void handleDetected(scanned)}
          onNotFound={(code) => {
            setPart(null);
            setNotFoundCode(code);
          }}
        />

        {notFoundCode ? (
          <p
            data-ocid="order_detail.scan_part.not_found_state"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            Producto no encontrado para el código{" "}
            <span className="data-rail">{notFoundCode}</span>.
          </p>
        ) : null}

        {part ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="data-rail shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  {part.sku}
                </span>
                <p className="truncate text-sm font-medium">{part.name}</p>
              </div>
              <p className="data-rail text-xs text-muted-foreground">
                Precio unitario {formatMoney(part.salePrice)} · Existencia{" "}
                {formatNumber(part.totalStock)} {part.unit}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scan-part-lot">Lote / serie (opcional)</Label>
              {lotsQuery.isLoading ? (
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
                    id="scan-part-lot"
                    data-ocid="order_detail.scan_part.lot_select"
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
              <Label htmlFor="scan-part-quantity">Cantidad</Label>
              <Input
                id="scan-part-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setFormError(null);
                }}
                data-ocid="order_detail.scan_part.quantity_input"
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
                data-ocid="order_detail.scan_part.error_state"
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
                data-ocid="order_detail.scan_part.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addPart.isPending}
                data-ocid="order_detail.scan_part.submit_button"
              >
                {addPart.isPending ? "Agregando…" : "Agregar repuesto"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="scan-part-manual">Código manual</Label>
            <form
              onSubmit={(event) => void handleManualCode(event)}
              className="flex items-center gap-2"
            >
              <Input
                id="scan-part-manual"
                data-ocid="order_detail.scan_part.manual_input"
                value={manualCode}
                onChange={(event) => {
                  setManualCode(event.target.value);
                  setFormError(null);
                }}
                placeholder="Escribe o pega el código"
                autoComplete="off"
                className="data-rail"
              />
              <Button
                type="submit"
                size="sm"
                disabled={manualCode.trim() === ""}
                data-ocid="order_detail.scan_part.manual_submit_button"
              >
                Buscar
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
