import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;
  type TaxRate = Nat;

  type Part = {
    id : Id;
    sku : Text;
    name : Text;
    category : Text;
    brand : Text;
    unit : Text;
    salePrice : Money;
    costPrice : Money;
    lowStockThreshold : Nat;
    createdAt : Timestamp;
  };

  type Lot = {
    id : Id;
    partId : Id;
    lotNumber : Text;
    quantity : Nat;
    unitCost : Money;
    supplierId : ?Id;
    purchaseId : ?Id;
    receivedAt : Timestamp;
  };

  type MovementKind = { #sale; #purchase; #adjustment };

  type Movement = {
    id : Id;
    partId : Id;
    lotId : ?Id;
    kind : MovementKind;
    quantity : Nat;
    unitCost : ?Money;
    reason : ?Text;
    referenceId : ?Id;
    performedBy : Principal;
    at : Timestamp;
  };

  type Customer = {
    id : Id;
    name : Text;
    phone : Text;
    email : ?Text;
    document : ?Text;
    createdAt : Timestamp;
  };

  type Motorcycle = {
    id : Id;
    customerId : Id;
    plate : Text;
    brand : Text;
    model : Text;
    year : Nat;
    mileage : Nat;
    createdAt : Timestamp;
  };

  type OrderStatus = { #received; #inRepair; #ready; #delivered };

  type OrderPart = {
    id : Id;
    partId : Id;
    lotId : ?Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    unitCost : Money;
  };

  type LaborItem = {
    id : Id;
    description : Text;
    price : Money;
  };

  type StatusChange = {
    from : ?OrderStatus;
    to : OrderStatus;
    performedBy : Principal;
    at : Timestamp;
  };

  type WorkshopOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    problem : Text;
    status : OrderStatus;
    parts : [OrderPart];
    labor : [LaborItem];
    statusHistory : [StatusChange];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type Supplier = {
    id : Id;
    name : Text;
    contactName : ?Text;
    phone : Text;
    email : ?Text;
    taxId : ?Text;
    address : ?Text;
    createdAt : Timestamp;
  };

  type PurchaseItem = {
    id : Id;
    partId : Id;
    lotNumber : Text;
    quantity : Nat;
    unitCost : Money;
  };

  type Purchase = {
    id : Id;
    supplierId : Id;
    items : [PurchaseItem];
    total : Money;
    paidAmount : Money;
    createdAt : Timestamp;
  };

  type PaymentMethod = { #cash; #card; #transfer; #mixed };

  type Payment = {
    id : Id;
    supplierId : Id;
    purchaseId : ?Id;
    amount : Money;
    method : PaymentMethod;
    note : ?Text;
    performedBy : Principal;
    at : Timestamp;
  };

  type BusinessSettings = {
    name : Text;
    taxId : Text;
    address : Text;
    phone : Text;
    taxRate : TaxRate;
  };

  type InvoiceLine = {
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    amount : Money;
  };

  type PaymentStatus = { #pending; #paid };

  type Invoice = {
    id : Id;
    number : Text;
    orderId : Id;
    customerId : Id;
    customerName : Text;
    customerTaxId : ?Text;
    customerAddress : ?Text;
    lines : [InvoiceLine];
    subtotal : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
    paymentMethod : PaymentMethod;
    paymentStatus : PaymentStatus;
    issuedAt : Timestamp;
  };

  type UserRole = { #admin; #user; #guest };

  type UserProfile = {
    name : Text;
    role : UserRole;
    createdAt : Timestamp;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    parts : Map.Map<Id, Part>;
    lots : Map.Map<Id, Lot>;
    movements : Map.Map<Id, Movement>;
    customers : Map.Map<Id, Customer>;
    motorcycles : Map.Map<Id, Motorcycle>;
    orders : Map.Map<Id, WorkshopOrder>;
    suppliers : Map.Map<Id, Supplier>;
    purchases : Map.Map<Id, Purchase>;
    payments : Map.Map<Id, Payment>;
    invoices : Map.Map<Id, Invoice>;
    businessSettings : { var settings : BusinessSettings };
    userProfiles : Map.Map<Principal, UserProfile>;
    counters : {
      var nextPartId : Nat;
      var nextLotId : Nat;
      var nextMovementId : Nat;
      var nextCustomerId : Nat;
      var nextMotorcycleId : Nat;
      var nextOrderId : Nat;
      var nextOrderPartId : Nat;
      var nextLaborId : Nat;
      var nextSupplierId : Nat;
      var nextPurchaseId : Nat;
      var nextPurchaseItemId : Nat;
      var nextPaymentId : Nat;
      var nextInvoiceId : Nat;
      var nextInvoiceNumber : Nat;
    };
  };

  public func migration(_old : {}) : NewActor {
    {
      accessControlState = AccessControl.initState();
      parts = Map.empty();
      lots = Map.empty();
      movements = Map.empty();
      customers = Map.empty();
      motorcycles = Map.empty();
      orders = Map.empty();
      suppliers = Map.empty();
      purchases = Map.empty();
      payments = Map.empty();
      invoices = Map.empty();
      businessSettings = {
        var settings = {
          name = "";
          taxId = "";
          address = "";
          phone = "";
          taxRate = 0;
        };
      };
      userProfiles = Map.empty();
      counters = {
        var nextPartId = 0;
        var nextLotId = 0;
        var nextMovementId = 0;
        var nextCustomerId = 0;
        var nextMotorcycleId = 0;
        var nextOrderId = 0;
        var nextOrderPartId = 0;
        var nextLaborId = 0;
        var nextSupplierId = 0;
        var nextPurchaseId = 0;
        var nextPurchaseItemId = 0;
        var nextPaymentId = 0;
        var nextInvoiceId = 0;
        var nextInvoiceNumber = 0;
      };
    };
  };
};
