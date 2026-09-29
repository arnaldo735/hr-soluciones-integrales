import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/commissions";
import CommissionLineKey "../types/commission-line-key";
import CustomerTypes "../types/customers";
import ServiceTypes "../types/services";
import TechnicianTypes "../types/technicians";
import WorkshopTypes "../types/workshop";
import UserTypes "../types/users";
import CommissionsLib "../lib/commissions";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  loans : Map.Map<Common.Id, Types.TechnicianLoan>,
  commissionPayments : Map.Map<Common.Id, Types.CommissionPayment>,
  paidCommissionLines : Set.Set<CommissionLineKey.CommissionLineKey>,
  technicians : Map.Map<Common.Id, TechnicianTypes.Technician>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
  counters : CommissionsLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func commissionsState() : CommissionsLib.State = { loans; commissionPayments; paidCommissionLines; technicians; orders; motorcycles; services; counters };

  func requireCommissionsModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "commissions")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de comisiones");
    };
  };

  // ── Préstamos ───────────────────────────────────────────────────────────

  public query ({ caller }) func listTechnicianLoans(token : ?Text, filter : Types.TechnicianLoanFilter) : async [Types.TechnicianLoan] {
    requireCommissionsModule(caller, token);
    CommissionsLib.listLoans(commissionsState(), filter);
  };

  public query ({ caller }) func getTechnicianLoan(token : ?Text, id : Types.Id) : async ?Types.TechnicianLoan {
    requireCommissionsModule(caller, token);
    CommissionsLib.getLoan(commissionsState(), id);
  };

  public shared ({ caller }) func createTechnicianLoan(token : ?Text, input : Types.TechnicianLoanInput) : async Types.TechnicianLoan {
    requireCommissionsModule(caller, token);
    CommissionsLib.createLoan(commissionsState(), input);
  };

  public shared ({ caller }) func deleteTechnicianLoan(token : ?Text, id : Types.Id) : async Bool {
    requireCommissionsModule(caller, token);
    CommissionsLib.deleteLoan(commissionsState(), id);
  };

  // ── Comisiones ──────────────────────────────────────────────────────────

  public query ({ caller }) func listCommissionLines(token : ?Text, technicianId : ?Types.Id, period : Types.CommissionPeriod) : async [Types.CommissionLine] {
    requireCommissionsModule(caller, token);
    CommissionsLib.listCommissionLines(commissionsState(), technicianId, period);
  };

  public query ({ caller }) func getCommissionReport(token : ?Text, period : Types.CommissionPeriod) : async Types.CommissionReport {
    requireCommissionsModule(caller, token);
    CommissionsLib.getCommissionReport(commissionsState(), period);
  };

  public query ({ caller }) func getTechnicianCommissionSummary(token : ?Text, technicianId : Types.Id, period : Types.CommissionPeriod) : async ?Types.TechnicianCommissionSummary {
    requireCommissionsModule(caller, token);
    CommissionsLib.getTechnicianCommissionSummary(commissionsState(), technicianId, period);
  };

  // ── Pagos de comisiones ─────────────────────────────────────────────────

  public query ({ caller }) func listCommissionPayments(token : ?Text, filter : Types.CommissionPaymentFilter) : async [Types.CommissionPayment] {
    requireCommissionsModule(caller, token);
    CommissionsLib.listCommissionPayments(commissionsState(), filter);
  };

  public query ({ caller }) func getCommissionPayment(token : ?Text, id : Types.Id) : async ?Types.CommissionPayment {
    requireCommissionsModule(caller, token);
    CommissionsLib.getCommissionPayment(commissionsState(), id);
  };

  public shared ({ caller }) func payTechnicianCommission(token : ?Text, input : Types.CommissionPaymentInput) : async Types.CommissionPayment {
    requireCommissionsModule(caller, token);
    CommissionsLib.payCommission(commissionsState(), input, caller);
  };
};
