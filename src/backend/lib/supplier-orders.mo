import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/supplier-orders";
import PurchasingTypes "../types/purchasing";
import Search "../lib/search";

module {
  public type Counters = {
    var nextSupplierOrderId : Nat;
  };

  public type State = {
    suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>;
    supplierOrders : Map.Map<Common.Id, Types.SupplierOrder>;
    counters : Counters;
  };

  func matches(haystack : Text, needle : Text) : Bool {
    Search.contains(haystack, needle);
  };

  // Lista los pedidos a proveedor, filtrando por proveedor y por búsqueda en
  // SKU o descripción.
  public func listSupplierOrders(state : State, filter : Types.SupplierOrderFilter) : [Types.SupplierOrder] {
    let all = state.supplierOrders.values().toArray();
    let bySupplier = switch (filter.supplierId) {
      case null { all };
      case (?sid) { all.filter(func o = o.supplierId == sid) };
    };
    let filtered = switch (filter.search) {
      case null { bySupplier };
      case (?term) {
        let trimmed = term.trim(#predicate (func (c : Char) : Bool = c == ' '));
        if (trimmed == "") {
          bySupplier;
        } else {
          bySupplier.filter(func o = matches(o.sku, trimmed) or matches(o.description, trimmed));
        };
      };
    };
    filtered.sort(func (a, b) = Nat.compare(a.id, b.id));
  };

  // Crea un pedido a proveedor con cantidad, SKU y descripción.
  public func createSupplierOrder(state : State, input : Types.SupplierOrderInput, createdBy : Principal) : Types.SupplierOrder {
    if (input.quantity == 0) { Runtime.trap("La cantidad debe ser mayor que cero") };
    ignore state.suppliers.get(input.supplierId) ?? Runtime.trap("Proveedor no encontrado");
    let id = state.counters.nextSupplierOrderId;
    state.counters.nextSupplierOrderId := id + 1;
    let order : Types.SupplierOrder = {
      id;
      supplierId = input.supplierId;
      quantity = input.quantity;
      sku = input.sku;
      description = input.description;
      createdBy;
      createdAt = Time.now();
    };
    state.supplierOrders.add(id, order);
    order;
  };
};
