import { k as useBackend, l as useAuth, m as useQuery, ao as useQueryClient, ap as useMutation } from "./index-EqGEeyjs.js";
import { b as WARRANTY_IMPORTANT_TEXT, a as WARRANTY_CLAUSES } from "./warranty-BU5LnZHy.js";
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
  WARRANTY_TERMS_DEFAULT_TEXT as W,
  useUpdateWarrantyTermsSettings as a,
  useWarrantyTermsSettings as u
};
