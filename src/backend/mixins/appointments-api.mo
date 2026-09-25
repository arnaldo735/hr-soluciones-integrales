import Map "mo:core/Map";
import Principal "mo:core/Principal";

import Common "../types/common";
import Types "../types/appointments";
import CustomerTypes "../types/customers";
import TechnicianTypes "../types/technicians";
import WorkshopTypes "../types/workshop";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import AppointmentsLib "../lib/appointments";

mixin (
  appointments : Map.Map<Common.Id, Types.Appointment>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>,
  technicians : Map.Map<Common.Id, TechnicianTypes.Technician>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  businessSettings : { var settings : BillingTypes.BusinessSettings },
  company : { var profile : CompanyTypes.CompanyProfile },
  counters : AppointmentsLib.Counters,
) {
  func appointmentsState() : AppointmentsLib.State = { appointments; customers; motorcycles; technicians; orders; businessSettings; company; counters };

  public query func listAppointments(filter : Types.AppointmentFilter) : async [Types.Appointment] {
    ignore filter;
    AppointmentsLib.listAppointments(appointmentsState(), filter);
  };

  public query func getAppointment(id : Types.Id) : async ?Types.Appointment {
    ignore id;
    AppointmentsLib.getAppointment(appointmentsState(), id);
  };

  public shared ({ caller }) func createAppointment(input : Types.AppointmentInput) : async Types.Appointment {
    ignore input;
    AppointmentsLib.createAppointment(appointmentsState(), input, caller);
  };

  public shared ({ caller }) func updateAppointment(id : Types.Id, input : Types.AppointmentInput) : async Types.Appointment {
    ignore (id, input);
    AppointmentsLib.updateAppointment(appointmentsState(), id, input, caller);
  };

  public shared ({ caller }) func updateAppointmentStatus(id : Types.Id, status : Types.AppointmentStatus) : async Types.Appointment {
    ignore (id, status);
    AppointmentsLib.updateAppointmentStatus(appointmentsState(), id, status, caller);
  };

  public shared ({ caller }) func deleteAppointment(id : Types.Id) : async Bool {
    ignore id;
    AppointmentsLib.deleteAppointment(appointmentsState(), id, caller);
  };

  public shared ({ caller }) func convertAppointmentToOrder(id : Types.Id) : async WorkshopTypes.OrderView {
    ignore id;
    AppointmentsLib.convertAppointmentToOrder(appointmentsState(), id, caller);
  };
};
