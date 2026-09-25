import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Types "../types/users";

module {
  public type State = {
    userProfiles : Map.Map<Principal, Types.UserProfile>;
  };

  func toView(principal : Principal, profile : Types.UserProfile) : Types.UserView {
    {
      principal;
      name = profile.name;
      role = profile.role;
      createdAt = profile.createdAt;
    };
  };

  public func listUsers(state : State) : [Types.UserView] {
    state.userProfiles.entries().map(
      func((principal, profile)) = toView(principal, profile)
    ).toArray();
  };

  public func setUserRole(state : State, user : Principal, role : Types.UserRole, performedBy : Principal) : Types.UserView {
    ignore performedBy;
    let profile = state.userProfiles.get(user) ?? Runtime.trap("User not found");
    let updated : Types.UserProfile = { profile with role };
    state.userProfiles.add(user, updated);
    toView(user, updated);
  };

  public func getCallerProfile(state : State, caller : Principal) : ?Types.UserProfile {
    state.userProfiles.get(caller);
  };

  public func saveCallerProfile(state : State, caller : Principal, name : Text) : Types.UserProfile {
    let profile = switch (state.userProfiles.get(caller)) {
      case (?existing) { { existing with name } };
      case null {
        {
          name;
          role = #user;
          createdAt = Time.now();
        };
      };
    };
    state.userProfiles.add(caller, profile);
    profile;
  };
};
