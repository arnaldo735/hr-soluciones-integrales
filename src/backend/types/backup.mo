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

  /// Manifiesto de la copia local paginada. Describe el archivo y el plan de
  /// secciones sin serializar ningún dato, de modo que la consulta siempre
  /// responde muy por debajo del límite de instrucciones por mensaje.
  ///
  /// El frontend arma el JSON raíz así: `{ "generatedAt": <generatedAt>,
  /// "<sections[0]>": <valor>, "<sections[1]>": <valor>, ... }`, donde cada
  /// valor se obtiene con `getBackupSection(index, offset, limit)`.
  public type LocalBackupManifest = {
    /// Nombre sugerido del archivo, con fecha y hora de generación.
    fileName : Text;
    /// Momento en que se generó la copia (nanosegundos). Es el valor de la
    /// clave raíz `generatedAt`.
    generatedAt : Int;
    /// Claves raíz del JSON, en el mismo orden en que las producía
    /// `serializeBackup`. Cada posición es el índice que recibe
    /// `getBackupSection`.
    sections : [Text];
    /// Número total de secciones (`sections.size()`).
    totalSections : Nat;
    /// Tamaño máximo de página que acepta `getBackupSection` para las
    /// secciones de tipo colección. El frontend debe pedir páginas de a lo sumo
    /// este tamaño.
    maxPageSize : Nat;
  };

  /// Una página de una sección del respaldo. Para secciones de colección,
  /// `json` es un arreglo JSON con los elementos `[offset, offset + limit)`;
  /// el frontend concatena las páginas en un solo arreglo. Para secciones de
  /// un único objeto (configuración del negocio y perfil de la empresa),
  /// `json` es el objeto completo y `done` es `true` en la primera llamada.
  public type BackupSectionChunk = {
    /// Clave raíz de la sección (coincide con `sections[index]`).
    key : Text;
    /// Índice de la sección dentro del manifiesto.
    index : Nat;
    /// Valor JSON de la página: arreglo para colecciones, objeto para las
    /// secciones de un único registro.
    json : Text;
    /// Desplazamiento aplicado dentro de la sección.
    offset : Nat;
    /// Número de elementos incluidos en esta página.
    limit : Nat;
    /// Número total de elementos de la sección (0 para las secciones de un
    /// único registro).
    total : Nat;
    /// `true` cuando esta página es la última de la sección.
    done : Bool;
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

  // ── Restauración desde una copia local ────────────────────────────────────
  //
  // La restauración es una operación **manual** del administrador: recibe el
  // JSON de una copia local (el mismo que produce `getLocalBackupManifest` +
  // `getBackupSection`) y sobrescribe únicamente las secciones seleccionadas.
  // Se procesa por secciones para respetar el límite de instrucciones por
  // mensaje: primero se valida el archivo (`validateRestoreFile`), luego se
  // aplica una sección por llamada (`restoreSection`).

  /// Versión del formato de copia que entiende este backend. Se escribe en la
  /// raíz del JSON como `formatVersion` y se valida al restaurar.
  public let RESTORE_FORMAT_VERSION : Nat = 1;

  /// Estado de una sección dentro del archivo de copia, tal como lo reporta la
  /// validación previa.
  public type RestoreSectionInfo = {
    /// Clave raíz de la sección (coincide con `SECTION_KEYS`).
    key : Text;
    /// Índice de la sección dentro del manifiesto.
    index : Nat;
    /// Número de registros que contiene la sección en el archivo.
    count : Nat;
  };

  /// Resultado de validar un archivo de copia antes de restaurar. No altera
  /// ningún dato: solo describe el archivo para que el frontend muestre la
  /// vista previa (fecha y secciones) antes de confirmar.
  public type RestorePreview = {
    /// Momento en que se generó la copia (nanosegundos), tomado de
    /// `generatedAt` del archivo.
    generatedAt : Int;
    /// Versión del formato declarada por el archivo.
    formatVersion : Nat;
    /// Secciones presentes en el archivo, en el orden de `SECTION_KEYS`.
    sections : [RestoreSectionInfo];
    /// Número total de secciones presentes.
    totalSections : Nat;
  };

  /// Error de validación o de restauración, para que el frontend pueda mostrar
  /// un mensaje claro sin haber alterado datos.
  public type RestoreError = {
    /// El contenido no es JSON válido o no tiene la forma esperada.
    #invalidFormat : Text;
    /// La versión del archivo no es compatible con este backend.
    #incompatibleVersion : Nat;
    /// El archivo no contiene ninguna sección conocida.
    #noKnownSections;
    /// La sección solicitada no existe en el archivo.
    #unknownSection : Text;
    /// La sección existe pero su contenido no tiene el formato esperado.
    #invalidSection : Text;
    /// El llamador no es administrador.
    #notAuthorized;
  };

  /// Resultado de validar el archivo de copia.
  public type RestorePreviewOutcome = {
    #ok : RestorePreview;
    #err : RestoreError;
  };

  /// Estado final de una sección tras intentar restaurarla.
  public type RestoreSectionStatus = {
    /// La sección se sobrescribió con los datos del archivo.
    #restored;
    /// La sección no se restauró (no fue seleccionada o no está en el archivo).
    #skipped;
    /// La sección falló al restaurar; `message` explica el motivo.
    #error : Text;
  };

  /// Resultado de restaurar una sección.
  public type RestoreSectionResult = {
    /// Clave raíz de la sección.
    key : Text;
    /// Índice de la sección dentro del manifiesto.
    index : Nat;
    status : RestoreSectionStatus;
    /// Número de registros escritos en la sección.
    restored : Nat;
  };

  /// Resultado de restaurar una sección, con el error de validación del
  /// archivo cuando aplica.
  public type RestoreSectionOutcome = {
    #ok : RestoreSectionResult;
    #err : RestoreError;
  };
};
