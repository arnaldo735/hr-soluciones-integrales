/// Tipos del dominio de respaldo en Google Drive.
///
/// El respaldo es una operación **manual** del administrador: serializa las
/// colecciones del taller a un JSON y lo sube al Drive propio del
/// administrador. No hay respaldo programado ni restauración.

module {
  /// Estado de la configuración OAuth del canister. Se calcula sin lanzar
  /// traps: si falta alguna variable de entorno, `configured` es `false` y
  /// `missingVariables` nombra exactamente las que faltan para que la pantalla
  /// de Configuración pueda indicar cómo completarlas.
  public type DriveConfigStatus = {
    configured : Bool;
    /// Nombres exactos de las variables de entorno ausentes, en el orden en
    /// que se leen (`GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
    /// `GOOGLE_OAUTH_REDIRECT_URI`). Vacío cuando `configured` es `true`.
    missingVariables : [Text];
  };

  /// Estado de la conexión OAuth del administrador con Google Drive.
  public type DriveConnectionStatus = {
    connected : Bool;
    /// Correo de la cuenta de Google autorizada, cuando se conoce.
    accountEmail : ?Text;
    /// Momento en que se autorizó la conexión (nanosegundos).
    connectedAt : ?Int;
    /// Estado de la configuración OAuth del canister. Permite distinguir
    /// «no configurado» de «desconectado» sin que la consulta falle.
    configuration : DriveConfigStatus;
  };

  /// Resultado de iniciar el flujo OAuth: la URL a la que el navegador debe
  /// redirigir al administrador y el `state` que debe devolverse intacto.
  public type DriveAuthStart = {
    authorizationUrl : Text;
    state : Text;
  };

  /// Resultado de completar el flujo OAuth con el código de autorización.
  public type DriveAuthResult = {
    connected : Bool;
    accountEmail : ?Text;
  };

  /// Tokens obtenidos al completar el flujo OAuth. Uso interno: el mixin los
  /// persiste en el estado estable y solo expone `DriveAuthResult`.
  public type DriveAuthTokens = {
    connected : Bool;
    accountEmail : ?Text;
    refreshToken : Text;
    accessToken : Text;
    expiresAt : ?Int;
  };

  /// Metadatos de un archivo de respaldo leído desde el Drive del
  /// administrador.
  public type BackupFile = {
    fileId : Text;
    name : Text;
    /// Tamaño en bytes.
    size : Nat;
    /// Momento de creación del archivo (nanosegundos).
    createdAt : Int;
    /// Enlace para abrirlo en Google Drive.
    webViewLink : Text;
  };

  /// Resultado de un respaldo exitoso.
  public type BackupResult = {
    fileId : Text;
    name : Text;
    size : Nat;
    /// Momento en que se generó el respaldo (nanosegundos).
    createdAt : Int;
    webViewLink : Text;
  };

  /// Error de una operación de respaldo, para que el frontend pueda
  /// distinguir «reintentar» de «volver a conectar».
  public type BackupError = {
    /// No hay conexión con Drive o la autorización expiró.
    #notConnected;
    /// La conexión con Drive falló al generar o subir el respaldo.
    #driveFailed : Text;
    /// El llamador no es administrador.
    #notAuthorized;
  };

  /// Resultado de generar y subir un respaldo.
  public type BackupOutcome = {
    #ok : BackupResult;
    #err : BackupError;
  };

  /// Resultado de listar los respaldos recientes.
  public type BackupListOutcome = {
    #ok : [BackupFile];
    #err : BackupError;
  };

  /// Copia de seguridad local: el JSON completo de la empresa y el nombre del
  /// archivo (con fecha y hora) que el frontend descarga en el equipo del
  /// usuario. Contiene exactamente los mismos datos que el respaldo a Drive.
  public type LocalBackup = {
    /// Nombre sugerido del archivo, con fecha y hora de generación.
    fileName : Text;
    /// Momento en que se generó la copia (nanosegundos).
    generatedAt : Int;
    /// JSON completo de la empresa.
    json : Text;
  };

  /// Credenciales OAuth del administrador, persistidas en el estado estable.
  /// El `refreshToken` no rota: se guarda el primero recibido.
  public type DriveCredentials = {
    var refreshToken : Text;
    var accessToken : ?Text;
    /// Momento de expiración del `accessToken` (nanosegundos).
    var accessTokenExpiresAt : ?Int;
    var accountEmail : ?Text;
    var connectedAt : Int;
  };
};
