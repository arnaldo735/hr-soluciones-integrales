import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;

  type Service = {
    id : Id;
    code : Text;
    name : Text;
    description : Text;
    category : Text;
    laborRate : Money;
    estimatedMinutes : Nat;
    active : Bool;
    createdAt : Timestamp;
  };

  // ── Servicios de garantía que faltaban en el catálogo ───────────────────
  // El catálogo sembrado originalmente (20260924_000000.mo) solo contiene
  // SRV-001..SRV-005, por lo que la garantía nunca se activaba en la OT al no
  // poder seleccionar «Reparación de motor» ni «Reparación de cabeza de
  // fuerza». Esta migración los agrega con códigos consecutivos SRV-006 y
  // SRV-007, sin tocar ni borrar los servicios existentes.
  //
  // Es idempotente respecto a datos existentes: solo inserta un servicio si no
  // existe ya otro con el mismo nombre normalizado (sin tildes, minúsculas).
  // Así, si el taller ya creó manualmente un servicio equivalente, no se
  // duplica.

  // Forma parcial: solo se declaran los campos que la migración lee o
  // reconstruye (`services` y `counters`). El resto del estado del actor se
  // hereda automáticamente.
  type OldActor = {
    services : Map.Map<Id, Service>;
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

  type NewActor = {
    services : Map.Map<Id, Service>;
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

  // Normaliza un nombre para comparar sin distinguir mayúsculas ni tildes.
  // `Text.toLower()` de Motoko no pliega vocales acentuadas mayúsculas, así
  // que se reemplazan explícitamente antes de pasar a minúsculas.
  func normalizeName(name : Text) : Text {
    name
      .replace(#text "Á", "a")
      .replace(#text "É", "e")
      .replace(#text "Í", "i")
      .replace(#text "Ó", "o")
      .replace(#text "Ú", "u")
      .replace(#text "Ü", "u")
      .replace(#text "Ñ", "n")
      .replace(#text "á", "a")
      .replace(#text "é", "e")
      .replace(#text "í", "i")
      .replace(#text "ó", "o")
      .replace(#text "ú", "u")
      .replace(#text "ü", "u")
      .replace(#text "ñ", "n")
      .toLower();
  };

  public func migration(old : OldActor) : NewActor {
    let services = old.services;
    var nextServiceId = old.counters.nextServiceId;

    // (código, nombre, categoría, tarifa de mano de obra, minutos estimados)
    // coherentes con el catálogo existente.
    let warrantyServices : [(Text, Text, Text, Money, Nat)] = [
      ("SRV-006", "Reparación de motor", "Motor", 25000000, 480),
      ("SRV-007", "Reparación de cabeza de fuerza", "Motor", 18000000, 360),
    ];

    for ((code, name, category, laborRate, minutes) in warrantyServices.values()) {
      let normalized = normalizeName(name);
      let alreadyExists = services.any(func(_id, service) = normalizeName(service.name) == normalized);
      if (not alreadyExists) {
        let id = nextServiceId;
        nextServiceId := id + 1;
        services.add(id, {
          id;
          code;
          name;
          description = name;
          category;
          laborRate;
          estimatedMinutes = minutes;
          active = true;
          createdAt = 0;
        });
      };
    };

    {
      services;
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
        var nextServiceId = nextServiceId;
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
      };
    };
  };
};
