import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  WarrantyTermsSettings,
  WarrantyTermsSettingsInput,
} from "@/lib/types";
import { WARRANTY_CLAUSES, WARRANTY_IMPORTANT_TEXT } from "@/lib/warranty";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Texto completo de "Términos y Condiciones de Garantía" con el que se
 * prellena el editor de configuración: las 8 cláusulas numeradas más el aviso
 * IMPORTANTE. Se construye a partir de `WARRANTY_CLAUSES` y
 * `WARRANTY_IMPORTANT_TEXT` para que exista una única fuente del texto; el
 * backend devuelve este mismo bloque cuando el guardado está vacío.
 */
export const WARRANTY_TERMS_DEFAULT_TEXT = [
  ...WARRANTY_CLAUSES.map(
    (clause) => `${clause.number}. ${clause.title}\n${clause.body}`,
  ),
  `IMPORTANTE\n${WARRANTY_IMPORTANT_TEXT}`,
].join("\n\n");

/**
 * Términos y Condiciones de Garantía vigentes (fila única). Requiere el módulo
 * `company`; se comparte entre la configuración y el documento de la orden, por
 * eso se obtiene una vez por sesión y solo se refresca al guardar.
 */
export function useWarrantyTermsSettings(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["warranty-terms-settings"],
    queryFn: async (): Promise<WarrantyTermsSettings | null> => {
      if (!actor) return null;
      return actor.getWarrantyTermsSettings(token);
    },
    enabled: enabled && !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useUpdateWarrantyTermsSettings() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: WarrantyTermsSettingsInput,
    ): Promise<WarrantyTermsSettings> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateWarrantyTermsSettings(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["warranty-terms-settings"],
      });
    },
  });
}
