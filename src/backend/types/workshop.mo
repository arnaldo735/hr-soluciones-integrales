import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;
  public type TaxRate = Common.TaxRate;

  // Estado de una orden de taller. `#cancelled` es terminal: la orden deja de
  // ser facturable y sale de los flujos activos.
  public type OrderStatus = { #received; #inRepair; #ready; #delivered; #cancelled };

  // Línea de repuesto de una orden. `unitCost` es el costo unitario de
  // referencia (costo del lote elegido o precio de costo del repuesto) que se
  // conserva para calcular el margen; agregar la línea NO descuenta stock.
  public type OrderPart = {
    id : Id;
    partId : Id;
    lotId : ?Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    unitCost : Money;
  };

  public type LaborItem = {
    id : Id;
    description : Text;
    price : Money;
    technicianId : ?Id;
    serviceId : ?Id; // Referencia al servicio del catálogo, si la línea provino de él
  };

  // Evidencia fotográfica del proceso. Los bytes viven en el almacenamiento de
  // archivos de la plataforma; el backend solo guarda la referencia y sus
  // metadatos. Máximo 6 fotos por orden.
  public type OrderPhoto = {
    id : Id;
    blob : Storage.ExternalBlob;
    filename : Text;
    mimeType : Text;
    uploadedBy : Principal;
    uploadedAt : Timestamp;
  };

  public type StatusChange = {
    from : ?OrderStatus;
    to : OrderStatus;
    performedBy : Principal;
    at : Timestamp;
  };

  public type WorkshopOrder = {
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

  public type OrderTotals = {
    partsSubtotal : Money;
    laborSubtotal : Money;
    subtotal : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
  };

  public type OrderView = {
    order : WorkshopOrder;
    totals : OrderTotals;
  };

  public type OrderInput = {
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    problem : Text;
    technicianIds : [Id];
  };

  public type OrderPartInput = {
    partId : Id;
    lotId : ?Id;
    quantity : Nat;
  };

  public type LaborInput = {
    description : Text;
    price : Money;
    technicianId : ?Id;
    serviceId : ?Id; // Servicio del catálogo elegido; null para línea libre
  };

  // Entrada para cargar una foto de evidencia. `blob` es la referencia al
  // archivo ya subido al almacenamiento de la plataforma.
  public type OrderPhotoInput = {
    blob : Storage.ExternalBlob;
    filename : Text;
    mimeType : Text;
  };

  public type OrderFilter = {
    status : ?OrderStatus;
    search : ?Text;
  };

  public type OrderPage = {
    items : [OrderView];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type WorkshopError = {
    #notFound : Id;
    #invalidTransition : { from : OrderStatus; to : OrderStatus };
    #insufficientStock : { partId : Id; available : Nat; requested : Nat };
    #notAuthorized;
  };
};
