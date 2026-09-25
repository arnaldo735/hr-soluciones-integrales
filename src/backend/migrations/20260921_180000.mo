import Char "mo:core/Char";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Set "mo:core/Set";
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

  type OldLaborItem = {
    id : Id;
    description : Text;
    price : Money;
  };

  type NewLaborItem = {
    id : Id;
    description : Text;
    price : Money;
    technicianId : ?Id;
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
    labor : [OldLaborItem];
    technicianIds : [Id];
    statusHistory : [StatusChange];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type NewWorkshopOrder = {
    id : Id;
    orderNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    intakeMileage : Nat;
    problem : Text;
    status : OrderStatus;
    parts : [OrderPart];
    labor : [NewLaborItem];
    technicianIds : [Id];
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

  type InvoiceOrigin = { #workshopOrder; #pos; #quote };

  type Invoice = {
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

  type UserRole = { #admin; #user; #guest };

  type UserProfile = {
    name : Text;
    role : UserRole;
    createdAt : Timestamp;
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

  type OldTechnician = {
    id : Id;
    name : Text;
    phone : Text;
    email : ?Text;
    specialty : Text;
    hourlyRate : Money;
    active : Bool;
    createdAt : Timestamp;
  };

  type NewTechnician = {
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

  type NewCounters = {
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
    var nextServiceCategoryId : Nat;
    var nextTechnicianLoanId : Nat;
    var nextCommissionPaymentId : Nat;
  };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    parts : Map.Map<Id, Part>;
    lots : Map.Map<Id, Lot>;
    movements : Map.Map<Id, Movement>;
    customers : Map.Map<Id, Customer>;
    motorcycles : Map.Map<Id, Motorcycle>;
    orders : Map.Map<Id, OldWorkshopOrder>;
    suppliers : Map.Map<Id, Supplier>;
    purchases : Map.Map<Id, Purchase>;
    payments : Map.Map<Id, Payment>;
    invoices : Map.Map<Id, Invoice>;
    businessSettings : { var settings : BusinessSettings };
    userProfiles : Map.Map<Principal, UserProfile>;
    quotes : Map.Map<Id, Quote>;
    services : Map.Map<Id, Service>;
    technicians : Map.Map<Id, OldTechnician>;
    company : { var profile : CompanyProfile };
    appointments : Map.Map<Id, Appointment>;
    expenses : Map.Map<Id, Expense>;
    posSales : Map.Map<Id, PosSale>;
    counters : OldCounters;
  };

  // ── New state ───────────────────────────────────────────────────────────

  type ServiceCategory = {
    id : Id;
    name : Text;
    description : Text;
    createdAt : Timestamp;
  };

  type TechnicianLoan = {
    id : Id;
    technicianId : Id;
    amount : Money;
    date : Timestamp;
    note : ?Text;
    deducted : Bool;
    deductedAt : ?Timestamp;
    commissionPaymentId : ?Id;
    createdAt : Timestamp;
  };

  type CommissionPaymentLoan = {
    loanId : Id;
    amount : Money;
    date : Timestamp;
    note : ?Text;
  };

  type CommissionPeriod = {
    from : ?Timestamp;
    to : ?Timestamp;
  };

  type CommissionLineKey = {
    orderId : Id;
    laborId : Id;
  };

  module CommissionLineKey {
    public func compare(a : CommissionLineKey, b : CommissionLineKey) : Order.Order {
      switch (Nat.compare(a.orderId, b.orderId)) {
        case (#equal) { Nat.compare(a.laborId, b.laborId) };
        case (other) { other };
      };
    };
  };

  type CommissionPayment = {
    id : Id;
    technicianId : Id;
    technicianCode : Text;
    technicianName : Text;
    period : CommissionPeriod;
    lineCount : Nat;
    baseAmount : Money;
    commissionAmount : Money;
    loans : [CommissionPaymentLoan];
    loansDeducted : Money;
    netPaid : Money;
    paidBy : Principal;
    paidAt : Timestamp;
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
    invoices : Map.Map<Id, Invoice>;
    businessSettings : { var settings : BusinessSettings };
    userProfiles : Map.Map<Principal, UserProfile>;
    quotes : Map.Map<Id, Quote>;
    services : Map.Map<Id, Service>;
    serviceCategories : Map.Map<Id, ServiceCategory>;
    technicians : Map.Map<Id, NewTechnician>;
    technicianLoans : Map.Map<Id, TechnicianLoan>;
    commissionPayments : Map.Map<Id, CommissionPayment>;
    paidCommissionLines : Set.Set<CommissionLineKey>;
    company : { var profile : CompanyProfile };
    appointments : Map.Map<Id, Appointment>;
    expenses : Map.Map<Id, Expense>;
    posSales : Map.Map<Id, PosSale>;
    counters : NewCounters;
  };

  public func migration(old : OldActor) : NewActor {
    // Cada técnico existente recibe un código derivado de su id y una
    // comisión por defecto de 0 %.
    let technicians = old.technicians.map<Id, OldTechnician, NewTechnician>(
      func(id, technician) {
        {
          technician with
          code = "TEC-" # id.toText();
          commissionRate = 0;
        };
      }
    );

    // Cada línea de mano de obra existente queda sin técnico responsable.
    let orders = old.orders.map<Id, OldWorkshopOrder, NewWorkshopOrder>(
      func(_, order) {
        {
          order with
          labor = order.labor.map(
            func(item) { { item with technicianId = null } }
          );
        };
      }
    );

    // Cada categoría de servicio existente (texto libre en `Service.category`)
    // se convierte en una fila del catálogo, conservando el nombre original.
    let serviceCategories = Map.empty<Id, ServiceCategory>();
    var nextServiceCategoryId = 0;
    for (service in old.services.values()) {
      let name = service.category.trim(#predicate (func(c : Char) : Bool { c.isWhitespace() }));
      if (name != "") {
        var exists = false;
        for (category in serviceCategories.values()) {
          if (category.name.toLower() == name.toLower()) { exists := true };
        };
        if (not exists) {
          let id = nextServiceCategoryId;
          nextServiceCategoryId += 1;
          serviceCategories.add(id, {
            id;
            name;
            description = "";
            createdAt = service.createdAt;
          });
        };
      };
    };

    let counters = old.counters;
    {
      accessControlState = old.accessControlState;
      parts = old.parts;
      lots = old.lots;
      movements = old.movements;
      customers = old.customers;
      motorcycles = old.motorcycles;
      orders;
      suppliers = old.suppliers;
      purchases = old.purchases;
      payments = old.payments;
      invoices = old.invoices;
      businessSettings = old.businessSettings;
      userProfiles = old.userProfiles;
      quotes = old.quotes;
      services = old.services;
      serviceCategories;
      technicians;
      technicianLoans = Map.empty();
      commissionPayments = Map.empty();
      paidCommissionLines = Set.empty();
      company = old.company;
      appointments = old.appointments;
      expenses = old.expenses;
      posSales = old.posSales;
      counters = {
        var nextPartId = counters.nextPartId;
        var nextLotId = counters.nextLotId;
        var nextMovementId = counters.nextMovementId;
        var nextCustomerId = counters.nextCustomerId;
        var nextMotorcycleId = counters.nextMotorcycleId;
        var nextOrderId = counters.nextOrderId;
        var nextOrderPartId = counters.nextOrderPartId;
        var nextLaborId = counters.nextLaborId;
        var nextSupplierId = counters.nextSupplierId;
        var nextPurchaseId = counters.nextPurchaseId;
        var nextPurchaseItemId = counters.nextPurchaseItemId;
        var nextPaymentId = counters.nextPaymentId;
        var nextInvoiceId = counters.nextInvoiceId;
        var nextInvoiceNumber = counters.nextInvoiceNumber;
        var nextQuoteId = counters.nextQuoteId;
        var nextQuoteNumber = counters.nextQuoteNumber;
        var nextQuotePartLineId = counters.nextQuotePartLineId;
        var nextQuoteServiceLineId = counters.nextQuoteServiceLineId;
        var nextServiceId = counters.nextServiceId;
        var nextTechnicianId = counters.nextTechnicianId;
        var nextAppointmentId = counters.nextAppointmentId;
        var nextExpenseId = counters.nextExpenseId;
        var nextPosSaleId = counters.nextPosSaleId;
        var nextPosSaleNumber = counters.nextPosSaleNumber;
        var nextServiceCategoryId = nextServiceCategoryId;
        var nextTechnicianLoanId = 0;
        var nextCommissionPaymentId = 0;
      };
    };
  };
};
