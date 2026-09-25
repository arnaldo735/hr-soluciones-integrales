import { DataTable } from "@/components/DataTable";
import { NotifyCustomerDialog } from "@/components/NotifyCustomerDialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusTone } from "@/components/StatusBadge";
import { WhatsAppNotifyButton } from "@/components/WhatsAppNotifyButton";
import { Button } from "@/components/ui/button";
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
import { useBackend } from "@/hooks/use-backend";
import {
  QUOTE_STATUS_LABELS,
  QuoteSort,
  useDeleteQuote,
  useQuoteLookups,
  useQuotes,
} from "@/hooks/use-quotes";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { DataColumn, Id, QuoteStatus, QuoteView } from "@/lib/types";
import {
  NotificationSource,
  QuoteStatus as QuoteStatusEnum,
  WhatsAppContactKind,
  WhatsAppContext,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

/** Design-token tone for each quote status. */
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

const SORT_OPTIONS: Array<{ value: QuoteSort; label: string }> = [
  { value: QuoteSort.createdAt, label: "Más recientes" },
  { value: QuoteSort.number, label: "Número" },
  { value: QuoteSort.customer, label: "Cliente" },
  { value: QuoteSort.total, label: "Total" },
];

interface QuoteSearch {
  q?: string;
  estado?: string;
  orden?: string;
  pagina?: number;
}

/**
 * Resolves the registered email of each customer referenced by a page of
 * quotes. `listQuotes` returns only ids, so the notification action needs a
 * lookup pass to know whether the recipient has an email on file.
 */
function useQuoteCustomerEmails(customerIds: Id[]) {
  const { actor, isFetching } = useBackend();
  const key = customerIds
    .map((id) => id.toString())
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["quote-customer-emails", key],
    queryFn: async (): Promise<Map<string, string | null>> => {
      const emails = new Map<string, string | null>();
      if (!actor) return emails;
      const unique = Array.from(
        new Set(customerIds.map((id) => id.toString())),
      );
      const results = await Promise.all(
        unique.map(async (id) => {
          const customer = await actor.getCustomer(BigInt(id));
          return { id, email: customer?.email?.trim() ?? "" };
        }),
      );
      for (const entry of results) {
        emails.set(entry.id, entry.email === "" ? null : entry.email);
      }
      return emails;
    },
    enabled: !!actor && !isFetching,
    // Customer emails change rarely; the per-page lookup is reused while the
    // page stays in the cache instead of re-fanning out on every visit.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/** Normalizes the raw URL search params into a fully-resolved filter state. */
function resolveSearch(raw: Record<string, unknown>): Required<QuoteSearch> {
  const pagina = Number(raw.pagina);
  const estado =
    typeof raw.estado === "string" &&
    STATUS_OPTIONS.includes(raw.estado as QuoteStatus)
      ? raw.estado
      : "";
  const orden =
    typeof raw.orden === "string" &&
    SORT_OPTIONS.some((option) => option.value === raw.orden)
      ? raw.orden
      : QuoteSort.createdAt;
  return {
    q: typeof raw.q === "string" ? raw.q : "",
    estado,
    orden,
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1,
  };
}

export function QuotesPage() {
  const navigate = useNavigate();
  const rawSearch = useSearch({ strict: false }) as Record<string, unknown>;
  const search = useMemo(() => resolveSearch(rawSearch), [rawSearch]);

  const [term, setTerm] = useState(search.q);
  const [notifyTarget, setNotifyTarget] = useState<{
    customerId: Id;
    customerName: string;
    customerEmail: string | null;
    quoteId: Id;
    quoteNumber: string;
  } | null>(null);

  // Keep the input in sync when the URL changes from outside (back/forward).
  useEffect(() => {
    setTerm(search.q);
  }, [search.q]);

  const applySearch = useCallback(
    (patch: Partial<QuoteSearch>) => {
      void navigate({
        to: "/cotizaciones",
        search: (prev: Record<string, unknown>) => {
          const next: Record<string, unknown> = { ...prev, ...patch };
          for (const key of Object.keys(next)) {
            const value = next[key];
            if (value === "" || value === undefined || value === false) {
              delete next[key];
            }
          }
          return next;
        },
        replace: true,
      });
    },
    [navigate],
  );

  // Debounce the free-text term into the URL so typing stays responsive.
  useEffect(() => {
    if (term === search.q) return;
    const handle = window.setTimeout(() => {
      applySearch({ q: term, pagina: 1 });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [term, search.q, applySearch]);

  const status = (search.estado || null) as QuoteStatus | null;
  const sort = search.orden as QuoteSort;

  const quotesQuery = useQuotes({
    status,
    search: search.q,
    sort,
    page: search.pagina,
    pageSize: PAGE_SIZE,
  });

  const deleteQuote = useDeleteQuote();

  const items = quotesQuery.data?.items ?? [];
  const total = Number(quotesQuery.data?.total ?? 0n);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = search.q !== "" || search.estado !== "";

  const customerIds = useMemo(
    () => items.map((view) => view.quote.customerId),
    [items],
  );
  const motorcycleIds = useMemo(
    () => items.map((view) => view.quote.motorcycleId),
    [items],
  );
  const lookupsQuery = useQuoteLookups(customerIds, motorcycleIds);
  const customerNames = lookupsQuery.data?.customers;
  const motorcyclePlates = lookupsQuery.data?.motorcycles;

  const emailsQuery = useQuoteCustomerEmails(customerIds);
  const customerEmails = emailsQuery.data;

  const openNotify = (view: QuoteView) => {
    const quote = view.quote;
    setNotifyTarget({
      customerId: quote.customerId,
      customerName:
        customerNames?.get(quote.customerId.toString()) ??
        `Cliente #${quote.customerId.toString()}`,
      customerEmail: customerEmails?.get(quote.customerId.toString()) ?? null,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
    });
  };

  const clearFilters = () => {
    setTerm("");
    void navigate({ to: "/cotizaciones", search: {}, replace: true });
  };

  const handleDelete = (view: QuoteView) => {
    deleteQuote.mutate(view.quote.id, {
      onSuccess: () => {
        toast.success(`Cotización ${view.quote.quoteNumber} eliminada`);
      },
      onError: () => {
        toast.error("No se pudo eliminar la cotización. Intenta de nuevo.");
      },
    });
  };

  const columns: Array<DataColumn<QuoteView>> = [
    {
      key: "number",
      header: "Número",
      render: (view) => (
        <button
          type="button"
          onClick={() =>
            void navigate({
              to: "/cotizaciones/$id",
              params: { id: view.quote.id.toString() },
            })
          }
          className="data-rail text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {view.quote.quoteNumber}
        </button>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      render: (view) => (
        <span className="block max-w-[220px] truncate font-medium">
          {customerNames?.get(view.quote.customerId.toString()) ??
            `Cliente #${view.quote.customerId.toString()}`}
        </span>
      ),
    },
    {
      key: "motorcycle",
      header: "Moto",
      render: (view) => (
        <span className="data-rail text-muted-foreground">
          {motorcyclePlates?.get(view.quote.motorcycleId.toString()) ??
            `#${view.quote.motorcycleId.toString()}`}
        </span>
      ),
    },
    {
      key: "date",
      header: "Fecha",
      render: (view) => (
        <span className="text-muted-foreground">
          {formatDate(view.quote.createdAt)}
        </span>
      ),
    },
    {
      key: "parts",
      header: "Repuestos",
      numeric: true,
      render: (view) => (
        <span className="data-rail text-muted-foreground">
          {formatMoney(view.totals.partsSubtotal)}
        </span>
      ),
    },
    {
      key: "services",
      header: "Servicios",
      numeric: true,
      render: (view) => (
        <span className="data-rail text-muted-foreground">
          {formatMoney(view.totals.servicesSubtotal)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      numeric: true,
      render: (view) => (
        <span className="data-rail font-semibold">
          {formatMoney(view.totals.total)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (view) => (
        <StatusBadge
          label={QUOTE_STATUS_LABELS[view.quote.status]}
          tone={QUOTE_STATUS_TONE[view.quote.status]}
        />
      ),
    },
  ];

  return (
    <div
      data-ocid="quotes.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Ventas"
        title="Cotizaciones"
        description="Presupuestos de repuestos y servicios para tus clientes, con conversión a orden de taller o factura."
        actions={
          <Button
            type="button"
            onClick={() => void navigate({ to: "/cotizaciones/nueva" })}
            data-ocid="quotes.new_button"
            className="gap-2"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nueva cotización
          </Button>
        }
        toolbar={
          <>
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar por número o cliente…"
                aria-label="Buscar cotizaciones"
                className="pl-9"
                data-ocid="quotes.search_input"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="quotes-status"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Estado
              </Label>
              <Select
                value={search.estado === "" ? "all" : search.estado}
                onValueChange={(value) =>
                  applySearch({
                    estado: value === "all" ? "" : value,
                    pagina: 1,
                  })
                }
              >
                <SelectTrigger
                  id="quotes-status"
                  aria-label="Filtrar por estado"
                  data-ocid="quotes.status_select"
                  className="w-[170px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {QUOTE_STATUS_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="quotes-sort"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Ordenar
              </Label>
              <Select
                value={sort}
                onValueChange={(value) =>
                  applySearch({ orden: value, pagina: 1 })
                }
              >
                <SelectTrigger
                  id="quotes-sort"
                  aria-label="Ordenar cotizaciones"
                  data-ocid="quotes.sort_select"
                  className="w-[170px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasFilters ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                data-ocid="quotes.clear_filters_button"
                className="gap-2 text-muted-foreground"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Limpiar
              </Button>
            ) : null}
          </>
        }
      />

      {quotesQuery.isError ? (
        <div
          data-ocid="quotes.error_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-14 text-center shadow-subtle"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No se pudieron cargar las cotizaciones.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void quotesQuery.refetch({ cancelRefetch: true })}
            data-ocid="quotes.retry_button"
          >
            Reintentar
          </Button>
        </div>
      ) : quotesQuery.isLoading ? (
        <div
          data-ocid="quotes.loading_state"
          className="space-y-2 rounded-lg border border-border bg-card p-4 shadow-subtle"
        >
          {Array.from({ length: 6 }, (_, index) => `row-${index}`).map((id) => (
            <Skeleton key={id} className="h-9 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          data-ocid="quotes.empty_state"
          className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center shadow-subtle"
        >
          <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted">
            <FileText
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold">
              {hasFilters ? "Sin resultados" : "Aún no hay cotizaciones"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {hasFilters
                ? "Ajusta la búsqueda o el estado para encontrar cotizaciones."
                : "Crea la primera cotización seleccionando cliente, moto y las partidas de repuestos y servicios."}
            </p>
          </div>
          {hasFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              data-ocid="quotes.empty_clear_button"
            >
              Limpiar filtros
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void navigate({ to: "/cotizaciones/nueva" })}
              data-ocid="quotes.empty_new_button"
              className="gap-2"
            >
              <Plus className="size-4" aria-hidden="true" />
              Nueva cotización
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          ocid="quotes"
          columns={columns}
          rows={items}
          rowKey={(view) => view.quote.id.toString()}
          caption={
            quotesQuery.isLoading
              ? "Cargando…"
              : `${formatNumber(total)} cotización${total === 1 ? "" : "es"}`
          }
          onRowClick={(view) =>
            void navigate({
              to: "/cotizaciones/$id",
              params: { id: view.quote.id.toString() },
            })
          }
          actions={[
            {
              kind: "edit",
              label: "Editar cotización",
              onClick: (view) =>
                void navigate({
                  to: "/cotizaciones/$id",
                  params: { id: view.quote.id.toString() },
                }),
            },
            {
              kind: "save",
              label: "Notificar al cliente",
              onClick: openNotify,
            },
            {
              kind: "delete",
              label: "Eliminar cotización",
              onClick: handleDelete,
              disabled: () => deleteQuote.isPending,
            },
          ]}
          rowExtraActions={(view, index) => (
            <WhatsAppNotifyButton
              contactKind={WhatsAppContactKind.customer}
              contactId={view.quote.customerId}
              context={WhatsAppContext.quote}
              referenceId={view.quote.id}
              contactName={
                customerNames?.get(view.quote.customerId.toString()) ??
                `Cliente #${view.quote.customerId.toString()}`
              }
              ocid={`quotes.whatsapp_button.${index + 1}`}
            />
          )}
        />
      )}

      {!quotesQuery.isLoading && !quotesQuery.isError && total > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Página {search.pagina} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={search.pagina <= 1}
              onClick={() => applySearch({ pagina: search.pagina - 1 })}
              data-ocid="quotes.pagination_prev"
              className="gap-1"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={search.pagina >= totalPages}
              onClick={() => applySearch({ pagina: search.pagina + 1 })}
              data-ocid="quotes.pagination_next"
              className="gap-1"
            >
              Siguiente
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      {notifyTarget ? (
        <NotifyCustomerDialog
          open
          onOpenChange={(next) => {
            if (!next) setNotifyTarget(null);
          }}
          customerId={notifyTarget.customerId}
          customerName={notifyTarget.customerName}
          customerEmail={notifyTarget.customerEmail}
          source={NotificationSource.quote}
          referenceId={notifyTarget.quoteId}
          defaultSubject={`Estado de tu cotización ${notifyTarget.quoteNumber}`}
          defaultMessage={`Hola ${notifyTarget.customerName}, te compartimos el estado actual de tu cotización ${notifyTarget.quoteNumber}. Si deseas aprobarla o tienes alguna duda sobre las partidas, respóndenos a este correo y con gusto te ayudamos.`}
        />
      ) : null}
    </div>
  );
}

export default QuotesPage;
