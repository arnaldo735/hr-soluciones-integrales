import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Types "../types/workshop";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import ServiceTypes "../types/services";

module {
  public type Counters = {
    var nextOrderId : Nat;
    var nextOrderPartId : Nat;
    var nextLaborId : Nat;
    var nextMovementId : Nat;
    var nextOrderPhotoId : Nat;
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
  };

  // El régimen fiscal de la empresa decide si se aplica IVA; la tarifa
  // configurada vive en el perfil de empresa (`CompanyProfile.taxRate`) y solo
  // se usa cuando la empresa es responsable de IVA.
  func effectiveTaxRate(state : State) : Types.TaxRate {
    CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
  };

  // --- helpers -------------------------------------------------------------

  func statusText(status : Types.OrderStatus) : Text {
    switch (status) {
      case (#received) { "received" };
      case (#inRepair) { "inRepair" };
      case (#ready) { "ready" };
      case (#delivered) { "delivered" };
      case (#cancelled) { "cancelled" };
    };
  };

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

  func partName(state : State, partId : Types.Id) : Text {
    switch (state.parts.get(partId)) {
      case (?part) { part.name };
      case null { "Repuesto #" # partId.toText() };
    };
  };

  func partSalePrice(state : State, partId : Types.Id) : Types.Money {
    switch (state.parts.get(partId)) {
      case (?part) { part.salePrice };
      case null { 0 };
    };
  };

  func lotUnitCost(state : State, lotId : Types.Id) : Types.Money {
    switch (state.lots.get(lotId)) {
      case (?lot) { lot.unitCost };
      case null { 0 };
    };
  };

  func partUnitCost(state : State, partId : Types.Id) : Types.Money {
    switch (state.parts.get(partId)) {
      case (?part) { part.costPrice };
      case null { 0 };
    };
  };

  // Costo unitario de referencia de una línea de repuesto: el costo del lote
  // elegido si se indicó, o el precio de costo del repuesto. Se conserva en la
  // línea para calcular el margen; agregar la línea NO descuenta stock.
  func referenceUnitCost(state : State, partId : Types.Id, lotId : ?Types.Id) : Types.Money {
    switch (lotId) {
      case (?id) { lotUnitCost(state, id) };
      case null { partUnitCost(state, partId) };
    };
  };

  func findOrder(state : State, id : Types.Id) : Types.WorkshopOrder {
    state.orders.get(id) ?? Runtime.trap("Orden no encontrada");
  };

  // Una orden cancelada o entregada ya no admite cambios de contenido.
  func requireEditable(order : Types.WorkshopOrder) : () {
    switch (order.status) {
      case (#cancelled) { Runtime.trap("La orden está cancelada y no admite cambios") };
      case (#delivered) { Runtime.trap("La orden ya fue entregada y no admite cambios") };
      case (_) {};
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
    {
      partsSubtotal;
      laborSubtotal;
      subtotal;
      taxRate;
      tax;
      total = subtotal + tax;
    };
  };

  func toView(state : State, order : Types.WorkshopOrder) : Types.OrderView {
    { order; totals = computeTotals(state, order) };
  };

  func matchesSearch(state : State, order : Types.WorkshopOrder, term : Text) : Bool {
    let lower = term.toLower();
    if (order.orderNumber.toLower().contains(#text lower)) { return true };
    switch (state.customers.get(order.customerId)) {
      case (?customer) {
        if (customer.name.toLower().contains(#text lower)) { return true };
      };
      case null {};
    };
    switch (state.motorcycles.get(order.motorcycleId)) {
      case (?moto) {
        if (moto.plate.toLower().contains(#text lower)) { return true };
        if (moto.brand.toLower().contains(#text lower)) { return true };
        if (moto.model.toLower().contains(#text lower)) { return true };
      };
      case null {};
    };
    false;
  };

  // Valida la referencia a un servicio del catálogo: si `serviceId` es `?id`,
  // el servicio debe existir. Un servicio inactivo sigue siendo referenciable
  // por una línea existente. Devuelve `null` si es válido, o el mensaje de
  // error en español.
  public func validateServiceRef(state : State, serviceId : ?Types.Id) : ?Text {
    switch (serviceId) {
      case (?id) {
        switch (state.services.get(id)) {
          case (?_) { null };
          case null { ?"Servicio no encontrado" };
        };
      };
      case null { null };
    };
  };

  // --- public API ----------------------------------------------------------

  public func listOrders(state : State, filter : Types.OrderFilter, offset : Nat, limit : Nat) : Types.OrderPage {
    let matched = List.empty<Types.WorkshopOrder>();
    for (order in state.orders.values()) {
      var keep = true;
      switch (filter.status) {
        case (?status) { if (order.status != status) { keep := false } };
        case null {};
      };
      switch (filter.search) {
        case (?term) {
          if (term.size() > 0 and not matchesSearch(state, order, term)) { keep := false };
        };
        case null {};
      };
      if (keep) { matched.add(order) };
    };
    let sorted = matched.toArray().sort(func (a, b) = Nat.compare(b.id, a.id));
    let total = sorted.size();
    let items = sorted.sliceToArray(offset.toInt(), (offset + limit).toInt()).map(func order = toView(state, order));
    { items; total; offset; limit };
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
    let id = state.counters.nextOrderId;
    state.counters.nextOrderId := id + 1;
    let now = Time.now();
    let order : Types.WorkshopOrder = {
      id;
      orderNumber = orderNumberFor(id);
      customerId = input.customerId;
      motorcycleId = input.motorcycleId;
      intakeMileage = input.intakeMileage;
      problem = input.problem;
      status = #received;
      parts = [];
      labor = [];
      photos = [];
      technicianIds = input.technicianIds;
      statusHistory = [{ from = null; to = #received; performedBy; at = now }];
      cancelReason = null;
      cancelledAt = null;
      createdAt = now;
      updatedAt = now;
    };
    state.orders.add(id, order);
    toView(state, order);
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
    state.orders.add(id, updated);
    toView(state, updated);
  };

  public func unassignTechnician(state : State, id : Types.Id, technicianId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    let updated : Types.WorkshopOrder = {
      order with
      technicianIds = order.technicianIds.filter(func existing = existing != technicianId);
      updatedAt = Time.now();
    };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  public func updateOrderStatus(state : State, id : Types.Id, status : Types.OrderStatus, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    let from = order.status;
    let valid = switch (from, status) {
      case (#received, #inRepair) { true };
      case (#inRepair, #ready) { true };
      case (#ready, #delivered) { true };
      case (_, _) { false };
    };
    if (not valid) {
      Runtime.trap("Transición de estado inválida: " # statusText(from) # " -> " # statusText(status));
    };
    let now = Time.now();
    let updated : Types.WorkshopOrder = {
      order with
      status;
      statusHistory = order.statusHistory.concat([{ from = ?from; to = status; performedBy; at = now }]);
      updatedAt = now;
    };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  // Cancela una orden con motivo obligatorio. La orden cancelada deja de ser
  // facturable y sale de los flujos activos; el cambio queda en el historial.
  public func cancelOrder(state : State, id : Types.Id, reason : Text, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    if (reason.size() == 0) {
      Runtime.trap("El motivo de cancelación es obligatorio");
    };
    switch (order.status) {
      case (#cancelled) { Runtime.trap("La orden ya está cancelada") };
      case (#delivered) { Runtime.trap("Una orden entregada no se puede cancelar") };
      case (_) {};
    };
    let now = Time.now();
    let updated : Types.WorkshopOrder = {
      order with
      status = #cancelled;
      cancelReason = ?reason;
      cancelledAt = ?now;
      statusHistory = order.statusHistory.concat([{ from = ?order.status; to = #cancelled; performedBy; at = now }]);
      updatedAt = now;
    };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  // Elimina una orden de forma irreversible. Devuelve `false` si no existía.
  public func deleteOrder(state : State, id : Types.Id, performedBy : Principal) : Bool {
    ignore performedBy;
    switch (state.orders.get(id)) {
      case null { false };
      case (?_) {
        state.orders.remove(id);
        true;
      };
    };
  };

  // Carga una foto de evidencia. Máximo 6 por orden.
  public func addOrderPhoto(state : State, id : Types.Id, input : Types.OrderPhotoInput, performedBy : Principal) : Types.OrderView {
    let order = findOrder(state, id);
    if (order.photos.size() >= maxOrderPhotos) {
      Runtime.trap("La orden ya tiene el máximo de " # maxOrderPhotos.toText() # " fotos");
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
    state.orders.add(id, updated);
    toView(state, updated);
  };

  // Elimina una foto de evidencia de la orden.
  public func removeOrderPhoto(state : State, id : Types.Id, photoId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    ignore order.photos.find(func photo = photo.id == photoId) ?? Runtime.trap("Foto no encontrada");
    let updated : Types.WorkshopOrder = {
      order with
      photos = order.photos.filter(func photo = photo.id != photoId);
      updatedAt = Time.now();
    };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  // movimiento de salida: la línea solo conserva el costo unitario de
  // referencia para el cálculo del margen.
  public func addOrderPart(state : State, id : Types.Id, input : Types.OrderPartInput, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    requireEditable(order);
    ignore state.parts.get(input.partId) ?? Runtime.trap("Repuesto no encontrado");
    let unitPrice = partSalePrice(state, input.partId);
    let unitCost = referenceUnitCost(state, input.partId, input.lotId);
    let orderPartId = state.counters.nextOrderPartId;
    state.counters.nextOrderPartId := orderPartId + 1;
    let line : Types.OrderPart = {
      id = orderPartId;
      partId = input.partId;
      lotId = input.lotId;
      description = partName(state, input.partId);
      quantity = input.quantity;
      unitPrice;
      unitCost;
    };
    let now = Time.now();
    let updated : Types.WorkshopOrder = {
      order with
      parts = order.parts.concat([line]);
      updatedAt = now;
    };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  // Quita una línea de repuesto. NO devuelve stock: agregar la línea nunca lo
  // descontó.
  public func removeOrderPart(state : State, id : Types.Id, orderPartId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    requireEditable(order);
    ignore order.parts.find(func part = part.id == orderPartId) ?? Runtime.trap("Línea de repuesto no encontrada");
    let now = Time.now();
    let updated : Types.WorkshopOrder = {
      order with
      parts = order.parts.filter(func part = part.id != orderPartId);
      updatedAt = now;
    };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  public func addLabor(state : State, id : Types.Id, input : Types.LaborInput, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    requireEditable(order);
    switch (validateServiceRef(state, input.serviceId)) {
      case (?message) { Runtime.trap(message) };
      case null {};
    };
    let laborId = state.counters.nextLaborId;
    state.counters.nextLaborId := laborId + 1;
    let item : Types.LaborItem = {
      id = laborId;
      description = input.description;
      price = input.price;
      technicianId = input.technicianId;
      serviceId = input.serviceId;
    };
    let updated : Types.WorkshopOrder = {
      order with
      labor = order.labor.concat([item]);
      updatedAt = Time.now();
    };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  public func updateLaborTechnician(state : State, id : Types.Id, laborId : Types.Id, technicianId : ?Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    var found = false;
    let labor = order.labor.map(
      func(item) {
        if (item.id == laborId) {
          found := true;
          { item with technicianId = technicianId };
        } else {
          item;
        };
      }
    );
    if (not found) {
      Runtime.trap("Línea de mano de obra no encontrada");
    };
    let updated : Types.WorkshopOrder = { order with labor = labor; updatedAt = Time.now() };
    state.orders.add(id, updated);
    toView(state, updated);
  };

  public func removeLabor(state : State, id : Types.Id, laborId : Types.Id, performedBy : Principal) : Types.OrderView {
    ignore performedBy;
    let order = findOrder(state, id);
    requireEditable(order);
    var found = false;
    let kept = List.empty<Types.LaborItem>();
    for (item in order.labor.values()) {
      if (item.id == laborId) {
        found := true;
      } else {
        kept.add(item);
      };
    };
    if (not found) {
      Runtime.trap("Línea de mano de obra no encontrada");
    };
    let updated : Types.WorkshopOrder = { order with labor = kept.toArray(); updatedAt = Time.now() };
    state.orders.add(id, updated);
    toView(state, updated);
  };
};
