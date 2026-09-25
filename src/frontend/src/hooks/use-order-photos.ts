import type { OrderPhotoInput } from "@/lib/types";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useCallback, useState } from "react";

/** Maximum accepted size for a single evidence photo: 10 MB. */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Human-readable message from a backend rejection or a generic failure. */
function uploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "No se pudo cargar la foto. Inténtalo de nuevo.";
}

export interface OrderPhotoUpload {
  /** Uploads one file and resolves the input the backend expects. */
  upload: (file: File) => Promise<OrderPhotoInput>;
  /** True while a file is being read and uploaded. */
  isUploading: boolean;
  /** Upload progress from 0 to 100. */
  progress: number;
  /** Last upload failure, or `null` when the last attempt succeeded. */
  error: string | null;
  /** Clears the last failure message. */
  clearError: () => void;
}

/**
 * Uploads a process-evidence photo through the platform file storage and
 * returns the `OrderPhotoInput` the backend expects.
 *
 * The `ExternalBlob` instance is passed straight through as
 * `OrderPhotoInput.blob`; the actor uploads the bytes and returns the stored
 * reference. `getDirectURL()` is a local object URL and must never be
 * persisted as the photo reference.
 */
export function useOrderPhotoUpload(): OrderPhotoUpload {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const upload = useCallback(async (file: File): Promise<OrderPhotoInput> => {
    if (!file.type.startsWith("image/")) {
      const message = "Selecciona un archivo de imagen (JPG, PNG o WEBP).";
      setError(message);
      throw new Error(message);
    }
    if (file.size > MAX_PHOTO_BYTES) {
      const message = "La foto supera el límite de 10 MB.";
      setError(message);
      throw new Error(message);
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name,
      ).withUploadProgress((percentage) => setProgress(percentage));
      return {
        blob,
        filename: file.name,
        mimeType: file.type,
      };
    } catch (uploadError) {
      const message = uploadErrorMessage(uploadError);
      setError(message);
      throw new Error(message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading, progress, error, clearError };
}
