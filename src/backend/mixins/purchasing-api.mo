import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/purchasing";
import InventoryTypes "../types/inventory";
import PurchasingLib "../lib/purchasing";

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
) {
  func requirePurchasingAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage suppliers and purchases");
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

  public query ({ caller }) func listSuppliers(search : ?Text) : async [Types.Supplier] {
    requirePurchasingAdmin(caller);
    PurchasingLib.listSuppliers(domainState(), search);
  };

  public query ({ caller }) func getSupplier(id : Types.Id) : async ?Types.Supplier {
    requirePurchasingAdmin(caller);
    PurchasingLib.getSupplier(domainState(), id);
  };

  public shared ({ caller }) func createSupplier(input : Types.SupplierInput) : async Types.Supplier {
    requirePurchasingAdmin(caller);
    PurchasingLib.createSupplier(domainState(), input);
  };

  public shared ({ caller }) func updateSupplier(id : Types.Id, input : Types.SupplierInput) : async Types.Supplier {
    requirePurchasingAdmin(caller);
    PurchasingLib.updateSupplier(domainState(), id, input);
  };

  public query ({ caller }) func listPurchases(supplierId : ?Types.Id) : async [Types.Purchase] {
    requirePurchasingAdmin(caller);
    PurchasingLib.listPurchases(domainState(), supplierId);
  };

  public shared ({ caller }) func createPurchase(input : Types.PurchaseInput) : async Types.Purchase {
    requirePurchasingAdmin(caller);
    PurchasingLib.createPurchase(domainState(), input, caller);
  };

  public query ({ caller }) func listPayments(supplierId : ?Types.Id) : async [Types.Payment] {
    requirePurchasingAdmin(caller);
    PurchasingLib.listPayments(domainState(), supplierId);
  };

  public shared ({ caller }) func registerPayment(input : Types.PaymentInput) : async Types.Payment {
    requirePurchasingAdmin(caller);
    PurchasingLib.registerPayment(domainState(), input, caller);
  };

  public query ({ caller }) func listPayables() : async [Types.Payable] {
    requirePurchasingAdmin(caller);
    PurchasingLib.listPayables(domainState());
  };

  public query ({ caller }) func getPayable(supplierId : Types.Id) : async ?Types.Payable {
    requirePurchasingAdmin(caller);
    PurchasingLib.getPayable(domainState(), supplierId);
  };
};
