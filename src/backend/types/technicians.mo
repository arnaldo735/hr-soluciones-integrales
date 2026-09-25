import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;

  public type Technician = {
    id : Id;
    code : Text;
    name : Text;
    phone : Text;
    email : ?Text;
    specialty : Text;
    hourlyRate : Money;
    commissionRate : Nat;
    active : Bool;
    createdAt : Timestamp;
  };

  public type TechnicianInput = {
    code : Text;
    name : Text;
    phone : Text;
    email : ?Text;
    specialty : Text;
    hourlyRate : Money;
    commissionRate : Nat;
    active : Bool;
  };

  public type TechnicianFilter = {
    search : ?Text;
    specialty : ?Text;
    activeOnly : ?Bool;
  };

  public type TechnicianWorkload = {
    technician : Technician;
    activeOrders : Nat;
    orderIds : [Id];
  };

  public type TechnicianError = {
    #notFound : Id;
    #duplicateCode : Text;
    #notAuthorized;
  };
};
