import { ContactImportDialog } from "@/components/ContactImportDialog";
import { parseCsv } from "@/components/CsvTransfer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBackend } from "@/hooks/use-backend";
import {
  type ContactImportRow,
  SUPPLIER_CSV_HEADERS,
  buildContactImportRows,
  useContactImport,
} from "@/hooks/use-contact-import";
import { formatMoney } from "@/lib/format";
import type {
  ImportPreviewResult,
  PartView,
  Payable,
  Purchase,
  PurchaseInput,
  PurchaseItemInput,
  Supplier,
  SupplierInput,
} from "@/lib/types";
import { PartSort, PayableStatus } from "@/lib/types";
import {
  downloadXlsx,
  downloadXlsxTemplate,
  readSpreadsheet,
} from "@/lib/xlsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  Download,
  FileSpreadsheet,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** One exported supplier row, keyed by the shared CSV headers. */
function supplierToCsvRow(supplier: Supplier): Record<string, string> {
  return {
    nombre: supplier.name,
    documento: supplier.taxId ?? "",
    telefono: supplier.phone,
    correo: supplier.email ?? "",
    direccion: supplier.address ?? "",
  };
}

const SUPPLIERS_QUERY_KEY = ["suppliers"] as const;
const PAYABLES_QUERY_KEY = ["payables"] as const;
const PURCHASES_QUERY_KEY = ["purchases"] as const;
const PART_SEARCH_LIMIT = 20n;

/** Delays a fast-changing value so the part search hits the backend calmly. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

function useSuppliers(search: string) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: [...SUPPLIERS_QUERY_KEY, search],
    queryFn: async (): Promise<Supplier[]> => {
      if (!actor) return [];
      return actor.listSuppliers(search.trim() === "" ? null : search.trim());
    },
    enabled: !!actor && !isFetching,
  });
}

function usePayables() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: PAYABLES_QUERY_KEY,
    queryFn: async (): Promise<Payable[]> => {
      if (!actor) return [];
      return actor.listPayables();
    },
    enabled: !!actor && !isFetching,
  });
}

function useSaveSupplier() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: bigint | null;
      values: SupplierInput;
    }): Promise<Supplier> => {
      if (!actor) throw new Error("Backend no disponible");
      if (input.id === null) return actor.createSupplier(input.values);
      return actor.updateSupplier(input.id, input.values);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
    },
  });
}

function payableFor(payables: Payable[], supplierId: bigint): Payable | null {
  return payables.find((entry) => entry.supplierId === supplierId) ?? null;
}

/** Searches the parts catalog so purchase lines pick a real repuesto. */
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

