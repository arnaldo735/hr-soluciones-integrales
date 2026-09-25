import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/billing";
import CustomerTypes "../types/customers";
import CompanyTypes "../types/company";
import WorkshopTypes "../types/workshop";
import BillingLib "../lib/billing";

mixin (
  accessControlState : AccessControl.AccessControlState,
  invoices : Map.Map<Common.Id, Types.Invoice>,
  businessSettings : { var settings : Types.BusinessSettings },
  counters : BillingLib.Counters,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  company : { var profile : CompanyTypes.CompanyProfile },
) {
  func billingState() : BillingLib.State {
    { invoices; businessSettings; company; counters };
  };

  func requireBillingAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query ({ caller }) func getBusinessSettings() : async Types.BusinessSettings {
    requireBillingAdmin(caller);
    BillingLib.getBusinessSettings(billingState());
  };

  public shared ({ caller }) func updateBusinessSettings(settings : Types.BusinessSettings) : async Types.BusinessSettings {
    requireBillingAdmin(caller);
    BillingLib.updateBusinessSettings(billingState(), settings);
  };

  // Genera una factura desde una orden de taller. Solo las órdenes entregadas
  // son facturables. `creditPlan` es obligatorio cuando la condición de pago
  // es a crédito.
  public shared ({ caller }) func createInvoiceFromOrder(orderId : Types.Id, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingAdmin(caller);
    BillingLib.createInvoiceFromOrder(billingState(), orders, customers, orderId, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public shared ({ caller }) func createInvoiceFromQuote(quoteId : Types.Id, customerId : Types.Id, lines : [Types.InvoiceLine], discount : Types.Money, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingAdmin(caller);
    BillingLib.createInvoiceFromQuote(billingState(), customers, quoteId, customerId, lines, discount, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public shared ({ caller }) func createInvoiceFromPosSale(posSaleId : Types.Id, customerId : ?Types.Id, customerName : ?Text, lines : [Types.InvoiceLine], discount : Types.Money, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingAdmin(caller);
    BillingLib.createInvoiceFromPosSale(billingState(), customers, posSaleId, customerId, customerName, lines, discount, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public query ({ caller }) func listInvoices(filter : Types.InvoiceFilter, offset : Nat, limit : Nat) : async Types.InvoicePage {
    requireBillingAdmin(caller);
    BillingLib.listInvoices(billingState(), filter, offset, limit);
  };

  public query ({ caller }) func getInvoice(id : Types.Id) : async ?Types.Invoice {
    requireBillingAdmin(caller);
    BillingLib.getInvoice(billingState(), id);
  };

  public shared ({ caller }) func markInvoicePaid(id : Types.Id, paymentMethod : Types.PaymentMethod) : async Types.Invoice {
    requireBillingAdmin(caller);
    BillingLib.markInvoicePaid(billingState(), id, paymentMethod, caller);
  };

  // Registra el pago de una cuota individual de una factura a crédito. La
  // factura pasa a pagada al completar todas las cuotas.
  public shared ({ caller }) func registerInstallmentPayment(id : Types.Id, installmentNumber : Nat) : async Types.Invoice {
    requireBillingAdmin(caller);
    BillingLib.registerInstallmentPayment(billingState(), id, installmentNumber, caller);
  };
};
