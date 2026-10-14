import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;

  // ── Tipos heredados (inlined; las migraciones no importan módulos del proyecto) ──

  type PaymentMethod = { #cash; #card; #transfer; #mixed };
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

  type StatusChange = {
    from : ?OrderStatus;
    to : OrderStatus;
    performedBy : Principal;
    at : Timestamp;
  };

  // `Storage.ExternalBlob` es un alias de `Blob`; se inlinea como `Blob`
  // porque las migraciones no importan módulos del proyecto.
  type OrderPhoto = {
    id : Id;
    blob : Blob;
    filename : Text;
    mimeType : Text;
    uploadedBy : Principal;
    uploadedAt : Timestamp;
  };

  type OrderAdvance = {
    amount : Money;
    method : PaymentMethod;
    registeredAt : Timestamp;
    registeredBy : Principal;
  };

  // Forma anterior de la orden: sin abonos.
  type OldOrder = {
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
    advance : ?OrderAdvance;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // ── Tipos nuevos ────────────────────────────────────────────────────────

  type OrderPayment = {
    id : Id;
    amount : Money;
    method : PaymentMethod;
    note : ?Text;
    registeredAt : Timestamp;
    registeredBy : Principal;
  };

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
    advance : ?OrderAdvance;
    payments : [OrderPayment];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // ── Estado anterior ─────────────────────────────────────────────────────
  // Forma parcial: se declara el campo que la migración transforma (`orders`)
  // y `counters` (para añadir el contador de abonos). El resto del estado del
  // actor se hereda automáticamente.
  type OldActor = {
    orders : Map.Map<Id, OldOrder>;
    counters : {
      var nextPartId : Nat;
      var nextLotId : Nat;
      var nextMovementId : Nat;
      var nextCustomerId : Nat;
      var nextMotorcycleId : Nat;
      var nextOrderId : Nat;
      var nextOrderPartId : Nat;
      var nextLaborId : Nat;
      var nextOrderPhotoId : Nat;
      var nextSupplierId : Nat;
      var nextPurchaseId : Nat;
      var nextPurchaseItemId : Nat;
      var nextPaymentId : Nat;
      var nextInvoiceId : Nat;
      var nextInvoiceNumber : Nat;
      var nextQuoteId : Nat;
      var nextQuoteNumber : Nat;
      var nextQuotePartLineId : Nat;
      var nextQuoteServiceLineId : Nat;
      var nextServiceId : Nat;
      var nextServiceCategoryId : Nat;
      var nextTechnicianId : Nat;
      var nextTechnicianLoanId : Nat;
      var nextCommissionPaymentId : Nat;
      var nextAppointmentId : Nat;
      var nextExpenseId : Nat;
      var nextExpenseCategoryId : Nat;
      var nextPosSaleId : Nat;
      var nextPosSaleNumber : Nat;
      var nextReceivablePaymentId : Nat;
      var nextSupplierOrderId : Nat;
      var nextPurchaseInvoiceId : Nat;
      var nextPurchaseInvoiceLineId : Nat;
      var nextShiftId : Nat;
      var nextCashMovementId : Nat;
      var nextCashRegisterId : Nat;
    };
  };

  // ── Estado nuevo ────────────────────────────────────────────────────────
  // `orders` cambia de forma y `counters` se reconstruye con el contador de
  // abonos. Los campos no listados se heredan automáticamente.
  type NewActor = {
    orders : Map.Map<Id, NewOrder>;
    counters : {
      var nextPartId : Nat;
      var nextLotId : Nat;
      var nextMovementId : Nat;
      var nextCustomerId : Nat;
      var nextMotorcycleId : Nat;
      var nextOrderId : Nat;
      var nextOrderPartId : Nat;
      var nextLaborId : Nat;
      var nextOrderPhotoId : Nat;
      var nextSupplierId : Nat;
      var nextPurchaseId : Nat;
      var nextPurchaseItemId : Nat;
      var nextPaymentId : Nat;
      var nextInvoiceId : Nat;
      var nextInvoiceNumber : Nat;
      var nextQuoteId : Nat;
      var nextQuoteNumber : Nat;
      var nextQuotePartLineId : Nat;
      var nextQuoteServiceLineId : Nat;
      var nextServiceId : Nat;
      var nextServiceCategoryId : Nat;
      var nextTechnicianId : Nat;
      var nextTechnicianLoanId : Nat;
      var nextCommissionPaymentId : Nat;
      var nextAppointmentId : Nat;
      var nextExpenseId : Nat;
      var nextExpenseCategoryId : Nat;
      var nextPosSaleId : Nat;
      var nextPosSaleNumber : Nat;
      var nextReceivablePaymentId : Nat;
      var nextSupplierOrderId : Nat;
      var nextPurchaseInvoiceId : Nat;
      var nextPurchaseInvoiceLineId : Nat;
      var nextShiftId : Nat;
      var nextCashMovementId : Nat;
      var nextCashRegisterId : Nat;
      var nextOrderPaymentId : Nat;
    };
  };

  public func migration(old : OldActor) : NewActor {
    // Las órdenes existentes no tenían abonos: quedan con `payments = []`.
    let orders = old.orders.map<Id, OldOrder, NewOrder>(
      func(_id, order) {
        {
          order with
          payments = [];
        };
      }
    );

    {
      orders;
      counters = {
        var nextPartId = old.counters.nextPartId;
        var nextLotId = old.counters.nextLotId;
        var nextMovementId = old.counters.nextMovementId;
        var nextCustomerId = old.counters.nextCustomerId;
        var nextMotorcycleId = old.counters.nextMotorcycleId;
        var nextOrderId = old.counters.nextOrderId;
        var nextOrderPartId = old.counters.nextOrderPartId;
        var nextLaborId = old.counters.nextLaborId;
        var nextOrderPhotoId = old.counters.nextOrderPhotoId;
        var nextSupplierId = old.counters.nextSupplierId;
        var nextPurchaseId = old.counters.nextPurchaseId;
        var nextPurchaseItemId = old.counters.nextPurchaseItemId;
        var nextPaymentId = old.counters.nextPaymentId;
        var nextInvoiceId = old.counters.nextInvoiceId;
        var nextInvoiceNumber = old.counters.nextInvoiceNumber;
        var nextQuoteId = old.counters.nextQuoteId;
        var nextQuoteNumber = old.counters.nextQuoteNumber;
        var nextQuotePartLineId = old.counters.nextQuotePartLineId;
        var nextQuoteServiceLineId = old.counters.nextQuoteServiceLineId;
        var nextServiceId = old.counters.nextServiceId;
        var nextServiceCategoryId = old.counters.nextServiceCategoryId;
        var nextTechnicianId = old.counters.nextTechnicianId;
        var nextTechnicianLoanId = old.counters.nextTechnicianLoanId;
        var nextCommissionPaymentId = old.counters.nextCommissionPaymentId;
        var nextAppointmentId = old.counters.nextAppointmentId;
        var nextExpenseId = old.counters.nextExpenseId;
        var nextExpenseCategoryId = old.counters.nextExpenseCategoryId;
        var nextPosSaleId = old.counters.nextPosSaleId;
        var nextPosSaleNumber = old.counters.nextPosSaleNumber;
        var nextReceivablePaymentId = old.counters.nextReceivablePaymentId;
        var nextSupplierOrderId = old.counters.nextSupplierOrderId;
        var nextPurchaseInvoiceId = old.counters.nextPurchaseInvoiceId;
        var nextPurchaseInvoiceLineId = old.counters.nextPurchaseInvoiceLineId;
        var nextShiftId = old.counters.nextShiftId;
        var nextCashMovementId = old.counters.nextCashMovementId;
        var nextCashRegisterId = old.counters.nextCashRegisterId;
        var nextOrderPaymentId = 0;
      };
    };
  };
};
