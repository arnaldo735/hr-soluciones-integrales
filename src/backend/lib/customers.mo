import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";

import Types "../types/customers";
import CommonTypes "../types/common";
import WorkshopTypes "../types/workshop";

module {
  public type State = {
    customers : Map.Map<Types.Id, Types.Customer>;
    motorcycles : Map.Map<Types.Id, Types.Motorcycle>;
    orders : Map.Map<Types.Id, WorkshopTypes.WorkshopOrder>;
    counters : {
      var nextCustomerId : Nat;
      var nextMotorcycleId : Nat;
    };
  };

  // --- helpers -------------------------------------------------------------

  func statusText(status : WorkshopTypes.OrderStatus) : Text {
    switch (status) {
      case (#received) { "received" };
      case (#inRepair) { "inRepair" };
      case (#ready) { "ready" };
      case (#delivered) { "delivered" };
      case (#cancelled) { "cancelled" };
    };
  };

  func orderTotal(order : WorkshopTypes.WorkshopOrder) : CommonTypes.Money {
    var partsSubtotal = 0;
    for (part in order.parts.values()) {
      partsSubtotal += part.quantity * part.unitPrice;
    };
    var laborSubtotal = 0;
    for (item in order.labor.values()) {
      laborSubtotal += item.price;
    };
    partsSubtotal + laborSubtotal;
  };

  func plateFor(state : State, motorcycleId : Types.Id) : Text {
    switch (state.motorcycles.get(motorcycleId)) {
      case (?moto) { moto.plate };
      case null { "" };
    };
  };

  func toOrderSummary(state : State, order : WorkshopTypes.WorkshopOrder) : Types.CustomerOrderSummary {
    {
      orderId = order.id;
      orderNumber = order.orderNumber;
      status = statusText(order.status);
      motorcyclePlate = plateFor(state, order.motorcycleId);
      total = orderTotal(order);
      createdAt = order.createdAt;
    };
  };

  // Placas por cliente en un solo recorrido de las motos. Evita recorrer todas
  // las motos una vez por cliente evaluado.
  func platesByCustomer(state : State) : Map.Map<Types.Id, List.List<Text>> {
    let plates = Map.empty<Types.Id, List.List<Text>>();
    for (moto in state.motorcycles.values()) {
      let current = plates.get(moto.customerId) ?? List.empty<Text>();
      current.add(moto.plate.toLower());
      plates.add(moto.customerId, current);
    };
    plates
  };

  func matchesSearch(customer : Types.Customer, needle : Text, plates : List.List<Text>) : Bool {
    if (customer.name.toLower().contains(#text needle)) { return true };
    if (customer.phone.toLower().contains(#text needle)) { return true };
    switch (customer.document) {
      case (?doc) {
        if (doc.toLower().contains(#text needle)) { return true };
      };
      case null {};
    };
    for (plate in plates.values()) {
      if (plate.contains(#text needle)) { return true };
    };
    false;
  };

  func findCustomer(state : State, id : Types.Id) : Types.Customer {
    state.customers.get(id) ?? Runtime.trap("Cliente no encontrado");
  };

  func findMotorcycle(state : State, id : Types.Id) : Types.Motorcycle {
    state.motorcycles.get(id) ?? Runtime.trap("Moto no encontrada");
  };

  // --- public API ----------------------------------------------------------

  public func listCustomers(state : State, search : ?Text) : [Types.Customer] {
    let out = List.empty<Types.Customer>();
    let needle = switch (search) {
      case null { "" };
      case (?term) { term.toLower() };
    };
    let plates = if (needle == "") { Map.empty<Types.Id, List.List<Text>>() } else { platesByCustomer(state) };
    for (customer in state.customers.values()) {
      if (needle == "" or matchesSearch(customer, needle, plates.get(customer.id) ?? List.empty())) {
        out.add(customer);
      };
    };
    out.toArray().sort(func (a, b) = Text.compare(a.name.toLower(), b.name.toLower()));
  };

  public func getCustomer(state : State, id : Types.Id) : ?Types.Customer {
    state.customers.get(id);
  };

  public func getCustomerDetail(state : State, id : Types.Id) : ?Types.CustomerDetail {
    switch (state.customers.get(id)) {
      case null { null };
      case (?customer) {
        let motos = List.empty<Types.Motorcycle>();
        for (moto in state.motorcycles.values()) {
          if (moto.customerId == id) { motos.add(moto) };
        };
        let orders = List.empty<Types.CustomerOrderSummary>();
        for (order in state.orders.values()) {
          if (order.customerId == id) { orders.add(toOrderSummary(state, order)) };
        };
        ?{
          customer;
          motorcycles = motos.toArray().sort(func (a, b) = Nat.compare(a.id, b.id));
          orders = orders.toArray().sort(func (a, b) = Nat.compare(b.orderId, a.orderId));
        };
      };
    };
  };

  public func createCustomer(state : State, input : Types.CustomerInput) : Types.Customer {
    let id = state.counters.nextCustomerId;
    state.counters.nextCustomerId := id + 1;
    let customer : Types.Customer = {
      id;
      name = input.name;
      phone = input.phone;
      email = input.email;
      document = input.document;
      address = input.address;
      createdAt = Time.now();
    };
    state.customers.add(id, customer);
    customer;
  };

  public func updateCustomer(state : State, id : Types.Id, input : Types.CustomerInput) : Types.Customer {
    let existing = findCustomer(state, id);
    let updated : Types.Customer = {
      id = existing.id;
      name = input.name;
      phone = input.phone;
      email = input.email;
      document = input.document;
      address = input.address;
      createdAt = existing.createdAt;
    };
    state.customers.add(id, updated);
    updated;
  };

  // Conteo de motos por cliente en un solo recorrido de las motos.
  func motorcycleCountByCustomer(state : State) : Map.Map<Types.Id, Nat> {
    let counts = Map.empty<Types.Id, Nat>();
    for (moto in state.motorcycles.values()) {
      let current = counts.get(moto.customerId) ?? 0;
      counts.add(moto.customerId, current + 1);
    };
    counts
  };

  // Índice de clientes por id en un solo recorrido, para resolver el dueño de
  // cada moto sin volver a consultar el mapa por fila.
  func customersById(state : State) : Map.Map<Types.Id, Types.Customer> {
    let byId = Map.empty<Types.Id, Types.Customer>();
    for (customer in state.customers.values()) {
      byId.add(customer.id, customer);
    };
    byId
  };

  func matchesCustomerFilter(customer : Types.Customer, count : Nat, needle : ?Text, plates : List.List<Text>, hasMotorcycles : ?Bool) : Bool {
    let searchOk = switch (needle) {
      case null { true };
      case (?n) {
        if (n == "") { true } else { matchesSearch(customer, n, plates) };
      };
    };
    let hasMotosOk = switch (hasMotorcycles) {
      case null { true };
      case (?wanted) { (count > 0) == wanted };
    };
    searchOk and hasMotosOk
  };

  func compareCustomerItems(a : Types.CustomerListItem, b : Types.CustomerListItem, sort : Types.CustomerSort) : Order.Order {
    switch (sort) {
      case (#name) { Text.compare(a.name.toLower(), b.name.toLower()) };
      case (#createdAt) { Int.compare(a.createdAt, b.createdAt) };
      case (#motorcycleCount) { Nat.compare(b.motorcycleCount, a.motorcycleCount) };
    }
  };

  func matchesMotorcycleFilter(moto : Types.Motorcycle, owner : ?Types.Customer, needle : ?Text, brand : ?Text) : Bool {
    let searchOk = switch (needle) {
      case null { true };
      case (?n) {
        if (n == "") { true } else {
          var matched = moto.plate.toLower().contains(#text n)
            or moto.brand.toLower().contains(#text n)
            or moto.model.toLower().contains(#text n);
          switch (owner) {
            case (?customer) {
              if (customer.name.toLower().contains(#text n)) { matched := true };
            };
            case null {};
          };
          matched;
        };
      };
    };
    let brandOk = switch (brand) {
      case null { true };
      case (?b) { if (b == "") { true } else { moto.brand == b } };
    };
    searchOk and brandOk
  };

  func compareMotorcycleItems(a : Types.MotorcycleListItem, b : Types.MotorcycleListItem, sort : Types.MotorcycleSort) : Order.Order {
    switch (sort) {
      case (#plate) { Text.compare(a.plate.toLower(), b.plate.toLower()) };
      case (#brand) { Text.compare(a.brand.toLower(), b.brand.toLower()) };
      case (#year) { Nat.compare(a.year, b.year) };
      case (#customerName) { Text.compare(a.customerName.toLower(), b.customerName.toLower()) };
    }
  };

  public func listMotorcycles(state : State, customerId : Types.Id) : [Types.Motorcycle] {
    let out = List.empty<Types.Motorcycle>();
    for (moto in state.motorcycles.values()) {
      if (moto.customerId == customerId) { out.add(moto) };
    };
    out.toArray().sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  // Conteo de motos por cliente para un conjunto de ids, en un solo recorrido
  // de las motos. Evita el fan-out N+1 de llamar a listMotorcycles por cliente.
  public func listMotorcycleCountsByCustomers(state : State, ids : [Types.Id]) : [(Types.Id, Nat)] {
    let wanted = Set.empty<Types.Id>();
    for (id in ids.values()) { wanted.add(id) };
    let counts = Map.empty<Types.Id, Nat>();
    for (moto in state.motorcycles.values()) {
      if (wanted.contains(moto.customerId)) {
        let current = counts.get(moto.customerId) ?? 0;
        counts.add(moto.customerId, current + 1);
      };
    };
    let out = List.empty<(Types.Id, Nat)>();
    for (id in ids.values()) {
      out.add((id, counts.get(id) ?? 0));
    };
    out.toArray();
  };

  // Página de clientes con conteo de motos incluido en la misma respuesta.
  // Un solo recorrido de las motos construye el conteo por cliente; el filtro,
  // el ordenamiento y el corte offset/limit se resuelven en memoria.
  public func listCustomersPage(state : State, filter : Types.CustomerFilter, sort : Types.CustomerSort, offset : Nat, limit : Nat) : Types.CustomerPage {
    listCustomersPageDir(state, filter, sort, false, offset, limit);
  };

  // Igual que listCustomersPage pero con dirección de orden resuelta en el
  // backend: se ordena ascendente y, si descending es true, se invierte el
  // arreglo completo ANTES de cortar offset/limit, de modo que la página
  // contiene el verdadero top-N en la dirección pedida y total no cambia.
  public func listCustomersPageDir(state : State, filter : Types.CustomerFilter, sort : Types.CustomerSort, descending : Bool, offset : Nat, limit : Nat) : Types.CustomerPage {
    let counts = motorcycleCountByCustomer(state);
    let needle = switch (filter.search) {
      case null { null };
      case (?term) { ?term.toLower() };
    };
    let needsPlates = switch (needle) {
      case null { false };
      case (?n) { n != "" };
    };
    let plates = if (needsPlates) { platesByCustomer(state) } else { Map.empty<Types.Id, List.List<Text>>() };
    let matched = List.empty<Types.CustomerListItem>();
    for (customer in state.customers.values()) {
      let count = counts.get(customer.id) ?? 0;
      if (matchesCustomerFilter(customer, count, needle, plates.get(customer.id) ?? List.empty(), filter.hasMotorcycles)) {
        matched.add({
          id = customer.id;
          name = customer.name;
          phone = customer.phone;
          email = customer.email;
          document = customer.document;
          address = customer.address;
          createdAt = customer.createdAt;
          motorcycleCount = count;
        });
      };
    };
    let ascending = matched.toArray().sort(func (a, b) = compareCustomerItems(a, b, sort));
    let sorted = if (descending) { ascending.reverse() } else { ascending };
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    {
      items = sorted.sliceToArray(start, end);
      total;
      offset;
      limit;
    }
  };

  // Página de motocicletas con los datos del cliente dueño incluidos en la
  // misma respuesta. Un solo recorrido de los clientes construye el índice por
  // id; el filtro, el ordenamiento y el corte se resuelven en memoria.
  public func listMotorcyclesPage(state : State, filter : Types.MotorcycleFilter, sort : Types.MotorcycleSort, offset : Nat, limit : Nat) : Types.MotorcyclePage {
    listMotorcyclesPageDir(state, filter, sort, false, offset, limit);
  };

  // Igual que listMotorcyclesPage pero con dirección de orden resuelta en el
  // backend: se ordena ascendente y, si descending es true, se invierte el
  // arreglo completo ANTES de cortar offset/limit, de modo que la página
  // contiene el verdadero top-N en la dirección pedida y total no cambia.
  public func listMotorcyclesPageDir(state : State, filter : Types.MotorcycleFilter, sort : Types.MotorcycleSort, descending : Bool, offset : Nat, limit : Nat) : Types.MotorcyclePage {
    let owners = customersById(state);
    let needle = switch (filter.search) {
      case null { null };
      case (?term) { ?term.toLower() };
    };
    let matched = List.empty<Types.MotorcycleListItem>();
    for (moto in state.motorcycles.values()) {
      let owner = owners.get(moto.customerId);
      if (matchesMotorcycleFilter(moto, owner, needle, filter.brand)) {
        matched.add({
          id = moto.id;
          customerId = moto.customerId;
          plate = moto.plate;
          brand = moto.brand;
          model = moto.model;
          year = moto.year;
          mileage = moto.mileage;
          createdAt = moto.createdAt;
          customerName = switch (owner) { case (?c) { c.name }; case null { "" } };
          customerPhone = switch (owner) { case (?c) { c.phone }; case null { "" } };
        });
      };
    };
    let ascending = matched.toArray().sort(func (a, b) = compareMotorcycleItems(a, b, sort));
    let sorted = if (descending) { ascending.reverse() } else { ascending };
    let total = sorted.size();
    let start = if (offset > total) { total } else { offset };
    let end = Nat.min(start + limit, total);
    {
      items = sorted.sliceToArray(start, end);
      total;
      offset;
      limit;
    }
  };

  // Exportación agregada: un solo recorrido de las motos construye las motos
  // por cliente y luego cada cliente se mapea a su fila. Sin fan-out por cliente.
  public func exportCustomersAggregated(state : State) : [Types.CustomerExportRow] {
    let motosByCustomer = Map.empty<Types.Id, List.List<Types.Motorcycle>>();
    for (moto in state.motorcycles.values()) {
      let current = motosByCustomer.get(moto.customerId) ?? List.empty<Types.Motorcycle>();
      current.add(moto);
      motosByCustomer.add(moto.customerId, current);
    };
    let out = List.empty<Types.CustomerExportRow>();
    for (customer in state.customers.values()) {
      let motos = motosByCustomer.get(customer.id) ?? List.empty<Types.Motorcycle>();
      out.add({
        customer;
        motorcycles = motos.toArray().sort(func (a, b) = Nat.compare(a.id, b.id));
      });
    };
    out.toArray().sort(func (a, b) = Text.compare(a.customer.name.toLower(), b.customer.name.toLower()));
  };

  public func createMotorcycle(state : State, input : Types.MotorcycleInput) : Types.Motorcycle {
    ignore findCustomer(state, input.customerId);
    let id = state.counters.nextMotorcycleId;
    state.counters.nextMotorcycleId := id + 1;
    let moto : Types.Motorcycle = {
      id;
      customerId = input.customerId;
      plate = input.plate;
      brand = input.brand;
      model = input.model;
      year = input.year;
      mileage = input.mileage;
      createdAt = Time.now();
    };
    state.motorcycles.add(id, moto);
    moto;
  };

  public func updateMotorcycle(state : State, id : Types.Id, input : Types.MotorcycleInput) : Types.Motorcycle {
    let existing = findMotorcycle(state, id);
    ignore findCustomer(state, input.customerId);
    let updated : Types.Motorcycle = {
      id = existing.id;
      customerId = input.customerId;
      plate = input.plate;
      brand = input.brand;
      model = input.model;
      year = input.year;
      mileage = input.mileage;
      createdAt = existing.createdAt;
    };
    state.motorcycles.add(id, updated);
    updated;
  };

  public func bulkCreateCustomers(state : State, inputs : [Types.CustomerInput]) : Types.BulkResult {
    let rows = List.empty<Types.BulkRowResult>();
    var created = 0;
    var skipped = 0;
    let failed = 0;
    var index = 0;
    for (input in inputs.values()) {
      if (input.name == "") {
        skipped += 1;
        rows.add({ index; ok = false; id = null; error = ?"Nombre requerido" });
      } else {
        let id = state.counters.nextCustomerId;
        state.counters.nextCustomerId := id + 1;
        let customer : Types.Customer = {
          id;
          name = input.name;
          phone = input.phone;
          email = input.email;
          document = input.document;
          address = input.address;
          createdAt = Time.now();
        };
        state.customers.add(id, customer);
        created += 1;
        rows.add({ index; ok = true; id = ?id; error = null });
      };
      index += 1;
    };
    { created; updated = 0; skipped; failed; rows = rows.toArray() };
  };

  public func bulkUpdateCustomers(state : State, updates : [(Types.Id, Types.CustomerInput)]) : Types.BulkResult {
    let rows = List.empty<Types.BulkRowResult>();
    var updated = 0;
    var skipped = 0;
    var failed = 0;
    var index = 0;
    for ((id, input) in updates.values()) {
      switch (state.customers.get(id)) {
        case null {
          failed += 1;
          rows.add({ index; ok = false; id = ?id; error = ?"Cliente no encontrado" });
        };
        case (?existing) {
          if (input.name == "") {
            skipped += 1;
            rows.add({ index; ok = false; id = ?id; error = ?"Nombre requerido" });
          } else {
            let customer : Types.Customer = {
              id = existing.id;
              name = input.name;
              phone = input.phone;
              email = input.email;
              document = input.document;
              address = input.address;
              createdAt = existing.createdAt;
            };
            state.customers.add(id, customer);
            updated += 1;
            rows.add({ index; ok = true; id = ?id; error = null });
          };
        };
      };
      index += 1;
    };
    { created = 0; updated; skipped; failed; rows = rows.toArray() };
  };
};
