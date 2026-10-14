import Map "mo:core/Map";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;
  type TaxRate = Nat;

  type QuoteStatus = { #draft; #sent; #accepted; #rejected; #expired };

  type QuotePartLine = {
    id : Id;
    partId : Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
  };

  type QuoteServiceLine = {
    id : Id;
    serviceId : ?Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
  };

  // Forma anterior: la moto era obligatoria.
  type OldQuote = {
    id : Id;
    quoteNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    status : QuoteStatus;
    partLines : [QuotePartLine];
    serviceLines : [QuoteServiceLine];
    discount : Money;
    taxRate : TaxRate;
    notes : ?Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Forma nueva: la moto es opcional.
  type NewQuote = {
    id : Id;
    quoteNumber : Text;
    customerId : Id;
    motorcycleId : ?Id;
    status : QuoteStatus;
    partLines : [QuotePartLine];
    serviceLines : [QuoteServiceLine];
    discount : Money;
    taxRate : TaxRate;
    notes : ?Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Forma parcial: solo se declara el campo que cambia (`quotes`). El resto
  // del estado del actor se hereda automáticamente.
  type OldActor = {
    quotes : Map.Map<Id, OldQuote>;
  };

  type NewActor = {
    quotes : Map.Map<Id, NewQuote>;
  };

  // La moto pasa de obligatoria a opcional. Las cotizaciones ya guardadas
  // conservan su moto envolviéndola en `?`; ninguna pierde datos.
  public func migration(old : OldActor) : NewActor {
    let quotes = old.quotes.map<Id, OldQuote, NewQuote>(
      func(_id, quote) { { quote with motorcycleId = ?quote.motorcycleId } }
    );
    { quotes };
  };
};
