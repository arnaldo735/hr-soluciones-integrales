import { BarcodeScanner } from "@/components/BarcodeScanner";
import { DocumentPreview } from "@/components/DocumentPreview";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusTone } from "@/components/StatusBadge";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useBusinessSettings,
  useCompanyProfile,
  useIvaSettings,
} from "@/hooks/use-company";
import { useCustomers } from "@/hooks/use-customers";
import { useDailyHopeMessage } from "@/hooks/use-hope";
import { errorMessage, useMotorcycles, useParts } from "@/hooks/use-orders";
import {
  QUOTE_STATUS_LABELS,
  useConvertQuoteToInvoice,
  useConvertQuoteToOrder,
  useCreateQuote,
  useDeleteQuote,
  useQuote,
  useUpdateQuote,
  useUpdateQuoteStatus,
} from "@/hooks/use-quotes";
import {
  SERVICE_TERMS_DEFAULT_TEXT,
  useServiceTermsSettings,
} from "@/hooks/use-service-terms";
import { useServices } from "@/hooks/use-services";
import {
  companyContactLine,
  companyFiscalLines,
  companyHeaderFromProfile,
} from "@/lib/company-header";
import { downloadFile } from "@/lib/download";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatTaxRate,
} from "@/lib/format";
import {
  drawHopeMessage,
  hopeMessageContent,
  loadPdfLibs,
  pdfCompanyFromProfile,
} from "@/lib/pdf";
import type { HopeMessageContent } from "@/lib/pdf";
import type {
  DocumentFormat,
  DocumentLine,
  DocumentMeta,
  DocumentTotals,
  Id,
  PartView,
  PaymentMethod,
  QuoteInput,
  QuotePartLineInput,
  QuoteServiceLineInput,
  QuoteStatus,
  Service,
} from "@/lib/types";
import {
  NotificationSource,
  PaymentMethod as PaymentMethodEnum,
  QuoteStatus as QuoteStatusEnum,
  ServiceSort,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import type { jsPDF } from "jspdf";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bike,
  Check,
  FileText,
  Mail,
  Package,
  Plus,
  Printer,
  Receipt,
  Save,
  ScanLine,
  Search,
  Trash2,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const QUOTE_STATUS_TONE: Record<QuoteStatus, StatusTone> = {
  [QuoteStatusEnum.draft]: "draft",
  [QuoteStatusEnum.sent]: "sent",
  [QuoteStatusEnum.accepted]: "accepted",
  [QuoteStatusEnum.rejected]: "rejected",
  [QuoteStatusEnum.expired]: "expired",
};

const STATUS_OPTIONS: QuoteStatus[] = [
  QuoteStatusEnum.draft,
  QuoteStatusEnum.sent,
  QuoteStatusEnum.accepted,
  QuoteStatusEnum.rejected,
  QuoteStatusEnum.expired,
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethodEnum.cash]: "Efectivo",
  [PaymentMethodEnum.card]: "Tarjeta",
  [PaymentMethodEnum.transfer]: "Transferencia",
  [PaymentMethodEnum.mixed]: "Mixto",
};

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  PaymentMethodEnum.cash,
  PaymentMethodEnum.card,
  PaymentMethodEnum.transfer,
  PaymentMethodEnum.mixed,
];

/**
 * The quote service picker shows every match in a scrollable panel instead of
 * a small fixed page, so a valid service is never cut off.
 */
const SERVICE_PICKER_PAGE_SIZE = 1000;

/** A part line being edited in the form. */
interface PartDraft {
  key: string;
  partId: Id | null;
  description: string;
  quantity: string;
  unitPrice: string;
}

/** A service line being edited in the form. */
interface ServiceDraft {
  key: string;
  serviceId: Id | null;
  description: string;
  quantity: string;
  unitPrice: string;
}

let draftCounter = 0;
function nextKey(prefix: string): string {
  draftCounter += 1;
  return `${prefix}-${draftCounter}`;
}

/** Parses a money input in currency units into integer cents. */
function parseMoney(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/** Parses a quantity input into a positive integer, defaulting to 0. */
function parseQuantity(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

function centsToInput(cents: bigint): string {
  return (Number(cents) / 100).toFixed(2);
}

/** Delays a fast-changing value so catalog searches hit the backend calmly. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

/**
 * Search box used by the quote pickers. The catalog is only queried once the
 * user types, so the box doubles as the picker's empty state.
 */
function PickerSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
  ocid,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  ocid: string;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        data-ocid={ocid}
        className="h-8 pl-8 text-xs"
      />
    </div>
  );
}

/**
 * Prompt shown by every picker before the user types. The catalogs are only
 * searched on demand, so nothing is listed until there is a term.
 */
function PickerPrompt({ ocid, children }: { ocid: string; children: string }) {
  return (
    <p
      data-ocid={ocid}
      className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground"
    >
      {children}
    </p>
  );
}

