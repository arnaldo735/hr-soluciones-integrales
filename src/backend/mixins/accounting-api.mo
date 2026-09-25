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
import WorkshopTypes "../types/workshop";
import AccountingLib "../lib/accounting";

mixin (
  accessControlState : AccessControl.AccessControlState,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  expenses : Map.Map<Common.Id, ExpenseTypes.Expense>,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  lots : Map.Map<Common.Id, InventoryTypes.Lot>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  technicians : Map.Map<Common.Id, TechnicianTypes.Technician>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
) {
  func requireAccountingAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
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

  public query ({ caller }) func getAccountingSummary(period : Types.AccountingPeriod) : async Types.AccountingSummary {
    requireAccountingAdmin(caller);
    AccountingLib.getSummary(accountingState(), period);
  };

  // Reporte contable del periodo. Incluye el desglose de utilidad de
  // repuestos vs servicios (`profit`), con la comisión del técnico como costo
  // de cada línea de servicio.
  public query ({ caller }) func getAccountingReport(period : Types.AccountingPeriod) : async Types.AccountingReport {
    requireAccountingAdmin(caller);
    AccountingLib.getReport(accountingState(), period);
  };

  public query ({ caller }) func listLedgerEntries(period : Types.AccountingPeriod) : async [Types.LedgerEntry] {
    requireAccountingAdmin(caller);
    AccountingLib.listLedgerEntries(accountingState(), period);
  };

  // Valoración del inventario actual (sin periodo). Solo administradores.
  public query ({ caller }) func getInventoryValuation() : async Types.InventoryValuation {
    requireAccountingAdmin(caller);
    AccountingLib.getInventoryValuation(accountingState());
  };
};
