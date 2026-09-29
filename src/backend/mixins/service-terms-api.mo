import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/service-terms";
import UserTypes "../types/users";
import ServiceTermsLib "../lib/service-terms";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  serviceTerms : { var settings : Types.ServiceTermsSettings },
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireServiceTermsCompanyModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "company")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de empresa");
    };
  };

  // Pie de página vigente de «Términos y condiciones del Servicio» (fila
  // única). Exige el módulo `company`; un llamador sin ese módulo falla con
  // `Unauthorized: no tiene acceso al módulo de empresa`.
  public query ({ caller }) func getServiceTermsSettings(token : ?Text) : async Types.ServiceTermsSettings {
    requireServiceTermsCompanyModule(caller, token);
    ServiceTermsLib.getSettings({ serviceTerms });
  };

  // Actualiza el pie de página de «Términos y condiciones del Servicio».
  // Exige el módulo `company`. Un texto vacío cae al texto por defecto.
  public shared ({ caller }) func updateServiceTermsSettings(token : ?Text, input : Types.ServiceTermsSettingsRawInput) : async Types.ServiceTermsSettings {
    requireServiceTermsCompanyModule(caller, token);
    ServiceTermsLib.updateSettings({ serviceTerms }, input);
  };
};
