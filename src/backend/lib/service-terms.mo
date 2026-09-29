import Time "mo:core/Time";

import Types "../types/service-terms";

module {
  public type State = {
    serviceTerms : { var settings : Types.ServiceTermsSettings };
  };

  // Texto de recepción de la motocicleta con el que nace el pie de página
  // «Términos y condiciones del Servicio». Es la única fuente del valor por
  // defecto: la migración que siembra el estado y el respaldo en tiempo de
  // ejecución deben coincidir, por eso ambos lo referencian.
  public let defaultText : Text = "Se recibe la motocicleta en el estado y condiciones descritas, para diagnóstico y/o reparación. El cliente declara dejarla con los accesorios y pertenencias anotadas y autoriza la revisión. El taller no se hace responsable por objetos de valor no declarados, ni por fallas preexistentes no visibles al ingreso. Todo trabajo adicional será consultado previamente.";

  // Recorta todo espacio en blanco (espacios, tabulaciones, saltos de línea).
  func trim(text : Text) : Text {
    text.trim(#predicate(Char.isWhitespace));
  };

  // Configuración vigente (fila única). Si el texto almacenado está vacío,
  // devuelve el texto por defecto para que el pie de página nunca quede en
  // blanco.
  public func getSettings(state : State) : Types.ServiceTermsSettings {
    let settings = state.serviceTerms.settings;
    if (trim(settings.text) == "") {
      { text = defaultText; updatedAt = settings.updatedAt };
    } else {
      settings;
    };
  };

  // Reemplaza el texto del pie de página y actualiza `updatedAt`. Un texto
  // vacío (o solo espacios) cae al texto por defecto.
  public func updateSettings(state : State, input : Types.ServiceTermsSettingsRawInput) : Types.ServiceTermsSettings {
    let trimmed = trim(input.text);
    let text = if (trimmed == "") { defaultText } else { trimmed };
    let updated : Types.ServiceTermsSettings = {
      text;
      updatedAt = Time.now();
    };
    state.serviceTerms.settings := updated;
    updated;
  };
};