function PartLinesEditor({
  lines,
  onChange,
  onScanPart,
}: {
  lines: PartDraft[];
  onChange: (lines: PartDraft[]) => void;
  onScanPart: (part: PartView) => void;
}) {
  const [search, setSearch] = useState("");
  const [activePartKey, setActivePartKey] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanNotFound, setScanNotFound] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const term = debouncedSearch.trim();
  const partsQuery = useParts(debouncedSearch);
  const parts = term.length > 0 ? (partsQuery.data?.items ?? []) : [];

  const update = (key: string, patch: Partial<PartDraft>) => {
    onChange(
      lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const selectPart = (key: string, part: PartView) => {
    update(key, {
      partId: part.id,
      description: part.name,
      unitPrice: centsToInput(part.salePrice),
    });
  };

  const clearPart = (key: string) => {
    update(key, { partId: null });
  };

  const addLine = () => {
    onChange([
      ...lines,
      {
        key: nextKey("part"),
        partId: null,
        description: "",
        quantity: "1",
        unitPrice: "0.00",
      },
    ]);
  };

  const removeLine = (key: string) => {
    onChange(lines.filter((line) => line.key !== key));
  };

  return (
    <Card className="gap-0 rounded-lg py-0 shadow-none">
      <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
        <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
          <Package className="size-4 text-primary" aria-hidden="true" />
          Repuestos
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={scanOpen ? "default" : "outline"}
            onClick={() => setScanOpen((open) => !open)}
            aria-expanded={scanOpen}
            data-ocid="quote_detail.scan_button"
            className="gap-1.5"
          >
            <ScanLine className="size-4" aria-hidden="true" />
            {scanOpen ? "Cerrar escáner" : "Escanear"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addLine}
            data-ocid="quote_detail.add_part_button"
            className="gap-1.5"
          >
            <Plus className="size-4" aria-hidden="true" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-5">
        {scanOpen ? (
          <BarcodeScanner
            ocid="quote_detail.scanner"
            title="Escanear repuesto"
            hint="Apunta la cámara al código del repuesto o ingrésalo manualmente. Se agrega como una nueva línea."
            onDetected={(part) => {
              setScanNotFound(null);
              onScanPart(part);
            }}
            onNotFound={(code) => setScanNotFound(code)}
            className="rounded-md border border-border bg-muted/20 p-3"
          />
        ) : null}
        {scanNotFound ? (
          <p
            data-ocid="quote_detail.scan_not_found_state"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            Producto no encontrado para el código{" "}
            <span className="data-rail">{scanNotFound}</span>.
          </p>
        ) : null}
        <PickerSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por SKU o nombre…"
          ariaLabel="Buscar repuesto por SKU o nombre"
          ocid="quote_detail.part_search_input"
        />
        {term.length === 0 ? (
          <PickerPrompt ocid="quote_detail.part_search.prompt_state">
            Escribe el SKU o el nombre del repuesto para ver coincidencias.
          </PickerPrompt>
        ) : partsQuery.isLoading ? (
          <div
            data-ocid="quote_detail.part_search.loading_state"
            className="space-y-1.5"
          >
            {Array.from(
              { length: 3 },
              (_, index) => `quote-part-skeleton-${index}`,
            ).map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        ) : partsQuery.isError ? (
          <p
            data-ocid="quote_detail.part_search.error_state"
            className="text-xs text-destructive"
          >
            No se pudo cargar el catálogo de repuestos. Inténtalo de nuevo.
          </p>
        ) : parts.length === 0 ? (
          <p
            data-ocid="quote_detail.part_search.empty_state"
            className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
          >
            {`Sin repuestos que coincidan con “${term}”.`}
          </p>
        ) : (
          <ul
            data-ocid="quote_detail.part_search.list"
            className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1"
          >
            {parts.map((part, index) => (
              <li key={part.id.toString()}>
                <button
                  type="button"
                  onClick={() => {
                    if (activePartKey !== null) selectPart(activePartKey, part);
                  }}
                  data-ocid={`quote_detail.part_search.item.${index + 1}`}
                  className="flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
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
                </button>
              </li>
            ))}
          </ul>
        )}
        {lines.length === 0 ? (
          <p
            data-ocid="quote_detail.parts.empty_state"
            className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground"
          >
            Sin repuestos. Agrega las piezas que incluye la cotización.
          </p>
        ) : (
          lines.map((line, index) => (
            <div
              key={line.key}
              data-ocid={`quote_detail.part_line.${index + 1}`}
              className="grid gap-3 rounded-md border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_5rem_7rem_auto]"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor={`part-${line.key}`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Repuesto
                </Label>
                {line.partId !== null ? (
                  <div
                    data-ocid={`quote_detail.part_selected.${index + 1}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {line.description || "Repuesto seleccionado"}
                      </p>
                      <p className="data-rail truncate text-xs text-muted-foreground">
                        {formatMoney(BigInt(parseMoney(line.unitPrice)))}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => clearPart(line.key)}
                      aria-label="Quitar el repuesto seleccionado"
                      data-ocid={`quote_detail.clear_part_button.${index + 1}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActivePartKey(line.key)}
                    aria-pressed={activePartKey === line.key}
                    data-ocid={`quote_detail.part_pick_button.${index + 1}`}
                    className={
                      activePartKey === line.key
                        ? "flex h-9 w-full items-center gap-2 rounded-md border border-primary/50 bg-primary/5 px-3 text-left text-xs text-foreground focus-visible:outline-none"
                        : "flex h-9 w-full items-center gap-2 rounded-md border border-dashed border-border px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    }
                  >
                    <Search className="size-3.5 shrink-0" aria-hidden="true" />
                    {activePartKey === line.key
                      ? "Elige un repuesto de la lista de arriba"
                      : "Usar el buscador de arriba"}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`part-qty-${line.key}`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Cant.
                </Label>
                <Input
                  id={`part-qty-${line.key}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={line.quantity}
                  onChange={(event) =>
                    update(line.key, { quantity: event.target.value })
                  }
                  data-ocid={`quote_detail.part_quantity_input.${index + 1}`}
                  className="data-rail"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`part-price-${line.key}`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Precio unit.
                </Label>
                <Input
                  id={`part-price-${line.key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(event) =>
                    update(line.key, { unitPrice: event.target.value })
                  }
                  data-ocid={`quote_detail.part_price_input.${index + 1}`}
                  className="data-rail"
                />
              </div>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(line.key)}
                  aria-label="Quitar repuesto"
                  data-ocid={`quote_detail.remove_part_button.${index + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ServiceLinesEditor({
  lines,
  onChange,
}: {
  lines: ServiceDraft[];
  onChange: (lines: ServiceDraft[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeServiceKey, setActiveServiceKey] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const term = debouncedSearch.trim();
  const servicesQuery = useServices({
    search: debouncedSearch,
    category: null,
    activeOnly: true,
    sort: ServiceSort.name,
    page: 1,
    pageSize: SERVICE_PICKER_PAGE_SIZE,
    enabled: term.length > 0,
  });
  const services = term.length > 0 ? (servicesQuery.data?.items ?? []) : [];

  const update = (key: string, patch: Partial<ServiceDraft>) => {
    onChange(
      lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const selectService = (key: string, service: Service) => {
    update(key, {
      serviceId: service.id,
      description: service.name,
      unitPrice: centsToInput(service.laborRate),
    });
  };

  const clearService = (key: string) => {
    update(key, { serviceId: null });
  };

  const addLine = () => {
    onChange([
      ...lines,
      {
        key: nextKey("service"),
        serviceId: null,
        description: "",
        quantity: "1",
        unitPrice: "0.00",
      },
    ]);
  };

  const removeLine = (key: string) => {
    onChange(lines.filter((line) => line.key !== key));
  };

  return (
    <Card className="gap-0 rounded-lg py-0 shadow-none">
      <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
        <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
          <Wrench className="size-4 text-primary" aria-hidden="true" />
          Servicios
        </CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addLine}
          data-ocid="quote_detail.add_service_button"
          className="gap-1.5"
        >
          <Plus className="size-4" aria-hidden="true" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-5">
        <PickerSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código o nombre…"
          ariaLabel="Buscar servicio por código o nombre"
          ocid="quote_detail.service_search_input"
        />
        {term.length === 0 ? (
          <PickerPrompt ocid="quote_detail.service_search.prompt_state">
            Escribe el código o el nombre del servicio para ver coincidencias.
          </PickerPrompt>
        ) : servicesQuery.isLoading ? (
          <div
            data-ocid="quote_detail.service_search.loading_state"
            className="space-y-1.5"
          >
            {Array.from(
              { length: 3 },
              (_, index) => `quote-service-skeleton-${index}`,
            ).map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        ) : servicesQuery.isError ? (
          <p
            data-ocid="quote_detail.service_search.error_state"
            className="text-xs text-destructive"
          >
            No se pudo cargar el catálogo de servicios. Inténtalo de nuevo.
          </p>
        ) : services.length === 0 ? (
          <p
            data-ocid="quote_detail.service_search.empty_state"
            className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
          >
            {`Sin servicios que coincidan con “${term}”.`}
          </p>
        ) : (
          <ul
            data-ocid="quote_detail.service_search.list"
            className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1"
          >
            {services.map((service, index) => (
              <li key={service.id.toString()}>
                <button
                  type="button"
                  onClick={() => {
                    if (activeServiceKey !== null) {
                      selectService(activeServiceKey, service);
                    }
                  }}
                  data-ocid={`quote_detail.service_search.item.${index + 1}`}
                  className="flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="data-rail shrink-0 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        {service.code}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {service.name}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {service.category}
                    </span>
                  </span>
                  <span className="data-rail shrink-0 text-xs font-medium">
                    {formatMoney(service.laborRate)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {lines.length === 0 ? (
          <p
            data-ocid="quote_detail.services.empty_state"
            className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground"
          >
            Sin servicios. Agrega la mano de obra o los servicios cotizados.
          </p>
        ) : (
          lines.map((line, index) => (
            <div
              key={line.key}
              data-ocid={`quote_detail.service_line.${index + 1}`}
              className="grid gap-3 rounded-md border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_5rem_7rem_auto]"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor={`service-${line.key}`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Servicio
                </Label>
                {line.serviceId !== null ? (
                  <div
                    data-ocid={`quote_detail.service_selected.${index + 1}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {line.description || "Servicio seleccionado"}
                      </p>
                      <p className="data-rail truncate text-xs text-muted-foreground">
                        {formatMoney(BigInt(parseMoney(line.unitPrice)))}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => clearService(line.key)}
                      aria-label="Quitar el servicio seleccionado"
                      data-ocid={`quote_detail.clear_service_button.${index + 1}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveServiceKey(line.key)}
                    aria-pressed={activeServiceKey === line.key}
                    data-ocid={`quote_detail.service_pick_button.${index + 1}`}
                    className={
                      activeServiceKey === line.key
                        ? "flex h-9 w-full items-center gap-2 rounded-md border border-primary/50 bg-primary/5 px-3 text-left text-xs text-foreground focus-visible:outline-none"
                        : "flex h-9 w-full items-center gap-2 rounded-md border border-dashed border-border px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    }
                  >
                    <Search className="size-3.5 shrink-0" aria-hidden="true" />
                    {activeServiceKey === line.key
                      ? "Elige un servicio de la lista de arriba"
                      : "Usar el buscador de arriba"}
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`service-qty-${line.key}`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Cant.
                </Label>
                <Input
                  id={`service-qty-${line.key}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={line.quantity}
                  onChange={(event) =>
                    update(line.key, { quantity: event.target.value })
                  }
                  data-ocid={`quote_detail.service_quantity_input.${index + 1}`}
                  className="data-rail"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`service-price-${line.key}`}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Tarifa
                </Label>
                <Input
                  id={`service-price-${line.key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(event) =>
                    update(line.key, { unitPrice: event.target.value })
                  }
                  data-ocid={`quote_detail.service_price_input.${index + 1}`}
                  className="data-rail"
                />
              </div>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(line.key)}
                  aria-label="Quitar servicio"
                  data-ocid={`quote_detail.remove_service_button.${index + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Builds the quote PDF in the selected format (A4 sheet or 80 mm tirilla) with
 * the same content the on-screen preview shows. The blob is handed to the
 * shared mobile-safe `downloadFile` helper so the file is saved on the device
 * on phone and tablet, not only on desktop.
 */
async function buildQuotePdf(
  format: DocumentFormat,
  number: string,
  company: ReturnType<typeof pdfCompanyFromProfile>,
  meta: DocumentMeta[],
  lines: DocumentLine[],
  totals: DocumentTotals[],
  footer: string,
  hope: HopeMessageContent | null,
): Promise<jsPDF> {
  const { jsPDF, autoTable } = await loadPdfLibs();
  const narrow = format === "receipt80";
  const margin = narrow ? 3 : 14;
  const right = narrow ? 77 : 196;
  const doc = new jsPDF({
    unit: "mm",
    format: narrow ? [80, 297] : "a4",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 10 : 15);
  doc.setTextColor(30, 41, 59);
  doc.text(company.name, margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 8.5);
  doc.setTextColor(100, 116, 139);
  const contact = [company.taxId, company.address, company.phone]
    .filter((value): value is string => !!value && value.trim() !== "")
    .join(narrow ? " · " : "  ·  ");
  let cursor = 18.5;
  if (contact !== "") {
    const contactLines = doc.splitTextToSize(contact, right - margin);
    doc.text(contactLines, margin, cursor);
    cursor += contactLines.length * (narrow ? 3 : 4);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(narrow ? 8.5 : 11);
  doc.setTextColor(30, 41, 59);
  doc.text("COTIZACIÓN", right, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6.5 : 9);
  doc.setTextColor(100, 116, 139);
  doc.text(number, right, 18.5, { align: "right" });

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(margin, cursor + 1, right, cursor + 1);
  cursor += 5;

  if (narrow) {
    for (const entry of meta) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(entry.label, margin, cursor);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const value = doc.splitTextToSize(entry.value, right - margin);
      doc.text(value, margin, cursor + 3);
      cursor += 3 + value.length * 3 + 1.5;
    }
  } else {
    autoTable(doc, {
      startY: cursor,
      body: meta.map((entry) => [entry.label, entry.value]),
      theme: "plain",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 40, textColor: [100, 116, 139] },
        1: { fontStyle: "bold", textColor: [30, 41, 59] },
      },
      margin: { left: margin, right: margin },
    });
    cursor =
      ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? cursor) + 4;
  }

  autoTable(doc, {
    startY: cursor,
    head: [["Concepto", "Cant.", "P. unit.", "Importe"]],
    body: lines.map((line) => [
      line.description,
      formatNumber(line.quantity),
      formatMoney(BigInt(Math.round(line.unitPrice * 100))),
      formatMoney(BigInt(Math.round(line.amount * 100))),
    ]),
    theme: "striped",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 6.5 : 8.5,
      cellPadding: narrow ? 1.2 : 2,
      overflow: "linebreak",
    },
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  const afterLines =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? cursor;

  autoTable(doc, {
    startY: afterLines + 4,
    body: totals.map((entry) => [entry.label, entry.value]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: narrow ? 7 : 9,
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: "right", textColor: [100, 116, 139] },
      1: { halign: "right", fontStyle: "bold", textColor: [30, 41, 59] },
    },
    margin: { left: narrow ? margin : right - 90, right: margin },
  });

  const afterTotals =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? afterLines + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(narrow ? 6 : 7.5);
  doc.setTextColor(100, 116, 139);
  const footerY = afterTotals + (narrow ? 6 : 10);
  const footerLines = doc.splitTextToSize(footer, right - margin);
  doc.text(footerLines, margin, footerY);
  drawHopeMessage(doc, hope, {
    x: margin,
    right,
    y: footerY + footerLines.length * (narrow ? 2.6 : 3.4) + 1.5,
    narrow,
  });

  return doc;
}

export function QuoteDetailPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const isNew = params.id === undefined || params.id === "nueva";
  const quoteId = isNew ? null : BigInt(params.id as string);

  const quoteQuery = useQuote(quoteId);
  const businessQuery = useBusinessSettings();
  const companyQuery = useCompanyProfile();
  const dailyHopeQuery = useDailyHopeMessage();
  const hopeMessage = hopeMessageContent(dailyHopeQuery.data);
  const serviceTermsQuery = useServiceTermsSettings();
  const { isIvaResponsible, taxRate: effectiveTaxRate } = useIvaSettings();

  const [customerId, setCustomerId] = useState<Id | null>(null);
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState("0.00");
  const [partLines, setPartLines] = useState<PartDraft[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [printFormat, setPrintFormat] = useState<DocumentFormat>("a4");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethodEnum.cash,
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 250);

  const customersQuery = useCustomers(debouncedCustomerSearch);
  const motorcyclesQuery = useMotorcycles(customerId);
  const customerTerm = debouncedCustomerSearch.trim();
  const customerResults = customersQuery.data ?? [];
  const customers = customerTerm.length > 0 ? customerResults : [];
  const selectedCustomer =
    customerResults.find((item) => item.id === customerId) ?? null;

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const updateStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();
  const convertToOrder = useConvertQuoteToOrder();
  const convertToInvoice = useConvertQuoteToInvoice();

  const view = quoteQuery.data ?? null;
  const quote = view?.quote ?? null;
  const business = businessQuery.data ?? null;
  const companyLogoUrl = companyQuery.data?.logoUrl ?? undefined;
  // Complete company identity for the printed quote: logo, razón social, NIT
  // con dígito de verificación, régimen, responsabilidad, dirección, ciudad,
  // teléfono, correo y web. Unconfigured fields are omitted cleanly.
  const companyHeader = companyHeaderFromProfile(companyQuery.data);

  // One-time initialization of the draft from the loaded record.
  useEffect(() => {
    if (isNew || initialized || !quote) return;
    setCustomerId(quote.customerId);
    setNotes(quote.notes ?? "");
    setDiscount(centsToInput(quote.discount));
    setPartLines(
      quote.partLines.map((line) => ({
        key: nextKey("part"),
        partId: line.partId,
        description: line.description,
        quantity: line.quantity.toString(),
        unitPrice: centsToInput(line.unitPrice),
      })),
    );
    setServiceLines(
      quote.serviceLines.map((line) => ({
        key: nextKey("service"),
        serviceId: line.serviceId ?? null,
        description: line.description,
        quantity: line.quantity.toString(),
        unitPrice: centsToInput(line.unitPrice),
      })),
    );
    setInitialized(true);
  }, [isNew, initialized, quote]);

  const motorcycles = motorcyclesQuery.data ?? [];

  // The quote form no longer asks for a motorcycle: the backend still requires
  // one, so the customer's first registered bike is attached automatically.
  const motorcycleId = motorcycles[0]?.id ?? null;
  const selectedMotorcycle = motorcycles[0];

  // Live totals computed from the current draft.
  const liveTotals = useMemo(() => {
    const partsSubtotal = partLines.reduce(
      (sum, line) =>
        sum + parseQuantity(line.quantity) * parseMoney(line.unitPrice),
      0,
    );
    const servicesSubtotal = serviceLines.reduce(
      (sum, line) =>
        sum + parseQuantity(line.quantity) * parseMoney(line.unitPrice),
      0,
    );
    const subtotal = partsSubtotal + servicesSubtotal;
    const discountCents = Math.min(parseMoney(discount), subtotal);
    const taxableBase = subtotal - discountCents;
    const taxRate = Number(effectiveTaxRate);
    const tax = Math.round((taxableBase * taxRate) / 100);
    return {
      partsSubtotal,
      servicesSubtotal,
      subtotal,
      discount: discountCents,
      taxableBase,
      tax,
      total: taxableBase + tax,
      taxRate,
    };
  }, [partLines, serviceLines, discount, effectiveTaxRate]);

  const isEditing = isNew || initialized;
  const isPending =
    createQuote.isPending || updateQuote.isPending || updateStatus.isPending;

  function buildInput(): QuoteInput | null {
    if (customerId === null) {
      setFormError("Selecciona el cliente de la cotización.");
      return null;
    }
    if (motorcycleId === null) {
      setFormError(
        "El cliente seleccionado no tiene motos registradas. Registra una moto antes de cotizar.",
      );
      return null;
    }
    const parts: QuotePartLineInput[] = [];
    for (const line of partLines) {
      if (line.partId === null) {
        setFormError("Selecciona un repuesto en cada línea de repuestos.");
        return null;
      }
      const quantity = parseQuantity(line.quantity);
      if (quantity <= 0) {
        setFormError("Cada repuesto necesita una cantidad mayor a cero.");
        return null;
      }
      parts.push({
        partId: line.partId,
        quantity: BigInt(quantity),
        unitPrice: BigInt(parseMoney(line.unitPrice)),
      });
    }
    const services: QuoteServiceLineInput[] = [];
    for (const line of serviceLines) {
      const quantity = parseQuantity(line.quantity);
      if (quantity <= 0) {
        setFormError("Cada servicio necesita una cantidad mayor a cero.");
        return null;
      }
      const description = line.description.trim();
      if (description === "") {
        setFormError("Selecciona un servicio o describe la partida.");
        return null;
      }
      services.push({
        serviceId: line.serviceId ?? undefined,
        description,
        quantity: BigInt(quantity),
        unitPrice: BigInt(parseMoney(line.unitPrice)),
      });
    }
    if (parts.length === 0 && services.length === 0) {
      setFormError("Agrega al menos un repuesto o un servicio.");
      return null;
    }
    return {
      customerId,
      motorcycleId,
      notes: notes.trim() === "" ? undefined : notes.trim(),
      discount: BigInt(parseMoney(discount)),
      partLines: parts,
      serviceLines: services,
    };
  }

  function handleSave() {
    setFormError(null);
    const input = buildInput();
    if (!input) return;

    if (isNew) {
      createQuote.mutate(input, {
        onSuccess: (created) => {
          toast.success(`Cotización ${created.quote.quoteNumber} creada`);
          void navigate({
            to: "/cotizaciones/$id",
            params: { id: created.quote.id.toString() },
          });
        },
        onError: (error) => setFormError(errorMessage(error)),
      });
      return;
    }

    if (quoteId === null) return;
    updateQuote.mutate(
      { id: quoteId, input },
      {
        onSuccess: () => {
          toast.success("Cotización actualizada");
          setInitialized(false);
        },
        onError: (error) => setFormError(errorMessage(error)),
      },
    );
  }

  function handleCancelEdit() {
    if (isNew) {
      void navigate({ to: "/cotizaciones" });
      return;
    }
    setInitialized(false);
    setFormError(null);
  }

  /**
   * Adds a scanned part as a new quote part line. The scanner already resolved
   * the code through `findPartByCode`, so the part is appended with its sale
   * price and a quantity of one; an unknown code never reaches this handler.
   */
  function handleScanPart(part: PartView) {
    setFormError(null);
    setPartLines((current) => [
      ...current,
      {
        key: nextKey("part"),
        partId: part.id,
        description: part.name,
        quantity: "1",
        unitPrice: centsToInput(part.salePrice),
      },
    ]);
    toast.success(`${part.name} agregado a la cotización`);
  }

  function handleStatusChange(status: QuoteStatus) {
    if (quoteId === null) return;
    setFormError(null);
    updateStatus.mutate(
      { id: quoteId, status },
      {
        onSuccess: () => toast.success("Estado actualizado"),
        onError: (error) => setFormError(errorMessage(error)),
      },
    );
  }

  function handleDelete() {
    if (quoteId === null) return;
    deleteQuote.mutate(quoteId, {
      onSuccess: () => {
        toast.success("Cotización eliminada");
        void navigate({ to: "/cotizaciones" });
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  }

  function handleConvertToOrder() {
    if (quoteId === null) return;
    setFormError(null);
    convertToOrder.mutate(quoteId, {
      onSuccess: (order) => {
        toast.success(`Orden ${order.order.orderNumber} creada`);
        setConvertOpen(false);
        void navigate({
          to: "/ordenes/$id",
          params: { id: order.order.id.toString() },
        });
      },
      onError: (error) => setFormError(errorMessage(error)),
    });
  }

  function handleConvertToInvoice() {
    if (quoteId === null) return;
    setFormError(null);
    convertToInvoice.mutate(
      { id: quoteId, paymentMethod },
      {
        onSuccess: (invoice) => {
          toast.success(`Factura ${invoice.number} generada`);
          setConvertOpen(false);
          void navigate({
            to: "/facturas/$id",
            params: { id: invoice.id.toString() },
          });
        },
        onError: (error) => setFormError(errorMessage(error)),
      },
    );
  }

  if (!isNew && quoteQuery.isLoading) {
    return (
      <div
        data-ocid="quote_detail.loading_state"
        className="mx-auto w-full max-w-5xl space-y-4"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isNew && (quoteQuery.isError || !quote)) {
    return (
      <div
        data-ocid="quote_detail.error_state"
        className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center"
      >
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        <p className="font-display text-sm font-semibold">
          Cotización no encontrada
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          La cotización solicitada no existe o fue eliminada del registro.
        </p>
        <Button type="button" variant="outline" asChild>
          <Link to="/cotizaciones" data-ocid="quote_detail.back_button">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a cotizaciones
          </Link>
        </Button>
      </div>
    );
  }

  const status = quote?.status ?? QuoteStatusEnum.draft;
  const canConvert = status === QuoteStatusEnum.accepted;

  const documentLines: DocumentLine[] = [
    ...partLines.map((line) => ({
      description: line.description || "Repuesto",
      quantity: parseQuantity(line.quantity),
      unitPrice: parseMoney(line.unitPrice) / 100,
      amount: (parseQuantity(line.quantity) * parseMoney(line.unitPrice)) / 100,
    })),
    ...serviceLines.map((line) => ({
      description: line.description || "Servicio",
      quantity: parseQuantity(line.quantity),
      unitPrice: parseMoney(line.unitPrice) / 100,
      amount: (parseQuantity(line.quantity) * parseMoney(line.unitPrice)) / 100,
    })),
  ];

  const documentMeta: DocumentMeta[] = [
    {
      label: "Cliente",
      value:
        selectedCustomer?.name ??
        (quote ? `Cliente #${quote.customerId.toString()}` : "—"),
    },
    {
      label: "Moto",
      value: selectedMotorcycle
        ? `${selectedMotorcycle.brand} ${selectedMotorcycle.model} · ${selectedMotorcycle.plate}`
        : quote
          ? `#${quote.motorcycleId.toString()}`
          : "—",
      rail: true,
    },
    {
      label: "Fecha",
      value: formatDate(quote?.createdAt ?? null),
    },
    {
      label: "Estado",
      value: QUOTE_STATUS_LABELS[status],
    },
  ];

  const documentTotals: DocumentTotals[] = [
    { label: "Subtotal", value: formatMoney(BigInt(liveTotals.subtotal)) },
    { label: "Descuento", value: formatMoney(BigInt(liveTotals.discount)) },
    ...(isIvaResponsible
      ? [
          {
            label: `Impuesto (${formatTaxRate(BigInt(liveTotals.taxRate))})`,
            value: formatMoney(BigInt(liveTotals.tax)),
          },
        ]
      : []),
    {
      label: "Total",
      value: formatMoney(BigInt(liveTotals.total)),
      emphasis: true,
    },
  ];

  // Pie de página editable "Términos y condiciones del Servicio". Mientras la
  // configuración carga, o cuando el administrador la dejó vacía, se usa el
  // texto de recepción por defecto para que el documento nunca quede sin pie.
  const serviceTermsText = serviceTermsQuery.data?.text?.trim() ?? "";
  const quoteFooter =
    serviceTermsText !== "" ? serviceTermsText : SERVICE_TERMS_DEFAULT_TEXT;

  async function handleDownloadPdf(nextFormat: DocumentFormat) {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const doc = await buildQuotePdf(
        nextFormat,
        quote?.quoteNumber ?? "BORRADOR",
        pdfCompanyFromProfile(companyQuery.data),
        documentMeta,
        documentLines,
        documentTotals,
        quoteFooter,
        hopeMessage,
      );
      await downloadFile({
        filename: `Cotizacion-${quote?.quoteNumber ?? "BORRADOR"}.pdf`,
        mimeType: "application/pdf",
        data: doc.output("blob"),
      });
    } catch {
      setDownloadError(
        "No se pudo guardar el PDF en este dispositivo. Intenta de nuevo.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      data-ocid="quote_detail.page"
      className="mx-auto w-full max-w-5xl animate-fade-in space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <Link to="/cotizaciones" data-ocid="quote_detail.back_link">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Cotizaciones
          </Link>
        </Button>

        {!isNew ? (
          <StatusBadge
            label={QUOTE_STATUS_LABELS[status]}
            tone={QUOTE_STATUS_TONE[status]}
          />
        ) : null}
      </div>

      <PageHeader
        eyebrow="Ventas"
        title={
          isNew ? "Nueva cotización" : (quote?.quoteNumber ?? "Cotización")
        }
        description={
          isNew
            ? "Selecciona cliente y moto, agrega repuestos y servicios, y revisa los totales en vivo."
            : `Creada ${formatDateTime(quote?.createdAt ?? null)} · Actualizada ${formatDateTime(quote?.updatedAt ?? null)}`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  data-ocid="quote_detail.cancel_button"
                  className="gap-2"
                >
                  <X className="size-4" aria-hidden="true" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  data-ocid="quote_detail.save_button"
                  className="gap-2"
                >
                  <Save className="size-4" aria-hidden="true" />
                  {isPending ? "Guardando…" : "Guardar"}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setInitialized(true)}
                data-ocid="quote_detail.edit_button"
                className="gap-2"
              >
                <FileText className="size-4" aria-hidden="true" />
                Editar
              </Button>
            )}
            {!isNew ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotifyOpen(true)}
                data-ocid="quote_detail.notify_button"
                className="gap-2"
              >
                <Mail className="size-4" aria-hidden="true" />
                Notificar al cliente
              </Button>
            ) : null}
            {!isNew && quote ? (
              <WhatsAppNotifyButton
                contactKind={WhatsAppContactKind.customer}
                contactId={quote.customerId}
                context={WhatsAppContext.quote}
                referenceId={quote.id}
                contactName={
                  selectedCustomer?.name ??
                  `Cliente #${quote.customerId.toString()}`
                }
                variant="outline"
                size="sm"
                ocid="quote_detail.whatsapp_button"
              />
            ) : null}
            {!isNew ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                data-ocid="quote_detail.delete_button"
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Eliminar
              </Button>
            ) : null}
          </div>
        }
      />

      {formError ? (
        <div
          data-ocid="quote_detail.error_banner"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-xs text-destructive">{formError}</p>
        </div>
      ) : null}

      {isEditing ? (
        <div className="space-y-5">
          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <UserRound className="size-4 text-primary" aria-hidden="true" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <Label htmlFor="quote-customer-search">Buscar cliente</Label>
                <PickerSearch
                  value={customerSearch}
                  onChange={setCustomerSearch}
                  placeholder="Buscar por nombre, documento o teléfono…"
                  ariaLabel="Buscar cliente por nombre, documento o teléfono"
                  ocid="quote_detail.customer_search_input"
                />
                {customerTerm.length === 0 ? (
                  <PickerPrompt ocid="quote_detail.customer_search.prompt_state">
                    Escribe el nombre, el documento o el teléfono del cliente
                    para ver coincidencias.
                  </PickerPrompt>
                ) : customersQuery.isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : customersQuery.isError ? (
                  <p
                    data-ocid="quote_detail.customer_search.error_state"
                    className="text-xs text-destructive"
                  >
                    No se pudo cargar el directorio de clientes. Inténtalo de
                    nuevo.
                  </p>
                ) : customers.length === 0 ? (
                  <p
                    data-ocid="quote_detail.customer_search.empty_state"
                    className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground"
                  >
                    {`Sin clientes que coincidan con “${customerTerm}”.`}
                  </p>
                ) : (
                  <ul
                    data-ocid="quote_detail.customer_search.list"
                    className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border p-1"
                  >
                    {customers.map((customer, index) => {
                      const isSelected = customer.id === customerId;
                      return (
                        <li key={customer.id.toString()}>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerId(customer.id);
                              setFormError(null);
                            }}
                            aria-pressed={isSelected}
                            data-ocid={`quote_detail.customer_search.item.${index + 1}`}
                            className={
                              isSelected
                                ? "flex w-full items-center justify-between gap-3 rounded-sm border border-primary/40 bg-primary/5 px-2.5 py-2 text-left transition-colors focus-visible:outline-none"
                                : "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                            }
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {customer.name}
                              </span>
                              <span className="data-rail mt-0.5 block truncate text-xs text-muted-foreground">
                                {customer.phone}
                              </span>
                            </span>
                            {isSelected ? (
                              <Check
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
              </div>

              {selectedCustomer ? (
                <div
                  data-ocid="quote_detail.customer_selected"
                  className="flex items-start justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Cliente seleccionado
                    </p>
                    <p className="truncate text-sm font-medium">
                      {selectedCustomer.name}
                    </p>
                    <p className="data-rail truncate text-xs text-muted-foreground">
                      {selectedCustomer.phone}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCustomerId(null);
                      setFormError(null);
                    }}
                    aria-label="Quitar el cliente seleccionado"
                    data-ocid="quote_detail.clear_customer_button"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : null}

              {customerId !== null ? (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Bike className="size-3" aria-hidden="true" />
                    Motocicleta
                  </p>
                  {motorcyclesQuery.isLoading ? (
                    <Skeleton className="h-9 w-full" />
                  ) : selectedMotorcycle ? (
                    <p
                      data-ocid="quote_detail.motorcycle_summary"
                      className="flex h-9 items-center rounded-md border border-border bg-muted/20 px-3 text-xs"
                    >
                      {`${selectedMotorcycle.brand} ${selectedMotorcycle.model} · ${selectedMotorcycle.plate}`}
                    </p>
                  ) : (
                    <p
                      data-ocid="quote_detail.motorcycle_missing_state"
                      className="rounded-md border border-dashed border-warning/50 bg-warning/10 px-3 py-2.5 text-xs text-warning"
                    >
                      Este cliente no tiene motos registradas. Registra una moto
                      antes de guardar la cotización.
                    </p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <PartLinesEditor
            lines={partLines}
            onChange={setPartLines}
            onScanPart={handleScanPart}
          />
          <ServiceLinesEditor lines={serviceLines} onChange={setServiceLines} />

          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="font-display text-sm font-semibold tracking-tight">
                Notas y descuento
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_10rem]">
              <div className="space-y-2">
                <Label htmlFor="quote-notes">Notas para el cliente</Label>
                <Textarea
                  id="quote-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Condiciones, vigencia o comentarios de la cotización…"
                  data-ocid="quote_detail.notes_textarea"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote-discount">Descuento</Label>
                <Input
                  id="quote-discount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  data-ocid="quote_detail.discount_input"
                  className="data-rail"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-5">
          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <UserRound className="size-3" aria-hidden="true" />
                  Cliente
                </p>
                <p className="truncate text-sm font-medium">
                  {selectedCustomer?.name ??
                    `Cliente #${quote?.customerId.toString()}`}
                </p>
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <Bike className="size-3" aria-hidden="true" />
                  Motocicleta
                </p>
                <p className="truncate text-sm font-medium">
                  {selectedMotorcycle
                    ? `${selectedMotorcycle.brand} ${selectedMotorcycle.model}`
                    : `Moto #${quote?.motorcycleId.toString()}`}
                </p>
                {selectedMotorcycle ? (
                  <p className="data-rail text-xs text-muted-foreground">
                    {selectedMotorcycle.plate}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Repuestos
                </p>
                <p className="data-rail text-sm font-medium">
                  {formatMoney(view?.totals.partsSubtotal)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Servicios
                </p>
                <p className="data-rail text-sm font-medium">
                  {formatMoney(view?.totals.servicesSubtotal)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="font-display text-sm font-semibold tracking-tight">
                Partidas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <div className="space-y-4">
                <div>
                  <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <Package className="size-3" aria-hidden="true" />
                    Repuestos
                  </p>
                  {quote && quote.partLines.length > 0 ? (
                    <ul className="space-y-1.5">
                      {quote.partLines.map((line, index) => (
                        <li
                          key={line.id.toString()}
                          data-ocid={`quote_detail.part_item.${index + 1}`}
                          className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            {line.description}
                          </span>
                          <span className="data-rail shrink-0 text-muted-foreground">
                            {formatNumber(line.quantity)} ×{" "}
                            {formatMoney(line.unitPrice)} ={" "}
                            <span className="font-medium text-foreground">
                              {formatMoney(line.quantity * line.unitPrice)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sin repuestos en esta cotización.
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    <Wrench className="size-3" aria-hidden="true" />
                    Servicios
                  </p>
                  {quote && quote.serviceLines.length > 0 ? (
                    <ul className="space-y-1.5">
                      {quote.serviceLines.map((line, index) => (
                        <li
                          key={line.id.toString()}
                          data-ocid={`quote_detail.service_item.${index + 1}`}
                          className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            {line.description}
                          </span>
                          <span className="data-rail shrink-0 text-muted-foreground">
                            {formatNumber(line.quantity)} ×{" "}
                            {formatMoney(line.unitPrice)} ={" "}
                            <span className="font-medium text-foreground">
                              {formatMoney(line.quantity * line.unitPrice)}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sin servicios en esta cotización.
                    </p>
                  )}
                </div>

                {quote?.notes ? (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Notas
                      </p>
                      <p className="whitespace-pre-wrap text-sm">
                        {quote.notes}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          {!isNew ? (
            <Card className="gap-0 rounded-lg py-0 shadow-none">
              <CardHeader className="border-b border-border px-5 py-4">
                <CardTitle className="font-display text-sm font-semibold tracking-tight">
                  Estado de la cotización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-5">
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={option === status ? "default" : "outline"}
                      disabled={updateStatus.isPending || option === status}
                      onClick={() => handleStatusChange(option)}
                      data-ocid={`quote_detail.status_button.${option}`}
                    >
                      {QUOTE_STATUS_LABELS[option]}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {canConvert
                      ? "La cotización fue aceptada: puedes convertirla en orden de taller o factura."
                      : "Solo las cotizaciones aceptadas pueden convertirse en orden o factura."}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setConvertOpen(true)}
                    disabled={!canConvert}
                    data-ocid="quote_detail.convert_button"
                    className="gap-2"
                  >
                    <ArrowRight className="size-4" aria-hidden="true" />
                    Convertir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <Printer className="size-4 text-primary" aria-hidden="true" />
                Impresión
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={printFormat === "a4" ? "default" : "outline"}
                  onClick={() => setPrintFormat("a4")}
                  data-ocid="quote_detail.format_a4_button"
                >
                  A4
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={printFormat === "receipt80" ? "default" : "outline"}
                  onClick={() => setPrintFormat("receipt80")}
                  data-ocid="quote_detail.format_80mm_button"
                >
                  Tirilla 80 mm
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-5 py-5">
              <DocumentPreview
                title="Cotización"
                number={quote?.quoteNumber ?? "BORRADOR"}
                companyName={
                  companyHeader?.legalName ??
                  business?.name ??
                  "HR SOLUCIONES INTEGRALES"
                }
                companyLogoUrl={companyHeader?.logoUrl ?? companyLogoUrl}
                companyContact={companyContactLine(companyHeader)}
                companyFiscal={companyFiscalLines(companyHeader)}
                meta={documentMeta}
                lines={documentLines}
                totals={documentTotals}
                footer={quoteFooter}
                hopeMessage={hopeMessage}
                format={printFormat}
                ocid="quote_detail.document"
                onFormatChange={setPrintFormat}
                onDownloadPdf={handleDownloadPdf}
                isDownloading={isDownloading}
              />
              {downloadError ? (
                <div
                  data-ocid="quote_detail.download_error"
                  className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
                >
                  <p className="flex items-start gap-2 text-xs text-destructive">
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {downloadError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDownloadPdf(printFormat)}
                    data-ocid="quote_detail.download_retry_button"
                  >
                    Reintentar
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card
            data-ocid="quote_detail.totals.panel"
            className="gap-0 rounded-lg py-0 shadow-none"
          >
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="font-display text-sm font-semibold tracking-tight">
                Totales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-5 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Repuestos</span>
                <span className="data-rail">
                  {formatMoney(BigInt(liveTotals.partsSubtotal))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Servicios</span>
                <span className="data-rail">
                  {formatMoney(BigInt(liveTotals.servicesSubtotal))}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="data-rail">
                  {formatMoney(BigInt(liveTotals.subtotal))}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Descuento</span>
                <span className="data-rail">
                  −{formatMoney(BigInt(liveTotals.discount))}
                </span>
              </div>
              {isIvaResponsible ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Impuesto ({formatTaxRate(BigInt(liveTotals.taxRate))})
                  </span>
                  <span className="data-rail">
                    {formatMoney(BigInt(liveTotals.tax))}
                  </span>
                </div>
              ) : null}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold">
                  Total
                </span>
                <span
                  data-ocid="quote_detail.totals.total"
                  className="data-rail text-lg font-semibold text-primary"
                >
                  {formatMoney(BigInt(liveTotals.total))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-lg py-0 shadow-none">
            <CardHeader className="border-b border-border px-5 py-4">
              <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
                <Receipt
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-5 py-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Partidas</span>
                <span className="data-rail">
                  {formatNumber(partLines.length + serviceLines.length)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <StatusBadge
                  label={QUOTE_STATUS_LABELS[status]}
                  tone={QUOTE_STATUS_TONE[status]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="quote_detail.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cotización se quitará de
              forma permanente del registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="quote_detail.delete_cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="quote_detail.delete_confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={convertOpen} onOpenChange={setConvertOpen}>
        <AlertDialogContent data-ocid="quote_detail.convert_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir cotización</AlertDialogTitle>
            <AlertDialogDescription>
              Conserva el cliente, la moto y las partidas. Elige el destino de
              la conversión.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="convert-method">
                Método de pago (para factura)
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as PaymentMethod)
                }
              >
                <SelectTrigger
                  id="convert-method"
                  aria-label="Método de pago"
                  data-ocid="quote_detail.convert_method_select"
                  className="w-full"
                >
                  <SelectValue />
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

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleConvertToOrder}
                disabled={convertToOrder.isPending}
                data-ocid="quote_detail.convert_order_button"
                className="gap-2"
              >
                <Wrench className="size-4" aria-hidden="true" />
                {convertToOrder.isPending ? "Creando…" : "Orden de taller"}
              </Button>
              <Button
                type="button"
                onClick={handleConvertToInvoice}
                disabled={convertToInvoice.isPending}
                data-ocid="quote_detail.convert_invoice_button"
                className="gap-2"
              >
                <BadgeCheck className="size-4" aria-hidden="true" />
                {convertToInvoice.isPending ? "Generando…" : "Factura"}
              </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="quote_detail.convert_cancel_button">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isNew && quote ? (
        <NotifyCustomerDialog
          open={notifyOpen}
          onOpenChange={setNotifyOpen}
          customerId={quote.customerId}
          customerName={
            selectedCustomer?.name ?? `Cliente #${quote.customerId.toString()}`
          }
          customerEmail={
            selectedCustomer?.email?.trim() ? selectedCustomer.email : null
          }
          source={NotificationSource.quote}
          referenceId={quote.id}
          defaultSubject={`Estado de tu cotización ${quote.quoteNumber}`}
          defaultMessage={`Hola ${selectedCustomer?.name ?? "cliente"}, te compartimos el estado actual de tu cotización ${quote.quoteNumber}. Si deseas aprobarla o tienes alguna duda sobre las partidas, respóndenos a este correo y con gusto te ayudamos.`}
        />
      ) : null}
    </div>
  );
}

export default QuoteDetailPage;
