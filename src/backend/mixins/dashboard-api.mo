import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/dashboard";
import InventoryTypes "../types/inventory";
import WorkshopTypes "../types/workshop";
import PurchasingTypes "../types/purchasing";
import DashboardLib "../lib/dashboard";

mixin (
  accessControlState : AccessControl.AccessControlState,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  lots : Map.Map<Common.Id, InventoryTypes.Lot>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  purchases : Map.Map<Common.Id, PurchasingTypes.Purchase>,
  payments : Map.Map<Common.Id, PurchasingTypes.Payment>,
) {
  public query ({ caller }) func getDashboardSummary() : async Types.DashboardSummary {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    DashboardLib.getDashboardSummary({ parts; lots; orders; purchases; payments });
  };
};
