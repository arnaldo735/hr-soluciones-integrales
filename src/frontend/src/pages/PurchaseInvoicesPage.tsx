import { InvoiceSort as InvoiceSortEnum } from "@/backend";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { PageHeader } from "@/components/PageHeader";
import { PurchaseInvoiceList } from "@/components/purchase-invoices-history/PurchaseInvoiceList";
import { InvoiceResultSummary } from "@/components/purchase-invoices/invoice-result-summary";
import {
  InvoiceReviewPanel,
  type ReviewHeader,
  type ReviewLine,
  centsToPesosInput,
  computeLineTotalCents,
  parsePercentInput,
  parsePesosToCents,
  parseQuantityInput,
} from "@/components/purchase-invoices/invoice-review-panel";
import {
  InvoiceUploadList,
  type UploadItem,
} from "@/components/purchase-invoices/invoice-upload-list";
import { uploadInvoiceFile } from "@/components/purchase-invoices/upload-invoice-file";
import {
  UploadZone,
  prepareInvoiceFile,
} from "@/components/purchase-invoices/upload-zone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import {
  useConfirmPurchaseInvoice,
  useCreatePurchaseInvoiceDraft,
  useCreateSupplier,
  useRunPurchaseInvoiceExtraction,
  useUpdatePurchaseInvoiceReview,
} from "@/hooks/use-purchase-invoices";
import { colombiaDateInput, colombiaStartOfDay } from "@/lib/format";
import type {
  Id,
  InvoiceApplyResult,
  InvoiceSort,
  PartView,
  PurchaseInvoice,
  PurchaseInvoiceStatus,
  Supplier,
} from "@/lib/types";
import {
  ExtractionStatus,
  InvoiceFileKind,
  LineMatchStatus,
  PurchaseInvoiceStatus as PurchaseInvoiceStatusEnum,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  FileText,
  History,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

/** Stable client-side key for a queue item or review line. */
let keyCounter = 0;
function nextKey(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

/** True when the file is a PDF, false for a supported image. */
function isPdfFile(file: File): boolean {
  return file.type === "application/pdf";
}

/** Spanish message from a backend rejection or a generic failure. */
function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) return error;
  return fallback;
}

/**
 * Normalizes a Colombian-formatted amount ("1.234.567,89", "$ 12.500") into the
 * plain `1234567.89` shape the editable cost input expects. The backend already
 * converts extracted amounts to integer cents, so this only guards the review
 * table against a raw formatted string reaching the input.
 */
function normalizePesosInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (cleaned === "") return "";
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  // The rightmost separator is the decimal one; the rest are thousands marks.
  const decimalIndex = Math.max(lastComma, lastDot);
  if (decimalIndex === -1) return cleaned;
  const whole = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
  const fraction = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, "");
  return fraction === "" ? whole : `${whole}.${fraction}`;
}

/** Maps a backend invoice to the editable review state. */
function toReviewLines(invoice: PurchaseInvoice): ReviewLine[] {
  return invoice.lines.map((line) => ({
    key: nextKey("line"),
    id: line.id,
    code: line.code,
    description: line.description,
    quantity: line.quantity.toString(),
    unitCost: normalizePesosInput(centsToPesosInput(line.unitCost)),
    taxRate: line.taxRate.toString(),
    discountRate: line.discountRate.toString(),
    total: normalizePesosInput(centsToPesosInput(line.total)),
    matchStatus: line.matchStatus,
  }));
}

/** Maps a backend invoice to the editable header state. */
function toReviewHeader(invoice: PurchaseInvoice): ReviewHeader {
  return {
    supplierId: invoice.supplierId ?? null,
    supplierName: invoice.supplierName ?? "",
    supplierTaxId: invoice.supplierTaxId ?? "",
    invoiceNumber: invoice.invoiceNumber ?? "",
    invoiceDate: colombiaDateInput(invoice.invoiceDate),
    paymentMethod: invoice.paymentMethod ?? "",
    paymentMeans: invoice.paymentMeans ?? "",
  };
}

