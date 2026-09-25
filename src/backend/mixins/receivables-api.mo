import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/receivables";
import BillingTypes "../types/billing";
import ReceivablesLib "../lib/receivables";

mixin (
  accessControlState : AccessControl.AccessControlState,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  receivablePayments : Map.Map<Common.Id, Types.ReceivablePayment>,
  counters : ReceivablesLib.Counters,
) {
  func receivablesState() : ReceivablesLib.State = { invoices; receivablePayments; counters };

  func requireReceivablesAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can manage receivables");
    };
  };

  public query ({ caller }) func listReceivables(filter : Types.ReceivableFilter) : async [Types.Receivable] {
    requireReceivablesAdmin(caller);
    ReceivablesLib.listReceivables(receivablesState(), filter);
  };

  public query ({ caller }) func getReceivableSummary() : async Types.ReceivableSummary {
    requireReceivablesAdmin(caller);
    ReceivablesLib.getReceivableSummary(receivablesState());
  };

  public shared ({ caller }) func registerReceivablePayment(input : Types.ReceivablePaymentInput) : async Types.ReceivablePayment {
    requireReceivablesAdmin(caller);
    ReceivablesLib.registerReceivablePayment(receivablesState(), input, caller);
  };
};
