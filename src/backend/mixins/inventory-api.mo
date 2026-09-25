import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Types "../types/inventory";
import InventoryLib "../lib/inventory";

mixin (
  accessControlState : AccessControl.AccessControlState,
  parts : Map.Map<Types.Id, Types.Part>,
  lots : Map.Map<Types.Id, Types.Lot>,
  movements : Map.Map<Types.Id, Types.Movement>,
  counters : {
    var nextPartId : Nat;
    var nextLotId : Nat;
    var nextMovementId : Nat;
  },
) {
  func inventoryState() : InventoryLib.State = { parts; lots; movements; counters };

  func inventoryIncludeCost(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func listParts(filter : Types.PartFilter, sort : Types.PartSort, offset : Nat, limit : Nat) : async Types.PartPage {
    InventoryLib.listParts(inventoryState(), filter, sort, offset, limit, inventoryIncludeCost(caller));
  };

  public query ({ caller }) func listPartsDir(filter : Types.PartFilter, sort : Types.PartSort, descending : Bool, offset : Nat, limit : Nat) : async Types.PartPage {
    InventoryLib.listPartsDir(inventoryState(), filter, sort, descending, offset, limit, inventoryIncludeCost(caller));
  };

  public query ({ caller }) func getPart(id : Types.Id) : async ?Types.PartView {
    InventoryLib.getPart(inventoryState(), id, inventoryIncludeCost(caller));
  };

  public query func listPartFacets() : async Types.PartFacets {
    InventoryLib.listPartFacets(inventoryState());
  };

  public shared func createPart(input : Types.PartInput) : async Types.PartView {
    InventoryLib.createPart(inventoryState(), input);
  };

  public shared func updatePart(id : Types.Id, input : Types.PartInput) : async Types.PartView {
    InventoryLib.updatePart(inventoryState(), id, input);
  };

  public query func listLots(partId : Types.Id) : async [Types.Lot] {
    InventoryLib.listLots(inventoryState(), partId);
  };

  public query func listMovements(partId : Types.Id) : async [Types.Movement] {
    InventoryLib.listMovements(inventoryState(), partId);
  };

  public shared ({ caller }) func adjustStock(input : Types.AdjustmentInput) : async Types.Movement {
    InventoryLib.adjustStock(inventoryState(), input, caller);
  };

  public query ({ caller }) func lowStockParts() : async [Types.PartView] {
    InventoryLib.lowStockParts(inventoryState(), inventoryIncludeCost(caller));
  };

  public shared func bulkCreateParts(inputs : [Types.PartInput]) : async Types.BulkResult {
    InventoryLib.bulkCreateParts(inventoryState(), inputs);
  };

  public shared func bulkUpdateParts(updates : [(Types.Id, Types.PartInput)]) : async Types.BulkResult {
    InventoryLib.bulkUpdateParts(inventoryState(), updates);
  };

  public query func exportInventoryCsv() : async [Types.InventoryCsvRow] {
    InventoryLib.exportInventoryCsv(inventoryState());
  };

  public shared func importInventoryCsv(rows : [Types.InventoryImportRow]) : async Types.InventoryImportResult {
    InventoryLib.importInventoryCsv(inventoryState(), rows);
  };

  public shared ({ caller }) func zeroInventory() : async Types.ZeroInventoryResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("notAuthorized");
    };
    InventoryLib.zeroInventory(inventoryState(), caller);
  };
};
