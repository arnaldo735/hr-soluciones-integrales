/// API pública del respaldo en Google Drive. Todos los endpoints exigen rol
/// administrador.

import Char "mo:core/Char";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";

import Types "../types/backup";
import BackupLib "../lib/backup";

mixin (
  accessControlState : AccessControl.AccessControlState,
  driveCredentials : { var credentials : ?Types.DriveCredentials },
  backupState : BackupLib.State,
) {
  func requireBackupAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
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
  public shared ({ caller }) func getDriveConnectionStatus() : async Types.DriveConnectionStatus {
    requireBackupAdmin(caller);
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
  public shared ({ caller }) func startDriveAuthorization() : async Types.DriveAuthStart {
    requireBackupAdmin(caller);
    await BackupLib.startAuthorization(oauthConfig<system>());
  };

  /// Completa la autorización OAuth con el código devuelto por Google.
  public shared ({ caller }) func completeDriveAuthorization(code : Text, state : Text) : async Types.DriveAuthResult {
    requireBackupAdmin(caller);
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
  public shared ({ caller }) func disconnectDrive() : async () {
    requireBackupAdmin(caller);
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
  public shared ({ caller }) func createBackup() : async Types.BackupOutcome {
    requireBackupAdmin(caller);
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

  /// Genera la copia de seguridad local: devuelve el mismo JSON que el
  /// respaldo a Drive y el nombre del archivo con fecha y hora, para que el
  /// frontend lo descargue en el equipo del usuario. Es una **consulta** de
  /// solo lectura: no espera a ningún canister ni muta estado.
  public query ({ caller }) func downloadLocalBackup() : async Types.LocalBackup {
    requireBackupAdmin(caller);
    let now = Time.now();
    {
      fileName = BackupLib.localBackupFileName(now);
      generatedAt = now;
      json = BackupLib.serializeBackup(backupState);
    };
  };

  /// Lista los respaldos recientes desde el Drive del administrador.
  public shared ({ caller }) func listBackups() : async Types.BackupListOutcome {
    requireBackupAdmin(caller);
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
};
