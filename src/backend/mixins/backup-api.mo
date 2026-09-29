/// API pública del respaldo en Google Drive. Todos los endpoints exigen rol
/// administrador.

import Char "mo:core/Char";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/backup";
import UserTypes "../types/users";
import BackupLib "../lib/backup";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  driveCredentials : { var credentials : ?Types.DriveCredentials },
  backupState : BackupLib.State,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireBackupAdmin(caller : Principal, token : ?Text) {
    if (not UsersLib.isAdmin({ credentials; sessions; roles }, accessControlState, caller, token)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // Lee la configuración OAuth de las variables de entorno del canister. Se
  // lee en cada llamada (no se cachea) para que un cambio de configuración en
  // un canister en ejecución sea visible sin redesplegar. Devuelve `null`
  // cuando falta alguna variable: nunca lanza un trap, de modo que la consulta
  // de estado siempre puede responder.
  func readOAuthConfig<system>() : ?BackupLib.OAuthConfig {
    let clientId = Runtime.envVar<system>(BackupLib.OAUTH_CLIENT_ID_VAR);
    let clientSecret = Runtime.envVar<system>(BackupLib.OAUTH_CLIENT_SECRET_VAR);
    let redirectUri = Runtime.envVar<system>(BackupLib.OAUTH_REDIRECT_URI_VAR);
    switch (clientId, clientSecret, redirectUri) {
      case (?id, ?secret, ?uri) {
        if (id.trim(#predicate(Char.isWhitespace)) == "" or secret.trim(#predicate(Char.isWhitespace)) == "" or uri.trim(#predicate(Char.isWhitespace)) == "") {
          null;
        } else {
          ?{ clientId = id; clientSecret = secret; redirectUri = uri };
        };
      };
      case _ { null };
    };
  };

  // Estado de configuración OAuth, calculado sin traps. Nombra exactamente las
  // variables de entorno ausentes para que la pantalla de Configuración pueda
  // indicar cómo completarlas.
  func oauthConfigStatus<system>() : Types.DriveConfigStatus {
    BackupLib.configStatus(
      Runtime.envVar<system>(BackupLib.OAUTH_CLIENT_ID_VAR),
      Runtime.envVar<system>(BackupLib.OAUTH_CLIENT_SECRET_VAR),
      Runtime.envVar<system>(BackupLib.OAUTH_REDIRECT_URI_VAR),
    );
  };

  // Configuración OAuth para las operaciones que la necesitan. Falla con un
  // mensaje que nombra la variable ausente (nunca con un error genérico).
  func oauthConfig<system>() : BackupLib.OAuthConfig {
    switch (readOAuthConfig<system>()) {
      case (?config) { config };
      case null {
        let status = oauthConfigStatus<system>();
        Runtime.trap(
          "Google Drive no está configurado: falta " # status.missingVariables.values().join(", ")
        );
      };
    };
  };

  /// Estado de la conexión con Google Drive del administrador. Es tolerante a
  /// credenciales ausentes: nunca lanza un trap por configuración faltante y
  /// siempre incluye `configuration` con las variables ausentes. Es una
  /// actualización (no consulta) porque lee las variables de entorno del
  /// canister, que requieren la capacidad `<system>`.
  public shared ({ caller }) func getDriveConnectionStatus(token : ?Text) : async Types.DriveConnectionStatus {
    requireBackupAdmin(caller, token);
    let configuration = oauthConfigStatus<system>();
    switch (driveCredentials.credentials) {
      case (?credentials) {
        {
          connected = credentials.refreshToken != "";
          accountEmail = credentials.accountEmail;
          connectedAt = ?credentials.connectedAt;
          configuration;
        };
      };
      case null {
        { connected = false; accountEmail = null; connectedAt = null; configuration };
      };
    };
  };

  /// Inicia la autorización OAuth (PKCE) de la cuenta propia del
  /// administrador.
  public shared ({ caller }) func startDriveAuthorization(token : ?Text) : async Types.DriveAuthStart {
    requireBackupAdmin(caller, token);
    await BackupLib.startAuthorization(oauthConfig<system>());
  };

  /// Completa la autorización OAuth con el código devuelto por Google.
  public shared ({ caller }) func completeDriveAuthorization(token : ?Text, code : Text, state : Text) : async Types.DriveAuthResult {
    requireBackupAdmin(caller, token);
    let result = await BackupLib.completeAuthorization(oauthConfig<system>(), code, state);
    driveCredentials.credentials := ?{
      var refreshToken = result.refreshToken;
      var accessToken = ?result.accessToken;
      var accessTokenExpiresAt = result.expiresAt;
      var accountEmail = result.accountEmail;
      var connectedAt = Time.now();
    };
    { connected = true; accountEmail = result.accountEmail };
  };

  /// Revoca la conexión con Google Drive del administrador.
  public shared ({ caller }) func disconnectDrive(token : ?Text) : async () {
    requireBackupAdmin(caller, token);
    switch (driveCredentials.credentials) {
      case (?credentials) {
        await BackupLib.disconnect(credentials);
        driveCredentials.credentials := null;
      };
      case null {};
    };
  };

  // Mensaje de configuración faltante para devolverlo como error controlado
  // (nunca como trap) en las operaciones de respaldo.
  func missingConfigMessage<system>() : Text {
    let status = oauthConfigStatus<system>();
    "Google Drive no está configurado: falta " # status.missingVariables.values().join(", ");
  };

  /// Genera el respaldo y lo sube al Drive del administrador.
  public shared ({ caller }) func createBackup(token : ?Text) : async Types.BackupOutcome {
    requireBackupAdmin(caller, token);
    switch (driveCredentials.credentials) {
      case (?credentials) {
        switch (readOAuthConfig<system>()) {
          case (?config) { await BackupLib.createBackup(config, credentials, backupState) };
          case null { #err(#driveFailed(missingConfigMessage<system>())) };
        };
      };
      case null { #err(#notConnected) };
    };
  };

  /// Manifiesto de la copia de seguridad local: devuelve el nombre del archivo,
  /// el momento de generación y el plan ordenado de secciones, **sin**
  /// serializar ningún dato. Es una **consulta** de solo lectura.
  ///
  /// El frontend arma el JSON raíz así:
  /// `{ "generatedAt": <generatedAt>, "<sections[0]>": <valor>, ... }`, donde
  /// cada valor se obtiene con `getBackupSection(index, offset, limit)`.
  public query ({ caller }) func getLocalBackupManifest(token : ?Text) : async Types.LocalBackupManifest {
    requireBackupAdmin(caller, token);
    BackupLib.localBackupManifest(Time.now());
  };

  /// Devuelve una página de una sección del respaldo. `index` es la posición
  /// dentro de `manifest.sections`; `offset` y `limit` paginan las secciones de
  /// colección (las de un único registro los ignoran). `limit` se acota a
  /// `manifest.maxPageSize`. El frontend concatena las páginas de cada sección
  /// hasta que `done` sea `true`.
  ///
  /// Es una **consulta** de solo lectura: serializa únicamente la página
  /// pedida, de modo que ninguna llamada se acerca al límite de instrucciones
  /// por mensaje.
  public query ({ caller }) func getBackupSection(
    token : ?Text,
    index : Nat,
    offset : Nat,
    limit : Nat,
  ) : async Types.BackupSectionChunk {
    requireBackupAdmin(caller, token);
    // Se acota el tamaño de página al máximo soportado y se reporta el valor
    // efectivo para que el frontend pueda avanzar el `offset` correctamente.
    let effective = if (limit == 0 or limit > BackupLib.MAX_PAGE_SIZE) { BackupLib.MAX_PAGE_SIZE } else { limit };
    let (json, total, done) = BackupLib.sectionChunk(backupState, index, offset, effective);
    {
      key = if (index < BackupLib.SECTION_KEYS.size()) { BackupLib.SECTION_KEYS[index] } else { "" };
      index;
      json;
      offset;
      limit = effective;
      total;
      done;
    };
  };

  /// Lista los respaldos recientes desde el Drive del administrador.
  public shared ({ caller }) func listBackups(token : ?Text) : async Types.BackupListOutcome {
    requireBackupAdmin(caller, token);
    switch (driveCredentials.credentials) {
      case (?credentials) {
        switch (readOAuthConfig<system>()) {
          case (?config) { await BackupLib.listBackups(config, credentials) };
          case null { #err(#driveFailed(missingConfigMessage<system>())) };
        };
      };
      case null { #err(#notConnected) };
    };
  };

  // ── Restauración desde una copia local ────────────────────────────────────

  /// Valida un archivo de copia local y devuelve su vista previa (fecha de
  /// generación y secciones presentes) **sin alterar ningún dato**. El
  /// frontend la usa para mostrar la confirmación antes de restaurar.
  ///
  /// Es una **actualización** (no consulta) porque recibe el contenido del
  /// archivo como parámetro; no modifica el estado.
  public shared ({ caller }) func validateRestoreFile(token : ?Text, json : Text) : async Types.RestorePreviewOutcome {
    requireBackupAdmin(caller, token);
    BackupLib.validateRestoreFile(json);
  };

  /// Restaura **una** sección del archivo de copia local, sobrescribiendo solo
  /// esa colección. `index` es la posición dentro de `manifest.sections`
  /// (el mismo orden de `SECTION_KEYS`). El frontend llama una vez por sección
  /// seleccionada, de modo que ninguna llamada procesa el archivo completo y
  /// se respeta el límite de instrucciones por mensaje.
  ///
  /// Un archivo inválido, una versión incompatible o una sección con formato
  /// incorrecto se rechazan con un error tipado **sin alterar los datos**.
  public shared ({ caller }) func restoreSection(
    token : ?Text,
    json : Text,
    index : Nat,
  ) : async Types.RestoreSectionOutcome {
    requireBackupAdmin(caller, token);
    BackupLib.restoreSection(backupState, json, index);
  };
};
