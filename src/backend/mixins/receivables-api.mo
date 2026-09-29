import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/receivables";
import BillingTypes "../types/billing";
import UserTypes "../types/users";
import ReceivablesLib "../lib/receivables";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  receivablePayments : Map.Map<Common.Id, Types.ReceivablePayment>,
  counters : ReceivablesLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func receivablesState() : ReceivablesLib.State = { invoices; receivablePayments; counters };

  func requireReceivablesModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "receivables")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de cuentas por cobrar");
    };
  };

  public query ({ caller }) func listReceivables(token : ?Text, filter : Types.ReceivableFilter) : async [Types.Receivable] {
    requireReceivablesModule(caller, token);
    ReceivablesLib.listReceivables(receivablesState(), filter);
  };

  public query ({ caller }) func getReceivableSummary(token : ?Text) : async Types.ReceivableSummary {
    requireReceivablesModule(caller, token);
    ReceivablesLib.getReceivableSummary(receivablesState());
  };

  public shared ({ caller }) func registerReceivablePayment(token : ?Text, input : Types.ReceivablePaymentInput) : async Types.ReceivablePayment {
    requireReceivablesModule(caller, token);
    ReceivablesLib.registerReceivablePayment(receivablesState(), input, caller);
  };
};
