import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/warranty-terms";
import UserTypes "../types/users";
import WarrantyTermsLib "../lib/warranty-terms";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  warrantyTerms : { var settings : Types.WarrantyTermsSettings },
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireWarrantyTermsCompanyModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "company")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de empresa");
    };
  };

  // Términos de garantía vigentes (fila única). Exige el módulo `company`; un
  // llamador sin ese módulo falla con
  // `Unauthorized: no tiene acceso al módulo de empresa`.
  public query ({ caller }) func getWarrantyTermsSettings(token : ?Text) : async Types.WarrantyTermsSettings {
    requireWarrantyTermsCompanyModule(caller, token);
    WarrantyTermsLib.getSettings({ warrantyTerms });
  };

  // Actualiza los términos de garantía. Exige el módulo `company`. Un texto
  // vacío cae al texto por defecto.
  public shared ({ caller }) func updateWarrantyTermsSettings(token : ?Text, input : Types.WarrantyTermsSettingsRawInput) : async Types.WarrantyTermsSettings {
    requireWarrantyTermsCompanyModule(caller, token);
    WarrantyTermsLib.updateSettings({ warrantyTerms }, input);
  };
};
