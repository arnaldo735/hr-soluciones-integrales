import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/users";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  userProfiles : Map.Map<Principal, Types.UserProfile>,
  credentials : Map.Map<Common.Id, Types.Credential>,
  sessions : Map.Map<Text, Types.Session>,
  roles : Map.Map<Common.Id, Types.Role>,
  counters : { var nextUserId : Nat; var nextRoleId : Nat },
) {
  func usersState() : UsersLib.State {
    { userProfiles; credentials; sessions; roles; counters };
  };

  // Un administrador es quien tiene rol `#admin` en el control de acceso
  // (Internet Identity) O quien tiene una sesión válida con rol
  // Administrador. La vía de Internet Identity sigue funcionando igual.
  func requireUsersAdmin(caller : Principal, token : ?Text) {
    if (UsersLib.isAdmin(usersState(), accessControlState, caller, token)) {
      return;
    };
    Runtime.trap("Unauthorized: Only admins can manage users and roles");
  };

  // ── Sesión ──────────────────────────────────────────────────────────────
  public shared func login(username : Text, password : Text) : async Types.LoginResult {
    await UsersLib.login(usersState(), username, password);
  };

  public shared func logout(token : Text) : async Bool {
    UsersLib.logout(usersState(), token);
  };

  public query func getSession(token : Text) : async ?Types.SessionInfo {
    UsersLib.getSession(usersState(), token);
  };

  // ── Usuarios (admin) ────────────────────────────────────────────────────
  public query ({ caller }) func listUsersPage(token : ?Text, search : ?Text, offset : Nat, limit : Nat) : async Types.UserPage {
    requireUsersAdmin(caller, token);
    UsersLib.listUsersPage(usersState(), search, offset, limit);
  };

  public shared ({ caller }) func createUser(token : ?Text, username : Text, name : Text, roleId : Common.Id, temporaryPassword : Text) : async Types.UserListItem {
    requireUsersAdmin(caller, token);
    await UsersLib.createUser(usersState(), username, name, roleId, temporaryPassword);
  };

  public shared ({ caller }) func updateUserRole(token : ?Text, userId : Common.Id, roleId : Common.Id) : async Types.UserListItem {
    requireUsersAdmin(caller, token);
    UsersLib.updateUserRole(usersState(), userId, roleId);
  };

  public shared ({ caller }) func setUserActive(token : ?Text, userId : Common.Id, active : Bool) : async Types.UserListItem {
    requireUsersAdmin(caller, token);
    UsersLib.setUserActive(usersState(), userId, active);
  };

  public shared ({ caller }) func resetUserPassword(token : ?Text, userId : Common.Id) : async Types.ResetPasswordResult {
    requireUsersAdmin(caller, token);
    await UsersLib.resetUserPassword(usersState(), userId);
  };

  public shared ({ caller }) func deleteUser(token : ?Text, userId : Common.Id) : async Bool {
    requireUsersAdmin(caller, token);
    let callerUserId = switch (UsersLib.resolveSession(usersState(), token)) {
      case (?session) { ?session.userId };
      case null { null };
    };
    UsersLib.deleteUser(usersState(), userId, callerUserId);
  };

  // ── Roles editables (admin) ─────────────────────────────────────────────
  public query ({ caller }) func listRoles(token : ?Text) : async [Types.Role] {
    requireUsersAdmin(caller, token);
    UsersLib.listRoles(usersState());
  };

  public shared ({ caller }) func createRole(token : ?Text, input : Types.RoleInput) : async Types.Role {
    requireUsersAdmin(caller, token);
    UsersLib.createRole(usersState(), input);
  };

  public shared ({ caller }) func updateRole(token : ?Text, roleId : Common.Id, input : Types.RoleInput) : async Types.Role {
    requireUsersAdmin(caller, token);
    UsersLib.updateRole(usersState(), roleId, input);
  };

  public shared ({ caller }) func deleteRole(token : ?Text, roleId : Common.Id) : async Bool {
    requireUsersAdmin(caller, token);
    UsersLib.deleteRole(usersState(), roleId);
  };

  // ── Perfil y seguridad ──────────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?Types.UserProfile {
    UsersLib.getCallerProfile(usersState(), caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(name : Text) : async Types.UserProfile {
    UsersLib.saveCallerProfile(usersState(), caller, name);
  };

  // Actualiza el nombre visible del usuario de la sesión (vía usuario y
  // contraseña). Devuelve la sesión actualizada para refrescar la interfaz.
  public shared func updateCallerName(token : Text, name : Text) : async Types.SessionInfo {
    let session = UsersLib.resolveSession(usersState(), ?token)
      ?? Runtime.trap("Sesión inválida o vencida");
    UsersLib.updateCallerName(usersState(), session.userId, name);
  };

  public shared func changeOwnPassword(token : Text, currentPassword : Text, newPassword : Text) : async Bool {
    let session = UsersLib.resolveSession(usersState(), ?token)
      ?? Runtime.trap("Sesión inválida o vencida");
    await UsersLib.changeOwnPassword(usersState(), session.userId, currentPassword, newPassword);
  };
};
