import { useBackend } from "@/hooks/use-backend";
import type {
  CustomerNotificationInput,
  CustomerNotificationResult,
} from "@/lib/types";
import { useMutation } from "@tanstack/react-query";

/**
 * Envía un correo de notificación al cliente con el asunto y el mensaje
 * indicados. El backend resuelve el destinatario desde el correo registrado.
 */
export function useNotifyCustomer() {
  const { actor } = useBackend();

  return useMutation({
    mutationFn: async (
      input: CustomerNotificationInput,
    ): Promise<CustomerNotificationResult> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.notifyCustomer(input);
    },
  });
}
