import Blob "mo:core/Blob";
import Char "mo:core/Char";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Principal "mo:core/Principal";
import Random "mo:core/Random";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Sha256 "mo:sha2/Sha256";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/users";
import Search "../lib/search";

module {
  // ── Estado del dominio de usuarios ──────────────────────────────────────
  // `userProfiles` es el estado existente (Internet Identity) y se conserva
  // intacto. Las credenciales, sesiones y roles son estado nuevo.
  public type State = {
    userProfiles : Map.Map<Principal, Types.UserProfile>;
    credentials : Map.Map<Common.Id, Types.Credential>;
    sessions : Map.Map<Text, Types.Session>;
    roles : Map.Map<Common.Id, Types.Role>;
    counters : { var nextUserId : Nat; var nextRoleId : Nat };
  };

  // Subconjunto de `State` suficiente para resolver una sesión. Permite que
  // cualquier mixin reconozca a un administrador por contraseña sin recibir
  // el estado completo de usuarios. Un `State` es estructuralmente compatible.
  public type SessionState = {
    credentials : Map.Map<Common.Id, Types.Credential>;
    sessions : Map.Map<Text, Types.Session>;
    roles : Map.Map<Common.Id, Types.Role>;
  };

  // ── Constantes de seguridad ─────────────────────────────────────────────
  // Iteraciones del hash SHA-256 encadenado. Un valor alto encarece la fuerza
  // bruta sin volver lenta la verificación interactiva.
  let PASSWORD_ITERATIONS : Nat = 10_000;
  // Vigencia de una sesión: 7 días en nanosegundos.
  let SESSION_TTL_NS : Int = 604_800_000_000_000;
  // Longitud de la contraseña temporal generada.
  let TEMP_PASSWORD_LENGTH : Nat = 10;

  // Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/l) para que la contraseña
  // temporal se pueda dictar o transcribir sin errores.
  let TEMP_ALPHABET : [Char] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
    'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '2',
    '3', '4', '5', '6', '7', '8', '9',
  ];

  // ── Utilidades internas ─────────────────────────────────────────────────

  // Compara dos blobs byte a byte en tiempo constante respecto al contenido.
  func blobsEqual(a : Blob, b : Blob) : Bool {
    if (a.size() != b.size()) { return false };
    let ab = a.toArray();
    let bb = b.toArray();
    var diff : Nat8 = 0;
    var i = 0;
    while (i < ab.size()) {
      diff := diff | (ab[i] ^ bb[i]);
      i += 1;
    };
    diff == 0;
  };

  // Normaliza un nombre de usuario para comparaciones y búsquedas: sin
  // espacios externos y en minúsculas. El valor almacenado conserva el texto
  // original que escribió el administrador.
  func normalizeUsername(username : Text) : Text {
    Search.normalize(username);
  };

  // Busca una credencial por nombre de usuario (comparación sin distinguir
  // mayúsculas ni espacios externos). Devuelve la primera coincidencia.
  func findCredentialByUsername(state : State, username : Text) : ?Types.Credential {
    let target = normalizeUsername(username);
    state.credentials.values().find(func(c) = normalizeUsername(c.username) == target);
  };

  // Busca una credencial por id.
  func findCredentialById(state : SessionState, userId : Common.Id) : ?Types.Credential {
    state.credentials.get(userId);
  };

  // Nombre del rol de una credencial; cadena vacía si el rol ya no existe.
  func roleNameOf(state : SessionState, roleId : Common.Id) : Text {
    switch (state.roles.get(roleId)) {
      case (?role) { role.name };
      case null { "" };
    };
  };

  // Módulos permitidos del rol; arreglo vacío si el rol ya no existe.
  func roleModulesOf(state : SessionState, roleId : Common.Id) : [Types.ModuleKey] {
    switch (state.roles.get(roleId)) {
      case (?role) { role.modules };
      case null { [] };
    };
  };

  // Construye la vista de sesión de una credencial activa.
  func sessionInfoOf(state : SessionState, credential : Types.Credential) : Types.SessionInfo {
    {
      userId = credential.id;
      username = credential.username;
      name = credential.name;
      roleId = credential.roleId;
      roleName = roleNameOf(state, credential.roleId);
      modules = roleModulesOf(state, credential.roleId);
    };
  };

  // Construye la fila de listado de una credencial.
  func userListItemOf(state : State, credential : Types.Credential) : Types.UserListItem {
    {
      id = credential.id;
      username = credential.username;
      name = credential.name;
      roleId = credential.roleId;
      roleName = roleNameOf(state, credential.roleId);
      active = credential.active;
      createdAt = credential.createdAt;
    };
  };

  // ¿Existe alguna credencial que referencie este rol?
  func roleInUse(state : State, roleId : Common.Id) : Bool {
    state.credentials.values().any(func(c) = c.roleId == roleId);
  };

  // ¿Existe ya un rol con este nombre (sin distinguir mayúsculas ni espacios)?
  func roleNameExists(state : State, name : Text, exceptId : ?Common.Id) : Bool {
    let target = Search.normalize(name);
    state.roles.values().any(func(r) {
      let sameName = Search.equals(r.name, target);
      let isSelf = switch (exceptId) {
        case (?id) { r.id == id };
        case null { false };
      };
      sameName and not isSelf;
    });
  };

  // ── Perfil existente (Internet Identity) ────────────────────────────────
  public func listUsers(state : State) : [Types.UserView] {
    state.userProfiles.entries()
      .map(func((principal, profile)) = {
        principal;
        name = profile.name;
        role = profile.role;
        createdAt = profile.createdAt;
      })
      .toArray();
  };

  public func setUserRole(state : State, user : Principal, role : Types.UserRole, performedBy : Principal) : Types.UserView {
    ignore performedBy;
    let existing = state.userProfiles.get(user);
    let createdAt = switch (existing) {
      case (?profile) { profile.createdAt };
      case null { Time.now() };
    };
    let name = switch (existing) {
      case (?profile) { profile.name };
      case null { "" };
    };
    let updated : Types.UserProfile = { name; role; createdAt };
    state.userProfiles.add(user, updated);
    { principal = user; name; role; createdAt };
  };

  public func getCallerProfile(state : State, caller : Principal) : ?Types.UserProfile {
    state.userProfiles.get(caller);
  };

  public func saveCallerProfile(state : State, caller : Principal, name : Text) : Types.UserProfile {
    let existing = state.userProfiles.get(caller);
    let profile : Types.UserProfile = switch (existing) {
      case (?current) { { current with name } };
      case null { { name; role = #user; createdAt = Time.now() } };
    };
    state.userProfiles.add(caller, profile);
    profile;
  };

  // ── Roles editables ─────────────────────────────────────────────────────
  public func listRoles(state : State) : [Types.Role] {
    state.roles.values().toArray().sort(func(a, b) = Nat.compare(a.id, b.id));
  };

  public func createRole(state : State, input : Types.RoleInput) : Types.Role {
    let name = input.name.trim(#predicate(Char.isWhitespace));
    if (name == "") {
      Runtime.trap("El nombre del rol es obligatorio");
    };
    if (roleNameExists(state, name, null)) {
      Runtime.trap("Ya existe un rol con el nombre " # name);
    };
    let id = state.counters.nextRoleId;
    state.counters.nextRoleId := id + 1;
    let role : Types.Role = {
      id;
      name;
      kind = #custom;
      modules = input.modules;
      createdAt = Time.now();
    };
    state.roles.add(id, role);
    role;
  };

  public func updateRole(state : State, roleId : Common.Id, input : Types.RoleInput) : Types.Role {
    let existing = state.roles.get(roleId)
      ?? Runtime.trap("Rol no encontrado");
    switch (existing.kind) {
      case (#builtin) { Runtime.trap("Los roles integrados no se pueden modificar") };
      case (#custom) {};
    };
    let name = input.name.trim(#predicate(Char.isWhitespace));
    if (name == "") {
      Runtime.trap("El nombre del rol es obligatorio");
    };
    if (roleNameExists(state, name, ?roleId)) {
      Runtime.trap("Ya existe un rol con el nombre " # name);
    };
    let updated : Types.Role = { existing with name; modules = input.modules };
    state.roles.add(roleId, updated);
    updated;
  };

  public func deleteRole(state : State, roleId : Common.Id) : Bool {
    let existing = state.roles.get(roleId)
      ?? Runtime.trap("Rol no encontrado");
    switch (existing.kind) {
      case (#builtin) { Runtime.trap("Los roles integrados no se pueden eliminar") };
      case (#custom) {};
    };
    if (roleInUse(state, roleId)) {
      Runtime.trap("El rol está asignado a uno o más usuarios");
    };
    state.roles.remove(roleId);
    true;
  };

  // ── Usuarios con usuario y contraseña ───────────────────────────────────
  public func listUsersPage(state : State, search : ?Text, offset : Nat, limit : Nat) : Types.UserPage {
    let term = switch (search) {
      case (?value) { Search.normalize(value) };
      case null { "" };
    };
    let all = state.credentials.values().toArray();
    let matching = if (term == "") {
      all;
    } else {
      all.filter(func(c) {
        Search.containsAny([c.name, c.username], term);
      });
    };
    let sorted = matching.sort(func(a, b) = Nat.compare(a.id, b.id));
    let total = sorted.size();
    let items = if (offset >= total) {
      [];
    } else {
      let end = Nat.min(offset + limit, total);
      sorted.sliceToArray(offset.toInt(), end.toInt()).map(func(c) = userListItemOf(state, c));
    };
    { items; total; offset; limit };
  };

  public func createUser(state : State, username : Text, name : Text, roleId : Common.Id, temporaryPassword : Text) : async Types.UserListItem {
    let cleanUsername = username.trim(#predicate(Char.isWhitespace));
    if (cleanUsername == "") {
      Runtime.trap("El usuario de acceso es obligatorio");
    };
    if (temporaryPassword == "") {
      Runtime.trap("La contraseña temporal es obligatoria");
    };
    switch (findCredentialByUsername(state, cleanUsername)) {
      case (?_) { Runtime.trap("Ya existe un usuario con ese nombre de acceso") };
      case null {};
    };
    // El primer usuario creado es el administrador; los siguientes usan el rol
    // indicado o, si no se indica, el rol Mecánico (id 1).
    let isFirst = state.credentials.size() == 0;
    let effectiveRoleId = if (isFirst) {
      0;
    } else if (roleId == 0 and not state.roles.containsKey(0)) {
      1;
    } else {
      roleId;
    };
    if (not state.roles.containsKey(effectiveRoleId)) {
      Runtime.trap("Rol no encontrado");
    };
    let id = state.counters.nextUserId;
    state.counters.nextUserId := id + 1;
    let salt = await generateSalt();
    let now = Time.now();
    let credential : Types.Credential = {
      id;
      username = cleanUsername;
      name = name.trim(#predicate(Char.isWhitespace));
      roleId = effectiveRoleId;
      active = true;
      salt;
      passwordHash = hashPassword(temporaryPassword, salt, PASSWORD_ITERATIONS);
      iterations = PASSWORD_ITERATIONS;
      createdAt = now;
      updatedAt = now;
    };
    state.credentials.add(id, credential);
    userListItemOf(state, credential);
  };

  public func updateUserRole(state : State, userId : Common.Id, roleId : Common.Id) : Types.UserListItem {
    let existing = findCredentialById(state, userId)
      ?? Runtime.trap("Usuario no encontrado");
    if (not state.roles.containsKey(roleId)) {
      Runtime.trap("Rol no encontrado");
    };
    let updated : Types.Credential = { existing with roleId; updatedAt = Time.now() };
    state.credentials.add(userId, updated);
    userListItemOf(state, updated);
  };

  public func setUserActive(state : State, userId : Common.Id, active : Bool) : Types.UserListItem {
    let existing = findCredentialById(state, userId)
      ?? Runtime.trap("Usuario no encontrado");
    let updated : Types.Credential = { existing with active; updatedAt = Time.now() };
    state.credentials.add(userId, updated);
    // Al desactivar una cuenta se cierran todas sus sesiones abiertas.
    if (not active) {
      revokeSessionsFor(state, userId);
    };
    userListItemOf(state, updated);
  };

  public func resetUserPassword(state : State, userId : Common.Id) : async Types.ResetPasswordResult {
    let existing = findCredentialById(state, userId)
      ?? Runtime.trap("Usuario no encontrado");
    let temporaryPassword = await generateTemporaryPassword();
    let salt = await generateSalt();
    let updated : Types.Credential = {
      existing with
      salt;
      passwordHash = hashPassword(temporaryPassword, salt, PASSWORD_ITERATIONS);
      iterations = PASSWORD_ITERATIONS;
      updatedAt = Time.now();
    };
    state.credentials.add(userId, updated);
    // Restablecer la contraseña invalida las sesiones abiertas del usuario.
    revokeSessionsFor(state, userId);
    { userId; temporaryPassword };
  };

  public func deleteUser(state : State, userId : Common.Id, callerUserId : ?Common.Id) : Bool {
    let existing = findCredentialById(state, userId)
      ?? Runtime.trap("Usuario no encontrado");
    switch (callerUserId) {
      case (?callerId) {
        if (callerId == userId) {
          Runtime.trap("No puede eliminar su propia cuenta de administrador");
        };
      };
      case null {};
    };
    ignore existing;
    state.credentials.remove(userId);
    revokeSessionsFor(state, userId);
    true;
  };

  // ── Autenticación con contraseña ────────────────────────────────────────
  public func login(state : State, username : Text, password : Text) : async Types.LoginResult {
    let credential = switch (findCredentialByUsername(state, username)) {
      case (?c) { c };
      case null { Runtime.trap("Usuario o contraseña incorrectos") };
    };
    let candidate = hashPassword(password, credential.salt, credential.iterations);
    if (not blobsEqual(candidate, credential.passwordHash)) {
      Runtime.trap("Usuario o contraseña incorrectos");
    };
    if (not credential.active) {
      Runtime.trap("La cuenta está desactivada");
    };
    let now = Time.now();
    let token = await generateToken();
    let session : Types.Session = {
      token;
      credentialId = credential.id;
      createdAt = now;
      expiresAt = now + SESSION_TTL_NS;
    };
    state.sessions.add(token, session);
    {
      token;
      expiresAt = session.expiresAt;
      user = sessionInfoOf(state, credential);
    };
  };

  public func logout(state : State, token : Text) : Bool {
    switch (state.sessions.get(token)) {
      case (?_) {
        state.sessions.remove(token);
        true;
      };
      case null { false };
    };
  };

  public func getSession(state : SessionState, token : Text) : ?Types.SessionInfo {
    switch (state.sessions.get(token)) {
      case (?session) {
        if (session.expiresAt <= Time.now()) {
          null;
        } else {
          switch (findCredentialById(state, session.credentialId)) {
            case (?credential) {
              if (credential.active) { ?sessionInfoOf(state, credential) } else { null };
            };
            case null { null };
          };
        };
      };
      case null { null };
    };
  };

  // Actualiza el nombre visible de la credencial del usuario de la sesión.
  // Es la vía para que un usuario con usuario y contraseña cambie el nombre
  // que aparece en el listado de usuarios; la vía de Internet Identity sigue
  // usando `saveCallerProfile`.
  public func updateCallerName(state : State, userId : Common.Id, name : Text) : Types.SessionInfo {
    let existing = findCredentialById(state, userId)
      ?? Runtime.trap("Usuario no encontrado");
    let cleanName = name.trim(#predicate(Char.isWhitespace));
    if (cleanName == "") {
      Runtime.trap("El nombre es obligatorio");
    };
    let updated : Types.Credential = { existing with name = cleanName; updatedAt = Time.now() };
    state.credentials.add(userId, updated);
    sessionInfoOf(state, updated);
  };

  public func changeOwnPassword(state : State, userId : Common.Id, currentPassword : Text, newPassword : Text) : async Bool {
    let existing = findCredentialById(state, userId)
      ?? Runtime.trap("Usuario no encontrado");
    let candidate = hashPassword(currentPassword, existing.salt, existing.iterations);
    if (not blobsEqual(candidate, existing.passwordHash)) {
      Runtime.trap("La contraseña actual no es correcta");
    };
    if (newPassword == "") {
      Runtime.trap("La nueva contraseña es obligatoria");
    };
    let salt = await generateSalt();
    let updated : Types.Credential = {
      existing with
      salt;
      passwordHash = hashPassword(newPassword, salt, PASSWORD_ITERATIONS);
      iterations = PASSWORD_ITERATIONS;
      updatedAt = Time.now();
    };
    state.credentials.add(userId, updated);
    true;
  };

  // ── Resolución de identidad efectiva ────────────────────────────────────
  // Devuelve el usuario de sesión si el token es válido y la cuenta está
  // activa; `null` en caso contrario. Es la base para reconocer a un
  // administrador autenticado por contraseña.
  public func resolveSession(state : SessionState, token : ?Text) : ?Types.SessionInfo {
    switch (token) {
      case (?value) { getSession(state, value) };
      case null { null };
    };
  };

  // ── Autorización de administrador compartida ────────────────────────────
  // Un administrador es quien tiene rol `#admin` en el control de acceso
  // (Internet Identity) O quien presenta un token de sesión válido cuyo rol
  // sea `Administrador`. Es la única comprobación que deben usar los
  // endpoints administrativos, de modo que la vía de Internet Identity y la
  // de usuario y contraseña se comporten igual.
  public func isAdmin(
    state : SessionState,
    accessControlState : AccessControl.AccessControlState,
    caller : Principal,
    token : ?Text,
  ) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (resolveSession(state, token)) {
      case (?session) { session.roleName == "Administrador" };
      case null { false };
    };
  };

  // ── Autorización por módulo compartida ──────────────────────────────────
  // Devuelve `true` cuando el llamador es administrador por Internet Identity
  // O cuando el token de sesión resuelve a un usuario activo cuyo rol incluye
  // la clave de módulo indicada. Es la comprobación que aplican los endpoints
  // con alcance de módulo, de modo que el rol asignado determine qué módulos
  // puede usar cada usuario también en el backend.
  public func canAccessModule(
    state : SessionState,
    accessControlState : AccessControl.AccessControlState,
    caller : Principal,
    token : ?Text,
    moduleKey : Text,
  ) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (resolveSession(state, token)) {
      case (?session) { session.modules.contains(moduleKey) };
      case null { false };
    };
  };

  // ── Hashing de contraseñas ──────────────────────────────────────────────
  // SHA-256 encadenado: `iterations` rondas sobre `salt ++ password`, de modo
  // que el costo de un ataque de diccionario crezca con las iteraciones.
  public func hashPassword(password : Text, salt : Blob, iterations : Nat) : Blob {
    let passwordBytes = password.encodeUtf8();
    let combined = salt.toArray().concat(passwordBytes.toArray()).toBlob();
    var digest = Sha256.fromBlob(combined);
    var i = 1;
    while (i < iterations) {
      digest := Sha256.fromBlob(digest);
      i += 1;
    };
    digest;
  };

  public func generateSalt() : async Blob {
    // 16 bytes de entropía del sistema (management canister `raw_rand`).
    let bytes = await Random.blob();
    bytes;
  };

  public func generateToken() : async Text {
    let bytes = await Random.blob();
    // El token se codifica en hexadecimal para que sea seguro como texto y
    // como clave de mapa.
    toHex(bytes);
  };

  public func generateTemporaryPassword() : async Text {
    let bytes = (await Random.blob()).toArray();
    let size = TEMP_ALPHABET.size();
    var out = "";
    var i = 0;
    while (i < TEMP_PASSWORD_LENGTH) {
      let byte = bytes[i % bytes.size()];
      out := out # TEMP_ALPHABET[byte.toNat() % size].toText();
      i += 1;
    };
    out;
  };

  // ── Utilidades internas de sesión y codificación ────────────────────────

  // Elimina todas las sesiones de una credencial (al desactivar, restablecer
  // contraseña o eliminar la cuenta).
  func revokeSessionsFor(state : State, userId : Common.Id) {
    let stale = state.sessions.values().toArray().filter(func(s) = s.credentialId == userId);
    for (session in stale.values()) {
      state.sessions.remove(session.token);
    };
  };

  // Codifica un blob como texto hexadecimal en minúsculas.
  func toHex(bytes : Blob) : Text {
    let digits : [Char] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    var out = "";
    for (byte in bytes.values()) {
      let value = byte.toNat();
      out := out # digits[value / 16].toText() # digits[value % 16].toText();
    };
    out;
  };
};
