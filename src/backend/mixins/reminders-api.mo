import Map "mo:core/Map";
import Principal "mo:core/Principal";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/reminders";
import AppointmentTypes "../types/appointments";
import ReceivableTypes "../types/receivables";
import PurchasingTypes "../types/purchasing";
import QuoteTypes "../types/quotes";
import WorkshopTypes "../types/workshop";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CashTypes "../types/cash";
import InventoryTypes "../types/inventory";
import SupplierOrderTypes "../types/supplier-orders";
import UserTypes "../types/users";
import RemindersLib "../lib/reminders";
import ReceivablesLib "../lib/receivables";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  appointments : Map.Map<Common.Id, AppointmentTypes.Appointment>,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  receivablePayments : Map.Map<Common.Id, ReceivableTypes.ReceivablePayment>,
  suppliers : Map.Map<Common.Id, PurchasingTypes.Supplier>,
  purchases : Map.Map<Common.Id, PurchasingTypes.Purchase>,
  payments : Map.Map<Common.Id, PurchasingTypes.Payment>,
  quotes : Map.Map<Common.Id, QuoteTypes.Quote>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  lots : Map.Map<Common.Id, InventoryTypes.Lot>,
  supplierOrders : Map.Map<Common.Id, SupplierOrderTypes.SupplierOrder>,
  cashRegisters : Map.Map<Common.Id, CashTypes.CashRegister>,
  shifts : Map.Map<Common.Id, CashTypes.Shift>,
  cashMovements : Map.Map<Common.Id, CashTypes.CashMovement>,
  counters : ReceivablesLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func remindersState() : RemindersLib.State = {
    appointments;
    invoices;
    receivablePayments;
    suppliers;
    purchases;
    payments;
    quotes;
    orders;
    customers;
    motorcycles;
    parts;
    lots;
    supplierOrders;
    cashRegisters;
    shifts;
    cashMovements;
    counters;
  };

  func canAccess(caller : Principal, token : ?Text, moduleKey : Text) : Bool {
    UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, moduleKey);
  };

  // Resumen de pendientes para la ventana de recordatorios. Cada sección se
  // incluye solo si el llamador tiene acceso al módulo correspondiente; las
  // secciones no autorizadas llegan como `null`.
  public query ({ caller }) func getRemindersSummary(token : ?Text) : async Types.RemindersSummary {
    RemindersLib.getRemindersSummary(
      remindersState(),
      canAccess(caller, token, "appointments"),
      canAccess(caller, token, "receivables"),
      canAccess(caller, token, "payables"),
      canAccess(caller, token, "workshop"),
      canAccess(caller, token, "quotes"),
      canAccess(caller, token, "workshop"),
    );
  };

  // Resumen de alertas del panel principal. Incluye las seis secciones de
  // `getRemindersSummary` más inventario por agotarse, pedidos a proveedor
  // pendientes y cuotas vencidas de facturas a crédito. Cada sección se incluye
  // solo si el llamador tiene acceso al módulo correspondiente; las secciones
  // no autorizadas llegan como `null`.
  public query ({ caller }) func getDashboardAlerts(token : ?Text) : async Types.DashboardAlertsSummary {
    RemindersLib.getDashboardAlerts(
      remindersState(),
      canAccess(caller, token, "appointments"),
      canAccess(caller, token, "receivables"),
      canAccess(caller, token, "payables"),
      canAccess(caller, token, "workshop"),
      canAccess(caller, token, "quotes"),
      canAccess(caller, token, "workshop"),
      canAccess(caller, token, "inventory"),
      canAccess(caller, token, "supplierOrders"),
      canAccess(caller, token, "billing"),
    );
  };
};
