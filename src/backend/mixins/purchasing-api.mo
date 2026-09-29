import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/purchasing";
import UserTypes "../types/users";
import InventoryTypes "../types/inventory";
import PurchasingLib "../lib/purchasing";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  suppliers : Map.Map<Types.Id, Types.Supplier>,
  purchases : Map.Map<Types.Id, Types.Purchase>,
  payments : Map.Map<Types.Id, Types.Payment>,
  lots : Map.Map<Types.Id, InventoryTypes.Lot>,
  movements : Map.Map<Types.Id, InventoryTypes.Movement>,
  counters : {
    var nextSupplierId : Nat;
    var nextPurchaseId : Nat;
    var nextPurchaseItemId : Nat;
    var nextPaymentId : Nat;
    var nextLotId : Nat;
    var nextMovementId : Nat;
  },
  credentials : Map.Map<Types.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Types.Id, UserTypes.Role>,
) {
  func requirePurchasingModule(caller : Principal, token : ?Text, moduleKey : Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, moduleKey)) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo solicitado");
    };
  };

  func domainState() : PurchasingLib.State = {
    suppliers;
    purchases;
    payments;
    lots;
    movements;
    counters;
  };

  public query ({ caller }) func listSuppliers(token : ?Text, search : ?Text) : async [Types.Supplier] {
    requirePurchasingModule(caller, token, "suppliers");
    PurchasingLib.listSuppliers(domainState(), search);
  };

  public query ({ caller }) func getSupplier(token : ?Text, id : Types.Id) : async ?Types.Supplier {
    requirePurchasingModule(caller, token, "suppliers");
    PurchasingLib.getSupplier(domainState(), id);
  };

  public shared ({ caller }) func createSupplier(token : ?Text, input : Types.SupplierInput) : async Types.Supplier {
    requirePurchasingModule(caller, token, "suppliers");
    PurchasingLib.createSupplier(domainState(), input);
  };

  public shared ({ caller }) func updateSupplier(token : ?Text, id : Types.Id, input : Types.SupplierInput) : async Types.Supplier {
    requirePurchasingModule(caller, token, "suppliers");
    PurchasingLib.updateSupplier(domainState(), id, input);
  };

  public query ({ caller }) func listPurchases(token : ?Text, supplierId : ?Types.Id) : async [Types.Purchase] {
    requirePurchasingModule(caller, token, "purchases");
    PurchasingLib.listPurchases(domainState(), supplierId);
  };

  public shared ({ caller }) func createPurchase(token : ?Text, input : Types.PurchaseInput) : async Types.Purchase {
    requirePurchasingModule(caller, token, "purchases");
    PurchasingLib.createPurchase(domainState(), input, caller);
  };

  // Elimina una compra no aceptada y revierte sus lotes y movimientos de
  // inventario. Falla si la compra ya fue aceptada, tiene pagos o ya afectó
  // inventario.
  public shared ({ caller }) func deletePurchase(token : ?Text, id : Types.Id) : async Bool {
    requirePurchasingModule(caller, token, "purchases");
    PurchasingLib.deletePurchase(domainState(), id, caller);
  };

  public query ({ caller }) func listPayments(token : ?Text, supplierId : ?Types.Id) : async [Types.Payment] {
    requirePurchasingModule(caller, token, "purchases");
    PurchasingLib.listPayments(domainState(), supplierId);
  };

  public shared ({ caller }) func registerPayment(token : ?Text, input : Types.PaymentInput) : async Types.Payment {
    requirePurchasingModule(caller, token, "purchases");
    PurchasingLib.registerPayment(domainState(), input, caller);
  };

  public query ({ caller }) func listPayables(token : ?Text) : async [Types.Payable] {
    requirePurchasingModule(caller, token, "payables");
    PurchasingLib.listPayables(domainState());
  };

  public query ({ caller }) func getPayable(token : ?Text, supplierId : Types.Id) : async ?Types.Payable {
    requirePurchasingModule(caller, token, "payables");
    PurchasingLib.getPayable(domainState(), supplierId);
  };
};
