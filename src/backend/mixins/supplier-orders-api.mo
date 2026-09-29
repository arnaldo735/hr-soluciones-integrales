import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/supplier-orders";
import UserTypes "../types/users";
import PurchasingTypes "../types/purchasing";
import SupplierOrdersLib "../lib/supplier-orders";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>,
  supplierOrders : Map.Map<Common.Id, Types.SupplierOrder>,
  counters : SupplierOrdersLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireSupplierOrdersModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "supplierOrders")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de pedidos a proveedor");
    };
  };

  func supplierOrdersState() : SupplierOrdersLib.State = { suppliers; supplierOrders; counters };

  public query ({ caller }) func listSupplierOrders(token : ?Text, filter : Types.SupplierOrderFilter) : async [Types.SupplierOrder] {
    requireSupplierOrdersModule(caller, token);
    SupplierOrdersLib.listSupplierOrders(supplierOrdersState(), filter);
  };

  public shared ({ caller }) func createSupplierOrder(token : ?Text, input : Types.SupplierOrderInput) : async Types.SupplierOrder {
    requireSupplierOrdersModule(caller, token);
    SupplierOrdersLib.createSupplierOrder(supplierOrdersState(), input, caller);
  };
};
