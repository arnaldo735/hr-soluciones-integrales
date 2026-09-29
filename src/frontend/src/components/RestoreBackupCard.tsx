import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type RestorePreview,
  type RestoreSectionInfo,
  type RestoreSummary,
  readRestoreFile,
  restoreErrorMessage,
  restoreSectionLabel,
  useRestoreBackup,
  useValidateRestoreFile,
} from "@/hooks/use-restore-backup";
import { formatDateTime, formatNumber } from "@/lib/format";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/** Estado del flujo de restauración dentro de la tarjeta. */
type RestoreStep = "idle" | "preview" | "running" | "done";

/** Resultado por sección con su etiqueta y conteo para la vista previa. */
interface PreviewSection extends RestoreSectionInfo {
  label: string;
}

function sectionStatusLabel(
  status: RestoreSummary["sections"][number]["status"],
) {
  switch (status) {
    case "restored":
      return "Restaurada";
    case "skipped":
      return "Omitida";
    default:
      return "Error";
  }
}

export function RestoreBackupCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const validateFile = useValidateRestoreFile();
  const restoreBackup = useRestoreBackup();

  const [step, setStep] = useState<RestoreStep>("idle");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);

  const previewSections: PreviewSection[] = (preview?.sections ?? []).map(
    (section) => ({ ...section, label: restoreSectionLabel(section.key) }),
  );

  function resetFlow() {
    setStep("idle");
    setFileName("");
    setFileContent("");
    setPreview(null);
    setSelectedKeys([]);
    setConfirmed(false);
    setError(null);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenPicker() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSummary(null);
    setPreview(null);
    setConfirmed(false);
    setFileName(file.name);

    let content: string;
    try {
      content = await readRestoreFile(file);
    } catch (readError) {
      setError(restoreErrorMessage(readError));
      setStep("idle");
      return;
    }

    setFileContent(content);
    validateFile.mutate(content, {
      onSuccess: (result) => {
        setPreview(result);
        setSelectedKeys(result.sections.map((section) => section.key));
        setStep("preview");
      },
      onError: (validationError) => {
        setPreview(null);
        setSelectedKeys([]);
        setError(restoreErrorMessage(validationError));
        setStep("idle");
      },
    });
  }

  function toggleSection(key: string, checked: boolean) {
    setSelectedKeys((current) =>
      checked
        ? current.includes(key)
          ? current
          : [...current, key]
        : current.filter((entry) => entry !== key),
    );
  }

  function handleConfirm() {
    if (!preview || selectedKeys.length === 0) return;
    setError(null);
    setStep("running");
    restoreBackup.mutate(
      { json: fileContent, sections: preview.sections, selectedKeys },
      {
        onSuccess: (result) => {
          setSummary(result);
          setStep("done");
          if (result.failedSections === 0n) {
            toast.success("Restauración completada");
          } else {
            toast.warning("Restauración completada con errores");
          }
        },
        onError: (restoreError) => {
          setError(restoreErrorMessage(restoreError));
          setStep("preview");
        },
      },
    );
  }

  const isBusy = validateFile.isPending || restoreBackup.isPending;
  const canConfirm =
    step === "preview" && confirmed && selectedKeys.length > 0 && !isBusy;

  return (
    <Card data-ocid="settings.restore.card" className="rounded-lg shadow-none">
      <CardHeader className="border-b border-border">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
            <RotateCcw className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="font-display text-base tracking-tight">
              Restaurar copia local
            </CardTitle>
            <CardDescription>
              Carga un archivo JSON de copia local previamente descargado y
              elige qué secciones sobrescribir. La restauración reemplaza los
              datos actuales de las secciones incluidas.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="sr-only"
          data-ocid="settings.restore.file_input"
        />

        {step === "idle" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleOpenPicker}
              disabled={isBusy}
              data-ocid="settings.restore.upload_button"
              className="gap-2"
            >
              {validateFile.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {validateFile.isPending
                ? "Validando archivo…"
                : "Restaurar copia"}
            </Button>
            {validateFile.isPending ? (
              <p
                data-ocid="settings.restore.loading_state"
                className="text-xs text-muted-foreground"
              >
                Estamos revisando el archivo. No cierres esta ventana.
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div
            data-ocid="settings.restore.error_state"
            className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3"
          >
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFlow}
              data-ocid="settings.restore.retry_button"
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Elegir otro archivo
            </Button>
          </div>
        ) : null}

        {step === "preview" && preview ? (
          <div className="space-y-5">
            <div
              data-ocid="settings.restore.preview"
              className="space-y-3 rounded-md border border-border bg-muted/40 px-4 py-4"
            >
              <div className="flex items-start gap-2">
                <History
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Vista previa de la copia
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generada el {formatDateTime(preview.generatedAt)} ·{" "}
                    {formatNumber(preview.totalSections)} secciones · versión{" "}
                    {Number(preview.formatVersion)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  Secciones incluidas
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedKeys(
                        preview.sections.map((section) => section.key),
                      )
                    }
                    data-ocid="settings.restore.select_all_button"
                  >
                    Seleccionar todo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedKeys([])}
                    data-ocid="settings.restore.clear_all_button"
                  >
                    Quitar todo
                  </Button>
                </div>
              </div>

              <ul
                data-ocid="settings.restore.section_list"
                className="divide-y divide-border rounded-md border border-border"
              >
                {previewSections.map((section, position) => {
                  const checked = selectedKeys.includes(section.key);
                  return (
                    <li
                      key={section.key}
                      data-ocid={`settings.restore.section.${position + 1}`}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <Checkbox
                        id={`restore-section-${section.key}`}
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleSection(section.key, value === true)
                        }
                        data-ocid={`settings.restore.section_checkbox.${position + 1}`}
                      />
                      <label
                        htmlFor={`restore-section-${section.key}`}
                        className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3"
                      >
                        <span className="truncate text-sm text-foreground">
                          {section.label}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {formatNumber(section.count)} registros
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                La restauración{" "}
                <span className="font-medium text-foreground">
                  reemplaza por completo
                </span>{" "}
                los datos actuales de las secciones seleccionadas. Las secciones
                que dejes sin marcar se conservan tal como están.
              </p>
            </div>

            <label
              htmlFor="restore-confirm"
              className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-3"
            >
              <Checkbox
                id="restore-confirm"
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                data-ocid="settings.restore.confirm_checkbox"
              />
              <span className="text-sm text-foreground">
                Entiendo que se reemplazarán los datos actuales de las secciones
                seleccionadas y confirmo la restauración.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={!canConfirm}
                data-ocid="settings.restore.confirm_button"
                className="gap-2"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Restaurar secciones seleccionadas
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFlow}
                disabled={isBusy}
                data-ocid="settings.restore.cancel_button"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}

        {step === "running" ? (
          <div
            data-ocid="settings.restore.running_state"
            className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-4"
          >
            <Loader2
              className="size-4 shrink-0 animate-spin text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                Restaurando secciones…
              </p>
              <p className="text-xs text-muted-foreground">
                Se aplica una sección por llamada. No cierres esta ventana.
              </p>
            </div>
          </div>
        ) : null}

        {step === "done" && summary ? (
          <div className="space-y-4">
            <div
              data-ocid="settings.restore.success_state"
              className="flex items-start gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-3"
            >
              {summary.failedSections === 0n ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-success"
                  aria-hidden="true"
                />
              ) : (
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {summary.failedSections === 0n
                    ? "Restauración completada"
                    : "Restauración completada con errores"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(summary.totalRecords)} registros restaurados en{" "}
                  {formatNumber(summary.restoredSections)} secciones ·{" "}
                  {formatNumber(summary.skippedSections)} omitidas ·{" "}
                  {formatNumber(summary.failedSections)} con error.
                </p>
              </div>
            </div>

            <ul
              data-ocid="settings.restore.result_list"
              className="divide-y divide-border rounded-md border border-border"
            >
              {summary.sections.map((section, position) => (
                <li
                  key={section.key}
                  data-ocid={`settings.restore.result.${position + 1}`}
                  className="flex items-start gap-3 px-3 py-2.5"
                >
                  {section.status === "restored" ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                  ) : section.status === "skipped" ? (
                    <CircleSlash
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate text-sm text-foreground">
                        {restoreSectionLabel(section.key)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {sectionStatusLabel(section.status)}
                        {section.status === "restored"
                          ? ` · ${formatNumber(section.restored)} registros`
                          : ""}
                      </span>
                    </div>
                    {section.message ? (
                      <p className="text-xs text-destructive">
                        {section.message}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => window.location.reload()}
                data-ocid="settings.restore.reload_button"
                className="gap-2"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Recargar la aplicación
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetFlow}
                data-ocid="settings.restore.close_button"
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
