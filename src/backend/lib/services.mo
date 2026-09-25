import Char "mo:core/Char";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/services";

module {
  public type Counters = {
    var nextServiceId : Nat;
  };

  public type State = {
    services : Map.Map<Common.Id, Types.Service>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func normalize(value : Text) : Text {
    value.trim(#predicate (func(c : Char) : Bool { c.isWhitespace() })).toLower();
  };

  func matches(service : Types.Service, filter : Types.ServiceFilter, needle : ?Text) : Bool {
    let searchOk = switch (needle) {
      case null { true };
      case (?n) {
        if (n == "") { true } else {
          service.name.toLower().contains(#text n) or service.code.toLower().contains(#text n);
        };
      };
    };
    let categoryOk = switch (filter.category) {
      case null { true };
      case (?category) { service.category == category };
    };
    let activeOk = switch (filter.activeOnly) {
      case null { true };
      case (?activeOnly) { not activeOnly or service.active };
    };
    searchOk and categoryOk and activeOk;
  };

  func findService(state : State, id : Types.Id) : Types.Service {
    state.services.get(id) ?? Runtime.trap("Servicio no encontrado");
  };

  func hasDuplicateCode(state : State, code : Text, exceptId : ?Types.Id) : Bool {
    let needle = normalize(code);
    for (service in state.services.values()) {
      let sameId = switch (exceptId) {
        case null { false };
        case (?id) { service.id == id };
      };
      if (not sameId and normalize(service.code) == needle) { return true };
    };
    false;
  };

  func compareServices(a : Types.Service, b : Types.Service, sort : Types.ServiceSort) : Order.Order {
    switch (sort) {
      case (#name) { Text.compare(a.name.toLower(), b.name.toLower()) };
      case (#code) { Text.compare(a.code.toLower(), b.code.toLower()) };
      case (#category) { Text.compare(a.category.toLower(), b.category.toLower()) };
      case (#laborRate) { Nat.compare(a.laborRate, b.laborRate) };
    };
  };

  // --- public API ----------------------------------------------------------

  public func listServices(state : State, filter : Types.ServiceFilter, sort : Types.ServiceSort, offset : Nat, limit : Nat) : Types.ServicePage {
    let needle = switch (filter.search) {
      case null { null };
      case (?term) { ?normalize(term) };
    };
    let matched = List.empty<Types.Service>();
    for (service in state.services.values()) {
      if (matches(service, filter, needle)) { matched.add(service) };
    };
    let sorted = matched.toArray().sort(func (a, b) = compareServices(a, b, sort));
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    { items = sorted.sliceToArray(start, end); total; offset; limit };
  };

  public func getService(state : State, id : Types.Id) : ?Types.Service {
    state.services.get(id);
  };

  public func createService(state : State, input : Types.ServiceInput) : Types.Service {
    if (hasDuplicateCode(state, input.code, null)) {
      Runtime.trap("duplicateCode: " # input.code);
    };
    let id = state.counters.nextServiceId;
    state.counters.nextServiceId := id + 1;
    let service : Types.Service = {
      id;
      code = input.code;
      name = input.name;
      description = input.description;
      category = input.category;
      laborRate = input.laborRate;
      estimatedMinutes = input.estimatedMinutes;
      active = input.active;
      createdAt = Time.now();
    };
    state.services.add(id, service);
    service;
  };

  public func updateService(state : State, id : Types.Id, input : Types.ServiceInput) : Types.Service {
    let existing = findService(state, id);
    if (hasDuplicateCode(state, input.code, ?id)) {
      Runtime.trap("duplicateCode: " # input.code);
    };
    let updated : Types.Service = {
      id;
      code = input.code;
      name = input.name;
      description = input.description;
      category = input.category;
      laborRate = input.laborRate;
      estimatedMinutes = input.estimatedMinutes;
      active = input.active;
      createdAt = existing.createdAt;
    };
    state.services.add(id, updated);
    updated;
  };

  public func deleteService(state : State, id : Types.Id) : Bool {
    switch (state.services.get(id)) {
      case null { false };
      case (?_) {
        state.services.remove(id);
        true;
      };
    };
  };

  public func bulkCreateServices(state : State, inputs : [Types.ServiceInput]) : [Types.Service] {
    let created = List.empty<Types.Service>();
    for (input in inputs.values()) {
      if (not hasDuplicateCode(state, input.code, null)) {
        let id = state.counters.nextServiceId;
        state.counters.nextServiceId := id + 1;
        let service : Types.Service = {
          id;
          code = input.code;
          name = input.name;
          description = input.description;
          category = input.category;
          laborRate = input.laborRate;
          estimatedMinutes = input.estimatedMinutes;
          active = input.active;
          createdAt = Time.now();
        };
        state.services.add(id, service);
        created.add(service);
      };
    };
    created.toArray();
  };

  public func bulkUpdateServices(state : State, updates : [(Types.Id, Types.ServiceInput)]) : [Types.Service] {
    let updated = List.empty<Types.Service>();
    for ((id, input) in updates.values()) {
      switch (state.services.get(id)) {
        case null {};
        case (?existing) {
          if (not hasDuplicateCode(state, input.code, ?id)) {
            let service : Types.Service = {
              id;
              code = input.code;
              name = input.name;
              description = input.description;
              category = input.category;
              laborRate = input.laborRate;
              estimatedMinutes = input.estimatedMinutes;
              active = input.active;
              createdAt = existing.createdAt;
            };
            state.services.add(id, service);
            updated.add(service);
          };
        };
      };
    };
    updated.toArray();
  };

  // Elimina TODOS los servicios del catálogo de taller y devuelve la cantidad
  // eliminada. No toca las referencias (`serviceId`) que otras entidades
  // (líneas de mano de obra de órdenes, líneas de servicio de cotizaciones)
  // guardan: esas referencias quedan huérfanas pero los documentos existentes
  // no se corrompen ni se modifican.
  public func zeroServices(state : State) : Types.ZeroServicesResult {
    let deleted = state.services.size();
    state.services.clear();
    { deleted };
  };
};
