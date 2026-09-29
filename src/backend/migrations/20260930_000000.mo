import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;

  // ── Tipos heredados (inlined; las migraciones no importan módulos del proyecto) ──

  type ModuleKey = Text;
  type RoleKind = { #builtin; #custom };

  type Role = {
    id : Id;
    name : Text;
    kind : RoleKind;
    modules : [ModuleKey];
    createdAt : Timestamp;
  };

  type Credential = {
    id : Id;
    username : Text;
    name : Text;
    roleId : Id;
    active : Bool;
    salt : Blob;
    passwordHash : Blob;
    iterations : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type Session = {
    token : Text;
    credentialId : Id;
    createdAt : Timestamp;
    expiresAt : Timestamp;
  };

  // ── Tipos nuevos (Caja y Bancos) ────────────────────────────────────────

  type PaymentMethod = { #cash; #card; #transfer; #mixed };
  type CashAccount = { #cash; #bank };
  type CashMovementKind = { #income; #expense };
  type CashMovementSource = {
    #manual;
    #invoice;
    #receivable;
    #purchase;
    #expense;
    #commission;
    #pos;
    #other;
  };
  type ShiftStatus = { #open; #closed };

  type Shift = {
    id : Id;
    openedAt : Timestamp;
    closedAt : ?Timestamp;
    openingCash : Money;
    openingBank : Money;
    declaredClosingCash : ?Money;
    declaredClosingBank : ?Money;
    computedClosingCash : Money;
    computedClosingBank : Money;
    differenceCash : Int;
    differenceBank : Int;
    status : ShiftStatus;
    openedBy : Principal;
    closedBy : ?Principal;
    notes : ?Text;
  };

  type CashMovement = {
    id : Id;
    shiftId : Id;
    timestamp : Timestamp;
    kind : CashMovementKind;
    paymentMethod : PaymentMethod;
    amount : Money;
    account : CashAccount;
    description : Text;
    reference : ?Text;
    source : CashMovementSource;
  };

  // ── Compras: se añade `accepted` ────────────────────────────────────────
  // Las compras existentes se consideran ya aceptadas (`accepted = true`)
  // porque su inventario ya fue afectado por la versión anterior.

  type PurchaseItem = {
    id : Id;
    partId : Id;
    lotNumber : Text;
    quantity : Nat;
    unitCost : Money;
  };

  type OldPurchase = {
    id : Id;
    supplierId : Id;
    items : [PurchaseItem];
    total : Money;
    paidAmount : Money;
    createdAt : Timestamp;
  };

  type NewPurchase = {
    id : Id;
    supplierId : Id;
    items : [PurchaseItem];
    total : Money;
    paidAmount : Money;
    accepted : Bool;
    createdAt : Timestamp;
  };

  // ── Estado anterior ─────────────────────────────────────────────────────
  // Se declaran solo los campos que la migración necesita leer o reconstruir:
  // `counters` (para añadir los contadores nuevos) y los campos nuevos que se
  // inicializan vacíos. El resto del estado se hereda automáticamente porque
  // no aparece ni en el dominio ni en el codominio.
  type OldActor = {
    purchases : Map.Map<Id, OldPurchase>;
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
    };
  };

  // ── Estado nuevo ────────────────────────────────────────────────────────
  // `shifts` y `cashMovements` son los campos nuevos; `counters` se
  // reconstruye con los dos contadores nuevos. Los campos no listados se
  // heredan automáticamente.
  type NewActor = {
    purchases : Map.Map<Id, NewPurchase>;
    shifts : Map.Map<Id, Shift>;
    cashMovements : Map.Map<Id, CashMovement>;
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
    };
  };

  public func migration(old : OldActor) : NewActor {
    let purchases = old.purchases.map<Id, OldPurchase, NewPurchase>(
      func(_id, purchase) {
        {
          purchase with
          accepted = true;
        };
      }
    );
    {
      purchases;
      shifts = Map.empty();
      cashMovements = Map.empty();
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
        var nextShiftId = 0;
        var nextCashMovementId = 0;
      };
    };
  };
};
