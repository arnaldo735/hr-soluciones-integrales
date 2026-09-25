import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

/** Lifecycle of one invoice file inside the upload queue. */
export type UploadItemStatus = "uploading" | "extracting" | "ready" | "failed";

/** One invoice file tracked by the upload queue. */
export interface UploadItem {
  /** Stable client-side key; never the array index. */
  key: string;
  fileName: string;
  /** True when the file is a PDF, false for images. */
  isPdf: boolean;
  /** Upload progress from 0 to 100. */
  progress: number;
  status: UploadItemStatus;
  /** Spanish failure reason when `status` is "failed". */
  error?: string;
  /** Backend invoice id once the draft was created. */
  invoiceId?: bigint;
  /**
   * True when the automatic extraction failed or returned no lines. The file
   * stays reviewable: the review panel opens with an empty header and lines so
   * the user can complete the invoice by hand.
   */
  extractionFailed?: boolean;
}

const STATUS_LABELS: Record<UploadItemStatus, string> = {
  uploading: "Subiendo",
  extracting: "Analizando",
  ready: "Lista para revisar",
  failed: "Error",
};

const STATUS_STYLES: Record<UploadItemStatus, string> = {
  uploading: "border-border bg-muted text-muted-foreground",
  extracting: "border-primary/40 bg-primary/10 text-primary",
  ready: "border-success/50 bg-success/15 text-success",
  failed: "border-destructive/50 bg-destructive/10 text-destructive",
};

/** Badge label for a file whose extraction failed but is still reviewable. */
const MANUAL_REVIEW_LABEL = "Revisar manualmente";

interface InvoiceUploadListProps {
  items: UploadItem[];
  /** Retries a failed upload/extraction. */
  onRetry: (key: string) => void;
  /** Removes an item from the queue. */
  onRemove: (key: string) => void;
  /** Opens the review panel for a ready invoice. */
  onReview: (key: string) => void;
  /** Key of the invoice currently open in the review panel. */
  activeKey: string | null;
}

/**
 * The in-progress upload queue: one row per invoice file with its upload
 * progress, extraction state and the recovery actions for a failed file.
 */
export function InvoiceUploadList({
  items,
  onRetry,
  onRemove,
  onReview,
  activeKey,
}: InvoiceUploadListProps) {
  if (items.length === 0) return null;

  return (
    <section
      data-ocid="purchase_invoices.upload_list"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Archivos de esta sesión
        </p>
        <span className="data-rail text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item, index) => {
          const isActive = activeKey === item.key;
          const isReviewable =
            item.status === "ready" ||
            (item.status === "failed" && item.extractionFailed === true);
          return (
            <li
              key={item.key}
              data-ocid={`purchase_invoices.upload_item.${index + 1}`}
              className={cn(
                "flex flex-wrap items-center gap-3 px-4 py-3 transition-smooth",
                isActive && "bg-primary/5",
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                {item.isPdf ? (
                  <FileText className="size-4" aria-hidden="true" />
                ) : (
                  <ImageIcon className="size-4" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">
                    {item.fileName}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 font-mono text-[10px] uppercase tracking-wider",
                      STATUS_STYLES[item.status],
                    )}
                  >
                    {item.status === "uploading" ||
                    item.status === "extracting" ? (
                      <Loader2
                        className="mr-1 size-3 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    {item.status === "failed" && item.extractionFailed
                      ? MANUAL_REVIEW_LABEL
                      : STATUS_LABELS[item.status]}
                  </Badge>
                </div>

                {item.status === "uploading" ? (
                  <Progress
                    value={item.progress}
                    aria-label={`Progreso de subida de ${item.fileName}`}
                    data-ocid={`purchase_invoices.upload_progress.${index + 1}`}
                    className="h-1.5"
                  />
                ) : null}

                {item.status === "failed" && item.error ? (
                  <p
                    data-ocid={`purchase_invoices.upload_error.${index + 1}`}
                    className="flex items-start gap-1.5 text-xs text-destructive"
                  >
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{item.error}</span>
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {isReviewable ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => onReview(item.key)}
                    data-ocid={`purchase_invoices.review_button.${index + 1}`}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Revisar
                  </Button>
                ) : null}

                {item.status === "failed" && !item.extractionFailed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onRetry(item.key)}
                    data-ocid={`purchase_invoices.retry_button.${index + 1}`}
                    className="gap-1.5"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Reintentar
                  </Button>
                ) : null}

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(item.key)}
                  aria-label={`Quitar ${item.fileName} de la lista`}
                  data-ocid={`purchase_invoices.remove_button.${index + 1}`}
                  className="size-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
