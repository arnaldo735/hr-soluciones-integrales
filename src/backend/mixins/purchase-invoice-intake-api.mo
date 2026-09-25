import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/purchase-invoice-intake";
import InventoryTypes "../types/inventory";
import PurchasingTypes "../types/purchasing";
import PurchaseInvoiceIntakeLib "../lib/purchase-invoice-intake";

mixin (
  accessControlState : AccessControl.AccessControlState,
  purchaseInvoices : Map.Map<Types.Id, Types.PurchaseInvoice>,
  parts : Map.Map<InventoryTypes.Id, InventoryTypes.Part>,
  lots : Map.Map<InventoryTypes.Id, InventoryTypes.Lot>,
  movements : Map.Map<InventoryTypes.Id, InventoryTypes.Movement>,
  suppliers : Map.Map<PurchasingTypes.Id, PurchasingTypes.Supplier>,
  counters : {
    var nextPurchaseInvoiceId : Nat;
    var nextPurchaseInvoiceLineId : Nat;
    var nextPartId : Nat;
    var nextLotId : Nat;
    var nextMovementId : Nat;
  },
) {
  func purchaseInvoiceIntakeState() : PurchaseInvoiceIntakeLib.State = {
    invoices = purchaseInvoices;
    parts;
    lots;
    movements;
    suppliers;
    counters;
  };

  func requirePurchaseInvoiceAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage purchase invoices");
    };
  };

  // Callback de transformación del outcall que descarga el archivo de la
  // factura. Debe declararse en el actor (una función `shared` no puede vivir
  // en un módulo), por eso el mixin la aporta y la pasa a la librería.
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createPurchaseInvoiceDraft(input : Types.CreateInvoiceInput) : async Types.PurchaseInvoice {
    requirePurchaseInvoiceAdmin(caller);
    PurchaseInvoiceIntakeLib.createDraft(purchaseInvoiceIntakeState(), input);
  };

  public shared ({ caller }) func runPurchaseInvoiceExtraction(invoiceId : Types.Id) : async Types.PurchaseInvoice {
    requirePurchaseInvoiceAdmin(caller);
    await* PurchaseInvoiceIntakeLib.runExtraction<system>(purchaseInvoiceIntakeState(), invoiceId, transform);
  };

  public shared ({ caller }) func updatePurchaseInvoiceReview(invoiceId : Types.Id, input : Types.InvoiceReviewInput) : async Types.PurchaseInvoice {
    requirePurchaseInvoiceAdmin(caller);
    PurchaseInvoiceIntakeLib.updateReview(purchaseInvoiceIntakeState(), invoiceId, input);
  };

  public shared ({ caller }) func confirmPurchaseInvoice(invoiceId : Types.Id) : async Types.InvoiceApplyResult {
    requirePurchaseInvoiceAdmin(caller);
    PurchaseInvoiceIntakeLib.confirmInvoice(purchaseInvoiceIntakeState(), invoiceId, caller);
  };

  public query ({ caller }) func listPurchaseInvoices(filter : Types.InvoiceFilter, sort : Types.InvoiceSort, offset : Nat, limit : Nat) : async Types.InvoicePage {
    requirePurchaseInvoiceAdmin(caller);
    PurchaseInvoiceIntakeLib.listInvoices(purchaseInvoiceIntakeState(), filter, sort, offset, limit);
  };

  public query ({ caller }) func getPurchaseInvoice(invoiceId : Types.Id) : async ?Types.PurchaseInvoice {
    requirePurchaseInvoiceAdmin(caller);
    PurchaseInvoiceIntakeLib.getInvoice(purchaseInvoiceIntakeState(), invoiceId);
  };
};
