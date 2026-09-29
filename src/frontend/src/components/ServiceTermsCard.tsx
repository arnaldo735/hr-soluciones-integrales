import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  SERVICE_TERMS_DEFAULT_TEXT,
  useServiceTermsSettings,
  useUpdateServiceTermsSettings,
} from "@/hooks/use-service-terms";
import { AlertTriangle, Loader2, Save, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="border-b border-border">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
          {icon}
        </span>
        <div className="min-w-0 space-y-1">
          <CardTitle className="font-display text-base tracking-tight">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

/**
 * Pie de página editable «Términos y condiciones del Servicio». El
 * administrador edita un único texto que aparece al final de las órdenes de
 * trabajo, cotizaciones, POS y facturas. Cuando el texto guardado está vacío,
 * el backend devuelve el texto de recepción de la motocicleta por defecto.
 */
export function ServiceTermsCard() {
  const settingsQuery = useServiceTermsSettings();
  const saveMutation = useUpdateServiceTermsSettings();

  const [text, setText] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const data = settingsQuery.data;
    if (!data || initialized) return;
    setText(data.text);
    setInitialized(true);
  }, [settingsQuery.data, initialized]);

  const canSubmit = text.trim() !== "" && !saveMutation.isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    saveMutation.mutate(
      { text: text.trim() },
      {
        onSuccess: () => {
          toast.success("Términos y condiciones guardados", {
            description:
              "Los documentos generados a partir de ahora usarán este pie de página.",
          });
        },
        onError: (error) => {
          toast.error("No se pudieron guardar los términos y condiciones", {
            description: errorMessage(error),
          });
        },
      },
    );
  }

  if (settingsQuery.isLoading) {
    return (
      <Card
        data-ocid="settings.service_terms.card"
        className="rounded-lg shadow-none"
      >
        <SectionHeading
          icon={<ScrollText className="size-4" aria-hidden="true" />}
          title="Términos y condiciones del Servicio"
          description="Texto que aparece en el pie de los documentos generados."
        />
        <CardContent
          data-ocid="settings.service_terms.loading_state"
          className="space-y-3 pt-6"
        >
          {Array.from(
            { length: 3 },
            (_, i) => `service-terms-skeleton-${i}`,
          ).map((id) => (
            <div key={id} className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (settingsQuery.isError) {
    return (
      <Card
        data-ocid="settings.service_terms.card"
        className="rounded-lg shadow-none"
      >
        <SectionHeading
          icon={<ScrollText className="size-4" aria-hidden="true" />}
          title="Términos y condiciones del Servicio"
          description="Texto que aparece en el pie de los documentos generados."
        />
        <CardContent
          data-ocid="settings.service_terms.error_state"
          className="flex flex-col items-start gap-3 pt-6"
        >
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No se pudieron cargar los términos y condiciones del servicio.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void settingsQuery.refetch()}
            data-ocid="settings.service_terms.retry_button"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-ocid="settings.service_terms.card"
      className="rounded-lg shadow-none"
    >
      <SectionHeading
        icon={<ScrollText className="size-4" aria-hidden="true" />}
        title="Términos y condiciones del Servicio"
        description="Texto que aparece en el pie de los documentos generados."
      />
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]"
          data-ocid="settings.service_terms.form"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="service-terms-text">
                Texto del pie de página
              </Label>
              <Textarea
                id="service-terms-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={SERVICE_TERMS_DEFAULT_TEXT}
                rows={7}
                aria-invalid={!canSubmit && text.trim() === ""}
                aria-describedby="service-terms-help"
                data-ocid="settings.service_terms.textarea"
              />
              <p
                id="service-terms-help"
                className="text-xs text-muted-foreground"
              >
                Este pie de página aparece en órdenes de trabajo, cotizaciones,
                POS y facturas. Si lo dejas vacío, se usará el texto de
                recepción de la motocicleta por defecto.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!canSubmit}
                data-ocid="settings.service_terms.save_button"
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {saveMutation.isPending
                  ? "Guardando…"
                  : "Guardar términos y condiciones"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="field-label">Vista previa en el pie del documento</p>
            <div
              data-ocid="settings.service_terms.preview"
              className="rounded-md border border-dashed border-border bg-card px-4 py-4"
            >
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {text.trim() || SERVICE_TERMS_DEFAULT_TEXT}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Así se verá el pie de página al final de cada documento generado.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
