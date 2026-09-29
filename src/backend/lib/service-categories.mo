import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/service-categories";
import ServiceTypes "../types/services";
import Search "../lib/search";

module {
  public type Counters = {
    var nextServiceCategoryId : Nat;
  };

  public type State = {
    categories : Map.Map<Common.Id, Types.ServiceCategory>;
    services : Map.Map<Common.Id, ServiceTypes.Service>;
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func normalize(name : Text) : Text {
    Search.normalize(name);
  };

  func matches(category : Types.ServiceCategory, needle : ?Text) : Bool {
    switch (needle) {
      case null { true };
      case (?n) {
        if (n == "") { true } else {
          Search.containsAny([category.name, category.description], n);
        };
      };
    };
  };

  func findCategory(state : State, id : Types.Id) : Types.ServiceCategory {
    state.categories.get(id) ?? Runtime.trap("Categoría de servicio no encontrada");
  };

  func hasDuplicateName(state : State, name : Text, exceptId : ?Types.Id) : Bool {
    let needle = normalize(name);
    for (category in state.categories.values()) {
      let sameId = switch (exceptId) {
        case null { false };
        case (?id) { category.id == id };
      };
      if (not sameId and normalize(category.name) == needle) { return true };
    };
    false;
  };

  func usageFor(state : State, category : Types.ServiceCategory) : Types.ServiceCategoryUsage {
    let needle = normalize(category.name);
    var serviceCount = 0;
    var activeServiceCount = 0;
    for (service in state.services.values()) {
      if (normalize(service.category) == needle) {
        serviceCount += 1;
        if (service.active) { activeServiceCount += 1 };
      };
    };
    { category; serviceCount; activeServiceCount };
  };

  // Conteo de servicios por categoría en un solo recorrido de los servicios.
  // Evita recorrer todos los servicios una vez por categoría evaluada.
  func usageByCategory(state : State) : Map.Map<Text, (Nat, Nat)> {
    let usage = Map.empty<Text, (Nat, Nat)>();
    for (service in state.services.values()) {
      let key = normalize(service.category);
      let (count, activeCount) = usage.get(key) ?? (0, 0);
      usage.add(key, (count + 1, if (service.active) { activeCount + 1 } else { activeCount }));
    };
    usage
  };

  func usageFrom(category : Types.ServiceCategory, usage : Map.Map<Text, (Nat, Nat)>) : Types.ServiceCategoryUsage {
    let (serviceCount, activeServiceCount) = usage.get(normalize(category.name)) ?? (0, 0);
    { category; serviceCount; activeServiceCount };
  };

  // --- public API ----------------------------------------------------------

  public func listCategories(state : State, filter : Types.ServiceCategoryFilter) : [Types.ServiceCategoryUsage] {
    let needle = switch (filter.search) {
      case null { null };
      case (?term) { ?normalize(term) };
    };
    let usage = usageByCategory(state);
    let matched = List.empty<Types.ServiceCategoryUsage>();
    for (category in state.categories.values()) {
      if (matches(category, needle)) { matched.add(usageFrom(category, usage)) };
    };
    matched.toArray().sort(
      func (a, b) = Text.compare(Search.sortKey(a.category.name), Search.sortKey(b.category.name))
    );
  };

  public func getCategory(state : State, id : Types.Id) : ?Types.ServiceCategory {
    state.categories.get(id);
  };

  public func createCategory(state : State, input : Types.ServiceCategoryInput) : Types.ServiceCategory {
    if (hasDuplicateName(state, input.name, null)) {
      Runtime.trap("duplicateName: " # input.name);
    };
    let id = state.counters.nextServiceCategoryId;
    state.counters.nextServiceCategoryId := id + 1;
    let category : Types.ServiceCategory = {
      id;
      name = input.name;
      description = input.description;
      createdAt = Time.now();
    };
    state.categories.add(id, category);
    category;
  };

  public func updateCategory(state : State, id : Types.Id, input : Types.ServiceCategoryInput) : Types.ServiceCategory {
    let existing = findCategory(state, id);
    if (hasDuplicateName(state, input.name, ?id)) {
      Runtime.trap("duplicateName: " # input.name);
    };
    let updated : Types.ServiceCategory = {
      id;
      name = input.name;
      description = input.description;
      createdAt = existing.createdAt;
    };
    state.categories.add(id, updated);
    updated;
  };

  public func deleteCategory(state : State, id : Types.Id) : Bool {
    let existing = findCategory(state, id);
    let usage = usageFor(state, existing);
    if (usage.activeServiceCount > 0) {
      Runtime.trap("inUse: " # id.toText() # " (" # usage.activeServiceCount.toText() # " servicios activos)");
    };
    state.categories.remove(id);
    true;
  };
};
