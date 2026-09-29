import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import type {
  ServiceTermsSettings,
  ServiceTermsSettingsInput,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Texto de recepción de la motocicleta con el que se prellena el pie de página
 * "Términos y condiciones del Servicio". El backend ya devuelve este mismo
 * texto cuando el guardado está vacío, así que la constante solo se usa para
 * prellenar el formulario de configuración.
 */
export const SERVICE_TERMS_DEFAULT_TEXT =
  "Se recibe la motocicleta en el estado y condiciones descritas, para diagnóstico y/o reparación. El cliente declara dejarla con los accesorios y pertenencias anotadas y autoriza la revisión. El taller no se hace responsable por objetos de valor no declarados, ni por fallas preexistentes no visibles al ingreso. Todo trabajo adicional será consultado previamente.";

/**
 * Pie de página vigente de los documentos (fila única). Requiere el módulo
 * `company`; se comparte entre la configuración y los documentos, por eso se
 * obtiene una vez por sesión y solo se refresca al guardar.
 */
export function useServiceTermsSettings(options?: { enabled?: boolean }) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ["service-terms-settings"],
    queryFn: async (): Promise<ServiceTermsSettings | null> => {
      if (!actor) return null;
      return actor.getServiceTermsSettings(token);
    },
    enabled: enabled && !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useUpdateServiceTermsSettings() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: ServiceTermsSettingsInput,
    ): Promise<ServiceTermsSettings> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateServiceTermsSettings(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["service-terms-settings"],
      });
    },
  });
}
