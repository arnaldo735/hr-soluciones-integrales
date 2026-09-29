import Common "common";

module {
  public type Timestamp = Common.Timestamp;

  // Pie de página editable de «Términos y condiciones del Servicio». Fila
  // única: el administrador edita un texto que se aplica a los documentos
  // generados después de guardarlo; los documentos ya emitidos conservan el
  // texto con el que se generaron.
  //   text      — texto del pie de página.
  //   updatedAt — nanosegundos de la última modificación.
  public type ServiceTermsSettings = {
    text : Text;
    updatedAt : Timestamp;
  };

  // Entrada tolerante al borde Candid para actualizar el pie de página.
  public type ServiceTermsSettingsRawInput = {
    text : Text;
  };
};
