import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;

  public type AppointmentStatus = {
    #scheduled;
    #confirmed;
    #attended;
    #cancelled;
    #noShow;
  };

  public type Appointment = {
    id : Id;
    customerId : Id;
    motorcycleId : Id;
    technicianId : ?Id;
    scheduledAt : Timestamp;
    durationMinutes : Nat;
    reason : Text;
    status : AppointmentStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type AppointmentInput = {
    customerId : Id;
    motorcycleId : Id;
    technicianId : ?Id;
    scheduledAt : Timestamp;
    durationMinutes : Nat;
    reason : Text;
  };

  public type AppointmentFilter = {
    from : ?Timestamp;
    to : ?Timestamp;
    status : ?AppointmentStatus;
    technicianId : ?Id;
  };

  public type AppointmentError = {
    #notFound : Id;
    #invalidTransition : { from : AppointmentStatus; to : AppointmentStatus };
    #notConvertible : AppointmentStatus;
    #notAuthorized;
  };
};
