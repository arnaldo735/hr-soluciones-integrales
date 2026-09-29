module {
  type Timestamp = Int;

  // ── Pie de página «Términos y condiciones del Servicio» ─────────────────
  // Se introduce el estado persistente del pie de página editable. La fila
  // única nace con el texto de recepción de la motocicleta.

  type ServiceTermsSettings = {
    text : Text;
    updatedAt : Timestamp;
  };

  // Forma parcial: solo se declara el campo nuevo. El resto del estado del
  // actor se hereda automáticamente.
  type OldActor = {};

  type NewActor = {
    serviceTerms : { var settings : ServiceTermsSettings };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      serviceTerms = {
        var settings = {
          text = "Se recibe la motocicleta en el estado y condiciones descritas, para diagnóstico y/o reparación. El cliente declara dejarla con los accesorios y pertenencias anotadas y autoriza la revisión. El taller no se hace responsable por objetos de valor no declarados, ni por fallas preexistentes no visibles al ingreso. Todo trabajo adicional será consultado previamente.";
          updatedAt = 0;
        };
      };
    };
  };
};
