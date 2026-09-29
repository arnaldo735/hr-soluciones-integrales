import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/company";
import UserTypes "../types/users";
import CompanyLib "../lib/company";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  company : { var profile : Types.CompanyProfile },
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireCompanyModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "company")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de empresa");
    };
  };

  public query ({ caller }) func getCompanyProfile(token : ?Text) : async Types.CompanyProfile {
    requireCompanyModule(caller, token);
    CompanyLib.getCompanyProfile({ company });
  };

  public shared ({ caller }) func updateCompanyProfile(token : ?Text, input : Types.CompanyProfileRawInput) : async Types.CompanyProfile {
    requireCompanyModule(caller, token);
    let normalized = CompanyLib.normalizeProfileInput(input);
    switch (CompanyLib.validateProfileInput(normalized)) {
      case (?message) { Runtime.trap(message) };
      case null {};
    };
    CompanyLib.updateCompanyProfile({ company }, normalized);
  };
};
