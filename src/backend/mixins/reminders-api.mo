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
import UserTypes "../types/users";
import RemindersLib "../lib/reminders";
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
};
