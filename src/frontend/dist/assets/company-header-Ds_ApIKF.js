import { b6 as taxResponsibilityLabel, b5 as fiscalRegimeLabel, aI as formatNit } from "./index-EqGEeyjs.js";
function clean(value) {
  if (value === void 0 || value === null) return void 0;
  const trimmed = value.trim();
  return trimmed === "" ? void 0 : trimmed;
}
function companyHeaderFromProfile(profile) {
  if (!profile) return null;
  const legalName = clean(profile.legalName);
  if (!legalName) return null;
  return {
    legalName,
    tradeName: clean(profile.tradeName),
    logoUrl: clean(profile.logoUrl),
    taxId: clean(formatNit(profile.taxId, profile.checkDigit)),
    fiscalRegime: clean(fiscalRegimeLabel(profile.fiscalRegime)),
    taxResponsibility: clean(taxResponsibilityLabel(profile.taxResponsibility)),
    address: clean(profile.address),
    city: clean(profile.city),
    phone: clean(profile.phone),
    email: clean(profile.email),
    website: clean(profile.website)
  };
}
function companyContactLine(header) {
  if (!header) return void 0;
  const parts = [
    header.address,
    header.city,
    header.phone,
    header.email,
    header.website
  ].filter((value) => !!value);
  return parts.length > 0 ? parts.join(" · ") : void 0;
}
function companyFiscalLines(header) {
  if (!header) return [];
  return [header.taxId, header.fiscalRegime, header.taxResponsibility].filter(
    (value) => !!value
  );
}
export {
  companyFiscalLines as a,
  companyContactLine as b,
  companyHeaderFromProfile as c
};
