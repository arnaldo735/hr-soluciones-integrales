import Common "common";

module {
  public type Timestamp = Common.Timestamp;

  // Texto editable de «Términos y Condiciones de Garantía». Fila única: el
  // administrador edita un único bloque de texto global para toda la empresa
  // que reemplaza el contenido del documento de garantía en pantalla, el
  // imprimible y el PDF de la OT.
  //   text      — texto completo de los términos de garantía.
  //   updatedAt — nanosegundos de la última modificación.
  public type WarrantyTermsSettings = {
    text : Text;
    updatedAt : Timestamp;
  };

  // Entrada tolerante al borde Candid para actualizar los términos de garantía.
  public type WarrantyTermsSettingsRawInput = {
    text : Text;
  };
};
