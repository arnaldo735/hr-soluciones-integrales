import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/inventory";
import UserTypes "../types/users";
import InventoryLib "../lib/inventory";
import UsersLib "../lib/users";

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
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func inventoryState() : InventoryLib.State = { parts; lots; movements; counters };

  func requireInventoryModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "inventory")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de inventario");
    };
  };

  func inventoryIncludeCost(caller : Principal) : Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func listParts(token : ?Text, filter : Types.PartFilter, sort : Types.PartSort, offset : Nat, limit : Nat) : async Types.PartPage {
    requireInventoryModule(caller, token);
    InventoryLib.listParts(inventoryState(), filter, sort, offset, limit, inventoryIncludeCost(caller));
  };

  public query ({ caller }) func listPartsDir(token : ?Text, filter : Types.PartFilter, sort : Types.PartSort, descending : Bool, offset : Nat, limit : Nat) : async Types.PartPage {
    requireInventoryModule(caller, token);
    InventoryLib.listPartsDir(inventoryState(), filter, sort, descending, offset, limit, inventoryIncludeCost(caller));
  };

  public query ({ caller }) func getPart(token : ?Text, id : Types.Id) : async ?Types.PartView {
    requireInventoryModule(caller, token);
    InventoryLib.getPart(inventoryState(), id, inventoryIncludeCost(caller));
  };

  /// Busca un repuesto por **código de barras o SKU**. La comparación ignora
  /// mayúsculas y espacios externos; el código de barras tiene prioridad sobre
  /// el SKU. Devuelve `#found` con la vista del repuesto o `#notFound` cuando
  /// el código está vacío o no coincide con ningún repuesto. Es la vía que usa
  /// el lector de códigos de barras del POS y de los demás formatos.
  public query ({ caller }) func findPartByCode(token : ?Text, code : Text) : async Types.PartLookupResult {
    requireInventoryModule(caller, token);
    InventoryLib.findPartByCode(inventoryState(), code, inventoryIncludeCost(caller));
  };

  public query ({ caller }) func listPartFacets(token : ?Text) : async Types.PartFacets {
    requireInventoryModule(caller, token);
    InventoryLib.listPartFacets(inventoryState());
  };

  public shared ({ caller }) func createPart(token : ?Text, input : Types.PartInput) : async Types.PartView {
    requireInventoryModule(caller, token);
    InventoryLib.createPart(inventoryState(), input);
  };

  public shared ({ caller }) func updatePart(token : ?Text, id : Types.Id, input : Types.PartInput) : async Types.PartView {
    requireInventoryModule(caller, token);
    InventoryLib.updatePart(inventoryState(), id, input);
  };

  public query ({ caller }) func listLots(token : ?Text, partId : Types.Id) : async [Types.Lot] {
    requireInventoryModule(caller, token);
    InventoryLib.listLots(inventoryState(), partId);
  };

  public query ({ caller }) func listMovements(token : ?Text, partId : Types.Id) : async [Types.Movement] {
    requireInventoryModule(caller, token);
    InventoryLib.listMovements(inventoryState(), partId);
  };

  public shared ({ caller }) func adjustStock(token : ?Text, input : Types.AdjustmentInput) : async Types.Movement {
    requireInventoryModule(caller, token);
    InventoryLib.adjustStock(inventoryState(), input, caller);
  };

  public query ({ caller }) func lowStockParts(token : ?Text) : async [Types.PartView] {
    requireInventoryModule(caller, token);
    InventoryLib.lowStockParts(inventoryState(), inventoryIncludeCost(caller));
  };

  public shared ({ caller }) func bulkCreateParts(token : ?Text, inputs : [Types.PartInput]) : async Types.BulkResult {
    requireInventoryModule(caller, token);
    InventoryLib.bulkCreateParts(inventoryState(), inputs);
  };

  public shared ({ caller }) func bulkUpdateParts(token : ?Text, updates : [(Types.Id, Types.PartInput)]) : async Types.BulkResult {
    requireInventoryModule(caller, token);
    InventoryLib.bulkUpdateParts(inventoryState(), updates);
  };

  public query ({ caller }) func exportInventoryCsv(token : ?Text) : async [Types.InventoryCsvRow] {
    requireInventoryModule(caller, token);
    InventoryLib.exportInventoryCsv(inventoryState());
  };

  public shared ({ caller }) func importInventoryCsv(token : ?Text, rows : [Types.InventoryImportRow]) : async Types.InventoryImportResult {
    requireInventoryModule(caller, token);
    InventoryLib.importInventoryCsv(inventoryState(), rows);
  };

  public shared ({ caller }) func zeroInventory(token : ?Text) : async Types.ZeroInventoryResult {
    requireInventoryModule(caller, token);
    InventoryLib.zeroInventory(inventoryState(), caller);
  };
};
