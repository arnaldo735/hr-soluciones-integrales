import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/billing";
import CustomerTypes "../types/customers";
import CompanyTypes "../types/company";
import UserTypes "../types/users";
import WorkshopTypes "../types/workshop";
import PosTypes "../types/pos";
import ReceivableTypes "../types/receivables";
import BillingLib "../lib/billing";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  invoices : Map.Map<Common.Id, Types.Invoice>,
  businessSettings : { var settings : Types.BusinessSettings },
  counters : BillingLib.Counters,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  company : { var profile : CompanyTypes.CompanyProfile },
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
  posSales : Map.Map<Common.Id, PosTypes.PosSale>,
  receivablePayments : Map.Map<Common.Id, ReceivableTypes.ReceivablePayment>,
) {
  func billingState() : BillingLib.State {
    { invoices; businessSettings; company; counters };
  };

  func requireBillingModule(caller : Principal, token : ?Text, moduleKey : Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, moduleKey)) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo solicitado");
    };
  };

  public query ({ caller }) func getBusinessSettings(token : ?Text) : async Types.BusinessSettings {
    requireBillingModule(caller, token, "settings");
    BillingLib.getBusinessSettings(billingState());
  };

  public shared ({ caller }) func updateBusinessSettings(token : ?Text, settings : Types.BusinessSettings) : async Types.BusinessSettings {
    requireBillingModule(caller, token, "settings");
    BillingLib.updateBusinessSettings(billingState(), settings);
  };

  // Genera una factura desde una orden de taller. Solo las órdenes entregadas
  // son facturables. `creditPlan` es obligatorio cuando la condición de pago
  // es a crédito.
  public shared ({ caller }) func createInvoiceFromOrder(token : ?Text, orderId : Types.Id, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingModule(caller, token, "billing");
    BillingLib.createInvoiceFromOrder(billingState(), orders, customers, orderId, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public shared ({ caller }) func createInvoiceFromQuote(token : ?Text, quoteId : Types.Id, customerId : Types.Id, lines : [Types.InvoiceLine], discount : Types.Money, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingModule(caller, token, "billing");
    BillingLib.createInvoiceFromQuote(billingState(), customers, quoteId, customerId, lines, discount, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public shared ({ caller }) func createInvoiceFromPosSale(token : ?Text, posSaleId : Types.Id, customerId : ?Types.Id, customerName : ?Text, lines : [Types.InvoiceLine], discount : Types.Money, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingModule(caller, token, "billing");
    BillingLib.createInvoiceFromPosSale(billingState(), posSales, customers, posSaleId, customerId, customerName, lines, discount, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public query ({ caller }) func listInvoices(token : ?Text, filter : Types.InvoiceFilter, offset : Nat, limit : Nat) : async Types.InvoicePage {
    requireBillingModule(caller, token, "billing");
    BillingLib.listInvoices(billingState(), filter, offset, limit);
  };

  public query ({ caller }) func getInvoice(token : ?Text, id : Types.Id) : async ?Types.Invoice {
    requireBillingModule(caller, token, "billing");
    BillingLib.getInvoice(billingState(), id);
  };

  // Elimina una factura pendiente sin abonos. Falla si la factura ya tiene
  // pagos o abonos registrados.
  public shared ({ caller }) func deleteInvoice(token : ?Text, id : Types.Id) : async Bool {
    requireBillingModule(caller, token, "billing");
    BillingLib.deleteInvoice(billingState(), posSales, receivablePayments, id, caller);
  };

  public shared ({ caller }) func markInvoicePaid(token : ?Text, id : Types.Id, paymentMethod : Types.PaymentMethod) : async Types.Invoice {
    requireBillingModule(caller, token, "billing");
    BillingLib.markInvoicePaid(billingState(), id, paymentMethod, caller);
  };

  // Registra el pago de una cuota individual de una factura a crédito. La
  // factura pasa a pagada al completar todas las cuotas.
  public shared ({ caller }) func registerInstallmentPayment(token : ?Text, id : Types.Id, installmentNumber : Nat) : async Types.Invoice {
    requireBillingModule(caller, token, "billing");
    BillingLib.registerInstallmentPayment(billingState(), id, installmentNumber, caller);
  };
};
