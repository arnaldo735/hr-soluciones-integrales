import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Types "../types/company";
import CompanyLib "../lib/company";

mixin (
  accessControlState : AccessControl.AccessControlState,
  company : { var profile : Types.CompanyProfile },
) {
  func requireCompanyAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query func getCompanyProfile() : async Types.CompanyProfile {
    CompanyLib.getCompanyProfile({ company });
  };

  public shared ({ caller }) func updateCompanyProfile(input : Types.CompanyProfileRawInput) : async Types.CompanyProfile {
    requireCompanyAdmin(caller);
    let normalized = CompanyLib.normalizeProfileInput(input);
    switch (CompanyLib.validateProfileInput(normalized)) {
      case (?message) { Runtime.trap(message) };
      case null {};
    };
    CompanyLib.updateCompanyProfile({ company }, normalized);
  };
};