/** Empty header used when the extraction could not read the document. */
function emptyReviewHeader(): ReviewHeader {
  return {
    supplierId: null,
    supplierName: "",
    supplierTaxId: "",
    invoiceNumber: "",
    invoiceDate: "",
    paymentMethod: "",
    paymentMeans: "",
  };
}

/** Spanish notice shown when the extraction failed or returned no lines. */
const EXTRACTION_NOTICE =
  "No se pudieron leer los datos del documento. Puedes completar el proveedor, el número, la fecha y las líneas manualmente antes de confirmar.";

/**
 * Friendly Spanish message shown when the automatic analysis is unavailable or
 * fails. It never exposes technical details (environment variables, canister
 * traps) to the end user.
 */
const EXTRACTION_UNAVAILABLE_MESSAGE =
  "No se pudo analizar automáticamente. Completa los datos manualmente o sube una foto de la factura.";

/**
 * True when a backend error message leaks technical detail (an environment
 * variable name, a canister trap code, a stack frame) instead of a readable
 * Spanish explanation. Those messages are replaced by the friendly fallback.
 */
function isTechnicalErrorMessage(message: string): boolean {
  return (
    /CAFFEINE_[A-Z_]*API_KEY/i.test(message) ||
    /IC0\d{3}/i.test(message) ||
    /\btrap\b/i.test(message) ||
    /\bReject(ed)?\b/i.test(message) ||
    /is not set/i.test(message)
  );
}

/**
 * Spanish message for a failed automatic extraction. A readable backend message
 * is kept; a technical one is replaced by the friendly fallback so the user is
 * never shown an environment variable name or a canister trap.
 */
function extractionFailureMessage(error: unknown): string {
  const raw = errorMessage(error, EXTRACTION_UNAVAILABLE_MESSAGE);
  return isTechnicalErrorMessage(raw) ? EXTRACTION_UNAVAILABLE_MESSAGE : raw;
}

/** True when an extraction produced no usable data (failed or zero lines). */
function extractionReturnedNothing(invoice: PurchaseInvoice): boolean {
  return (
    invoice.extractionStatus === ExtractionStatus.failed ||
    invoice.lines.length === 0
  );
}

type PageTab = "cargar" | "historial";

const TABS: Array<{ value: PageTab; label: string; icon: typeof FileText }> = [
  { value: "cargar", label: "Cargar y revisar", icon: FileText },
  { value: "historial", label: "Historial", icon: History },
];

