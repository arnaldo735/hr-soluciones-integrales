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
import CashTypes "../types/cash";
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
  cashRegisters : Map.Map<Common.Id, CashTypes.CashRegister>,
  shifts : Map.Map<Common.Id, CashTypes.Shift>,
  cashMovements : Map.Map<Common.Id, CashTypes.CashMovement>,
) {
  func billingState() : BillingLib.State = { invoices; businessSettings; company; cashRegisters; shifts; cashMovements; counters };

  func requireBillingModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "billing")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de facturación");
    };
  };

  public query ({ caller }) func getBusinessSettings(token : ?Text) : async Types.BusinessSettings {
    requireBillingModule(caller, token);
    BillingLib.getBusinessSettings(billingState());
  };

  public shared ({ caller }) func updateBusinessSettings(token : ?Text, settings : Types.BusinessSettings) : async Types.BusinessSettings {
    requireBillingModule(caller, token);
    BillingLib.updateBusinessSettings(billingState(), settings);
  };

  // Genera una factura desde una orden de taller. Solo las órdenes entregadas
  // son facturables. El anticipo registrado en la orden se descuenta del total
  // y queda en `advanceApplied`; el saldo a cobrar es `total - advanceApplied`.
  // En una factura a crédito, el plan de cuotas se calcula sobre el saldo a
  // cobrar, no sobre el total. `creditPlan` es obligatorio cuando la condición
  // de pago es a crédito.
  public shared ({ caller }) func createInvoiceFromOrder(token : ?Text, orderId : Types.Id, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingModule(caller, token);
    BillingLib.createInvoiceFromOrder(billingState(), orders, customers, orderId, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public shared ({ caller }) func createInvoiceFromQuote(token : ?Text, quoteId : Types.Id, customerId : Types.Id, lines : [Types.InvoiceLine], discount : Types.Money, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingModule(caller, token);
    BillingLib.createInvoiceFromQuote(billingState(), customers, quoteId, customerId, lines, discount, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public shared ({ caller }) func createInvoiceFromPosSale(token : ?Text, posSaleId : Types.Id, customerId : ?Types.Id, customerName : ?Text, lines : [Types.InvoiceLine], discount : Types.Money, paymentMethod : Types.PaymentMethod, paymentCondition : Types.PaymentCondition, creditPlan : ?Types.CreditPlanInput) : async Types.Invoice {
    requireBillingModule(caller, token);
    BillingLib.createInvoiceFromPosSale(billingState(), posSales, customers, posSaleId, customerId, customerName, lines, discount, paymentMethod, paymentCondition, creditPlan, caller);
  };

  public query ({ caller }) func listInvoices(token : ?Text, filter : Types.InvoiceFilter, offset : Nat, limit : Nat) : async Types.InvoicePage {
    requireBillingModule(caller, token);
    BillingLib.listInvoices(billingState(), filter, offset, limit);
  };

  public query ({ caller }) func getInvoice(token : ?Text, id : Types.Id) : async ?Types.Invoice {
    requireBillingModule(caller, token);
    BillingLib.getInvoice(billingState(), id);
  };

  // Elimina una factura pendiente sin abonos. Falla si la factura ya tiene
  // pagos o abonos registrados.
  public shared ({ caller }) func deleteInvoice(token : ?Text, id : Types.Id) : async Bool {
    requireBillingModule(caller, token);
    BillingLib.deleteInvoice(billingState(), posSales, receivablePayments, id, caller);
  };

  public shared ({ caller }) func markInvoicePaid(token : ?Text, id : Types.Id, paymentMethod : Types.PaymentMethod) : async Types.Invoice {
    requireBillingModule(caller, token);
    BillingLib.markInvoicePaid(billingState(), id, paymentMethod, caller);
  };

  // Registra el pago de una cuota individual de una factura a crédito. La
  // factura pasa a pagada al completar todas las cuotas.
  public shared ({ caller }) func registerInstallmentPayment(token : ?Text, id : Types.Id, installmentNumber : Nat) : async Types.Invoice {
    requireBillingModule(caller, token);
    BillingLib.registerInstallmentPayment(billingState(), id, installmentNumber, caller);
  };
};
