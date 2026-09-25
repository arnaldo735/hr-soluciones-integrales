import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/quotes";
import CustomerTypes "../types/customers";
import WorkshopTypes "../types/workshop";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import ServiceTypes "../types/services";
import InventoryTypes "../types/inventory";
import QuotesLib "../lib/quotes";

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
) {
  func quotesState() : QuotesLib.State = { quotes; customers; motorcycles; parts; services; orders; invoices; businessSettings; company; counters };

  public query func listQuotes(filter : Types.QuoteFilter, sort : Types.QuoteSort, offset : Nat, limit : Nat) : async Types.QuotePage {
    ignore (filter, sort, offset, limit);
    QuotesLib.listQuotes(quotesState(), filter, sort, offset, limit);
  };

  public query func getQuote(id : Types.Id) : async ?Types.QuoteView {
    ignore id;
    QuotesLib.getQuote(quotesState(), id);
  };

  public shared ({ caller }) func createQuote(input : Types.QuoteInput) : async Types.QuoteView {
    ignore input;
    QuotesLib.createQuote(quotesState(), input, caller);
  };

  public shared ({ caller }) func updateQuote(id : Types.Id, input : Types.QuoteInput) : async Types.QuoteView {
    ignore (id, input);
    QuotesLib.updateQuote(quotesState(), id, input, caller);
  };

  public shared ({ caller }) func deleteQuote(id : Types.Id) : async Bool {
    ignore id;
    QuotesLib.deleteQuote(quotesState(), id, caller);
  };

  public shared ({ caller }) func updateQuoteStatus(id : Types.Id, status : Types.QuoteStatus) : async Types.QuoteView {
    ignore (id, status);
    QuotesLib.updateQuoteStatus(quotesState(), id, status, caller);
  };

  public shared ({ caller }) func convertQuoteToOrder(id : Types.Id) : async WorkshopTypes.OrderView {
    ignore id;
    QuotesLib.convertQuoteToOrder(quotesState(), id, caller);
  };

  public shared ({ caller }) func convertQuoteToInvoice(id : Types.Id, paymentMethod : BillingTypes.PaymentMethod) : async BillingTypes.Invoice {
    ignore (id, paymentMethod);
    QuotesLib.convertQuoteToInvoice(quotesState(), id, paymentMethod, caller);
  };
};
