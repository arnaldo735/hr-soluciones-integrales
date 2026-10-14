import Common "common";
import Storage "mo:caffeineai-object-storage/Storage";
import Billing "billing";

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

  // Anticipo registrado en una orden de taller. `amount` es el monto en
  // centavos enteros COP y `method` el medio de pago, limitado a efectivo
  // (`#cash`) o transferencia (`#transfer`). Se descuenta del total al
  // facturar la orden.
  public type OrderAdvance = {
    amount : Money;
    method : Billing.PaymentMethod;
    registeredAt : Timestamp;
    registeredBy : Principal;
  };

  // Abono registrado sobre una orden de taller antes de facturarla. `amount`
  // es el monto en centavos enteros COP y `method` el medio de pago (efectivo,
  // transferencia o tarjeta). Cada abono genera un movimiento de ingreso en
  // Caja/Bancos asociado a la OT, igual que el anticipo. El saldo pendiente de
  // la orden es `total − anticipo − suma de abonos`.
  public type OrderPayment = {
    id : Id;
    amount : Money;
    method : Billing.PaymentMethod;
    note : ?Text;
    registeredAt : Timestamp;
    registeredBy : Principal;
  };

  // Entrada para registrar un abono sobre una orden ya creada. `amount` debe
  // ser mayor que cero y no puede superar el saldo pendiente de la orden.
  public type OrderPaymentInput = {
    amount : Money;
    method : Billing.PaymentMethod;
    note : ?Text;
  };

  public type WorkshopOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    // Kilometraje anterior (lectura previa del odómetro), opcional. Los
    // kilómetros recorridos se derivan como `intakeMileage - previousMileage`.
    previousMileage : ?Nat;
    // Intervalo en km para el próximo cambio de aceite, elegido por quien
    // registra el ingreso. El próximo cambio se deriva como
    // `intakeMileage + oilChangeInterval`; no se almacena.
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
    // Anticipo opcional. `null` significa «sin anticipo»; nunca se representa
    // con monto 0. Una orden sin anticipo se comporta como antes.
    advance : ?OrderAdvance;
    // Abonos registrados sobre la orden antes de facturarla. Lista vacía
    // significa «sin abonos». El saldo pendiente es
    // `total − anticipo − suma de abonos`.
    payments : [OrderPayment];
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
    // Suma de los abonos registrados sobre la orden.
    paidAmount : Money;
    // Saldo pendiente de la orden: `total − anticipo − paidAmount`, nunca
    // negativo.
    balance : Money;
  };

  // Datos del recibo de anticipo imprimible de una orden de taller. Reúne la
  // información del cliente, la moto, el anticipo y los abonos para que el
  // frontend genere el documento sin llamadas adicionales.
  public type OrderAdvanceReceipt = {
    orderId : Id;
    orderNumber : Text;
    customerName : Text;
    customerDocument : ?Text;
    motorcycleBrand : Text;
    motorcycleModel : Text;
    motorcyclePlate : Text;
    // Anticipo vigente; `null` cuando la orden no tiene anticipo.
    advance : ?OrderAdvance;
    // Total de la orden (con impuestos).
    total : Money;
    // Suma de los abonos registrados.
    paidAmount : Money;
    // Saldo pendiente: `total − anticipo − paidAmount`.
    balance : Money;
    // Abonos registrados, ordenados por id ascendente.
    payments : [OrderPayment];
    issuedAt : Timestamp;
  };

  public type OrderView = {
    order : WorkshopOrder;
    totals : OrderTotals;
  };

  public type OrderInput = {
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    previousMileage : ?Nat;
    oilChangeInterval : ?Nat;
    problem : Text;
    technicianIds : [Id];
    // Anticipo opcional al crear la orden. `null` (o ausente) crea la orden
    // sin anticipo. El monto no puede superar el total de la orden.
    advance : ?OrderAdvanceInput;
  };

  // Entrada para registrar un anticipo al crear una orden.
  public type OrderAdvanceInput = {
    amount : Money;
    method : Billing.PaymentMethod;
  };

  // Entrada para fijar o borrar el anticipo de una orden ya creada.
  // `amount = null` borra el anticipo (y su movimiento de Caja/Bancos).
  // `method` es obligatorio cuando `amount` viene con valor.
  public type SetOrderAdvanceInput = {
    amount : ?Money;
    method : ?Billing.PaymentMethod;
  };

  // Entrada para editar el intervalo de km del próximo cambio de aceite de una
  // orden ya creada. `null` borra el intervalo (queda «no registrado»).
  public type OilChangeIntervalInput = {
    oilChangeInterval : ?Nat;
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
    // El anticipo supera el total de la orden.
    #advanceExceedsTotal : { advance : Money; total : Money };
    // La orden ya está facturada y no admite cambios de anticipo.
    #orderAlreadyInvoiced : Id;
    // El medio de pago del anticipo no es efectivo ni transferencia.
    #invalidAdvanceMethod;
    // El abono supera el saldo pendiente de la orden.
    #paymentExceedsBalance : { payment : Money; balance : Money };
    // La orden no admite abonos (cancelada, entregada o ya facturada).
    #orderNotPayable : Id;
    // El monto del abono no es mayor que cero.
    #invalidPaymentAmount;
    // El medio de pago del abono no es efectivo, transferencia ni tarjeta.
    #invalidPaymentMethod;
  };
};
