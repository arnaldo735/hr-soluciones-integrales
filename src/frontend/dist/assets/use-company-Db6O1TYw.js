import { k as useBackend, l as useQuery, b6 as effectiveTaxRate, b2 as isIvaResponsible, ak as useQueryClient, al as useMutation } from "./index-CzQEXdHP.js";
function useCompanyProfile() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCompanyProfile();
    },
    enabled: !!actor && !isFetching,
    // Shared by the panel, POS and every printed document; fetched once per
    // session and refreshed only when the profile is updated.
    staleTime: Number.POSITIVE_INFINITY
  });
}
function useUpdateCompanyProfile() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateCompanyProfile(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    }
  });
}
function useBusinessSettings() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBusinessSettings();
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
