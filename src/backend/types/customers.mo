import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;

  public type Customer = {
    id : Id;
    name : Text;
    phone : Text;
    email : ?Text;
    document : ?Text;
    address : ?Text;
    createdAt : Timestamp;
  };

  public type Motorcycle = {
    id : Id;
    customerId : Id;
    plate : Text;
    brand : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    createdAt : Timestamp;
  };

  public type CustomerInput = {
    name : Text;
    phone : Text;
    email : ?Text;
    document : ?Text;
    address : ?Text;
  };

  public type MotorcycleInput = {
    customerId : Id;
    plate : Text;
    brand : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
  };

  public type CustomerOrderSummary = {
    orderId : Id;
    orderNumber : Text;
    status : Text;
    motorcyclePlate : Text;
    total : Nat;
    createdAt : Timestamp;
  };

  public type CustomerDetail = {
    customer : Customer;
    motorcycles : [Motorcycle];
    orders : [CustomerOrderSummary];
  };

  public type CustomerError = {
    #notFound : Id;
    #notAuthorized;
  };

  // ── Listados paginados (clientes y motocicletas) ────────────────────────

  public type CustomerSort = {
    #name;
    #createdAt;
    #motorcycleCount;
  };

  public type CustomerFilter = {
    search : ?Text;
    hasMotorcycles : ?Bool;
  };

  public type CustomerListItem = {
    id : Id;
    name : Text;
    phone : Text;
    email : ?Text;
    document : ?Text;
    address : ?Text;
    createdAt : Timestamp;
    motorcycleCount : Nat;
  };

  public type CustomerPage = {
    items : [CustomerListItem];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type MotorcycleSort = {
    #plate;
    #brand;
    #year;
    #customerName;
  };

  public type MotorcycleFilter = {
    search : ?Text;
    brand : ?Text;
  };

  public type MotorcycleListItem = {
    id : Id;
    customerId : Id;
    plate : Text;
    brand : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    createdAt : Timestamp;
    customerName : Text;
    customerPhone : Text;
  };

  public type MotorcyclePage = {
    items : [MotorcycleListItem];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  // ── Exportación agregada de clientes (una sola llamada) ─────────────────

  public type CustomerExportRow = {
    customer : Customer;
    motorcycles : [Motorcycle];
  };

  // ── Importación masiva (CSV) ────────────────────────────────────────────

  public type BulkRowResult = {
    index : Nat;
    ok : Bool;
    id : ?Id;
    error : ?Text;
  };

  public type BulkResult = {
    created : Nat;
    updated : Nat;
    skipped : Nat;
    failed : Nat;
    rows : [BulkRowResult];
  };
};
