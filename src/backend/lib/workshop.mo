import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Types "../types/workshop";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import ServiceTypes "../types/services";
import CashTypes "../types/cash";
import CashLib "../lib/cash";
import Search "../lib/search";

module {
  public type Counters = {
    var nextOrderId : Nat;
    var nextOrderPartId : Nat;
    var nextLaborId : Nat;
    var nextMovementId : Nat;
    var nextOrderPhotoId : Nat;
    var nextCashMovementId : Nat;
    var nextShiftId : Nat;
    var nextCashRegisterId : Nat;
    var nextOrderPaymentId : Nat;
  };

  // Máximo de fotos de evidencia por orden.
  public let maxOrderPhotos : Nat = 6;

  public type State = {
    orders : Map.Map<Types.Id, Types.WorkshopOrder>;
    parts : Map.Map<Types.Id, InventoryTypes.Part>;
    lots : Map.Map<Types.Id, InventoryTypes.Lot>;
    movements : Map.Map<Types.Id, InventoryTypes.Movement>;
    customers : Map.Map<Types.Id, CustomerTypes.Customer>;
    motorcycles : Map.Map<Types.Id, CustomerTypes.Motorcycle>;
    services : Map.Map<Types.Id, ServiceTypes.Service>;
    counters : Counters;
    businessSettings : { var settings : BillingTypes.BusinessSettings };
    company : { var profile : CompanyTypes.CompanyProfile };
    // Estado de Caja y Bancos: el anticipo de una OT crea o ajusta un
    // movimiento de ingreso con origen `#advance`.
    cashRegisters : Map.Map<Types.Id, CashTypes.CashRegister>;
    shifts : Map.Map<Types.Id, CashTypes.Shift>;
    cashMovements : Map.Map<Types.Id, CashTypes.CashMovement>;
    // Facturas: se consultan para impedir cambiar el anticipo de una orden ya
    // facturada.
    invoices : Map.Map<Types.Id, BillingTypes.Invoice>;
  };

  // --- helpers -------------------------------------------------------------

  func padNumber(n : Nat) : Text {
    let raw = n.toText();
    var zeros = "";
    var i = raw.size();
    while (i < 6) {
      zeros := zeros # "0";
      i += 1;
    };
    zeros # raw;
  };

  func orderNumberFor(n : Nat) : Text {
    "OT-" # padNumber(n);
  };

  // El régimen fiscal de la empresa decide si se aplica IVA; la tarifa
  // configurada vive en el perfil de empresa.
  func effectiveTaxRate(state : State) : Types.TaxRate {
    CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
  };

  func findOrder(state : State, id : Types.Id) : Types.WorkshopOrder {
    state.orders.get(id) ?? Runtime.trap("Orden no encontrada");
  };

  func sameStatus(a : Types.OrderStatus, b : Types.OrderStatus) : Bool {
    switch (a, b) {
      case (#received, #received) { true };
      case (#inRepair, #inRepair) { true };
      case (#ready, #ready) { true };
      case (#delivered, #delivered) { true };
      case (#cancelled, #cancelled) { true };
      case (_) { false };
    };
  };

  func sameAccount(a : CashTypes.CashAccount, b : CashTypes.CashAccount) : Bool {
    switch (a, b) {
      case (#cash, #cash) { true };
      case (#bank, #bank) { true };
      case (_) { false };
    };
  };

  // Cuenta de Caja/Bancos que afecta un anticipo: efectivo → Caja,
  // transferencia → Bancos.
  func advanceAccount(method : BillingTypes.PaymentMethod) : CashTypes.CashAccount {
    switch (method) {
      case (#cash) { #cash };
      case (#transfer) { #bank };
      case (_) { #cash };
    };
  };

  // Valida el medio de pago de un anticipo: solo efectivo o transferencia.
  func validateAdvanceMethod(method : BillingTypes.PaymentMethod) {
    switch (method) {
      case (#cash) {};
      case (#transfer) {};
      case (_) {
        Runtime.trap("El medio de pago del anticipo debe ser efectivo o transferencia");
      };
    };
  };

  // Busca el movimiento de Caja/Bancos asociado al anticipo de una orden. Se
  // identifica por su origen `#advance` y su referencia (el número de OT).
  func advanceMovementFor(state : State, orderNumber : Text) : ?CashTypes.CashMovement {
    var found : ?CashTypes.CashMovement = null;
    for (movement in state.cashMovements.values()) {
      let isAdvance = switch (movement.source) {
        case (#advance) { true };
        case (_) { false };
      };
      if (isAdvance and movement.reference == ?orderNumber) {
        found := ?movement;
      };
    };
    found;
  };

  // Crea o ajusta el movimiento de Caja/Bancos del anticipo de una orden para
  // que refleje siempre el anticipo vigente. Con `advance = null` elimina el
  // movimiento. El movimiento es un ingreso con origen `#advance`, asociado a
  // la OT por su número y al turno abierto de la cuenta correspondiente. Si no
  // hay un turno abierto, se abre automáticamente uno en la caja o banco activo
  // del tipo requerido para que el anticipo siempre quede registrado.
  func applyAdvanceMovement(state : State, orderNumber : Text, advance : ?Types.OrderAdvance, performedBy : Principal) {
    let existing = advanceMovementFor(state, orderNumber);
    switch (advance) {
      case null {
        switch (existing) {
          case (?movement) { state.cashMovements.remove(movement.id) };
          case null {};
        };
      };
      case (?value) {
        let account = advanceAccount(value.method);
        switch (existing) {
          case (?movement) {
            // Ajuste en sitio: conserva id y turno cuando la cuenta no cambia.
            let shiftId = if (sameAccount(movement.account, account)) {
              movement.shiftId;
            } else {
              let shift = CashLib.resolveOrOpenShiftForAccount(state, account, performedBy, "Sistema (automático)");
              shift.id;
            };
            let updated : CashTypes.CashMovement = {
              movement with
              timestamp = Time.now();
              paymentMethod = value.method;
              amount = value.amount;
              account;
              shiftId;
              description = "Anticipo OT " # orderNumber;
            };
            state.cashMovements.add(movement.id, updated);
          };
          case null {
            let shift = CashLib.resolveOrOpenShiftForAccount(state, account, performedBy, "Sistema (automático)");
            let id = state.counters.nextCashMovementId;
            state.counters.nextCashMovementId := id + 1;
            let movement : CashTypes.CashMovement = {
              id;
              shiftId = shift.id;
              timestamp = Time.now();
              kind = #income;
              paymentMethod = value.method;
              amount = value.amount;
              account;
              description = "Anticipo OT " # orderNumber;
              reference = ?orderNumber;
              source = #advance;
            };
            state.cashMovements.add(id, movement);
          };
        };
      };
    };
  };

  // Valida un anticipo contra el total de la orden y lo normaliza. Falla con
  // `advanceExceedsTotal` si el monto supera el total y con
  // `invalidAdvanceMethod` si el medio no es efectivo ni transferencia.
  // Una orden sin monto (total = 0) admite un anticipo positivo: el límite
  // anticipo <= total solo se aplica cuando la orden ya tiene un total.
  func buildAdvance(input : Types.OrderAdvanceInput, total : Types.Money, performedBy : Principal) : Types.OrderAdvance {
    validateAdvanceMethod(input.method);
    if (total > 0 and input.amount > total) {
      Runtime.trap("El anticipo no puede superar el total de la orden");
    };
    {
      amount = input.amount;
      method = input.method;
      registeredAt = Time.now();
      registeredBy = performedBy;
    };
  };

  func computeTotals(state : State, order : Types.WorkshopOrder) : Types.OrderTotals {
    var partsSubtotal = 0;
    for (part in order.parts.values()) {
      partsSubtotal += part.quantity * part.unitPrice;
    };
    var laborSubtotal = 0;
    for (item in order.labor.values()) {
      laborSubtotal += item.price;
    };
    let subtotal = partsSubtotal + laborSubtotal;
    let taxRate = effectiveTaxRate(state);
    let tax = (subtotal * taxRate) / 100;
    let total = subtotal + tax;
    var paidAmount = 0;
    for (payment in order.payments.values()) {
      paidAmount += payment.amount;
    };
    let advance = switch (order.advance) {
      case (?value) { value.amount };
      case null { 0 };
    };
    let charged = advance + paidAmount;
    {
      partsSubtotal;
      laborSubtotal;
      subtotal;
      taxRate;
      tax;
      total;
      paidAmount;
      balance = if (charged >= total) { 0 } else { total - charged };
    };
  };

  func toView(state : State, order : Types.WorkshopOrder) : Types.OrderView {
    { order; totals = computeTotals(state, order) };
  };

  // Reemplaza una orden en el mapa y devuelve su vista.
  func store(state : State, order : Types.WorkshopOrder) : Types.OrderView {
    state.orders.add(order.id, order);
    toView(state, order);
  };

  // --- public API ----------------------------------------------------------

  public func listOrders(state : State, filter : Types.OrderFilter, offset : Nat, limit : Nat) : Types.OrderPage {
    let matched = List.empty<Types.WorkshopOrder>();
    for (order in state.orders.values()) {
      let statusOk = switch (filter.status) {
        case (?status) { sameStatus(order.status, status) };
        case null { true };
      };
      let searchOk = switch (filter.search) {
        case null { true };
        case (?term) {
          let needle = Search.normalize(term);
          if (needle == "") { true } else {
            let customerName = switch (state.customers.get(order.customerId)) {
              case (?customer) { customer.name };
              case null { "" };
            };
            let (plate, brand, model) = switch (state.motorcycles.get(order.motorcycleId)) {
              case (?moto) { (moto.plate, moto.brand, moto.model) };
              case null { ("", "", "") };
            };
            Search.contains(order.orderNumber, needle)
              or Search.contains(customerName, needle)
              or Search.contains(plate, needle)
              or Search.contains(brand, needle)
              or Search.contains(model, needle);
          };
        };
      };
      if (statusOk and searchOk) { matched.add(order) };
    };
    let sorted = matched.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    { items = sorted.sliceToArray(start, end).map(func (order) = toView(state, order)); total; offset; limit };
  };

  public func getOrder(state : State, id : Types.Id) : ?Types.OrderView {
    switch (state.orders.get(id)) {
      case (?order) { ?toView(state, order) };
      case null { null };
    };
  };

  public func createOrder(state : State, input : Types.OrderInput, performedBy : Principal) : Types.OrderView {
    ignore state.customers.get(input.customerId) ?? Runtime.trap("Cliente no encontrado");
    ignore state.motorcycles.get(input.motorcycleId) ?? Runtime.trap("Moto no encontrada");
    switch (input.previousMileage) {
      case (?previous) {
        if (input.intakeMileage < previous) {
          Runtime.trap("El kilometraje actual no puede ser menor que el kilometraje anterior");
        };
      };
      case null {};
    };

    let id = state.counters.nextOrderId;
    state.counters.nextOrderId := id + 1;
    let now = Time.now();
    let orderNumber = orderNumberFor(id);

    // El anticipo se valida contra el total de la orden recién creada (sin
    // líneas todavía, el total es 0). Una orden sin monto admite un anticipo
    // positivo: el límite anticipo <= total solo se aplica cuando la orden ya
    // tiene un total mayor que cero. El frontend también puede registrar el
    // anticipo después de cargar las líneas con `setOrderAdvance`.
    let order : Types.WorkshopOrder = {
      id;
      orderNumber;
      customerId = input.customerId;
      motorcycleId = input.motorcycleId;
      intakeMileage = input.intakeMileage;
      previousMileage = input.previousMileage;
      oilChangeInterval = input.oilChangeInterval;
      problem = input.problem;
      status = #received;
      parts = [];
      labor = [];
      photos = [];
      technicianIds = input.technicianIds;
      statusHistory = [{ from = null; to = #received; performedBy; at = now }];
      cancelReason = null;
      cancelledAt = null;
      advance = null;
      payments = [];
      createdAt = now;
      updatedAt = now;
    };
    state.orders.add(id, order);

    // Si se envía un anticipo al crear, se registra contra el total de la
    // orden (que puede incluir líneas si el frontend las envía en el futuro).
    let view = toView(state, order);
    switch (input.advance) {
      case null { view };
      case (?advanceInput) {
        let advance = buildAdvance(advanceInput, view.totals.total, performedBy);
        let updated : Types.WorkshopOrder = { order with advance = ?advance; updatedAt = Time.now() };
        applyAdvanceMovement(state, orderNumber, ?advance, performedBy);
        store(state, updated);
      };
    };
  };

  // Fija o borra el anticipo de una orden ya creada. `amount = null` borra el
  // anticipo; con valor, `method` debe ser efectivo o transferencia. El monto
  // no puede superar el total de la orden (salvo cuando el total es 0, que
  // admite cualquier anticipo positivo) ni registrarse sobre una orden ya
  // facturada. Ajusta el movimiento de Caja/Bancos correspondiente.
  public func setOrderAdvance(state : State, id : Types.Id, input : Types.SetOrderAdvanceInput, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    if (order.status == #cancelled) {
      Runtime.trap("La orden está cancelada y no admite cambios");
    };
    // Una orden ya facturada no admite cambios de anticipo.
    if (orderHasInvoice(state, order.orderNumber)) {
      Runtime.trap("La orden ya está facturada y no admite cambios de anticipo");
    };
    let totals = computeTotals(state, order);
    switch (input.amount) {
      case null {
        // Borra el anticipo y su movimiento de Caja/Bancos.
        applyAdvanceMovement(state, order.orderNumber, null, performedBy);
        let updated : Types.WorkshopOrder = { order with advance = null; updatedAt = Time.now() };
        store(state, updated);
      };
      case (?amount) {
        let method = input.method ?? Runtime.trap("El medio de pago del anticipo debe ser efectivo o transferencia");
        let advance = buildAdvance({ amount; method }, totals.total, performedBy);
        applyAdvanceMovement(state, order.orderNumber, ?advance, performedBy);
        let updated : Types.WorkshopOrder = { order with advance = ?advance; updatedAt = Time.now() };
        store(state, updated);
      };
    };
  };

  // Comprueba si la orden ya tiene una factura asociada. Una factura de origen
  // `#workshopOrder` referencia la orden por `orderId`.
  func orderHasInvoice(state : State, orderNumber : Text) : Bool {
    var found = false;
    for (invoice in state.invoices.values()) {
      switch (invoice.origin) {
        case (#workshopOrder) {
          switch (invoice.orderId) {
            case (?orderId) {
              switch (state.orders.get(orderId)) {
                case (?order) { if (order.orderNumber == orderNumber) { found := true } };
                case null {};
              };
            };
            case null {};
          };
        };
        case (_) {};
      };
    };
    found;
  };

  // Edita el intervalo de km del próximo cambio de aceite de una orden ya
  // creada. Una orden cancelada o entregada no admite cambios.
  public func updateOilChangeInterval(state : State, id : Types.Id, input : Types.OilChangeIntervalInput, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    if (order.status == #cancelled) {
      Runtime.trap("La orden está cancelada y no admite cambios");
    };
    if (order.status == #delivered) {
      Runtime.trap("La orden ya fue entregada y no admite cambios");
    };
    let updated : Types.WorkshopOrder = {
      order with
      oilChangeInterval = input.oilChangeInterval;
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  public func assignTechnician(state : State, id : Types.Id, technicianId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    if (order.technicianIds.contains(technicianId)) {
      return toView(state, order);
    };
    let updated : Types.WorkshopOrder = {
      order with
      technicianIds = order.technicianIds.concat([technicianId]);
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  public func unassignTechnician(state : State, id : Types.Id, technicianId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    let updated : Types.WorkshopOrder = {
      order with
      technicianIds = order.technicianIds.filter(func (t) = t != technicianId);
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  // Transiciones permitidas: #received → #inRepair → #ready → #delivered.
  func validTransition(from : Types.OrderStatus, to : Types.OrderStatus) : Bool {
    switch (from, to) {
      case (#received, #inRepair) { true };
      case (#inRepair, #ready) { true };
      case (#ready, #delivered) { true };
      case (_) { false };
    };
  };

  func statusText(status : Types.OrderStatus) : Text {
    switch (status) {
      case (#received) { "received" };
      case (#inRepair) { "inRepair" };
      case (#ready) { "ready" };
      case (#delivered) { "delivered" };
      case (#cancelled) { "cancelled" };
    };
  };

  public func updateOrderStatus(state : State, id : Types.Id, status : Types.OrderStatus, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    if (order.status == #cancelled) {
      Runtime.trap("La orden está cancelada y no admite más transiciones");
    };
    if (not validTransition(order.status, status)) {
      Runtime.trap("Transición de estado inválida: " # statusText(order.status) # " -> " # statusText(status));
    };
    let now = Time.now();
    let updated : Types.WorkshopOrder = {
      order with
      status;
      statusHistory = order.statusHistory.concat([{ from = ?order.status; to = status; performedBy; at = now }]);
      updatedAt = now;
    };
    store(state, updated);
  };

  // Cancela una orden con motivo obligatorio. La orden cancelada deja de ser
  // facturable y sale de los flujos activos; el cambio queda en el historial.
  public func cancelOrder(state : State, id : Types.Id, reason : Text, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    if (order.status == #cancelled) {
      Runtime.trap("La orden ya está cancelada");
    };
    if (order.status == #delivered) {
      Runtime.trap("Una orden entregada no se puede cancelar");
    };
    let trimmed = reason.trim(#predicate (func (c : Char) : Bool = c == ' '));
    if (trimmed == "") {
      Runtime.trap("El motivo de cancelación es obligatorio");
    };
    let now = Time.now();
    let updated : Types.WorkshopOrder = {
      order with
      status = #cancelled;
      cancelReason = ?trimmed;
      cancelledAt = ?now;
      statusHistory = order.statusHistory.concat([{ from = ?order.status; to = #cancelled; performedBy; at = now }]);
      updatedAt = now;
    };
    store(state, updated);
  };

  // Elimina los movimientos de Caja/Bancos de los abonos de una orden. Se
  // identifican por su origen `#advance` y una referencia con el prefijo
  // `<OT>-ABONO-`, que los distingue del movimiento del anticipo.
  func removePaymentMovements(state : State, orderNumber : Text) {
    let prefix = orderNumber # "-ABONO-";
    let toRemove = List.empty<Types.Id>();
    for (movement in state.cashMovements.values()) {
      let isAdvance = switch (movement.source) {
        case (#advance) { true };
        case (_) { false };
      };
      switch (movement.reference) {
        case (?reference) {
          if (isAdvance and reference.startsWith(#text prefix)) {
            toRemove.add(movement.id);
          };
        };
        case null {};
      };
    };
    for (id in toRemove.values()) {
      state.cashMovements.remove(id);
    };
  };

  // Elimina una orden de forma irreversible. Devuelve `false` si no existía.
  public func deleteOrder(state : State, id : Types.Id, performedBy : Principal) : Bool {
    switch (state.orders.get(id)) {
      case null { false };
      case (?order) {
        // Elimina también los movimientos de anticipo y abonos asociados.
        applyAdvanceMovement(state, order.orderNumber, null, performedBy);
        removePaymentMovements(state, order.orderNumber);
        state.orders.remove(id);
        true;
      };
    };
  };

  // Carga una foto de evidencia. Máximo 6 por orden.
  public func addOrderPhoto(state : State, id : Types.Id, input : Types.OrderPhotoInput, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    if (order.photos.size() >= maxOrderPhotos) {
      Runtime.trap("La orden ya tiene el máximo de 6 fotos");
    };
    let photoId = state.counters.nextOrderPhotoId;
    state.counters.nextOrderPhotoId := photoId + 1;
    let photo : Types.OrderPhoto = {
      id = photoId;
      blob = input.blob;
      filename = input.filename;
      mimeType = input.mimeType;
      uploadedBy = performedBy;
      uploadedAt = Time.now();
    };
    let updated : Types.WorkshopOrder = {
      order with
      photos = order.photos.concat([photo]);
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  // Elimina una foto de evidencia de la orden.
  public func removeOrderPhoto(state : State, id : Types.Id, photoId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    let exists = order.photos.any(func (photo) = photo.id == photoId);
    if (not exists) {
      Runtime.trap("Foto no encontrada");
    };
    let updated : Types.WorkshopOrder = {
      order with
      photos = order.photos.filter(func (photo) = photo.id != photoId);
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  public func addOrderPart(state : State, id : Types.Id, input : Types.OrderPartInput, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    let part = state.parts.get(input.partId) ?? Runtime.trap("Repuesto no encontrado");
    // El costo unitario de referencia es el del lote indicado o el precio de
    // costo del repuesto. Agregar la línea NO descuenta stock.
    let unitCost = switch (input.lotId) {
      case (?lotId) {
        switch (state.lots.get(lotId)) {
          case (?lot) { lot.unitCost };
          case null { part.costPrice };
        };
      };
      case null { part.costPrice };
    };
    let partId = state.counters.nextOrderPartId;
    state.counters.nextOrderPartId := partId + 1;
    let line : Types.OrderPart = {
      id = partId;
      partId = input.partId;
      lotId = input.lotId;
      description = part.name;
      quantity = input.quantity;
      unitPrice = part.salePrice;
      unitCost;
    };
    let updated : Types.WorkshopOrder = {
      order with
      parts = [line].concat(order.parts);
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  // Comprueba que el anticipo vigente más los abonos de una orden no superen el
  // total indicado. Se usa tras cualquier operación que reduzca el total para
  // mantener la invariante anticipo + abonos <= total. Una orden sin monto
  // (total = 0) admite el anticipo ya registrado: la invariante solo se aplica
  // cuando la orden tiene un total mayor que cero.
  func ensureAdvanceWithinTotal(order : Types.WorkshopOrder, total : Types.Money) {
    if (total == 0) {
      return;
    };
    var paid = 0;
    for (payment in order.payments.values()) {
      paid += payment.amount;
    };
    let advance = switch (order.advance) {
      case (?value) { value.amount };
      case null { 0 };
    };
    if (advance + paid > total) {
      Runtime.trap("El anticipo y los abonos no pueden superar el total de la orden");
    };
  };

  // Quita una línea de repuesto. NO devuelve stock: agregar la línea nunca lo
  // descontó. Rechaza la operación si dejaría el total por debajo del anticipo.
  public func removeOrderPart(state : State, id : Types.Id, orderPartId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    let exists = order.parts.any(func (line) = line.id == orderPartId);
    if (not exists) {
      Runtime.trap("Línea de repuesto no encontrada");
    };
    let updated : Types.WorkshopOrder = {
      order with
      parts = order.parts.filter(func (line) = line.id != orderPartId);
      updatedAt = Time.now();
    };
    ensureAdvanceWithinTotal(updated, computeTotals(state, updated).total);
    store(state, updated);
  };

  public func addLabor(state : State, id : Types.Id, input : Types.LaborInput, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    switch (input.serviceId) {
      case (?serviceId) {
        ignore state.services.get(serviceId) ?? Runtime.trap("Servicio no encontrado");
      };
      case null {};
    };
    let laborId = state.counters.nextLaborId;
    state.counters.nextLaborId := laborId + 1;
    let line : Types.LaborItem = {
      id = laborId;
      description = input.description;
      price = input.price;
      technicianId = input.technicianId;
      serviceId = input.serviceId;
    };
    let updated : Types.WorkshopOrder = {
      order with
      labor = [line].concat(order.labor);
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  public func updateLaborTechnician(state : State, id : Types.Id, laborId : Types.Id, technicianId : ?Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    let exists = order.labor.any(func (line) = line.id == laborId);
    if (not exists) {
      Runtime.trap("Línea de mano de obra no encontrada");
    };
    let updated : Types.WorkshopOrder = {
      order with
      labor = order.labor.map(
        func (line) {
          if (line.id == laborId) { { line with technicianId } } else { line };
        }
      );
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  // Quita una línea de mano de obra. Rechaza la operación si dejaría el total
  // por debajo del anticipo registrado.
  public func removeLabor(state : State, id : Types.Id, laborId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    let exists = order.labor.any(func (line) = line.id == laborId);
    if (not exists) {
      Runtime.trap("Línea de mano de obra no encontrada");
    };
    let updated : Types.WorkshopOrder = {
      order with
      labor = order.labor.filter(func (line) = line.id != laborId);
      updatedAt = Time.now();
    };
    ensureAdvanceWithinTotal(updated, computeTotals(state, updated).total);
    store(state, updated);
  };

  // Cuenta de Caja/Bancos que afecta un abono: efectivo → Caja, transferencia
  // o tarjeta → Bancos.
  func paymentAccount(method : BillingTypes.PaymentMethod) : CashTypes.CashAccount {
    switch (method) {
      case (#cash) { #cash };
      case (#transfer) { #bank };
      case (#card) { #bank };
      case (_) { #cash };
    };
  };

  // Valida el medio de pago de un abono: efectivo, transferencia o tarjeta.
  func validatePaymentMethod(method : BillingTypes.PaymentMethod) {
    switch (method) {
      case (#cash) {};
      case (#transfer) {};
      case (#card) {};
      case (_) {
        Runtime.trap("El medio de pago del abono debe ser efectivo, transferencia o tarjeta");
      };
    };
  };

  // Registra el movimiento de ingreso en Caja/Bancos de un abono. Cada abono
  // tiene su propio movimiento, identificado por su origen `#advance` y una
  // referencia única (`<OT>-ABONO-<id>`) que lo distingue del movimiento del
  // anticipo (referencia = número de OT) para que `applyAdvanceMovement` siga
  // localizando únicamente el anticipo.
  func applyPaymentMovement(state : State, orderNumber : Text, payment : Types.OrderPayment, performedBy : Principal) {
    let account = paymentAccount(payment.method);
    let shift = CashLib.resolveOrOpenShiftForAccount(state, account, performedBy, "Sistema (automático)");
    let id = state.counters.nextCashMovementId;
    state.counters.nextCashMovementId := id + 1;
    let movement : CashTypes.CashMovement = {
      id;
      shiftId = shift.id;
      timestamp = payment.registeredAt;
      kind = #income;
      paymentMethod = payment.method;
      amount = payment.amount;
      account;
      description = "Abono OT " # orderNumber;
      reference = ?(orderNumber # "-ABONO-" # payment.id.toText());
      source = #advance;
    };
    state.cashMovements.add(id, movement);
  };

  // Registra un abono sobre una orden de taller antes de facturarla. El monto
  // debe ser mayor que cero y, cuando la orden tiene un total mayor que cero,
  // no puede superar el saldo pendiente (`total − anticipo − abonos`). Una
  // orden sin monto (total = 0) admite cualquier abono: el saldo se recalcula
  // al agregar repuestos o mano de obra. La orden no admite abonos si está
  // cancelada, entregada o ya facturada. Cada abono crea un movimiento de
  // ingreso en Caja/Bancos asociado a la OT.
  public func addOrderPayment(state : State, id : Types.Id, input : Types.OrderPaymentInput, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    if (input.amount == 0) {
      Runtime.trap("El monto del abono debe ser mayor que cero");
    };
    validatePaymentMethod(input.method);
    if (order.status == #cancelled or order.status == #delivered) {
      Runtime.trap("La orden no admite abonos");
    };
    if (orderHasInvoice(state, order.orderNumber)) {
      Runtime.trap("La orden no admite abonos");
    };
    let totals = computeTotals(state, order);
    if (totals.total > 0 and input.amount > totals.balance) {
      Runtime.trap("El abono supera el saldo pendiente de la orden");
    };
    let paymentId = state.counters.nextOrderPaymentId;
    state.counters.nextOrderPaymentId := paymentId + 1;
    let payment : Types.OrderPayment = {
      id = paymentId;
      amount = input.amount;
      method = input.method;
      note = input.note;
      registeredAt = Time.now();
      registeredBy = performedBy;
    };
    applyPaymentMovement(state, order.orderNumber, payment, performedBy);
    let updated : Types.WorkshopOrder = {
      order with
      payments = order.payments.concat([payment]);
      updatedAt = Time.now();
    };
    store(state, updated);
  };

  // Lista los abonos registrados sobre una orden, ordenados por id ascendente.
  public func listOrderPayments(state : State, id : Types.Id) : [Types.OrderPayment] {
    let order = findOrder(state, id);
    order.payments.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  // Construye el recibo de anticipo imprimible de una orden: datos del
  // cliente, la moto, el anticipo vigente, el total, el total abonado y el
  // saldo pendiente.
  public func buildAdvanceReceipt(state : State, id : Types.Id) : Types.OrderAdvanceReceipt {
    let order = findOrder(state, id);
    let totals = computeTotals(state, order);
    let (customerName, customerDocument) = switch (state.customers.get(order.customerId)) {
      case (?customer) { (customer.name, customer.document) };
      case null { ("", null) };
    };
    let (brand, model, plate) = switch (state.motorcycles.get(order.motorcycleId)) {
      case (?moto) { (moto.brand, moto.model, moto.plate) };
      case null { ("", "", "") };
    };
    {
      orderId = order.id;
      orderNumber = order.orderNumber;
      customerName;
      customerDocument;
      motorcycleBrand = brand;
      motorcycleModel = model;
      motorcyclePlate = plate;
      advance = order.advance;
      total = totals.total;
      paidAmount = totals.paidAmount;
      balance = totals.balance;
      payments = order.payments.sort(func (a, b) = Nat.compare(a.id, b.id));
      issuedAt = Time.now();
    };
  };
};
