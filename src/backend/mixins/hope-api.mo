import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/hope";
import UserTypes "../types/users";
import HopeLib "../lib/hope";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  hope : { var settings : Types.HopeSettings },
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireHopeCompanyModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "company")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de empresa");
    };
  };

  // Configuración vigente del mensaje de esperanza (fila única). Exige el
  // módulo `company`; un llamador sin ese módulo falla con
  // `Unauthorized: no tiene acceso al módulo de empresa`.
  public query ({ caller }) func getHopeSettings(token : ?Text) : async Types.HopeSettings {
    requireHopeCompanyModule(caller, token);
    HopeLib.getSettings({ hope });
  };

  // Actualiza la configuración del mensaje de esperanza. Exige el módulo
  // `company`. La entrada es tolerante al borde Candid (`mode` viaja como
  // texto). En modo manual el texto es obligatorio.
  public shared ({ caller }) func updateHopeSettings(token : ?Text, input : Types.HopeSettingsRawInput) : async Types.HopeSettings {
    requireHopeCompanyModule(caller, token);
    let normalized = HopeLib.normalizeSettingsInput(input);
    switch (HopeLib.validateSettingsInput(normalized)) {
      case (?message) { Runtime.trap(message) };
      case null {};
    };
    HopeLib.updateSettings({ hope }, normalized);
  };

  // Promesa vigente para hoy: texto, cita, modo, `enabled` y la fecha de
  // referencia de Colombia (`DD/MM/AAAA`). Es de solo lectura y no exige
  // autorización: el frontend la muestra y la incluye en documentos y
  // mensajes.
  public query func getDailyHopeMessage() : async Types.HopeMessage {
    HopeLib.getEffectiveMessage({ hope }, Time.now());
  };
};
