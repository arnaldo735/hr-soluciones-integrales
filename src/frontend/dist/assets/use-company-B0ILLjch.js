import { k as useBackend, l as useAuth, m as useQuery, bl as effectiveTaxRate, b7 as isIvaResponsible, ao as useQueryClient, ap as useMutation } from "./index-EqGEeyjs.js";
function useCompanyProfile(options) {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  const enabled = (options == null ? void 0 : options.enabled) ?? true;
  return useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCompanyProfile(token);
    },
    enabled: enabled && !!actor && !isFetching,
    // Shared by the panel, POS and every printed document; fetched once per
    // session and refreshed only when the profile is updated.
    staleTime: Number.POSITIVE_INFINITY
  });
}
function useUpdateCompanyProfile() {
  const { actor } = useBackend();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateCompanyProfile(token, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    }
  });
}
function useBusinessSettings() {
  const { actor, isFetching } = useBackend();
  const { token } = useAuth();
  return useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBusinessSettings(token);
    },
    enabled: !!actor && !isFetching,
    // Shared by POS and the printed documents; fetched once per session and
    // refreshed only when the settings are updated.
    staleTime: Number.POSITIVE_INFINITY
  });
}
function useIvaSettings() {
  const profileQuery = useCompanyProfile();
  const profile = profileQuery.data ?? null;
  const regime = (profile == null ? void 0 : profile.fiscalRegime) ?? null;
  const configuredTaxRate = (profile == null ? void 0 : profile.taxRate) ?? 19n;
  return {
    profile,
    regime,
    isIvaResponsible: isIvaResponsible(regime),
    configuredTaxRate,
    taxRate: effectiveTaxRate(regime, configuredTaxRate),
    isLoading: profileQuery.isLoading
  };
}
export {
  useIvaSettings as a,
  useBusinessSettings as b,
  useUpdateCompanyProfile as c,
  useCompanyProfile as u
};
