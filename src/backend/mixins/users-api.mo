import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Types "../types/users";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  userProfiles : Map.Map<Principal, Types.UserProfile>,
) {
  func usersState() : UsersLib.State {
    { userProfiles };
  };

  func requireUsersAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query ({ caller }) func listUsers() : async [Types.UserView] {
    requireUsersAdmin(caller);
    UsersLib.listUsers(usersState());
  };

  public shared ({ caller }) func setUserRole(user : Principal, role : Types.UserRole) : async Types.UserView {
    requireUsersAdmin(caller);
    UsersLib.setUserRole(usersState(), user, role, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfile {
    UsersLib.getCallerProfile(usersState(), caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(name : Text) : async Types.UserProfile {
    UsersLib.saveCallerProfile(usersState(), caller, name);
  };
};
