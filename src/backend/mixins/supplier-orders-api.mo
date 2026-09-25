import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/supplier-orders";
import PurchasingTypes "../types/purchasing";
import SupplierOrdersLib "../lib/supplier-orders";

mixin (
  accessControlState : AccessControl.AccessControlState,
  suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>,
  supplierOrders : Map.Map<Common.Id, Types.SupplierOrder>,
  counters : SupplierOrdersLib.Counters,
) {
  func requireSupplierOrdersAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage supplier orders");
    };
  };

  func supplierOrdersState() : SupplierOrdersLib.State = { suppliers; supplierOrders; counters };

  public query ({ caller }) func listSupplierOrders(filter : Types.SupplierOrderFilter) : async [Types.SupplierOrder] {
    requireSupplierOrdersAdmin(caller);
    SupplierOrdersLib.listSupplierOrders(supplierOrdersState(), filter);
  };

  public shared ({ caller }) func createSupplierOrder(input : Types.SupplierOrderInput) : async Types.SupplierOrder {
    requireSupplierOrdersAdmin(caller);
    SupplierOrdersLib.createSupplierOrder(supplierOrdersState(), input, caller);
  };
};
