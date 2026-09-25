import { DataTable } from "@/components/DataTable";
import { ExpenseCategoryDialog } from "@/components/ExpenseCategoryDialog";
import { PageHeader } from "@/components/PageHeader";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "@/hooks/use-backend";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenseCategories,
  useExpenseSummary,
  useExpenses,
  useUpdateExpense,
} from "@/hooks/use-expenses";
import {
  colombiaDateInput,
  colombiaEndOfDay,
  colombiaStartOfDay,
  formatDate,
  formatMoney,
  formatNumber,
} from "@/lib/format";
import type {
  DataColumn,
  Expense,
  ExpenseFilter,
  ExpenseInput,
  Id,
  RowAction,
  Supplier,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Paperclip,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Tags,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mixed: "Mixto",
};

const PAYMENT_METHOD_OPTIONS = ["cash", "card", "transfer", "mixed"] as const;

function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

/** Parse a decimal amount typed by the user into integer cents. */
function parseAmount(value: string): bigint | null {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (normalized === "") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return BigInt(Math.round(parsed * 100));
}

/** Render integer cents as a plain decimal string for a form input. */
function centsToInput(cents: bigint): string {
  return (Number(cents) / 100).toFixed(2);
}

function isImageFile(filename: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(filename);
}

function useSuppliers() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["suppliers", "expense-form"],
    queryFn: async (): Promise<Supplier[]> => {
      if (!actor) return [];
      return actor.listSuppliers(null);
    },
    enabled: !!actor && !isFetching,
  });
}

interface ExpenseFormState {
  date: string;
  concept: string;
  categoryId: string;
  supplierId: string;
  amount: string;
  tax: string;
  paymentMethod: string;
  receiptUrl: string;
  receiptName: string;
}

function emptyForm(): ExpenseFormState {
  return {
    date: colombiaDateInput(BigInt(Date.now()) * 1_000_000n),
    concept: "",
    categoryId: "",
    supplierId: "",
    amount: "",
    tax: "",
    paymentMethod: "cash",
    receiptUrl: "",
    receiptName: "",
  };
}

function toFormState(expense: Expense): ExpenseFormState {
  return {
    date: colombiaDateInput(expense.date),
    concept: expense.concept,
    categoryId: expense.categoryId.toString(),
    supplierId: expense.supplierId?.toString() ?? "",
    amount: centsToInput(expense.amount),
    tax: centsToInput(expense.tax),
    paymentMethod: expense.paymentMethod,
    receiptUrl: expense.receiptUrl ?? "",
    receiptName: expense.receiptUrl ? "Comprobante adjunto" : "",
  };
}

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

