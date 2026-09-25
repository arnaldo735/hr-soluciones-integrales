import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Id = Nat;
  type Timestamp = Int;
  type Money = Nat;
  type TaxRate = Nat;

  // ── Old state (as of the previous deployed version) ─────────────────────
  // Defined inline: migration files must be self-contained and may only
  // import from `mo:core/...`.

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

  type OldCustomer = {
    id : Id;
    name : Text;
    phone : Text;
    email : ?Text;
    document : ?Text;
    createdAt : Timestamp;
  };

  type Customer = {
    id : Id;
    name : Text;
    phone : Text;
    email : ?Text;
    document : ?Text;
    address : ?Text;
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

  type OldWorkshopOrder = {
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

  type OldInvoice = {
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

  type OldCounters = {
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

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    parts : Map.Map<Id, Part>;
    lots : Map.Map<Id, Lot>;
    movements : Map.Map<Id, Movement>;
    customers : Map.Map<Id, OldCustomer>;
    motorcycles : Map.Map<Id, Motorcycle>;
    orders : Map.Map<Id, OldWorkshopOrder>;
    suppliers : Map.Map<Id, Supplier>;
    purchases : Map.Map<Id, Purchase>;
    payments : Map.Map<Id, Payment>;
    invoices : Map.Map<Id, OldInvoice>;
    businessSettings : { var settings : BusinessSettings };
    userProfiles : Map.Map<Principal, UserProfile>;
    counters : OldCounters;
  };

  // ── New state ───────────────────────────────────────────────────────────

  type NewWorkshopOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    problem : Text;
    status : OrderStatus;
    parts : [OrderPart];
    labor : [LaborItem];
    technicianIds : [Id];
    statusHistory : [StatusChange];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type InvoiceOrigin = { #workshopOrder; #pos; #quote };

  type NewInvoice = {
    id : Id;
    number : Text;
    origin : InvoiceOrigin;
    orderId : ?Id;
    posSaleId : ?Id;
    customerId : ?Id;
    customerName : Text;
    customerTaxId : ?Text;
    customerAddress : ?Text;
    lines : [InvoiceLine];
    subtotal : Money;
    discount : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
    paymentMethod : PaymentMethod;
    paymentStatus : PaymentStatus;
    issuedAt : Timestamp;
  };

  type QuoteStatus = { #draft; #sent; #accepted; #rejected; #expired };

  type QuotePartLine = {
    id : Id;
    partId : Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
  };

  type QuoteServiceLine = {
    id : Id;
    serviceId : ?Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
  };

  type Quote = {
    id : Id;
    quoteNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    status : QuoteStatus;
    partLines : [QuotePartLine];
    serviceLines : [QuoteServiceLine];
    discount : Money;
    taxRate : TaxRate;
    notes : ?Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type Service = {
    id : Id;
    code : Text;
    name : Text;
    description : Text;
    category : Text;
    laborRate : Money;
    estimatedMinutes : Nat;
    active : Bool;
    createdAt : Timestamp;
  };

  type Technician = {
    id : Id;
    name : Text;
    phone : Text;
    email : ?Text;
    specialty : Text;
    hourlyRate : Money;
    active : Bool;
    createdAt : Timestamp;
  };

  type CompanyProfile = {
    legalName : Text;
    taxId : Text;
    address : Text;
    phone : Text;
    email : ?Text;
    website : ?Text;
    logoUrl : ?Text;
    taxRate : TaxRate;
    updatedAt : Timestamp;
  };

  type AppointmentStatus = {
    #scheduled;
    #confirmed;
    #attended;
    #cancelled;
    #noShow;
  };

  type Appointment = {
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

  type ExpenseCategory = {
    #parts;
    #labor;
    #rent;
    #utilities;
    #salary;
    #taxes;
    #transport;
    #other;
  };

  type Expense = {
    id : Id;
    date : Timestamp;
    concept : Text;
    category : ExpenseCategory;
    supplierId : ?Id;
    supplierName : ?Text;
    amount : Money;
    tax : Money;
    paymentMethod : Text;
    receiptUrl : ?Text;
    createdAt : Timestamp;
  };

  type PosSaleLine = {
    partId : Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
    discount : Money;
    amount : Money;
  };

  type PosSale = {
    id : Id;
    saleNumber : Text;
    customerId : ?Id;
    customerName : ?Text;
    lines : [PosSaleLine];
    subtotal : Money;
    discount : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
    paymentMethod : Text;
    amountReceived : Money;
    change : Money;
    invoiceId : Id;
    soldBy : Principal;
    soldAt : Timestamp;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    parts : Map.Map<Id, Part>;
    lots : Map.Map<Id, Lot>;
    movements : Map.Map<Id, Movement>;
    customers : Map.Map<Id, Customer>;
    motorcycles : Map.Map<Id, Motorcycle>;
    orders : Map.Map<Id, NewWorkshopOrder>;
    suppliers : Map.Map<Id, Supplier>;
    purchases : Map.Map<Id, Purchase>;
    payments : Map.Map<Id, Payment>;
    invoices : Map.Map<Id, NewInvoice>;
    businessSettings : { var settings : BusinessSettings };
    userProfiles : Map.Map<Principal, UserProfile>;
    quotes : Map.Map<Id, Quote>;
    services : Map.Map<Id, Service>;
    technicians : Map.Map<Id, Technician>;
    company : { var profile : CompanyProfile };
    appointments : Map.Map<Id, Appointment>;
    expenses : Map.Map<Id, Expense>;
    posSales : Map.Map<Id, PosSale>;
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
      var nextQuoteId : Nat;
      var nextQuoteNumber : Nat;
      var nextQuotePartLineId : Nat;
      var nextQuoteServiceLineId : Nat;
      var nextServiceId : Nat;
      var nextTechnicianId : Nat;
      var nextAppointmentId : Nat;
      var nextExpenseId : Nat;
      var nextPosSaleId : Nat;
      var nextPosSaleNumber : Nat;
    };
  };

  public func migration(old : OldActor) : NewActor {
    let orders = old.orders.map<Id, OldWorkshopOrder, NewWorkshopOrder>(
      func(_id, order) {
        {
          order with
          technicianIds = [];
        };
      }
    );

    let invoices = old.invoices.map<Id, OldInvoice, NewInvoice>(
      func(_id, invoice) {
        {
          invoice with
          origin = #workshopOrder;
          orderId = ?invoice.orderId;
          posSaleId = null;
          customerId = ?invoice.customerId;
          discount = 0;
        };
      }
    );

    let customers = old.customers.map<Id, OldCustomer, Customer>(
      func(_id, customer) {
        {
          customer with
          address = null;
        };
      }
    );

    {
      accessControlState = old.accessControlState;
      parts = old.parts;
      lots = old.lots;
      movements = old.movements;
      customers;
      motorcycles = old.motorcycles;
      orders;
      suppliers = old.suppliers;
      purchases = old.purchases;
      payments = old.payments;
      invoices;
      businessSettings = old.businessSettings;
      userProfiles = old.userProfiles;
      quotes = Map.empty();
      services = Map.empty();
      technicians = Map.empty();
      company = {
        var profile = {
          legalName = old.businessSettings.settings.name;
          taxId = old.businessSettings.settings.taxId;
          address = old.businessSettings.settings.address;
          phone = old.businessSettings.settings.phone;
          email = null;
          website = null;
          logoUrl = null;
          taxRate = old.businessSettings.settings.taxRate;
          updatedAt = 0;
        };
      };
      appointments = Map.empty();
      expenses = Map.empty();
      posSales = Map.empty();
      counters = {
        var nextPartId = old.counters.nextPartId;
        var nextLotId = old.counters.nextLotId;
        var nextMovementId = old.counters.nextMovementId;
        var nextCustomerId = old.counters.nextCustomerId;
        var nextMotorcycleId = old.counters.nextMotorcycleId;
        var nextOrderId = old.counters.nextOrderId;
        var nextOrderPartId = old.counters.nextOrderPartId;
        var nextLaborId = old.counters.nextLaborId;
        var nextSupplierId = old.counters.nextSupplierId;
        var nextPurchaseId = old.counters.nextPurchaseId;
        var nextPurchaseItemId = old.counters.nextPurchaseItemId;
        var nextPaymentId = old.counters.nextPaymentId;
        var nextInvoiceId = old.counters.nextInvoiceId;
        var nextInvoiceNumber = old.counters.nextInvoiceNumber;
        var nextQuoteId = 0;
        var nextQuoteNumber = 0;
        var nextQuotePartLineId = 0;
        var nextQuoteServiceLineId = 0;
        var nextServiceId = 0;
        var nextTechnicianId = 0;
        var nextAppointmentId = 0;
        var nextExpenseId = 0;
        var nextPosSaleId = 0;
        var nextPosSaleNumber = 0;
      };
    };
  };
};
