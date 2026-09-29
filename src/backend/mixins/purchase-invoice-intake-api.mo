import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/purchase-invoice-intake";
import UserTypes "../types/users";
import InventoryTypes "../types/inventory";
import PurchasingTypes "../types/purchasing";
import PurchaseInvoiceIntakeLib "../lib/purchase-invoice-intake";
import UsersLib "../lib/users";

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
  credentials : Map.Map<Types.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Types.Id, UserTypes.Role>,
) {
  func purchaseInvoiceIntakeState() : PurchaseInvoiceIntakeLib.State = {
    invoices = purchaseInvoices;
    parts;
    lots;
    movements;
    suppliers;
    counters;
  };

  func requirePurchaseInvoiceModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "purchaseInvoices")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de facturas de compra");
    };
  };

  // Callback de transformación del outcall que descarga el archivo de la
  // factura. Debe declararse en el actor (una función `shared` no puede vivir
  // en un módulo), por eso el mixin la aporta y la pasa a la librería.
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createPurchaseInvoiceDraft(token : ?Text, input : Types.CreateInvoiceInput) : async Types.PurchaseInvoice {
    requirePurchaseInvoiceModule(caller, token);
    PurchaseInvoiceIntakeLib.createDraft(purchaseInvoiceIntakeState(), input);
  };

  public shared ({ caller }) func runPurchaseInvoiceExtraction(token : ?Text, invoiceId : Types.Id) : async Types.PurchaseInvoice {
    requirePurchaseInvoiceModule(caller, token);
    await* PurchaseInvoiceIntakeLib.runExtraction<system>(purchaseInvoiceIntakeState(), invoiceId, transform);
  };

  public shared ({ caller }) func updatePurchaseInvoiceReview(token : ?Text, invoiceId : Types.Id, input : Types.InvoiceReviewInput) : async Types.PurchaseInvoice {
    requirePurchaseInvoiceModule(caller, token);
    PurchaseInvoiceIntakeLib.updateReview(purchaseInvoiceIntakeState(), invoiceId, input);
  };

  public shared ({ caller }) func confirmPurchaseInvoice(token : ?Text, invoiceId : Types.Id) : async Types.InvoiceApplyResult {
    requirePurchaseInvoiceModule(caller, token);
    PurchaseInvoiceIntakeLib.confirmInvoice(purchaseInvoiceIntakeState(), invoiceId, caller);
  };

  public query ({ caller }) func listPurchaseInvoices(token : ?Text, filter : Types.InvoiceFilter, sort : Types.InvoiceSort, offset : Nat, limit : Nat) : async Types.InvoicePage {
    requirePurchaseInvoiceModule(caller, token);
    PurchaseInvoiceIntakeLib.listInvoices(purchaseInvoiceIntakeState(), filter, sort, offset, limit);
  };

  public query ({ caller }) func getPurchaseInvoice(token : ?Text, invoiceId : Types.Id) : async ?Types.PurchaseInvoice {
    requirePurchaseInvoiceModule(caller, token);
    PurchaseInvoiceIntakeLib.getInvoice(purchaseInvoiceIntakeState(), invoiceId);
  };
};
