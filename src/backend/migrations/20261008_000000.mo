import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;

  // ── Tipos heredados (inlined; las migraciones no importan módulos del proyecto) ──

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

  // Forma anterior del turno: sin identidad de caja/banco ni responsable.
  type OldShift = {
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

  // ── Tipos nuevos (catálogo de cajas y bancos) ───────────────────────────

  type CashRegisterKind = { #cash; #bank };

  type CashRegister = {
    id : Id;
    name : Text;
    kind : CashRegisterKind;
    openingBalance : Money;
    active : Bool;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Forma nueva del turno: se agregan la caja/banco y el responsable.
  type NewShift = {
    id : Id;
    registerId : Id;
    responsibleName : Text;
    responsibleUserId : ?Id;
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

  // ── Estado anterior ─────────────────────────────────────────────────────
  // Forma parcial: solo se declaran los campos que la migración lee o
  // reconstruye (`shifts`, `cashMovements` y `counters`). El resto del estado
  // del actor se hereda automáticamente.
  type OldActor = {
    shifts : Map.Map<Id, OldShift>;
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

  // ── Estado nuevo ────────────────────────────────────────────────────────
  // `cashRegisters` es el campo nuevo; `shifts` cambia de forma; `counters`
  // se reconstruye con el contador nuevo. Los campos no listados se heredan
  // automáticamente.
  type NewActor = {
    cashRegisters : Map.Map<Id, CashRegister>;
    shifts : Map.Map<Id, NewShift>;
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
      var nextCashRegisterId : Nat;
    };
  };

  // Id fijo de la «Caja principal» que agrupa los turnos y movimientos
  // existentes. El contador arranca en 1 para que el próximo registro creado
  // reciba el id 1.
  let principalRegisterId : Id = 0;

  public func migration(old : OldActor) : NewActor {
    // Caja principal: agrupa todos los turnos y movimientos previos. Su saldo
    // inicial es 0 porque los saldos ya viven en cada turno existente.
    let cashRegisters = Map.empty<Id, CashRegister>();
    cashRegisters.add(principalRegisterId, {
      id = principalRegisterId;
      name = "Caja principal";
      kind = #cash;
      openingBalance = 0;
      active = true;
      createdAt = 0;
      updatedAt = 0;
    });

    // Cada turno existente se asigna a la Caja principal. El responsable se
    // hereda del principal que abrió el turno (texto legible); no se asigna
    // usuario del sistema porque el turno previo no lo registraba.
    let shifts = old.shifts.map<Id, OldShift, NewShift>(
      func(_id, shift) {
        {
          shift with
          registerId = principalRegisterId;
          responsibleName = shift.openedBy.toText();
          responsibleUserId = null;
        };
      }
    );

    {
      cashRegisters;
      shifts;
      cashMovements = old.cashMovements;
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
        var nextCashRegisterId = 1;
      };
    };
  };
};
