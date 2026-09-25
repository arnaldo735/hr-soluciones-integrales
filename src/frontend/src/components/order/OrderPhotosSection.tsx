import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrderPhotoUpload } from "@/hooks/use-order-photos";
import {
  errorMessage,
  useAddOrderPhoto,
  useRemoveOrderPhoto,
} from "@/hooks/use-orders";
import { formatDateTime } from "@/lib/format";
import { type Id, ORDER_PHOTO_LIMIT, type OrderPhoto } from "@/lib/types";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

interface OrderPhotosSectionProps {
  orderId: Id;
  photos: OrderPhoto[];
}

/**
 * Process-evidence gallery for a workshop order. Accepts up to
 * `ORDER_PHOTO_LIMIT` photos taken with the device camera or picked from a
 * file, shows per-file upload progress, and lets the user remove a photo.
 */
export function OrderPhotosSection({
  orderId,
  photos,
}: OrderPhotosSectionProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { upload, isUploading, progress, error, clearError } =
    useOrderPhotoUpload();
  const addPhoto = useAddOrderPhoto();
  const removePhoto = useRemoveOrderPhoto();

  const count = photos.length;
  const remaining = Math.max(0, ORDER_PHOTO_LIMIT - count);
  const isFull = count >= ORDER_PHOTO_LIMIT;
  const isBusy = isUploading || addPhoto.isPending || removePhoto.isPending;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setActionError(null);
    clearError();

    const available = ORDER_PHOTO_LIMIT - count;
    const selected = Array.from(files).slice(0, Math.max(0, available));

    for (const file of selected) {
      try {
        const photo = await upload(file);
        await addPhoto.mutateAsync({ id: orderId, photo });
      } catch (uploadError) {
        setActionError(errorMessage(uploadError));
        break;
      }
    }

    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove(photoId: Id) {
    setActionError(null);
    removePhoto.mutate(
      { id: orderId, photoId },
      { onError: (removeError) => setActionError(errorMessage(removeError)) },
    );
  }

  const visibleError = actionError ?? error;

  return (
    <Card
      data-ocid="order_detail.photos.panel"
      className="gap-0 rounded-lg py-0 shadow-none"
    >
      <CardHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
        <CardTitle className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
          <Camera className="size-4 text-primary" aria-hidden="true" />
          Evidencia fotográfica
        </CardTitle>
        <span
          data-ocid="order_detail.photos.counter"
          className="data-rail text-xs text-muted-foreground"
        >
          {count} de {ORDER_PHOTO_LIMIT} fotos
        </span>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        <p className="text-xs text-muted-foreground">
          Adjunta hasta {ORDER_PHOTO_LIMIT} fotos del proceso: ingreso, avance y
          entrega de la moto.
        </p>

        <div data-ocid="order_detail.photos.grid" className="photo-grid">
          {photos.map((photo, index) => (
            <figure
              key={photo.id.toString()}
              data-ocid={`order_detail.photos.item.${index + 1}`}
              className="photo-tile"
            >
              <img
                src={photo.blob.getDirectURL()}
                alt={`Evidencia ${index + 1}: ${photo.filename}`}
                loading="lazy"
              />
              <div className="photo-tile-actions">
                <button
                  type="button"
                  onClick={() => handleRemove(photo.id)}
                  disabled={removePhoto.isPending}
                  aria-label={`Eliminar la foto ${photo.filename}`}
                  data-ocid={`order_detail.photos.remove_button.${index + 1}`}
                  data-variant="destructive"
                  className="photo-tile-action"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <figcaption className="photo-tile-caption">
                {formatDateTime(photo.uploadedAt)}
              </figcaption>
            </figure>
          ))}

          {!isFull ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              data-ocid="order_detail.photos.upload_button"
              className="photo-add-tile"
            >
              {isUploading ? (
                <>
                  <Loader2
                    className="size-5 animate-spin text-primary"
                    aria-hidden="true"
                  />
                  <span className="data-rail text-xs">
                    Subiendo… {Math.round(progress)}%
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="size-5" aria-hidden="true" />
                  <span className="text-xs font-medium">Agregar foto</span>
                  <span className="data-rail text-[10px]">
                    {remaining} {remaining === 1 ? "espacio" : "espacios"}
                  </span>
                </>
              )}
            </button>
          ) : null}
        </div>

        {isUploading ? (
          <div
            data-ocid="order_detail.photos.progress"
            className="photo-progress relative h-1 overflow-hidden rounded-full"
            role="progressbar"
            tabIndex={-1}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de carga de la foto"
          >
            <div
              className="photo-progress-bar"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isFull || isBusy}
            data-ocid="order_detail.photos.camera_button"
            className="gap-1.5"
          >
            <Camera className="size-4" aria-hidden="true" />
            Tomar foto
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isFull || isBusy}
            data-ocid="order_detail.photos.file_button"
            className="gap-1.5"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            Elegir archivo
          </Button>
          {isFull ? (
            <p
              data-ocid="order_detail.photos.limit_state"
              className="text-xs text-muted-foreground"
            >
              Límite alcanzado: elimina una foto para cargar otra.
            </p>
          ) : null}
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void handleFiles(event.target.files)}
        />

        {visibleError ? (
          <div
            data-ocid="order_detail.photos.error_state"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5"
          >
            <p className="text-xs text-destructive">{visibleError}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
