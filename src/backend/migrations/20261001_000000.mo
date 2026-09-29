import Map "mo:core/Map";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;

  // ── Inventario: se añade `barcode` al repuesto ──────────────────────────
  // Los repuestos existentes quedan sin código de barras (cadena vacía).

  type OldPart = {
    id : Id;
    sku : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
    createdAt : Timestamp;
  };

  type NewPart = {
    id : Id;
    sku : Text;
    barcode : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
    createdAt : Timestamp;
  };

  // Forma parcial: solo se declara el campo que cambia. El resto del estado
  // del actor se hereda automáticamente.
  type OldActor = {
    parts : Map.Map<Id, OldPart>;
  };

  type NewActor = {
    parts : Map.Map<Id, NewPart>;
  };

  public func migration(old : OldActor) : NewActor {
    let parts = old.parts.map<Id, OldPart, NewPart>(
      func(_id, part) {
        {
          part with
          barcode = "";
        };
      }
    );
    { parts };
  };
};
