import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/appointments";
import CustomerTypes "../types/customers";
import TechnicianTypes "../types/technicians";
import WorkshopTypes "../types/workshop";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import UserTypes "../types/users";
import AppointmentsLib "../lib/appointments";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  appointments : Map.Map<Common.Id, Types.Appointment>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>,
  technicians : Map.Map<Common.Id, TechnicianTypes.Technician>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  businessSettings : { var settings : BillingTypes.BusinessSettings },
  company : { var profile : CompanyTypes.CompanyProfile },
  counters : AppointmentsLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func appointmentsState() : AppointmentsLib.State = { appointments; customers; motorcycles; technicians; orders; businessSettings; company; counters };

  func requireAppointmentsModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "appointments")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de citas");
    };
  };

  public query ({ caller }) func listAppointments(token : ?Text, filter : Types.AppointmentFilter) : async [Types.Appointment] {
    requireAppointmentsModule(caller, token);
    AppointmentsLib.listAppointments(appointmentsState(), filter);
  };

  public query ({ caller }) func getAppointment(token : ?Text, id : Types.Id) : async ?Types.Appointment {
    requireAppointmentsModule(caller, token);
    AppointmentsLib.getAppointment(appointmentsState(), id);
  };

  public shared ({ caller }) func createAppointment(token : ?Text, input : Types.AppointmentInput) : async Types.Appointment {
    requireAppointmentsModule(caller, token);
    AppointmentsLib.createAppointment(appointmentsState(), input, caller);
  };

  public shared ({ caller }) func updateAppointment(token : ?Text, id : Types.Id, input : Types.AppointmentInput) : async Types.Appointment {
    requireAppointmentsModule(caller, token);
    AppointmentsLib.updateAppointment(appointmentsState(), id, input, caller);
  };

  public shared ({ caller }) func updateAppointmentStatus(token : ?Text, id : Types.Id, status : Types.AppointmentStatus) : async Types.Appointment {
    requireAppointmentsModule(caller, token);
    AppointmentsLib.updateAppointmentStatus(appointmentsState(), id, status, caller);
  };

  public shared ({ caller }) func deleteAppointment(token : ?Text, id : Types.Id) : async Bool {
    requireAppointmentsModule(caller, token);
    AppointmentsLib.deleteAppointment(appointmentsState(), id, caller);
  };

  public shared ({ caller }) func convertAppointmentToOrder(token : ?Text, id : Types.Id) : async WorkshopTypes.OrderView {
    requireAppointmentsModule(caller, token);
    AppointmentsLib.convertAppointmentToOrder(appointmentsState(), id, caller);
  };
};
