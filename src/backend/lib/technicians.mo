import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/technicians";
import WorkshopTypes "../types/workshop";

module {
  public type Counters = {
    var nextTechnicianId : Nat;
  };

  public type State = {
    technicians : Map.Map<Common.Id, Types.Technician>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func matches(technician : Types.Technician, filter : Types.TechnicianFilter, needle : ?Text) : Bool {
    let searchOk = switch (needle) {
      case null { true };
      case (?n) {
        if (n == "") { true } else {
          technician.name.toLower().contains(#text n) or technician.code.toLower().contains(#text n);
        };
      };
    };
    let specialtyOk = switch (filter.specialty) {
      case null { true };
      case (?s) { technician.specialty == s };
    };
    let activeOk = switch (filter.activeOnly) {
      case null { true };
      case (?only) { if (only) { technician.active } else { true } };
    };
    searchOk and specialtyOk and activeOk;
  };

  func isActiveOrder(order : WorkshopTypes.WorkshopOrder) : Bool {
    switch (order.status) {
      case (#delivered) { false };
      case (_) { true };
    };
  };

  func workloadFor(state : State, technician : Types.Technician) : Types.TechnicianWorkload {
    let orderIds = List.empty<Types.Id>();
    for (order in state.orders.values()) {
      if (isActiveOrder(order) and order.technicianIds.contains(technician.id)) {
        orderIds.add(order.id);
      };
    };
    let ids = orderIds.toArray().sort(func (a, b) = Nat.compare(a, b));
    { technician; activeOrders = ids.size(); orderIds = ids };
  };

  // Órdenes activas por técnico en un solo recorrido de las órdenes. Evita
  // recorrer todas las órdenes una vez por técnico evaluado.
  func activeOrdersByTechnician(state : State) : Map.Map<Types.Id, List.List<Types.Id>> {
    let byTechnician = Map.empty<Types.Id, List.List<Types.Id>>();
    for (order in state.orders.values()) {
      if (isActiveOrder(order)) {
        for (technicianId in order.technicianIds.values()) {
          let current = byTechnician.get(technicianId) ?? List.empty<Types.Id>();
          current.add(order.id);
          byTechnician.add(technicianId, current);
        };
      };
    };
    byTechnician
  };

  func workloadFrom(technician : Types.Technician, orderIds : List.List<Types.Id>) : Types.TechnicianWorkload {
    let ids = orderIds.toArray().sort(func (a, b) = Nat.compare(a, b));
    { technician; activeOrders = ids.size(); orderIds = ids };
  };

  func findTechnician(state : State, id : Types.Id) : Types.Technician {
    state.technicians.get(id) ?? Runtime.trap("Técnico no encontrado");
  };

  func normalizeCode(code : Text) : Text {
    code.trim(#predicate(func (c : Char) : Bool = c == ' ')).toLower();
  };

  func codeTaken(state : State, code : Text, exceptId : ?Types.Id) : Bool {
    let needle = normalizeCode(code);
    var taken = false;
    for (technician in state.technicians.values()) {
      let isSelf = switch (exceptId) {
        case (?id) { technician.id == id };
        case null { false };
      };
      if (not isSelf and normalizeCode(technician.code) == needle) {
        taken := true;
      };
    };
    taken;
  };

  func validateInput(input : Types.TechnicianInput) : () {
    if (normalizeCode(input.code) == "") {
      Runtime.trap("El código del técnico es obligatorio");
    };
    if (input.name.trim(#predicate(func (c : Char) : Bool = c == ' ')) == "") {
      Runtime.trap("El nombre del técnico es obligatorio");
    };
    if (input.commissionRate > 100) {
      Runtime.trap("El porcentaje de comisión debe estar entre 0 y 100");
    };
  };

  // --- public API ----------------------------------------------------------

  public func listTechnicians(state : State, filter : Types.TechnicianFilter) : [Types.Technician] {
    let needle = switch (filter.search) {
      case null { null };
      case (?term) { ?term.toLower() };
    };
    let out = List.empty<Types.Technician>();
    for (technician in state.technicians.values()) {
      if (matches(technician, filter, needle)) { out.add(technician) };
    };
    out.toArray().sort(func (a, b) = Text.compare(a.name.toLower(), b.name.toLower()));
  };

  public func getTechnician(state : State, id : Types.Id) : ?Types.Technician {
    state.technicians.get(id);
  };

  public func createTechnician(state : State, input : Types.TechnicianInput) : Types.Technician {
    validateInput(input);
    if (codeTaken(state, input.code, null)) {
      Runtime.trap("Ya existe un técnico con el código " # input.code);
    };
    let id = state.counters.nextTechnicianId;
    state.counters.nextTechnicianId := id + 1;
    let technician : Types.Technician = {
      id;
      code = input.code.trim(#predicate(func (c : Char) : Bool = c == ' '));
      name = input.name.trim(#predicate(func (c : Char) : Bool = c == ' '));
      phone = input.phone;
      email = input.email;
      specialty = input.specialty;
      hourlyRate = input.hourlyRate;
      commissionRate = input.commissionRate;
      active = input.active;
      createdAt = Time.now();
    };
    state.technicians.add(id, technician);
    technician;
  };

  public func updateTechnician(state : State, id : Types.Id, input : Types.TechnicianInput) : Types.Technician {
    let existing = findTechnician(state, id);
    validateInput(input);
    if (codeTaken(state, input.code, ?id)) {
      Runtime.trap("Ya existe un técnico con el código " # input.code);
    };
    let updated : Types.Technician = {
      existing with
      code = input.code.trim(#predicate(func (c : Char) : Bool = c == ' '));
      name = input.name.trim(#predicate(func (c : Char) : Bool = c == ' '));
      phone = input.phone;
      email = input.email;
      specialty = input.specialty;
      hourlyRate = input.hourlyRate;
      commissionRate = input.commissionRate;
      active = input.active;
    };
    state.technicians.add(id, updated);
    updated;
  };

  public func findByCode(state : State, code : Text) : ?Types.Technician {
    let needle = normalizeCode(code);
    state.technicians.values().find(func technician = normalizeCode(technician.code) == needle);
  };

  public func deleteTechnician(state : State, id : Types.Id) : Bool {
    switch (state.technicians.get(id)) {
      case null { false };
      case (?_) {
        state.technicians.remove(id);
        true;
      };
    };
  };

  public func listWorkload(state : State) : [Types.TechnicianWorkload] {
    let byTechnician = activeOrdersByTechnician(state);
    let out = List.empty<Types.TechnicianWorkload>();
    for (technician in state.technicians.values()) {
      out.add(workloadFrom(technician, byTechnician.get(technician.id) ?? List.empty()));
    };
    out.toArray().sort(func (a, b) = Text.compare(a.technician.name.toLower(), b.technician.name.toLower()));
  };

  public func getWorkload(state : State, technicianId : Types.Id) : ?Types.TechnicianWorkload {
    switch (state.technicians.get(technicianId)) {
      case null { null };
      case (?technician) { ?workloadFor(state, technician) };
    };
  };
};
