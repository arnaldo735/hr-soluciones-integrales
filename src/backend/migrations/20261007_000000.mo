import Map "mo:core/Map";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;
  type TaxRate = Nat;

  type OrderStatus = { #received; #inRepair; #ready; #delivered; #cancelled };

  type OrderPart = {
    id : Id;
    partId : Id;
    lotId : ?Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    unitCost : Money;
  };

  type LaborItem = {
    id : Id;
    description : Text;
    price : Money;
    technicianId : ?Id;
    serviceId : ?Id;
  };

  type OrderPhoto = {
    id : Id;
    blob : Blob;
    filename : Text;
    mimeType : Text;
    uploadedBy : Principal;
    uploadedAt : Timestamp;
  };

  type StatusChange = {
    from : ?OrderStatus;
    to : OrderStatus;
    performedBy : Principal;
    at : Timestamp;
  };

  // Forma anterior: sin kilometraje anterior ni intervalo de cambio de aceite.
  type OldOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    problem : Text;
    status : OrderStatus;
    parts : [OrderPart];
    labor : [LaborItem];
    photos : [OrderPhoto];
    technicianIds : [Id];
    statusHistory : [StatusChange];
    cancelReason : ?Text;
    cancelledAt : ?Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Forma nueva: se agregan los dos campos opcionales.
  type NewOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    previousMileage : ?Nat;
    oilChangeInterval : ?Nat;
    problem : Text;
    status : OrderStatus;
    parts : [OrderPart];
    labor : [LaborItem];
    photos : [OrderPhoto];
    technicianIds : [Id];
    statusHistory : [StatusChange];
    cancelReason : ?Text;
    cancelledAt : ?Timestamp;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Forma parcial: solo se declara el campo que cambia (`orders`). El resto
  // del estado del actor se hereda automáticamente.
  type OldActor = {
    orders : Map.Map<Id, OldOrder>;
  };

  type NewActor = {
    orders : Map.Map<Id, NewOrder>;
  };

  // Las órdenes ya guardadas quedan con ambos campos en `null` («no
  // registrado»); ninguna pierde datos.
  public func migration(old : OldActor) : NewActor {
    let orders = old.orders.map<Id, OldOrder, NewOrder>(
      func(_id, order) {
        { order with previousMileage = null; oilChangeInterval = null };
      }
    );
    { orders };
  };
};
