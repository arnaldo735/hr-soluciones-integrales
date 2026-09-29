import { k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation } from "./index-EqGEeyjs.js";
const SERVICE_TERMS_DEFAULT_TEXT = "Se recibe la motocicleta en el estado y condiciones descritas, para diagnóstico y/o reparación. El cliente declara dejarla con los accesorios y pertenencias anotadas y autoriza la revisión. El taller no se hace responsable por objetos de valor no declarados, ni por fallas preexistentes no visibles al ingreso. Todo trabajo adicional será consultado previamente.";
function useServiceTermsSettings(options) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["service-terms-settings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getServiceTermsSettings(token);
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY
  });
}
function useUpdateServiceTermsSettings() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateServiceTermsSettings(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["service-terms-settings"]
      });
    }
  });
}
export {
  SERVICE_TERMS_DEFAULT_TEXT as S,
  useUpdateServiceTermsSettings as a,
  useServiceTermsSettings as u
};
