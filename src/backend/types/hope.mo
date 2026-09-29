import Common "common";

module {
  public type Timestamp = Common.Timestamp;

  // Modo de selección del mensaje de esperanza bíblica.
  //   #auto   — rota día a día de forma determinista sobre el repertorio.
  //   #manual — usa el texto y la cita fijados por el administrador.
  public type HopeMode = {
    #auto;
    #manual;
  };

  // Configuración persistente del mensaje de esperanza. Fila única.
  //   enabled        — si el mensaje aparece en los formatos y mensajes.
  //   mode           — automático (rota) o manual (texto fijo).
  //   manualText     — texto del mensaje en modo manual.
  //   manualCitation — cita o atribución bíblica en modo manual.
  //   updatedAt      — nanosegundos de la última modificación.
  public type HopeSettings = {
    enabled : Bool;
    mode : HopeMode;
    manualText : Text;
    manualCitation : Text;
    updatedAt : Timestamp;
  };

  // Entrada tolerante al borde Candid para actualizar la configuración. El
  // modo viaja como texto (por ejemplo `auto` o `manual`) para que una cadena
  // vacía o desconocida no produzca un error de decodificación; el backend la
  // normaliza antes de validar y persistir.
  public type HopeSettingsRawInput = {
    enabled : Bool;
    mode : Text;
    manualText : Text;
    manualCitation : Text;
  };

  // Entrada estricta ya normalizada que se valida y persiste.
  public type HopeSettingsInput = {
    enabled : Bool;
    mode : HopeMode;
    manualText : Text;
    manualCitation : Text;
  };

  // Promesa vigente expuesta al frontend. `referenceDate` es el día calendario
  // de Colombia (America/Bogota) en formato `DD/MM/AAAA`; `text` y `citation`
  // son la promesa efectiva (rotada o manual) y `enabled` indica si debe
  // mostrarse. `mode` es el modo configurado.
  public type HopeMessage = {
    enabled : Bool;
    mode : HopeMode;
    text : Text;
    citation : Text;
    referenceDate : Text;
  };

  public type HopeError = {
    #notAuthorized;
    #invalidInput : Text;
  };

  // Repertorio fijo de promesas bíblicas de esperanza en español (Colombia).
  // Cada entrada lleva el texto y su cita. El índice del día se deriva del día
  // calendario de Colombia, de modo que todos los documentos emitidos el mismo
  // día muestran la misma promesa y la secuencia no se repite de inmediato.
  public type HopePromise = {
    text : Text;
    citation : Text;
  };
};
