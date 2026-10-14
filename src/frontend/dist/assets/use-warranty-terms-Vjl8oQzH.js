import { u as useBackend, i as useAuth, k as useQuery, aj as useQueryClient, ak as useMutation } from "./index-CGU00UGU.js";
import { b as WARRANTY_IMPORTANT_TEXT, a as WARRANTY_CLAUSES } from "./warranty-HTI4GveV.js";
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
const WARRANTY_TERMS_DEFAULT_TEXT = [
  ...WARRANTY_CLAUSES.map(
    (clause) => `${clause.number}. ${clause.title}
${clause.body}`
  ),
  `IMPORTANTE
${WARRANTY_IMPORTANT_TEXT}`
].join("\n\n");
function useWarrantyTermsSettings(options) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["warranty-terms-settings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getWarrantyTermsSettings(token);
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY
  });
}
function useUpdateWarrantyTermsSettings() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateWarrantyTermsSettings(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["warranty-terms-settings"]
      });
    }
  });
}
export {
  SERVICE_TERMS_DEFAULT_TEXT as S,
  WARRANTY_TERMS_DEFAULT_TEXT as W,
  useWarrantyTermsSettings as a,
  useUpdateServiceTermsSettings as b,
  useUpdateWarrantyTermsSettings as c,
  useServiceTermsSettings as u
};
