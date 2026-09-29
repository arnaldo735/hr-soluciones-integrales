import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/quotes";
import CustomerTypes "../types/customers";
import WorkshopTypes "../types/workshop";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import ServiceTypes "../types/services";
import InventoryTypes "../types/inventory";
import UserTypes "../types/users";
import QuotesLib "../lib/quotes";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  quotes : Map.Map<Common.Id, Types.Quote>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  businessSettings : { var settings : BillingTypes.BusinessSettings },
  company : { var profile : CompanyTypes.CompanyProfile },
  counters : QuotesLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func quotesState() : QuotesLib.State = { quotes; customers; motorcycles; parts; services; orders; invoices; businessSettings; company; counters };

  func requireQuotesModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "quotes")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de cotizaciones");
    };
  };

  public query ({ caller }) func listQuotes(token : ?Text, filter : Types.QuoteFilter, sort : Types.QuoteSort, offset : Nat, limit : Nat) : async Types.QuotePage {
    requireQuotesModule(caller, token);
    QuotesLib.listQuotes(quotesState(), filter, sort, offset, limit);
  };

  public query ({ caller }) func getQuote(token : ?Text, id : Types.Id) : async ?Types.QuoteView {
    requireQuotesModule(caller, token);
    QuotesLib.getQuote(quotesState(), id);
  };

  public shared ({ caller }) func createQuote(token : ?Text, input : Types.QuoteInput) : async Types.QuoteView {
    requireQuotesModule(caller, token);
    QuotesLib.createQuote(quotesState(), input, caller);
  };

  public shared ({ caller }) func updateQuote(token : ?Text, id : Types.Id, input : Types.QuoteInput) : async Types.QuoteView {
    requireQuotesModule(caller, token);
    QuotesLib.updateQuote(quotesState(), id, input, caller);
  };

  public shared ({ caller }) func deleteQuote(token : ?Text, id : Types.Id) : async Bool {
    requireQuotesModule(caller, token);
    QuotesLib.deleteQuote(quotesState(), id, caller);
  };

  public shared ({ caller }) func updateQuoteStatus(token : ?Text, id : Types.Id, status : Types.QuoteStatus) : async Types.QuoteView {
    requireQuotesModule(caller, token);
    QuotesLib.updateQuoteStatus(quotesState(), id, status, caller);
  };

  public shared ({ caller }) func convertQuoteToOrder(token : ?Text, id : Types.Id) : async WorkshopTypes.OrderView {
    requireQuotesModule(caller, token);
    QuotesLib.convertQuoteToOrder(quotesState(), id, caller);
  };

  public shared ({ caller }) func convertQuoteToInvoice(token : ?Text, id : Types.Id, paymentMethod : BillingTypes.PaymentMethod) : async BillingTypes.Invoice {
    requireQuotesModule(caller, token);
    QuotesLib.convertQuoteToInvoice(quotesState(), id, paymentMethod, caller);
  };
};
