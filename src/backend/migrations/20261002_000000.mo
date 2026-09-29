module {
  type Timestamp = Int;

  // ── Mensaje diario de esperanza bíblica ─────────────────────────────────
  // Se introduce el estado persistente de la configuración del mensaje. La
  // fila única nace desactivada, en modo automático y sin texto manual.

  type HopeMode = {
    #auto;
    #manual;
  };

  type HopeSettings = {
    enabled : Bool;
    mode : HopeMode;
    manualText : Text;
    manualCitation : Text;
    updatedAt : Timestamp;
  };

  // Forma parcial: solo se declara el campo nuevo. El resto del estado del
  // actor se hereda automáticamente.
  type OldActor = {};

  type NewActor = {
    hope : { var settings : HopeSettings };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      hope = {
        var settings = {
          enabled = false;
          mode = #auto;
          manualText = "";
          manualCitation = "";
          updatedAt = 0;
        };
      };
    };
  };
};
