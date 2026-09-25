import { ContactDocumentPreview } from "@/components/ContactDocumentPreview";
import { SupplierOrderDialog } from "@/components/SupplierOrderDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useBackend } from "@/hooks/use-backend";
import { useSupplierOrders } from "@/hooks/use-supplier-orders";
import { supplierContactDocument } from "@/hooks/use-whatsapp";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type {
  PartView,
  Payable,
  Payment,
  PaymentInput,
  Purchase,
  PurchaseInput,
  PurchaseItemInput,
  Supplier,
} from "@/lib/types";
import { PartSort, PayableStatus, PaymentMethod } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ClipboardList,
  CreditCard,
  Mail,
  MapPin,
  PackagePlus,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PART_SEARCH_LIMIT = 20n;

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.cash]: "Efectivo",
  [PaymentMethod.card]: "Tarjeta",
  [PaymentMethod.transfer]: "Transferencia",
  [PaymentMethod.mixed]: "Mixto",
};

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  PaymentMethod.cash,
  PaymentMethod.card,
  PaymentMethod.transfer,
  PaymentMethod.mixed,
];

function useSupplier(id: bigint) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["supplier", id.toString()],
    queryFn: async (): Promise<Supplier | null> => {
      if (!actor) return null;
      return actor.getSupplier(id);
    },
    enabled: !!actor && !isFetching,
  });
}

function usePayable(id: bigint) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["payable", id.toString()],
    queryFn: async (): Promise<Payable | null> => {
      if (!actor) return null;
      return actor.getPayable(id);
    },
    enabled: !!actor && !isFetching,
  });
}

function usePurchases(id: bigint) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["purchases", id.toString()],
    queryFn: async (): Promise<Purchase[]> => {
      if (!actor) return [];
      return actor.listPurchases(id);
    },
    enabled: !!actor && !isFetching,
  });
}

function usePayments(id: bigint) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["payments", id.toString()],
    queryFn: async (): Promise<Payment[]> => {
      if (!actor) return [];
      return actor.listPayments(id);
    },
    enabled: !!actor && !isFetching,
  });
}

function useCreatePurchase() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PurchaseInput): Promise<Purchase> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPurchase(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["purchases"] });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
      void queryClient.invalidateQueries({ queryKey: ["supplier"] });
    },
  });
}

/** Debounces a free-text term so the backend search fires after typing stops. */
function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

