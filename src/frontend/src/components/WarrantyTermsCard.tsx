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
  WARRANTY_TERMS_DEFAULT_TEXT,
  useUpdateWarrantyTermsSettings,
  useWarrantyTermsSettings,
} from "@/hooks/use-warranty-terms";
import {
  AlertTriangle,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
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
 * Editor administrativo de "Términos y Condiciones de Garantía". El
 * administrador edita un único bloque de texto libre que reemplaza el contenido
 * del documento de garantía de la orden de trabajo: la vista en pantalla, el
 * imprimible y el PDF. Cuando el texto guardado está vacío, el backend devuelve
 * el texto de garantía predeterminado (las 8 cláusulas y el aviso IMPORTANTE).
 */
export function WarrantyTermsCard() {
  const settingsQuery = useWarrantyTermsSettings();
  const saveMutation = useUpdateWarrantyTermsSettings();

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
          toast.success("Términos y condiciones de garantía guardados", {
            description:
              "El documento de garantía de las órdenes usará este texto.",
          });
        },
        onError: (error) => {
          toast.error("No se pudieron guardar los términos de garantía", {
            description: errorMessage(error),
          });
        },
      },
    );
  }

  function handleRestoreDefault() {
    setText(WARRANTY_TERMS_DEFAULT_TEXT);
    toast.info("Texto predeterminado restaurado", {
      description:
        "Guarda para aplicar el texto de garantía predeterminado a los documentos.",
    });
  }

  if (settingsQuery.isLoading) {
    return (
      <Card
        data-ocid="settings.warranty_terms.card"
        className="rounded-lg shadow-none"
      >
        <SectionHeading
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
          title="Términos y Condiciones de Garantía"
          description="Texto del documento de garantía de las órdenes de trabajo."
        />
        <CardContent
          data-ocid="settings.warranty_terms.loading_state"
          className="space-y-3 pt-6"
        >
          {Array.from(
            { length: 3 },
            (_, i) => `warranty-terms-skeleton-${i}`,
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
        data-ocid="settings.warranty_terms.card"
        className="rounded-lg shadow-none"
      >
        <SectionHeading
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
          title="Términos y Condiciones de Garantía"
          description="Texto del documento de garantía de las órdenes de trabajo."
        />
        <CardContent
          data-ocid="settings.warranty_terms.error_state"
          className="flex flex-col items-start gap-3 pt-6"
        >
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No se pudieron cargar los términos y condiciones de garantía.
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void settingsQuery.refetch()}
            data-ocid="settings.warranty_terms.retry_button"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-ocid="settings.warranty_terms.card"
      className="rounded-lg shadow-none"
    >
      <SectionHeading
        icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        title="Términos y Condiciones de Garantía"
        description="Texto del documento de garantía de las órdenes de trabajo."
      />
      <CardContent className="pt-6">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]"
          data-ocid="settings.warranty_terms.form"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="warranty-terms-text">
                Texto del documento de garantía
              </Label>
              <Textarea
                id="warranty-terms-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={WARRANTY_TERMS_DEFAULT_TEXT}
                rows={14}
                aria-invalid={!canSubmit && text.trim() === ""}
                aria-describedby="warranty-terms-help"
                data-ocid="settings.warranty_terms.textarea"
              />
              <p
                id="warranty-terms-help"
                className="text-xs text-muted-foreground"
              >
                Este texto reemplaza el contenido del documento de garantía de
                las órdenes de trabajo (pantalla, imprimible y PDF). Si lo dejas
                vacío, se usará el texto de garantía predeterminado.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRestoreDefault}
                disabled={saveMutation.isPending}
                data-ocid="settings.warranty_terms.restore_default_button"
                className="gap-2"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Restaurar texto predeterminado
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                data-ocid="settings.warranty_terms.save_button"
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {saveMutation.isPending
                  ? "Guardando…"
                  : "Guardar términos de garantía"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="field-label">Vista previa del documento</p>
            <div
              data-ocid="settings.warranty_terms.preview"
              className="max-h-[22rem] overflow-y-auto rounded-md border border-dashed border-border bg-card px-4 py-4"
            >
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {text.trim() || WARRANTY_TERMS_DEFAULT_TEXT}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Así se verá el contenido del documento de garantía de cada orden.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