export function PurchaseInvoicesPage() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const createDraft = useCreatePurchaseInvoiceDraft();
  const runExtraction = useRunPurchaseInvoiceExtraction();
  const updateReview = useUpdatePurchaseInvoiceReview();
  const confirmInvoice = useConfirmPurchaseInvoice();
  const createSupplier = useCreateSupplier();

  const [tab, setTab] = useState<PageTab>("cargar");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [header, setHeader] = useState<ReviewHeader | null>(null);
  const [lines, setLines] = useState<ReviewLine[]>([]);
  const [result, setResult] = useState<InvoiceApplyResult | null>(null);
  const [wasAlreadyConfirmed, setWasAlreadyConfirmed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  // Scan-to-line flow: the dialog is open and the line it will fill.
  const [scanOpen, setScanOpen] = useState(false);
  const [scanLineKey, setScanLineKey] = useState<string | null>(null);

  // History tab state, kept on the page so switching tabs preserves filters.
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatus, setHistoryStatus] =
    useState<PurchaseInvoiceStatus | null>(null);
  const [historySupplierId, setHistorySupplierId] = useState<Id | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historySort, setHistorySort] = useState<InvoiceSort>(
    InvoiceSortEnum.createdAt,
  );

  // The active invoice id is the source of truth for save/confirm calls.
  const activeInvoiceId = useMemo(() => {
    const item = items.find((entry) => entry.key === activeKey);
    return item?.invoiceId ?? null;
  }, [items, activeKey]);

  const activeItem = items.find((entry) => entry.key === activeKey) ?? null;
  const isConfirmed = result !== null;
  const busy =
    updateReview.isPending ||
    confirmInvoice.isPending ||
    createSupplier.isPending;

  // Keep the latest queue in a ref so the async upload loop never reads stale
  // state when several files are processed in one batch.
  const itemsRef = useRef<UploadItem[]>([]);
  itemsRef.current = items;

  // The active key is mirrored in a ref so an async batch can decide
  // synchronously whether its file actually became the active one before it
  // writes the editable review state.
  const activeKeyRef = useRef<string | null>(null);
  activeKeyRef.current = activeKey;

  // Header returned by the extraction for each queue item, keyed by item key.
  // A failed extraction still keeps whatever the document did yield so the
  // manual review can restore it instead of starting from an empty header.
  const extractedHeadersRef = useRef<Map<string, ReviewHeader>>(new Map());

  /**
   * Makes `key` the active item only when no other file is active yet (first
   * wins) and reports whether it won. The editable header/lines must be written
   * only by the winner so the panel content always matches `activeInvoiceId`.
   */
  const claimActiveKey = useCallback((key: string): boolean => {
    if (activeKeyRef.current !== null) return false;
    activeKeyRef.current = key;
    setActiveKey(key);
    return true;
  }, []);

  /**
   * Makes `key` the active item unconditionally. Used by explicit user actions
   * (review, retry) where the clicked file must always win over the current one.
   */
  const forceActiveKey = useCallback((key: string) => {
    activeKeyRef.current = key;
    setActiveKey(key);
  }, []);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", "invoice-review"],
    queryFn: async (): Promise<Supplier[]> => {
      if (!actor) return [];
      return actor.listSuppliers(token, null);
    },
    enabled: !!actor && !isFetching,
  });

  const patchItem = useCallback((key: string, patch: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((entry) =>
        entry.key === key ? { ...entry, ...patch } : entry,
      ),
    );
  }, []);

  /** Uploads one file, creates its draft and runs the extraction. */
  const processFile = useCallback(
    async (key: string, file: File) => {
      // The draft id is tracked outside the try so a rejected extraction can
      // still open the manual review on the invoice that was already created.
      let draftId: Id | null = null;
      try {
        patchItem(key, { status: "uploading", progress: 0, error: undefined });
        const uploaded = await uploadInvoiceFile(file, (percentage) => {
          patchItem(key, { progress: percentage });
        });

        patchItem(key, { status: "extracting", progress: 100 });
        const draft = await createDraft.mutateAsync({
          kind: isPdfFile(file) ? InvoiceFileKind.pdf : InvoiceFileKind.image,
          mimeType: uploaded.mimeType,
          fileName: uploaded.fileName,
          objectId: uploaded.objectId,
          sizeBytes: uploaded.sizeBytes,
          gatewayUrl: uploaded.gatewayUrl,
          projectId: uploaded.projectId,
        });
        draftId = draft.id;

        const extracted = await runExtraction.mutateAsync(draft.id);
        patchItem(key, { invoiceId: extracted.id });

        // Remember what the extraction returned (even when it is empty) so the
        // manual review can restore the detected header later.
        extractedHeadersRef.current.set(key, toReviewHeader(extracted));

        if (extractionReturnedNothing(extracted)) {
          // The document could not be read, but the user must always be able to
          // review and continue: open the panel with an editable header (using
          // whatever the extraction did return) and an empty line table so the
          // invoice can be completed by hand.
          patchItem(key, {
            status: "failed",
            extractionFailed: true,
            error:
              extracted.extractionError ??
              "No se pudieron leer los datos de la factura.",
          });
          // Only the file that actually becomes active may write the editable
          // review state, otherwise a parallel batch would show one file's data
          // while activeInvoiceId points at another.
          if (claimActiveKey(key)) {
            setHeader(toReviewHeader(extracted));
            setLines([]);
            setResult(null);
            setValidationError(null);
          }
          return;
        }

        patchItem(key, {
          status: "ready",
          error: undefined,
          extractionFailed: false,
        });
        // Open the first ready invoice automatically so the user lands on the
        // review table without an extra click.
        if (claimActiveKey(key)) {
          setHeader(toReviewHeader(extracted));
          setLines(toReviewLines(extracted));
          setResult(null);
          setValidationError(null);
        }
      } catch (error) {
        // A rejected extraction (canister trap, timeout, network error) must
        // never block the flow: when the draft already exists the invoice stays
        // reviewable, so the panel opens with an editable header and an empty
        // line table and the user can complete the data by hand or upload a
        // photo. Only a failure before the draft exists is a hard upload error.
        if (draftId !== null) {
          patchItem(key, {
            invoiceId: draftId,
            status: "failed",
            extractionFailed: true,
            error: extractionFailureMessage(error),
          });
          if (claimActiveKey(key)) {
            setHeader(emptyReviewHeader());
            setLines([]);
            setResult(null);
            setValidationError(null);
          }
          return;
        }
        patchItem(key, {
          status: "failed",
          error: errorMessage(
            error,
            "No se pudo procesar la factura. Inténtalo de nuevo.",
          ),
        });
      }
    },
    [createDraft, runExtraction, patchItem, claimActiveKey],
  );

  /** Validates and enqueues a batch of dropped or picked files. */
  const handleFiles = useCallback(
    (files: File[]) => {
      void (async () => {
        const accepted: Array<{ key: string; file: File }> = [];
        const rejected: string[] = [];

        for (const file of files) {
          // Images over the limit are downscaled before validation so ordinary
          // phone photos fit the backend's single-outcall download cap.
          const prepared = await prepareInvoiceFile(file);
          if ("error" in prepared) {
            rejected.push(prepared.error);
            continue;
          }
          accepted.push({ key: nextKey("upload"), file: prepared.file });
        }

        if (rejected.length > 0) {
          setBatchError(rejected.join(" "));
        } else {
          setBatchError(null);
        }

        if (accepted.length === 0) return;

        setItems((current) => [
          ...current,
          ...accepted.map(({ key, file }) => ({
            key,
            fileName: file.name,
            isPdf: isPdfFile(file),
            progress: 0,
            status: "uploading" as const,
          })),
        ]);

        for (const { key, file } of accepted) {
          void processFile(key, file);
        }
      })();
    },
    [processFile],
  );

  const handleRetry = useCallback(
    (key: string) => {
      const item = itemsRef.current.find((entry) => entry.key === key);
      if (!item) return;
      // A retry re-runs the extraction on the existing draft when the upload
      // already succeeded; otherwise the file must be re-selected.
      if (item.invoiceId !== undefined) {
        patchItem(key, { status: "extracting", error: undefined });
        void runExtraction
          .mutateAsync(item.invoiceId)
          .then((invoice) => {
            extractedHeadersRef.current.set(key, toReviewHeader(invoice));
            if (extractionReturnedNothing(invoice)) {
              // A retry that still cannot read the document keeps the invoice
              // reviewable so the user can complete it manually.
              patchItem(key, {
                status: "failed",
                extractionFailed: true,
                error:
                  invoice.extractionError ??
                  "No se pudieron leer los datos de la factura.",
              });
              forceActiveKey(key);
              setHeader(toReviewHeader(invoice));
              setLines([]);
              setResult(null);
              setValidationError(null);
              return;
            }
            patchItem(key, {
              status: "ready",
              error: undefined,
              extractionFailed: false,
            });
            forceActiveKey(key);
            setHeader(toReviewHeader(invoice));
            setLines(toReviewLines(invoice));
            setResult(null);
            setValidationError(null);
          })
          .catch((error) => {
            // A rejected retry (trap, timeout, network error) keeps the invoice
            // reviewable: the panel opens with an editable header and an empty
            // line table so the user can complete the data by hand.
            patchItem(key, {
              status: "failed",
              extractionFailed: true,
              error: extractionFailureMessage(error),
            });
            forceActiveKey(key);
            setHeader(
              extractedHeadersRef.current.get(key) ?? emptyReviewHeader(),
            );
            setLines([]);
            setResult(null);
            setValidationError(null);
          });
        return;
      }
      patchItem(key, {
        status: "failed",
        error:
          "Vuelve a seleccionar el archivo para reintentar la carga desde el inicio.",
      });
    },
    [patchItem, runExtraction, forceActiveKey],
  );

  const handleRemove = useCallback((key: string) => {
    setItems((current) => current.filter((entry) => entry.key !== key));
    extractedHeadersRef.current.delete(key);
    if (activeKeyRef.current === key) {
      activeKeyRef.current = null;
      setActiveKey(null);
    }
  }, []);

  const handleReview = useCallback(
    (key: string) => {
      const item = itemsRef.current.find((entry) => entry.key === key);
      if (!item?.invoiceId) return;
      forceActiveKey(key);
      setResult(null);
      setValidationError(null);
      // A failed extraction has no readable lines, but the header the
      // extraction did return (supplier, number, date) is preserved so the
      // manual review does not lose the detected data.
      if (item.extractionFailed) {
        setHeader(extractedHeadersRef.current.get(key) ?? emptyReviewHeader());
        setLines([]);
        return;
      }
      if (!actor) return;
      void actor
        .getPurchaseInvoice(token, item.invoiceId)
        .then((invoice) => {
          if (!invoice) return;
          setHeader(toReviewHeader(invoice));
          setLines(toReviewLines(invoice));
        })
        .catch(() => {
          toast.error("No se pudo cargar la factura para revisión.");
        });
    },
    [actor, token, forceActiveKey],
  );

  const handleHeaderChange = useCallback((patch: Partial<ReviewHeader>) => {
    setHeader((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const handleLineChange = useCallback(
    (key: string, patch: Partial<ReviewLine>) => {
      setLines((current) =>
        current.map((line) =>
          line.key === key ? { ...line, ...patch } : line,
        ),
      );
    },
    [],
  );

  const handleAddLine = useCallback(() => {
    setLines((current) => [
      ...current,
      {
        key: nextKey("line"),
        code: "",
        description: "",
        quantity: "1",
        unitCost: "0",
        taxRate: "0",
        discountRate: "0",
        total: "0.00",
        matchStatus: LineMatchStatus.new,
      },
    ]);
  }, []);

  const handleRemoveLine = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);

  /** Opens the scanner for a specific review line. */
  const handleOpenScan = useCallback((key: string) => {
    setScanLineKey(key);
    setScanOpen(true);
  }, []);

  const handleScanOpenChange = useCallback((open: boolean) => {
    setScanOpen(open);
    if (!open) setScanLineKey(null);
  }, []);

  /**
   * Assigns a scanned or manually typed code to the line the scanner was opened
   * for. The scanner already resolved the code through the backend
   * `findPartByCode` (barcode or SKU), so the resolved part is applied directly
   * without a second backend lookup; an unknown code shows the "producto no
   * encontrado" notice and adds nothing.
   */
  const handleScanCode = useCallback(
    (part: PartView): void => {
      const key = scanLineKey;
      if (key === null) return;
      setLines((current) =>
        current.map((line) =>
          line.key === key
            ? {
                ...line,
                code: part.sku,
                description: part.name,
                unitCost: centsToPesosInput(part.costPrice),
                matchStatus: LineMatchStatus.existing,
              }
            : line,
        ),
      );
      toast.success(`${part.name} asignado a la línea`);
      setScanOpen(false);
    },
    [scanLineKey],
  );

  /**
   * Resolves the supplier for the review. When the user typed a new supplier
   * name, an existing supplier with the same name is reused; otherwise the
   * supplier is created so it enters the directory and the history filter can
   * find the invoice. Returns `null` when the name is missing or creation fails.
   */
  const resolveSupplierId = useCallback(
    async (name: string): Promise<Id | null> => {
      const trimmed = name.trim();
      if (trimmed === "") {
        setValidationError("Escribe el nombre del proveedor nuevo.");
        return null;
      }
      const existing = suppliersQuery.data ?? [];
      const match = existing.find(
        (supplier) =>
          supplier.name.trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (match) return match.id;
      try {
        const created = await createSupplier.mutateAsync({
          name: trimmed,
          phone: "",
        });
        return created.id;
      } catch (error) {
        setValidationError(
          errorMessage(error, "No se pudo crear el proveedor nuevo."),
        );
        return null;
      }
    },
    [createSupplier, suppliersQuery.data],
  );

  /** Validates the review and returns the payload the backend expects. */
  const buildReviewInput = useCallback(async () => {
    if (!header) return null;
    if (header.supplierId === null && header.supplierName.trim() === "") {
      setValidationError(
        "Selecciona un proveedor existente o escribe el nombre del proveedor nuevo.",
      );
      return null;
    }
    if (lines.length === 0) {
      setValidationError("Añade al menos una línea a la factura.");
      return null;
    }
    const parsed = lines.map((line) => ({
      id: line.id,
      code: line.code.trim(),
      description: line.description.trim(),
      quantity: parseQuantityInput(line.quantity),
      unitCost: parsePesosToCents(line.unitCost),
      taxRate: parsePercentInput(line.taxRate) ?? 0n,
      discountRate: parsePercentInput(line.discountRate) ?? 0n,
      total: parsePesosToCents(line.total),
    }));
    const invalidIndex = parsed.findIndex(
      (line) =>
        line.code === "" ||
        line.quantity === null ||
        line.quantity === 0n ||
        line.unitCost === null,
    );
    if (invalidIndex >= 0) {
      setValidationError(
        `Revisa la línea ${invalidIndex + 1}: el código, la cantidad (mayor que cero) y el costo son obligatorios.`,
      );
      return null;
    }

    // A new supplier must exist in the directory before the invoice references
    // it, so the history supplier filter can match on supplierId.
    let supplierId = header.supplierId;
    if (supplierId === null) {
      supplierId = await resolveSupplierId(header.supplierName);
      if (supplierId === null) return null;
      setHeader((current) => (current ? { ...current, supplierId } : current));
    }

    setValidationError(null);
    return {
      header: {
        supplierId,
        supplierName: undefined,
        supplierTaxId: header.supplierTaxId.trim(),
        invoiceNumber:
          header.invoiceNumber.trim() === ""
            ? undefined
            : header.invoiceNumber.trim(),
        invoiceDate: header.invoiceDate
          ? (colombiaStartOfDay(header.invoiceDate) ?? undefined)
          : undefined,
        paymentMethod: header.paymentMethod.trim(),
        paymentMeans: header.paymentMeans.trim(),
      },
      lines: parsed.map((line) => {
        const quantity = line.quantity as bigint;
        const unitCost = line.unitCost as bigint;
        // An explicit total wins; otherwise it is derived from the other
        // fields so the backend always receives a line total in cents.
        const total =
          line.total ??
          computeLineTotalCents(
            quantity,
            unitCost,
            line.taxRate,
            line.discountRate,
          );
        return {
          id: line.id,
          code: line.code,
          description: line.description,
          quantity,
          unitCost,
          taxRate: line.taxRate,
          discountRate: line.discountRate,
          total,
        };
      }),
    };
  }, [header, lines, resolveSupplierId]);

  const handleSave = useCallback(() => {
    if (activeInvoiceId === null) return;
    void (async () => {
      const input = await buildReviewInput();
      if (!input) return;
      updateReview.mutate(
        { invoiceId: activeInvoiceId, input },
        {
          onSuccess: (invoice) => {
            setHeader(toReviewHeader(invoice));
            setLines(toReviewLines(invoice));
            toast.success("Revisión guardada");
          },
          onError: (error) => {
            setValidationError(
              errorMessage(error, "No se pudo guardar la revisión."),
            );
          },
        },
      );
    })();
  }, [activeInvoiceId, buildReviewInput, updateReview]);

  const handleConfirm = useCallback(() => {
    if (activeInvoiceId === null) return;

    const runConfirm = (alreadyConfirmed: boolean) => {
      confirmInvoice.mutate(activeInvoiceId, {
        onSuccess: (applyResult) => {
          setResult(applyResult);
          setWasAlreadyConfirmed(alreadyConfirmed);
          if (applyResult.failed > 0n) {
            toast.warning(
              `Factura confirmada con ${applyResult.failed} línea(s) con error.`,
            );
          } else {
            toast.success("Factura confirmada e inventario actualizado.");
          }
        },
        onError: (error) => {
          setValidationError(
            errorMessage(error, "No se pudo confirmar la factura."),
          );
        },
      });
    };

    void (async () => {
      const input = await buildReviewInput();
      if (!input) return;

      // A confirmed invoice rejects further review edits, so confirm directly
      // and let the backend return its stored result without touching inventory
      // again.
      if (activeItem?.status === "ready" && isConfirmed) {
        runConfirm(true);
        return;
      }

      // Persist the latest edits first so confirmation applies exactly what the
      // user sees, then confirm the invoice.
      updateReview.mutate(
        { invoiceId: activeInvoiceId, input },
        {
          onSuccess: (invoice) => {
            setHeader(toReviewHeader(invoice));
            setLines(toReviewLines(invoice));
            runConfirm(invoice.status === PurchaseInvoiceStatusEnum.confirmed);
          },
          onError: (error) => {
            setValidationError(
              errorMessage(error, "No se pudo guardar la revisión."),
            );
          },
        },
      );
    })();
  }, [
    activeInvoiceId,
    activeItem,
    isConfirmed,
    buildReviewInput,
    updateReview,
    confirmInvoice,
  ]);

  const handleDismissResult = useCallback(() => {
    setResult(null);
    setWasAlreadyConfirmed(false);
    activeKeyRef.current = null;
    setActiveKey(null);
    setHeader(null);
    setLines([]);
    setValidationError(null);
  }, []);

  return (
    <div
      data-ocid="purchase_invoices.page"
      className="mx-auto w-full max-w-7xl animate-fade-in space-y-5"
    >
      <PageHeader
        eyebrow="Compras"
        title="Facturas de compra"
        description="Sube la factura en PDF o foto, revisa los datos extraídos y confirma para actualizar el inventario con la entrada de stock."
      />

      <div
        role="tablist"
        aria-label="Secciones de facturas de compra"
        data-ocid="purchase_invoices.tabs"
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
      >
        {TABS.map(({ value, label, icon: Icon }) => {
          const selected = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(value)}
              data-ocid={`purchase_invoices.tab.${value}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                selected
                  ? "bg-card text-foreground shadow-subtle"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "historial" ? (
        <PurchaseInvoiceList
          page={historyPage}
          onPageChange={setHistoryPage}
          status={historyStatus}
          onStatusChange={(next) => {
            setHistoryStatus(next);
            setHistoryPage(1);
          }}
          supplierId={historySupplierId}
          onSupplierChange={(next) => {
            setHistorySupplierId(next);
            setHistoryPage(1);
          }}
          search={historySearch}
          onSearchChange={(next) => {
            setHistorySearch(next);
            setHistoryPage(1);
          }}
          sort={historySort}
          onSortChange={(next) => {
            setHistorySort(next);
            setHistoryPage(1);
          }}
        />
      ) : result ? (
        <InvoiceResultSummary
          result={result}
          wasAlreadyConfirmed={wasAlreadyConfirmed}
          onDismiss={handleDismissResult}
        />
      ) : (
        <>
          <UploadZone onFiles={handleFiles} />

          {batchError ? (
            <p
              data-ocid="purchase_invoices.batch_error"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>{batchError}</span>
            </p>
          ) : null}

          <InvoiceUploadList
            items={items}
            onRetry={handleRetry}
            onRemove={handleRemove}
            onReview={handleReview}
            activeKey={activeKey}
          />

          {activeItem?.extractionFailed ? (
            <section
              data-ocid="purchase_invoices.extraction_failed"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 size-5 shrink-0 text-warning"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="font-display text-sm font-semibold">
                    No se pudieron leer los datos del documento
                  </p>
                  <p className="max-w-xl text-xs text-muted-foreground">
                    {activeItem.error ? `${activeItem.error} ` : ""}
                    Puedes completar la factura manualmente en la revisión o
                    reintentar el análisis.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRetry(activeItem.key)}
                  data-ocid="purchase_invoices.failed_retry_button"
                  className="gap-1.5"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Reintentar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleReview(activeItem.key)}
                  data-ocid="purchase_invoices.manual_button"
                  className="gap-1.5"
                >
                  <FileText className="size-4" aria-hidden="true" />
                  Completar manualmente
                </Button>
              </div>
            </section>
          ) : null}

          {header && activeItem ? (
            <InvoiceReviewPanel
              header={header}
              onHeaderChange={handleHeaderChange}
              lines={lines}
              onLineChange={handleLineChange}
              onAddLine={handleAddLine}
              onRemoveLine={handleRemoveLine}
              onScanLine={handleOpenScan}
              suppliers={suppliersQuery.data ?? []}
              suppliersLoading={suppliersQuery.isLoading}
              isSaving={updateReview.isPending}
              isConfirming={
                confirmInvoice.isPending || createSupplier.isPending
              }
              validationError={validationError}
              onSave={handleSave}
              onConfirm={handleConfirm}
              confirmed={isConfirmed}
              extractionNotice={
                activeItem.extractionFailed ? EXTRACTION_NOTICE : null
              }
            />
          ) : null}

          {items.length === 0 ? (
            <section
              data-ocid="purchase_invoices.empty_state"
              className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
            >
              <div className="flex size-11 items-center justify-center rounded-md border border-border bg-card">
                <FileText
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold">
                  Aún no has cargado facturas
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Arrastra una factura en PDF o una foto para extraer sus datos
                  automáticamente y actualizar el inventario.
                </p>
              </div>
            </section>
          ) : null}

          <Dialog open={scanOpen} onOpenChange={handleScanOpenChange}>
            <DialogContent
              data-ocid="purchase_invoices.scan_dialog"
              className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display">
                  <ScanLine
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  Escanear repuesto
                </DialogTitle>
                <DialogDescription>
                  Lee el código de barras del repuesto o ingrésalo manualmente
                  para asignarlo a la línea seleccionada.
                </DialogDescription>
              </DialogHeader>
              <BarcodeScanner
                ocid="purchase_invoices.scan"
                title="Lector de códigos"
                hint="Apunta la cámara al código del repuesto o ingrésalo manualmente."
                onDetected={(part) => handleScanCode(part)}
                onNotFound={(code) => {
                  toast.error(`Producto no encontrado para el código ${code}`);
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {tab === "cargar" && busy ? (
        <p
          data-ocid="purchase_invoices.busy_state"
          className="text-center text-xs text-muted-foreground"
        >
          Procesando la factura…
        </p>
      ) : null}
    </div>
  );
}