/** Searches the parts catalog by name/SKU so purchase lines pick a real repuesto. */
function usePartSearch(term: string) {
  const { actor, isFetching } = useBackend();
  const trimmed = term.trim();
  return useQuery({
    queryKey: ["parts", "purchase-search", trimmed],
    queryFn: async (): Promise<PartView[]> => {
      if (!actor) return [];
      const page = await actor.listParts(
        { search: trimmed === "" ? undefined : trimmed },
        PartSort.name,
        0n,
        PART_SEARCH_LIMIT,
      );
      return page.items;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

function useRegisterPayment() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentInput): Promise<Payment> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.registerPayment(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["payables"] });
      void queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

function parseAmountToCents(value: string): bigint | null {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return BigInt(Math.round(amount * 100));
}

function parseQuantity(value: string): bigint | null {
  const normalized = value.trim();
  if (normalized === "") return null;
  const quantity = Number(normalized);
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  return BigInt(quantity);
}

function parseId(value: string): bigint | null {
  const normalized = value.trim();
  if (normalized === "") return null;
  try {
    const id = BigInt(normalized);
    return id >= 0n ? id : null;
  } catch {
    return null;
  }
}

interface PurchaseItemDraft {
  key: string;
  part: PartView | null;
  lotNumber: string;
  quantity: string;
  unitCost: string;
}

function newItemDraft(key: string): PurchaseItemDraft {
  return { key, part: null, lotNumber: "", quantity: "1", unitCost: "" };
}

function centsToInput(value: bigint | undefined): string {
  if (value === undefined) return "";
  return (Number(value) / 100).toFixed(2);
}

/** Searchable catalog picker: filters repuestos by ID/SKU and selects one. */
function PartPicker({
  index,
  selected,
  onSelect,
}: {
  index: number;
  selected: PartView | null;
  onSelect: (part: PartView | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedTerm = useDebouncedValue(term, 250);
  const partsQuery = usePartSearch(debouncedTerm);
  const results = partsQuery.data ?? [];

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{selected.name}</p>
          <p className="data-rail truncate text-xs text-muted-foreground">
            {selected.sku} · {selected.brand || "Sin marca"} · Existencia{" "}
            {selected.totalStock.toString()} {selected.unit}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setTerm("");
            setOpen(false);
            onSelect(null);
          }}
          data-ocid={`supplier_detail.part_clear_button.${index}`}
          className="shrink-0 gap-1.5 text-muted-foreground"
        >
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar repuesto por ID o SKU…"
          aria-label={`Buscar repuesto para la partida ${index}`}
          data-ocid={`supplier_detail.part_search_input.${index}`}
          className="pl-9"
        />
      </div>

      {open ? (
        <div
          data-ocid={`supplier_detail.part_results.${index}`}
          className="max-h-52 overflow-y-auto rounded-md border border-border bg-card"
        >
          {partsQuery.isLoading ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Buscando repuestos…
            </p>
          ) : partsQuery.isError ? (
            <p className="px-3 py-3 text-xs text-destructive">
              No se pudo cargar el catálogo de repuestos. Inténtalo de nuevo.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              {debouncedTerm.trim() === ""
                ? "Escribe para buscar en el catálogo de repuestos."
                : "Sin resultados. Ningún repuesto coincide con la búsqueda."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((part, resultIndex) => (
                <li key={part.id.toString()}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(part);
                      setOpen(false);
                    }}
                    data-ocid={`supplier_detail.part_option.${index}.${resultIndex + 1}`}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {part.name}
                      </span>
                      <span className="data-rail block truncate text-xs text-muted-foreground">
                        {part.sku} · {part.brand || "Sin marca"} · Existencia{" "}
                        {part.totalStock.toString()} {part.unit}
                      </span>
                    </span>
                    <span className="data-rail shrink-0 text-xs text-muted-foreground">
                      {formatMoney(part.costPrice)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: bigint;
}

function PurchaseDialog({
  open,
  onOpenChange,
  supplierId,
}: PurchaseDialogProps) {
  const [items, setItems] = useState<PurchaseItemDraft[]>([
    newItemDraft("item-1"),
  ]);
  const [error, setError] = useState<string | null>(null);
  const createPurchase = useCreatePurchase();

  function handleOpenChange(next: boolean) {
    if (next) {
      setItems([newItemDraft("item-1")]);
      setError(null);
    }
    onOpenChange(next);
  }

  function updateItem(key: string, patch: Partial<PurchaseItemDraft>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function selectPart(key: string, part: PartView | null) {
    updateItem(key, {
      part,
      unitCost: part === null ? "" : centsToInput(part.costPrice),
    });
  }

  function addItem() {
    setItems((current) => [
      ...current,
      newItemDraft(`item-${current.length + 1}-${Date.now()}`),
    ]);
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed: PurchaseItemInput[] = [];
    for (const item of items) {
      const quantity = parseQuantity(item.quantity);
      const unitCost = parseAmountToCents(item.unitCost);
      const lotNumber = item.lotNumber.trim();
      if (!item.part) {
        setError("Selecciona un repuesto del catálogo en cada partida.");
        return;
      }
      if (lotNumber === "") {
        setError("Cada partida necesita un número de lote o serie.");
        return;
      }
      if (quantity === null) {
        setError("Las cantidades deben ser números enteros mayores a cero.");
        return;
      }
      if (unitCost === null) {
        setError("Los costos unitarios deben ser mayores a cero.");
        return;
      }
      parsed.push({ partId: item.part.id, lotNumber, quantity, unitCost });
    }
    if (parsed.length === 0) {
      setError("Agrega al menos una partida a la compra.");
      return;
    }
    setError(null);
    createPurchase.mutate(
      { supplierId, items: parsed },
      {
        onSuccess: () => {
          toast.success("Compra registrada y stock actualizado");
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setError(
            mutationError.message ||
              "No se pudo registrar la compra. Revisa los datos e inténtalo de nuevo.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="supplier_detail.purchase_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Registrar compra de reposición
          </DialogTitle>
          <DialogDescription>
            Al registrar la compra, el stock de cada repuesto aumenta
            automáticamente y se crea el lote o número de serie indicado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.key}
                data-ocid={`supplier_detail.purchase_item.${index + 1}`}
                className="rounded-md border border-border bg-muted/20 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Partida {index + 1}
                  </p>
                  {items.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Quitar partida ${index + 1}`}
                      data-ocid={`supplier_detail.remove_item_button.${index + 1}`}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Quitar
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`part-search-${item.key}`}>
                      Repuesto (ID o SKU)
                    </Label>
                    <PartPicker
                      index={index + 1}
                      selected={item.part}
                      onSelect={(part) => selectPart(item.key, part)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`lot-${item.key}`}>Lote / serie</Label>
                    <Input
                      id={`lot-${item.key}`}
                      value={item.lotNumber}
                      onChange={(event) =>
                        updateItem(item.key, { lotNumber: event.target.value })
                      }
                      placeholder="L-2026-041"
                      data-ocid={`supplier_detail.lot_input.${index + 1}`}
                      className="data-rail"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`qty-${item.key}`}>Cantidad</Label>
                    <Input
                      id={`qty-${item.key}`}
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.key, { quantity: event.target.value })
                      }
                      inputMode="numeric"
                      placeholder="10"
                      data-ocid={`supplier_detail.quantity_input.${index + 1}`}
                      className="data-rail"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`cost-${item.key}`}>
                      Costo unitario (COP)
                    </Label>
                    <Input
                      id={`cost-${item.key}`}
                      value={item.unitCost}
                      onChange={(event) =>
                        updateItem(item.key, { unitCost: event.target.value })
                      }
                      inputMode="decimal"
                      placeholder="450.00"
                      data-ocid={`supplier_detail.unit_cost_input.${index + 1}`}
                      className="data-rail"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            data-ocid="supplier_detail.add_item_button"
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Agregar partida
          </Button>

          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
            <PackagePlus
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-xs text-muted-foreground">
              Esta compra incrementa las existencias y genera un lote por cada
              partida. El saldo por pagar del proveedor se actualiza al
              instante.
            </p>
          </div>

          {error ? (
            <p
              data-ocid="supplier_detail.purchase_error"
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
              data-ocid="supplier_detail.purchase_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPurchase.isPending}
              data-ocid="supplier_detail.purchase_submit_button"
            >
              {createPurchase.isPending ? "Registrando…" : "Registrar compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: bigint;
  purchases: Purchase[];
  suggestedAmount: bigint;
}

function PaymentDialog({
  open,
  onOpenChange,
  supplierId,
  purchases,
  suggestedAmount,
}: PaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.cash);
  const [purchaseId, setPurchaseId] = useState("none");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const registerPayment = useRegisterPayment();

  function handleOpenChange(next: boolean) {
    if (next) {
      setAmount(
        suggestedAmount > 0n ? (Number(suggestedAmount) / 100).toFixed(2) : "",
      );
      setMethod(PaymentMethod.cash);
      setPurchaseId("none");
      setNote("");
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = parseAmountToCents(amount);
    if (cents === null) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    const linkedPurchase = purchaseId === "none" ? null : parseId(purchaseId);
    if (purchaseId !== "none" && linkedPurchase === null) {
      setError("La compra seleccionada no es válida.");
      return;
    }
    const trimmedNote = note.trim();
    setError(null);
    registerPayment.mutate(
      {
        supplierId,
        amount: cents,
        method,
        purchaseId: linkedPurchase ?? undefined,
        note: trimmedNote === "" ? undefined : trimmedNote,
      },
      {
        onSuccess: () => {
          toast.success("Pago registrado");
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setError(
            mutationError.message ||
              "No se pudo registrar el pago. Revisa el monto e inténtalo de nuevo.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="supplier_detail.payment_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Registrar pago</DialogTitle>
          <DialogDescription>
            Aplica un pago total o parcial al saldo pendiente del proveedor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Monto (COP)</Label>
            <Input
              id="payment-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="1500.00"
              data-ocid="supplier_detail.payment_amount_input"
              className="data-rail"
              required
            />
            <p className="text-xs text-muted-foreground">
              Saldo pendiente actual: {formatMoney(suggestedAmount)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-method">Método de pago</Label>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            >
              <SelectTrigger
                id="payment-method"
                data-ocid="supplier_detail.payment_method_select"
                className="w-full"
              >
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {PAYMENT_METHOD_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-purchase">Compra (opcional)</Label>
            <Select value={purchaseId} onValueChange={setPurchaseId}>
              <SelectTrigger
                id="payment-purchase"
                data-ocid="supplier_detail.payment_purchase_select"
                className="w-full"
              >
                <SelectValue placeholder="Sin compra específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin compra específica</SelectItem>
                {purchases.map((purchase) => (
                  <SelectItem
                    key={purchase.id.toString()}
                    value={purchase.id.toString()}
                  >
                    {`Compra #${purchase.id.toString()} · ${formatDate(purchase.createdAt)} · ${formatMoney(purchase.total)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-note">Nota (opcional)</Label>
            <Textarea
              id="payment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Transferencia bancaria, referencia 8842…"
              data-ocid="supplier_detail.payment_note_input"
              rows={3}
            />
          </div>

          {error ? (
            <p
              data-ocid="supplier_detail.payment_error"
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
              data-ocid="supplier_detail.payment_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registerPayment.isPending}
              data-ocid="supplier_detail.payment_submit_button"
            >
              {registerPayment.isPending ? "Registrando…" : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DetailSkeleton() {
  const rows = Array.from({ length: 4 }, (_, index) => `detail-row-${index}`);
  return (
    <div data-ocid="supplier_detail.loading_state" className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      {rows.map((id) => (
        <Skeleton key={id} className="h-11 w-full" />
      ))}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon
        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className={`truncate text-sm ${mono ? "data-rail" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export function SupplierDetailPage() {
  const params = useParams({ from: "/proveedores/$id" });
  const supplierId = BigInt(params.id);

  const supplierQuery = useSupplier(supplierId);
  const payableQuery = usePayable(supplierId);
  const purchasesQuery = usePurchases(supplierId);
  const paymentsQuery = usePayments(supplierId);
  const supplierOrdersQuery = useSupplierOrders({
    supplierId,
    search: "",
  });

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [supplierOrderOpen, setSupplierOrderOpen] = useState(false);

  const supplier = supplierQuery.data ?? null;
  const payable = payableQuery.data ?? null;
  const purchases = purchasesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const supplierOrders = supplierOrdersQuery.data ?? [];

  const isLoading =
    supplierQuery.isLoading ||
    payableQuery.isLoading ||
    purchasesQuery.isLoading ||
    paymentsQuery.isLoading;
  const isError =
    supplierQuery.isError ||
    payableQuery.isError ||
    purchasesQuery.isError ||
    paymentsQuery.isError;

  function refetchAll() {
    void supplierQuery.refetch();
    void payableQuery.refetch();
    void purchasesQuery.refetch();
    void paymentsQuery.refetch();
    void supplierOrdersQuery.refetch();
  }

  const balance = payable?.balance ?? 0n;
  const isPaid = payable?.status === PayableStatus.paid;

  const contactDocument = supplier ? supplierContactDocument(supplier) : null;

  return (
    <div
      data-ocid="supplier_detail.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          data-ocid="supplier_detail.back_button"
          className="gap-1.5"
        >
          <Link to="/proveedores">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Proveedores
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refetchAll}
            data-ocid="supplier_detail.refresh_button"
          >
            Actualizar
          </Button>
          {supplier && contactDocument ? (
            <ContactDocumentPreview
              document={contactDocument}
              ocid="supplier_detail.preview_button"
              label="Ver ficha"
            />
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaymentOpen(true)}
            disabled={isLoading || isPaid}
            data-ocid="supplier_detail.open_payment_button"
            className="gap-1.5"
          >
            <Wallet className="size-4" aria-hidden="true" />
            Registrar pago
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSupplierOrderOpen(true)}
            disabled={isLoading}
            data-ocid="supplier_detail.open_supplier_order_button"
            className="gap-1.5"
          >
            <ClipboardList className="size-4" aria-hidden="true" />
            Pedido a proveedor
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setPurchaseOpen(true)}
            disabled={isLoading}
            data-ocid="supplier_detail.open_purchase_button"
            className="gap-1.5"
          >
            <PackagePlus className="size-4" aria-hidden="true" />
            Registrar compra
          </Button>
        </div>
      </div>

      {isError ? (
        <div
          data-ocid="supplier_detail.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
        >
          <AlertTriangle
            className="size-5 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              No se pudo cargar el proveedor
            </p>
            <p className="text-xs text-muted-foreground">
              Verifica la conexión con el backend e inténtalo de nuevo.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refetchAll}
            data-ocid="supplier_detail.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <DetailSkeleton />
      ) : !supplier ? (
        <div
          data-ocid="supplier_detail.not_found_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
            <Building2
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold">
              Proveedor no encontrado
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              El proveedor solicitado no existe o fue eliminado. Vuelve al
              directorio para elegir otro.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/proveedores">Volver a proveedores</Link>
          </Button>
        </div>
      ) : (
        <>
          <Card
            data-ocid="supplier_detail.header.card"
            className="gap-0 overflow-hidden rounded-lg py-0 shadow-none"
          >
            <CardContent className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                  <Building2
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0 space-y-1">
                  <h1 className="truncate font-display text-xl font-semibold tracking-tight">
                    {supplier.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Proveedor registrado el {formatDate(supplier.createdAt)}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                data-ocid="supplier_detail.status_badge"
                className={
                  isPaid
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-warning/40 bg-warning/10 text-warning"
                }
              >
                {isPaid ? "Pagada" : "Pendiente"}
              </Badge>
            </CardContent>
            <div className="grid gap-4 border-t border-border px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoRow
                icon={Phone}
                label="Teléfono"
                value={supplier.phone}
                mono
              />
              <InfoRow
                icon={Mail}
                label="Correo"
                value={supplier.email ?? "—"}
              />
              <InfoRow
                icon={Receipt}
                label="NIT / ID fiscal"
                value={supplier.taxId ?? "—"}
                mono
              />
              <InfoRow
                icon={MapPin}
                label="Dirección"
                value={supplier.address ?? "—"}
              />
              <InfoRow
                icon={Building2}
                label="Contacto"
                value={supplier.contactName ?? "—"}
              />
            </div>
          </Card>

          <section
            data-ocid="supplier_detail.payable.section"
            aria-label="Resumen de cuenta por pagar"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-0.5 bg-primary"
              />
              <CardContent className="space-y-1 px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Total comprado
                </p>
                <p className="data-rail text-xl font-semibold leading-none">
                  {formatMoney(payable?.totalPurchased ?? 0n)}
                </p>
              </CardContent>
            </Card>
            <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-0.5 bg-success"
              />
              <CardContent className="space-y-1 px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Total pagado
                </p>
                <p className="data-rail text-xl font-semibold leading-none">
                  {formatMoney(payable?.totalPaid ?? 0n)}
                </p>
              </CardContent>
            </Card>
            <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-0.5 bg-destructive"
              />
              <CardContent className="space-y-1 px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Saldo pendiente
                </p>
                <p className="data-rail text-xl font-semibold leading-none">
                  {formatMoney(balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-0.5 bg-warning"
              />
              <CardContent className="space-y-1 px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Estado
                </p>
                <p className="font-display text-xl font-semibold leading-none">
                  {isPaid ? "Pagada" : "Pendiente"}
                </p>
              </CardContent>
            </Card>
          </section>

          <Card
            data-ocid="supplier_detail.purchases.card"
            className="gap-0 overflow-hidden rounded-lg py-0 shadow-none"
          >
            <CardHeader className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                  <Receipt className="size-4 text-primary" aria-hidden="true" />
                  Compras registradas
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-border bg-muted/40 text-muted-foreground"
                >
                  {formatNumber(purchases.length)}
                </Badge>
              </div>
            </CardHeader>
            {purchases.length === 0 ? (
              <div
                data-ocid="supplier_detail.purchases.empty_state"
                className="flex flex-col items-center gap-3 px-6 py-12 text-center"
              >
                <PackagePlus
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Sin compras registradas
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Registra una compra de reposición para aumentar el stock y
                    generar el lote correspondiente.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPurchaseOpen(true)}
                  data-ocid="supplier_detail.purchases.empty_create_button"
                  className="gap-1.5"
                >
                  <PackagePlus className="size-4" aria-hidden="true" />
                  Registrar compra
                </Button>
              </div>
            ) : (
              <Table data-ocid="supplier_detail.purchases.table">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Compra</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Repuestos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-4 text-right">Pagado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase, index) => (
                    <TableRow
                      key={purchase.id.toString()}
                      data-ocid={`supplier_detail.purchase_row.${index + 1}`}
                    >
                      <TableCell className="data-rail pl-4 font-medium">
                        #{purchase.id.toString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(purchase.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {purchase.items.map((item) => (
                            <Badge
                              key={item.id.toString()}
                              variant="outline"
                              className="border-border bg-muted/40 font-normal text-muted-foreground"
                            >
                              <span className="data-rail">
                                {item.lotNumber}
                              </span>
                              <span className="data-rail">
                                ×{formatNumber(item.quantity)}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="data-rail text-right font-semibold">
                        {formatMoney(purchase.total)}
                      </TableCell>
                      <TableCell className="data-rail pr-4 text-right text-muted-foreground">
                        {formatMoney(purchase.paidAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card
            data-ocid="supplier_detail.supplier_orders.card"
            className="gap-0 overflow-hidden rounded-lg py-0 shadow-none"
          >
            <CardHeader className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                  <ClipboardList
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  Pedidos a proveedor
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-border bg-muted/40 text-muted-foreground"
                >
                  {formatNumber(supplierOrders.length)}
                </Badge>
              </div>
            </CardHeader>
            {supplierOrders.length === 0 ? (
              <div
                data-ocid="supplier_detail.supplier_orders.empty_state"
                className="flex flex-col items-center gap-3 px-6 py-12 text-center"
              >
                <ClipboardList
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Sin pedidos a proveedor
                  </p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Registra un pedido con la cantidad, el SKU y la descripción
                    del repuesto que necesitas solicitar.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSupplierOrderOpen(true)}
                  data-ocid="supplier_detail.supplier_orders.empty_create_button"
                  className="gap-1.5"
                >
                  <ClipboardList className="size-4" aria-hidden="true" />
                  Pedido a proveedor
                </Button>
              </div>
            ) : (
              <Table data-ocid="supplier_detail.supplier_orders.table">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 text-right">Cantidad</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="pr-4 text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierOrders.map((order, index) => (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`supplier_detail.supplier_order_row.${index + 1}`}
                    >
                      <TableCell className="data-rail pl-4 text-right font-semibold">
                        {formatNumber(order.quantity)}
                      </TableCell>
                      <TableCell className="data-rail">{order.sku}</TableCell>
                      <TableCell className="max-w-[24rem] truncate text-muted-foreground">
                        {order.description}
                      </TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card
            data-ocid="supplier_detail.payments.card"
            className="gap-0 overflow-hidden rounded-lg py-0 shadow-none"
          >
            <CardHeader className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                  <CreditCard
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  Pagos registrados
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-border bg-muted/40 text-muted-foreground"
                >
                  {formatNumber(payments.length)}
                </Badge>
              </div>
            </CardHeader>
            {payments.length === 0 ? (
              <div
                data-ocid="supplier_detail.payments.empty_state"
                className="flex flex-col items-center gap-3 px-6 py-12 text-center"
              >
                <Wallet
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Sin pagos registrados</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {isPaid
                      ? "Este proveedor no tiene saldo pendiente por liquidar."
                      : "Registra un pago total o parcial para reducir el saldo pendiente."}
                  </p>
                </div>
                {!isPaid ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPaymentOpen(true)}
                    data-ocid="supplier_detail.payments.empty_create_button"
                    className="gap-1.5"
                  >
                    <Wallet className="size-4" aria-hidden="true" />
                    Registrar pago
                  </Button>
                ) : null}
              </div>
            ) : (
              <Table data-ocid="supplier_detail.payments.table">
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Compra</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead className="pr-4 text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment, index) => (
                    <TableRow
                      key={payment.id.toString()}
                      data-ocid={`supplier_detail.payment_row.${index + 1}`}
                    >
                      <TableCell className="pl-4 text-muted-foreground">
                        {formatDate(payment.at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/40 font-normal text-muted-foreground"
                        >
                          {PAYMENT_METHOD_LABELS[payment.method]}
                        </Badge>
                      </TableCell>
                      <TableCell className="data-rail text-muted-foreground">
                        {payment.purchaseId !== undefined
                          ? `#${payment.purchaseId.toString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                        {payment.note ?? "—"}
                      </TableCell>
                      <TableCell className="data-rail pr-4 text-right font-semibold">
                        {formatMoney(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <PurchaseDialog
            open={purchaseOpen}
            onOpenChange={setPurchaseOpen}
            supplierId={supplierId}
          />
          <PaymentDialog
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            supplierId={supplierId}
            purchases={purchases}
            suggestedAmount={balance}
          />
          <SupplierOrderDialog
            open={supplierOrderOpen}
            onOpenChange={setSupplierOrderOpen}
            supplierId={supplierId}
          />
        </>
      )}
    </div>
  );
}