function useCreatePurchase() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      supplierId: bigint;
      items: PurchaseItemInput[];
    }): Promise<Purchase> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createPurchase({
        supplierId: input.supplierId,
        items: input.items,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PAYABLES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["payable"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}

function parseQuantity(value: string): bigint | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return BigInt(parsed);
}

function parseCostToCents(value: string): bigint | null {
  const parsed = Number.parseFloat(value.replace(",", ".").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return BigInt(Math.round(parsed * 100));
}

function centsToInput(value: bigint | undefined): string {
  if (value === undefined) return "";
  return (Number(value) / 100).toFixed(2);
}

interface PurchaseLineDraft {
  key: string;
  part: PartView | null;
  lotNumber: string;
  quantity: string;
  unitCost: string;
}

function newPurchaseLine(key: string): PurchaseLineDraft {
  return { key, part: null, lotNumber: "", quantity: "1", unitCost: "" };
}

/** Searchable catalog picker used by each purchase line. */
function PartPicker({
  index,
  selected,
  onSelect,
}: {
  index: number;
  selected: PartView | null;
  onSelect: (part: PartView) => void;
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
            onSelect(null as unknown as PartView);
          }}
          data-ocid={`suppliers.part_clear_button.${index}`}
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
          placeholder="Buscar repuesto por nombre o SKU…"
          aria-label={`Buscar repuesto para la partida ${index}`}
          data-ocid={`suppliers.part_search_input.${index}`}
          className="pl-9"
        />
      </div>

      {open ? (
        <div
          data-ocid={`suppliers.part_results.${index}`}
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
                    data-ocid={`suppliers.part_option.${index}.${resultIndex + 1}`}
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
  supplier: Supplier;
}

function PurchaseDialog({ open, onOpenChange, supplier }: PurchaseDialogProps) {
  const [lines, setLines] = useState<PurchaseLineDraft[]>([
    newPurchaseLine("line-1"),
  ]);
  const [error, setError] = useState<string | null>(null);
  const createPurchase = useCreatePurchase();

  function handleOpenChange(next: boolean) {
    if (next) {
      setLines([newPurchaseLine("line-1")]);
      setError(null);
    }
    onOpenChange(next);
  }

  function updateLine(key: string, patch: Partial<PurchaseLineDraft>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function selectPart(key: string, part: PartView) {
    updateLine(key, {
      part,
      unitCost: centsToInput(part.costPrice),
    });
  }

  function addLine() {
    setLines((current) => [
      ...current,
      newPurchaseLine(`line-${current.length + 1}-${Date.now()}`),
    ]);
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items: PurchaseItemInput[] = [];
    for (const line of lines) {
      if (!line.part) {
        setError("Selecciona un repuesto del catálogo en cada partida.");
        return;
      }
      const lotNumber = line.lotNumber.trim();
      if (lotNumber === "") {
        setError("Cada partida necesita un número de lote o serie.");
        return;
      }
      const quantity = parseQuantity(line.quantity);
      if (quantity === null) {
        setError("Las cantidades deben ser números enteros mayores a cero.");
        return;
      }
      const unitCost = parseCostToCents(line.unitCost);
      if (unitCost === null) {
        setError("Los costos unitarios deben ser mayores a cero.");
        return;
      }
      items.push({ partId: line.part.id, lotNumber, quantity, unitCost });
    }
    if (items.length === 0) {
      setError("Agrega al menos una partida a la compra.");
      return;
    }
    setError(null);
    createPurchase.mutate(
      { supplierId: supplier.id, items },
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
        data-ocid="suppliers.purchase_dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Registrar compra de reposición
          </DialogTitle>
          <DialogDescription>
            Elige los repuestos del catálogo para {supplier.name}. Al registrar
            la compra, el stock aumenta y se crea el lote indicado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div
                key={line.key}
                data-ocid={`suppliers.purchase_line.${index + 1}`}
                className="rounded-md border border-border bg-muted/20 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Partida {index + 1}
                  </p>
                  {lines.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(line.key)}
                      aria-label={`Quitar partida ${index + 1}`}
                      data-ocid={`suppliers.remove_line_button.${index + 1}`}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Quitar
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Repuesto</Label>
                    <PartPicker
                      index={index + 1}
                      selected={line.part}
                      onSelect={(part) => selectPart(line.key, part)}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`purchase-lot-${line.key}`}>
                        Lote / serie
                      </Label>
                      <Input
                        id={`purchase-lot-${line.key}`}
                        value={line.lotNumber}
                        onChange={(event) =>
                          updateLine(line.key, {
                            lotNumber: event.target.value,
                          })
                        }
                        placeholder="L-2026-041"
                        data-ocid={`suppliers.lot_input.${index + 1}`}
                        className="data-rail"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`purchase-qty-${line.key}`}>
                        Cantidad
                      </Label>
                      <Input
                        id={`purchase-qty-${line.key}`}
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.key, { quantity: event.target.value })
                        }
                        inputMode="numeric"
                        placeholder="10"
                        data-ocid={`suppliers.quantity_input.${index + 1}`}
                        className="data-rail"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`purchase-cost-${line.key}`}>
                        Costo unitario (COP)
                      </Label>
                      <Input
                        id={`purchase-cost-${line.key}`}
                        value={line.unitCost}
                        onChange={(event) =>
                          updateLine(line.key, { unitCost: event.target.value })
                        }
                        inputMode="decimal"
                        placeholder="450.00"
                        data-ocid={`suppliers.unit_cost_input.${index + 1}`}
                        className="data-rail"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            data-ocid="suppliers.add_line_button"
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
              data-ocid="suppliers.purchase_error"
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
              data-ocid="suppliers.purchase_cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPurchase.isPending}
              data-ocid="suppliers.purchase_submit_button"
              className="gap-1.5"
            >
              <Check className="size-4" aria-hidden="true" />
              {createPurchase.isPending ? "Registrando…" : "Registrar compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayableStatusBadge({ payable }: { payable: Payable | null }) {
  if (!payable) {
    return (
      <Badge
        variant="outline"
        className="border-border bg-muted/40 text-muted-foreground"
      >
        Sin compras
      </Badge>
    );
  }
  if (payable.status === PayableStatus.paid) {
    return (
      <Badge
        variant="outline"
        className="border-success/40 bg-success/10 text-success"
      >
        Pagada
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-warning/40 bg-warning/10 text-warning"
    >
      Pendiente
    </Badge>
  );
}

interface SupplierFormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  taxId: string;
  address: string;
}

const EMPTY_FORM: SupplierFormState = {
  name: "",
  contactName: "",
  phone: "",
  email: "",
  taxId: "",
  address: "",
};

function toFormState(supplier: Supplier): SupplierFormState {
  return {
    name: supplier.name,
    contactName: supplier.contactName ?? "",
    phone: supplier.phone,
    email: supplier.email ?? "",
    taxId: supplier.taxId ?? "",
    address: supplier.address ?? "",
  };
}

function toSupplierInput(form: SupplierFormState): SupplierInput {
  const trimmed = {
    name: form.name.trim(),
    contactName: form.contactName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    taxId: form.taxId.trim(),
    address: form.address.trim(),
  };
  return {
    name: trimmed.name,
    phone: trimmed.phone,
    contactName: trimmed.contactName === "" ? undefined : trimmed.contactName,
    email: trimmed.email === "" ? undefined : trimmed.email,
    taxId: trimmed.taxId === "" ? undefined : trimmed.taxId,
    address: trimmed.address === "" ? undefined : trimmed.address,
  };
}

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const saveSupplier = useSaveSupplier();

  const isEditing = supplier !== null;

  function handleOpenChange(next: boolean) {
    if (next) {
      setForm(supplier ? toFormState(supplier) : EMPTY_FORM);
      setError(null);
    }
    onOpenChange(next);
  }

  function update<K extends keyof SupplierFormState>(
    key: K,
    value: SupplierFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = toSupplierInput(form);
    if (values.name === "") {
      setError("El nombre del proveedor es obligatorio.");
      return;
    }
    if (values.phone === "") {
      setError("El teléfono de contacto es obligatorio.");
      return;
    }
    setError(null);
    saveSupplier.mutate(
      { id: supplier ? supplier.id : null, values },
      {
        onSuccess: () => {
          toast.success(
            isEditing ? "Proveedor actualizado" : "Proveedor registrado",
          );
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setError(
            mutationError.message ||
              "No se pudo guardar el proveedor. Inténtalo de nuevo.",
          );
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="suppliers.dialog"
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Editar proveedor" : "Nuevo proveedor"}
          </DialogTitle>
          <DialogDescription>
            Datos de contacto y fiscales para compras de reposición y cuentas
            por pagar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="supplier-name">Nombre o razón social</Label>
              <Input
                id="supplier-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Refacciones del Norte S.A. de C.V."
                data-ocid="suppliers.name_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-contact">Persona de contacto</Label>
              <Input
                id="supplier-contact"
                value={form.contactName}
                onChange={(event) => update("contactName", event.target.value)}
                placeholder="Laura Medina"
                data-ocid="suppliers.contact_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-phone">Teléfono</Label>
              <Input
                id="supplier-phone"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="81 8345 2210"
                data-ocid="suppliers.phone_input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-email">Correo</Label>
              <Input
                id="supplier-email"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="ventas@repuestosandinos.com.co"
                data-ocid="suppliers.email_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-tax-id">NIT / ID fiscal</Label>
              <Input
                id="supplier-tax-id"
                value={form.taxId}
                onChange={(event) => update("taxId", event.target.value)}
                placeholder="900.123.456-7"
                data-ocid="suppliers.tax_id_input"
                className="data-rail"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="supplier-address">Dirección</Label>
              <Input
                id="supplier-address"
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                placeholder="Cra. 43A #1-50, Medellín, Antioquia"
                data-ocid="suppliers.address_input"
              />
            </div>
          </div>

          {error ? (
            <p
              data-ocid="suppliers.form_error"
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
              data-ocid="suppliers.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveSupplier.isPending}
              data-ocid="suppliers.submit_button"
            >
              {saveSupplier.isPending
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Registrar proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TableSkeleton() {
  const rows = Array.from({ length: 5 }, (_, index) => `supplier-row-${index}`);
  return (
    <div data-ocid="suppliers.loading_state" className="space-y-2 p-4">
      {rows.map((id) => (
        <Skeleton key={id} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function SuppliersPage() {
  const navigate = useNavigate();
  const { actor } = useBackend();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const urlTerm = typeof rawSearch.q === "string" ? rawSearch.q : "";

  const [search, setSearch] = useState(urlTerm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [purchaseSupplier, setPurchaseSupplier] = useState<Supplier | null>(
    null,
  );
  const [importRows, setImportRows] = useState<ContactImportRow[] | null>(null);
  const [importResult, setImportResult] = useState<ImportPreviewResult | null>(
    null,
  );
  const [importFailed, setImportFailed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contactImport = useContactImport("supplier");

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setSearch(urlTerm);
  }, [urlTerm]);

  const applySearch = useCallback(
    (value: string) => {
      void navigate({
        to: "/proveedores",
        search: (prev: Record<string, unknown>) => {
          const { q: _previous, ...rest } = prev;
          return value === "" ? rest : { ...rest, q: value };
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (search === urlTerm) return;
    const handle = window.setTimeout(() => applySearch(search), 300);
    return () => window.clearTimeout(handle);
  }, [search, urlTerm, applySearch]);

  const suppliersQuery = useSuppliers(search);
  const payablesQuery = usePayables();
  const saveSupplier = useSaveSupplier();

  const suppliers = suppliersQuery.data ?? [];
  const payables = payablesQuery.data ?? [];
  const isLoading = suppliersQuery.isLoading || payablesQuery.isLoading;
  const isError = suppliersQuery.isError || payablesQuery.isError;

  const pendingTotal = payables
    .filter((entry) => entry.status === PayableStatus.pending)
    .reduce((sum, entry) => sum + entry.balance, 0n);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setDialogOpen(true);
  }

  function refetchAll() {
    void suppliersQuery.refetch();
    void payablesQuery.refetch();
  }

  // Export the complete directory from the backend rather than only the rows
  // matching the current search, so the workbook never silently omits suppliers.
  async function handleExport() {
    if (!actor) return;
    setIsExporting(true);
    try {
      const all = await actor.listSuppliers(null);
      await downloadXlsx(
        "proveedores",
        "Proveedores",
        SUPPLIER_CSV_HEADERS,
        all.map(supplierToCsvRow),
      );
    } catch {
      toast.error("No se pudo exportar los proveedores. Intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDownloadTemplate() {
    await downloadXlsxTemplate(
      "plantilla-proveedores",
      "Proveedores",
      SUPPLIER_CSV_HEADERS,
      {
        nombre: "Repuestos Andinos S.A.S.",
        documento: "900.123.456-7",
        telefono: "604 444 8890",
        correo: "ventas@repuestosandinos.com.co",
        direccion: "Cra. 43A #1-50, Medellín, Antioquia",
      },
    );
  }

  async function handleFile(file: File) {
    if (!actor) return;
    try {
      const parsed = await readSpreadsheet(file, parseCsv);
      if (parsed.length === 0) {
        toast.error("El archivo no contiene filas válidas.");
        return;
      }
      const existing = await actor.listSuppliers(null);
      setImportResult(null);
      setImportFailed(false);
      setImportRows(buildContactImportRows("supplier", parsed, existing));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo. Verifica el formato e intenta de nuevo.",
      );
    }
  }

  function confirmImport() {
    if (!importRows) return;
    setImportFailed(false);
    contactImport.mutate(importRows, {
      onSuccess: (result) => {
        setImportResult(result);
        toast.success(
          `${result.created.toString()} creados · ${result.updated.toString()} actualizados · ${result.failed.toString()} con error`,
        );
      },
      onError: () => {
        setImportFailed(true);
        toast.error("No se pudo completar la importación.");
      },
    });
  }
  function closeImport() {
    setImportRows(null);
    setImportResult(null);
    setImportFailed(false);
  }

  return (
    <div
      data-ocid="suppliers.page"
      className="mx-auto w-full max-w-6xl animate-fade-in space-y-5"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Proveedores y compras
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Directorio de proveedores, compras de reposición y saldo pendiente
            por liquidar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="sr-only"
            data-ocid="suppliers.import_file_input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDownloadTemplate()}
            data-ocid="suppliers.template_button"
            className="gap-1.5"
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Plantilla
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={importRows !== null}
            onClick={() => fileInputRef.current?.click()}
            data-ocid="suppliers.import_button"
            className="gap-1.5"
          >
            <Upload className="size-4" aria-hidden="true" />
            Importar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => void handleExport()}
            data-ocid="suppliers.export_button"
            className="gap-1.5"
          >
            <Download className="size-4" aria-hidden="true" />
            {isExporting ? "Exportando…" : "Exportar"}
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            data-ocid="suppliers.create_button"
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo proveedor
          </Button>
        </div>
      </header>

      <section
        data-ocid="suppliers.kpi.section"
        aria-label="Resumen de cuentas por pagar"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-0.5 bg-primary"
          />
          <CardContent className="space-y-1 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Proveedores
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {isLoading ? "—" : suppliers.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Registrados en el directorio
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
              Cuentas pendientes
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {isLoading
                ? "—"
                : payables.filter(
                    (entry) => entry.status === PayableStatus.pending,
                  ).length}
            </p>
            <p className="text-xs text-muted-foreground">
              Proveedores con saldo por pagar
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
              Saldo total pendiente
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {isLoading ? "—" : formatMoney(pendingTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              Por liquidar con proveedores
            </p>
          </CardContent>
        </Card>
      </section>

      <Card
        data-ocid="suppliers.table.card"
        className="gap-0 overflow-hidden rounded-lg py-0 shadow-none"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, contacto o NIT…"
              aria-label="Buscar proveedores"
              data-ocid="suppliers.search_input"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refetchAll}
            data-ocid="suppliers.refresh_button"
          >
            Actualizar
          </Button>
        </div>

        {isError ? (
          <div
            data-ocid="suppliers.error_state"
            className="flex flex-col items-center gap-3 px-6 py-12 text-center"
          >
            <AlertTriangle
              className="size-5 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                No se pudieron cargar los proveedores
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
              data-ocid="suppliers.retry_button"
            >
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <TableSkeleton />
        ) : suppliers.length === 0 ? (
          <div
            data-ocid="suppliers.empty_state"
            className="flex flex-col items-center gap-3 px-6 py-14 text-center"
          >
            <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
              <Truck
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <p className="font-display text-sm font-semibold">
                {search.trim() === ""
                  ? "Aún no hay proveedores"
                  : "Sin resultados"}
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {search.trim() === ""
                  ? "Registra tu primer proveedor para dar de alta compras de reposición y controlar cuentas por pagar."
                  : "Ningún proveedor coincide con la búsqueda. Prueba con otro nombre, contacto o NIT."}
              </p>
            </div>
            {search.trim() === "" ? (
              <Button
                type="button"
                size="sm"
                onClick={openCreate}
                data-ocid="suppliers.empty_create_button"
                className="gap-1.5"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nuevo proveedor
              </Button>
            ) : null}
          </div>
        ) : (
          <Table data-ocid="suppliers.table">
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Proveedor</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Datos fiscales</TableHead>
                <TableHead className="text-right">Saldo pendiente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="pr-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier, index) => {
                const payable = payableFor(payables, supplier.id);
                return (
                  <TableRow
                    key={supplier.id.toString()}
                    data-ocid={`suppliers.row.${index + 1}`}
                  >
                    <TableCell className="pl-4">
                      <Link
                        to="/proveedores/$id"
                        params={{ id: supplier.id.toString() }}
                        data-ocid={`suppliers.link.${index + 1}`}
                        className="group flex min-w-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                          <Building2
                            className="size-3.5 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="truncate font-medium group-hover:text-primary">
                          {supplier.name}
                        </span>
                        <ArrowRight
                          className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplier.contactName ?? "—"}
                    </TableCell>
                    <TableCell className="data-rail text-muted-foreground">
                      {supplier.phone}
                    </TableCell>
                    <TableCell className="data-rail text-xs text-muted-foreground">
                      {supplier.taxId ?? "—"}
                    </TableCell>
                    <TableCell className="data-rail text-right font-semibold">
                      {payable ? formatMoney(payable.balance) : "—"}
                    </TableCell>
                    <TableCell>
                      <PayableStatusBadge payable={payable} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPurchaseSupplier(supplier)}
                          aria-label={`Registrar compra a ${supplier.name}`}
                          data-ocid={`suppliers.purchase_button.${index + 1}`}
                          className="gap-1.5"
                        >
                          <PackagePlus
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Compra
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(supplier)}
                          aria-label={`Editar ${supplier.name}`}
                          data-ocid={`suppliers.edit_button.${index + 1}`}
                          className="gap-1.5"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editing}
      />

      {purchaseSupplier ? (
        <PurchaseDialog
          open={purchaseSupplier !== null}
          onOpenChange={(next) => {
            if (!next) setPurchaseSupplier(null);
          }}
          supplier={purchaseSupplier}
        />
      ) : null}

      {saveSupplier.isError && !dialogOpen ? (
        <p
          data-ocid="suppliers.save_error"
          className="text-sm text-destructive"
        >
          No se pudo guardar el proveedor. Inténtalo de nuevo.
        </p>
      ) : null}

      <ContactImportDialog
        open={importRows !== null}
        onOpenChange={(open) => {
          if (!open) closeImport();
        }}
        kind="supplier"
        rows={importRows ?? []}
        result={importResult}
        isPending={contactImport.isPending}
        hasError={importFailed}
        onConfirm={confirmImport}
      />
    </div>
  );
}
