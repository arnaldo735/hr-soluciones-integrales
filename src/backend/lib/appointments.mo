import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

import Common "../types/common";
import Types "../types/appointments";
import CustomerTypes "../types/customers";
import TechnicianTypes "../types/technicians";
import WorkshopTypes "../types/workshop";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";

module {
  public type Counters = {
    var nextAppointmentId : Nat;
    var nextOrderId : Nat;
  };

  public type State = {
    appointments : Map.Map<Common.Id, Types.Appointment>;
    customers : Map.Map<Common.Id, CustomerTypes.Customer>;
    motorcycles : Map.Map<Common.Id, CustomerTypes.Motorcycle>;
    technicians : Map.Map<Common.Id, TechnicianTypes.Technician>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    businessSettings : { var settings : BillingTypes.BusinessSettings };
    company : { var profile : CompanyTypes.CompanyProfile };
    counters : Counters;
  };

  // --- helpers -------------------------------------------------------------

  func statusText(status : Types.AppointmentStatus) : Text {
    switch (status) {
      case (#scheduled) { "scheduled" };
      case (#confirmed) { "confirmed" };
      case (#attended) { "attended" };
      case (#cancelled) { "cancelled" };
      case (#noShow) { "noShow" };
    };
  };

  func padNumber(n : Nat) : Text {
    let raw = n.toText();
    var zeros = "";
    var i = raw.size();
    while (i < 6) {
      zeros := zeros # "0";
      i += 1;
    };
    zeros # raw;
  };

  func orderNumberFor(n : Nat) : Text {
    "OT-" # padNumber(n);
  };

  func matches(appointment : Types.Appointment, filter : Types.AppointmentFilter) : Bool {
    let fromOk = switch (filter.from) {
      case null { true };
      case (?from) { appointment.scheduledAt >= from };
    };
    let toOk = switch (filter.to) {
      case null { true };
      case (?to) { appointment.scheduledAt <= to };
    };
    let statusOk = switch (filter.status) {
      case null { true };
      case (?status) { appointment.status == status };
    };
    let technicianOk = switch (filter.technicianId) {
      case null { true };
      case (?id) {
        switch (appointment.technicianId) {
          case (?assigned) { assigned == id };
          case null { false };
        };
      };
    };
    fromOk and toOk and statusOk and technicianOk;
  };

  func findAppointment(state : State, id : Common.Id) : Types.Appointment {
    state.appointments.get(id) ?? Runtime.trap("Cita no encontrada");
  };

  func buildAppointment(id : Common.Id, input : Types.AppointmentInput, status : Types.AppointmentStatus, createdAt : Common.Timestamp, updatedAt : Common.Timestamp) : Types.Appointment {
    {
      id;
      customerId = input.customerId;
      motorcycleId = input.motorcycleId;
      technicianId = input.technicianId;
      scheduledAt = input.scheduledAt;
      durationMinutes = input.durationMinutes;
      reason = input.reason;
      status;
      createdAt;
      updatedAt;
    };
  };

  // --- public API ----------------------------------------------------------

  public func listAppointments(state : State, filter : Types.AppointmentFilter) : [Types.Appointment] {
    let out = List.empty<Types.Appointment>();
    for (appointment in state.appointments.values()) {
      if (matches(appointment, filter)) { out.add(appointment) };
    };
    out.toArray().sort(func (a, b) = Int.compare(a.scheduledAt, b.scheduledAt));
  };

  public func getAppointment(state : State, id : Common.Id) : ?Types.Appointment {
    state.appointments.get(id);
  };

  public func createAppointment(state : State, input : Types.AppointmentInput, performedBy : Principal) : Types.Appointment {
    ignore performedBy;
    ignore state.customers.get(input.customerId) ?? Runtime.trap("Cliente no encontrado");
    ignore state.motorcycles.get(input.motorcycleId) ?? Runtime.trap("Moto no encontrada");
    switch (input.technicianId) {
      case null {};
      case (?technicianId) {
        ignore state.technicians.get(technicianId) ?? Runtime.trap("Técnico no encontrado");
      };
    };
    let id = state.counters.nextAppointmentId;
    state.counters.nextAppointmentId := id + 1;
    let now = Time.now();
    let appointment = buildAppointment(id, input, #scheduled, now, now);
    state.appointments.add(id, appointment);
    appointment;
  };

  public func updateAppointment(state : State, id : Common.Id, input : Types.AppointmentInput, performedBy : Principal) : Types.Appointment {
    ignore performedBy;
    let existing = findAppointment(state, id);
    ignore state.customers.get(input.customerId) ?? Runtime.trap("Cliente no encontrado");
    ignore state.motorcycles.get(input.motorcycleId) ?? Runtime.trap("Moto no encontrada");
    switch (input.technicianId) {
      case null {};
      case (?technicianId) {
        ignore state.technicians.get(technicianId) ?? Runtime.trap("Técnico no encontrado");
      };
    };
    let updated = buildAppointment(id, input, existing.status, existing.createdAt, Time.now());
    state.appointments.add(id, updated);
    updated;
  };

  public func updateAppointmentStatus(state : State, id : Common.Id, status : Types.AppointmentStatus, performedBy : Principal) : Types.Appointment {
    ignore performedBy;
    let appointment = findAppointment(state, id);
    let from = appointment.status;
    let valid = switch (from, status) {
      case (#scheduled, #confirmed) { true };
      case (#scheduled, #cancelled) { true };
      case (#scheduled, #noShow) { true };
      case (#confirmed, #attended) { true };
      case (#confirmed, #cancelled) { true };
      case (#confirmed, #noShow) { true };
      case (_, _) { false };
    };
    if (not valid) {
      Runtime.trap("Transición de estado inválida: " # statusText(from) # " -> " # statusText(status));
    };
    let updated : Types.Appointment = { appointment with status; updatedAt = Time.now() };
    state.appointments.add(id, updated);
    updated;
  };

  public func deleteAppointment(state : State, id : Common.Id, performedBy : Principal) : Bool {
    ignore performedBy;
    switch (state.appointments.get(id)) {
      case null { false };
      case (?_) {
        state.appointments.remove(id);
        true;
      };
    };
  };

  public func convertAppointmentToOrder(state : State, id : Common.Id, performedBy : Principal) : WorkshopTypes.OrderView {
    let appointment = findAppointment(state, id);
    if (appointment.status != #attended) {
      Runtime.trap("Solo se puede convertir una cita atendida");
    };
    let orderId = state.counters.nextOrderId;
    state.counters.nextOrderId := orderId + 1;
    let now = Time.now();
    let technicianIds = switch (appointment.technicianId) {
      case (?technicianId) { [technicianId] };
      case null { [] };
    };
    let order : WorkshopTypes.WorkshopOrder = {
      id = orderId;
      orderNumber = orderNumberFor(orderId);
      customerId = appointment.customerId;
      motorcycleId = appointment.motorcycleId;
      intakeMileage = 0;
      problem = appointment.reason;
      status = #received;
      parts = [];
      labor = [];
      photos = [];
      technicianIds;
      statusHistory = [{ from = null; to = #received; performedBy; at = now }];
      cancelReason = null;
      cancelledAt = null;
      createdAt = now;
      updatedAt = now;
    };
    state.orders.add(orderId, order);
    {
      order;
      totals = {
        partsSubtotal = 0;
        laborSubtotal = 0;
        subtotal = 0;
        taxRate = CompanyTypes.effectiveTaxRate(state.company.profile, state.company.profile.taxRate);
        tax = 0;
        total = 0;
      };
    };
  };
};
