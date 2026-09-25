import { useBackend } from "@/hooks/use-backend";
import { effectiveTaxRate, isIvaResponsible } from "@/lib/format";
import type {
  BusinessSettings,
  CompanyProfile,
  CompanyProfileInput,
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Company profile shown on printed documents and invoices. */
export function useCompanyProfile() {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["company-profile"],
    queryFn: async (): Promise<CompanyProfile | null> => {
      if (!actor) return null;
      return actor.getCompanyProfile();
    },
    enabled: !!actor && !isFetching,
    // Shared by the panel, POS and every printed document; fetched once per
    // session and refreshed only when the profile is updated.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useUpdateCompanyProfile() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompanyProfileInput): Promise<CompanyProfile> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateCompanyProfile(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["business-settings"] });
    },
  });
}

/** Operational business settings (name, tax id, address, tax rate). */
export function useBusinessSettings() {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["business-settings"],
    queryFn: async (): Promise<BusinessSettings | null> => {
      if (!actor) return null;
      return actor.getBusinessSettings();
    },
    enabled: !!actor && !isFetching,
    // Shared by POS and the printed documents; fetched once per session and
    // refreshed only when the settings are updated.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * The company's IVA decision, derived from the fiscal regime on the company
 * profile. `isIvaResponsible` is the single source of truth for whether any
 * document charges tax; `taxRate` is the effective rate (0% when the company
 * is not responsible), while `configuredTaxRate` preserves the stored rate so
 * it can be reused when the regime changes back.
 */
export function useIvaSettings() {
  const profileQuery = useCompanyProfile();
  const profile = profileQuery.data ?? null;
  const regime = profile?.fiscalRegime ?? null;
  const configuredTaxRate = profile?.taxRate ?? 19n;

  return {
    profile,
    regime,
    isIvaResponsible: isIvaResponsible(regime),
    configuredTaxRate,
    taxRate: effectiveTaxRate(regime, configuredTaxRate),
    isLoading: profileQuery.isLoading,
  };
}

export function useUpdateBusinessSettings() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      settings: BusinessSettings,
    ): Promise<BusinessSettings> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateBusinessSettings(settings);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["company-profile"] });
    },
  });
}
