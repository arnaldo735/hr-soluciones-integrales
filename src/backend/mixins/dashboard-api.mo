import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/dashboard";
import UserTypes "../types/users";
import InventoryTypes "../types/inventory";
import WorkshopTypes "../types/workshop";
import PurchasingTypes "../types/purchasing";
import DashboardLib "../lib/dashboard";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  lots : Map.Map<Common.Id, InventoryTypes.Lot>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  purchases : Map.Map<Common.Id, PurchasingTypes.Purchase>,
  payments : Map.Map<Common.Id, PurchasingTypes.Payment>,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireDashboardModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "dashboard")) {
      Runtime.trap("Unauthorized: no tiene acceso al panel de resumen");
    };
  };

  public query ({ caller }) func getDashboardSummary(token : ?Text) : async Types.DashboardSummary {
    requireDashboardModule(caller, token);
    DashboardLib.getDashboardSummary({ parts; lots; orders; purchases; payments });
  };
};
