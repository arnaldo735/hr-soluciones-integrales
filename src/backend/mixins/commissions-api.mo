import Map "mo:core/Map";
import Set "mo:core/Set";

import Common "../types/common";
import Types "../types/commissions";
import CommissionLineKey "../types/commission-line-key";
import CustomerTypes "../types/customers";
import ServiceTypes "../types/services";
import TechnicianTypes "../types/technicians";
import WorkshopTypes "../types/workshop";
import CommissionsLib "../lib/commissions";

mixin (
  loans : Map.Map<Common.Id, Types.TechnicianLoan>,
  commissionPayments : Map.Map<Common.Id, Types.CommissionPayment>,
  paidCommissionLines : Set.Set<CommissionLineKey.CommissionLineKey>,
  technicians : Map.Map<Common.Id, TechnicianTypes.Technician>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
  counters : CommissionsLib.Counters,
) {
  func commissionsState() : CommissionsLib.State = { loans; commissionPayments; paidCommissionLines; technicians; orders; motorcycles; services; counters };

  // ── Préstamos ───────────────────────────────────────────────────────────

  public query func listTechnicianLoans(filter : Types.TechnicianLoanFilter) : async [Types.TechnicianLoan] {
    CommissionsLib.listLoans(commissionsState(), filter);
  };

  public query func getTechnicianLoan(id : Types.Id) : async ?Types.TechnicianLoan {
    CommissionsLib.getLoan(commissionsState(), id);
  };

  public shared func createTechnicianLoan(input : Types.TechnicianLoanInput) : async Types.TechnicianLoan {
    CommissionsLib.createLoan(commissionsState(), input);
  };

  public shared func deleteTechnicianLoan(id : Types.Id) : async Bool {
    CommissionsLib.deleteLoan(commissionsState(), id);
  };

  // ── Comisiones ──────────────────────────────────────────────────────────

  public query func listCommissionLines(technicianId : ?Types.Id, period : Types.CommissionPeriod) : async [Types.CommissionLine] {
    CommissionsLib.listCommissionLines(commissionsState(), technicianId, period);
  };

  public query func getCommissionReport(period : Types.CommissionPeriod) : async Types.CommissionReport {
    CommissionsLib.getCommissionReport(commissionsState(), period);
  };

  public query func getTechnicianCommissionSummary(technicianId : Types.Id, period : Types.CommissionPeriod) : async ?Types.TechnicianCommissionSummary {
    CommissionsLib.getTechnicianCommissionSummary(commissionsState(), technicianId, period);
  };

  // ── Pagos de comisiones ─────────────────────────────────────────────────

  public query func listCommissionPayments(filter : Types.CommissionPaymentFilter) : async [Types.CommissionPayment] {
    CommissionsLib.listCommissionPayments(commissionsState(), filter);
  };

  public query func getCommissionPayment(id : Types.Id) : async ?Types.CommissionPayment {
    CommissionsLib.getCommissionPayment(commissionsState(), id);
  };

  public shared ({ caller }) func payTechnicianCommission(input : Types.CommissionPaymentInput) : async Types.CommissionPayment {
    CommissionsLib.payCommission(commissionsState(), input, caller);
  };
};
