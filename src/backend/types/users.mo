import Common "common";
import Principal "mo:core/Principal";

module {
  public type Principal = Principal.Principal;
  public type Timestamp = Common.Timestamp;
  public type UserRole = Common.UserRole;

  // ── Perfil existente (Internet Identity) ────────────────────────────────
  public type UserProfile = {
    name : Text;
    role : UserRole;
    createdAt : Timestamp;
  };

  public type UserView = {
    principal : Principal;
    name : Text;
    role : UserRole;
    createdAt : Timestamp;
  };

  public type UsersError = {
    #notFound : Principal;
    #notAuthorized;
  };

  // ── Roles editables ─────────────────────────────────────────────────────
  // Clave de módulo de la aplicación (vocabulario de navegación). Se guarda
  // como `Text` para que el administrador pueda crear roles personalizados
  // sin recompilar el backend.
  public type ModuleKey = Text;

  // Rol del sistema: los tres roles integrados no se pueden eliminar.
  // La etiqueta es `#builtin` porque `system` es palabra reservada de Motoko.
  public type RoleKind = { #builtin; #custom };

  public type Role = {
    id : Common.Id;
    name : Text;
    kind : RoleKind;
    modules : [ModuleKey];
    createdAt : Timestamp;
  };

  public type RoleInput = {
    name : Text;
    modules : [ModuleKey];
  };

  // ── Credenciales de acceso con usuario y contraseña ─────────────────────
  // La contraseña NUNCA se guarda ni se devuelve en texto plano: solo el
  // hash SHA-256 iterado y la sal aleatoria por usuario.
  public type Credential = {
    id : Common.Id;
    username : Text;
    name : Text;
    roleId : Common.Id;
    active : Bool;
    salt : Blob;
    passwordHash : Blob;
    iterations : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // ── Sesiones ────────────────────────────────────────────────────────────
  // El token es opaco para el cliente; el backend lo resuelve a un usuario.
  public type Session = {
    token : Text;
    credentialId : Common.Id;
    createdAt : Timestamp;
    expiresAt : Timestamp;
  };

  // ── Vistas de API ───────────────────────────────────────────────────────
  public type UserListItem = {
    id : Common.Id;
    username : Text;
    name : Text;
    roleId : Common.Id;
    roleName : Text;
    active : Bool;
    createdAt : Timestamp;
  };

  public type UserPage = {
    items : [UserListItem];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type SessionInfo = {
    userId : Common.Id;
    username : Text;
    name : Text;
    roleId : Common.Id;
    roleName : Text;
    modules : [ModuleKey];
  };

  public type LoginResult = {
    token : Text;
    expiresAt : Timestamp;
    user : SessionInfo;
  };

  public type ResetPasswordResult = {
    userId : Common.Id;
    temporaryPassword : Text;
  };

  // ── Errores de la API de acceso y usuarios ──────────────────────────────
  public type AuthError = {
    #invalidCredentials;
    #inactiveAccount;
    #duplicateUsername : Text;
    #cannotRemoveOwnAdmin;
    #roleInUse : Common.Id;
    #notAuthorized;
    #notFound : Common.Id;
    #invalidSession;
    #invalidInput : Text;
  };
};
