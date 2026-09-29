import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/accounting";
import BillingTypes "../types/billing";
import ExpenseTypes "../types/expenses";
import InventoryTypes "../types/inventory";
import ServiceTypes "../types/services";
import TechnicianTypes "../types/technicians";
import UserTypes "../types/users";
import WorkshopTypes "../types/workshop";
import AccountingLib "../lib/accounting";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  expenses : Map.Map<Common.Id, ExpenseTypes.Expense>,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  lots : Map.Map<Common.Id, InventoryTypes.Lot>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  technicians : Map.Map<Common.Id, TechnicianTypes.Technician>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func requireAccountingModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "accounting")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de contabilidad");
    };
  };

  func accountingState() : AccountingLib.State = {
    invoices;
    expenses;
    parts;
    lots;
    orders;
    technicians;
    services;
  };

  public query ({ caller }) func getAccountingSummary(token : ?Text, period : Types.AccountingPeriod) : async Types.AccountingSummary {
    requireAccountingModule(caller, token);
    AccountingLib.getSummary(accountingState(), period);
  };

  // Reporte contable del periodo. Incluye el desglose de utilidad de
  // repuestos vs servicios (`profit`), con la comisión del técnico como costo
  // de cada línea de servicio.
  public query ({ caller }) func getAccountingReport(token : ?Text, period : Types.AccountingPeriod) : async Types.AccountingReport {
    requireAccountingModule(caller, token);
    AccountingLib.getReport(accountingState(), period);
  };

  public query ({ caller }) func listLedgerEntries(token : ?Text, period : Types.AccountingPeriod) : async [Types.LedgerEntry] {
    requireAccountingModule(caller, token);
    AccountingLib.listLedgerEntries(accountingState(), period);
  };

  // Valoración del inventario actual (sin periodo). Solo administradores.
  public query ({ caller }) func getInventoryValuation(token : ?Text) : async Types.InventoryValuation {
    requireAccountingModule(caller, token);
    AccountingLib.getInventoryValuation(accountingState());
  };
};