function ExpenseDialog({ open, onOpenChange, expense }: ExpenseDialogProps) {
  const [form, setForm] = useState<ExpenseFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suppliersQuery = useSuppliers();
  const categoriesQuery = useExpenseCategories({ search: "" });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const isEditing = expense !== null;
  const isPending = createExpense.isPending || updateExpense.isPending;
  const suppliers = suppliersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  useEffect(() => {
    if (open) {
      setForm(expense ? toFormState(expense) : emptyForm());
      setError(null);
      setUploadProgress(0);
    }
  }, [open, expense]);

  function update<K extends keyof ExpenseFormState>(
    key: K,
    value: ExpenseFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name,
      ).withUploadProgress((percentage) => setUploadProgress(percentage));
      update("receiptUrl", blob.getDirectURL());
      update("receiptName", file.name);
    } catch {
      setError("No se pudo adjuntar el comprobante. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearReceipt() {
    update("receiptUrl", "");
    update("receiptName", "");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const concept = form.concept.trim();
    if (concept === "") {
      setError("El concepto del gasto es obligatorio.");
      return;
    }
    if (form.categoryId === "") {
      setError("Selecciona una categoría para el gasto.");
      return;
    }
    const amount = parseAmount(form.amount);
    if (amount === null || amount === 0n) {
      setError("Captura un monto válido mayor a cero.");
      return;
    }
    const tax = parseAmount(form.tax) ?? 0n;
    const date = colombiaStartOfDay(form.date);
    if (date === null) {
      setError("Selecciona una fecha válida.");
      return;
    }

    const input: ExpenseInput = {
      date,
      concept,
      categoryId: BigInt(form.categoryId),
      supplierId: form.supplierId === "" ? undefined : BigInt(form.supplierId),
      amount,
      tax,
      paymentMethod: form.paymentMethod,
      receiptUrl: form.receiptUrl === "" ? undefined : form.receiptUrl,
    };

    setError(null);
    const onSuccess = () => {
      toast.success(isEditing ? "Gasto actualizado" : "Gasto registrado");
      onOpenChange(false);
    };
    const onError = (mutationError: Error) => {
      setError(
        mutationError.message ||
          "No se pudo guardar el gasto. Inténtalo de nuevo.",
      );
    };

    if (isEditing && expense) {
      updateExpense.mutate({ id: expense.id, input }, { onSuccess, onError });
    } else {
      createExpense.mutate(input, { onSuccess, onError });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-ocid="expenses.dialog"
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {isEditing ? "Editar gasto" : "Registrar gasto"}
            </DialogTitle>
            <DialogDescription>
              Captura el gasto operativo con su comprobante. Los gastos
              alimentan automáticamente el módulo de Contabilidad.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expense-date">Fecha</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => update("date", event.target.value)}
                  className="data-rail"
                  data-ocid="expenses.date_input"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="expense-category">Categoría</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategoriesOpen(true)}
                    data-ocid="expenses.manage_categories_button"
                    className="h-6 gap-1.5 px-2 text-xs text-muted-foreground"
                  >
                    <Tags className="size-3.5" aria-hidden="true" />
                    Categorías
                  </Button>
                </div>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => update("categoryId", value)}
                >
                  <SelectTrigger
                    id="expense-category"
                    aria-label="Categoría del gasto"
                    data-ocid="expenses.category_select"
                  >
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        Sin categorías disponibles
                      </SelectItem>
                    ) : (
                      categories.map((usage) => (
                        <SelectItem
                          key={usage.category.id.toString()}
                          value={usage.category.id.toString()}
                        >
                          {usage.category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="expense-concept">Concepto</Label>
                <Textarea
                  id="expense-concept"
                  value={form.concept}
                  onChange={(event) => update("concept", event.target.value)}
                  placeholder="Compra de aceite sintético y filtros para servicio"
                  rows={2}
                  data-ocid="expenses.concept_input"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="expense-supplier">Proveedor</Label>
                <Select
                  value={form.supplierId === "" ? "none" : form.supplierId}
                  onValueChange={(value) =>
                    update("supplierId", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger
                    id="expense-supplier"
                    aria-label="Proveedor del gasto"
                    data-ocid="expenses.supplier_select"
                  >
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id.toString()}
                        value={supplier.id.toString()}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Monto (COP)</Label>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => update("amount", event.target.value)}
                  placeholder="0.00"
                  className="data-rail"
                  data-ocid="expenses.amount_input"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-tax">Impuesto (COP)</Label>
                <Input
                  id="expense-tax"
                  inputMode="decimal"
                  value={form.tax}
                  onChange={(event) => update("tax", event.target.value)}
                  placeholder="0.00"
                  className="data-rail"
                  data-ocid="expenses.tax_input"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="expense-method">Método de pago</Label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(value) => update("paymentMethod", value)}
                >
                  <SelectTrigger
                    id="expense-method"
                    aria-label="Método de pago"
                    data-ocid="expenses.method_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {paymentMethodLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="expense-receipt">Comprobante adjunto</Label>
                <input
                  ref={fileInputRef}
                  id="expense-receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                  data-ocid="expenses.receipt_input"
                />
                {form.receiptUrl === "" ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    data-ocid="expenses.upload_button"
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-4 py-6 text-sm text-muted-foreground transition-smooth hover:border-primary/50 hover:bg-muted/50 disabled:opacity-60"
                  >
                    <Upload className="size-4" aria-hidden="true" />
                    {uploading
                      ? `Subiendo… ${uploadProgress}%`
                      : "Subir comprobante (imagen o PDF)"}
                  </button>
                ) : (
                  <div
                    data-ocid="expenses.receipt_preview"
                    className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-border bg-card">
                      {isImageFile(form.receiptName) ? (
                        <img
                          src={form.receiptUrl}
                          alt="Vista previa del comprobante"
                          className="size-full object-cover"
                        />
                      ) : (
                        <FileText
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {form.receiptName}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearReceipt}
                      aria-label="Quitar comprobante"
                      data-ocid="expenses.remove_receipt_button"
                      className="gap-1.5 text-muted-foreground"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                      Quitar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {error ? (
              <p
                data-ocid="expenses.form_error"
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
                data-ocid="expenses.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || uploading}
                data-ocid="expenses.submit_button"
              >
                {isPending
                  ? "Guardando…"
                  : isEditing
                    ? "Guardar cambios"
                    : "Registrar gasto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ExpenseCategoryDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
    </>
  );
}

function TableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, index) => `expense-row-${index}`);
  return (
    <div data-ocid="expenses.loading_state" className="space-y-2 p-4">
      {rows.map((id) => (
        <Skeleton key={id} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<Id | "all">("all");
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const fromTimestamp = useMemo(() => colombiaStartOfDay(from), [from]);
  const toTimestamp = useMemo(() => colombiaEndOfDay(to), [to]);

  const categoriesQuery = useExpenseCategories({ search: "" });
  const categories = categoriesQuery.data ?? [];

  const expensesQuery = useExpenses({
    search,
    categoryId: categoryId === "all" ? null : categoryId,
    paymentMethod: paymentMethod === "all" ? null : paymentMethod,
    from: fromTimestamp,
    to: toTimestamp,
    page,
    pageSize: PAGE_SIZE,
  });

  const summaryFilter = useMemo<ExpenseFilter>(
    () => ({
      categoryId: categoryId === "all" ? undefined : categoryId,
      paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
      from: fromTimestamp ?? undefined,
      to: toTimestamp ?? undefined,
    }),
    [categoryId, paymentMethod, fromTimestamp, toTimestamp],
  );

  const summaryQuery = useExpenseSummary(summaryFilter);
  const deleteExpense = useDeleteExpense();

  const items = expensesQuery.data?.items ?? [];
  const total = Number(expensesQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summary = summaryQuery.data ?? null;

  const hasFilters =
    search.trim() !== "" ||
    categoryId !== "all" ||
    paymentMethod !== "all" ||
    from !== "" ||
    to !== "";

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategoryId("all");
    setPaymentMethod("all");
    setFrom("");
    setTo("");
    setPage(1);
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((expense: Expense) => {
    setEditing(expense);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    (expense: Expense) => {
      deleteExpense.mutate(expense.id, {
        onSuccess: () => toast.success("Gasto eliminado"),
        onError: () => toast.error("No se pudo eliminar el gasto."),
      });
    },
    [deleteExpense],
  );

  const columns = useMemo<Array<DataColumn<Expense>>>(
    () => [
      {
        key: "date",
        header: "Fecha",
        render: (expense) => (
          <span className="data-rail text-muted-foreground">
            {formatDate(expense.date)}
          </span>
        ),
      },
      {
        key: "concept",
        header: "Concepto",
        render: (expense) => (
          <div className="min-w-0 max-w-[280px]">
            <p className="truncate font-medium">{expense.concept}</p>
            {expense.receiptUrl ? (
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
              >
                <Paperclip className="size-3" aria-hidden="true" />
                Ver comprobante
              </a>
            ) : null}
          </div>
        ),
      },
      {
        key: "category",
        header: "Categoría",
        render: (expense) => (
          <span className="text-muted-foreground">{expense.categoryName}</span>
        ),
      },
      {
        key: "supplier",
        header: "Proveedor",
        render: (expense) => (
          <span className="block max-w-[180px] truncate text-muted-foreground">
            {expense.supplierName ?? "—"}
          </span>
        ),
      },
      {
        key: "paymentMethod",
        header: "Método",
        render: (expense) => (
          <span className="text-muted-foreground">
            {paymentMethodLabel(expense.paymentMethod)}
          </span>
        ),
      },
      {
        key: "tax",
        header: "Impuesto",
        numeric: true,
        render: (expense) => (
          <span className="data-rail text-muted-foreground">
            {formatMoney(expense.tax)}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Monto",
        numeric: true,
        render: (expense) => (
          <span className="data-rail font-semibold">
            {formatMoney(expense.amount)}
          </span>
        ),
      },
    ],
    [],
  );

  const actions = useMemo<Array<RowAction<Expense>>>(
    () => [
      {
        kind: "edit",
        label: "Editar gasto",
        onClick: openEdit,
      },
      {
        kind: "delete",
        label: "Eliminar gasto",
        onClick: handleDelete,
      },
    ],
    [openEdit, handleDelete],
  );

  const categoryTotals = summary?.byCategory ?? [];
  const maxCategoryTotal = categoryTotals.reduce(
    (max, entry) => (entry.total > max ? entry.total : max),
    0n,
  );

  return (
    <div
      data-ocid="expenses.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Administración"
        title="Gastos"
        description="Registro de gastos operativos por categoría y periodo. Alimentan automáticamente el módulo de Contabilidad."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoriesOpen(true)}
              data-ocid="expenses.manage_categories_button"
              className="gap-1.5"
            >
              <Tags className="size-4" aria-hidden="true" />
              Categorías
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              data-ocid="expenses.create_button"
              className="gap-1.5"
            >
              <Plus className="size-4" aria-hidden="true" />
              Registrar gasto
            </Button>
          </div>
        }
      />

      <section
        data-ocid="expenses.kpi.section"
        aria-label="Totales del periodo"
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card className="relative gap-0 overflow-hidden rounded-lg py-0 shadow-none">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-0.5 bg-primary"
          />
          <CardContent className="space-y-1 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Total del periodo
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {summaryQuery.isLoading ? "—" : formatMoney(summary?.total ?? 0n)}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasFilters ? "Con los filtros aplicados" : "Todos los gastos"}
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
              Gastos registrados
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {summaryQuery.isLoading
                ? "—"
                : formatNumber(summary?.count ?? 0n)}
            </p>
            <p className="text-xs text-muted-foreground">
              Movimientos en el periodo
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
              Categorías con gasto
            </p>
            <p className="data-rail text-2xl font-semibold leading-none">
              {summaryQuery.isLoading ? "—" : categoryTotals.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Desglose por categoría
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        data-ocid="expenses.filters"
        className="rounded-lg border border-border bg-card p-3 shadow-subtle"
      >
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por concepto o proveedor…"
              aria-label="Buscar gastos"
              className="pl-9"
              data-ocid="expenses.search_input"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="expenses-category"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Categoría
            </Label>
            <Select
              value={categoryId === "all" ? "all" : categoryId.toString()}
              onValueChange={(value) => {
                setCategoryId(value === "all" ? "all" : BigInt(value));
                setPage(1);
              }}
            >
              <SelectTrigger
                id="expenses-category"
                aria-label="Filtrar por categoría"
                data-ocid="expenses.category_filter"
                className="w-[170px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((usage) => (
                  <SelectItem
                    key={usage.category.id.toString()}
                    value={usage.category.id.toString()}
                  >
                    {usage.category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="expenses-method"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Método
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                id="expenses-method"
                aria-label="Filtrar por método de pago"
                data-ocid="expenses.method_filter"
                className="w-[160px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {paymentMethodLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="expenses-from"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Desde
            </Label>
            <Input
              id="expenses-from"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
              className="data-rail w-[160px]"
              data-ocid="expenses.date_from_input"
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="expenses-to"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
            >
              Hasta
            </Label>
            <Input
              id="expenses-to"
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
              className="data-rail w-[160px]"
              data-ocid="expenses.date_to_input"
            />
          </div>

          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-ocid="expenses.clear_filters_button"
              className="gap-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {expensesQuery.isLoading
                ? "Cargando…"
                : `${formatNumber(total)} gasto${total === 1 ? "" : "s"}`}
            </p>
          </div>

          {expensesQuery.isError ? (
            <div
              data-ocid="expenses.error_state"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
            >
              <AlertTriangle
                className="size-6 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground">
                No se pudieron cargar los gastos.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  void expensesQuery.refetch({ cancelRefetch: true })
                }
                data-ocid="expenses.retry_button"
              >
                Reintentar
              </Button>
            </div>
          ) : expensesQuery.isLoading ? (
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
              <TableSkeleton />
            </div>
          ) : items.length === 0 ? (
            <div
              data-ocid="expenses.empty_state"
              className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
                <Receipt
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">
                  {hasFilters ? "Sin resultados" : "Aún no hay gastos"}
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  {hasFilters
                    ? "Ajusta la búsqueda o los filtros para encontrar gastos."
                    : "Registra el primer gasto operativo para alimentar el módulo de Contabilidad."}
                </p>
              </div>
              {hasFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  data-ocid="expenses.empty_clear_button"
                >
                  Limpiar filtros
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={openCreate}
                  data-ocid="expenses.empty_create_button"
                  className="gap-1.5"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Registrar gasto
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={items}
              rowKey={(expense) => expense.id.toString()}
              actions={actions}
              ocid="expenses"
              caption="Gastos operativos"
            />
          )}

          {!expensesQuery.isLoading && !expensesQuery.isError && total > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  data-ocid="expenses.pagination_prev"
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  data-ocid="expenses.pagination_next"
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <aside
          data-ocid="expenses.category_panel"
          aria-label="Totales por categoría"
          className="space-y-3"
        >
          <Card className="gap-0 overflow-hidden rounded-lg py-0 shadow-none">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Wallet
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="font-display text-sm font-semibold">
                Totales por categoría
              </h2>
            </div>
            <CardContent className="space-y-3 px-4 py-4">
              {summaryQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from(
                    { length: 4 },
                    (_, index) => `category-skeleton-${index}`,
                  ).map((id) => (
                    <Skeleton key={id} className="h-8 w-full" />
                  ))}
                </div>
              ) : categoryTotals.length === 0 ? (
                <p
                  data-ocid="expenses.category_empty_state"
                  className="py-4 text-center text-xs text-muted-foreground"
                >
                  Sin gastos en el periodo seleccionado.
                </p>
              ) : (
                categoryTotals.map((entry) => {
                  const share =
                    maxCategoryTotal > 0n
                      ? Number((entry.total * 100n) / maxCategoryTotal)
                      : 0;
                  return (
                    <div
                      key={entry.categoryId.toString()}
                      data-ocid={`expenses.category_item.${entry.categoryId.toString()}`}
                      className="space-y-1.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {entry.categoryName}
                        </span>
                        <span className="data-rail shrink-0 text-xs font-semibold">
                          {formatMoney(entry.total)}
                        </span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-muted"
                        role="presentation"
                      >
                        <div
                          className={cn(
                            "h-full rounded-full bg-primary transition-smooth",
                          )}
                          style={{ width: `${Math.max(share, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editing}
      />

      <ExpenseCategoryDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
    </div>
  );
}

export default ExpensesPage;
